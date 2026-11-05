<?php

namespace App\Domains\Suscripcion\Services;

use Carbon\Carbon;

/**
 * Periodo de facturación vigente de una suscripción. `suscripcion.fecha_inicio` es el alta
 * original, así que el inicio del periodo actual se deduce retrocediendo un ciclo desde su fin.
 */
final class PeriodoFacturacion
{
    /**
     * @return array{inicio: Carbon, fin: Carbon, segundos_totales: int, segundos_restantes: int}
     */
    public static function de(object $suscripcion): array
    {
        $fin = Carbon::parse($suscripcion->fecha_fin_periodo);
        $inicio = ($suscripcion->ciclo_facturacion ?? 'mensual') === 'anual'
            ? $fin->copy()->subYearNoOverflow()
            : $fin->copy()->subMonthNoOverflow();

        $totales = max(1, (int) $inicio->diffInSeconds($fin, true));
        $restantes = (int) max(0, min($totales, now()->diffInSeconds($fin, false)));

        return [
            'inicio' => $inicio,
            'fin' => $fin,
            'segundos_totales' => $totales,
            'segundos_restantes' => $restantes,
        ];
    }

    public static function diasRestantes(object $suscripcion): int
    {
        return (int) ceil(self::de($suscripcion)['segundos_restantes'] / 86400);
    }

    public static function diasTotales(object $suscripcion): int
    {
        $periodo = self::de($suscripcion);

        return (int) max(1, round($periodo['segundos_totales'] / 86400));
    }
}
