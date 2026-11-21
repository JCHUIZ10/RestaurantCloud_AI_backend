<?php

namespace App\Domains\Pronostico\Services;

use App\Domains\Pronostico\Exceptions\PronosticoException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Predicción de todas las sedes de una empresa, para el propietario (CU-PROP-08).
 *
 * Solo consulta lo ya calculado: el último pronóstico de cada sede y la reposición que resultó. Si
 * ms-pronóstico no responde, la sede se informa sin pronóstico y el resto sigue (la reposición es del núcleo).
 */
class PronosticoPropietarioService
{
    public function __construct(
        private PronosticoCliente $cliente,
        private PronosticoService $pronosticos,
        private ReposicionService $reposicion,
    ) {}

    /**
     * @return array{sedes: list<array<string, mixed>>, panorama: array{total_semana: float, dias: list<array<string, mixed>>}}
     */
    public function resumen(string $empresaId): array
    {
        $locales = DB::table('local')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $sedes = [];
        foreach ($locales as $local) {
            $sedes[] = $this->sede($empresaId, $local);
        }

        return ['sedes' => $sedes, 'panorama' => $this->panorama($sedes)];
    }

    /**
     * @return array<string, mixed>
     */
    private function sede(string $empresaId, object $local): array
    {
        $base = ['local_id' => $local->id, 'nombre' => $local->nombre];

        $solicitud = $this->pronosticos->ultimaSolicitud($local->id);
        if ($solicitud === null) {
            return $base + [
                'estado' => 'sin_pronostico', 'nivel' => null, 'dias_con_ventas' => null, 'creada_en' => null,
                'cobertura_dias' => null, 'advertencias' => [], 'pronostico' => null, 'reposicion' => null,
            ];
        }

        $pronostico = null;
        try {
            $datos = $this->cliente->obtener($solicitud->ejecucion_id, $empresaId, $local->id);
            $pronostico = $datos === null ? null : $this->compactar($datos);
        } catch (PronosticoException) {
            // El servicio no responde: la sede se muestra con lo que el núcleo sabe.
        }

        return $base + [
            'estado' => $pronostico === null ? 'no_disponible' : 'ok',
            'nivel' => (int) $solicitud->nivel,
            'dias_con_ventas' => $solicitud->dias_con_ventas === null ? null : (int) $solicitud->dias_con_ventas,
            'creada_en' => Carbon::parse($solicitud->created_at)->setTimezone(config('app.timezone'))->toIso8601String(),
            'cobertura_dias' => (int) $solicitud->cobertura_dias,
            'pronostico' => $pronostico,
            'reposicion' => $this->reposicion->totales($this->reposicion->deEjecucion($solicitud->ejecucion_id, $local->id)),
        ];
    }

    /**
     * Del pronóstico completo, solo lo que compara sedes: total por día y por plato.
     *
     * @param  array<string, mixed>  $datos
     * @return array<string, mixed>
     */
    private function compactar(array $datos): array
    {
        $dias = [];
        $platos = [];
        foreach ($datos['predicciones'] as $plato) {
            foreach ($plato['dias'] as $dia) {
                $dias[$dia['fecha']]['fecha'] = $dia['fecha'];
                $dias[$dia['fecha']]['total_p50'] = ($dias[$dia['fecha']]['total_p50'] ?? 0.0) + (float) $dia['p50'];
                $dias[$dia['fecha']]['total_p90'] = ($dias[$dia['fecha']]['total_p90'] ?? 0.0) + (float) $dia['p90'];
                $platos[$plato['nombre']] = ($platos[$plato['nombre']] ?? 0.0) + (float) $dia['p50'];
            }
        }
        ksort($dias);
        arsort($platos);

        $dias = array_values(array_map(fn (array $d): array => [
            'fecha' => $d['fecha'], 'total_p50' => round($d['total_p50'], 1), 'total_p90' => round($d['total_p90'], 1),
        ], $dias));

        return [
            'fecha_inicio' => $datos['fecha_inicio'],
            // La suma de los días ya redondeados, para que la cifra de la semana coincida con lo que se ve por día.
            'total_semana' => round(array_sum(array_column($dias, 'total_p50')), 1),
            'dias' => $dias,
            'platos' => array_map(
                fn (string $nombre, float $total): array => ['nombre' => $nombre, 'total_p50' => round($total, 1)],
                array_keys($platos),
                array_values($platos),
            ),
            'advertencias' => $datos['advertencias'] ?? [],
        ];
    }

    /**
     * Suma por día de las sedes que tienen pronóstico.
     *
     * @param  list<array<string, mixed>>  $sedes
     * @return array{total_semana: float, dias: list<array<string, mixed>>}
     */
    private function panorama(array $sedes): array
    {
        $dias = [];
        foreach ($sedes as $sede) {
            foreach ($sede['pronostico']['dias'] ?? [] as $dia) {
                $dias[$dia['fecha']]['fecha'] = $dia['fecha'];
                $dias[$dia['fecha']]['total_p50'] = ($dias[$dia['fecha']]['total_p50'] ?? 0.0) + $dia['total_p50'];
                $dias[$dia['fecha']]['por_sede'][$sede['local_id']] = $dia['total_p50'];
            }
        }
        ksort($dias);
        $dias = array_values($dias);

        return ['total_semana' => round(array_sum(array_column($dias, 'total_p50')), 1), 'dias' => $dias];
    }
}
