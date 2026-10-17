<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Respuesta estandarizada exitosa.
     */
    public static function ok(mixed $datos = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'exito' => true,
            'datos' => $datos,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ], $status);
    }

    /**
     * Respuesta estandarizada con error de negocio o validación.
     */
    public static function error(string $codigo, string $mensaje, int $status = 400): JsonResponse
    {
        return response()->json([
            'exito' => false,
            'errores' => [
                [
                    'codigo' => $codigo,
                    'mensaje' => $mensaje,
                ],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ], $status);
    }
}
