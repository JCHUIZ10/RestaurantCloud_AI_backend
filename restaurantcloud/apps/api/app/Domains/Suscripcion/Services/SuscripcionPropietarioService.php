<?php

namespace App\Domains\Suscripcion\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Lectura de "Mi suscripción" del propietario (CU-PROP-02): empresa, plan,
 * estado de cobro, consumo de cuotas e historial de pagos con su constancia.
 */
class SuscripcionPropietarioService
{
    /**
     * @return array<string, mixed>|null Estructura de SuscripcionDashboardDTO del frontend.
     */
    public function dashboard(string $empresaId): ?array
    {
        $empresa = DB::table('empresa')->where('id', $empresaId)->first();

        if (! $empresa) {
            return null;
        }

        $suscripcion = DB::table('suscripcion')->where('id', $empresa->ultima_suscripcion_id)->first()
            ?: DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at')->first();

        $plan = DB::table('plan')->where('id', $suscripcion->plan_id ?? $empresa->plan_id)->first();
        $proximoPlan = ! empty($suscripcion?->proximo_plan_id)
            ? DB::table('plan')->where('id', $suscripcion->proximo_plan_id)->first()
            : null;

        $estado = $suscripcion->estado ?? 'activa';

        return [
            'empresa' => [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
                'ruc' => $empresa->ruc,
                'tipo_identidad_fiscal' => $empresa->tipo_identidad_fiscal,
                'correo_contacto' => $empresa->correo_contacto,
                'telefono' => $empresa->telefono ?? '',
                'estado' => $empresa->estado,
            ],
            'plan' => [
                'id' => (int) $plan->id,
                'nombre' => $plan->nombre,
                'slug' => $plan->slug,
                'precio_mensual' => (float) $plan->precio_mensual,
                'precio_anual' => (float) $plan->precio_anual,
                'periodicidad' => $suscripcion->ciclo_facturacion ?? 'mensual',
                'proximo_cobro' => $this->iso($suscripcion->fecha_fin_periodo ?? null),
                'proximo_plan' => $proximoPlan ? [
                    'id' => (int) $proximoPlan->id,
                    'nombre' => $proximoPlan->nombre,
                    'precio_mensual' => (float) $proximoPlan->precio_mensual,
                    'fecha_efectiva' => $this->iso($suscripcion->fecha_fin_periodo),
                ] : null,
            ],
            'suscripcion_estado' => $estado,
            // La tarjeta vive en Stripe; se expondrá cuando se consulte el Customer.
            'metodo_pago' => null,
            'uso_recursos' => $this->usoRecursos($empresaId, $plan),
            'estado_cobro' => [
                'al_dia' => $estado === 'activa',
                'en_periodo_gracia' => $estado === 'en_gracia',
                'dias_gracia_restantes' => (int) ($suscripcion->dias_gracia_restantes ?? 5),
                'fecha_corte_gracia' => $this->iso($suscripcion->fecha_corte_gracia ?? null),
                'monto_pendiente' => $estado === 'en_gracia' ? (float) $plan->precio_mensual : 0.0,
                'ultimo_error_cobro' => $suscripcion->ultimo_error_cobro ?? null,
                'reintentos_fallidos' => (int) ($suscripcion->reintentos_stripe_conteo ?? 0),
            ],
            'historial_pagos' => $this->historialPagos($empresaId, $plan->nombre),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function usoRecursos(string $empresaId, object $plan): array
    {
        $locales = DB::table('local')->where('empresa_id', $empresaId)->where('estado', 'activo')->count();
        $mesas = DB::table('mesa')
            ->join('local', 'local.id', '=', 'mesa.local_id')
            ->where('local.empresa_id', $empresaId)
            ->count();
        $usuarios = DB::table('usuario')->where('empresa_id', $empresaId)->where('estado', 'activo')->count();

        return [
            'locales' => $this->metrica($locales, (int) $plan->max_locales),
            'mesas' => $this->metrica($mesas, (int) $plan->max_mesas),
            'usuarios_personal' => $this->metrica($usuarios, (int) $plan->max_usuarios),
            'incluye_reservas' => (bool) $plan->incluye_reservas,
            'incluye_reportes_avanzados' => (bool) $plan->incluye_reportes_avanzados,
            'incluye_asistente_ia' => (bool) $plan->incluye_asistente_ia,
            'incluye_prediccion_ia' => (bool) $plan->incluye_prediccion_ia,
        ];
    }

    /**
     * @return array{usados: int, maximo: int, porcentaje: int, limite_alcanzado: bool}
     */
    private function metrica(int $usados, int $maximo): array
    {
        return [
            'usados' => $usados,
            'maximo' => $maximo,
            'porcentaje' => $maximo > 0 ? (int) min(100, round($usados / $maximo * 100)) : 0,
            'limite_alcanzado' => $usados >= $maximo,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function historialPagos(string $empresaId, string $planActual): array
    {
        return DB::table('pago as pg')
            ->leftJoin('plan as p', 'p.id', '=', 'pg.plan_id')
            ->where('pg.empresa_id', $empresaId)
            ->orderByDesc('pg.fecha')
            ->select('pg.*', 'p.nombre as plan_nombre')
            ->get()
            ->map(fn ($pago) => [
                'id' => $pago->id,
                'numero_comprobante' => $pago->numero_recibo,
                'fecha' => $this->iso($pago->fecha),
                'monto' => (float) $pago->monto,
                'moneda' => 'PEN',
                'estado' => $pago->estado,
                'origen_pago' => $pago->origen_pago,
                'stripe_payment_id' => $pago->stripe_payment_id,
                'url_descarga_pdf' => $pago->estado === 'exitoso'
                    ? "/api/v1/propietario/suscripcion/pagos/{$pago->id}/recibo"
                    : null,
                'descripcion' => $pago->nota ?: 'Suscripción Plan '.($pago->plan_nombre ?? $planActual),
            ])
            ->all();
    }

    private function iso(mixed $fecha): ?string
    {
        return $fecha ? Carbon::parse($fecha)->toIso8601String() : null;
    }
}
