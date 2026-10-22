<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class CocinaConsolidadoTandasTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $cocineroId = '00000000-0000-4000-8000-000000000103';
    private string $tokenCocinero;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_tandas_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->cocineroId,
            'nombre' => 'Chef Tanda Test',
            'correo' => 'cocina_tandas@aurea.local',
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
            'nombre' => 'Salón Tanda ' . Str::random(4),
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
        string $estado = 'en_cola',
        int $minutosAtras = 0
    ): string {
        $itemId = (string) Str::uuid();
        $createdAt = now()->subMinutes($minutosAtras);

        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => 38.00,
            'nota_cocina' => 'Término medio',
            'estado' => $estado,
            'numero_ronda' => 1,
            'fecha_inicio_coccion' => $estado === 'en_preparacion' ? $createdAt : null,
            'fecha_listo_cocina' => null,
            'stock_descontado' => false,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        return $itemId;
    }

    public function test_obtener_consolidado_all_day_agrupa_por_categoria_y_plato(): void
    {
        $prodId = $this->crearProductoTest('Lomo Saltado AllDay');
        $mesa1 = $this->crearMesaTest('T-01');
        $mesa2 = $this->crearMesaTest('T-02');

        $p1 = $this->crearPedidoTest($mesa1, 10);
        $p2 = $this->crearPedidoTest($mesa2, 5);

        // 2 en cola en p1, 3 en fuego en p2
        $this->crearPedidoItem($p1, $prodId, 2, 'en_cola');
        $this->crearPedidoItem($p2, $prodId, 3, 'en_preparacion');

        $response = $this->getJson('/api/v1/cocina/consolidado-all-day', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);

        $datos = $response->json('datos');
        $this->assertNotEmpty($datos);

        $encontrado = false;
        foreach ($datos as $cat) {
            foreach ($cat['platos'] as $p) {
                if ($p['producto_id'] === $prodId) {
                    $encontrado = true;
                    $this->assertEquals(5, $p['cantidad_total']);
                    $this->assertEquals(3, $p['cantidad_en_fuego']);
                    $this->assertCount(2, $p['detalle_mesas']);
                }
            }
        }
        $this->assertTrue($encontrado, 'El plato debe figurar en el consolidado');
    }

    public function test_poner_en_fuego_tanda_completa(): void
    {
        $prodId = $this->crearProductoTest('Chaufa Wok Tanda');
        $mesa1 = $this->crearMesaTest('T-10');
        $mesa2 = $this->crearMesaTest('T-11');

        $p1 = $this->crearPedidoTest($mesa1, 8);
        $p2 = $this->crearPedidoTest($mesa2, 4);

        $it1 = $this->crearPedidoItem($p1, $prodId, 2, 'en_cola');
        $it2 = $this->crearPedidoItem($p2, $prodId, 3, 'en_cola');

        $response = $this->postJson('/api/v1/cocina/consolidado/poner-en-fuego', [
            'producto_id' => $prodId,
        ], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.actualizados', 5);

        // Verificar en BD que pasaron a en_preparacion con fecha_inicio_coccion no nula
        $item1Db = DB::table('pedido_item')->where('id', $it1)->first();
        $item2Db = DB::table('pedido_item')->where('id', $it2)->first();

        $this->assertEquals('en_preparacion', $item1Db->estado);
        $this->assertNotNull($item1Db->fecha_inicio_coccion);

        $this->assertEquals('en_preparacion', $item2Db->estado);
        $this->assertNotNull($item2Db->fecha_inicio_coccion);
    }

    public function test_marcar_listo_tanda_aplica_fifo_estricto_y_split_de_item_y_descuenta_receta(): void
    {
        $insumoCarne = $this->crearInsumoTest('Lomo Fino Res', 10.0);
        $prodId = $this->crearProductoTest('Lomo Saltado FIFO');
        $this->asociarReceta($prodId, $insumoCarne, 0.200); // 200g por ración

        $mesaAntigua = $this->crearMesaTest('FIFO-01');
        $mesaReciente = $this->crearMesaTest('FIFO-02');

        // Pedido 1 fue creado hace 20 minutos (más antiguo) con 2 raciones
        $p1 = $this->crearPedidoTest($mesaAntigua, 20);
        $it1 = $this->crearPedidoItem($p1, $prodId, 2, 'en_preparacion', 20);

        // Pedido 2 fue creado hace 5 minutos (más reciente) con 2 raciones
        $p2 = $this->crearPedidoTest($mesaReciente, 5);
        $it2 = $this->crearPedidoItem($p2, $prodId, 2, 'en_preparacion', 5);

        // Salen 3 raciones del wok (debe completar las 2 de p1 y 1 de p2 con split)
        $response = $this->postJson('/api/v1/cocina/consolidado/marcar-listo', [
            'producto_id' => $prodId,
            'cantidad' => 3,
        ], $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.listos', 3);

        // 1. Verificar Pedido 1 (más antiguo): debe estar completamente 'listo'
        $item1Db = DB::table('pedido_item')->where('id', $it1)->first();
        $this->assertEquals('listo', $item1Db->estado);
        $this->assertEquals(2, $item1Db->cantidad);
        $this->assertNotNull($item1Db->fecha_listo_cocina);
        $this->assertTrue((bool) $item1Db->stock_descontado);

        // 2. Verificar Pedido 2: el ítem original debe quedar con 1 ración en 'en_preparacion'
        $item2Original = DB::table('pedido_item')->where('id', $it2)->first();
        $this->assertEquals('en_preparacion', $item2Original->estado);
        $this->assertEquals(1, $item2Original->cantidad);

        // Y debe existir un nuevo ítem clonado en Pedido 2 con 1 ración en 'listo'
        $item2Clonado = DB::table('pedido_item')
            ->where('pedido_id', $p2)
            ->where('id', '!=', $it2)
            ->where('producto_id', $prodId)
            ->first();

        $this->assertNotNull($item2Clonado, 'Debe existir el ítem resultante del split');
        $this->assertEquals('listo', $item2Clonado->estado);
        $this->assertEquals(1, $item2Clonado->cantidad);
        $this->assertNotNull($item2Clonado->fecha_listo_cocina);
        $this->assertTrue((bool) $item2Clonado->stock_descontado);

        // 3. Verificar deducción de stock: 3 raciones x 0.200 kg = 0.600 kg deducidos
        // Stock inicial 10.0 - 0.6 = 9.4 kg
        $insumoDb = DB::table('insumo')->where('id', $insumoCarne)->first();
        $this->assertEquals(9.400, (float) $insumoDb->stock_actual);
    }

    public function test_marcar_listo_tanda_sin_raciones_en_fuego_retorna_422(): void
    {
        $prodId = $this->crearProductoTest('Plato Sin Fuego');

        $response = $this->postJson('/api/v1/cocina/consolidado/marcar-listo', [
            'producto_id' => $prodId,
            'cantidad' => 2,
        ], $this->headers());

        $response->assertStatus(422);
        $response->assertJsonPath('errores.0.codigo', 'NO_HAY_RACIONES_EN_FUEGO');
    }
}
