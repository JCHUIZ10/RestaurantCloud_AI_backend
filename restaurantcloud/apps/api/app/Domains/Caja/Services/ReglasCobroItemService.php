<?php

namespace App\Domains\Caja\Services;

use Illuminate\Support\Facades\DB;

/**
 * Regla 6: un plato cobrado solo se revierte con nota de crédito, y uno asignado a una
 * subcuenta pendiente no puede retirarse sin rehacer la división (el cobro usaría el total viejo).
 */
class ReglasCobroItemService
{
    /**
     * Motivo por el que el ítem no puede anularse ni sustituirse desde salón, o null si puede.
     *
     * @return array{codigo: string, mensaje: string}|null
     */
    public function bloqueoDeAnulacion(object $item): ?array
    {
        $comprobante = $this->comprobanteEmitidoDelItem($item->id);

        if (($item->estado_pago ?? null) === 'cobrado' || $comprobante !== null) {
            $referencia = $comprobante ? " en el comprobante {$comprobante->serie}-{$comprobante->correlativo}" : '';

            return [
                'codigo' => 'ITEM_YA_COBRADO',
                'mensaje' => "Este plato ya fue cobrado{$referencia}. Para anularlo, el administrador debe emitir una nota de crédito.",
            ];
        }

        $subcuenta = $this->subcuentaPendienteDelItem($item->id);

        if ($subcuenta !== null) {
            $hayCobros = DB::table('pedido_subcuenta')
                ->where('pedido_id', $subcuenta->pedido_id)
                ->where('estado', 'cobrado')
                ->exists();

            $salida = $hayCobros
                ? 'Como ya hay subcuentas cobradas, caja debe emitir primero la nota de crédito de esa subcuenta para poder reorganizar la cuenta.'
                : 'Vuelve a dividir la cuenta sin este plato y luego anúlalo.';

            return [
                'codigo' => 'ITEM_EN_SUBCUENTA_PENDIENTE',
                'mensaje' => "Este plato está asignado a la subcuenta #{$subcuenta->numero_subcuenta}. {$salida}",
            ];
        }

        return null;
    }

    /**
     * Primer ítem activo del pedido que no puede anularse desde salón, con su motivo.
     *
     * @return array{codigo: string, mensaje: string}|null
     */
    public function bloqueoDeAnulacionDelPedido(string $pedidoId): ?array
    {
        $items = DB::table('pedido_item')
            ->where('pedido_id', $pedidoId)
            ->where('estado', '!=', 'anulado')
            ->get();

        foreach ($items as $item) {
            $bloqueo = $this->bloqueoDeAnulacion($item);
            if ($bloqueo !== null) {
                return $bloqueo;
            }
        }

        return null;
    }

    private function comprobanteEmitidoDelItem(string $itemId): ?object
    {
        return DB::table('comprobante_item as ci')
            ->join('comprobante as co', 'co.id', '=', 'ci.comprobante_id')
            ->where('ci.pedido_item_id', $itemId)
            ->where('co.estado', 'emitido')
            ->select('co.serie', 'co.correlativo')
            ->first();
    }

    private function subcuentaPendienteDelItem(string $itemId): ?object
    {
        return DB::table('pedido_subcuenta_item as psi')
            ->join('pedido_subcuenta as ps', 'ps.id', '=', 'psi.subcuenta_id')
            ->where('psi.pedido_item_id', $itemId)
            ->where('ps.estado', 'pendiente')
            ->select('ps.pedido_id', 'ps.numero_subcuenta')
            ->first();
    }
}
