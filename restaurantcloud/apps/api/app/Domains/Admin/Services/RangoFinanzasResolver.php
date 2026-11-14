<?php

namespace App\Domains\Admin\Services;

use App\Domains\Admin\Exceptions\FinanzasException;
use Illuminate\Support\Carbon;

/**
 * Traduce el periodo elegido en el módulo de finanzas ("hoy", "semana", "este_mes", "personalizado")
 * a un rango de fechas de la sede (zona horaria de la aplicación, America/Lima).
 */
class RangoFinanzasResolver
{
    public const PERIODOS = ['hoy', 'semana', 'este_mes', 'personalizado'];

    public const MAX_DIAS = 366;

    /**
     * `inicio` es el comienzo del primer día y `fin` el comienzo del día siguiente al último (límite exclusivo).
     *
     * @return array{periodo: string, desde: string, hasta: string, inicio: Carbon, fin: Carbon, dias: int}
     *
     * @throws FinanzasException si el periodo es inválido o el rango personalizado es incoherente.
     */
    public function resolver(string $periodo, ?string $desde = null, ?string $hasta = null): array
    {
        if (! in_array($periodo, self::PERIODOS, true)) {
            throw new FinanzasException('ERR_PERIODO_INVALIDO', 'El periodo solicitado no es válido.', 422);
        }

        $hoy = now()->startOfDay();

        switch ($periodo) {
            case 'hoy':
                $inicio = $hoy->copy();
                $ultimoDia = $hoy->copy();
                break;
            case 'semana':
                $inicio = $hoy->copy()->startOfWeek();
                $ultimoDia = $hoy->copy();
                break;
            case 'este_mes':
                $inicio = $hoy->copy()->startOfMonth();
                $ultimoDia = $hoy->copy();
                break;
            default:
                if ($desde === null || $hasta === null) {
                    throw new FinanzasException('ERR_RANGO_INVALIDO', 'Indica las fechas "desde" y "hasta" del periodo personalizado.', 422);
                }
                $inicio = Carbon::createFromFormat('!Y-m-d', $desde);
                $ultimoDia = Carbon::createFromFormat('!Y-m-d', $hasta);
                if ($ultimoDia->lt($inicio)) {
                    throw new FinanzasException('ERR_RANGO_INVALIDO', 'La fecha "hasta" no puede ser anterior a "desde".', 422);
                }
        }

        $dias = (int) $inicio->diffInDays($ultimoDia) + 1;
        if ($dias > self::MAX_DIAS) {
            throw new FinanzasException(
                'ERR_RANGO_EXCEDIDO',
                'El periodo no puede superar '.self::MAX_DIAS.' días.',
                422
            );
        }

        return [
            'periodo' => $periodo,
            'desde' => $inicio->toDateString(),
            'hasta' => $ultimoDia->toDateString(),
            'inicio' => $inicio,
            'fin' => $ultimoDia->copy()->addDay(),
            'dias' => $dias,
        ];
    }
}
