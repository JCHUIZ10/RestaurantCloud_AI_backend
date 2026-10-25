<?php

namespace Tests\Feature\Saas;

use App\Domains\Tenant\Services\TenantProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class TenantProvisioningAltaManualTest extends TestCase
{
    private string $testRuc = '20603849206';
    private string $testEmail = 'titular.b2b.test@puertomarino.pe';

    protected function setUp(): void
    {
        parent::setUp();
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

    /**
     * Test 1: Rechazo de RUC que no cumple con el algoritmo Módulo 11 de SUNAT
     */
    public function test_alta_manual_rechaza_ruc_con_modulo_11_invalido(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Módulo 11');

        $service = app(TenantProvisioningService::class);
        $service->provisionarAltaManual([
            'ruc' => '20123456789', // Inválido
            'razon_social' => 'Cevichería Puerto Marino S.A.C.',
            'direccion_sede' => 'Av. Primavera 450, Santiago de Surco, Lima',
            'propietario_nombre' => 'Jorge Medina Castro',
            'propietario_email' => $this->testEmail,
            'propietario_telefono' => '+51 991 882 334',
            'plan_id' => 2,
            'ciclo_facturacion' => 'anual',
            'monto_cobrado_pen' => 800.0,
            'numero_operacion' => 'OP-90481239-BCP',
        ]);
    }

    /**
     * Test 2: Rechazo de alta manual sin respaldo económico (monto <= 0)
     */
    public function test_alta_manual_rechaza_monto_cero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('El monto debe ser mayor a 0');

        $service = app(TenantProvisioningService::class);
        $service->provisionarAltaManual([
            'ruc' => $this->testRuc,
            'razon_social' => 'Cevichería Puerto Marino S.A.C.',
            'direccion_sede' => 'Av. Primavera 450, Santiago de Surco, Lima',
            'propietario_nombre' => 'Jorge Medina Castro',
            'propietario_email' => $this->testEmail,
            'propietario_telefono' => '+51 991 882 334',
            'plan_id' => 2,
            'ciclo_facturacion' => 'anual',
            'monto_cobrado_pen' => 0.0,
            'numero_operacion' => 'OP-90481239-BCP',
        ]);
    }

    /**
     * Test 3: Rechazo de alta manual sin número de operación bancaria
     */
    public function test_alta_manual_rechaza_sin_numero_operacion(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('número de operación bancaria es obligatorio');

        $service = app(TenantProvisioningService::class);
        $service->provisionarAltaManual([
            'ruc' => $this->testRuc,
            'razon_social' => 'Cevichería Puerto Marino S.A.C.',
            'direccion_sede' => 'Av. Primavera 450, Santiago de Surco, Lima',
            'propietario_nombre' => 'Jorge Medina Castro',
            'propietario_email' => $this->testEmail,
            'propietario_telefono' => '+51 991 882 334',
            'plan_id' => 2,
            'ciclo_facturacion' => 'anual',
            'monto_cobrado_pen' => 800.0,
            'numero_operacion' => '',
        ]);
    }

    /**
     * Test 4: Aprovisionamiento atómico completo con capability token en Redis
     */
    public function test_alta_manual_provisiona_ecosistema_completo_y_capability_token_redis(): void
    {
        $service = app(TenantProvisioningService::class);

        $resultado = $service->provisionarAltaManual([
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
            'nota_administrativa' => 'Abono verificado por Tesorería Central en cuenta BCP.',
            'enviar_email_bienvenida' => true,
        ]);

        // 1. Validar DTO devuelto
        $this->assertNotEmpty($resultado['empresa_id']);
        $this->assertNotEmpty($resultado['usuario_id']);
        $this->assertNotEmpty($resultado['pago_id']);
        $this->assertNotEmpty($resultado['invitacion_token']);
        $this->assertStringContainsString('/activar-cuenta?token=', $resultado['invitacion_url']);
        $this->assertTrue($resultado['email_enviado']);

        $empresaId = $resultado['empresa_id'];
        $usuarioId = $resultado['usuario_id'];
        $token = $resultado['invitacion_token'];

        // 2. Verificar Empresa en PostgreSQL
        $empresa = DB::table('empresa')->where('id', $empresaId)->first();
        $this->assertNotNull($empresa);
        $this->assertEquals($this->testRuc, $empresa->ruc);
        $this->assertEquals('Cevichería Puerto Marino S.A.C.', $empresa->razon_social);
        $this->assertEquals('manual_admin', $empresa->origen_alta);
        $this->assertEquals('activa', $empresa->estado);
        $this->assertEquals(2, $empresa->plan_id);

        // 3. Verificar que NO se crean sedes ficticias por defecto (el titular la creará en /propietario/sedes)
        $localesConteo = DB::table('local')->where('empresa_id', $empresaId)->count();
        $this->assertEquals(0, $localesConteo);

        // 4. Verificar Suscripción en PostgreSQL
        $suscripcion = DB::table('suscripcion')->where('empresa_id', $empresaId)->first();
        $this->assertNotNull($suscripcion);
        $this->assertEquals(2, $suscripcion->plan_id);
        $this->assertEquals('activa', $suscripcion->estado);
        $this->assertEquals(5, $suscripcion->dias_gracia_restantes);

        // 5. Verificar Usuario Propietario en PostgreSQL (pendiente_activacion, local_id = NULL)
        $usuario = DB::table('usuario')->where('id', $usuarioId)->first();
        $this->assertNotNull($usuario);
        $this->assertEquals('propietario', $usuario->rol);
        $this->assertEquals('pendiente_activacion', $usuario->estado);
        $this->assertNull($usuario->local_id);
        $this->assertEquals($this->testEmail, $usuario->correo);

        // 6. Verificar Pago asentado en PostgreSQL
        $pago = DB::table('pago')->where('id', $resultado['pago_id'])->first();
        $this->assertNotNull($pago);
        $this->assertEquals('exitoso', $pago->estado);
        $this->assertEquals(800.0, (float) $pago->monto);
        $this->assertEquals('transferencia_bancaria', $pago->origen_pago);
        $this->assertEquals('OP-90481239-BCP', $pago->numero_operacion);

        // 7. Verificar Capability Token de 72 horas en Redis
        $redisRaw = Redis::get("invitacion:admin:{$token}");
        $this->assertNotNull($redisRaw, 'El token debe existir en Redis bajo invitacion:admin:{token}');
        $redisData = json_decode($redisRaw, true);
        $this->assertEquals($usuarioId, $redisData['usuario_id']);
        $this->assertEquals($empresaId, $redisData['empresa_id']);
        $this->assertEquals('propietario', $redisData['rol']);
        $this->assertEquals($this->testEmail, $redisData['correo']);

        $ttl = Redis::ttl("invitacion:admin:{$token}");
        $this->assertGreaterThan(250000, $ttl, 'El token debe tener un TTL de ~72 horas (259200s)');

        // 8. Verificar que el endpoint público de validar token reconozca al nuevo titular
        $resValidar = $this->getJson("/api/v1/public/activar-cuenta/validar?token={$token}");
        $resValidar->assertStatus(200);
        $resValidar->assertJsonPath('exito', true);
        $resValidar->assertJsonPath('datos.valido', true);
        $resValidar->assertJsonPath('datos.usuario.nombre', 'Jorge Medina Castro');
        $resValidar->assertJsonPath('datos.usuario.correo', $this->testEmail);
        $resValidar->assertJsonPath('datos.empresa.nombre', 'Cevichería Puerto Marino S.A.C.');
    }
}
