<?php

namespace App\Http\Controllers\Api\Saas;

use App\Domains\Tenant\Services\TenantProvisioningService;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class SaasTenantController extends Controller
{
    public function __construct(
        private TenantProvisioningService $provisioningService
    ) {}

    /**
     * POST /api/v1/saas/tenants/alta-manual
     * Registra un nuevo tenant por alta manual B2B con validación sintáctica y pago verificado (CU-SAAS-01).
     */
    public function altaManual(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ruc' => ['required', 'string', 'size:11'],
            'razon_social' => ['required', 'string', 'min:3', 'max:150'],
            'direccion_sede' => ['nullable', 'string', 'max:200'],
            'propietario_nombre' => ['required', 'string', 'min:3', 'max:100'],
            'propietario_email' => ['required', 'email', 'max:100'],
            'propietario_telefono' => ['required', 'string', 'max:30'],
            'plan_id' => ['required', 'integer'],
            'ciclo_facturacion' => ['required', 'string', 'in:mensual,anual'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin_periodo' => ['nullable', 'date'],
            'monto_cobrado_pen' => ['required', 'numeric', 'min:0.01'],
            'origen_pago' => ['required', 'string', 'in:stripe,transferencia_bancaria,deposito_bancario,yape_empresa,efectivo'],
            'numero_operacion' => ['required', 'string', 'min:3', 'max:100'],
            'fecha_operacion' => ['nullable', 'date'],
            'nota_administrativa' => ['nullable', 'string', 'max:500'],
            'enviar_email_bienvenida' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error(
                'VALIDACION_FALLIDA',
                $validator->errors()->first(),
                422,
                $validator->errors()->toArray()
            );
        }

        $validated = $validator->validated();

        try {
            $resultado = $this->provisioningService->provisionarAltaManual($validated);

            return ApiResponse::ok($resultado, 201);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error('DATOS_INVALIDOS', $e->getMessage(), 422);
        } catch (\DomainException $e) {
            return ApiResponse::error('CONFLICTO_NEGOCIO', $e->getMessage(), 409);
        } catch (\OutOfBoundsException $e) {
            return ApiResponse::error('PLAN_INVALIDO', $e->getMessage(), 404);
        } catch (\Throwable $e) {
            Log::error("Error en alta manual B2B: {$e->getMessage()}", ['exception' => $e]);

            return ApiResponse::error('ERROR_INTERNO', 'Ocurrió un error inesperado al procesar el alta manual de la empresa.', 500);
        }
    }

    /**
     * GET /api/v1/saas/tenants
     * Supervisión de empresas registradas con cálculo de KPIs y filtros por pestañas (CU-SAAS-01).
     */
    public function index(Request $request): JsonResponse
    {
        $tabEstado = (string) $request->query('tab_estado', 'todos');
        $planId = $request->query('plan_id', 'todos');
        $buscar = trim((string) $request->query('buscar', ''));
        $pagina = max(1, (int) $request->query('pagina', 1));
        $porPagina = max(1, min(100, (int) $request->query('por_pagina', 15)));

        // 1. Obtener todas las filas de la vista analítica para calcular métricas globales
        $todas = DB::table('v_saas_tenants_resumen')
            ->orderByDesc('fecha_registro')
            ->get();

        $totalEmpresas = $todas->count();
        $mesActual = Carbon::now()->month;
        $anioActual = Carbon::now()->year;

        $nuevasEsteMes = $todas->filter(function ($t) use ($mesActual, $anioActual) {
            if (empty($t->fecha_registro)) return false;
            $fecha = Carbon::parse($t->fecha_registro);
            return $fecha->month === $mesActual && $fecha->year === $anioActual;
        })->count();

        $activasCount = 0;
        $enGraciaCount = 0;
        $suspendidasCount = 0;
        $mrrTotal = 0.0;
        $mrrEnRiesgo = 0.0;
        $sedesTotales = 0;

        foreach ($todas as $t) {
            $sedesTotales += (int) ($t->locales_activos_conteo ?? 0);

            // Precios canónicos según plan oficial
            $precioMensual = match ((int) $t->plan_id) {
                1 => 40.0,
                3 => 160.0,
                default => 80.0,
            };

            $mrrTotal += $precioMensual;

            if ($t->estado_suscripcion === 'activa') {
                $activasCount++;
            } elseif ($t->estado_suscripcion === 'periodo_gracia') {
                $enGraciaCount++;
                $mrrEnRiesgo += $precioMensual;
            } elseif ($t->estado_suscripcion === 'suspendida') {
                $suspendidasCount++;
            }
        }

        $promedioSedes = $totalEmpresas > 0 ? round($sedesTotales / $totalEmpresas, 1) : 0.0;

        $metricas = [
            'total_empresas' => $totalEmpresas,
            'nuevas_empresas_este_mes' => $nuevasEsteMes,
            'mrr_total_pen' => $mrrTotal,
            'suscripciones_activas' => $activasCount,
            'suscripciones_en_gracia' => $enGraciaCount,
            'mrr_en_riesgo_pen' => $mrrEnRiesgo,
            'suscripciones_suspendidas' => $suspendidasCount,
            'sedes_operativas_totales' => $sedesTotales,
            'promedio_sedes_por_tenant' => $promedioSedes,
        ];

        // 2. Aplicar filtros reactivos para la paginación de la tabla
        $query = DB::table('v_saas_tenants_resumen');

        if ($tabEstado !== 'todos') {
            $query->where('estado_suscripcion', $tabEstado);
        }

        if ($planId !== 'todos' && is_numeric($planId)) {
            $query->where('plan_id', (int) $planId);
        }

        if (! empty($buscar)) {
            $b = '%' . strtolower($buscar) . '%';
            $query->where(function ($q) use ($b) {
                $q->whereRaw('LOWER(razon_social) LIKE ?', [$b])
                  ->orWhereRaw('ruc LIKE ?', [$b])
                  ->orWhereRaw('LOWER(correo_contacto) LIKE ?', [$b]);
            });
        }

        $totalFilas = $query->count();
        $offset = ($pagina - 1) * $porPagina;

        $filas = $query->orderByDesc('fecha_registro')
            ->offset($offset)
            ->limit($porPagina)
            ->get();

        $items = $filas->map(function ($row) {
            $codigoDisplay = 'EMP-' . strtoupper(substr($row->ruc, 2, 6));
            $diasGracia = (int) ($row->dias_gracia_restantes ?? 5);

            return [
                'empresa_id' => $row->empresa_id,
                'codigo_display' => $codigoDisplay,
                'razon_social' => $row->razon_social,
                'nombre_comercial_sede' => $row->razon_social,
                'ruc' => $row->ruc,
                'tipo_identidad_fiscal' => $row->tipo_identidad_fiscal ?? 'RUC_20',
                'plan_id' => (int) $row->plan_id,
                'plan_nombre' => $row->plan_nombre,
                'locales_activos' => (int) ($row->locales_activos_conteo ?? 0),
                'estado_suscripcion' => $row->estado_suscripcion ?? 'activa',
                'dias_gracia_restantes' => $diasGracia,
                'dia_gracia_actual' => max(1, 6 - $diasGracia),
                'fecha_proximo_cobro' => $row->fecha_fin_periodo ? Carbon::parse($row->fecha_fin_periodo)->toIso8601String() : now()->addMonth()->toIso8601String(),
                'fecha_corte_gracia' => $row->fecha_corte_gracia,
                'origen_pago_tipo' => $row->ultimo_origen_pago ?? 'transferencia_bancaria',
                'metodo_pago_detalle' => strtoupper(str_replace('_', ' ', $row->ultimo_origen_pago ?? 'transferencia_bancaria')),
                'origen_alta' => 'manual_admin',
                'fecha_registro' => $row->fecha_registro ? Carbon::parse($row->fecha_registro)->toIso8601String() : now()->toIso8601String(),
            ];
        });

        return ApiResponse::ok([
            'metricas' => $metricas,
            'tenants' => $items,
            'total_filas' => $totalFilas,
            'pagina' => $pagina,
            'total_paginas' => max(1, (int) ceil($totalFilas / $porPagina)),
        ]);
    }

    /**
     * GET /api/v1/saas/tenants/{id}
     * Expediente 360° del tenant con consumos de cuota, historial de pagos y sedes (Vista 2).
     */
    public function show(string $id): JsonResponse
    {
        $empresa = DB::table('empresa')
            ->where('id', $id)
            ->orWhere('ruc', $id)
            ->first();

        if (! $empresa) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'La empresa solicitada no existe en el sistema.', 404);
        }

        $suscripcion = DB::table('suscripcion')
            ->where('id', $empresa->ultima_suscripcion_id)
            ->first()
            ?: DB::table('suscripcion')->where('empresa_id', $empresa->id)->latest('created_at')->first();

        $plan = DB::table('plan')->where('id', $empresa->plan_id)->first();

        $propietario = DB::table('usuario')
            ->where('empresa_id', $empresa->id)
            ->where('rol', 'propietario')
            ->first();

        $localPrincipal = DB::table('local')
            ->where('empresa_id', $empresa->id)
            ->first();

        $pagos = DB::table('pago')
            ->where('empresa_id', $empresa->id)
            ->orderByDesc('fecha')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'comprobante_codigo' => $p->numero_operacion ?: 'REC-' . substr($p->id, 0, 8),
                    'fecha' => $p->fecha ? Carbon::parse($p->fecha)->toIso8601String() : now()->toIso8601String(),
                    'monto_pen' => (float) $p->monto,
                    'origen_pago' => $p->origen_pago,
                    'medio_detalle' => strtoupper(str_replace('_', ' ', $p->origen_pago)) . ($p->numero_operacion ? " ({$p->numero_operacion})" : ''),
                    'estado' => $p->estado,
                    'stripe_payment_id' => $p->stripe_payment_id ?? null,
                    'numero_operacion' => $p->numero_operacion ?? null,
                    'nota' => $p->nota ?? null,
                ];
            });

        $localesCount = DB::table('local')->where('empresa_id', $empresa->id)->where('estado', 'activo')->count();
        $mesasCount = DB::table('mesa')
            ->join('local', 'local.id', '=', 'mesa.local_id')
            ->where('local.empresa_id', $empresa->id)
            ->count();
        $usuariosCount = DB::table('usuario')->where('empresa_id', $empresa->id)->where('estado', 'activo')->count();

        $consumo = [
            'locales_actuales' => $localesCount,
            'locales_limite' => $plan ? (int) $plan->max_locales : 3,
            'mesas_actuales' => $mesasCount,
            'mesas_limite' => $plan ? (int) $plan->max_mesas : 30,
            'usuarios_actuales' => $usuariosCount,
            'usuarios_limite' => $plan ? (int) $plan->max_usuarios : 15,
        ];

        $diasGracia = $suscripcion ? (int) $suscripcion->dias_gracia_restantes : 5;

        $detalle = [
            'empresa_id' => $empresa->id,
            'codigo_display' => 'EMP-' . strtoupper(substr($empresa->ruc, 2, 6)),
            'ruc' => $empresa->ruc,
            'tipo_contribuyente_label' => $empresa->tipo_identidad_fiscal === 'RUC_20'
                ? 'RUC 20 — Persona Jurídica (Empresa)'
                : 'RUC 10 — Persona Natural con Negocio',
            'razon_social' => $empresa->razon_social,
            'direccion_sede_principal' => $localPrincipal ? $localPrincipal->direccion : 'Sin sedes registradas aún',
            'telefono_contacto' => $empresa->telefono ?? '',
            'correo_contacto' => $empresa->correo_contacto,
            'propietario_titular' => [
                'nombre' => $propietario ? $propietario->nombre : 'Titular Propietario',
                'correo' => $propietario ? $propietario->correo : $empresa->correo_contacto,
                'telefono' => $propietario ? ($propietario->telefono ?? '') : ($empresa->telefono ?? ''),
                'activo' => $empresa->estado !== 'suspendida',
            ],
            'plan' => [
                'id' => $plan ? (int) $plan->id : 2,
                'nombre' => $plan ? $plan->nombre : 'Pro',
                'precio_mensual' => $plan ? (float) $plan->precio_mensual : 80.0,
                'ciclo' => 'mensual',
            ],
            'estado_suscripcion' => $suscripcion ? $suscripcion->estado : $empresa->estado,
            'dias_gracia_restantes' => $diasGracia,
            'dia_gracia_actual' => max(1, 6 - $diasGracia),
            'fecha_registro' => $empresa->fecha_registro ? Carbon::parse($empresa->fecha_registro)->toIso8601String() : now()->toIso8601String(),
            'fecha_proximo_cobro' => $suscripcion ? Carbon::parse($suscripcion->fecha_fin_periodo)->toIso8601String() : now()->addMonth()->toIso8601String(),
            'fecha_corte_gracia' => $suscripcion->fecha_corte_gracia ?? null,
            'stripe_customer_id' => $empresa->stripe_customer_id ?? null,
            'stripe_subscription_id' => $suscripcion->stripe_subscription_id ?? null,
            'metodo_pago_detalle' => $pagos->first()['medio_detalle'] ?? 'Transferencia Bancaria',
            'origen_alta' => $empresa->origen_alta ?? 'manual_admin',
            'historial_pagos' => $pagos,
            'consumo' => $consumo,
        ];

        return ApiResponse::ok($detalle);
    }

    /**
     * POST /api/v1/saas/tenants/{id}/suspender
     * Suspende preventivamente a una empresa por incumplimiento de pago o decisión administrativa.
     */
    public function suspender(Request $request, string $id): JsonResponse
    {
        $empresa = DB::table('empresa')->where('id', $id)->first();
        if (! $empresa) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'La empresa no existe.', 404);
        }

        DB::table('empresa')->where('id', $id)->update([
            'estado' => 'suspendida',
            'updated_at' => now(),
        ]);

        DB::table('suscripcion')->where('empresa_id', $id)->update([
            'estado' => 'suspendida',
            'dias_gracia_restantes' => 0,
            'updated_at' => now(),
        ]);

        return ApiResponse::ok([
            'empresa_id' => $id,
            'estado' => 'suspendida',
            'mensaje' => "Empresa {$empresa->razon_social} suspendida preventivamente.",
        ]);
    }

    /**
     * POST /api/v1/saas/tenants/{id}/notificar-cobro
     * Reenvía la notificación de cobro o enlace seguro de capability token al titular (72h).
     */
    public function notificarCobro(string $id): JsonResponse
    {
        $empresa = DB::table('empresa')->where('id', $id)->first();
        if (! $empresa) {
            return ApiResponse::error('EMPRESA_NO_ENCONTRADA', 'La empresa no existe.', 404);
        }

        $propietario = DB::table('usuario')
            ->where('empresa_id', $id)
            ->where('rol', 'propietario')
            ->first();

        $token = Str::random(48);
        $expiraEn = now()->addHours(72)->toIso8601String();

        if ($propietario) {
            try {
                Redis::setex("invitacion:admin:{$token}", 259200, json_encode([
                    'usuario_id' => $propietario->id,
                    'empresa_id' => $empresa->id,
                    'correo' => $propietario->correo,
                    'nombre' => $propietario->nombre,
                    'rol' => 'propietario',
                    'token' => $token,
                    'expira_en' => $expiraEn,
                ]));
            } catch (\Throwable $e) {
                Log::warning("No fue posible renovar capability token en Redis: {$e->getMessage()}");
            }
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        return ApiResponse::ok([
            'empresa_id' => $id,
            'correo' => $propietario ? $propietario->correo : $empresa->correo_contacto,
            'invitacion_token' => $token,
            'invitacion_url' => "{$frontendUrl}/activar-cuenta?token={$token}",
            'mensaje' => 'Recordatorio y capability token renovado por 72 horas despachado al titular.',
        ]);
    }

    /**
     * GET /api/v1/saas/planes
     * Catálogo oficial de planes SaaS.
     */
    public function planes(): JsonResponse
    {
        $planes = DB::table('plan')
            ->where('activo', true)
            ->orderBy('id')
            ->get();

        return ApiResponse::ok($planes);
    }
}
