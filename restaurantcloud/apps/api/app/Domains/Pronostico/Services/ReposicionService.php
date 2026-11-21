<?php

namespace App\Domains\Pronostico\Services;

use App\Domains\Pronostico\Exceptions\PronosticoException;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Reposición sugerida de insumos a partir del pronóstico de platos.
 *
 * Por insumo y para los primeros `cobertura` días del pronóstico:
 *
 *     consumo_previsto  = Σ P50 del plato × cantidad por plato (receta)
 *     margen_seguridad  = Σ reserva del plato × cantidad por plato
 *     cantidad_sugerida = máx(0, consumo_previsto + margen_seguridad − stock)
 *
 * La reserva de un día es `P90 − P50`. En los días sin modelo (`baseline`) no baja de `reserva_minima × P50`,
 * porque con pocos días de ventas el P90 no es confiable (doc-2u/03-prediccion-en-locales-nuevos.md, N-2).
 * Un insumo por debajo de su stock mínimo siempre entra, aunque ninguna receta lo consuma (N-4).
 * La recomendación es apoyo a la decisión; no genera compras.
 */
class ReposicionService
{
    /** Unidades que se compran enteras: se redondea hacia arriba. */
    private const UNIDADES_CONTABLES = ['und', 'botella', 'lata', 'caja', 'paquete', 'saco', 'bidon', 'jaba'];

    private const ORDEN_PRIORIDAD = "CASE r.prioridad WHEN 'urgente' THEN 0 WHEN 'pronto' THEN 1 ELSE 2 END";

    /**
     * @param  array<int, array<string, mixed>>  $predicciones  `predicciones` de ms-pronóstico
     * @param  array<string, list<array{insumo_id: string, cantidad: float}>>  $recetas  por producto_id
     * @param  array<string, array{stock: float, minimo: float, unidad: string}>  $insumos  insumos activos de la sede
     * @return array<string, array{consumo_previsto: float, margen_seguridad: float, stock_al_calcular: float, stock_minimo_al_calcular: float, cantidad_sugerida: float, alcanza_dias: int|null, prioridad: string, motivo: string}>
     */
    public function calcular(array $predicciones, array $recetas, array $insumos, int $cobertura, float $reservaMinima = 0.0): array
    {
        $consumo = [];
        $margen = [];
        $porDia = [];
        $horizonte = 0;

        foreach ($predicciones as $plato) {
            $receta = $recetas[$plato['producto_id']] ?? [];
            if ($receta === []) {
                continue;
            }

            foreach ($plato['dias'] as $i => $dia) {
                $p50 = (float) $dia['p50'];
                $reserva = max(0.0, (float) $dia['p90'] - $p50);
                if (($dia['metodo'] ?? null) === 'baseline') {
                    $reserva = max($reserva, $reservaMinima * $p50);
                }
                $horizonte = max($horizonte, $i + 1);

                foreach ($receta as $linea) {
                    $insumoId = $linea['insumo_id'];
                    if (! isset($insumos[$insumoId])) {
                        continue;
                    }
                    $porDia[$insumoId][$i] = ($porDia[$insumoId][$i] ?? 0.0) + $p50 * $linea['cantidad'];
                    if ($i < $cobertura) {
                        $consumo[$insumoId] = ($consumo[$insumoId] ?? 0.0) + $p50 * $linea['cantidad'];
                        $margen[$insumoId] = ($margen[$insumoId] ?? 0.0) + $reserva * $linea['cantidad'];
                    }
                }
            }
        }

        $resultado = [];
        foreach ($consumo as $insumoId => $previsto) {
            if ($previsto + $margen[$insumoId] <= 0) {
                continue;
            }

            $datos = $insumos[$insumoId];
            $alcanza = $this->diasQueAlcanza($porDia[$insumoId], $horizonte, $datos['stock']);
            $resultado[$insumoId] = [
                'consumo_previsto' => round($previsto, 3),
                'margen_seguridad' => round($margen[$insumoId], 3),
                'stock_al_calcular' => round($datos['stock'], 3),
                'stock_minimo_al_calcular' => round($datos['minimo'], 3),
                'cantidad_sugerida' => $this->redondear(max(0.0, $previsto + $margen[$insumoId] - $datos['stock']), $datos['unidad']),
                'alcanza_dias' => $alcanza,
                'prioridad' => match (true) {
                    $datos['stock'] < $datos['minimo'], $alcanza === 0 => 'urgente',
                    $alcanza < $cobertura => 'pronto',
                    default => 'cubierto',
                },
                'motivo' => 'consumo',
            ];
        }

        foreach ($insumos as $insumoId => $datos) {
            if (isset($resultado[$insumoId]) || $datos['stock'] >= $datos['minimo']) {
                continue;
            }
            $resultado[$insumoId] = [
                'consumo_previsto' => 0.0,
                'margen_seguridad' => 0.0,
                'stock_al_calcular' => round($datos['stock'], 3),
                'stock_minimo_al_calcular' => round($datos['minimo'], 3),
                'cantidad_sugerida' => $this->redondear($datos['minimo'] - $datos['stock'], $datos['unidad']),
                'alcanza_dias' => null,
                'prioridad' => 'urgente',
                'motivo' => 'bajo_minimo',
            ];
        }

        return $resultado;
    }

    /**
     * Días seguidos, desde el primero, que el stock cubre el consumo más probable.
     *
     * @param  array<int, float>  $consumoPorDia
     */
    private function diasQueAlcanza(array $consumoPorDia, int $horizonte, float $stock): int
    {
        $acumulado = 0.0;
        for ($i = 0; $i < $horizonte; $i++) {
            $acumulado += $consumoPorDia[$i] ?? 0.0;
            if ($acumulado > $stock) {
                return $i;
            }
        }

        return $horizonte;
    }

    private function redondear(float $cantidad, string $unidad): float
    {
        // Se pide de más antes que de menos; el round previo quita el ruido de la coma flotante.
        return in_array($unidad, self::UNIDADES_CONTABLES, true)
            ? (float) ceil(round($cantidad, 4))
            : ceil(round($cantidad * 10, 4)) / 10;
    }

    /**
     * Calcula la reposición de un pronóstico y la guarda. Si la ejecución ya tenía recomendaciones
     * (reintento con la misma solicitud), no las recalcula: conserva lo que ya vio el administrador.
     *
     * @param  array<string, mixed>  $pronostico  `datos` de ms-pronóstico
     * @return list<array<string, mixed>>
     */
    public function registrar(string $localId, array $pronostico, int $cobertura): array
    {
        $ejecucionId = (string) $pronostico['ejecucion_id'];

        $yaCalculada = DB::table('recomendacion_reposicion')
            ->where('ejecucion_id', $ejecucionId)
            ->where('local_id', $localId)
            ->exists();

        if (! $yaCalculada) {
            $insumos = $this->insumosActivos($localId);
            $recetas = $this->recetas($localId, array_column($pronostico['predicciones'], 'producto_id'));
            $calculo = $this->calcular(
                $pronostico['predicciones'],
                $recetas,
                array_map(fn (object $i): array => ['stock' => (float) $i->stock_actual, 'minimo' => (float) $i->stock_minimo, 'unidad' => $i->unidad_medida], $insumos),
                $cobertura,
                (float) config('services.pronostico.reserva_minima'),
            );

            $ahora = now();
            $filas = [];
            foreach ($calculo as $insumoId => $fila) {
                $filas[] = [
                    'local_id' => $localId,
                    'ejecucion_id' => $ejecucionId,
                    'insumo_id' => $insumoId,
                    'cobertura_dias' => $cobertura,
                    ...$fila,
                    'costo_unitario_al_calcular' => (float) $insumos[$insumoId]->costo_unitario,
                    'proveedor_id' => $insumos[$insumoId]->ultimo_proveedor_id,
                    'created_at' => $ahora,
                ];
            }
            DB::table('recomendacion_reposicion')->insertOrIgnore($filas);
        }

        return $this->deEjecucion($ejecucionId, $localId);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function deEjecucion(string $ejecucionId, string $localId): array
    {
        return $this->consulta()
            ->where('r.ejecucion_id', $ejecucionId)
            ->where('r.local_id', $localId)
            ->orderByRaw(self::ORDEN_PRIORIDAD)
            ->orderByDesc('r.cantidad_sugerida')
            ->orderBy('i.nombre')
            ->get($this->columnas())
            ->map(fn (object $fila): array => $this->presentar($fila))
            ->all();
    }

    /**
     * El administrador acepta, ajusta o descarta una recomendación pendiente. Una vez decidida no cambia:
     * queda como registro de quién la decidió y cuándo.
     *
     * @return array<string, mixed>
     */
    public function decidir(string $id, string $localId, string $usuarioId, string $estado, ?float $cantidadFinal): array
    {
        $actual = DB::table('recomendacion_reposicion')->where('id', $id)->where('local_id', $localId)->first();
        if ($actual === null) {
            throw new PronosticoException('ERR_NO_ENCONTRADO', 'La recomendación no existe o no pertenece a esta sede.', 404);
        }

        $final = match ($estado) {
            'aceptada' => (float) $actual->cantidad_sugerida,
            'ajustada' => $cantidadFinal,
            default => null,
        };

        // El filtro por estado hace atómica la decisión: si dos administradores deciden a la vez, gana uno.
        $cambiadas = DB::table('recomendacion_reposicion')
            ->where('id', $id)
            ->where('estado', 'pendiente')
            ->update([
                'estado' => $estado,
                'cantidad_final' => $final,
                'decidido_por' => $usuarioId,
                'decidido_en' => now(),
            ]);

        if ($cambiadas === 0) {
            throw new PronosticoException('ERR_REPOSICION_YA_DECIDIDA', "Esta recomendación ya fue {$actual->estado}.", 409);
        }

        return $this->presentar($this->consulta()->where('r.id', $id)->first($this->columnas()));
    }

    /**
     * Varias decisiones a la vez (la pantalla de compra): o se guardan todas o ninguna.
     *
     * @param  list<array{id: string, estado: string, cantidad_final?: float|null}>  $decisiones
     * @return list<array<string, mixed>>
     */
    public function decidirLote(array $decisiones, string $localId, string $usuarioId): array
    {
        return DB::transaction(fn (): array => array_map(
            fn (array $d): array => $this->decidir($d['id'], $localId, $usuarioId, $d['estado'], $d['cantidad_final'] ?? null),
            $decisiones,
        ));
    }

    /**
     * Resumen de una reposición: cuántas líneas por prioridad, cuánto cuesta y cómo van las decisiones.
     * Lo descartado no cuenta para la compra.
     *
     * @param  list<array<string, mixed>>  $reposicion
     * @return array{por_prioridad: array<string, int>, costo: float, proveedores: int, decisiones: array<string, int>}
     */
    public function totales(array $reposicion): array
    {
        $porPrioridad = ['urgente' => 0, 'pronto' => 0, 'cubierto' => 0];
        $decisiones = ['pendientes' => 0, 'aceptadas' => 0, 'ajustadas' => 0, 'descartadas' => 0];
        $costo = 0.0;
        $proveedores = [];

        foreach ($reposicion as $linea) {
            $decisiones[['pendiente' => 'pendientes', 'aceptada' => 'aceptadas', 'ajustada' => 'ajustadas', 'descartada' => 'descartadas'][$linea['estado']]]++;
            if ($linea['estado'] === 'descartada') {
                continue;
            }
            $porPrioridad[$linea['prioridad']]++;
            if ($linea['costo_estimado'] > 0) {
                $costo += $linea['costo_estimado'];
                $proveedores[$linea['proveedor']['id'] ?? 'sin'] = true;
            }
        }

        return [
            'por_prioridad' => $porPrioridad,
            'costo' => round($costo, 2),
            'proveedores' => count($proveedores),
            'decisiones' => $decisiones,
        ];
    }

    /**
     * @return array<string, object>
     */
    private function insumosActivos(string $localId): array
    {
        return DB::table('insumo')
            ->where('local_id', $localId)
            ->where('estado', '<>', 'inactivo')
            ->get(['id', 'unidad_medida', 'stock_actual', 'stock_minimo', 'costo_unitario', 'ultimo_proveedor_id'])
            ->keyBy('id')
            ->all();
    }

    /**
     * @param  list<string>  $productos
     * @return array<string, list<array{insumo_id: string, cantidad: float}>>
     */
    private function recetas(string $localId, array $productos): array
    {
        $recetas = [];
        $filas = DB::table('producto_insumo as pi')
            ->join('insumo as i', 'i.id', '=', 'pi.insumo_id')
            ->where('i.local_id', $localId)
            ->where('i.estado', '<>', 'inactivo')
            ->whereIn('pi.producto_id', $productos)
            ->get(['pi.producto_id', 'pi.insumo_id', 'pi.cantidad_descuenta']);

        foreach ($filas as $fila) {
            $recetas[$fila->producto_id][] = ['insumo_id' => $fila->insumo_id, 'cantidad' => (float) $fila->cantidad_descuenta];
        }

        return $recetas;
    }

    private function consulta(): Builder
    {
        return DB::table('recomendacion_reposicion as r')
            ->join('insumo as i', 'i.id', '=', 'r.insumo_id')
            ->leftJoin('proveedor as p', 'p.id', '=', 'r.proveedor_id');
    }

    /**
     * @return list<string>
     */
    private function columnas(): array
    {
        return [
            'r.id', 'r.ejecucion_id', 'r.insumo_id', 'i.nombre as insumo', 'i.unidad_medida', 'r.cobertura_dias',
            'r.consumo_previsto', 'r.margen_seguridad', 'r.stock_al_calcular', 'r.stock_minimo_al_calcular',
            'r.cantidad_sugerida', 'r.prioridad', 'r.motivo', 'r.alcanza_dias', 'r.estado', 'r.cantidad_final',
            'r.decidido_en', 'r.costo_unitario_al_calcular', 'r.proveedor_id', 'p.nombre as proveedor_nombre',
            'i.fecha_ultima_compra',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentar(object $fila): array
    {
        $cantidad = $fila->cantidad_final === null ? (float) $fila->cantidad_sugerida : (float) $fila->cantidad_final;

        return [
            'id' => $fila->id,
            'insumo_id' => $fila->insumo_id,
            'insumo' => $fila->insumo,
            'unidad_medida' => $fila->unidad_medida,
            'prioridad' => $fila->prioridad,
            'motivo' => $fila->motivo,
            'alcanza_dias' => $fila->alcanza_dias === null ? null : (int) $fila->alcanza_dias,
            'consumo_previsto' => (float) $fila->consumo_previsto,
            'margen_seguridad' => (float) $fila->margen_seguridad,
            'stock_al_calcular' => (float) $fila->stock_al_calcular,
            'stock_minimo' => (float) $fila->stock_minimo_al_calcular,
            'cantidad_sugerida' => (float) $fila->cantidad_sugerida,
            'estado' => $fila->estado,
            'cantidad_final' => $fila->cantidad_final === null ? null : (float) $fila->cantidad_final,
            'decidido_en' => $fila->decidido_en === null ? null : $this->instante($fila->decidido_en),
            'costo_estimado' => round($cantidad * (float) $fila->costo_unitario_al_calcular, 2),
            'proveedor' => $fila->proveedor_id === null ? null : [
                'id' => $fila->proveedor_id,
                'nombre' => $fila->proveedor_nombre,
                'precio' => (float) $fila->costo_unitario_al_calcular,
                'ultima_compra' => $fila->fecha_ultima_compra === null ? null : $this->instante($fila->fecha_ultima_compra),
            ],
        ];
    }

    private function instante(string $valor): string
    {
        return Carbon::parse($valor)->setTimezone(config('app.timezone'))->toIso8601String();
    }
}
