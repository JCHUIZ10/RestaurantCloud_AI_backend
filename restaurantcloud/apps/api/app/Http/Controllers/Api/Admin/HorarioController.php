<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Horario\Services\HorarioService;
use App\Domains\Reservas\Exceptions\PoliticasReservaException;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HorarioController extends Controller
{
    public function __construct(private HorarioService $horarios) {}

    public function semana(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->horarios->semana($request->user()->local_id));
    }

    public function guardarSemana(Request $request): JsonResponse
    {
        $data = $request->validate([...$this->reglasDias(), ...$this->reglasCancelacion()]);
        $usuario = $request->user();

        return $this->run(fn () => ApiResponse::ok(
            $this->horarios->guardarSemana(
                $usuario->local_id,
                $data['dias'],
                $usuario->empresa_id,
                $usuario->id,
                (bool) ($data['cancelar_reservas'] ?? false),
                $data['reservas_notificadas'] ?? [],
            ),
        ));
    }

    public function aplicarPlantilla(Request $request): JsonResponse
    {
        $data = $request->validate([...$this->reglasPlantilla(), ...$this->reglasCancelacion()]);
        $usuario = $request->user();

        return $this->run(fn () => ApiResponse::ok(
            $this->horarios->aplicarPlantilla(
                $usuario->local_id,
                $data['plantilla'],
                $usuario->empresa_id,
                $usuario->id,
                (bool) ($data['cancelar_reservas'] ?? false),
                $data['reservas_notificadas'] ?? [],
            ),
        ));
    }

    /** Simula guardar el horario semanal (o aplicar una plantilla) y lista las reservas futuras que dejarían de caber. */
    public function precheckSemana(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dias' => ['required_without:plantilla', 'array', 'size:7'],
            'plantilla' => ['required_without:dias', 'in:restaurante_estandar,solo_almuerzo,corrido_continuo'],
            ...collect($this->reglasDias())->except('dias')->all(),
        ]);
        $localId = $request->user()->local_id;

        return $this->run(fn () => ApiResponse::ok(
            isset($data['plantilla'])
                ? $this->horarios->precheckPlantilla($localId, $data['plantilla'])
                : $this->horarios->precheckSemana($localId, $data['dias']),
        ));
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function reglasDias(): array
    {
        return [
            'dias' => ['required', 'array', 'size:7'],
            'dias.*.dia_semana' => ['required', 'integer', 'between:1,7', 'distinct'],
            'dias.*.nombre_dia' => ['nullable', 'string', 'max:20'],
            'dias.*.atiende' => ['required', 'boolean'],
            'dias.*.turnos' => ['nullable', 'array', 'max:8'],
            'dias.*.turnos.*.nombre_turno' => ['required_with:dias.*.turnos', 'string', 'min:2', 'max:50'],
            'dias.*.turnos.*.hora_inicio' => ['required_with:dias.*.turnos', 'date_format:H:i'],
            'dias.*.turnos.*.hora_fin' => ['required_with:dias.*.turnos', 'date_format:H:i'],
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function reglasPlantilla(): array
    {
        return ['plantilla' => ['required', 'in:restaurante_estandar,solo_almuerzo,corrido_continuo']];
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function reglasCancelacion(): array
    {
        return [
            'cancelar_reservas' => ['nullable', 'boolean'],
            'reservas_notificadas' => ['nullable', 'array', 'max:200'],
            'reservas_notificadas.*.reserva_id' => ['required', 'uuid'],
            'reservas_notificadas.*.notificado' => ['required', 'boolean'],
            'reservas_notificadas.*.metodo_notificacion' => ['required', 'in:ninguno,whatsapp,llamada,presencial'],
        ];
    }

    public function excepciones(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->horarios->excepciones($request->user()->local_id));
    }

    public function precheckExcepcion(Request $request): JsonResponse
    {
        $request->merge(['cerrado' => $request->boolean('cerrado')]);
        $data = $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d'],
            'cerrado' => ['required', 'boolean'],
            'hora_inicio' => ['nullable', 'date_format:H:i', 'required_if:cerrado,false'],
            'hora_fin' => ['nullable', 'date_format:H:i', 'required_if:cerrado,false'],
            'motivo' => ['nullable', 'string', 'max:150'],
        ]);

        return $this->run(fn () => ApiResponse::ok(
            $this->horarios->precheckExcepcion($request->user()->local_id, $data),
        ));
    }

    public function crearExcepcion(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d'],
            'cerrado' => ['required', 'boolean'],
            'hora_inicio' => ['nullable', 'date_format:H:i', 'required_if:cerrado,false'],
            'hora_fin' => ['nullable', 'date_format:H:i', 'required_if:cerrado,false'],
            'motivo' => ['required', 'string', 'min:3', 'max:150'],
            'cancelar_reservas' => ['nullable', 'boolean'],
            'reservas_notificadas' => ['nullable', 'array', 'max:200'],
            'reservas_notificadas.*.reserva_id' => ['required', 'uuid'],
            'reservas_notificadas.*.notificado' => ['required', 'boolean'],
            'reservas_notificadas.*.metodo_notificacion' => ['required', 'in:ninguno,whatsapp,llamada,presencial'],
        ]);

        $usuario = $request->user();

        return $this->run(fn () => ApiResponse::ok(
            $this->horarios->crearExcepcion($usuario->local_id, $usuario->empresa_id, $usuario->id, $data),
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
        } catch (PoliticasReservaException $exception) {
            return ApiResponse::error($exception->codigo, $exception->getMessage(), $exception->status, $exception->detalles);
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error('ERR_HORARIO_INVALIDO', $exception->getMessage(), 422);
        }
    }
}
