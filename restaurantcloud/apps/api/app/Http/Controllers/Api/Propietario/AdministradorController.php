<?php

namespace App\Http\Controllers\Api\Propietario;

use App\Domains\Administradores\Services\AdministradorService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdministradorController extends Controller
{
    public function __construct(private AdministradorService $service)
    {
    }

    /**
     * GET /api/v1/propietario/administradores
     * Lista los administradores de local y la cuota del plan de la empresa.
     */
    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'estado' => ['nullable', 'string', 'in:todos,activos,pendientes,desactivados,activo,inactivo,pendiente_activacion'],
            'busqueda' => ['nullable', 'string', 'max:100'],
        ]);

        $resultado = $this->service->listado($request->user()->empresa_id, $filtros);

        return ApiResponse::ok($resultado);
    }

    /**
     * GET /api/v1/propietario/administradores/cuota-personal
     * Retorna la disponibilidad y métricas de cuota de personal de la empresa.
     */
    public function cuotaPersonal(Request $request): JsonResponse
    {
        $resultado = $this->service->cuotaPersonal($request->user()->empresa_id);

        return ApiResponse::ok($resultado);
    }

    /**
     * POST /api/v1/propietario/administradores
     * Invita a un nuevo administrador de local.
     */
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'min:3', 'max:100'],
            'correo' => ['required', 'email', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:30'],
        ]);

        try {
            $resultado = $this->service->invitar(
                $request->user()->empresa_id,
                $datos,
                $request->user(),
            );

            return ApiResponse::ok($resultado, 201);
        } catch (\OverflowException $e) {
            return ApiResponse::error(
                'PERSONAL_LIMITE_PLAN_ALCANZADO',
                'Has alcanzado el límite de cuentas de personal de tu Plan. Por favor escala tu suscripción.',
                403,
            );
        } catch (\DomainException $e) {
            if ($e->getMessage() === 'PROPIETARIO_NO_PUEDE_SER_ADMIN_LOCAL') {
                return ApiResponse::error(
                    'PROPIETARIO_NO_PUEDE_SER_ADMIN_LOCAL',
                    'La cuenta del propietario tiene alcance global sobre todos los locales y no puede subordinarse a un solo local.',
                    422,
                );
            }

            if ($e->getMessage() === 'ADMIN_CORREO_EXISTE_MISMA_EMPRESA') {
                return ApiResponse::error(
                    'ADMIN_CORREO_EXISTE_MISMA_EMPRESA',
                    "El correo \"{$datos['correo']}\" ya se encuentra registrado para otro colaborador en la empresa.",
                    409,
                );
            }

            return ApiResponse::error('ERROR_INVITACION', $e->getMessage(), 400);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error(
                'TELEFONO_INVALIDO',
                'El número de celular móvil debe constar de 9 dígitos e iniciar con el dígito 9 (Estándar Perú).',
                422,
            );
        }
    }

    /**
     * POST /api/v1/propietario/administradores/{id}/reenviar-invitacion
     * Genera un nuevo token de 24h respetando el cooldown de 60 segundos.
     */
    public function reenviarInvitacion(Request $request, string $id): JsonResponse
    {
        try {
            $resultado = $this->service->reenviarInvitacion($request->user()->empresa_id, $id);

            return ApiResponse::ok($resultado);
        } catch (\DomainException $e) {
            if ($e->getMessage() === 'ADMIN_REENVIO_EN_ENFRIAMIENTO') {
                return ApiResponse::error(
                    'ADMIN_REENVIO_EN_ENFRIAMIENTO',
                    'Por favor espera 60 segundos antes de solicitar un nuevo reenvío de invitación.',
                    429,
                );
            }

            if ($e->getMessage() === 'ADMIN_NO_ENCONTRADO') {
                return ApiResponse::error(
                    'ADMIN_NO_ENCONTRADO',
                    'El administrador especificado no existe o pertenece a otra empresa.',
                    404,
                );
            }

            if ($e->getMessage() === 'ADMIN_YA_ACTIVO') {
                return ApiResponse::error(
                    'ADMIN_YA_ACTIVO',
                    'El administrador ya completó su activación de cuenta.',
                    400,
                );
            }

            return ApiResponse::error('ERROR_REENVIO', $e->getMessage(), 400);
        }
    }

    /**
     * POST /api/v1/propietario/administradores/{id}/cancelar-invitacion
     * Anula la invitación y revoca los tokens generados.
     */
    public function cancelarInvitacion(Request $request, string $id): JsonResponse
    {
        try {
            $resultado = $this->service->cancelarInvitacion($request->user()->empresa_id, $id);

            return ApiResponse::ok($resultado);
        } catch (\DomainException $e) {
            if ($e->getMessage() === 'ADMIN_NO_ENCONTRADO') {
                return ApiResponse::error(
                    'ADMIN_NO_ENCONTRADO',
                    'La invitación no existe o ya fue procesada.',
                    404,
                );
            }

            return ApiResponse::error('ERROR_CANCELACION', $e->getMessage(), 400);
        }
    }

    /**
     * GET /api/v1/propietario/administradores/{id}/enlace-invitacion
     * Obtiene el enlace de activación seguro para copiarlo o compartirlo.
     */
    public function enlaceInvitacion(Request $request, string $id): JsonResponse
    {
        try {
            $resultado = $this->service->obtenerEnlace($request->user()->empresa_id, $id);

            return ApiResponse::ok($resultado);
        } catch (\DomainException $e) {
            if ($e->getMessage() === 'ADMIN_NO_ENCONTRADO') {
                return ApiResponse::error(
                    'ADMIN_NO_ENCONTRADO',
                    'El administrador no existe.',
                    404,
                );
            }

            return ApiResponse::error('ERROR_ENLACE', $e->getMessage(), 400);
        }
    }

    /**
     * PATCH /api/v1/propietario/administradores/{id}/cambiar-estado
     * Desactiva o reactiva un administrador con revocación de sesiones en Redis.
     */
    public function cambiarEstado(Request $request, string $id): JsonResponse
    {
        $datos = $request->validate([
            'nuevo_estado' => ['required', 'string', 'in:activo,inactivo'],
        ]);

        try {
            $resultado = $this->service->cambiarEstado(
                $request->user()->empresa_id,
                $id,
                $datos['nuevo_estado'],
            );

            return ApiResponse::ok($resultado);
        } catch (\OverflowException $e) {
            return ApiResponse::error(
                'PERSONAL_LIMITE_PLAN_ALCANZADO',
                'No es posible reactivar al administrador porque has alcanzado el límite de usuarios de tu plan.',
                403,
            );
        } catch (\DomainException $e) {
            if ($e->getMessage() === 'ADMIN_NO_ENCONTRADO') {
                return ApiResponse::error(
                    'ADMIN_NO_ENCONTRADO',
                    'El administrador no existe o pertenece a otra empresa.',
                    404,
                );
            }

            return ApiResponse::error('ERROR_ESTADO', $e->getMessage(), 400);
        }
    }
}
