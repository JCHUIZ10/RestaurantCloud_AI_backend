<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La numeración de comprobantes pasa a ser independiente por local.
 *
 * Antes la unicidad era (serie, correlativo) global y fn_obtener_siguiente_correlativo
 * tomaba el máximo de toda la serie, de modo que todas las sedes y empresas compartían
 * la numeración de B001/F001/NV01. Ahora comprobante guarda su local_id (un trigger lo
 * toma de la caja si el insert no lo trae) y la unicidad y el cálculo del siguiente
 * número son por (local_id, serie).
 *
 * Idempotente: en BDs nuevas el esquema base ya trae estos cambios.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            ALTER TABLE comprobante ADD COLUMN IF NOT EXISTS local_id UUID REFERENCES local(id) ON DELETE RESTRICT;

            UPDATE comprobante c
            SET local_id = ca.local_id
            FROM caja ca
            WHERE ca.id = c.caja_id AND c.local_id IS NULL;

            ALTER TABLE comprobante ALTER COLUMN local_id SET NOT NULL;

            CREATE OR REPLACE FUNCTION trg_fn_comprobante_asignar_local()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.local_id IS NULL THEN
                    SELECT local_id INTO NEW.local_id FROM caja WHERE id = NEW.caja_id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trg_comprobante_asignar_local ON comprobante;
            CREATE TRIGGER trg_comprobante_asignar_local
                BEFORE INSERT ON comprobante
                FOR EACH ROW EXECUTE FUNCTION trg_fn_comprobante_asignar_local();

            ALTER TABLE comprobante DROP CONSTRAINT IF EXISTS uq_comprobante_serie_correlativo;
            ALTER TABLE comprobante DROP CONSTRAINT IF EXISTS uq_comprobante_local_serie_correlativo;
            ALTER TABLE comprobante
                ADD CONSTRAINT uq_comprobante_local_serie_correlativo UNIQUE (local_id, serie, correlativo);

            DROP INDEX IF EXISTS idx_comprobante_serie_correlativo;
            CREATE INDEX IF NOT EXISTS idx_comprobante_local_serie_correlativo
                ON comprobante(local_id, serie, correlativo);

            CREATE OR REPLACE FUNCTION fn_obtener_siguiente_correlativo(
                p_local_id UUID,
                p_tipo_comprobante VARCHAR,
                p_serie VARCHAR
            )
            RETURNS INT AS $$
            DECLARE
                v_siguiente INT;
                v_max_existente INT;
            BEGIN
                SELECT correlativo_actual
                INTO v_siguiente
                FROM comprobante_serie
                WHERE local_id = p_local_id
                  AND tipo_comprobante = p_tipo_comprobante
                  AND serie = p_serie
                  AND activo = true
                FOR UPDATE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'ERR_SERIE_NO_ENCONTRADA: Serie % de tipo % no activa para sede %', p_serie, p_tipo_comprobante, p_local_id;
                END IF;

                -- Mayor correlativo ya emitido en esta sede para la serie
                SELECT COALESCE(MAX(correlativo), 0)
                INTO v_max_existente
                FROM comprobante
                WHERE local_id = p_local_id
                  AND serie = p_serie;

                v_siguiente := GREATEST(v_siguiente, v_max_existente) + 1;

                UPDATE comprobante_serie
                SET correlativo_actual = v_siguiente,
                    updated_at = NOW()
                WHERE local_id = p_local_id
                  AND tipo_comprobante = p_tipo_comprobante
                  AND serie = p_serie;

                RETURN v_siguiente;
            END;
            $$ LANGUAGE plpgsql;
        SQL);
    }

    public function down(): void
    {
        // Sin reversión: volver a la unicidad global puede fallar si ya hay numeración repetida entre sedes.
    }
};
