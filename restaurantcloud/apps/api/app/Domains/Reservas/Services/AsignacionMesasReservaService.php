<?php

namespace App\Domains\Reservas\Services;

use App\Domains\Reservas\Exceptions\PoliticasReservaException;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Reglas para asignar mesas a una reserva. Es la única definición: la usan el mini-mapa de disponibilidad,
 * la creación de reservas y el cambio de mesa, de modo que listar y validar nunca discrepen.
 */
class AsignacionMesasReservaService
{
    /** Minutos alrededor de "ahora" en que una comanda activa impide asignar la mesa a una reserva. */
    private const MARGEN_COMANDA_ACTIVA_MIN = 60;

    /**
     * Estado de cada mesa activa para una reserva que empieza en `$inicio`.
     * `causa` indica por qué no está disponible: reserva, comanda o capacidad (null si lo está).
     *
     * @return Collection<int, array{mesa_id: string, numero: string, capacidad: int, disponible: bool, permite_union: bool, motivo_bloqueo: ?string, causa: ?string}>
     */
    public function disponibilidad(
        string $localId,
        Carbon $inicio,
        int $numPersonas,
        int $duracion,
        int $buffer,
        ?string $excluirReservaId = null,
    ): Collection {
        $ventanaInicio = $inicio->copy()->subMinutes($buffer);
        $ventanaFin = $inicio->copy()->addMinutes($duracion + $buffer);

        $mesas = DB::table('mesa')
            ->where('local_id', $localId)
            ->where('estado', 'activa')
            ->whereNull('mesa_principal_id')
            ->orderBy('numero')
            ->get();

        // Reservas activas que se solapan con la ventana (sin contar la propia reserva si se está reasignando)
        $reservasEnVentana = DB::table('reserva as r')
            ->join('reserva_mesa as rm', 'rm.reserva_id', '=', 'r.id')
            ->where('r.local_id', $localId)
            ->whereIn('r.estado', ['confirmada', 'bloqueada'])
            ->when($excluirReservaId, fn ($consulta) => $consulta->where('r.id', '!=', $excluirReservaId))
            ->where(function ($q) use ($ventanaInicio, $ventanaFin, $duracion) {
                $q->where('r.fecha_hora', '<', $ventanaFin)
                    ->whereRaw("r.fecha_hora + interval '{$duracion} minutes' > ?", [$ventanaInicio]);
            })
            ->select('rm.mesa_id', 'r.cliente_nombre', 'r.fecha_hora')
            ->get()
            ->keyBy('mesa_id');

        // Si la reserva es para hoy y cercana a la hora actual, una comanda abierta ocupa la mesa
        $mesasConComanda = collect();
        if ($inicio->isSameDay(now()) && abs($inicio->diffInMinutes(now())) <= self::MARGEN_COMANDA_ACTIVA_MIN) {
            $mesasConComanda = DB::table('pedido')
                ->where('local_id', $localId)
                ->whereIn('estado', ['borrador', 'enviado', 'cuenta_pedida'])
                ->pluck('mesa_id')
                ->flip();
        }

        return $mesas->map(function ($mesa) use ($reservasEnVentana, $mesasConComanda, $numPersonas): array {
            $disponible = true;
            $motivo = null;
            $causa = null;

            if ($reservasEnVentana->has($mesa->id)) {
                $disponible = false;
                $causa = 'reserva';
                $motivo = 'Reservada a las '.date('H:i', strtotime($reservasEnVentana->get($mesa->id)->fecha_hora));
            } elseif ($mesasConComanda->has($mesa->id)) {
                $disponible = false;
                $causa = 'comanda';
                $motivo = 'Ocupada con comanda activa';
            } elseif ((int) $mesa->capacidad < $numPersonas && ! $mesa->permite_union) {
                $disponible = false;
                $causa = 'capacidad';
                $motivo = 'Capacidad insuficiente';
            }

            return [
                'mesa_id' => $mesa->id,
                'numero' => $mesa->numero,
                'capacidad' => (int) $mesa->capacidad,
                'disponible' => $disponible,
                'permite_union' => (bool) $mesa->permite_union,
                'motivo_bloqueo' => $motivo,
                'causa' => $causa,
            ];
        })->values();
    }

    /**
     * Comprueba que las mesas pueden asignarse a la reserva y las devuelve bloqueadas para escritura.
     * Debe llamarse dentro de una transacción: el bloqueo evita que dos mozos asignen la misma mesa a la vez.
     *
     * @param  array<int, string>  $mesaIds
     * @return Collection<int, object>
     *
     * @throws PoliticasReservaException
     */
    public function validarAsignacion(
        string $localId,
        array $mesaIds,
        int $numPersonas,
        Carbon $inicio,
        int $duracion,
        int $buffer,
        ?string $excluirReservaId = null,
    ): Collection {
        $mesas = DB::table('mesa')
            ->where('local_id', $localId)
            ->whereIn('id', $mesaIds)
            ->lockForUpdate()
            ->get();

        if ($mesas->count() !== count($mesaIds)) {
            throw new PoliticasReservaException('ERR_MESAS_INVALIDAS', 'Una o más mesas seleccionadas no pertenecen al local o son inválidas.', 422);
        }

        // Varias mesas se unen físicamente al sentar a los comensales: todas deben permitirlo
        if ($mesas->count() > 1) {
            $noUnibles = $mesas->reject(fn ($mesa) => (bool) $mesa->permite_union)->pluck('numero')->sort()->values();
            if ($noUnibles->isNotEmpty()) {
                throw new PoliticasReservaException(
                    'ERR_MESAS_NO_UNIBLES',
                    'La Mesa '.$noUnibles->implode(', ').' no permite unirse con otras mesas. Elige una sola mesa o mesas que permitan unión.',
                    422
                );
            }
        }

        // La reserva debe caber en las mesas elegidas
        $capacidadTotal = (int) $mesas->sum('capacidad');
        if ($capacidadTotal < $numPersonas) {
            throw new PoliticasReservaException(
                'ERR_CAPACIDAD_INSUFICIENTE',
                "Las mesas seleccionadas suman {$capacidadTotal} lugares y la reserva es para {$numPersonas} personas. Agrega otra mesa para agrupar.",
                422
            );
        }

        // Cada mesa debe estar disponible a esa hora: activa, no anexada a otra, sin choque ni comanda abierta
        $estado = $this->disponibilidad($localId, $inicio, $numPersonas, $duracion, $buffer, $excluirReservaId)->keyBy('mesa_id');
        $numeros = fn (string $causa) => $mesas
            ->filter(fn ($mesa) => ($estado->get($mesa->id)['causa'] ?? null) === $causa)
            ->pluck('numero')->sort()->values();

        $fueraDeServicio = $mesas->reject(fn ($mesa) => $estado->has($mesa->id))->pluck('numero')->sort()->values();
        if ($fueraDeServicio->isNotEmpty()) {
            throw new PoliticasReservaException(
                'ERR_MESAS_INVALIDAS',
                'La Mesa '.$fueraDeServicio->implode(', ').' no está disponible para reservas (inactiva o unida a otra mesa).',
                422
            );
        }

        if (($conReserva = $numeros('reserva'))->isNotEmpty()) {
            throw new PoliticasReservaException(
                'ERR_MESA_RESERVADA',
                'Conflicto de horario: La mesa '.$conReserva->implode(', ').' ya cuenta con una reserva activa en esa franja.',
                422
            );
        }

        if (($ocupadas = $numeros('comanda'))->isNotEmpty()) {
            throw new PoliticasReservaException(
                'ERR_MESA_OCUPADA',
                'La Mesa '.$ocupadas->implode(', ').' está ocupada con una comanda activa. Elige una mesa libre.',
                409
            );
        }

        return $mesas;
    }
}
