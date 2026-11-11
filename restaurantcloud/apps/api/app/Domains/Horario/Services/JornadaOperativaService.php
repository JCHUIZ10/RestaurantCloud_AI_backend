<?php

namespace App\Domains\Horario\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Resuelve la jornada operativa de un local para reservas (CU-MOZO-05).
 *
 * Combina el horario semanal (horario_atencion) con los feriados, cierres y horarios
 * especiales (horario_excepcion), agrupa los turnos en Almuerzo / Cena y soporta turnos
 * que cruzan la medianoche (la reserva de las 00:15 pertenece a la cena del día anterior).
 */
class JornadaOperativaService
{
    /** Minuto del día que separa Almuerzo de Cena cuando un turno no se nombra explícitamente. */
    private const CORTE_ALMUERZO_CENA_MIN = 17 * 60;

    private const PASO_FRANJA_MIN = 30;

    private const MINUTOS_DIA = 1440;

    /**
     * Jornada de una fecha: si el local atiende, la excepción que aplica y los turnos Almuerzo / Cena.
     *
     * @return array{
     *     fecha: string,
     *     atiende: bool,
     *     cerrado_por_excepcion: bool,
     *     motivo_excepcion: ?string,
     *     es_horario_especial: bool,
     *     excepcion_id: ?string,
     *     turnos: array{almuerzo: ?array<string, mixed>, cena: ?array<string, mixed>},
     *     rango_dia: array{desde: string, hasta: string}
     * }
     */
    public function resolver(string $localId, string $fecha, int $duracionReservaMin): array
    {
        $inicioDia = $this->inicioDelDia($fecha);
        $excepcion = DB::table('horario_excepcion')
            ->where('local_id', $localId)
            ->whereDate('fecha', $fecha)
            ->first();

        $base = [
            'fecha' => $inicioDia->toDateString(),
            'atiende' => false,
            'cerrado_por_excepcion' => false,
            'motivo_excepcion' => $excepcion?->motivo,
            'es_horario_especial' => false,
            'excepcion_id' => $excepcion?->id,
            'turnos' => ['almuerzo' => null, 'cena' => null],
            'rango_dia' => [
                'desde' => $inicioDia->toIso8601String(),
                'hasta' => $inicioDia->copy()->addDay()->toIso8601String(),
            ],
        ];

        if ($excepcion && $excepcion->cerrado) {
            return [...$base, 'cerrado_por_excepcion' => true];
        }

        $esHorarioEspecial = $excepcion && $excepcion->hora_inicio && $excepcion->hora_fin;
        $bloques = $esHorarioEspecial
            ? collect([(object) [
                'nombre_turno' => 'Horario especial',
                'hora_inicio' => $excepcion->hora_inicio,
                'hora_fin' => $excepcion->hora_fin,
            ]])
            : DB::table('horario_atencion')
                ->where('local_id', $localId)
                ->where('dia_semana', $inicioDia->dayOfWeekIso)
                ->where('atiende', true)
                ->orderBy('hora_inicio')
                ->get(['nombre_turno', 'hora_inicio', 'hora_fin']);

        $grupos = $this->agruparEnAlmuerzoYCena($bloques->all());
        $turnos = [
            'almuerzo' => $grupos['almuerzo'] ? $this->construirTurno($grupos['almuerzo'], $inicioDia, $duracionReservaMin) : null,
            'cena' => $grupos['cena'] ? $this->construirTurno($grupos['cena'], $inicioDia, $duracionReservaMin) : null,
        ];

        $finUltimoTurno = collect($turnos)->filter()->max('fin_min') ?? 0;

        return [
            ...$base,
            'atiende' => $turnos['almuerzo'] !== null || $turnos['cena'] !== null,
            'es_horario_especial' => (bool) $esHorarioEspecial,
            'turnos' => array_map(fn (?array $turno): ?array => $turno ? $this->sinCamposInternos($turno) : null, $turnos),
            'rango_dia' => [
                'desde' => $inicioDia->toIso8601String(),
                'hasta' => $inicioDia->copy()->addMinutes(max(self::MINUTOS_DIA, $finUltimoTurno))->toIso8601String(),
            ],
        ];
    }

    /**
     * Fecha de la jornada en curso y el turno a mostrar por defecto.
     * Pasada la medianoche, la jornada sigue siendo la de ayer mientras dure su turno nocturno.
     *
     * @return array{fecha: string, turno: string}
     */
    public function fechaOperativa(string $localId, Carbon $ahora, int $duracionReservaMin): array
    {
        $ahora = $ahora->copy()->setTimezone(config('app.timezone'));
        $ayer = $ahora->copy()->subDay()->toDateString();

        foreach ($this->resolver($localId, $ayer, $duracionReservaMin)['turnos'] as $clave => $turno) {
            if ($turno && $ahora->lt(Carbon::parse($turno['hasta']))) {
                return ['fecha' => $ayer, 'turno' => $clave];
            }
        }

        $hoy = $ahora->toDateString();
        $turnosHoy = array_filter($this->resolver($localId, $hoy, $duracionReservaMin)['turnos']);

        foreach ($turnosHoy as $clave => $turno) {
            if ($ahora->lt(Carbon::parse($turno['hasta']))) {
                return ['fecha' => $hoy, 'turno' => $clave];
            }
        }

        return ['fecha' => $hoy, 'turno' => array_key_last($turnosHoy) ?? 'almuerzo'];
    }

    /**
     * Valida que una reserva caiga dentro de un turno y termine antes de su cierre
     * (última hora de llegada = fin del turno − duración de la reserva).
     *
     * @return array{valido: bool, mensaje: ?string, fecha_jornada: string, excepcion_id: ?string}
     */
    public function validarInicioReserva(string $localId, Carbon $inicio, int $duracionReservaMin): array
    {
        return $this->validarConJornadas(
            $inicio,
            $duracionReservaMin,
            fn (string $fecha): array => $this->resolver($localId, $fecha, $duracionReservaMin),
        );
    }

    /**
     * Valida varias reservas a la vez calculando una sola vez la jornada de cada fecha.
     *
     * @param  iterable<string, Carbon>  $inicios  Llegada de cada reserva, indexada por su id
     * @return array<string, array{valido: bool, mensaje: ?string, fecha_jornada: string, excepcion_id: ?string}>
     */
    public function validarInicios(string $localId, iterable $inicios, int $duracionReservaMin): array
    {
        $jornadas = [];
        $jornadaDe = function (string $fecha) use ($localId, $duracionReservaMin, &$jornadas): array {
            return $jornadas[$fecha] ??= $this->resolver($localId, $fecha, $duracionReservaMin);
        };

        $resultados = [];
        foreach ($inicios as $id => $inicio) {
            $resultados[$id] = $this->validarConJornadas($inicio, $duracionReservaMin, $jornadaDe);
        }

        return $resultados;
    }

    /**
     * @param  \Closure(string): array<string, mixed>  $jornadaDe  Jornada de una fecha `YYYY-MM-DD`
     * @return array{valido: bool, mensaje: ?string, fecha_jornada: string, excepcion_id: ?string}
     */
    private function validarConJornadas(Carbon $inicio, int $duracionReservaMin, \Closure $jornadaDe): array
    {
        $inicio = $inicio->copy()->setTimezone(config('app.timezone'));
        $fechaInicio = $inicio->toDateString();
        $fechaAnterior = $inicio->copy()->subDay()->toDateString();

        // Primero la jornada anterior: sus turnos nocturnos pueden cruzar la medianoche.
        foreach ([$fechaAnterior, $fechaInicio] as $fecha) {
            $jornada = $jornadaDe($fecha);

            foreach (array_filter($jornada['turnos']) as $turno) {
                $desde = Carbon::parse($turno['desde']);
                $hasta = Carbon::parse($turno['hasta']);

                if ($inicio->lt($desde) || $inicio->gte($hasta)) {
                    continue;
                }

                if ($inicio->copy()->addMinutes($duracionReservaMin)->gt($hasta)) {
                    $ultimaLlegada = $hasta->copy()->subMinutes($duracionReservaMin);

                    return $this->resultadoValidacion(
                        "La última hora de llegada del turno {$turno['nombre']} es {$ultimaLlegada->format('H:i')} (cada reserva dura {$duracionReservaMin} min y el turno cierra a las {$turno['fin']}).",
                        $fecha,
                    );
                }

                return [
                    'valido' => true,
                    'mensaje' => null,
                    'fecha_jornada' => $fecha,
                    'excepcion_id' => $jornada['es_horario_especial'] ? $jornada['excepcion_id'] : null,
                ];
            }
        }

        $jornada = $jornadaDe($fechaInicio);
        $fechaTexto = $inicio->format('d/m/Y');

        if ($jornada['cerrado_por_excepcion']) {
            return $this->resultadoValidacion("El local estará cerrado el {$fechaTexto}: {$jornada['motivo_excepcion']}.", $fechaInicio);
        }

        if (! $jornada['atiende']) {
            return $this->resultadoValidacion("El local no atiende el {$fechaTexto}.", $fechaInicio);
        }

        $horario = collect($jornada['turnos'])
            ->filter()
            ->map(fn (array $turno): string => "{$turno['inicio']} - {$turno['fin']}")
            ->implode(' y ');

        return $this->resultadoValidacion(
            "La hora {$inicio->format('H:i')} está fuera del horario de atención del {$fechaTexto} ({$horario}).",
            $fechaInicio,
        );
    }

    /**
     * Fecha de la jornada a la que pertenece un instante (la de ayer si cae en su turno nocturno).
     */
    public function fechaJornadaDe(string $localId, Carbon $instante, int $duracionReservaMin): string
    {
        $instante = $instante->copy()->setTimezone(config('app.timezone'));
        $ayer = $instante->copy()->subDay()->toDateString();

        foreach (array_filter($this->resolver($localId, $ayer, $duracionReservaMin)['turnos']) as $turno) {
            if ($instante->lt(Carbon::parse($turno['hasta']))) {
                return $ayer;
            }
        }

        return $instante->toDateString();
    }

    /**
     * Reparte los bloques horarios en Almuerzo y Cena. Los nombres explícitos mandan;
     * un bloque sin nombre reconocible se divide en el corte de las 17:00.
     *
     * @param  array<int, object>  $bloques
     * @return array{almuerzo: ?array{nombre: string, inicio_min: int, fin_min: int}, cena: ?array{nombre: string, inicio_min: int, fin_min: int}}
     */
    private function agruparEnAlmuerzoYCena(array $bloques): array
    {
        $grupos = ['almuerzo' => null, 'cena' => null];

        foreach ($bloques as $bloque) {
            $nombre = trim((string) $bloque->nombre_turno);
            $inicio = $this->aMinutos($bloque->hora_inicio);
            $fin = $this->aMinutos($bloque->hora_fin);
            if ($fin <= $inicio) {
                $fin += self::MINUTOS_DIA;
            }

            $nombreNormalizado = mb_strtolower($nombre);
            if (str_contains($nombreNormalizado, 'almuerzo')) {
                $grupos['almuerzo'] = $this->unirTramo($grupos['almuerzo'], $nombre, $inicio, $fin);
            } elseif (str_contains($nombreNormalizado, 'cena') || str_contains($nombreNormalizado, 'noche')) {
                $grupos['cena'] = $this->unirTramo($grupos['cena'], $nombre, $inicio, $fin);
            } else {
                if ($inicio < self::CORTE_ALMUERZO_CENA_MIN) {
                    $grupos['almuerzo'] = $this->unirTramo($grupos['almuerzo'], 'Almuerzo', $inicio, min($fin, self::CORTE_ALMUERZO_CENA_MIN));
                }
                if ($fin > self::CORTE_ALMUERZO_CENA_MIN) {
                    $grupos['cena'] = $this->unirTramo($grupos['cena'], 'Cena', max($inicio, self::CORTE_ALMUERZO_CENA_MIN), $fin);
                }
            }
        }

        return $grupos;
    }

    /**
     * @param  ?array{nombre: string, inicio_min: int, fin_min: int}  $tramo
     * @return array{nombre: string, inicio_min: int, fin_min: int}
     */
    private function unirTramo(?array $tramo, string $nombre, int $inicio, int $fin): array
    {
        if ($tramo === null) {
            return ['nombre' => $nombre, 'inicio_min' => $inicio, 'fin_min' => $fin];
        }

        return [
            'nombre' => $tramo['nombre'],
            'inicio_min' => min($tramo['inicio_min'], $inicio),
            'fin_min' => max($tramo['fin_min'], $fin),
        ];
    }

    /**
     * @param  array{nombre: string, inicio_min: int, fin_min: int}  $tramo
     * @return array<string, mixed>
     */
    private function construirTurno(array $tramo, Carbon $inicioDia, int $duracionReservaMin): array
    {
        $franjas = [];
        $ultimaLlegada = $tramo['fin_min'] - $duracionReservaMin;
        for ($minuto = $tramo['inicio_min']; $minuto <= $ultimaLlegada; $minuto += self::PASO_FRANJA_MIN) {
            $instante = $inicioDia->copy()->addMinutes($minuto);
            $franjas[] = [
                'hora' => $instante->format('H:i'),
                'fecha_hora' => $instante->format('Y-m-d\TH:i:s'),
            ];
        }

        return [
            'nombre' => $tramo['nombre'],
            'inicio' => $this->aHora($tramo['inicio_min']),
            'fin' => $this->aHora($tramo['fin_min']),
            'cruza_medianoche' => $tramo['fin_min'] > self::MINUTOS_DIA,
            'desde' => $inicioDia->copy()->addMinutes($tramo['inicio_min'])->toIso8601String(),
            'hasta' => $inicioDia->copy()->addMinutes($tramo['fin_min'])->toIso8601String(),
            'franjas' => $franjas,
            'fin_min' => $tramo['fin_min'],
        ];
    }

    /**
     * @param  array<string, mixed>  $turno
     * @return array<string, mixed>
     */
    private function sinCamposInternos(array $turno): array
    {
        unset($turno['fin_min']);

        return $turno;
    }

    /**
     * @return array{valido: bool, mensaje: string, fecha_jornada: string, excepcion_id: null}
     */
    private function resultadoValidacion(string $mensaje, string $fecha): array
    {
        return ['valido' => false, 'mensaje' => $mensaje, 'fecha_jornada' => $fecha, 'excepcion_id' => null];
    }

    private function inicioDelDia(string $fecha): Carbon
    {
        return Carbon::parse($fecha, config('app.timezone'))->startOfDay();
    }

    private function aMinutos(string $hora): int
    {
        [$horas, $minutos] = array_map('intval', explode(':', $hora));

        return ($horas * 60) + $minutos;
    }

    private function aHora(int $minutos): string
    {
        $minutos %= self::MINUTOS_DIA;

        return sprintf('%02d:%02d', intdiv($minutos, 60), $minutos % 60);
    }
}
