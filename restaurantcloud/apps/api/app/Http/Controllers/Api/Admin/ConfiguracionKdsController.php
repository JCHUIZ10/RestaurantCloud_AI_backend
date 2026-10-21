<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Cocina\Services\ConfiguracionKdsService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfiguracionKdsController extends Controller
{
    public function __construct(private ConfiguracionKdsService $configuracionKds)
    {
    }

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->configuracionKds->obtener($request->user()->local_id));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $this->validarConfiguracion($request);

        return $this->run(fn () => ApiResponse::ok(
            $this->configuracionKds->actualizar($request->user()->local_id, $data),
        ));
    }

    public function restaurarValoresRecomendados(Request $request): JsonResponse
    {
        return ApiResponse::ok(
            $this->configuracionKds->restaurarValoresRecomendados($request->user()->local_id),
        );
    }

    private function validarConfiguracion(Request $request): array
    {
        return $request->validate([
            'tiempo_optimo_verde_min' => ['required', 'integer', 'between:3,60'],
            'tiempo_alerta_ambar_min' => ['required', 'integer', 'between:5,120'],
            'tiempo_maximo_pase_min' => ['required', 'integer', 'between:1,30'],
            'alerta_sonora_nueva_comanda' => ['required', 'boolean'],
            'alerta_sonora_comanda_roja' => ['required', 'boolean'],
            'intervalo_sonido_rojo_seg' => ['required', 'integer', 'between:15,300'],
            'vista_predeterminada' => ['required', 'in:fifo,all_day'],
        ]);
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error(
                'ERR_UMBRALES_KDS_INCOHERENTES',
                $exception->getMessage(),
                422,
            );
        }
    }
}
