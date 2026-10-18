<?php

namespace App\Domains\Carta\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoriaService
{
    private const PLANTILLAS = [
        'polleria' => ['Pollos a la Brasa', 'Guarniciones & Papas', 'Ensaladas Frescas', 'Bebidas & Gaseosas', 'Cervezas & Tragos', 'Postres'],
        'cevicheria' => ['Ceviches & Tiraditos', 'Causas & Entradas Frías', 'Chicharrones & Jaleas', 'Arroces & Sudados', 'Chilcanos & Bebidas', 'Postres Criollos'],
        'chifa' => ['Sopas & Wantanes', 'Arroz Chaufa', 'Tallarines & Wantán Frito', 'Especialidades al Wok', 'Bebidas & Té Jazmín'],
        'criollo' => ['Entradas Criollas', 'Segundos Tradicionales', 'Guisos de la Casa', 'Bebidas & Refrescos', 'Postres Tradicionales'],
        'cafeteria' => ['Cafés de Especialidad', 'Bebidas Frías & Frappés', 'Sándwiches & Tostones', 'Pastelería Fina', 'Desayunos & Combos'],
    ];

    public function listado(string $localId): array
    {
        $categorias = DB::table('categoria_producto as c')
            ->leftJoin('producto as p', 'p.categoria_id', '=', 'c.id')
            ->where('c.local_id', $localId)
            ->groupBy('c.id')
            ->orderBy('c.orden')
            ->orderBy('c.nombre')
            ->selectRaw(
                'c.id, c.local_id, c.nombre, c.orden, c.activa, c.created_at, c.updated_at,
                COUNT(p.id)::int as total_productos,
                COUNT(p.id) FILTER (WHERE p.disponibilidad = ?)::int as productos_disponibles,
                COUNT(p.id) FILTER (WHERE p.disponibilidad = ?)::int as productos_agotados',
                ['disponible', 'agotado'],
            )
            ->get()
            ->map(fn ($categoria) => (array) $categoria)
            ->all();

        $top = collect($categorias)->sortByDesc('total_productos')->first();
        $local = DB::table('local')->where('id', $localId)->value('nombre');

        return [
            'local_id' => $localId,
            'local_nombre' => $local,
            'resumen' => [
                'total_categorias' => count($categorias),
                'categorias_activas' => collect($categorias)->where('activa', true)->count(),
                'categorias_ocultas' => collect($categorias)->where('activa', false)->count(),
                'total_productos_asociados' => collect($categorias)->sum('total_productos'),
                'categoria_con_mas_platos' => $top && $top['total_productos'] > 0
                    ? [
                        'id' => $top['id'],
                        'nombre' => $top['nombre'],
                        'cantidad' => $top['total_productos'],
                    ]
                    : null,
            ],
            'categorias' => $categorias,
        ];
    }

    public function crear(string $localId, array $data): array
    {
        return DB::transaction(function () use ($localId, $data) {
            $nombre = trim($data['nombre']);
            $this->verificarNombre($localId, $nombre);
            $id = (string) Str::uuid();
            $orden = ((int) DB::table('categoria_producto')
                ->where('local_id', $localId)
                ->max('orden')) + 1;

            DB::table('categoria_producto')->insert([
                'id' => $id,
                'local_id' => $localId,
                'nombre' => $nombre,
                'orden' => $orden,
                'activa' => $data['activa'] ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return $this->categoria($id, $localId);
        });
    }

    public function actualizar(string $id, string $localId, array $data): ?array
    {
        return DB::transaction(function () use ($id, $localId, $data) {
            $actual = DB::table('categoria_producto')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $actual) {
                return null;
            }

            $nombre = trim($data['nombre']);
            $this->verificarNombre($localId, $nombre, $id);

            DB::table('categoria_producto')->where('id', $id)->update(array_filter([
                'nombre' => $nombre,
                'activa' => $data['activa'] ?? null,
                'updated_at' => now(),
            ], fn ($value) => $value !== null));
            return $this->categoria($id, $localId);
        });
    }

    public function visibilidad(string $id, string $localId, bool $activa): ?array
    {
        $updated = DB::table('categoria_producto')
            ->where('id', $id)
            ->where('local_id', $localId)
            ->update(['activa' => $activa, 'updated_at' => now()]);
        return $updated ? $this->categoria($id, $localId) : null;
    }

    public function reordenar(string $localId, array $items): array
    {
        return DB::transaction(function () use ($localId, $items) {
            $ids = collect($items)->pluck('id')->unique()->values();
            // PostgreSQL no permite FOR UPDATE sobre COUNT(); bloquear las filas
            // concretas mantiene el reordenamiento atómico sin usar un agregado.
            $existentes = DB::table('categoria_producto')
                ->where('local_id', $localId)
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->pluck('id');

            if ($existentes->count() !== $ids->count()) {
                throw new \DomainException('Una o más categorías no pertenecen a esta sede.');
            }

            foreach ($items as $item) {
                DB::table('categoria_producto')->where('id', $item['id'])->update([
                    'orden' => $item['orden'],
                    'updated_at' => now(),
                ]);
            }
            return $this->listado($localId)['categorias'];
        });
    }

    public function eliminar(string $id, string $localId): array
    {
        return DB::transaction(function () use ($id, $localId) {
            $categoria = DB::table('categoria_producto')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $categoria) {
                return ['tipo' => 'not_found'];
            }

            $productos = DB::table('producto')
                ->where('categoria_id', $id)
                ->select('id', 'nombre', 'precio', 'disponibilidad')
                ->get();

            if ($productos->isNotEmpty()) {
                return [
                    'tipo' => 'conflict',
                    'datos' => [
                        'categoria_id' => $id,
                        'categoria_nombre' => $categoria->nombre,
                        'total_productos' => $productos->count(),
                        'productos_muestras' => $productos->map(fn ($producto) => (array) $producto)->all(),
                    ],
                ];
            }

            DB::table('categoria_producto')->where('id', $id)->delete();
            $this->normalizarOrden($localId);

            return [
                'tipo' => 'ok',
                'datos' => [
                    'mensaje' => "La categoría \"{$categoria->nombre}\" fue eliminada exitosamente.",
                    'categoria_id' => $id,
                ],
            ];
        });
    }

    public function reasignar(string $id, string $localId, string $destinoId, ?array $productoIds): array
    {
        return DB::transaction(function () use ($id, $localId, $destinoId, $productoIds) {
            if ($id === $destinoId) {
                throw new \InvalidArgumentException('La categoría de destino debe ser diferente a la categoría que se desea eliminar.');
            }

            $origen = DB::table('categoria_producto')
                ->where('id', $id)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();
            $destino = DB::table('categoria_producto')
                ->where('id', $destinoId)
                ->where('local_id', $localId)
                ->lockForUpdate()
                ->first();

            if (! $origen || ! $destino) {
                throw new \OutOfBoundsException('La categoría seleccionada no existe en esta sede.');
            }

            $query = DB::table('producto')->where('categoria_id', $id);
            if ($productoIds) {
                $query->whereIn('id', $productoIds);
            }

            $movidos = $query->update(['categoria_id' => $destinoId, 'updated_at' => now()]);
            $restantes = DB::table('producto')->where('categoria_id', $id)->count();
            $eliminada = $restantes === 0;

            if ($eliminada) {
                DB::table('categoria_producto')->where('id', $id)->delete();
                $this->normalizarOrden($localId);
            }

            return [
                'mensaje' => $eliminada
                    ? "Se reasignaron {$movidos} plato(s) a \"{$destino->nombre}\" y la categoría \"{$origen->nombre}\" fue eliminada exitosamente."
                    : "Se transfirieron {$movidos} plato(s) a \"{$destino->nombre}\". Quedan {$restantes} plato(s) pendientes de reasignar.",
                'categoria_id' => $id,
                'platos_reasignados' => $movidos,
                'platos_restantes' => $restantes,
                'categoria_eliminada' => $eliminada,
            ];
        });
    }

    public function plantilla(string $localId, string $tipo, bool $reemplazar): array
    {
        if (! isset(self::PLANTILLAS[$tipo])) {
            throw new \InvalidArgumentException("El tipo de plantilla \"{$tipo}\" no es reconocido.");
        }

        return DB::transaction(function () use ($localId, $tipo, $reemplazar) {
            $nombres = self::PLANTILLAS[$tipo];

            if ($reemplazar) {
                $temporal = DB::table('categoria_producto')->where('local_id', $localId)->get();

                foreach ($temporal as $categoria) {
                    DB::table('categoria_producto')->where('id', $categoria->id)->update([
                        'nombre' => '__reemplazar_' . $categoria->id,
                    ]);
                }

                $nuevaId = (string) Str::uuid();
                DB::table('categoria_producto')->insert([
                    'id' => $nuevaId,
                    'local_id' => $localId,
                    'nombre' => $nombres[0],
                    'orden' => 1,
                    'activa' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('producto')
                    ->whereIn('categoria_id', $temporal->pluck('id'))
                    ->update(['categoria_id' => $nuevaId, 'updated_at' => now()]);
                DB::table('categoria_producto')
                    ->where('local_id', $localId)
                    ->where('id', '!=', $nuevaId)
                    ->delete();

                foreach (array_slice($nombres, 1) as $indice => $nombre) {
                    $this->insertarCategoria($localId, $nombre, $indice + 2);
                }
            } else {
                $max = (int) DB::table('categoria_producto')->where('local_id', $localId)->max('orden');

                foreach ($nombres as $nombre) {
                    $existe = DB::table('categoria_producto')
                        ->where('local_id', $localId)
                        ->whereRaw('LOWER(nombre) = LOWER(?)', [$nombre])
                        ->exists();

                    if (! $existe) {
                        $this->insertarCategoria($localId, $nombre, ++$max);
                    }
                }
            }

            return $this->listado($localId);
        });
    }

    private function categoria(string $id, string $localId): array
    {
        return collect($this->listado($localId)['categorias'])->firstWhere('id', $id);
    }

    private function insertarCategoria(string $localId, string $nombre, int $orden): void
    {
        DB::table('categoria_producto')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $localId,
            'nombre' => $nombre,
            'orden' => $orden,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function normalizarOrden(string $localId): void
    {
        DB::table('categoria_producto')
            ->where('local_id', $localId)
            ->orderBy('orden')
            ->orderBy('nombre')
            ->get()
            ->each(fn ($categoria, $indice) => DB::table('categoria_producto')
                ->where('id', $categoria->id)
                ->update(['orden' => $indice + 1, 'updated_at' => now()]));
    }

    private function verificarNombre(string $localId, string $nombre, ?string $excepto = null): void
    {
        $existe = DB::table('categoria_producto')
            ->where('local_id', $localId)
            ->when($excepto, fn ($query) => $query->where('id', '!=', $excepto))
            ->whereRaw('LOWER(nombre) = LOWER(?)', [$nombre])
            ->exists();

        if ($existe) {
            throw new \DomainException("Ya existe una categoría con el nombre \"{$nombre}\" en esta sede.");
        }
    }
}
