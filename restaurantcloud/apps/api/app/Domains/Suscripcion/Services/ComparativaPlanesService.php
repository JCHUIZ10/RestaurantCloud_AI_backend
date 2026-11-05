<?php

namespace App\Domains\Suscripcion\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Comparativa de planes de "Cambiar plan" (CU-PROP-03): catálogo contra el uso real de la empresa
 * y la acción que corresponde a cada plan (upgrade, downgrade o plan actual).
 */
class ComparativaPlanesService
{
    public function __construct(private UsoRecursosEmpresa $uso) {}

    /**
     * @return array<string, mixed>|null Estructura de PlanesComparativaResponseDTO del frontend.
     */
    public function comparativa(string $empresaId): ?array
    {
        $empresa = DB::table('empresa')->where('id', $empresaId)->first();

        if (! $empresa) {
            return null;
        }

        $suscripcion = DB::table('suscripcion')->where('id', $empresa->ultima_suscripcion_id)->first()
            ?: DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at')->first();

        $planActualId = (int) ($suscripcion->plan_id ?? $empresa->plan_id);
        $planActual = DB::table('plan')->where('id', $planActualId)->first();

        $uso = $this->uso->contar($empresaId);

        $planes = DB::table('plan')
            ->where(fn ($q) => $q->where('activo', true)->orWhere('id', $planActualId))
            ->orderBy('precio_mensual')
            ->get()
            ->map(fn ($plan) => $this->describirPlan($plan, $planActual, $empresaId))
            ->values()
            ->all();

        $cambio = $suscripcion ? CambioProgramado::de($suscripcion) : null;
        $proximoPlan = $cambio ? DB::table('plan')->where('id', $cambio['plan_id'])->first() : null;

        return [
            'suscripcion_estado' => $suscripcion->estado ?? 'activa',
            'plan_actual' => [
                'id' => $planActualId,
                'nombre' => $planActual->nombre,
                'precio_mensual' => (float) $planActual->precio_mensual,
                'precio_anual' => (float) $planActual->precio_anual,
                'periodicidad' => $suscripcion->ciclo_facturacion ?? 'mensual',
                'dias_restantes_ciclo' => PeriodoFacturacion::diasRestantes($suscripcion),
                'dias_totales_ciclo' => PeriodoFacturacion::diasTotales($suscripcion),
                'fecha_renovacion' => $this->iso($suscripcion->fecha_fin_periodo ?? null),
                'downgrade_programado' => $proximoPlan !== null,
                'proximo_plan' => $proximoPlan ? [
                    'id' => (int) $proximoPlan->id,
                    'nombre' => $proximoPlan->nombre,
                    'precio_mensual' => (float) $proximoPlan->precio_mensual,
                    'precio_anual' => (float) $proximoPlan->precio_anual,
                    'ciclo' => $cambio['ciclo'],
                    'fecha_efectiva' => $this->iso($suscripcion->fecha_fin_periodo),
                    'dias_restantes' => PeriodoFacturacion::diasRestantes($suscripcion),
                    'seleccion_guardada' => $cambio['seleccion'] !== null,
                    'recursos_excedidos' => $this->uso->excedidos($empresaId, $proximoPlan),
                ] : null,
            ],
            'recursos_en_uso' => [
                'locales_activos' => $uso['locales'],
                'por_local' => $uso['por_local'],
            ],
            'planes' => $planes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function describirPlan(object $plan, object $planActual, string $empresaId): array
    {
        $esActual = (int) $plan->id === (int) $planActual->id;
        $esUpgrade = (float) $plan->precio_mensual > (float) $planActual->precio_mensual;
        $tipo = $esActual ? 'actual' : ($esUpgrade ? 'upgrade' : 'downgrade');

        $excedidos = $tipo === 'downgrade' ? $this->uso->recursosExcedidos($empresaId, $plan) : [];

        return [
            'id' => (int) $plan->id,
            'nombre' => $plan->nombre,
            'slug' => $plan->slug,
            'descripcion' => $plan->descripcion ?? '',
            'precio_mensual' => (float) $plan->precio_mensual,
            'precio_anual' => (float) $plan->precio_anual,
            'limites' => [
                'max_locales' => (int) $plan->max_locales,
                'max_pisos' => (int) $plan->max_pisos,
                'max_mesas' => (int) $plan->max_mesas,
                'max_usuarios' => (int) $plan->max_usuarios,
                'incluye_reservas' => (bool) $plan->incluye_reservas,
                'incluye_reportes_avanzados' => (bool) $plan->incluye_reportes_avanzados,
                'incluye_asistente_ia' => (bool) $plan->incluye_asistente_ia,
                'incluye_prediccion_ia' => (bool) $plan->incluye_prediccion_ia,
            ],
            'es_plan_actual' => $esActual,
            'tipo_accion' => $tipo,
            'requiere_conciliacion' => $excedidos !== [],
            'recursos_excedidos' => $excedidos,
        ];
    }

    private function iso(mixed $fecha): ?string
    {
        return $fecha ? Carbon::parse($fecha)->toIso8601String() : null;
    }
}
