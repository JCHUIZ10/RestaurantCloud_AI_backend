<?php

namespace App\Domains\Mesas\Services;

use Illuminate\Support\Facades\DB;

class CuotaSalonService
{
    /** Solo devuelve agregados de la empresa; restaura el ámbito RLS de sede. */
    public function obtener(string $empresaId): array
    {
        if (DB::transactionLevel() === 0) {
            return DB::transaction(fn () => $this->obtener($empresaId));
        }

        $contexto = DB::selectOne("SELECT current_setting('app.current_local_id', true) AS local_id, current_setting('app.current_empresa_id', true) AS empresa_id");
        if ($contexto->empresa_id && $contexto->empresa_id !== $empresaId) {
            throw new \LogicException('El agregado debe pertenecer a la empresa autenticada.');
        }

        $plan = DB::table('empresa as e')->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)->select('p.nombre', 'p.max_mesas', 'p.max_pisos')->first();
        if (! $plan) {
            throw new \OutOfBoundsException('Empresa no encontrada.');
        }

        try {
            DB::select("SELECT set_config('app.current_local_id', '', true)");
            $mesas = DB::table('mesa as m')->join('local as l', 'l.id', '=', 'm.local_id')
                ->where('l.empresa_id', $empresaId)->where('m.estado', '!=', 'inactiva')->count();
            $pisos = DB::table('piso as p')->join('local as l', 'l.id', '=', 'p.local_id')
                ->where('l.empresa_id', $empresaId)->where('p.estado', 'activo')->count();
        } finally {
            DB::select("SELECT set_config('app.current_local_id', ?, true)", [$contexto->local_id ?? '']);
        }

        return [
            'plan_nombre' => $plan->nombre,
            'mesas_activas_empresa' => $mesas,
            'max_mesas_plan' => (int) $plan->max_mesas,
            'mesas_disponibles' => max(0, $plan->max_mesas - $mesas),
            'pisos_activos_empresa' => $pisos,
            'max_pisos_plan' => (int) $plan->max_pisos,
        ];
    }

    /** El llamador debe bloquear empresa antes de contar y crear recursos. */
    public function asegurar(string $empresaId, int $pisos, int $mesas): void
    {
        $cuota = $this->obtener($empresaId);
        if ($cuota['max_pisos_plan'] < $cuota['pisos_activos_empresa'] + $pisos) {
            throw new \OverflowException('Se alcanzó el límite de ambientes del plan de la empresa.');
        }
        if ($cuota['max_mesas_plan'] < $cuota['mesas_activas_empresa'] + $mesas) {
            throw new \OverflowException('No hay cupo de mesas suficiente en el plan de la empresa.');
        }
    }
}
