<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class CocinaStockDeduccionTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $adminId = '00000000-0000-4000-8000-000000000102';
    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_kds_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => 'admin@aurea.local',
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

    private function crearInsumoTest(string $nombre, float $stock, string $unidad = 'kg'): string
    {
        $id = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'nombre' => $nombre . ' ' . Str::random(6),
            'unidad_medida' => $unidad,
            'stock_actual' => $stock,
            'stock_minimo' => 1.0,
            'costo_unitario' => 10.0,
            'estado' => $stock > 0 ? 'activo' : 'agotado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    private function crearMesaTest(): string
    {
        $piso = DB::table('piso')->where('local_id', $this->localId)->first();
        $mesaId = (string) Str::uuid();

        DB::table('mesa')->insert([
            'id' => $mesaId,
            'local_id' => $this->localId,
            'piso_id' => $piso->id,
            'numero' => rand(500, 9999),
            'capacidad' => 4,
            'estado' => 'activa',
            'posicion_x' => 10,
            'posicion_y' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function crearProductoConReceta(string $nombre, array $recetaItems, bool $requierePrep = true): string
    {
        $categoria = DB::table('categoria_producto')->where('local_id', $this->localId)->first();
        $productoId = (string) Str::uuid();

        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => $nombre . ' ' . Str::random(6),
            'precio' => 35.0,
            'requiere_preparacion' => $requierePrep,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($recetaItems as $item) {
            DB::table('producto_insumo')->insert([
                'producto_id' => $productoId,
                'insumo_id' => $item['insumo_id'],
                'modo_calculo' => $item['modo_calculo'] ?? 'exacto',
                'rendimiento_platos' => $item['rendimiento_platos'] ?? null,
                'cantidad_descuenta' => $item['cantidad_descuenta'],
            ]);
        }

        return $productoId;
    }

    private function crearPedidoConItem(string $productoId, int $cantidad = 1, string $estado = 'en_preparacion'): array
    {
        $mesaId = $this->crearMesaTest();
        $pedidoId = (string) Str::uuid();

        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'numero_comanda' => rand(1000, 9999),
            'mesa_id' => $mesaId,
            'mozo_id' => $this->adminId,
            'estado' => 'enviado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => 35.0,
            'estado' => $estado,
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['pedido_id' => $pedidoId, 'item_id' => $itemId];
    }

    /**
     * Test 1: Cambiar item a 'listo' descuenta insumos exactamente y marca stock_descontado = true.
     */
    public function test_cambiar_item_a_listo_descuenta_insumos_segun_receta(): void
    {
        $insumo1Id = $this->crearInsumoTest('Lomo Fino', 10.000, 'kg');
        $insumo2Id = $this->crearInsumoTest('Cebolla Roja', 5.000, 'kg');

        $productoId = $this->crearProductoConReceta('Lomo Saltado', [
            ['insumo_id' => $insumo1Id, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.200],
            ['insumo_id' => $insumo2Id, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.100],
        ], true);

        // Pedido de 3 raciones
        $pedidoData = $this->crearPedidoConItem($productoId, 3, 'en_preparacion');
        $itemId = $pedidoData['item_id'];

        $response = $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.estado', 'listo');
        $response->assertJsonPath('datos.puede_deshacer', true);

        // Verificar pedido_item en DB
        $itemDB = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertEquals('listo', $itemDB->estado);
        $this->assertTrue((bool) $itemDB->stock_descontado);

        // Verificar existencias descontadas
        // Insumo 1: 10.000 - (0.200 * 3) = 9.400
        $insumo1DB = DB::table('insumo')->where('id', $insumo1Id)->first();
        $this->assertEquals(9.400, (float) $insumo1DB->stock_actual);

        // Insumo 2: 5.000 - (0.100 * 3) = 4.700
        $insumo2DB = DB::table('insumo')->where('id', $insumo2Id)->first();
        $this->assertEquals(4.700, (float) $insumo2DB->stock_actual);

        // Idempotencia: reenviar 'listo' no debe descontar nuevamente
        $responseRepetida = $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());
        $responseRepetida->assertStatus(200);

        $insumo1Check = DB::table('insumo')->where('id', $insumo1Id)->first();
        $this->assertEquals(9.400, (float) $insumo1Check->stock_actual);
    }

    /**
     * Test 2: Deshacer de 30s restituye el stock al 100% y reactiva el plato si estaba en quiebre.
     */
    public function test_deshacer_30s_restituye_stock_y_revierte_quiebre(): void
    {
        // Insumo con stock exacto para 1 plato
        $insumoId = $this->crearInsumoTest('Pulpo Fresco', 0.400, 'kg');

        $productoId = $this->crearProductoConReceta('Pulpo al Olivo', [
            ['insumo_id' => $insumoId, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.400],
        ], true);

        $pedidoData = $this->crearPedidoConItem($productoId, 1, 'en_preparacion');
        $itemId = $pedidoData['item_id'];

        // 1. Marcar listo -> Insumo agota existencias (quiebre)
        $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", ['estado' => 'listo'], $this->headers());

        $insumoAgotado = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(0.000, (float) $insumoAgotado->stock_actual);
        $this->assertEquals('agotado', $insumoAgotado->estado);

        $productoAgotado = DB::table('producto')->where('id', $productoId)->first();
        $this->assertEquals('agotado', $productoAgotado->disponibilidad);
        $this->assertEquals('quiebre_stock_receta', $productoAgotado->motivo_agotado);

        // 2. Ejecutar Deshacer 30s
        $responseDeshacer = $this->postJson("/api/v1/cocina/items/{$itemId}/deshacer", [], $this->headers());

        $responseDeshacer->assertStatus(200);
        $responseDeshacer->assertJsonPath('exito', true);
        $responseDeshacer->assertJsonPath('datos.estado_restaurado', 'en_preparacion');
        $this->assertGreaterThanOrEqual(1, $responseDeshacer->json('datos.insumos_restaurados'));

        // Verificar restitución de stock
        $insumoRestituido = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(0.400, (float) $insumoRestituido->stock_actual);
        $this->assertEquals('activo', $insumoRestituido->estado);

        // Verificar que el plato se reactivó automáticamente en carta
        $productoReactivado = DB::table('producto')->where('id', $productoId)->first();
        $this->assertEquals('disponible', $productoReactivado->disponibilidad);
        $this->assertNull($productoReactivado->motivo_agotado);

        $itemDB = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertFalse((bool) $itemDB->stock_descontado);
    }

    /**
     * Test 3: Política Poka-Yoke de No-Bloqueo de Fogones: asienta inconsistencia_cocina si stock < consumo.
     */
    public function test_politica_no_bloqueo_fogones_asienta_inconsistencia(): void
    {
        // Insumo con déficit (solo 0.150 kg cuando requiere 0.500 kg)
        $insumoId = $this->crearInsumoTest('Trucha Andina', 0.150, 'kg');

        $productoId = $this->crearProductoConReceta('Trucha Frita', [
            ['insumo_id' => $insumoId, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.500],
        ], true);

        $pedidoData = $this->crearPedidoConItem($productoId, 1, 'en_preparacion');
        $itemId = $pedidoData['item_id'];

        // Marcar listo -> No debe lanzar excepción 500
        $response = $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);

        // Stock debe quedar en 0 (sin saldo negativo)
        $insumoDB = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(0.000, (float) $insumoDB->stock_actual);
        $this->assertEquals('agotado', $insumoDB->estado);

        // Debe haberse insertado la inconsistencia en auditoria_stock_ajuste
        $auditoria = DB::table('auditoria_stock_ajuste')
            ->where('insumo_id', $insumoId)
            ->where('motivo', 'inconsistencia_cocina')
            ->first();

        $this->assertNotNull($auditoria);
        $this->assertEquals(0.150, (float) $auditoria->stock_anterior);
        $this->assertEquals(0.000, (float) $auditoria->stock_nuevo);
        $this->assertEquals(-0.150, (float) $auditoria->diferencia);
    }

    /**
     * Test 4: Despachar comanda completa descuenta todos los ítems de cocina pendientes en lote.
     */
    public function test_despachar_comanda_completa_descuenta_todos_los_items(): void
    {
        $insumo1Id = $this->crearInsumoTest('Arroz con Pato Base', 20.000, 'kg');
        $insumo2Id = $this->crearInsumoTest('Causa Rellena Base', 15.000, 'kg');

        $prod1Id = $this->crearProductoConReceta('Arroz con Pato', [
            ['insumo_id' => $insumo1Id, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.400],
        ], true);

        $prod2Id = $this->crearProductoConReceta('Causa Limeña', [
            ['insumo_id' => $insumo2Id, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.250],
        ], true);

        $mesaId = $this->crearMesaTest();
        $pedidoId = (string) Str::uuid();

        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'numero_comanda' => rand(1000, 9999),
            'mesa_id' => $mesaId,
            'mozo_id' => $this->adminId,
            'estado' => 'enviado',
            'comensales' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $item1Id = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $item1Id,
            'pedido_id' => $pedidoId,
            'producto_id' => $prod1Id,
            'cantidad' => 2,
            'precio_unitario' => 45.0,
            'estado' => 'en_cola',
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $item2Id = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $item2Id,
            'pedido_id' => $pedidoId,
            'producto_id' => $prod2Id,
            'cantidad' => 2,
            'precio_unitario' => 28.0,
            'estado' => 'en_preparacion',
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Despachar comanda completa al pase
        $response = $this->postJson("/api/v1/cocina/pedidos/{$pedidoId}/despachar", [], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.despachado', true);

        // Verificar que ambos items quedaron listos y descontados
        $item1DB = DB::table('pedido_item')->where('id', $item1Id)->first();
        $item2DB = DB::table('pedido_item')->where('id', $item2Id)->first();

        $this->assertEquals('listo', $item1DB->estado);
        $this->assertTrue((bool) $item1DB->stock_descontado);
        $this->assertEquals('listo', $item2DB->estado);
        $this->assertTrue((bool) $item2DB->stock_descontado);

        // Insumo 1: 20.000 - (0.400 * 2) = 19.200
        $ins1DB = DB::table('insumo')->where('id', $insumo1Id)->first();
        $this->assertEquals(19.200, (float) $ins1DB->stock_actual);

        // Insumo 2: 15.000 - (0.250 * 2) = 14.500
        $ins2DB = DB::table('insumo')->where('id', $insumo2Id)->first();
        $this->assertEquals(14.500, (float) $ins2DB->stock_actual);
    }

    /**
     * Test 5: Despacho directo de salón (requiere_preparacion = false) descuenta stock de inmediato en comanda.
     */
    public function test_despacho_directo_salon_descuenta_inmediatamente(): void
    {
        $insumoVinoId = $this->crearInsumoTest('Vino Malbec Botella', 10.000, 'und');

        $prodVinoId = $this->crearProductoConReceta('Botella Vino Malbec', [
            ['insumo_id' => $insumoVinoId, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 1.000],
        ], false); // requiere_preparacion = false

        $mesaId = $this->crearMesaTest();

        $response = $this->postJson('/api/v1/mozo/pedidos', [
            'mesa_id' => $mesaId,
            'comensales' => 2,
            'items' => [
                [
                    'producto_id' => $prodVinoId,
                    'cantidad' => 2,
                ],
            ],
        ], $this->headers());

        $response->assertStatus(201);
        $response->assertJsonPath('exito', true);

        // Insumo Vino: 10.000 - 2 = 8.000 de inmediato
        $insumoVinoDB = DB::table('insumo')->where('id', $insumoVinoId)->first();
        $this->assertEquals(8.000, (float) $insumoVinoDB->stock_actual);

        // El pedido_item debe haber nacido en 'listo' y con stock_descontado = true
        $pedidoItemDB = DB::table('pedido_item')
            ->where('producto_id', $prodVinoId)
            ->orderBy('created_at', 'desc')
            ->first();

        $this->assertNotNull($pedidoItemDB);
        $this->assertEquals('listo', $pedidoItemDB->estado);
        $this->assertTrue((bool) $pedidoItemDB->stock_descontado);
    }
}
