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
     * Soporta:
     * - ApiResponse::error('Mensaje de error', 404)
     * - ApiResponse::error('CODIGO_ERROR', 'Mensaje de error', 422)
     */
    public static function error(string $codigoOMensaje, string|int $mensajeOStatus = 400, int $status = 400): JsonResponse
    {
        if (is_int($mensajeOStatus)) {
            $status = $mensajeOStatus;
            $mensaje = $codigoOMensaje;
            $codigo = match ($status) {
                400 => 'BAD_REQUEST',
                401 => 'UNAUTHORIZED',
                403 => 'FORBIDDEN',
                404 => 'NOT_FOUND',
                409 => 'CONFLICT',
                422 => 'UNPROCESSABLE_ENTITY',
                default => 'ERROR',
            };
        } else {
            $codigo = $codigoOMensaje;
            $mensaje = $mensajeOStatus;
        }

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
