<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe una ruta a empresas cuyo plan incluye la predicción de demanda (plan.incluye_prediccion_ia).
 *
 * Uso: ->middleware('modulo.prediccion')
 */
class EnsureModuloPrediccion
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $incluido = $user?->empresa_id && DB::table('empresa as e')
            ->join('plan as p', 'p.id', '=', 'e.plan_id')
            ->where('e.id', $user->empresa_id)
            ->value('p.incluye_prediccion_ia');

        if (! $incluido) {
            $planes = DB::table('plan')
                ->where('activo', true)
                ->where('incluye_prediccion_ia', true)
                ->orderBy('precio_mensual')
                ->pluck('nombre')
                ->all();
            $orientacion = $planes === [] ? '' : ' Planes que la incluyen: '.implode(', ', $planes).'.';

            return ApiResponse::error(
                'ERR_MODULO_PREDICCION_NO_CONTRATADO',
                'El plan de tu empresa no incluye la predicción de demanda.'.$orientacion,
                403,
            );
        }

        return $next($request);
    }
}
