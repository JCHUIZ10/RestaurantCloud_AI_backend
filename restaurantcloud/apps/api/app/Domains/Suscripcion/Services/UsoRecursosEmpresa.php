<?php

namespace App\Domains\Suscripcion\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Consumo de la empresa frente a los límites de su plan: los locales se miden por
 * empresa y los pisos, mesas y personal por cada local. El propietario no cuenta y
 * un administrador sin sede asignada tampoco ocupa cupo de ningún local.
 */
class UsoRecursosEmpresa
{
    /**
     * @return array{locales: int, por_local: list<array{local_id: string, nombre: string, pisos: int, mesas: int, usuarios: int}>}
     */
    public function contar(string $empresaId): array
    {
        $locales = DB::table('local')->where('empresa_id', $empresaId)->where('estado', 'activo')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'nombre']);
        $ids = $locales->pluck('id')->all();

        $pisos = $this->agrupado(DB::table('piso')->whereIn('local_id', $ids)->where('estado', 'activo'));
        $mesas = $this->agrupado(DB::table('mesa')->whereIn('local_id', $ids)->where('estado', '!=', 'inactiva'));
        $usuarios = $this->agrupado(
            DB::table('usuario')->where('empresa_id', $empresaId)->whereIn('local_id', $ids)
                ->where('estado', 'activo')->where('rol', '!=', 'propietario')
        );

        return [
            'locales' => $locales->count(),
            'por_local' => $locales->map(fn ($local): array => [
                'local_id' => $local->id,
                'nombre' => $local->nombre,
                'pisos' => (int) ($pisos[$local->id] ?? 0),
                'mesas' => (int) ($mesas[$local->id] ?? 0),
                'usuarios' => (int) ($usuarios[$local->id] ?? 0),
            ])->all(),
        ];
    }

    /**
     * Límites que el plan indicado no admite con el uso de hoy; los de pisos, mesas y
     * usuarios se reportan por cada local que los supera.
     *
     * @return list<array{recurso: string, usados: int, maximo: int, local_id?: string, local_nombre?: string}>
     */
    public function excedidos(string $empresaId, object $plan): array
    {
        $uso = $this->contar($empresaId);
        $excedidos = [];

        if ($uso['locales'] > (int) $plan->max_locales) {
            $excedidos[] = ['recurso' => 'locales', 'usados' => $uso['locales'], 'maximo' => (int) $plan->max_locales];
        }

        $maximos = ['pisos' => (int) $plan->max_pisos, 'mesas' => (int) $plan->max_mesas, 'usuarios' => (int) $plan->max_usuarios];
        foreach ($uso['por_local'] as $local) {
            foreach ($maximos as $recurso => $maximo) {
                if ($local[$recurso] > $maximo) {
                    $excedidos[] = [
                        'recurso' => $recurso,
                        'usados' => $local[$recurso],
                        'maximo' => $maximo,
                        'local_id' => $local['local_id'],
                        'local_nombre' => $local['nombre'],
                    ];
                }
            }
        }

        return $excedidos;
    }

    public function supera(string $empresaId, object $plan): bool
    {
        return $this->excedidos($empresaId, $plan) !== [];
    }

    /**
     * @return list<string> Recursos distintos que el plan no admite, sin repetir por local.
     */
    public function recursosExcedidos(string $empresaId, object $plan): array
    {
        return array_values(array_unique(array_column($this->excedidos($empresaId, $plan), 'recurso')));
    }

    /** Administradores de local activos o invitados que todavía no tienen sede. */
    public function administradoresSinSede(string $empresaId): int
    {
        return DB::table('usuario')->where('empresa_id', $empresaId)->where('rol', 'admin_local')
            ->whereNull('local_id')->whereIn('estado', ['activo', 'pendiente_activacion'])->count();
    }

    /** Cantidad de personal activo del local, sin contar al propietario. */
    public function personalDelLocal(string $localId): int
    {
        return DB::table('usuario')->where('local_id', $localId)->where('estado', 'activo')
            ->where('rol', '!=', 'propietario')->count();
    }

    /**
     * @return array<string, int>
     */
    private function agrupado(Builder $consulta): array
    {
        return $consulta->groupBy('local_id')->selectRaw('local_id, COUNT(*)::int AS total')->pluck('total', 'local_id')->all();
    }
}
