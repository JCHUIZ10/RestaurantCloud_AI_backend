<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Admin\Services\AnulacionAuditoriaService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AnulacionController extends Controller
{
    public function __construct(private AnulacionAuditoriaService $service) {}

    /**
     * GET /api/v1/admin/anulaciones
     */
    public function index(Request $request): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $filtros = [
            'fecha' => $request->query('fecha'),
            'filtro_rapido' => $request->query('filtro_rapido', 'todas'),
            'mozo_id' => $request->query('mozo_id'),
            'busqueda' => $request->query('busqueda'),
        ];

        $resultado = $this->service->listado($localId, $filtros);

        return ApiResponse::ok($resultado);
    }

    /**
     * GET /api/v1/admin/anulaciones/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $resultado = $this->service->detalle($localId, $id);
        if (! $resultado) {
            return ApiResponse::error('ERR_ANULACION_NO_ENCONTRADA', 'Registro de anulación no encontrado o pertenece a otra sede.', 404);
        }

        return ApiResponse::ok($resultado);
    }

    /**
     * POST /api/v1/admin/anulaciones/{id}/revisar
     */
    public function revisar(Request $request, string $id): JsonResponse
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $validated = $request->validate([
            'notas_supervision' => 'nullable|string|max:1000',
        ]);

        try {
            $resultado = $this->service->revisar(
                $localId,
                $id,
                $request->user()->id,
                $validated['notas_supervision'] ?? null
            );

            return ApiResponse::ok($resultado);
        } catch (RuntimeException $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;

            $codigo = match ($status) {
                404 => 'ERR_ANULACION_NO_ENCONTRADA',
                409 => 'ERR_ANULACION_YA_REVISADA',
                default => 'ERR_REVISION_ANULACION',
            };

            return ApiResponse::error($codigo, $e->getMessage(), $status);
        }
    }

    /**
     * La sede activa la valida y asigna el middleware TenantContext: no se debe
     * confiar en el header X-Local-Id ni en el query local_id sin esa validación.
     */
    private function resolverLocalId(Request $request): ?string
    {
        return $request->user()->local_id;
    }
}
