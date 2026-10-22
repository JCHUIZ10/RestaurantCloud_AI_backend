<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domains\Caja\Services\MetodoPagoLocalService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetodoPagoController extends Controller
{
    public function __construct(private MetodoPagoLocalService $metodosPago)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::ok($this->metodosPago->catalogo($request->user()->local_id));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'metodos' => ['required', 'array', 'size:3'],
            'metodos.*.codigo' => ['required', 'distinct', 'in:efectivo,tarjeta,billetera_digital'],
            'metodos.*.activo' => ['required', 'boolean'],
            'metodos.*.comision_porcentaje' => ['required', 'numeric', 'between:0,50'],
            'metodos.*.datos_adicionales' => ['nullable', 'array'],
        ]);

        return $this->run(fn () => ApiResponse::ok(
            $this->metodosPago->actualizar($request->user()->local_id, $data['metodos']),
        ));
    }

    private function run(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (\DomainException $exception) {
            return ApiResponse::error('ERR_METODO_PAGO_PROTEGIDO', $exception->getMessage(), 422);
        } catch (\LogicException $exception) {
            return ApiResponse::error('ERR_DATOS_BILLETERA_INCOMPLETOS', $exception->getMessage(), 422);
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error('ERR_CATALOGO_PAGO_INVALIDO', $exception->getMessage(), 422);
        }
    }
}
