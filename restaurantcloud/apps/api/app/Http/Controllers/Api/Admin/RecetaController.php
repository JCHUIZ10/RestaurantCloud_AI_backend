<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Carta\Services\RecetaService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecetaController extends Controller
{
    public function __construct(private RecetaService $recetaService) {}

    /**
     * Obtiene la receta calibrada del producto.
     */
    public function show(Request $request, string $productoId): JsonResponse
    {
        $localId = $request->user()->local_id;
        $receta = $this->recetaService->obtener($productoId, $localId);

        if (! $receta) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', 'El producto no existe o no pertenece a esta sede.', 404);
        }

        return ApiResponse::ok($receta);
    }

    /**
     * Guarda la receta culinaria del producto (reemplazo atómico).
     */
    public function update(Request $request, string $productoId): JsonResponse
    {
        $localId = $request->user()->local_id;
        
        $items = $request->input('items', $request->input('receta', []));
        if (! is_array($items)) {
            return ApiResponse::error('ERR_DATOS_INVALIDOS', 'El campo items o receta debe ser un arreglo.', 422);
        }

        try {
            $resultado = $this->recetaService->guardar($productoId, $localId, $items);
            return ApiResponse::ok($resultado);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_DATOS_INVALIDOS', $e->getMessage(), 422);
        } catch (\Throwable $e) {
            return ApiResponse::error('ERR_RECETA_FALLIDA', $e->getMessage(), 422);
        }
    }

    /**
     * Simula la capacidad máxima de platos según stock físico en bodega e insumo cuello de botella.
     */
    public function capacidad(Request $request, string $productoId): JsonResponse
    {
        $localId = $request->user()->local_id;

        try {
            $resultado = $this->recetaService->capacidad($productoId, $localId);
            return ApiResponse::ok($resultado);
        } catch (\Throwable $e) {
            return ApiResponse::error('ERR_CAPACIDAD_FALLIDA', $e->getMessage(), 422);
        }
    }
}
