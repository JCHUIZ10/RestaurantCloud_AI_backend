<?php

namespace Tests\Feature;

use App\Domains\Eventos\Jobs\EntregarEventoJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\VerificaContratoDeEventos;
use Tests\TestCase;

/**
 * Publicación de los eventos del núcleo en el outbox (doc-2u/servicios/eventos.md).
 */
class EventosOutboxPublicacionTest extends TestCase
{
    use VerificaContratoDeEventos;

    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $mozoId = '00000000-0000-4000-8000-000000000103';

    private string $cajeroId = '00000000-0000-4000-8000-000000000105';

    private string $cocineroId = '00000000-0000-4000-8000-000000000106';

    private string $tokenCajero;

    private string $tokenMozo;

    private string $tokenCocina;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        config([
            'eventos.destinos.ms-analitica' => ['url' => 'http://analitica.test', 'secreto' => 'secreto-analitica'],
            'eventos.destinos.ms-notificaciones' => ['url' => 'http://notificaciones.test', 'secreto' => 'secreto-notificaciones'],
        ]);

        $this->tokenCajero = $this->sesion($this->cajeroId, 'cajero');
        $this->tokenMozo = $this->sesion($this->mozoId, 'mozo');
        $this->tokenCocina = $this->sesion($this->cocineroId, 'cocina');
    }

    private function sesion(string $usuarioId, string $rol): string
    {
        $token = "test_token_eventos_{$rol}_".Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $usuarioId,
            'nombre' => "Usuario {$rol}",
            'correo' => "{$rol}.eventos@aurea.local",
            'rol' => $rol,
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        return $token;
    }

    /**
     * @return array<string, string>
     */
    private function headers(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    private function asegurarCajaAbierta(): void
    {
        if (DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->exists()) {
            return;
        }

        DB::table('caja')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'cajero_id' => $this->cajeroId,
            'monto_apertura' => 250.00,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function crearMesa(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso '.Str::random(4),
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
            'numero' => 'E'.random_int(100, 999),
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

    /**
     * @return array{producto_id: string, categoria_id: string, categoria_nombre: string, nombre: string}
     */
    private function crearProducto(float $precio, float $costoEstandar): array
    {
        $categoriaId = (string) Str::uuid();
        $categoriaNombre = 'Fondos '.Str::random(4);
        DB::table('categoria_producto')->insert([
            'id' => $categoriaId,
            'local_id' => $this->localId,
            'nombre' => $categoriaNombre,
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productoId = (string) Str::uuid();
        $nombre = 'Lomo saltado '.Str::random(4);
        DB::table('producto')->insert([
            'id' => $productoId,
            'categoria_id' => $categoriaId,
            'local_id' => $this->localId,
            'nombre' => $nombre,
            'precio' => $precio,
            'costo_estandar' => $costoEstandar,
            'disponibilidad' => 'disponible',
            'requiere_preparacion' => true,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['producto_id' => $productoId, 'categoria_id' => $categoriaId, 'categoria_nombre' => $categoriaNombre, 'nombre' => $nombre];
    }

    private function crearPedido(string $mesaId, string $estado): string
    {
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => random_int(5000, 9999),
            'comensales' => 3,
            'estado' => $estado,
            'tipo_comprobante_sugerido' => 'boleta',
            'medio_pago_sugerido' => 'efectivo',
            'created_at' => now()->subMinutes(20),
            'updated_at' => now()->subMinutes(20),
        ]);

        return $pedidoId;
    }

    private function agregarItem(string $pedidoId, string $productoId, int $cantidad, float $precio, string $estado): string
    {
        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio,
            'estado' => $estado,
            'estado_pago' => 'pendiente',
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now()->subMinutes(15),
            'updated_at' => now()->subMinutes(15),
        ]);

        return $itemId;
    }

    /**
     * Pedido servido de 2 × S/ 38.00 listo para cobrar.
     *
     * @return array{pedido_id: string, producto: array{producto_id: string, categoria_id: string, categoria_nombre: string, nombre: string}}
     */
    private function prepararCuentaPorCobrar(): array
    {
        $this->asegurarCajaAbierta();
        $producto = $this->crearProducto(38.00, 14.50);
        $pedidoId = $this->crearPedido($this->crearMesa(), 'cuenta_pedida');
        $this->agregarItem($pedidoId, $producto['producto_id'], 2, 38.00, 'entregado');

        return ['pedido_id' => $pedidoId, 'producto' => $producto];
    }

    private function cobrar(string $pedidoId, float $montoRecibido = 100.00): TestResponse
    {
        return $this->postJson('/api/v1/caja/cobrar', [
            'pedido_id' => $pedidoId,
            'tipo_comprobante' => 'boleta',
            'medio_pago' => 'efectivo',
            'monto_recibido' => $montoRecibido,
        ], $this->headers($this->tokenCajero));
    }

    /**
     * @return array<string, mixed>
     */
    private function sobreDe(string $tipo, string $agregadoId): array
    {
        $payload = DB::table('outbox_event')
            ->where('tipo_evento', $tipo)
            ->where('agregado_id', $agregadoId)
            ->value('payload');

        $this->assertNotNull($payload, "No se publicó {$tipo} para {$agregadoId}.");

        return json_decode($payload, true);
    }

    public function test_el_cobro_publica_venta_registrada_con_el_cuerpo_del_contrato_y_su_entrega(): void
    {
        ['pedido_id' => $pedidoId, 'producto' => $producto] = $this->prepararCuentaPorCobrar();

        $this->cobrar($pedidoId)->assertStatus(200);

        $comprobanteId = DB::table('comprobante')->where('pedido_id', $pedidoId)->value('id');
        $sobre = $this->sobreDe('venta.registrada', $comprobanteId);

        $this->assertSame('venta.registrada', $sobre['tipo']);
        $this->assertSame(1, $sobre['version']);
        $this->assertSame('nucleo', $sobre['origen']);
        $this->assertSame($this->empresaId, $sobre['empresa_id']);
        $this->assertSame($this->localId, $sobre['local_id']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/', $sobre['ocurrido_en']);

        $datos = $sobre['datos'];
        $this->assertContratoDeEvento('venta.registrada.cuenta_completa', $datos);
        $this->assertSame($comprobanteId, $datos['comprobante_id']);
        $this->assertSame($pedidoId, $datos['pedido_id']);
        $this->assertSame('boleta', $datos['tipo']);
        $this->assertSame($sobre['ocurrido_en'], $datos['fecha']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $datos['fecha_operativa']);
        $this->assertSame($this->mozoId, $datos['mozo_id']);
        $this->assertSame('Carlos Huamán', $datos['mozo_nombre']);
        $this->assertSame(3, $datos['comensales']);
        $this->assertSame('efectivo', $datos['medio_pago']);
        $this->assertEquals(76.00, $datos['subtotal_consumo']);
        $this->assertEquals(0.00, $datos['descuento']);
        $this->assertEquals(0.00, $datos['monto_recargo']);
        $this->assertEquals(76.00, $datos['total']);
        $this->assertNull($datos['promocion_id']);
        $this->assertCount(1, $datos['items']);
        $this->assertEquals([
            'producto_id' => $producto['producto_id'],
            'nombre' => $producto['nombre'],
            'categoria_id' => $producto['categoria_id'],
            'categoria_nombre' => $producto['categoria_nombre'],
            'cantidad' => 2,
            'precio_unitario' => 38.00,
            'subtotal' => 76.00,
            'costo_estandar' => 14.50,
        ], $datos['items'][0]);

        // Sin datos personales del comensal.
        $this->assertArrayNotHasKey('documento_cliente', $datos);
        $this->assertArrayNotHasKey('nombre_cliente', $datos);

        $entregas = DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->get();
        $this->assertSame(['ms-analitica'], $entregas->pluck('destino')->all());
        $this->assertSame('pendiente', $entregas[0]->estado);
        Queue::assertPushed(EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => $job->entregaId === $entregas[0]->id);
    }

    public function test_el_cobro_de_una_subcuenta_publica_su_venta_sin_comensales(): void
    {
        ['pedido_id' => $pedidoId, 'producto' => $producto] = $this->prepararCuentaPorCobrar();
        $itemId = DB::table('pedido_item')->where('pedido_id', $pedidoId)->value('id');

        $subcuentaId = (string) Str::uuid();
        DB::table('pedido_subcuenta')->insert([
            'id' => $subcuentaId,
            'pedido_id' => $pedidoId,
            'numero_subcuenta' => 1,
            'subtotal_bruto' => 38.00,
            'descuento' => 0,
            'total' => 38.00,
            'medio_pago' => 'efectivo',
            'tipo_comprobante' => 'boleta',
            'nombre_cliente' => 'Cliente General',
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('pedido_subcuenta_item')->insert([
            'id' => (string) Str::uuid(),
            'subcuenta_id' => $subcuentaId,
            'pedido_item_id' => $itemId,
            'cantidad' => 1,
            'precio_unitario' => 38.00,
            'subtotal' => 38.00,
        ]);

        $this->postJson('/api/v1/caja/cobrar', [
            'pedido_id' => $pedidoId,
            'subcuenta_id' => $subcuentaId,
            'tipo_comprobante' => 'boleta',
            'medio_pago' => 'efectivo',
            'monto_recibido' => 50.00,
        ], $this->headers($this->tokenCajero))->assertStatus(200);

        $comprobanteId = DB::table('comprobante')->where('subcuenta_id', $subcuentaId)->value('id');
        $datos = $this->sobreDe('venta.registrada', $comprobanteId)['datos'];

        $this->assertContratoDeEvento('venta.registrada.subcuenta', $datos);
        $this->assertNull($datos['comensales']);
        $this->assertEquals(38.00, $datos['total']);
        $this->assertSame(1, $datos['items'][0]['cantidad']);
        $this->assertSame($producto['producto_id'], $datos['items'][0]['producto_id']);
    }

    public function test_un_cobro_rechazado_no_publica_eventos(): void
    {
        ['pedido_id' => $pedidoId] = $this->prepararCuentaPorCobrar();
        $eventosAntes = DB::table('outbox_event')->count();

        $this->cobrar($pedidoId, montoRecibido: 10.00)->assertStatus(422);

        $this->assertSame($eventosAntes, DB::table('outbox_event')->count());
        Queue::assertNotPushed(EntregarEventoJob::class);
    }

    public function test_sin_destinos_configurados_el_evento_queda_registrado_y_sin_entregas(): void
    {
        config(['eventos.destinos.ms-analitica.url' => null]);
        ['pedido_id' => $pedidoId] = $this->prepararCuentaPorCobrar();

        $this->cobrar($pedidoId)->assertStatus(200);

        $comprobanteId = DB::table('comprobante')->where('pedido_id', $pedidoId)->value('id');
        $evento = DB::table('outbox_event')->where('tipo_evento', 'venta.registrada')->where('agregado_id', $comprobanteId)->first();

        $this->assertSame('procesado', $evento->estado);
        $this->assertSame(0, DB::table('outbox_entrega')->where('evento_id', $evento->id)->count());
        Queue::assertNotPushed(EntregarEventoJob::class);
    }

    public function test_la_nota_de_credito_publica_comprobante_anulado_para_analitica_y_notificaciones(): void
    {
        ['pedido_id' => $pedidoId] = $this->prepararCuentaPorCobrar();
        $this->cobrar($pedidoId)->assertStatus(200);
        $comprobanteId = DB::table('comprobante')->where('pedido_id', $pedidoId)->value('id');

        $this->postJson("/api/v1/caja/comprobantes/{$comprobanteId}/nota-credito", [
            'motivo_codigo_sunat' => '01',
            'sustento_motivo' => 'Cliente devuelve el plato por error de pedido',
            'devolucion_metodo' => 'efectivo',
        ], $this->headers($this->tokenCajero))->assertStatus(200);

        $notaCreditoId = DB::table('comprobante')->where('comprobante_modificado_id', $comprobanteId)->value('id');
        $sobre = $this->sobreDe('comprobante.anulado', $comprobanteId);

        $this->assertContratoDeEvento('comprobante.anulado', $sobre['datos']);
        $this->assertEquals([
            'comprobante_id' => $comprobanteId,
            'nota_credito_id' => $notaCreditoId,
            'fecha' => $sobre['ocurrido_en'],
            'motivo_codigo' => '01',
            'anulado_por_id' => $this->cajeroId,
            'anulado_por_nombre' => 'Lucía Quispe',
            'total' => 76.00,
        ], $sobre['datos']);

        $destinos = DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->orderBy('destino')->pluck('destino')->all();
        $this->assertSame(['ms-analitica', 'ms-notificaciones'], $destinos);
    }

    public function test_anular_un_item_publica_pedido_anulado(): void
    {
        $producto = $this->crearProducto(45.00, 12.00);
        $mesaId = $this->crearMesa();
        $pedidoId = $this->crearPedido($mesaId, 'enviado');
        $itemId = $this->agregarItem($pedidoId, $producto['producto_id'], 1, 45.00, 'en_cola');
        $this->agregarItem($pedidoId, $producto['producto_id'], 1, 45.00, 'en_cola');

        $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular", [
            'motivo_categoria' => 'demora_cliente',
            'motivo_detalle' => 'Cliente cancela el plato por la demora',
        ], $this->headers($this->tokenMozo))->assertStatus(200);

        $anulacion = DB::table('pedido_anulacion')->where('pedido_item_id', $itemId)->first();
        $sobre = $this->sobreDe('pedido.anulado', $anulacion->id);
        $datos = $sobre['datos'];

        $this->assertContratoDeEvento('pedido.anulado.item', $datos);
        $this->assertSame($anulacion->id, $datos['anulacion_id']);
        $this->assertSame($pedidoId, $datos['pedido_id']);
        $this->assertSame($itemId, $datos['pedido_item_id']);
        $this->assertSame($producto['producto_id'], $datos['producto_id']);
        $this->assertSame($producto['nombre'], $datos['producto_nombre']);
        $this->assertSame(1, $datos['cantidad']);
        $this->assertEquals(45.00, $datos['monto_total']);
        $this->assertSame('item_individual', $datos['tipo_anulacion']);
        $this->assertSame('demora_cliente', $datos['motivo_categoria']);
        $this->assertFalse($datos['es_merma']);
        $this->assertGreaterThanOrEqual(15, $datos['minutos_espera']);
        $this->assertSame($this->mozoId, $datos['mozo_id']);
        $this->assertSame('Carlos Huamán', $datos['mozo_nombre']);
        $this->assertSame($this->mozoId, $datos['anulado_por_id']);
        $this->assertSame($sobre['ocurrido_en'], $datos['anulado_en']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $datos['fecha_operativa']);

        $this->assertSame(2, DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->count());
    }

    public function test_anular_la_comanda_publica_un_evento_por_cada_registro_de_anulacion(): void
    {
        $producto = $this->crearProducto(30.00, 9.00);
        $mesaId = $this->crearMesa();
        $pedidoId = $this->crearPedido($mesaId, 'enviado');
        $this->agregarItem($pedidoId, $producto['producto_id'], 2, 30.00, 'en_cola');
        $this->agregarItem($pedidoId, $producto['producto_id'], 1, 30.00, 'en_cola');

        $this->postJson("/api/v1/mozo/mesas/{$mesaId}/anular-comanda", [
            'motivo_categoria' => 'retiro_sin_consumo',
            'motivo_detalle' => 'Los comensales se retiran antes de recibir los platos',
            'confirmar_vacio' => true,
        ], $this->headers($this->tokenMozo))->assertStatus(200);

        $anulaciones = DB::table('pedido_anulacion')->where('pedido_id', $pedidoId)->pluck('id');
        $this->assertCount(2, $anulaciones);

        $eventos = DB::table('outbox_event')
            ->where('tipo_evento', 'pedido.anulado')
            ->whereIn('agregado_id', $anulaciones)
            ->get();
        $this->assertCount(2, $eventos);
        $this->assertEqualsCanonicalizing(
            ['comanda_completa', 'comanda_completa'],
            $eventos->map(fn (object $evento): string => json_decode($evento->payload, true)['datos']['tipo_anulacion'])->all(),
        );
    }

    public function test_anular_una_comanda_vacia_publica_pedido_anulado_sin_producto(): void
    {
        $mesaId = $this->crearMesa();
        $pedidoId = $this->crearPedido($mesaId, 'borrador');

        $this->postJson("/api/v1/mozo/mesas/{$mesaId}/anular-comanda", [
            'motivo_categoria' => 'retiro_sin_consumo',
            'motivo_detalle' => 'Los comensales se fueron antes de pedir',
            'confirmar_vacio' => true,
        ], $this->headers($this->tokenMozo))->assertStatus(200);

        $anulacion = DB::table('pedido_anulacion')->where('pedido_id', $pedidoId)->first();
        $this->assertNotNull($anulacion);

        $sobre = $this->sobreDe('pedido.anulado', $anulacion->id);
        $datos = $sobre['datos'];

        $this->assertContratoDeEvento('pedido.anulado.comanda_vacia', $datos);
        $this->assertSame($pedidoId, $datos['pedido_id']);
        $this->assertNull($datos['pedido_item_id']);
        $this->assertNull($datos['producto_id']);
        $this->assertSame('comanda_completa', $datos['tipo_anulacion']);
        $this->assertEquals(0.00, $datos['monto_total']);
        $this->assertFalse($datos['es_merma']);
        $this->assertSame(2, DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->count());
    }

    public function test_anular_por_quiebre_de_cocina_publica_pedido_anulado_como_cambio_de_plato(): void
    {
        $producto = $this->crearProducto(40.00, 11.00);
        $mesaId = $this->crearMesa();
        $pedidoId = $this->crearPedido($mesaId, 'enviado');
        $itemId = $this->agregarItem($pedidoId, $producto['producto_id'], 1, 40.00, 'no_disponible');
        $this->agregarItem($pedidoId, $producto['producto_id'], 1, 40.00, 'entregado');

        $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/anular-quiebre", [
            'motivo_detalle' => 'Sin insumo en cocina, el cliente no desea sustituir',
        ], $this->headers($this->tokenMozo))->assertStatus(200);

        $anulacion = DB::table('pedido_anulacion')->where('pedido_item_id', $itemId)->first();
        $this->assertNotNull($anulacion);

        $sobre = $this->sobreDe('pedido.anulado', $anulacion->id);
        $datos = $sobre['datos'];

        $this->assertSame($itemId, $datos['pedido_item_id']);
        $this->assertSame($producto['producto_id'], $datos['producto_id']);
        $this->assertSame('item_individual', $datos['tipo_anulacion']);
        $this->assertSame('cambio_plato', $datos['motivo_categoria']);
        $this->assertEquals(40.00, $datos['monto_total']);
        $this->assertFalse($datos['es_merma']);
        $this->assertSame(2, DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->count());
    }

    public function test_cocina_apaga_un_plato_y_se_publica_producto_agotado_solo_para_notificaciones(): void
    {
        $producto = $this->crearProducto(40.00, 11.00);

        $this->postJson("/api/v1/cocina/productos/{$producto['producto_id']}/marcar-agotado", [], $this->headers($this->tokenCocina))
            ->assertStatus(200)
            ->assertJsonPath('datos.requiere_resolucion', false);

        $sobre = $this->sobreDe('producto.agotado', $producto['producto_id']);

        $this->assertContratoDeEvento('producto.agotado.manual_cocina', $sobre['datos']);
        $this->assertEquals([
            'producto_id' => $producto['producto_id'],
            'producto_nombre' => $producto['nombre'],
            'causa' => 'manual_cocina',
            'motivo' => null,
            'marcado_por_id' => $this->cocineroId,
            'marcado_por_nombre' => DB::table('usuario')->where('id', $this->cocineroId)->value('nombre'),
            'fecha' => $sobre['ocurrido_en'],
        ], $sobre['datos']);
        $this->assertSame(['ms-notificaciones'], DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->pluck('destino')->all());
    }

    public function test_resolver_las_ordenes_en_fuego_publica_producto_agotado_con_su_motivo(): void
    {
        $producto = $this->crearProducto(40.00, 11.00);
        $pedidoId = $this->crearPedido($this->crearMesa(), 'enviado');
        $itemId = $this->agregarItem($pedidoId, $producto['producto_id'], 2, 40.00, 'en_preparacion');

        $this->postJson("/api/v1/cocina/productos/{$producto['producto_id']}/resolver-fuego", [
            'items_no_alcanzados_ids' => [$itemId],
            'motivo' => 'Solo alcanzó para una porción',
        ], $this->headers($this->tokenCocina))->assertStatus(200);

        $datos = $this->sobreDe('producto.agotado', $producto['producto_id'])['datos'];

        $this->assertSame('resolucion_fuego', $datos['causa']);
        $this->assertSame('Solo alcanzó para una porción', $datos['motivo']);
        $this->assertContratoDeEvento('producto.agotado.resolucion_fuego', $datos);
    }

    public function test_marcar_un_plato_listo_publica_plato_listo_para_el_mozo_de_la_comanda(): void
    {
        $producto = $this->crearProducto(40.00, 11.00);
        $mesaId = $this->crearMesa();
        $pedidoId = $this->crearPedido($mesaId, 'enviado');
        $itemId = $this->agregarItem($pedidoId, $producto['producto_id'], 2, 40.00, 'en_preparacion');

        $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", ['estado' => 'listo'], $this->headers($this->tokenCocina))
            ->assertStatus(200);

        $sobre = $this->sobreDe('plato.listo', $pedidoId);

        $this->assertContratoDeEvento('plato.listo', $sobre['datos']);
        $this->assertSame($this->mozoId, $sobre['datos']['mozo_id']);
        $this->assertSame((string) DB::table('mesa')->where('id', $mesaId)->value('numero'), $sobre['datos']['mesa_numero']);
        $this->assertEquals([
            ['pedido_item_id' => $itemId, 'producto_nombre' => $producto['nombre'], 'cantidad' => 2],
        ], $sobre['datos']['items']);
        $this->assertSame(['ms-notificaciones'], DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->pluck('destino')->all());

        // Repetir la misma marca no avisa dos veces al mozo
        $this->patchJson("/api/v1/cocina/items/{$itemId}/estado", ['estado' => 'listo'], $this->headers($this->tokenCocina))
            ->assertStatus(200);
        $this->assertSame(1, DB::table('outbox_event')->where('tipo_evento', 'plato.listo')->where('agregado_id', $pedidoId)->count());
    }

    public function test_despachar_la_comanda_publica_un_solo_plato_listo_con_todos_los_platos(): void
    {
        $producto = $this->crearProducto(40.00, 11.00);
        $pedidoId = $this->crearPedido($this->crearMesa(), 'enviado');
        $this->agregarItem($pedidoId, $producto['producto_id'], 1, 40.00, 'en_cola');
        $this->agregarItem($pedidoId, $producto['producto_id'], 3, 40.00, 'en_preparacion');

        $this->postJson("/api/v1/cocina/pedidos/{$pedidoId}/despachar", [], $this->headers($this->tokenCocina))
            ->assertStatus(200);

        $this->assertSame(1, DB::table('outbox_event')->where('tipo_evento', 'plato.listo')->where('agregado_id', $pedidoId)->count());
        $items = $this->sobreDe('plato.listo', $pedidoId)['datos']['items'];
        $this->assertSame([1, 3], collect($items)->pluck('cantidad')->sort()->values()->all());
    }

    public function test_listar_una_tanda_publica_un_plato_listo_por_cada_comanda_afectada(): void
    {
        $producto = $this->crearProducto(40.00, 11.00);
        $primera = $this->crearPedido($this->crearMesa(), 'enviado');
        $segunda = $this->crearPedido($this->crearMesa(), 'enviado');
        $this->agregarItem($primera, $producto['producto_id'], 1, 40.00, 'en_preparacion');
        $this->agregarItem($segunda, $producto['producto_id'], 1, 40.00, 'en_preparacion');

        $this->postJson('/api/v1/cocina/consolidado/marcar-listo', [
            'producto_id' => $producto['producto_id'],
            'cantidad' => 2,
        ], $this->headers($this->tokenCocina))->assertStatus(200)->assertJsonPath('datos.listos', 2);

        foreach ([$primera, $segunda] as $pedidoId) {
            $this->assertSame(1, DB::table('outbox_event')->where('tipo_evento', 'plato.listo')->where('agregado_id', $pedidoId)->count());
        }
    }

    public function test_sustituir_un_plato_publica_pedido_item_sustituido(): void
    {
        $original = $this->crearProducto(38.00, 12.00);
        $nuevo = $this->crearProducto(42.00, 13.00);
        $mesaId = $this->crearMesa();
        $pedidoId = $this->crearPedido($mesaId, 'enviado');
        $itemId = $this->agregarItem($pedidoId, $original['producto_id'], 1, 38.00, 'no_disponible');
        $this->agregarItem($pedidoId, $original['producto_id'], 1, 38.00, 'entregado');

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/sustituir", [
            'nuevo_producto_id' => $nuevo['producto_id'],
            'cantidad' => 1,
        ], $this->headers($this->tokenMozo));
        $res->assertStatus(200);
        $nuevoItemId = $res->json('datos.nuevo_item_id');

        $sobre = $this->sobreDe('pedido.item_sustituido', $nuevoItemId);

        $this->assertContratoDeEvento('pedido.item_sustituido', $sobre['datos']);
        $this->assertEquals([
            'pedido_id' => $pedidoId,
            'mesa_numero' => (string) DB::table('mesa')->where('id', $mesaId)->value('numero'),
            'pedido_item_original_id' => $itemId,
            'pedido_item_nuevo_id' => $nuevoItemId,
            'producto_original_nombre' => $original['nombre'],
            'producto_nuevo_nombre' => $nuevo['nombre'],
            'cantidad' => 1,
            'diferencia_monto' => 4.00,
            'sustituido_por_id' => $this->mozoId,
            'sustituido_por_nombre' => 'Carlos Huamán',
            'fecha' => $sobre['ocurrido_en'],
        ], $sobre['datos']);
        $this->assertSame(['ms-notificaciones'], DB::table('outbox_entrega')->where('evento_id', $sobre['id'])->pluck('destino')->all());
    }

    public function test_avisar_a_la_administracion_del_turno_previo_publica_el_evento_una_sola_vez(): void
    {
        DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->update(['estado' => 'cerrada', 'fecha_cierre' => now()]);
        $cajaId = (string) Str::uuid();
        DB::table('caja')->insert([
            'id' => $cajaId,
            'local_id' => $this->localId,
            'cajero_id' => $this->mozoId,
            'monto_apertura' => 100.00,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
        ]);

        $url = '/api/v1/caja/turno-previo/notificar-administracion';
        $this->postJson($url, [], $this->headers($this->tokenCajero))->assertStatus(200)->assertJsonPath('datos.ya_notificado', false);
        $this->postJson($url, [], $this->headers($this->tokenCajero))->assertStatus(200)->assertJsonPath('datos.ya_notificado', true);

        $this->assertSame(1, DB::table('outbox_event')->where('tipo_evento', 'caja.turno_previo_pendiente')->where('agregado_id', $cajaId)->count());
        $sobre = $this->sobreDe('caja.turno_previo_pendiente', $cajaId);

        $this->assertContratoDeEvento('caja.turno_previo_pendiente', $sobre['datos']);
        $this->assertSame($this->cajeroId, $sobre['datos']['solicitante_id']);
        $this->assertTrue($sobre['datos']['hay_admin_local']);
    }

    public function test_cerrar_caja_con_diferencia_publica_caja_cerrada(): void
    {
        $cajaId = $this->abrirTurnoLimpio();

        $this->postJson('/api/v1/caja/cierre', [
            'monto_real_fisico' => 285.00,
            'comentario_discrepancia' => 'Faltan quince soles, se revisa el vuelto.',
        ], $this->headers($this->tokenCajero))->assertStatus(200);

        $sobre = $this->sobreDe('caja.cerrada', $cajaId);

        $this->assertContratoDeEvento('caja.cerrada', $sobre['datos']);
        $this->assertEquals(300.00, $sobre['datos']['efectivo_esperado']);
        $this->assertEquals(285.00, $sobre['datos']['efectivo_contado']);
        $this->assertEquals(-15.00, $sobre['datos']['discrepancia']);
        $this->assertFalse($sobre['datos']['cierre_forzado']);
        $this->assertSame($this->cajeroId, $sobre['datos']['cerrado_por_id']);
    }

    public function test_cerrar_caja_cuadrada_no_publica_nada(): void
    {
        $cajaId = $this->abrirTurnoLimpio();

        $this->postJson('/api/v1/caja/cierre', ['monto_real_fisico' => 300.00], $this->headers($this->tokenCajero))->assertStatus(200);

        $this->assertSame(0, DB::table('outbox_event')->where('tipo_evento', 'caja.cerrada')->where('agregado_id', $cajaId)->count());
    }

    /** Turno del cajero con S/ 300 de apertura, sin mesas activas que impidan cerrarlo. */
    private function abrirTurnoLimpio(): string
    {
        DB::table('pedido')->where('local_id', $this->localId)->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])->update(['estado' => 'cobrado']);
        DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->update(['estado' => 'cerrada', 'fecha_cierre' => now()]);

        return $this->postJson('/api/v1/caja/apertura', ['monto_apertura' => 300.00], $this->headers($this->tokenCajero))
            ->assertStatus(201)
            ->json('datos.id');
    }
}
