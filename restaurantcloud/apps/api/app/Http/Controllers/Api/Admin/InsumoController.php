<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Inventario\Services\InsumoService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsumoController extends Controller
{
    public function __construct(private InsumoService $insumoService) {}

    public function index(Request $request): JsonResponse
    {
        $localId = $request->user()->local_id;
        $datos = $this->insumoService->listado($localId, $request->query());

        return ApiResponse::ok($datos);
    }

    public function store(Request $request): JsonResponse
    {
        $localId = $request->user()->local_id;
        $data = $request->validate([
            'nombre' => 'required|string|max:80',
            'unidad_medida' => 'required|string',
            'stock_actual' => 'required|numeric|min:0',
            'stock_minimo' => 'required|numeric|min:0',
            'costo_unitario' => 'required|numeric|min:0',
            'estado' => 'nullable|string|in:activo,agotado,inactivo',
        ]);

        try {
            $insumo = $this->insumoService->crear($localId, $data);
            return ApiResponse::ok($insumo, 201);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_INSUMO_DUPLICADO', $e->getMessage(), 409);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_UNIDAD_INVALIDA', $e->getMessage(), 422);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $localId = $request->user()->local_id;
        $insumo = $this->insumoService->obtener($id, $localId);

        if (! $insumo) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', 'El insumo no existe o no pertenece a esta sede.', 404);
        }

        return ApiResponse::ok($insumo);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $localId = $request->user()->local_id;
        $data = $request->validate([
            'nombre' => 'required|string|max:80',
            'unidad_medida' => 'required|string',
            'stock_minimo' => 'required|numeric|min:0',
            'costo_unitario' => 'required|numeric|min:0',
        ]);

        try {
            $insumo = $this->insumoService->actualizar($id, $localId, $data);
            if (! $insumo) {
                return ApiResponse::error('ERR_NO_ENCONTRADO', 'El insumo no existe o no pertenece a esta sede.', 404);
            }
            return ApiResponse::ok($insumo);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_INSUMO_DUPLICADO', $e->getMessage(), 409);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_UNIDAD_INVALIDA', $e->getMessage(), 422);
        }
    }

    public function ajuste(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'stock_fisico' => 'required|numeric|min:0',
            'motivo' => 'required|string|in:conteo_fisico_inventario,merma_desperdicio,ingreso_manual,vencimiento_caducidad,rotura_accidente,inconsistencia_cocina',
            'notas' => 'nullable|string|max:500',
        ]);

        try {
            $resultado = $this->insumoService->ajustarStock($id, $user->local_id, $user->id, $data);
            return ApiResponse::ok($resultado);
        } catch (\Throwable $e) {
            return ApiResponse::error('ERR_AJUSTE_FALLIDO', $e->getMessage(), 422);
        }
    }

    public function estado(Request $request, string $id): JsonResponse
    {
        $localId = $request->user()->local_id;
        $data = $request->validate([
            'estado' => 'required|string|in:activo,agotado,inactivo',
        ]);

        try {
            $insumo = $this->insumoService->cambiarEstado($id, $localId, $data['estado']);
            if (! $insumo) {
                return ApiResponse::error('ERR_NO_ENCONTRADO', 'El insumo no existe o no pertenece a esta sede.', 404);
            }
            return ApiResponse::ok($insumo);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_ESTADO_INVALIDO', $e->getMessage(), 422);
        }
    }

    public function auditoria(Request $request): JsonResponse
    {
        $localId = $request->user()->local_id;
        $insumoId = $request->query('insumo_id');
        $auditorias = $this->insumoService->obtenerAuditorias($localId, $insumoId);

        return ApiResponse::ok($auditorias);
    }
}
