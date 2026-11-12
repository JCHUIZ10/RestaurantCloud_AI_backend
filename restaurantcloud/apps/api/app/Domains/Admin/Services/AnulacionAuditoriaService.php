<?php

namespace App\Domains\Admin\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
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
        $fechaActiva = ! empty($filtros['fecha']) && $filtros['fecha'] !== 'todas'
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
            COALESCE(COUNT(*) FILTER (WHERE revisado = false), 0)::INT as pendientes_revision,
            COALESCE(COUNT(*) FILTER (WHERE tipo_anulacion = \'comanda_completa\'), 0)::INT as comandas_totales
        ')->first();

        // 2. Consulta filtrada de anulaciones
        $query = $this->consultaDetallada($localId);

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
        if (! empty($filtros['mozo_id']) && $filtros['mozo_id'] !== 'todos') {
            $query->where('pa.mozo_id', $filtros['mozo_id']);
        }

        // Buscador textual
        if (! empty($filtros['busqueda'])) {
            $busqueda = trim($filtros['busqueda']);
            // Los comodines de LIKE escritos por el usuario se tratan como texto literal
            $term = '%'.addcslashes($busqueda, '\\%_').'%';
            // El código visible (ANUL-AAAA-XXXXXXXX) deriva de los últimos caracteres del UUID
            $sufijoCodigo = preg_match('/^ANUL-\d{4}-([0-9A-F]{4,32})$/i', $busqueda, $coincidencia)
                ? $coincidencia[1]
                : null;

            $query->where(function ($q) use ($term, $sufijoCodigo) {
                $q->where('pa.producto_nombre', 'ILIKE', $term)
                    ->orWhere('pa.mesa_numero', 'ILIKE', $term)
                    ->orWhere('pa.motivo_detalle', 'ILIKE', $term)
                    ->orWhere('pa.mozo_nombre', 'ILIKE', $term);

                if ($sufijoCodigo !== null) {
                    $q->orWhereRaw("REPLACE(pa.id::text, '-', '') ILIKE ?", ['%'.$sufijoCodigo]);
                }
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
                'comandas_totales' => (int) ($kpisRaw->comandas_totales ?? 0),
            ],
            'anulaciones' => $items,
        ];
    }

    /**
     * Obtiene el detalle auditado de una anulación individual.
     */
    public function detalle(string $localId, string $id): ?array
    {
        $row = $this->consultaDetallada($localId)
            ->where('pa.id', $id)
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
                throw new RuntimeException('La anulación no existe o pertenece a otra sede.', 404);
            }

            if ((bool) $row->revisado) {
                throw new RuntimeException('Esta anulación ya fue revisada.', 409);
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
     * Consulta de lectura sobre v_pedido_anulacion_detalle (ya trae los nombres de mozo,
     * quien anuló, revisor, partida y local), acotada a la sede. La comparten la bandeja,
     * la ficha y la exportación a Excel.
     */
    public function consultaDetallada(string $localId): Builder
    {
        return DB::table('v_pedido_anulacion_detalle AS pa')
            ->where('pa.local_id', $localId);
    }

    /**
     * Mapea el registro de pedido_anulacion al DTO PedidoAnulacionItemDTO.
     */
    public function formatearItem(object $row): array
    {
        return [
            'id' => (string) $row->id,
            'codigo' => $this->codigoVisible($row),
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
            'pedido_created_at' => $this->aIso8601($row->pedido_created_at),
            'anulado_at' => $this->aIso8601($row->anulado_at),
            'minutos_espera' => (int) $row->minutos_espera,
            'estado_anterior' => (string) $row->estado_anterior,
            'es_merma' => (bool) $row->es_merma,
            'costo_merma' => $row->costo_merma !== null ? (float) $row->costo_merma : null,
            'revisado' => (bool) $row->revisado,
            'revisado_por' => $row->revisado_por ? (string) $row->revisado_por : null,
            'revisado_por_nombre' => $row->revisor_nombre ? (string) $row->revisor_nombre : null,
            'revisado_at' => $row->revisado_at ? $this->aIso8601($row->revisado_at) : null,
            'notas_supervision' => $row->notas_supervision ? (string) $row->notas_supervision : null,
            'partida_cocina' => $row->categoria_nombre ? (string) $row->categoria_nombre : null,
            'created_at' => $this->aIso8601($row->created_at),
        ];
    }

    /**
     * Código legible de la anulación (ANUL-AAAA-XXXXXXXX), derivado del año y del final del UUID.
     */
    public function codigoVisible(object $row): string
    {
        $idLimpio = str_replace('-', '', (string) $row->id);

        return sprintf(
            'ANUL-%s-%s',
            date('Y', strtotime($row->anulado_at)),
            strtoupper(substr($idLimpio, -8))
        );
    }

    /**
     * Postgres devuelve "2026-11-12 14:30:00.123456-05", formato que Safari no interpreta.
     */
    private function aIso8601(string $marcaTiempo): string
    {
        return Carbon::parse($marcaTiempo)->toIso8601String();
    }
}
