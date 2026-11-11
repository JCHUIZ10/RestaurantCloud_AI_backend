<?php

namespace App\Domains\Horario\Services;

use App\Domains\Reservas\Exceptions\PoliticasReservaException;
use App\Domains\Reservas\Services\PoliticasReservaService;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HorarioService
{
    public function __construct(
        private JornadaOperativaService $jornadas,
        private PoliticasReservaService $politicas,
    ) {}

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

    /**
     * Reemplaza el horario semanal. Si el cambio deja sin cabida reservas futuras que antes sí cabían, exige
     * cancelarlas explícitamente (con aviso al cliente); todo se guarda en una sola transacción.
     *
     * @param  array<int, array<string, mixed>>  $dias
     * @param  array<int, array{reserva_id: string, notificado: bool, metodo_notificacion: string}>  $avisosCliente
     * @return array<string, mixed>
     */
    public function guardarSemana(
        string $localId,
        array $dias,
        string $empresaId = '',
        string $usuarioId = '',
        bool $cancelarReservas = false,
        array $avisosCliente = [],
    ): array {
        $normalizados = $this->normalizarDias($dias);

        DB::transaction(function () use ($localId, $normalizados, $empresaId, $usuarioId, $cancelarReservas, $avisosCliente): void {
            $afectadas = $this->reemplazarSemanaYBuscarAfectadas($localId, $normalizados, true);

            if ($afectadas->isEmpty()) {
                return;
            }

            if (! $cancelarReservas) {
                $reservas = $this->reservasAfectadasDto($afectadas, $this->mensajeDeCambioDeHorario());

                throw new PoliticasReservaException(
                    'ERR_RESERVAS_AFECTADAS',
                    'Hay '.count($reservas).' reservas futuras que no caben en el nuevo horario. Cancélalas y avisa a los clientes para guardar el cambio.',
                    409,
                    ['total_afectadas' => count($reservas), 'reservas' => $reservas],
                );
            }

            $this->cancelarReservas($afectadas, null, $localId, $empresaId, $usuarioId, $avisosCliente, [
                'motivo_cancelacion' => 'Cambio de horario: nuevo horario de atención',
                'nota' => 'Cancelada por cambio del horario de atención',
                'accion' => 'CANCELACION_POR_CAMBIO_HORARIO',
                'detalle' => ['motivo' => 'Cambio del horario semanal de atención'],
            ]);
        });

        return $this->semana($localId);
    }

    /**
     * Simula el cambio del horario semanal y devuelve las reservas futuras que dejarían de caber, sin guardar nada.
     *
     * @param  array<int, array<string, mixed>>  $dias
     * @return array{hay_conflictos: bool, total_afectadas: int, reservas: array<int, array<string, mixed>>}
     */
    public function precheckSemana(string $localId, array $dias): array
    {
        $normalizados = $this->normalizarDias($dias);

        DB::beginTransaction();
        try {
            $afectadas = $this->reemplazarSemanaYBuscarAfectadas($localId, $normalizados, false);
            $reservas = $this->reservasAfectadasDto($afectadas, $this->mensajeDeCambioDeHorario());
        } finally {
            DB::rollBack();
        }

        return [
            'hay_conflictos' => $reservas !== [],
            'total_afectadas' => count($reservas),
            'reservas' => $reservas,
        ];
    }

    /**
     * Aplica el horario y devuelve las reservas futuras activas que eran válidas con el horario anterior y ya no lo son.
     * Las que ya estaban fuera de horario antes del cambio no se tocan: no es consecuencia de esta edición.
     *
     * @param  array<int, array<string, mixed>>  $normalizados
     * @return Collection<int, object>
     */
    private function reemplazarSemanaYBuscarAfectadas(string $localId, array $normalizados, bool $bloquear): Collection
    {
        $duracion = $this->politicas->obtener($localId)['duracion_reserva_min'];

        $consulta = DB::table('reserva')
            ->where('local_id', $localId)
            ->whereIn('estado', ['confirmada', 'bloqueada'])
            ->where('fecha_hora', '>=', now())
            ->orderBy('fecha_hora');

        if ($bloquear) {
            $consulta->lockForUpdate();
        }

        $futuras = $consulta->get();
        $llegadas = $futuras->mapWithKeys(fn (object $reserva): array => [
            $reserva->id => Carbon::parse($reserva->fecha_hora)->setTimezone(config('app.timezone')),
        ]);

        $invalidasAntes = collect($this->jornadas->validarInicios($localId, $llegadas, $duracion))
            ->reject(fn (array $resultado): bool => $resultado['valido'])
            ->keys();

        $this->reemplazarSemana($localId, $normalizados);

        $invalidasDespues = collect($this->jornadas->validarInicios($localId, $llegadas, $duracion))
            ->reject(fn (array $resultado): bool => $resultado['valido'])
            ->keys();

        $nuevasInvalidas = $invalidasDespues->diff($invalidasAntes);

        return $futuras->whereIn('id', $nuevasInvalidas->all())->values();
    }

    /**
     * @param  array<int, array<string, mixed>>  $normalizados
     */
    private function reemplazarSemana(string $localId, array $normalizados): void
    {
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
    }

    /**
     * Mensaje de WhatsApp para avisar que la reserva ya no cabe en el nuevo horario de atención.
     *
     * @return \Closure(object, Carbon): string
     */
    private function mensajeDeCambioDeHorario(): \Closure
    {
        return fn (object $reserva, Carbon $llegada): string => "Hola {$reserva->cliente_nombre}, lamentamos informarle que por un cambio en nuestro horario de atención "
            ."debemos cancelar su reserva del {$llegada->format('d/m/Y')} a las {$llegada->format('H:i')} para {$reserva->num_personas} personas. "
            .'Le pedimos disculpas; con gusto la reprogramamos.';
    }

    /**
     * @param  array<int, array{reserva_id: string, notificado: bool, metodo_notificacion: string}>  $avisosCliente
     * @return array<string, mixed>
     */
    public function aplicarPlantilla(
        string $localId,
        string $plantilla,
        string $empresaId = '',
        string $usuarioId = '',
        bool $cancelarReservas = false,
        array $avisosCliente = [],
    ): array {
        return $this->guardarSemana($localId, $this->diasDePlantilla($plantilla), $empresaId, $usuarioId, $cancelarReservas, $avisosCliente);
    }

    /**
     * @return array{hay_conflictos: bool, total_afectadas: int, reservas: array<int, array<string, mixed>>}
     */
    public function precheckPlantilla(string $localId, string $plantilla): array
    {
        return $this->precheckSemana($localId, $this->diasDePlantilla($plantilla));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function diasDePlantilla(string $plantilla): array
    {
        return collect(self::DIAS)->map(fn (string $nombreDia, int $diaSemana): array => [
            'dia_semana' => $diaSemana,
            'nombre_dia' => $nombreDia,
            'atiende' => true,
            'turnos' => $this->turnosPlantilla($plantilla, $diaSemana),
        ])->values()->all();
    }

    public function excepciones(string $localId): array
    {
        return $this->consultaExcepciones()
            ->where('e.local_id', $localId)
            ->orderBy('e.fecha')
            ->get()
            ->map(fn ($excepcion): array => $this->mapearExcepcion($excepcion))
            ->all();
    }

    /**
     * Reservas activas que quedarían afectadas por cerrar el día o por un horario especial, para
     * avisar a los clientes antes de confirmar.
     *
     * @param  array{fecha: string, cerrado: bool, hora_inicio?: ?string, hora_fin?: ?string, motivo?: ?string}  $data
     * @return array{hay_conflictos: bool, total_afectadas: int, reservas: array<int, array<string, mixed>>}
     */
    public function precheckExcepcion(string $localId, array $data): array
    {
        $this->validarExcepcion($data);

        $reservas = $this->reservasAfectadasDto($this->reservasAfectadas($localId, $data), $this->mensajeDeCierre($data));

        return [
            'hay_conflictos' => $reservas !== [],
            'total_afectadas' => count($reservas),
            'reservas' => $reservas,
        ];
    }

    /**
     * Registra el feriado, cierre u horario especial. Si afecta reservas activas exige cancelarlas
     * explícitamente; la cancelación, el aviso al cliente y la excepción se guardan en una sola transacción.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function crearExcepcion(string $localId, string $empresaId, string $usuarioId, array $data): array
    {
        $this->validarExcepcion($data);

        $id = (string) Str::uuid();

        DB::transaction(function () use ($localId, $empresaId, $usuarioId, $data, $id): void {
            $existe = DB::table('horario_excepcion')
                ->where('local_id', $localId)
                ->whereDate('fecha', $data['fecha'])
                ->exists();

            if ($existe) {
                throw new \DomainException('Ya existe una excepcion configurada para esta fecha.');
            }

            $afectadas = $this->reservasAfectadas($localId, $data, true);

            if ($afectadas->isNotEmpty() && ! ($data['cancelar_reservas'] ?? false)) {
                $reservas = $this->reservasAfectadasDto($afectadas, $this->mensajeDeCierre($data));

                throw new PoliticasReservaException(
                    'ERR_RESERVAS_AFECTADAS',
                    'Hay '.count($reservas).' reservas activas afectadas. Cancélalas y avisa a los clientes para registrar la fecha.',
                    409,
                    ['total_afectadas' => count($reservas), 'reservas' => $reservas],
                );
            }

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

            if ($afectadas->isNotEmpty()) {
                $motivo = trim($data['motivo']);
                $this->cancelarReservas($afectadas, $id, $localId, $empresaId, $usuarioId, $data['reservas_notificadas'] ?? [], [
                    'motivo_cancelacion' => "Cierre: {$motivo}",
                    'nota' => "Cancelada por cierre: {$motivo}",
                    'accion' => 'CANCELACION_POR_CIERRE',
                    'detalle' => ['fecha_cierre' => $data['fecha'], 'motivo' => $motivo],
                ]);
            }
        });

        return $this->excepcion($id, $localId);
    }

    public function eliminarExcepcion(string $id, string $localId): bool
    {
        return DB::table('horario_excepcion')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->delete() > 0;
    }

    /**
     * Carga los feriados nacionales como días cerrados. Un feriado con reservas activas no se cierra solo:
     * se informa para que el administrador lo registre con el aviso a los clientes.
     *
     * @return array{agregados: int, total: int, omitidos_por_reservas: array<int, array{fecha: string, motivo: string, total_reservas: int}>}
     */
    public function cargarFeriadosPeru(string $localId, string $usuarioId): array
    {
        $existentes = DB::table('horario_excepcion')
            ->where('local_id', $localId)
            ->whereIn('fecha', collect(self::FERIADOS_PERU_2026)->pluck('fecha'))
            ->pluck('fecha')
            ->all();

        $omitidos = [];
        $nuevos = collect(self::FERIADOS_PERU_2026)
            ->reject(fn (array $feriado) => in_array($feriado['fecha'], $existentes, true))
            ->filter(function (array $feriado) use ($localId, &$omitidos): bool {
                $reservas = $this->reservasAfectadas($localId, ['fecha' => $feriado['fecha'], 'cerrado' => true])->count();
                if ($reservas > 0) {
                    $omitidos[] = ['fecha' => $feriado['fecha'], 'motivo' => $feriado['motivo'], 'total_reservas' => $reservas];
                }

                return $reservas === 0;
            })
            ->map(fn (array $feriado): array => [
                'id' => (string) Str::uuid(),
                'local_id' => $localId,
                'fecha' => $feriado['fecha'],
                'cerrado' => true,
                'hora_inicio' => null,
                'hora_fin' => null,
                'motivo' => $feriado['motivo'].' (Feriado Nacional)',
                'created_by' => $usuarioId,
                'created_at' => now(),
            ]);

        if ($nuevos->isNotEmpty()) {
            DB::table('horario_excepcion')->insert($nuevos->all());
        }

        return [
            'agregados' => $nuevos->count(),
            'total' => DB::table('horario_excepcion')->where('local_id', $localId)->count(),
            'omitidos_por_reservas' => $omitidos,
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
        $excepcion = $this->consultaExcepciones()
            ->where('e.id', $id)
            ->where('e.local_id', $localId)
            ->first();

        return $this->mapearExcepcion($excepcion);
    }

    /** Excepciones con su autor y la cantidad de reservas canceladas por ese cierre. */
    private function consultaExcepciones(): Builder
    {
        return DB::table('horario_excepcion as e')
            ->leftJoin('usuario as u', 'u.id', '=', 'e.created_by')
            ->select('e.*', 'u.nombre as creado_por_nombre')
            ->selectRaw(
                "(SELECT COUNT(*) FROM reserva r WHERE r.excepcion_id = e.id AND r.estado = 'cancelada' AND r.motivo_cancelacion LIKE 'Cierre:%') AS reservas_canceladas_count"
            );
    }

    /**
     * Reservas activas de la jornada de la fecha que no podrían atenderse con el cierre u horario especial.
     *
     * @param  array{fecha: string, cerrado: bool, hora_inicio?: ?string, hora_fin?: ?string}  $data
     * @return Collection<int, object>
     */
    private function reservasAfectadas(string $localId, array $data, bool $bloquear = false): Collection
    {
        $zona = config('app.timezone');
        $duracion = $this->politicas->obtener($localId)['duracion_reserva_min'];
        $inicioDia = Carbon::parse($data['fecha'], $zona)->startOfDay();

        // La jornada llega hasta el cierre del turno nocturno y empieza donde termina el de la víspera
        $finJornada = Carbon::parse($this->jornadas->resolver($localId, $data['fecha'], $duracion)['rango_dia']['hasta']);
        $finVispera = collect($this->jornadas->resolver($localId, $inicioDia->copy()->subDay()->toDateString(), $duracion)['turnos'])
            ->filter()
            ->map(fn (array $turno): Carbon => Carbon::parse($turno['hasta']))
            ->max();
        $inicioJornada = $finVispera && $finVispera->gt($inicioDia) ? $finVispera : $inicioDia;

        $consulta = DB::table('reserva')
            ->where('local_id', $localId)
            ->whereIn('estado', ['confirmada', 'bloqueada'])
            ->where('fecha_hora', '>=', $inicioJornada)
            ->where('fecha_hora', '<', $finJornada)
            ->orderBy('fecha_hora');

        if ($bloquear) {
            $consulta->lockForUpdate();
        }

        $reservas = $consulta->get();

        if ($data['cerrado']) {
            return $reservas;
        }

        [$apertura, $cierre] = $this->rangoMinutos(['hora_inicio' => $data['hora_inicio'], 'hora_fin' => $data['hora_fin']]);

        // Con horario especial, la reserva debe llegar dentro de la ventana y terminar antes del cierre
        return $reservas->reject(function (object $reserva) use ($inicioDia, $apertura, $cierre, $duracion, $zona): bool {
            $llegada = (int) $inicioDia->diffInMinutes(Carbon::parse($reserva->fecha_hora)->setTimezone($zona), false);

            return $llegada >= $apertura && $llegada + $duracion <= $cierre;
        })->values();
    }

    /**
     * Mensaje de WhatsApp para avisar el cierre de un día o un horario especial.
     *
     * @param  array<string, mixed>  $data
     * @return \Closure(object, Carbon): string
     */
    private function mensajeDeCierre(array $data): \Closure
    {
        $fechaTexto = Carbon::parse($data['fecha'])->format('d/m/Y');
        $consecuencia = $data['cerrado']
            ? 'el local permanecerá cerrado'
            : 'el local atenderá solo de '.substr($data['hora_inicio'], 0, 5).' a '.substr($data['hora_fin'], 0, 5);
        $motivo = trim((string) ($data['motivo'] ?? ''));

        return fn (object $reserva, Carbon $llegada): string => "Hola {$reserva->cliente_nombre}, lamentamos informarle que el {$fechaTexto} {$consecuencia}"
            .($motivo !== '' ? " ({$motivo})" : '')
            ." y debemos cancelar su reserva de las {$llegada->format('H:i')} para {$reserva->num_personas} personas. "
            .'Le pedimos disculpas; con gusto la reprogramamos.';
    }

    /**
     * @param  Collection<int, object>  $reservas
     * @param  \Closure(object, Carbon): string  $redactarMensaje  Mensaje de WhatsApp para cada cliente
     * @return array<int, array<string, mixed>>
     */
    private function reservasAfectadasDto(Collection $reservas, \Closure $redactarMensaje): array
    {
        $mesas = DB::table('reserva_mesa as rm')
            ->join('mesa as m', 'm.id', '=', 'rm.mesa_id')
            ->whereIn('rm.reserva_id', $reservas->pluck('id'))
            ->orderBy('m.numero')
            ->get(['rm.reserva_id', 'm.numero'])
            ->groupBy('reserva_id');

        return $reservas->map(function (object $reserva) use ($mesas, $redactarMensaje): array {
            $llegada = Carbon::parse($reserva->fecha_hora)->setTimezone(config('app.timezone'));
            $mensaje = $redactarMensaje($reserva, $llegada);

            return [
                'id' => $reserva->id,
                'cliente_nombre' => $reserva->cliente_nombre,
                'cliente_telefono' => $reserva->cliente_telefono,
                'fecha_hora' => $llegada->toIso8601String(),
                'num_personas' => (int) $reserva->num_personas,
                'mesas_asignadas' => ($mesas->get($reserva->id) ?? collect())->map(fn ($mesa): string => 'Mesa '.$mesa->numero)->values()->all(),
                'link_whatsapp' => $this->politicas->enlaceWhatsApp($reserva->cliente_telefono, $mensaje),
                'notificado' => (bool) $reserva->notificado_cliente,
                'metodo_notificacion' => $reserva->metodo_notificacion,
            ];
        })->all();
    }

    /**
     * Cancela las reservas afectadas dejando constancia de si el cliente fue avisado, por qué medio y quién lo hizo.
     *
     * @param  Collection<int, object>  $afectadas
     * @param  array<int, array{reserva_id: string, notificado: bool, metodo_notificacion: string}>  $avisosCliente
     * @param  array{motivo_cancelacion: string, nota: string, accion: string, detalle: array<string, mixed>}  $causa
     */
    private function cancelarReservas(Collection $afectadas, ?string $excepcionId, string $localId, string $empresaId, string $usuarioId, array $avisosCliente, array $causa): void
    {
        $avisos = collect($avisosCliente)->keyBy('reserva_id');

        // Ninguna reserva se cancela sin que alguien decida si el cliente fue avisado (y por qué medio)
        $sinDecision = $afectadas->filter(function (object $reserva) use ($avisos): bool {
            $aviso = $avisos->get($reserva->id);

            return $aviso === null || ($aviso['notificado'] && $aviso['metodo_notificacion'] === 'ninguno');
        })->pluck('id')->values()->all();

        if ($sinDecision !== []) {
            throw new PoliticasReservaException(
                'ERR_AVISOS_INCOMPLETOS',
                'Indica para cada reserva si el cliente fue avisado (y por qué medio) o si no se pudo avisar.',
                422,
                ['reservas_sin_decision' => $sinDecision],
            );
        }

        foreach ($afectadas as $reserva) {
            $aviso = $avisos->get($reserva->id);
            $notificado = (bool) ($aviso['notificado'] ?? false);
            $metodo = $notificado ? ($aviso['metodo_notificacion'] ?? 'ninguno') : 'ninguno';

            DB::table('reserva')->where('id', $reserva->id)->update([
                'estado' => 'cancelada',
                'excepcion_id' => $excepcionId,
                'motivo_cancelacion' => $causa['motivo_cancelacion'],
                'notas' => ($reserva->notas ? "{$reserva->notas} | " : '').$causa['nota'],
                'notificado_cliente' => $notificado && $metodo !== 'ninguno',
                'metodo_notificacion' => $metodo,
                'notificado_por' => $notificado && $metodo !== 'ninguno' ? $usuarioId : null,
                'fecha_notificado' => $notificado && $metodo !== 'ninguno' ? now() : null,
                'updated_at' => now(),
            ]);

            DB::table('log_auditoria')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'usuario_id' => $usuarioId,
                'accion' => $causa['accion'],
                'entidad_tipo' => 'reserva',
                'entidad_id' => $reserva->id,
                'detalle' => json_encode([
                    'cliente' => $reserva->cliente_nombre,
                    ...$causa['detalle'],
                    'cliente_avisado' => $notificado && $metodo !== 'ninguno',
                    'metodo_notificacion' => $metodo,
                ]),
                'fecha' => now(),
            ]);
        }
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
            'reservas_canceladas_count' => (int) ($excepcion->reservas_canceladas_count ?? 0),
        ];
    }

    private function hora(string $hora): string
    {
        return substr($hora, 0, 5);
    }
}
