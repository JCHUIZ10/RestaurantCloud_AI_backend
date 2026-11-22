<?php

namespace App\Domains\Eventos\Services;

use App\Domains\Horario\Services\JornadaOperativaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Eventos de negocio que el núcleo publica para los microservicios (doc-2u/servicios/eventos.md).
 *
 * Cada método arma los `datos` del contrato a partir de las filas ya insertadas en la transacción
 * en curso, de modo que el evento refleja exactamente lo que quedó guardado.
 */
class EventosNucleo
{
    public function __construct(
        private PublicadorEventos $publicador,
        private JornadaOperativaService $jornadas,
    ) {}

    /**
     * venta.registrada (v1): un comprobante de venta (boleta, factura o nota de venta) recién cobrado.
     */
    public function ventaRegistrada(string $comprobanteId): string
    {
        $comprobante = DB::table('comprobante as c')
            ->join('local as l', 'l.id', '=', 'c.local_id')
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('usuario as m', 'm.id', '=', 'p.mozo_id')
            ->where('c.id', $comprobanteId)
            ->select([
                'c.id', 'c.pedido_id', 'c.subcuenta_id', 'c.local_id', 'c.tipo', 'c.medio_pago',
                'c.subtotal_consumo', 'c.descuento', 'c.monto_recargo', 'c.total', 'c.promocion_id', 'c.created_at',
                'l.empresa_id', 'p.mozo_id', 'p.comensales', 'm.nombre as mozo_nombre',
            ])
            ->first();

        $items = DB::table('comprobante_item as ci')
            ->leftJoin('producto as pr', 'pr.id', '=', 'ci.producto_id')
            ->leftJoin('categoria_producto as cat', 'cat.id', '=', 'pr.categoria_id')
            ->where('ci.comprobante_id', $comprobanteId)
            ->orderBy('ci.created_at')
            ->orderBy('ci.id')
            ->get([
                'ci.producto_id', 'ci.descripcion', 'ci.cantidad', 'ci.precio_unitario', 'ci.subtotal',
                'pr.categoria_id', 'cat.nombre as categoria_nombre', 'pr.costo_estandar',
            ])
            ->map(fn (object $item): array => [
                'producto_id' => $item->producto_id,
                'nombre' => $item->descripcion,
                'categoria_id' => $item->categoria_id,
                'categoria_nombre' => $item->categoria_nombre,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'subtotal' => (float) $item->subtotal,
                'costo_estandar' => $item->costo_estandar !== null ? (float) $item->costo_estandar : null,
            ])
            ->all();

        $fecha = Carbon::parse($comprobante->created_at);

        return $this->publicador->publicar(
            'venta.registrada',
            $comprobante->empresa_id,
            $comprobante->local_id,
            'comprobante',
            $comprobante->id,
            [
                'comprobante_id' => $comprobante->id,
                'pedido_id' => $comprobante->pedido_id,
                'tipo' => $comprobante->tipo,
                'fecha' => $this->instante($fecha),
                'fecha_operativa' => $this->fechaOperativa($comprobante->local_id, $fecha),
                'mozo_id' => $comprobante->mozo_id,
                'mozo_nombre' => $comprobante->mozo_nombre,
                // En una subcuenta los comensales son de toda la mesa, no de quien paga.
                'comensales' => $comprobante->subcuenta_id ? null : ($comprobante->comensales !== null ? (int) $comprobante->comensales : null),
                'medio_pago' => $comprobante->medio_pago,
                'subtotal_consumo' => (float) $comprobante->subtotal_consumo,
                'descuento' => (float) $comprobante->descuento,
                'monto_recargo' => (float) $comprobante->monto_recargo,
                'total' => (float) $comprobante->total,
                'promocion_id' => $comprobante->promocion_id,
                'items' => $items,
            ],
            $fecha,
        );
    }

    /**
     * comprobante.anulado (v1): una nota de crédito que anula por completo un comprobante cobrado.
     */
    public function comprobanteAnulado(string $notaCreditoId, string $anuladoPorId): string
    {
        $nota = DB::table('comprobante as nc')
            ->join('comprobante as c', 'c.id', '=', 'nc.comprobante_modificado_id')
            ->join('local as l', 'l.id', '=', 'nc.local_id')
            ->where('nc.id', $notaCreditoId)
            ->select(['nc.id', 'nc.local_id', 'nc.motivo_codigo_sunat', 'nc.created_at', 'c.id as comprobante_id', 'c.total', 'l.empresa_id'])
            ->first();

        $fecha = Carbon::parse($nota->created_at);

        return $this->publicador->publicar(
            'comprobante.anulado',
            $nota->empresa_id,
            $nota->local_id,
            'comprobante',
            $nota->comprobante_id,
            [
                'comprobante_id' => $nota->comprobante_id,
                'nota_credito_id' => $nota->id,
                'fecha' => $this->instante($fecha),
                'motivo_codigo' => $nota->motivo_codigo_sunat,
                'anulado_por_id' => $anuladoPorId,
                'anulado_por_nombre' => DB::table('usuario')->where('id', $anuladoPorId)->value('nombre'),
                'total' => (float) $nota->total,
            ],
            $fecha,
        );
    }

    /**
     * pedido.anulado (v1): un registro de pedido_anulacion (un ítem, o la comanda vacía).
     */
    public function pedidoAnulado(string $anulacionId): string
    {
        $anulacion = DB::table('pedido_anulacion as pa')
            ->join('local as l', 'l.id', '=', 'pa.local_id')
            ->leftJoin('usuario as m', 'm.id', '=', 'pa.mozo_id')
            ->leftJoin('usuario as a', 'a.id', '=', 'pa.anulado_por')
            ->where('pa.id', $anulacionId)
            ->select(['pa.*', 'l.empresa_id', 'm.nombre as mozo_nombre', 'a.nombre as anulado_por_nombre'])
            ->first();

        $anuladoEn = Carbon::parse($anulacion->anulado_at);

        return $this->publicador->publicar(
            'pedido.anulado',
            $anulacion->empresa_id,
            $anulacion->local_id,
            'pedido_anulacion',
            $anulacion->id,
            [
                'anulacion_id' => $anulacion->id,
                'pedido_id' => $anulacion->pedido_id,
                'pedido_item_id' => $anulacion->pedido_item_id,
                'producto_id' => $anulacion->producto_id,
                'producto_nombre' => $anulacion->producto_nombre,
                'cantidad' => (int) $anulacion->cantidad,
                'monto_total' => (float) $anulacion->monto_total,
                'tipo_anulacion' => $anulacion->tipo_anulacion,
                'motivo_categoria' => $anulacion->motivo_categoria,
                'es_merma' => (bool) $anulacion->es_merma,
                'costo_merma' => $anulacion->costo_merma !== null ? (float) $anulacion->costo_merma : null,
                'minutos_espera' => (int) $anulacion->minutos_espera,
                'mozo_id' => $anulacion->mozo_id,
                'mozo_nombre' => $anulacion->mozo_nombre,
                'anulado_por_id' => $anulacion->anulado_por,
                'anulado_por_nombre' => $anulacion->anulado_por_nombre,
                'anulado_en' => $this->instante($anuladoEn),
                'fecha_operativa' => $this->fechaOperativa($anulacion->local_id, $anuladoEn),
            ],
            $anuladoEn,
        );
    }

    /**
     * pedido.item_sustituido (v1): el mozo sustituyó un plato por quiebre de cocina.
     *
     * @param  string  $mesaNumero  Mesa como la ve el personal (con la etiqueta de unión si la hay)
     */
    public function pedidoItemSustituido(
        string $pedidoId,
        string $mesaNumero,
        string $itemOriginalId,
        string $itemNuevoId,
        string $productoOriginalNombre,
        string $productoNuevoNombre,
        int $cantidad,
        float $diferenciaMonto,
        string $sustituidoPorId,
        Carbon $fecha,
    ): string {
        $local = DB::table('pedido as p')
            ->join('local as l', 'l.id', '=', 'p.local_id')
            ->where('p.id', $pedidoId)
            ->first(['p.local_id', 'l.empresa_id']);

        return $this->publicador->publicar(
            'pedido.item_sustituido',
            $local->empresa_id,
            $local->local_id,
            'pedido_item',
            $itemNuevoId,
            [
                'pedido_id' => $pedidoId,
                'mesa_numero' => $mesaNumero,
                'pedido_item_original_id' => $itemOriginalId,
                'pedido_item_nuevo_id' => $itemNuevoId,
                'producto_original_nombre' => $productoOriginalNombre,
                'producto_nuevo_nombre' => $productoNuevoNombre,
                'cantidad' => $cantidad,
                'diferencia_monto' => $diferenciaMonto,
                'sustituido_por_id' => $sustituidoPorId,
                'sustituido_por_nombre' => DB::table('usuario')->where('id', $sustituidoPorId)->value('nombre'),
                'fecha' => $this->instante($fecha),
            ],
            $fecha,
        );
    }

    /**
     * producto.agotado (v1): cocina marcó un producto como agotado.
     *
     * @param  string  $causa  `manual_cocina` o `resolucion_fuego`
     */
    public function productoAgotado(string $productoId, string $causa, ?string $motivo, string $marcadoPorId, Carbon $fecha): string
    {
        $producto = DB::table('producto as pr')
            ->join('local as l', 'l.id', '=', 'pr.local_id')
            ->where('pr.id', $productoId)
            ->first(['pr.id', 'pr.nombre', 'pr.local_id', 'l.empresa_id']);

        return $this->publicador->publicar(
            'producto.agotado',
            $producto->empresa_id,
            $producto->local_id,
            'producto',
            $producto->id,
            [
                'producto_id' => $producto->id,
                'producto_nombre' => $producto->nombre,
                'causa' => $causa,
                'motivo' => $motivo,
                'marcado_por_id' => $marcadoPorId,
                'marcado_por_nombre' => DB::table('usuario')->where('id', $marcadoPorId)->value('nombre'),
                'fecha' => $this->instante($fecha),
            ],
            $fecha,
        );
    }

    /**
     * plato.listo (v1): cocina marcó platos como listos. Un evento por comanda: si los ítems son de
     * varias comandas (listar una tanda por FIFO), se publica uno por cada una.
     *
     * Los ítems se leen ya guardados (estado `listo`); una comanda sin mozo no genera evento, porque
     * no hay a quién avisar.
     *
     * @param  list<string>  $itemIds
     * @return list<string> Identificadores de los eventos publicados
     */
    public function platoListo(array $itemIds, Carbon $fecha): array
    {
        if ($itemIds === []) {
            return [];
        }

        $items = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('local as l', 'l.id', '=', 'p.local_id')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->whereIn('pi.id', $itemIds)
            ->orderBy('pi.created_at')
            ->orderBy('pi.id')
            ->get([
                'pi.id', 'pi.pedido_id', 'pi.cantidad', 'pr.nombre as producto_nombre',
                'p.local_id', 'p.mozo_id', 'm.numero as mesa_numero', 'l.empresa_id', 'u.nombre as mozo_nombre',
            ]);

        $eventos = [];

        foreach ($items->groupBy('pedido_id') as $pedidoId => $delPedido) {
            $primero = $delPedido->first();
            if ($primero->mozo_id === null) {
                continue;
            }

            $eventos[] = $this->publicador->publicar(
                'plato.listo',
                $primero->empresa_id,
                $primero->local_id,
                'pedido',
                (string) $pedidoId,
                [
                    'pedido_id' => (string) $pedidoId,
                    'mesa_numero' => (string) $primero->mesa_numero,
                    'mozo_id' => $primero->mozo_id,
                    'mozo_nombre' => $primero->mozo_nombre,
                    'items' => $delPedido->map(fn (object $item): array => [
                        'pedido_item_id' => $item->id,
                        'producto_nombre' => $item->producto_nombre,
                        'cantidad' => (int) $item->cantidad,
                    ])->values()->all(),
                    'fecha' => $this->instante($fecha),
                ],
                $fecha,
            );
        }

        return $eventos;
    }

    /**
     * caja.turno_previo_pendiente (v1): un cajero no puede abrir turno porque el de otro sigue abierto.
     */
    public function turnoPrevioPendiente(string $cajaId, string $solicitanteId, bool $hayAdminLocal, Carbon $fecha): string
    {
        $caja = DB::table('caja as c')
            ->join('local as l', 'l.id', '=', 'c.local_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.id', $cajaId)
            ->first(['c.id', 'c.local_id', 'c.correlativo', 'l.empresa_id', 'u.nombre as cajero_nombre']);

        return $this->publicador->publicar(
            'caja.turno_previo_pendiente',
            $caja->empresa_id,
            $caja->local_id,
            'caja',
            $caja->id,
            [
                'caja_id' => $caja->id,
                'turno_correlativo' => (int) $caja->correlativo,
                'cajero_pendiente_nombre' => $caja->cajero_nombre,
                'solicitante_id' => $solicitanteId,
                'solicitante_nombre' => DB::table('usuario')->where('id', $solicitanteId)->value('nombre'),
                'hay_admin_local' => $hayAdminLocal,
                'fecha' => $this->instante($fecha),
            ],
            $fecha,
        );
    }

    /**
     * caja.cerrada (v1): se cerró un turno con diferencia en el arqueo. Quien llama decide si hay
     * diferencia; un cierre cuadrado no publica nada.
     */
    public function cajaCerrada(
        string $cajaId,
        string $empresaId,
        float $efectivoEsperado,
        float $efectivoContado,
        bool $cierreForzado,
        string $cerradoPorId,
        Carbon $fecha,
    ): string {
        $caja = DB::table('caja as c')
            ->leftJoin('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.id', $cajaId)
            ->first(['c.id', 'c.local_id', 'c.correlativo', 'c.cajero_id', 'u.nombre as cajero_nombre']);

        return $this->publicador->publicar(
            'caja.cerrada',
            $empresaId,
            $caja->local_id,
            'caja',
            $caja->id,
            [
                'caja_id' => $caja->id,
                'turno_correlativo' => (int) $caja->correlativo,
                'cajero_id' => $caja->cajero_id,
                'cajero_nombre' => $caja->cajero_nombre,
                'efectivo_esperado' => $efectivoEsperado,
                'efectivo_contado' => $efectivoContado,
                'discrepancia' => round($efectivoContado - $efectivoEsperado, 2),
                'cierre_forzado' => $cierreForzado,
                'cerrado_por_id' => $cerradoPorId,
                'cerrado_por_nombre' => DB::table('usuario')->where('id', $cerradoPorId)->value('nombre'),
                'fecha' => $this->instante($fecha),
            ],
            $fecha,
        );
    }

    private function instante(Carbon $momento): string
    {
        return $momento->copy()->setTimezone(config('app.timezone'))->toIso8601String();
    }

    /**
     * Jornada a la que pertenece el momento: pasada la medianoche sigue siendo la del día anterior
     * mientras dure su turno nocturno. La duración de reserva no influye en el cierre del turno.
     */
    private function fechaOperativa(string $localId, Carbon $momento): string
    {
        return $this->jornadas->fechaJornadaDe($localId, $momento, 0);
    }
}
