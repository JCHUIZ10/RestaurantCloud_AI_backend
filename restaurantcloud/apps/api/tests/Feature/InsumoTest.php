<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class InsumoTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $adminId = '00000000-0000-4000-8000-000000000102';
    private string $adminCorreo = 'admin@aurea.local';
    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        // Autenticación en Redis para admin_local
        $rawToken = 'test_token_admin_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => $this->adminCorreo,
            'rol' => 'admin_local',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenAdmin = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenAdmin,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test 1: Listado de insumos retorna estructura esperada con KPIs y semáforo.
     */
    public function test_listado_insumos_retorna_kpis_y_estructura_correcta(): void
    {
        $response = $this->getJson('/api/v1/admin/insumos', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'local_id',
                'local_nombre',
                'kpis' => [
                    'total_activos',
                    'total_agotados',
                    'total_inactivos',
                    'valorizacion_total',
                ],
                'filtro_actual',
                'insumos',
                'paginacion' => [
                    'total',
                    'pagina',
                    'limite',
                    'total_paginas',
                ],
            ],
        ]);
        $this->assertTrue($response->json('exito'));
    }

    /**
     * Test 2: Alta ágil de insumo nuevo con unidad canónica.
     */
    public function test_crear_insumo_exitoso(): void
    {
        $nombre = 'Cebolla Roja ' . Str::random(6);
        $payload = [
            'nombre' => $nombre,
            'unidad_medida' => 'kg',
            'stock_actual' => 15.5,
            'stock_minimo' => 5.0,
            'costo_unitario' => 3.20,
        ];

        $response = $this->postJson('/api/v1/admin/insumos', $payload, $this->headers());

        $response->assertStatus(201);
        $response->assertJsonPath('datos.nombre', $nombre);
        $response->assertJsonPath('datos.unidad_medida', 'kg');
        $response->assertJsonPath('datos.stock_actual', 15.5);
        $response->assertJsonPath('datos.nivel_semaforo', 'optimo');

        // Limpieza
        DB::table('insumo')->where('id', $response->json('datos.id'))->delete();
    }

    /**
     * Test 3: Duplicidad de nombre en la misma sede es rechazada con 409 Conflict.
     */
    public function test_crear_insumo_duplicado_rechaza_con_409(): void
    {
        $nombre = 'Ajo Molido ' . Str::random(6);
        $payload = [
            'nombre' => $nombre,
            'unidad_medida' => 'kg',
            'stock_actual' => 10,
            'stock_minimo' => 2,
            'costo_unitario' => 8.50,
        ];

        $res1 = $this->postJson('/api/v1/admin/insumos', $payload, $this->headers());
        $res1->assertStatus(201);
        $insumoId = $res1->json('datos.id');

        // Intentar crear con mismo nombre (insensible a mayúsculas)
        $payload['nombre'] = strtolower($nombre);
        $res2 = $this->postJson('/api/v1/admin/insumos', $payload, $this->headers());
        $res2->assertStatus(409);

        DB::table('insumo')->where('id', $insumoId)->delete();
    }

    /**
     * Test 4: Unidad no permitida fuera del catálogo de 10 es rechazada con 422.
     */
    public function test_crear_insumo_unidad_invalida_rechaza_con_422(): void
    {
        $payload = [
            'nombre' => 'Insumo Unidad Rara ' . Str::random(6),
            'unidad_medida' => 'tonelada_metrica', // No válida
            'stock_actual' => 1,
            'stock_minimo' => 1,
            'costo_unitario' => 10,
        ];

        $response = $this->postJson('/api/v1/admin/insumos', $payload, $this->headers());
        $response->assertStatus(422);
    }

    /**
     * Test 5: Ajuste físico de stock ejecuta la función PL/pgSQL y genera auditoría.
     */
    public function test_ajustar_stock_ejecuta_funcion_sql_y_audita(): void
    {
        // 1. Crear insumo de prueba
        $nombre = 'Cilantro ' . Str::random(6);
        $resCrear = $this->postJson('/api/v1/admin/insumos', [
            'nombre' => $nombre,
            'unidad_medida' => 'kg',
            'stock_actual' => 10.0,
            'stock_minimo' => 4.0,
            'costo_unitario' => 2.50,
        ], $this->headers());

        $insumoId = $resCrear->json('datos.id');

        // 2. Ajustar stock a 6.5 kg por merma
        $resAjuste = $this->postJson("/api/v1/admin/insumos/{$insumoId}/ajuste", [
            'stock_fisico' => 6.5,
            'motivo' => 'merma_desperdicio',
            'notas' => 'Hojas marchitas descartadas en apertura',
        ], $this->headers());

        $resAjuste->assertStatus(200);
        $resAjuste->assertJsonPath('datos.stock_anterior', 10);
        $resAjuste->assertJsonPath('datos.stock_nuevo', 6.5);
        $resAjuste->assertJsonPath('datos.diferencia', -3.5);
        $resAjuste->assertJsonPath('datos.estado_resultante', 'activo');

        // 3. Verificar que se insertó en auditoria_stock_ajuste
        $auditoriaId = $resAjuste->json('datos.auditoria_id');
        $this->assertNotNull($auditoriaId);
        $registroAuditoria = DB::table('auditoria_stock_ajuste')->where('id', $auditoriaId)->first();
        $this->assertNotNull($registroAuditoria);
        $this->assertEquals('merma_desperdicio', $registroAuditoria->motivo);
        $this->assertEquals(-3.5, (float) $registroAuditoria->diferencia);

        // 4. Ajustar a 0 para verificar estado agotado
        $resCero = $this->postJson("/api/v1/admin/insumos/{$insumoId}/ajuste", [
            'stock_fisico' => 0,
            'motivo' => 'conteo_fisico_inventario',
            'notas' => 'Stock consumido por completo',
        ], $this->headers());

        $resCero->assertStatus(200);
        $resCero->assertJsonPath('datos.estado_resultante', 'agotado');

        // Limpieza
        DB::table('auditoria_stock_ajuste')->where('insumo_id', $insumoId)->delete();
        DB::table('insumo')->where('id', $insumoId)->delete();
    }

    /**
     * Test 6: Conmutar estado de insumo manualmente.
     */
    public function test_conmutar_estado_insumo(): void
    {
        $nombre = 'Ají Panca ' . Str::random(6);
        $resCrear = $this->postJson('/api/v1/admin/insumos', [
            'nombre' => $nombre,
            'unidad_medida' => 'kg',
            'stock_actual' => 5.0,
            'stock_minimo' => 2.0,
            'costo_unitario' => 6.00,
        ], $this->headers());

        $insumoId = $resCrear->json('datos.id');

        $resEstado = $this->patchJson("/api/v1/admin/insumos/{$insumoId}/estado", [
            'estado' => 'inactivo',
        ], $this->headers());

        $resEstado->assertStatus(200);
        $resEstado->assertJsonPath('datos.estado', 'inactivo');

        DB::table('insumo')->where('id', $insumoId)->delete();
    }
}
