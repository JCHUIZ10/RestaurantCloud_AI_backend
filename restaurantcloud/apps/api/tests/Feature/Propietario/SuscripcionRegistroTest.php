<?php

namespace Tests\Feature\Propietario;

use App\Domains\Suscripcion\Services\ReciboSuscripcionService;
use App\Domains\Suscripcion\Services\StripeGatewayService;
use App\Domains\Tenant\Services\TenantProvisioningService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Stripe\PaymentIntent;
use Tests\TestCase;

/**
 * CU-PROP-01 / CU-PROP-02: alta autoservicio con autologin funcional,
 * constancia PDF persistida y "Mi suscripción" leído desde la BD.
 */
class SuscripcionRegistroTest extends TestCase
{
    private const RUC_VALIDO = '20100017491';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('s3');
    }

    /**
     * Deja en Redis una sesión de registro con el correo ya verificado (fin del Paso 3).
     */
    private function prepararRegistroVerificado(string $ciclo = 'anual'): string
    {
        $registroId = (string) Str::uuid();

        Redis::setex("registro:onboarding:{$registroId}", 1800, json_encode([
            'registro_id' => $registroId,
            'plan_id' => 2,
            'tipo_contribuyente' => 'RUC_20',
            'ruc' => self::RUC_VALIDO,
            'razon_social' => 'Cevichería Autologin SAC',
            'telefono' => '987111222',
            'nombre_propietario' => 'Lucía Autologin',
            'correo' => 'lucia.'.Str::random(6).'@autologin.pe',
            'password_hash' => Hash::make('Secreto2026!'),
            'ciclo_facturacion' => $ciclo,
            'correo_verificado' => true,
            'stripe_customer_id' => 'cus_test_autologin',
        ]));

        return $registroId;
    }

    private function simularCobroExitoso(): void
    {
        $this->mock(StripeGatewayService::class, function ($mock): void {
            $mock->shouldReceive('cobrarSuscripcionInicial')
                ->once()
                ->andReturn(PaymentIntent::constructFrom([
                    'id' => 'pi_test_autologin',
                    'status' => 'succeeded',
                ]));
        });
    }

    public function test_completar_registro_emite_sesion_valida_para_las_rutas_del_propietario(): void
    {
        $this->simularCobroExitoso();
        $registroId = $this->prepararRegistroVerificado('anual');

        $response = $this->postJson('/api/v1/public/registro/completar', [
            'registro_id' => $registroId,
            'stripe_payment_method_id' => 'pm_card_visa',
        ]);

        $response->assertOk()
            ->assertJsonPath('datos.constancia.periodo', 'Anual');

        $token = $response->json('datos.token');
        $this->assertStringStartsWith('rc_live_', $token);
        $this->assertStringStartsWith('RS-', $response->json('datos.constancia.numero_comprobante'));
        $this->assertTrue(
            Carbon::parse($response->json('datos.constancia.proximo_cobro'))->isAfter(now()->addMonths(11)),
            'Un plan anual debe cobrarse de nuevo en un año, no en un mes.'
        );

        $dashboard = $this->getJson('/api/v1/propietario/suscripcion', ['Authorization' => "Bearer {$token}"]);

        $dashboard->assertOk()
            ->assertJsonPath('datos.empresa.ruc', self::RUC_VALIDO)
            ->assertJsonPath('datos.plan.periodicidad', 'anual')
            ->assertJsonCount(1, 'datos.historial_pagos');

        $refresh = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $response->json('datos.refresh_token'),
        ]);
        $refresh->assertOk();
    }

    public function test_completar_registro_guarda_la_constancia_pdf_y_se_puede_descargar(): void
    {
        $this->simularCobroExitoso();
        $registroId = $this->prepararRegistroVerificado('mensual');

        $response = $this->postJson('/api/v1/public/registro/completar', [
            'registro_id' => $registroId,
            'stripe_payment_method_id' => 'pm_card_visa',
        ])->assertOk();

        $pagoId = $response->json('datos.constancia.pago_id');
        $archivo = app(ReciboSuscripcionService::class)->archivoDisponible($pagoId);

        $this->assertNotNull($archivo, 'La constancia debe quedar registrada en la tabla archivo.');
        Storage::disk('s3')->assertExists($archivo->object_key);

        $descarga = $this->get(
            $response->json('datos.constancia.url_descarga_pdf'),
            ['Authorization' => 'Bearer '.$response->json('datos.token')]
        );

        $descarga->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $descarga->getContent());
    }

    public function test_propietario_no_puede_descargar_la_constancia_de_otra_empresa(): void
    {
        $ajena = app(TenantProvisioningService::class)->provisionar([
            'ruc' => '20999999993',
            'razon_social' => 'Empresa Ajena SAC',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo' => 'ajena.'.Str::random(6).'@test.pe',
            'nombre_propietario' => 'Dueño Ajeno',
            'password' => 'Ajena2026!',
            'telefono' => '987000111',
            'plan_id' => 2,
            'ignorar_modulo_11' => true,
        ]);

        $token = 'test_token_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000101',
            'nombre' => 'Rodrigo De Las Casas',
            'correo' => 'propietario@aurea.local',
            'rol' => 'propietario',
            'empresa_id' => '00000000-0000-4000-8000-000000000001',
            'local_id' => null,
            'estado' => 'activo',
        ]));

        $this->get(
            "/api/v1/propietario/suscripcion/pagos/{$ajena['pago']['id']}/recibo",
            ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json']
        )->assertNotFound();
    }

    public function test_completar_registro_rechaza_un_segundo_intento_en_curso(): void
    {
        $registroId = $this->prepararRegistroVerificado();
        Redis::setex("registro:completar:lock:{$registroId}", 120, '1');

        try {
            $this->postJson('/api/v1/public/registro/completar', [
                'registro_id' => $registroId,
                'stripe_payment_method_id' => 'pm_card_visa',
            ])->assertStatus(409)->assertJsonPath('errores.0.codigo', 'REGISTRO_EN_PROCESO');
        } finally {
            Redis::del("registro:completar:lock:{$registroId}");
        }

        $this->assertFalse(DB::table('empresa')->where('ruc', self::RUC_VALIDO)->exists());
    }

    public function test_reenviar_otp_conserva_el_registro_y_respeta_la_espera(): void
    {
        $registroId = $this->prepararRegistroVerificado();
        Redis::del("registro:otp:cooldown:{$registroId}");

        $this->postJson('/api/v1/public/registro/reenviar-otp', ['registro_id' => $registroId])
            ->assertOk()
            ->assertJsonPath('datos.registro_id', $registroId);

        $this->assertSame(6, strlen((string) Redis::get("registro:otp:{$registroId}")));

        $this->postJson('/api/v1/public/registro/reenviar-otp', ['registro_id' => $registroId])
            ->assertStatus(429)
            ->assertJsonPath('errores.0.codigo', 'REENVIO_EN_ESPERA');
    }
}
