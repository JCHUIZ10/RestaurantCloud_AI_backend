<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Admin\Services\AnulacionAuditoriaService;
use App\Domains\Admin\Services\AnulacionExportacionService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AnulacionController extends Controller
{
    public function __construct(
        private AnulacionAuditoriaService $service,
        private AnulacionExportacionService $exportacion,
    ) {}

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
     * GET /api/v1/admin/anulaciones/exportar/resumen?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
     *
     * Totales del periodo para la vista previa del modal de exportación.
     */
    public function resumenExportacion(Request $request): JsonResponse
    {
        $periodo = $this->validarPeriodo($request);
        if ($periodo instanceof JsonResponse) {
            return $periodo;
        }

        [$localId, $desde, $hasta] = $periodo;

        return ApiResponse::ok(array_merge(
            ['desde' => $desde, 'hasta' => $hasta],
            $this->exportacion->resumen($localId, $desde, $hasta)
        ));
    }

    /**
     * GET /api/v1/admin/anulaciones/exportar?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
     *
     * Descarga el Excel (hoja Resumen + hoja Detalle) con todas las anulaciones del periodo.
     * El archivo se genera aquí, dentro de la petición, para conservar el contexto RLS que
     * TenantContext instala en la transacción de la solicitud.
     */
    public function exportar(Request $request): JsonResponse|BinaryFileResponse
    {
        $periodo = $this->validarPeriodo($request);
        if ($periodo instanceof JsonResponse) {
            return $periodo;
        }

        [$localId, $desde, $hasta] = $periodo;

        if (! $this->exportacion->hayAnulaciones($localId, $desde, $hasta)) {
            return ApiResponse::error(
                'ERR_SIN_ANULACIONES',
                'No hay anulaciones registradas '.$this->describirPeriodo($desde, $hasta).'.',
                404
            );
        }

        $archivo = $this->exportacion->generar($localId, $desde, $hasta, $request->user());

        return response()->download($archivo['ruta'], $archivo['nombre'], [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-store',
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Valida sede y periodo compartidos por el resumen y la descarga.
     *
     * @return JsonResponse|array{0: string, 1: string, 2: string} Error, o [localId, desde, hasta]
     */
    private function validarPeriodo(Request $request): JsonResponse|array
    {
        $localId = $this->resolverLocalId($request);
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        $validated = $request->validate([
            'desde' => 'required|date_format:Y-m-d',
            'hasta' => 'required|date_format:Y-m-d|after_or_equal:desde',
        ]);

        if ($this->exportacion->excedeRangoMaximo($validated['desde'], $validated['hasta'])) {
            return ApiResponse::error(
                'ERR_RANGO_EXCEDIDO',
                'El periodo no puede superar '.AnulacionExportacionService::MAX_DIAS.' días. Divide la exportación en varios periodos.',
                422
            );
        }

        return [$localId, $validated['desde'], $validated['hasta']];
    }

    private function describirPeriodo(string $desde, string $hasta): string
    {
        $inicio = Carbon::parse($desde)->format('d/m/Y');

        return $desde === $hasta
            ? "el {$inicio}"
            : "entre el {$inicio} y el ".Carbon::parse($hasta)->format('d/m/Y');
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
