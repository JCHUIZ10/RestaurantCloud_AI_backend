<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Horario\Services\HorarioService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HorarioController extends Controller
{
    public function __construct(private HorarioService $horarios)
    {
    }

    public function semana(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->horarios->semana($request->user()->local_id));
    }

    public function guardarSemana(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dias' => ['required', 'array', 'size:7'],
            'dias.*.dia_semana' => ['required', 'integer', 'between:1,7', 'distinct'],
            'dias.*.nombre_dia' => ['nullable', 'string', 'max:20'],
            'dias.*.atiende' => ['required', 'boolean'],
            'dias.*.turnos' => ['nullable', 'array', 'max:8'],
            'dias.*.turnos.*.nombre_turno' => ['required_with:dias.*.turnos', 'string', 'min:2', 'max:50'],
            'dias.*.turnos.*.hora_inicio' => ['required_with:dias.*.turnos', 'date_format:H:i'],
            'dias.*.turnos.*.hora_fin' => ['required_with:dias.*.turnos', 'date_format:H:i'],
        ]);

        return $this->run(fn () => ApiResponse::ok(
            $this->horarios->guardarSemana($request->user()->local_id, $data['dias']),
        ));
    }

    public function aplicarPlantilla(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plantilla' => ['required', 'in:restaurante_estandar,solo_almuerzo,corrido_continuo'],
        ]);

        return ApiResponse::ok(
            $this->horarios->aplicarPlantilla($request->user()->local_id, $data['plantilla']),
        );
    }

    public function excepciones(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->horarios->excepciones($request->user()->local_id));
    }

    public function crearExcepcion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d'],
            'cerrado' => ['required', 'boolean'],
            'hora_inicio' => ['nullable', 'date_format:H:i', 'required_if:cerrado,false'],
            'hora_fin' => ['nullable', 'date_format:H:i', 'required_if:cerrado,false'],
            'motivo' => ['required', 'string', 'min:3', 'max:150'],
        ]);

        return $this->run(fn () => ApiResponse::ok(
            $this->horarios->crearExcepcion(
                $request->user()->local_id,
                $request->user()->id,
                $data,
            ),
            201,
        ));
    }

    public function eliminarExcepcion(Request $request, string $id): JsonResponse
    {
        $eliminada = $this->horarios->eliminarExcepcion($id, $request->user()->local_id);

        if (! $eliminada) {
            return ApiResponse::error(
                'ERR_EXCEPCION_NO_ENCONTRADA',
                'La excepcion no existe en esta sede o ya fue eliminada.',
                404,
            );
        }

        return ApiResponse::ok([
            'id' => $id,
            'eliminado' => true,
        ]);
    }

    public function cargarFeriadosPeru(Request $request): JsonResponse
    {
        return ApiResponse::ok(
            $this->horarios->cargarFeriadosPeru(
                $request->user()->local_id,
                $request->user()->id,
            ),
        );
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (\DomainException $exception) {
            return ApiResponse::error('ERR_EXCEPCION_DUPLICADA', $exception->getMessage(), 409);
        } catch (\LogicException $exception) {
            return ApiResponse::error('ERR_RESERVAS_REQUIEREN_5B', $exception->getMessage(), 409);
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error('ERR_HORARIO_INVALIDO', $exception->getMessage(), 422);
        }
    }
}
