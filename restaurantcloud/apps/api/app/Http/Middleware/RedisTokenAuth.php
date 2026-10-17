<?php

namespace App\Http\Middleware;

use App\Models\Usuario;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class RedisTokenAuth
{
    /**
     * Intercepta la solicitud para verificar el Bearer Token en Redis sin consultar PostgreSQL.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return ApiResponse::error(
                'TOKEN_NO_PROPORCIONADO',
                'No se proporcionó el token de autorización.',
                401
            );
        }

        $tokenHash = hash('sha256', $token);
        $sessionKey = "auth:session:{$tokenHash}";

        try {
            $sessionDataRaw = Redis::get($sessionKey);
        } catch (\Throwable $e) {
            $sessionDataRaw = null;
        }

        if (! $sessionDataRaw) {
            return ApiResponse::error(
                'TOKEN_INVALIDO_O_EXPIRADO',
                'La sesión ha expirado o el token es inválido.',
                401
            );
        }

        $sessionData = json_decode($sessionDataRaw, true);

        if (! is_array($sessionData) || ! isset($sessionData['id'])) {
            return ApiResponse::error(
                'SESION_CORRUPTA',
                'Los datos de la sesión son inconsistentes.',
                401
            );
        }

        // Reconstituir el modelo Usuario en memoria sin tocar la base de datos
        $user = new Usuario();

        $user->forceFill([
            'id' => $sessionData['id'],
            'nombre' => $sessionData['nombre'] ?? '',
            'correo' => $sessionData['correo'] ?? '',
            'rol' => $sessionData['rol'] ?? '',
            'telefono' => $sessionData['telefono'] ?? null,
            'empresa_id' => $sessionData['empresa_id'] ?? null,
            'local_id' => $sessionData['local_id'] ?? null,
            'estado' => $sessionData['estado'] ?? 'activo',
        ]);
        $user->exists = true;

        // Inyectar el usuario en la solicitud
        $request->setUserResolver(fn () => $user);

        // Renovar suavemente la vida de la sesión (sliding window de 24h)
        try {
            Redis::expire($sessionKey, 86400);
        } catch (\Throwable $e) {
            // Silencioso
        }

        return $next($request);
    }
}
