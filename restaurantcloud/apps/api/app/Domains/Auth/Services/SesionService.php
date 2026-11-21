<?php

namespace App\Domains\Auth\Services;

use App\Support\Identificador;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Emite las sesiones opacas que valida el middleware RedisTokenAuth.
 *
 * Es la única fuente del formato de sesión: login, activación de cuenta y
 * autologin tras el registro deben pasar por aquí para que el token emitido
 * sea reconocido por las rutas protegidas y por /auth/refresh.
 */
class SesionService
{
    private const TTL_SESION_SEGUNDOS = 86400;

    private const TTL_REFRESH_SEGUNDOS = 604800;

    public function __construct(private TokenServicios $tokenServicios) {}

    /**
     * Persiste una sesión nueva en Redis para el usuario indicado. Incluye el JWT para
     * microservicios cuando corresponde (ver TokenServicios); su ausencia no impide la sesión.
     *
     * @param  object  $usuario  Modelo Usuario o fila de la tabla usuario.
     * @return array{token: string, refresh_token: string, jwt: ?string, jwt_expira_en: ?string}
     *
     * @throws RuntimeException Si Redis no confirma la sesión; no se entrega token a medias.
     */
    public function emitir(object $usuario, ?string $refreshTokenExistente = null): array
    {
        $token = 'rc_live_'.Str::random(60);
        $tokenHash = hash('sha256', $token);
        $refreshToken = $refreshTokenExistente ?: ('rc_refresh_'.Identificador::aleatorio());

        $sessionPayload = [
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'correo' => $usuario->correo,
            'rol' => $usuario->rol,
            'telefono' => $usuario->telefono,
            'empresa_id' => $usuario->empresa_id,
            'local_id' => $usuario->local_id,
            'estado' => $usuario->estado,
            'refresh_token' => $refreshToken,
        ];

        try {
            Redis::setex("auth:session:{$tokenHash}", self::TTL_SESION_SEGUNDOS, json_encode($sessionPayload));
            Redis::setex("auth:refresh:{$refreshToken}", self::TTL_REFRESH_SEGUNDOS, json_encode([
                'usuario_id' => $usuario->id,
                'token_hash' => $tokenHash,
            ]));
        } catch (\Throwable $e) {
            try {
                Redis::del("auth:session:{$tokenHash}");
                Redis::del("auth:refresh:{$refreshToken}");
            } catch (\Throwable $cleanupException) {
                // El error original es el que se reporta.
            }

            throw new RuntimeException('No fue posible persistir la sesión en Redis.', 0, $e);
        }

        $jwt = $this->tokenServicios->emitirSiCorresponde($usuario);

        return [
            'token' => $token,
            'refresh_token' => $refreshToken,
            'jwt' => $jwt['jwt'] ?? null,
            'jwt_expira_en' => $jwt['jwt_expira_en'] ?? null,
        ];
    }
}
