<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoCoreOperativoTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $mozoId = '00000000-0000-4000-8000-000000000102';
    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_mozo_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->mozoId,
            'nombre' => 'Mozo Test Operativo',
            'correo' => 'mozo_operativo@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenMozo = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenMozo,
            'Accept' => 'application/json',
        ];
    }

    private function crearMesa(string $numero, ?string $mesaPrincipalId = null): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso Mozo ' . Str::random(4),
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
            'forma' => 'cuadrada',
            'posicion_x' => 1,
            'posicion_y' => 1,
            'permite_union' => true,
            'mesa_principal_id' => $mesaPrincipalId,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function crearProducto(string $nombre, float $precio = 25.0): string
    {
        $catId = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $catId,
            'local_id' => $this->localId,
            'nombre' => 'Cat ' . Str::random(4),
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $prodId = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $prodId,
            'categoria_id' => $catId,
            'local_id' => $this->localId,
            'nombre' => $nombre . ' ' . Str::random(4),
            'descripcion' => 'Plato de prueba',
            'precio' => $precio,
            'foto_url' => null,
            'disponibilidad' => 'disponible',
            'requiere_preparacion' => true,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $prodId;
    }

    private function crearPedido(string $mesaId, int $comensales = 2): string
    {
        $pedidoId = (string) Str::uuid();

        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => rand(2000, 9999),
            'estado' => 'enviado',
            'comensales' => $comensales,
            'created_at' => now()->subMinutes(15),
            'updated_at' => now()->subMinutes(15),
        ]);

        return $pedidoId;
    }

    private function crearPedidoItem(string $pedidoId, string $productoId, int $cantidad, float $precio): string
    {
        $itemId = (string) Str::uuid();

        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio,
            'nota_cocina' => 'Término medio',
            'estado' => 'en_preparacion',
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now()->subMinutes(10),
            'updated_at' => now()->subMinutes(10),
        ]);

        return $itemId;
    }

    public function test_get_plano_retorna_estructura_enriquecida_con_etiqueta_union_y_subcuentas(): void
    {
        $numA = '91';
        $numB = '92';
        $mesaPrincipalId = $this->crearMesa($numA);
        $mesaSecundariaId = $this->crearMesa($numB, $mesaPrincipalId);

        $pedidoId = $this->crearPedido($mesaPrincipalId);
        $prodId = $this->crearProducto('Lomo Saltado', 45.0);
        $this->crearPedidoItem($pedidoId, $prodId, 1, 45.0);

        // Subcuenta simulada
        $subId = (string) Str::uuid();
        DB::table('pedido_subcuenta')->insert([
            'id' => $subId,
            'pedido_id' => $pedidoId,
            'numero_subcuenta' => 1,
            'tipo_comprobante' => 'boleta',
            'nombre_cliente' => 'Cliente Subcuenta 1',
            'medio_pago' => 'efectivo',
            'subtotal_bruto' => 45.0,
            'descuento' => 0.0,
            'monto_recargo' => 0.0,
            'total' => 45.0,
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->getJson('/api/v1/mozo/plano', $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true);

        $mesas = collect($res->json('datos.mesas'));
        $mesaP = $mesas->firstWhere('id', $mesaPrincipalId);
        $this->assertNotNull($mesaP);
        $this->assertNotNull($mesaP['etiqueta_union']);
        $this->assertStringContainsString('Mesa [', $mesaP['etiqueta_union']);
        $this->assertTrue($mesaP['es_cuenta_dividida']);
        $this->assertEquals(1, $mesaP['partes_subcuentas']);
    }

    public function test_get_detalle_mesa_incluye_identidad_mozo_y_subcuentas(): void
    {
        $mesaId = $this->crearMesa('93');
        $pedidoId = $this->crearPedido($mesaId);
        $prodId = $this->crearProducto('Ceviche Clásico', 38.0);
        $this->crearPedidoItem($pedidoId, $prodId, 2, 38.0);

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesaId}/detalle", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_id', $mesaId)
            ->assertJsonPath('datos.es_mi_mesa', true)
            ->assertJsonPath('datos.comensales', 2);

        $this->assertNotNull($res->json('datos.numero_comanda'));
        $this->assertNotNull($res->json('datos.hora_apertura'));
        $this->assertIsArray($res->json('datos.items'));
        $this->assertCount(1, $res->json('datos.items'));
    }

    public function test_get_carta_mesa_incluye_total_por_categoria(): void
    {
        $mesaId = $this->crearMesa('94');
        $this->crearProducto('Tiradito Nikkei', 35.0);

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesaId}/carta", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true);

        $categorias = $res->json('datos.categorias');
        $this->assertNotEmpty($categorias);
        foreach ($categorias as $cat) {
            $this->assertArrayHasKey('total', $cat);
            $this->assertArrayHasKey('total_platos', $cat);
            $this->assertEquals($cat['total_platos'], $cat['total']);
        }
    }

    public function test_get_historial_mesa_retorna_ronda_previa_items_y_total_previo(): void
    {
        $mesaId = $this->crearMesa('95');
        $pedidoId = $this->crearPedido($mesaId);
        $prodId1 = $this->crearProducto('Arroz con Mariscos', 40.0);
        $prodId2 = $this->crearProducto('Chicha Morada 1L', 15.0);

        $this->crearPedidoItem($pedidoId, $prodId1, 1, 40.0);
        $this->crearPedidoItem($pedidoId, $prodId2, 2, 15.0);

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesaId}/historial", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_id', $mesaId);

        $this->assertEquals(70.0, (float) $res->json('datos.total_previo'));

        $rondaPreviaItems = $res->json('datos.ronda_previa_items');
        $this->assertIsArray($rondaPreviaItems);
        $this->assertCount(2, $rondaPreviaItems);
        $this->assertNotNull($res->json('datos.ambiente'));
    }

    public function test_solicitar_cuenta_persiste_sugerencias_fiscales_sunat(): void
    {
        $mesaId = $this->crearMesa('96');
        $pedidoId = $this->crearPedido($mesaId);
        $prodId = $this->crearProducto('Anticuchos Tradicionales', 30.0);
        $this->crearPedidoItem($pedidoId, $prodId, 1, 30.0);

        $payload = [
            'tipo_comprobante' => 'factura',
            'documento_cliente' => '20601234567',
            'nombre_cliente' => 'INVERSIONES GASTRONOMICAS S.A.C.',
            'metodo_pago' => 'billetera_digital',
            'numero_operacion' => '894712',
            'monto_declarado' => 30.0,
        ];

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/solicitar-cuenta", $payload, $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_id', $mesaId)
            ->assertJsonPath('datos.pedido_id', $pedidoId);

        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('cuenta_pedida', $pedidoDB->estado);
        $this->assertEquals('factura', $pedidoDB->tipo_comprobante_sugerido);
        $this->assertEquals('20601234567', $pedidoDB->documento_cliente_sugerido);
        $this->assertEquals('INVERSIONES GASTRONOMICAS S.A.C.', $pedidoDB->nombre_cliente_sugerido);
        $this->assertEquals('billetera_digital', $pedidoDB->medio_pago_sugerido);
        $this->assertEquals('894712', $pedidoDB->numero_operacion_sugerido);
        $this->assertNotNull($pedidoDB->precuenta_generada_at);
    }

    public function test_get_precuenta_mesa_retorna_estructura_completa_con_promociones_y_items(): void
    {
        $mesaId = $this->crearMesa('97');
        $pedidoId = $this->crearPedido($mesaId);
        $prodId = $this->crearProducto('Lomo Saltado Clásico', 45.0);
        $this->crearPedidoItem($pedidoId, $prodId, 2, 45.0);

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesaId}/precuenta", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_id', $mesaId)
            ->assertJsonPath('datos.mesa_numero', '97')
            ->assertJsonPath('datos.tributacion_sunat.consumo_bruto', 90)
            ->assertJsonPath('datos.tributacion_sunat.total_neto', 90);

        $this->assertNotEmpty($res->json('datos.items'));
        $this->assertNotEmpty($res->json('datos.opciones_pago'));
        $this->assertArrayHasKey('promociones_disponibles', $res->json('datos'));
        $this->assertArrayHasKey('minutos_en_mesa', $res->json('datos'));
    }

    public function test_mozo_puede_consultar_cliente_fiscal_sin_error_403(): void
    {
        $res = $this->getJson('/api/v1/mozo/clientes/buscar?tipo=DNI&documento=72819201', $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true);
    }
}
