<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Resultado del visado y resolución de turnos observados (CU-ADMIN-14).
 *
 * - caja.visado_resultado: 'conforme' u 'observado'. Antes solo existía en el log de auditoría.
 * - caja.observacion_resuelta_*: quién y cuándo levantó la observación, con qué nota. Un turno observado
 *   deja de contar como auditado hasta que se resuelve.
 *
 * El backfill toma el último visado registrado en log_auditoria (por defecto 'conforme'). No borra datos.
 * Idempotente: en BDs nuevas el esquema base ya trae estas columnas.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE caja
                ADD COLUMN IF NOT EXISTS visado_resultado VARCHAR(12)
                    CHECK (visado_resultado IN ('conforme', 'observado')),
                ADD COLUMN IF NOT EXISTS observacion_resuelta_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS observacion_resuelta_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS observacion_resolucion TEXT;

            UPDATE caja c
               SET visado_resultado = COALESCE(
                   (SELECT CASE WHEN l.detalle->>'conforme' = 'false' THEN 'observado' ELSE 'conforme' END
                      FROM log_auditoria l
                     WHERE l.accion = 'turno.visado' AND l.entidad_id = c.id
                     ORDER BY l.fecha DESC
                     LIMIT 1),
                   'conforme')
             WHERE c.revisado = true
               AND c.visado_resultado IS NULL;
        SQL);
    }

    public function down(): void
    {
        // Sin reversión: las columnas guardan decisiones de auditoría que no deben perderse.
    }
};
