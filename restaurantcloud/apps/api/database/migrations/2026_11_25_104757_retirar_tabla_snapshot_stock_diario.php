<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Retira la tabla `snapshot_stock_diario` (CU-SISTEMA-01, diferido).
 *
 * Ningún código la leía ni la escribía: el modelo de pronóstico se entrena con las ventas de
 * ms-analítica y la reposición usa el stock actual. Los scripts de database/sql ya no la crean,
 * así que esta migración solo actúa sobre bases creadas antes de este cambio.
 *
 * up():   elimina la tabla (el DROP arrastra su restricción única y la política RLS).
 * down(): recrea la estructura tal como la definía 02_schema_ddl.sql. Recupera la estructura, NO los datos.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS snapshot_stock_diario;');
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE TABLE IF NOT EXISTS snapshot_stock_diario (
                id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
                insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
                local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                stock_cantidad DECIMAL(12, 3) NOT NULL,
                estuvo_agotado BOOL NOT NULL DEFAULT false,
                CONSTRAINT uq_snapshot_stock_diario UNIQUE (insumo_id, local_id, fecha)
            );

            ALTER TABLE snapshot_stock_diario ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS p_snapshot_stock_diario_tenant ON snapshot_stock_diario;
            CREATE POLICY p_snapshot_stock_diario_tenant ON snapshot_stock_diario
                FOR ALL USING (fn_pertenece_tenant(local_id));
        SQL);
    }
};
