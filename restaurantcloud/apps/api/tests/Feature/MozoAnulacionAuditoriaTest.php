<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoAnulacionAuditoriaTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $mozoId = '00000000-0000-4000-8000-000000000102';
    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_anulacion_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->mozoId,
            'nombre' => 'Mozo Auditoria Test',
            'correo' => 'mozo_audit@aurea.local',
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

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso ' . Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pisoId;
    }

    private function crearMesa(string $pisoId, string $numero, bool $permiteUnion = true, ?string $principalId = null): string
    {
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
            'permite_union' => $permiteUnion,
            'mesa_principal_id' => $principalId,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function crearProducto(float $precio, float $costoEstandar = 10.0): string
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
            'nombre' => 'Plato ' . Str::random(4),
            'precio' => $precio,
            'costo_estandar' => $costoEstandar,
            'disponibilidad' => 'disponible',
            'requiere_preparacion' => true,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $prodId;
    }

    private function crearPedido(string $mesaId): string
    {
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => rand(1000, 9999),
            'estado' => 'enviado',
            'comensales' => 2,
            'created_at' => now()->subMinutes(15),
            'updated_at' => now()->subMinutes(15),
        ]);

        return $pedidoId;
    }

    private function agregarItem(string $pedidoId, string $productoId, int $cantidad, float $precio, string $estado = 'en_cola'): string
    {
        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio,
            'estado' => $estado,
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now()->subMinutes(10),
            'updated_at' => now()->subMinutes(10),
        ]);

        return $itemId;
    }

    public function test_anular_item_en_cola_registra_auditoria_sin_merma(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '04');
        $pedidoId = $this->crearPedido($mesaId);

        $prod1 = $this->crearProducto(45.0, 12.0);
        $prod2 = $this->crearProducto(35.0, 9.0);

        $itemId1 = $this->agregarItem($pedidoId, $prod1, 1, 45.0, 'en_cola');
        $itemId2 = $this->agregarItem($pedidoId, $prod2, 1, 35.0, 'en_preparacion');

        $payload = [
            'motivo_categoria' => 'demora_cliente',
            'motivo_detalle' => 'Cliente cancela plato por exceso de demora en cocina',
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId1}/anular", $payload, $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'item_id' => $itemId1,
                    'pedido_id' => $pedidoId,
                    'mesa_id' => $mesaId,
                    'mesa_numero' => 'Mesa 04',
                    'cantidad' => 1,
                    'estado_anterior' => 'en_cola',
                    'es_merma' => false,
                    'nuevo_subtotal' => 35.0,
                    'mesa_liberada' => false,
                ],
            ]);

        // Verificar pedido_item actualizado
        $itemDB = DB::table('pedido_item')->where('id', $itemId1)->first();
        $this->assertEquals('anulado', $itemDB->estado);
        $this->assertEquals($this->mozoId, $itemDB->anulado_por);
        $this->assertFalse((bool) $itemDB->es_merma);
        $this->assertEquals('Cliente cancela plato por exceso de demora en cocina', $itemDB->motivo_anulacion);

        // Verificar persistencia inmutable en pedido_anulacion
        $anulacionDB = DB::table('pedido_anulacion')->where('pedido_item_id', $itemId1)->first();
        $this->assertNotNull($anulacionDB);
        $this->assertEquals('item_individual', $anulacionDB->tipo_anulacion);
        $this->assertEquals('demora_cliente', $anulacionDB->motivo_categoria);
        $this->assertFalse((bool) $anulacionDB->es_merma);
        $this->assertEquals(0.00, (float) $anulacionDB->costo_merma);
        $this->assertEquals(45.00, (float) $anulacionDB->monto_total);
        $this->assertGreaterThanOrEqual(10, $anulacionDB->minutos_espera);

        // Verificar log_auditoria
        $logDB = DB::table('log_auditoria')
            ->where('accion', 'ANULACION_ITEM_PEDIDO')
            ->where('entidad_id', $itemId1)
            ->first();
        $this->assertNotNull($logDB);

        // La mesa debe seguir ocupada en el plano porque queda un ítem activo
        $resPlano = $this->getJson("/api/v1/mozo/plano?piso_id={$pisoId}", $this->headers());
        $dtoMesa = collect($resPlano->json('datos.mesas'))->firstWhere('id', $mesaId);
        $this->assertEquals('ocupada', $dtoMesa['estado']);
    }

    public function test_anular_item_servido_o_listo_registra_merma_y_costo_teorico(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '05');
        $pedidoId = $this->crearPedido($mesaId);

        $prodId = $this->crearProducto(50.0, 15.50);
        $itemId = $this->agregarItem($pedidoId, $prodId, 2, 50.0, 'entregado');

        // Ítem restante para que la mesa no se libere
        $prodOtro = $this->crearProducto(20.0, 5.0);
        $this->agregarItem($pedidoId, $prodOtro, 1, 20.0, 'en_cola');

        $payload = [
            'motivo_categoria' => 'plato_caido', // mapea a queja_calidad
            'motivo_detalle' => 'Plato resbaló al servir en salón y cayó al piso',
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", $payload, $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'item_id' => $itemId,
                    'es_merma' => true,
                    'mesa_liberada' => false,
                ],
            ]);

        $anulacionDB = DB::table('pedido_anulacion')->where('pedido_item_id', $itemId)->first();
        $this->assertNotNull($anulacionDB);
        $this->assertTrue((bool) $anulacionDB->es_merma);
        // Costo merma = 2 * 15.50 = 31.00
        $this->assertEquals(31.00, (float) $anulacionDB->costo_merma);
        $this->assertEquals('queja_calidad', $anulacionDB->motivo_categoria);
    }

    public function test_anular_ultimo_item_cancela_pedido_y_libera_mesa_automaticamente(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '06');
        $pedidoId = $this->crearPedido($mesaId);

        $prodId = $this->crearProducto(60.0, 20.0);
        $itemId = $this->agregarItem($pedidoId, $prodId, 1, 60.0, 'en_cola');

        $payload = [
            'motivo_categoria' => 'error_toma', // mapea a error_registro
            'motivo_detalle' => 'Comensales deciden no ordenar nada y se van',
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", $payload, $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'mesa_liberada' => true,
                    'nuevo_subtotal' => 0.0,
                ],
            ]);

        // Verificar que el pedido se anuló
        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('anulado', $pedidoDB->estado);

        // Verificar que la mesa se refleja libre en el plano de salón
        $resPlano = $this->getJson("/api/v1/mozo/plano?piso_id={$pisoId}", $this->headers());
        $dtoMesa = collect($resPlano->json('datos.mesas'))->firstWhere('id', $mesaId);
        $this->assertEquals('libre', $dtoMesa['estado']);
    }

    public function test_anular_comanda_completa_libera_mesas_unificadas_y_registra_auditoria(): void
    {
        $pisoId = $this->crearPiso();
        $titularId = $this->crearMesa($pisoId, '02');
        $secundariaId = $this->crearMesa($pisoId, '03', true, $titularId);

        $pedidoId = $this->crearPedido($titularId);

        $prod1 = $this->crearProducto(40.0, 10.0);
        $prod2 = $this->crearProducto(55.0, 18.0);

        $this->agregarItem($pedidoId, $prod1, 1, 40.0, 'en_cola');
        $this->agregarItem($pedidoId, $prod2, 1, 55.0, 'entregado'); // generará merma

        $payload = [
            'motivo_categoria' => 'retiro_sin_consumo',
            'motivo_detalle' => 'Grupo familiar se retiró por urgencia médica en sala',
            'confirmar_vacio' => true,
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$titularId}/anular-comanda", $payload, $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'pedido_id' => $pedidoId,
                    'mesa_id' => $titularId,
                    'mesa_numero' => 'Mesa [ 02 ; 03 ]',
                    'mesa_estado' => 'libre',
                    'total_anulado' => 95.0,
                    'items_total' => 2,
                ],
            ]);

        // Secundaria desvinculada
        $secundariaDB = DB::table('mesa')->where('id', $secundariaId)->first();
        $this->assertNull($secundariaDB->mesa_principal_id);

        // Pedido anulado
        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('anulado', $pedidoDB->estado);

        // Dos registros en pedido_anulacion con tipo 'comanda_completa'
        $anulaciones = DB::table('pedido_anulacion')->where('pedido_id', $pedidoId)->get();
        $this->assertCount(2, $anulaciones);

        $mermaItem = $anulaciones->firstWhere('es_merma', true);
        $noMermaItem = $anulaciones->firstWhere('es_merma', false);

        $this->assertNotNull($mermaItem);
        $this->assertEquals(18.00, (float) $mermaItem->costo_merma);

        $this->assertNotNull($noMermaItem);
        $this->assertEquals(0.00, (float) $noMermaItem->costo_merma);

        // Log de auditoría asentado
        $logDB = DB::table('log_auditoria')
            ->where('accion', 'ANULACION_COMANDA_COMPLETA')
            ->where('entidad_id', $pedidoId)
            ->first();
        $this->assertNotNull($logDB);

        // Ambas mesas deben reflejarse libres en el plano de salón
        $resPlano = $this->getJson("/api/v1/mozo/plano?piso_id={$pisoId}", $this->headers());
        $mesasPlano = collect($resPlano->json('datos.mesas'));
        $dtoTitular = $mesasPlano->firstWhere('id', $titularId);
        $dtoSecundaria = $mesasPlano->firstWhere('id', $secundariaId);

        $this->assertEquals('libre', $dtoTitular['estado']);
        $this->assertEquals('libre', $dtoSecundaria['estado']);
    }

    public function test_rechaza_anulacion_si_motivo_es_menor_a_10_caracteres(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '07');
        $pedidoId = $this->crearPedido($mesaId);

        $prodId = $this->crearProducto(30.0);
        $itemId = $this->agregarItem($pedidoId, $prodId, 1, 30.0);

        $payload = [
            'motivo_categoria' => 'otro',
            'motivo_detalle' => 'Corto', // 5 caracteres < 10
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", $payload, $this->headers());
        $response->assertStatus(422);

        // No debe haberse insertado registro en pedido_anulacion
        $this->assertDatabaseMissing('pedido_anulacion', ['pedido_item_id' => $itemId]);
    }

    public function test_rechaza_anulacion_si_pedido_ya_fue_cobrado(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '08');
        $pedidoId = $this->crearPedido($mesaId);

        // Marcar pedido como cobrado
        DB::table('pedido')->where('id', $pedidoId)->update(['estado' => 'cobrado']);

        $prodId = $this->crearProducto(30.0);
        $itemId = $this->agregarItem($pedidoId, $prodId, 1, 30.0);

        $payload = [
            'motivo_categoria' => 'error_toma',
            'motivo_detalle' => 'Intento de anulación en cuenta ya pagada',
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", $payload, $this->headers());
        $response->assertStatus(422);
    }

    public function test_anular_item_en_cola_con_stock_descontado_restituye_insumos_automaticamente(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '11');
        $pedidoId = $this->crearPedido($mesaId);

        // Crear insumo con stock inicial 9.5
        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Lomo Fino Test ' . Str::random(4),
            'unidad_medida' => 'kg',
            'stock_actual' => 9.500,
            'stock_minimo' => 2.000,
            'costo_unitario' => 30.00,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $prodId = $this->crearProducto(55.0, 18.0);
        DB::table('producto_insumo')->insert([
            'producto_id' => $prodId,
            'insumo_id' => $insumoId,
            'modo_calculo' => 'exacto',
            'cantidad_descuenta' => 0.500,
        ]);

        // Item en cola que tenía stock_descontado = true
        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $prodId,
            'cantidad' => 1,
            'precio_unitario' => 55.0,
            'estado' => 'en_cola',
            'numero_ronda' => 1,
            'stock_descontado' => true,
            'created_at' => now()->subMinutes(8),
            'updated_at' => now()->subMinutes(8),
        ]);

        $payload = [
            'motivo_categoria' => 'demora_cliente',
            'motivo_detalle' => 'Comensal cancela el plato antes de que entre a cocina',
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", $payload, $this->headers());
        $response->assertStatus(200);

        // Insumo debe haber aumentado en 0.500 (de 9.500 a 10.000)
        $insumoDB = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(10.000, (float) $insumoDB->stock_actual);

        // Pedido item debe tener stock_descontado = false
        $itemDB = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertEquals('anulado', $itemDB->estado);
        $this->assertFalse((bool) $itemDB->stock_descontado);
        $this->assertFalse((bool) $itemDB->es_merma);

        // Auditoría de anulación
        $anulacionDB = DB::table('pedido_anulacion')->where('pedido_item_id', $itemId)->first();
        $this->assertNotNull($anulacionDB);
        $this->assertFalse((bool) $anulacionDB->es_merma);
        $this->assertEquals(0.00, (float) $anulacionDB->costo_merma);
    }

    public function test_anular_item_servido_con_stock_descontado_mantiene_insumos_descontados_por_merma(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, '12');
        $pedidoId = $this->crearPedido($mesaId);

        // Crear insumo con stock 8.000
        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Pollo Brasa Test ' . Str::random(4),
            'unidad_medida' => 'und',
            'stock_actual' => 8.000,
            'stock_minimo' => 2.000,
            'costo_unitario' => 20.00,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $prodId = $this->crearProducto(40.0, 15.0);
        DB::table('producto_insumo')->insert([
            'producto_id' => $prodId,
            'insumo_id' => $insumoId,
            'modo_calculo' => 'exacto',
            'cantidad_descuenta' => 1.000,
        ]);

        // Item entregado que tenía stock_descontado = true
        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $prodId,
            'cantidad' => 1,
            'precio_unitario' => 40.0,
            'estado' => 'entregado',
            'numero_ronda' => 1,
            'stock_descontado' => true,
            'created_at' => now()->subMinutes(12),
            'updated_at' => now()->subMinutes(12),
        ]);

        $payload = [
            'motivo_categoria' => 'plato_caido',
            'motivo_detalle' => 'Plato resbaló al ser servido y fue desechado',
        ];

        $response = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", $payload, $this->headers());
        $response->assertStatus(200);

        // Insumo NO debe haber sido devuelto (debe seguir en 8.000)
        $insumoDB = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(8.000, (float) $insumoDB->stock_actual);

        // Pedido item debe registrar merma
        $itemDB = DB::table('pedido_item')->where('id', $itemId)->first();
        $this->assertEquals('anulado', $itemDB->estado);
        $this->assertTrue((bool) $itemDB->es_merma);

        // Auditoría con costo de merma
        $anulacionDB = DB::table('pedido_anulacion')->where('pedido_item_id', $itemId)->first();
        $this->assertNotNull($anulacionDB);
        $this->assertTrue((bool) $anulacionDB->es_merma);
        $this->assertEquals(15.00, (float) $anulacionDB->costo_merma);
    }
}
