<?php

namespace App\Domains\Caja\Services;

use App\Domains\Admin\Exceptions\FinanzasException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Salidas de efectivo de la gaveta del turno abierto que no son devoluciones: gastos operativos y
 * compras de insumos pagadas con el efectivo de la caja (CU-ADMIN-14, CU-ADMIN-06).
 *
 * El egreso queda como un asiento negativo en `caja_movimiento`, así el efectivo esperado del cierre
 * ya lo descuenta y el cajero no ve un falso faltante. Los dos pasos se separan porque el gasto o la
 * compra deben existir antes de enlazar el asiento. Ambos exigen una transacción abierta.
 */
class EgresoGavetaService
{
    public const TIPO_GASTO = 'egreso_gasto_manual';

    public const TIPO_COMPRA = 'egreso_compra_insumo';

    public function __construct(private HistorialComprobantesService $historial) {}

    /**
     * Bloquea el turno abierto de la sede y comprueba que el egreso es posible.
     * El bloqueo evita que un cobro o un cierre simultáneos desfasen el efectivo esperado.
     *
     * @return object la fila de `caja` bloqueada
     *
     * @throws FinanzasException si la fecha no es hoy, no hay turno abierto o el monto supera el efectivo de la gaveta.
     */
    public function reservar(string $localId, float $monto, string $fecha): object
    {
        if ($fecha !== now()->toDateString()) {
            throw new FinanzasException(
                'ERR_FECHA_EGRESO_EFECTIVO',
                'Un egreso pagado con efectivo de la gaveta se registra con la fecha de hoy: sale de la caja en este momento.',
                422
            );
        }

        $caja = DB::table('caja')
            ->where('local_id', $localId)
            ->where('estado', 'abierta')
            ->lockForUpdate()
            ->first();

        if (! $caja) {
            throw new FinanzasException(
                'ERR_SIN_TURNO_ABIERTO',
                'No hay un turno de caja abierto: no se puede descontar el egreso del efectivo de la gaveta. Elige otra forma de pago o abre un turno.',
                409
            );
        }

        $esperado = (float) $this->historial->resumenTurno($caja)['efectivo']['esperado'];
        if ($monto > $esperado + 0.001) {
            throw new FinanzasException(
                'ERR_EFECTIVO_INSUFICIENTE',
                'El egreso (S/ '.number_format($monto, 2).') supera el efectivo disponible en la gaveta (S/ '.number_format($esperado, 2).').',
                422
            );
        }

        return $caja;
    }

    /**
     * Asienta la salida de efectivo en el turno.
     *
     * @param  string  $tipo  self::TIPO_GASTO o self::TIPO_COMPRA
     */
    public function registrarMovimiento(object $caja, string $tipo, float $monto, string $referenciaId, string $descripcion): void
    {
        DB::table('caja_movimiento')->insert([
            'id' => (string) Str::uuid(),
            'caja_id' => $caja->id,
            'local_id' => $caja->local_id,
            'tipo' => $tipo,
            'monto' => -abs($monto),
            'metodo_pago' => 'efectivo',
            ($tipo === self::TIPO_COMPRA ? 'ficha_compra_id' : 'gasto_manual_id') => $referenciaId,
            'descripcion' => $descripcion,
            'created_at' => now(),
        ]);
    }
}
