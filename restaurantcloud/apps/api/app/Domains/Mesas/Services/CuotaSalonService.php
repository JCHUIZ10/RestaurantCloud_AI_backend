<?php

namespace App\Domains\Mesas\Services;

use Illuminate\Support\Facades\DB;

/**
 * Cuota de ambientes y mesas del plan. El límite es por local: cada sede se mide por separado.
 */
class CuotaSalonService
{
    /** Agregados de una sede frente a los límites por local del plan de la empresa. */
    public function obtener(string $empresaId, string $localId): array
    {
        $plan = DB::table('empresa as e')->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)->select('p.nombre', 'p.max_mesas', 'p.max_pisos')->first();
        if (! $plan) {
            throw new \OutOfBoundsException('Empresa no encontrada.');
        }

        $mesas = DB::table('mesa')->where('local_id', $localId)->where('estado', '!=', 'inactiva')->count();
        $pisos = DB::table('piso')->where('local_id', $localId)->where('estado', 'activo')->count();

        return [
            'plan_nombre' => $plan->nombre,
            'mesas_activas_local' => $mesas,
            'max_mesas_plan' => (int) $plan->max_mesas,
            'mesas_disponibles' => max(0, $plan->max_mesas - $mesas),
            'pisos_activos_local' => $pisos,
            'max_pisos_plan' => (int) $plan->max_pisos,
        ];
    }

    /** El llamador debe bloquear la sede antes de contar y crear recursos. */
    public function asegurar(string $empresaId, string $localId, int $pisos, int $mesas): void
    {
        $cuota = $this->obtener($empresaId, $localId);
        if ($cuota['max_pisos_plan'] < $cuota['pisos_activos_local'] + $pisos) {
            throw new \OverflowException('Se alcanzó el límite de ambientes por sede del plan.');
        }
        if ($cuota['max_mesas_plan'] < $cuota['mesas_activas_local'] + $mesas) {
            throw new \OverflowException('No hay cupo de mesas suficiente en esta sede según el plan.');
        }
    }

    /** Una sede nueva nace vacía: su plantilla inicial debe caber en los límites por local. */
    public function asegurarPlantilla(string $empresaId, int $pisos, int $mesas): void
    {
        $plan = DB::table('empresa as e')->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $empresaId)->select('p.max_mesas', 'p.max_pisos')->first();
        if (! $plan) {
            throw new \OutOfBoundsException('Empresa no encontrada.');
        }
        if ($pisos > (int) $plan->max_pisos) {
            throw new \OverflowException('La sede inicial supera el límite de ambientes por sede del plan.');
        }
        if ($mesas > (int) $plan->max_mesas) {
            throw new \OverflowException('La sede inicial supera el límite de mesas por sede del plan.');
        }
    }
}
