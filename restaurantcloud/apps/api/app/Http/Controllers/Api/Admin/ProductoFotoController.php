<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Carta\Services\ProductoService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProductoFotoController extends Controller
{
    public function __construct(private ProductoService $productos) {}

    public function store(Request $request, string $id): JsonResponse
    {
        try {
            $data = $request->validate([
                'foto' => ['required', 'file', 'mimes:jpeg,png,webp', 'max:5120', 'dimensions:min_width=300,min_height=300,max_width=4000,max_height=4000'],
            ], [
                'foto.required' => 'Selecciona una foto del plato.',
                'foto.file' => 'La foto no se pudo recibir correctamente.',
                'foto.uploaded' => 'La foto no se pudo subir. Verifica que pese menos de 5 MB.',
                'foto.mimes' => 'La foto debe ser una imagen JPEG, PNG o WebP.',
                'foto.max' => 'La foto no puede pesar más de 5 MB.',
                'foto.dimensions' => 'La foto debe medir entre 300 y 4000 píxeles por lado.',
            ]);

            $usuario = $request->user();
            $producto = $this->productos->reemplazarFoto(
                $id,
                $usuario->local_id,
                $usuario->empresa_id,
                $usuario->id,
                $data['foto'],
            );

            return $producto ? ApiResponse::ok($producto) : $this->notFound();
        } catch (ValidationException $exception) {
            return ApiResponse::error(
                'ERR_FOTO_INVALIDA',
                $exception->validator->errors()->first(),
                422,
                $exception->errors(),
            );
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error('ERR_FOTO_INVALIDA', $exception->getMessage(), 422);
        } catch (Throwable $exception) {
            Log::error("Error al guardar foto de producto {$id}: {$exception->getMessage()}");

            return ApiResponse::error(
                'ERR_ALMACENAMIENTO_NO_DISPONIBLE',
                'No pudimos guardar la foto en este momento. Inténtalo de nuevo.',
                503,
            );
        }
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $usuario = $request->user();
        $producto = $this->productos->quitarFoto($id, $usuario->local_id, $usuario->empresa_id, $usuario->id);

        return $producto ? ApiResponse::ok($producto) : $this->notFound();
    }

    private function notFound(): JsonResponse
    {
        return ApiResponse::error(
            'ERR_PRODUCTO_NO_ENCONTRADO',
            'El producto solicitado no existe o fue archivado.',
            404,
        );
    }
}
