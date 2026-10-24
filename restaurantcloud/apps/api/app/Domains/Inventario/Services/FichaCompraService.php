<?php

namespace App\Domains\Inventario\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FichaCompraService
{
    /**
     * Listado paginado de fichas de compra con KPIs analíticos de abastecimiento.
     */
    public function listado(string $localId, array $filtros): array
    {
        $pagina = max(1, (int) ($filtros['pagina'] ?? $filtros['page'] ?? 1));
        $limite = min(100, max(1, (int) ($filtros['limite'] ?? $filtros['pageSize'] ?? 10)));
        $busqueda = trim((string) ($filtros['busqueda'] ?? $filtros['query'] ?? ''));
        $criterio = strtoupper(trim((string) ($filtros['criterioBusqueda'] ?? $filtros['criterio_busqueda'] ?? 'TODOS')));
        $tipoComprobante = strtoupper(trim((string) ($filtros['tipoComprobante'] ?? $filtros['tipo_comprobante'] ?? 'TODOS')));
        $estado = strtoupper(trim((string) ($filtros['estado'] ?? 'TODOS')));
        $fechaDesde = trim((string) ($filtros['fechaDesde'] ?? $filtros['fecha_desde'] ?? ''));
        $fechaHasta = trim((string) ($filtros['fechaHasta'] ?? $filtros['fecha_hasta'] ?? ''));

        // 1. KPIs del mes en curso para la sede
        $statsMesActual = DB::table('ficha_compra')
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->whereRaw("EXTRACT(YEAR FROM fecha_emision) = EXTRACT(YEAR FROM CURRENT_DATE)")
            ->whereRaw("EXTRACT(MONTH FROM fecha_emision) = EXTRACT(MONTH FROM CURRENT_DATE)")
            ->selectRaw("COALESCE(SUM(total), 0)::numeric as gasto_mes_total")
            ->selectRaw("COUNT(*)::int as total_compras_mes")
            ->selectRaw("COALESCE(SUM(CASE WHEN tipo_comprobante = 'factura' THEN impuestos ELSE 0 END), 0)::numeric as facturas_con_igv_monto")
            ->first();

        // Gasto mes anterior para variación porcentual
        $statsMesAnterior = DB::table('ficha_compra')
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->whereRaw("fecha_emision >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')")
            ->whereRaw("fecha_emision < DATE_TRUNC('month', CURRENT_DATE)")
            ->selectRaw("COALESCE(SUM(total), 0)::numeric as gasto_mes_anterior")
            ->first();

        $gastoMesActual = (float) ($statsMesActual->gasto_mes_total ?? 0);
        $gastoMesAnterior = (float) ($statsMesAnterior->gasto_mes_anterior ?? 0);
        $variacionPct = 0.0;
        if ($gastoMesAnterior > 0) {
            $variacionPct = round((($gastoMesActual - $gastoMesAnterior) / $gastoMesAnterior) * 100, 1);
        } elseif ($gastoMesActual > 0) {
            $variacionPct = 100.0;
        }

        // Créditos pendientes de proveedores (no anulados)
        $creditosPendientes = DB::table('ficha_compra')
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->where('metodo_pago', 'credito_proveedor')
            ->sum('total');

        $kpis = [
            'gasto_mes_total' => round($gastoMesActual, 2),
            'variacion_gasto_mes_pct' => $variacionPct,
            'total_compras_mes' => (int) ($statsMesActual->total_compras_mes ?? 0),
            'facturas_con_igv_monto' => round((float) ($statsMesActual->facturas_con_igv_monto ?? 0), 2),
            'creditos_pendientes_monto' => round((float) $creditosPendientes, 2),
        ];

        // 2. Query de fichas de compra con proveedor y usuario
        $query = DB::table('ficha_compra as fc')
            ->join('proveedor as p', 'p.id', '=', 'fc.proveedor_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'fc.usuario_id')
            ->where('fc.local_id', $localId);

        if ($busqueda !== '') {
            $query->where(function ($sub) use ($busqueda, $criterio) {
                if ($criterio === 'COMPROBANTE') {
                    $sub->whereRaw('LOWER(fc.numero_comprobante) LIKE LOWER(?)', ["%{$busqueda}%"]);
                } elseif ($criterio === 'PROVEEDOR') {
                    $sub->whereRaw('LOWER(p.nombre) LIKE LOWER(?)', ["%{$busqueda}%"]);
                } else {
                    $sub->whereRaw('LOWER(fc.numero_comprobante) LIKE LOWER(?)', ["%{$busqueda}%"])
                        ->orWhereRaw('LOWER(p.nombre) LIKE LOWER(?)', ["%{$busqueda}%"]);
                }
            });
        }

        if ($tipoComprobante !== 'TODOS' && $tipoComprobante !== '') {
            $query->whereRaw('LOWER(fc.tipo_comprobante) = LOWER(?)', [$tipoComprobante]);
        }

        if ($estado !== 'TODOS' && $estado !== '') {
            $query->whereRaw('LOWER(fc.estado) = LOWER(?)', [$estado]);
        }

        if ($fechaDesde !== '') {
            $query->where('fc.fecha_emision', '>=', $fechaDesde);
        }

        if ($fechaHasta !== '') {
            $query->where('fc.fecha_emision', '<=', $fechaHasta);
        }

        $totalRegistros = (clone $query)->count();
        $totalPaginas = max(1, (int) ceil($totalRegistros / $limite));
        $offset = ($pagina - 1) * $limite;

        $registros = $query
            ->select([
                'fc.id',
                'fc.tipo_comprobante',
                'fc.numero_comprobante',
                'fc.es_autogenerado',
                'fc.fecha_emision',
                'fc.created_at',
                'fc.metodo_pago',
                'fc.subtotal',
                'fc.impuestos',
                'fc.total',
                'fc.estado',
                'fc.motivo_anulacion',
                'fc.anulado_at',
                'fc.proveedor_id',
                'p.nombre as proveedor_nombre',
                'p.telefono as proveedor_telefono',
                DB::raw("COALESCE(u.nombre, 'Administrador') as registrado_por_nombre"),
                DB::raw("(SELECT COUNT(*)::int FROM ficha_compra_detalle WHERE ficha_compra_id = fc.id) as cantidad_items"),
            ])
            ->orderBy('fc.fecha_emision', 'desc')
            ->orderBy('fc.created_at', 'desc')
            ->offset($offset)
            ->limit($limite)
            ->get();

        $fichasDTO = $registros->map(function ($r) {
            return $this->formatearFichaResumen($r);
        })->all();

        return [
            'fichas' => $fichasDTO,
            'kpis' => $kpis,
            'paginacion' => [
                'total' => $totalRegistros,
                'pagina' => $pagina,
                'limite' => $limite,
                'total_paginas' => $totalPaginas,
            ],
        ];
    }

    /**
     * Obtiene el detalle completo y auditoría de una ficha de compra.
     */
    public function detalle(string $id, string $localId): ?array
    {
        $ficha = DB::table('ficha_compra as fc')
            ->join('proveedor as p', 'p.id', '=', 'fc.proveedor_id')
            ->leftJoin('usuario as u', 'u.id', '=', 'fc.usuario_id')
            ->leftJoin('usuario as ua', 'ua.id', '=', 'fc.anulado_por')
            ->where('fc.id', $id)
            ->where('fc.local_id', $localId)
            ->select([
                'fc.*',
                'p.nombre as proveedor_nombre',
                'p.telefono as proveedor_telefono',
                'p.email as proveedor_email',
                'p.direccion as proveedor_direccion',
                DB::raw("COALESCE(u.nombre, 'Administrador') as registrado_por_nombre"),
                'ua.nombre as anulado_por_nombre',
                DB::raw("(SELECT COUNT(*)::int FROM ficha_compra_detalle WHERE ficha_compra_id = fc.id) as cantidad_items"),
            ])
            ->first();

        if (! $ficha) {
            return null;
        }

        $items = DB::table('ficha_compra_detalle as fcd')
            ->join('insumo as i', 'i.id', '=', 'fcd.insumo_id')
            ->where('fcd.ficha_compra_id', $id)
            ->select([
                'fcd.id',
                'fcd.insumo_id',
                'i.nombre as insumo_nombre',
                'i.unidad_medida',
                'i.stock_actual as stock_actual_insumo',
                'i.costo_unitario as costo_anterior',
                'fcd.cantidad',
                'fcd.precio_unitario',
                'fcd.subtotal',
            ])
            ->get()
            ->map(function ($it) use ($id) {
                $costoAnt = (float) $it->costo_anterior;
                $precioUnit = (float) $it->precio_unitario;
                $variacionPct = 0.0;
                if ($costoAnt > 0) {
                    $variacionPct = round((($precioUnit - $costoAnt) / $costoAnt) * 100, 1);
                }

                return [
                    'id' => $it->id,
                    'ficha_id' => $id,
                    'insumo_id' => $it->insumo_id,
                    'insumo_nombre' => $it->insumo_nombre,
                    'unidad_medida' => $it->unidad_medida,
                    'cantidad' => round((float) $it->cantidad, 4),
                    'precio_unitario' => round((float) $it->precio_unitario, 4),
                    'subtotal' => round((float) $it->subtotal, 2),
                    'costo_anterior' => round($costoAnt, 4),
                    'variacion_porcentaje' => $variacionPct,
                    'stock_actual_insumo' => round((float) $it->stock_actual_insumo, 3),
                ];
            })
            ->all();

        $resumen = $this->formatearFichaResumen($ficha);
        $resumen['observaciones'] = $ficha->notas;
        $resumen['items'] = $items;
        $resumen['anulado_por_nombre'] = $ficha->anulado_por_nombre;

        return $resumen;
    }

    /**
     * Evalúa preventivamente el impacto de anular una ficha de compra.
     * Calcula la proyección con piso 0 (GREATEST 0 Floor) y platos/comandas afectadas.
     */
    public function obtenerImpactoAnulacion(string $id, string $localId): array
    {
        $ficha = DB::table('ficha_compra as fc')
            ->join('proveedor as p', 'p.id', '=', 'fc.proveedor_id')
            ->where('fc.id', $id)
            ->where('fc.local_id', $localId)
            ->select([
                'fc.id',
                'fc.numero_comprobante',
                'fc.fecha_emision',
                'fc.total',
                'fc.estado',
                'p.nombre as proveedor_nombre',
            ])
            ->first();

        if (! $ficha) {
            throw new \DomainException('Ficha de compra no encontrada.');
        }

        $items = DB::table('ficha_compra_detalle as fcd')
            ->join('insumo as i', 'i.id', '=', 'fcd.insumo_id')
            ->where('fcd.ficha_compra_id', $id)
            ->select([
                'fcd.insumo_id',
                'i.nombre as insumo_nombre',
                'i.unidad_medida',
                'i.stock_actual',
                'i.stock_minimo',
                'fcd.cantidad',
            ])
            ->get();

        $insumosAfectados = [];
        $platosQueSeAgotaran = [];
        $platoIdsAfectados = [];

        foreach ($items as $item) {
            $stockActual = (float) $item->stock_actual;
            $cantidadARestar = (float) $item->cantidad;
            $stockProyectado = max(0.000, round($stockActual - $cantidadARestar, 3));
            $quedaraEnQuiebre = $stockProyectado <= (float) $item->stock_minimo;

            $insumosAfectados[] = [
                'insumo_id' => $item->insumo_id,
                'insumo_nombre' => $item->insumo_nombre,
                'unidad_medida' => $item->unidad_medida,
                'stock_actual' => $stockActual,
                'cantidad_a_restar' => $cantidadARestar,
                'stock_proyectado' => $stockProyectado,
                'quedara_en_quiebre' => $quedaraEnQuiebre,
            ];

            if ($quedaraEnQuiebre) {
                // Platos activos que consumen este insumo y cuya dosis no se satisface
                $platosAfectados = DB::table('producto_insumo as pi')
                    ->join('producto as p', 'p.id', '=', 'pi.producto_id')
                    ->leftJoin('categoria_producto as cp', 'cp.id', '=', 'p.categoria_id')
                    ->where('pi.insumo_id', $item->insumo_id)
                    ->where('p.local_id', $localId)
                    ->where('p.disponibilidad', 'disponible')
                    ->where('pi.cantidad_descuenta', '>', $stockProyectado)
                    ->select([
                        'p.id as plato_id',
                        'p.nombre as plato_nombre',
                        'cp.nombre as categoria_nombre',
                    ])
                    ->get();

                foreach ($platosAfectados as $plato) {
                    if (! in_array($plato->plato_id, $platoIdsAfectados)) {
                        $platoIdsAfectados[] = $plato->plato_id;
                        $platosQueSeAgotaran[] = [
                            'plato_id' => $plato->plato_id,
                            'plato_nombre' => $plato->plato_nombre,
                            'categoria_nombre' => $plato->categoria_nombre ?? 'Carta',
                            'insumo_critico' => $item->insumo_nombre,
                        ];
                    }
                }
            }
        }

        // Comandas activas en cocina que contienen estos platos
        $pedidosCocinaEnRiesgo = [];
        if (! empty($platoIdsAfectados)) {
            $itemsCocina = DB::table('pedido_item as pi')
                ->join('pedido as ped', 'ped.id', '=', 'pi.pedido_id')
                ->leftJoin('mesa as m', 'm.id', '=', 'ped.mesa_id')
                ->join('producto as prod', 'prod.id', '=', 'pi.producto_id')
                ->whereIn('pi.producto_id', $platoIdsAfectados)
                ->whereIn('pi.estado', ['pendiente', 'en_preparacion'])
                ->select([
                    'pi.id as comanda_id',
                    DB::raw("COALESCE(m.codigo, 'Mesa S/N') as mesa_codigo"),
                    'prod.nombre as plato_nombre',
                    'pi.estado as estado_comanda',
                ])
                ->limit(10)
                ->get();

            foreach ($itemsCocina as $com) {
                $pedidosCocinaEnRiesgo[] = [
                    'comanda_id' => $com->comanda_id,
                    'mesa_codigo' => $com->mesa_codigo,
                    'plato_nombre' => $com->plato_nombre,
                    'estado_comanda' => $com->estado_comanda === 'en_preparacion' ? 'En preparación' : 'Pendiente en comandera',
                ];
            }
        }

        return [
            'ficha_id' => $ficha->id,
            'numero_comprobante' => $ficha->numero_comprobante,
            'proveedor_nombre' => $ficha->proveedor_nombre,
            'fecha_emision' => (string) $ficha->fecha_emision,
            'total' => round((float) $ficha->total, 2),
            'insumos_afectados' => $insumosAfectados,
            'platos_que_se_agotaran' => $platosQueSeAgotaran,
            'pedidos_cocina_en_riesgo' => $pedidosCocinaEnRiesgo,
            'requiere_confirmacion_estricta' => count($platosQueSeAgotaran) > 0 || count($pedidosCocinaEnRiesgo) > 0,
        ];
    }

    /**
     * Registra atómicamente una nueva ficha de compra e incrementa existencias.
     * Soporta compras sin enumeración ('S/N' con es_autogenerado = true).
     */
    public function registrar(string $localId, string $usuarioId, array $data): array
    {
        return DB::transaction(function () use ($localId, $usuarioId, $data) {
            $proveedorId = $data['proveedor_id'];
            $tipoComprobante = strtolower(trim($data['tipo_comprobante'] ?? 'factura'));
            $numeroComprobanteRaw = trim((string) ($data['numero_comprobante'] ?? ''));
            $fechaEmision = $data['fecha_emision'] ?? date('Y-m-d');
            $metodoPagoRaw = strtolower(trim((string) ($data['metodo_pago'] ?? 'transferencia')));
            $observaciones = isset($data['observaciones']) ? trim((string) $data['observaciones']) : null;
            $items = $data['items'] ?? [];

            if (empty($items)) {
                throw new \DomainException('Debe incluir al menos un insumo en la compra.');
            }

            // Mapeo seguro de método de pago
            $metodoPagoMap = [
                'transferencia' => 'transferencia',
                'yape_plin' => 'transferencia',
                'efectivo' => 'efectivo',
                'tarjeta_debito' => 'tarjeta_debito',
                'credito_30d' => 'credito_proveedor',
                'credito_proveedor' => 'credito_proveedor',
            ];
            $metodoPago = $metodoPagoMap[$metodoPagoRaw] ?? 'transferencia';

            // Compras sin enumeración (S/N)
            $esAutogenerado = false;
            if ($numeroComprobanteRaw === '' || strtoupper($numeroComprobanteRaw) === 'S/N') {
                $numeroComprobante = 'S/N';
                $esAutogenerado = true;
            } else {
                $numeroComprobante = $numeroComprobanteRaw;
            }

            // Actualizar datos de contacto del proveedor al vuelo si fueron provistos
            if (! empty($data['actualizar_contacto_proveedor'])) {
                $contactoActualizar = array_filter([
                    'telefono' => $data['actualizar_contacto_proveedor']['telefono'] ?? null,
                    'email' => $data['actualizar_contacto_proveedor']['email'] ?? null,
                    'direccion' => $data['actualizar_contacto_proveedor']['direccion'] ?? null,
                ], fn ($v) => $v !== null);

                if (! empty($contactoActualizar)) {
                    $contactoActualizar['updated_at'] = now();
                    DB::table('proveedor')
                        ->where('id', $proveedorId)
                        ->where('local_id', $localId)
                        ->update($contactoActualizar);
                }
            }

            // Cálculo de montos contables (desglose 18% para facturas)
            $totalCalculado = 0.0;
            $itemsProcesados = [];

            foreach ($items as $it) {
                $cantidad = round((float) $it['cantidad'], 4);
                $precioUnitario = round((float) $it['precio_unitario'], 4);
                if ($cantidad <= 0 || $precioUnitario <= 0) {
                    throw new \DomainException('Todos los insumos deben tener cantidad y precio unitario mayores a cero.');
                }
                $subtotalLinea = round($cantidad * $precioUnitario, 2);
                $totalCalculado += $subtotalLinea;

                $itemsProcesados[] = [
                    'insumo_id' => $it['insumo_id'],
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotalLinea,
                ];
            }

            $totalFinal = round($totalCalculado, 2);
            $subtotalNeto = $totalFinal;
            $igvMonto = 0.0;
            $desglosaIgv = false;

            if ($tipoComprobante === 'factura') {
                $desglosaIgv = true;
                $subtotalNeto = round($totalFinal / 1.18, 2);
                $igvMonto = round($totalFinal - $subtotalNeto, 2);
            }

            // 1. Inserción de cabecera de compra
            $fichaId = (string) Str::uuid();
            DB::table('ficha_compra')->insert([
                'id' => $fichaId,
                'local_id' => $localId,
                'proveedor_id' => $proveedorId,
                'usuario_id' => $usuarioId,
                'tipo_comprobante' => $tipoComprobante,
                'numero_comprobante' => $numeroComprobante,
                'es_autogenerado' => $esAutogenerado,
                'fecha_emision' => $fechaEmision,
                'metodo_pago' => $metodoPago,
                'desglosa_igv' => $desglosaIgv,
                'subtotal' => $subtotalNeto,
                'impuestos' => $igvMonto,
                'total' => $totalFinal,
                'moneda' => 'PEN',
                'estado' => 'registrada',
                'notas' => $observaciones,
                'created_at' => now(),
            ]);

            // 2. Inserción de ítems, actualización de stock y costos en insumo
            $insumosActualizadosIds = [];
            foreach ($itemsProcesados as $item) {
                DB::table('ficha_compra_detalle')->insert([
                    'id' => (string) Str::uuid(),
                    'ficha_compra_id' => $fichaId,
                    'insumo_id' => $item['insumo_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Bloqueo y actualización de insumo
                $insumo = DB::table('insumo')
                    ->where('id', $item['insumo_id'])
                    ->where('local_id', $localId)
                    ->lockForUpdate()
                    ->first();

                if (! $insumo) {
                    throw new \DomainException("Insumo {$item['insumo_id']} no existe en esta sede.");
                }

                $stockAnterior = (float) $insumo->stock_actual;
                $stockNuevo = round($stockAnterior + $item['cantidad'], 3);

                DB::table('insumo')
                    ->where('id', $insumo->id)
                    ->update([
                        'stock_actual' => $stockNuevo,
                        'costo_unitario' => $item['precio_unitario'],
                        'ultimo_proveedor_id' => $proveedorId,
                        'fecha_ultima_compra' => now(),
                        'estado' => $stockNuevo > 0 ? 'activo' : $insumo->estado,
                        'updated_at' => now(),
                    ]);

                // Registrar en kardex auditoria_stock_ajuste
                DB::table('auditoria_stock_ajuste')->insert([
                    'id' => (string) Str::uuid(),
                    'local_id' => $localId,
                    'insumo_id' => $insumo->id,
                    'usuario_id' => $usuarioId,
                    'stock_anterior' => $stockAnterior,
                    'stock_nuevo' => $stockNuevo,
                    'diferencia' => $item['cantidad'],
                    'motivo' => 'ingreso_manual',
                    'notas' => "Ingreso por Ficha de Compra #{$numeroComprobante}. Costo unitario: S/ {$item['precio_unitario']}",
                    'created_at' => now(),
                ]);

                // Auto-aprendizaje: asociar insumo como habitual del proveedor en la sede
                DB::table('proveedor_insumo_habitual')->insertOrIgnore([
                    'proveedor_id' => $proveedorId,
                    'insumo_id' => $item['insumo_id'],
                ]);

                $insumosActualizadosIds[] = $insumo->id;
            }

            // 3. Detectar platos de carta que estaban agotados y ahora cuentan con insumos suficientes
            $platosReactivables = [];
            $candidatos = DB::table('producto as p')
                ->join('categoria_producto as cp', 'cp.id', '=', 'p.categoria_id')
                ->where('p.local_id', $localId)
                ->where('p.disponibilidad', 'agotado')
                ->whereExists(function ($q) use ($insumosActualizadosIds) {
                    $q->select(DB::raw(1))
                        ->from('producto_insumo as pi')
                        ->whereColumn('pi.producto_id', 'p.id')
                        ->whereIn('pi.insumo_id', $insumosActualizadosIds);
                })
                ->select([
                    'p.id as plato_id',
                    'p.nombre as plato_nombre',
                    'cp.nombre as categoria_nombre',
                ])
                ->get();

            foreach ($candidatos as $cand) {
                // Verificar si todos sus insumos tienen stock suficiente
                $tieneInsumosFaltantes = DB::table('producto_insumo as pi')
                    ->join('insumo as i', 'i.id', '=', 'pi.insumo_id')
                    ->where('pi.producto_id', $cand->plato_id)
                    ->where(function ($q) {
                        $q->whereColumn('i.stock_actual', '<', 'pi.cantidad_descuenta')
                            ->orWhere('i.stock_actual', '<=', 0);
                    })
                    ->exists();

                if (! $tieneInsumosFaltantes) {
                    $platosReactivables[] = [
                        'id' => $cand->plato_id,
                        'nombre' => $cand->plato_nombre,
                        'categoria' => $cand->categoria_nombre,
                    ];
                }
            }

            $fichaResumen = $this->detalle($fichaId, $localId);

            return [
                'ficha' => $fichaResumen,
                'platosReactivables' => $platosReactivables,
            ];
        });
    }

    /**
     * Anula una ficha de compra ejecutando el procedimiento almacenado
     * con plan de contingencia de piso 0 (GREATEST 0 Floor) y auditoría contable.
     */
    public function anular(string $id, string $localId, string $usuarioId, string $motivo): array
    {
        $ficha = DB::table('ficha_compra')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $ficha) {
            throw new \DomainException('Ficha de compra no encontrada.');
        }

        if ($ficha->estado === 'anulada') {
            throw new \DomainException('La ficha de compra ya se encuentra anulada.');
        }

        // Ejecutar función PL/pgSQL atómica
        $resultadoJson = DB::selectOne(
            'SELECT fn_inventario_anular_compra(?, ?, ?) as res',
            [$id, $usuarioId, $motivo]
        );

        $res = json_decode($resultadoJson->res ?? '{}', true);

        return $this->detalle($id, $localId);
    }

    /**
     * Reactivación batch de platos de la carta seleccionados tras una reposición.
     */
    public function reactivarPlatos(string $localId, array $platoIds): array
    {
        if (empty($platoIds)) {
            return ['actualizados' => 0];
        }

        $actualizados = DB::table('producto')
            ->where('local_id', $localId)
            ->whereIn('id', $platoIds)
            ->update([
                'disponibilidad' => 'disponible',
                'motivo_agotado' => null,
                'updated_at' => now(),
            ]);

        return [
            'actualizados' => $actualizados,
            'mensaje' => "Se reactivaron {$actualizados} plato(s) en la carta exitosamente.",
        ];
    }

    /**
     * Helper de formato DTO canónico compatible con Frontend React.
     */
    private function formatearFichaResumen(object $r): array
    {
        $metodoPagoMap = [
            'transferencia' => 'TRANSFERENCIA',
            'efectivo' => 'EFECTIVO',
            'tarjeta_debito' => 'TRANSFERENCIA',
            'credito_proveedor' => 'CREDITO_30D',
        ];

        return [
            'id' => $r->id,
            'codigo_correlativo' => $r->numero_comprobante,
            'tipo_comprobante' => strtoupper($r->tipo_comprobante),
            'numero_comprobante' => $r->numero_comprobante,
            'proveedor_id' => $r->proveedor_id,
            'proveedor_nombre' => $r->proveedor_nombre,
            'proveedor_telefono' => $r->proveedor_telefono ?? null,
            'fecha_emision' => (string) $r->fecha_emision,
            'fecha_registro' => isset($r->created_at) ? (string) $r->created_at : date('c'),
            'metodo_pago' => $metodoPagoMap[$r->metodo_pago] ?? strtoupper($r->metodo_pago),
            'total' => round((float) $r->total, 2),
            'subtotal_neto' => round((float) $r->subtotal, 2),
            'igv_monto' => round((float) $r->impuestos, 2),
            'cantidad_items' => (int) ($r->cantidad_items ?? 0),
            'estado' => strtoupper($r->estado),
            'registrado_por_nombre' => $r->registrado_por_nombre ?? 'Administrador',
            'motivo_anulacion' => $r->motivo_anulacion ?? null,
            'fecha_anulacion' => isset($r->anulado_at) ? (string) $r->anulado_at : null,
        ];
    }
}
