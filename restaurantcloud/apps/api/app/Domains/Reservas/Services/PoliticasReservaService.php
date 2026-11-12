<?php

namespace App\Domains\Reservas\Services;

use App\Domains\Horario\Services\JornadaOperativaService;
use App\Domains\Reservas\Exceptions\PoliticasReservaException;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Políticas de reserva de un local (CU-ADMIN-10): única fuente de sus valores para el
 * administrador y para la bandeja del mozo, y regla de habilitación del módulo por plan.
 */
class PoliticasReservaService
{
    /** Mismos valores con los que nace un local (LocalProvisioningService). */
    private const VALORES_RECOMENDADOS = [
        'duracion_reserva_min' => 90,
        'buffer_reserva_min' => 15,
        'tolerancia_no_show_min' => 15,
        'minutos_bloqueo_previo' => 30,
        'margen_recordatorio_min' => 120,
        'anticipacion_minima_horas' => 2,
        'anticipacion_maxima_dias' => 30,
    ];

    private const CAMPOS_PARAMETROS = [
        'duracion_reserva_min',
        'buffer_reserva_min',
        'tolerancia_no_show_min',
        'minutos_bloqueo_previo',
        'margen_recordatorio_min',
        'anticipacion_minima_horas',
        'anticipacion_maxima_dias',
    ];

    public function __construct(
        private AsignacionMesasReservaService $asignacion,
        private JornadaOperativaService $jornadas,
    ) {}

    /**
     * Políticas vigentes del local; si nunca se configuraron, los valores recomendados con el canal habilitado.
     *
     * @return array<string, mixed>
     */
    public function obtener(string $localId): array
    {
        $politica = DB::table('politicas_reserva')->where('local_id', $localId)->first();

        return [
            'local_id' => $localId,
            'local_nombre' => (string) DB::table('local')->where('id', $localId)->value('nombre'),
            'acepta_reservas' => $politica ? (bool) $politica->acepta_reservas : true,
            ...($politica
                ? collect(self::CAMPOS_PARAMETROS)->mapWithKeys(fn (string $campo): array => [$campo => (int) $politica->{$campo}])->all()
                : self::VALORES_RECOMENDADOS),
            'updated_at' => $politica ? $this->aIso($politica->updated_at) : null,
        ];
    }

    /**
     * Guarda las políticas. El apagado del canal con reservas pendientes exige confirmación explícita
     * y una edición hecha sobre una versión desactualizada se rechaza.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function actualizar(
        string $localId,
        string $empresaId,
        string $usuarioId,
        array $data,
        bool $confirmarDesactivacion = false,
        ?string $versionEsperada = null,
        bool $confirmarImpacto = false,
    ): array {
        DB::transaction(function () use ($localId, $empresaId, $usuarioId, $data, $confirmarDesactivacion, $versionEsperada, $confirmarImpacto): void {
            $actual = DB::table('politicas_reserva')->where('local_id', $localId)->lockForUpdate()->first();

            // Un parámetro que no llega (por ejemplo, uno que la pantalla ya no muestra) conserva su valor guardado
            foreach (self::CAMPOS_PARAMETROS as $campo) {
                $data[$campo] ??= $actual ? (int) $actual->{$campo} : self::VALORES_RECOMENDADOS[$campo];
            }

            if ($actual && $versionEsperada !== null
                && $this->aIso($actual->updated_at) !== $this->aIso($versionEsperada)) {
                throw new PoliticasReservaException(
                    'ERR_POLITICAS_MODIFICADAS',
                    'Otro administrador modificó las políticas mientras las editabas. Se recargaron los valores vigentes.',
                );
            }

            $estabaActivo = $actual ? (bool) $actual->acepta_reservas : true;
            $pendientes = collect();

            if ($estabaActivo && ! $data['acepta_reservas']) {
                $pendientes = $this->reservasPendientes($localId);

                if ($pendientes->isNotEmpty() && ! $confirmarDesactivacion) {
                    throw new PoliticasReservaException(
                        'ERR_RESERVAS_FUTURAS_PENDIENTES',
                        "Existen {$pendientes->count()} reservas pendientes. Confirma si deseas suspender igualmente la recepción de nuevas reservas.",
                        409,
                        ['total_pendientes' => $pendientes->count(), 'reservas' => $pendientes->values()->all()],
                    );
                }
            }

            // Subir la duración o el buffer puede dejar reservas ya registradas chocando entre sí o fuera del turno
            $antes = $this->obtener($localId);
            $impacto = $this->impactoDeCambio($localId, (int) $data['duracion_reserva_min'], (int) $data['buffer_reserva_min']);

            if ($impacto['hay_impacto'] && ! $confirmarImpacto) {
                throw new PoliticasReservaException(
                    'ERR_POLITICAS_AFECTAN_RESERVAS',
                    "Con estos valores {$impacto['total']} reservas registradas dejarían de ser compatibles. Confirma si deseas guardar igualmente.",
                    409,
                    $impacto,
                );
            }

            DB::table('politicas_reserva')->upsert(
                [[
                    'local_id' => $localId,
                    'acepta_reservas' => $data['acepta_reservas'],
                    ...collect(self::CAMPOS_PARAMETROS)->mapWithKeys(fn (string $campo): array => [$campo => $data[$campo]])->all(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]],
                ['local_id'],
                ['acepta_reservas', ...self::CAMPOS_PARAMETROS, 'updated_at'],
            );

            $cambios = collect(self::CAMPOS_PARAMETROS)
                ->filter(fn (string $campo): bool => (int) $antes[$campo] !== (int) $data[$campo])
                ->mapWithKeys(fn (string $campo): array => [$campo => ['antes' => (int) $antes[$campo], 'despues' => (int) $data[$campo]]]);

            if ($cambios->isNotEmpty()) {
                $this->auditar($empresaId, $localId, $usuarioId, 'CAMBIO_POLITICAS_RESERVA', [
                    'cambios' => $cambios->all(),
                    'reservas_afectadas' => $impacto['total'],
                ]);
            }

            if ($estabaActivo && ! $data['acepta_reservas']) {
                $this->auditar($empresaId, $localId, $usuarioId, 'DESACTIVACION_CANAL_RESERVAS', [
                    'reservas_pendientes' => $pendientes->count(),
                ]);
            } elseif (! $estabaActivo && $data['acepta_reservas']) {
                $this->auditar($empresaId, $localId, $usuarioId, 'REACTIVACION_CANAL_RESERVAS', []);
            }
        });

        return $this->obtener($localId);
    }

    /**
     * Reservas aún por atender (incluye las que están en ventana de cortesía), de la más próxima a la más lejana.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function reservasPendientes(string $localId)
    {
        $tolerancia = $this->obtener($localId)['tolerancia_no_show_min'];

        $reservas = DB::table('reserva')
            ->where('local_id', $localId)
            ->whereIn('estado', ['confirmada', 'bloqueada'])
            ->where('fecha_hora', '>=', now()->subMinutes($tolerancia))
            ->orderBy('fecha_hora')
            ->get();

        $mesas = DB::table('reserva_mesa as rm')
            ->join('mesa as m', 'm.id', '=', 'rm.mesa_id')
            ->whereIn('rm.reserva_id', $reservas->pluck('id'))
            ->orderBy('m.numero')
            ->get(['rm.reserva_id', 'm.numero'])
            ->groupBy('reserva_id');

        return $reservas->map(fn ($reserva): array => [
            'id' => $reserva->id,
            'cliente' => $reserva->cliente_nombre,
            'telefono' => $reserva->cliente_telefono,
            'fecha_hora' => $this->aIso($reserva->fecha_hora),
            'pax' => (int) $reserva->num_personas,
            'mesas' => ($mesas->get($reserva->id) ?? collect())->map(fn ($mesa): string => 'Mesa '.$mesa->numero)->values()->all(),
            'link_whatsapp' => $this->enlaceWhatsApp($reserva->cliente_telefono),
        ]);
    }

    /**
     * Reservas futuras que dejarían de ser compatibles si la duración o el buffer pasan a los valores dados.
     * Solo cuentan los problemas nuevos (los que ya existían con la política vigente no se atribuyen al cambio):
     * choque de mesa entre reservas y reservas que terminarían después del cierre del turno.
     * Bajar duración y buffer nunca genera impacto.
     *
     * @return array{hay_impacto: bool, total: int, choques: array<int, array<string, mixed>>, fuera_de_horario: array<int, array<string, mixed>>}
     */
    public function impactoDeCambio(string $localId, int $nuevaDuracion, int $nuevoBuffer): array
    {
        $actual = $this->obtener($localId);
        $duracionActual = $actual['duracion_reserva_min'];
        $bufferActual = $actual['buffer_reserva_min'];
        $desde = now()->subMinutes($actual['tolerancia_no_show_min']);

        $choques = collect();
        if ($nuevaDuracion + $nuevoBuffer > $duracionActual + $bufferActual) {
            $yaExistentes = $this->asignacion->choquesEntreReservas($localId, $desde, null, $duracionActual, $bufferActual)
                ->map(fn (array $choque): string => $choque['reserva_id'].'|'.$choque['otra_reserva_id'])
                ->flip();

            $choques = $this->asignacion->choquesEntreReservas($localId, $desde, null, $nuevaDuracion, $nuevoBuffer)
                ->reject(fn (array $choque): bool => $yaExistentes->has($choque['reserva_id'].'|'.$choque['otra_reserva_id']))
                ->groupBy('reserva_id');
        }

        $fueraDeHorario = collect();
        if ($nuevaDuracion > $duracionActual) {
            $inicios = DB::table('reserva')
                ->where('local_id', $localId)
                ->whereIn('estado', ['confirmada', 'bloqueada'])
                ->where('fecha_hora', '>=', $desde)
                ->pluck('fecha_hora', 'id')
                ->map(fn ($fechaHora): Carbon => Carbon::parse($fechaHora));

            $conDuracionActual = $this->jornadas->validarInicios($localId, $inicios, $duracionActual);
            $fueraDeHorario = collect($this->jornadas->validarInicios($localId, $inicios, $nuevaDuracion))
                ->filter(fn (array $resultado, string $id): bool => ! $resultado['valido'] && ($conDuracionActual[$id]['valido'] ?? false))
                ->map(fn (array $resultado): string => (string) $resultado['mensaje']);
        }

        $ids = $choques->keys()->merge($fueraDeHorario->keys())->unique()->values();
        $filas = $this->reservasPendientes($localId)->keyBy('id');

        $conMotivo = fn (string $id, string $motivo): array => ($filas->get($id) ?? ['id' => $id]) + ['motivo' => $motivo];

        $listaChoques = $choques->map(function (Collection $deLaReserva, string $id) use ($conMotivo): array {
            $motivo = $deLaReserva->map(fn (array $c): string => "Mesa {$c['mesa']}: solo {$c['separacion_min']} min hasta la reserva de {$c['otra_cliente']} ({$c['otra_hora']}); se requieren {$c['requerida_min']} min.")->implode(' ');

            return $conMotivo($id, $motivo);
        })->values()->all();

        $listaFuera = $fueraDeHorario->map(fn (string $mensaje, string $id): array => $conMotivo($id, $mensaje))->values()->all();

        return [
            'hay_impacto' => $ids->isNotEmpty(),
            'total' => $ids->count(),
            'choques' => $listaChoques,
            'fuera_de_horario' => $listaFuera,
        ];
    }

    /**
     * Restaura los parámetros recomendados; el estado del canal (acepta_reservas) no se toca.
     *
     * @return array<string, mixed>
     */
    public function restaurarValoresRecomendados(string $localId, string $empresaId, string $usuarioId, bool $confirmarImpacto = false): array
    {
        $actual = $this->obtener($localId);

        return $this->actualizar(
            $localId,
            $empresaId,
            $usuarioId,
            ['acepta_reservas' => $actual['acepta_reservas'], ...self::VALORES_RECOMENDADOS],
            confirmarImpacto: $confirmarImpacto,
        );
    }

    /** El módulo de reservas está habilitado si el plan de la empresa lo incluye (plan.incluye_reservas). */
    public function moduloHabilitado(string $empresaId): bool
    {
        return (bool) DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)
            ->value('p.incluye_reservas');
    }

    /**
     * Nombres de los planes vigentes que incluyen reservas, para orientar al usuario.
     *
     * @return array<int, string>
     */
    public function planesConReservas(): array
    {
        return DB::table('plan')
            ->where('activo', true)
            ->where('incluye_reservas', true)
            ->orderBy('precio_mensual')
            ->pluck('nombre')
            ->all();
    }

    /** Enlace wa.me del cliente (formato E.164 de Perú), con un mensaje inicial opcional. */
    public function enlaceWhatsApp(?string $telefono, ?string $mensaje = null): string
    {
        $digitos = preg_replace('/\D/', '', (string) $telefono);
        if ($digitos === '') {
            return '';
        }

        $enlace = 'https://wa.me/'.(strlen($digitos) === 11 && str_starts_with($digitos, '51') ? $digitos : '51'.substr($digitos, -9));

        return $mensaje ? $enlace.'?text='.rawurlencode($mensaje) : $enlace;
    }

    private function aIso(mixed $valor): string
    {
        return Carbon::parse($valor)->utc()->format('Y-m-d\TH:i:s.u\Z');
    }

    /**
     * @param  array<string, mixed>  $detalle
     */
    private function auditar(string $empresaId, string $localId, string $usuarioId, string $accion, array $detalle): void
    {
        DB::table('log_auditoria')->insert([
            'id' => (string) Str::uuid(),
            'empresa_id' => $empresaId,
            'local_id' => $localId,
            'usuario_id' => $usuarioId,
            'accion' => $accion,
            'entidad_tipo' => 'politicas_reserva',
            'entidad_id' => $localId,
            'detalle' => json_encode($detalle),
            'fecha' => now(),
        ]);
    }
}
