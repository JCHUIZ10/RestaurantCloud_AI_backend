<?php

namespace Tests\Feature\Propietario;

use App\Domains\Suscripcion\Services\ReciboSuscripcionService;
use App\Domains\Suscripcion\Services\StripeGatewayService;
use App\Domains\Tenant\Services\TenantProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Mockery\MockInterface;
use Stripe\PaymentIntent;
use Tests\TestCase;

/**
 * CU-PROP-03: comparativa de planes contrastada con el uso real de la empresa.
 */
class CambioPlanTest extends TestCase
{
    private string $empresaId;

    private string $suscripcionId;

    private string $usuarioId;

    /** @var list<string> */
    private array $tokens = [];

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('s3');

        $alta = app(TenantProvisioningService::class)->provisionar([
            'ruc' => '20999999993',
            'razon_social' => 'Cambio de Plan SAC',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo' => 'plan.'.Str::random(6).'@test.pe',
            'nombre_propietario' => 'Dueño de Plan',
            'password' => 'Plan2026!',
            'telefono' => '987000333',
            'plan_id' => 2,
            'stripe_customer_id' => 'cus_test_cambio',
            'ignorar_modulo_11' => true,
        ]);

        $this->empresaId = $alta['empresa']['id'];
        $this->suscripcionId = $alta['suscripcion']['id'];
        $this->usuarioId = $alta['usuario']['id'];
    }

    protected function tearDown(): void
    {
        foreach ($this->tokens as $token) {
            Redis::del('auth:session:'.hash('sha256', $token));
        }

        parent::tearDown();
    }

    /** @return array<string, string> */
    private function headers(string $rol = 'propietario'): array
    {
        $token = 'test_token_'.Str::random(32);
        $this->tokens[] = $token;

        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->usuarioId,
            'nombre' => 'Dueño de Plan',
            'correo' => 'plan@test.pe',
            'rol' => $rol,
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'estado' => 'activo',
        ]));

        return ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'];
    }

    private function agregarPersonal(int $cantidad, string $localId): void
    {
        for ($i = 0; $i < $cantidad; $i++) {
            DB::table('usuario')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $this->empresaId,
                'local_id' => $localId,
                'nombre' => "Mozo {$i}",
                'correo' => "mozo{$i}.".Str::random(5).'@test.pe',
                'password_hash' => 'x',
                'rol' => 'mozo',
                'estado' => 'activo',
            ]);
        }
    }

    public function test_comparativa_marca_la_accion_de_cada_plan_segun_el_plan_actual(): void
    {
        $respuesta = $this->getJson('/api/v1/propietario/suscripcion/planes-comparativa', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan_actual.nombre', 'Pro')
            ->assertJsonPath('datos.plan_actual.periodicidad', 'mensual')
            ->assertJsonPath('datos.plan_actual.downgrade_programado', false)
            ->assertJsonCount(3, 'datos.planes');

        $acciones = collect($respuesta->json('datos.planes'))->pluck('tipo_accion', 'nombre')->all();

        $this->assertSame(['Starter' => 'downgrade', 'Pro' => 'actual', 'Enterprise' => 'upgrade'], $acciones);
        $this->assertGreaterThan(0, $respuesta->json('datos.plan_actual.dias_restantes_ciclo'));
    }

    public function test_comparativa_exige_conciliar_solo_cuando_el_uso_excede_el_plan_inferior(): void
    {
        $sinExceso = collect(
            $this->getJson('/api/v1/propietario/suscripcion/planes-comparativa', $this->headers())->json('datos.planes')
        )->firstWhere('nombre', 'Starter');

        $this->assertFalse($sinExceso['requiere_conciliacion']);
        $this->assertSame([], $sinExceso['recursos_excedidos']);

        // 7 personas en una sede superan las 6 por sede de Starter
        [$local] = $this->agregarLocales(1);
        $this->agregarPersonal(7, $local);

        $respuesta = $this->getJson('/api/v1/propietario/suscripcion/planes-comparativa', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.recursos_en_uso.por_local.0.usuarios', 7);

        $starter = collect($respuesta->json('datos.planes'))->firstWhere('nombre', 'Starter');
        $this->assertTrue($starter['requiere_conciliacion']);
        $this->assertSame(['usuarios'], $starter['recursos_excedidos']);
    }

    public function test_comparativa_informa_el_downgrade_programado(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['proximo_plan_id' => 1]);

        $this->getJson('/api/v1/propietario/suscripcion/planes-comparativa', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan_actual.downgrade_programado', true)
            ->assertJsonPath('datos.plan_actual.proximo_plan.nombre', 'Starter');
    }

    public function test_comparativa_solo_esta_disponible_para_el_propietario(): void
    {
        $this->getJson('/api/v1/propietario/suscripcion/planes-comparativa', $this->headers('mozo'))
            ->assertForbidden();
    }

    private function mitadDeCiclo(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_fin_periodo' => now()->addDays(15)]);
    }

    private function mockStripe(callable $configurar): void
    {
        $this->mock(StripeGatewayService::class, function (MockInterface $mock) use ($configurar): void {
            $mock->shouldReceive('obtenerTarjetaPredeterminada')->andReturn([
                'marca' => 'visa', 'ultimos_4' => '4242', 'exp_mes' => 12, 'exp_ano' => 2031, 'titular' => 'Dueño de Plan',
            ]);
            $configurar($mock);
        });
    }

    public function test_simular_upgrade_calcula_credito_costo_y_neto_proporcionales(): void
    {
        $this->mitadDeCiclo();
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $respuesta = $this->postJson('/api/v1/propietario/suscripcion/simular-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan_origen', 'Pro')
            ->assertJsonPath('datos.plan_destino', 'Enterprise')
            ->assertJsonPath('datos.nuevo_monto_recurrente', 160)
            ->assertJsonPath('datos.requiere_cobro', true)
            ->assertJsonPath('datos.metodo_pago_defecto.ultimos_4', '4242');

        $datos = $respuesta->json('datos');
        // Pro cuesta 80 y Enterprise 160: con la mitad del ciclo restante el costo duplica al crédito
        $this->assertEqualsWithDelta($datos['credito_plan_actual'] * 2, $datos['costo_nuevo_plan_proporcional'], 0.05);
        $this->assertEqualsWithDelta($datos['costo_nuevo_plan_proporcional'] - $datos['credito_plan_actual'], $datos['monto_neto_a_pagar_hoy'], 0.01);
        $this->assertGreaterThan(36, $datos['monto_neto_a_pagar_hoy']);
        $this->assertLessThan(44, $datos['monto_neto_a_pagar_hoy']);
        $this->assertSame(2, DB::table('suscripcion')->where('id', $this->suscripcionId)->value('plan_id'));
    }

    public function test_ejecutar_upgrade_cobra_cambia_los_limites_y_genera_la_constancia(): void
    {
        $this->mitadDeCiclo();
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')
                ->once()
                ->andReturn(PaymentIntent::constructFrom(['id' => 'pi_upgrade_ok', 'status' => 'succeeded']));
        });

        $respuesta = $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan_nombre', 'Enterprise')
            ->assertJsonPath('datos.modulos_activados', ['Predicción de demanda IA']);

        $this->assertSame(3, DB::table('suscripcion')->where('id', $this->suscripcionId)->value('plan_id'));
        $this->assertSame(3, DB::table('empresa')->where('id', $this->empresaId)->value('plan_id'));

        $pago = DB::table('pago')->where('stripe_payment_id', 'pi_upgrade_ok')->first();
        $this->assertSame('exitoso', $pago->estado);
        $this->assertSame(3, (int) $pago->plan_id);
        $this->assertEqualsWithDelta((float) $pago->monto, $respuesta->json('datos.comprobante_pago.monto_cobrado'), 0.001);
        $this->assertNotNull(app(ReciboSuscripcionService::class)->archivoDisponible($pago->id));

        // El nuevo plan ya rige los límites mostrados en Mi suscripción
        $this->getJson('/api/v1/propietario/suscripcion', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan.nombre', 'Enterprise')
            ->assertJsonPath('datos.uso_recursos.locales.maximo', 10);
    }

    public function test_upgrade_con_cobro_rechazado_no_cambia_nada(): void
    {
        $this->mitadDeCiclo();
        $pagosAntes = DB::table('pago')->where('empresa_id', $this->empresaId)->count();

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')->once()->andThrow(new \RuntimeException('Your card was declined.'));
        });

        $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertStatus(402)
            ->assertJsonPath('errores.0.codigo', 'COBRO_UPGRADE_RECHAZADO');

        $this->assertSame(2, DB::table('suscripcion')->where('id', $this->suscripcionId)->value('plan_id'));
        $this->assertSame(2, DB::table('empresa')->where('id', $this->empresaId)->value('plan_id'));
        $this->assertSame($pagosAntes, DB::table('pago')->where('empresa_id', $this->empresaId)->count());
    }

    public function test_upgrade_con_neto_menor_al_minimo_se_activa_sin_cobro(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_fin_periodo' => now()->addMinutes(30)]);
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.comprobante_pago', null);

        $this->assertSame(3, DB::table('suscripcion')->where('id', $this->suscripcionId)->value('plan_id'));
    }

    public function test_upgrade_rechaza_planes_que_no_son_una_mejora(): void
    {
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        foreach ([1, 2] as $planId) {
            $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => $planId], $this->headers())
                ->assertStatus(422)
                ->assertJsonPath('errores.0.codigo', 'PLAN_INVALIDO');
        }
    }

    public function test_upgrade_exige_la_suscripcion_al_dia_y_sin_downgrade_programado(): void
    {
        $this->mockStripe(fn (MockInterface $mock) => $mock->shouldReceive('cobrarRenovacion')->never());

        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['proximo_plan_id' => 1]);
        $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'DOWNGRADE_PROGRAMADO');

        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['proximo_plan_id' => null, 'estado' => 'en_gracia']);
        $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'SUSCRIPCION_NO_ACTIVA');
    }

    public function test_upgrade_con_cobro_requiere_una_tarjeta_registrada(): void
    {
        $this->mitadDeCiclo();
        DB::table('empresa')->where('id', $this->empresaId)->update(['stripe_customer_id' => null]);

        $this->postJson('/api/v1/propietario/suscripcion/ejecutar-upgrade', ['nuevo_plan_id' => 3], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'SIN_METODO_PAGO');
    }

    private function vencerPeriodo(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['fecha_fin_periodo' => now()->subHour()]);
    }

    private function programar(int $planId, string $ciclo): TestResponse
    {
        return $this->postJson('/api/v1/propietario/suscripcion/programar-cambio', [
            'nuevo_plan_id' => $planId,
            'ciclo' => $ciclo,
        ], $this->headers());
    }

    /**
     * Agrega locales posteriores al original, con antigüedad creciente.
     *
     * @return list<string> Ids en orden de antigüedad
     */
    private function agregarLocales(int $cantidad): array
    {
        $ids = [];
        for ($i = 1; $i <= $cantidad; $i++) {
            $ids[] = $id = (string) Str::uuid();
            DB::table('local')->insert([
                'id' => $id,
                'empresa_id' => $this->empresaId,
                'nombre' => "Sede extra {$i}",
                'slug' => 'sede-extra-'.Str::lower(Str::random(6)),
                'direccion' => 'Av. Prueba 123',
                'telefono' => '987000444',
                'ubigeo_cod' => '021801',
                'estado' => 'activo',
                'created_at' => now()->addMinutes($i),
            ]);
        }

        return $ids;
    }

    public function test_programar_un_downgrade_no_cambia_el_plan_hasta_la_renovacion(): void
    {
        [$local] = $this->agregarLocales(1);
        $this->agregarPersonal(7, $local);

        $this->programar(1, 'mensual')
            ->assertOk()
            ->assertJsonPath('datos.plan_destino', 'Starter')
            ->assertJsonPath('datos.ciclo', 'mensual')
            ->assertJsonPath('datos.recursos_excedidos.0.recurso', 'usuarios')
            ->assertJsonPath('datos.recursos_excedidos.0.local_nombre', 'Sede extra 1');

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame(2, (int) $suscripcion->plan_id);
        $this->assertSame(1, (int) $suscripcion->proximo_plan_id);
        $this->assertSame('mensual', json_decode($suscripcion->config_downgrade, true)['ciclo']);
        $this->assertSame(7, DB::table('usuario')->where('local_id', $local)->where('estado', 'activo')->count());
    }

    public function test_la_comparativa_y_el_dashboard_informan_el_cambio_programado(): void
    {
        $this->programar(1, 'anual')->assertOk();

        $this->getJson('/api/v1/propietario/suscripcion/planes-comparativa', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan_actual.proximo_plan.nombre', 'Starter')
            ->assertJsonPath('datos.plan_actual.proximo_plan.ciclo', 'anual')
            ->assertJsonPath('datos.plan_actual.proximo_plan.seleccion_guardada', false);

        $this->mockStripe(fn (MockInterface $mock) => null);
        $this->getJson('/api/v1/propietario/suscripcion', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan.proximo_plan.precio', 400);
    }

    public function test_se_puede_programar_el_paso_de_anual_a_mensual_con_el_mismo_plan(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update([
            'ciclo_facturacion' => 'anual',
            'fecha_fin_periodo' => now()->addMonths(8),
        ]);

        $this->programar(2, 'mensual')->assertOk()->assertJsonPath('datos.plan_destino', 'Pro');
        $this->assertSame(2, (int) DB::table('suscripcion')->where('id', $this->suscripcionId)->value('proximo_plan_id'));
    }

    public function test_programar_rechaza_mejoras_el_mismo_plan_y_cambios_duplicados(): void
    {
        $this->programar(3, 'mensual')->assertStatus(422)->assertJsonPath('errores.0.codigo', 'PLAN_INVALIDO');
        $this->programar(2, 'mensual')->assertStatus(422)->assertJsonPath('errores.0.codigo', 'PLAN_INVALIDO');
        $this->programar(2, 'anual')->assertStatus(422)->assertJsonPath('errores.0.codigo', 'PLAN_INVALIDO');

        $this->programar(1, 'mensual')->assertOk();
        $this->programar(1, 'anual')->assertStatus(409)->assertJsonPath('errores.0.codigo', 'CAMBIO_YA_PROGRAMADO');
    }

    public function test_no_se_programa_con_la_suscripcion_en_gracia(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['estado' => 'en_gracia']);

        $this->programar(1, 'mensual')->assertStatus(409)->assertJsonPath('errores.0.codigo', 'SUSCRIPCION_NO_ACTIVA');
    }

    public function test_cancelar_el_cambio_deja_la_suscripcion_como_estaba(): void
    {
        $this->programar(1, 'mensual')->assertOk();

        $this->deleteJson('/api/v1/propietario/suscripcion/cambio-programado', [], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.plan_activo', 'Pro');

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertNull($suscripcion->proximo_plan_id);
        $this->assertNull($suscripcion->config_downgrade);

        $this->deleteJson('/api/v1/propietario/suscripcion/cambio-programado', [], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'SIN_CAMBIO_PROGRAMADO');
    }

    public function test_mientras_esta_programado_rige_el_limite_del_plan_actual_sin_bloqueos(): void
    {
        $this->programar(1, 'mensual')->assertOk();
        $this->agregarLocales(3);

        $this->mockStripe(fn (MockInterface $mock) => null);
        $this->getJson('/api/v1/propietario/suscripcion', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.uso_recursos.locales.usados', 3)
            ->assertJsonPath('datos.uso_recursos.locales.maximo', 3);
    }

    public function test_la_renovacion_aplica_el_downgrade_cobra_el_plan_nuevo_y_desactiva_lo_que_excede(): void
    {
        [$antigua, $intermedia] = $this->agregarLocales(3);
        $this->agregarPersonal(8, $antigua);
        $this->agregarPersonal(1, $intermedia);
        $this->programar(1, 'mensual')->assertOk();
        $this->vencerPeriodo();

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')
                ->once()
                ->withArgs(fn ($cliente, $monto) => abs($monto - 40.0) < 0.001)
                ->andReturn(PaymentIntent::constructFrom(['id' => 'pi_downgrade_ok', 'status' => 'succeeded']));
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame(1, (int) $suscripcion->plan_id);
        $this->assertNull($suscripcion->proximo_plan_id);
        $this->assertNull($suscripcion->config_downgrade);
        $this->assertSame('activa', $suscripcion->estado);
        $this->assertSame(1, (int) DB::table('empresa')->where('id', $this->empresaId)->value('plan_id'));

        $pago = DB::table('pago')->where('stripe_payment_id', 'pi_downgrade_ok')->first();
        $this->assertSame(1, (int) $pago->plan_id);
        $this->assertEqualsWithDelta(40.0, (float) $pago->monto, 0.001);

        // Starter admite 1 local (el más antiguo) y 6 personas por sede; el propietario no cuenta
        $this->assertSame(1, DB::table('local')->where('empresa_id', $this->empresaId)->where('estado', 'activo')->count());
        $this->assertSame(2, DB::table('local')->where('empresa_id', $this->empresaId)->where('estado', 'inactivo')->count());
        $this->assertSame(6, DB::table('usuario')->where('local_id', $antigua)->where('estado', 'activo')->count());
        $this->assertSame(0, DB::table('usuario')->where('local_id', $intermedia)->where('estado', 'activo')->count());
        $this->assertSame('activo', DB::table('usuario')->where('id', $this->usuarioId)->value('estado'));
    }

    public function test_la_renovacion_de_anual_a_mensual_reinicia_el_periodo_con_el_ciclo_nuevo(): void
    {
        DB::table('suscripcion')->where('id', $this->suscripcionId)->update(['ciclo_facturacion' => 'anual']);
        $this->programar(2, 'mensual')->assertOk();
        $this->vencerPeriodo();

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')
                ->once()
                ->withArgs(fn ($cliente, $monto) => abs($monto - 80.0) < 0.001)
                ->andReturn(PaymentIntent::constructFrom(['id' => 'pi_ciclo_ok', 'status' => 'succeeded']));
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('mensual', $suscripcion->ciclo_facturacion);
        $this->assertSame(2, (int) $suscripcion->plan_id);
        $this->assertTrue(now()->addDays(27)->isBefore($suscripcion->fecha_fin_periodo));
        $this->assertTrue(now()->addDays(32)->isAfter($suscripcion->fecha_fin_periodo));
    }

    public function test_si_el_cobro_del_plan_nuevo_falla_se_mantiene_el_plan_actual_y_un_reintento_aplica_el_cambio(): void
    {
        $this->programar(1, 'mensual')->assertOk();
        $this->vencerPeriodo();

        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')
                ->twice()
                ->andReturnUsing(
                    fn () => throw new \RuntimeException('Your card was declined.'),
                    fn () => PaymentIntent::constructFrom(['id' => 'pi_reintento_ok', 'status' => 'succeeded'])
                );
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('en_gracia', $suscripcion->estado);
        $this->assertSame(2, (int) $suscripcion->plan_id, 'Sin cobro exitoso el plan no cambia.');
        $this->assertSame(1, (int) $suscripcion->proximo_plan_id);
        $this->assertSame(1, (int) DB::table('pago')->where('suscripcion_id', $this->suscripcionId)->where('estado', 'fallido')->value('plan_id'));

        $this->postJson('/api/v1/propietario/suscripcion/cobro-pendiente/reintentar', [], $this->headers())
            ->assertOk();

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertSame('activa', $suscripcion->estado);
        $this->assertSame(1, (int) $suscripcion->plan_id);
        $this->assertNull($suscripcion->proximo_plan_id);
    }

    private function agregarPiso(string $localId): string
    {
        $id = (string) Str::uuid();
        DB::table('piso')->insert(['id' => $id, 'local_id' => $localId, 'nombre' => 'Salón '.Str::random(5),
            'columnas' => 4, 'filas' => 3, 'estado' => 'activo']);

        return $id;
    }

    /** @param array<string, list<string>> $cambios */
    private function guardarSeleccion(array $cambios = []): TestResponse
    {
        return $this->putJson('/api/v1/propietario/suscripcion/cambio-programado/seleccion', [
            ...['locales_ids' => [], 'pisos_ids' => [], 'mesas_ids' => [], 'usuarios_ids' => []],
            ...$cambios,
        ], $this->headers());
    }

    public function test_el_asistente_exige_un_cambio_programado(): void
    {
        $this->getJson('/api/v1/propietario/suscripcion/recursos-conciliacion', $this->headers())->assertStatus(409);
        $this->guardarSeleccion()->assertStatus(409);
    }

    public function test_el_asistente_lista_los_recursos_por_local_y_propone_conservar_lo_mas_antiguo(): void
    {
        [$antiguo] = $this->agregarLocales(3);
        $piso = $this->agregarPiso($antiguo);
        DB::table('mesa')->insert(['id' => (string) Str::uuid(), 'local_id' => $antiguo, 'piso_id' => $piso, 'numero' => '01',
            'capacidad' => 6, 'forma' => 'redonda', 'posicion_x' => 2, 'posicion_y' => 1, 'estado' => 'activa']);
        $this->programar(1, 'mensual')->assertOk();

        $this->getJson('/api/v1/propietario/suscripcion/recursos-conciliacion', $this->headers())
            ->assertOk()
            ->assertJsonCount(3, 'datos.locales')
            ->assertJsonPath('datos.plan_destino.nombre', 'Starter')
            ->assertJsonPath('datos.plan_destino.limites.max_locales', 1)
            ->assertJsonPath('datos.seleccion_guardada', false)
            ->assertJsonPath('datos.locales.0.pisos.0.id', $piso)
            ->assertJsonPath('datos.locales.0.pisos.0.columnas', 4)
            ->assertJsonPath('datos.locales.0.pisos.0.mesas.0.posicion_x', 2)
            ->assertJsonPath('datos.locales.0.pisos.0.mesas.0.capacidad', 6)
            ->assertJsonPath('datos.seleccion.locales_ids', [$antiguo])
            ->assertJsonPath('datos.seleccion.pisos_ids', [$piso]);
    }

    public function test_la_seleccion_guardada_la_respeta_la_renovacion(): void
    {
        [, , $reciente] = $this->agregarLocales(3);
        $this->programar(1, 'mensual')->assertOk();

        $this->guardarSeleccion(['locales_ids' => [$reciente]])
            ->assertOk()
            ->assertJsonPath('datos.seleccion_guardada', true)
            ->assertJsonPath('datos.seleccion.locales_ids', [$reciente]);

        $this->vencerPeriodo();
        $this->mockStripe(function (MockInterface $mock): void {
            $mock->shouldReceive('cobrarRenovacion')
                ->once()
                ->andReturn(PaymentIntent::constructFrom(['id' => 'pi_seleccion_ok', 'status' => 'succeeded']));
        });

        $this->artisan('suscripciones:procesar-cobros')->assertSuccessful();

        $this->assertSame(
            [$reciente],
            DB::table('local')->where('empresa_id', $this->empresaId)->where('estado', 'activo')->pluck('id')->all()
        );
    }

    public function test_la_seleccion_se_rechaza_si_no_cabe_rompe_la_cascada_o_no_es_de_la_empresa(): void
    {
        [$a, $b] = $this->agregarLocales(2);
        $pisoB = $this->agregarPiso($b);
        $this->programar(1, 'mensual')->assertOk();

        $this->guardarSeleccion(['locales_ids' => [$a, $b]])->assertStatus(422);
        $this->guardarSeleccion(['locales_ids' => [$a], 'pisos_ids' => [$pisoB]])->assertStatus(422);
        $this->guardarSeleccion(['usuarios_ids' => [$this->usuarioId]])->assertStatus(422);
        $this->guardarSeleccion(['locales_ids' => [(string) Str::uuid()]])->assertStatus(422);

        $suscripcion = DB::table('suscripcion')->where('id', $this->suscripcionId)->first();
        $this->assertNull(json_decode($suscripcion->config_downgrade, true)['seleccion']);
    }

    public function test_cancelar_el_cambio_descarta_la_seleccion(): void
    {
        [$a] = $this->agregarLocales(1);
        $this->programar(1, 'mensual')->assertOk();
        $this->guardarSeleccion(['locales_ids' => [$a]])->assertOk();

        $this->deleteJson('/api/v1/propietario/suscripcion/cambio-programado', [], $this->headers())->assertOk();

        $this->getJson('/api/v1/propietario/suscripcion/recursos-conciliacion', $this->headers())->assertStatus(409);
    }
}
