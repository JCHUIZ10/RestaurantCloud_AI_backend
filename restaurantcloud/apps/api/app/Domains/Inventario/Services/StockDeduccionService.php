<?php

namespace App\Domains\Inventario\Services;

use Illuminate\Support\Facades\DB;

class StockDeduccionService
{
    /**
     * Descuenta atómicamente la receta culinaria de un ítem de pedido en KDS o despacho de salón.
     */
    public function descontarRecetaItem(string $pedidoItemId, string $usuarioId): array
    {
        return DB::transaction(function () use ($pedidoItemId, $usuarioId) {
            $resultado = DB::selectOne(
                'SELECT fn_inventario_descontar_receta(?, ?) AS payload',
                [$pedidoItemId, $usuarioId]
            );

            if (! $resultado || ! isset($resultado->payload)) {
                return [
                    'pedido_item_id' => $pedidoItemId,
                    'descontado' => false,
                    'mensaje' => 'Error al ejecutar deducción de receta en base de datos.',
                ];
            }

            return json_decode($resultado->payload, true) ?: [];
        });
    }

    /**
     * Revierte / restituye los insumos consumidos por un ítem (Deshacer KDS de 30s).
     */
    public function revertirRecetaItem(string $pedidoItemId, string $usuarioId): array
    {
        return DB::transaction(function () use ($pedidoItemId, $usuarioId) {
            $resultado = DB::selectOne(
                'SELECT fn_inventario_revertir_receta(?, ?) AS payload',
                [$pedidoItemId, $usuarioId]
            );

            if (! $resultado || ! isset($resultado->payload)) {
                return [
                    'pedido_item_id' => $pedidoItemId,
                    'revertido' => false,
                    'mensaje' => 'Error al revertir receta en base de datos.',
                ];
            }

            return json_decode($resultado->payload, true) ?: [];
        });
    }

    /**
     * Descuenta todos los ítems culinarios de una comanda que no hayan sido descontados previamente.
     */
    public function descontarPedidoCompleto(string $pedidoId, string $usuarioId): array
    {
        $items = DB::table('pedido_item as pi')
            ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedidoId)
            ->where('pr.requiere_preparacion', true)
            ->where('pi.stock_descontado', false)
            ->whereNotIn('pi.estado', ['anulado', 'no_disponible'])
            ->select('pi.id')
            ->get();

        $descontados = [];
        $totalInconsistencias = 0;
        $quiebresTotales = [];

        foreach ($items as $item) {
            $res = $this->descontarRecetaItem($item->id, $usuarioId);
            $descontados[] = $res;
            $totalInconsistencias += (int) ($res['inconsistencias'] ?? 0);
            if (! empty($res['quiebres_generados'])) {
                $quiebresTotales = array_merge($quiebresTotales, $res['quiebres_generados']);
            }
        }

        return [
            'pedido_id' => $pedidoId,
            'items_procesados' => count($descontados),
            'detalles' => $descontados,
            'total_inconsistencias' => $totalInconsistencias,
            'quiebres_generados' => $quiebresTotales,
        ];
    }
}
