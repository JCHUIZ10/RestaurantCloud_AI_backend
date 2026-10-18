<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe una ruta a uno o más roles del dominio.
 *
 * Uso: ->middleware('role:admin_local,propietario')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('NO_AUTENTICADO', 'Debes iniciar sesión para realizar esta acción.', 401);
        }

        if ($roles === [] || ! in_array($user->rol, $roles, true)) {
            return ApiResponse::error(
                'ROL_SIN_PERMISO',
                'No tienes permisos para realizar esta acción.',
                403
            );
        }

        return $next($request);
    }
}
