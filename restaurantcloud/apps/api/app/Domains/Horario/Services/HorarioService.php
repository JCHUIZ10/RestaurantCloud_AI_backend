<?php

namespace App\Domains\Horario\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HorarioService
{
    private const FERIADOS_PERU_2026 = [
        ['fecha' => '2026-01-01', 'motivo' => 'Anio Nuevo'],
        ['fecha' => '2026-04-02', 'motivo' => 'Jueves Santo'],
        ['fecha' => '2026-04-03', 'motivo' => 'Viernes Santo'],
        ['fecha' => '2026-05-01', 'motivo' => 'Dia del Trabajo'],
        ['fecha' => '2026-06-07', 'motivo' => 'Batalla de Arica y Dia de la Bandera'],
        ['fecha' => '2026-06-29', 'motivo' => 'San Pedro y San Pablo'],
        ['fecha' => '2026-07-23', 'motivo' => 'Dia de la Fuerza Aerea del Peru'],
        ['fecha' => '2026-07-28', 'motivo' => 'Fiestas Patrias'],
        ['fecha' => '2026-07-29', 'motivo' => 'Fiestas Patrias'],
        ['fecha' => '2026-08-06', 'motivo' => 'Batalla de Junin'],
        ['fecha' => '2026-08-30', 'motivo' => 'Santa Rosa de Lima'],
        ['fecha' => '2026-10-08', 'motivo' => 'Combate de Angamos'],
        ['fecha' => '2026-11-01', 'motivo' => 'Dia de Todos los Santos'],
        ['fecha' => '2026-12-08', 'motivo' => 'Inmaculada Concepcion'],
        ['fecha' => '2026-12-09', 'motivo' => 'Batalla de Ayacucho'],
        ['fecha' => '2026-12-25', 'motivo' => 'Navidad'],
    ];

    private const DIAS = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miercoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sabado',
        7 => 'Domingo',
    ];

    private const PLANTILLAS = [
        'restaurante_estandar' => [
            1 => [
                ['nombre_turno' => 'Almuerzo', 'hora_inicio' => '12:00', 'hora_fin' => '16:00'],
                ['nombre_turno' => 'Cena', 'hora_inicio' => '19:00', 'hora_fin' => '23:30'],
            ],
            2 => [
                ['nombre_turno' => 'Almuerzo', 'hora_inicio' => '12:00', 'hora_fin' => '16:00'],
                ['nombre_turno' => 'Cena', 'hora_inicio' => '19:00', 'hora_fin' => '23:30'],
            ],
            3 => [
                ['nombre_turno' => 'Almuerzo', 'hora_inicio' => '12:00', 'hora_fin' => '16:00'],
                ['nombre_turno' => 'Cena', 'hora_inicio' => '19:00', 'hora_fin' => '23:30'],
            ],
            4 => [
                ['nombre_turno' => 'Almuerzo', 'hora_inicio' => '12:00', 'hora_fin' => '16:00'],
                ['nombre_turno' => 'Cena', 'hora_inicio' => '19:00', 'hora_fin' => '23:30'],
            ],
            5 => [
                ['nombre_turno' => 'Almuerzo', 'hora_inicio' => '12:00', 'hora_fin' => '16:00'],
                ['nombre_turno' => 'Cena', 'hora_inicio' => '19:00', 'hora_fin' => '00:30'],
            ],
            6 => [
                ['nombre_turno' => 'Horario Continuo', 'hora_inicio' => '12:00', 'hora_fin' => '00:30'],
            ],
            7 => [
                ['nombre_turno' => 'Almuerzo Familiar', 'hora_inicio' => '12:00', 'hora_fin' => '18:00'],
            ],
        ],
        'solo_almuerzo' => [],
        'corrido_continuo' => [],
    ];

    public function semana(string $localId): array
    {
        $turnosPorDia = DB::table('horario_atencion')
            ->where('local_id', $localId)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->groupBy('dia_semana');

        $dias = collect(self::DIAS)->map(function (string $nombreDia, int $diaSemana) use ($turnosPorDia): array {
            $turnos = collect($turnosPorDia->get($diaSemana, []))
                ->filter(fn ($turno) => $turno->atiende)
                ->map(fn ($turno): array => [
                    'id' => $turno->id,
                    'nombre_turno' => $turno->nombre_turno,
                    'hora_inicio' => $this->hora($turno->hora_inicio),
                    'hora_fin' => $this->hora($turno->hora_fin),
                ])
                ->values()
                ->all();

            return [
                'dia_semana' => $diaSemana,
                'nombre_dia' => $nombreDia,
                'atiende' => count($turnos) > 0,
                'turnos' => $turnos,
            ];
        })->values()->all();

        return [
            'local_id' => $localId,
            'dias' => $dias,
            'total_horas_semanales' => $this->totalHoras($dias),
        ];
    }

    public function guardarSemana(string $localId, array $dias): array
    {
        $normalizados = $this->normalizarDias($dias);

        DB::transaction(function () use ($localId, $normalizados): void {
            DB::table('horario_atencion')->where('local_id', $localId)->delete();

            foreach ($normalizados as $dia) {
                if (! $dia['atiende']) {
                    continue;
                }

                foreach ($dia['turnos'] as $turno) {
                    DB::table('horario_atencion')->insert([
                        'id' => (string) Str::uuid(),
                        'local_id' => $localId,
                        'dia_semana' => $dia['dia_semana'],
                        'nombre_turno' => $turno['nombre_turno'],
                        'atiende' => true,
                        'hora_inicio' => $turno['hora_inicio'],
                        'hora_fin' => $turno['hora_fin'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        return $this->semana($localId);
    }

    public function aplicarPlantilla(string $localId, string $plantilla): array
    {
        $dias = collect(self::DIAS)->map(function (string $nombreDia, int $diaSemana) use ($plantilla): array {
            return [
                'dia_semana' => $diaSemana,
                'nombre_dia' => $nombreDia,
                'atiende' => true,
                'turnos' => $this->turnosPlantilla($plantilla, $diaSemana),
            ];
        })->values()->all();

        return $this->guardarSemana($localId, $dias);
    }

    public function excepciones(string $localId): array
    {
        return DB::table('horario_excepcion as e')
            ->leftJoin('usuario as u', 'u.id', '=', 'e.created_by')
            ->where('e.local_id', $localId)
            ->orderBy('e.fecha')
            ->select('e.*', 'u.nombre as creado_por_nombre')
            ->get()
            ->map(fn ($excepcion): array => $this->mapearExcepcion($excepcion))
            ->all();
    }

    public function crearExcepcion(string $localId, string $usuarioId, array $data): array
    {
        $this->validarExcepcion($data);

        $reservasPendientes = DB::table('reserva')
            ->where('local_id', $localId)
            ->whereDate('fecha_hora', $data['fecha'])
            ->whereIn('estado', ['confirmada', 'bloqueada'])
            ->exists();

        if ($reservasPendientes) {
            throw new \LogicException(
                'Hay reservas activas para esta fecha. Su resolucion se habilitara en el punto 5B.',
            );
        }

        $existe = DB::table('horario_excepcion')
            ->where('local_id', $localId)
            ->whereDate('fecha', $data['fecha'])
            ->exists();

        if ($existe) {
            throw new \DomainException('Ya existe una excepcion configurada para esta fecha.');
        }

        $id = (string) Str::uuid();
        DB::table('horario_excepcion')->insert([
            'id' => $id,
            'local_id' => $localId,
            'fecha' => $data['fecha'],
            'cerrado' => $data['cerrado'],
            'hora_inicio' => $data['cerrado'] ? null : $data['hora_inicio'],
            'hora_fin' => $data['cerrado'] ? null : $data['hora_fin'],
            'motivo' => trim($data['motivo']),
            'created_by' => $usuarioId,
            'created_at' => now(),
        ]);

        return $this->excepcion($id, $localId);
    }

    public function eliminarExcepcion(string $id, string $localId): bool
    {
        return DB::table('horario_excepcion')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->delete() > 0;
    }

    public function cargarFeriadosPeru(string $localId, string $usuarioId): array
    {
        $existentes = DB::table('horario_excepcion')
            ->where('local_id', $localId)
            ->whereIn('fecha', collect(self::FERIADOS_PERU_2026)->pluck('fecha'))
            ->pluck('fecha')
            ->all();

        $nuevos = collect(self::FERIADOS_PERU_2026)
            ->reject(fn (array $feriado) => in_array($feriado['fecha'], $existentes, true))
            ->map(fn (array $feriado): array => [
                'id' => (string) Str::uuid(),
                'local_id' => $localId,
                'fecha' => $feriado['fecha'],
                'cerrado' => true,
                'hora_inicio' => null,
                'hora_fin' => null,
                'motivo' => $feriado['motivo'] . ' (Feriado Nacional)',
                'created_by' => $usuarioId,
                'created_at' => now(),
            ]);

        if ($nuevos->isNotEmpty()) {
            DB::table('horario_excepcion')->insert($nuevos->all());
        }

        return [
            'agregados' => $nuevos->count(),
            'total' => DB::table('horario_excepcion')->where('local_id', $localId)->count(),
        ];
    }

    private function normalizarDias(array $dias): array
    {
        $porDia = collect($dias)->keyBy('dia_semana');

        if ($porDia->count() !== 7 || $porDia->keys()->sort()->values()->all() !== array_keys(self::DIAS)) {
            throw new \InvalidArgumentException('Debes enviar una configuracion para cada dia de la semana.');
        }

        return collect(self::DIAS)->map(function (string $nombreDia, int $diaSemana) use ($porDia): array {
            $dia = $porDia->get($diaSemana);
            $atiende = (bool) $dia['atiende'];
            $turnos = $atiende ? array_values($dia['turnos'] ?? []) : [];

            if ($atiende && count($turnos) === 0) {
                throw new \InvalidArgumentException("El dia {$nombreDia} esta abierto pero no tiene turnos.");
            }

            $turnos = array_map(fn (array $turno): array => [
                'nombre_turno' => trim($turno['nombre_turno']),
                'hora_inicio' => $turno['hora_inicio'],
                'hora_fin' => $turno['hora_fin'],
            ], $turnos);

            $this->validarTurnos($nombreDia, $turnos);

            return [
                'dia_semana' => $diaSemana,
                'atiende' => $atiende,
                'turnos' => $turnos,
            ];
        })->values()->all();
    }

    private function validarTurnos(string $nombreDia, array $turnos): void
    {
        foreach ($turnos as $turno) {
            if ($turno['nombre_turno'] === '') {
                throw new \InvalidArgumentException("Todo turno de {$nombreDia} requiere un nombre.");
            }

            if ($turno['hora_inicio'] === $turno['hora_fin']) {
                throw new \InvalidArgumentException("Un turno de {$nombreDia} no puede tener la misma hora de inicio y fin.");
            }
        }

        foreach ($turnos as $indice => $turno) {
            [$inicio, $fin] = $this->rangoMinutos($turno);

            foreach (array_slice($turnos, $indice + 1) as $comparado) {
                [$otroInicio, $otroFin] = $this->rangoMinutos($comparado);

                if (max($inicio, $otroInicio) < min($fin, $otroFin)) {
                    throw new \InvalidArgumentException("Existen turnos superpuestos en {$nombreDia}.");
                }
            }
        }
    }

    private function validarExcepcion(array $data): void
    {
        if ($data['cerrado']) {
            return;
        }

        if (! isset($data['hora_inicio'], $data['hora_fin'])) {
            throw new \InvalidArgumentException('Un horario especial requiere hora de inicio y fin.');
        }

        $this->validarTurnos('la excepcion', [[
            'nombre_turno' => 'Horario especial',
            'hora_inicio' => $data['hora_inicio'],
            'hora_fin' => $data['hora_fin'],
        ]]);
    }

    private function turnosPlantilla(string $plantilla, int $diaSemana): array
    {
        if ($plantilla === 'solo_almuerzo') {
            return [[
                'nombre_turno' => 'Almuerzo Ejecutivo',
                'hora_inicio' => '12:00',
                'hora_fin' => '16:30',
            ]];
        }

        if ($plantilla === 'corrido_continuo') {
            return [[
                'nombre_turno' => 'Turno Continuo',
                'hora_inicio' => '12:00',
                'hora_fin' => '23:00',
            ]];
        }

        return self::PLANTILLAS[$plantilla][$diaSemana];
    }

    private function totalHoras(array $dias): float
    {
        $minutos = collect($dias)
            ->filter(fn (array $dia) => $dia['atiende'])
            ->flatMap(fn (array $dia) => $dia['turnos'])
            ->sum(function (array $turno): int {
                [$inicio, $fin] = $this->rangoMinutos($turno);

                return $fin - $inicio;
            });

        return round($minutos / 60, 1);
    }

    private function rangoMinutos(array $turno): array
    {
        [$horaInicio, $minutoInicio] = array_map('intval', explode(':', $turno['hora_inicio']));
        [$horaFin, $minutoFin] = array_map('intval', explode(':', $turno['hora_fin']));
        $inicio = ($horaInicio * 60) + $minutoInicio;
        $fin = ($horaFin * 60) + $minutoFin;

        return [$inicio, $fin <= $inicio ? $fin + 1440 : $fin];
    }

    private function excepcion(string $id, string $localId): array
    {
        $excepcion = DB::table('horario_excepcion as e')
            ->leftJoin('usuario as u', 'u.id', '=', 'e.created_by')
            ->where('e.id', $id)
            ->where('e.local_id', $localId)
            ->select('e.*', 'u.nombre as creado_por_nombre')
            ->first();

        return $this->mapearExcepcion($excepcion);
    }

    private function mapearExcepcion(object $excepcion): array
    {
        return [
            'id' => $excepcion->id,
            'local_id' => $excepcion->local_id,
            'fecha' => Carbon::parse($excepcion->fecha)->toDateString(),
            'cerrado' => $excepcion->cerrado,
            'hora_inicio' => $excepcion->hora_inicio ? $this->hora($excepcion->hora_inicio) : null,
            'hora_fin' => $excepcion->hora_fin ? $this->hora($excepcion->hora_fin) : null,
            'motivo' => $excepcion->motivo,
            'created_at' => $excepcion->created_at,
            'created_by' => $excepcion->creado_por_nombre,
            'reservas_canceladas_count' => 0,
        ];
    }

    private function hora(string $hora): string
    {
        return substr($hora, 0, 5);
    }
}
