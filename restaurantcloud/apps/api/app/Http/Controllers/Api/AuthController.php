<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Autenticación multi-rol y resolución multi-cuenta con emisión de token almacenado en Redis.
     * Conforme a la especificación CU-AUTH-01 con control de intentos fallidos en Redis (bloqueo 5 min tras 3 intentos).
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'correo' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $correoSanitizado = trim(strtolower($validated['correo']));
        $ip = $request->ip() ?: '127.0.0.1';
        $redisKey = "auth:intentos:{$ip}:" . md5($correoSanitizado);

        // 1. Verificar si ha superado los 3 intentos fallidos en Redis (bloqueo por 5 minutos = 300 segundos)
        $intentos = 0;
        try {
            $intentos = (int) Redis::get($redisKey);
        } catch (\Throwable $e) {
            // Silencioso
        }

        if ($intentos >= 3) {
            return ApiResponse::error(
                'DEMASIADOS_INTENTOS',
                'Demasiados intentos fallidos. Intenta nuevamente en 5 minutos.',
                429
            );
        }

        // 2. Obtener usuarios por correo
        $usuarios = Usuario::where('correo', $correoSanitizado)->get();

        if ($usuarios->isEmpty()) {
            $this->registrarIntentoFallido($redisKey);
            return ApiResponse::error(
                'CREDENCIALES_INVALIDAS',
                'Correo o contraseña incorrectos.',
                401
            );
        }

        // Filtrar aquellos donde la contraseña coincida
        $usuariosValidos = $usuarios->filter(function ($u) use ($validated) {
            return password_verify($validated['password'], $u->password_hash);
        });

        if ($usuariosValidos->isEmpty()) {
            $this->registrarIntentoFallido($redisKey);
            return ApiResponse::error(
                'CREDENCIALES_INVALIDAS',
                'Correo o contraseña incorrectos.',
                401
            );
        }

        // Filtrar usuarios activos
        $usuariosActivos = $usuariosValidos->where('estado', 'activo');

        if ($usuariosActivos->isEmpty()) {
            return ApiResponse::error(
                'USUARIO_INACTIVO',
                'Tu usuario se encuentra desactivado.',
                403
            );
        }

        // 3. Autenticación exitosa: limpiar intentos en Redis
        try {
            Redis::del($redisKey);
        } catch (\Throwable $e) {
            // Silencioso
        }

        // CASO B: Múltiples cuentas asociadas al mismo correo (Vista 2 del Wireframe)
        if ($usuariosActivos->count() > 1) {
            $cuentas = $usuariosActivos->map(function ($u) {
                $empresa = $u->empresa_id ? DB::table('empresa')->where('id', $u->empresa_id)->first() : null;
                $local = $u->local_id ? DB::table('local')->where('id', $u->local_id)->first() : null;

                $empresaActiva = $empresa ? ($empresa->estado === 'activa') : true;

                return [
                    'usuario_id' => $u->id,
                    'empresa_id' => $u->empresa_id,
                    'empresa_nombre' => $empresa ? $empresa->razon_social : 'RestaurantCloud SaaS',
                    'local_id' => $u->local_id,
                    'local_nombre' => $local ? $local->nombre : ($u->rol === 'propietario' ? 'Acceso Global' : 'Oficina Principal'),
                    'rol' => $u->rol,
                    'estado_empresa' => $empresa ? $empresa->estado : 'activa',
                    'acceso_habilitado' => $empresaActiva,
                    'motivo_bloqueo' => $empresaActiva ? null : 'Suscripción suspendida o inactiva',
                ];
            })->values();

            // Emitir temp_token en Redis (5 min)
            $tempToken = 'rc_temp_' . Str::random(48);
            try {
                Redis::setex("auth:temp:{$tempToken}", 300, json_encode([
                    'correo' => $correoSanitizado,
                    'cuentas_ids' => $usuariosActivos->pluck('id')->all(),
                ]));
            } catch (\Throwable $e) {
                // Silencioso
            }

            return ApiResponse::ok([
                'requiere_seleccion' => true,
                'temp_token' => $tempToken,
                'expira_en_segundos' => 300,
                'cuentas' => $cuentas,
            ]);
        }

        // CASO A: Cuenta única activa (Acceso directo al panel)
        /** @var Usuario $user */
        $user = $usuariosActivos->first();
        return $this->generarRespuestaSesionExitosa($user);
    }

    /**
     * Endpoint para confirmar la selección de sede en el flujo multi-cuenta (CU-AUTH-01 Paso 2).
     */
    public function seleccionarCuenta(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'usuario_id' => ['required', 'string', 'uuid'],
        ]);

        $user = Usuario::find($validated['usuario_id']);


        if (! $user) {
            return ApiResponse::error(
                'CUENTA_NO_ENCONTRADA',
                'La cuenta seleccionada no existe.',
                404
            );
        }

        if ($user->estado !== 'activo') {
            return ApiResponse::error(
                'USUARIO_INACTIVO',
                'El acceso a este restaurante se encuentra desactivado.',
                403
            );
        }

        if ($user->empresa_id) {
            $empresa = DB::table('empresa')->where('id', $user->empresa_id)->first();
            if ($empresa && $empresa->estado !== 'activa') {
                return ApiResponse::error(
                    'EMPRESA_SUSPENDIDA',
                    'El acceso a esta empresa se encuentra suspendido.',
                    403
                );
            }
        }

        return $this->generarRespuestaSesionExitosa($user);
    }

    /**
     * Endpoint para renovar silenciosamente el Access Token mediante el refresh_token opaco en Redis.
     */
    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $refreshToken = $validated['refresh_token'];
        $refreshKey = "auth:refresh:{$refreshToken}";

        try {
            $dataRaw = Redis::get($refreshKey);
        } catch (\Throwable $e) {
            $dataRaw = null;
        }

        if (! $dataRaw) {
            return ApiResponse::error(
                'REFRESH_TOKEN_INVALIDO',
                'El token de actualización ha expirado o no es válido.',
                401
            );
        }

        $payload = json_decode($dataRaw, true);
        if (! isset($payload['usuario_id'])) {
            return ApiResponse::error(
                'REFRESH_TOKEN_CORRUPTO',
                'Datos de renovación corruptos.',
                401
            );
        }

        $user = Usuario::find($payload['usuario_id']);
        if (! $user || $user->estado !== 'activo') {
            return ApiResponse::error(
                'USUARIO_INACTIVO',
                'El usuario ya no se encuentra activo.',
                403
            );
        }

        // Borrar sesión anterior asociada si existía
        if (isset($payload['token_hash'])) {
            try {
                Redis::del("auth:session:{$payload['token_hash']}");
            } catch (\Throwable $e) {
                // Silencioso
            }
        }

        // Generar y almacenar nueva sesión
        return $this->generarRespuestaSesionExitosa($user, $refreshToken);
    }

    /**
     * Registra el intento fallido en Redis y fija TTL de 5 minutos (300 segundos).
     */
    private function registrarIntentoFallido(string $redisKey): void
    {
        try {
            $nuevoTotal = Redis::incr($redisKey);
            if ($nuevoTotal === 1) {
                Redis::expire($redisKey, 300); // 5 minutos de bloqueo
            }
        } catch (\Throwable $e) {
            // Silencioso
        }
    }

    /**
     * Genera token y refresh_token en Redis (Cero consultas a personal_access_tokens).
     */
    private function generarRespuestaSesionExitosa(Usuario $user, ?string $existingRefreshToken = null): JsonResponse

    {
        $user->update(['ultimo_login' => now()]);

        // Generar tokens opacos
        $token = 'rc_live_' . Str::random(60);
        $tokenHash = hash('sha256', $token);
        $refreshToken = $existingRefreshToken ?: ('rc_refresh_' . Str::uuid()->toString());

        $empresa = $user->empresa_id ? DB::table('empresa')->where('id', $user->empresa_id)->first() : null;
        $local = $user->local_id ? DB::table('local')->where('id', $user->local_id)->first() : null;

        $sessionPayload = [
            'id' => $user->id,
            'nombre' => $user->nombre,
            'correo' => $user->correo,
            'rol' => $user->rol,
            'telefono' => $user->telefono,
            'empresa_id' => $user->empresa_id,
            'local_id' => $user->local_id,
            'estado' => $user->estado,
            'refresh_token' => $refreshToken,
        ];

        // Guardar sesión activa en Redis (TTL 24 horas = 86400s)
        try {
            Redis::setex("auth:session:{$tokenHash}", 86400, json_encode($sessionPayload));

            // Guardar refresh_token en Redis (TTL 7 días = 604800s)
            Redis::setex("auth:refresh:{$refreshToken}", 604800, json_encode([
                'usuario_id' => $user->id,
                'token_hash' => $tokenHash,
            ]));
        } catch (\Throwable $e) {
            // No se debe entregar un token si la sesión no fue persistida.
            try {
                Redis::del("auth:session:{$tokenHash}");
                Redis::del("auth:refresh:{$refreshToken}");
            } catch (\Throwable $cleanupException) {
                // La respuesta principal conserva el error de disponibilidad.
            }

            return ApiResponse::error(
                'SERVICIO_SESION_NO_DISPONIBLE',
                'No fue posible iniciar la sesión. Intenta nuevamente en unos minutos.',
                503
            );
        }


        return ApiResponse::ok([
            'requiere_seleccion' => false,
            'token' => $token,
            'refresh_token' => $refreshToken,
            'usuario' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'correo' => $user->correo,
                'rol' => $user->rol,
                'telefono' => $user->telefono,
                'empresa_id' => $user->empresa_id,
                'local_id' => $user->local_id,
                'empresa' => $empresa ? [
                    'id' => $empresa->id,
                    'nombre' => $empresa->razon_social,
                ] : null,
                'local' => $local ? [
                    'id' => $local->id,
                    'nombre' => $local->nombre,
                ] : null,
            ],
        ]);
    }

    /**
     * Obtener el perfil del usuario autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $empresa = $user->empresa_id ? DB::table('empresa')->where('id', $user->empresa_id)->first() : null;
        $local = $user->local_id ? DB::table('local')->where('id', $user->local_id)->first() : null;

        return ApiResponse::ok([
            'id' => $user->id,
            'nombre' => $user->nombre,
            'correo' => $user->correo,
            'rol' => $user->rol,
            'telefono' => $user->telefono,
            'empresa_id' => $user->empresa_id,
            'local_id' => $user->local_id,
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'nombre' => $empresa->razon_social,
            ] : null,
            'local' => $local ? [
                'id' => $local->id,
                'nombre' => $local->nombre,
            ] : null,
        ]);
    }

    /**
     * Cerrar sesión y purgar la clave de sesión y el refresh_token de Redis.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            $tokenHash = hash('sha256', $token);
            try {
                $sessionDataRaw = Redis::get("auth:session:{$tokenHash}");
                if ($sessionDataRaw) {
                    $sessionData = json_decode($sessionDataRaw, true);
                    if (! empty($sessionData['refresh_token'])) {
                        Redis::del("auth:refresh:{$sessionData['refresh_token']}");
                    }
                }
                Redis::del("auth:session:{$tokenHash}");
            } catch (\Throwable $e) {
                // Silencioso
            }
        }

        return ApiResponse::ok(['mensaje' => 'Sesión cerrada correctamente.']);
    }

}
