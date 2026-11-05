<?php

namespace App\Http\Controllers\Api\Propietario;

use App\Domains\Suscripcion\Exceptions\CambioPlanException;
use App\Domains\Suscripcion\Services\CambioPlanService;
use App\Domains\Suscripcion\Services\ComparativaPlanesService;
use App\Domains\Suscripcion\Services\SeleccionConservarService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CU-PROP-03: cambio de plan de la suscripción.
 */
class CambioPlanController extends Controller
{
    public function __construct(
        private ComparativaPlanesService $comparativa,
        private CambioPlanService $cambios,
        private SeleccionConservarService $seleccion,
    ) {}

    /**
     * GET /api/v1/propietario/suscripcion/planes-comparativa
     * Catálogo de planes contrastado con el uso real de la empresa.
     */
    public function comparativa(Request $request): JsonResponse
    {
        $datos = $this->comparativa->comparativa((string) $request->user()->empresa_id);

        if (! $datos) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'No se encontró la empresa de tu cuenta.', 404);
        }

        return ApiResponse::ok($datos);
    }

    /**
     * POST /api/v1/propietario/suscripcion/simular-upgrade
     * Desglose del prorrateo, sin cobrar ni modificar nada.
     */
    public function simularUpgrade(Request $request): JsonResponse
    {
        $planId = $this->validarPlan($request);

        try {
            return ApiResponse::ok($this->cambios->simularUpgrade((string) $request->user()->empresa_id, $planId));
        } catch (CambioPlanException $e) {
            return ApiResponse::error($e->codigo, $e->getMessage(), $e->status);
        }
    }

    /**
     * POST /api/v1/propietario/suscripcion/ejecutar-upgrade
     * Cobra el prorrateo con la tarjeta guardada y activa el nuevo plan al instante.
     */
    public function ejecutarUpgrade(Request $request): JsonResponse
    {
        $planId = $this->validarPlan($request);

        try {
            return ApiResponse::ok($this->cambios->ejecutarUpgrade((string) $request->user()->empresa_id, $planId));
        } catch (CambioPlanException $e) {
            return ApiResponse::error($e->codigo, $e->getMessage(), $e->status);
        }
    }

    /**
     * POST /api/v1/propietario/suscripcion/programar-cambio
     * Programa un downgrade (o pasar de anual a mensual) para cuando termine el periodo pagado.
     */
    public function programarCambio(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nuevo_plan_id' => ['required', 'integer'],
            'ciclo' => ['required', 'string', 'in:mensual,anual'],
        ]);

        try {
            return ApiResponse::ok($this->cambios->programarCambio(
                (string) $request->user()->empresa_id,
                (int) $validated['nuevo_plan_id'],
                $validated['ciclo']
            ));
        } catch (CambioPlanException $e) {
            return ApiResponse::error($e->codigo, $e->getMessage(), $e->status);
        }
    }

    /**
     * DELETE /api/v1/propietario/suscripcion/cambio-programado
     */
    public function cancelarCambio(Request $request): JsonResponse
    {
        try {
            $resultado = $this->cambios->cancelarCambio((string) $request->user()->empresa_id);
        } catch (CambioPlanException $e) {
            return ApiResponse::error($e->codigo, $e->getMessage(), $e->status);
        }

        return ApiResponse::ok($resultado + ['mensaje' => "Cambio cancelado. Sigues en tu Plan {$resultado['plan_activo']}."]);
    }

    /**
     * GET /api/v1/propietario/suscripcion/recursos-conciliacion
     * Recursos activos por local y la selección que se aplicaría al renovar.
     */
    public function recursosConciliacion(Request $request): JsonResponse
    {
        try {
            return ApiResponse::ok($this->seleccion->recursos((string) $request->user()->empresa_id));
        } catch (CambioPlanException $e) {
            return ApiResponse::error($e->codigo, $e->getMessage(), $e->status);
        }
    }

    /**
     * PUT /api/v1/propietario/suscripcion/cambio-programado/seleccion
     * Guarda qué conservar; es editable hasta la fecha efectiva del cambio.
     */
    public function guardarSeleccion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'locales_ids' => ['present', 'array'],
            'locales_ids.*' => ['uuid'],
            'pisos_ids' => ['present', 'array'],
            'pisos_ids.*' => ['uuid'],
            'mesas_ids' => ['present', 'array'],
            'mesas_ids.*' => ['uuid'],
            'usuarios_ids' => ['present', 'array'],
            'usuarios_ids.*' => ['uuid'],
        ]);

        try {
            return ApiResponse::ok($this->seleccion->guardar((string) $request->user()->empresa_id, $validated));
        } catch (CambioPlanException $e) {
            return ApiResponse::error($e->codigo, $e->getMessage(), $e->status);
        }
    }

    private function validarPlan(Request $request): int
    {
        return (int) $request->validate([
            'nuevo_plan_id' => ['required', 'integer'],
        ])['nuevo_plan_id'];
    }
}
