<?php

namespace App\Http\Middleware;

use App\Domains\Reservas\Services\PoliticasReservaService;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe una ruta a empresas cuyo plan incluye el módulo de reservas (plan.incluye_reservas).
 *
 * Uso: ->middleware('modulo.reservas')
 */
class EnsureModuloReservas
{
    public function __construct(private PoliticasReservaService $politicas) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->empresa_id && ! $this->politicas->moduloHabilitado($user->empresa_id)) {
            $planes = $this->politicas->planesConReservas();
            $orientacion = $planes === [] ? '' : ' Planes que lo incluyen: '.implode(', ', $planes).'.';

            return ApiResponse::error(
                'ERR_MODULO_RESERVAS_NO_CONTRATADO',
                'El plan de tu empresa no incluye el módulo de reservas.'.$orientacion,
                403
            );
        }

        return $next($request);
    }
}
