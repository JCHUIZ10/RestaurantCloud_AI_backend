<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Personal\Services\PersonalService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalController extends Controller
{
    public function __construct(private PersonalService $personal)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'busqueda' => ['nullable', 'string', 'max:100'],
            'rol' => ['nullable', 'in:todos,mozo,cocina,cajero'],
            'estado' => ['nullable', 'in:todos,activo,inactivo,pendiente_activacion'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'limite' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return ApiResponse::ok(
            $this->personal->listado(
                $request->user()->empresa_id,
                $request->user()->local_id,
                $filtros,
            ),
        );
    }

    public function store(Request $request): JsonResponse
    {
        return $this->run(fn () => ApiResponse::ok(
            $this->personal->crear(
                $request->user()->empresa_id,
                $request->user()->local_id,
                $this->validarRegistro($request),
            ),
            201,
        ));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->run(function () use ($request, $id) {
            $empleado = $this->personal->actualizar(
                $id,
                $request->user()->local_id,
                $this->validarEdicion($request),
            );

            return $empleado ? ApiResponse::ok($empleado) : $this->notFound();
        });
    }

    public function reactivar(Request $request, string $id): JsonResponse
    {
        return $this->run(function () use ($request, $id) {
            $empleado = $this->personal->reactivar(
                $id,
                $request->user()->empresa_id,
                $request->user()->local_id,
            );

            return $empleado ? ApiResponse::ok($empleado) : $this->notFound();
        });
    }

    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $resultado = $this->personal->resetPassword($id, $request->user()->local_id);

        return $resultado ? ApiResponse::ok($resultado) : $this->notFound();
    }

    private function validarRegistro(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'correo' => ['required', 'email', 'max:100'],
            'telefono' => ['required', 'string', 'min:7', 'max:20'],
            'rol' => ['required', 'in:mozo,cocina,cajero'],
        ]);
    }

    private function validarEdicion(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'telefono' => ['required', 'string', 'min:7', 'max:20'],
            'rol' => ['required', 'in:mozo,cocina,cajero'],
        ]);
    }

    private function notFound(): JsonResponse
    {
        return ApiResponse::error(
            'ERR_EMPLEADO_NO_ENCONTRADO',
            'El colaborador no existe en esta sede.',
            404,
        );
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_CORREO_DUPLICADO', $e->getMessage(), 409);
        } catch (\OverflowException $e) {
            return ApiResponse::error('ERR_CUOTA_EXCEDIDA', $e->getMessage(), 409);
        }
    }
}
