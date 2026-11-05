<?php

namespace App\Domains\Suscripcion\Services;

use Stripe\Customer;
use Stripe\Event;
use Stripe\Exception\InvalidRequestException;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\SetupIntent;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeGatewayService
{
    private ?StripeClient $client = null;

    private string $secretKey;

    private ?string $webhookSecret;

    public function __construct()
    {
        $this->secretKey = (string) config('services.stripe.secret');
        $this->webhookSecret = config('services.stripe.webhook_secret');
    }

    /**
     * Retorna el cliente oficial de Stripe SDK para operaciones directas (inicialización lazy)
     */
    public function getClient(): StripeClient
    {
        if ($this->client === null) {
            if (empty($this->secretKey)) {
                throw new \RuntimeException(
                    'STRIPE_KEY_REQUERIDA: Debes configurar STRIPE_SECRET_KEY en tu archivo .env para interactuar con la pasarela de pagos de Stripe.'
                );
            }

            $this->client = new StripeClient($this->secretKey);
        }

        return $this->client;
    }

    /**
     * Tarjeta predeterminada del cliente en Stripe, o null si no tiene ninguna.
     *
     * @return array{marca: string, ultimos_4: string, exp_mes: int, exp_ano: int, titular: string}|null
     */
    public function obtenerTarjetaPredeterminada(string $customerId): ?array
    {
        $cliente = $this->getClient()->customers->retrieve($customerId, [
            'expand' => ['invoice_settings.default_payment_method'],
        ]);

        $metodo = $cliente->invoice_settings->default_payment_method ?? null;

        if (! is_object($metodo) || empty($metodo->card)) {
            return null;
        }

        return [
            'marca' => (string) $metodo->card->brand,
            'ultimos_4' => (string) $metodo->card->last4,
            'exp_mes' => (int) $metodo->card->exp_month,
            'exp_ano' => (int) $metodo->card->exp_year,
            'titular' => (string) ($metodo->billing_details->name ?? $cliente->name ?? ''),
        ];
    }

    /**
     * Crea un cliente corporativo en Stripe vinculado al RUC y correo del restaurante
     */
    public function crearCliente(string $nombre, string $correo, string $ruc, array $metadata = []): Customer
    {
        return $this->getClient()->customers->create([
            'name' => $nombre,
            'email' => $correo,
            'description' => "Restaurante RUC {$ruc} - {$nombre}",
            'metadata' => array_merge([
                'ruc' => $ruc,
                'sistema' => 'RestaurantCloud AI',
            ], $metadata),
        ]);
    }

    /**
     * Genera un SetupIntent para tokenización segura de tarjeta vía Stripe Elements
     */
    public function crearSetupIntent(string $customerId): SetupIntent
    {
        return $this->getClient()->setupIntents->create([
            'customer' => $customerId,
            'automatic_payment_methods' => [
                'enabled' => true,
            ],
            'usage' => 'off_session',
        ]);
    }

    /**
     * Asocia el método de pago al cliente y ejecuta el cobro de la primera mensualidad/anualidad.
     *
     * Con $idempotencyKey, Stripe devuelve el mismo PaymentIntent ante un reintento
     * en lugar de cobrar dos veces.
     */
    public function cobrarSuscripcionInicial(
        string $customerId,
        string $paymentMethodId,
        float $monto,
        string $moneda = 'pen',
        string $descripcion = 'RestaurantCloud SaaS - Suscripción Inicial',
        ?string $idempotencyKey = null
    ): PaymentIntent {
        // 1. Vincular el método de pago al Customer y establecerlo como predeterminado
        $finalPaymentMethodId = $this->establecerMetodoPredeterminado($customerId, $paymentMethodId);

        // 2. Ejecutar el cobro inmediato con confirmación en servidor
        return $this->getClient()->paymentIntents->create([
            'amount' => (int) round($monto * 100), // En céntimos
            'currency' => strtolower($moneda),
            'customer' => $customerId,
            'payment_method' => $finalPaymentMethodId,
            'off_session' => true,
            'confirm' => true,
            'description' => $descripcion,
            'metadata' => [
                'tipo_cobro' => 'alta_suscripcion_inicial',
            ],
        ], $idempotencyKey ? ['idempotency_key' => $idempotencyKey] : null);
    }

    /**
     * Cobro recurrente (renovación o regularización) contra la tarjeta predeterminada
     * del cliente, sin intervención del usuario. Si el banco exige autenticación
     * (3DS) el PaymentIntent queda en `requires_action` y se trata como cobro fallido.
     */
    public function cobrarRenovacion(
        string $customerId,
        float $monto,
        string $descripcion,
        string $idempotencyKey,
        string $moneda = 'pen'
    ): PaymentIntent {
        $client = $this->getClient();
        $cliente = $client->customers->retrieve($customerId);
        $metodoId = $cliente->invoice_settings->default_payment_method ?? null;

        if (empty($metodoId)) {
            throw new \RuntimeException('La empresa no tiene una tarjeta predeterminada registrada.');
        }

        return $client->paymentIntents->create([
            'amount' => (int) round($monto * 100),
            'currency' => strtolower($moneda),
            'customer' => $customerId,
            'payment_method' => is_object($metodoId) ? $metodoId->id : $metodoId,
            'off_session' => true,
            'confirm' => true,
            'description' => $descripcion,
            'metadata' => [
                'tipo_cobro' => 'renovacion_suscripcion',
            ],
        ], ['idempotency_key' => $idempotencyKey]);
    }

    /**
     * Vincula el método de pago al cliente (si aún no lo está) y lo fija como
     * predeterminado para los cobros futuros. Devuelve el id final del método.
     */
    public function establecerMetodoPredeterminado(string $customerId, string $paymentMethodId): string
    {
        $client = $this->getClient();
        $finalPaymentMethodId = $paymentMethodId;

        try {
            $pm = $client->paymentMethods->attach($paymentMethodId, [
                'customer' => $customerId,
            ]);
            $finalPaymentMethodId = $pm->id;
        } catch (InvalidRequestException $e) {
            // Si ya está adjunto, continuamos sin error
            if (strpos($e->getMessage(), 'already been attached') === false) {
                throw $e;
            }
        }

        $client->customers->update($customerId, [
            'invoice_settings' => [
                'default_payment_method' => $finalPaymentMethodId,
            ],
        ]);

        return $finalPaymentMethodId;
    }

    /**
     * Método de pago de Stripe tal como lo confirmó el navegador (para validarlo antes de usarlo).
     */
    public function recuperarMetodoPago(string $paymentMethodId): PaymentMethod
    {
        return $this->getClient()->paymentMethods->retrieve($paymentMethodId);
    }

    /**
     * Verifica la autenticidad y procesa un evento Webhook de Stripe
     */
    public function procesarWebhook(string $payload, string $sigHeader): Event
    {
        if (empty($this->webhookSecret)) {
            throw new \RuntimeException('STRIPE_WEBHOOK_SECRET no está configurado en .env.');
        }

        return Webhook::constructEvent($payload, $sigHeader, $this->webhookSecret);
    }
}
