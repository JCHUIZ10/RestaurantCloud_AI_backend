<?php

namespace App\Domains\Cocina\Services;

use Illuminate\Support\Facades\DB;

class ConfiguracionKdsService
{
    private const VALORES_RECOMENDADOS = [
        'tiempo_optimo_verde_min' => 15,
        'tiempo_alerta_ambar_min' => 25,
        'tiempo_maximo_pase_min' => 3,
        'alerta_sonora_nueva_comanda' => true,
        'alerta_sonora_comanda_roja' => true,
        'intervalo_sonido_rojo_seg' => 60,
        'vista_predeterminada' => 'fifo',
    ];

    public function obtener(string $localId): array
    {
        $configuracion = DB::table('configuracion_kds')
            ->where('local_id', $localId)
            ->first();

        if (! $configuracion) {
            return [
                'local_id' => $localId,
                ...self::VALORES_RECOMENDADOS,
                'created_at' => null,
                'updated_at' => null,
            ];
        }

        return $this->mapear($configuracion);
    }

    public function actualizar(string $localId, array $data): array
    {
        $this->validarCoherencia($data);

        DB::table('configuracion_kds')->upsert(
            [[
                'local_id' => $localId,
                ...$data,
                'created_at' => now(),
                'updated_at' => now(),
            ]],
            ['local_id'],
            [
                'tiempo_optimo_verde_min',
                'tiempo_alerta_ambar_min',
                'tiempo_maximo_pase_min',
                'alerta_sonora_nueva_comanda',
                'alerta_sonora_comanda_roja',
                'intervalo_sonido_rojo_seg',
                'vista_predeterminada',
                'updated_at',
            ],
        );

        return $this->obtener($localId);
    }

    public function restaurarValoresRecomendados(string $localId): array
    {
        return $this->actualizar($localId, self::VALORES_RECOMENDADOS);
    }

    private function validarCoherencia(array $data): void
    {
        if ($data['tiempo_alerta_ambar_min'] <= $data['tiempo_optimo_verde_min']) {
            throw new \InvalidArgumentException(
                'El umbral de alerta ambar debe ser estrictamente mayor al umbral optimo.',
            );
        }
    }

    private function mapear(object $configuracion): array
    {
        return [
            'local_id' => $configuracion->local_id,
            'tiempo_optimo_verde_min' => (int) $configuracion->tiempo_optimo_verde_min,
            'tiempo_alerta_ambar_min' => (int) $configuracion->tiempo_alerta_ambar_min,
            'tiempo_maximo_pase_min' => (int) $configuracion->tiempo_maximo_pase_min,
            'alerta_sonora_nueva_comanda' => (bool) $configuracion->alerta_sonora_nueva_comanda,
            'alerta_sonora_comanda_roja' => (bool) $configuracion->alerta_sonora_comanda_roja,
            'intervalo_sonido_rojo_seg' => (int) $configuracion->intervalo_sonido_rojo_seg,
            'vista_predeterminada' => $configuracion->vista_predeterminada,
            'created_at' => $configuracion->created_at,
            'updated_at' => $configuracion->updated_at,
        ];
    }
}
