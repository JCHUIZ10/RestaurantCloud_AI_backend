<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Carta\Services\CategoriaService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function __construct(private CategoriaService $categorias)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->categorias->listado($request->user()->local_id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:60'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        return $this->run(fn () => ApiResponse::ok(
            $this->categorias->crear($request->user()->local_id, $data),
            201,
        ));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:60'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        return $this->run(function () use ($id, $request, $data) {
            $categoria = $this->categorias->actualizar($id, $request->user()->local_id, $data);

            return $categoria ? ApiResponse::ok($categoria) : $this->notFound();
        });
    }

    public function visibilidad(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['activa' => ['required', 'boolean']]);
        $categoria = $this->categorias->visibilidad($id, $request->user()->local_id, $data['activa']);

        return $categoria ? ApiResponse::ok($categoria) : $this->notFound();
    }

    public function reordenar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'categorias' => ['required', 'array', 'min:1'],
            'categorias.*.id' => ['required', 'uuid', 'distinct'],
            'categorias.*.orden' => ['required', 'integer', 'min:1'],
        ]);

        return $this->run(fn () => ApiResponse::ok(
            $this->categorias->reordenar($request->user()->local_id, $data['categorias']),
        ));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $resultado = $this->categorias->eliminar($id, $request->user()->local_id);

        if ($resultado['tipo'] === 'not_found') {
            return $this->notFound();
        }

        if ($resultado['tipo'] === 'conflict') {
            return response()->json([
                'exito' => false,
                'datos' => $resultado['datos'],
                'errores' => [[
                    'codigo' => 'ERR_CATEGORIA_CON_PRODUCTOS',
                    'mensaje' => 'No se puede eliminar la categoría porque contiene productos asociados.',
                    'campo' => 'categoria_id',
                ]],
                'meta' => ['timestamp' => now()->toIso8601String()],
            ], 409);
        }

        return ApiResponse::ok($resultado['datos']);
    }

    public function reasignar(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'nueva_categoria_id' => ['required', 'uuid'],
            'producto_ids' => ['nullable', 'array'],
            'producto_ids.*' => ['uuid', 'distinct'],
        ]);

        return $this->run(fn () => ApiResponse::ok($this->categorias->reasignar(
            $id,
            $request->user()->local_id,
            $data['nueva_categoria_id'],
            $data['producto_ids'] ?? null,
        )));
    }

    public function plantilla(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tipo_plantilla' => ['required', 'in:polleria,cevicheria,chifa,criollo,cafeteria'],
            'reemplazar_existentes' => ['required', 'boolean'],
        ]);

        return $this->run(fn () => ApiResponse::ok($this->categorias->plantilla(
            $request->user()->local_id,
            $data['tipo_plantilla'],
            $data['reemplazar_existentes'],
        )));
    }

    private function notFound(): JsonResponse
    {
        return ApiResponse::error(
            'ERR_CATEGORIA_NO_ENCONTRADA',
            'La categoría solicitada no existe o fue eliminada previamente.',
            404,
        );
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (\DomainException $e) {
            return ApiResponse::error('ERR_CATEGORIA_DUPLICADA', $e->getMessage(), 422);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('ERR_CATEGORIA_DESTINO_INVALIDA', $e->getMessage(), 422);
        } catch (\OutOfBoundsException $e) {
            return ApiResponse::error('ERR_CATEGORIA_DESTINO_NO_ENCONTRADA', $e->getMessage(), 404);
        }
    }
}
