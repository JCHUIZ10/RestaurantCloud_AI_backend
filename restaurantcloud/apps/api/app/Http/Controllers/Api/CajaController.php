<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $pedido = DB::table('pedido as p')
            ->leftJoin('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.mesa_id', $mesaId)
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
                'producto_id' => $it->producto_id,
                'nombre' => $it->producto_nombre,
                'nota_cocina' => $it->nota_cocina,
                'cantidad' => (int) $it->cantidad,
                'precio_unitario' => (float) $it->precio_unitario,
                'subtotal' => $subtotal,
                'estado_cocina' => $it->estado_cocina,
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

        $subcuentas = $subcuentasRaw->map(function ($s) {
            return [
                'id' => $s->id,
                'numero_subcuenta' => (int) $s->numero_subcuenta,
                'nombre_titular' => $s->nombre_cliente,
                'titular_referencia' => $s->nombre_cliente,
                'tipo_comprobante' => $s->tipo_comprobante,
                'total_neto' => (float) $s->total,
                'estado' => $s->estado,
                'estado_pago' => $s->estado,
            ];
        });

        $minutosEsperaCuenta = null;
        $fechaCuenta = $pedido->precuenta_generada_at ?? ($pedido->pedido_estado === 'cuenta_pedida' ? ($pedido->created_at ?? null) : null);
        if ($fechaCuenta) {
            $minutosEsperaCuenta = (int) max(0, round((now()->timestamp - strtotime($fechaCuenta)) / 60));
        }

        return ApiResponse::ok([
            'mesa_id' => $mesa->id,
            'mesa_numero' => $mesa->numero,
            'mesa_estado' => $pedido->pedido_estado,
            'minutos_espera_cuenta' => $minutosEsperaCuenta,
            'es_mesa_unida' => str_contains($mesa->numero, ';'),
            'mozo_nombre' => $pedido->mozo_nombre ?? 'Mozo General',
            'comensales' => (int) $pedido->comensales,
            'numero_comanda' => (int) $pedido->numero_comanda,
            'hora_pedido' => date('H:i', strtotime($pedido->created_at)),
            'items' => $items,
            'tiene_cocina_pendiente' => $tieneCocinaPendiente,
            'alerta_cocina' => $alertaCocina,
            'promociones_disponibles' => $promociones,
            'promocion_activa_id' => null,
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
            'subcuenta_id' => ['nullable', 'uuid'],
        ]);

        return DB::transaction(function () use ($validated, $user, $localId) {
            $pedido = DB::table('pedido')->where('id', $validated['pedido_id'])->lockForUpdate()->first();

            if (! $pedido) {
                return ApiResponse::error('PEDIDO_NO_ENCONTRADO', 'El pedido no existe.', 404);
            }

            if ($pedido->estado === 'cobrado') {
                return ApiResponse::error('PEDIDO_YA_COBRADO', 'El pedido ya fue cobrado al 100%.', 409);
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
                $subcuenta = DB::table('pedido_subcuenta')->where('id', $subcuentaId)->first();
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

            $montoRecibido = isset($validated['monto_recibido']) ? (float) $validated['monto_recibido'] : $totalCobro;
            $vuelto = max(0, round($montoRecibido - $totalCobro, 2));

            // Serie y correlativo
            $serie = match ($validated['tipo_comprobante']) {
                'factura' => 'F001',
                'nota_venta' => 'NV01',
                default => 'B001',
            };

            $ultimoCorrelativo = (int) DB::table('comprobante')
                ->where('serie', $serie)
                ->max('correlativo');
            $correlativo = $ultimoCorrelativo + 1;

            $comprobanteId = (string) Str::uuid();

            // 1. Insertar comprobante fiscal
            DB::table('comprobante')->insert([
                'id' => $comprobanteId,
                'pedido_id' => $pedido->id,
                'subcuenta_id' => $subcuentaId,
                'caja_id' => $caja->id,
                'tipo' => $validated['tipo_comprobante'],
                'serie' => $serie,
                'correlativo' => $correlativo,
                'documento_cliente' => $validated['documento_cliente'] ?? ($subcuenta?->documento_cliente ?? null),
                'nombre_cliente' => $validated['nombre_cliente'] ?? ($subcuenta?->nombre_cliente ?? 'Cliente General'),
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
                'token_qr' => (string) Str::uuid(),
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

            // 6. Verificar si el pedido madre queda saldado al 100%
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

            return ApiResponse::ok([
                'comprobante_id' => $comprobanteId,
                'serie' => $serie,
                'correlativo' => $correlativo,
                'subtotal_consumo' => $totalConsumo,
                'porcentaje_recargo' => $porcentajeRecargo,
                'monto_recargo' => $montoRecargo,
                'total' => $totalCobro,
                'vuelto' => $vuelto,
                'pedido_cerrado' => ! $quedanPendientes,
                'mensaje' => "Comprobante {$serie}-{$correlativo} emitido exitosamente.",
            ]);
        });
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
}
