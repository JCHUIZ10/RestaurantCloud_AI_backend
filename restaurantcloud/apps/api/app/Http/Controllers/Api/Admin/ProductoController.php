<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Carta\Services\ProductoService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function __construct(private ProductoService $productos)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'categoria_id' => ['nullable', 'uuid'],
            'disponibilidad' => ['nullable', 'in:todos,disponible,agotado'],
            'busqueda' => ['nullable', 'string', 'max:100'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'limite' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return ApiResponse::ok($this->productos->listado($request->user()->local_id, $filtros));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $producto = $this->productos->obtener($id, $request->user()->local_id);

        return $producto ? ApiResponse::ok($producto) : $this->notFound();
    }

    public function store(Request $request): JsonResponse
    {
        return $this->run(function () use ($request): JsonResponse {
            return ApiResponse::ok(
                $this->productos->crear($request->user()->local_id, $this->validarProducto($request)),
                201,
            );
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->run(function () use ($request, $id): JsonResponse {
            $producto = $this->productos->actualizar(
                $id,
                $request->user()->local_id,
                $this->validarProducto($request),
            );

            return $producto ? ApiResponse::ok($producto) : $this->notFound();
        });
    }

    public function disponibilidad(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['disponibilidad' => ['required', 'in:disponible,agotado']]);
        $producto = $this->productos->cambiarDisponibilidad(
            $id,
            $request->user()->local_id,
            $request->user()->id,
            $data['disponibilidad'],
        );

        return $producto ? ApiResponse::ok($producto) : $this->notFound();
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $resultado = $this->productos->archivar($id, $request->user()->local_id);

        return $resultado ? ApiResponse::ok($resultado) : $this->notFound();
    }

    private function validarProducto(Request $request): array
    {
        return $request->validate([
            'categoria_id' => ['required', 'uuid'],
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'precio' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'foto_url' => ['nullable', 'string', 'max:255'],
            'requiere_preparacion' => ['required', 'boolean'],
        ]);
    }

    private function notFound(): JsonResponse
    {
        return ApiResponse::error(
            'ERR_PRODUCTO_NO_ENCONTRADO',
            'El producto solicitado no existe o fue archivado.',
            404,
        );
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (\DomainException $exception) {
            return ApiResponse::error('ERR_PRODUCTO_DUPLICADO', $exception->getMessage(), 422);
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error('ERR_CATEGORIA_INVALIDA', $exception->getMessage(), 422);
        }
    }
}
