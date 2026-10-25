<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use App\Domains\Inventario\Services\StockDeduccionService;

class CocinaController extends Controller
{
    /**
     * CU-COCINA-01: Obtiene la configuración de sede para el KDS (tiempos de semáforo y sonido).
     */
    public function getConfiguracion(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $config = DB::table('configuracion_kds')->where('local_id', $localId)->first();

        if (! $config) {
            return ApiResponse::ok([
                'local_id' => $localId,
                'tiempo_optimo_verde_min' => 15,
                'tiempo_alerta_ambar_min' => 25,
                'tiempo_maximo_pase_min' => 3,
                'alerta_sonora_nueva_comanda' => true,
                'alerta_sonora_comanda_roja' => true,
                'intervalo_sonido_rojo_seg' => 60,
                'vista_predeterminada' => 'fifo',
            ]);
        }

        return ApiResponse::ok([
            'local_id' => $config->local_id,
            'tiempo_optimo_verde_min' => (int) $config->tiempo_optimo_verde_min,
            'tiempo_alerta_ambar_min' => (int) $config->tiempo_alerta_ambar_min,
            'tiempo_maximo_pase_min' => (int) $config->tiempo_maximo_pase_min,
            'alerta_sonora_nueva_comanda' => (bool) $config->alerta_sonora_nueva_comanda,
            'alerta_sonora_comanda_roja' => (bool) $config->alerta_sonora_comanda_roja,
            'intervalo_sonido_rojo_seg' => (int) $config->intervalo_sonido_rojo_seg,
            'vista_predeterminada' => $config->vista_predeterminada,
        ]);
    }

    /**
     * CU-COCINA-01: Obtener la cola FIFO de comandas activas para la pantalla KDS.
     */
    public function getComandas(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        // 1. Obtener parámetros de semáforo de la sede
        $config = DB::table('configuracion_kds')->where('local_id', $localId)->first();
        $tiempoOptimo = (int) ($config->tiempo_optimo_verde_min ?? 15);
        $tiempoAlerta = (int) ($config->tiempo_alerta_ambar_min ?? 25);

        // 2. Comandas activas en salón con pedidos no cerrados
        $pedidos = DB::table('pedido as p')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->leftJoin('piso as pi_so', 'pi_so.id', '=', 'm.piso_id')
            ->join('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->select([
                'p.id as pedido_id',
                'p.numero_comanda',
                'p.estado as pedido_estado',
                'p.comensales',
                'p.created_at',
                'm.id as mesa_id',
                'm.numero as mesa_numero',
                'pi_so.nombre as piso_nombre',
                'u.nombre as mozo_nombre',
            ])
            ->orderBy('p.created_at', 'asc')
            ->get();

        $comandas = [];

        foreach ($pedidos as $p) {
            // Verificar si el pedido fue despachado al pase completo hace menos de 30 minutos
            $despachadoKey = "kds:despachado:{$localId}:{$p->pedido_id}";
            try {
                if (Redis::get($despachadoKey)) {
                    continue; // Ya despachado, no satura la pantalla activa
                }
            } catch (\Throwable $e) {
                // Si Redis no responde, continúa con la verificación en base de datos
            }

            // Consultar ítems culinarios de cocina (requiere_preparacion = true)
            $itemsCulinarios = DB::table('pedido_item as pi')
                ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
                ->join('categoria_producto as cp', 'cp.id', '=', 'pr.categoria_id')
                ->where('pi.pedido_id', $p->pedido_id)
                ->where('pr.requiere_preparacion', true)
                ->whereIn('pi.estado', ['en_cola', 'en_preparacion', 'listo'])
                ->select([
                    'pi.id as item_id',
                    'pi.producto_id',
                    'pr.nombre as nombre_producto',
                    'pi.cantidad',
                    'pi.estado',
                    'cp.id as categoria_id',
                    'cp.nombre as categoria_nombre',
                    'pi.nota_cocina',
                    'pi.numero_ronda',
                    'pi.fecha_inicio_coccion',
                    'pi.fecha_listo_cocina',
                    'pr.descripcion as receta_resumen',
                    'pi.created_at',
                ])
                ->orderBy('pi.numero_ronda', 'asc')
                ->orderBy('pi.created_at', 'asc')
                ->get();

            if ($itemsCulinarios->isEmpty()) {
                continue;
            }

            // Conteo de bebidas de salón atendidas directamente por el mozo (requiere_preparacion = false)
            $bebidasSalonCount = (int) DB::table('pedido_item as pi')
                ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
                ->where('pi.pedido_id', $p->pedido_id)
                ->where('pr.requiere_preparacion', false)
                ->where('pi.estado', '!=', 'anulado')
                ->sum('pi.cantidad');

            $segundosTranscurridos = (int) max(0, now()->timestamp - strtotime($p->created_at));
            $minutosEspera = (int) floor($segundosTranscurridos / 60);

            // Semáforo dinámico según wireframe CU-COCINA-01
            $semaforoColor = 'verde';
            if ($minutosEspera > $tiempoAlerta) {
                $semaforoColor = 'rojo';
            } elseif ($minutosEspera > $tiempoOptimo) {
                $semaforoColor = 'ambar';
            }

            $rondaMax = (int) $itemsCulinarios->max('numero_ronda') ?: 1;
            $esMesaAgrupada = str_contains($p->mesa_numero, ';') || str_contains($p->mesa_numero, '[');

            $itemsFormateados = $itemsCulinarios->map(function ($item) {
                $deshacerHasta = null;
                if ($item->estado === 'listo' && $item->fecha_listo_cocina) {
                    $listoTs = strtotime($item->fecha_listo_cocina);
                    $diffSeg = now()->timestamp - $listoTs;
                    if ($diffSeg < 30) {
                        $deshacerHasta = ($listoTs + 30) * 1000;
                    }
                }

                return [
                    'item_id' => $item->item_id,
                    'producto_id' => $item->producto_id,
                    'nombre_producto' => $item->nombre_producto,
                    'cantidad' => (int) $item->cantidad,
                    'estado' => $item->estado,
                    'categoria_id' => $item->categoria_id,
                    'categoria_nombre' => $item->categoria_nombre,
                    'nota_cocina' => $item->nota_cocina,
                    'fecha_inicio_coccion' => $item->fecha_inicio_coccion ? Carbon::parse($item->fecha_inicio_coccion)->toIso8601String() : null,
                    'fecha_listo_cocina' => $item->fecha_listo_cocina ? Carbon::parse($item->fecha_listo_cocina)->toIso8601String() : null,
                    'receta_resumen' => $item->receta_resumen ?: $item->nombre_producto,
                    'deshacer_hasta' => $deshacerHasta,
                ];
            })->values()->all();

            $comandas[] = [
                'pedido_id' => $p->pedido_id,
                'numero_comanda' => (int) $p->numero_comanda,
                'mesa_codigo' => $p->mesa_numero,
                'es_mesa_agrupada' => $esMesaAgrupada,
                'mozo_nombre' => $p->mozo_nombre,
                'piso_nombre' => $p->piso_nombre ?: 'Salón Principal',
                'ronda_numero' => $rondaMax,
                'ronda_tipo' => $rondaMax > 1 ? 'adicional' : 'inicial',
                'comensales' => (int) $p->comensales,
                'fecha_envio' => Carbon::parse($p->created_at)->toIso8601String(),
                'minutos_espera' => $minutosEspera,
                'segundos_transcurridos' => $segundosTranscurridos,
                'semaforo_color' => $semaforoColor,
                'bebidas_salon_count' => $bebidasSalonCount,
                'items' => $itemsFormateados,
            ];
        }

        return ApiResponse::ok($comandas);
    }

    /**
     * CU-COCINA-02: Actualizar el estado de cocción de un ítem (en_preparacion, listo).
     */
    public function cambiarEstadoItem(Request $request, string $itemId): JsonResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'string', 'in:en_cola,en_preparacion,listo,entregado'],
        ]);

        $item = DB::table('pedido_item')->where('id', $itemId)->first();

        if (! $item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato solicitado no existe.', 404);
        }

        $nuevoEstado = $validated['estado'];
        $now = now()->utc();
        $updateData = [
            'estado' => $nuevoEstado,
            'updated_at' => $now,
        ];

        $deduccionStock = null;
        $alertaStock = null;

        if ($nuevoEstado === 'en_preparacion') {
            $updateData['fecha_inicio_coccion'] = $item->fecha_inicio_coccion ?: $now;
            $updateData['fecha_listo_cocina'] = null;
        } elseif ($nuevoEstado === 'listo') {
            // Cumplir con chk_cocina_tiempos_coherentes
            $inicioCoccion = $item->fecha_inicio_coccion ? Carbon::parse($item->fecha_inicio_coccion)->utc() : $now;
            $listo = $inicioCoccion->gt($now) ? $inicioCoccion : $now;
            $updateData['fecha_inicio_coccion'] = $inicioCoccion;
            $updateData['fecha_listo_cocina'] = $listo;
            // Deducción culinaria atómica de receta en bodega
            $deduccionStock = app(StockDeduccionService::class)->descontarRecetaItem($itemId, $request->user()->id);

            // Si se generaron quiebres de inventario, armar alerta para el frontend
            if (! empty($deduccionStock['insumos_descontados'])) {
                foreach ($deduccionStock['insumos_descontados'] as $insDesc) {
                    if ((float) ($insDesc['stock_nuevo'] ?? 1) <= 0) {
                        $alertaStock = [
                            'insumo_id' => $insDesc['insumo_id'] ?? null,
                            'nombre_insumo' => $insDesc['insumo_nombre'] ?? 'Insumo culinario',
                            'platos_afectados' => $deduccionStock['quiebres_generados'] ?? [],
                            'stock_actual' => (float) ($insDesc['stock_nuevo'] ?? 0),
                            'timestamp' => now()->toIso8601String(),
                        ];
                        break;
                    }
                }
            }
        } elseif ($nuevoEstado === 'en_cola') {
            $updateData['fecha_inicio_coccion'] = null;
            $updateData['fecha_listo_cocina'] = null;
        }

        DB::table('pedido_item')->where('id', $itemId)->update($updateData);

        return ApiResponse::ok([
            'item_id' => $itemId,
            'pedido_id' => $item->pedido_id,
            'estado' => $nuevoEstado,
            'fecha_inicio_coccion' => isset($updateData['fecha_inicio_coccion']) ? Carbon::parse($updateData['fecha_inicio_coccion'])->toIso8601String() : null,
            'fecha_listo_cocina' => isset($updateData['fecha_listo_cocina']) ? Carbon::parse($updateData['fecha_listo_cocina'])->toIso8601String() : null,
            'puede_deshacer' => $nuevoEstado === 'listo',
            'segundos_deshacer' => 30,
            'deduccion_stock' => $deduccionStock,
            'alerta_stock' => $alertaStock,
            'mensaje' => 'Estado del plato actualizado con éxito.',
        ]);
    }

    /**
     * CU-COCINA-02: Deshacer marcado "Listo" dentro de la ventana de seguridad de 30 segundos.
     */
    public function deshacerItem(Request $request, string $itemId): JsonResponse
    {
        $item = DB::table('pedido_item')->where('id', $itemId)->first();

        if (! $item) {
            return ApiResponse::error('ITEM_NO_ENCONTRADO', 'El plato no existe.', 404);
        }

        if ($item->estado !== 'listo') {
            return ApiResponse::error('NO_REVERSIBLE', 'Solo se puede deshacer un plato en estado listo.', 422);
        }

        // Validación estricta de la ventana de seguridad de 30 segundos
        if ($item->fecha_listo_cocina) {
            $segundosDesdeListo = abs(now()->diffInSeconds(Carbon::parse($item->fecha_listo_cocina)));
            if ($segundosDesdeListo > 30) {
                return ApiResponse::error(
                    'VENTANA_DESHACER_EXPIRADA',
                    'La ventana de 30 segundos para deshacer este plato ha expirado.',
                    422
                );
            }
        }

        $reversion = app(StockDeduccionService::class)->revertirRecetaItem($itemId, $request->user()->id);

        DB::table('pedido_item')->where('id', $itemId)->update([
            'estado' => 'en_preparacion',
            'fecha_listo_cocina' => null,
            'updated_at' => now(),
        ]);

        return ApiResponse::ok([
            'item_id' => $itemId,
            'estado_restaurado' => 'en_preparacion',
            'insumos_restaurados' => count($reversion['insumos_restituidos'] ?? []),
            'detalles_restitucion' => $reversion,
            'mensaje' => 'Plato regresó a preparación en fogones (Deshacer exitoso).',
        ]);
    }

    /**
     * CU-COCINA-02: Despachar comanda culinaria completa al pase.
     */
    public function despacharPedido(Request $request, string $pedidoId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $pedido = DB::table('pedido')
            ->where('id', $pedidoId)
            ->where('local_id', $localId)
            ->first();

        if (! $pedido) {
            return ApiResponse::error('PEDIDO_NO_ENCONTRADO', 'El pedido no existe o no pertenece a esta sede.', 404);
        }

        // Marcar todos los platos culinarios de la comanda como listos
        $itemsToUpdate = DB::table('pedido_item as pi')
            ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
            ->where('pi.pedido_id', $pedidoId)
            ->where('pr.requiere_preparacion', true)
            ->whereIn('pi.estado', ['en_cola', 'en_preparacion'])
            ->select(['pi.id', 'pi.fecha_inicio_coccion'])
            ->get();

        $now = now();
        foreach ($itemsToUpdate as $it) {
            $inicio = $it->fecha_inicio_coccion ? Carbon::parse($it->fecha_inicio_coccion) : $now;
            $listo = $inicio->gt($now) ? $inicio : $now;

            DB::table('pedido_item')
                ->where('id', $it->id)
                ->update([
                    'estado' => 'listo',
                    'fecha_inicio_coccion' => $inicio,
                    'fecha_listo_cocina' => $listo,
                    'updated_at' => $now,
                ]);
        }

        // Deducción atómica de todas las recetas culinarias pendientes de la comanda
        $deduccionBatch = app(StockDeduccionService::class)->descontarPedidoCompleto($pedidoId, $user->id);

        // Registrar en Redis con TTL de 30 minutos (1800 seg) para el búfer de recall no destructivo
        $despachadoKey = "kds:despachado:{$localId}:{$pedidoId}";
        try {
            Redis::setex($despachadoKey, 1800, now()->toIso8601String());
            Redis::zadd("kds:despachados_set:{$localId}", now()->timestamp, $pedidoId);
        } catch (\Throwable $e) {
            // Continuar incluso si Redis falla temporalmente
        }

        return ApiResponse::ok([
            'pedido_id' => $pedidoId,
            'despachado' => true,
            'deduccion_stock' => $deduccionBatch ?? null,
            'mensaje' => 'Comanda completa despachada al pase de salón.',
        ]);
    }

    /**
     * CU-COCINA-02: Obtener historial de pedidos despachados en los últimos 30 minutos (Auditoría de solo lectura).
     * Solo retorna órdenes completadas dentro de ese lapso para supervisión del pase sin alterar el flujo activo.
     */
    public function getDespachadosRecientes(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        // Límite estricto de 30 minutos atrás
        $limite30m = Carbon::now()->subMinutes(30);

        // Pedidos del local donde los ítems culinarios culminaron en los últimos 30 minutos
        // y ya no cuentan con raciones pendientes de cocción en cola o fuego
        $pedidos = DB::table('pedido as p')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->leftJoin('piso as pi_so', 'pi_so.id', '=', 'm.piso_id')
            ->join('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)
            ->whereExists(function ($query) use ($limite30m) {
                $query->select(DB::raw(1))
                    ->from('pedido_item as pi')
                    ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
                    ->whereColumn('pi.pedido_id', 'p.id')
                    ->where('pr.requiere_preparacion', true)
                    ->where('pi.fecha_listo_cocina', '>=', $limite30m);
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('pedido_item as pi2')
                    ->join('producto as pr2', 'pr2.id', '=', 'pi2.producto_id')
                    ->whereColumn('pi2.pedido_id', 'p.id')
                    ->where('pr2.requiere_preparacion', true)
                    ->whereIn('pi2.estado', ['en_cola', 'en_preparacion']);
            })
            ->select([
                'p.id as pedido_id',
                'p.numero_comanda',
                'm.numero as mesa_numero',
                'u.nombre as mozo_nombre',
                'pi_so.nombre as piso_nombre',
                'p.created_at',
            ])
            ->orderBy('p.updated_at', 'desc')
            ->limit(20)
            ->get();

        $despachados = [];

        foreach ($pedidos as $p) {
            $items = DB::table('pedido_item as pi')
                ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
                ->where('pi.pedido_id', $p->pedido_id)
                ->where('pr.requiere_preparacion', true)
                ->select([
                    'pr.nombre as producto_nombre',
                    'pi.cantidad',
                    'pi.nota_cocina',
                    'pi.fecha_listo_cocina',
                ])
                ->get();

            if ($items->isEmpty()) {
                continue;
            }

            $maxFechaListo = $items->max('fecha_listo_cocina') ?: $p->created_at;
            $fechaDespacho = Carbon::parse($maxFechaListo);
            $minutosDesdeDespacho = (int) max(0, Carbon::now()->diffInMinutes($fechaDespacho));

            if ($minutosDesdeDespacho > 30) {
                continue; // Garantizar ventana de 30 minutos estricta
            }

            $despachados[] = [
                'pedido_id' => $p->pedido_id,
                'numero_comanda' => (int) $p->numero_comanda,
                'mesa_codigo' => $p->mesa_numero,
                'mozo_nombre' => $p->mozo_nombre,
                'piso_nombre' => $p->piso_nombre ?: 'Salón',
                'total_items' => (int) $items->sum('cantidad'),
                'fecha_despacho' => $fechaDespacho->toIso8601String(),
                'minutos_desde_despacho' => $minutosDesdeDespacho,
                'items_resumen' => $items->map(fn ($it) => [
                    'producto_nombre' => $it->producto_nombre,
                    'cantidad' => (int) $it->cantidad,
                    'nota_cocina' => $it->nota_cocina,
                ])->values()->all(),
            ];
        }

        // Ordenar por fecha de despacho más reciente primero
        usort($despachados, fn ($a, $b) => strcmp($b['fecha_despacho'], $a['fecha_despacho']));

        return ApiResponse::ok($despachados);
    }

    /**
     * CU-COCINA-01: Consolidado de Producción en Vivo ("All-Day Summary").
     * Agrupa raciones pendientes por categoría culinaria y producto.
     */
    public function getConsolidadoAllDay(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $items = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('producto as pr', 'pr.id', '=', 'pi.producto_id')
            ->join('categoria_producto as cp', 'cp.id', '=', 'pr.categoria_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->where('pr.requiere_preparacion', true)
            ->whereIn('pi.estado', ['en_cola', 'en_preparacion'])
            ->select([
                'cp.nombre as categoria_nombre',
                'pr.id as producto_id',
                'pr.nombre as nombre_producto',
                'pi.cantidad',
                'pi.estado',
                'pi.nota_cocina',
                'm.numero as mesa_codigo',
                'p.created_at as pedido_created_at',
            ])
            ->get();

        $agrupadoPorCategoria = $items->groupBy('categoria_nombre');
        $consolidado = [];

        foreach ($agrupadoPorCategoria as $categoriaNombre => $categoriaItems) {
            $platosAgrupados = $categoriaItems->groupBy('producto_id');
            $platos = [];
            $totalRacionesCategoria = 0;

            foreach ($platosAgrupados as $prodId => $prodItems) {
                $nombreProducto = $prodItems->first()->nombre_producto;
                $cantidadTotal = (int) $prodItems->sum('cantidad');
                $cantidadEnFuego = (int) $prodItems->where('estado', 'en_preparacion')->sum('cantidad');
                $totalRacionesCategoria += $cantidadTotal;

                $cantidadCritica = 0;
                $detalleMesas = [];

                foreach ($prodItems as $it) {
                    $minutosEspera = (int) max(0, round((now()->timestamp - strtotime($it->pedido_created_at)) / 60));
                    if ($minutosEspera > 25) {
                        $cantidadCritica += (int) $it->cantidad;
                    }

                    $detalleMesas[] = [
                        'mesa_codigo' => $it->mesa_codigo,
                        'cantidad' => (int) $it->cantidad,
                        'nota_cocina' => $it->nota_cocina,
                        'minutos_espera' => $minutosEspera,
                        'estado' => $it->estado,
                    ];
                }

                $platos[] = [
                    'producto_id' => $prodId,
                    'nombre_producto' => $nombreProducto,
                    'categoria_nombre' => $categoriaNombre,
                    'cantidad_total' => $cantidadTotal,
                    'cantidad_en_fuego' => $cantidadEnFuego,
                    'cantidad_critica' => $cantidadCritica,
                    'detalle_mesas' => $detalleMesas,
                ];
            }

            $consolidado[] = [
                'categoria_nombre' => $categoriaNombre,
                'total_raciones' => $totalRacionesCategoria,
                'platos' => $platos,
            ];
        }

        return ApiResponse::ok($consolidado);
    }

    /**
     * CU-COCINA-02: Poner en fuego una tanda completa de raciones en cola de un producto.
     */
    public function ponerEnFuegoTanda(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'producto_id' => ['required', 'uuid', 'exists:producto,id'],
            'cantidad' => ['nullable', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $localId = $user->local_id;
        $productoId = $validated['producto_id'];
        $cantidadLimite = $validated['cantidad'] ?? null;

        $producto = DB::table('producto')
            ->where('id', $productoId)
            ->where('local_id', $localId)
            ->first();

        if (! $producto) {
            return ApiResponse::error('PRODUCTO_NO_ENCONTRADO', 'El plato no pertenece a esta sede.', 404);
        }

        // Obtener ítems en cola de pedidos activos ordenados por FIFO
        $items = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->where('pi.producto_id', $productoId)
            ->where('pi.estado', 'en_cola')
            ->select('pi.id', 'pi.cantidad')
            ->orderBy('p.created_at', 'asc')
            ->orderBy('pi.created_at', 'asc')
            ->get();

        if ($items->isEmpty()) {
            return ApiResponse::ok([
                'producto_id' => $productoId,
                'actualizados' => 0,
                'mensaje' => 'No hay raciones en cola para este plato.',
            ]);
        }

        $now = now();
        $totalRacionesPuestas = 0;
        $itemsIds = [];

        DB::transaction(function () use ($items, $cantidadLimite, $now, &$totalRacionesPuestas, &$itemsIds) {
            $restantes = $cantidadLimite;

            foreach ($items as $item) {
                if ($restantes !== null && $restantes <= 0) {
                    break;
                }

                $cantidadAfectada = (int) $item->cantidad;
                if ($restantes !== null && $cantidadAfectada > $restantes) {
                    // Split si la cantidad solicitada es menor a la del item
                    $porcionesFuego = $restantes;
                    $porcionesCola = $cantidadAfectada - $restantes;

                    // Actualizar ítem original que se queda en cola
                    DB::table('pedido_item')
                        ->where('id', $item->id)
                        ->update([
                            'cantidad' => $porcionesCola,
                            'updated_at' => $now,
                        ]);

                    // Clonar ítem que pasa a preparación
                    $orig = DB::table('pedido_item')->where('id', $item->id)->first();
                    $nuevoId = (string) Str::uuid();
                    DB::table('pedido_item')->insert([
                        'id' => $nuevoId,
                        'pedido_id' => $orig->pedido_id,
                        'producto_id' => $orig->producto_id,
                        'cantidad' => $porcionesFuego,
                        'precio_unitario' => $orig->precio_unitario,
                        'nota_cocina' => $orig->nota_cocina,
                        'estado' => 'en_preparacion',
                        'numero_ronda' => $orig->numero_ronda,
                        'fecha_inicio_coccion' => $now,
                        'fecha_listo_cocina' => null,
                        'stock_descontado' => false,
                        'created_at' => $orig->created_at,
                        'updated_at' => $now,
                    ]);

                    $totalRacionesPuestas += $porcionesFuego;
                    $itemsIds[] = $nuevoId;
                    $restantes = 0;
                    break;
                }

                DB::table('pedido_item')
                    ->where('id', $item->id)
                    ->update([
                        'estado' => 'en_preparacion',
                        'fecha_inicio_coccion' => $now,
                        'updated_at' => $now,
                    ]);

                $totalRacionesPuestas += $cantidadAfectada;
                $itemsIds[] = $item->id;

                if ($restantes !== null) {
                    $restantes -= $cantidadAfectada;
                }
            }
        });

        return ApiResponse::ok([
            'producto_id' => $productoId,
            'actualizados' => $totalRacionesPuestas,
            'items_afectados' => $itemsIds,
            'mensaje' => "Se pusieron en fuego {$totalRacionesPuestas} raciones con éxito.",
        ]);
    }

    /**
     * CU-COCINA-02: Marcar como listos en pase una tanda de raciones por criterio FIFO estricto.
     * Descuenta ingredientes en bodega de forma atómica con StockDeduccionService.
     */
    public function marcarListoTanda(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'producto_id' => ['required', 'uuid', 'exists:producto,id'],
            'cantidad' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $localId = $user->local_id;
        $productoId = $validated['producto_id'];
        $cantidadAListar = (int) $validated['cantidad'];

        $producto = DB::table('producto')
            ->where('id', $productoId)
            ->where('local_id', $localId)
            ->first();

        if (! $producto) {
            return ApiResponse::error('PRODUCTO_NO_ENCONTRADO', 'El plato no pertenece a esta sede.', 404);
        }

        // Obtener ítems en_preparacion ordenados estrictamente por FIFO
        $itemsEnFuego = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('p.local_id', $localId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->where('pi.producto_id', $productoId)
            ->where('pi.estado', 'en_preparacion')
            ->select([
                'pi.id',
                'pi.pedido_id',
                'pi.producto_id',
                'pi.cantidad',
                'pi.precio_unitario',
                'pi.nota_cocina',
                'pi.numero_ronda',
                'pi.fecha_inicio_coccion',
                'pi.created_at as item_created_at',
                'p.created_at as pedido_created_at',
            ])
            ->orderBy('p.created_at', 'asc')
            ->orderBy('pi.created_at', 'asc')
            ->orderBy('pi.id', 'asc')
            ->get();

        if ($itemsEnFuego->isEmpty()) {
            return ApiResponse::error(
                'NO_HAY_RACIONES_EN_FUEGO',
                'No hay raciones en fuego para este plato.',
                422
            );
        }

        $now = now();
        $restantes = $cantidadAListar;
        $totalListas = 0;
        $itemsAfectadosIds = [];
        $deducciones = [];

        DB::transaction(function () use (
            $itemsEnFuego,
            &$restantes,
            &$totalListas,
            &$itemsAfectadosIds,
            &$deducciones,
            $user,
            $now
        ) {
            foreach ($itemsEnFuego as $it) {
                if ($restantes <= 0) {
                    break;
                }

                $inicioCoccion = $it->fecha_inicio_coccion ? Carbon::parse($it->fecha_inicio_coccion) : $now;
                // Coherencia de tiempos: fecha_listo_cocina >= fecha_inicio_coccion
                $listo = $inicioCoccion->gt($now) ? $inicioCoccion : $now;
                $cantidadItem = (int) $it->cantidad;

                if ($cantidadItem <= $restantes) {
                    // Ítem completo pasa a listo
                    DB::table('pedido_item')
                        ->where('id', $it->id)
                        ->update([
                            'estado' => 'listo',
                            'fecha_inicio_coccion' => $inicioCoccion,
                            'fecha_listo_cocina' => $listo,
                            'updated_at' => $now,
                        ]);

                    $resStock = app(StockDeduccionService::class)->descontarRecetaItem($it->id, $user->id);
                    $deducciones[] = $resStock;

                    $totalListas += $cantidadItem;
                    $restantes -= $cantidadItem;
                    $itemsAfectadosIds[] = $it->id;
                } else {
                    // Split atómico: se listan $restantes y quedan $cantidadItem - $restantes en_preparacion
                    $porcionesListas = $restantes;
                    $porcionesQuedan = $cantidadItem - $restantes;

                    // Actualizar ítem original (conserva las que siguen en preparación)
                    DB::table('pedido_item')
                        ->where('id', $it->id)
                        ->update([
                            'cantidad' => $porcionesQuedan,
                            'updated_at' => $now,
                        ]);

                    // Insertar nuevo ítem clonado con las porciones listas
                    $nuevoId = (string) Str::uuid();
                    DB::table('pedido_item')->insert([
                        'id' => $nuevoId,
                        'pedido_id' => $it->pedido_id,
                        'producto_id' => $it->producto_id,
                        'cantidad' => $porcionesListas,
                        'precio_unitario' => $it->precio_unitario,
                        'nota_cocina' => $it->nota_cocina,
                        'estado' => 'listo',
                        'numero_ronda' => $it->numero_ronda,
                        'fecha_inicio_coccion' => $inicioCoccion,
                        'fecha_listo_cocina' => $listo,
                        'stock_descontado' => false,
                        'created_at' => $it->item_created_at,
                        'updated_at' => $now,
                    ]);

                    $resStock = app(StockDeduccionService::class)->descontarRecetaItem($nuevoId, $user->id);
                    $deducciones[] = $resStock;

                    $totalListas += $porcionesListas;
                    $restantes = 0;
                    $itemsAfectadosIds[] = $nuevoId;
                    break;
                }
            }
        });

        return ApiResponse::ok([
            'producto_id' => $productoId,
            'listos' => $totalListas,
            'items_afectados' => $itemsAfectadosIds,
            'deducciones' => $deducciones,
            'mensaje' => "Se marcaron como listas {$totalListas} raciones asignadas por FIFO estricto.",
        ]);
    }

    /**
     * CU-COCINA-01 & 02: Métricas de despacho del turno.
     */
    public function getMetricasDespacho(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $hoy = Carbon::today();
        $hace30m = Carbon::now()->subMinutes(30);

        // Despachados en los últimos 30 min
        $despachados30m = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('p.local_id', $localId)
            ->where('pi.estado', 'listo')
            ->where('pi.fecha_listo_cocina', '>=', $hace30m)
            ->distinct('pi.pedido_id')
            ->count('pi.pedido_id');

        // Total pedidos hoy
        $totalTurnoHoy = DB::table('pedido')
            ->where('local_id', $localId)
            ->where('created_at', '>=', $hoy)
            ->count();

        // Tiempo promedio real de cocción hoy (minutos)
        $promedioCoccion = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('p.local_id', $localId)
            ->where('pi.estado', 'listo')
            ->whereNotNull('pi.fecha_inicio_coccion')
            ->whereNotNull('pi.fecha_listo_cocina')
            ->where('pi.fecha_listo_cocina', '>=', $hoy)
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (pi.fecha_listo_cocina - pi.fecha_inicio_coccion)) / 60) as tiempo_promedio')
            ->value('tiempo_promedio');

        $tiempoPromedioMin = $promedioCoccion !== null ? round((float) $promedioCoccion, 1) : 10.0;

        return ApiResponse::ok([
            'despachadosUltimos30m' => $despachados30m,
            'tiempoPromedioCoccionMin' => $tiempoPromedioMin,
            'tiempoPromedioPaseMin' => 2.2,
            'totalTurnoHoy' => max(1, $totalTurnoHoy),
        ]);
    }

    /**
     * CU-COCINA-04: Catálogo de disponibilidad de platos culinarios para gestión táctil de quiebres.
     */
    public function getDisponibilidadProductos(Request $request): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $productos = DB::table('producto as pr')
            ->join('categoria_producto as cp', 'cp.id', '=', 'pr.categoria_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'pr.usuario_modifico_disp_id')
            ->where('pr.local_id', $localId)
            ->where('pr.requiere_preparacion', true)
            ->where('pr.activo', true)
            ->select([
                'pr.id as producto_id',
                'pr.nombre',
                'cp.id as categoria_id',
                'cp.nombre as categoria_nombre',
                'pr.precio',
                'pr.foto_url',
                'pr.disponibilidad',
                'pr.motivo_agotado',
                'pr.fecha_modificacion_disp',
                'u.nombre as usuario_modifico_nombre',
                'pr.descripcion as receta_resumen',
            ])
            ->orderBy('cp.orden', 'asc')
            ->orderBy('pr.nombre', 'asc')
            ->get();

        $catalogo = [];

        foreach ($productos as $p) {
            // Verificar si algún insumo asociado está agotado en bodega (stock_actual <= 0)
            $insumoBloqueante = DB::table('producto_insumo as pi')
                ->join('insumo as i', 'i.id', '=', 'pi.insumo_id')
                ->where('pi.producto_id', $p->producto_id)
                ->where('i.stock_actual', '<=', 0)
                ->value('i.nombre');

            // Conteo de raciones en cola y fuego en pedidos activos
            $ordenesCola = (int) DB::table('pedido_item as pi')
                ->join('pedido as ped', 'ped.id', '=', 'pi.pedido_id')
                ->where('ped.local_id', $localId)
                ->where('pi.producto_id', $p->producto_id)
                ->whereIn('ped.estado', ['enviado', 'cuenta_pedida'])
                ->where('pi.estado', 'en_cola')
                ->sum('pi.cantidad');

            $ordenesFuego = (int) DB::table('pedido_item as pi')
                ->join('pedido as ped', 'ped.id', '=', 'pi.pedido_id')
                ->where('ped.local_id', $localId)
                ->where('pi.producto_id', $p->producto_id)
                ->whereIn('ped.estado', ['enviado', 'cuenta_pedida'])
                ->where('pi.estado', 'en_preparacion')
                ->sum('pi.cantidad');

            $catalogo[] = [
                'producto_id' => $p->producto_id,
                'nombre' => $p->nombre,
                'categoria_id' => $p->categoria_id,
                'categoria_nombre' => $p->categoria_nombre,
                'precio' => (float) $p->precio,
                'foto_url' => $p->foto_url,
                'disponibilidad' => $p->disponibilidad,
                'motivo_agotado' => $p->motivo_agotado,
                'fecha_modificacion_disp' => $p->fecha_modificacion_disp ? Carbon::parse($p->fecha_modificacion_disp)->toIso8601String() : null,
                'usuario_modifico_nombre' => $p->usuario_modifico_nombre,
                'receta_resumen' => $p->receta_resumen ?: $p->nombre,
                'insumo_bloqueante' => $insumoBloqueante,
                'ordenes_en_cola' => $ordenesCola,
                'ordenes_en_fuego' => $ordenesFuego,
            ];
        }

        return ApiResponse::ok($catalogo);
    }

    /**
     * CU-COCINA-04: Obtener raciones activas en fogones de un plato para el diálogo de resolución.
     */
    public function getItemsEnFuegoProducto(Request $request, string $productoId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $items = DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->join('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->join('usuario as u', 'u.id', '=', 'p.mozo_id')
            ->where('p.local_id', $localId)
            ->where('pi.producto_id', $productoId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->where('pi.estado', 'en_preparacion')
            ->select([
                'pi.id as item_id',
                'p.id as pedido_id',
                'p.numero_comanda',
                'm.numero as mesa_codigo',
                'u.nombre as mozo_nombre',
                'pi.cantidad',
                'p.created_at as pedido_created_at',
            ])
            ->orderBy('p.created_at', 'asc') // FIFO
            ->get();

        $resultado = $items->map(function ($it) {
            $minutosEspera = (int) max(0, round((now()->timestamp - strtotime($it->pedido_created_at)) / 60));
            return [
                'item_id' => $it->item_id,
                'pedido_id' => $it->pedido_id,
                'numero_comanda' => (int) $it->numero_comanda,
                'mesa_codigo' => $it->mesa_codigo,
                'mozo_nombre' => $it->mozo_nombre,
                'cantidad' => (int) $it->cantidad,
                'minutos_espera' => $minutosEspera,
                'cubierto' => true,
            ];
        })->values()->all();

        return ApiResponse::ok($resultado);
    }

    /**
     * CU-COCINA-04: Marcar producto como agotado.
     * Si posee raciones en fuego, responde requiere_resolucion = true para abrir el diálogo FIFO.
     */
    public function marcarProductoAgotado(Request $request, string $productoId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $producto = DB::table('producto')
            ->where('id', $productoId)
            ->where('local_id', $localId)
            ->first();

        if (! $producto) {
            return ApiResponse::error('PRODUCTO_NO_ENCONTRADO', 'El producto no existe en esta sede.', 404);
        }

        // Conteo de raciones en fuego activo (en_preparacion)
        $itemsEnFuegoCount = (int) DB::table('pedido_item as pi')
            ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
            ->where('p.local_id', $localId)
            ->where('pi.producto_id', $productoId)
            ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
            ->where('pi.estado', 'en_preparacion')
            ->sum('pi.cantidad');

        if ($itemsEnFuegoCount > 0) {
            return ApiResponse::ok([
                'requiere_resolucion' => true,
                'raciones_en_fuego' => $itemsEnFuegoCount,
                'mensaje' => 'Existen raciones en preparación activa. Se requiere resolver para cuántas alcanza la mise en place.',
            ]);
        }

        // Sin fuego activo: apagar de inmediato y cancelar órdenes en cola
        DB::transaction(function () use ($productoId, $localId, $user) {
            $now = now();

            DB::table('producto')
                ->where('id', $productoId)
                ->where('local_id', $localId)
                ->update([
                    'disponibilidad' => 'agotado',
                    'motivo_agotado' => 'apagado_manual_cocina',
                    'usuario_modifico_disp_id' => $user->id,
                    'fecha_modificacion_disp' => $now,
                    'updated_at' => $now,
                ]);

            // Órdenes en cola pasan a no_disponible
            DB::table('pedido_item as pi')
                ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
                ->where('p.local_id', $localId)
                ->where('pi.producto_id', $productoId)
                ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
                ->where('pi.estado', 'en_cola')
                ->update([
                    'pi.estado' => 'no_disponible',
                    'pi.motivo_anulacion' => 'quiebre_stock_cocina',
                    'pi.anulado_por' => $user->id,
                    'pi.updated_at' => $now,
                ]);

            // Registro institucional en notificacion (02_schema_ddl.sql)
            $local = DB::table('local')->where('id', $localId)->first();
            $prod = DB::table('producto')->where('id', $productoId)->first();
            if ($local && $prod) {
                DB::table('notificacion')->insert([
                    'id' => (string) Str::uuid(),
                    'empresa_id' => $local->empresa_id,
                    'local_id' => $localId,
                    'usuario_id' => null,
                    'rol_destinatario' => 'admin_local',
                    'tipo' => 'quiebre_manual_cocina',
                    'prioridad' => 'media',
                    'titulo' => "⚠️ Quiebre manual en cocina: {$prod->nombre}",
                    'mensaje' => "El cocinero {$user->nombre} marcó como agotado el plato.",
                    'entidad_tipo' => 'producto',
                    'entidad_id' => $productoId,
                    'leida' => false,
                    'created_at' => $now,
                ]);
            }
        });

        return ApiResponse::ok([
            'requiere_resolucion' => false,
            'disponibilidad' => 'agotado',
            'mensaje' => 'Plato marcado como agotado con éxito.',
        ]);
    }

    /**
     * CU-COCINA-04: Resolver órdenes en fuego ante quiebre parcial (asignación FIFO).
     */
    public function resolverFuegoProducto(Request $request, string $productoId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $validated = $request->validate([
            'items_no_alcanzados_ids' => ['nullable', 'array'],
            'items_no_alcanzados_ids.*' => ['uuid'],
            'motivo' => ['nullable', 'string', 'max:255'],
        ]);

        $idsNoAlcanzados = $validated['items_no_alcanzados_ids'] ?? [];
        $motivo = $validated['motivo'] ?? 'Falta de insumo fresco en partida culinaria';

        DB::transaction(function () use ($productoId, $localId, $user, $idsNoAlcanzados, $motivo) {
            $now = now();

            // 1. Apagar producto en carta
            DB::table('producto')
                ->where('id', $productoId)
                ->where('local_id', $localId)
                ->update([
                    'disponibilidad' => 'agotado',
                    'motivo_agotado' => 'apagado_manual_cocina',
                    'usuario_modifico_disp_id' => $user->id,
                    'fecha_modificacion_disp' => $now,
                    'updated_at' => $now,
                ]);

            // 2. Conmutar órdenes en cola a no_disponible
            DB::table('pedido_item as pi')
                ->join('pedido as p', 'p.id', '=', 'pi.pedido_id')
                ->where('p.local_id', $localId)
                ->where('pi.producto_id', $productoId)
                ->whereIn('p.estado', ['enviado', 'cuenta_pedida'])
                ->where('pi.estado', 'en_cola')
                ->update([
                    'pi.estado' => 'no_disponible',
                    'pi.motivo_anulacion' => 'quiebre_stock_cocina',
                    'pi.anulado_por' => $user->id,
                    'pi.updated_at' => $now,
                ]);

            // 3. Conmutar órdenes en fuego no cubiertas a no_disponible
            if (! empty($idsNoAlcanzados)) {
                DB::table('pedido_item')
                    ->whereIn('id', $idsNoAlcanzados)
                    ->where('producto_id', $productoId)
                    ->where('estado', 'en_preparacion')
                    ->update([
                        'estado' => 'no_disponible',
                        'motivo_anulacion' => 'quiebre_fuego_parcial',
                        'anulado_por' => $user->id,
                        'updated_at' => $now,
                    ]);
            }

            // 4. Registrar alerta institucional
            $local = DB::table('local')->where('id', $localId)->first();
            $prod = DB::table('producto')->where('id', $productoId)->first();
            if ($local && $prod) {
                DB::table('notificacion')->insert([
                    'id' => (string) Str::uuid(),
                    'empresa_id' => $local->empresa_id,
                    'local_id' => $localId,
                    'usuario_id' => null,
                    'rol_destinatario' => 'admin_local',
                    'tipo' => 'quiebre_manual_cocina',
                    'prioridad' => 'media',
                    'titulo' => "⚠️ Quiebre manual en cocina: {$prod->nombre}",
                    'mensaje' => "El cocinero {$user->nombre} resolvió órdenes en fuego. Motivo: {$motivo}.",
                    'entidad_tipo' => 'producto',
                    'entidad_id' => $productoId,
                    'leida' => false,
                    'created_at' => $now,
                ]);
            }
        });

        return ApiResponse::ok([
            'resuelto' => true,
            'disponibilidad' => 'agotado',
            'mensaje' => 'Resolución de fuego confirmada y plato marcado como agotado.',
        ]);
    }

    /**
     * CU-COCINA-04: Reactivar producto a disponible.
     * Falla si los insumos requeridos se encuentran en stock cero en bodega.
     */
    public function reactivarProducto(Request $request, string $productoId): JsonResponse
    {
        $user = $request->user();
        $localId = $user->local_id;

        $producto = DB::table('producto')
            ->where('id', $productoId)
            ->where('local_id', $localId)
            ->first();

        if (! $producto) {
            return ApiResponse::error('PRODUCTO_NO_ENCONTRADO', 'El plato no existe.', 404);
        }

        // Validar que no tenga insumos con stock cero
        $insumoAgotado = DB::table('producto_insumo as pi')
            ->join('insumo as i', 'i.id', '=', 'pi.insumo_id')
            ->where('pi.producto_id', $productoId)
            ->where('i.stock_actual', '<=', 0)
            ->select('i.nombre')
            ->first();

        if ($insumoAgotado) {
            return ApiResponse::error(
                'ERR_INSUMO_AGOTADO',
                "No se puede reactivar el plato porque el insumo '{$insumoAgotado->nombre}' tiene stock cero en almacén. Requiere recepción de compra.",
                422
            );
        }

        $now = now();
        DB::table('producto')
            ->where('id', $productoId)
            ->where('local_id', $localId)
            ->update([
                'disponibilidad' => 'disponible',
                'motivo_agotado' => null,
                'usuario_modifico_disp_id' => $user->id,
                'fecha_modificacion_disp' => $now,
                'updated_at' => $now,
            ]);

        return ApiResponse::ok([
            'producto_id' => $productoId,
            'disponibilidad' => 'disponible',
            'mensaje' => 'Plato reactivado a disponible en carta.',
        ]);
    }
}
