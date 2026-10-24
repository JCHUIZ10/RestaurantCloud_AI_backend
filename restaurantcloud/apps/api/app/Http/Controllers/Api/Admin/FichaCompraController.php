<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Inventario\Services\FichaCompraService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FichaCompraController extends Controller
{
    public function __construct(private FichaCompraService $fichaCompraService) {}

    public function index(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $datos = $this->fichaCompraService->listado($localId, $request->query());

        return ApiResponse::ok($datos);
    }

    public function store(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $usuarioId = $request->user()->id;

        $data = $request->validate([
            'proveedor_id' => 'required|string|uuid',
            'tipo_comprobante' => 'required|string',
            'numero_comprobante' => 'nullable|string|max:30',
            'fecha_emision' => 'required|date',
            'metodo_pago' => 'required|string',
            'observaciones' => 'nullable|string|max:500',
            'actualizar_contacto_proveedor' => 'nullable|array',
            'actualizar_contacto_proveedor.telefono' => 'nullable|string|max:20',
            'actualizar_contacto_proveedor.email' => 'nullable|email|max:100',
            'actualizar_contacto_proveedor.direccion' => 'nullable|string|max:150',
            'items' => 'required|array|min:1',
            'items.*.insumo_id' => 'required|string|uuid',
            'items.*.cantidad' => 'required|numeric|gt:0',
            'items.*.precio_unitario' => 'required|numeric|gt:0',
        ]);

        try {
            $resultado = $this->fichaCompraService->registrar($localId, $usuarioId, $data);
            return ApiResponse::ok($resultado, 201);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_VALIDACION_COMPRA', $e->getMessage(), 422);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $detalle = $this->fichaCompraService->detalle($id, $localId);
        if (! $detalle) {
            return ApiResponse::error('ERR_NOT_FOUND', 'Ficha de compra no encontrada.', 404);
        }

        return ApiResponse::ok($detalle);
    }

    public function impactoAnulacion(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        try {
            $impacto = $this->fichaCompraService->obtenerImpactoAnulacion($id, $localId);
            return ApiResponse::ok($impacto);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_NOT_FOUND', $e->getMessage(), 404);
        }
    }

    public function anular(Request $request, ?string $id = null): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $fichaId = $id ?? $request->input('ficha_id');
        if (! $fichaId) {
            return ApiResponse::error('ERR_VALIDACION', 'Debe especificar el ID de la ficha de compra.', 400);
        }

        $request->validate([
            'motivo' => 'required|string|min:5|max:500',
        ]);

        $usuarioId = $request->user()->id;

        try {
            $fichaAnulada = $this->fichaCompraService->anular($fichaId, $localId, $usuarioId, $request->input('motivo'));
            return ApiResponse::ok($fichaAnulada);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_ANULACION_COMPRA', $e->getMessage(), 422);
        } catch (\Throwable $e) {
            return ApiResponse::error('ERR_ANULACION_COMPRA', $e->getMessage(), 400);
        }
    }

    public function reactivarPlatos(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $request->validate([
            'plato_ids' => 'required|array|min:1',
            'plato_ids.*' => 'string|uuid',
        ]);

        $resultado = $this->fichaCompraService->reactivarPlatos($localId, $request->input('plato_ids'));

        return ApiResponse::ok($resultado);
    }

    private function resolverLocalId(Request $request): ?string
    {
        return $request->user()->local_id
            ?? $request->query('local_id');
    }
}
