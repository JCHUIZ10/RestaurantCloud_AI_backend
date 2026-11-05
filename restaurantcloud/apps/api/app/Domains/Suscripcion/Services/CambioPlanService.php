<?php

namespace App\Domains\Suscripcion\Services;

use App\Domains\Suscripcion\Exceptions\CambioPlanException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Cambio de plan del propietario (CU-PROP-03). Upgrade inmediato con prorrateo propio:
 * el cobro es un PaymentIntent off-session, así que el crédito y el costo proporcional
 * se calculan aquí y no con Stripe Billing.
 */
class CambioPlanService
{
    /** Importe mínimo que Stripe acepta cobrar en PEN; por debajo el upgrade se activa sin cobro. */
    public const COBRO_MINIMO = 2.00;

    private const FUNCIONES = [
        'incluye_reservas' => 'Módulo de reservas',
        'incluye_reportes_avanzados' => 'Reportes avanzados',
        'incluye_asistente_ia' => 'Asistente IA de salón',
        'incluye_prediccion_ia' => 'Predicción de demanda IA',
    ];

    public function __construct(
        private StripeGatewayService $stripe,
        private ReciboSuscripcionService $recibos,
        private SuscripcionPropietarioService $suscripciones,
        private UsoRecursosEmpresa $uso,
    ) {}

    /**
     * Desglose del prorrateo que se cobraría hoy (no modifica nada).
     *
     * @return array<string, mixed>
     */
    public function simularUpgrade(string $empresaId, int $nuevoPlanId): array
    {
        [$empresa, $suscripcion, $actual, $nuevo] = $this->cargar($empresaId, $nuevoPlanId);
        $calculo = $this->calcular($suscripcion, $actual, $nuevo);

        return [
            'plan_origen' => $actual->nombre,
            'plan_destino' => $nuevo->nombre,
            'periodicidad' => $suscripcion->ciclo_facturacion,
            'dias_restantes_ciclo' => PeriodoFacturacion::diasRestantes($suscripcion),
            'dias_totales_ciclo' => PeriodoFacturacion::diasTotales($suscripcion),
            'fecha_proximo_ciclo' => Carbon::parse($suscripcion->fecha_fin_periodo)->toIso8601String(),
            'precio_actual' => $calculo['precio_actual'],
            'credito_plan_actual' => $calculo['credito'],
            'costo_nuevo_plan_proporcional' => $calculo['costo'],
            'monto_neto_a_pagar_hoy' => $calculo['cobro'],
            'requiere_cobro' => $calculo['cobro'] > 0,
            'moneda' => 'PEN',
            'nuevo_monto_recurrente' => $calculo['precio_nuevo'],
            'metodo_pago_defecto' => $this->suscripciones->metodoPago($empresa, $suscripcion->estado),
        ];
    }

    /**
     * Cobra el prorrateo con la tarjeta guardada y cambia el plan. Todo o nada: si el banco
     * rechaza el cobro no se modifica la suscripción.
     *
     * @return array<string, mixed>
     */
    public function ejecutarUpgrade(string $empresaId, int $nuevoPlanId): array
    {
        $resultado = DB::transaction(function () use ($empresaId, $nuevoPlanId): array {
            // Bajo bloqueo de fila para que dos clics no cobren dos veces
            $suscripcionId = DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at')->value('id');
            DB::table('suscripcion')->where('id', $suscripcionId)->lockForUpdate()->first();

            [$empresa, $suscripcion, $actual, $nuevo] = $this->cargar($empresaId, $nuevoPlanId);
            $calculo = $this->calcular($suscripcion, $actual, $nuevo);
            $pagoId = null;

            if ($calculo['cobro'] > 0) {
                if ($this->suscripciones->metodoPago($empresa, $suscripcion->estado) === null) {
                    throw new CambioPlanException('SIN_METODO_PAGO', 'Registra una tarjeta en "Mi suscripción" antes de mejorar tu plan.', 422);
                }

                $stripePaymentId = $this->cobrar($empresa, $suscripcion, $nuevo, $calculo['cobro']);

                $pagoId = (string) Str::uuid();
                DB::table('pago')->insert([
                    'id' => $pagoId,
                    'empresa_id' => $empresaId,
                    'suscripcion_id' => $suscripcion->id,
                    'plan_id' => $nuevo->id,
                    'monto' => $calculo['cobro'],
                    'fecha' => now(),
                    'estado' => 'exitoso',
                    'origen_pago' => 'stripe',
                    'stripe_payment_id' => $stripePaymentId,
                    'nota' => "Upgrade de Plan {$actual->nombre} a Plan {$nuevo->nombre} (prorrateo)",
                    'created_at' => now(),
                ]);
            }

            DB::table('suscripcion')->where('id', $suscripcion->id)->update(['plan_id' => $nuevo->id, 'updated_at' => now()]);
            DB::table('empresa')->where('id', $empresaId)->update(['plan_id' => $nuevo->id, 'updated_at' => now()]);

            Log::info("Upgrade de plan: empresa {$empresaId} de {$actual->nombre} a {$nuevo->nombre}, cobro S/ {$calculo['cobro']}.");

            return [
                'suscripcion' => $suscripcion,
                'actual' => $actual,
                'nuevo' => $nuevo,
                'cobro' => $calculo['cobro'],
                'pago_id' => $pagoId,
            ];
        });

        if ($resultado['pago_id']) {
            try {
                $this->recibos->generarPdf($resultado['pago_id']);
            } catch (\Throwable $e) {
                // El cobro ya está confirmado; la constancia se genera al descargarla
                Log::error("No se pudo generar la constancia del pago {$resultado['pago_id']}: {$e->getMessage()}");
            }
        }

        $pago = $resultado['pago_id'] ? DB::table('pago')->where('id', $resultado['pago_id'])->first() : null;

        return [
            'suscripcion_id' => $resultado['suscripcion']->id,
            'plan_id' => (int) $resultado['nuevo']->id,
            'plan_nombre' => $resultado['nuevo']->nombre,
            'estado' => 'activa',
            'comprobante_pago' => $pago ? [
                'pago_id' => $pago->id,
                'numero_factura' => $pago->numero_recibo,
                'monto_cobrado' => (float) $pago->monto,
                'moneda' => 'PEN',
                'url_recibo_pdf' => "/api/v1/propietario/suscripcion/pagos/{$pago->id}/recibo",
                'descripcion' => $pago->nota,
            ] : null,
            'modulos_activados' => $this->funcionesNuevas($resultado['actual'], $resultado['nuevo']),
        ];
    }

    /**
     * Programa un cambio a un plan inferior, o de anual a mensual, para cuando termine el periodo
     * ya pagado. No toca el plan ni los recursos: hasta esa fecha todo sigue igual.
     *
     * @return array<string, mixed>
     */
    public function programarCambio(string $empresaId, int $nuevoPlanId, string $ciclo): array
    {
        if (! in_array($ciclo, ['mensual', 'anual'], true)) {
            throw new CambioPlanException('CICLO_INVALIDO', 'El ciclo de facturación debe ser mensual o anual.', 422);
        }

        return DB::transaction(function () use ($empresaId, $nuevoPlanId, $ciclo): array {
            $suscripcion = DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at')->lockForUpdate()->first();

            if (! $suscripcion) {
                throw new CambioPlanException('EMPRESA_NO_ENCONTRADA', 'No se encontró la suscripción de tu empresa.', 404);
            }

            $this->exigirAlDia($suscripcion);

            if (CambioProgramado::de($suscripcion)) {
                throw new CambioPlanException('CAMBIO_YA_PROGRAMADO', 'Ya tienes un cambio programado. Cancélalo para programar otro.', 409);
            }

            $actual = DB::table('plan')->where('id', $suscripcion->plan_id)->first();
            $destino = DB::table('plan')->where('id', $nuevoPlanId)->where('activo', true)->first();

            if (! $destino || ! $this->esReduccion($suscripcion, $actual, $destino, $ciclo)) {
                throw new CambioPlanException('PLAN_INVALIDO', 'El plan o ciclo elegido no es una reducción de tu suscripción actual.', 422);
            }

            DB::table('suscripcion')->where('id', $suscripcion->id)->update([
                'proximo_plan_id' => $destino->id,
                'config_downgrade' => json_encode(['ciclo' => $ciclo, 'programado_en' => now()->toIso8601String(), 'seleccion' => null]),
                'recursos_conciliados' => false,
                'updated_at' => now(),
            ]);

            $fecha = Carbon::parse($suscripcion->fecha_fin_periodo);

            return [
                'plan_actual' => $actual->nombre,
                'plan_destino' => $destino->nombre,
                'ciclo' => $ciclo,
                'fecha_efectiva' => $fecha->toIso8601String(),
                'dias_restantes' => PeriodoFacturacion::diasRestantes($suscripcion),
                'recursos_excedidos' => $this->excedidos($empresaId, $destino),
            ];
        });
    }

    /**
     * Anula el cambio programado; la empresa sigue en su plan y ciclo actuales.
     *
     * @return array{plan_activo: string}
     */
    public function cancelarCambio(string $empresaId): array
    {
        return DB::transaction(function () use ($empresaId): array {
            $suscripcion = DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at')->lockForUpdate()->first();

            if (! $suscripcion || ! CambioProgramado::de($suscripcion)) {
                throw new CambioPlanException('SIN_CAMBIO_PROGRAMADO', 'No tienes ningún cambio de plan programado.', 409);
            }

            DB::table('suscripcion')->where('id', $suscripcion->id)->update([
                'proximo_plan_id' => null,
                'config_downgrade' => null,
                'recursos_conciliados' => false,
                'updated_at' => now(),
            ]);

            return ['plan_activo' => DB::table('plan')->where('id', $suscripcion->plan_id)->value('nombre')];
        });
    }

    /**
     * Recursos de hoy que superan los límites del plan destino (los de pisos, mesas y personal, por local).
     *
     * @return list<array{recurso: string, usados: int, maximo: int, local_id?: string, local_nombre?: string}>
     */
    public function excedidos(string $empresaId, object $plan): array
    {
        return $this->uso->excedidos($empresaId, $plan);
    }

    private function exigirAlDia(object $suscripcion): void
    {
        if ($suscripcion->estado !== 'activa' || Carbon::parse($suscripcion->fecha_fin_periodo)->lte(now())) {
            throw new CambioPlanException('SUSCRIPCION_NO_ACTIVA', 'Regulariza el cobro pendiente de tu suscripción antes de cambiar de plan.', 409);
        }
    }

    /**
     * Un cambio es una reducción si baja el plan (en cualquier ciclo) o, con el mismo plan, pasa de anual a mensual.
     */
    private function esReduccion(object $suscripcion, object $actual, object $destino, string $ciclo): bool
    {
        if ((int) $destino->id === (int) $actual->id) {
            return $suscripcion->ciclo_facturacion === 'anual' && $ciclo === 'mensual';
        }

        return (float) $destino->precio_mensual < (float) $actual->precio_mensual;
    }

    /**
     * @return array{0: object, 1: object, 2: object, 3: object} empresa, suscripcion, plan actual, plan nuevo
     */
    private function cargar(string $empresaId, int $nuevoPlanId): array
    {
        $empresa = DB::table('empresa')->where('id', $empresaId)->first();
        $suscripcion = DB::table('suscripcion')->where('empresa_id', $empresaId)->latest('created_at')->first();

        if (! $empresa || ! $suscripcion) {
            throw new CambioPlanException('EMPRESA_NO_ENCONTRADA', 'No se encontró la suscripción de tu empresa.', 404);
        }

        $this->exigirAlDia($suscripcion);

        if (CambioProgramado::de($suscripcion)) {
            throw new CambioPlanException('DOWNGRADE_PROGRAMADO', 'Tienes un cambio de plan programado. Cancélalo antes de mejorar tu plan.', 409);
        }

        $actual = DB::table('plan')->where('id', $suscripcion->plan_id)->first();
        $nuevo = DB::table('plan')->where('id', $nuevoPlanId)->where('activo', true)->first();

        if (! $nuevo || (float) $nuevo->precio_mensual <= (float) $actual->precio_mensual) {
            throw new CambioPlanException('PLAN_INVALIDO', 'El plan elegido no es una mejora de tu plan actual.', 422);
        }

        return [$empresa, $suscripcion, $actual, $nuevo];
    }

    /**
     * @return array{precio_actual: float, precio_nuevo: float, credito: float, costo: float, cobro: float}
     */
    private function calcular(object $suscripcion, object $actual, object $nuevo): array
    {
        $anual = $suscripcion->ciclo_facturacion === 'anual';
        $precioActual = (float) ($anual ? $actual->precio_anual : $actual->precio_mensual);
        $precioNuevo = (float) ($anual ? $nuevo->precio_anual : $nuevo->precio_mensual);

        $periodo = PeriodoFacturacion::de($suscripcion);
        $fraccion = $periodo['segundos_restantes'] / $periodo['segundos_totales'];

        $credito = round($precioActual * $fraccion, 2);
        $costo = round($precioNuevo * $fraccion, 2);
        $neto = round($costo - $credito, 2);

        return [
            'precio_actual' => $precioActual,
            'precio_nuevo' => $precioNuevo,
            'credito' => $credito,
            'costo' => $costo,
            'cobro' => $neto < self::COBRO_MINIMO ? 0.0 : $neto,
        ];
    }

    private function cobrar(object $empresa, object $suscripcion, object $nuevo, float $monto): string
    {
        if (empty($empresa->stripe_customer_id)) {
            throw new CambioPlanException('SIN_METODO_PAGO', 'Registra una tarjeta en "Mi suscripción" antes de mejorar tu plan.', 422);
        }

        $llave = sprintf('upgrade-%s-%d-%d', $suscripcion->id, $nuevo->id, Carbon::parse($suscripcion->fecha_fin_periodo)->timestamp);

        try {
            $intento = $this->stripe->cobrarRenovacion(
                $empresa->stripe_customer_id,
                $monto,
                "RestaurantCloud - Upgrade a Plan {$nuevo->nombre} ({$empresa->razon_social})",
                $llave
            );
        } catch (\Throwable $e) {
            Log::warning("Upgrade rechazado para la empresa {$empresa->id}: {$e->getMessage()}");

            throw new CambioPlanException('COBRO_UPGRADE_RECHAZADO', 'Tu banco rechazó el cobro. Actualiza tu tarjeta o prueba con otra e inténtalo nuevamente.', 402);
        }

        if ($intento->status !== 'succeeded') {
            throw new CambioPlanException('COBRO_UPGRADE_RECHAZADO', 'No pudimos confirmar el cobro con tu banco. Actualiza tu tarjeta e inténtalo nuevamente.', 402);
        }

        return $intento->id;
    }

    /**
     * @return list<string>
     */
    private function funcionesNuevas(object $actual, object $nuevo): array
    {
        $nuevas = [];
        foreach (self::FUNCIONES as $columna => $etiqueta) {
            if (! $actual->{$columna} && $nuevo->{$columna}) {
                $nuevas[] = $etiqueta;
            }
        }

        return $nuevas;
    }
}
