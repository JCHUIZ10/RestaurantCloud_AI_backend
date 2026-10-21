<?php

namespace App\Http\Controllers\Api\Propietario;

use App\Domains\Tenant\Services\LocalService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocalController extends Controller
{
    public function __construct(private LocalService $service)
    {
    }

    /**
     * GET /api/v1/propietario/locales
     * Lista todos los locales de la empresa junto con el consumo de cuota del plan (CU-PROP-04).
     */
    public function index(Request $request): JsonResponse
    {
        $resultado = $this->service->listado($request->user()->empresa_id);

        return ApiResponse::ok($resultado);
    }

    /**
     * GET /api/v1/propietario/locales/verificar-disponibilidad
     * Consulta si la empresa puede dar de alta una nueva sede y los administradores disponibles.
     */
    public function verificarDisponibilidad(Request $request): JsonResponse
    {
        $resultado = $this->service->verificarDisponibilidad($request->user()->empresa_id);

        return ApiResponse::ok($resultado);
    }

    /**
     * GET /api/v1/propietario/locales/verificar-slug?slug={slug}&excluir_id={id}
     * Valida la unicidad global de la dirección web de la carta digital y ofrece sugerencias.
     */
    public function verificarSlug(Request $request): JsonResponse
    {
        $slug = (string) $request->query('slug', '');
        $excluirId = (string) $request->query('excluir_id', '');

        $resultado = $this->service->verificarSlug($slug, $excluirId ?: null);

        return ApiResponse::ok($resultado);
    }

    /**
     * POST /api/v1/propietario/locales
     * Registra y aprovisiona atómicamente una nueva sede y su ecosistema inicial.
     */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'slug' => ['required', 'string', 'min:2', 'max:100'],
            'direccion' => ['required', 'string', 'min:3', 'max:200'],
            'ubigeo_cod' => ['required', 'string', 'size:6'],
            'departamento' => ['nullable', 'string', 'max:50'],
            'provincia' => ['nullable', 'string', 'max:50'],
            'distrito' => ['nullable', 'string', 'max:50'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'referencia' => ['nullable', 'string', 'max:200'],
            'telefono' => ['required', 'string', 'min:9', 'max:30'],
            'modo_administracion' => ['required', 'string', 'in:propietario,asignar_admin'],
            'administrador_usuario_id' => ['nullable', 'uuid'],
            'giro_negocio' => ['required', 'string', 'in:polleria,cevicheria,chifa,en_blanco'],
        ]);

        try {
            $resultado = $this->service->crear($request->user()->empresa_id, $datos);

            return ApiResponse::ok($resultado, 201);
        } catch (\OverflowException $e) {
            return ApiResponse::error(
                'LOCAL_LIMITE_PLAN_ALCANZADO',
                $e->getMessage(),
                403
            );
        } catch (\DomainException $e) {
            return ApiResponse::error(
                'LOCAL_SLUG_DUPLICADO',
                $e->getMessage(),
                409
            );
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error(
                'LOCAL_DATOS_INVALIDOS',
                $e->getMessage(),
                422
            );
        } catch (\OutOfBoundsException $e) {
            return ApiResponse::error(
                'EMPRESA_NO_ENCONTRADA',
                $e->getMessage(),
                404
            );
        }
    }

    /**
     * PUT /api/v1/propietario/locales/{id}
     * Actualiza los datos comerciales y de administración de una sede existente.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'min:2', 'max:100'],
            'slug' => ['required', 'string', 'min:2', 'max:100'],
            'direccion' => ['required', 'string', 'min:3', 'max:200'],
            'ubigeo_cod' => ['nullable', 'string', 'size:6'],
            'departamento' => ['nullable', 'string', 'max:50'],
            'provincia' => ['nullable', 'string', 'max:50'],
            'distrito' => ['nullable', 'string', 'max:50'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'referencia' => ['nullable', 'string', 'max:200'],
            'telefono' => ['required', 'string', 'min:9', 'max:30'],
            'modo_administracion' => ['required', 'string', 'in:propietario,asignar_admin'],
            'administrador_usuario_id' => ['nullable', 'uuid'],
        ]);

        try {
            $resultado = $this->service->actualizar($id, $request->user()->empresa_id, $datos);

            return ApiResponse::ok($resultado);
        } catch (\OutOfBoundsException $e) {
            return ApiResponse::error(
                'LOCAL_NO_ENCONTRADO',
                $e->getMessage(),
                404
            );
        } catch (\DomainException $e) {
            return ApiResponse::error(
                'LOCAL_SLUG_DUPLICADO',
                $e->getMessage(),
                409
            );
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error(
                'LOCAL_DATOS_INVALIDOS',
                $e->getMessage(),
                422
            );
        }
    }

    /**
     * GET /api/v1/propietario/locales/{id}/validar-baja
     * Audita en tiempo real la viabilidad operativa para dar de baja la sede (Bloqueo Duro).
     */
    public function validarBaja(Request $request, string $id): JsonResponse
    {
        try {
            $resultado = $this->service->validarBaja($id, $request->user()->empresa_id);

            return ApiResponse::ok($resultado);
        } catch (\OutOfBoundsException $e) {
            return ApiResponse::error(
                'LOCAL_NO_ENCONTRADO',
                $e->getMessage(),
                404
            );
        }
    }

    /**
     * PATCH /api/v1/propietario/locales/{id}/cambiar-estado
     * Modifica el estado de la sede (desactivar con auditoría o reactivar con control de cuota).
     */
    public function cambiarEstado(Request $request, string $id): JsonResponse
    {
        $datos = $request->validate([
            'nuevo_estado' => ['required', 'string', 'in:activo,inactivo'],
        ]);

        try {
            $resultado = $this->service->cambiarEstado(
                $id,
                $request->user()->empresa_id,
                $datos['nuevo_estado']
            );

            return ApiResponse::ok($resultado);
        } catch (\OutOfBoundsException $e) {
            return ApiResponse::error(
                'LOCAL_NO_ENCONTRADO',
                $e->getMessage(),
                404
            );
        } catch (\OverflowException $e) {
            return ApiResponse::error(
                'LOCAL_LIMITE_PLAN_ALCANZADO',
                $e->getMessage(),
                403
            );
        } catch (\DomainException $e) {
            return ApiResponse::error(
                'LOCAL_BLOQUEO_OPERATIVO',
                $e->getMessage(),
                422
            );
        }
    }
}
