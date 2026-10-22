<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class CocinaDisponibilidadQuiebresTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $cocineroId = '00000000-0000-4000-8000-000000000103';
    private string $tokenCocinero;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_cocinero_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->cocineroId,
            'nombre' => 'Chef Roberto',
            'correo' => 'cocina@aurea.local',
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

    private function crearProductoTest(string $nombre, ?string $insumoId = null, float $cantDescuenta = 0.3): string
    {
        $categoria = DB::table('categoria_producto')->where('local_id', $this->localId)->first();
        $productoId = (string) Str::uuid();

        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => $nombre . ' ' . Str::random(6),
            'precio' => 42.0,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($insumoId) {
            DB::table('producto_insumo')->insert([
                'producto_id' => $productoId,
                'insumo_id' => $insumoId,
                'modo_calculo' => 'exacto',
                'cantidad_descuenta' => $cantDescuenta,
            ]);
        }

        return $productoId;
    }

    private function crearPedidoConItem(string $productoId, int $cantidad, string $estado): array
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

        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'numero_comanda' => rand(1000, 9999),
            'mesa_id' => $mesaId,
            'mozo_id' => $this->cocineroId,
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
            'precio_unitario' => 42.0,
            'estado' => $estado,
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['pedido_id' => $pedidoId, 'item_id' => $itemId];
    }

    /**
     * Test 1: Catálogo de disponibilidad detecta órdenes en cola, en fuego y bloqueo por stock 0.
     */
    public function test_obtener_disponibilidad_detecta_platos_y_conteo_de_ordenes(): void
    {
        $insumoAgotadoId = $this->crearInsumoTest('Lomo Sin Stock', 0.000);
        $prodAgotadoId = $this->crearProductoTest('Lomo Sin Stock', $insumoAgotadoId);

        $insumoActivoId = $this->crearInsumoTest('Pollo Con Stock', 10.000);
        $prodActivoId = $this->crearProductoTest('Pollo Con Stock', $insumoActivoId);

        // Crear 2 raciones en cola y 3 raciones en preparación para el producto activo
        $this->crearPedidoConItem($prodActivoId, 2, 'en_cola');
        $this->crearPedidoConItem($prodActivoId, 3, 'en_preparacion');

        $response = $this->getJson('/api/v1/cocina/productos/disponibilidad', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);

        $catalogo = collect($response->json('datos'));

        // Verificar producto con insumo agotado
        $itemAgotado = $catalogo->firstWhere('producto_id', $prodAgotadoId);
        $this->assertNotNull($itemAgotado);
        $this->assertNotNull($itemAgotado['insumo_bloqueante']);

        // Verificar conteo de órdenes del producto activo
        $itemActivo = $catalogo->firstWhere('producto_id', $prodActivoId);
        $this->assertNotNull($itemActivo);
        $this->assertNull($itemActivo['insumo_bloqueante']);
        $this->assertEquals(2, $itemActivo['ordenes_en_cola']);
        $this->assertEquals(3, $itemActivo['ordenes_en_fuego']);
    }

    /**
     * Test 2: Apagar plato sin raciones en fuego conmuta producto a 'agotado' y cancela órdenes en cola.
     */
    public function test_apagar_plato_sin_fuego_cancela_cola_y_apaga_producto(): void
    {
        $prodId = $this->crearProductoTest('Ceviche Clásico');
        $pedidoData = $this->crearPedidoConItem($prodId, 2, 'en_cola');
        $itemId = $pedidoData['item_id'];

        $response = $this->postJson("/api/v1/cocina/productos/{$prodId}/marcar-agotado", [], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.requiere_resolucion', false);
        $response->assertJsonPath('datos.disponibilidad', 'agotado');

        // Producto en DB
        $prodDB = DB::table('producto')->where('id', $prodId)->first();
        $this->assertEquals('agotado', $prodDB->disponibilidad);
        $this->assertEquals('apagado_manual_cocina', $prodDB->motivo_agotado);
        $this->assertEquals($this->cocineroId, $prodDB->usuario_modifico_disp_id);

        // Ítems en cola pasan a no_disponible
        $itemDB = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertEquals('no_disponible', $itemDB->estado);
        $this->assertEquals('quiebre_stock_cocina', $itemDB->motivo_anulacion);

        // Notificación generada
        $notif = DB::table('notificacion')
            ->where('entidad_id', $prodId)
            ->where('tipo', 'quiebre_manual_cocina')
            ->first();
        $this->assertNotNull($notif);
        $this->assertEquals('admin_local', $notif->rol_destinatario);
    }

    /**
     * Test 3: Apagar plato con raciones en preparación responde requiere_resolucion = true.
     */
    public function test_apagar_plato_con_fuego_requiere_resolucion(): void
    {
        $prodId = $this->crearProductoTest('Seco de Res');
        $this->crearPedidoConItem($prodId, 3, 'en_preparacion');

        $response = $this->postJson("/api/v1/cocina/productos/{$prodId}/marcar-agotado", [], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.requiere_resolucion', true);
        $response->assertJsonPath('datos.raciones_en_fuego', 3);

        // El producto aún no se apaga definitivamente hasta resolver
        $prodDB = DB::table('producto')->where('id', $prodId)->first();
        $this->assertEquals('disponible', $prodDB->disponibilidad);

        // Consultar items en fuego
        $responseFuego = $this->getJson("/api/v1/cocina/productos/{$prodId}/items-fuego", $this->headers());
        $responseFuego->assertStatus(200);
        $this->assertCount(1, $responseFuego->json('datos'));
        $this->assertEquals(3, $responseFuego->json('datos.0.cantidad'));
    }

    /**
     * Test 4: Confirmar resolución de fuego activo divide entre cubiertas (en_preparacion) y no alcanzadas (no_disponible).
     */
    public function test_confirmar_resolucion_fuego_parcial_k_de_n(): void
    {
        $prodId = $this->crearProductoTest('Parrilla Mixta');
        $itemCubierto = $this->crearPedidoConItem($prodId, 2, 'en_preparacion');
        $itemNoAlcanzado = $this->crearPedidoConItem($prodId, 2, 'en_preparacion');

        $response = $this->postJson("/api/v1/cocina/productos/{$prodId}/resolver-fuego", [
            'items_no_alcanzados_ids' => [$itemNoAlcanzado['item_id']],
            'motivo' => 'Solo alcanzó para 2 porciones',
        ], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.resuelto', true);

        // Producto queda apagado
        $prodDB = DB::table('producto')->where('id', $prodId)->first();
        $this->assertEquals('agotado', $prodDB->disponibilidad);
        $this->assertEquals('apagado_manual_cocina', $prodDB->motivo_agotado);

        // Ítem cubierto sigue en preparación
        $itemCubiertoDB = DB::table('pedido_item')->where('id', $itemCubierto['item_id'])->first();
        $this->assertEquals('en_preparacion', $itemCubiertoDB->estado);

        // Ítem no alcanzado pasa a no_disponible
        $itemNoAlcanzadoDB = DB::table('pedido_item')->where('id', $itemNoAlcanzado['item_id'])->first();
        $this->assertEquals('no_disponible', $itemNoAlcanzadoDB->estado);
        $this->assertEquals('quiebre_fuego_parcial', $itemNoAlcanzadoDB->motivo_anulacion);
    }

    /**
     * Test 5: Reactivar plato valida stock físico de insumos y rechaza con 422 si insumo está en 0.
     */
    public function test_reactivar_plato_valida_existencia_de_insumos(): void
    {
        $insumoCeroId = $this->crearInsumoTest('Arroz Stock Cero', 0.000);
        $prodConInsumoCero = $this->crearProductoTest('Arroz con Mariscos', $insumoCeroId);

        // Apagar producto
        DB::table('producto')->where('id', $prodConInsumoCero)->update(['disponibilidad' => 'agotado']);

        // Intentar reactivar con stock cero
        $responseBloqueada = $this->postJson("/api/v1/cocina/productos/{$prodConInsumoCero}/reactivar", [], $this->headers());
        $responseBloqueada->assertStatus(422);
        $responseBloqueada->assertJsonPath('exito', false);

        // Caso con insumo con stock positivo
        $insumoOkId = $this->crearInsumoTest('Pescado Stock Positivo', 5.000);
        $prodOk = $this->crearProductoTest('Chicharrón de Pescado', $insumoOkId);
        DB::table('producto')->where('id', $prodOk)->update(['disponibilidad' => 'agotado']);

        $responseExitosa = $this->postJson("/api/v1/cocina/productos/{$prodOk}/reactivar", [], $this->headers());
        $responseExitosa->assertStatus(200);
        $responseExitosa->assertJsonPath('exito', true);
        $responseExitosa->assertJsonPath('datos.disponibilidad', 'disponible');

        $prodDB = DB::table('producto')->where('id', $prodOk)->first();
        $this->assertEquals('disponible', $prodDB->disponibilidad);
        $this->assertNull($prodDB->motivo_agotado);
    }
}
