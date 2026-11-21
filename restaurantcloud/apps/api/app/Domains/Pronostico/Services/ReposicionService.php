<?php

namespace App\Domains\Pronostico\Services;

use App\Domains\Pronostico\Exceptions\PronosticoException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Reposición sugerida de insumos a partir del pronóstico de platos.
 *
 * Por insumo y para los primeros `cobertura` días del pronóstico:
 *
 *     consumo_previsto  = Σ P50 del plato × cantidad por plato (receta)
 *     margen_seguridad  = Σ (P90 − P50) del plato × cantidad por plato
 *     cantidad_sugerida = máx(0, consumo_previsto + margen_seguridad − stock)
 *
 * El margen es lo que el modelo considera posible por encima de lo esperado: se pide para tener el
 * insumo aun en un día de más demanda. La recomendación es apoyo a la decisión; no genera compras.
 */
class ReposicionService
{
    /**
     * @param  array<int, array<string, mixed>>  $predicciones  `predicciones` de ms-pronóstico
     * @param  array<string, list<array{insumo_id: string, cantidad: float}>>  $recetas  por producto_id
     * @param  array<string, float>  $stock  stock actual por insumo_id
     * @return array<string, array{consumo_previsto: float, margen_seguridad: float, stock_al_calcular: float, cantidad_sugerida: float}>
     */
    public function calcular(array $predicciones, array $recetas, array $stock, int $cobertura): array
    {
        $consumo = [];
        $margen = [];

        foreach ($predicciones as $plato) {
            $receta = $recetas[$plato['producto_id']] ?? [];
            if ($receta === []) {
                continue;
            }

            $dias = array_slice($plato['dias'], 0, $cobertura);
            $p50 = array_sum(array_map(fn (array $dia): float => (float) $dia['p50'], $dias));
            $holgura = array_sum(array_map(
                fn (array $dia): float => max(0.0, (float) $dia['p90'] - (float) $dia['p50']),
                $dias,
            ));

            foreach ($receta as $linea) {
                $consumo[$linea['insumo_id']] = ($consumo[$linea['insumo_id']] ?? 0.0) + $p50 * $linea['cantidad'];
                $margen[$linea['insumo_id']] = ($margen[$linea['insumo_id']] ?? 0.0) + $holgura * $linea['cantidad'];
            }
        }

        $resultado = [];
        foreach ($consumo as $insumoId => $previsto) {
            if ($previsto + $margen[$insumoId] <= 0) {
                continue;
            }

            $actual = $stock[$insumoId] ?? 0.0;
            $resultado[$insumoId] = [
                'consumo_previsto' => round($previsto, 3),
                'margen_seguridad' => round($margen[$insumoId], 3),
                'stock_al_calcular' => round($actual, 3),
                'cantidad_sugerida' => round(max(0.0, $previsto + $margen[$insumoId] - $actual), 3),
            ];
        }

        return $resultado;
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
            [$recetas, $stock] = $this->recetasYStock($localId, array_column($pronostico['predicciones'], 'producto_id'));
            $calculo = $this->calcular($pronostico['predicciones'], $recetas, $stock, $cobertura);

            $ahora = now();
            $filas = [];
            foreach ($calculo as $insumoId => $fila) {
                $filas[] = [
                    'local_id' => $localId,
                    'ejecucion_id' => $ejecucionId,
                    'insumo_id' => $insumoId,
                    'cobertura_dias' => $cobertura,
                    ...$fila,
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
        return DB::table('recomendacion_reposicion as r')
            ->join('insumo as i', 'i.id', '=', 'r.insumo_id')
            ->where('r.ejecucion_id', $ejecucionId)
            ->where('r.local_id', $localId)
            ->orderByDesc('r.cantidad_sugerida')
            ->orderBy('i.nombre')
            ->get($this->columnas())
            ->map(fn (object $fila): array => $this->presentar($fila))
            ->all();
    }

    /**
     * Última ejecución con recomendaciones del local.
     *
     * @return array{ejecucion_id: string, cobertura_dias: int, creada_en: string}|null
     */
    public function ultimaEjecucion(string $localId): ?array
    {
        $fila = DB::table('recomendacion_reposicion')
            ->where('local_id', $localId)
            ->orderByDesc('created_at')
            ->first(['ejecucion_id', 'cobertura_dias', 'created_at']);

        return $fila === null ? null : [
            'ejecucion_id' => $fila->ejecucion_id,
            'cobertura_dias' => (int) $fila->cobertura_dias,
            'creada_en' => $this->instante($fila->created_at),
        ];
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

        return $this->presentar(
            DB::table('recomendacion_reposicion as r')
                ->join('insumo as i', 'i.id', '=', 'r.insumo_id')
                ->where('r.id', $id)
                ->first($this->columnas()),
        );
    }

    /**
     * Recetas de los platos pedidos y stock de los insumos que usan (solo insumos no inactivos).
     *
     * @param  list<string>  $productos
     * @return array{0: array<string, list<array{insumo_id: string, cantidad: float}>>, 1: array<string, float>}
     */
    private function recetasYStock(string $localId, array $productos): array
    {
        $filas = DB::table('producto_insumo as pi')
            ->join('insumo as i', 'i.id', '=', 'pi.insumo_id')
            ->where('i.local_id', $localId)
            ->where('i.estado', '<>', 'inactivo')
            ->whereIn('pi.producto_id', $productos)
            ->get(['pi.producto_id', 'pi.insumo_id', 'pi.cantidad_descuenta', 'i.stock_actual']);

        $recetas = [];
        $stock = [];
        foreach ($filas as $fila) {
            $recetas[$fila->producto_id][] = ['insumo_id' => $fila->insumo_id, 'cantidad' => (float) $fila->cantidad_descuenta];
            $stock[$fila->insumo_id] = (float) $fila->stock_actual;
        }

        return [$recetas, $stock];
    }

    /**
     * @return list<string>
     */
    private function columnas(): array
    {
        return [
            'r.id', 'r.ejecucion_id', 'r.insumo_id', 'i.nombre as insumo', 'i.unidad_medida', 'r.cobertura_dias',
            'r.consumo_previsto', 'r.margen_seguridad', 'r.stock_al_calcular', 'r.cantidad_sugerida',
            'r.estado', 'r.cantidad_final', 'r.decidido_en',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentar(object $fila): array
    {
        return [
            'id' => $fila->id,
            'insumo_id' => $fila->insumo_id,
            'insumo' => $fila->insumo,
            'unidad_medida' => $fila->unidad_medida,
            'consumo_previsto' => (float) $fila->consumo_previsto,
            'margen_seguridad' => (float) $fila->margen_seguridad,
            'stock_al_calcular' => (float) $fila->stock_al_calcular,
            'cantidad_sugerida' => (float) $fila->cantidad_sugerida,
            'estado' => $fila->estado,
            'cantidad_final' => $fila->cantidad_final === null ? null : (float) $fila->cantidad_final,
            'decidido_en' => $fila->decidido_en === null ? null : $this->instante($fila->decidido_en),
        ];
    }

    private function instante(string $valor): string
    {
        return Carbon::parse($valor)->setTimezone(config('app.timezone'))->toIso8601String();
    }
}
