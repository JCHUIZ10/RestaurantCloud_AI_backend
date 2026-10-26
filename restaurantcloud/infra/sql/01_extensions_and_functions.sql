-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 01: EXTENSIONES Y FUNCIONES BASE
-- Motor: PostgreSQL 16
-- ==============================================================================

SET client_encoding = 'UTF8';

-- 1. EXTENSIONES DEL SISTEMA
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. GENERADOR DE UUID v8 (RFC 9562 TIME-ORDERED)
-- Incorpora timestamp Unix en milisegundos (48 bits) en la cabecera del identificador,
-- garantizando orden cronológico estricto de inserción e indexación B-Tree óptima
-- sin fragmentación de páginas ni sobrecosto de I/O.
CREATE OR REPLACE FUNCTION fn_uuid_v8() 
RETURNS UUID AS $$
DECLARE
    v_time BIGINT;
    v_bytes BYTEA;
BEGIN
    -- Timestamp Unix en milisegundos
    v_time := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    
    -- 16 bytes criptográficos
    v_bytes := gen_random_bytes(16);
    
    -- Inyectar timestamp en los primeros 6 bytes (48 bits)
    v_bytes := set_byte(v_bytes, 0, ((v_time >> 40) & 255)::INT);
    v_bytes := set_byte(v_bytes, 1, ((v_time >> 32) & 255)::INT);
    v_bytes := set_byte(v_bytes, 2, ((v_time >> 24) & 255)::INT);
    v_bytes := set_byte(v_bytes, 3, ((v_time >> 16) & 255)::INT);
    v_bytes := set_byte(v_bytes, 4, ((v_time >> 8) & 255)::INT);
    v_bytes := set_byte(v_bytes, 5, (v_time & 255)::INT);
    
    -- Fijar versión 8 (0b1000) en el nibble superior del byte 6
    v_bytes := set_byte(v_bytes, 6, ((get_byte(v_bytes, 6) & 15) | 128)::INT);
    
    -- Fijar variante RFC 9562 (0b10) en los 2 bits superiores del byte 8
    v_bytes := set_byte(v_bytes, 8, ((get_byte(v_bytes, 8) & 63) | 128)::INT);
    
    RETURN encode(v_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. TRIGGER AUTOMÁTICO DE ACTUALIZACIÓN DE TIMESTAMP (updated_at)
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNCIÓN TRANSACCIONAL ACID DE CORRELATIVIDAD MONÓTONA (CU-CAJA-03 / CU-CAJA-04)
-- Aplica bloqueo exclusivo a nivel de fila (FOR UPDATE) sobre la serie electrónica
-- garantizando incremento monótono sin saltos ni duplicados bajo concurrencia.
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

    -- Verificar el mayor correlativo físico ya emitido en la tabla comprobante para esta serie
    SELECT COALESCE(MAX(correlativo), 0)
    INTO v_max_existente
    FROM comprobante
    WHERE serie = p_serie;

    -- El siguiente correlativo es estrictamente mayor tanto al acumulador de la serie como al máximo emitido
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

-- 5. FUNCIÓN DE SEGURIDAD PARA BYPASS RLS DE ADMINISTRADOR SAAS (CU-SAAS-01)
CREATE OR REPLACE FUNCTION fn_es_admin_saas()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.current_user_role', true) = 'admin_saas';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. AUTOGENERADOR DE CÓDIGO PROMOCIONAL POR SEDE (CU-ADMIN-17)
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

