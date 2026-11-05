<?php

namespace App\Domains\Suscripcion\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Ajusta los recursos de una empresa a los límites de un plan inferior sin borrar nada:
 * lo que sobra pasa a inactivo y el historial (ventas, comandas, pedidos) queda intacto.
 *
 * Los locales se recortan a nivel empresa; pisos, mesas y personal, dentro de cada local que se
 * conserva. En cada nivel se conserva primero lo que el propietario eligió y el cupo restante se
 * completa por antigüedad. La jerarquía es local → piso → mesa: nada activo cuelga de algo inactivo.
 * El propietario y los administradores sin sede no se tocan; el administrador de cada local se conserva primero.
 */
class ConciliacionRecursosService
{
    /**
     * @param  array{locales_ids?: list<string>, pisos_ids?: list<string>, mesas_ids?: list<string>, usuarios_ids?: list<string>}|null  $seleccion
     * @return array{locales: int, pisos: int, mesas: int, usuarios: int} Cantidad desactivada por recurso
     */
    public function aplicar(string $empresaId, object $plan, ?array $seleccion = null): array
    {
        $estado = $this->calcular($empresaId, $plan, $seleccion);

        $desactivados = [
            'locales' => $this->desactivar('local', 'id', $estado['locales_activos'], $estado['conservados']['locales_ids'], 'inactivo'),
            'pisos' => $this->desactivar('piso', 'id', $estado['pisos_activos'], $estado['conservados']['pisos_ids'], 'inactivo'),
            'mesas' => $this->desactivar('mesa', 'id', $estado['mesas_activas'], $estado['conservados']['mesas_ids'], 'inactiva'),
            'usuarios' => $this->desactivar('usuario', 'id', $estado['usuarios_activos'], $estado['conservados']['usuarios_ids'], 'inactivo'),
        ];

        Log::info("Conciliación de recursos de la empresa {$empresaId} al plan {$plan->nombre}: ".json_encode($desactivados));

        return $desactivados;
    }

    /**
     * Lo que quedaría activo con el plan indicado, sin modificar nada: es lo que el asistente
     * "qué conservar" muestra de entrada y lo que `aplicar` ejecuta al renovar.
     *
     * @param  array{locales_ids?: list<string>, pisos_ids?: list<string>, mesas_ids?: list<string>, usuarios_ids?: list<string>}|null  $seleccion
     * @return array{locales_ids: list<string>, pisos_ids: list<string>, mesas_ids: list<string>, usuarios_ids: list<string>}
     */
    public function conservados(string $empresaId, object $plan, ?array $seleccion = null): array
    {
        return $this->calcular($empresaId, $plan, $seleccion)['conservados'];
    }

    /**
     * @param  array<string, list<string>>|null  $seleccion
     * @return array{locales_activos: list<string>, pisos_activos: list<string>, mesas_activas: list<string>, usuarios_activos: list<string>, conservados: array{locales_ids: list<string>, pisos_ids: list<string>, mesas_ids: list<string>, usuarios_ids: list<string>}}
     */
    private function calcular(string $empresaId, object $plan, ?array $seleccion): array
    {
        $seleccion ??= [];

        $localesActivos = DB::table('local')->where('empresa_id', $empresaId)->where('estado', 'activo')
            ->orderBy('created_at')->orderBy('id')->pluck('id')->all();
        $localesConservados = $this->conservar($localesActivos, $seleccion['locales_ids'] ?? [], (int) $plan->max_locales);

        $pisosActivos = DB::table('piso')->whereIn('local_id', $localesActivos)->where('estado', 'activo')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'local_id']);
        $mesasActivas = DB::table('mesa')->whereIn('local_id', $localesActivos)->where('estado', '!=', 'inactiva')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'local_id', 'piso_id']);
        $usuarios = DB::table('usuario')->where('empresa_id', $empresaId)->whereIn('local_id', $localesActivos)
            ->where('estado', 'activo')->where('rol', '!=', 'propietario')
            ->orderBy('created_at')->orderBy('id')->get(['id', 'local_id', 'rol']);

        $pisosConservados = [];
        $mesasConservadas = [];
        $usuariosConservados = [];

        foreach ($localesConservados as $localId) {
            $pisosLocal = $this->conservar(
                $pisosActivos->where('local_id', $localId)->pluck('id')->all(),
                $seleccion['pisos_ids'] ?? [],
                (int) $plan->max_pisos
            );
            $mesasLocal = $this->conservar(
                $mesasActivas->where('local_id', $localId)->whereIn('piso_id', $pisosLocal)->pluck('id')->all(),
                $seleccion['mesas_ids'] ?? [],
                (int) $plan->max_mesas
            );
            $personalLocal = $usuarios->where('local_id', $localId);
            $usuariosLocal = $this->conservar(
                $personalLocal->pluck('id')->all(),
                array_merge($personalLocal->where('rol', 'admin_local')->pluck('id')->all(), $seleccion['usuarios_ids'] ?? []),
                (int) $plan->max_usuarios
            );

            array_push($pisosConservados, ...$pisosLocal);
            array_push($mesasConservadas, ...$mesasLocal);
            array_push($usuariosConservados, ...$usuariosLocal);
        }

        return [
            'locales_activos' => $localesActivos,
            'pisos_activos' => $pisosActivos->pluck('id')->all(),
            'mesas_activas' => $mesasActivas->pluck('id')->all(),
            'usuarios_activos' => $usuarios->pluck('id')->all(),
            'conservados' => [
                'locales_ids' => $localesConservados,
                'pisos_ids' => $pisosConservados,
                'mesas_ids' => $mesasConservadas,
                'usuarios_ids' => $usuariosConservados,
            ],
        ];
    }

    /**
     * Ids que se conservan: primero los elegidos (si siguen siendo elegibles) y luego el resto por antigüedad.
     *
     * @param  list<string>  $elegibles  Ordenados por antigüedad
     * @param  list<string>  $elegidos
     * @return list<string>
     */
    private function conservar(array $elegibles, array $elegidos, int $maximo): array
    {
        $primero = array_values(array_intersect($elegidos, $elegibles));
        $resto = array_values(array_diff($elegibles, $primero));

        return array_slice(array_merge($primero, $resto), 0, max(0, $maximo));
    }

    /**
     * @param  list<string>  $todos
     * @param  list<string>  $conservados
     */
    private function desactivar(string $tabla, string $columna, array $todos, array $conservados, string $estado): int
    {
        $sobran = array_values(array_diff($todos, $conservados));

        if ($sobran === []) {
            return 0;
        }

        return DB::table($tabla)->whereIn($columna, $sobran)->update(['estado' => $estado, 'updated_at' => now()]);
    }
}
