<?php

namespace App\Http\Controllers\Api\Propietario;

use App\Domains\Suscripcion\Services\ReciboSuscripcionService;
use App\Domains\Suscripcion\Services\SuscripcionPropietarioService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SuscripcionController extends Controller
{
    public function __construct(
        private SuscripcionPropietarioService $suscripciones,
        private ReciboSuscripcionService $recibos
    ) {}

    /**
     * GET /api/v1/propietario/suscripcion
     * Dashboard de "Mi suscripción" de la empresa autenticada (CU-PROP-02).
     */
    public function show(Request $request): JsonResponse
    {
        $dashboard = $this->suscripciones->dashboard((string) $request->user()->empresa_id);

        if (! $dashboard) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'No se encontró la empresa de tu cuenta.', 404);
        }

        return ApiResponse::ok($dashboard);
    }

    /**
     * GET /api/v1/propietario/suscripcion/pagos/{id}/recibo
     * Descarga la constancia PDF de un pago de la propia empresa; la genera si aún no existe.
     */
    public function descargarRecibo(Request $request, string $id): Response|JsonResponse
    {
        $pertenece = DB::table('pago')
            ->where('id', $id)
            ->where('empresa_id', $request->user()->empresa_id)
            ->where('estado', 'exitoso')
            ->exists();

        if (! $pertenece) {
            return ApiResponse::error('PAGO_NO_ENCONTRADO', 'El pago solicitado no existe.', 404);
        }

        try {
            $archivo = $this->recibos->generarPdf($id, $request->user()->id);
            $contenido = Storage::disk('s3')->get($archivo->object_key);
        } catch (\Throwable $e) {
            Log::error("No se pudo entregar la constancia del pago {$id}: {$e->getMessage()}");

            return ApiResponse::error(
                'CONSTANCIA_NO_DISPONIBLE',
                'La constancia no está disponible en este momento. Intenta nuevamente en unos minutos.',
                503
            );
        }

        if ($contenido === null) {
            return ApiResponse::error('CONSTANCIA_NO_DISPONIBLE', 'La constancia no está disponible en este momento.', 503);
        }

        return response($contenido, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$archivo->nombre_original}\"",
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
