<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Pronostico\Exceptions\PronosticoException;
use App\Domains\Pronostico\Services\PronosticoService;
use App\Domains\Pronostico\Services\ReposicionService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Pronóstico de demanda y reposición sugerida (CU-ADMIN-07, CU-PROP-08).
 */
class PronosticoController extends Controller
{
    public function __construct(
        private PronosticoService $pronosticos,
        private ReposicionService $reposicion,
    ) {}

    /**
     * Pide un pronóstico a ms-pronóstico y calcula la reposición para los días de cobertura elegidos.
     */
    public function generar(Request $request): JsonResponse
    {
        $validador = Validator::make($request->all(), [
            'cobertura_dias' => ['sometimes', 'integer', 'in:3,5,7'],
            'solicitud_id' => ['sometimes', 'uuid'],
        ]);
        if ($validador->fails()) {
            return $this->errorDeValidacion($validador->errors()->toArray());
        }

        $usuario = $request->user();

        try {
            $resultado = $this->pronosticos->generar(
                (string) $usuario->empresa_id,
                $usuario->local_id,
                (string) $usuario->id,
                (int) $request->input('cobertura_dias', 7),
                $request->input('solicitud_id'),
            );
        } catch (PronosticoException $e) {
            return $this->error($e);
        }

        return ApiResponse::ok($resultado, 201);
    }

    /**
     * Último pronóstico del local con su reposición sugerida.
     */
    public function ultimo(Request $request): JsonResponse
    {
        $usuario = $request->user();

        try {
            return ApiResponse::ok($this->pronosticos->ultimo((string) $usuario->empresa_id, $usuario->local_id));
        } catch (PronosticoException $e) {
            return $this->error($e);
        }
    }

    /**
     * El administrador acepta, ajusta o descarta una recomendación de reposición.
     */
    public function decidir(Request $request, string $id): JsonResponse
    {
        $validador = Validator::make($request->all(), [
            'estado' => ['required', 'in:aceptada,ajustada,descartada'],
            'cantidad_final' => ['required_if:estado,ajustada', 'nullable', 'numeric', 'min:0', 'max:999999999'],
        ]);
        if ($validador->fails()) {
            return $this->errorDeValidacion($validador->errors()->toArray());
        }

        $usuario = $request->user();
        if (! $usuario->local_id) {
            return ApiResponse::error('ERR_LOCAL_REQUERIDO', 'Selecciona una sede para decidir una recomendación.', 422);
        }

        try {
            $recomendacion = $this->reposicion->decidir(
                $id,
                $usuario->local_id,
                (string) $usuario->id,
                $request->input('estado'),
                $request->filled('cantidad_final') ? round((float) $request->input('cantidad_final'), 3) : null,
            );
        } catch (PronosticoException $e) {
            return $this->error($e);
        }

        return ApiResponse::ok($recomendacion);
    }

    private function error(PronosticoException $e): JsonResponse
    {
        return ApiResponse::error($e->codigo, $e->getMessage(), $e->status, $e->detalles ?: null);
    }

    /**
     * @param  array<string, list<string>>  $errores
     */
    private function errorDeValidacion(array $errores): JsonResponse
    {
        $campos = [];
        foreach ($errores as $campo => $motivos) {
            $campos[] = ['campo' => $campo, 'motivo' => $motivos[0]];
        }

        return ApiResponse::error('ERR_VALIDACION', 'Los datos enviados no son válidos.', 422, ['campos' => $campos]);
    }
}
