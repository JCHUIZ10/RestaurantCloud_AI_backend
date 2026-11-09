<?php

namespace Tests\Feature;

use App\Domains\Caja\Services\ComprobanteDigitalService;
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

        $rawToken = 'test_token_caja_nc_'.Str::random(32);
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
            'Authorization' => 'Bearer '.$this->tokenCajero,
            'Accept' => 'application/json',
        ];
    }

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso Caja '.Str::random(4),
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
            'nombre' => 'Insumo '.Str::random(6),
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
            'nombre' => 'Cat '.Str::random(4),
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
            'nombre' => ($requierePreparacion ? 'Plato ' : 'Bebida ').Str::random(4),
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
    public function test_la_nota_de_credito_con_la_mesa_en_servicio_devuelve_el_consumo_a_pendiente(): void
    {
        $cajaId = $this->crearCajaAbierta(300.00);
        $mesaId = $this->crearMesa($this->crearPiso(), 'M05');
        $prodId = $this->crearProducto(40.00, 15.00, true);

        $pedidoId = $this->crearPedido($mesaId);
        DB::table('pedido')->where('id', $pedidoId)->update(['estado' => 'cuenta_pedida']);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 40.00, 'entregado', false);

        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'boleta', 'B001', 40.00, 'efectivo');
        $this->registrarComprobanteItem($comprobanteId, $itemId, $prodId, 'Plato Fondo', 1, 40.00);

        $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", [
                'motivo_codigo_sunat' => '01',
                'sustento_motivo' => 'Comensal devuelve el plato antes de cerrar la cuenta',
                'devolucion_metodo' => 'efectivo',
            ])
            ->assertStatus(200);

        $this->assertSame('pendiente', DB::table('pedido_item')->where('id', $itemId)->value('estado_pago'));
        $this->assertSame('cuenta_pedida', DB::table('pedido')->where('id', $pedidoId)->value('estado'));
    }

    public function test_la_nota_de_credito_de_una_cuenta_ya_cerrada_anula_el_pedido_y_no_reabre_consumos(): void
    {
        $cajaId = $this->crearCajaAbierta(300.00);
        $mesaId = $this->crearMesa($this->crearPiso(), 'M06');
        $prodId = $this->crearProducto(40.00, 15.00, true);

        $pedidoId = $this->crearPedido($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, 40.00, 'entregado', false);

        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, 'boleta', 'B001', 40.00, 'efectivo');
        $this->registrarComprobanteItem($comprobanteId, $itemId, $prodId, 'Plato Fondo', 1, 40.00);

        $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", [
                'motivo_codigo_sunat' => '01',
                'sustento_motivo' => 'Anulación de una cuenta que ya había sido cerrada',
                'devolucion_metodo' => 'efectivo',
            ])
            ->assertStatus(200);

        $this->assertSame('anulado', DB::table('pedido')->where('id', $pedidoId)->value('estado'));
        $this->assertSame('cobrado', DB::table('pedido_item')->where('id', $itemId)->value('estado_pago'));
    }

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
        $datos = $resTodos->json('datos.comprobantes');
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
        foreach ($resAnulados->json('datos.comprobantes') as $comp) {
            $this->assertEquals('anulado', $comp['estado']);
        }
    }

    /**
     * Crea una venta cobrada con un ítem y devuelve el id del comprobante.
     */
    private function crearVenta(string $cajaId, string $tipo, string $serie, float $total, string $medioPago = 'efectivo'): string
    {
        $mesaId = $this->crearMesa($this->crearPiso(), 'H'.Str::upper(Str::random(3)));
        $prodId = $this->crearProducto($total, $total / 3, true);
        $pedidoId = $this->crearPedido($mesaId);
        $itemId = $this->crearPedidoItem($pedidoId, $prodId, 1, $total);
        $comprobanteId = $this->crearComprobante($cajaId, $pedidoId, $tipo, $serie, $total, $medioPago);
        $this->registrarComprobanteItem($comprobanteId, $itemId, $prodId, 'Consumo '.$serie, 1, $total);

        return $comprobanteId;
    }

    private function anularConNotaCredito(string $comprobanteId, string $motivo = '02'): void
    {
        $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", [
                'motivo_codigo_sunat' => $motivo,
                'sustento_motivo' => 'Sustento de prueba para la nota de crédito',
                'devolucion_metodo' => 'efectivo',
            ])->assertStatus(200);
    }

    /**
     * Prueba 4b: El filtro de notas de crédito las lista aunque no sean "vigentes" y conservan su motivo.
     */
    public function test_filtro_notas_de_credito_lista_las_nc_con_su_motivo_y_documento_afectado(): void
    {
        $cajaId = $this->crearCajaAbierta();
        $facturaId = $this->crearVenta($cajaId, 'factura', 'F001', 30.00);
        $this->anularConNotaCredito($facturaId, '06');
        $tokenFactura = DB::table('comprobante')->where('id', $facturaId)->value('token_qr');

        $res = $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes?estado=nota_credito');
        $res->assertStatus(200);

        $filas = $res->json('datos.comprobantes');
        $this->assertCount(1, $filas);
        $nc = $filas[0];
        $this->assertEquals('nota_credito', $nc['tipo_comprobante']);
        $this->assertEquals('06', $nc['motivo_codigo_sunat']);
        $this->assertEquals('Devolución total', $nc['motivo_texto']);
        $this->assertEquals('Sustento de prueba para la nota de crédito', $nc['sustento_motivo']);
        $this->assertNotNull($nc['documento_modificado']);
        $this->assertEquals($tokenFactura, $nc['documento_modificado_token']);

        // El original anulado expone el motivo de la NC que lo anuló
        $anulados = $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes?estado=anulado')->json('datos.comprobantes');
        $this->assertCount(1, $anulados);
        $this->assertEquals('06', $anulados[0]['motivo_codigo_sunat']);
        $this->assertEquals($nc['serie_numero'], $anulados[0]['nota_credito_serie_numero']);
    }

    /**
     * Prueba 4c: El resumen del turno no depende de los filtros y el neto no cuenta lo anulado.
     */
    public function test_resumen_del_turno_es_independiente_de_los_filtros_y_el_neto_descuenta_la_nc(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');
        $yapeId = $this->crearVenta($cajaId, 'boleta', 'B001', 25.00, 'billetera_digital');
        DB::table('comprobante')->where('id', $yapeId)->update(['numero_operacion' => 'OP123456']);
        $facturaId = $this->crearVenta($cajaId, 'factura', 'F001', 30.00, 'efectivo');
        $this->anularConNotaCredito($facturaId);

        $sinFiltros = $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes')->assertStatus(200);
        $resumen = $sinFiltros->json('datos.resumen');

        $porMedio = collect($resumen['por_medio'])->keyBy('codigo');
        $this->assertEquals(50.00, $porMedio['efectivo']['neto']);
        $this->assertEquals(1, $porMedio['efectivo']['operaciones']);
        $this->assertEquals(40.00, $porMedio['tarjeta']['neto']);
        $this->assertEquals(25.00, $porMedio['billetera_digital']['neto']);
        $this->assertEquals(115.00, $resumen['total_neto']);
        $this->assertEquals(3, $resumen['vigentes_count']);
        $this->assertEquals(1, $resumen['anulados_count']);
        $this->assertEquals(1, $resumen['notas_credito']['count']);
        $this->assertEquals(30.00, $resumen['notas_credito']['monto']);

        $filtrado = $this->withHeaders($this->headers())
            ->getJson('/api/v1/caja/comprobantes?estado=anulado&medio_pago=efectivo')
            ->assertStatus(200);
        $this->assertEquals($resumen, $filtrado->json('datos.resumen'));

        // El filtro por medio de pago acota las filas, con el N° de operación y el nombre del método
        $soloYape = $this->withHeaders($this->headers())
            ->getJson('/api/v1/caja/comprobantes?estado=vigente&medio_pago=billetera_digital')
            ->json('datos.comprobantes');
        $this->assertCount(1, $soloYape);
        $this->assertEquals('OP123456', $soloYape[0]['numero_operacion']);
        $this->assertEquals('Yape / Plin', $soloYape[0]['metodo_pago_nombre']);
    }

    /**
     * Prueba 4d: El listado se pagina en el servidor.
     */
    public function test_listado_de_comprobantes_se_pagina_en_el_servidor(): void
    {
        $cajaId = $this->crearCajaAbierta();
        foreach (range(1, 3) as $indice) {
            $this->crearVenta($cajaId, 'boleta', 'B001', 10.00 + $indice);
        }

        $pagina1 = $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes?limite=2&pagina=1');
        $this->assertCount(2, $pagina1->json('datos.comprobantes'));
        $this->assertEquals(3, $pagina1->json('datos.paginacion.total'));
        $this->assertEquals(2, $pagina1->json('datos.paginacion.total_paginas'));

        $pagina2 = $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes?limite=2&pagina=2');
        $this->assertCount(1, $pagina2->json('datos.comprobantes'));

        // Una página fuera de rango devuelve la última
        $fuera = $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes?limite=2&pagina=9');
        $this->assertEquals(2, $fuera->json('datos.paginacion.pagina'));

        $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes?limite=500')->assertStatus(422);
    }

    /**
     * Prueba 4e: El detalle devuelve el desglose y la referencia fiscal cruzada; no expone otros turnos.
     */
    public function test_detalle_de_comprobante_incluye_desglose_y_referencia_cruzada(): void
    {
        $cajaId = $this->crearCajaAbierta();
        $boletaId = $this->crearVenta($cajaId, 'boleta', 'B001', 59.00);
        $this->anularConNotaCredito($boletaId, '01');
        $ncId = DB::table('comprobante')->where('comprobante_modificado_id', $boletaId)->value('id');

        $original = $this->withHeaders($this->headers())->getJson("/api/v1/caja/comprobantes/{$boletaId}")
            ->assertStatus(200)->json('datos');
        $this->assertEquals('anulado', $original['estado']);
        $this->assertEquals(59.00, $original['desglose']['total']);
        $this->assertCount(1, $original['items']);
        $this->assertEquals('Anulación de la operación', $original['nota_credito']['motivo_texto']);
        $this->assertNull($original['documento_afectado']);

        $nc = $this->withHeaders($this->headers())->getJson("/api/v1/caja/comprobantes/{$ncId}")
            ->assertStatus(200)->json('datos');
        $this->assertEquals(-59.00, $nc['desglose']['total']);
        $this->assertEquals($original['serie_numero'], $nc['documento_afectado']['serie_numero']);
        $this->assertEquals('01', $nc['documento_afectado']['motivo_codigo_sunat']);
        $this->assertNull($nc['nota_credito']);

        // Un comprobante de un turno anterior no se puede consultar
        $this->crearCajaAbierta();
        $this->withHeaders($this->headers())->getJson("/api/v1/caja/comprobantes/{$boletaId}")->assertStatus(404);
        $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes/no-es-uuid')->assertStatus(404);
    }

    /**
     * Escenario común: apertura 200; efectivo 50 + factura de efectivo 30 (luego anulada con NC); tarjeta 40.
     * Gaveta real: 200 + 50 + 30 - 30 = 250. Neto facturado: 50 + 40 = 90.
     */
    private function crearTurnoConNotaCreditoEnEfectivo(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');
        $facturaId = $this->crearVenta($cajaId, 'factura', 'F001', 30.00, 'efectivo');
        $this->anularConNotaCredito($facturaId);
    }

    /**
     * Prueba 4f: El balance pre-arqueo cuadra con una NC en efectivo: neto sin doble descuento y gaveta esperada real.
     */
    public function test_balance_pre_arqueo_con_nota_de_credito_calcula_el_neto_y_la_gaveta_correctos(): void
    {
        $this->crearTurnoConNotaCreditoEnEfectivo();

        $res = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->assertStatus(200);
        $d = $res->json('datos');

        // Conciliación de gaveta: Fondo + Ingresos brutos - Devoluciones = Esperado
        $this->assertEquals(80.00, $d['ingresos_efectivo']);
        $this->assertEquals(30.00, $d['egresos_devolucion_nc']);
        $this->assertEquals(250.00, $d['efectivo_esperado']);
        $this->assertEquals($d['efectivo_esperado'], $d['monto_apertura'] + $d['ingresos_efectivo'] - $d['egresos_devolucion_nc']);
        $this->assertEquals(2, $d['efectivo_operaciones']);

        // Lo esperado coincide con el saldo real de los movimientos de la gaveta
        $saldoGaveta = 200.00 + (float) DB::table('caja_movimiento')
            ->where('caja_id', DB::table('caja')->where('estado', 'abierta')->where('local_id', $this->localId)->value('id'))
            ->where('metodo_pago', 'efectivo')->where('tipo', '!=', 'apertura')->sum('monto');
        $this->assertEquals($saldoGaveta, $d['efectivo_esperado']);

        // Totales facturados: el neto no resta la NC dos veces y la tabla suma
        $this->assertEquals(90.00, $d['total_facturado_neto']);
        $this->assertEquals(2, $d['total_comprobantes']);
        $this->assertEquals(1, $d['notas_credito_count']);
        $this->assertEquals(1, $d['comprobantes_anulados_count']);
        $this->assertEquals(120.00, $d['total_ingresos_brutos']);
        $this->assertEquals(30.00, $d['total_egresos']);
        $this->assertEquals($d['total_facturado_neto'], $d['total_ingresos_brutos'] - $d['total_egresos']);
        $this->assertEquals(40.00, $d['tarjetas_pos_total']);
    }

    /**
     * Prueba 4g: El cierre de turno usa las mismas cifras que el pre-arqueo (sin discrepancia fantasma) y las deja en el Reporte Z.
     */
    public function test_cierre_de_turno_con_nota_de_credito_coincide_con_el_pre_arqueo(): void
    {
        $this->crearTurnoConNotaCreditoEnEfectivo();
        DB::table('pedido')
            ->where('local_id', $this->localId)
            ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->update(['estado' => 'cobrado', 'updated_at' => now()]);

        $balance = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->json('datos');

        // El cajero cuenta exactamente lo que hay en la gaveta
        $cierre = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(200);
        $z = $cierre->json('datos');

        $this->assertEquals(0.00, $z['discrepancia']);
        $this->assertEquals($balance['efectivo_esperado'], $z['efectivo_esperado']);
        $this->assertEquals($balance['total_facturado_neto'], $z['total_neto_facturado']);
        $this->assertEquals($balance['ingresos_efectivo'], $z['total_ventas_efectivo']);
        $this->assertEquals($balance['egresos_devolucion_nc'], $z['total_devoluciones_efectivo']);
        $this->assertEquals($balance['tarjetas_pos_total'], $z['total_tarjetas_pos']);
        $this->assertEquals(1, $z['notas_credito_emitidas']);

        // Fondo + Ventas efectivo - Devoluciones = Esperado, y los medios suman el neto facturado
        $this->assertEquals($z['efectivo_esperado'], $z['monto_apertura'] + $z['total_ventas_efectivo'] - $z['total_devoluciones_efectivo']);
        $this->assertEquals(
            $z['total_neto_facturado'],
            $z['total_efectivo_neto'] + $z['total_tarjetas_pos'] + $z['total_billeteras_digital'] + $z['otros_medios_total']
        );
    }

    /**
     * Prueba 4g-bis: Cerrar el mismo turno dos veces no duplica el Reporte Z, su auditoría ni el movimiento de cierre.
     */
    public function test_cerrar_turno_dos_veces_no_duplica_el_reporte_z(): void
    {
        $this->crearTurnoConNotaCreditoEnEfectivo();
        $cajaId = DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->value('id');
        DB::table('pedido')
            ->where('local_id', $this->localId)
            ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->update(['estado' => 'cobrado', 'updated_at' => now()]);

        $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(200);

        // Segundo intento (otra pestaña, otro usuario): el turno ya no está abierto
        $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_CAJA_NO_ABIERTA');

        $this->assertSame(1, DB::table('auditoria_caja_cierre')->where('caja_id', $cajaId)->count());
        $this->assertSame(1, DB::table('caja_movimiento')->where('caja_id', $cajaId)->where('tipo', 'cierre')->count());
        $this->assertSame('cerrada', DB::table('caja')->where('id', $cajaId)->value('estado'));
    }

    private function emitirNotaCreditoRaw(string $comprobanteId, string $devolucionMetodo)
    {
        return $this->withHeaders($this->headers())
            ->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", [
                'motivo_codigo_sunat' => '01',
                'sustento_motivo' => 'Sustento de prueba para la nota de crédito',
                'devolucion_metodo' => $devolucionMetodo,
            ]);
    }

    /**
     * Prueba 4g-ter: Una venta de tarjeta no puede devolverse en efectivo de la gaveta.
     */
    public function test_nota_de_credito_rechaza_devolver_en_efectivo_una_venta_de_tarjeta(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $ventaId = $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');

        $this->emitirNotaCreditoRaw($ventaId, 'efectivo')
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_DEVOLUCION_INCONSISTENTE');

        $this->assertSame('emitido', DB::table('comprobante')->where('id', $ventaId)->value('estado'));
        $this->assertSame(0, DB::table('comprobante')->where('caja_id', $cajaId)->where('tipo', 'nota_credito')->count());
        $this->assertSame(0, DB::table('caja_movimiento')->where('caja_id', $cajaId)->where('tipo', 'egreso_devolucion')->count());
    }

    /**
     * Prueba 4g-quater: Una venta en efectivo no puede "devolverse" por extorno: el dinero está en la gaveta.
     */
    public function test_nota_de_credito_rechaza_extorno_para_una_venta_en_efectivo(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $ventaId = $this->crearVenta($cajaId, 'boleta', 'B001', 25.00, 'efectivo');

        $this->emitirNotaCreditoRaw($ventaId, 'extorno_tarjeta')
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_DEVOLUCION_INCONSISTENTE');

        $this->assertSame('emitido', DB::table('comprobante')->where('id', $ventaId)->value('estado'));
        $this->assertSame(0, DB::table('caja_movimiento')->where('caja_id', $cajaId)->where('tipo', 'egreso_devolucion')->count());
    }

    /**
     * Prueba 4g-quinquies: Extornar una venta de tarjeta no toca la gaveta, pero sí aparece como devolución de la fila Tarjeta.
     */
    public function test_nota_de_credito_de_tarjeta_con_extorno_no_toca_la_gaveta(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $tarjetaId = $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');

        $antes = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->json('datos');

        $this->emitirNotaCreditoRaw($tarjetaId, 'extorno_tarjeta')->assertStatus(200);

        $despues = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->json('datos');

        $this->assertEquals($antes['efectivo_esperado'], $despues['efectivo_esperado']);
        $this->assertEquals(0.00, $despues['egresos_devolucion_nc']);
        $this->assertEquals(40.00, $despues['tarjetas_bruto']);
        $this->assertEquals(40.00, $despues['tarjetas_devoluciones']);
        $this->assertEquals(0.00, $despues['tarjetas_pos_total']);
    }

    /**
     * Prueba 4g-sexies: Por cada medio bruto - devoluciones = neto, la suma de filas es el total facturado y el Z repite el mismo efectivo neto.
     */
    public function test_balance_pre_arqueo_desglosa_bruto_devoluciones_y_neto_y_cuadra_con_el_z(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $efectivoAnuladoId = $this->crearVenta($cajaId, 'factura', 'F001', 30.00, 'efectivo');
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');
        $tarjetaAnuladaId = $this->crearVenta($cajaId, 'boleta', 'B001', 20.00, 'tarjeta');
        $this->crearVenta($cajaId, 'boleta', 'B001', 15.00, 'billetera_digital');

        $this->emitirNotaCreditoRaw($efectivoAnuladoId, 'efectivo')->assertStatus(200);
        $this->emitirNotaCreditoRaw($tarjetaAnuladaId, 'extorno_tarjeta')->assertStatus(200);

        $b = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->assertStatus(200)->json('datos');

        // Efectivo: 80 vendidos, 30 devueltos, 50 netos
        $this->assertEquals(80.00, $b['ingresos_efectivo']);
        $this->assertEquals(30.00, $b['efectivo_devoluciones']);
        $this->assertEquals(50.00, $b['efectivo_neto']);
        // Tarjeta: 60 vendidos, 20 extornados, 40 netos
        $this->assertEquals(60.00, $b['tarjetas_bruto']);
        $this->assertEquals(20.00, $b['tarjetas_devoluciones']);
        $this->assertEquals(40.00, $b['tarjetas_pos_total']);
        $this->assertEquals(15.00, $b['billeteras_total']);
        $this->assertEquals(0.00, $b['otros_cobros_total']);

        // Cada NC se cuenta bajo el medio de la venta que anula, no en la fila de efectivo
        $this->assertSame(2, $b['notas_credito_count']);
        $this->assertSame(1, $b['efectivo_nc']);
        $this->assertSame(1, $b['tarjetas_nc']);
        $this->assertSame(0, $b['billeteras_nc']);
        $this->assertSame(0, $b['otros_nc']);
        // Los cobros de la fila son brutos, como la columna Ingresos (la venta anulada sigue contando)
        $this->assertSame(2, $b['tarjetas_cobros_brutos']);
        $this->assertSame(1, $b['billeteras_cobros_brutos']);

        // En cada fila bruto - devoluciones = neto, y las filas suman el total facturado
        $this->assertEquals($b['efectivo_neto'], $b['ingresos_efectivo'] - $b['efectivo_devoluciones']);
        $this->assertEquals($b['tarjetas_pos_total'], $b['tarjetas_bruto'] - $b['tarjetas_devoluciones']);
        $this->assertEquals($b['billeteras_total'], $b['billeteras_bruto'] - $b['billeteras_devoluciones']);
        $this->assertEquals(
            $b['total_facturado_neto'],
            $b['efectivo_neto'] + $b['tarjetas_pos_total'] + $b['billeteras_total'] + $b['otros_cobros_total']
        );
        $this->assertEquals($b['total_facturado_neto'], $b['total_ingresos_brutos'] - $b['total_devoluciones']);

        // La conciliación de gaveta sigue siendo fondo + ingresos - egresos
        $this->assertEquals(200.00 + 80.00 - 30.00, $b['efectivo_esperado']);

        // El cierre repite las mismas cifras en el Reporte Z
        DB::table('pedido')
            ->where('local_id', $this->localId)
            ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->update(['estado' => 'cobrado', 'updated_at' => now()]);

        $z = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(200)
            ->json('datos');

        $this->assertEquals($b['efectivo_neto'], $z['total_efectivo_neto']);
        $this->assertEquals($b['tarjetas_pos_total'], $z['total_tarjetas_pos']);
        $this->assertEquals($b['billeteras_total'], $z['total_billeteras_digital']);
        $this->assertEquals($b['total_facturado_neto'], $z['total_neto_facturado']);
    }

    private function configurarMedioPago(string $codigo, string $nombre, bool $activo, int $orden): void
    {
        DB::table('metodo_pago_local')->updateOrInsert(
            ['local_id' => $this->localId, 'codigo' => $codigo],
            ['nombre' => $nombre, 'activo' => $activo, 'orden' => $orden]
        );
    }

    private function balancePreArqueo(): array
    {
        return $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->assertStatus(200)->json('datos');
    }

    private function marcarPedidosCobrados(): void
    {
        DB::table('pedido')
            ->where('local_id', $this->localId)
            ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->update(['estado' => 'cobrado', 'updated_at' => now()]);
    }

    /**
     * Prueba 4i: El balance omite el medio desactivado sin cobros, pero sus totales y el cuadre no cambian.
     */
    public function test_balance_pre_arqueo_omite_de_medios_visibles_el_medio_desactivado_sin_cobros(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->configurarMedioPago('billetera_digital', 'Yape / Plin', false, 3);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');

        $b = $this->balancePreArqueo();

        $this->assertSame(['efectivo', 'tarjeta'], $b['medios_visibles']);
        // Se oculta la fila, no el cálculo: el campo sigue en la respuesta, en cero
        $this->assertArrayHasKey('billeteras_total', $b);
        $this->assertEquals(0.00, $b['billeteras_total']);
        $this->assertEquals(0.00, $b['otros_cobros_total']);
        // Las filas visibles suman el total facturado, y la gaveta no depende de la visibilidad
        $this->assertEquals($b['total_facturado_neto'], $b['efectivo_neto'] + $b['tarjetas_pos_total']);
        $this->assertEquals(200.00 + 50.00 - 0.00, $b['efectivo_esperado']);
    }

    /**
     * Prueba 4j: Un medio desactivado reaparece si hubo cobros (aunque luego se anularan) o si se activa; el efectivo siempre está.
     */
    public function test_medios_visibles_incluye_el_medio_con_cobros_o_activo_y_siempre_el_efectivo(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->configurarMedioPago('billetera_digital', 'Yape / Plin', false, 3);
        $this->configurarMedioPago('efectivo', 'Efectivo', false, 1);

        // Efectivo desactivado y sin ventas: igual se muestra, la gaveta siempre se cuadra
        $this->assertSame(['efectivo', 'tarjeta'], $this->balancePreArqueo()['medios_visibles']);

        // Cobro en un medio desactivado: no se oculta una venta real, ni siquiera si luego se anula con NC
        $billeteraId = $this->crearVenta($cajaId, 'boleta', 'B001', 15.00, 'billetera_digital');
        $this->assertContains('billetera_digital', $this->balancePreArqueo()['medios_visibles']);

        $this->emitirNotaCreditoRaw($billeteraId, 'transferencia')->assertStatus(200);
        $b = $this->balancePreArqueo();
        $this->assertContains('billetera_digital', $b['medios_visibles']);
        $this->assertEquals(0.00, $b['billeteras_total']);
        $this->assertEquals(15.00, $b['billeteras_devoluciones']);

        // Medio activado: también se muestra, aunque no tenga cobros
        $this->configurarMedioPago('billetera_digital', 'Yape / Plin', true, 3);
        $this->assertContains('billetera_digital', $this->balancePreArqueo()['medios_visibles']);
    }

    /**
     * Prueba 4k: El Reporte Z guarda los medios que se mostraron y no cambia aunque después se reconfigure la sede.
     */
    public function test_cierre_guarda_medios_visibles_en_el_reporte_z_inmutable(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->configurarMedioPago('billetera_digital', 'Yape / Plin', false, 3);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');
        $this->marcarPedidosCobrados();

        $balance = $this->balancePreArqueo();
        $z = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(200)
            ->json('datos');

        $this->assertSame(['efectivo', 'tarjeta'], $z['medios_visibles']);
        $this->assertSame($balance['medios_visibles'], $z['medios_visibles']);
        // Los totales por medio siguen en el reporte (la billetera en cero) y cuadran con el neto
        $this->assertEquals(0.00, $z['total_billeteras_digital']);
        $this->assertEquals(
            $z['total_neto_facturado'],
            $z['total_efectivo_neto'] + $z['total_tarjetas_pos'] + $z['total_billeteras_digital'] + $z['otros_medios_total']
        );

        $guardado = json_decode(DB::table('auditoria_caja_cierre')->where('caja_id', $cajaId)->value('reporte_z_json'), true);
        $this->assertSame(['efectivo', 'tarjeta'], $guardado['medios_visibles']);

        // Reconfigurar la sede después del cierre no altera el reporte archivado
        $this->configurarMedioPago('billetera_digital', 'Yape / Plin', true, 3);
        $this->withHeaders($this->headers())
            ->getJson("/api/v1/caja/turnos/{$cajaId}/reporte-z")
            ->assertStatus(200)
            ->assertJsonPath('datos.medios_visibles', ['efectivo', 'tarjeta']);
    }

    /**
     * Prueba 4l: El PDF del Reporte Z omite las columnas de medios no visibles y un Z antiguo (sin la lista) las muestra todas.
     */
    public function test_pdf_del_reporte_z_oculta_columnas_de_medios_no_visibles(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $this->configurarMedioPago('billetera_digital', 'Yape / Plin', false, 3);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');
        $this->marcarPedidosCobrados();

        $z = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(200)
            ->json('datos');

        $html = view('pdf.reporte_z', ['reporte' => $z])->render();
        $this->assertStringContainsString('Efectivo Gaveta', $html);
        $this->assertStringContainsString('Tarjetas POS', $html);
        $this->assertStringNotContainsString('Billeteras Digitales', $html);
        $this->assertStringNotContainsString('Otros Medios', $html);

        // Lista completa: aparece la billetera
        $htmlCompleto = view('pdf.reporte_z', ['reporte' => array_merge($z, ['medios_visibles' => ['efectivo', 'tarjeta', 'billetera_digital']])])->render();
        $this->assertStringContainsString('Billeteras Digitales', $htmlCompleto);

        // Z cerrado antes de la regla (sin el campo): se ve como siempre, con todas las columnas
        $zAntiguo = $z;
        unset($zAntiguo['medios_visibles']);
        $htmlAntiguo = view('pdf.reporte_z', ['reporte' => $zAntiguo])->render();
        $this->assertStringContainsString('Tarjetas POS', $htmlAntiguo);
        $this->assertStringContainsString('Billeteras Digitales', $htmlAntiguo);
        $this->assertStringContainsString('Otros Medios', $htmlAntiguo);
    }

    public function test_recargos_separan_consumo_de_recargo_en_balance_z_y_pdf(): void
    {
        $cajaId = $this->crearCajaAbierta(100.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $tarjetaId = $this->crearVenta($cajaId, 'boleta', 'B001', 104.00, 'tarjeta');      // consumo 100 + 4 %
        $billeteraId = $this->crearVenta($cajaId, 'boleta', 'B001', 51.00, 'billetera_digital'); // consumo 50 + 2 %
        $anuladaId = $this->crearVenta($cajaId, 'boleta', 'B001', 52.00, 'tarjeta');       // consumo 50 + 4 %, se anula
        DB::table('comprobante')->where('id', $tarjetaId)->update(['monto_recargo' => 4.00]);
        DB::table('comprobante')->where('id', $billeteraId)->update(['monto_recargo' => 1.00]);
        DB::table('comprobante')->where('id', $anuladaId)->update(['monto_recargo' => 2.00]);
        $this->emitirNotaCreditoRaw($anuladaId, 'extorno_tarjeta')->assertStatus(200);

        $b = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->assertStatus(200)->json('datos');

        // La venta anulada no deja recargo vigente
        $this->assertEquals(4.00, $b['tarjetas_recargo']);
        $this->assertEquals(1.00, $b['billeteras_recargo']);
        $this->assertEquals(5.00, $b['total_recargos']);
        $this->assertEquals(205.00, $b['total_facturado_neto']);
        $this->assertEquals(200.00, $b['ingreso_consumo']);

        $this->marcarPedidosCobrados();
        $z = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 150.00])
            ->assertStatus(200)
            ->json('datos');

        $this->assertEquals(4.00, $z['recargo_tarjetas']);
        $this->assertEquals(1.00, $z['recargo_billeteras']);
        $this->assertEquals(200.00, $z['ingreso_consumo']);

        $html = view('pdf.reporte_z', ['reporte' => $z])->render();
        $this->assertStringContainsString('Consumo y Recargos', $html);
        $this->assertStringContainsString('Recargo por uso de tarjeta', $html);
        $this->assertStringContainsString('Recargo por uso de Yape', $html);

        // Sin recargos (o Z antiguo sin los campos) el bloque no aparece
        unset($z['total_recargos']);
        $this->assertStringNotContainsString('Consumo y Recargos', view('pdf.reporte_z', ['reporte' => $z])->render());
    }

    public function test_sin_recargos_el_balance_no_los_reporta(): void
    {
        $cajaId = $this->crearCajaAbierta(100.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00, 'tarjeta');

        $b = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->assertStatus(200)->json('datos');

        $this->assertEquals(0.00, $b['total_recargos']);
        $this->assertEquals($b['total_facturado_neto'], $b['ingreso_consumo']);
    }

    public function test_z_resume_ventas_por_tipo_y_descuentos_solo_de_lo_vigente(): void
    {
        $cajaId = $this->crearCajaAbierta(100.00);
        $this->crearVenta($cajaId, 'boleta', 'B001', 40.00);
        $conDescuentoId = $this->crearVenta($cajaId, 'boleta', 'B001', 90.00);
        $this->crearVenta($cajaId, 'factura', 'F001', 60.00);
        $this->crearVenta($cajaId, 'nota_venta', 'NV01', 25.00);
        $anuladaId = $this->crearVenta($cajaId, 'boleta', 'B001', 30.00);
        DB::table('comprobante')->where('id', $conDescuentoId)->update(['descuento' => 10.00]);
        DB::table('comprobante')->where('id', $anuladaId)->update(['descuento' => 5.00]);
        $this->emitirNotaCreditoRaw($anuladaId, 'efectivo')->assertStatus(200);

        $this->marcarPedidosCobrados();
        $z = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 315.00])
            ->assertStatus(200)
            ->json('datos');

        $porTipo = collect($z['ventas_por_tipo'])->keyBy('tipo');
        // La boleta anulada con NC no cuenta como venta vigente
        $this->assertSame(2, $porTipo['boleta']['cantidad']);
        $this->assertEquals(130.00, $porTipo['boleta']['monto']);
        $this->assertSame(1, $porTipo['factura']['cantidad']);
        $this->assertEquals(60.00, $porTipo['factura']['monto']);
        $this->assertSame(1, $porTipo['nota_venta']['cantidad']);
        $this->assertEquals(25.00, $porTipo['nota_venta']['monto']);
        $this->assertEquals(215.00, $porTipo->sum('monto'));
        $this->assertEquals($z['total_neto_facturado'], $porTipo->sum('monto'));

        // El descuento de la venta anulada tampoco cuenta
        $this->assertEquals(10.00, $z['descuentos_turno']['total']);
        $this->assertSame(1, $z['descuentos_turno']['comprobantes']);

        $html = view('pdf.reporte_z', ['reporte' => $z])->render();
        $this->assertStringContainsString('Ventas Vigentes por Tipo de Comprobante', $html);
        $this->assertStringContainsString('documento interno, no SUNAT', $html);
        $this->assertStringContainsString('Descuentos y promociones aplicados', $html);

        // Z antiguo sin los campos: la sección no aparece
        unset($z['ventas_por_tipo'], $z['descuentos_turno']);
        $this->assertStringNotContainsString('Ventas Vigentes por Tipo', view('pdf.reporte_z', ['reporte' => $z])->render());
    }

    public function test_detalle_de_notas_de_credito_en_balance_z_y_pdf(): void
    {
        $cajaId = $this->crearCajaAbierta(200.00);
        $efectivoId = $this->crearVenta($cajaId, 'boleta', 'B001', 30.00, 'efectivo');
        $tarjetaId = $this->crearVenta($cajaId, 'boleta', 'B001', 20.00, 'tarjeta');
        $this->crearVenta($cajaId, 'boleta', 'B001', 50.00, 'efectivo');
        $this->emitirNotaCreditoRaw($efectivoId, 'efectivo')->assertStatus(200);
        $this->emitirNotaCreditoRaw($tarjetaId, 'extorno_tarjeta')->assertStatus(200);

        $b = $this->withHeaders($this->headers())->getJson('/api/v1/caja/balance-pre-arqueo')->assertStatus(200)->json('datos');

        $this->assertCount(2, $b['notas_credito_detalle']);
        $porMedio = collect($b['notas_credito_detalle'])->keyBy('medio_pago');
        $this->assertEquals(30.00, $porMedio['efectivo']['monto']);
        $this->assertTrue($porMedio['efectivo']['afecta_gaveta']);
        $this->assertEquals(20.00, $porMedio['tarjeta']['monto']);
        $this->assertFalse($porMedio['tarjeta']['afecta_gaveta']);
        // Cada NC cita el comprobante que anula
        $this->assertStringStartsWith('B001-', $porMedio['efectivo']['documento_modificado']);

        $this->marcarPedidosCobrados();
        $z = $this->withHeaders($this->headers())
            ->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 250.00])
            ->assertStatus(200)
            ->json('datos');

        // El Z congela el detalle y el PDF lo imprime
        $this->assertSame($b['notas_credito_detalle'], $z['notas_credito_detalle']);
        $html = view('pdf.reporte_z', ['reporte' => $z])->render();
        $this->assertStringContainsString('Detalle de Notas de Crédito', $html);
        $this->assertStringContainsString($porMedio['efectivo']['documento'], $html);
        $this->assertStringContainsString('Salió de la gaveta', $html);

        // Z antiguo o turno sin NC: la sección no aparece
        unset($z['notas_credito_detalle']);
        $this->assertStringNotContainsString('Detalle de Notas de Crédito', view('pdf.reporte_z', ['reporte' => $z])->render());
    }

    /**
     * Prueba 4h: La vista pública enlaza el comprobante anulado con su NC, y la NC con el documento que modifica.
     */
    public function test_vista_publica_cruza_el_comprobante_anulado_con_su_nota_de_credito(): void
    {
        $cajaId = $this->crearCajaAbierta();
        $boletaId = $this->crearVenta($cajaId, 'boleta', 'B001', 59.00);
        $libreId = $this->crearVenta($cajaId, 'boleta', 'B001', 20.00);
        $this->anularConNotaCredito($boletaId, '01');

        $boleta = DB::table('comprobante')->where('id', $boletaId)->first();
        $nc = DB::table('comprobante')->where('comprobante_modificado_id', $boletaId)->first();

        // Original anulado: expone la NC con su motivo y un enlace a ella
        $publicoOriginal = $this->getJson("/api/v1/public/comprobantes/{$boleta->token_qr}")->assertStatus(200)->json('datos');
        $this->assertEquals('anulado', $publicoOriginal['estado']);
        $this->assertNull($publicoOriginal['documento_afectado']);
        $this->assertEquals($nc->serie.'-'.str_pad((string) $nc->correlativo, 8, '0', STR_PAD_LEFT), $publicoOriginal['nota_credito']['serie_numero']);
        $this->assertEquals('01', $publicoOriginal['nota_credito']['motivo_codigo']);
        $this->assertEquals('Anulación de la operación', $publicoOriginal['nota_credito']['motivo_texto']);
        $this->assertEquals('Sustento de prueba para la nota de crédito', $publicoOriginal['nota_credito']['sustento']);
        $this->assertEquals("/c/{$nc->token_qr}", $publicoOriginal['nota_credito']['url_publica']);

        // La NC: tipo propio, montos negativos tal como se guardan y referencia al documento que modifica
        $publicoNc = $this->getJson("/api/v1/public/comprobantes/{$nc->token_qr}")->assertStatus(200)->json('datos');
        $this->assertEquals('nota_credito', $publicoNc['tipo']);
        $this->assertEquals('Nota de Credito Electronica', $publicoNc['tipo_label']);
        $this->assertEquals('emitido', $publicoNc['estado']);
        $this->assertNull($publicoNc['nota_credito']);
        $this->assertEquals(-59.00, $publicoNc['totales']['total']);
        $this->assertEquals($publicoOriginal['serie_numero'], $publicoNc['documento_afectado']['serie_numero']);
        $this->assertEquals('boleta', $publicoNc['documento_afectado']['tipo']);
        $this->assertEquals('01', $publicoNc['documento_afectado']['motivo_codigo']);
        $this->assertEquals("/c/{$boleta->token_qr}", $publicoNc['documento_afectado']['url_publica']);

        // Un comprobante vigente no trae ninguna referencia
        $libre = DB::table('comprobante')->where('id', $libreId)->first();
        $publicoLibre = $this->getJson("/api/v1/public/comprobantes/{$libre->token_qr}")->assertStatus(200)->json('datos');
        $this->assertNull($publicoLibre['nota_credito']);
        $this->assertNull($publicoLibre['documento_afectado']);
    }

    /**
     * Prueba 4i: El PDF de una NC se titula como tal, cita el documento que modifica y acredita montos en positivo.
     */
    public function test_pdf_de_nota_de_credito_cita_el_documento_modificado_y_acredita_en_positivo(): void
    {
        $cajaId = $this->crearCajaAbierta();
        $facturaId = $this->crearVenta($cajaId, 'factura', 'F001', 59.00);
        $ventaId = $this->crearVenta($cajaId, 'boleta', 'B001', 20.00);
        $this->anularConNotaCredito($facturaId, '02');

        $servicio = app(ComprobanteDigitalService::class);
        $factura = $servicio->obtenerComprobante($facturaId);
        $ncId = DB::table('comprobante')->where('comprobante_modificado_id', $facturaId)->value('id');

        $html = $servicio->renderizarHtml($servicio->obtenerComprobante($ncId));
        $this->assertStringContainsString('NOTA DE CRÉDITO ELECTRÓNICA', $html);
        $this->assertStringContainsString('Documento que modifica', $html);
        $this->assertStringContainsString($factura->serie.'-'.str_pad((string) $factura->correlativo, 8, '0', STR_PAD_LEFT), $html);
        $this->assertStringContainsString('02 — Anulación por error en el RUC', $html);
        $this->assertStringContainsString('MONTO ACREDITADO', $html);
        $this->assertStringContainsString('S/ 59.00', $html);
        $this->assertStringNotContainsString('-59.00', $html);

        // Una venta normal conserva su formato
        $htmlVenta = $servicio->renderizarHtml($servicio->obtenerComprobante($ventaId));
        $this->assertStringContainsString('BOLETA', $htmlVenta);
        $this->assertStringContainsString('TOTAL', $htmlVenta);
        $this->assertStringNotContainsString('Documento que modifica', $htmlVenta);
        $this->assertStringNotContainsString('MONTO ACREDITADO', $htmlVenta);
    }

    /**
     * Prueba 4j: Un medio de pago desactivado se oculta del resumen y de los filtros, salvo que ya se haya cobrado con él en el turno.
     */
    public function test_medio_de_pago_desactivado_se_oculta_salvo_que_tenga_cobros_en_el_turno(): void
    {
        $cajaId = $this->crearCajaAbierta();
        DB::table('metodo_pago_local')->updateOrInsert(
            ['local_id' => $this->localId, 'codigo' => 'billetera_digital'],
            ['nombre' => 'Yape / Plin', 'activo' => false, 'orden' => 3]
        );
        $this->crearVenta($cajaId, 'boleta', 'B001', 20.00, 'efectivo');

        $medios = fn () => collect(
            $this->withHeaders($this->headers())->getJson('/api/v1/caja/comprobantes')->assertStatus(200)->json('datos.resumen.por_medio')
        )->keyBy('codigo');

        // Desactivado y sin cobros: no se muestra, pero sigue en la lista para que el arqueo lo encuentre
        $this->assertFalse($medios()['billetera_digital']['mostrar']);
        $this->assertFalse($medios()['billetera_digital']['activo']);
        $this->assertTrue($medios()['efectivo']['mostrar']);
        $this->assertTrue($medios()['tarjeta']['mostrar']);

        // Desactivado pero con un cobro en este turno: sigue visible para no ocultar ventas reales
        $this->crearVenta($cajaId, 'boleta', 'B001', 15.00, 'billetera_digital');
        $this->assertTrue($medios()['billetera_digital']['mostrar']);
        $this->assertFalse($medios()['billetera_digital']['activo']);
        $this->assertEquals(15.00, $medios()['billetera_digital']['neto']);

        // Activado: se muestra aunque no haya cobros
        $otraCaja = $this->crearCajaAbierta();
        DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)->where('codigo', 'billetera_digital')->update(['activo' => true]);
        $this->assertTrue($medios()['billetera_digital']['mostrar']);
        $this->assertNotSame($cajaId, $otraCaja);
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
