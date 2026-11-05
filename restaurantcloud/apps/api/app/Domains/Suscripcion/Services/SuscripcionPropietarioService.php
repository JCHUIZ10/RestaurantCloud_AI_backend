<?php

namespace App\Domains\Suscripcion\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Lectura de "Mi suscripción" del propietario (CU-PROP-02): empresa, plan,
 * estado de cobro, consumo de cuotas e historial de pagos con su constancia.
 */
class SuscripcionPropietarioService
{
    public function __construct(private StripeGatewayService $stripe, private UsoRecursosEmpresa $uso) {}

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
        $cambio = $suscripcion ? CambioProgramado::de($suscripcion) : null;
        $proximoPlan = $cambio ? DB::table('plan')->where('id', $cambio['plan_id'])->first() : null;

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
                    'ciclo' => $cambio['ciclo'],
                    'precio' => (float) ($cambio['ciclo'] === 'anual' ? $proximoPlan->precio_anual : $proximoPlan->precio_mensual),
                    'fecha_efectiva' => $this->iso($suscripcion->fecha_fin_periodo),
                    'dias_restantes' => PeriodoFacturacion::diasRestantes($suscripcion),
                    'seleccion_guardada' => $cambio['seleccion'] !== null,
                    'hay_excedentes' => $this->uso->supera($empresaId, $proximoPlan),
                ] : null,
            ],
            'suscripcion_estado' => $estado,
            'metodo_pago' => $this->metodoPago($empresa, $estado),
            'uso_recursos' => $this->usoRecursos($empresaId, $plan),
            'estado_cobro' => $this->estadoCobro($suscripcion, $plan, $estado),
            'historial_pagos' => $this->historialPagos($empresaId, $plan->nombre),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function estadoCobro(?object $suscripcion, object $plan, string $estado): array
    {
        $administrativa = $suscripcion !== null && CobroSuscripcionService::haySuspensionAdministrativa($suscripcion->empresa_id);
        $pendiente = in_array($estado, ['en_gracia', 'suspendida'], true) && ! $administrativa;
        $corte = $suscripcion?->fecha_corte_gracia ? Carbon::parse($suscripcion->fecha_corte_gracia) : null;
        $cambio = $suscripcion ? CambioProgramado::de($suscripcion) : null;
        $planCobro = $cambio ? (DB::table('plan')->where('id', $cambio['plan_id'])->first() ?: $plan) : $plan;
        $importe = ($cambio['ciclo'] ?? $suscripcion->ciclo_facturacion ?? 'mensual') === 'anual'
            ? (float) $planCobro->precio_anual
            : (float) $planCobro->precio_mensual;

        return [
            'al_dia' => $estado === 'activa',
            'en_periodo_gracia' => $estado === 'en_gracia',
            'dias_gracia_restantes' => $estado === 'en_gracia' && $corte
                ? (int) max(0, min(5, ceil(now()->floatDiffInDays($corte, false))))
                : 0,
            'fecha_corte_gracia' => $this->iso($corte),
            'monto_pendiente' => $pendiente ? $importe : 0.0,
            'ultimo_error_cobro' => $suscripcion->ultimo_error_cobro ?? null,
            'reintentos_fallidos' => (int) ($suscripcion->reintentos_stripe_conteo ?? 0),
            'suspension_administrativa' => $administrativa,
        ];
    }

    /**
     * Tarjeta predeterminada en Stripe; null si la empresa no paga con tarjeta o Stripe no responde.
     *
     * @return array<string, mixed>|null
     */
    public function metodoPago(object $empresa, string $estadoSuscripcion): ?array
    {
        if (empty($empresa->stripe_customer_id)) {
            return null;
        }

        try {
            $tarjeta = $this->stripe->obtenerTarjetaPredeterminada($empresa->stripe_customer_id);
        } catch (\Throwable $e) {
            Log::warning("No se pudo consultar la tarjeta de Stripe de la empresa {$empresa->id}: {$e->getMessage()}");

            return null;
        }

        if (! $tarjeta) {
            return null;
        }

        $marca = in_array($tarjeta['marca'], ['visa', 'mastercard', 'amex'], true) ? $tarjeta['marca'] : 'otro';
        $venceEn = Carbon::create($tarjeta['exp_ano'], $tarjeta['exp_mes'], 1)->endOfMonth();

        return [
            'marca' => $marca,
            'ultimos_4' => $tarjeta['ultimos_4'],
            'exp_mes' => $tarjeta['exp_mes'],
            'exp_ano' => $tarjeta['exp_ano'],
            'titular' => $tarjeta['titular'],
            'proximo_a_vencer' => $venceEn->lte(now()->addDays(30)),
            'estado_cobro_tarjeta' => in_array($estadoSuscripcion, ['en_gracia', 'suspendida'], true)
                && ! CobroSuscripcionService::haySuspensionAdministrativa($empresa->id) ? 'rechazado' : 'al_dia',
        ];
    }

    /**
     * Los locales se miden por empresa; pisos, mesas y personal por local, por eso las métricas
     * globales muestran el local más cargado y `por_local` el detalle de cada sede.
     *
     * @return array<string, mixed>
     */
    private function usoRecursos(string $empresaId, object $plan): array
    {
        $uso = $this->uso->contar($empresaId);
        $porLocal = collect($uso['por_local']);
        $maxPisos = (int) $plan->max_pisos;
        $maxMesas = (int) $plan->max_mesas;
        $maxUsuarios = (int) $plan->max_usuarios;

        return [
            'locales' => $this->metrica($uso['locales'], (int) $plan->max_locales),
            'pisos' => $this->metrica((int) $porLocal->max('pisos'), $maxPisos),
            'mesas' => $this->metrica((int) $porLocal->max('mesas'), $maxMesas),
            'usuarios_personal' => $this->metrica((int) $porLocal->max('usuarios'), $maxUsuarios),
            'por_local' => $porLocal->map(fn (array $local): array => [
                'local_id' => $local['local_id'],
                'nombre' => $local['nombre'],
                'pisos' => $this->metrica($local['pisos'], $maxPisos),
                'mesas' => $this->metrica($local['mesas'], $maxMesas),
                'usuarios_personal' => $this->metrica($local['usuarios'], $maxUsuarios),
            ])->all(),
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
