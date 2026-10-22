<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class CocinaComandasTransicionesTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $cocineroId = '00000000-0000-4000-8000-000000000103';
    private string $tokenCocinero;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_comandas_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->cocineroId,
            'nombre' => 'Chef Comandas Test',
            'correo' => 'cocina_comandas@aurea.local',
            'rol' => 'cocina',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenCocinero = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenCocinero,
            'Accept' => 'application/json',
        ];
    }

    private function crearInsumoTest(string $nombre, float $stock): string
    {
        $id = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'nombre' => $nombre . ' ' . Str::random(6),
            'unidad_medida' => 'kg',
            'stock_actual' => $stock,
            'stock_minimo' => 1.0,
            'costo_unitario' => 15.0,
            'estado' => $stock > 0 ? 'activo' : 'agotado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function crearProductoTest(string $nombre, bool $requiereCocina = true): string
    {
        $catId = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $catId,
            'local_id' => $this->localId,
            'nombre' => 'Partida ' . Str::random(5),
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $prodId = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $prodId,
            'local_id' => $this->localId,
            'categoria_id' => $catId,
            'nombre' => $nombre . ' ' . Str::random(5),
            'precio' => 45.00,
            'disponibilidad' => 'disponible',
            'requiere_preparacion' => $requiereCocina,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $prodId;
    }

    private function asociarReceta(string $productoId, string $insumoId, float $cantidad): void
    {
        DB::table('producto_insumo')->insert([
            'producto_id' => $productoId,
            'insumo_id' => $insumoId,
            'cantidad_descuenta' => $cantidad,
            'modo_calculo' => 'exacto',
        ]);
    }

    private function crearMesaTest(string $numero): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Salón ' . Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $mesaId = (string) Str::uuid();
        DB::table('mesa')->insert([
            'id' => $mesaId,
            'local_id' => $this->localId,
            'piso_id' => $pisoId,
            'numero' => $numero,
            'capacidad' => 4,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function crearPedidoTest(string $mesaId, int $minutosAtras = 0): string
    {
        $pedidoId = (string) Str::uuid();
        $createdAt = now()->subMinutes($minutosAtras);

        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->cocineroId,
            'numero_comanda' => rand(1000, 9999),
            'estado' => 'enviado',
            'comensales' => 2,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        return $pedidoId;
    }

    private function crearPedidoItem(
        string $pedidoId,
        string $productoId,
        int $cantidad,
        string $estado = 'en_cola'
    ): string {
        $itemId = (string) Str::uuid();

        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => 38.00,
            'nota_cocina' => 'Sin sal',
            'estado' => $estado,
            'numero_ronda' => 1,
            'fecha_inicio_coccion' => $estado === 'en_preparacion' ? now() : null,
            'fecha_listo_cocina' => null,
            'stock_descontado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $itemId;
    }

    public function test_cambiar_estado_item_a_preparacion_y_listo_con_deduccion(): void
    {
        $insumoId = $this->crearInsumoTest('Arroz Grano', 5.0);
        $prodId = $this->crearProductoTest('Arroz con Pato');
        $this->asociarReceta($prodId, $insumoId, 0.250); // 250g

        $mesaId = $this->crearMesaTest('M-01');
        $pedidoId = $this->crearPedidoTest($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 'en_cola');

        // 1. Transición a en_preparacion
        $resPrep = $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'en_preparacion',
        ], $this->headers());

        $resPrep->assertStatus(200);
        $resPrep->assertJsonPath('datos.estado', 'en_preparacion');
        $this->assertNotNull($resPrep->json('datos.fecha_inicio_coccion'));

        // 2. Transición a listo
        $resListo = $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());

        $resListo->assertStatus(200);
        $resListo->assertJsonPath('datos.estado', 'listo');
        $resListo->assertJsonPath('datos.puede_deshacer', true);
        $resListo->assertJsonPath('datos.segundos_deshacer', 30);
        $this->assertNotNull($resListo->json('datos.fecha_listo_cocina'));

        // 3. Verificar en BD que se descontó la receta y el stock bajó
        $itemDb = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertTrue((bool) $itemDb->stock_descontado);

        $insumoDb = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(4.750, (float) $insumoDb->stock_actual);
    }

    public function test_cambiar_estado_item_a_listo_emite_alerta_si_insumo_se_agota(): void
    {
        // Stock justo para 1 ración (0.300 kg)
        $insumoId = $this->crearInsumoTest('Lomo Exportación', 0.300);
        $prodId = $this->crearProductoTest('Lomo Clásico');
        $this->asociarReceta($prodId, $insumoId, 0.300);

        $mesaId = $this->crearMesaTest('M-02');
        $pedidoId = $this->crearPedidoTest($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 'en_preparacion');

        $response = $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());

        $response->assertStatus(200);
        $this->assertNotNull($response->json('datos.alerta_stock'), 'Debe emitir alerta_stock ante quiebre físico');
        $this->assertEquals($insumoId, $response->json('datos.alerta_stock.insumo_id'));
        $this->assertEquals(0.0, $response->json('datos.alerta_stock.stock_actual'));
    }

    public function test_deshacer_item_dentro_de_30_segundos_restituye_stock(): void
    {
        $insumoId = $this->crearInsumoTest('Pescado Corvina', 4.0);
        $prodId = $this->crearProductoTest('Ceviche Clásico');
        $this->asociarReceta($prodId, $insumoId, 0.200);

        $mesaId = $this->crearMesaTest('M-03');
        $pedidoId = $this->crearPedidoTest($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 'en_preparacion');

        // Marcar listo (stock baja a 3.800)
        $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());

        $insumoTrasListo = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(3.800, (float) $insumoTrasListo->stock_actual);

        // Deshacer dentro de los 30 segundos
        $resDeshacer = $this->postJson("/api/v1/cocina/items/{$itemId}/deshacer", [], $this->headers());

        $resDeshacer->assertStatus(200);
        $resDeshacer->assertJsonPath('datos.estado_restaurado', 'en_preparacion');

        // Verificar en BD que volvió a en_preparacion y fecha_listo_cocina es null
        $itemDb = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertEquals('en_preparacion', $itemDb->estado);
        $this->assertNull($itemDb->fecha_listo_cocina);
        $this->assertFalse((bool) $itemDb->stock_descontado);

        // Verificar que el stock de insumo regresó a 4.000 kg
        $insumoTrasRollback = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(4.000, (float) $insumoTrasRollback->stock_actual);
    }

    public function test_deshacer_item_despues_de_30_segundos_retorna_422(): void
    {
        $prodId = $this->crearProductoTest('Seco de Cabrito');
        $mesaId = $this->crearMesaTest('M-04');
        $pedidoId = $this->crearPedidoTest($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 'en_preparacion');

        // Poner listo
        $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", [
            'estado' => 'listo',
        ], $this->headers());

        // Simular que pasaron 35 segundos desde fecha_listo_cocina (asegurando fecha_inicio_coccion anterior para chk_cocina_tiempos_coherentes)
        DB::table('pedido_item')->where('id', $itemId)->update([
            'fecha_inicio_coccion' => now()->subSeconds(60),
            'fecha_listo_cocina' => now()->subSeconds(35),
        ]);

        $response = $this->postJson("/api/v1/cocina/items/{$itemId}/deshacer", [], $this->headers());

        $response->assertStatus(422);
        $response->assertJsonPath('errores.0.codigo', 'VENTANA_DESHACER_EXPIRADA');
    }

    public function test_despachar_comanda_completa_y_auditoria_30m(): void
    {
        $insumoId = $this->crearInsumoTest('Carne Chancho', 6.0);
        $prod1 = $this->crearProductoTest('Chicharrón de Cerdo');
        $this->asociarReceta($prod1, $insumoId, 0.300);

        $mesaId = $this->crearMesaTest('M-05');
        $pedidoId = $this->crearPedidoTest($mesaId);

        $it1 = $this->crearPedidoItem($pedidoId, $prod1, 1, 'en_cola');
        $it2 = $this->crearPedidoItem($pedidoId, $prod1, 2, 'en_preparacion');

        // Despachar comanda completa
        $resDespacho = $this->postJson("/api/v1/cocina/pedidos/{$pedidoId}/despachar", [], $this->headers());

        $resDespacho->assertStatus(200);
        $resDespacho->assertJsonPath('datos.despachado', true);

        // Verificar que ambos items quedaron listos y descontados
        $item1Db = DB::table('pedido_item')->where('id', $it1)->first();
        $item2Db = DB::table('pedido_item')->where('id', $it2)->first();

        $this->assertEquals('listo', $item1Db->estado);
        $this->assertEquals('listo', $item2Db->estado);
        $this->assertTrue((bool) $item1Db->stock_descontado);
        $this->assertTrue((bool) $item2Db->stock_descontado);

        // Se consumieron 3 raciones x 0.300 = 0.900 kg -> Stock = 5.100 kg
        $insumoDb = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(5.100, (float) $insumoDb->stock_actual);

        // Verificar que ya no aparece en getComandas activas
        $resComandas = $this->getJson('/api/v1/cocina/comandas', $this->headers());
        $resComandas->assertStatus(200);
        $comandasIds = collect($resComandas->json('datos'))->pluck('pedido_id')->all();
        $this->assertNotContains($pedidoId, $comandasIds, 'La comanda despachada no debe saturar la pantalla activa');

        // Verificar que figura en getDespachadosRecientes (auditoría de solo lectura)
        $resDespachados = $this->getJson('/api/v1/cocina/pedidos/despachados-recientes', $this->headers());
        $resDespachados->assertStatus(200);
        $despachadosIds = collect($resDespachados->json('datos'))->pluck('pedido_id')->all();
        $this->assertContains($pedidoId, $despachadosIds, 'Debe aparecer en la bandeja de auditoría de los últimos 30m');
    }
}
