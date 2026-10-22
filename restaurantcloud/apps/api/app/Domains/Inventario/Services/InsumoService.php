<?php

namespace App\Domains\Inventario\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InsumoService
{
    private const UNIDADES_VALIDAS = [
        'kg', 'L', 'und', 'botella', 'saco', 'lata', 'caja', 'paquete', 'bidon', 'jaba'
    ];

    public function listado(string $localId, array $filtros): array
    {
        $pagina = max(1, (int) ($filtros['pagina'] ?? 1));
        $limite = min(200, max(1, (int) ($filtros['limite'] ?? 10)));
        $filtroEstado = $filtros['estado'] ?? 'activo';
        $busqueda = trim((string) ($filtros['busqueda'] ?? ''));

        // KPIs consolidados de la sede
        $kpis = DB::table('insumo')
            ->where('local_id', $localId)
            ->selectRaw("COUNT(*) FILTER (WHERE estado = 'activo')::int as total_activos")
            ->selectRaw("COUNT(*) FILTER (WHERE estado = 'agotado')::int as total_agotados")
            ->selectRaw("COUNT(*) FILTER (WHERE estado = 'inactivo')::int as total_inactivos")
            ->selectRaw("COALESCE(SUM(stock_actual * costo_unitario), 0)::numeric as valorizacion_total")
            ->first();

        // Consulta base con join opcional a proveedor
        $query = DB::table('insumo as i')
            ->leftJoin('proveedor as prov', 'prov.id', '=', 'i.ultimo_proveedor_id')
            ->where('i.local_id', $localId)
            ->select([
                'i.id', 'i.local_id', 'i.nombre', 'i.unidad_medida',
                'i.stock_actual', 'i.stock_minimo', 'i.costo_unitario', 'i.moneda',
                'i.ultimo_proveedor_id', 'prov.nombre as ultimo_proveedor_nombre',
                'i.fecha_ultima_compra', 'i.estado', 'i.created_at', 'i.updated_at'
            ]);

        // Filtro por estado
        if ($filtroEstado !== 'todos' && in_array($filtroEstado, ['activo', 'agotado', 'inactivo'], true)) {
            $query->where('i.estado', $filtroEstado);
        }

        // Búsqueda por nombre
        if ($busqueda !== '') {
            $query->whereRaw('LOWER(i.nombre) LIKE LOWER(?)', ["%{$busqueda}%"]);
        }

        $total = $query->count();
        $totalPaginas = max(1, (int) ceil($total / $limite));
        $pagina = min($pagina, $totalPaginas);

        $insumos = $query
            ->orderBy('i.nombre')
            ->forPage($pagina, $limite)
            ->get()
            ->map(fn ($insumo) => $this->mapearInsumo($insumo))
            ->all();

        $local = DB::table('local')->where('id', $localId)->first();

        return [
            'local_id' => $localId,
            'local_nombre' => $local->nombre ?? 'Sede Principal',
            'kpis' => [
                'total_activos' => (int) ($kpis->total_activos ?? 0),
                'total_agotados' => (int) ($kpis->total_agotados ?? 0),
                'total_inactivos' => (int) ($kpis->total_inactivos ?? 0),
                'valorizacion_total' => round((float) ($kpis->valorizacion_total ?? 0), 2),
            ],
            'filtro_actual' => in_array($filtroEstado, ['activo', 'agotado', 'inactivo', 'todos'], true) ? $filtroEstado : 'activo',
            'insumos' => $insumos,
            'paginacion' => [
                'total' => $total,
                'pagina' => $pagina,
                'limite' => $limite,
                'total_paginas' => $totalPaginas,
            ],
        ];
    }

    public function obtener(string $id, string $localId): ?array
    {
        $insumo = DB::table('insumo as i')
            ->leftJoin('proveedor as prov', 'prov.id', '=', 'i.ultimo_proveedor_id')
            ->where('i.id', $id)
            ->where('i.local_id', $localId)
            ->select([
                'i.id', 'i.local_id', 'i.nombre', 'i.unidad_medida',
                'i.stock_actual', 'i.stock_minimo', 'i.costo_unitario', 'i.moneda',
                'i.ultimo_proveedor_id', 'prov.nombre as ultimo_proveedor_nombre',
                'i.fecha_ultima_compra', 'i.estado', 'i.created_at', 'i.updated_at'
            ])
            ->first();

        return $insumo ? $this->mapearInsumo($insumo) : null;
    }

    public function crear(string $localId, array $data): array
    {
        $this->validarUnidad($data['unidad_medida'] ?? '');
        $this->verificarNombreUnico($localId, $data['nombre']);

        $id = (string) Str::uuid();
        $stockActual = (float) ($data['stock_actual'] ?? 0);
        $estado = $data['estado'] ?? ($stockActual > 0 ? 'activo' : 'agotado');

        try {
            DB::table('insumo')->insert([
                'id' => $id,
                'local_id' => $localId,
                'nombre' => trim($data['nombre']),
                'unidad_medida' => $data['unidad_medida'],
                'stock_actual' => $stockActual,
                'stock_minimo' => (float) ($data['stock_minimo'] ?? 0),
                'costo_unitario' => (float) ($data['costo_unitario'] ?? 0),
                'moneda' => 'PEN',
                'estado' => $estado,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (QueryException $e) {
            $this->convertirErrorUnico($e, $data['nombre']);
            throw $e;
        }

        return $this->obtener($id, $localId);
    }

    public function actualizar(string $id, string $localId, array $data): ?array
    {
        $insumo = DB::table('insumo')->where('id', $id)->where('local_id', $localId)->first();
        if (! $insumo) return null;

        $this->validarUnidad($data['unidad_medida'] ?? $insumo->unidad_medida);
        $this->verificarNombreUnico($localId, $data['nombre'], $id);

        try {
            DB::table('insumo')->where('id', $id)->update([
                'nombre' => trim($data['nombre']),
                'unidad_medida' => $data['unidad_medida'],
                'stock_minimo' => (float) ($data['stock_minimo'] ?? $insumo->stock_minimo),
                'costo_unitario' => (float) ($data['costo_unitario'] ?? $insumo->costo_unitario),
                'updated_at' => now(),
            ]);
        } catch (QueryException $e) {
            $this->convertirErrorUnico($e, $data['nombre']);
            throw $e;
        }

        return $this->obtener($id, $localId);
    }

    public function ajustarStock(string $id, string $localId, string $usuarioId, array $data): array
    {
        $stockFisico = (float) $data['stock_fisico'];
        $motivo = $data['motivo'];
        $notas = $data['notas'] ?? null;

        $resultado = DB::selectOne(
            'SELECT fn_inventario_ajustar_stock(?, ?, ?, ?, ?, ?) as payload',
            [$id, $localId, $usuarioId, $stockFisico, $motivo, $notas]
        );

        if (! $resultado || empty($resultado->payload)) {
            throw new \RuntimeException('No se pudo procesar el ajuste de inventario.');
        }

        return json_decode($resultado->payload, true);
    }

    public function cambiarEstado(string $id, string $localId, string $nuevoEstado): ?array
    {
        if (! in_array($nuevoEstado, ['activo', 'agotado', 'inactivo'], true)) {
            throw new \InvalidArgumentException('Estado de insumo inválido.');
        }

        $insumo = DB::table('insumo')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->first();

        if (! $insumo) {
            return null;
        }

        DB::table('insumo')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->update([
                'estado' => $nuevoEstado,
                'updated_at' => now(),
            ]);

        // Si se apaga el insumo, conmutar platos dependientes a agotado
        if (in_array($nuevoEstado, ['agotado', 'inactivo'], true)) {
            DB::table('producto as p')
                ->join('producto_insumo as pi', 'pi.producto_id', '=', 'p.id')
                ->where('pi.insumo_id', $id)
                ->where('p.local_id', $localId)
                ->where('p.disponibilidad', 'disponible')
                ->update([
                    'p.disponibilidad' => 'agotado',
                    'p.motivo_agotado' => 'quiebre_stock_receta',
                    'p.updated_at' => now(),
                ]);
        }

        return $this->obtener($id, $localId);
    }

    public function obtenerAuditorias(string $localId, ?string $insumoId = null): array
    {
        return DB::table('auditoria_stock_ajuste as a')
            ->join('insumo as i', 'i.id', '=', 'a.insumo_id')
            ->join('usuario as u', 'u.id', '=', 'a.usuario_id')
            ->where('a.local_id', $localId)
            ->when($insumoId, fn ($q) => $q->where('a.insumo_id', $insumoId))
            ->select([
                'a.id', 'a.local_id', 'a.insumo_id', 'i.nombre as insumo_nombre',
                'a.usuario_id', 'u.nombre as usuario_nombre',
                'a.stock_anterior', 'a.stock_nuevo', 'a.diferencia',
                'a.motivo', 'a.notas', 'a.created_at'
            ])
            ->orderByDesc('a.created_at')
            ->limit(50)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'local_id' => $r->local_id,
                'insumo_id' => $r->insumo_id,
                'insumo_nombre' => $r->insumo_nombre,
                'usuario_id' => $r->usuario_id,
                'usuario_nombre' => $r->usuario_nombre,
                'stock_anterior' => (float) $r->stock_anterior,
                'stock_nuevo' => (float) $r->stock_nuevo,
                'diferencia' => (float) $r->diferencia,
                'motivo' => $r->motivo,
                'notas' => $r->notas,
                'created_at' => $r->created_at,
            ])
            ->all();
    }

    private function mapearInsumo(object $insumo): array
    {
        $stockActual = (float) $insumo->stock_actual;
        $stockMinimo = (float) $insumo->stock_minimo;

        // Semáforo cromático canónico
        $semaforo = 'optimo';
        if ($stockActual == 0) {
            $semaforo = 'sin_stock';
        } elseif ($stockActual <= $stockMinimo) {
            $semaforo = 'critico';
        } elseif ($stockActual <= ($stockMinimo * 1.5)) {
            $semaforo = 'reposicion';
        }

        // Platos dependientes de la receta culinaria
        $platos = DB::table('producto_insumo as pi')
            ->join('producto as p', 'p.id', '=', 'pi.producto_id')
            ->where('pi.insumo_id', $insumo->id)
            ->pluck('p.nombre')
            ->all();

        return [
            'id' => $insumo->id,
            'local_id' => $insumo->local_id,
            'nombre' => $insumo->nombre,
            'unidad_medida' => $insumo->unidad_medida,
            'stock_actual' => $stockActual,
            'stock_minimo' => $stockMinimo,
            'nivel_semaforo' => $semaforo,
            'costo_unitario' => (float) $insumo->costo_unitario,
            'moneda' => $insumo->moneda,
            'ultimo_proveedor_id' => $insumo->ultimo_proveedor_id,
            'ultimo_proveedor_nombre' => $insumo->ultimo_proveedor_nombre,
            'fecha_ultima_compra' => $insumo->fecha_ultima_compra,
            'estado' => $insumo->estado,
            'platos_afectados_si_quiebra' => count($platos),
            'platos_detalle' => $platos,
            'created_at' => $insumo->created_at,
            'updated_at' => $insumo->updated_at,
        ];
    }

    private function validarUnidad(string $unidad): void
    {
        if (! in_array($unidad, self::UNIDADES_VALIDAS, true)) {
            throw new \InvalidArgumentException("La unidad de medida \"{$unidad}\" no es válida. Use una de las 10 unidades universales.");
        }
    }

    private function verificarNombreUnico(string $localId, string $nombre, ?string $exceptoId = null): void
    {
        $existe = DB::table('insumo')
            ->where('local_id', $localId)
            ->when($exceptoId, fn ($q) => $q->where('id', '!=', $exceptoId))
            ->whereRaw('LOWER(nombre) = LOWER(?)', [trim($nombre)])
            ->exists();

        if ($existe) {
            throw new \DomainException("Ya existe un insumo con el nombre \"{$nombre}\" en esta sede.");
        }
    }

    private function convertirErrorUnico(QueryException $exception, string $nombre): void
    {
        if ($exception->getCode() === '23505') {
            throw new \DomainException("Ya existe un insumo con el nombre \"{$nombre}\" en esta sede.");
        }
    }
}
