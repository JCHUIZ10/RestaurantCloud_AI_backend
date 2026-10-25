<?php

namespace App\Domains\Admin\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AnulacionAuditoriaService
{
    /**
     * Bandeja de anulaciones y KPIs para supervisión administrativa (CU-ADMIN-04 / CU-ADMIN-11).
     */
    public function listado(string $localId, array $filtros): array
    {
        $fechaActiva = !empty($filtros['fecha']) && $filtros['fecha'] !== 'todas'
            ? $filtros['fecha']
            : null;

        // 1. Cálculo de KPIs
        $kpiQuery = DB::table('pedido_anulacion')
            ->where('local_id', $localId);

        if ($fechaActiva) {
            $kpiQuery->whereDate('anulado_at', $fechaActiva);
        }

        $kpisRaw = $kpiQuery->selectRaw('
            COUNT(*)::INT as total_anulaciones,
            COALESCE(SUM(monto_total), 0) as monto_total,
            COALESCE(COUNT(*) FILTER (WHERE es_merma = true), 0)::INT as con_merma_cantidad,
            COALESCE(SUM(costo_merma) FILTER (WHERE es_merma = true), 0) as costo_merma_total,
            COUNT(DISTINCT mesa_numero)::INT as mesas_afectadas,
            COALESCE(COUNT(*) FILTER (WHERE revisado = false), 0)::INT as pendientes_revision
        ')->first();

        // 2. Consulta filtrada de anulaciones
        $query = DB::table('pedido_anulacion AS pa')
            ->leftJoin('usuario AS mozo', 'mozo.id', '=', 'pa.mozo_id')
            ->leftJoin('usuario AS anulador', 'anulador.id', '=', 'pa.anulado_por')
            ->leftJoin('usuario AS revisor', 'revisor.id', '=', 'pa.revisado_por')
            ->leftJoin('incidente AS inc', 'inc.id', '=', 'pa.incidente_id')
            ->leftJoin('producto AS prod', 'prod.id', '=', 'pa.producto_id')
            ->leftJoin('categoria_producto AS cat', 'cat.id', '=', 'prod.categoria_id')
            ->where('pa.local_id', $localId)
            ->select([
                'pa.*',
                'mozo.nombre AS mozo_nombre',
                'anulador.nombre AS anulador_nombre',
                'revisor.nombre AS revisor_nombre',
                'inc.codigo AS incidente_codigo',
                'cat.nombre AS categoria_nombre',
            ]);

        if ($fechaActiva) {
            $query->whereDate('pa.anulado_at', $fechaActiva);
        }

        // Filtro rápido
        $filtroRapido = $filtros['filtro_rapido'] ?? 'todas';
        match ($filtroRapido) {
            'pendientes' => $query->where('pa.revisado', false),
            'con_merma' => $query->where('pa.es_merma', true),
            'sin_merma' => $query->where('pa.es_merma', false),
            'comandas_totales' => $query->where('pa.tipo_anulacion', 'comanda_completa'),
            default => null,
        };

        // Filtro por mozo
        if (!empty($filtros['mozo_id']) && $filtros['mozo_id'] !== 'todos') {
            $query->where('pa.mozo_id', $filtros['mozo_id']);
        }

        // Buscador textual
        if (!empty($filtros['busqueda'])) {
            $term = '%' . trim($filtros['busqueda']) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('pa.producto_nombre', 'ILIKE', $term)
                    ->orWhere('pa.mesa_numero', 'ILIKE', $term)
                    ->orWhere('pa.motivo_detalle', 'ILIKE', $term)
                    ->orWhere('mozo.nombre', 'ILIKE', $term);
            });
        }

        $query->orderByDesc('pa.anulado_at');

        $rows = $query->get();

        $items = $rows->map(fn ($r) => $this->formatearItem($r))->all();

        return [
            'fecha' => $fechaActiva ?? now()->toDateString(),
            'kpis' => [
                'total_anulaciones' => (int) ($kpisRaw->total_anulaciones ?? 0),
                'monto_total' => round((float) ($kpisRaw->monto_total ?? 0), 2),
                'con_merma_cantidad' => (int) ($kpisRaw->con_merma_cantidad ?? 0),
                'costo_merma_total' => round((float) ($kpisRaw->costo_merma_total ?? 0), 2),
                'mesas_afectadas' => (int) ($kpisRaw->mesas_afectadas ?? 0),
                'pendientes_revision' => (int) ($kpisRaw->pendientes_revision ?? 0),
            ],
            'anulaciones' => $items,
        ];
    }

    /**
     * Obtiene el detalle auditado de una anulación individual.
     */
    public function detalle(string $localId, string $id): ?array
    {
        $row = DB::table('pedido_anulacion AS pa')
            ->leftJoin('usuario AS mozo', 'mozo.id', '=', 'pa.mozo_id')
            ->leftJoin('usuario AS anulador', 'anulador.id', '=', 'pa.anulado_por')
            ->leftJoin('usuario AS revisor', 'revisor.id', '=', 'pa.revisado_por')
            ->leftJoin('incidente AS inc', 'inc.id', '=', 'pa.incidente_id')
            ->leftJoin('producto AS prod', 'prod.id', '=', 'pa.producto_id')
            ->leftJoin('categoria_producto AS cat', 'cat.id', '=', 'prod.categoria_id')
            ->where('pa.local_id', $localId)
            ->where('pa.id', $id)
            ->select([
                'pa.*',
                'mozo.nombre AS mozo_nombre',
                'anulador.nombre AS anulador_nombre',
                'revisor.nombre AS revisor_nombre',
                'inc.codigo AS incidente_codigo',
                'cat.nombre AS categoria_nombre',
            ])
            ->first();

        if (! $row) {
            return null;
        }

        return $this->formatearItem($row);
    }

    /**
     * Marca la anulación como revisada por la administración.
     */
    public function revisar(string $localId, string $id, string $usuarioId, ?string $notas): array
    {
        return DB::transaction(function () use ($localId, $id, $usuarioId, $notas) {
            $row = DB::table('pedido_anulacion')
                ->where('local_id', $localId)
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                throw new RuntimeException('ERR_ANULACION_NO_ENCONTRADA: La anulación no existe o pertenece a otra sede.', 404);
            }

            $now = now();
            DB::table('pedido_anulacion')
                ->where('id', $id)
                ->update([
                    'revisado' => true,
                    'revisado_por' => $usuarioId,
                    'revisado_at' => $now,
                    'notas_supervision' => $notas ? trim($notas) : $row->notas_supervision,
                ]);

            // Auditoría
            $empresaId = DB::table('local')->where('id', $localId)->value('empresa_id');
            if ($empresaId) {
                DB::table('log_auditoria')->insert([
                    'id' => (string) Str::uuid(),
                    'empresa_id' => $empresaId,
                    'local_id' => $localId,
                    'usuario_id' => $usuarioId,
                    'accion' => 'anulacion.revisada',
                    'entidad_tipo' => 'pedido_anulacion',
                    'entidad_id' => $id,
                    'detalle' => json_encode([
                        'notas_supervision' => $notas ? trim($notas) : null,
                    ]),
                    'fecha' => $now,
                ]);
            }

            return $this->detalle($localId, $id);
        });
    }

    /**
     * Escala asistidamente la anulación a un incidente interno formal (CU-ADMIN-11).
     */
    public function escalarIncidente(string $localId, string $id, string $usuarioId, array $payload): array
    {
        return DB::transaction(function () use ($localId, $id, $usuarioId, $payload) {
            $anulacion = DB::table('pedido_anulacion')
                ->where('local_id', $localId)
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $anulacion) {
                throw new RuntimeException('ERR_ANULACION_NO_ENCONTRADA: La anulación solicitada no existe.', 404);
            }

            if (!empty($anulacion->incidente_id)) {
                $incidenteActual = DB::table('incidente')->where('id', $anulacion->incidente_id)->first();
                $codigo = $incidenteActual ? $incidenteActual->codigo : 'INC-EXPEDIENTE';
                throw new RuntimeException("ERR_YA_ESCALADO: Esta anulación ya fue escalada previamente bajo el expediente {$codigo}.", 422);
            }

            $year = date('Y');
            $count = DB::table('incidente')
                ->where('local_id', $localId)
                ->whereYear('fecha_hora', $year)
                ->count();

            $seq = $count + 1;
            do {
                $codigo = sprintf('INC-%s-%03d', $year, $seq);
                $existe = DB::table('incidente')->where('codigo', $codigo)->exists();
                if ($existe) {
                    $seq++;
                }
            } while ($existe);

            $descripcionIncidente = sprintf(
                'Anulación en %s: %s (S/ %.2f). Motivo manifestado: %s%s',
                $anulacion->mesa_numero,
                $anulacion->producto_nombre ?? 'Comanda completa',
                (float) $anulacion->monto_total,
                $anulacion->motivo_detalle,
                $anulacion->es_merma ? sprintf(' [Impacto de merma culinaria: S/ %.2f]', (float) ($anulacion->costo_merma ?? 0)) : ''
            );

            $incidenteId = (string) Str::uuid();
            $now = now();

            DB::table('incidente')->insert([
                'id' => $incidenteId,
                'local_id' => $localId,
                'codigo' => $codigo,
                'titulo' => trim($payload['titulo']),
                'categoria' => $payload['categoria'],
                'gravedad' => $payload['gravedad'],
                'fecha_hora' => $anulacion->anulado_at,
                'empleado_id' => $anulacion->mozo_id,
                'descripcion' => $descripcionIncidente,
                'medidas_inmediatas' => trim($payload['medidas_adoptadas']),
                'registrado_por' => $usuarioId,
                'estado' => 'en_revision',
                'visto_por_propietario' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('incidente_bitacora')->insert([
                'id' => (string) Str::uuid(),
                'incidente_id' => $incidenteId,
                'usuario_id' => $usuarioId,
                'tipo_evento' => 'apertura',
                'nota' => 'Escalamiento formal por disconformidad o impacto de merma culinaria en salón.',
                'created_at' => $now,
            ]);

            DB::table('pedido_anulacion')
                ->where('id', $id)
                ->update([
                    'incidente_id' => $incidenteId,
                    'revisado' => true,
                    'revisado_por' => $usuarioId,
                    'revisado_at' => $now,
                ]);

            $empresaId = DB::table('local')->where('id', $localId)->value('empresa_id');
            if ($empresaId) {
                DB::table('log_auditoria')->insert([
                    'id' => (string) Str::uuid(),
                    'empresa_id' => $empresaId,
                    'local_id' => $localId,
                    'usuario_id' => $usuarioId,
                    'accion' => 'anulacion.escalada_incidente',
                    'entidad_tipo' => 'incidente',
                    'entidad_id' => $incidenteId,
                    'detalle' => json_encode([
                        'anulacion_id' => $id,
                        'codigo' => $codigo,
                    ]),
                    'fecha' => $now,
                ]);
            }

            $anulacionActualizada = $this->detalle($localId, $id);

            $mozo = DB::table('usuario')->where('id', $anulacion->mozo_id)->first();
            $registrador = DB::table('usuario')->where('id', $usuarioId)->first();

            return [
                'anulacion' => $anulacionActualizada,
                'incidente' => [
                    'id' => $incidenteId,
                    'local_id' => $localId,
                    'codigo' => $codigo,
                    'titulo' => trim($payload['titulo']),
                    'categoria' => $payload['categoria'],
                    'gravedad' => $payload['gravedad'],
                    'fecha_hora' => (string) $anulacion->anulado_at,
                    'empleado_id' => $anulacion->mozo_id,
                    'empleado_nombre' => $mozo ? $mozo->nombre : null,
                    'descripcion' => $descripcionIncidente,
                    'medidas_inmediatas' => trim($payload['medidas_adoptadas']),
                    'foto_url' => null,
                    'registrado_por' => $usuarioId,
                    'registrador_nombre' => $registrador ? $registrador->nombre : 'Administrador',
                    'estado' => 'en_revision',
                    'visto_por_propietario' => false,
                    'fecha_visto' => null,
                    'nota_propietario' => null,
                    'motivo_revision' => 'Escalamiento formal por queja o impacto de merma en salón.',
                    'resolucion_nota' => null,
                    'resuelto_por' => null,
                    'resuelto_por_nombre' => null,
                    'fecha_resolucion' => null,
                    'bitacora' => [],
                    'created_at' => $now->toIso8601String(),
                    'updated_at' => $now->toIso8601String(),
                ],
            ];
        });
    }

    /**
     * Mapea el registro de pedido_anulacion al DTO PedidoAnulacionItemDTO.
     */
    private function formatearItem(object $row): array
    {
        $idLimpio = str_replace('-', '', (string) $row->id);
        $codigo = sprintf(
            'ANUL-%s-%s',
            date('Y', strtotime($row->anulado_at)),
            strtoupper(substr($idLimpio, -4))
        );

        return [
            'id' => (string) $row->id,
            'codigo' => $codigo,
            'local_id' => (string) $row->local_id,
            'pedido_id' => (string) $row->pedido_id,
            'pedido_item_id' => $row->pedido_item_id ? (string) $row->pedido_item_id : null,
            'tipo_anulacion' => (string) $row->tipo_anulacion,
            'mesa_id' => (string) $row->mesa_id,
            'mesa_numero' => (string) $row->mesa_numero,
            'producto_id' => $row->producto_id ? (string) $row->producto_id : null,
            'producto_nombre' => (string) ($row->producto_nombre ?? 'Comanda completa'),
            'cantidad' => (int) $row->cantidad,
            'precio_unitario' => (float) $row->precio_unitario,
            'monto_total' => (float) $row->monto_total,
            'mozo_id' => (string) $row->mozo_id,
            'mozo_nombre' => (string) ($row->mozo_nombre ?? 'Mozo'),
            'anulado_por' => (string) $row->anulado_por,
            'anulado_por_nombre' => (string) ($row->anulador_nombre ?? 'Personal'),
            'motivo_categoria' => (string) $row->motivo_categoria,
            'motivo_detalle' => (string) $row->motivo_detalle,
            'pedido_created_at' => (string) $row->pedido_created_at,
            'anulado_at' => (string) $row->anulado_at,
            'minutos_espera' => (int) $row->minutos_espera,
            'estado_anterior' => (string) $row->estado_anterior,
            'es_merma' => (bool) $row->es_merma,
            'costo_merma' => $row->costo_merma !== null ? (float) $row->costo_merma : null,
            'revisado' => (bool) $row->revisado,
            'revisado_por' => $row->revisado_por ? (string) $row->revisado_por : null,
            'revisado_por_nombre' => $row->revisor_nombre ? (string) $row->revisor_nombre : null,
            'revisado_at' => $row->revisado_at ? (string) $row->revisado_at : null,
            'notas_supervision' => $row->notas_supervision ? (string) $row->notas_supervision : null,
            'incidente_id' => $row->incidente_id ? (string) $row->incidente_id : null,
            'incidente_codigo' => $row->incidente_codigo ? (string) $row->incidente_codigo : null,
            'partida_cocina' => $row->categoria_nombre ? (string) $row->categoria_nombre : null,
            'created_at' => (string) $row->created_at,
        ];
    }
}
