<?php

namespace Tests\Feature\Saas;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class SaasTenantControllerTest extends TestCase
{
    private string $testRuc = '20603849206';
    private string $testEmail = 'titular.controller.b2b@puertomarino.pe';
    private string $tokenSaas;
    private string $tokenProp;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Sesión de prueba en Redis para SuperAdmin SaaS
        $adminSaas = DB::table('usuario')->where('rol', 'admin_saas')->first();
        $adminId = $adminSaas ? $adminSaas->id : (string) Str::uuid();

        $rawTokenSaas = 'test_token_saas_' . Str::random(32);
        $tokenHashSaas = hash('sha256', $rawTokenSaas);

        Redis::setex("auth:session:{$tokenHashSaas}", 3600, json_encode([
            'id' => $adminId,
            'nombre' => 'Super Administrador SaaS',
            'correo' => 'admin@restaurantcloud.pe',
            'rol' => 'admin_saas',
            'empresa_id' => null,
            'local_id' => null,
            'estado' => 'activo',
        ]));
        $this->tokenSaas = $rawTokenSaas;

        // 2. Sesión no autorizada (rol propietario)
        $rawTokenProp = 'test_token_prop_' . Str::random(32);
        $tokenHashProp = hash('sha256', $rawTokenProp);

        Redis::setex("auth:session:{$tokenHashProp}", 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000101',
            'nombre' => 'Rodrigo De Las Casas',
            'correo' => 'propietario@aurea.local',
            'rol' => 'propietario',
            'empresa_id' => '00000000-0000-4000-8000-000000000001',
            'local_id' => null,
            'estado' => 'activo',
        ]));
        $this->tokenProp = $rawTokenProp;

        $this->limpiarDatosPrueba();
    }

    protected function tearDown(): void
    {
        $this->limpiarDatosPrueba();
        parent::tearDown();
    }

    private function limpiarDatosPrueba(): void
    {
        $empresa = DB::table('empresa')->where('ruc', $this->testRuc)->first();
        if ($empresa) {
            DB::table('pago')->where('empresa_id', $empresa->id)->delete();
            DB::table('local')->where('empresa_id', $empresa->id)->delete();
            DB::table('usuario')->where('empresa_id', $empresa->id)->delete();
            DB::table('suscripcion')->where('empresa_id', $empresa->id)->delete();
            DB::table('empresa')->where('id', $empresa->id)->delete();
        }

        DB::table('usuario')->where('correo', $this->testEmail)->delete();
    }

    private function headersSaas(): array
    {
        return [
            'Authorization' => "Bearer {$this->tokenSaas}",
            'Accept' => 'application/json',
        ];
    }

    private function headersProp(): array
    {
        return [
            'Authorization' => "Bearer {$this->tokenProp}",
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test 1: Rechazo de acceso a usuarios sin rol admin_saas (403)
     */
    public function test_usuario_no_saas_es_rechazado_con_403(): void
    {
        $response = $this->getJson('/api/v1/saas/tenants', $this->headersProp());

        $response->assertStatus(403);
        $response->assertJsonPath('exito', false);
    }

    /**
     * Test 2: Admin SaaS puede listar tenants y consultar métricas consolidadas
     */
    public function test_admin_saas_puede_listar_tenants_y_metricas(): void
    {
        $response = $this->getJson('/api/v1/saas/tenants', $this->headersSaas());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);

        // Validar KPIs de plataforma
        $metricas = $response->json('datos.metricas');
        $this->assertNotNull($metricas);
        $this->assertArrayHasKey('total_empresas', $metricas);
        $this->assertArrayHasKey('mrr_total_pen', $metricas);
        $this->assertArrayHasKey('suscripciones_activas', $metricas);
        $this->assertArrayHasKey('sedes_operativas_totales', $metricas);

        // Validar listado de tenants
        $tenants = $response->json('datos.tenants');
        $this->assertIsArray($tenants);
        $this->assertNotEmpty($tenants);
        $this->assertArrayHasKey('empresa_id', $tenants[0]);
        $this->assertArrayHasKey('razon_social', $tenants[0]);
        $this->assertArrayHasKey('ruc', $tenants[0]);
        $this->assertArrayHasKey('plan_nombre', $tenants[0]);
    }

    /**
     * Test 3: Validación sintáctica de campos en alta manual (422)
     */
    public function test_alta_manual_valida_campos_requeridos_y_monto(): void
    {
        $payloadInvalido = [
            'ruc' => '20603849206',
            'razon_social' => '', // Inválido
            'direccion_sede' => 'Calle 1',
            'propietario_nombre' => 'Test',
            'propietario_email' => 'correo-invalido', // Inválido
            'propietario_telefono' => '+51 987654321',
            'plan_id' => 2,
            'ciclo_facturacion' => 'anual',
            'monto_cobrado_pen' => 0.0, // Inválido <= 0
            'origen_pago' => 'transferencia_bancaria',
            'numero_operacion' => '', // Inválido
        ];

        $response = $this->postJson('/api/v1/saas/tenants/alta-manual', $payloadInvalido, $this->headersSaas());

        $response->assertStatus(422);
        $response->assertJsonPath('exito', false);
    }

    /**
     * Test 4: Alta manual B2B exitosa completa contra PostgreSQL y capability token en Redis
     */
    public function test_alta_manual_exitosa_crea_tenant_y_capability_token(): void
    {
        $payload = [
            'ruc' => $this->testRuc,
            'razon_social' => 'Cevichería Puerto Marino S.A.C.',
            'direccion_sede' => 'Av. Primavera 450, Santiago de Surco, Lima',
            'propietario_nombre' => 'Jorge Medina Castro',
            'propietario_email' => $this->testEmail,
            'propietario_telefono' => '+51 991 882 334',
            'plan_id' => 2,
            'ciclo_facturacion' => 'anual',
            'monto_cobrado_pen' => 800.0,
            'origen_pago' => 'transferencia_bancaria',
            'numero_operacion' => 'OP-90481239-BCP',
            'nota_administrativa' => 'Abono anual confirmado en BCP por tesorería.',
            'enviar_email_bienvenida' => true,
        ];

        $response = $this->postJson('/api/v1/saas/tenants/alta-manual', $payload, $this->headersSaas());

        $response->assertStatus(201);
        $response->assertJsonPath('exito', true);

        $datos = $response->json('datos');
        $this->assertNotEmpty($datos['empresa_id']);
        $this->assertNotEmpty($datos['invitacion_token']);
        $this->assertStringContainsString('/activar-cuenta?token=', $datos['invitacion_url']);

        $empresaId = $datos['empresa_id'];
        $token = $datos['invitacion_token'];

        // Verificar que no se creó sede ficticia en PostgreSQL
        $this->assertEquals(0, DB::table('local')->where('empresa_id', $empresaId)->count());

        // 5. Test de Expediente 360° (Vista 2)
        $resDetalle = $this->getJson("/api/v1/saas/tenants/{$empresaId}", $this->headersSaas());
        $resDetalle->assertStatus(200);
        $resDetalle->assertJsonPath('exito', true);
        $resDetalle->assertJsonPath('datos.ruc', $this->testRuc);
        $resDetalle->assertJsonPath('datos.propietario_titular.nombre', 'Jorge Medina Castro');
        $resDetalle->assertJsonPath('datos.plan.nombre', 'Pro');
        $this->assertNotEmpty($resDetalle->json('datos.historial_pagos'));

        // 6. Test de Reenvío / Renovación de Capability Token
        $resNotificar = $this->postJson("/api/v1/saas/tenants/{$empresaId}/notificar-cobro", [], $this->headersSaas());
        $resNotificar->assertStatus(200);
        $resNotificar->assertJsonPath('exito', true);
        $this->assertNotEmpty($resNotificar->json('datos.invitacion_token'));

        // 7. Test de Suspensión Preventiva
        $resSuspender = $this->postJson("/api/v1/saas/tenants/{$empresaId}/suspender", [], $this->headersSaas());
        $resSuspender->assertStatus(200);
        $resSuspender->assertJsonPath('datos.estado', 'suspendida');

        $empresaBd = DB::table('empresa')->where('id', $empresaId)->first();
        $this->assertEquals('suspendida', $empresaBd->estado);
    }
}
