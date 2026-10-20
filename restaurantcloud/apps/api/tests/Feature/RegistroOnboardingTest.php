<?php

namespace Tests\Feature;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Domains\Tenant\Services\TenantProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class RegistroOnboardingTest extends TestCase
{
    /**
     * Test 1: Catálogo de planes SaaS públicos
     */
    public function test_catalogo_planes_publicos_retorna_planes_activos(): void
    {
        $response = $this->getJson('/api/v1/public/planes');

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);

        $planes = $response->json('datos');
        $this->assertNotEmpty($planes);

        $nombres = array_column($planes, 'nombre');
        $this->assertContains('Starter', $nombres);
        $this->assertContains('Enterprise', $nombres);
    }

    /**
     * Test 2: Validación Módulo 11 de RUC en inicio de registro
     */
    public function test_iniciar_registro_rechaza_ruc_con_digito_verificador_erroneo(): void
    {
        $payload = [
            'plan_id' => 2,
            'tipo_contribuyente' => 'RUC_20',
            'ruc' => '20123456789', // RUC no conforme a Módulo 11
            'razon_social' => 'Empresa Falsa SAC',
            'telefono' => '999111222',
            'nombre_propietario' => 'Juan Pérez',
            'correo' => 'juan.perez@falsa.pe',
            'password' => 'Secreto123!',
        ];

        $response = $this->postJson('/api/v1/public/registro/iniciar', $payload);

        $response->assertStatus(422);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'RUC_INVALIDO');
    }

    /**
     * Test 3: Rechazo de RUC ya existente en plataforma
     */
    public function test_iniciar_registro_rechaza_ruc_duplicado(): void
    {
        $payload = [
            'plan_id' => 2,
            'tipo_contribuyente' => 'RUC_20',
            'ruc' => '20612345678', // RUC de Áurea ya existente en la base de datos
            'razon_social' => 'Áurea Duplicado SAC',
            'telefono' => '999111222',
            'nombre_propietario' => 'Dueño Áurea',
            'correo' => 'dueno@aurea.local',
            'password' => 'Secreto123!',

        ];

        $response = $this->postJson('/api/v1/public/registro/iniciar', $payload);

        $response->assertStatus(409);
        $response->assertJsonPath('exito', false);
        $response->assertJsonPath('errores.0.codigo', 'RUC_YA_REGISTRADO');
    }

    private function limpiarEmpresa(?string $ruc = null, ?string $id = null): void
    {
        $query = DB::table('empresa');
        if ($id) {
            $query->where('id', $id);
        } elseif ($ruc) {
            $query->where('ruc', $ruc);
        } else {
            return;
        }

        $empresa = $query->first();
        if ($empresa) {
            DB::table('pago')->where('empresa_id', $empresa->id)->delete();
            DB::table('suscripcion')->where('empresa_id', $empresa->id)->delete();
            DB::table('usuario')->where('empresa_id', $empresa->id)->delete();
            DB::table('local')->where('empresa_id', $empresa->id)->delete();
            DB::table('empresa')->where('id', $empresa->id)->delete();
        }
    }

    /**
     * Test 4: Inicio de registro exitoso con RUC válido y despacho de OTP a Redis
     */
    public function test_iniciar_registro_exitoso_genera_sesion_en_redis(): void
    {
        // RUC oficial legítimo de Telefónica del Perú: 20100017491
        $rucValido = '20100017491';

        // Asegurar que no esté en la base de datos para la prueba
        $this->limpiarEmpresa($rucValido);

        $payload = [
            'plan_id' => 2,
            'tipo_contribuyente' => 'RUC_20',
            'ruc' => $rucValido,
            'razon_social' => 'Gastronomía Costa SAC',
            'telefono' => '999444333',
            'nombre_propietario' => 'Carlos Benavides',
            'correo' => 'carlos.benavides@costasac.pe',
            'password' => 'SecretoSeguro2026!',
        ];

        $response = $this->postJson('/api/v1/public/registro/iniciar', $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);

        $registroId = $response->json('datos.registro_id');
        $this->assertNotEmpty($registroId);

        // Verificar que Redis tiene la sesión y el código OTP
        $rawSession = Redis::get("registro:onboarding:{$registroId}");
        $this->assertNotNull($rawSession);

        $otp = Redis::get("registro:otp:{$registroId}");
        $this->assertNotNull($otp);
        $this->assertEquals(6, strlen($otp));
    }

    /**
     * Test 5: Verificación de OTP y creación real de Customer y SetupIntent en Stripe
     */
    public function test_verificar_otp_crea_cliente_y_setup_intent_en_stripe_real(): void
    {
        $rucValido = '20100047218';
        $this->limpiarEmpresa($rucValido);

        // 1. Iniciar registro
        $inicio = $this->postJson('/api/v1/public/registro/iniciar', [
            'plan_id' => 2,
            'tipo_contribuyente' => 'RUC_20',
            'ruc' => $rucValido,
            'razon_social' => 'Banco de Pruebas SAC',
            'telefono' => '988777666',
            'nombre_propietario' => 'Roberto Dueño',
            'correo' => 'roberto.dueno@bancopruebas.pe',
            'password' => 'PassSeguro2026!',
        ]);

        $registroId = $inicio->json('datos.registro_id');
        $otp = Redis::get("registro:otp:{$registroId}");

        // 2. Verificar OTP contra Stripe real
        $response = $this->postJson('/api/v1/public/registro/verificar-otp', [
            'registro_id' => $registroId,
            'otp' => $otp,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.correo_verificado', true);

        // Validar que retornó el client_secret real de Stripe para SetupIntent
        $clientSecret = $response->json('datos.stripe_client_secret');
        $this->assertNotNull($clientSecret);
        $this->assertStringStartsWith('seti_', $clientSecret);

        // Validar clave pública
        $publicKey = $response->json('datos.stripe_public_key');
        $this->assertEquals(config('services.stripe.key'), $publicKey);
    }

    /**
     * Test 6: Aprovisionamiento atómico corporativo con delimitación estricta (local_id = NULL)
     */
    public function test_provisionamiento_crea_empresa_suscripcion_usuario_y_manifiesto_minio(): void

    {
        $rucSintetico = '20999999991';

        // Limpiar registros previos si existieran
        $empresaPrevia = DB::table('empresa')->where('ruc', $rucSintetico)->first();
        if ($empresaPrevia) {
            DB::table('pago')->where('empresa_id', $empresaPrevia->id)->delete();
            DB::table('empresa')->where('id', $empresaPrevia->id)->delete();
        }


        $provisioning = app(TenantProvisioningService::class);
        $tenantStorage = app(TenantStorageService::class);

        $resultado = $provisioning->provisionar([
            'ruc' => $rucSintetico,
            'razon_social' => 'Pollería El Sabrosito SAC',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo' => 'sabrosito.propietario@test.pe',
            'nombre_propietario' => 'Manuel Gómez',
            'password' => 'Sabroso2026!',
            'telefono' => '987654321',
            'plan_id' => 2,
            'stripe_customer_id' => 'cus_test_dummy_123',
            'stripe_payment_id' => 'pi_test_dummy_456',
            'ignorar_modulo_11' => true,
        ]);

        $empresaId = $resultado['empresa']['id'];
        $usuarioId = $resultado['usuario']['id'];

        // 1. Verificar Empresa en BD
        $empresaBd = DB::table('empresa')->where('id', $empresaId)->first();
        $this->assertNotNull($empresaBd);
        $this->assertEquals('Pollería El Sabrosito SAC', $empresaBd->razon_social);
        $this->assertEquals('activa', $empresaBd->estado);

        // 2. Verificar Usuario Propietario en BD con local_id estrictamente NULL
        $usuarioBd = DB::table('usuario')->where('id', $usuarioId)->first();
        $this->assertNotNull($usuarioBd);
        $this->assertEquals('propietario', $usuarioBd->rol);
        $this->assertNull($usuarioBd->local_id, 'El propietario no debe tener local_id asignado en CU-PROP-01');
        $this->assertEquals($empresaId, $usuarioBd->empresa_id);

        // 3. Verificar Suscripción en BD
        $suscripcionBd = DB::table('suscripcion')->where('empresa_id', $empresaId)->first();
        $this->assertNotNull($suscripcionBd);
        $this->assertEquals('activa', $suscripcionBd->estado);
        $this->assertEquals(5, $suscripcionBd->dias_gracia_restantes);

        // 4. Verificar Registro de Pago en BD
        $pagoBd = DB::table('pago')->where('empresa_id', $empresaId)->first();
        $this->assertNotNull($pagoBd);
        $this->assertEquals('exitoso', $pagoBd->estado);
        $this->assertEquals('pi_test_dummy_456', $pagoBd->stripe_payment_id);

        // 5. Verificar que NO se crearon locales aún (reservado para CU-PROP-04)
        $localesCount = DB::table('local')->where('empresa_id', $empresaId)->count();
        $this->assertEquals(0, $localesCount, 'CU-PROP-01 no debe aprovisionar locales; eso corresponde a CU-PROP-04');

        // 6. Verificar Manifiesto de Espacio en MinIO S3
        $manifiesto = $tenantStorage->obtenerManifiestoTenant($empresaId);
        $this->assertNotNull($manifiesto);
        $this->assertEquals($empresaId, $manifiesto['empresa_id']);
        $this->assertStringContainsString("catalogo/empresas/{$empresaId}/", $manifiesto['prefijos_asignados']['catalogo']);

        // Limpieza de datos de prueba
        $this->limpiarEmpresa(id: $empresaId);
    }
}

