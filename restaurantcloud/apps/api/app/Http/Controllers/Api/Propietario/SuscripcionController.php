<?php

namespace App\Http\Controllers\Api\Propietario;

use App\Domains\Suscripcion\Services\CobroSuscripcionService;
use App\Domains\Suscripcion\Services\ReciboSuscripcionService;
use App\Domains\Suscripcion\Services\StripeGatewayService;
use App\Domains\Suscripcion\Services\SuscripcionPropietarioService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SuscripcionController extends Controller
{
    public function __construct(
        private SuscripcionPropietarioService $suscripciones,
        private ReciboSuscripcionService $recibos,
        private StripeGatewayService $stripe,
        private CobroSuscripcionService $cobros
    ) {}

    /**
     * POST /api/v1/propietario/suscripcion/metodo-pago/setup
     * Crea el SetupIntent con el que Stripe Elements captura la nueva tarjeta en el navegador.
     */
    public function setupMetodoPago(Request $request): JsonResponse
    {
        $empresa = DB::table('empresa')->where('id', $request->user()->empresa_id)->first();

        if (! $empresa) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'No se encontró la empresa de tu cuenta.', 404);
        }

        try {
            $customerId = $empresa->stripe_customer_id;

            // Las empresas dadas de alta manualmente (B2B) aún no tienen cliente en Stripe.
            if (empty($customerId)) {
                $customerId = $this->stripe->crearCliente($empresa->razon_social, $empresa->correo_contacto, $empresa->ruc)->id;
                DB::table('empresa')->where('id', $empresa->id)->update(['stripe_customer_id' => $customerId, 'updated_at' => now()]);
            }

            $setupIntent = $this->stripe->crearSetupIntent($customerId);
        } catch (\Throwable $e) {
            Log::error("No se pudo crear el SetupIntent de la empresa {$empresa->id}: {$e->getMessage()}");

            return ApiResponse::error(
                'STRIPE_NO_DISPONIBLE',
                'No pudimos conectar con la pasarela de pagos. Intenta nuevamente en unos minutos.',
                503
            );
        }

        return ApiResponse::ok([
            'client_secret' => $setupIntent->client_secret,
            'stripe_public_key' => config('services.stripe.key'),
        ]);
    }

    /**
     * POST /api/v1/propietario/suscripcion/metodo-pago/confirmar
     * Fija la tarjeta confirmada en el navegador como predeterminada y, si hay un cobro
     * pendiente (gracia o suspensión), lo cobra de inmediato.
     */
    public function confirmarMetodoPago(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'stripe_payment_method_id' => ['required', 'string', 'starts_with:pm_', 'max:100'],
        ]);

        $empresa = DB::table('empresa')->where('id', $request->user()->empresa_id)->first();

        if (! $empresa || empty($empresa->stripe_customer_id)) {
            return ApiResponse::error('METODO_PAGO_INVALIDO', 'Primero debes iniciar el cambio de tarjeta.', 400);
        }

        try {
            $metodo = $this->stripe->recuperarMetodoPago($validated['stripe_payment_method_id']);

            if ($metodo->type !== 'card' || ($metodo->customer && $metodo->customer !== $empresa->stripe_customer_id)) {
                throw new \InvalidArgumentException('El método de pago no corresponde a una tarjeta de esta empresa.');
            }

            $this->stripe->establecerMetodoPredeterminado($empresa->stripe_customer_id, $metodo->id);
        } catch (\Throwable $e) {
            Log::warning("Tarjeta rechazada al actualizar método de pago de la empresa {$empresa->id}: {$e->getMessage()}");

            return ApiResponse::error('METODO_PAGO_INVALIDO', 'El método de pago no pudo ser verificado por Stripe.', 400);
        }

        $regularizado = false;

        if ($this->cobros->suscripcionPendiente($empresa->id)) {
            $cobro = $this->cobros->regularizarPendiente($empresa->id);

            if (! $cobro['exito'] && ! $cobro['omitido']) {
                return ApiResponse::error(
                    'COBRO_PENDIENTE_FALLIDO',
                    'Se guardó la tarjeta, pero el cobro pendiente fue rechazado. Prueba con otra tarjeta o contacta a tu banco.',
                    402
                );
            }

            $regularizado = $cobro['exito'];
        }

        $empresa = DB::table('empresa')->where('id', $empresa->id)->first();
        $estado = DB::table('suscripcion')->where('empresa_id', $empresa->id)->latest('created_at')->value('estado') ?? 'activa';

        return ApiResponse::ok([
            'mensaje' => $regularizado
                ? 'Tarjeta actualizada y cobro pendiente regularizado.'
                : 'Método de pago actualizado exitosamente.',
            'metodo_pago' => $this->suscripciones->metodoPago($empresa, $estado),
            'cobro_pendiente_regularizado' => $regularizado,
        ]);
    }

    /**
     * POST /api/v1/propietario/suscripcion/cobro-pendiente/reintentar
     * "Pagar ahora": reintenta el cobro adeudado con la tarjeta actual.
     */
    public function reintentarCobroPendiente(Request $request): JsonResponse
    {
        $empresaId = (string) $request->user()->empresa_id;

        if (! $this->cobros->suscripcionPendiente($empresaId)) {
            return ApiResponse::error('SIN_COBRO_PENDIENTE', 'Tu suscripción no tiene cobros pendientes.', 409);
        }

        $cobro = $this->cobros->regularizarPendiente($empresaId);

        if ($cobro['bloqueado'] ?? false) {
            return ApiResponse::error(
                'SUSPENSION_ADMINISTRATIVA',
                'Tu cuenta fue suspendida por el equipo de RestaurantCloud, no por un cobro pendiente. Contacta a soporte para reactivarla.',
                403
            );
        }

        if ($cobro['omitido']) {
            return ApiResponse::error('SIN_COBRO_PENDIENTE', 'Tu suscripción no tiene cobros pendientes.', 409);
        }

        if (! $cobro['exito']) {
            return ApiResponse::error(
                'COBRO_PENDIENTE_FALLIDO',
                'Tu banco volvió a rechazar la transacción. Prueba con otra tarjeta o contacta a tu entidad bancaria.',
                402
            );
        }

        return ApiResponse::ok([
            'mensaje' => 'Cobro pendiente regularizado. Tu suscripción está activa.',
            'cobro_pendiente_regularizado' => true,
        ]);
    }

    /**
     * GET /api/v1/propietario/suscripcion
     * Dashboard de "Mi suscripción" de la empresa autenticada (CU-PROP-02).
     */
    public function show(Request $request): JsonResponse
    {
        $dashboard = $this->suscripciones->dashboard((string) $request->user()->empresa_id);

        if (! $dashboard) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'No se encontró la empresa de tu cuenta.', 404);
        }

        return ApiResponse::ok($dashboard);
    }

    /**
     * GET /api/v1/propietario/suscripcion/pagos/{id}/recibo
     * Descarga la constancia PDF de un pago de la propia empresa; la genera si aún no existe.
     */
    public function descargarRecibo(Request $request, string $id): Response|JsonResponse
    {
        $pertenece = DB::table('pago')
            ->where('id', $id)
            ->where('empresa_id', $request->user()->empresa_id)
            ->where('estado', 'exitoso')
            ->exists();

        if (! $pertenece) {
            return ApiResponse::error('PAGO_NO_ENCONTRADO', 'El pago solicitado no existe.', 404);
        }

        try {
            $archivo = $this->recibos->generarPdf($id, $request->user()->id);
            $contenido = Storage::disk('s3')->get($archivo->object_key);
        } catch (\Throwable $e) {
            Log::error("No se pudo entregar la constancia del pago {$id}: {$e->getMessage()}");

            return ApiResponse::error(
                'CONSTANCIA_NO_DISPONIBLE',
                'La constancia no está disponible en este momento. Intenta nuevamente en unos minutos.',
                503
            );
        }

        if ($contenido === null) {
            return ApiResponse::error('CONSTANCIA_NO_DISPONIBLE', 'La constancia no está disponible en este momento.', 503);
        }

        return response($contenido, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$archivo->nombre_original}\"",
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
