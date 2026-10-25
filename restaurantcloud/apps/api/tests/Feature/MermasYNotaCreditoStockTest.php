<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MermasYNotaCreditoStockTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $cajeroId = '00000000-0000-4000-8000-000000000105';
    private string $tokenCajero;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_caja_nc_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->cajeroId,
            'nombre' => 'Cajero Test NC',
            'correo' => 'cajero_nc@aurea.local',
            'rol' => 'cajero',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenCajero = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenCajero,
            'Accept' => 'application/json',
        ];
    }

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso Caja ' . Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pisoId;
    }

    private function crearMesa(string $pisoId, string $numero): string
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
            'permite_union' => true,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function crearCajaAbierta(float $montoApertura = 200.00): string
    {
        // Cerrar cualquier caja previa abierta para asegurar aislamiento
        DB::table('caja')
            ->where('local_id', $this->localId)
            ->where('estado', 'abierta')
            ->update(['estado' => 'cerrada', 'updated_at' => now()]);

        $cajaId = (string) Str::uuid();
        $ultimoCorrelativo = (int) (DB::table('caja')->where('local_id', $this->localId)->max('correlativo') ?? 0);

        DB::table('caja')->insert([
            'id' => $cajaId,
            'local_id' => $this->localId,
            'cajero_id' => $this->cajeroId,
            'correlativo' => $ultimoCorrelativo + 1,
            'fecha_apertura' => now(),
            'monto_apertura' => $montoApertura,
            'estado' => 'abierta',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('caja_movimiento')->insert([
            'id' => (string) Str::uuid(),
            'caja_id' => $cajaId,
            'local_id' => $this->localId,
            'tipo' => 'apertura',
            'monto' => $montoApertura,
            'metodo_pago' => 'efectivo',
            'descripcion' => 'Apertura de turno test',
            'created_at' => now(),
        ]);

        return $cajaId;
    }

    private function crearInsumo(float $stockInicial, string $unidad = 'und'): string
    {
        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Insumo ' . Str::random(6),
            'unidad_medida' => $unidad,
            'stock_actual' => $stockInicial,
            'stock_minimo' => 5.0,
            'costo_unitario' => 3.50,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $insumoId;
    }

    private function crearProducto(float $precio, float $costoEstandar, bool $requierePreparacion = true): string
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
            'nombre' => ($requierePreparacion ? 'Plato ' : 'Bebida ') . Str::random(4),
            'precio' => $precio,
            'costo_estandar' => $costoEstandar,
            'disponibilidad' => 'disponible',
            'requiere_preparacion' => $requierePreparacion,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $prodId;
    }

    private function asociarInsumo(string $productoId, string $insumoId, float $cantidadDescuenta = 1.0): void
    {
        DB::table('producto_insumo')->insert([
            'producto_id' => $productoId,
            'insumo_id' => $insumoId,
            'modo_calculo' => 'rendimiento',
            'rendimiento_platos' => 1.0,
            'cantidad_descuenta' => $cantidadDescuenta,
        ]);
    }

    private function crearPedido(string $mesaId): string
    {
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'numero_comanda' => 901,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->cajeroId,
            'estado' => 'cobrado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pedidoId;
    }

    private function crearPedidoItem(
        string $pedidoId,
        string $productoId,
        int $cantidad,
        float $precio,
        string $estado = 'entregado',
        bool $stockDescontado = true
    ): string {
        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio,
            'estado' => $estado,
            'stock_descontado' => $stockDescontado,
            'es_merma' => false,
            'estado_pago' => 'cobrado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $itemId;
    }

    private function crearComprobante(
        string $cajaId,
        string $pedidoId,
        string $tipo,
        string $serie,
        float $total,
        string $medioPago = 'efectivo'
    ): string {
        $compPubId = (string) Str::uuid();
        $baseImponible = round($total / 1.18, 2);
        $igv = round($total - $baseImponible, 2);

        $metodoPagoId = DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)
            ->where('codigo', $medioPago)
            ->value('id');

        $correlativo = (int) (DB::table('comprobante')->where('serie', $serie)->max('correlativo') ?? 0) + 1;

        DB::table('comprobante')->insert([
            'id' => $compPubId,
            'pedido_id' => $pedidoId,
            'caja_id' => $cajaId,
            'tipo' => $tipo,
            'serie' => $serie,
            'correlativo' => $correlativo,
            'documento_cliente' => '47891234',
            'nombre_cliente' => 'Cliente Test Anulacion',
            'telefono_envio' => '987654321',
            'email_envio' => 'test@aurea.local',
            'metodo_pago_id' => $metodoPagoId,
            'medio_pago' => $medioPago,
            'subtotal_consumo' => $total,
            'descuento' => 0.00,
            'total' => $total,
            'base_imponible' => $baseImponible,
            'igv' => $igv,
            'estado' => 'emitido',
            'token_qr' => (string) Str::uuid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Registrar ingreso en caja_movimiento si fue en efectivo
        if ($medioPago === 'efectivo') {
            DB::table('caja_movimiento')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $cajaId,
                'local_id' => $this->localId,
                'tipo' => 'ingreso_venta',
                'monto' => $total,
                'metodo_pago' => 'efectivo',
                'comprobante_id' => $compPubId,
                'descripcion' => "{$tipo} {$serie}-{$correlativo}",
                'created_at' => now(),
            ]);
        }

        return $compPubId;
    }

    private function registrarComprobanteItem(
        string $comprobanteId,
        string $pedidoItemId,
        string $productoId,
        string $descripcion,
        int $cantidad,
        float $precio
    ): void {
        $subtotal = round($cantidad * $precio, 2);
        $base = round($subtotal / 1.18, 2);
        $igv = round($subtotal - $base, 2);

        DB::table('comprobante_item')->insert([
            'id' => (string) Str::uuid(),
            'comprobante_id' => $comprobanteId,
            'pedido_item_id' => $pedidoItemId,
            'producto_id' => $productoId,
            'descripcion' => $descripcion,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio,
            'subtotal' => $subtotal,
            'base_imponible' => $base,
            'igv' => $igv,
            'created_at' => now(),
        ]);
    }

    /**
     * Prueba 1: Preparar anulación retorna el desglose fiscal y clasifica la elegibilidad de restitución de ítems sellados.
     */
    public function test_preparar_anulacion_retorna_desglose_y_elegibilidad_de_items_sellados(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, 'M01');

        $insumoCocinaId = $this->crearInsumo(10.0, 'kg');
        $insumoBebidaId = $this->crearInsumo(24.0, 'und');

        $prodCocinaId = $this->crearProducto(35.00, 12.00, true);
        $this->asociarInsumo($prodCocinaId, $insumoCocinaId, 0.35);

        $prodBebidaId = $this->crearProducto(10.00, 3.50, false);
        $this->asociarInsumo($prodBebidaId, $insumoBebidaId, 1.0);

        $pedidoId = $this->crearPedido($mesaId);
        $itemCocinaId = $this->crearPedidoItem($pedidoId, $prodCocinaId, 1, 35.00, 'entregado', true);
        $itemBebidaId = $this->crearPedidoItem($pedidoId, $prodBebidaId, 1, 10.00, 'entregado', true);

        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'boleta', 'B001', 45.00, 'efectivo');
        $this->registrarComprobanteItem($comprobanteId, $itemCocinaId, $prodCocinaId, 'Plato Cocina Test', 1, 35.00);
        $this->registrarComprobanteItem($comprobanteId, $itemBebidaId, $prodBebidaId, 'Bebida Sellada Test', 1, 10.00);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/v1/caja/comprobantes/{$comprobanteId}/preparar-anulacion");

        $response->assertStatus(200);
        $response->assertJson([
            'exito' => true,
            'datos' => [
                'comprobante_id' => $comprobanteId,
                'tipo_comprobante_original' => 'boleta',
                'serie_nota_credito_sugerida' => 'BC01',
                'total_original' => 45.00,
                'efectivo_gaveta_actual' => 245.00, // 200 apertura + 45 cobrado
                'efectivo_gaveta_proyectado' => 200.00, // extorno proyectado de 45
            ],
        ]);

        $items = $response->json('datos.items');
        $this->assertCount(2, $items);

        $itemCocina = collect($items)->firstWhere('id', $itemCocinaId);
        $this->assertNotNull($itemCocina);
        $this->assertTrue($itemCocina['requiere_preparacion']);
        $this->assertFalse($itemCocina['es_sellado_elegible']);

        $itemBebida = collect($items)->firstWhere('id', $itemBebidaId);
        $this->assertNotNull($itemBebida);
        $this->assertFalse($itemBebida['requiere_preparacion']);
        $this->assertTrue($itemBebida['es_sellado_elegible']);
    }

    /**
     * Prueba 2: Emitir Nota de Crédito restituye el stock de los ítems sellados seleccionados y NO restituye cocina.
     */
    public function test_emitir_nota_credito_restituye_stock_de_item_sellado_seleccionado_y_no_restituye_cocina(): void
    {
        $cajaId = $this->crearCajaAbierta(300.00);
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, 'M02');

        $insumoCocinaId = $this->crearInsumo(8.0, 'kg');
        $insumoBebidaId = $this->crearInsumo(20.0, 'und');

        $prodCocinaId = $this->crearProducto(40.00, 15.00, true);
        $this->asociarInsumo($prodCocinaId, $insumoCocinaId, 0.5);

        $prodBebidaId = $this->crearProducto(12.00, 4.00, false);
        $this->asociarInsumo($prodBebidaId, $insumoBebidaId, 1.0);

        $pedidoId = $this->crearPedido($mesaId);
        $itemCocinaId = $this->crearPedidoItem($pedidoId, $prodCocinaId, 1, 40.00, 'entregado', true);
        $itemBebidaId = $this->crearPedidoItem($pedidoId, $prodBebidaId, 1, 12.00, 'entregado', true);

        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'boleta', 'B001', 52.00, 'efectivo');
        $this->registrarComprobanteItem($comprobanteId, $itemCocinaId, $prodCocinaId, 'Plato Fondo', 1, 40.00);
        $this->registrarComprobanteItem($comprobanteId, $itemBebidaId, $prodBebidaId, 'Gaseosa 500ml', 1, 12.00);

        // Emitir NC restituyendo SOLO el item de bebida sellada
        $payload = [
            'motivo_codigo_sunat' => '01',
            'sustento_motivo' => 'Comensal solicita anulación por inconformidad y devuelve bebida sellada',
            'devolucion_metodo' => 'efectivo',
            'items_reingresar_stock' => [$itemBebidaId],
        ];

        $response = $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", $payload);

        $response->assertStatus(200);
        $ncData = $response->json('datos');

        $this->assertEquals('nota_credito', $ncData['tipo_comprobante']);
        $this->assertEquals('BC01', $ncData['serie']);
        $this->assertEquals(-52.00, $ncData['importe_rectificado']);
        $this->assertEquals(300.00, $ncData['efectivo_gaveta_nuevo']); // 300 inicial + 52 venta - 52 devolucion

        // 1. Comprobante original pasa a 'anulado'
        $this->assertDatabaseHas('comprobante', [
            'id' => $comprobanteId,
            'estado' => 'anulado',
        ]);

        // 2. Nota de crédito registrada en comprobante
        $this->assertDatabaseHas('comprobante', [
            'id' => $ncData['nota_credito_id'],
            'tipo' => 'nota_credito',
            'comprobante_modificado_id' => $comprobanteId,
            'motivo_codigo_sunat' => '01',
            'estado' => 'emitido',
            'total' => -52.00,
        ]);

        // 3. Movimiento de egreso en caja_movimiento
        $this->assertDatabaseHas('caja_movimiento', [
            'caja_id' => $cajaId,
            'tipo' => 'egreso_devolucion',
            'monto' => -52.00,
            'metodo_pago' => 'efectivo',
        ]);

        // 4. Verificación de Bodega: Bebida reingresada (+1.0 und), Cocina intacta (8.0 kg)
        $stockBebida = (float) DB::table('insumo')->where('id', $insumoBebidaId)->value('stock_actual');
        $this->assertEquals(21.0, $stockBebida); // 20.0 + 1.0

        $stockCocina = (float) DB::table('insumo')->where('id', $insumoCocinaId)->value('stock_actual');
        $this->assertEquals(8.0, $stockCocina); // No se devolvió porque no se marcó y es cocina

        // 5. Auditoría inmutable registrada con motivo 'ingreso_manual'
        $this->assertDatabaseHas('auditoria_stock_ajuste', [
            'insumo_id' => $insumoBebidaId,
            'motivo' => 'ingreso_manual',
            'diferencia' => 1.0,
        ]);

        // 6. El item de bebida sellada conmuta stock_descontado a false
        $this->assertDatabaseHas('pedido_item', [
            'id' => $itemBebidaId,
            'stock_descontado' => false,
        ]);

        // 7. Pedido pasa a estado 'anulado'
        $this->assertDatabaseHas('pedido', [
            'id' => $pedidoId,
            'estado' => 'anulado',
        ]);
    }

    /**
     * Prueba 3: Idempotencia - No permite anular un comprobante que ya fue anulado.
     */
    public function test_no_permite_anular_comprobante_ya_anulado_idempotencia(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, 'M03');
        $prodId = $this->crearProducto(20.00, 5.00, true);
        $pedidoId = $this->crearPedido($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 20.00);
        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'boleta', 'B001', 20.00);
        $this->registrarComprobanteItem($comprobanteId, $itemId, $prodId, 'Prod', 1, 20.00);

        $payload = [
            'motivo_codigo_sunat' => '01',
            'sustento_motivo' => 'Anulación inicial de prueba',
            'devolucion_metodo' => 'efectivo',
        ];

        // Primera emisión: 200 OK
        $res1 = $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", $payload);
        $res1->assertStatus(200);

        // Segunda emisión idéntica: 409 COMPROBANTE_YA_ANULADO
        $res2 = $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", $payload);
        $res2->assertStatus(409);
        $res2->assertJson(['exito' => false, 'errores' => [['codigo' => 'COMPROBANTE_YA_ANULADO']]]);

        // Preparar anulación de comprobante anulado: 409 COMPROBANTE_YA_ANULADO
        $res3 = $this->withHeaders($this->headers())
            ->getJson("/api/v1/caja/comprobantes/{$comprobanteId}/preparar-anulacion");
        $res3->assertStatus(409);
    }

    /**
     * Prueba 4: Listado de comprobantes del turno activo con filtros y metadatos de Notas de Crédito.
     */
    public function test_listar_comprobantes_turno_con_filtros(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, 'M04');
        $prodId = $this->crearProducto(30.00, 10.00, true);
        $pedidoId = $this->crearPedido($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 30.00);
        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'factura', 'F001', 30.00);
        $this->registrarComprobanteItem($comprobanteId, $itemId, $prodId, 'Prod Factura', 1, 30.00);

        // Emitir NC sobre la factura (asignará FC01)
        $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", [
                'motivo_codigo_sunat' => '02',
                'sustento_motivo' => 'Corrección de razón social por error en digitación',
                'devolucion_metodo' => 'efectivo',
            ])->assertStatus(200);

        // Listar todos
        $resTodos = $this->withHeaders($this->headers())
            ->getJson('/api/v1/caja/comprobantes?estado=todos');
        $resTodos->assertStatus(200);
        $datos = $resTodos->json('datos');
        $this->assertNotEmpty($datos);

        $facturaAnulada = collect($datos)->firstWhere('id', $comprobanteId);
        $this->assertNotNull($facturaAnulada);
        $this->assertEquals('anulado', $facturaAnulada['estado']);
        $this->assertNotNull($facturaAnulada['nota_credito_serie_numero']);

        $notaCredito = collect($datos)->firstWhere('tipo_comprobante', 'nota_credito');
        $this->assertNotNull($notaCredito);
        $this->assertEquals('FC01', $notaCredito['serie']);
        $this->assertNotNull($notaCredito['documento_modificado']);

        // Filtro por estado 'anulado'
        $resAnulados = $this->withHeaders($this->headers())
            ->getJson('/api/v1/caja/comprobantes?estado=anulado');
        $resAnulados->assertStatus(200);
        foreach ($resAnulados->json('datos') as $comp) {
            $this->assertEquals('anulado', $comp['estado']);
        }
    }

    /**
     * Prueba 5: Actualizar información de contacto (WhatsApp / Correo) para entrega asistida.
     */
    public function test_actualizar_contacto_comprobante(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, 'M05');
        $prodId = $this->crearProducto(15.00, 5.00, true);
        $pedidoId = $this->crearPedido($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 15.00);
        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'boleta', 'B001', 15.00);
        $this->registrarComprobanteItem($comprobanteId, $itemId, $prodId, 'Prod Simple', 1, 15.00);

        $response = $this->withHeaders($this->headers())
            ->patchJson("/api/v1/caja/comprobantes/{$comprobanteId}/contacto", [
                'telefono_envio' => '911222333',
                'email_envio' => 'nuevo_cliente@correo.com',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('comprobante', [
            'id' => $comprobanteId,
            'telefono_envio' => '911222333',
            'email_envio' => 'nuevo_cliente@correo.com',
        ]);
    }
}
