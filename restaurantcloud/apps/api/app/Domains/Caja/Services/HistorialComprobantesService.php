<?php

namespace App\Domains\Caja\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Historial y resumen de los comprobantes del turno abierto (CU-CAJA-04).
 *
 * Es la única fuente de los totales del turno: el historial de caja y el balance
 * pre-arqueo los toman de aquí para que siempre cuadren entre sí.
 */
class HistorialComprobantesService
{
    /** Catálogo 09 SUNAT: motivos de nota de crédito que admite la caja. */
    public const MOTIVOS_SUNAT = [
        '01' => 'Anulación de la operación',
        '02' => 'Anulación por error en el RUC',
        '06' => 'Devolución total',
    ];

    public const LIMITE_DEFECTO = 10;

    public const LIMITE_MAXIMO = 50;

    private const NOMBRES_MEDIO_DEFECTO = [
        'efectivo' => 'Efectivo',
        'tarjeta' => 'Tarjeta POS',
        'billetera_digital' => 'Yape / Plin',
    ];

    /**
     * Totales del turno, independientes de cualquier filtro del listado.
     *
     * Las notas de crédito ya se guardan con total negativo y sus originales quedan en
     * estado "anulado", por lo que el neto es la suma de los comprobantes emitidos que no
     * son notas de crédito: no hay que restarles nada más.
     *
     * @return array{
     *     medios_visibles: list<string>,
     *     por_medio: list<array{codigo: string, nombre: string, bruto: float, devoluciones: float, neto: float, operaciones: int, activo: bool, mostrar: bool}>,
     *     efectivo: array{ingresos_brutos: float, operaciones_brutas: int, egresos: float, esperado: float},
     *     vigentes_count: int,
     *     anulados_count: int,
     *     notas_credito: array{count: int, monto: float},
     *     total_neto: float,
     *     total_bruto: float,
     *     total_devoluciones: float,
     *     base_imponible: float,
     *     igv: float,
     *     efectivo_gaveta: float
     * }
     */
    public function resumenTurno(object $caja): array
    {
        $todos = DB::table('comprobante')
            ->where('caja_id', $caja->id)
            ->get(['medio_pago', 'tipo', 'estado', 'total', 'descuento', 'monto_recargo', 'base_imponible', 'igv']);

        $emitidos = $todos->where('estado', 'emitido');
        $ventas = $emitidos->where('tipo', '!=', 'nota_credito');
        $notasCredito = $emitidos->where('tipo', 'nota_credito');
        // Ventas brutas: todo lo vendido, incluso lo que luego se anuló con una nota de crédito.
        $ventasBrutas = $todos->where('tipo', '!=', 'nota_credito');
        $porMedio = [];
        foreach ($this->configuracionMedios((string) $caja->local_id) as $codigo => $medio) {
            $delMedio = $ventas->where('medio_pago', $codigo);
            $neto = round((float) $delMedio->sum('total'), 2);
            $bruto = round((float) $ventasBrutas->where('medio_pago', $codigo)->sum('total'), 2);
            $porMedio[] = [
                'codigo' => $codigo,
                'nombre' => $medio['nombre'],
                // Por medio siempre se cumple bruto - devoluciones = neto
                'bruto' => $bruto,
                'devoluciones' => round($bruto - $neto, 2),
                'neto' => $neto,
                // Recargo vigente cobrado al cliente por usar el medio (las ventas anuladas por NC ya no cuentan)
                'recargo' => round((float) $delMedio->sum('monto_recargo'), 2),
                'operaciones' => $delMedio->count(),
                // Cobros brutos (incluye los anulados por NC), coherentes con la columna Ingresos
                'operaciones_brutas' => $ventasBrutas->where('medio_pago', $codigo)->count(),
                // La NC copia el medio de la venta que anula, así que se cuenta bajo el mismo medio
                'notas_credito' => $notasCredito->where('medio_pago', $codigo)->count(),
                'activo' => $medio['activo'],
                // Un medio desactivado en plena jornada sigue visible si ya se cobró con él en este turno
                'mostrar' => $medio['activo'] || $todos->where('medio_pago', $codigo)->isNotEmpty(),
            ];
        }

        $movimientosEfectivo = (float) DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('metodo_pago', 'efectivo')
            ->where('tipo', '!=', 'apertura')
            ->sum('monto');

        // Efectivo bruto: todo lo cobrado en efectivo, incluso lo que luego se anuló con una NC.
        $efectivoBruto = $todos->where('tipo', '!=', 'nota_credito')->where('medio_pago', 'efectivo');
        $ingresosBrutos = round((float) $efectivoBruto->sum('total'), 2);

        // Salidas de gaveta (devoluciones por NC y gastos manuales), siempre en positivo.
        $egresos = round((float) DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('metodo_pago', 'efectivo')
            ->whereIn('tipo', ['egreso_devolucion', 'egreso_gasto_manual'])
            ->sum(DB::raw('ABS(monto)')), 2);

        // Códigos que el cierre de turno muestra: efectivo siempre (la gaveta siempre se cuadra) y el resto
        // solo si está activo o ya tuvo cobros en el turno. Un medio oculto siempre tiene neto 0.
        $mediosVisibles = ['efectivo'];
        foreach ($porMedio as $medio) {
            if ($medio['codigo'] !== 'efectivo' && $medio['mostrar']) {
                $mediosVisibles[] = $medio['codigo'];
            }
        }

        // Detalle de cada NC del turno: qué comprobante anula, por qué medio, motivo y monto
        $notasCreditoDetalle = DB::table('comprobante as nc')
            ->leftJoin('comprobante as orig', 'orig.id', '=', 'nc.comprobante_modificado_id')
            ->where('nc.caja_id', $caja->id)
            ->where('nc.tipo', 'nota_credito')
            ->where('nc.estado', 'emitido')
            ->orderBy('nc.fecha')
            ->get([
                'nc.serie', 'nc.correlativo', 'nc.medio_pago', 'nc.total', 'nc.fecha',
                'nc.motivo_codigo_sunat', 'nc.sustento_motivo',
                'orig.serie as orig_serie', 'orig.correlativo as orig_correlativo',
            ])
            ->map(fn ($nc): array => [
                'documento' => $this->serieNumero($nc->serie, $nc->correlativo),
                'documento_modificado' => $nc->orig_serie ? $this->serieNumero($nc->orig_serie, $nc->orig_correlativo) : null,
                'medio_pago' => $nc->medio_pago,
                'motivo_codigo_sunat' => $nc->motivo_codigo_sunat,
                'motivo_texto' => $this->motivoTexto($nc->motivo_codigo_sunat),
                'sustento_motivo' => $nc->sustento_motivo,
                'monto' => round(abs((float) $nc->total), 2),
                // Solo la devolución en efectivo sale de la gaveta (la fase 3 garantiza medio y devolución coherentes)
                'afecta_gaveta' => $nc->medio_pago === 'efectivo',
                'fecha' => Carbon::parse($nc->fecha)->toIso8601String(),
            ])
            ->values()
            ->all();

        // Recargos (comisión de tarjeta o pasarela) y lo que queda tras descontarlos del cobrado neto
        $totalRecargos = round((float) $ventas->sum('monto_recargo'), 2);

        // Ventas vigentes por tipo de comprobante (las notas de venta no son comprobante SUNAT)
        $porTipo = [];
        foreach (['boleta', 'factura', 'nota_venta'] as $tipo) {
            $delTipo = $ventas->where('tipo', $tipo);
            $porTipo[] = [
                'tipo' => $tipo,
                'cantidad' => $delTipo->count(),
                'monto' => round((float) $delTipo->sum('total'), 2),
            ];
        }

        // Descuentos comerciales de las ventas vigentes
        $conDescuento = $ventas->filter(fn ($c): bool => (float) $c->descuento > 0.0);
        $descuentos = [
            'total' => round((float) $conDescuento->sum('descuento'), 2),
            'comprobantes' => $conDescuento->count(),
        ];

        return [
            'por_tipo' => $porTipo,
            'descuentos' => $descuentos,
            'total_recargos' => $totalRecargos,
            'ingreso_consumo' => round((float) $ventas->sum('total') - $totalRecargos, 2),
            'medios_visibles' => $mediosVisibles,
            'notas_credito_detalle' => $notasCreditoDetalle,
            'por_medio' => $porMedio,
            'efectivo' => [
                'ingresos_brutos' => $ingresosBrutos,
                'operaciones_brutas' => $efectivoBruto->count(),
                'egresos' => $egresos,
                'esperado' => round((float) $caja->monto_apertura + $ingresosBrutos - $egresos, 2),
            ],
            'vigentes_count' => $ventas->count(),
            'anulados_count' => $todos->where('estado', 'anulado')->count(),
            'notas_credito' => [
                'count' => $notasCredito->count(),
                'monto' => round(abs((float) $notasCredito->sum('total')), 2),
            ],
            'total_neto' => round((float) $ventas->sum('total'), 2),
            'total_bruto' => round((float) $ventasBrutas->sum('total'), 2),
            'total_devoluciones' => round((float) $ventasBrutas->sum('total') - (float) $ventas->sum('total'), 2),
            'base_imponible' => round((float) $ventas->sum('base_imponible'), 2),
            'igv' => round((float) $ventas->sum('igv'), 2),
            'efectivo_gaveta' => round((float) $caja->monto_apertura + $movimientosEfectivo, 2),
        ];
    }

    /**
     * @param  array{estado?: ?string, tipo?: ?string, medio_pago?: ?string, q?: ?string, pagina?: ?int, limite?: ?int}  $filtros
     * @return array{comprobantes: list<array<string, mixed>>, paginacion: array{total: int, pagina: int, limite: int, total_paginas: int}}
     */
    public function listar(object $caja, array $filtros): array
    {
        $estado = $filtros['estado'] ?? 'todos';
        $tipo = $filtros['tipo'] ?? 'todos';
        $medioPago = $filtros['medio_pago'] ?? 'todos';
        $q = trim((string) ($filtros['q'] ?? ''));
        $limite = max(1, min((int) ($filtros['limite'] ?? self::LIMITE_DEFECTO), self::LIMITE_MAXIMO));

        $query = $this->consultaBase($caja);

        match ($estado) {
            'vigente' => $query->where('c.estado', 'emitido')->where('c.tipo', '!=', 'nota_credito'),
            'anulado' => $query->where('c.estado', 'anulado'),
            'nota_credito' => $query->where('c.tipo', 'nota_credito'),
            default => null,
        };

        if ($tipo !== 'todos') {
            $query->where('c.tipo', $tipo);
        }

        if ($medioPago !== 'todos') {
            $query->where('c.medio_pago', $medioPago);
        }

        if ($q !== '') {
            $query->where(function (Builder $sub) use ($q): void {
                $sub->where('c.nombre_cliente', 'ILIKE', "%{$q}%")
                    ->orWhere('c.documento_cliente', 'ILIKE', "%{$q}%")
                    ->orWhere('c.serie', 'ILIKE', "%{$q}%")
                    ->orWhere(DB::raw("c.serie || '-' || LPAD(c.correlativo::text, 8, '0')"), 'ILIKE', "%{$q}%")
                    ->orWhere(DB::raw('c.correlativo::text'), 'ILIKE', "%{$q}%");
            });
        }

        $total = (int) (clone $query)->count('c.id');
        $totalPaginas = max(1, (int) ceil($total / $limite));
        $pagina = max(1, min((int) ($filtros['pagina'] ?? 1), $totalPaginas));

        $comprobantes = $query
            ->orderByDesc('c.created_at')
            ->orderByDesc('c.id')
            ->forPage($pagina, $limite)
            ->get()
            ->map(fn (object $fila): array => $this->mapearFila($fila))
            ->all();

        return [
            'comprobantes' => $comprobantes,
            'paginacion' => [
                'total' => $total,
                'pagina' => $pagina,
                'limite' => $limite,
                'total_paginas' => $totalPaginas,
            ],
        ];
    }

    /**
     * Detalle de un comprobante del turno abierto; null si no existe o es de otro turno.
     *
     * @return array<string, mixed>|null
     */
    public function detalle(object $caja, string $id): ?array
    {
        if (! Str::isUuid($id)) {
            return null;
        }

        $fila = $this->consultaBase($caja)->where('c.id', $id)->first();
        if (! $fila) {
            return null;
        }

        $items = DB::table('comprobante_item')
            ->where('comprobante_id', $id)
            ->orderBy('created_at')
            ->get()
            ->map(fn (object $item): array => [
                'descripcion' => $item->descripcion,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'subtotal' => (float) $item->subtotal,
            ])
            ->all();

        $esNotaCredito = $fila->tipo === 'nota_credito';
        $notaCredito = null;
        if (! $esNotaCredito && $fila->nc_id) {
            $notaCredito = [
                'id' => $fila->nc_id,
                'serie_numero' => $this->serieNumero($fila->nc_serie, $fila->nc_correlativo),
                'fecha' => Carbon::parse($fila->nc_created_at)->toIso8601String(),
                'motivo_codigo_sunat' => $fila->nc_motivo_codigo_sunat,
                'motivo_texto' => $this->motivoTexto($fila->nc_motivo_codigo_sunat),
                'sustento_motivo' => $fila->nc_sustento_motivo,
                'token' => $fila->nc_token_qr ? (string) $fila->nc_token_qr : null,
            ];
        }

        $documentoAfectado = null;
        if ($esNotaCredito && $fila->comprobante_modificado_id) {
            $documentoAfectado = [
                'id' => $fila->comprobante_modificado_id,
                'serie_numero' => $this->serieNumero($fila->mod_serie, $fila->mod_correlativo),
                'tipo_comprobante' => $fila->mod_tipo,
                'token' => $fila->mod_token_qr ? (string) $fila->mod_token_qr : null,
                'motivo_codigo_sunat' => $fila->motivo_codigo_sunat,
                'motivo_texto' => $this->motivoTexto($fila->motivo_codigo_sunat),
                'sustento_motivo' => $fila->sustento_motivo,
            ];
        }

        return [
            ...$this->mapearFila($fila),
            'desglose' => [
                'subtotal_consumo' => (float) $fila->subtotal_consumo,
                'descuento' => (float) $fila->descuento,
                'promocion_nombre' => $fila->promocion_nombre,
                'porcentaje_recargo' => (float) $fila->porcentaje_recargo,
                'monto_recargo' => (float) $fila->monto_recargo,
                'base_imponible' => (float) $fila->base_imponible,
                'igv' => (float) $fila->igv,
                'total' => (float) $fila->total,
                'monto_recibido' => $fila->monto_recibido !== null ? (float) $fila->monto_recibido : null,
                'vuelto' => $fila->vuelto !== null ? (float) $fila->vuelto : null,
            ],
            'items' => $items,
            'impreso' => (bool) $fila->impreso,
            'nota_credito' => $notaCredito,
            'documento_afectado' => $documentoAfectado,
        ];
    }

    private function consultaBase(object $caja): Builder
    {
        return DB::table('comprobante as c')
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->leftJoin('pedido_subcuenta as ps', 'ps.id', '=', 'c.subcuenta_id')
            ->leftJoin('metodo_pago_local as mp', 'mp.id', '=', 'c.metodo_pago_id')
            ->leftJoin('promocion as pr', 'pr.id', '=', 'c.promocion_id')
            ->leftJoin('comprobante as nc', function ($join): void {
                $join->on('nc.comprobante_modificado_id', '=', 'c.id')
                    ->where('nc.tipo', '=', 'nota_credito');
            })
            ->leftJoin('comprobante as c_mod', 'c_mod.id', '=', 'c.comprobante_modificado_id')
            ->where('c.caja_id', $caja->id)
            ->select([
                'c.*',
                'm.numero as mesa_numero',
                'p.numero_comanda',
                'ps.numero_subcuenta',
                'mp.nombre as metodo_pago_nombre',
                'pr.nombre as promocion_nombre',
                'nc.id as nc_id',
                'nc.serie as nc_serie',
                'nc.correlativo as nc_correlativo',
                'nc.created_at as nc_created_at',
                'nc.motivo_codigo_sunat as nc_motivo_codigo_sunat',
                'nc.sustento_motivo as nc_sustento_motivo',
                'nc.token_qr as nc_token_qr',
                'c_mod.serie as mod_serie',
                'c_mod.correlativo as mod_correlativo',
                'c_mod.tipo as mod_tipo',
                'c_mod.token_qr as mod_token_qr',
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapearFila(object $c): array
    {
        $esNotaCredito = $c->tipo === 'nota_credito';

        // Una NC lleva su propio motivo; un original anulado toma el de la NC que lo anuló.
        $motivoCodigo = $esNotaCredito ? $c->motivo_codigo_sunat : $c->nc_motivo_codigo_sunat;
        $sustento = $esNotaCredito ? $c->sustento_motivo : $c->nc_sustento_motivo;

        return [
            'id' => $c->id,
            'tipo_comprobante' => $c->tipo,
            'serie' => $c->serie,
            'correlativo' => (int) $c->correlativo,
            'serie_numero' => $this->serieNumero($c->serie, $c->correlativo),
            'hora' => date('H:i', strtotime($c->created_at)),
            'fecha_emision' => Carbon::parse($c->created_at)->toIso8601String(),
            'mesa_numero' => $c->mesa_numero ?? 'Barra',
            'subcuenta_id' => $c->subcuenta_id,
            'subcuenta_numero' => $c->numero_subcuenta ? (int) $c->numero_subcuenta : null,
            'comanda_numero' => (int) ($c->numero_comanda ?? 0),
            'cliente_nombre' => $c->nombre_cliente,
            'cliente_documento' => $c->documento_cliente,
            'medio_pago' => $c->medio_pago,
            'metodo_pago_nombre' => $c->metodo_pago_nombre
                ?? self::NOMBRES_MEDIO_DEFECTO[$c->medio_pago]
                ?? $c->medio_pago,
            'numero_operacion' => $c->numero_operacion,
            'total' => (float) $c->total,
            'base_imponible' => (float) $c->base_imponible,
            'igv' => (float) $c->igv,
            'estado' => $c->estado,
            'token_digital' => (string) $c->token_qr,
            'url_publica_qr' => url("/c/{$c->token_qr}"),
            'telefono_envio' => $c->telefono_envio,
            'email_envio' => $c->email_envio,
            'nota_credito_id' => $c->nc_id,
            'nota_credito_serie_numero' => $c->nc_serie ? $this->serieNumero($c->nc_serie, $c->nc_correlativo) : null,
            'nota_credito_token' => $c->nc_token_qr ? (string) $c->nc_token_qr : null,
            'motivo_codigo_sunat' => $motivoCodigo,
            'motivo_texto' => $this->motivoTexto($motivoCodigo),
            'sustento_motivo' => $sustento,
            'comprobante_modificado_id' => $c->comprobante_modificado_id,
            'documento_modificado' => $c->mod_serie ? $this->serieNumero($c->mod_serie, $c->mod_correlativo) : null,
            'documento_modificado_token' => $c->mod_token_qr ? (string) $c->mod_token_qr : null,
        ];
    }

    private function serieNumero(string $serie, int|string $correlativo): string
    {
        return $serie.'-'.str_pad((string) $correlativo, 8, '0', STR_PAD_LEFT);
    }

    private function motivoTexto(?string $codigo): ?string
    {
        return $codigo !== null ? (self::MOTIVOS_SUNAT[$codigo] ?? null) : null;
    }

    /**
     * Nombre y estado (activo o desactivado) que la sede dio a cada medio de pago operativo.
     * Sin configuración guardada rige la de una sede nueva: efectivo y tarjeta activos, billetera no.
     *
     * @return array<string, array{nombre: string, activo: bool}>
     */
    private function configuracionMedios(string $localId): array
    {
        $guardados = DB::table('metodo_pago_local')
            ->where('local_id', $localId)
            ->whereIn('codigo', array_keys(self::NOMBRES_MEDIO_DEFECTO))
            ->get(['codigo', 'nombre', 'activo'])
            ->keyBy('codigo');

        $configuracion = [];
        foreach (self::NOMBRES_MEDIO_DEFECTO as $codigo => $nombreDefecto) {
            $guardado = $guardados->get($codigo);
            $configuracion[$codigo] = [
                'nombre' => $guardado->nombre ?? $nombreDefecto,
                'activo' => $guardado ? (bool) $guardado->activo : $codigo !== 'billetera_digital',
            ];
        }

        return $configuracion;
    }
}
