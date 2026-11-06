<?php

namespace App\Domains\Inventario\Services;

use Illuminate\Support\Facades\DB;

class ValidacionStockPedidoService
{
    /**
     * Valida que los productos de despacho directo (requiere_preparacion = false) de un pedido
     * tengan insumos suficientes. Debe invocarse dentro de la transacción de creación del pedido,
     * antes de insertar nada: bloquea las filas de insumo para serializar mozos concurrentes.
     *
     * Los ítems de cocina no se validan: su descuento ocurre al marcar "listo" y la política
     * de no bloqueo de fogones (fn_inventario_descontar_receta) sigue vigente.
     *
     * @param  array<int, array{producto_id: string, cantidad: int}>  $items
     * @return array{producto_id: string, producto_nombre: string, cantidad_solicitada: int, raciones_disponibles: int, insumo_limitante: string}|null
     */
    public function validarDespachoDirecto(string $localId, array $items): ?array
    {
        $productoIds = collect($items)->pluck('producto_id')->unique()->values();

        $productosDirectos = DB::table('producto')
            ->whereIn('id', $productoIds)
            ->where('local_id', $localId)
            ->where('requiere_preparacion', false)
            ->get()
            ->keyBy('id');

        if ($productosDirectos->isEmpty()) {
            return null;
        }

        $recetas = DB::table('producto_insumo')
            ->whereIn('producto_id', $productosDirectos->keys())
            ->get()
            ->groupBy('producto_id');

        $insumoIds = $recetas->flatten(1)->pluck('insumo_id')->unique()->sort()->values();

        if ($insumoIds->isEmpty()) {
            return null;
        }

        // Orden por id para evitar deadlocks entre mozos que bloquean insumos en distinto orden.
        $insumos = DB::table('insumo')
            ->whereIn('id', $insumoIds)
            ->where('local_id', $localId)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $restante = $insumos->map(fn ($insumo) => (float) $insumo->stock_actual)->all();
        $solicitadoPorProducto = [];
        $aceptadoPorProducto = [];

        foreach ($items as $item) {
            $productoId = $item['producto_id'];
            $producto = $productosDirectos->get($productoId);
            $receta = $recetas->get($productoId);

            if (! $producto || ! $receta) {
                continue;
            }

            $cantidad = (int) $item['cantidad'];
            $solicitadoPorProducto[$productoId] = ($solicitadoPorProducto[$productoId] ?? 0) + $cantidad;

            $consumos = [];
            $limitante = null;
            $racionesLinea = PHP_INT_MAX;
            $cabe = true;

            foreach ($receta as $ingrediente) {
                $insumo = $insumos->get($ingrediente->insumo_id);
                $dosis = $this->dosis($ingrediente);

                if (! $insumo || $dosis <= 0) {
                    continue;
                }

                $consumo = round($dosis * $cantidad, 3);
                $consumos[$ingrediente->insumo_id] = $consumo;

                $disponible = $restante[$ingrediente->insumo_id];
                $raciones = (int) max(0, floor(($disponible + 1e-9) / $dosis));

                if ($raciones < $racionesLinea) {
                    $racionesLinea = $raciones;
                    $limitante = $insumo->nombre;
                }

                if ($disponible + 1e-9 < $consumo) {
                    $cabe = false;
                }
            }

            if (! $cabe) {
                return [
                    'producto_id' => $productoId,
                    'producto_nombre' => $producto->nombre,
                    'cantidad_solicitada' => $solicitadoPorProducto[$productoId],
                    'raciones_disponibles' => ($aceptadoPorProducto[$productoId] ?? 0) + $racionesLinea,
                    'insumo_limitante' => (string) $limitante,
                ];
            }

            foreach ($consumos as $insumoId => $consumo) {
                $restante[$insumoId] -= $consumo;
            }
            $aceptadoPorProducto[$productoId] = ($aceptadoPorProducto[$productoId] ?? 0) + $cantidad;
        }

        return null;
    }

    /**
     * Dosis por ración, calculada igual que en fn_inventario_descontar_receta.
     */
    private function dosis(object $ingrediente): float
    {
        if ($ingrediente->modo_calculo === 'rendimiento' && (float) $ingrediente->rendimiento_platos > 0) {
            return 1.0 / (float) $ingrediente->rendimiento_platos;
        }

        return (float) $ingrediente->cantidad_descuenta;
    }
}
