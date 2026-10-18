<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Establece el ámbito de seguridad de PostgreSQL para una solicitud autenticada.
 *
 * Las políticas RLS consultan los parámetros app.current_* de PostgreSQL. El
 * contexto se instala dentro de una transacción y con `is_local = true`, por lo
 * que se elimina al terminar la solicitud y no puede filtrarse a otra petición
 * cuando se usan workers persistentes (Octane).
 */
class TenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->id || ! $user->rol) {
            return ApiResponse::error(
                'CONTEXTO_AUTENTICACION_INVALIDO',
                'No fue posible determinar el contexto del usuario autenticado.',
                401
            );
        }

        // Un administrador SaaS opera transversalmente; los demás roles siempre
        // deben pertenecer a una empresa. El local puede ser nulo para propietario.
        if ($user->rol !== 'admin_saas' && ! $user->empresa_id) {
            return ApiResponse::error(
                'CONTEXTO_TENANT_INCOMPLETO',
                'La sesión no contiene una empresa válida.',
                403
            );
        }

        return DB::connection()->transaction(function () use ($request, $next, $user): Response {
            $this->setConfig('app.current_user_id', (string) $user->id);
            $this->setConfig('app.current_user_role', (string) $user->rol);
            $this->setConfig('app.current_empresa_id', $user->empresa_id ? (string) $user->empresa_id : '');
            $this->setConfig('app.current_local_id', $user->local_id ? (string) $user->local_id : '');

            // Evita que un valor residual de una conexión reutilizada habilite
            // rutas públicas dentro de una solicitud autenticada.
            $this->setConfig('app.public_access', 'false');
            $this->setConfig('app.public_token_qr', '');

            return $next($request);
        });
    }

    private function setConfig(string $key, string $value): void
    {
        DB::select('SELECT set_config(?, ?, true)', [$key, $value]);
    }
}
