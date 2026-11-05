<?php

namespace Tests\Feature\Propietario;

use App\Domains\Suscripcion\Services\CobroSuscripcionService;
use App\Domains\Suscripcion\Services\ReciboSuscripcionService;
use App\Domains\Suscripcion\Services\StripeGatewayService;
use App\Domains\Tenant\Services\TenantProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Mockery\MockInterface;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\SetupIntent;
use Tests\TestCase;

/**
 * CU-PROP-02: cambio de tarjeta, regularización de cobros pendientes y ciclo
 * de renovación / gracia / suspensión ejecutado por el comando programado.
 */
class SuscripcionCobrosTest extends TestCase
{
    private const PASSWORD = 'Cobros2026!';

    private string $empresaId;

    private string $suscripcionId;

    private string $token;

    private string $correo;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('s3');

        $this->correo = 'cobros.'.Str::random(6).'@test.pe';

        $alta = app(TenantProvisioningService::class)->provisionar([
            'ruc' => '20999999993',
            'razon_social' => 'Cobros Recurrentes SAC',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo' => $this->correo,
            'nombre_propietario' => 'Dueña de Cobros',
            'password' => self::PASSWORD,
            'telefono' => '987000222',
            'plan_id' => 2,
            'stripe_customer_id' => 'cus_test_cobros',
            'ignorar_modulo_11' => true,
        ]);

        $this->empresaId = $alta['empresa']['id'];
        $this->suscripcionId = $alta['suscripcion']['id'];

        $this->token = 'test_token_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $this->token), 3600, json_encode([
            'id' => $alta['usuario']['id'],
            'nombre' => 'Dueña de Cobros',
            'correo' => $this->correo,
            'rol' => 'propietario',
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'estado' => 'activo',
        ]));
    }

    protected function tearDown(): void
    {
        Redis::del('auth:session:'.hash('sha256', $this->token));
        CobroSuscripcionService::olvidarEstadoEmpresa($this->empresaId);

        parent::tearDown();
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => "Bearer {$this->token}", 'Accept' => 'application/json'];
    }

    private function cobroExitoso(): PaymentIntent
    {
        return PaymentIntent::constructFrom(['id' => 'pi_renovacion_ok', 'status' => 'succeeded']);
    }

    private function mockStripe(callable $configurar): void
    {
        $this->mock(StripeGatewayService::class, function (MockInterface $mock) use ($configurar): void {
            $mock->shouldReceive('obtenerTarjetaPredeterminada')->andReturn([
                'marca' => 'mastercard',
                'ultimos_4' => '8899',
                'exp_mes' => 10,
                'exp_ano' => 2031,
                'titular' => 'Dueña de Cobros',
            ]);
            $configurar($mock);
        });
    }

    private function dejarEnGracia(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update([
            'estado' => 'en_gracia',
            'fecha_fin_periodo' => now()->subDays(2),
            'fecha_corte_gracia' => now()->addDays(3),
            'reintentos_stripe_conteo' => 1,
            'ultimo_error_cobro' => 'Fondos insuficientes',
        ]);
    }

    private function metodoNuevo(string $tipo = 'card', ?string $customer = null): PaymentMethod
    {
        return PaymentMethod::constructFrom(['id' => 'pm_nueva', 'type' => $tipo, 'customer' => $customer]);
    }

    public function test_setup_de_tarjeta_devuelve_el_client_secret_de_stripe(): void
    {
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('crearSetupIntent')
                ->once()
                ->with('cus_test_cobros')
                ->andReturn(SetupIntent::constructFrom(['id' => 'seti_1', 'client_secret' => 'seti_1_secret_abc']));
        });

        $this->postJson('/api/v1/propietario/suscripcion/metodo-pago/setup', [], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.client_secret', 'seti_1_secret_abc')
            ->assertJsonStructure(['datos' => ['stripe_public_key']]);
    }

    public function test_confirmar_tarjeta_al_dia_solo_cambia_el_metodo_predeterminado(): void
    {
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('recuperarMetodoPago')->with('pm_nueva')->andReturn($this->metodoNuevo());
            $mock->shouldReceive('establecerMetodoPredeterminado')->once()->with('cus_test_cobros', 'pm_nueva')->andReturn('pm_nueva');
            $mock->shouldReceive('cobrarRenovacion')->never();
        });

        $this->postJson('/api/v1/propietario/suscripcion/metodo-pago/confirmar', [
            'stripe_payment_method_id' => 'pm_nueva',
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.cobro_pendiente_regularizado', false)
            ->assertJsonPath('datos.metodo_pago.ultimos_4', '8899');
    }

    public function test_confirmar_rechaza_un_metodo_que_no_es_tarjeta_o_es_de_otro_cliente(): void
    {
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('recuperarMetodoPago')->with('pm_ajena')->andReturn($this->metodoNuevo('card', 'cus_otro'));
            $mock->shouldReceive('establecerMetodoPredeterminado')->never();
        });

        $this->postJson('/api/v1/propietario/suscripcion/metodo-pago/confirmar', [
            'stripe_payment_method_id' => 'pm_ajena',
        ], $this->headers())
            ->assertStatus(400)
            ->assertJsonPath('errores.0.codigo', 'METODO_PAGO_INVALIDO');
    }

    public function test_confirmar_tarjeta_en_gracia_cobra_lo_pendiente_y_reactiva_la_suscripcion(): void
    {
        $this->dejarEnGracia();

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('recuperarMetodoPago')->andReturn($this->metodoNuevo());
            $mock->shouldReceive('establecerMetodoPredeterminado')->andReturn('pm_nueva');
            $mock->shouldReceive('cobrarRenovacion')->once()->andReturn($this->cobroExitoso());
        });

        $this->postJson('/api/v1/propietario/suscripcion/metodo-pago/confirmar', [
            'stripe_payment_method_id' => 'pm_nueva',
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.cobro_pendiente_regularizado', true);

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('activa', $suscripcion->estado);
        $this->assertNull($suscripcion->fecha_corte_gracia);
        $this->assertSame(0, (int) $suscripcion->reintentos_stripe_conteo);
        $this->assertTrue(now()->addDays(27)->isBefore($suscripcion->fecha_fin_periodo));

        $pago = DB::table('pago')->where('suscripcion_id', $this->suscripcionId)->where('stripe_payment_id', 'pi_renovacion_ok')->first();
        $this->assertSame('exitoso', $pago->estado);
        $this->assertNotNull(app(ReciboSuscripcionService::class)->archivoDisponible($pago->id), 'La renovación debe dejar su constancia PDF.');
    }

    public function test_confirmar_tarjeta_con_cobro_rechazado_responde_402_y_mantiene_la_gracia(): void
    {
        $this->dejarEnGracia();

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('recuperarMetodoPago')->andReturn($this->metodoNuevo());
            $mock->shouldReceive('establecerMetodoPredeterminado')->andReturn('pm_nueva');
            $mock->shouldReceive('cobrarRenovacion')->once()->andThrow(new \RuntimeException('Your card was declined.'));
        });

        $this->postJson('/api/v1/propietario/suscripcion/metodo-pago/confirmar', [
            'stripe_payment_method_id' => 'pm_nueva',
        ], $this->headers())
            ->assertStatus(402)
            ->assertJsonPath('errores.0.codigo', 'COBRO_PENDIENTE_FALLIDO');

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('en_gracia', $suscripcion->estado);
        // Un intento manual no consume los reintentos automáticos de la gracia
        $this->assertSame(1, (int) $suscripcion->reintentos_stripe_conteo);
        $this->assertSame(1, DB::table('pago')->where('suscripcion_id', $this->suscripcionId)->where('estado', 'fallido')->count());
    }

    public function test_pagar_ahora_sin_cobro_pendiente_responde_409(): void
    {
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->postJson('/api/v1/propietario/suscripcion/cobro-pendiente/reintentar', [], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'SIN_COBRO_PENDIENTE');
    }

    public function test_el_comando_renueva_las_suscripciones_vencidas_con_su_constancia(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update([
            'fecha_fin_periodo' => now()->subHour(),
        ]);

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')->once()->andReturn($this->cobroExitoso());
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('activa', $suscripcion->estado);
        $this->assertTrue(now()->addDays(27)->isBefore($suscripcion->fecha_fin_periodo));
        $this->assertSame(2, DB::table('pago')->where('suscripcion_id', $this->suscripcionId)->where('estado', 'exitoso')->count());
    }

    public function test_el_comando_en_simulacion_no_cobra_ni_cambia_estados(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_fin_periodo' => now()->subHour()]);

        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->artisan('suscripciones:procesar-cobros --dry-run')->assertSuccessful();

        $this->assertSame('activa', DB::table('suscripcion')->where('id', $this->suscripcionId)->value('estado'));
        $this->assertSame(1, DB::table('pago')->where('suscripcion_id', $this->suscripcionId)->count());
    }

    public function test_el_comando_pasa_a_gracia_cuando_el_banco_rechaza_la_renovacion(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_fin_periodo' => now()->subHour()]);

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')->once()->andThrow(new \RuntimeException('Your card has insufficient funds.'));
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('en_gracia', $suscripcion->estado);
        $this->assertSame(1, (int) $suscripcion->reintentos_stripe_conteo);
        $this->assertSame(5, (int) $suscripcion->dias_gracia_restantes);
        $this->assertStringContainsString('insufficient funds', $suscripcion->ultimo_error_cobro);
        $this->assertTrue(now()->addDays(4)->isBefore($suscripcion->fecha_corte_gracia));

        $this->getJson('/api/v1/propietario/suscripcion', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.estado_cobro.en_periodo_gracia', true)
            ->assertJsonPath('datos.estado_cobro.monto_pendiente', 80)
            ->assertJsonPath('datos.metodo_pago.estado_cobro_tarjeta', 'rechazado');
    }

    public function test_el_comando_no_reintenta_dos_veces_el_mismo_dia(): void
    {
        $this->dejarEnGracia();
        DB::table('pago')->insert([
            'id' => (string) Str::uuid(), 'empresa_id' => $this->empresaId, 'suscripcion_id' => $this->suscripcionId,
            'plan_id' => 2, 'monto' => 80, 'fecha' => now()->subHours(2), 'estado' => 'fallido',
            'origen_pago' => 'stripe', 'created_at' => now(),
        ]);

        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $this->assertSame('en_gracia', DB::table('suscripcion')->where('id', $this->suscripcionId)->value('estado'));
    }

    public function test_el_comando_suspende_la_empresa_al_agotarse_la_gracia(): void
    {
        $this->dejarEnGracia();
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_corte_gracia' => now()->subMinute()]);

        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $this->assertSame('suspendida', DB::table('suscripcion')->where('id', $this->suscripcionId)->value('estado'));
        $this->assertSame('suspendida', DB::table('empresa')->where('id', $this->empresaId)->value('estado'));
    }

    public function test_empresa_suspendida_solo_deja_al_propietario_regularizar_en_mi_suscripcion(): void
    {
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')->once()->andReturn($this->cobroExitoso());
        });

        app(CobroSuscripcionService::class)->suspender($this->suscripcionId);

        // El propietario aún puede iniciar sesión y ver su suscripción…
        $this->postJson('/api/v1/auth/login', ['correo' => $this->correo, 'password' => self::PASSWORD])
            ->assertOk()
            ->assertJsonStructure(['datos' => ['token']]);

        $this->getJson('/api/v1/propietario/suscripcion', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.suscripcion_estado', 'suspendida');

        // …pero el resto de la operación queda bloqueada.
        $this->getJson('/api/v1/propietario/locales', $this->headers())
            ->assertStatus(403)
            ->assertJsonPath('errores.0.codigo', 'EMPRESA_SUSPENDIDA');

        // Pagar ahora reactiva la empresa y devuelve el acceso.
        $this->postJson('/api/v1/propietario/suscripcion/cobro-pendiente/reintentar', [], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.cobro_pendiente_regularizado', true);

        $this->assertSame('activa', DB::table('empresa')->where('id', $this->empresaId)->value('estado'));
        $this->getJson('/api/v1/propietario/locales', $this->headers())->assertOk();
    }

    public function test_los_intentos_manuales_usan_llaves_distintas_y_no_consumen_los_automaticos(): void
    {
        $this->dejarEnGracia();
        $llaves = [];

        $this->mockStripe(function (MockInterface $mock) use (&$llaves): void {
            $mock->shouldReceive('cobrarRenovacion')->twice()->andReturnUsing(function ($cliente, $monto, $descripcion, $llave) use (&$llaves) {
                $llaves[] = $llave;

                throw new \RuntimeException('Your card was declined.');
            });
        });

        foreach ([1, 2] as $intento) {
            $this->postJson('/api/v1/propietario/suscripcion/cobro-pendiente/reintentar', [], $this->headers())
                ->assertStatus(402);
        }

        $this->assertCount(2, array_unique($llaves), 'Stripe repetiría el rechazo anterior si la llave de idempotencia se reutiliza.');
        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame(1, (int) $suscripcion->reintentos_stripe_conteo);
        $this->assertSame('en_gracia', $suscripcion->estado);
    }

    public function test_el_comando_sigue_reintentando_aunque_haya_intentos_manuales_fallidos(): void
    {
        $this->dejarEnGracia();
        DB::table('pago')->insert([
            'id' => (string) Str::uuid(), 'empresa_id' => $this->empresaId, 'suscripcion_id' => $this->suscripcionId,
            'plan_id' => 2, 'monto' => 80, 'fecha' => now()->subDay(), 'estado' => 'fallido', 'origen_pago' => 'stripe',
            'nota' => 'Cobro rechazado: manual', 'created_at' => now()->subDay(),
        ]);

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')->once()->andReturn($this->cobroExitoso());
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $this->assertSame('activa', DB::table('suscripcion')->where('id', $this->suscripcionId)->value('estado'));
    }

    private function suspenderAdministrativamente(): void
    {
        DB::table('suscripcion_suspension')->insert([
            'id' => (string) Str::uuid(),
            'empresa_id' => $this->empresaId,
            'suscripcion_id' => $this->suscripcionId,
            'tipo_evento' => 'suspension_temporal',
            'motivo' => 'Uso indebido',
            'detalle_justificacion' => 'Suspendida por el equipo SaaS tras una revisión.',
            'ejecutado_por' => DB::table('usuario')->where('empresa_id', $this->empresaId)->where('rol', 'propietario')->value('id'),
            'estado' => 'activa',
        ]);
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['estado' => 'suspendida']);
        DB::table('empresa')->where('id', $this->empresaId)->update(['estado' => 'suspendida']);
        CobroSuscripcionService::olvidarEstadoEmpresa($this->empresaId);
    }

    public function test_una_suspension_administrativa_no_se_levanta_pagando(): void
    {
        $this->suspenderAdministrativamente();
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->postJson('/api/v1/propietario/suscripcion/cobro-pendiente/reintentar', [], $this->headers())
            ->assertStatus(403)
            ->assertJsonPath('errores.0.codigo', 'SUSPENSION_ADMINISTRATIVA');

        $this->getJson('/api/v1/propietario/suscripcion', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.estado_cobro.suspension_administrativa', true)
            ->assertJsonPath('datos.estado_cobro.monto_pendiente', 0);

        $this->assertSame('suspendida', DB::table('empresa')->where('id', $this->empresaId)->value('estado'));
    }

    public function test_cambiar_la_tarjeta_en_una_suspension_administrativa_no_cobra_ni_reactiva(): void
    {
        $this->suspenderAdministrativamente();
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('recuperarMetodoPago')->andReturn($this->metodoNuevo());
            $mock->shouldReceive('establecerMetodoPredeterminado')->andReturn('pm_nueva');
            $mock->shouldReceive('cobrarRenovacion')->never();
        });

        $this->postJson('/api/v1/propietario/suscripcion/metodo-pago/confirmar', [
            'stripe_payment_method_id' => 'pm_nueva',
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.cobro_pendiente_regularizado', false);

        $this->assertSame('suspendida', DB::table('empresa')->where('id', $this->empresaId)->value('estado'));
    }

    public function test_el_comando_no_toca_una_suscripcion_suspendida_administrativamente(): void
    {
        $this->suspenderAdministrativamente();
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_fin_periodo' => now()->subDay()]);
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $this->assertSame('suspendida', DB::table('suscripcion')->where('id', $this->suscripcionId)->value('estado'));
    }
}
