<?php

namespace App\Domains\Suscripcion\Services;

/**
 * Cambio de plan o de ciclo programado para el fin del periodo pagado.
 * Vive en `suscripcion.proximo_plan_id` + `suscripcion.config_downgrade` (jsonb):
 * `{ciclo, programado_en, seleccion: {locales_ids, pisos_ids, mesas_ids, usuarios_ids}|null}`.
 */
final class CambioProgramado
{
    /**
     * @return array{plan_id: int, ciclo: string, seleccion: array<string, list<string>>|null}|null
     */
    public static function de(object $suscripcion): ?array
    {
        if (empty($suscripcion->proximo_plan_id)) {
            return null;
        }

        $config = $suscripcion->config_downgrade ?? null;
        $config = is_string($config) ? (json_decode($config, true) ?: []) : (array) $config;

        return [
            'plan_id' => (int) $suscripcion->proximo_plan_id,
            'ciclo' => $config['ciclo'] ?? ($suscripcion->ciclo_facturacion ?? 'mensual'),
            'seleccion' => $config['seleccion'] ?? null,
        ];
    }
}
