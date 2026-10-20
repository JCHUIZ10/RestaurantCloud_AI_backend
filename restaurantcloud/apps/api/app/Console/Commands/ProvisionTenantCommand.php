<?php

namespace App\Console\Commands;

use App\Domains\Tenant\Services\TenantProvisioningService;
use Illuminate\Console\Command;

class ProvisionTenantCommand extends Command
{
    protected $signature = 'tenant:provision 
                            {--ruc= : Número de RUC de 11 dígitos}
                            {--razon-social= : Razón social o denominación comercial}
                            {--tipo=RUC_20 : Tipo de identidad fiscal (RUC_20 o RUC_10)}
                            {--correo= : Correo electrónico corporativo del propietario}
                            {--nombre= : Nombre completo del titular / propietario}
                            {--password= : Contraseña de acceso para el propietario}
                            {--telefono=999888777 : Teléfono de contacto}
                            {--plan=2 : ID del plan SaaS (1: Starter, 2: Pro, 3: Enterprise)}
                            {--stripe-customer-id= : ID de cliente en Stripe si ya existe}
                            {--stripe-payment-id= : ID de pago en Stripe}
                            {--ignorar-modulo-11 : Permite eludir el chequeo Módulo 11 para RUCs sintéticos de prueba}';

    protected $description = 'Aprovisiona una nueva empresa, suscripción, usuario propietario y espacio MinIO (CU-PROP-01)';

    public function handle(TenantProvisioningService $provisioning): int
    {
        $ruc = $this->option('ruc') ?: $this->ask('Ingresa el RUC (11 dígitos)');
        $razonSocial = $this->option('razon-social') ?: $this->ask('Ingresa la Razón Social');
        $correo = $this->option('correo') ?: $this->ask('Ingresa el Correo del Propietario');
        $nombre = $this->option('nombre') ?: $this->ask('Ingresa el Nombre del Propietario');
        $password = $this->option('password') ?: $this->secret('Ingresa la Contraseña');

        $this->info("Iniciando aprovisionamiento corporativo para {$razonSocial} (RUC {$ruc})...");

        try {
            $resultado = $provisioning->provisionar([
                'ruc' => $ruc,
                'razon_social' => $razonSocial,
                'tipo_identidad_fiscal' => $this->option('tipo'),
                'correo' => $correo,
                'nombre_propietario' => $nombre,
                'password' => $password,
                'telefono' => $this->option('telefono'),
                'plan_id' => (int) $this->option('plan'),
                'stripe_customer_id' => $this->option('stripe-customer-id'),
                'stripe_payment_id' => $this->option('stripe-payment-id'),
                'ignorar_modulo_11' => (bool) $this->option('ignorar-modulo-11'),
                'origen_alta' => 'manual_admin',
            ]);

            $this->newLine();
            $this->info('✓ Empresa aprovisionada con éxito:');
            $this->table(
                ['Entidad', 'Detalle'],
                [
                    ['Empresa ID', $resultado['empresa']['id']],
                    ['RUC', $resultado['empresa']['ruc']],
                    ['Razón Social', $resultado['empresa']['razon_social']],
                    ['Plan', $resultado['empresa']['plan_nombre']],
                    ['Usuario Propietario ID', $resultado['usuario']['id']],
                    ['Correo Propietario', $resultado['usuario']['correo']],
                    ['Suscripción ID', $resultado['suscripcion']['id']],
                    ['MinIO Namespace', "restaurantcloud/tenants/{$resultado['empresa']['id']}/manifest.json"],
                ]
            );

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Error al aprovisionar: {$e->getMessage()}");
            return self::FAILURE;
        }
    }
}
