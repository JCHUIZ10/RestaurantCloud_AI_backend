<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Admin\Exceptions\FinanzasException;
use App\Domains\Admin\Services\FlujoCajaService;
use App\Domains\Admin\Services\GastoOperativoService;
use App\Domains\Admin\Services\RangoFinanzasResolver;
use App\Domains\Admin\Services\TurnosCajaAuditoriaService;
use App\Domains\Caja\Exceptions\CierreTurnoException;
use App\Domains\Caja\Services\BalanceTurnoService;
use App\Domains\Caja\Services\CierreTurnoService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Finanzas del administrador de sede (CU-ADMIN-14): flujo de caja, auditoría de turnos y cierres Z,
 * gastos operativos y cierre de rescate de una terminal abandonada.
 */
class FlujoCajaController extends Controller
{
    public function __construct(
        private RangoFinanzasResolver $rangos,
        private FlujoCajaService $servicioFlujo,
        private TurnosCajaAuditoriaService $servicioTurnos,
        private GastoOperativoService $servicioGastos,
        private BalanceTurnoService $balanceTurno,
        private CierreTurnoService $cierreTurno,
    ) {}

    /**
     * GET /api/v1/admin/finanzas/flujo-caja
     */
    public function flujoCaja(Request $request): JsonResponse
    {
        return $this->responder($request, function (string $localId) use ($request): JsonResponse {
            $rango = $this->resolverRango($request);

            return ApiResponse::ok($this->servicioFlujo->resumen($localId, $rango));
        });
    }

    /**
     * GET /api/v1/admin/finanzas/turnos
     */
    public function turnos(Request $request): JsonResponse
    {
        return $this->responder($request, function (string $localId) use ($request): JsonResponse {
            $rango = $this->resolverRango($request);

            return ApiResponse::ok($this->servicioTurnos->listado($localId, $rango));
        });
    }

    /**
     * GET /api/v1/admin/finanzas/turnos/{id}/reporte-z
     */
    public function reporteZ(Request $request, string $id): JsonResponse
    {
        return $this->responder($request, function (string $localId) use ($id): JsonResponse {
            $reporte = $this->servicioTurnos->reporteZ($localId, $id);
            if ($reporte === null) {
                return ApiResponse::error('ERR_REPORTE_Z_NO_ENCONTRADO', 'Este turno no tiene un Reporte Z archivado.', 404);
            }

            return ApiResponse::ok($reporte);
        });
    }

    /**
     * GET /api/v1/admin/finanzas/turnos/{id}/balance
     * Balance en vivo del turno abierto, previo a un cierre de rescate.
     */
    public function balance(Request $request, string $id): JsonResponse
    {
        return $this->responder($request, function (string $localId) use ($id): JsonResponse {
            $balance = $this->balanceTurno->turnoAbierto($localId, $id);
            if ($balance === null) {
                return ApiResponse::error('ERR_CAJA_NO_ABIERTA', 'El turno indicado no está abierto en esta sede.', 404);
            }

            return ApiResponse::ok($balance);
        });
    }

    /**
     * POST /api/v1/admin/finanzas/turnos/{id}/visar
     */
    public function visar(Request $request, string $id): JsonResponse
    {
        // Dar la conformidad no exige notas; observar un turno sí, para que quede el motivo
        $validated = $request->validate([
            'conforme' => ['required', 'boolean'],
            'notas_auditoria' => $request->boolean('conforme')
                ? ['nullable', 'string', 'max:1000']
                : ['required', 'string', 'min:10', 'max:1000'],
        ], [
            'notas_auditoria.required' => 'Explica el motivo de la observación del turno.',
            'notas_auditoria.min' => 'Explica el motivo de la observación del turno (mínimo 10 caracteres).',
        ]);

        return $this->responder($request, fn (string $localId): JsonResponse => ApiResponse::ok(
            $this->servicioTurnos->visar(
                $localId,
                $id,
                $request->user()->id,
                (bool) $validated['conforme'],
                $validated['notas_auditoria'] ?? null,
            )
        ));
    }

    /**
     * POST /api/v1/admin/finanzas/turnos/{id}/levantar-observacion
     */
    public function levantarObservacion(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'notas' => ['required', 'string', 'min:10', 'max:1000'],
        ], [
            'notas.required' => 'Explica cómo se resolvió la observación del turno.',
            'notas.min' => 'Explica cómo se resolvió la observación (mínimo 10 caracteres).',
        ]);

        return $this->responder($request, fn (string $localId): JsonResponse => ApiResponse::ok(
            $this->servicioTurnos->levantarObservacion($localId, $id, $request->user()->id, $validated['notas'])
        ));
    }

    /**
     * POST /api/v1/admin/finanzas/turnos/{id}/cierre-forzado
     */
    public function cierreForzado(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'efectivo_contado' => ['required', 'numeric', 'min:0'],
            'justificacion' => ['required', 'string', 'min:15', 'max:1000'],
        ], [
            'justificacion.min' => 'El cierre forzado requiere una justificación administrativa detallada (mínimo 15 caracteres).',
        ]);

        return $this->responder($request, function (string $localId) use ($request, $id, $validated): JsonResponse {
            $usuario = $request->user();

            $this->cierreTurno->cerrar(
                $localId,
                $usuario->id,
                $usuario->nombre,
                (float) $validated['efectivo_contado'],
                null,
                null,
                $id,
                $validated['justificacion'],
            );

            return ApiResponse::ok($this->servicioTurnos->turno($localId, $id));
        });
    }

    /**
     * GET /api/v1/admin/finanzas/gastos
     */
    public function gastos(Request $request): JsonResponse
    {
        return $this->responder($request, function (string $localId) use ($request): JsonResponse {
            $rango = $this->resolverRango($request);

            return ApiResponse::ok($this->servicioGastos->listar($localId, $rango));
        });
    }

    /**
     * POST /api/v1/admin/finanzas/gastos
     */
    public function registrarGasto(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categoria' => ['required', Rule::in(array_keys(FlujoCajaService::CATEGORIAS_GASTO))],
            'monto' => ['required', 'numeric', 'gt:0', 'max:9999999.99'],
            'origen_fondos' => ['required', Rule::in(['transferencia_bancaria', 'efectivo_caja'])],
            'proveedor_nombre' => ['required', 'string', 'max:120'],
            'tipo_comprobante' => ['nullable', Rule::in(GastoOperativoService::TIPOS_COMPROBANTE)],
            'numero_documento' => ['nullable', 'string', 'max:80'],
            'descripcion' => ['required', 'string', 'min:10', 'max:1000'],
            'fecha' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
        ], [
            'descripcion.min' => 'La justificación o detalle del gasto es obligatoria (mínimo 10 caracteres).',
            'monto.gt' => 'El importe del egreso debe ser mayor a S/ 0.00.',
        ]);

        return $this->responder($request, fn (string $localId): JsonResponse => ApiResponse::ok(
            $this->servicioGastos->registrar($localId, $request->user()->id, $validated),
            201
        ));
    }

    /**
     * POST /api/v1/admin/finanzas/gastos/{id}/anular
     */
    public function anularGasto(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'motivo' => ['required', 'string', 'min:10', 'max:500'],
        ], [
            'motivo.required' => 'Indica el motivo de la anulación del gasto.',
            'motivo.min' => 'Explica el motivo de la anulación (mínimo 10 caracteres).',
        ]);

        return $this->responder($request, fn (string $localId): JsonResponse => ApiResponse::ok(
            $this->servicioGastos->anular($localId, $request->user()->id, $id, $validated['motivo'])
        ));
    }

    /**
     * @return array{periodo: string, desde: string, hasta: string, inicio: Carbon, fin: Carbon, dias: int}
     *
     * @throws FinanzasException
     */
    private function resolverRango(Request $request): array
    {
        $validated = $request->validate([
            'periodo' => ['nullable', Rule::in(RangoFinanzasResolver::PERIODOS)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return $this->rangos->resolver(
            $validated['periodo'] ?? 'este_mes',
            $validated['desde'] ?? null,
            $validated['hasta'] ?? null,
        );
    }

    /**
     * Ejecuta la acción con la sede del usuario y traduce los errores de negocio a la respuesta estándar.
     *
     * @param  Closure(string): JsonResponse  $accion
     */
    private function responder(Request $request, Closure $accion): JsonResponse
    {
        $localId = $request->user()->local_id;
        if (! $localId) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Debe especificar una sede o local válido.', 400);
        }

        try {
            return $accion($localId);
        } catch (FinanzasException $e) {
            return ApiResponse::error($e->codigoError, $e->getMessage(), $e->status);
        } catch (CierreTurnoException $e) {
            return ApiResponse::error($e->codigoError, $e->getMessage(), $e->status);
        }
    }
}
