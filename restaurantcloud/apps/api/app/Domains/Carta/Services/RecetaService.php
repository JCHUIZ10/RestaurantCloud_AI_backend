<?php

namespace App\Domains\Carta\Services;

use Illuminate\Support\Facades\DB;

class RecetaService
{
    /**
     * Obtiene la receta calibrada de un producto con desglose de costos y márgenes.
     */
    public function obtener(string $productoId, string $localId): ?array
    {
        $producto = DB::table('producto')
            ->where('id', $productoId)
            ->where('local_id', $localId)
            ->where('activo', true)
            ->select(['id', 'nombre', 'precio', 'costo_estandar', 'disponibilidad', 'motivo_agotado'])
            ->first();

        if (! $producto) {
            return null;
        }

        $items = DB::table('producto_insumo as pi')
            ->join('insumo as i', 'i.id', '=', 'pi.insumo_id')
            ->where('pi.producto_id', $productoId)
            ->where('i.local_id', $localId)
            ->select([
                'pi.insumo_id',
                'i.nombre as insumo_nombre',
                'i.unidad_medida',
                'i.stock_actual',
                'i.costo_unitario',
                'i.estado as insumo_estado',
                'pi.modo_calculo',
                'pi.rendimiento_platos',
                'pi.cantidad_descuenta',
            ])
            ->orderBy('i.nombre')
            ->get()
            ->map(function ($item) {
                $costoUnitario = (float) $item->costo_unitario;
                $cantidadDescuenta = (float) $item->cantidad_descuenta;
                $costoSubtotal = round($costoUnitario * $cantidadDescuenta, 4);

                return [
                    'insumo_id' => $item->insumo_id,
                    'nombre' => $item->insumo_nombre,
                    'insumo_nombre' => $item->insumo_nombre,
                    'unidad_medida' => $item->unidad_medida,
                    'stock_actual' => (float) $item->stock_actual,
                    'stock_actual_insumo' => (float) $item->stock_actual,
                    'costo_unitario' => $costoUnitario,
                    'costo_unitario_insumo' => $costoUnitario,
                    'modo_calculo' => $item->modo_calculo,
                    'rendimiento_platos' => $item->rendimiento_platos !== null ? (float) $item->rendimiento_platos : null,
                    'cantidad_descuenta' => $cantidadDescuenta,
                    'costo_subtotal' => $costoSubtotal,
                    'costo_plato_insumo' => $costoSubtotal,
                    'raciones_disponibles_insumo' => $cantidadDescuenta > 0 ? (int) floor((float) $item->stock_actual / $cantidadDescuenta) : 0,
                    'estado_insumo' => $item->insumo_estado,
                ];
            })
            ->all();

        $costoTeorico = array_reduce($items, fn ($acc, $item) => $acc + $item['costo_subtotal'], 0.0);
        $precio = (float) $producto->precio;
        $margenBrutoPct = $precio > 0 ? round((($precio - $costoTeorico) / $precio) * 100, 1) : 0.0;

        return [
            'producto_id' => $producto->id,
            'nombre' => $producto->nombre,
            'precio' => $precio,
            'costo_estandar' => (float) $producto->costo_estandar,
            'costo_teorico' => round($costoTeorico, 2),
            'margen_bruto_pct' => $margenBrutoPct,
            'disponibilidad' => $producto->disponibilidad,
            'motivo_agotado' => $producto->motivo_agotado,
            'total_ingredientes' => count($items),
            'items' => $items,
            'receta' => $items,
        ];
    }

    /**
     * Guarda la receta culinaria invocando la función PostgreSQL atómica fn_receta_guardar.
     */
    public function guardar(string $productoId, string $localId, array $items): array
    {
        $itemsNormalizados = [];

        foreach ($items as $item) {
            $insumoId = $item['insumo_id'] ?? null;
            $modo = $item['modo_calculo'] ?? 'exacto';
            $rendimiento = isset($item['rendimiento_platos']) && $item['rendimiento_platos'] !== '' && $item['rendimiento_platos'] !== null
                ? (float) $item['rendimiento_platos']
                : null;

            if ($modo === 'rendimiento') {
                if ($rendimiento === null || $rendimiento <= 0) {
                    throw new \InvalidArgumentException('El rendimiento en platos debe ser mayor a 0 cuando el modo es rendimiento.');
                }
                $cantidadDescuenta = round(1 / $rendimiento, 5);
            } else {
                $cantidadDescuenta = (float) ($item['cantidad_descuenta'] ?? 0);
                if ($cantidadDescuenta <= 0) {
                    throw new \InvalidArgumentException('La cantidad a descontar debe ser mayor a 0.');
                }
            }

            $itemsNormalizados[] = [
                'insumo_id' => $insumoId,
                'modo_calculo' => $modo,
                'rendimiento_platos' => $rendimiento,
                'cantidad_descuenta' => $cantidadDescuenta,
            ];
        }

        $payloadJson = json_encode($itemsNormalizados, JSON_THROW_ON_ERROR);

        $resultado = DB::selectOne(
            'SELECT fn_receta_guardar(?, ?, ?::jsonb) as payload',
            [$productoId, $localId, $payloadJson]
        );

        if (! $resultado || empty($resultado->payload)) {
            throw new \RuntimeException('No se pudo guardar la receta del producto.');
        }

        $datos = json_decode($resultado->payload, true);
        $detalleCompleto = $this->obtener($productoId, $localId);

        return array_merge($datos, [
            'receta' => $detalleCompleto ? $detalleCompleto['items'] : [],
        ]);
    }

    /**
     * Calcula la capacidad máxima en raciones y detecta el insumo cuello de botella.
     */
    public function capacidad(string $productoId, string $localId): array
    {
        $resultado = DB::selectOne(
            'SELECT fn_receta_calcular_capacidad(?, ?) as payload',
            [$productoId, $localId]
        );

        if (! $resultado || empty($resultado->payload)) {
            throw new \RuntimeException('No se pudo calcular la capacidad de bodega.');
        }

        return json_decode($resultado->payload, true);
    }
}
