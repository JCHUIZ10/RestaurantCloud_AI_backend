<?php

namespace App\Domains\Carta\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductoService
{
    public function listado(string $localId, array $filtros): array
    {
        $pagina = max(1, (int) ($filtros['pagina'] ?? 1));
        $limite = min(50, max(1, (int) ($filtros['limite'] ?? 10)));

        $base = $this->consultaBase($localId)->where('p.activo', true);
        $kpis = DB::table('producto as p')
            ->where('p.local_id', $localId)
            ->where('p.activo', true)
            ->selectRaw('COUNT(*)::int as total_productos')
            ->selectRaw("COUNT(*) FILTER (WHERE p.disponibilidad = 'disponible')::int as disponibles")
            ->selectRaw("COUNT(*) FILTER (WHERE p.disponibilidad = 'agotado')::int as agotados")
            ->selectRaw(
                "COALESCE(AVG(CASE WHEN p.precio > 0 THEN ((p.precio - p.costo_estandar) / p.precio) * 100 ELSE 0 END), 0) as margen_promedio",
            )
            ->first();

        $consulta = clone $base;

        if (($filtros['categoria_id'] ?? null) && $filtros['categoria_id'] !== 'todas') {
            $consulta->where('p.categoria_id', $filtros['categoria_id']);
        }

        if (in_array($filtros['disponibilidad'] ?? 'todos', ['disponible', 'agotado'], true)) {
            $consulta->where('p.disponibilidad', $filtros['disponibilidad']);
        }

        if ($busqueda = trim((string) ($filtros['busqueda'] ?? ''))) {
            $consulta->where(function ($query) use ($busqueda): void {
                $query->whereRaw('LOWER(p.nombre) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhereRaw('LOWER(COALESCE(p.descripcion, \'\')) LIKE LOWER(?)', ["%{$busqueda}%"])
                    ->orWhereRaw('LOWER(c.nombre) LIKE LOWER(?)', ["%{$busqueda}%"]);
            });
        }

        $total = $consulta->count();
        $totalPaginas = max(1, (int) ceil($total / $limite));
        $pagina = min($pagina, $totalPaginas);

        $productos = $consulta
            ->orderBy('c.orden')
            ->orderBy('p.nombre')
            ->forPage($pagina, $limite)
            ->get()
            ->map(fn ($producto) => $this->mapearProducto($producto))
            ->all();

        return [
            'kpis' => [
                'total_productos' => (int) $kpis->total_productos,
                'disponibles' => (int) $kpis->disponibles,
                'agotados' => (int) $kpis->agotados,
                'margen_promedio' => round((float) $kpis->margen_promedio, 1),
            ],
            'productos' => $productos,
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
        $producto = $this->consultaBase($localId)->where('p.id', $id)->first();

        return $producto ? $this->mapearProducto($producto) : null;
    }

    public function crear(string $localId, array $data): array
    {
        return DB::transaction(function () use ($localId, $data): array {
            $this->verificarCategoria($data['categoria_id'], $localId);
            $this->verificarNombre($localId, $data['nombre']);

            $id = (string) Str::uuid();

            try {
                DB::table('producto')->insert([
                    'id' => $id,
                    'local_id' => $localId,
                    'categoria_id' => $data['categoria_id'],
                    'nombre' => trim($data['nombre']),
                    'descripcion' => $data['descripcion'] ?? null,
                    'precio' => $data['precio'],
                    'foto_url' => $data['foto_url'] ?? null,
                    'requiere_preparacion' => $data['requiere_preparacion'],
                    'disponibilidad' => 'disponible',
                    'activo' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (QueryException $exception) {
                $this->convertirErrorUnico($exception, $data['nombre']);
                throw $exception;
            }

            return $this->obtener($id, $localId);
        });
    }

    public function actualizar(string $id, string $localId, array $data): ?array
    {
        return DB::transaction(function () use ($id, $localId, $data): ?array {
            $producto = DB::table('producto')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->where('activo', true)
                ->lockForUpdate()
                ->first();

            if (! $producto) {
                return null;
            }

            $this->verificarCategoria($data['categoria_id'], $localId);
            $this->verificarNombre($localId, $data['nombre'], $id);

            try {
                DB::table('producto')->where('id', $id)->update([
                    'categoria_id' => $data['categoria_id'],
                    'nombre' => trim($data['nombre']),
                    'descripcion' => $data['descripcion'] ?? null,
                    'precio' => $data['precio'],
                    'foto_url' => $data['foto_url'] ?? null,
                    'requiere_preparacion' => $data['requiere_preparacion'],
                    'updated_at' => now(),
                ]);
            } catch (QueryException $exception) {
                $this->convertirErrorUnico($exception, $data['nombre']);
                throw $exception;
            }

            return $this->obtener($id, $localId);
        });
    }

    public function cambiarDisponibilidad(
        string $id,
        string $localId,
        string $usuarioId,
        string $disponibilidad,
    ): ?array
    {
        $actualizado = DB::table('producto')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->where('activo', true)
            ->update([
                'disponibilidad' => $disponibilidad,
                'motivo_agotado' => $disponibilidad === 'agotado' ? 'decision_admin' : null,
                'usuario_modifico_disp_id' => $usuarioId,
                'fecha_modificacion_disp' => now(),
                'updated_at' => now(),
            ]);

        return $actualizado ? $this->obtener($id, $localId) : null;
    }

    public function archivar(string $id, string $localId): ?array
    {
        $producto = DB::table('producto')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->where('activo', true)
            ->first();

        if (! $producto) {
            return null;
        }

        DB::table('producto')->where('id', $id)->update([
            'activo' => false,
            'updated_at' => now(),
        ]);

        return [
            'producto_id' => $id,
            'mensaje' => "El producto \"{$producto->nombre}\" fue archivado de la carta.",
        ];
    }

    private function consultaBase(string $localId)
    {
        return DB::table('producto as p')
            ->join('categoria_producto as c', 'c.id', '=', 'p.categoria_id')
            ->where('p.local_id', $localId)
            ->select([
                'p.id', 'p.local_id', 'p.categoria_id', 'c.nombre as categoria_nombre',
                'p.nombre', 'p.descripcion', 'p.precio', 'p.costo_estandar', 'p.moneda',
                'p.foto_url', 'p.disponibilidad', 'p.motivo_agotado',
                'p.requiere_preparacion', 'p.activo', 'p.created_at', 'p.updated_at', 'c.orden as categoria_orden',
            ]);
    }

    private function mapearProducto(object $producto): array
    {
        $precio = (float) $producto->precio;
        $costoEstandar = (float) $producto->costo_estandar;

        return [
            'id' => $producto->id,
            'local_id' => $producto->local_id,
            'categoria_id' => $producto->categoria_id,
            'categoria_nombre' => $producto->categoria_nombre,
            'nombre' => $producto->nombre,
            'descripcion' => $producto->descripcion,
            'precio' => $precio,
            'costo_estandar' => $costoEstandar,
            'costo_teorico' => 0,
            'margen_bruto_pct' => $precio > 0 ? round((($precio - $costoEstandar) / $precio) * 100, 1) : 0,
            'moneda' => $producto->moneda,
            'foto_url' => $producto->foto_url,
            'disponibilidad' => $producto->disponibilidad,
            'motivo_agotado' => $producto->motivo_agotado,
            'requiere_preparacion' => (bool) $producto->requiere_preparacion,
            'activo' => (bool) $producto->activo,
            'total_ingredientes' => 0,
            'insumos_en_quiebre' => 0,
            'receta' => [],
            'created_at' => $producto->created_at,
            'updated_at' => $producto->updated_at,
        ];
    }

    private function verificarCategoria(string $categoriaId, string $localId): void
    {
        $existe = DB::table('categoria_producto')
            ->where('id', $categoriaId)
            ->where('local_id', $localId)
            ->exists();

        if (! $existe) {
            throw new \InvalidArgumentException('La categoría seleccionada no existe o no pertenece a esta sede.');
        }
    }

    private function verificarNombre(string $localId, string $nombre, ?string $exceptoId = null): void
    {
        $existe = DB::table('producto')
            ->where('local_id', $localId)
            ->when($exceptoId, fn ($query) => $query->where('id', '!=', $exceptoId))
            ->whereRaw('LOWER(nombre) = LOWER(?)', [trim($nombre)])
            ->exists();

        if ($existe) {
            throw new \DomainException("Ya existe un producto con el nombre \"{$nombre}\" en esta sede.");
        }
    }

    private function convertirErrorUnico(QueryException $exception, string $nombre): void
    {
        if ($exception->getCode() === '23505') {
            throw new \DomainException("Ya existe un producto con el nombre \"{$nombre}\" en esta sede.");
        }
    }
}
