<?php

namespace App\Domains\Inventario\Services;

use App\Domains\Carta\Services\CartaPublicaService;
use Illuminate\Support\Facades\DB;

class StockDeduccionService
{
    /**
     * Invalida la carta pública de la sede del ítem si la función agotó o reactivó platos.
     */
    private function invalidarCarta(string $pedidoItemId, array $respuesta): void
    {
        if (! CartaPublicaService::cambiaDisponibilidad($respuesta)) {
            return;
        }

        $localId = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('pi.id', $pedidoItemId)
            ->value('p.local_id');

        if ($localId) {
            CartaPublicaService::invalidar($localId);
        }
    }

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

            $payload = json_decode($resultado->payload, true) ?: [];
            $this->invalidarCarta($pedidoItemId, $payload);

            return $payload;
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

            $payload = json_decode($resultado->payload, true) ?: [];
            $this->invalidarCarta($pedidoItemId, $payload);

            return $payload;
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
