<?php

namespace App\Domains\Mesas\Services;

use App\Domains\Mesas\Exceptions\PlanoException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlanoService
{
    public const PEDIDOS_ABIERTOS = ['borrador', 'enviado', 'cuenta_pedida'];

    public function __construct(private CuotaSalonService $cuotas) {}

    /** Serializa las escrituras del plano y los cambios de cuota de la empresa. */
    public function ejecutar(string $empresaId, string $localId, callable $accion, bool $escritura = true): array
    {
        return DB::transaction(function () use ($empresaId, $localId, $accion, $escritura): array {
            $empresa = DB::table('empresa')->where('id', $empresaId);
            if ($escritura) {
                $empresa->lockForUpdate();
            }
            if (! $empresa->first()) {
                throw new PlanoException('ERR_SEDE_INVALIDA', 'Empresa no disponible.', 403);
            }
            $local = DB::table('local')->where('id', $localId)->where('empresa_id', $empresaId)->first();
            if (! $local || $local->estado !== 'activo') {
                throw new PlanoException('ERR_SEDE_INACTIVA', 'La sede debe estar activa.', 403);
            }

            return $accion($local);
        });
    }

    public function listado(string $empresaId, string $localId, object $local): array
    {
        $pisos = DB::table('piso')->where('local_id', $localId)->where('estado', 'activo')
            ->orderBy('created_at')->orderBy('id')->get();
        $mesas = DB::table('mesa')->where('local_id', $localId)->where('estado', '!=', 'inactiva')->get();
        $pedidos = DB::table('pedido as p')->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)->whereIn('p.estado', self::PEDIDOS_ABIERTOS)
            ->select('p.*', 'u.nombre as mozo_nombre')->orderBy('p.created_at')->get();

        $totales = DB::table('pedido_item')->whereIn('pedido_id', $pedidos->pluck('id'))
            ->whereNotIn('estado', ['anulado', 'no_disponible'])->groupBy('pedido_id')
            ->selectRaw('pedido_id, SUM(cantidad * precio_unitario) AS total')->pluck('total', 'pedido_id');
        $detalles = $mesas->map(function ($mesa) use ($pedidos, $mesas, $totales): array {
            $raiz = $mesa->mesa_principal_id ?: $mesa->id;
            $ids = $mesas->filter(fn ($m) => $m->id === $raiz || $m->mesa_principal_id === $raiz)->pluck('id');
            $pedido = $pedidos->first(fn ($p) => $ids->contains($p->mesa_id));

            return [...(array) $mesa,
                'tiene_pedido_activo' => $pedido !== null,
                'comanda_activa_codigo' => $pedido ? 'COM-'.str_pad((string) $pedido->numero_comanda, 4, '0', STR_PAD_LEFT) : null,
                'mozo_a_cargo' => $pedido?->mozo_nombre,
                'total_cuenta_activa' => $pedido ? (float) ($totales[$pedido->id] ?? 0) : null,
            ];
        });

        return [
            'local_id' => $localId, 'local_nombre' => $local->nombre,
            'cuota_mesas' => $this->cuotas->obtener($empresaId),
            'pisos' => $pisos->map(function ($piso) use ($detalles): array {
                $mesasPiso = $detalles->where('piso_id', $piso->id)->values();

                return [...(array) $piso, 'mesas' => $mesasPiso->all(),
                    'total_mesas' => $mesasPiso->count(),
                    'capacidad_total_personas' => $mesasPiso->sum('capacidad')];
            })->all(),
        ];
    }

    public function crearPiso(string $empresaId, string $localId, array $data): array
    {
        $this->validarNombre($localId, $data['nombre']);
        $cuota = $this->cuotas->obtener($empresaId);
        if ($cuota['pisos_activos_empresa'] >= $cuota['max_pisos_plan']) {
            throw new PlanoException('ERR_CUOTA_PISOS_EXCEDIDA', 'Se alcanzó el límite de ambientes del plan.', 403);
        }
        $id = (string) Str::uuid();
        DB::table('piso')->insert(['id' => $id, 'local_id' => $localId, ...$data, 'estado' => 'activo']);

        return $this->detallePiso($localId, $id);
    }

    public function modificarPiso(string $localId, string $id, array $data): array
    {
        $this->piso($localId, $id);
        if (isset($data['nombre'])) {
            $this->validarNombre($localId, $data['nombre'], $id);
        } else {
            $conflictos = DB::table('mesa')->where('local_id', $localId)->where('piso_id', $id)
                ->where('estado', '!=', 'inactiva')->where(function ($q) use ($data): void {
                    $q->where('posicion_x', '>=', $data['columnas'])->orWhere('posicion_y', '>=', $data['filas']);
                })->pluck('numero')->all();
            if ($conflictos !== []) {
                throw new PlanoException('ERR_COLUMNA_CON_MESAS', 'Reubica o desactiva las mesas antes de recortar: '.implode(', ', $conflictos), 409, ['mesas_en_conflicto' => $conflictos]);
            }
        }
        DB::table('piso')->where('id', $id)->where('local_id', $localId)->update($data);

        return $this->detallePiso($localId, $id);
    }

    public function desactivarPiso(string $localId, string $id): array
    {
        $this->piso($localId, $id);
        if (DB::table('piso')->where('local_id', $localId)->where('estado', 'activo')->count() <= 1) {
            throw new PlanoException('ERR_MINIMO_UN_PISO_ACTIVO', 'La sede debe mantener al menos un ambiente activo.');
        }
        if (DB::table('mesa')->where('local_id', $localId)->where('piso_id', $id)->where('estado', '!=', 'inactiva')->exists()) {
            throw new PlanoException('ERR_PISO_CON_MESAS_ACTIVAS', 'El ambiente contiene mesas activas o bloqueadas.');
        }
        DB::table('piso')->where('id', $id)->where('local_id', $localId)->update(['estado' => 'inactivo']);

        return ['piso_id' => $id, 'mensaje' => 'Ambiente desactivado exitosamente.'];
    }

    public function crearMesa(string $empresaId, string $localId, string $pisoId, array $data): array
    {
        $piso = $this->piso($localId, $pisoId);
        $this->asegurarMesas($empresaId, 1);
        $this->validarMesa($localId, $piso, $data);
        $id = (string) Str::uuid();
        DB::table('mesa')->insert(['id' => $id, 'local_id' => $localId, 'piso_id' => $pisoId, ...$data, 'estado' => 'activa']);

        return (array) DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
    }

    public function generarLote(string $empresaId, string $localId, string $pisoId, array $data): array
    {
        $this->piso($localId, $pisoId);
        if (DB::table('mesa')->where('local_id', $localId)->where('piso_id', $pisoId)->where('estado', '!=', 'inactiva')->exists()) {
            throw new PlanoException('ERR_PISO_NO_VACIO', 'El asistente requiere un ambiente vacío.');
        }
        $cantidad = $data['columnas'] * $data['filas'];
        $this->asegurarMesas($empresaId, $cantidad);
        $this->modificarPiso($localId, $pisoId, ['columnas' => $data['columnas'], 'filas' => $data['filas']]);
        for ($i = 0; $i < $cantidad; $i++) {
            $this->crearMesa($empresaId, $localId, $pisoId, [
                'numero' => trim($data['prefijo'].str_pad((string) ($data['numero_inicio'] + $i), 2, '0', STR_PAD_LEFT)),
                'capacidad' => $data['capacidad'], 'forma' => $data['forma'], 'permite_union' => $data['permite_union'],
                'posicion_x' => $i % $data['columnas'], 'posicion_y' => intdiv($i, $data['columnas']),
            ]);
        }

        return ['piso' => $this->detallePiso($localId, $pisoId), 'mesas_creadas' => $cantidad];
    }

    public function actualizarMesa(string $localId, string $id, array $data): array
    {
        $mesa = $this->mesa($localId, $id);
        if ($mesa->estado === 'inactiva') {
            throw new PlanoException('ERR_MESA_INACTIVA', 'La mesa está inactiva.');
        }
        $piso = $this->piso($localId, $data['piso_id'] ?? $mesa->piso_id);
        $movimiento = $piso->id !== $mesa->piso_id || $data['posicion_x'] !== $mesa->posicion_x || $data['posicion_y'] !== $mesa->posicion_y;
        $grupo = $this->estaUnida($mesa);
        if ($grupo && ($movimiento || $data['permite_union'] !== $mesa->permite_union)) {
            throw new PlanoException('ERR_MESA_UNIDA', 'Separa el grupo antes de mover la mesa o cambiar la unión.');
        }
        if ($movimiento) {
            $this->asegurarSinPedido($mesa);
        }
        $this->validarMesa($localId, $piso, $data, $id);
        DB::table('mesa')->where('id', $id)->where('local_id', $localId)->update([...$data, 'piso_id' => $piso->id]);

        return (array) DB::table('mesa')->where('id', $id)->where('local_id', $localId)->first();
    }

    public function desactivarMesa(string $localId, string $id): array
    {
        $mesa = $this->mesa($localId, $id);
        $this->asegurarSinPedido($mesa);
        if ($this->estaUnida($mesa)) {
            throw new PlanoException('ERR_MESA_UNIDA', 'Separa el grupo de mesas antes de desactivar.');
        }
        DB::table('mesa')->where('id', $id)->where('local_id', $localId)->update(['estado' => 'inactiva']);

        return ['mesa_id' => $id, 'mensaje' => 'Mesa desactivada exitosamente.'];
    }

    private function validarNombre(string $localId, string $nombre, ?string $id = null): void
    {
        if (DB::table('piso')->where('local_id', $localId)->where('estado', 'activo')
            ->whereRaw('LOWER(nombre) = LOWER(?)', [$nombre])->when($id, fn ($q) => $q->where('id', '!=', $id))->exists()) {
            throw new PlanoException('ERR_NOMBRE_PISO_DUPLICADO', 'Ya existe un ambiente activo con ese nombre.');
        }
    }

    private function validarMesa(string $localId, object $piso, array $data, ?string $id = null): void
    {
        if (mb_strlen($data['numero']) > 10 || trim($data['numero']) === '') {
            throw new PlanoException('ERR_NUMERO_MESA_INVALIDO', 'El código de mesa debe tener entre 1 y 10 caracteres.', 422);
        }
        $otras = DB::table('mesa')->where('local_id', $localId)->where('piso_id', $piso->id)
            ->when($id, fn ($q) => $q->where('id', '!=', $id));
        if ((clone $otras)->whereRaw('LOWER(numero) = LOWER(?)', [$data['numero']])->exists()) {
            throw new PlanoException('ERR_MESA_NUMERO_DUPLICADO', 'El número ya existe en este ambiente, incluso en el historial.');
        }
        if ($data['posicion_x'] < 0 || $data['posicion_y'] < 0 || $data['posicion_x'] >= $piso->columnas || $data['posicion_y'] >= $piso->filas) {
            throw new PlanoException('ERR_POSICION_FUERA_PLANO', 'La casilla debe estar dentro de la cuadrícula.', 422);
        }
        if ((clone $otras)->where('estado', '!=', 'inactiva')->where('posicion_x', $data['posicion_x'])->where('posicion_y', $data['posicion_y'])->exists()) {
            throw new PlanoException('ERR_POSICION_OCUPADA', 'La casilla seleccionada ya contiene una mesa.');
        }
    }

    private function asegurarMesas(string $empresaId, int $cantidad): void
    {
        if ($this->cuotas->obtener($empresaId)['mesas_disponibles'] < $cantidad) {
            throw new PlanoException('ERR_CUOTA_MESAS_EXCEDIDA', 'No hay cupo suficiente de mesas en el plan.', 403);
        }
    }

    private function piso(string $localId, string $id): object
    {
        $piso = DB::table('piso')->where('local_id', $localId)->where('id', $id)->where('estado', 'activo')->lockForUpdate()->first();
        if (! $piso) {
            throw new PlanoException('ERR_PISO_NO_ENCONTRADO', 'Ambiente no encontrado en esta sede.', 404);
        }

        return $piso;
    }

    private function mesa(string $localId, string $id): object
    {
        $mesa = DB::table('mesa')->where('local_id', $localId)->where('id', $id)->lockForUpdate()->first();
        if (! $mesa) {
            throw new PlanoException('ERR_MESA_NO_ENCONTRADA', 'Mesa no encontrada en esta sede.', 404);
        }

        return $mesa;
    }

    private function estaUnida(object $mesa): bool
    {
        return $mesa->mesa_principal_id !== null || DB::table('mesa')->where('local_id', $mesa->local_id)
            ->where('mesa_principal_id', $mesa->id)->where('estado', '!=', 'inactiva')->exists();
    }

    private function asegurarSinPedido(object $mesa): void
    {
        $raiz = $mesa->mesa_principal_id ?: $mesa->id;
        $ids = DB::table('mesa')->where('local_id', $mesa->local_id)->where(fn ($q) => $q->where('id', $raiz)->orWhere('mesa_principal_id', $raiz))->pluck('id');
        $pedido = DB::table('pedido as p')->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $mesa->local_id)->whereIn('p.mesa_id', $ids)->whereIn('p.estado', self::PEDIDOS_ABIERTOS)
            ->select('p.*', 'u.nombre as mozo_nombre')->orderBy('p.created_at')->first();
        if ($pedido) {
            $total = DB::table('pedido_item')->where('pedido_id', $pedido->id)->whereNotIn('estado', ['anulado', 'no_disponible'])
                ->selectRaw('COALESCE(SUM(cantidad * precio_unitario), 0) AS total')->first()->total;
            throw new PlanoException('ERR_MESA_CON_PEDIDOS_ACTIVOS', 'La mesa tiene una comanda abierta.', 409, [
                'mesa_id' => $mesa->id, 'pedido_id' => $pedido->id,
                'codigo_comanda' => 'COM-'.str_pad((string) $pedido->numero_comanda, 4, '0', STR_PAD_LEFT),
                'estado_pedido' => $pedido->estado, 'total_cuenta' => (float) $total, 'mozo_nombre' => $pedido->mozo_nombre,
            ]);
        }
    }

    private function detallePiso(string $localId, string $id): array
    {
        $piso = DB::table('piso')->where('local_id', $localId)->where('id', $id)->first();
        $mesas = DB::table('mesa')->where('local_id', $localId)->where('piso_id', $id)->where('estado', '!=', 'inactiva')->get();

        return [...(array) $piso, 'mesas' => $mesas->map(fn ($m) => (array) $m)->all(),
            'total_mesas' => $mesas->count(), 'capacidad_total_personas' => (int) $mesas->sum('capacidad')];
    }
}
