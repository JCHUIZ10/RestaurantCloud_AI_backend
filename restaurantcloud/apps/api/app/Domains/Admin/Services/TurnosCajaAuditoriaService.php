<?php

namespace App\Domains\Admin\Services;

use App\Domains\Admin\Exceptions\FinanzasException;
use App\Domains\Caja\Services\BalanceTurnoService;
use App\Domains\Caja\Services\HistorialComprobantesService;
use App\Domains\Horario\Services\JornadaOperativaService;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Auditoría de turnos de caja para la administración (CU-ADMIN-14): historial de turnos con sus
 * indicadores de control interno, visado gerencial del Reporte Z y consulta del Z archivado.
 */
class TurnosCajaAuditoriaService
{
    /** Diferencia máxima (S/) para considerar cuadrada una gaveta. */
    private const TOLERANCIA = 0.001;

    public function __construct(
        private HistorialComprobantesService $historial,
        private JornadaOperativaService $jornadas,
    ) {}

    /**
     * Turnos abiertos en el rango, indicadores de auditoría y el turno activo de la sede.
     * El turno activo se busca sin importar el periodo: una terminal bloqueada debe poder rescatarse siempre.
     *
     * @param  array{inicio: Carbon, fin: Carbon}  $rango
     * @return array{kpis: array<string, mixed>, turnos: list<array<string, mixed>>}
     */
    public function listado(string $localId, array $rango): array
    {
        $filas = $this->consultaBase()
            ->where('c.local_id', $localId)
            ->where('c.fecha_apertura', '>=', $rango['inicio'])
            ->where('c.fecha_apertura', '<', $rango['fin'])
            ->orderByDesc('c.fecha_apertura')
            ->get();

        $filaActiva = $this->consultaBase()
            ->where('c.local_id', $localId)
            ->where('c.estado', 'abierta')
            ->first();

        $ids = $filas->pluck('id')->when($filaActiva, fn ($coleccion) => $coleccion->push($filaActiva->id))->unique()->values()->all();
        $facturado = $this->facturadoPorTurno($ids);
        $conReporteZ = $this->idsConReporteZ($ids);

        $turnos = $filas->map(fn ($fila): array => $this->mapear($fila, $facturado, $conReporteZ))->values()->all();

        // El turno activo suele estar ya en la lista: se reutiliza su DTO en vez de recalcular su efectivo esperado
        $turnoActivo = null;
        if ($filaActiva) {
            $turnoActivo = collect($turnos)->firstWhere('id', (string) $filaActiva->id)
                ?? $this->mapear($filaActiva, $facturado, $conReporteZ);
        }

        return [
            'kpis' => $this->indicadores($turnos, $turnoActivo) + $this->pendientesGlobales($localId),
            'turnos' => $turnos,
        ];
    }

    /**
     * Un turno de la sede en el formato de la API.
     *
     * @return array<string, mixed>|null null si no existe o es de otra sede
     */
    public function turno(string $localId, string $cajaId): ?array
    {
        $fila = $this->consultaBase()
            ->where('c.local_id', $localId)
            ->where('c.id', $cajaId)
            ->first();

        if (! $fila) {
            return null;
        }

        return $this->mapear($fila, $this->facturadoPorTurno([$cajaId]), $this->idsConReporteZ([$cajaId]));
    }

    /**
     * Visado gerencial de un turno ya cerrado. "Observado" (`$conforme` falso) también cierra la revisión,
     * pero deja constancia de que la administración no dio su conformidad.
     *
     * @return array<string, mixed> el turno visado
     *
     * @throws FinanzasException
     */
    public function visar(string $localId, string $cajaId, string $usuarioId, bool $conforme, ?string $notas): array
    {
        DB::transaction(function () use ($localId, $cajaId, $usuarioId, $conforme, $notas): void {
            $caja = DB::table('caja')
                ->where('id', $cajaId)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                throw new FinanzasException('ERR_TURNO_NO_ENCONTRADO', 'El turno de caja no existe o pertenece a otra sede.', 404);
            }

            if ($caja->estado !== 'cerrada') {
                throw new FinanzasException('ERR_TURNO_ABIERTO', 'Solo se puede visar un turno cerrado. Cierra el turno antes de auditarlo.', 409);
            }

            if ($caja->revisado) {
                throw new FinanzasException('ERR_TURNO_YA_VISADO', 'Este turno ya fue visado por la administración.', 409);
            }

            $notas = $notas !== null ? trim($notas) : null;

            // Sin Reporte Z archivado no hay documento que respalde el cierre: la nota es la única constancia
            $sinReporteZ = ! DB::table('auditoria_caja_cierre')->where('local_id', $localId)->where('caja_id', $cajaId)->exists();
            if ($sinReporteZ && mb_strlen($notas ?? '') < 10) {
                throw new FinanzasException('ERR_VISADO_SIN_Z_REQUIERE_NOTAS', 'Este turno no tiene Reporte Z archivado: explica en las notas (mínimo 10 caracteres) en qué se basa tu revisión.', 422);
            }
            $ahora = now();

            DB::table('caja')->where('id', $cajaId)->update([
                'revisado' => true,
                'revisado_por' => $usuarioId,
                'revisado_at' => $ahora,
                'notas_auditoria' => $notas !== null && $notas !== '' ? $notas : 'Turno auditado conforme.',
                'visado_resultado' => $conforme ? 'conforme' : 'observado',
                'updated_at' => $ahora,
            ]);

            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => DB::table('local')->where('id', $localId)->value('empresa_id'),
                'local_id' => $localId,
                'usuario_id' => $usuarioId,
                'accion' => 'turno.visado',
                'entidad_tipo' => 'caja',
                'entidad_id' => $cajaId,
                'detalle' => json_encode([
                    'conforme' => $conforme,
                    'discrepancia' => $caja->discrepancia !== null ? (float) $caja->discrepancia : null,
                    'notas_auditoria' => $notas,
                    'sin_reporte_z' => $sinReporteZ,
                ]),
                'fecha' => $ahora,
            ]);
        });

        return $this->turno($localId, $cajaId);
    }

    /**
     * Cierra el seguimiento de un turno observado: la administración deja constancia de cómo se resolvió.
     *
     * @return array<string, mixed> el turno con la observación resuelta
     *
     * @throws FinanzasException
     */
    public function levantarObservacion(string $localId, string $cajaId, string $usuarioId, string $notas): array
    {
        DB::transaction(function () use ($localId, $cajaId, $usuarioId, $notas): void {
            $caja = DB::table('caja')
                ->where('id', $cajaId)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                throw new FinanzasException('ERR_TURNO_NO_ENCONTRADO', 'El turno de caja no existe o pertenece a otra sede.', 404);
            }

            if (! $caja->revisado || $caja->visado_resultado !== 'observado') {
                throw new FinanzasException('ERR_TURNO_NO_OBSERVADO', 'Solo se puede levantar la observación de un turno que fue observado.', 409);
            }

            if ($caja->observacion_resuelta_at !== null) {
                throw new FinanzasException('ERR_OBSERVACION_YA_RESUELTA', 'La observación de este turno ya fue resuelta.', 409);
            }

            $ahora = now();
            $notas = trim($notas);

            DB::table('caja')->where('id', $cajaId)->update([
                'observacion_resuelta_por' => $usuarioId,
                'observacion_resuelta_at' => $ahora,
                'observacion_resolucion' => $notas,
                'updated_at' => $ahora,
            ]);

            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => DB::table('local')->where('id', $localId)->value('empresa_id'),
                'local_id' => $localId,
                'usuario_id' => $usuarioId,
                'accion' => 'turno.observacion_levantada',
                'entidad_tipo' => 'caja',
                'entidad_id' => $cajaId,
                'detalle' => json_encode(['observacion' => $caja->notas_auditoria, 'resolucion' => $notas]),
                'fecha' => $ahora,
            ]);
        });

        return $this->turno($localId, $cajaId);
    }

    /**
     * Reporte Z archivado de un turno de la sede. Null si el turno no tiene Z (sigue abierto o es anterior al archivo).
     *
     * @return array<string, mixed>|null
     */
    public function reporteZ(string $localId, string $cajaId): ?array
    {
        $json = DB::table('auditoria_caja_cierre')
            ->where('local_id', $localId)
            ->where('caja_id', $cajaId)
            ->orderByDesc('created_at')
            ->value('reporte_z_json');

        if ($json === null) {
            return null;
        }

        return is_string($json) ? json_decode($json, true) : (array) $json;
    }

    private function consultaBase(): Builder
    {
        return DB::table('caja as c')
            ->join('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->leftJoin('usuario as r', 'r.id', '=', 'c.revisado_por')
            ->leftJoin('usuario as rs', 'rs.id', '=', 'c.observacion_resuelta_por')
            ->select([
                'c.id', 'c.local_id', 'c.correlativo', 'c.cajero_id', 'c.fecha_apertura', 'c.fecha_cierre',
                'c.monto_apertura', 'c.monto_esperado', 'c.monto_real', 'c.discrepancia',
                'c.comentario_discrepancia', 'c.notas_cierre', 'c.estado', 'c.revisado', 'c.revisado_por',
                'c.revisado_at', 'c.notas_auditoria',
                'c.visado_resultado', 'c.observacion_resuelta_por', 'c.observacion_resuelta_at', 'c.observacion_resolucion',
                'u.nombre as cajero_nombre', 'u.rol as cajero_rol_codigo', 'r.nombre as revisado_por_nombre', 'rs.nombre as resuelta_por_nombre',
            ]);
    }

    /**
     * Comprobantes vigentes y monto facturado neto por turno.
     *
     * @param  list<string>  $ids
     * @return array<string, array{cantidad: int, total: float}>
     */
    private function facturadoPorTurno(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return DB::table('comprobante')
            ->whereIn('caja_id', $ids)
            ->where('estado', 'emitido')
            ->where('tipo', '!=', 'nota_credito')
            ->groupBy('caja_id')
            ->selectRaw('caja_id, COUNT(*) as cantidad, SUM(total) as total')
            ->get()
            ->mapWithKeys(fn ($fila): array => [(string) $fila->caja_id => [
                'cantidad' => (int) $fila->cantidad,
                'total' => round((float) $fila->total, 2),
            ]])
            ->all();
    }

    /**
     * Turnos (de los ids dados) que tienen Reporte Z archivado.
     *
     * @param  list<string>  $ids
     * @return array<string, true>
     */
    private function idsConReporteZ(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return DB::table('auditoria_caja_cierre')
            ->whereIn('caja_id', $ids)
            ->pluck('caja_id')
            ->mapWithKeys(fn ($id): array => [(string) $id => true])
            ->all();
    }

    /**
     * @param  array<string, array{cantidad: int, total: float}>  $facturado
     * @param  array<string, true>  $conReporteZ  ids de turnos con Reporte Z archivado
     * @return array<string, mixed>
     */
    private function mapear(object $fila, array $facturado, array $conReporteZ = []): array
    {
        $abierta = $fila->estado === 'abierta';
        $apertura = Carbon::parse($fila->fecha_apertura);
        $cierre = $fila->fecha_cierre ? Carbon::parse($fila->fecha_cierre) : null;
        $minutos = (int) $apertura->diffInMinutes($cierre ?? now());

        // Un turno abierto no tiene esperado guardado: se calcula con los movimientos de hoy
        $esperado = $abierta
            ? (float) $this->historial->resumenTurno($fila)['efectivo']['esperado']
            : (float) $fila->monto_esperado;

        $revisado = (bool) $fila->revisado;
        $observado = $revisado && $fila->visado_resultado === 'observado';

        return [
            'id' => (string) $fila->id,
            'correlativo' => (int) $fila->correlativo,
            'cajero_id' => (string) $fila->cajero_id,
            'cajero_nombre' => $fila->cajero_nombre,
            'cajero_rol' => BalanceTurnoService::etiquetaRol($fila->cajero_rol_codigo),
            'fecha_apertura' => $apertura->toIso8601String(),
            'fecha_cierre' => $cierre?->toIso8601String(),
            'duracion_horas' => sprintf('%dh %02dm', intdiv($minutos, 60), $minutos % 60),
            'horas_abierto' => $abierta ? round($minutos / 60, 1) : null,
            // Aviso (no cierre): el turno sigue abierto pasada la jornada de la sede más la tolerancia
            'abandonado' => $abierta && $this->turnoSinCerrar($fila->local_id, $apertura),
            'monto_apertura' => (float) $fila->monto_apertura,
            'monto_esperado' => round($esperado, 2),
            'monto_real' => $fila->monto_real !== null ? (float) $fila->monto_real : null,
            'discrepancia' => $fila->discrepancia !== null ? (float) $fila->discrepancia : null,
            'comentario_discrepancia' => $fila->comentario_discrepancia,
            'notas_cierre' => $fila->notas_cierre,
            'estado' => $fila->estado,
            'revisado' => $revisado,
            'tiene_reporte_z' => isset($conReporteZ[(string) $fila->id]),
            'visado_conforme' => $revisado ? $fila->visado_resultado !== 'observado' : null,
            'visado_resultado' => $revisado ? ($fila->visado_resultado ?? 'conforme') : null,
            'observacion_resuelta' => $observado && $fila->observacion_resuelta_at !== null,
            'observacion_resuelta_por_nombre' => $fila->resuelta_por_nombre,
            'observacion_resuelta_at' => $fila->observacion_resuelta_at ? Carbon::parse($fila->observacion_resuelta_at)->toIso8601String() : null,
            'observacion_resolucion' => $fila->observacion_resolucion,
            'revisado_por' => $fila->revisado_por ? (string) $fila->revisado_por : null,
            'revisado_por_nombre' => $fila->revisado_por_nombre,
            'revisado_at' => $fila->revisado_at ? Carbon::parse($fila->revisado_at)->toIso8601String() : null,
            'notas_auditoria' => $fila->notas_auditoria,
            'total_comprobantes' => $facturado[(string) $fila->id]['cantidad'] ?? 0,
            'total_facturado' => $facturado[(string) $fila->id]['total'] ?? 0.0,
        ];
    }

    /**
     * Un turno abierto queda "sin cerrar" cuando termina la jornada operativa en que se abrió (según el horario
     * de atención y sus excepciones, que pueden pasar de la medianoche) y vence la tolerancia configurada.
     * Solo informa: el turno sigue abierto hasta que el cajero lo cierre o la administración fuerce el cierre.
     */
    private function turnoSinCerrar(string $localId, Carbon $apertura): bool
    {
        $apertura = $apertura->copy()->setTimezone(config('app.timezone'));
        $duracionReservaMin = 90;

        // Una apertura pasada la medianoche pertenece a la jornada de ayer si esa jornada llega hasta entonces
        $jornadaAyer = $this->jornadas->resolver($localId, $apertura->copy()->subDay()->toDateString(), $duracionReservaMin);
        $finAyer = Carbon::parse($jornadaAyer['rango_dia']['hasta']);
        $finJornada = $apertura->lt($finAyer)
            ? $finAyer
            : Carbon::parse($this->jornadas->resolver($localId, $apertura->toDateString(), $duracionReservaMin)['rango_dia']['hasta']);

        return now()->gt($finJornada->copy()->addMinutes((int) config('caja.tolerancia_turno_sin_cerrar_min', 60)));
    }

    /**
     * Turnos cerrados sin visar de toda la sede, sin importar el periodo en pantalla: un turno de ayer sin visar
     * no debe desaparecer al mirar "Hoy".
     *
     * @return array{pendientes_auditoria_total: int, pendiente_mas_antiguo: ?string, observados_pendientes_total: int, observado_mas_antiguo: ?string}
     */
    private function pendientesGlobales(string $localId): array
    {
        $fila = DB::table('caja')
            ->where('local_id', $localId)
            ->where('estado', 'cerrada')
            ->where('revisado', false)
            ->selectRaw('count(*) as total, min(fecha_apertura) as mas_antiguo')
            ->first();

        // Observados cuya observación sigue sin resolverse, también de toda la sede
        $observados = DB::table('caja')
            ->where('local_id', $localId)
            ->where('estado', 'cerrada')
            ->where('visado_resultado', 'observado')
            ->whereNull('observacion_resuelta_at')
            ->selectRaw('count(*) as total, min(fecha_apertura) as mas_antiguo')
            ->first();

        return [
            'pendientes_auditoria_total' => (int) ($fila->total ?? 0),
            'pendiente_mas_antiguo' => $fila?->mas_antiguo ? Carbon::parse($fila->mas_antiguo)->toIso8601String() : null,
            'observados_pendientes_total' => (int) ($observados->total ?? 0),
            'observado_mas_antiguo' => $observados?->mas_antiguo ? Carbon::parse($observados->mas_antiguo)->toIso8601String() : null,
        ];
    }

    /**
     * Indicadores de control interno sobre los turnos del periodo. Faltantes y sobrantes se informan
     * por separado: sumados se compensarían y ocultarían descuadres reales.
     *
     * @param  list<array<string, mixed>>  $turnos
     * @param  array<string, mixed>|null  $turnoActivo
     * @return array<string, mixed>
     */
    private function indicadores(array $turnos, ?array $turnoActivo): array
    {
        $cerrados = array_values(array_filter($turnos, fn (array $t): bool => $t['estado'] === 'cerrada'));
        $conDiscrepancia = array_filter($cerrados, fn (array $t): bool => abs((float) $t['discrepancia']) >= self::TOLERANCIA);
        $cuadrados = count($cerrados) - count($conDiscrepancia);

        $faltantes = 0.0;
        $sobrantes = 0.0;
        foreach ($conDiscrepancia as $turno) {
            if ($turno['discrepancia'] < 0) {
                $faltantes += abs($turno['discrepancia']);
            } else {
                $sobrantes += $turno['discrepancia'];
            }
        }

        return [
            'total_turnos' => count($turnos),
            'turnos_cuadrados' => $cuadrados,
            // Solo los turnos cerrados se pueden cuadrar: el turno en curso no cuenta en contra
            'porcentaje_cuadratura' => $cerrados !== [] ? round(($cuadrados / count($cerrados)) * 100, 1) : 0.0,
            'turnos_con_discrepancia' => count($conDiscrepancia),
            'monto_total_discrepancias' => round($sobrantes - $faltantes, 2),
            'monto_faltantes' => round($faltantes, 2),
            'monto_sobrantes' => round($sobrantes, 2),
            // Un turno observado cuenta como auditado solo cuando su observación se resolvió
            'turnos_auditados' => count(array_filter($turnos, fn (array $t): bool => $t['revisado'] && ($t['visado_resultado'] !== 'observado' || $t['observacion_resuelta']))),
            'turnos_observados_pendientes' => count(array_filter($turnos, fn (array $t): bool => $t['visado_resultado'] === 'observado' && ! $t['observacion_resuelta'])),
            'turnos_pendientes_auditoria' => count(array_filter($cerrados, fn (array $t): bool => ! $t['revisado'])),
            'turno_activo' => $turnoActivo,
        ];
    }
}
