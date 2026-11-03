<?php

namespace App\Http\Controllers\Api\Public;

use App\Domains\Auth\Services\SesionService;
use App\Domains\Suscripcion\Services\ReciboSuscripcionService;
use App\Domains\Suscripcion\Services\StripeGatewayService;
use App\Domains\Tenant\Services\TenantProvisioningService;
use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use RuntimeException;

class RegistroController extends Controller
{
    public function __construct(
        private TenantProvisioningService $provisioning,
        private StripeGatewayService $stripeGateway,
        private SesionService $sesiones,
        private ReciboSuscripcionService $recibos
    ) {}

    /**
     * Catálogo público de planes SaaS activos (Paso 1)
     * GET /api/v1/public/planes
     */
    public function getPlanes(): JsonResponse
    {
        $planes = DB::table('plan')
            ->where('activo', true)
            ->where('visible_publico', true)
            ->orderBy('id')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => (int) $plan->id,
                    'nombre' => $plan->nombre,
                    'slug' => $plan->slug,
                    'descripcion' => $plan->descripcion,
                    'precio_mensual' => (float) $plan->precio_mensual,
                    'precio_anual' => (float) $plan->precio_anual,
                    'max_locales' => (int) $plan->max_locales,
                    'max_pisos' => (int) $plan->max_pisos,
                    'max_mesas' => (int) $plan->max_mesas,
                    'max_usuarios' => (int) $plan->max_usuarios,
                    'incluye_reservas' => (bool) $plan->incluye_reservas,
                    'incluye_reportes_avanzados' => (bool) $plan->incluye_reportes_avanzados,
                    'incluye_asistente_ia' => (bool) $plan->incluye_asistente_ia,
                    'incluye_prediccion_ia' => (bool) $plan->incluye_prediccion_ia,
                    'activo' => (bool) $plan->activo,
                    'visible_publico' => (bool) $plan->visible_publico,
                    'destacado' => ($plan->id === 2), // Plan Pro destacado
                ];
            });

        return ApiResponse::ok($planes);
    }

    /**
     * Paso 2: Iniciar registro y despachar código OTP al correo
     * POST /api/v1/public/registro/iniciar
     */
    public function iniciarRegistro(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'integer'],
            'tipo_contribuyente' => ['required', 'in:RUC_20,RUC_10'],
            'ruc' => ['required', 'string', 'size:11'],
            'razon_social' => ['required', 'string', 'min:3', 'max:150'],
            'telefono' => ['required', 'string', 'min:6', 'max:20'],
            'nombre_propietario' => ['required', 'string', 'min:3', 'max:100'],
            'correo' => ['required', 'email', 'max:100'],
            'password' => ['required', 'string', 'min:8'],
            'ciclo_facturacion' => ['sometimes', 'in:mensual,anual'],
        ]);

        $ruc = trim($validated['ruc']);

        // 1. Validar unicidad de RUC en la base de datos
        if (DB::table('empresa')->where('ruc', $ruc)->exists()) {
            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'RUC_YA_REGISTRADO',
                        'mensaje' => "El RUC {$ruc} ya cuenta con una empresa activa en RestaurantCloud. Si eres el dueño, inicia sesión.",
                        'campo' => 'ruc',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 409);
        }

        // 2. Validar algoritmo Módulo 11 oficial de SUNAT
        if (! $this->provisioning->validarRucModulo11($ruc)) {
            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'RUC_INVALIDO',
                        'mensaje' => "El RUC {$ruc} no es un número fiscalmente válido según el algoritmo oficial de SUNAT (Módulo 11).",
                        'campo' => 'ruc',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 422);
        }

        // 3. Generar sesión temporal en Redis (TTL 30 min)
        $registroId = (string) Str::uuid();
        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $sessionData = [
            'registro_id' => $registroId,
            'plan_id' => (int) $validated['plan_id'],
            'tipo_contribuyente' => $validated['tipo_contribuyente'],
            'ruc' => $ruc,
            'razon_social' => trim($validated['razon_social']),
            'telefono' => trim($validated['telefono']),
            'nombre_propietario' => trim($validated['nombre_propietario']),
            'correo' => strtolower(trim($validated['correo'])),
            'password_hash' => Hash::make($validated['password']),
            'ciclo_facturacion' => $validated['ciclo_facturacion'] ?? 'mensual',
            'correo_verificado' => false,
            'intentos_restantes' => 3,
        ];

        try {
            Redis::setex("registro:onboarding:{$registroId}", 1800, json_encode($sessionData));
            Redis::setex("registro:otp:{$registroId}", 600, $otp);
        } catch (\Throwable $e) {
            Log::error("Fallo de conexión a Redis en inicio de registro: {$e->getMessage()}");
        }

        // Loguear OTP para pruebas locales si aplica
        Log::info("OTP generado para registro {$registroId} ({$validated['correo']}): {$otp}");

        return ApiResponse::ok([
            'registro_id' => $registroId,
            'mensaje' => "Se ha enviado un código de verificación de 6 dígitos a {$validated['correo']}",
            'correo' => $validated['correo'],
            'expira_en_segundos' => 600,
            'cooldown_reenvio_segundos' => 60,
            'otp_debug' => (config('app.env') !== 'production') ? $otp : null,
        ]);
    }

    /**
     * Paso 3.1: Modificar correo si hubo error tipográfico
     * PATCH /api/v1/public/registro/modificar-correo
     */
    public function modificarCorreo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'registro_id' => ['required', 'string'],
            'nuevo_correo' => ['required', 'email', 'max:100'],
        ]);

        $registroId = $validated['registro_id'];
        $raw = Redis::get("registro:onboarding:{$registroId}");

        if (! $raw) {
            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'REGISTRO_NO_ENCONTRADO',
                        'mensaje' => 'La sesión de registro ha expirado. Por favor inicia el proceso nuevamente.',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 404);
        }

        $sessionData = json_decode($raw, true);
        $nuevoCorreo = strtolower(trim($validated['nuevo_correo']));
        $sessionData['correo'] = $nuevoCorreo;
        $sessionData['intentos_restantes'] = 3;

        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        Redis::setex("registro:onboarding:{$registroId}", 1800, json_encode($sessionData));
        Redis::setex("registro:otp:{$registroId}", 600, $otp);

        Log::info("Nuevo OTP para {$nuevoCorreo}: {$otp}");

        return ApiResponse::ok([
            'registro_id' => $registroId,
            'mensaje' => "Correo modificado con éxito. Hemos enviado un nuevo código a {$nuevoCorreo}",
            'correo' => $nuevoCorreo,
            'expira_en_segundos' => 600,
            'cooldown_reenvio_segundos' => 60,
            'otp_debug' => (config('app.env') !== 'production') ? $otp : null,
        ]);
    }

    /**
     * Paso 3.1b: Reenviar un código OTP nuevo para el mismo registro
     * POST /api/v1/public/registro/reenviar-otp
     */
    public function reenviarOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'registro_id' => ['required', 'string'],
        ]);

        $registroId = $validated['registro_id'];
        $raw = Redis::get("registro:onboarding:{$registroId}");

        if (! $raw) {
            return ApiResponse::error(
                'REGISTRO_NO_ENCONTRADO',
                'La sesión de registro ha expirado. Por favor inicia el proceso nuevamente.',
                404
            );
        }

        $cooldownKey = "registro:otp:cooldown:{$registroId}";
        $cooldownRestante = (int) Redis::ttl($cooldownKey);
        if ($cooldownRestante > 0) {
            return ApiResponse::error(
                'REENVIO_EN_ESPERA',
                "Espera {$cooldownRestante} segundos antes de solicitar un nuevo código.",
                429
            );
        }

        $sessionData = json_decode($raw, true);
        $sessionData['intentos_restantes'] = 3;

        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        Redis::setex("registro:onboarding:{$registroId}", 1800, json_encode($sessionData));
        Redis::setex("registro:otp:{$registroId}", 600, $otp);
        Redis::setex($cooldownKey, 60, '1');

        Log::info("OTP reenviado para registro {$registroId} ({$sessionData['correo']}): {$otp}");

        return ApiResponse::ok([
            'registro_id' => $registroId,
            'mensaje' => "Hemos enviado un nuevo código a {$sessionData['correo']}",
            'correo' => $sessionData['correo'],
            'expira_en_segundos' => 600,
            'cooldown_reenvio_segundos' => 60,
            'otp_debug' => (config('app.env') !== 'production') ? $otp : null,
        ]);
    }

    /**
     * Paso 3.2: Verificar código OTP de 6 dígitos e inicializar SetupIntent de Stripe
     * POST /api/v1/public/registro/verificar-otp
     */
    public function verificarOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'registro_id' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $registroId = $validated['registro_id'];
        $raw = Redis::get("registro:onboarding:{$registroId}");

        if (! $raw) {
            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'REGISTRO_NO_ENCONTRADO',
                        'mensaje' => 'Sesión de registro no válida o expirada.',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 404);
        }

        $sessionData = json_decode($raw, true);
        $otpGuardado = Redis::get("registro:otp:{$registroId}");

        if ($validated['otp'] !== $otpGuardado) {
            $sessionData['intentos_restantes'] = max(0, ($sessionData['intentos_restantes'] ?? 3) - 1);
            Redis::setex("registro:onboarding:{$registroId}", 1800, json_encode($sessionData));

            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'OTP_INVALIDO',
                        'mensaje' => $sessionData['intentos_restantes'] > 0
                            ? "Código incorrecto. Te quedan {$sessionData['intentos_restantes']} intento(s)."
                            : 'Código incorrecto. Has superado el límite de intentos; solicita un nuevo código.',
                        'campo' => 'otp',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 422);
        }

        // OTP Verificado con éxito
        $sessionData['correo_verificado'] = true;

        // Crear Cliente en Stripe real
        try {
            $stripeCustomer = $this->stripeGateway->crearCliente(
                $sessionData['nombre_propietario'],
                $sessionData['correo'],
                $sessionData['ruc']
            );

            // Generar SetupIntent para capturar el método de pago vía Stripe Elements
            $setupIntent = $this->stripeGateway->crearSetupIntent($stripeCustomer->id);

            $sessionData['stripe_customer_id'] = $stripeCustomer->id;
            $sessionData['stripe_setup_intent_id'] = $setupIntent->id;
            Redis::setex("registro:onboarding:{$registroId}", 1800, json_encode($sessionData));

            $plan = DB::table('plan')->where('id', $sessionData['plan_id'])->first();
            $monto = ($sessionData['ciclo_facturacion'] ?? 'mensual') === 'anual'
                ? (float) $plan->precio_anual
                : (float) $plan->precio_mensual;

            return ApiResponse::ok([
                'registro_id' => $registroId,
                'correo_verificado' => true,
                'stripe_client_secret' => $setupIntent->client_secret,
                'stripe_public_key' => config('services.stripe.key'),
                'monto_total' => $monto,
                'moneda' => 'PEN',
            ]);
        } catch (\Throwable $e) {
            Log::error("Error de Stripe al crear cliente/SetupIntent: {$e->getMessage()}");

            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'STRIPE_ERROR',
                        'mensaje' => "Error al inicializar pasarela de pago segura: {$e->getMessage()}",
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 500);
        }
    }

    /**
     * Paso 4 -> 5: Confirmar pago en Stripe y aprovisionar atómicamente la empresa
     * POST /api/v1/public/registro/completar
     */
    public function completarRegistro(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'registro_id' => ['required', 'string'],
            'stripe_payment_method_id' => ['required', 'string'],
        ]);

        $registroId = $validated['registro_id'];

        // Un doble clic o un reintento de red no debe cobrar ni aprovisionar dos veces.
        $lockKey = "registro:completar:lock:{$registroId}";
        if (! Redis::set($lockKey, '1', 'EX', 120, 'NX')) {
            return ApiResponse::error(
                'REGISTRO_EN_PROCESO',
                'Tu pago ya se está procesando. Espera unos segundos.',
                409
            );
        }

        try {
            return $this->procesarAlta($registroId, $validated['stripe_payment_method_id']);
        } finally {
            Redis::del($lockKey);
        }
    }

    /**
     * Cobra en Stripe, aprovisiona el tenant y emite la sesión del nuevo propietario.
     * Se ejecuta bajo el lock de completarRegistro.
     */
    private function procesarAlta(string $registroId, string $paymentMethodId): JsonResponse
    {
        $raw = Redis::get("registro:onboarding:{$registroId}");

        if (! $raw) {
            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'REGISTRO_NO_ENCONTRADO',
                        'mensaje' => 'Sesión de registro expirada o no encontrada.',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 404);
        }

        $sessionData = json_decode($raw, true);

        if (empty($sessionData['correo_verificado'])) {
            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'CORREO_NO_VERIFICADO',
                        'mensaje' => 'Debes verificar tu correo antes de procesar el pago y activar la suscripción.',
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 422);
        }

        $plan = DB::table('plan')->where('id', $sessionData['plan_id'])->first();
        if (! $plan) {
            return ApiResponse::error('PLAN_INVALIDO', 'El plan seleccionado no es válido.', 422);
        }

        $cicloFacturacion = $sessionData['ciclo_facturacion'] ?? 'mensual';
        $monto = $cicloFacturacion === 'anual'
            ? (float) $plan->precio_anual
            : (float) $plan->precio_mensual;

        // 1. Ejecutar cobro real en Stripe
        try {
            $paymentIntent = $this->stripeGateway->cobrarSuscripcionInicial(
                $sessionData['stripe_customer_id'],
                $paymentMethodId,
                $monto,
                'pen',
                "RestaurantCloud - Suscripción {$plan->nombre} ({$sessionData['razon_social']})",
                "registro-{$registroId}-{$paymentMethodId}"
            );

            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'exito' => false,
                    'datos' => null,
                    'errores' => [
                        [
                            'codigo' => 'PAGO_NO_CONFIRMADO',
                            'mensaje' => "El estado del cobro en Stripe es {$paymentIntent->status}. Verifica tu tarjeta bancaria.",
                        ],
                    ],
                    'meta' => ['timestamp' => now()->toIso8601String()],
                ], 400);
            }
        } catch (\Throwable $e) {
            Log::error("Fallo al cobrar suscripción en Stripe: {$e->getMessage()}");

            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'PAGO_RECHAZADO',
                        'mensaje' => "La transacción bancaria fue declinada por Stripe: {$e->getMessage()}",
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 400);
        }

        // 2. Aprovisionar atómicamente la empresa y usuario propietario
        try {
            $resultado = $this->provisioning->provisionar([
                'ruc' => $sessionData['ruc'],
                'razon_social' => $sessionData['razon_social'],
                'tipo_identidad_fiscal' => $sessionData['tipo_contribuyente'],
                'correo' => $sessionData['correo'],
                'nombre_propietario' => $sessionData['nombre_propietario'],
                'password' => $sessionData['password'] ?? null,
                'password_hash' => $sessionData['password_hash'] ?? null,
                'telefono' => $sessionData['telefono'],
                'plan_id' => (int) $sessionData['plan_id'],
                'stripe_customer_id' => $sessionData['stripe_customer_id'],
                'stripe_payment_id' => $paymentIntent->id,
                'monto_pagado' => $monto,
                'ciclo_facturacion' => $cicloFacturacion,
                'origen_alta' => 'autoservicio_stripe',
            ]);

            // Limpiar sesión temporal en Redis
            Redis::del("registro:onboarding:{$registroId}");
            Redis::del("registro:otp:{$registroId}");

            $usuario = Usuario::findOrFail($resultado['usuario']['id']);
            $pagoId = $resultado['pago']['id'];

            // 3. Constancia PDF persistida; si falla se regenera en la primera descarga.
            try {
                $this->recibos->generarPdf($pagoId, $usuario->id);
            } catch (\Throwable $e) {
                Log::warning("No se pudo generar la constancia del pago {$pagoId}: {$e->getMessage()}");
            }

            // 4. Sesión del nuevo propietario; sin Redis el alta sigue siendo válida y se inicia sesión manualmente.
            $sesion = null;
            try {
                $sesion = $this->sesiones->emitir($usuario);
            } catch (RuntimeException $e) {
                Log::warning("Alta completada sin sesión automática para {$usuario->id}: {$e->getMessage()}");
            }

            return ApiResponse::ok([
                'mensaje' => '¡Empresa registrada y suscripción activada con éxito!',
                'token' => $sesion['token'] ?? null,
                'refresh_token' => $sesion['refresh_token'] ?? null,
                'empresa' => [
                    'id' => $resultado['empresa']['id'],
                    'razon_social' => $resultado['empresa']['razon_social'],
                    'ruc' => $resultado['empresa']['ruc'],
                    'estado' => 'activa',
                    'plan' => [
                        'id' => (int) $plan->id,
                        'nombre' => $plan->nombre,
                        'precio' => $monto,
                    ],
                ],
                'usuario' => [
                    'id' => $resultado['usuario']['id'],
                    'nombre' => $resultado['usuario']['nombre'],
                    'correo' => $resultado['usuario']['correo'],
                    'rol' => 'propietario',
                ],
                'suscripcion' => $resultado['suscripcion'],
                'constancia' => [
                    'pago_id' => $pagoId,
                    'numero_comprobante' => $resultado['pago']['numero_recibo'],
                    'periodo' => $cicloFacturacion === 'anual' ? 'Anual' : 'Mensual',
                    'fecha_pago' => $resultado['suscripcion']['fecha_inicio'],
                    'proximo_cobro' => $resultado['suscripcion']['fecha_fin_periodo'],
                    'monto_pagado' => $monto,
                    'moneda' => 'PEN',
                    'url_descarga_pdf' => "/api/v1/propietario/suscripcion/pagos/{$pagoId}/recibo",
                ],
                'soporte_emergencia' => [
                    'whatsapp' => '+51 930 723 537',
                    'correo' => 'soporte@restaurantcloud.pe',
                    'disponibilidad' => '24/7 para emergencias de servicio',
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error("Fallo durante el aprovisionamiento de tenant: {$e->getMessage()}");

            return response()->json([
                'exito' => false,
                'datos' => null,
                'errores' => [
                    [
                        'codigo' => 'ERROR_APROVISIONAMIENTO',
                        'mensaje' => "Error durante el alta del tenant: {$e->getMessage()}",
                    ],
                ],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 500);
        }
    }

    /**
     * Webhook de Stripe: procesar eventos de cobro recurrente y dunning
     * POST /api/v1/webhooks/stripe
     */
    public function stripeWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = $this->stripeGateway->procesarWebhook($payload, (string) $sigHeader);
        } catch (\Throwable $e) {
            Log::error("Fallo de validación de firma en Webhook Stripe: {$e->getMessage()}");

            return response()->json(['error' => 'Firma de webhook inválida'], 400);
        }

        // Manejar eventos
        switch ($event->type) {
            case 'invoice.payment_succeeded':
                $invoice = $event->data->object;
                $customerId = $invoice->customer;
                $empresa = DB::table('empresa')->where('stripe_customer_id', $customerId)->first();

                if ($empresa) {
                    $ciclo = DB::table('suscripcion')->where('empresa_id', $empresa->id)->value('ciclo_facturacion');
                    DB::table('suscripcion')->where('empresa_id', $empresa->id)->update([
                        'estado' => 'activa',
                        'dias_gracia_restantes' => 5,
                        'fecha_fin_periodo' => $ciclo === 'anual' ? now()->addYear() : now()->addMonth(),
                        'updated_at' => now(),
                    ]);
                    Log::info("Webhook Stripe: Pago recurrente exitoso procesado para empresa {$empresa->id}");
                }
                break;

            case 'invoice.payment_failed':
                $invoice = $event->data->object;
                $customerId = $invoice->customer;
                $empresa = DB::table('empresa')->where('stripe_customer_id', $customerId)->first();

                if ($empresa) {
                    DB::table('suscripcion')->where('empresa_id', $empresa->id)->update([
                        'estado' => 'en_gracia',
                        'ultimo_error_cobro' => $invoice->last_finalization_error?->message ?? 'Fallo en renovación periódica',
                        'updated_at' => now(),
                    ]);
                    Log::warning("Webhook Stripe: Cobro fallido para empresa {$empresa->id}. Iniciado período de gracia.");
                }
                break;
        }

        return response()->json(['received' => true]);
    }
}
