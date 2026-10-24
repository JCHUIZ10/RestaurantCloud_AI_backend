<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Mesas\Exceptions\PlanoException;
use App\Domains\Mesas\Services\PlanoService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PlanoController extends Controller
{
    public function __construct(private PlanoService $plano) {}

    public function index(Request $request): JsonResponse
    {
        return $this->operar($request, fn ($e, $l, $local) => $this->plano->listado($e, $l, $local), escritura: false);
    }

    public function crearPiso(Request $request): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->crearPiso($e, $l, $this->datosPiso($request)), 201);
    }

    public function nombre(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, function ($e, $l) use ($request, $id): array {
            $request->merge(['nombre' => is_string($request->input('nombre')) ? trim($request->input('nombre')) : $request->input('nombre')]);

            return $this->plano->modificarPiso($l, $id, $request->validate(['nombre' => ['required', 'string', 'max:60']]));
        });
    }

    public function dimensiones(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->modificarPiso($l, $id, $request->validate([
            'columnas' => ['required', 'integer', 'between:1,12'], 'filas' => ['required', 'integer', 'between:1,10'],
        ])));
    }

    public function desactivarPiso(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->desactivarPiso($l, $id));
    }

    public function crearMesa(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->crearMesa($e, $l, $id, $this->datosMesa($request)), 201);
    }

    public function lote(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->generarLote($e, $l, $id, $request->validate([
            'columnas' => ['required', 'integer', 'between:1,12'], 'filas' => ['required', 'integer', 'between:1,10'],
            'prefijo' => ['present', 'nullable', 'string', 'max:9'], 'numero_inicio' => ['required', 'integer', 'between:1,999999999'],
            'capacidad' => ['required', 'integer', 'between:1,20'], 'forma' => ['required', 'in:cuadrada,redonda,rectangular'],
            'permite_union' => ['required', 'boolean'],
        ])), 201);
    }

    public function actualizarMesa(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->actualizarMesa($l, $id, $this->datosMesa($request, true)));
    }

    public function desactivarMesa(Request $request, string $id): JsonResponse
    {
        return $this->operar($request, fn ($e, $l) => $this->plano->desactivarMesa($l, $id));
    }

    private function datosPiso(Request $request): array
    {
        $request->merge(['nombre' => is_string($request->input('nombre')) ? trim($request->input('nombre')) : $request->input('nombre')]);

        return $request->validate([
            'nombre' => ['required', 'string', 'max:60'], 'columnas' => ['required', 'integer', 'between:1,12'],
            'filas' => ['required', 'integer', 'between:1,10'],
        ]);
    }

    private function datosMesa(Request $request, bool $edicion = false): array
    {
        $request->merge(['numero' => is_string($request->input('numero')) ? trim($request->input('numero')) : $request->input('numero')]);

        $data = $request->validate([
            'numero' => ['required', 'string', 'max:10'], 'capacidad' => ['required', 'integer', 'between:1,20'],
            'forma' => ['required', 'in:cuadrada,redonda,rectangular'], 'permite_union' => ['required', 'boolean'],
            'posicion_x' => ['required', 'integer', 'between:0,11'], 'posicion_y' => ['required', 'integer', 'between:0,9'],
            ...($edicion ? ['piso_id' => ['sometimes', 'required', 'uuid']] : []),
        ]);
        foreach (['capacidad', 'posicion_x', 'posicion_y'] as $campo) {
            $data[$campo] = (int) $data[$campo];
        }
        $data['permite_union'] = (bool) $data['permite_union'];

        return $data;
    }

    private function operar(Request $request, callable $accion, int $status = 200, bool $escritura = true): JsonResponse
    {
        $usuario = $request->user();
        if (! $usuario->empresa_id || ! $usuario->local_id) {
            return ApiResponse::error('ERR_SEDE_INVALIDA', 'La sesión debe tener una sede asignada.', 403);
        }
        try {
            $resultado = $this->plano->ejecutar($usuario->empresa_id, $usuario->local_id,
                fn ($local) => $accion($usuario->empresa_id, $usuario->local_id, $local), $escritura);

            return ApiResponse::ok($resultado, $status);
        } catch (PlanoException $exception) {
            return ApiResponse::error($exception->codigo, $exception->getMessage(), $exception->status, $exception->detalles);
        } catch (ValidationException $exception) {
            return ApiResponse::error('ERR_VALIDACION', $exception->validator->errors()->first(), 422, $exception->errors());
        }
    }
}
