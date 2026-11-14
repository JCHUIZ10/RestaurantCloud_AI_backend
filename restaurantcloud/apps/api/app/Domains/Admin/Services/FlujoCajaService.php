<?php

namespace App\Domains\Admin\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Resumen de flujo de caja de la sede (CU-ADMIN-14): ingresos cobrados en salón frente a
 * compras de insumos y gastos operativos del periodo.
 *
 * Ingresos = ventas vigentes (comprobantes emitidos que no son notas de crédito): una venta
 * anulada con nota de crédito ya no cuenta, igual que en el Reporte Z del cajero.
 */
class FlujoCajaService
{
    public const CATEGORIAS_GASTO = [
        'servicios_basicos' => 'Servicios Básicos (Luz/Gas/Agua)',
        'alquiler' => 'Alquiler de Local',
        'limpieza_aseo' => 'Limpieza, Aseo y Menaje',
        'mantenimiento' => 'Mantenimiento y Equipamiento',
        'caja_chica' => 'Caja Chica / Emergencias',
        'otros' => 'Otros Egresos Operativos',
    ];

    private const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    private const TOP_INSUMOS = 5;

    /**
     * @param  array{periodo: string, desde: string, hasta: string, inicio: Carbon, fin: Carbon, dias: int}  $rango
     * @return array<string, mixed>
     */
    public function resumen(string $localId, array $rango): array
    {
        $actual = $this->totales($localId, $rango['inicio'], $rango['fin']);

        // Periodo inmediatamente anterior y de la misma duración, para los deltas
        $inicioAnterior = $rango['inicio']->copy()->subDays($rango['dias']);
        $anterior = $this->totales($localId, $inicioAnterior, $rango['inicio']);

        $ingresos = $actual['ingresos'];
        $egresos = round($actual['compras_total'] + $actual['gastos_total'], 2);
        $egresosAnterior = round($anterior['compras_total'] + $anterior['gastos_total'], 2);
        $balance = round($ingresos - $egresos, 2);

        // Dónde está el dinero: gavetas (efectivo del POS) y bancos y pasarelas (tarjeta, billeteras, transferencias),
        // menos lo pagado desde una caja chica fuera del POS. Así cierra exactamente con el balance neto.
        $enGavetas = round($actual['ing_efectivo'] - $actual['gastos_caja'] - $actual['compras_efectivo'], 2);
        $enBancos = round($actual['ing_tarjeta'] + $actual['ing_billetera'] - $actual['gastos_banco'] - $actual['compras_banco'], 2);
        $pagadoCajaChica = $actual['compras_caja_chica'];
        $totalDisponible = round($enGavetas + $enBancos - $pagadoCajaChica, 2);
        // El reparto porcentual solo tiene sentido con ambos canales positivos
        $repartible = $enGavetas >= 0 && $enBancos >= 0 && ($enGavetas + $enBancos) > 0;

        return [
            'local_id' => $localId,
            'sede_nombre' => (string) DB::table('local')->where('id', $localId)->value('nombre'),
            'periodo' => $rango['periodo'],
            'fecha_inicio' => $rango['desde'],
            'fecha_fin' => $rango['hasta'],
            'ingresos_totales' => $ingresos,
            'delta_ingresos_pct' => $this->variacion($ingresos, $anterior['ingresos']),
            'ingresos_desglose' => [
                'efectivo_monto' => $actual['ing_efectivo'],
                'efectivo_porcentaje' => $this->porcentaje($actual['ing_efectivo'], $ingresos),
                'tarjeta_pos_monto' => $actual['ing_tarjeta'],
                'tarjeta_pos_porcentaje' => $this->porcentaje($actual['ing_tarjeta'], $ingresos),
                'billeteras_monto' => $actual['ing_billetera'],
                'billeteras_porcentaje' => $this->porcentaje($actual['ing_billetera'], $ingresos),
            ],
            'egresos_totales' => $egresos,
            'delta_egresos_pct' => $this->variacion($egresos, $egresosAnterior),
            'compras_insumos_total' => $actual['compras_total'],
            'gastos_manuales_total' => $actual['gastos_total'],
            'balance_neto' => $balance,
            'margen_neto_porcentaje' => $this->porcentaje($balance, $ingresos),
            // Cuánto se ingresó por cada S/ 1 de egreso; 0 cuando no hubo egresos (no hay índice aplicable)
            'ratio_cobertura' => $egresos > 0 ? round($ingresos / $egresos, 2) : 0.0,
            'conciliacion_liquidez' => [
                'total_disponible' => $totalDisponible,
                'en_bancos_monto' => $enBancos,
                'en_bancos_porcentaje' => $repartible ? $this->porcentaje($enBancos, $enGavetas + $enBancos) : null,
                'en_gavetas_monto' => $enGavetas,
                'en_gavetas_porcentaje' => $repartible ? $this->porcentaje($enGavetas, $enGavetas + $enBancos) : null,
                'pagado_caja_chica_monto' => $pagadoCajaChica,
                // Deuda con proveedores a hoy (no depende del periodo): informativa, no sale de ninguna cuenta todavía
                'por_pagar_proveedores_monto' => $this->porPagarProveedores($localId),
            ],
            'curva_diaria' => $this->curvaDiaria($localId, $rango),
            'top_insumos_comprados' => $this->topInsumos($localId, $rango, $actual['compras_total']),
            'gastos_por_categoria' => $this->gastosPorCategoria($localId, $rango, $actual['gastos_total']),
        ];
    }

    /**
     * Totales de ingresos, compras y gastos de un rango [inicio, fin).
     *
     * @return array<string, float>
     */
    private function totales(string $localId, Carbon $inicio, Carbon $fin): array
    {
        $porMedio = DB::table('comprobante')
            ->where('local_id', $localId)
            ->where('estado', 'emitido')
            ->where('tipo', '!=', 'nota_credito')
            ->where('fecha', '>=', $inicio)
            ->where('fecha', '<', $fin)
            ->groupBy('medio_pago')
            ->selectRaw('medio_pago, SUM(total) as total')
            ->pluck('total', 'medio_pago');

        $desde = $inicio->toDateString();
        $hasta = $fin->copy()->subDay()->toDateString();

        // El efectivo de una compra sale de la gaveta del turno o de una caja chica fuera del POS: solo la primera
        // reduce lo que hay en las gavetas. Una compra a crédito cuenta cuando se paga, con la forma de pago real.
        $comprasPorMetodo = $this->comprasPagadas($localId, $desde, $hasta)
            ->groupBy('canal')
            ->selectRaw("CASE WHEN COALESCE(pago_metodo, metodo_pago) = 'efectivo' AND COALESCE(pago_origen_efectivo, origen_efectivo) = 'gaveta_turno' THEN 'efectivo_gaveta' WHEN COALESCE(pago_metodo, metodo_pago) = 'efectivo' THEN 'efectivo_caja_chica' ELSE COALESCE(pago_metodo, metodo_pago) END AS canal, SUM(total) as total")
            ->pluck('total', 'canal');

        $gastosPorOrigen = DB::table('gasto_manual')
            ->where('local_id', $localId)
            ->where('estado', 'registrado')
            ->whereBetween('fecha', [$desde, $hasta])
            ->groupBy('origen_fondos')
            ->selectRaw('origen_fondos, SUM(monto) as total')
            ->pluck('total', 'origen_fondos');

        $ingEfectivo = round((float) ($porMedio['efectivo'] ?? 0), 2);
        $ingTarjeta = round((float) ($porMedio['tarjeta'] ?? 0), 2);
        $ingBilletera = round((float) ($porMedio['billetera_digital'] ?? 0), 2);

        return [
            'ing_efectivo' => $ingEfectivo,
            'ing_tarjeta' => $ingTarjeta,
            'ing_billetera' => $ingBilletera,
            'ingresos' => round($ingEfectivo + $ingTarjeta + $ingBilletera, 2),
            'compras_total' => round((float) $comprasPorMetodo->sum(), 2),
            'compras_efectivo' => round((float) ($comprasPorMetodo['efectivo_gaveta'] ?? 0), 2),
            'compras_caja_chica' => round((float) ($comprasPorMetodo['efectivo_caja_chica'] ?? 0), 2),
            'compras_banco' => round((float) ($comprasPorMetodo['transferencia'] ?? 0) + (float) ($comprasPorMetodo['tarjeta_debito'] ?? 0), 2),
            'gastos_total' => round((float) $gastosPorOrigen->sum(), 2),
            'gastos_caja' => round((float) ($gastosPorOrigen['efectivo_caja'] ?? 0), 2),
            'gastos_banco' => round((float) ($gastosPorOrigen['transferencia_bancaria'] ?? 0), 2),
        ];
    }

    /**
     * Un punto por cada día del rango, también los días sin movimiento.
     *
     * @param  array{periodo: string, desde: string, hasta: string, inicio: Carbon, fin: Carbon, dias: int}  $rango
     * @return list<array{fecha: string, etiqueta_dia: string, ingresos_dia: float, egresos_dia: float, saldo_neto_dia: float}>
     */
    private function curvaDiaria(string $localId, array $rango): array
    {
        // La zona viene de la configuración de la app (no de la petición); se incrusta como literal porque
        // Postgres no reconoce una expresión parametrizada del SELECT como la misma del GROUP BY.
        $zona = DB::getPdo()->quote((string) config('app.timezone'));

        $ingresos = DB::table('comprobante')
            ->where('local_id', $localId)
            ->where('estado', 'emitido')
            ->where('tipo', '!=', 'nota_credito')
            ->where('fecha', '>=', $rango['inicio'])
            ->where('fecha', '<', $rango['fin'])
            ->groupBy('dia')
            ->selectRaw("(fecha AT TIME ZONE {$zona})::date as dia, SUM(total) as total")
            ->pluck('total', 'dia');

        $compras = $this->comprasPagadas($localId, $rango['desde'], $rango['hasta'])
            ->groupBy('dia')
            ->selectRaw('COALESCE(fecha_pago, fecha_emision) as dia, SUM(total) as total')
            ->pluck('total', 'dia');

        $gastos = DB::table('gasto_manual')
            ->where('local_id', $localId)
            ->where('estado', 'registrado')
            ->whereBetween('fecha', [$rango['desde'], $rango['hasta']])
            ->groupBy('fecha')
            ->selectRaw('fecha as dia, SUM(monto) as total')
            ->pluck('total', 'dia');

        $curva = [];
        for ($dia = $rango['inicio']->copy(); $dia->lt($rango['fin']); $dia->addDay()) {
            $clave = $dia->toDateString();
            $ingresosDia = round((float) ($ingresos[$clave] ?? 0), 2);
            $egresosDia = round((float) ($compras[$clave] ?? 0) + (float) ($gastos[$clave] ?? 0), 2);
            $curva[] = [
                'fecha' => $clave,
                'etiqueta_dia' => $dia->day.' '.self::MESES[$dia->month - 1],
                'ingresos_dia' => $ingresosDia,
                'egresos_dia' => $egresosDia,
                'saldo_neto_dia' => round($ingresosDia - $egresosDia, 2),
            ];
        }

        return $curva;
    }

    /**
     * @param  array{periodo: string, desde: string, hasta: string, inicio: Carbon, fin: Carbon, dias: int}  $rango
     * @return list<array{insumo_id: string, nombre_insumo: string, cantidad_comprada: float, unidad_medida: string, monto_total: float, porcentaje_de_compras: float}>
     */
    private function topInsumos(string $localId, array $rango, float $comprasTotal): array
    {
        return $this->comprasPagadas($localId, $rango['desde'], $rango['hasta'], 'f')
            ->join('ficha_compra_detalle as d', 'd.ficha_compra_id', '=', 'f.id')
            ->join('insumo as i', 'i.id', '=', 'd.insumo_id')
            ->groupBy('i.id', 'i.nombre', 'i.unidad_medida')
            ->orderByDesc('monto')
            ->limit(self::TOP_INSUMOS)
            ->selectRaw('i.id as insumo_id, i.nombre, i.unidad_medida, SUM(d.cantidad) as cantidad, SUM(d.subtotal) as monto')
            ->get()
            ->map(fn ($fila): array => [
                'insumo_id' => (string) $fila->insumo_id,
                'nombre_insumo' => $fila->nombre,
                'cantidad_comprada' => round((float) $fila->cantidad, 3),
                'unidad_medida' => $fila->unidad_medida,
                'monto_total' => round((float) $fila->monto, 2),
                'porcentaje_de_compras' => $this->porcentaje((float) $fila->monto, $comprasTotal),
            ])
            ->all();
    }

    /**
     * @param  array{periodo: string, desde: string, hasta: string, inicio: Carbon, fin: Carbon, dias: int}  $rango
     * @return list<array{categoria: string, nombre_categoria: string, monto_total: float, porcentaje_de_gastos: float}>
     */
    private function gastosPorCategoria(string $localId, array $rango, float $gastosTotal): array
    {
        return DB::table('gasto_manual')
            ->where('local_id', $localId)
            ->where('estado', 'registrado')
            ->whereBetween('fecha', [$rango['desde'], $rango['hasta']])
            ->groupBy('categoria')
            ->orderByDesc('monto')
            ->selectRaw('categoria, SUM(monto) as monto')
            ->get()
            ->map(fn ($fila): array => [
                'categoria' => $fila->categoria,
                'nombre_categoria' => self::CATEGORIAS_GASTO[$fila->categoria] ?? $fila->categoria,
                'monto_total' => round((float) $fila->monto, 2),
                'porcentaje_de_gastos' => $this->porcentaje((float) $fila->monto, $gastosTotal),
            ])
            ->all();
    }

    /**
     * Compras de la sede que cuentan como egreso en [desde, hasta]: las vigentes pagadas al registrarse y las de
     * crédito ya pagadas, en su fecha de pago. Una compra a crédito sin pagar no ha salido de ninguna cuenta.
     *
     * @return Builder consulta sobre `ficha_compra as {$alias}`
     */
    private function comprasPagadas(string $localId, string $desde, string $hasta, string $alias = 'fc'): Builder
    {
        return DB::table("ficha_compra as {$alias}")
            ->where("{$alias}.local_id", $localId)
            ->where("{$alias}.estado", 'registrada')
            ->where(fn (Builder $q) => $q->where("{$alias}.metodo_pago", '!=', 'credito_proveedor')->orWhereNotNull("{$alias}.fecha_pago"))
            ->whereRaw("COALESCE({$alias}.fecha_pago, {$alias}.fecha_emision) BETWEEN ? AND ?", [$desde, $hasta]);
    }

    /** Deuda vigente con proveedores: compras a crédito sin pagar, de cualquier fecha. */
    private function porPagarProveedores(string $localId): float
    {
        return round((float) DB::table('ficha_compra')
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->where('metodo_pago', 'credito_proveedor')
            ->whereNull('fecha_pago')
            ->sum('total'), 2);
    }

    /**
     * Variación porcentual frente al periodo anterior. Es `null` cuando el anterior no tuvo movimientos:
     * no hay con qué comparar, y un "0 %" se leería como "igual que antes".
     */
    private function variacion(float $actual, float $anterior): ?float
    {
        if ($anterior <= 0.0) {
            return null;
        }

        return round((($actual - $anterior) / $anterior) * 100, 1);
    }

    private function porcentaje(float $parte, float $total): float
    {
        if (abs($total) < 0.005) {
            return 0.0;
        }

        return round(($parte / $total) * 100, 1);
    }
}
