<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Inventario\Services\ProveedorService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function __construct(private ProveedorService $proveedorService) {}

    public function index(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $datos = $this->proveedorService->listado($localId, $request->query());

        return ApiResponse::ok($datos);
    }

    public function store(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $data = $request->validate([
            'nombre' => 'required|string|min:3|max:100',
            'contacto' => 'nullable|string|max:80',
            'telefono' => 'required|string|min:6|max:20',
            'email' => 'nullable|email|max:100',
            'direccion' => 'nullable|string|max:150',
            'insumos_ids' => 'nullable|array',
            'insumos_ids.*' => 'string|uuid',
        ]);

        try {
            $proveedor = $this->proveedorService->crear($localId, $data);
            return ApiResponse::ok($proveedor, 201);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_PROVEEDOR_DUPLICADO', $e->getMessage(), 409);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $proveedor = $this->proveedorService->obtener($id, $localId);
        if (! $proveedor) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', 'El proveedor no existe o no pertenece a esta sede.', 404);
        }

        return ApiResponse::ok($proveedor);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $data = $request->validate([
            'nombre' => 'required|string|min:3|max:100',
            'contacto' => 'nullable|string|max:80',
            'telefono' => 'required|string|min:6|max:20',
            'email' => 'nullable|email|max:100',
            'direccion' => 'nullable|string|max:150',
            'insumos_ids' => 'nullable|array',
            'insumos_ids.*' => 'string|uuid',
            'activo' => 'nullable|boolean',
        ]);

        try {
            $proveedor = $this->proveedorService->actualizar($id, $localId, $data);
            if (! $proveedor) {
                return ApiResponse::error('ERR_NO_ENCONTRADO', 'El proveedor no existe o no pertenece a esta sede.', 404);
            }
            return ApiResponse::ok($proveedor);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_PROVEEDOR_DUPLICADO', $e->getMessage(), 409);
        }
    }

    public function estado(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $data = $request->validate([
            'activo' => 'required|boolean',
        ]);

        $proveedor = $this->proveedorService->cambiarEstado($id, $localId, $data['activo']);
        if (! $proveedor) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', 'El proveedor no existe o no pertenece a esta sede.', 404);
        }

        return ApiResponse::ok($proveedor);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        try {
            $eliminado = $this->proveedorService->eliminar($id, $localId);
            if (! $eliminado) {
                return ApiResponse::error('ERR_NO_ENCONTRADO', 'El proveedor no existe o no pertenece a esta sede.', 404);
            }
            return ApiResponse::ok(['id' => $id, 'mensaje' => 'Proveedor eliminado exitosamente.']);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_PROVEEDOR_TIENE_COMPRAS', $e->getMessage(), 409);
        }
    }

    public function historial(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $historial = $this->proveedorService->obtenerHistorialCompras($id, $localId);
        if (! $historial) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', 'El proveedor no existe o no pertenece a esta sede.', 404);
        }

        return ApiResponse::ok($historial);
    }

    private function resolverLocalId(Request $request): ?string
    {
        return $request->user()->local_id
            ?? $request->query('local_id');
    }
}
