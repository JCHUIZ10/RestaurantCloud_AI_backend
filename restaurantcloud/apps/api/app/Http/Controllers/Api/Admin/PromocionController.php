<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Promociones\Services\PromocionService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromocionController extends Controller
{
    public function __construct(private PromocionService $promocionService) {}

    public function index(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $filtros = [
            'estado' => $request->query('estado'),
            'tipo_descuento' => $request->query('tipo_descuento'),
            'busqueda' => $request->query('busqueda'),
            'mes' => $request->query('mes'),
        ];

        $datos = $this->promocionService->listado($localId, $filtros);

        return ApiResponse::ok($datos);
    }

    public function buscar(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return ApiResponse::error('ERR_BUSQUEDA_VACIA', 'Debe especificar un término de búsqueda.', 400);
        }

        $estado = $request->query('estado');
        $tipo = $request->query('tipo');

        $resultado = $this->promocionService->buscar($localId, $q, $estado, $tipo);

        return ApiResponse::ok($resultado);
    }

    public function store(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $data = $request->validate([
            'nombre' => 'required|string|min:3|max:100',
            'descripcion' => 'nullable|string|max:255',
            'tipo_descuento' => 'required|string|in:porcentaje,monto_fijo',
            'valor' => 'required|numeric|gt:0',
            'tope_maximo_descuento' => 'nullable|numeric|gt:0',
            'monto_minimo_consumo' => 'nullable|numeric|gte:0',
            'dias_semana' => 'nullable|array',
            'dias_semana.*' => 'integer|between:1,7',
            'hora_inicio' => 'nullable|string',
            'hora_fin' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date',
            'tipo_limite_usos' => 'nullable|string|in:sin_limite,diario,global',
            'limite_usos' => 'nullable|integer|gt:0',
            'activa' => 'nullable|boolean',
        ]);

        try {
            $promocion = $this->promocionService->crear($localId, $data);
            return ApiResponse::ok($promocion, 201);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_PROMOCION_DUPLICADA', $e->getMessage(), 409);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_VALIDACION_PROMOCION', $e->getMessage(), 422);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $promocion = $this->promocionService->obtener($id, $localId);
        if (! $promocion) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', 'La promoción no existe o no pertenece a esta sede.', 404);
        }

        return ApiResponse::ok($promocion);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $data = $request->validate([
            'nombre' => 'nullable|string|min:3|max:100',
            'descripcion' => 'nullable|string|max:255',
            'tipo_descuento' => 'nullable|string|in:porcentaje,monto_fijo',
            'valor' => 'nullable|numeric|gt:0',
            'tope_maximo_descuento' => 'nullable|numeric|gt:0',
            'monto_minimo_consumo' => 'nullable|numeric|gte:0',
            'dias_semana' => 'nullable|array',
            'dias_semana.*' => 'integer|between:1,7',
            'hora_inicio' => 'nullable|string',
            'hora_fin' => 'nullable|string',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'tipo_limite_usos' => 'nullable|string|in:sin_limite,diario,global',
            'limite_usos' => 'nullable|integer|gt:0',
            'activa' => 'nullable|boolean',
        ]);

        try {
            $promocion = $this->promocionService->actualizar($id, $localId, $data);
            return ApiResponse::ok($promocion);
        } catch (\DomainException $e) {
            $status = $e->getCode() ?: 400;
            $code = $status === 409 ? 'ERR_PROMOCION_DUPLICADA' : 'ERR_NO_ENCONTRADO';
            return ApiResponse::error($code, $e->getMessage(), $status);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_VALIDACION_PROMOCION', $e->getMessage(), 422);
        }
    }

    public function estado(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $data = $request->validate([
            'activa' => 'required|boolean',
        ]);

        try {
            $promocion = $this->promocionService->toggleEstado($id, $localId, $data['activa']);
            return ApiResponse::ok($promocion);
        } catch (\DomainException $e) {
            $msg = $e->getMessage();
            $code = str_contains($msg, 'vigencia') ? 'ERR_PROMOCION_VENCIDA' : (str_contains($msg, 'cupo') ? 'ERR_CUPO_AGOTADO' : 'ERR_NO_ENCONTRADO');
            return ApiResponse::error($code, $msg, $e->getCode() ?: 400);
        }
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        try {
            $this->promocionService->eliminar($id, $localId);
            return ApiResponse::ok(['id' => $id, 'mensaje' => 'Promoción eliminada exitosamente.']);
        } catch (\DomainException $e) {
            $status = $e->getCode() ?: 400;
            $code = $status === 409 ? 'ERR_PROMOCION_CON_HISTORIAL' : 'ERR_NO_ENCONTRADO';
            return ApiResponse::error($code, $e->getMessage(), $status);
        }
    }

    public function rendimiento(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        try {
            $datos = $this->promocionService->rendimiento($id, $localId);
            return ApiResponse::ok($datos);
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_NO_ENCONTRADO', $e->getMessage(), 404);
        }
    }

    public function cajaElegibles(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $totalConsumo = (float) $request->query('total_consumo', 0.0);
        $resultado = $this->promocionService->promocionesVigentesCaja($localId, $totalConsumo);

        return ApiResponse::ok($resultado);
    }

    private function resolverLocalId(Request $request): ?string
    {
        return $request->user()->local_id
            ?? $request->query('local_id');
    }
}
