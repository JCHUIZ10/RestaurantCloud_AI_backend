<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ActivacionCuentaController extends Controller
{
    /**
     * GET /api/v1/public/activar-cuenta/validar?token=...
     * Valida el token efímero de invitación en Redis y retorna los datos públicos.
     */
    public function validar(Request $request): JsonResponse
    {
        $token = trim((string) $request->query('token', ''));

        if (! $token || strlen($token) < 20) {
            return ApiResponse::error(
                'TOKEN_INVALIDO_O_EXPIRADO',
                'El enlace de activación es inválido o no contiene un token válido.',
                400,
            );
        }

        try {
            $raw = Redis::get("invitacion:admin:{$token}");
        } catch (\Throwable $e) {
            $raw = null;
        }

        if (! $raw) {
            return ApiResponse::error(
                'TOKEN_INVALIDO_O_EXPIRADO',
                'El enlace de activación ha caducado o ya fue utilizado. Solicita al propietario de tu restaurante que te reenvíe una nueva invitación.',
                404,
            );
        }

        $datosInvitacion = json_decode($raw, true);
        if (! is_array($datosInvitacion) || empty($datosInvitacion['usuario_id'])) {
            return ApiResponse::error(
                'TOKEN_INVALIDO_O_EXPIRADO',
                'Los datos asociados a la invitación están corruptos o incompletos.',
                400,
            );
        }

        // Verificar en PostgreSQL el estado del usuario
        $usuario = DB::table('usuario')->where('id', $datosInvitacion['usuario_id'])->first();

        if (! $usuario) {
            return ApiResponse::error(
                'USUARIO_NO_ENCONTRADO',
                'El colaborador asignado a esta invitación ya no existe en el sistema.',
                404,
            );
        }

        if ($usuario->estado === 'activo') {
            return ApiResponse::error(
                'CUENTA_YA_ACTIVADA',
                'Esta cuenta ya fue activada previamente. Por favor inicia sesión directamente con tu correo electrónico y contraseña.',
                400,
            );
        }

        // Obtener datos de la empresa
        $empresa = DB::table('empresa')->where('id', $datosInvitacion['empresa_id'])->first();

        return ApiResponse::ok([
            'valido' => true,
            'token' => $token,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
            ],
            'empresa' => [
                'id' => $empresa ? $empresa->id : $datosInvitacion['empresa_id'],
                'nombre' => $empresa ? $empresa->razon_social : 'Restaurante',
            ],
            'expira_en' => $datosInvitacion['expira_en'] ?? null,
        ]);
    }

    /**
     * POST /api/v1/public/activar-cuenta/completar
     * Consume el token de Redis, actualiza la contraseña en PostgreSQL y emite sesión autenticada.
     */
    public function completar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'min:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $token = trim($validated['token']);

        try {
            $raw = Redis::get("invitacion:admin:{$token}");
        } catch (\Throwable $e) {
            $raw = null;
        }

        if (! $raw) {
            return ApiResponse::error(
                'TOKEN_INVALIDO_O_EXPIRADO',
                'El enlace de activación ha caducado o ya fue consumido.',
                404,
            );
        }

        $datosInvitacion = json_decode($raw, true);
        if (! is_array($datosInvitacion) || empty($datosInvitacion['usuario_id'])) {
            return ApiResponse::error(
                'TOKEN_INVALIDO_O_EXPIRADO',
                'El token de invitación es inválido.',
                400,
            );
        }

        $usuarioId = $datosInvitacion['usuario_id'];
        $empresaId = $datosInvitacion['empresa_id'];

        // Actualización transaccional en PostgreSQL
        $usuario = DB::transaction(function () use ($usuarioId, $validated) {
            $u = DB::table('usuario')->where('id', $usuarioId)->lockForUpdate()->first();

            if (! $u) {
                return null;
            }

            if ($u->estado === 'activo') {
                throw new \DomainException('CUENTA_YA_ACTIVADA');
            }

            DB::table('usuario')->where('id', $usuarioId)->update([
                'password_hash' => Hash::make($validated['password']),
                'estado' => 'activo',
                'ultimo_login' => now(),
                'updated_at' => now(),
            ]);

            return DB::table('usuario')->where('id', $usuarioId)->first();
        });

        if (! $usuario) {
            return ApiResponse::error(
                'USUARIO_NO_ENCONTRADO',
                'El usuario no fue encontrado.',
                404,
            );
        }

        // Consumir / Eliminar tokens de Redis
        try {
            Redis::del("invitacion:admin:{$token}");
            Redis::del("usuario:invitacion:{$usuarioId}");
            Redis::del("invitacion:cooldown:{$usuarioId}");
        } catch (\Throwable $e) {
            // Silencioso
        }

        // Generar sesión autenticada en Redis
        $sessionToken = Str::random(60);
        $tokenHash = hash('sha256', $sessionToken);
        $refreshToken = Str::random(60);

        $sessionPayload = [
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'correo' => $usuario->correo,
            'rol' => $usuario->rol,
            'telefono' => $usuario->telefono,
            'empresa_id' => $usuario->empresa_id,
            'local_id' => $usuario->local_id,
            'estado' => 'activo',
            'refresh_token' => $refreshToken,
        ];

        try {
            Redis::setex("auth:session:{$tokenHash}", 86400, json_encode($sessionPayload));
            Redis::setex("auth:refresh:{$refreshToken}", 604800, json_encode([
                'usuario_id' => $usuario->id,
                'token_hash' => $tokenHash,
            ]));
        } catch (\Throwable $e) {
            // Silencioso si Redis falla en emitir sesión automática
        }

        return ApiResponse::ok([
            'token' => $sessionToken,
            'refresh_token' => $refreshToken,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre,
                'correo' => $usuario->correo,
                'rol' => $usuario->rol,
                'empresa_id' => $usuario->empresa_id,
                'local_id' => $usuario->local_id,
                'telefono' => $usuario->telefono,
            ],
            'mensaje' => 'Cuenta activada exitosamente. Tu contraseña personal ha sido configurada.',
        ]);
    }
}
