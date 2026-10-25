<?php

namespace App\Http\Controllers\Api;

use App\Domains\Caja\Jobs\GenerarComprobanteDigitalJob;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class CajaController extends Controller
{
    /**
     * CU-CAJA-01: Obtener estado de sesión de caja del local.
     */
    public function getEstadoSesion(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $local = DB::table('local')->where('id', $localId)->first();
        $sedeNombre = $local ? $local->nombre : 'Áurea';

        // Buscar caja abierta activa en el local
        $cajaAbierta = DB::table('caja as c')
            ->join('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.local_id', $localId)
            ->where('c.estado', 'abierta')
            ->select([
                'c.id',
                'c.local_id',
                'c.cajero_id',
                'u.nombre as cajero_nombre',
                'u.correo as cajero_correo',
                'c.correlativo',
                'c.monto_apertura',
                'c.notas_apertura',
                'c.estado',
                'c.fecha_apertura',
            ])
            ->first();

        // Proyectar siguiente correlativo
        $ultimoCorrelativo = (int) (DB::table('caja')->where('local_id', $localId)->max('correlativo') ?? 0);
        $correlativoProyectado = $ultimoCorrelativo + 1;

        if ($cajaAbierta) {
            // Calcular ventas del turno activo
            $totalVentas = DB::table('comprobante')
                ->where('caja_id', $cajaAbierta->id)
                ->where('estado', 'emitido')
                ->count();

            $montoVentas = (float) (DB::table('comprobante')
                ->where('caja_id', $cajaAbierta->id)
                ->where('estado', 'emitido')
                ->sum('total') ?? 0.00);

            // Calcular efectivo actual en gaveta (apertura + ingresos efectivo - egresos)
            $movimientosEfectivo = (float) (DB::table('caja_movimiento')
                ->where('caja_id', $cajaAbierta->id)
                ->where('metodo_pago', 'efectivo')
                ->where('tipo', '!=', 'apertura')
                ->sum('monto') ?? 0.00);

            $efectivoActual = round((float) $cajaAbierta->monto_apertura + $movimientosEfectivo, 2);

            $turnoActivo = [
                'id' => $cajaAbierta->id,
                'local_id' => $cajaAbierta->local_id,
                'cajero_id' => $cajaAbierta->cajero_id,
                'cajero_nombre' => $cajaAbierta->cajero_nombre,
                'cajero_rol' => 'Cajero de Turno',
                'correlativo' => (int) $cajaAbierta->correlativo,
                'monto_apertura' => (float) $cajaAbierta->monto_apertura,
                'notas_apertura' => $cajaAbierta->notas_apertura,
                'estado' => $cajaAbierta->estado,
                'fecha_apertura' => $cajaAbierta->fecha_apertura,
                'total_ventas' => $totalVentas,
                'monto_ventas' => $montoVentas,
                'efectivo_actual' => $efectivoActual,
            ];

            return ApiResponse::ok([
                'estado_caja' => 'abierta',
                'puede_abrir' => false,
                'turno_activo' => $turnoActivo,
                'ultimo_turno' => null,
                'total_ventas_actual' => $totalVentas,
                'monto_ventas_actual' => $montoVentas,
                'sede_nombre' => $sedeNombre,
                'correlativo_proyectado' => $correlativoProyectado,
            ]);
        }

        // Si no hay caja abierta, buscar el último turno cerrado
        $ultimoTurnoRow = DB::table('caja as c')
            ->join('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.local_id', $localId)
            ->where('c.estado', 'cerrada')
            ->orderBy('c.fecha_cierre', 'desc')
            ->select([
                'c.id',
                'c.local_id',
                'c.cajero_id',
                'u.nombre as cajero_nombre',
                'c.correlativo',
                'c.monto_apertura',
                'c.estado',
                'c.fecha_apertura',
                'c.fecha_cierre',
                'c.monto_real',
            ])
            ->first();

        $ultimoTurno = $ultimoTurnoRow ? [
            'id' => $ultimoTurnoRow->id,
            'local_id' => $ultimoTurnoRow->local_id,
            'cajero_id' => $ultimoTurnoRow->cajero_id,
            'cajero_nombre' => $ultimoTurnoRow->cajero_nombre,
            'correlativo' => (int) $ultimoTurnoRow->correlativo,
            'monto_apertura' => (float) $ultimoTurnoRow->monto_apertura,
            'estado' => $ultimoTurnoRow->estado,
            'fecha_apertura' => $ultimoTurnoRow->fecha_apertura,
            'fecha_cierre' => $ultimoTurnoRow->fecha_cierre,
            'monto_real' => $ultimoTurnoRow->monto_real !== null ? (float) $ultimoTurnoRow->monto_real : null,
        ] : null;

        return ApiResponse::ok([
            'estado_caja' => 'cerrada',
            'puede_abrir' => true,
            'turno_activo' => null,
            'ultimo_turno' => $ultimoTurno,
            'total_ventas_actual' => 0,
            'monto_ventas_actual' => 0.00,
            'sede_nombre' => $sedeNombre,
            'correlativo_proyectado' => $correlativoProyectado,
        ]);
    }

    /**
     * CU-CAJA-01: Aperturar un nuevo turno de caja.
     */
    public function apertura(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'monto_apertura' => ['required', 'numeric', 'min:0'],
            'notas_apertura' => ['nullable', 'string', 'max:500'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        $montoApertura = (float) $validated['monto_apertura'];
        $notas = $validated['notas_apertura'] ?? $validated['notas'] ?? null;

        return DB::transaction(function () use ($user, $localId, $montoApertura, $notas) {
            // Verificar si ya existe una caja abierta para este local
            $cajaExistente = DB::table('caja')
                ->where('local_id', $localId)
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if ($cajaExistente) {
                return ApiResponse::error(
                    'ERR_TURNO_PREVIO_NO_CERRADO',
                    'Ya existe un turno de caja abierto en esta sede. Debe cerrarse antes de iniciar uno nuevo.',
                    409
                );
            }

            // Determinar siguiente correlativo
            $ultimoCorrelativo = (int) (DB::table('caja')->where('local_id', $localId)->max('correlativo') ?? 0);
            $correlativo = $ultimoCorrelativo + 1;

            $cajaId = (string) Str::uuid();

            // Insertar caja abierta
            DB::table('caja')->insert([
                'id' => $cajaId,
                'local_id' => $localId,
                'cajero_id' => $user->id,
                'correlativo' => $correlativo,
                'fecha_apertura' => now(),
                'monto_apertura' => $montoApertura,
                'notas_apertura' => $notas,
                'estado' => 'abierta',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Registrar movimiento inicial de apertura
            DB::table('caja_movimiento')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $cajaId,
                'local_id' => $localId,
                'tipo' => 'apertura',
                'monto' => $montoApertura,
                'metodo_pago' => 'efectivo',
                'descripcion' => 'Fondo inicial del turno #' . str_pad((string) $correlativo, 3, '0', STR_PAD_LEFT),
                'created_at' => now(),
            ]);

            return ApiResponse::ok([
                'id' => $cajaId,
                'local_id' => $localId,
                'cajero_id' => $user->id,
                'cajero_nombre' => $user->nombre,
                'cajero_rol' => 'Cajero Titular',
                'correlativo' => $correlativo,
                'monto_apertura' => $montoApertura,
                'notas_apertura' => $notas,
                'estado' => 'abierta',
                'fecha_apertura' => now()->toIso8601String(),
                'efectivo_actual' => $montoApertura,
                'total_ventas' => 0,
                'monto_ventas' => 0.00,
            ], 201);
        });
    }

    /**
     * CU-CAJA-02: Obtener listado de mesas para el Monitor POS de Caja.
     */
    public function getMesasMonitor(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesasRaw = DB::table('mesa as m')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.local_id', $localId)
            ->where('m.estado', '!=', 'inactiva')
            ->orderBy('pis.created_at')
            ->orderBy('m.numero')
            ->select([
                'm.id',
                'm.numero',
                'pis.nombre as piso_nombre',
                'm.estado as mesa_estado',
                'm.capacidad',
            ])
            ->get();

        $mesasMonitor = [];

        foreach ($mesasRaw as $m) {
            $pedido = DB::table('pedido as p')
                ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
                ->where('p.mesa_id', $m->id)
                ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
                ->select([
                    'p.id',
                    'p.numero_comanda',
                    'p.estado as pedido_estado',
                    'p.comensales',
                    'p.mozo_id',
                    'u.nombre as mozo_nombre',
                    'p.created_at',
                    'p.precuenta_generada_at',
                ])
                ->orderBy('p.created_at', 'desc')
                ->first();

            if (! $pedido) {
                $mesasMonitor[] = [
                    'id' => $m->id,
                    'numero' => $m->numero,
                    'piso_nombre' => $m->piso_nombre,
                    'estado' => 'libre',
                    'mozo_nombre' => null,
                    'comensales' => (int) $m->capacidad,
                    'total_consumo' => 0.00,
                    'pedido_id' => null,
                    'minutos_en_mesa' => 0,
                    'minutos_espera_cuenta' => null,
                    'subcuentas_count' => 0,
                ];
                continue;
            }

            // Calcular consumo activo anti-sobrecobro (estado_pago = 'pendiente' y estado != 'anulado')
            $totalConsumo = (float) (DB::table('pedido_item')
                ->where('pedido_id', $pedido->id)
                ->where('estado_pago', 'pendiente')
                ->where('estado', '!=', 'anulado')
                ->sum(DB::raw('cantidad * precio_unitario')) ?? 0.00);

            $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

            $minutosEsperaCuenta = null;
            $fechaCuenta = $pedido->precuenta_generada_at ?? ($pedido->pedido_estado === 'cuenta_pedida' ? ($pedido->created_at ?? null) : null);
            if ($fechaCuenta) {
                $minutosEsperaCuenta = (int) max(0, round((now()->timestamp - strtotime($fechaCuenta)) / 60));
            }

            $subcuentasCount = DB::table('pedido_subcuenta')
                ->where('pedido_id', $pedido->id)
                ->where('estado', '!=', 'anulado')
                ->count();

            $estadoMonitor = $pedido->pedido_estado === 'cuenta_pedida' ? 'cuenta_pedida' : 'ocupada';

            $mesasMonitor[] = [
                'id' => $m->id,
                'numero' => $m->numero,
                'piso_nombre' => $m->piso_nombre,
                'estado' => $estadoMonitor,
                'mozo_nombre' => $pedido->mozo_nombre,
                'comensales' => (int) $pedido->comensales,
                'total_consumo' => round($totalConsumo, 2),
                'pedido_id' => $pedido->id,
                'minutos_en_mesa' => $minutosEnMesa,
                'minutos_espera_cuenta' => $minutosEsperaCuenta,
                'subcuentas_count' => $subcuentasCount,
            ];
        }

        return ApiResponse::ok($mesasMonitor);
    }

    /**
     * CU-CAJA-02: Obtener métricas KPI para la barra superior del POS.
     */
    public function getMetricasPos(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $totalMesas = DB::table('mesa')
            ->where('local_id', $localId)
            ->where('estado', '!=', 'inactiva')
            ->count();

        $pedidosActivos = DB::table('pedido as p')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->where('m.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select('p.id', 'p.estado')
            ->get();

        $mesasOcupadasCount = $pedidosActivos->count();
        $mesasCuentaPedida = $pedidosActivos->where('estado', 'cuenta_pedida')->count();

        // Monto total por cobrar en el salón (solo ítems con estado_pago = 'pendiente' y no anulados)
        $activePedidoIds = $pedidosActivos->pluck('id');
        $montoPorCobrar = 0.00;
        if ($activePedidoIds->isNotEmpty()) {
            $montoPorCobrar = (float) (DB::table('pedido_item')
                ->whereIn('pedido_id', $activePedidoIds)
                ->where('estado_pago', 'pendiente')
                ->where('estado', '!=', 'anulado')
                ->sum(DB::raw('cantidad * precio_unitario')) ?? 0.00);
        }

        // Efectivo en caja activa
        $cajaAbierta = DB::table('caja')
            ->where('local_id', $localId)
            ->where('estado', 'abierta')
            ->first();

        $efectivoEnCaja = 0.00;
        if ($cajaAbierta) {
            $movEfectivo = (float) (DB::table('caja_movimiento')
                ->where('caja_id', $cajaAbierta->id)
                ->where('metodo_pago', 'efectivo')
                ->where('tipo', '!=', 'apertura')
                ->sum('monto') ?? 0.00);

            $efectivoEnCaja = round((float) $cajaAbierta->monto_apertura + $movEfectivo, 2);
        }

        $porcentajeOcupacion = $totalMesas > 0 ? (int) round(($mesasOcupadasCount / $totalMesas) * 100) : 0;

        return ApiResponse::ok([
            'mesas_cuenta_pedida' => $mesasCuentaPedida,
            'monto_por_cobrar' => round($montoPorCobrar, 2),
            'efectivo_en_caja' => $efectivoEnCaja,
            'mesas_ocupadas_count' => $mesasOcupadasCount,
            'total_mesas_count' => $totalMesas,
            'porcentaje_ocupacion' => $porcentajeOcupacion,
        ]);
    }

    /**
     * CU-CAJA-02: Obtener precuenta digital consolidada para el ModalPrecuentaCompleta.
     */
    public function getPrecuentaMesa(Request $request, string $mesaId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa as m')
            ->join('piso as pis', 'pis.id', '=', 'm.piso_id')
            ->where('m.id', $mesaId)
            ->where('m.local_id', $localId)
            ->select('m.*', 'pis.nombre as piso_nombre')
            ->first();

        if (! $mesa) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'La mesa no existe.', 404);
        }

        $mesaEfectivaId = $mesa->mesa_principal_id ?? $mesa->id;

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesaEfectivaId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida', 'borrador'])
            ->select([
                'p.id',
                'p.numero_comanda',
                'p.comensales',
                'p.mozo_id',
                'u.nombre as mozo_nombre',
                'p.estado as pedido_estado',
                'p.created_at',
                'p.precuenta_generada_at',
                'p.promocion_id',
                'p.tipo_comprobante_sugerido',
                'p.documento_cliente_sugerido',
                'p.nombre_cliente_sugerido',
                'p.medio_pago_sugerido',
                'p.numero_operacion_sugerido',
            ])
            ->orderBy('p.created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('PEDIDO_NO_ACTIVO', 'La mesa no tiene consumos activos.', 404);
        }

        // Consultar ítems con filtro anti-sobrecobro estricto
        $itemsRaw = DB::table('pedido_item as pi')
            ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedido->id)
            ->where('pi.estado', '!=', 'anulado')
            ->where('pi.estado_pago', 'pendiente')
            ->select([
                'pi.id',
                'pi.producto_id',
                'pr.nombre as producto_nombre',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'pi.estado as estado_cocina',
                'pr.requiere_preparacion',
            ])
            ->get();

        $items = $itemsRaw->map(function ($it) {
            $subtotal = round((float) $it->cantidad * (float) $it->precio_unitario, 2);
            return [
                'id' => $it->id,
                'producto_id' => $it->producto_id,
                'nombre' => $it->producto_nombre,
                'producto_nombre' => $it->producto_nombre,
                'nota_cocina' => $it->nota_cocina,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => $subtotal,
                'estado_cocina' => $it->estado_cocina,
                'requiere_preparacion' => (bool) $it->requiere_preparacion,
            ];
        });

        $consumoBruto = (float) $items->sum('subtotal');
        $descuentoAplicado = 0.00;
        $totalNeto = round($consumoBruto - $descuentoAplicado, 2);

        // Desglose oficial SUNAT UBL 2.1
        $baseImponible = round($totalNeto / 1.18, 2);
        $igv = round($totalNeto - $baseImponible, 2);

        // Alerta de cocina si hay platos en preparación activa
        $tieneCocinaPendiente = $itemsRaw
            ->where('requiere_preparacion', true)
            ->whereIn('estado_cocina', ['en_cola', 'en_preparacion'])
            ->isNotEmpty();

        $alertaCocina = $tieneCocinaPendiente
            ? 'Existen platos en preparación que aún no han sido despachados por cocina.'
            : null;

        // Opciones de cobro según métodos de pago activos
        $metodosPago = DB::table('metodo_pago_local')
            ->where('local_id', $localId)
            ->where('activo', true)
            ->whereIn('codigo', ['efectivo', 'tarjeta', 'billetera_digital'])
            ->orderBy('orden')
            ->get();

        $opcionesCobro = $metodosPago->map(function ($mp) use ($totalNeto) {
            $porcentajeRecargo = $mp->codigo === 'tarjeta'
                ? (float) $mp->comision_porcentaje
                : 0.0;
            $comision = round($totalNeto * ($porcentajeRecargo / 100), 2);
            $datosAdicionales = is_string($mp->datos_adicionales)
                ? json_decode($mp->datos_adicionales, true)
                : (array) ($mp->datos_adicionales ?? []);

            $esBilletera = in_array($mp->codigo, ['billetera_digital', 'yape', 'plin']);

            return [
                'id' => $mp->id,
                'codigo' => $mp->codigo,
                'metodo_pago_codigo' => $mp->codigo,
                'nombre' => $mp->nombre,
                'metodo_pago_nombre' => $mp->nombre,
                'icono' => $mp->icono ?? 'wallet',
                'comision_porcentaje' => $porcentajeRecargo,
                'monto_comision' => $comision,
                'total_estimado' => round($totalNeto + $comision, 2),
                'detalle_billetera' => $esBilletera ? [
                    'telefono' => $datosAdicionales['telefono'] ?? '930723537',
                    'titular' => $datosAdicionales['titular'] ?? 'ÁUREA S.A.C.',
                    'ruc' => $datosAdicionales['ruc'] ?? '20601234567',
                    'monto_exacto' => round($totalNeto, 2),
                ] : null,
                'datos_adicionales' => $datosAdicionales,
            ];
        });

        $opcionTentativa = $opcionesCobro->firstWhere('codigo', $pedido->medio_pago_sugerido);
        $totalCobroTentativo = $opcionTentativa['total_estimado'] ?? $totalNeto;

        // Promociones comerciales disponibles
        $promociones = DB::table('promocion')
            ->where('local_id', $localId)
            ->where('activa', true)
            ->get()
            ->map(function ($pr) use ($totalNeto) {
                $ahorro = round($totalNeto * ((float) $pr->valor / 100), 2);
                return [
                    'id' => $pr->id,
                    'nombre' => $pr->nombre,
                    'tipo_descuento' => 'porcentaje',
                    'porcentaje_descuento' => (float) $pr->valor,
                    'valor' => (float) $pr->valor,
                    'ahorro_calculado' => $ahorro,
                    'aplicada' => false,
                    'descripcion' => $pr->descripcion,
                    'descripcion_condicion' => $pr->descripcion,
                ];
            });

        // Subcuentas registradas si existen
        $subcuentasRaw = DB::table('pedido_subcuenta')
            ->where('pedido_id', $pedido->id)
            ->where('estado', '!=', 'anulado')
            ->orderBy('numero_subcuenta')
            ->get();

        $subcuentas = $subcuentasRaw->map(function ($s) use ($user) {
            $clienteSubcuentaEnBd = false;
            $telSubcuenta = '';
            $emailSubcuenta = '';
            if (! empty($s->documento_cliente) && $s->documento_cliente !== '00000000') {
                $cRow = DB::table('cliente')
                    ->where('empresa_id', $user->empresa_id)
                    ->where('numero_documento', $s->documento_cliente)
                    ->first();
                if ($cRow) {
                    $clienteSubcuentaEnBd = true;
                    $telSubcuenta = $cRow->telefono ?? '';
                    $emailSubcuenta = $cRow->email ?? '';
                }
            }
            return [
                'id' => $s->id,
                'numero_subcuenta' => (int) $s->numero_subcuenta,
                'nombre_titular' => $s->nombre_cliente,
                'titular_referencia' => $s->nombre_cliente,
                'tipo_comprobante' => $s->tipo_comprobante,
                'documento_identidad' => $s->documento_cliente,
                'medio_pago_tentativo' => $s->medio_pago,
                'total_neto' => (float) $s->total,
                'estado' => $s->estado,
                'estado_pago' => $s->estado,
                'cliente_encontrado_en_bd' => $clienteSubcuentaEnBd,
                'telefono_sugerido' => $telSubcuenta,
                'email_sugerido' => $emailSubcuenta,
            ];
        });

        $minutosEsperaCuenta = null;
        $fechaCuenta = $pedido->precuenta_generada_at ?? ($pedido->pedido_estado === 'cuenta_pedida' ? ($pedido->created_at ?? null) : null);
        if ($fechaCuenta) {
            $minutosEsperaCuenta = (int) max(0, round((now()->timestamp - strtotime($fechaCuenta)) / 60));
        }

        $minutosEnMesa = (int) max(0, round((now()->timestamp - strtotime($pedido->created_at)) / 60));

        $promocionActiva = null;
        if (! empty($pedido->promocion_id)) {
            $prActiva = DB::table('promocion')->where('id', $pedido->promocion_id)->first();
            if ($prActiva) {
                $promocionActiva = [
                    'id' => (string) $prActiva->id,
                    'codigo' => (string) $prActiva->codigo,
                    'nombre' => (string) $prActiva->nombre,
                    'tipo_descuento' => (string) $prActiva->tipo_descuento,
                    'porcentaje_descuento' => $prActiva->tipo_descuento === 'porcentaje' ? (float) $prActiva->valor : 0.0,
                    'valor' => (float) $prActiva->valor,
                    'descripcion' => $prActiva->descripcion,
                ];
            }
        }

        $clienteEncontradoEnBd = false;
        $telefonoClienteSugerido = '';
        $emailClienteSugerido = '';
        if (! empty($pedido->documento_cliente_sugerido) && $pedido->documento_cliente_sugerido !== '00000000') {
            $clienteRow = DB::table('cliente')
                ->where('empresa_id', $user->empresa_id)
                ->where('numero_documento', $pedido->documento_cliente_sugerido)
                ->first();
            if ($clienteRow) {
                $clienteEncontradoEnBd = true;
                $telefonoClienteSugerido = $clienteRow->telefono ?? '';
                $emailClienteSugerido = $clienteRow->email ?? '';
            }
        }

        return ApiResponse::ok([
            'pedido_id' => $pedido->id,
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'mesa_estado' => $pedido->pedido_estado,
            'minutos_espera_cuenta' => $minutosEsperaCuenta,
            'minutos_en_mesa' => $minutosEnMesa,
            'es_mesa_unida' => str_contains($mesa->numero, ';'),
            'mozo_nombre' => $pedido->mozo_nombre ?? 'Mozo General',
            'comensales' => (int) $pedido->comensales,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'hora_pedido' => date('H:i', strtotime($pedido->created_at)),
            'items' => $items,
            'tiene_cocina_pendiente' => $tieneCocinaPendiente,
            'alerta_cocina' => $alertaCocina,
            'promociones_disponibles' => $promociones,
            'promocion_activa' => $promocionActiva,
            'promocion_activa_id' => $pedido->promocion_id,
            'tributacion_sunat' => [
                'consumo_bruto' => $consumoBruto,
                'descuento_aplicado' => $descuentoAplicado,
                'total_neto' => $totalNeto,
                'base_imponible' => $baseImponible,
                'igv' => $igv,
                'tasa_igv' => 0.18,
            ],
            'opciones_cobro' => $opcionesCobro,
            'opciones_pago' => $opcionesCobro,
            'tipo_comprobante_sugerido' => $pedido->tipo_comprobante_sugerido ?? 'boleta',
            'documento_cliente_sugerido' => $pedido->documento_cliente_sugerido,
            'nombre_cliente_sugerido' => $pedido->nombre_cliente_sugerido ?? 'CONSUMIDOR FINAL',
            'telefono_cliente_sugerido' => $telefonoClienteSugerido,
            'email_cliente_sugerido' => $emailClienteSugerido,
            'cliente_encontrado_en_bd' => $clienteEncontradoEnBd,
            'metodo_pago_tentativo' => $pedido->medio_pago_sugerido ?? 'efectivo',
            'numero_operacion_tentativo' => $pedido->numero_operacion_sugerido,
            'total_cobro_tentativo' => (float) $totalCobroTentativo,
            'subcuentas' => $subcuentas->isNotEmpty() ? $subcuentas : null,
            'generada_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * CU-CAJA-02: Conmutar mesa a CUENTA PEDIDA.
     */
    public function conmutarCuentaPedida(Request $request, string $mesaId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $mesa = DB::table('mesa')
            ->where('id', $mesaId)
            ->where('local_id', $localId)
            ->first();

        if (! $mesa) {
            return ApiResponse::error('MESA_NO_ENCONTRADA', 'Mesa no encontrada.', 404);
        }

        $pedido = DB::table('pedido')
            ->where('mesa_id', $mesaId)
            ->whereIn('estado', ['enviado', 'borrador', 'cuenta_pedida'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $pedido) {
            return ApiResponse::error('PEDIDO_NO_ACTIVO', 'No hay pedido activo para esta mesa.', 404);
        }

        DB::table('pedido')->where('id', $pedido->id)->update([
            'estado' => 'cuenta_pedida',
            'precuenta_generada_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::ok([
            'id' => $mesa->id,
            'numero' => $mesa->numero,
            'estado' => 'cuenta_pedida',
            'mensaje' => "Mesa {$mesa->numero} conmutada a CUENTA PEDIDA con éxito.",
        ]);
    }

    /**
     * CU-CAJA-03: Registrar cobro del pedido, emitir comprobante inmutable y liberar mesa.
     */
    public function cobrar(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'pedido_id' => ['required', 'uuid'],
            'tipo_comprobante' => ['required', 'string', 'in:boleta,factura,nota_venta'],
            'medio_pago' => ['required', 'string', 'in:efectivo,tarjeta,billetera_digital'],
            'monto_recibido' => ['nullable', 'numeric', 'min:0'],
            'documento_cliente' => ['nullable', 'string', 'max:20'],
            'nombre_cliente' => ['nullable', 'string', 'max:150'],
            'telefono_envio' => ['nullable', 'string', 'max:20'],
            'email_envio' => ['nullable', 'email', 'max:100'],
            'subcuenta_id' => ['nullable', 'uuid'],
        ]);

        try {
            return DB::transaction(function () use ($validated, $user, $localId) {
            $pedido = DB::table('pedido as p')
                ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
                ->where('p.id', $validated['pedido_id'])
                ->where('m.local_id', $localId)
                ->select('p.*')
                ->lockForUpdate()
                ->first();

            if (! $pedido) {
                return ApiResponse::error('PEDIDO_NO_ENCONTRADO', 'El pedido no existe.', 404);
            }

            if ($pedido->estado === 'cobrado') {
                return ApiResponse::error('PEDIDO_YA_COBRADO', 'El pedido ya fue cobrado al 100%.', 409);
            }

            // En una cuenta consolidada, Mozo define la configuración de cobro.
            // Caja la confirma y no debe sustituirla con valores enviados por el navegador.
            if (empty($validated['subcuenta_id'])) {
                $validated['tipo_comprobante'] = $pedido->tipo_comprobante_sugerido
                    ?? $validated['tipo_comprobante'];
                $validated['medio_pago'] = $pedido->medio_pago_sugerido
                    ?? $validated['medio_pago'];
                $validated['documento_cliente'] = $pedido->documento_cliente_sugerido
                    ?? $validated['documento_cliente'];
                $validated['nombre_cliente'] = $pedido->nombre_cliente_sugerido
                    ?? $validated['nombre_cliente'];
            }

            // Validar turno de caja activo en el local
            $caja = DB::table('caja')
                ->where('local_id', $localId)
                ->where('estado', 'abierta')
                ->first();

            if (! $caja) {
                return ApiResponse::error('ERR_CAJA_CERRADA', 'No existe un turno de caja abierto en esta sede.', 409);
            }

            $metodoPago = DB::table('metodo_pago_local')
                ->where('local_id', $localId)
                ->where('codigo', $validated['medio_pago'])
                ->where('activo', true)
                ->lockForUpdate()
                ->first();

            if (! $metodoPago) {
                return ApiResponse::error(
                    'ERR_METODO_PAGO_NO_DISPONIBLE',
                    'El metodo de pago seleccionado no esta habilitado en esta sede.',
                    409,
                );
            }

            // Consultar ítems a cobrar con filtro anti-sobrecobro
            $itemsQuery = DB::table('pedido_item as pi')
                ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
                ->where('pi.pedido_id', $pedido->id)
                ->where('pi.estado', '!=', 'anulado')
                ->where('pi.estado_pago', 'pendiente')
                ->select([
                    'pi.id',
                    'pi.producto_id',
                    'pr.nombre as producto_nombre',
                    'pi.cantidad',
                    'pi.precio_unitario',
                    DB::raw('(pi.cantidad * pi.precio_unitario) as subtotal'),
                ]);

            $subcuentaId = $validated['subcuenta_id'] ?? null;
            $subcuenta = null;
            if ($subcuentaId) {
                $subcuenta = DB::table('pedido_subcuenta')
                    ->where('id', $subcuentaId)
                    ->where('pedido_id', $pedido->id)
                    ->lockForUpdate()
                    ->first();

                if (! $subcuenta) {
                    return ApiResponse::error('SUBCUENTA_NO_ENCONTRADA', 'La subcuenta no pertenece al pedido.', 404);
                }

                $subcuentaItemIds = DB::table('pedido_subcuenta_item')
                    ->where('subcuenta_id', $subcuentaId)
                    ->pluck('pedido_item_id');

                $itemsQuery->whereIn('pi.id', $subcuentaItemIds);
            }

            $itemsToCharge = $itemsQuery->get();

            if ($itemsToCharge->isEmpty()) {
                return ApiResponse::error('NO_HAY_ITEMS_PENDIENTES', 'No existen consumos pendientes por cobrar.', 400);
            }

            $totalConsumo = $subcuenta ? (float) $subcuenta->total : (float) $itemsToCharge->sum('subtotal');
            $porcentajeRecargo = $metodoPago->codigo === 'tarjeta'
                ? (float) $metodoPago->comision_porcentaje
                : 0.0;
            $montoRecargo = round($totalConsumo * ($porcentajeRecargo / 100), 2);
            $totalCobro = round($totalConsumo + $montoRecargo, 2);
            $baseImponible = round($totalCobro / 1.18, 2);
            $igv = round($totalCobro - $baseImponible, 2);

            $documentoCliente = trim((string) ($validated['documento_cliente'] ?? $subcuenta?->documento_cliente ?? ''));
            $nombreCliente = trim((string) ($validated['nombre_cliente'] ?? $subcuenta?->nombre_cliente ?? ''));
            $tipoCliente = null;

            if ($validated['tipo_comprobante'] === 'factura') {
                if (! preg_match('/^(10|20)\d{9}$/', $documentoCliente) || $nombreCliente === '') {
                    return ApiResponse::error(
                        'DATOS_FISCALES_INVALIDOS',
                        'La factura requiere RUC válido de 11 dígitos y razón social.',
                        422,
                    );
                }

                $tipoCliente = 'RUC';
            }

            if ($validated['tipo_comprobante'] === 'boleta') {
                if ($totalCobro >= 700 && (! preg_match('/^\d{8}$/', $documentoCliente) || $nombreCliente === '')) {
                    return ApiResponse::error(
                        'DATOS_FISCALES_INVALIDOS',
                        'La boleta desde S/ 700.00 requiere DNI válido y nombre del cliente.',
                        422,
                    );
                }

                if ($documentoCliente !== '' && ! preg_match('/^\d{8}$/', $documentoCliente)) {
                    return ApiResponse::error('DNI_INVALIDO', 'El DNI debe tener 8 dígitos.', 422);
                }

                $tipoCliente = $documentoCliente === '' ? null : 'DNI';
            }

            if ($validated['tipo_comprobante'] === 'nota_venta' && $nombreCliente === '') {
                return ApiResponse::error('NOMBRE_CLIENTE_REQUERIDO', 'La nota de venta requiere el nombre del cliente.', 422);
            }

            $nombreCliente = $nombreCliente !== '' ? $nombreCliente : 'Cliente General';

            $montoRecibido = $validated['medio_pago'] === 'efectivo'
                ? (float) ($validated['monto_recibido'] ?? $totalCobro)
                : $totalCobro;

            if ($validated['medio_pago'] === 'efectivo' && $montoRecibido < $totalCobro) {
                return ApiResponse::error(
                    'MONTO_RECIBIDO_INSUFICIENTE',
                    'El efectivo recibido no cubre el total del comprobante.',
                    422,
                );
            }

            $vuelto = round($montoRecibido - $totalCobro, 2);

            $clienteId = null;
            if ($tipoCliente !== null) {
                DB::table('cliente')->updateOrInsert(
                    [
                        'empresa_id' => $user->empresa_id,
                        'tipo_documento' => $tipoCliente,
                        'numero_documento' => $documentoCliente,
                    ],
                    [
                        'nombre_identificativo' => $nombreCliente,
                        'telefono' => $validated['telefono_envio'] ?? null,
                        'email' => $validated['email_envio'] ?? null,
                        'updated_at' => now(),
                    ],
                );

                $clienteId = DB::table('cliente')
                    ->where('empresa_id', $user->empresa_id)
                    ->where('tipo_documento', $tipoCliente)
                    ->where('numero_documento', $documentoCliente)
                    ->value('id');
            }

            // La serie se bloquea en PostgreSQL para no duplicar correlativos bajo concurrencia.
            $serie = match ($validated['tipo_comprobante']) {
                'factura' => 'F001',
                'nota_venta' => 'NV01',
                default => 'B001',
            };

            $siguienteSerie = DB::selectOne(
                'SELECT fn_obtener_siguiente_correlativo(CAST(? AS uuid), ?, ?) AS correlativo',
                [$localId, $validated['tipo_comprobante'], $serie],
            );
            $correlativo = (int) $siguienteSerie->correlativo;

            $comprobanteId = (string) Str::uuid();
            $tokenQr = (string) Str::uuid();

            // 1. Insertar comprobante fiscal
            DB::table('comprobante')->insert([
                'id' => $comprobanteId,
                'pedido_id' => $pedido->id,
                'subcuenta_id' => $subcuentaId,
                'caja_id' => $caja->id,
                'cliente_id' => $clienteId,
                'tipo' => $validated['tipo_comprobante'],
                'serie' => $serie,
                'correlativo' => $correlativo,
                'documento_cliente' => $documentoCliente !== '' ? $documentoCliente : null,
                'nombre_cliente' => $nombreCliente,
                'telefono_envio' => $validated['telefono_envio'] ?? null,
                'email_envio' => $validated['email_envio'] ?? null,
                'metodo_pago_id' => $metodoPago->id,
                'medio_pago' => $validated['medio_pago'],
                'subtotal_consumo' => $totalConsumo,
                'porcentaje_recargo' => $porcentajeRecargo,
                'monto_recargo' => $montoRecargo,
                'base_imponible' => $baseImponible,
                'igv' => $igv,
                'total' => $totalCobro,
                'monto_recibido' => $montoRecibido,
                'vuelto' => $vuelto,
                'estado' => 'emitido',
                'token_qr' => $tokenQr,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Insertar líneas inmutables en comprobante_item (UBL 2.1 SUNAT)
            foreach ($itemsToCharge as $it) {
                $itemSubtotal = (float) $it->subtotal;
                $itemBase = round($itemSubtotal / 1.18, 2);
                $itemIgv = round($itemSubtotal - $itemBase, 2);

                DB::table('comprobante_item')->insert([
                    'id' => (string) Str::uuid(),
                    'comprobante_id' => $comprobanteId,
                    'pedido_item_id' => $it->id,
                    'producto_id' => $it->producto_id,
                    'descripcion' => $it->producto_nombre,
                    'cantidad' => $it->cantidad,
                    'precio_unitario' => $it->precio_unitario,
                    'subtotal' => $itemSubtotal,
                    'base_imponible' => $itemBase,
                    'igv' => $itemIgv,
                    'created_at' => now(),
                ]);
            }

            // 3. Marcar ítems cobrados con inmunidad financiera
            DB::table('pedido_item')
                ->whereIn('id', $itemsToCharge->pluck('id'))
                ->update([
                    'estado_pago' => 'cobrado',
                    'updated_at' => now(),
                ]);

            // 4. Si era subcuenta, marcarla como cobrada
            if ($subcuentaId) {
                DB::table('pedido_subcuenta')->where('id', $subcuentaId)->update([
                    'estado' => 'cobrado',
                    'comprobante_id' => $comprobanteId,
                    'updated_at' => now(),
                ]);
            }

            // 5. Registrar movimiento de ingreso en caja_movimiento
            DB::table('caja_movimiento')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $caja->id,
                'local_id' => $localId,
                'tipo' => 'ingreso_venta',
                'monto' => $totalCobro,
                'metodo_pago' => $validated['medio_pago'],
                'comprobante_id' => $comprobanteId,
                'descripcion' => strtoupper($validated['tipo_comprobante']) . " {$serie}-{$correlativo}",
                'created_at' => now(),
            ]);

            // 6. Persistir la solicitud de documento en la misma transaccion
            // financiera. El scheduler la enviara al worker de Redis.
            DB::table('outbox_event')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $user->empresa_id,
                'local_id' => $localId,
                'agregado_tipo' => 'comprobante',
                'agregado_id' => $comprobanteId,
                'tipo_evento' => 'comprobante.digital.solicitado',
                'payload' => json_encode([
                    'comprobante_id' => $comprobanteId,
                    'creado_por' => $user->id,
                ]),
                'estado' => 'pendiente',
                'disponible_desde' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $outboxEventId = DB::table('outbox_event')
                ->where('agregado_id', $comprobanteId)
                ->where('tipo_evento', 'comprobante.digital.solicitado')
                ->value('id');

            // Intenta iniciar la generacion al confirmar la transaccion. El
            // scheduler conserva la recuperacion si Redis o el worker caen.
            DB::afterCommit(fn () => GenerarComprobanteDigitalJob::dispatch($outboxEventId));

            // 7. Verificar si el pedido madre queda saldado al 100%
            $tieneSubcuentas = DB::table('pedido_subcuenta')->where('pedido_id', $pedido->id)->where('estado', '!=', 'anulado')->exists();
            $pedidoCerrado = $tieneSubcuentas
                ? ! DB::table('pedido_subcuenta')->where('pedido_id', $pedido->id)->where('estado', 'pendiente')->exists()
                : ! DB::table('pedido_item')->where('pedido_id', $pedido->id)->where('estado', '!=', 'anulado')->where('estado_pago', 'pendiente')->exists();

            if ($pedidoCerrado) {
                DB::table('pedido')->where('id', $pedido->id)->update([
                    'estado' => 'cobrado',
                    'updated_at' => now(),
                ]);

                DB::table('mesa')->where('id', $pedido->mesa_id)->update([
                    'estado' => 'activa',
                    'updated_at' => now(),
                ]);
            }

            $quedanPendientes = ! $pedidoCerrado;
            $subcuentasPendientes = $tieneSubcuentas
                ? DB::table('pedido_subcuenta')
                    ->where('pedido_id', $pedido->id)
                    ->where('estado', 'pendiente')
                    ->count()
                : ($quedanPendientes ? 1 : 0);

            return ApiResponse::ok([
                'comprobante_id' => $comprobanteId,
                'tipo_comprobante' => $validated['tipo_comprobante'],
                'serie' => $serie,
                'correlativo' => $correlativo,
                'serie_numero' => $serie . '-' . str_pad((string) $correlativo, 8, '0', STR_PAD_LEFT),
                'subtotal_consumo' => $totalConsumo,
                'porcentaje_recargo' => $porcentajeRecargo,
                'monto_recargo' => $montoRecargo,
                'total' => $totalCobro,
                'total_cobrado' => $totalCobro,
                'base_imponible' => $baseImponible,
                'igv' => $igv,
                'monto_recibido' => $montoRecibido,
                'vuelto' => $vuelto,
                'cliente_nombre' => $nombreCliente,
                'cliente_documento' => $documentoCliente !== '' ? $documentoCliente : null,
                'telefono_registrado' => $validated['telefono_envio'] ?? null,
                'email_registrado' => $validated['email_envio'] ?? null,
                'token_digital' => $tokenQr,
                'mesa_id' => $pedido->mesa_id,
                'mesa_numero' => (string) DB::table('mesa')->where('id', $pedido->mesa_id)->value('numero'),
                'pedido_cerrado' => ! $quedanPendientes,
                'mesa_liberada' => ! $quedanPendientes,
                'subcuenta_id' => $subcuentaId,
                'subcuentas_pendientes' => $subcuentasPendientes,
                'emitido_at' => now()->toIso8601String(),
                'documento_digital' => [
                    'estado' => 'generando',
                    'mensaje' => 'El PDF se está generando y estará disponible mediante el token QR.',
                ],
                'mensaje' => "Comprobante {$serie}-{$correlativo} emitido exitosamente.",
            ]);
        });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error al emitir cobro fiscal: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'pedido_id' => $validated['pedido_id'] ?? null,
            ]);

            return ApiResponse::error(
                'ERR_COBRO_FALLIDO',
                'No se pudo emitir el comprobante: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * CU-CAJA-03 / CU-MOZO-08: Búsqueda de cliente fiscal por DNI o RUC.
     * Consulta primero la tabla 'cliente' de la BD local y si no existe realiza
     * la consulta externa / simulación con validación de reglas SUNAT/RENIEC.
     */
    public function buscarCliente(Request $request): JsonResponse
    {
        $tipo = strtoupper(trim((string) ($request->query('tipo') ?? $request->query('tipo_documento', 'DNI'))));
        $documento = trim((string) ($request->query('documento') ?? $request->query('numero_documento', '')));

        if (! in_array($tipo, ['DNI', 'RUC'])) {
            return ApiResponse::error('TIPO_INVALIDO', 'El tipo de documento debe ser DNI o RUC.', 422);
        }

        if ($tipo === 'DNI') {
            if (! preg_match('/^\d{8}$/', $documento)) {
                return ApiResponse::error('DNI_INVALIDO', 'El DNI debe contener exactamente 8 dígitos numéricos.', 422);
            }
        } else {
            if (! preg_match('/^(10|15|17|20)\d{9}$/', $documento)) {
                return ApiResponse::error('RUC_INVALIDO', 'El RUC debe tener 11 dígitos y comenzar con 10, 15, 17 o 20.', 422);
            }
        }

        $user = $request->user();
        $empresaId = $user->empresa_id;

        // 1. Consulta en Base de Datos Local
        $cliente = DB::table('cliente')
            ->where('empresa_id', $empresaId)
            ->where('tipo_documento', $tipo)
            ->where('numero_documento', $documento)
            ->first();

        if ($cliente) {
            $detalle = is_string($cliente->detalle)
                ? json_decode($cliente->detalle, true)
                : (array) ($cliente->detalle ?? []);

            return ApiResponse::ok([
                'tipo_documento' => $cliente->tipo_documento,
                'numero_documento' => $cliente->numero_documento,
                'nombre_identificativo' => $cliente->nombre_identificativo,
                'direccion' => $detalle['direccion'] ?? 'LIMA, PERÚ',
                'telefono' => $cliente->telefono ?? '',
                'email' => $cliente->email ?? '',
                'existe_en_bd' => true,
                'origen' => 'bd_local',
            ]);
        }

        // 2. Consulta de Padrón Externo (RENIEC / SUNAT)
        if ($tipo === 'DNI') {
            $nombresDni = [
                '72819201' => 'CARLOS MENDOZA QUISPE',
                '45678901' => 'MARÍA TORRES',
                '10293847' => 'JUAN PÉREZ GARCÍA',
                '48192039' => 'ANA MARÍA CHÁVEZ ROJAS',
            ];
            $nombre = $nombresDni[$documento] ?? ('CIUDADANO DNI ' . substr($documento, -4));

            return ApiResponse::ok([
                'tipo_documento' => 'DNI',
                'numero_documento' => $documento,
                'nombre_identificativo' => $nombre,
                'direccion' => '',
                'telefono' => '',
                'email' => '',
                'existe_en_bd' => false,
                'origen' => 'api_peru',
            ]);
        } else {
            $razonesRuc = [
                '20601234567' => [
                    'nombre' => 'INVERSIONES GASTRONÓMICAS S.A.C.',
                    'direccion' => 'AV. LARCO 1045, MIRAFLORES, LIMA',
                ],
                '20100070970' => [
                    'nombre' => 'SUPERMERCADOS PERUANOS S.A.',
                    'direccion' => 'CALLE MORELLI 181, SAN BORJA, LIMA',
                ],
                '20603849201' => [
                    'nombre' => 'RESTAURANT CLOUD PERÚ S.A.C.',
                    'direccion' => 'AV. JAVIER PRADO ESTE 4200, SANTIAGO DE SURCO, LIMA',
                ],
            ];

            $datosRuc = $razonesRuc[$documento] ?? [
                'nombre' => 'EMPRESA CONSULTORA DEMO ' . substr($documento, -4) . ' S.A.C.',
                'direccion' => 'CALLE LOS NEGOCIOS ' . substr($documento, -3) . ', SAN ISIDRO, LIMA',
            ];

            return ApiResponse::ok([
                'tipo_documento' => 'RUC',
                'numero_documento' => $documento,
                'nombre_identificativo' => $datosRuc['nombre'],
                'direccion' => $datosRuc['direccion'],
                'telefono' => '',
                'email' => '',
                'existe_en_bd' => false,
                'origen' => 'api_peru',
            ]);
        }
    }

    /**
     * CU-CAJA-04: Listado de comprobantes y notas de crédito del turno activo.
     */
    public function getComprobantesTurno(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $caja = DB::table('caja')
            ->where('local_id', $localId)
            ->where('estado', 'abierta')
            ->first();

        if (! $caja) {
            return ApiResponse::error('ERR_CAJA_CERRADA', 'No existe un turno de caja abierto en esta sede.', 409);
        }

        $estado = $request->query('estado', 'todos');
        $tipo = $request->query('tipo', 'todos');
        $q = trim((string) $request->query('q', ''));

        $query = DB::table('comprobante as c')
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->leftJoin('pedido_subcuenta as ps', 'ps.id', '=', 'c.subcuenta_id')
            ->leftJoin('comprobante as nc', function ($join) {
                $join->on('nc.comprobante_modificado_id', '=', 'c.id')
                    ->where('nc.tipo', '=', 'nota_credito');
            })
            ->leftJoin('comprobante as c_mod', 'c_mod.id', '=', 'c.comprobante_modificado_id')
            ->where('c.caja_id', $caja->id)
            ->select([
                'c.*',
                'm.id as mesa_id',
                'm.numero as mesa_numero',
                'p.numero_comanda',
                'ps.numero_subcuenta',
                'nc.id as nc_id',
                'nc.serie as nc_serie',
                'nc.correlativo as nc_correlativo',
                'nc.motivo_codigo_sunat as nc_motivo_codigo_sunat',
                'nc.sustento_motivo as nc_sustento_motivo',
                'nc.token_qr as nc_token_qr',
                'c_mod.serie as mod_serie',
                'c_mod.correlativo as mod_correlativo',
            ]);

        if ($estado === 'vigente') {
            $query->where('c.estado', 'emitido')->where('c.tipo', '!=', 'nota_credito');
        } elseif ($estado === 'anulado') {
            $query->where('c.estado', 'anulado');
        }

        if ($tipo && $tipo !== 'todos') {
            $query->where('c.tipo', $tipo);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('c.nombre_cliente', 'ILIKE', "%{$q}%")
                    ->orWhere('c.documento_cliente', 'ILIKE', "%{$q}%")
                    ->orWhere('c.serie', 'ILIKE', "%{$q}%")
                    ->orWhere(DB::raw("c.serie || '-' || LPAD(c.correlativo::text, 8, '0')"), 'ILIKE', "%{$q}%")
                    ->orWhere(DB::raw("c.correlativo::text"), 'ILIKE', "%{$q}%");
            });
        }

        $comprobantes = $query->orderByDesc('c.created_at')->get()->map(function ($c) {
            $serieNumero = $c->serie . '-' . str_pad((string) $c->correlativo, 8, '0', STR_PAD_LEFT);
            $docModificado = $c->mod_serie
                ? $c->mod_serie . '-' . str_pad((string) $c->mod_correlativo, 8, '0', STR_PAD_LEFT)
                : null;
            $ncSerieNumero = $c->nc_serie
                ? $c->nc_serie . '-' . str_pad((string) $c->nc_correlativo, 8, '0', STR_PAD_LEFT)
                : null;

            return [
                'id' => $c->id,
                'tipo_comprobante' => $c->tipo,
                'serie' => $c->serie,
                'correlativo' => (int) $c->correlativo,
                'serie_numero' => $serieNumero,
                'hora' => date('H:i', strtotime($c->created_at)),
                'fecha_emision' => Carbon::parse($c->created_at)->toIso8601String(),
                'mesa_id' => $c->mesa_id,
                'mesa_numero' => $c->mesa_numero ?? 'Barra',
                'subcuenta_id' => $c->subcuenta_id,
                'subcuenta_numero' => $c->numero_subcuenta ? (int) $c->numero_subcuenta : null,
                'comanda_numero' => (int) ($c->numero_comanda ?? 0),
                'cliente_nombre' => $c->nombre_cliente,
                'cliente_documento' => $c->documento_cliente,
                'medio_pago' => $c->medio_pago,
                'total' => (float) $c->total,
                'base_imponible' => (float) $c->base_imponible,
                'igv' => (float) $c->igv,
                'estado' => $c->estado,
                'token_digital' => (string) $c->token_qr,
                'url_publica_qr' => url("/c/{$c->token_qr}"),
                'telefono_envio' => $c->telefono_envio,
                'email_envio' => $c->email_envio,
                'nota_credito_id' => $c->nc_id,
                'nota_credito_serie_numero' => $ncSerieNumero,
                'nota_credito_token' => $c->nc_token_qr ? (string) $c->nc_token_qr : null,
                'motivo_codigo_sunat' => $c->nc_motivo_codigo_sunat,
                'sustento_motivo' => $c->nc_sustento_motivo,
                'comprobante_modificado_id' => $c->comprobante_modificado_id,
                'documento_modificado' => $docModificado,
            ];
        });

        return ApiResponse::ok($comprobantes);
    }

    /**
     * CU-CAJA-04: Preparar anulación de comprobante y calcular restitución asistida.
     */
    public function prepararAnulacionComprobante(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $caja = DB::table('caja')
            ->where('local_id', $localId)
            ->where('estado', 'abierta')
            ->first();

        if (! $caja) {
            return ApiResponse::error('ERR_CAJA_CERRADA', 'No existe un turno de caja abierto en esta sede.', 409);
        }

        $comp = DB::table('comprobante as c')
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->leftJoin('pedido_subcuenta as ps', 'ps.id', '=', 'c.subcuenta_id')
            ->where('c.id', $id)
            ->where('c.caja_id', $caja->id)
            ->select([
                'c.*',
                'm.numero as mesa_numero',
                'p.numero_comanda',
                'ps.numero_subcuenta',
            ])
            ->first();

        if (! $comp) {
            return ApiResponse::error('COMPROBANTE_NO_ENCONTRADO', 'Comprobante no encontrado en el turno activo.', 404);
        }

        if ($comp->estado === 'anulado') {
            return ApiResponse::error('COMPROBANTE_YA_ANULADO', 'El comprobante ya fue anulado previamente mediante una Nota de Crédito.', 409);
        }

        if ($comp->tipo === 'nota_credito') {
            return ApiResponse::error('OPERACION_INVALIDA', 'No se puede emitir una nota de crédito sobre otra nota de crédito.', 422);
        }

        $serieSugerida = match ($comp->tipo) {
            'factura' => 'FC01',
            'nota_venta' => 'NVC01',
            default => 'BC01',
        };

        $movimientosEfectivo = (float) (DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('metodo_pago', 'efectivo')
            ->where('tipo', '!=', 'apertura')
            ->sum('monto') ?? 0.00);

        $efectivoGavetaActual = round((float) $caja->monto_apertura + $movimientosEfectivo, 2);
        $efectivoGavetaProyectado = $comp->medio_pago === 'efectivo'
            ? round(max(0, $efectivoGavetaActual - (float) $comp->total), 2)
            : $efectivoGavetaActual;

        $items = DB::table('comprobante_item as ci')
            ->leftJoin('pedido_item as pi', 'pi.id', '=', 'ci.pedido_item_id')
            ->join('producto as pr', 'pr.id', '=', 'ci.producto_id')
            ->where('ci.comprobante_id', $comp->id)
            ->select([
                'ci.id as comprobante_item_id',
                'ci.pedido_item_id',
                'ci.descripcion',
                'ci.cantidad',
                'ci.precio_unitario',
                'ci.subtotal',
                'pr.requiere_preparacion',
                'pi.stock_descontado',
            ])
            ->get()
            ->map(function ($it) {
                $stockDescontado = (bool) ($it->stock_descontado ?? false);
                $requierePrep = (bool) $it->requiere_preparacion;

                return [
                    'id' => (string) ($it->pedido_item_id ?? $it->comprobante_item_id),
                    'nombre' => $it->descripcion,
                    'cantidad' => (int) $it->cantidad,
                    'precio_unitario' => (float) $it->precio_unitario,
                    'subtotal' => (float) $it->subtotal,
                    'requiere_preparacion' => $requierePrep,
                    'es_sellado_elegible' => (! $requierePrep && $stockDescontado),
                    'stock_descontado' => $stockDescontado,
                ];
            });

        return ApiResponse::ok([
            'comprobante_id' => $comp->id,
            'tipo_comprobante_original' => $comp->tipo,
            'serie_original' => $comp->serie,
            'correlativo_original' => (int) $comp->correlativo,
            'serie_numero_original' => $comp->serie . '-' . str_pad((string) $comp->correlativo, 8, '0', STR_PAD_LEFT),
            'mesa_numero' => $comp->mesa_numero ?? 'Barra',
            'comanda_numero' => (int) ($comp->numero_comanda ?? 0),
            'subcuenta_id' => $comp->subcuenta_id,
            'subcuenta_numero' => $comp->numero_subcuenta ? (int) $comp->numero_subcuenta : null,
            'cliente_nombre' => $comp->nombre_cliente,
            'cliente_numero_doc' => $comp->documento_cliente,
            'medio_pago_codigo' => $comp->medio_pago,
            'total_original' => (float) $comp->total,
            'base_imponible' => (float) $comp->base_imponible,
            'igv' => (float) $comp->igv,
            'serie_nota_credito_sugerida' => $serieSugerida,
            'efectivo_gaveta_actual' => $efectivoGavetaActual,
            'efectivo_gaveta_proyectado' => $efectivoGavetaProyectado,
            'telefono_envio' => $comp->telefono_envio,
            'email_envio' => $comp->email_envio,
            'cliente_encontrado_en_bd' => ! empty($comp->documento_cliente) && DB::table('cliente')->where('numero_documento', $comp->documento_cliente)->exists(),
            'items' => $items,
        ]);
    }

    /**
     * CU-CAJA-04: Emitir Nota de Crédito Electrónica con Restitución Asistida de Stock.
     */
    public function emitirNotaCredito(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'motivo_codigo_sunat' => ['required', 'string', 'in:01,02,06'],
            'sustento_motivo' => ['required', 'string', 'min:5', 'max:500'],
            'devolucion_metodo' => ['required', 'string', 'in:efectivo,extorno_tarjeta,transferencia'],
            'referencia_extorno' => ['nullable', 'string', 'max:100'],
            'telefono_envio' => ['nullable', 'string', 'max:20'],
            'email_envio' => ['nullable', 'email', 'max:100'],
            'items_reingresar_stock' => ['nullable', 'array'],
            'items_reingresar_stock.*' => ['uuid'],
        ]);

        return DB::transaction(function () use ($validated, $user, $localId, $id) {
            $caja = DB::table('caja')
                ->where('local_id', $localId)
                ->where('estado', 'abierta')
                ->lockForUpdate()
                ->first();

            if (! $caja) {
                return ApiResponse::error('ERR_CAJA_CERRADA', 'No existe un turno de caja abierto en esta sede.', 409);
            }

            $comp = DB::table('comprobante')
                ->where('id', $id)
                ->where('caja_id', $caja->id)
                ->lockForUpdate()
                ->first();

            if (! $comp) {
                return ApiResponse::error('COMPROBANTE_NO_ENCONTRADO', 'Comprobante no encontrado en el turno activo.', 404);
            }

            if ($comp->estado === 'anulado') {
                return ApiResponse::error('COMPROBANTE_YA_ANULADO', 'El comprobante ya fue anulado previamente.', 409);
            }

            if ($comp->tipo === 'nota_credito') {
                return ApiResponse::error('OPERACION_INVALIDA', 'No se puede emitir una nota de crédito sobre otra nota de crédito.', 422);
            }

            $serieNC = match ($comp->tipo) {
                'factura' => 'FC01',
                'nota_venta' => 'NVC01',
                default => 'BC01',
            };

            // Asegurar que la serie exista para el local
            DB::table('comprobante_serie')->updateOrInsert(
                [
                    'local_id' => $localId,
                    'tipo_comprobante' => 'nota_credito',
                    'serie' => $serieNC,
                ],
                [
                    'activo' => true,
                ]
            );

            $siguiente = DB::selectOne(
                'SELECT fn_obtener_siguiente_correlativo(CAST(? AS uuid), ?, ?) AS correlativo',
                [$localId, 'nota_credito', $serieNC]
            );
            $correlativoNC = (int) $siguiente->correlativo;

            $ncId = (string) Str::uuid();
            $tokenQr = (string) Str::uuid();

            // 1. Insertar Nota de Crédito en comprobante
            DB::table('comprobante')->insert([
                'id' => $ncId,
                'pedido_id' => $comp->pedido_id,
                'subcuenta_id' => $comp->subcuenta_id,
                'caja_id' => $caja->id,
                'cliente_id' => $comp->cliente_id,
                'tipo' => 'nota_credito',
                'serie' => $serieNC,
                'correlativo' => $correlativoNC,
                'documento_cliente' => $comp->documento_cliente,
                'nombre_cliente' => $comp->nombre_cliente,
                'telefono_envio' => $validated['telefono_envio'] ?? $comp->telefono_envio,
                'email_envio' => $validated['email_envio'] ?? $comp->email_envio,
                'metodo_pago_id' => $comp->metodo_pago_id,
                'medio_pago' => $comp->medio_pago,
                'subtotal_consumo' => -((float) $comp->subtotal_consumo),
                'descuento' => -((float) $comp->descuento),
                'porcentaje_recargo' => (float) $comp->porcentaje_recargo,
                'monto_recargo' => -((float) $comp->monto_recargo),
                'base_imponible' => -((float) $comp->base_imponible),
                'igv' => -((float) $comp->igv),
                'total' => -((float) $comp->total),
                'monto_recibido' => null,
                'vuelto' => null,
                'estado' => 'emitido',
                'token_qr' => $tokenQr,
                'comprobante_modificado_id' => $comp->id,
                'motivo_codigo_sunat' => $validated['motivo_codigo_sunat'],
                'sustento_motivo' => $validated['sustento_motivo'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Replicar ítems en comprobante_item para representación tributaria / PDF
            $originalItems = DB::table('comprobante_item')->where('comprobante_id', $comp->id)->get();
            foreach ($originalItems as $orig) {
                DB::table('comprobante_item')->insert([
                    'id' => (string) Str::uuid(),
                    'comprobante_id' => $ncId,
                    'pedido_item_id' => $orig->pedido_item_id,
                    'producto_id' => $orig->producto_id,
                    'descripcion' => $orig->descripcion,
                    'cantidad' => $orig->cantidad,
                    'precio_unitario' => $orig->precio_unitario,
                    'subtotal' => $orig->subtotal,
                    'base_imponible' => $orig->base_imponible,
                    'igv' => $orig->igv,
                    'created_at' => now(),
                ]);
            }

            // 3. Marcar comprobante original como anulado
            DB::table('comprobante')
                ->where('id', $comp->id)
                ->update([
                    'estado' => 'anulado',
                    'updated_at' => now(),
                ]);

            // 4. Registrar egreso en gaveta de caja si corresponde a efectivo
            if ($validated['devolucion_metodo'] === 'efectivo' || $comp->medio_pago === 'efectivo') {
                DB::table('caja_movimiento')->insert([
                    'id' => (string) Str::uuid(),
                    'caja_id' => $caja->id,
                    'local_id' => $localId,
                    'tipo' => 'egreso_devolucion',
                    'monto' => -abs((float) $comp->total),
                    'metodo_pago' => 'efectivo',
                    'comprobante_id' => $ncId,
                    'descripcion' => "DEVOLUCION NC {$serieNC}-" . str_pad((string) $correlativoNC, 8, '0', STR_PAD_LEFT) . " (Ref: {$comp->serie}-" . str_pad((string) $comp->correlativo, 8, '0', STR_PAD_LEFT) . ")",
                    'created_at' => now(),
                ]);
            }

            // 5. Restitución asistida de stock para ítems sellados seleccionados
            $itemsReingresar = $validated['items_reingresar_stock'] ?? [];
            if (! empty($itemsReingresar)) {
                foreach ($itemsReingresar as $itemId) {
                    $pedidoItemId = DB::table('comprobante_item')
                        ->where('comprobante_id', $comp->id)
                        ->where(function ($q) use ($itemId) {
                            $q->where('pedido_item_id', $itemId)
                                ->orWhere('id', $itemId);
                        })
                        ->value('pedido_item_id') ?? $itemId;

                    if ($pedidoItemId) {
                        DB::selectOne(
                            'SELECT fn_inventario_reingresar_item_sellado(CAST(? AS uuid), CAST(? AS uuid), ?) AS res',
                            [$pedidoItemId, $user->id, "Restitución por NC {$serieNC}-" . str_pad((string) $correlativoNC, 8, '0', STR_PAD_LEFT)]
                        );
                    }
                }
            }

            // 6. Actualizar estado de Subcuenta o Pedido
            if ($comp->subcuenta_id) {
                DB::table('pedido_subcuenta')->where('id', $comp->subcuenta_id)->update([
                    'estado' => 'anulado',
                    'updated_at' => now(),
                ]);
            }

            if ($comp->pedido_id) {
                $tieneOtrosComprobantesVigentes = DB::table('comprobante')
                    ->where('pedido_id', $comp->pedido_id)
                    ->where('tipo', '!=', 'nota_credito')
                    ->where('estado', 'emitido')
                    ->exists();

                if (! $tieneOtrosComprobantesVigentes) {
                    DB::table('pedido')->where('id', $comp->pedido_id)->update([
                        'estado' => 'anulado',
                        'updated_at' => now(),
                    ]);
                }
            }

            // 7. Evento Outbox para generación asíncrona de PDF / XML
            DB::table('outbox_event')->insert([
                'id' => (string) Str::uuid(),
                'empresa_id' => $user->empresa_id,
                'local_id' => $localId,
                'agregado_tipo' => 'comprobante',
                'agregado_id' => $ncId,
                'tipo_evento' => 'comprobante.digital.solicitado',
                'payload' => json_encode([
                    'comprobante_id' => $ncId,
                    'creado_por' => $user->id,
                ]),
                'estado' => 'pendiente',
                'disponible_desde' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $outboxEventId = DB::table('outbox_event')
                ->where('agregado_id', $ncId)
                ->where('tipo_evento', 'comprobante.digital.solicitado')
                ->value('id');

            DB::afterCommit(fn () => GenerarComprobanteDigitalJob::dispatch($outboxEventId));

            // 8. Calcular nuevo efectivo en gaveta
            $movimientosEfectivo = (float) (DB::table('caja_movimiento')
                ->where('caja_id', $caja->id)
                ->where('metodo_pago', 'efectivo')
                ->where('tipo', '!=', 'apertura')
                ->sum('monto') ?? 0.00);

            $efectivoGavetaNuevo = round((float) $caja->monto_apertura + $movimientosEfectivo, 2);

            $pedido = $comp->pedido_id ? DB::table('pedido')->where('id', $comp->pedido_id)->first() : null;
            $mesa = $pedido ? DB::table('mesa')->where('id', $pedido->mesa_id)->first() : null;
            $subcuentaNumero = $comp->subcuenta_id ? DB::table('pedido_subcuenta')->where('id', $comp->subcuenta_id)->value('numero_subcuenta') : null;

            return ApiResponse::ok([
                'nota_credito_id' => $ncId,
                'tipo_comprobante' => 'nota_credito',
                'serie' => $serieNC,
                'correlativo' => $correlativoNC,
                'serie_numero' => $serieNC . '-' . str_pad((string) $correlativoNC, 8, '0', STR_PAD_LEFT),
                'documento_modificado' => $comp->serie . '-' . str_pad((string) $comp->correlativo, 8, '0', STR_PAD_LEFT),
                'comprobante_modificado_id' => $comp->id,
                'motivo_codigo_sunat' => $validated['motivo_codigo_sunat'],
                'sustento_motivo' => $validated['sustento_motivo'],
                'importe_rectificado' => -((float) $comp->total),
                'efectivo_gaveta_nuevo' => $efectivoGavetaNuevo,
                'token_digital' => $tokenQr,
                'url_publica_qr' => url("/c/{$tokenQr}"),
                'mesa_numero' => $mesa?->numero ?? 'Barra',
                'subcuenta_numero' => $subcuentaNumero ? (int) $subcuentaNumero : null,
                'telefono_registrado' => $validated['telefono_envio'] ?? $comp->telefono_envio,
                'email_registrado' => $validated['email_envio'] ?? $comp->email_envio,
                'emitido_at' => now()->toIso8601String(),
            ]);
        });
    }

    /**
     * CU-CAJA-04: Actualización de datos de contacto (WhatsApp / Correo) de un comprobante.
     */
    public function actualizarContactoComprobante(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'telefono_envio' => ['nullable', 'string', 'max:20'],
            'email_envio' => ['nullable', 'email', 'max:100'],
        ]);

        $comp = DB::table('comprobante as c')
            ->join('caja as k', 'k.id', '=', 'c.caja_id')
            ->where('c.id', $id)
            ->where('k.local_id', $localId)
            ->select('c.id')
            ->first();

        if (! $comp) {
            return ApiResponse::error('COMPROBANTE_NO_ENCONTRADO', 'El comprobante no pertenece a esta sede.', 404);
        }

        $updateData = ['updated_at' => now()];
        if ($request->has('telefono_envio')) {
            $updateData['telefono_envio'] = $validated['telefono_envio'];
        }
        if ($request->has('email_envio')) {
            $updateData['email_envio'] = $validated['email_envio'];
        }

        DB::table('comprobante')->where('id', $id)->update($updateData);

        return ApiResponse::ok([
            'id' => $id,
            'telefono_envio' => $validated['telefono_envio'] ?? null,
            'email_envio' => $validated['email_envio'] ?? null,
        ]);
    }


    /**
     * CU-CAJA-05: Balance operativo previo al arqueo de caja (Pre-Arqueo).
     */
    public function getBalancePreArqueo(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $caja = DB::table('caja as c')
            ->join('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.local_id', $localId)
            ->where('c.estado', 'abierta')
            ->select([
                'c.id',
                'c.local_id',
                'c.cajero_id',
                'u.nombre as cajero_nombre',
                'c.correlativo',
                'c.monto_apertura',
                'c.notas_apertura',
                'c.fecha_apertura',
            ])
            ->first();

        if (! $caja) {
            return ApiResponse::error('ERR_CAJA_NO_ABIERTA', 'No existe un turno de caja abierto en esta sede.', 404);
        }

        $local = DB::table('local as l')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->where('l.id', $localId)
            ->select(['l.nombre as local_nombre', 'e.ruc as empresa_ruc'])
            ->first();
        $sedeNombre = $local ? $local->local_nombre : 'Áurea';

        $comprobantes = DB::table('comprobante')
            ->where('caja_id', $caja->id)
            ->where('estado', 'emitido')
            ->get();

        $ingresosEfectivo = (float) $comprobantes
            ->where('medio_pago', 'efectivo')
            ->where('tipo', '!=', 'nota_credito')
            ->sum('total');

        $tarjetasPosTotal = (float) $comprobantes
            ->where('medio_pago', 'tarjeta')
            ->where('tipo', '!=', 'nota_credito')
            ->sum('total');

        $tarjetasOperaciones = (int) $comprobantes
            ->where('medio_pago', 'tarjeta')
            ->where('tipo', '!=', 'nota_credito')
            ->count();

        $billeterasTotal = (float) $comprobantes
            ->where('medio_pago', 'billetera_digital')
            ->where('tipo', '!=', 'nota_credito')
            ->sum('total');

        $otrosCobrosTotal = (float) $comprobantes
            ->whereNotIn('medio_pago', ['efectivo', 'tarjeta', 'billetera_digital'])
            ->where('tipo', '!=', 'nota_credito')
            ->sum('total');

        $egresosDevolucionNC = (float) (DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('tipo', 'egreso_devolucion')
            ->where('metodo_pago', 'efectivo')
            ->sum('monto') ?? 0.00);

        $egresosGastosManuales = (float) (DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('tipo', 'egreso_gasto_manual')
            ->where('metodo_pago', 'efectivo')
            ->sum('monto') ?? 0.00);

        $montoApertura = (float) $caja->monto_apertura;
        $efectivoEsperado = round($montoApertura + $ingresosEfectivo - $egresosDevolucionNC - $egresosGastosManuales, 2);

        $totalFacturadoNeto = (float) ($comprobantes->where('tipo', '!=', 'nota_credito')->sum('total') - $comprobantes->where('tipo', 'nota_credito')->sum('total'));
        $baseImponible = (float) $comprobantes->where('tipo', '!=', 'nota_credito')->sum('base_imponible');
        $igv18 = (float) $comprobantes->where('tipo', '!=', 'nota_credito')->sum('igv');
        $totalComprobantes = (int) $comprobantes->where('tipo', '!=', 'nota_credito')->count();

        $mesasActivasPendientes = (int) DB::table('pedido as p')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->count();

        $salonAlDia = ($mesasActivasPendientes === 0);

        return ApiResponse::ok([
            'caja_id' => $caja->id,
            'turno_correlativo' => (int) $caja->correlativo,
            'cajero_nombre' => $caja->cajero_nombre,
            'cajero_rol' => 'Cajero de Turno',
            'fecha_apertura' => Carbon::parse($caja->fecha_apertura)->toIso8601String(),
            'monto_apertura' => $montoApertura,
            'ingresos_efectivo' => $ingresosEfectivo,
            'egresos_devolucion_nc' => $egresosDevolucionNC,
            'efectivo_esperado' => $efectivoEsperado,
            'tarjetas_pos_total' => $tarjetasPosTotal,
            'tarjetas_operaciones' => $tarjetasOperaciones,
            'billeteras_total' => $billeterasTotal,
            'otros_cobros_total' => $otrosCobrosTotal,
            'total_facturado_neto' => round($totalFacturadoNeto, 2),
            'base_imponible' => round($baseImponible, 2),
            'igv_18' => round($igv18, 2),
            'total_comprobantes' => $totalComprobantes,
            'mesas_activas_pendientes' => $mesasActivasPendientes,
            'salon_al_dia' => $salonAlDia,
            'sede_nombre' => $sedeNombre,
        ]);
    }

    /**
     * CU-CAJA-05: Cierre formal de turno de caja y generación de Reporte Z Oficial SUNAT.
     */
    public function cerrarTurno(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'monto_real_fisico' => ['required', 'numeric', 'min:0'],
            'comentario_discrepancia' => ['nullable', 'string', 'max:1000'],
            'notas_cierre' => ['nullable', 'string', 'max:1000'],
        ]);

        $caja = DB::table('caja as c')
            ->join('usuario as u', 'u.id', '=', 'c.cajero_id')
            ->where('c.local_id', $localId)
            ->where('c.estado', 'abierta')
            ->select(['c.*', 'u.nombre as cajero_nombre'])
            ->first();

        if (! $caja) {
            return ApiResponse::error('ERR_CAJA_NO_ABIERTA', 'No existe un turno de caja abierto en esta sede para cerrar.', 409);
        }

        // Regla Poka-Yoke: no cerrar con mesas activas o con comensales
        $mesasActivasPendientes = (int) DB::table('pedido as p')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['borrador', 'enviado', 'cuenta_pedida'])
            ->count();

        if ($mesasActivasPendientes > 0) {
            return ApiResponse::error(
                'ERR_SALON_CON_MESAS_ACTIVAS',
                "No se puede cerrar caja: existen {$mesasActivasPendientes} mesas con pedidos activos pendientes de cobro en el salón.",
                409
            );
        }

        $montoRealFisico = (float) $validated['monto_real_fisico'];

        $comprobantes = DB::table('comprobante')
            ->where('caja_id', $caja->id)
            ->where('estado', 'emitido')
            ->get();

        $ingresosEfectivo = (float) $comprobantes
            ->where('medio_pago', 'efectivo')
            ->where('tipo', '!=', 'nota_credito')
            ->sum('total');

        $egresosDevolucionNC = (float) (DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('tipo', 'egreso_devolucion')
            ->where('metodo_pago', 'efectivo')
            ->sum('monto') ?? 0.00);

        $egresosGastosManuales = (float) (DB::table('caja_movimiento')
            ->where('caja_id', $caja->id)
            ->where('tipo', 'egreso_gasto_manual')
            ->where('metodo_pago', 'efectivo')
            ->sum('monto') ?? 0.00);

        $montoApertura = (float) $caja->monto_apertura;
        $efectivoEsperado = round($montoApertura + $ingresosEfectivo - $egresosDevolucionNC - $egresosGastosManuales, 2);
        $discrepancia = round($montoRealFisico - $efectivoEsperado, 2);

        $comentarioDiscrepancia = isset($validated['comentario_discrepancia']) ? trim($validated['comentario_discrepancia']) : null;

        // Validación de justificación obligatoria si hay discrepancia (mínimo 10 caracteres)
        if (abs($discrepancia) > 0.001) {
            if (empty($comentarioDiscrepancia) || mb_strlen($comentarioDiscrepancia) < 10) {
                return ApiResponse::error(
                    'ERR_DISCREPANCIA_SIN_JUSTIFICAR',
                    'Existe una diferencia entre el efectivo real y el esperado; el comentario justificativo es obligatorio (mínimo 10 caracteres).',
                    422
                );
            }
        }

        $aperturaTime = Carbon::parse($caja->fecha_apertura);
        $cierreTime = now();
        $diff = $aperturaTime->diff($cierreTime);
        $duracionStr = sprintf('%dh %02dm %02ds', $diff->h + ($diff->days * 24), $diff->i, $diff->s);

        $boletasEmitidas = (int) $comprobantes->where('tipo', 'boleta')->count();
        $facturasEmitidas = (int) $comprobantes->where('tipo', 'factura')->count();
        $notasVentaEmitidas = (int) $comprobantes->where('tipo', 'nota_venta')->count();
        $notasCreditoEmitidas = (int) DB::table('comprobante')->where('caja_id', $caja->id)->where('tipo', 'nota_credito')->count();
        $comprobantesAnulados = (int) DB::table('comprobante')->where('caja_id', $caja->id)->where('estado', 'anulado')->count();

        $tarjetasPosTotal = (float) $comprobantes->where('medio_pago', 'tarjeta')->where('tipo', '!=', 'nota_credito')->sum('total');
        $billeterasTotal = (float) $comprobantes->where('medio_pago', 'billetera_digital')->where('tipo', '!=', 'nota_credito')->sum('total');
        $otrosCobrosTotal = (float) $comprobantes->whereNotIn('medio_pago', ['efectivo', 'tarjeta', 'billetera_digital'])->where('tipo', '!=', 'nota_credito')->sum('total');

        $totalNetoFacturado = (float) ($comprobantes->where('tipo', '!=', 'nota_credito')->sum('total') - $comprobantes->where('tipo', 'nota_credito')->sum('total'));
        $baseImponible = (float) $comprobantes->where('tipo', '!=', 'nota_credito')->sum('base_imponible');
        $igv18 = (float) $comprobantes->where('tipo', '!=', 'nota_credito')->sum('igv');

        $local = DB::table('local as l')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->where('l.id', $localId)
            ->select(['l.nombre as local_nombre', 'e.ruc as empresa_ruc'])
            ->first();
        $localNombre = $local ? $local->local_nombre : 'Áurea';
        $empresaRuc = $local ? $local->empresa_ruc : '20609876543';

        $notasCierre = isset($validated['notas_cierre']) ? trim($validated['notas_cierre']) : null;

        $reporteZ = [
            'caja_id' => $caja->id,
            'turno_correlativo' => (int) $caja->correlativo,
            'local_nombre' => $localNombre,
            'empresa_ruc' => $empresaRuc,
            'cajero_nombre' => $caja->cajero_nombre ?? $user->nombre,
            'fecha_apertura' => Carbon::parse($caja->fecha_apertura)->toIso8601String(),
            'fecha_cierre' => $cierreTime->toIso8601String(),
            'duracion_turno' => $duracionStr,
            'monto_apertura' => $montoApertura,
            'efectivo_esperado' => $efectivoEsperado,
            'efectivo_real_contado' => $montoRealFisico,
            'discrepancia' => $discrepancia,
            'comentario_discrepancia' => $comentarioDiscrepancia,
            'total_ventas_efectivo' => $ingresosEfectivo,
            'total_tarjetas_pos' => $tarjetasPosTotal,
            'total_billeteras_digital' => $billeterasTotal,
            'otros_medios_total' => $otrosCobrosTotal,
            'total_neto_facturado' => round($totalNetoFacturado, 2),
            'base_imponible_gravada' => round($baseImponible, 2),
            'igv_18' => round($igv18, 2),
            'boletas_emitidas' => $boletasEmitidas,
            'facturas_emitidas' => $facturasEmitidas,
            'notas_venta_emitidas' => $notasVentaEmitidas,
            'notas_credito_emitidas' => $notasCreditoEmitidas,
            'comprobantes_anulados' => $comprobantesAnulados,
            'notas_cierre' => $notasCierre,
            'url_descarga_pdf' => "/api/v1/caja/turnos/{$caja->id}/reporte-z/pdf",
        ];

        return DB::transaction(function () use ($caja, $localId, $user, $montoRealFisico, $efectivoEsperado, $discrepancia, $comentarioDiscrepancia, $notasCierre, $reporteZ) {
            DB::table('caja')->where('id', $caja->id)->update([
                'estado' => 'cerrada',
                'fecha_cierre' => now(),
                'monto_esperado' => $efectivoEsperado,
                'monto_real' => $montoRealFisico,
                'discrepancia' => $discrepancia,
                'comentario_discrepancia' => $comentarioDiscrepancia,
                'notas_cierre' => $notasCierre,
                'updated_at' => now(),
            ]);

            DB::table('caja_movimiento')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $caja->id,
                'local_id' => $localId,
                'tipo' => 'cierre',
                'monto' => $montoRealFisico,
                'metodo_pago' => 'efectivo',
                'descripcion' => 'Cierre formal de turno #' . str_pad((string) $caja->correlativo, 3, '0', STR_PAD_LEFT),
                'created_at' => now(),
            ]);

            DB::table('auditoria_caja_cierre')->insert([
                'id' => (string) Str::uuid(),
                'caja_id' => $caja->id,
                'local_id' => $localId,
                'cajero_id' => $user->id,
                'reporte_z_json' => json_encode($reporteZ),
                'created_at' => now(),
            ]);

            return ApiResponse::ok($reporteZ);
        });
    }

    /**
     * CU-CAJA-05: Obtener el último Reporte Z generado en la sede.
     */
    public function getUltimoReporteZ(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $auditoria = DB::table('auditoria_caja_cierre')
            ->where('local_id', $localId)
            ->orderByDesc('created_at')
            ->first();

        if (! $auditoria) {
            return ApiResponse::ok(null);
        }

        $reporte = is_string($auditoria->reporte_z_json)
            ? json_decode($auditoria->reporte_z_json, true)
            : $auditoria->reporte_z_json;

        return ApiResponse::ok($reporte);
    }

}
