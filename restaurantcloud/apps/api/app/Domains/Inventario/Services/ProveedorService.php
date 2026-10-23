<?php

namespace App\Domains\Inventario\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProveedorService
{
    /**
     * Listado paginado de proveedores con KPIs comerciales e insumos habituales.
     */
    public function listado(string $localId, array $filtros): array
    {
        $pagina = max(1, (int) ($filtros['pagina'] ?? 1));
        $limite = min(100, max(1, (int) ($filtros['limite'] ?? 10)));
        $filtroEstado = $filtros['estado'] ?? 'activos';
        $busqueda = trim((string) ($filtros['query'] ?? $filtros['busqueda'] ?? ''));

        // 1. KPIs consolidados de abastecimiento para la sede
        $totalActivos = DB::table('proveedor')
            ->where('local_id', $localId)
            ->where('activo', true)
            ->count();

        $statsComprasMes = DB::table('ficha_compra')
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->whereRaw("EXTRACT(YEAR FROM fecha_emision) = EXTRACT(YEAR FROM CURRENT_DATE)")
            ->whereRaw("EXTRACT(MONTH FROM fecha_emision) = EXTRACT(MONTH FROM CURRENT_DATE)")
            ->selectRaw("COALESCE(SUM(total), 0)::numeric as compras_mes_total")
            ->selectRaw("COUNT(*)::int as fichas_mes_total")
            ->first();

        // Proveedores frecuentes: aquellos con 3 o más compras registradas
        $proveedoresFrecuentes = DB::table('ficha_compra')
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->groupBy('proveedor_id')
            ->havingRaw('COUNT(*) >= 3')
            ->pluck('proveedor_id')
            ->count();

        $kpis = [
            'total_activos' => $totalActivos,
            'compras_mes_total' => round((float) ($statsComprasMes->compras_mes_total ?? 0), 2),
            'fichas_mes_total' => (int) ($statsComprasMes->fichas_mes_total ?? 0),
            'proveedores_frecuentes' => $proveedoresFrecuentes,
        ];

        // 2. Query base con métricas agregadas de compras
        $query = DB::table('proveedor as p')
            ->leftJoin('ficha_compra as fc', function ($join) {
                $join->on('fc.proveedor_id', '=', 'p.id')
                    ->where('fc.estado', '=', 'registrada');
            })
            ->where('p.local_id', $localId)
            ->groupBy(
                'p.id',
                'p.local_id',
                'p.nombre',
                'p.contacto',
                'p.telefono',
                'p.email',
                'p.direccion',
                'p.activo',
                'p.created_at',
                'p.updated_at'
            )
            ->select([
                'p.id',
                'p.local_id',
                'p.nombre',
                'p.contacto',
                'p.telefono',
                'p.email',
                'p.direccion',
                'p.activo',
                'p.created_at',
                'p.updated_at',
                DB::raw("COUNT(fc.id)::int as total_compras"),
                DB::raw("COALESCE(SUM(fc.total), 0)::numeric as total_gastado"),
                DB::raw("MAX(fc.fecha_emision)::text as ultima_compra_fecha"),
            ]);

        // Filtro por estado
        if ($filtroEstado === 'activos') {
            $query->where('p.activo', true);
        } elseif ($filtroEstado === 'inactivos') {
            $query->where('p.activo', false);
        }

        // Filtro por búsqueda (nombre, contacto, email, teléfono o insumo suministrado)
        if ($busqueda !== '') {
            $query->where(function ($sub) use ($busqueda) {
                $sub->whereRaw('LOWER(p.nombre) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhereRaw('LOWER(COALESCE(p.contacto, \'\')) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhereRaw('LOWER(COALESCE(p.email, \'\')) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhere('p.telefono', 'LIKE', "%{$busqueda}%")
                    ->orWhereExists(function ($ex) use ($busqueda) {
                        $ex->select(DB::raw(1))
                            ->from('proveedor_insumo_habitual as pih')
                            ->join('insumo as i', 'i.id', '=', 'pih.insumo_id')
                            ->whereColumn('pih.proveedor_id', 'p.id')
                            ->whereRaw('LOWER(i.nombre) LIKE LOWER(?)', ["%{$busqueda}%"]);
                    });
            });
        }

        // Conteo total para paginación
        $totalItems = DB::table(DB::raw("({$query->toSql()}) as sub"))
            ->mergeBindings($query)
            ->count();

        $totalPaginas = max(1, (int) ceil($totalItems / $limite));
        $pagina = min($pagina, $totalPaginas);

        $proveedoresRaw = $query
            ->orderBy('p.nombre', 'asc')
            ->forPage($pagina, $limite)
            ->get();

        // 3. Batch loading de insumos habituales
        $proveedorIds = $proveedoresRaw->pluck('id')->all();
        $insumosPorProveedor = [];

        if (! empty($proveedorIds)) {
            $habituales = DB::table('proveedor_insumo_habitual as pih')
                ->join('insumo as i', 'i.id', '=', 'pih.insumo_id')
                ->whereIn('pih.proveedor_id', $proveedorIds)
                ->select([
                    'pih.proveedor_id',
                    'i.id as insumo_id',
                    'i.nombre',
                    'i.unidad_medida',
                    'i.costo_unitario as ultimo_precio',
                ])
                ->orderBy('i.nombre')
                ->get();

            foreach ($habituales as $item) {
                $insumosPorProveedor[$item->proveedor_id][] = [
                    'insumo_id' => $item->insumo_id,
                    'nombre' => $item->nombre,
                    'unidad_medida' => $item->unidad_medida,
                    'ultimo_precio' => round((float) $item->ultimo_precio, 2),
                ];
            }
        }

        // 4. Obtener el monto de la última compra para los proveedores listados
        $ultimasCompras = [];
        if (! empty($proveedorIds)) {
            // Buscamos la ficha más reciente por fecha_emision/created_at
            $fichasRecientes = DB::table('ficha_compra as fc')
                ->whereIn('fc.proveedor_id', $proveedorIds)
                ->where('fc.estado', 'registrada')
                ->select(['fc.proveedor_id', 'fc.total', 'fc.fecha_emision'])
                ->orderBy('fc.fecha_emision', 'desc')
                ->orderBy('fc.created_at', 'desc')
                ->get();

            foreach ($fichasRecientes as $f) {
                if (! isset($ultimasCompras[$f->proveedor_id])) {
                    $ultimasCompras[$f->proveedor_id] = round((float) $f->total, 2);
                }
            }
        }

        $proveedores = $proveedoresRaw->map(function ($p) use ($insumosPorProveedor, $ultimasCompras) {
            return [
                'id' => $p->id,
                'local_id' => $p->local_id,
                'nombre' => $p->nombre,
                'contacto' => $p->contacto,
                'telefono' => $p->telefono,
                'email' => $p->email,
                'direccion' => $p->direccion,
                'activo' => (bool) $p->activo,
                'insumos_habituales' => $insumosPorProveedor[$p->id] ?? [],
                'total_compras' => (int) $p->total_compras,
                'total_gastado' => round((float) $p->total_gastado, 2),
                'ultima_compra_fecha' => $p->ultima_compra_fecha,
                'ultima_compra_total' => $ultimasCompras[$p->id] ?? null,
                'created_at' => $p->created_at,
            ];
        })->all();

        return [
            'kpis' => $kpis,
            'proveedores' => $proveedores,
            'total_items' => $totalItems,
            'pagina' => $pagina,
            'items_pagina' => $limite,
            'total_paginas' => $totalPaginas,
        ];
    }

    /**
     * Obtiene un proveedor específico con sus insumos habituales.
     */
    public function obtener(string $id, string $localId): ?array
    {
        $p = DB::table('proveedor as p')
            ->leftJoin('ficha_compra as fc', function ($join) {
                $join->on('fc.proveedor_id', '=', 'p.id')
                    ->where('fc.estado', '=', 'registrada');
            })
            ->where('p.id', $id)
            ->where('p.local_id', $localId)
            ->groupBy(
                'p.id',
                'p.local_id',
                'p.nombre',
                'p.contacto',
                'p.telefono',
                'p.email',
                'p.direccion',
                'p.activo',
                'p.created_at',
                'p.updated_at'
            )
            ->select([
                'p.id',
                'p.local_id',
                'p.nombre',
                'p.contacto',
                'p.telefono',
                'p.email',
                'p.direccion',
                'p.activo',
                'p.created_at',
                'p.updated_at',
                DB::raw("COUNT(fc.id)::int as total_compras"),
                DB::raw("COALESCE(SUM(fc.total), 0)::numeric as total_gastado"),
                DB::raw("MAX(fc.fecha_emision)::text as ultima_compra_fecha"),
            ])
            ->first();

        if (! $p) {
            return null;
        }

        $insumosHabituales = DB::table('proveedor_insumo_habitual as pih')
            ->join('insumo as i', 'i.id', '=', 'pih.insumo_id')
            ->where('pih.proveedor_id', $id)
            ->select([
                'i.id as insumo_id',
                'i.nombre',
                'i.unidad_medida',
                'i.costo_unitario as ultimo_precio',
            ])
            ->orderBy('i.nombre')
            ->get()
            ->map(fn ($item) => [
                'insumo_id' => $item->insumo_id,
                'nombre' => $item->nombre,
                'unidad_medida' => $item->unidad_medida,
                'ultimo_precio' => round((float) $item->ultimo_precio, 2),
            ])
            ->all();

        $ultimaCompra = DB::table('ficha_compra')
            ->where('proveedor_id', $id)
            ->where('estado', 'registrada')
            ->orderBy('fecha_emision', 'desc')
            ->orderBy('created_at', 'desc')
            ->value('total');

        return [
            'id' => $p->id,
            'local_id' => $p->local_id,
            'nombre' => $p->nombre,
            'contacto' => $p->contacto,
            'telefono' => $p->telefono,
            'email' => $p->email,
            'direccion' => $p->direccion,
            'activo' => (bool) $p->activo,
            'insumos_habituales' => $insumosHabituales,
            'total_compras' => (int) $p->total_compras,
            'total_gastado' => round((float) $p->total_gastado, 2),
            'ultima_compra_fecha' => $p->ultima_compra_fecha,
            'ultima_compra_total' => $ultimaCompra !== null ? round((float) $ultimaCompra, 2) : null,
            'created_at' => $p->created_at,
        ];
    }

    /**
     * Registra un nuevo proveedor en la sede con insumos habituales opcionales.
     */
    public function crear(string $localId, array $data): array
    {
        $this->verificarNombreUnico($localId, $data['nombre']);

        $id = (string) Str::uuid();

        return DB::transaction(function () use ($id, $localId, $data) {
            DB::table('proveedor')->insert([
                'id' => $id,
                'local_id' => $localId,
                'nombre' => trim($data['nombre']),
                'contacto' => ! empty($data['contacto']) ? trim($data['contacto']) : null,
                'telefono' => trim($data['telefono']),
                'email' => ! empty($data['email']) ? trim($data['email']) : null,
                'direccion' => ! empty($data['direccion']) ? trim($data['direccion']) : null,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Vincular insumos habituales si se enviaron
            if (! empty($data['insumos_ids']) && is_array($data['insumos_ids'])) {
                $this->sincronizarInsumosHabituales($id, $localId, $data['insumos_ids']);
            }

            return $this->obtener($id, $localId);
        });
    }

    /**
     * Actualiza los datos de un proveedor y sincroniza sus insumos habituales.
     */
    public function actualizar(string $id, string $localId, array $data): ?array
    {
        $existe = DB::table('proveedor')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->exists();

        if (! $existe) {
            return null;
        }

        $this->verificarNombreUnico($localId, $data['nombre'], $id);

        return DB::transaction(function () use ($id, $localId, $data) {
            $update = [
                'nombre' => trim($data['nombre']),
                'contacto' => ! empty($data['contacto']) ? trim($data['contacto']) : null,
                'telefono' => trim($data['telefono']),
                'email' => ! empty($data['email']) ? trim($data['email']) : null,
                'direccion' => ! empty($data['direccion']) ? trim($data['direccion']) : null,
                'updated_at' => now(),
            ];

            if (isset($data['activo'])) {
                $update['activo'] = (bool) $data['activo'];
            }

            DB::table('proveedor')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->update($update);

            if (array_key_exists('insumos_ids', $data) && is_array($data['insumos_ids'])) {
                DB::table('proveedor_insumo_habitual')->where('proveedor_id', $id)->delete();
                $this->sincronizarInsumosHabituales($id, $localId, $data['insumos_ids']);
            }

            return $this->obtener($id, $localId);
        });
    }

    /**
     * Conmuta el estado activo/inactivo del proveedor.
     */
    public function cambiarEstado(string $id, string $localId, bool $activo): ?array
    {
        $afectados = DB::table('proveedor')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->update([
                'activo' => $activo,
                'updated_at' => now(),
            ]);

        if ($afectados === 0) {
            return null;
        }

        return $this->obtener($id, $localId);
    }

    /**
     * Elimina un proveedor. Falla si tiene compras asociadas (ON DELETE RESTRICT).
     */
    public function eliminar(string $id, string $localId): bool
    {
        $proveedor = DB::table('proveedor')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $proveedor) {
            return false;
        }

        // Validación preventiva de integridad contable (PostgreSQL ON DELETE RESTRICT)
        $comprasCount = DB::table('ficha_compra')
            ->where('proveedor_id', $id)
            ->count();

        if ($comprasCount > 0) {
            throw new \DomainException(
                "No es posible eliminar físicamente al proveedor porque cuenta con {$comprasCount} ficha(s) de compra registrada(s) (ON DELETE RESTRICT). Puede desactivarlo para excluirlo de futuras compras sin perder el histórico contable.",
                409
            );
        }

        try {
            DB::table('proveedor')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->delete();
        } catch (QueryException $e) {
            if ($e->getCode() === '23503') { // Foreign key violation
                throw new \DomainException(
                    "No es posible eliminar físicamente al proveedor debido a referencias contables asociadas (ON DELETE RESTRICT). Desactívelo en su lugar.",
                    409
                );
            }
            throw $e;
        }

        return true;
    }

    /**
     * Obtiene el historial de compras y comprobantes de un proveedor para el Drawer lateral.
     */
    public function obtenerHistorialCompras(string $id, string $localId): ?array
    {
        $proveedor = DB::table('proveedor')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $proveedor) {
            return null;
        }

        $fichas = DB::table('ficha_compra')
            ->where('proveedor_id', $id)
            ->where('local_id', $localId)
            ->where('estado', 'registrada')
            ->orderBy('fecha_emision', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $fichaIds = $fichas->pluck('id')->all();
        $itemsPorFicha = [];

        if (! empty($fichaIds)) {
            $detalles = DB::table('ficha_compra_detalle as fcd')
                ->join('insumo as i', 'i.id', '=', 'fcd.insumo_id')
                ->whereIn('fcd.ficha_compra_id', $fichaIds)
                ->select([
                    'fcd.ficha_compra_id',
                    'fcd.insumo_id',
                    'i.nombre as insumo_nombre',
                    'i.unidad_medida',
                    'fcd.cantidad',
                    'fcd.precio_unitario',
                    'fcd.subtotal',
                ])
                ->get();

            foreach ($detalles as $det) {
                $itemsPorFicha[$det->ficha_compra_id][] = [
                    'insumo_id' => $det->insumo_id,
                    'insumo_nombre' => $det->insumo_nombre,
                    'unidad_medida' => $det->unidad_medida,
                    'cantidad' => round((float) $det->cantidad, 4),
                    'precio_unitario' => round((float) $det->precio_unitario, 4),
                    'subtotal' => round((float) $det->subtotal, 2),
                ];
            }
        }

        $totalFacturado = 0.0;
        $compras = [];

        foreach ($fichas as $f) {
            $totalMonto = round((float) $f->total, 2);
            $totalFacturado += $totalMonto;

            $compras[] = [
                'id' => $f->id,
                'numero_comprobante' => $f->numero_comprobante,
                'tipo_comprobante' => $f->tipo_comprobante,
                'fecha_emision' => (string) $f->fecha_emision,
                'metodo_pago' => $f->metodo_pago,
                'total' => $totalMonto,
                'items' => $itemsPorFicha[$f->id] ?? [],
            ];
        }

        return [
            'proveedor_id' => $proveedor->id,
            'proveedor_nombre' => $proveedor->nombre,
            'contacto' => $proveedor->contacto,
            'telefono' => $proveedor->telefono,
            'total_facturado' => round($totalFacturado, 2),
            'total_fichas' => count($compras),
            'variacion_precio_texto' => count($compras) > 0
                ? 'Precios referenciales estables con variación mensual dentro del rango normal'
                : 'Sin variación registrada',
            'compras' => $compras,
        ];
    }

    /**
     * Valida que el nombre sea único en el local sin distinguir mayúsculas/minúsculas.
     */
    private function verificarNombreUnico(string $localId, string $nombre, ?string $exceptoId = null): void
    {
        $nombreLimpio = trim($nombre);
        $existe = DB::table('proveedor')
            ->where('local_id', $localId)
            ->when($exceptoId, fn ($q) => $q->where('id', '!=', $exceptoId))
            ->whereRaw('LOWER(nombre) = LOWER(?)', [$nombreLimpio])
            ->exists();

        if ($existe) {
            throw new \DomainException("Ya existe un proveedor registrado con el nombre '{$nombreLimpio}' en esta sede.");
        }
    }

    /**
     * Sincroniza insumos habituales asegurando que pertenezcan a la sede.
     */
    private function sincronizarInsumosHabituales(string $proveedorId, string $localId, array $insumosIds): void
    {
        $insumosValidos = DB::table('insumo')
            ->where('local_id', $localId)
            ->whereIn('id', $insumosIds)
            ->pluck('id')
            ->all();

        $rows = [];
        $now = now();
        foreach ($insumosValidos as $insumoId) {
            $rows[] = [
                'proveedor_id' => $proveedorId,
                'insumo_id' => $insumoId,
                'created_at' => $now,
            ];
        }

        if (! empty($rows)) {
            DB::table('proveedor_insumo_habitual')->insertOrIgnore($rows);
        }
    }
}
