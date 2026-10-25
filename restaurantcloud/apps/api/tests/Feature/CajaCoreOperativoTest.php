<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class CajaCoreOperativoTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $cajeroId = '00000000-0000-4000-8000-000000000105';
    private string $mozoId = '00000000-0000-4000-8000-000000000104';
    private string $cocineroId = '00000000-0000-4000-8000-000000000106';
    private string $tokenCajero;
    private string $tokenMozo;
    private string $tokenCocina;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_caja_core_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->cajeroId,
            'nombre' => 'Lucía Quispe',
            'correo' => 'lucia.quispe@aurea.local',
            'rol' => 'cajero',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenCajero = $rawToken;

        $rawMozo = 'test_token_mozo_' . Str::random(32);
        $tokenHashMozo = hash('sha256', $rawMozo);
        Redis::setex("auth:session:{$tokenHashMozo}", 3600, json_encode([
            'id' => $this->mozoId,
            'nombre' => 'Carlos Mendoza',
            'correo' => 'carlos.mozo@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));
        $this->tokenMozo = $rawMozo;

        $rawCocina = 'test_token_cocina_' . Str::random(32);
        $tokenHashCocina = hash('sha256', $rawCocina);
        Redis::setex("auth:session:{$tokenHashCocina}", 3600, json_encode([
            'id' => $this->cocineroId,
            'nombre' => 'Chef Marco',
            'correo' => 'marco.cocina@aurea.local',
            'rol' => 'cocinero',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));
        $this->tokenCocina = $rawCocina;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenCajero,
            'Accept' => 'application/json',
        ];
    }

    private function headersMozo(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenMozo,
            'Accept' => 'application/json',
        ];
    }

    private function headersCocina(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenCocina,
            'Accept' => 'application/json',
        ];
    }

    private function cerrarCajasAbiertas(): void
    {
        DB::table('caja')
            ->where('local_id', $this->localId)
            ->where('estado', 'abierta')
            ->update([
                'estado' => 'cerrada',
                'fecha_cierre' => now(),
                'updated_at' => now(),
            ]);
    }

    private function limpiarPedidosActivos(): void
    {
        DB::table('pedido')
            ->where('local_id', $this->localId)
            ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->update(['estado' => 'cobrado', 'updated_at' => now()]);
    }

    public function test_estado_sesion_retorna_caja_cerrada_o_abierta(): void
    {
        $this->cerrarCajasAbiertas();

        $res = $this->getJson('/api/v1/caja/estado-sesion', $this->headers());
        $res->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'estado_caja' => 'cerrada',
                    'puede_abrir' => true,
                ],
            ]);
    }

    public function test_apertura_turno_y_bloqueo_409_por_turno_abierto(): void
    {
        $this->cerrarCajasAbiertas();

        // 1. Apertura inicial exitosa
        $resApertura = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 350.00,
            'notas_apertura' => 'Fondo inicial verificado en gaveta',
        ], $this->headers());

        $resApertura->assertStatus(201)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'estado' => 'abierta',
                    'monto_apertura' => 350.00,
                ],
            ]);

        $cajaId = $resApertura->json('datos.id');
        $this->assertNotNull($cajaId);

        // 2. Intento de segunda apertura con turno activo (409 Conflict)
        $resConflicto = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 100.00,
        ], $this->headers());

        $resConflicto->assertStatus(409)
            ->assertJson([
                'exito' => false,
                'errores' => [
                    ['codigo' => 'ERR_TURNO_PREVIO_NO_CERRADO'],
                ],
            ]);
    }

    public function test_balance_pre_arqueo_calcula_efectivo_y_estado_salon(): void
    {
        $this->cerrarCajasAbiertas();
        $this->limpiarPedidosActivos();

        // Aperturar caja con 200.00
        $apertura = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 200.00,
        ], $this->headers());
        $cajaId = $apertura->json('datos.id');

        // Insertar comprobante efectivo de 80.00
        $serie = 'B001';
        $corr = rand(10000, 99999);
        DB::table('comprobante')->insert([
            'id' => (string) Str::uuid(),
            'caja_id' => $cajaId,
            'tipo' => 'boleta',
            'serie' => $serie,
            'correlativo' => $corr,
            'nombre_cliente' => 'Cliente Efectivo Test',
            'medio_pago' => 'efectivo',
            'subtotal_consumo' => 80.00,
            'total' => 80.00,
            'base_imponible' => 67.80,
            'igv' => 12.20,
            'token_qr' => (string) Str::uuid(),
            'estado' => 'emitido',
            'fecha' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insertar comprobante tarjeta de 120.00
        DB::table('comprobante')->insert([
            'id' => (string) Str::uuid(),
            'caja_id' => $cajaId,
            'tipo' => 'factura',
            'serie' => 'F001',
            'correlativo' => rand(10000, 99999),
            'nombre_cliente' => 'Empresa Tarjeta Test',
            'documento_cliente' => '20601234567',
            'medio_pago' => 'tarjeta',
            'subtotal_consumo' => 120.00,
            'total' => 120.00,
            'base_imponible' => 101.69,
            'igv' => 18.31,
            'token_qr' => (string) Str::uuid(),
            'estado' => 'emitido',
            'fecha' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $resBalance = $this->getJson('/api/v1/caja/balance-pre-arqueo', $this->headers());
        $resBalance->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_id' => $cajaId,
                    'monto_apertura' => 200.00,
                    'ingresos_efectivo' => 80.00,
                    'efectivo_esperado' => 280.00,
                    'tarjetas_pos_total' => 120.00,
                    'tarjetas_operaciones' => 1,
                    'total_comprobantes' => 2,
                    'mesas_activas_pendientes' => 0,
                    'salon_al_dia' => true,
                ],
            ]);
    }

    public function test_bloqueo_poka_yoke_cierre_con_mesas_activas_retorna_409(): void
    {
        $this->cerrarCajasAbiertas();
        $this->limpiarPedidosActivos();

        $apertura = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 300.00,
        ], $this->headers());
        $this->assertEquals(201, $apertura->status());

        // Obtener una mesa existente en este local
        $mesa = DB::table('mesa')->where('local_id', $this->localId)->first();
        $this->assertNotNull($mesa);

        // Crear un pedido activo en estado cuenta_pedida
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'numero_comanda' => rand(100, 999),
            'mesa_id' => $mesa->id,
            'mozo_id' => $this->cajeroId,
            'estado' => 'cuenta_pedida',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $resCierre = $this->postJson('/api/v1/caja/cierre', [
            'monto_real_fisico' => 300.00,
        ], $this->headers());

        $resCierre->assertStatus(409)
            ->assertJson([
                'exito' => false,
                'errores' => [
                    ['codigo' => 'ERR_SALON_CON_MESAS_ACTIVAS'],
                ],
            ]);

        // Marcar el pedido como cobrado para liberar el salón
        DB::table('pedido')->where('id', $pedidoId)->delete();
    }

    public function test_discrepancia_sin_justificar_retorna_422(): void
    {
        $this->cerrarCajasAbiertas();
        $this->limpiarPedidosActivos();

        $apertura = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 300.00,
        ], $this->headers());
        $this->assertEquals(201, $apertura->status());

        // Efectivo esperado = 300, físico enviado = 285 (-15 discrepancia), sin justificación
        $resDiscrepancia = $this->postJson('/api/v1/caja/cierre', [
            'monto_real_fisico' => 285.00,
            'comentario_discrepancia' => '', // Inválido (< 10 chars)
        ], $this->headers());

        $resDiscrepancia->assertStatus(422)
            ->assertJson([
                'exito' => false,
                'errores' => [
                    ['codigo' => 'ERR_DISCREPANCIA_SIN_JUSTIFICAR'],
                ],
            ]);
    }

    public function test_cierre_turno_exitoso_genera_reporte_z_y_auditoria(): void
    {
        $this->cerrarCajasAbiertas();
        $this->limpiarPedidosActivos();

        $apertura = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 300.00,
        ], $this->headers());
        $cajaId = $apertura->json('datos.id');

        // Cierre con discrepancia justificada válidamente (>= 10 caracteres)
        $resCierre = $this->postJson('/api/v1/caja/cierre', [
            'monto_real_fisico' => 320.00,
            'comentario_discrepancia' => 'Sobrante por propina voluntaria dejada en efectivo',
            'notas_cierre' => 'Turno tarde entregado conforme a cajero entrante.',
        ], $this->headers());

        $resCierre->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_id' => $cajaId,
                    'monto_apertura' => 300.00,
                    'efectivo_esperado' => 300.00,
                    'efectivo_real_contado' => 320.00,
                    'discrepancia' => 20.00,
                ],
            ]);

        // Verificar que la caja quedó cerrada en PostgreSQL
        $cajaDB = DB::table('caja')->where('id', $cajaId)->first();
        $this->assertEquals('cerrada', $cajaDB->estado);
        $this->assertNotNull($cajaDB->fecha_cierre);

        // Verificar auditoría persistida
        $audit = DB::table('auditoria_caja_cierre')->where('caja_id', $cajaId)->first();
        $this->assertNotNull($audit);

        // Consultar último Reporte Z
        $resUltimoZ = $this->getJson('/api/v1/caja/ultimo-reporte-z', $this->headers());
        $resUltimoZ->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_id' => $cajaId,
                    'discrepancia' => 20.00,
                ],
            ]);

        // Consultar Reporte Z especifico por ID
        $resPorId = $this->getJson('/api/v1/caja/turnos/' . $cajaId . '/reporte-z', $this->headers());
        $resPorId->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_id' => $cajaId,
                    'discrepancia' => 20.00,
                ],
            ]);

        // Verificar que el PDF se generó y guardó en MinIO (bucket privado reportes-z) y tabla archivo
        $archivo = DB::table('archivo')
            ->where('entidad_tipo', 'caja_cierre')
            ->where('entidad_id', $cajaId)
            ->first();
        $this->assertNotNull($archivo);
        $this->assertEquals('disponible', $archivo->estado);
        $this->assertStringContainsString('reportes-z', $archivo->object_key);
        $this->assertTrue(Storage::disk('s3')->exists($archivo->object_key));

        // Verificar endpoint de streaming de descarga del Reporte Z
        $resPdf = $this->get('/api/v1/caja/turnos/' . $cajaId . '/reporte-z/pdf', $this->headers());
        $resPdf->assertStatus(200);
        $this->assertEquals('application/pdf', $resPdf->headers->get('content-type'));
    }

    public function test_salon_y_cocina_reportan_caja_cerrada_y_bloquean_operacion_cuando_no_hay_caja_abierta(): void
    {
        $this->cerrarCajasAbiertas();
        $this->limpiarPedidosActivos();

        // 1. Mozo consulta el plano: debe reportar caja_abierta = false
        $resPlano = $this->getJson('/api/v1/mozo/plano', $this->headersMozo());
        $resPlano->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_abierta' => false,
                ],
            ]);

        // 2. Cocina consulta configuración: debe reportar caja_abierta = false
        $resCocina = $this->getJson('/api/v1/cocina/configuracion', $this->headersCocina());
        $resCocina->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_abierta' => false,
                ],
            ]);

        // 3. Mozo intenta abrir una mesa: debe ser rechazado con 409 ERR_CAJA_NO_ABIERTA
        $mesa = DB::table('mesa')->where('local_id', $this->localId)->first();
        $this->assertNotNull($mesa);

        $resAbrir = $this->postJson("/api/v1/mozo/mesas/{$mesa->id}/abrir", [
            'comensales' => 2,
        ], $this->headersMozo());

        $resAbrir->assertStatus(409)
            ->assertJson([
                'exito' => false,
                'errores' => [
                    ['codigo' => 'ERR_CAJA_NO_ABIERTA'],
                ],
            ]);
    }

    public function test_salon_y_cocina_reportan_caja_abierta_y_permiten_operacion_cuando_caja_esta_abierta(): void
    {
        $this->cerrarCajasAbiertas();
        $this->limpiarPedidosActivos();

        // 1. Cajero apertura caja
        $resApertura = $this->postJson('/api/v1/caja/apertura', [
            'monto_apertura' => 200.00,
        ], $this->headers());
        $this->assertEquals(201, $resApertura->status());

        // 2. Mozo consulta plano: caja_abierta = true
        $resPlano = $this->getJson('/api/v1/mozo/plano', $this->headersMozo());
        $resPlano->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_abierta' => true,
                ],
            ]);

        // 3. Cocina consulta configuracion: caja_abierta = true
        $resCocina = $this->getJson('/api/v1/cocina/configuracion', $this->headersCocina());
        $resCocina->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'caja_abierta' => true,
                ],
            ]);

        // 4. Mozo puede abrir mesa normalmente
        $mesa = DB::table('mesa')->where('local_id', $this->localId)->first();
        $resAbrir = $this->postJson("/api/v1/mozo/mesas/{$mesa->id}/abrir", [
            'comensales' => 2,
        ], $this->headersMozo());

        $resAbrir->assertStatus(201);

        // Limpieza de pedido
        $this->limpiarPedidosActivos();
    }
}
