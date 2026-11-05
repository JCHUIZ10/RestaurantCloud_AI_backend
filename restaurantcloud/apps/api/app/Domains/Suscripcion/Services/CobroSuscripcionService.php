<?php

namespace App\Domains\Suscripcion\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Ciclo de cobro de la suscripción SaaS (CU-PROP-02): renovación, reintentos,
 * periodo de gracia, suspensión y regularización manual con la tarjeta guardada.
 *
 * El cobro es un PaymentIntent off-session (no se usa Stripe Billing), por lo que
 * este servicio es la única fuente de verdad del estado de cobro en la BD.
 */
class CobroSuscripcionService
{
    public const DIAS_GRACIA = 5;

    /** Reintentos automáticos (incluye el cobro original) antes de esperar al fin de la gracia. */
    public const MAX_INTENTOS_AUTOMATICOS = 3;

    public function __construct(
        private StripeGatewayService $stripe,
        private ReciboSuscripcionService $recibos,
        private ConciliacionRecursosService $conciliacion,
    ) {}

    /**
     * Recorre las suscripciones que requieren acción y las procesa.
     *
     * @return array{renovadas: int, fallidas: int, reintentos_exitosos: int, reintentos_fallidos: int, suspendidas: int, omitidas: int}
     */
    public function procesarVencimientos(bool $simular = false, ?callable $aviso = null): array
    {
        $aviso ??= static fn (string $mensaje) => null;
        $resumen = [
            'renovadas' => 0, 'fallidas' => 0,
            'reintentos_exitosos' => 0, 'reintentos_fallidos' => 0,
            'suspendidas' => 0, 'omitidas' => 0,
        ];

        // 1. Periodos vencidos: primer intento de renovación
        $vencidas = DB::table('suscripcion')
            ->where('estado', 'activa')
            ->where('fecha_fin_periodo', '<=', now())
            ->pluck('id');

        foreach ($vencidas as $id) {
            $aviso("Renovación pendiente: suscripción {$id}");

            if ($simular) {
                continue;
            }

            $resultado = $this->intentarCobro($id, ['activa'], true);
            $this->contar($resumen, $resultado, 'renovadas', 'fallidas');
        }

        // 2. Periodo de gracia: reintento diario o suspensión al agotarse
        $enGracia = DB::table('suscripcion')->where('estado', 'en_gracia')->get();

        foreach ($enGracia as $suscripcion) {
            $corte = $suscripcion->fecha_corte_gracia ? Carbon::parse($suscripcion->fecha_corte_gracia) : null;

            if ($corte === null || $corte->lte(now())) {
                $aviso("Gracia agotada: suscripción {$suscripcion->id} → suspender");

                if (! $simular) {
                    $this->suspender($suscripcion->id);
                    $resumen['suspendidas']++;
                }

                continue;
            }

            if (! $simular) {
                $this->sincronizarDiasGracia($suscripcion->id, $corte);
            }

            if ((int) $suscripcion->reintentos_stripe_conteo >= self::MAX_INTENTOS_AUTOMATICOS
                || ! $this->tocaReintento($suscripcion->id)) {
                $resumen['omitidas']++;

                continue;
            }

            $aviso("Reintento de cobro: suscripción {$suscripcion->id}");

            if ($simular) {
                continue;
            }

            $resultado = $this->intentarCobro($suscripcion->id, ['en_gracia'], false);
            $this->contar($resumen, $resultado, 'reintentos_exitosos', 'reintentos_fallidos');
        }

        return $resumen;
    }

    /**
     * Cobro inmediato del importe adeudado (botón "Pagar ahora" o tras cambiar la tarjeta).
     *
     * @return array{exito: bool, omitido: bool, pago_id: ?string, error: ?string}
     */
    public function regularizarPendiente(string $empresaId): array
    {
        $suscripcionId = $this->suscripcionPendiente($empresaId)?->id;

        if (! $suscripcionId) {
            return ['exito' => false, 'omitido' => true, 'pago_id' => null, 'error' => null];
        }

        return $this->intentarCobro($suscripcionId, ['en_gracia', 'suspendida', 'activa'], true);
    }

    /**
     * Suscripción de la empresa con un cobro por regularizar, o null si está al día.
     */
    public function suscripcionPendiente(string $empresaId): ?object
    {
        $suscripcion = DB::table('suscripcion')
            ->where('empresa_id', $empresaId)
            ->latest('created_at')
            ->first();

        if (! $suscripcion) {
            return null;
        }

        $vencida = $suscripcion->estado === 'activa'
            && Carbon::parse($suscripcion->fecha_fin_periodo)->lte(now());

        return in_array($suscripcion->estado, ['en_gracia', 'suspendida'], true) || $vencida
            ? $suscripcion
            : null;
    }

    public function suspender(string $suscripcionId): void
    {
        DB::transaction(function () use ($suscripcionId): void {
            $suscripcion = DB::table('suscripcion')->where('id', $suscripcionId)->lockForUpdate()->first();

            if (! $suscripcion || $suscripcion->estado === 'suspendida') {
                return;
            }

            DB::table('suscripcion')->where('id', $suscripcionId)->update([
                'estado' => 'suspendida',
                'dias_gracia_restantes' => 0,
                'updated_at' => now(),
            ]);
            DB::table('empresa')->where('id', $suscripcion->empresa_id)->update([
                'estado' => 'suspendida',
                'updated_at' => now(),
            ]);

            self::olvidarEstadoEmpresa($suscripcion->empresa_id);
            Log::warning("Empresa {$suscripcion->empresa_id} suspendida por falta de pago (suscripción {$suscripcionId}).");
        });
    }

    /**
     * Estado de la empresa cacheado por pocos segundos para el chequeo de suspensión en cada request.
     */
    public static function estadoEmpresa(string $empresaId): ?string
    {
        return Cache::remember(
            "empresa:estado:{$empresaId}",
            30,
            fn () => DB::table('empresa')->where('id', $empresaId)->value('estado')
        );
    }

    public static function olvidarEstadoEmpresa(string $empresaId): void
    {
        Cache::forget("empresa:estado:{$empresaId}");
    }

    /**
     * Intenta cobrar una suscripción bajo bloqueo de fila. Registra siempre el pago
     * (exitoso o fallido) y actualiza el estado de cobro.
     *
     * @param  list<string>  $estadosValidos  Estados desde los que se permite cobrar.
     * @return array{exito: bool, omitido: bool, pago_id: ?string, error: ?string}
     */
    private function intentarCobro(string $suscripcionId, array $estadosValidos, bool $exigirVencida): array
    {
        $resultado = DB::transaction(function () use ($suscripcionId, $estadosValidos, $exigirVencida): array {
            $suscripcion = DB::table('suscripcion')->where('id', $suscripcionId)->lockForUpdate()->first();

            if (! $suscripcion
                || ! in_array($suscripcion->estado, $estadosValidos, true)
                || ($exigirVencida && $suscripcion->estado === 'activa' && Carbon::parse($suscripcion->fecha_fin_periodo)->gt(now()))) {
                return ['exito' => false, 'omitido' => true, 'pago_id' => null, 'error' => null];
            }

            $empresa = DB::table('empresa')->where('id', $suscripcion->empresa_id)->first();
            // Con un cambio programado se cobra el plan y ciclo nuevos; solo se aplica si el cobro prospera
            $cambio = CambioProgramado::de($suscripcion);
            $plan = DB::table('plan')->where('id', $cambio['plan_id'] ?? $suscripcion->plan_id)->first();
            $ciclo = $cambio['ciclo'] ?? $suscripcion->ciclo_facturacion;
            $monto = (float) ($ciclo === 'anual' ? $plan->precio_anual : $plan->precio_mensual);
            $descripcion = "RestaurantCloud - Renovación {$plan->nombre} ({$empresa->razon_social})";
            $llave = sprintf(
                'renovacion-%s-%d-%d-%d-%s',
                $suscripcion->id,
                Carbon::parse($suscripcion->fecha_fin_periodo)->timestamp,
                (int) $suscripcion->reintentos_stripe_conteo,
                $plan->id,
                $ciclo
            );

            $stripePaymentId = null;
            $error = null;

            if (empty($empresa->stripe_customer_id)) {
                $error = 'La empresa no tiene una tarjeta registrada para el cobro.';
            } else {
                try {
                    $intento = $this->stripe->cobrarRenovacion($empresa->stripe_customer_id, $monto, $descripcion, $llave);
                    $stripePaymentId = $intento->id;

                    if ($intento->status !== 'succeeded') {
                        $error = $intento->status === 'requires_action'
                            ? 'El banco requiere autenticación adicional para esta tarjeta.'
                            : "El cobro quedó en estado {$intento->status}.";
                    }
                } catch (\Throwable $e) {
                    $error = $e->getMessage();
                }
            }

            $pagoId = (string) Str::uuid();

            if ($error === null) {
                $this->registrarCobroExitoso($suscripcion, $empresa, $plan, $ciclo, $cambio, $pagoId, $monto, $stripePaymentId);
            } else {
                $this->registrarCobroFallido($suscripcion, $plan, $pagoId, $monto, $stripePaymentId, $error);
            }

            return ['exito' => $error === null, 'omitido' => false, 'pago_id' => $pagoId, 'error' => $error];
        });

        if ($resultado['exito']) {
            $this->generarConstancia($resultado['pago_id']);
        }

        return $resultado;
    }

    /**
     * @param  array{plan_id: int, ciclo: string, seleccion: array<string, list<string>>|null}|null  $cambio
     */
    private function registrarCobroExitoso(object $suscripcion, object $empresa, object $plan, string $ciclo, ?array $cambio, string $pagoId, float $monto, ?string $stripePaymentId): void
    {
        // Continuidad del periodo si estaba al día; si venía de gracia/suspensión, desde hoy.
        $base = $suscripcion->estado === 'activa'
            ? Carbon::parse($suscripcion->fecha_fin_periodo)
            : now();
        $finPeriodo = $ciclo === 'anual'
            ? $base->copy()->addYearNoOverflow()
            : $base->copy()->addMonthNoOverflow();

        DB::table('pago')->insert([
            'id' => $pagoId,
            'empresa_id' => $suscripcion->empresa_id,
            'suscripcion_id' => $suscripcion->id,
            'plan_id' => $plan->id,
            'monto' => $monto,
            'fecha' => now(),
            'estado' => 'exitoso',
            'origen_pago' => 'stripe',
            'stripe_payment_id' => $stripePaymentId,
            'nota' => $cambio ? "Renovación con cambio a Plan {$plan->nombre} ({$ciclo})" : 'Renovación de suscripción',
            'created_at' => now(),
        ]);

        if ($cambio) {
            // El cobro del plan nuevo prosperó: ahora sí rigen sus límites y lo que sobra pasa a inactivo
            $this->conciliacion->aplicar($suscripcion->empresa_id, $plan, $cambio['seleccion']);

            DB::table('suscripcion')->where('id', $suscripcion->id)->update([
                'plan_id' => $plan->id,
                'ciclo_facturacion' => $ciclo,
                'proximo_plan_id' => null,
                'config_downgrade' => null,
                'recursos_conciliados' => false,
            ]);
            DB::table('empresa')->where('id', $empresa->id)->update(['plan_id' => $plan->id, 'updated_at' => now()]);
        }

        DB::table('suscripcion')->where('id', $suscripcion->id)->update([
            'estado' => 'activa',
            'fecha_fin_periodo' => $finPeriodo,
            'dias_gracia_restantes' => self::DIAS_GRACIA,
            'fecha_corte_gracia' => null,
            'ultimo_error_cobro' => null,
            'reintentos_stripe_conteo' => 0,
            'updated_at' => now(),
        ]);

        if ($empresa->estado !== 'activa') {
            DB::table('empresa')->where('id', $empresa->id)->update(['estado' => 'activa', 'updated_at' => now()]);
            self::olvidarEstadoEmpresa($empresa->id);
        }
    }

    private function registrarCobroFallido(object $suscripcion, object $plan, string $pagoId, float $monto, ?string $stripePaymentId, string $error): void
    {
        $corte = $suscripcion->fecha_corte_gracia
            ? Carbon::parse($suscripcion->fecha_corte_gracia)
            : now()->addDays(self::DIAS_GRACIA);

        DB::table('pago')->insert([
            'id' => $pagoId,
            'empresa_id' => $suscripcion->empresa_id,
            'suscripcion_id' => $suscripcion->id,
            'plan_id' => $plan->id,
            'monto' => $monto,
            'fecha' => now(),
            'estado' => 'fallido',
            'origen_pago' => 'stripe',
            'stripe_payment_id' => $stripePaymentId,
            'nota' => 'Cobro rechazado: '.Str::limit($error, 200),
            'created_at' => now(),
        ]);

        // Una suscripción ya suspendida sigue suspendida aunque falle otro intento manual.
        $estado = $suscripcion->estado === 'suspendida' ? 'suspendida' : 'en_gracia';

        DB::table('suscripcion')->where('id', $suscripcion->id)->update([
            'estado' => $estado,
            'fecha_corte_gracia' => $corte,
            'dias_gracia_restantes' => $estado === 'suspendida' ? 0 : $this->diasGracia($corte),
            'ultimo_error_cobro' => Str::limit($error, 250),
            'reintentos_stripe_conteo' => (int) $suscripcion->reintentos_stripe_conteo + 1,
            'updated_at' => now(),
        ]);

        Log::warning("Cobro rechazado para la suscripción {$suscripcion->id}: {$error}");
    }

    private function generarConstancia(string $pagoId): void
    {
        try {
            $this->recibos->generarPdf($pagoId);
        } catch (\Throwable $e) {
            // El pago ya está confirmado; la constancia se genera bajo demanda al descargarla.
            Log::error("No se pudo generar la constancia del pago {$pagoId}: {$e->getMessage()}");
        }
    }

    private function tocaReintento(string $suscripcionId): bool
    {
        $ultimo = DB::table('pago')
            ->where('suscripcion_id', $suscripcionId)
            ->where('estado', 'fallido')
            ->max('fecha');

        return $ultimo === null || Carbon::parse($ultimo)->lte(now()->subHours(20));
    }

    private function sincronizarDiasGracia(string $suscripcionId, Carbon $corte): void
    {
        DB::table('suscripcion')->where('id', $suscripcionId)->update([
            'dias_gracia_restantes' => $this->diasGracia($corte),
        ]);
    }

    private function diasGracia(Carbon $corte): int
    {
        return (int) max(0, min(self::DIAS_GRACIA, ceil(now()->floatDiffInDays($corte, false))));
    }

    /**
     * @param  array<string, int>  $resumen
     * @param  array{exito: bool, omitido: bool}  $resultado
     */
    private function contar(array &$resumen, array $resultado, string $claveExito, string $claveFallo): void
    {
        if ($resultado['omitido']) {
            $resumen['omitidas']++;
        } elseif ($resultado['exito']) {
            $resumen[$claveExito]++;
        } else {
            $resumen[$claveFallo]++;
        }
    }
}
