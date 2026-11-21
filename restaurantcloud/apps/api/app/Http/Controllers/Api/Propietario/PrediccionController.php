<?php

namespace App\Http\Controllers\Api\Propietario;

use App\Domains\Pronostico\Services\PronosticoPropietarioService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Predicción de demanda de todas las sedes de la empresa (CU-PROP-08).
 */
class PrediccionController extends Controller
{
    public function __construct(private PronosticoPropietarioService $prediccion) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->prediccion->resumen((string) $request->user()->empresa_id));
    }
}
