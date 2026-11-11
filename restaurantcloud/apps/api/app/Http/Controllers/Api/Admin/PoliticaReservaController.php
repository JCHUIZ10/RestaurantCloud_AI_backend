<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Reservas\Exceptions\PoliticasReservaException;
use App\Domains\Reservas\Services\PoliticasReservaService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoliticaReservaController extends Controller
{
    public function __construct(private PoliticasReservaService $politicas) {}

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->politicas->obtener($request->user()->local_id));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'acepta_reservas' => ['required', 'boolean'],
            'duracion_reserva_min' => ['required', 'integer', 'between:30,240'],
            'buffer_reserva_min' => ['required', 'integer', 'between:0,60'],
            'tolerancia_no_show_min' => ['required', 'integer', 'between:5,60'],
            'minutos_bloqueo_previo' => ['required', 'integer', 'between:0,120'],
            'margen_recordatorio_min' => ['required', 'integer', 'between:15,1440'],
            'anticipacion_minima_horas' => ['sometimes', 'integer', 'between:0,48'],
            'anticipacion_maxima_dias' => ['required', 'integer', 'between:1,90'],
            'confirmar_desactivacion' => ['nullable', 'boolean'],
            'updated_at' => ['nullable', 'date'],
        ]);

        $usuario = $request->user();

        return $this->run(fn () => ApiResponse::ok($this->politicas->actualizar(
            $usuario->local_id,
            $usuario->empresa_id,
            $usuario->id,
            $data,
            (bool) ($data['confirmar_desactivacion'] ?? false),
            $data['updated_at'] ?? null,
        )));
    }

    public function restaurarDefault(Request $request): JsonResponse
    {
        $usuario = $request->user();

        return $this->run(fn () => ApiResponse::ok(
            $this->politicas->restaurarValoresRecomendados($usuario->local_id, $usuario->empresa_id, $usuario->id)
        ));
    }

    public function precheckDesactivacion(Request $request): JsonResponse
    {
        $reservas = $this->politicas->reservasPendientes($request->user()->local_id);

        return ApiResponse::ok([
            'permite_desactivar' => $reservas->isEmpty(),
            'total_pendientes' => $reservas->count(),
            'reservas' => $reservas->values()->all(),
        ]);
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (PoliticasReservaException $exception) {
            return ApiResponse::error($exception->codigo, $exception->getMessage(), $exception->status, $exception->detalles);
        }
    }
}
