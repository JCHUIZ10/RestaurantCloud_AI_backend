<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Predicción en locales nuevos (doc-2u/03-prediccion-en-locales-nuevos.md).
 *
 * - `solicitud_pronostico`: una fila por pronóstico pedido, aunque no haya dejado recomendaciones, para que
 *   «último pronóstico» funcione siempre y la vista del propietario conozca el nivel de cada sede (N-1, N-3).
 * - `recomendacion_reposicion`: guarda con qué prioridad, por qué motivo y con qué datos del insumo se calculó
 *   cada línea (N-2, N-4), y el último proveedor con su precio, para armar la compra.
 *
 * Las recomendaciones anteriores a esta migración conservan su contenido (prioridad `cubierto`, motivo
 * `consumo`) pero no tienen solicitud: se vuelven a ver al generar un pronóstico nuevo.
 *
 * Idempotente.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE IF NOT EXISTS solicitud_pronostico (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                ejecucion_id UUID NOT NULL UNIQUE,
                cobertura_dias SMALLINT NOT NULL CHECK (cobertura_dias IN (3, 5, 7)),
                nivel SMALLINT NOT NULL CHECK (nivel BETWEEN 0 AND 3),
                dias_con_ventas INT CHECK (dias_con_ventas >= 0),
                modelo_version UUID,
                solicitada_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS ix_solicitud_pronostico_local
                ON solicitud_pronostico (local_id, created_at DESC);

            ALTER TABLE solicitud_pronostico ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS p_solicitud_pronostico_tenant ON solicitud_pronostico;
            CREATE POLICY p_solicitud_pronostico_tenant ON solicitud_pronostico
                FOR ALL USING (fn_pertenece_tenant(local_id));

            ALTER TABLE recomendacion_reposicion
                ADD COLUMN IF NOT EXISTS prioridad VARCHAR(10) NOT NULL DEFAULT 'cubierto',
                ADD COLUMN IF NOT EXISTS motivo VARCHAR(12) NOT NULL DEFAULT 'consumo',
                ADD COLUMN IF NOT EXISTS alcanza_dias SMALLINT,
                ADD COLUMN IF NOT EXISTS stock_minimo_al_calcular DECIMAL(12, 3) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS costo_unitario_al_calcular DECIMAL(10, 2) NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES proveedor(id) ON DELETE SET NULL;

            ALTER TABLE recomendacion_reposicion DROP CONSTRAINT IF EXISTS recomendacion_reposicion_prioridad_check;
            ALTER TABLE recomendacion_reposicion
                ADD CONSTRAINT recomendacion_reposicion_prioridad_check
                CHECK (prioridad IN ('urgente', 'pronto', 'cubierto'));

            ALTER TABLE recomendacion_reposicion DROP CONSTRAINT IF EXISTS recomendacion_reposicion_motivo_check;
            ALTER TABLE recomendacion_reposicion
                ADD CONSTRAINT recomendacion_reposicion_motivo_check
                CHECK (motivo IN ('consumo', 'bajo_minimo'));
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE recomendacion_reposicion
                DROP COLUMN IF EXISTS prioridad,
                DROP COLUMN IF EXISTS motivo,
                DROP COLUMN IF EXISTS alcanza_dias,
                DROP COLUMN IF EXISTS stock_minimo_al_calcular,
                DROP COLUMN IF EXISTS costo_unitario_al_calcular,
                DROP COLUMN IF EXISTS proveedor_id;
            DROP TABLE IF EXISTS solicitud_pronostico;
        SQL);
    }
};
