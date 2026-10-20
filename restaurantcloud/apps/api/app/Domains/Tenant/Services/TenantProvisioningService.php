<?php

namespace App\Domains\Tenant\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantProvisioningService
{
    public function __construct(
        private TenantStorageService $tenantStorage
    ) {}

    /**
     * Valida matemáticamente un RUC peruano según el algoritmo Módulo 11 de SUNAT.
     */
    public function validarRucModulo11(string $ruc): bool
    {
        $ruc = trim($ruc);
        if (! preg_match('/^[0-9]{11}$/', $ruc)) {
            return false;
        }

        // Prefijos válidos en Perú (10: Persona Natural con Negocio, 15/17: Extranjeros, 20: Persona Jurídica)
        $prefijo = substr($ruc, 0, 2);
        if (! in_array($prefijo, ['10', '15', '17', '20'], true)) {
            return false;
        }

        $factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $suma = 0;

        for ($i = 0; $i < 10; $i++) {
            $suma += ((int) $ruc[$i]) * $factores[$i];
        }

        $residuo = $suma % 11;
        $digitoVerificador = 11 - $residuo;

        if ($digitoVerificador === 10) {
            $digitoVerificador = 0;
        } elseif ($digitoVerificador === 11) {
            $digitoVerificador = 1;
        }

        return $digitoVerificador === (int) $ruc[10];
    }

    /**
     * Aprovisiona atómicamente una nueva empresa (CU-PROP-01).
     * Alcance estricto: Empresa, Suscripción, Usuario Propietario (local_id = NULL),
     * Registro de Pago y espacio en MinIO.
     * (Nota: Sedes, Pisos y Carta corresponden exclusivamente a CU-PROP-04).
     */
    public function provisionar(array $datos): array
    {
        $ruc = trim($datos['ruc']);
        $correo = strtolower(trim($datos['correo']));

        // 1. Validar formato y dígito verificador del RUC (permitir bypass solo si flag explícito de test)
        $esValidoRuc = $this->validarRucModulo11($ruc);
        $ignorarModulo11 = ! empty($datos['ignorar_modulo_11']);

        if (! $esValidoRuc && ! $ignorarModulo11) {
            throw new \InvalidArgumentException("El RUC {$ruc} no cumple con el algoritmo de verificación Módulo 11 de SUNAT.");
        }

        // 2. Transacción ACID para asegurar integridad referencial completa
        return DB::transaction(function () use ($datos, $ruc, $correo) {
            // Verificar unicidad de RUC
            $existeRuc = DB::table('empresa')->where('ruc', $ruc)->exists();
            if ($existeRuc) {
                throw new \DomainException("El RUC {$ruc} ya se encuentra registrado en RestaurantCloud.");
            }

            // Validar plan
            $planId = (int) $datos['plan_id'];
            $plan = DB::table('plan')->where('id', $planId)->where('activo', true)->first();
            if (! $plan) {
                throw new \OutOfBoundsException("El plan seleccionado (ID {$planId}) no existe o está inactivo.");
            }

            // A. Crear Empresa
            $empresaId = (string) Str::uuid();
            $tipoIdentidad = in_array($datos['tipo_identidad_fiscal'] ?? '', ['RUC_20', 'RUC_10'], true)
                ? $datos['tipo_identidad_fiscal']
                : (str_starts_with($ruc, '20') ? 'RUC_20' : 'RUC_10');

            DB::table('empresa')->insert([
                'id' => $empresaId,
                'razon_social' => trim($datos['razon_social']),
                'tipo_identidad_fiscal' => $tipoIdentidad,
                'ruc' => $ruc,
                'correo_contacto' => $correo,
                'telefono' => trim($datos['telefono'] ?? ''),
                'plan_id' => $planId,
                'estado' => 'activa',
                'origen_alta' => $datos['origen_alta'] ?? 'autoservicio_stripe',
                'nota_alta' => $datos['nota_alta'] ?? null,
                'stripe_customer_id' => $datos['stripe_customer_id'] ?? null,
                'fecha_registro' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // B. Crear Suscripción Inicial
            $suscripcionId = (string) Str::uuid();
            $fechaInicio = now();
            $fechaFin = ($datos['ciclo_facturacion'] ?? 'mensual') === 'anual'
                ? now()->addYear()
                : now()->addMonth();

            DB::table('suscripcion')->insert([
                'id' => $suscripcionId,
                'empresa_id' => $empresaId,
                'plan_id' => $planId,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin_periodo' => $fechaFin,
                'estado' => 'activa',
                'dias_gracia_restantes' => 5,
                'stripe_subscription_id' => $datos['stripe_subscription_id'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Vincular última suscripción en empresa
            DB::table('empresa')->where('id', $empresaId)->update([
                'ultima_suscripcion_id' => $suscripcionId,
            ]);

            // C. Crear Usuario Propietario (Cuenta Corporativa: local_id = NULL)
            $usuarioId = (string) Str::uuid();
            DB::table('usuario')->insert([
                'id' => $usuarioId,
                'empresa_id' => $empresaId,
                'local_id' => null, // Administrador global de la empresa
                'nombre' => trim($datos['nombre_propietario']),
                'correo' => $correo,
                'password_hash' => Hash::make($datos['password']),
                'telefono' => trim($datos['telefono'] ?? ''),
                'rol' => 'propietario',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // D. Registrar Pago Inicial
            $pagoId = (string) Str::uuid();
            $monto = (float) ($datos['monto_pagado'] ?? (
                ($datos['ciclo_facturacion'] ?? 'mensual') === 'anual'
                    ? $plan->precio_anual
                    : $plan->precio_mensual
            ));

            DB::table('pago')->insert([
                'id' => $pagoId,
                'empresa_id' => $empresaId,
                'suscripcion_id' => $suscripcionId,
                'plan_id' => $planId,
                'monto' => $monto,
                'fecha' => now(),
                'estado' => 'exitoso',
                'origen_pago' => $datos['origen_pago'] ?? 'stripe',
                'stripe_payment_id' => $datos['stripe_payment_id'] ?? null,
                'numero_operacion' => $datos['numero_operacion'] ?? null,
                'nota' => 'Cobro inicial por alta de suscripción en plataforma SaaS',
                'created_at' => now(),
            ]);

            // E. Asignar Espacio en MinIO S3
            $this->tenantStorage->inicializarEspacioTenant($empresaId, [
                'ruc' => $ruc,
                'razon_social' => trim($datos['razon_social']),
                'plan_id' => $planId,
                'propietario_correo' => $correo,
                'origen' => $datos['origen_alta'] ?? 'autoservicio_stripe',
            ]);

            return [
                'empresa' => [
                    'id' => $empresaId,
                    'razon_social' => trim($datos['razon_social']),
                    'tipo_identidad_fiscal' => $tipoIdentidad,
                    'ruc' => $ruc,
                    'correo_contacto' => $correo,
                    'plan_id' => $planId,
                    'plan_nombre' => $plan->nombre,
                    'estado' => 'activa',
                    'stripe_customer_id' => $datos['stripe_customer_id'] ?? null,
                ],
                'suscripcion' => [
                    'id' => $suscripcionId,
                    'fecha_inicio' => $fechaInicio->toIso8601String(),
                    'fecha_fin_periodo' => $fechaFin->toIso8601String(),
                    'estado' => 'activa',
                    'dias_gracia_restantes' => 5,
                ],
                'usuario' => [
                    'id' => $usuarioId,
                    'nombre' => trim($datos['nombre_propietario']),
                    'correo' => $correo,
                    'rol' => 'propietario',
                    'local_id' => null,
                ],
                'pago' => [
                    'id' => $pagoId,
                    'monto' => $monto,
                    'estado' => 'exitoso',
                    'origen_pago' => $datos['origen_pago'] ?? 'stripe',
                    'stripe_payment_id' => $datos['stripe_payment_id'] ?? null,
                ],
            ];
        });
    }
}
