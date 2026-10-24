<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
-- 1. Función y trigger para autogeneración de código comercial por sede (CU-ADMIN-17)
CREATE OR REPLACE FUNCTION fn_generar_codigo_promocion(p_local_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_seq INT;
    v_codigo VARCHAR(20);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '^PROMO-' || v_year || '-', ''), '')::INT), 0) + 1
    INTO v_seq
    FROM promocion
    WHERE local_id = p_local_id AND codigo LIKE 'PROMO-' || v_year || '-%';

    v_codigo := 'PROMO-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_fn_asignar_codigo_promocion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR TRIM(NEW.codigo) = '' THEN
        NEW.codigo := fn_generar_codigo_promocion(NEW.local_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Modificaciones estructurales en la tabla promocion
ALTER TABLE promocion
    ADD COLUMN IF NOT EXISTS codigo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS tipo_limite_usos VARCHAR(20) NOT NULL DEFAULT 'sin_limite',
    ADD COLUMN IF NOT EXISTS usos_hoy INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fecha_ultimo_uso DATE;

-- 3. Backfill de código para registros existentes que no tengan código asignado
UPDATE promocion 
SET codigo = fn_generar_codigo_promocion(local_id) 
WHERE codigo IS NULL OR TRIM(codigo) = '';

-- 4. Restricción NOT NULL en codigo
ALTER TABLE promocion
    ALTER COLUMN codigo SET NOT NULL;

-- 5. Restricciones de validación (CHECK constraints)
ALTER TABLE promocion
    DROP CONSTRAINT IF EXISTS chk_porcentaje_max,
    ADD CONSTRAINT chk_porcentaje_max CHECK (
        tipo_descuento != 'porcentaje' OR (valor > 0 AND valor <= 100)
    );

ALTER TABLE promocion
    DROP CONSTRAINT IF EXISTS chk_horario_valido,
    ADD CONSTRAINT chk_horario_valido CHECK (
        (hora_inicio IS NULL AND hora_fin IS NULL) OR 
        (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL)
    );

ALTER TABLE promocion
    DROP CONSTRAINT IF EXISTS chk_tipo_limite_usos,
    ADD CONSTRAINT chk_tipo_limite_usos CHECK (
        tipo_limite_usos IN ('sin_limite', 'diario', 'global')
    );

ALTER TABLE promocion
    DROP CONSTRAINT IF EXISTS chk_usos_hoy_positivo,
    ADD CONSTRAINT chk_usos_hoy_positivo CHECK (usos_hoy >= 0);

-- 6. Índices únicos e índices GIN Trigram
CREATE UNIQUE INDEX IF NOT EXISTS uq_promocion_local_codigo 
    ON promocion (local_id, codigo);

CREATE INDEX IF NOT EXISTS idx_promocion_busqueda_trgm 
    ON promocion USING gin (nombre gin_trgm_ops, codigo gin_trgm_ops);

-- 7. Trigger para autogenerar código antes de insertar
DROP TRIGGER IF EXISTS trg_promocion_codigo ON promocion;
CREATE TRIGGER trg_promocion_codigo
BEFORE INSERT ON promocion
FOR EACH ROW
EXECUTE FUNCTION trg_fn_asignar_codigo_promocion();
SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
DROP TRIGGER IF EXISTS trg_promocion_codigo ON promocion;
DROP FUNCTION IF EXISTS trg_fn_asignar_codigo_promocion();
DROP FUNCTION IF EXISTS fn_generar_codigo_promocion(UUID);

DROP INDEX IF EXISTS idx_promocion_busqueda_trgm;
DROP INDEX IF EXISTS uq_promocion_local_codigo;

ALTER TABLE promocion
    DROP CONSTRAINT IF EXISTS chk_porcentaje_max,
    DROP CONSTRAINT IF EXISTS chk_horario_valido,
    DROP CONSTRAINT IF EXISTS chk_tipo_limite_usos,
    DROP CONSTRAINT IF EXISTS chk_usos_hoy_positivo,
    DROP COLUMN IF EXISTS fecha_ultimo_uso,
    DROP COLUMN IF EXISTS usos_hoy,
    DROP COLUMN IF EXISTS tipo_limite_usos,
    DROP COLUMN IF EXISTS codigo;
SQL);
    }
};
