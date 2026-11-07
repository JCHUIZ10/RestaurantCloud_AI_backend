<?php

namespace App\Domains\Caja\Services;

use Illuminate\Support\Facades\DB;

/**
 * Regla de cierre de cuenta: el pago final exige que todo plato/bebida esté servido o anulado.
 */
class ServicioPendienteService
{
    /** Estados de ítem que aún no llegaron a la mesa (o requieren acción del mozo). */
    public const ESTADOS_PENDIENTES = ['en_cola', 'en_preparacion', 'listo', 'no_disponible'];

    public function contarPendientes(string $pedidoId): int
    {
        return DB::table('pedido_item')
            ->where('pedido_id', $pedidoId)
            ->whereIn('estado', self::ESTADOS_PENDIENTES)
            ->count();
    }

    /** Platos sin servir entre los pedido_item indicados (p. ej. los de una subcuenta). */
    public function contarPendientesDeItems(iterable $pedidoItemIds): int
    {
        $ids = collect($pedidoItemIds)->unique()->values()->all();
        if ($ids === []) {
            return 0;
        }

        return DB::table('pedido_item')
            ->whereIn('id', $ids)
            ->whereIn('estado', self::ESTADOS_PENDIENTES)
            ->count();
    }

    /**
     * Cuenta los ítems pendientes de servicio dentro de una colección ya cargada.
     *
     * @param  iterable<object{estado: string}>  $items
     */
    public function contarPendientesEn(iterable $items): int
    {
        $total = 0;
        foreach ($items as $item) {
            if (in_array($item->estado ?? $item->estado_cocina ?? null, self::ESTADOS_PENDIENTES, true)) {
                $total++;
            }
        }

        return $total;
    }

    public function mensajeBloqueo(int $pendientes): string
    {
        return "Hay {$pendientes} plato(s) sin servir; el cobro final se habilitará cuando todo esté servido o anulado.";
    }
}
