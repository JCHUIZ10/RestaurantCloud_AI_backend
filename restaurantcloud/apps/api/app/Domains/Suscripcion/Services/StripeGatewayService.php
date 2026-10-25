<?php

namespace App\Domains\Suscripcion\Services;

use Stripe\Customer;
use Stripe\Event;
use Stripe\PaymentIntent;
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
     * Asocia el método de pago al cliente y ejecuta el cobro de la primera mensualidad/anualidad
     */
    public function cobrarSuscripcionInicial(
        string $customerId,
        string $paymentMethodId,
        float $monto,
        string $moneda = 'pen',
        string $descripcion = 'RestaurantCloud SaaS - Suscripción Inicial'
    ): PaymentIntent {
        $client = $this->getClient();

        // 1. Vincular el método de pago al Customer y establecerlo como predeterminado
        $finalPaymentMethodId = $paymentMethodId;
        try {
            $pm = $client->paymentMethods->attach($paymentMethodId, [
                'customer' => $customerId,
            ]);
            $finalPaymentMethodId = $pm->id;
        } catch (\Stripe\Exception\InvalidRequestException $e) {
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

        // 2. Ejecutar el cobro inmediato con confirmación en servidor
        return $client->paymentIntents->create([
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
        ]);
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
