<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Reposición sugerida a partir del pronóstico de ms-pronóstico (doc-2u/servicios/nucleo-laravel.md).
 *
 * Una fila por insumo y por pronóstico. Guarda con qué se calculó (consumo previsto, margen de seguridad,
 * stock del momento y días de cobertura) para poder explicar la cantidad sugerida aunque el stock cambie
 * después, y la decisión del administrador: la recomendación es apoyo a la decisión, nunca una compra.
 *
 * `ejecucion_id` es la ejecución en ms-pronóstico; no hay clave foránea porque es otra base.
 *
 * Idempotente: en BDs nuevas la crea esta migración, en las existentes no cambia nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE IF NOT EXISTS recomendacion_reposicion (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                ejecucion_id UUID NOT NULL,
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
                cobertura_dias SMALLINT NOT NULL CHECK (cobertura_dias IN (3, 5, 7)),
                consumo_previsto DECIMAL(12, 3) NOT NULL CHECK (consumo_previsto >= 0),
                margen_seguridad DECIMAL(12, 3) NOT NULL DEFAULT 0 CHECK (margen_seguridad >= 0),
                stock_al_calcular DECIMAL(12, 3) NOT NULL CHECK (stock_al_calcular >= 0),
                cantidad_sugerida DECIMAL(12, 3) NOT NULL CHECK (cantidad_sugerida >= 0),
                estado VARCHAR(12) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'aceptada', 'ajustada', 'descartada')),
                cantidad_final DECIMAL(12, 3) CHECK (cantidad_final >= 0),
                decidido_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                decidido_en TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (ejecucion_id, insumo_id)
            );

            CREATE INDEX IF NOT EXISTS ix_recomendacion_local
                ON recomendacion_reposicion (local_id, created_at DESC);

            ALTER TABLE recomendacion_reposicion ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS p_recomendacion_reposicion_tenant ON recomendacion_reposicion;
            CREATE POLICY p_recomendacion_reposicion_tenant ON recomendacion_reposicion
                FOR ALL USING (fn_pertenece_tenant(local_id));
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS recomendacion_reposicion;');
    }
};
