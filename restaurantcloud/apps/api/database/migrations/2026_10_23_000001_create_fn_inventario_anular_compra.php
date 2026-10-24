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
CREATE OR REPLACE FUNCTION fn_inventario_anular_compra(
    p_ficha_compra_id UUID,
    p_usuario_id UUID,
    p_motivo TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_ficha RECORD;
    v_item RECORD;
    v_insumo RECORD;
    v_prod RECORD;
    v_stock_anterior DECIMAL(12, 3);
    v_stock_nuevo DECIMAL(12, 3);
    v_diferencia DECIMAL(12, 3);
    v_deficit DECIMAL(12, 3);
    v_total_deficit DECIMAL(12, 3) := 0.000;
    v_insumos_afectados JSONB := '[]'::JSONB;
    v_platos_afectados JSONB := '[]'::JSONB;
BEGIN
    -- 1. Validación de motivo
    IF p_motivo IS NULL OR LENGTH(TRIM(p_motivo)) < 5 THEN
        RAISE EXCEPTION 'ERR_VALIDACION: Debe ingresar un motivo de anulación válido (mínimo 5 caracteres).';
    END IF;

    -- 2. Bloqueo pesimista y verificación de la ficha de compra
    SELECT fc.id, fc.local_id, fc.proveedor_id, fc.tipo_comprobante, fc.numero_comprobante, fc.es_autogenerado, fc.estado, fc.total
    INTO v_ficha
    FROM ficha_compra fc
    WHERE fc.id = p_ficha_compra_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_FICHA_NO_ENCONTRADA: Ficha de compra % no existe.', p_ficha_compra_id;
    END IF;

    IF v_ficha.estado = 'anulada' THEN
        RAISE EXCEPTION 'ERR_FICHA_YA_ANULADA: La ficha de compra ya se encuentra anulada.';
    END IF;

    -- 3. Iteración atómica por cada ítem de compra con plan de contingencia Piso 0 (GREATEST 0 Floor)
    FOR v_item IN
        SELECT fcd.id, fcd.insumo_id, fcd.cantidad, fcd.precio_unitario, fcd.subtotal,
               i.nombre AS insumo_nombre, i.unidad_medida, i.stock_actual, i.stock_minimo
        FROM ficha_compra_detalle fcd
        JOIN insumo i ON i.id = fcd.insumo_id
        WHERE fcd.ficha_compra_id = p_ficha_compra_id
        ORDER BY fcd.id
    LOOP
        -- Bloquear el insumo para evitar carreras de stock concurrentes
        SELECT id, nombre, unidad_medida, stock_actual, stock_minimo, estado
        INTO v_insumo
        FROM insumo
        WHERE id = v_item.insumo_id
        FOR UPDATE;

        v_stock_anterior := v_insumo.stock_actual;
        -- Aplicar plan de contingencia de piso 0
        v_stock_nuevo := GREATEST(0.000, v_stock_anterior - v_item.cantidad);
        v_diferencia := v_stock_nuevo - v_stock_anterior;
        -- Si la compra superaba el stock disponible, la diferencia fue consumida previamente en fogones
        v_deficit := GREATEST(0.000, v_item.cantidad - v_stock_anterior);
        v_total_deficit := v_total_deficit + v_deficit;

        -- Actualizar insumo físico
        UPDATE insumo
        SET stock_actual = v_stock_nuevo,
            estado = CASE WHEN v_stock_nuevo <= 0.000 THEN 'agotado' ELSE estado END,
            updated_at = NOW()
        WHERE id = v_item.insumo_id;

        -- Asentar contabilidad física inmutable en auditoria_stock_ajuste
        INSERT INTO auditoria_stock_ajuste (
            local_id,
            insumo_id,
            usuario_id,
            stock_anterior,
            stock_nuevo,
            diferencia,
            motivo,
            notas,
            created_at
        ) VALUES (
            v_ficha.local_id,
            v_item.insumo_id,
            p_usuario_id,
            v_stock_anterior,
            v_stock_nuevo,
            v_diferencia,
            'conteo_fisico_inventario',
            format('Anulación Compra #%s. Deducción física con piso 0. Cantidad compra: %s %s. Stock anterior: %s. Déficit cocina absorbido: %s %s. Motivo: %s',
                   v_ficha.numero_comprobante, v_item.cantidad, v_item.unidad_medida, v_stock_anterior, v_deficit, v_item.unidad_medida, p_motivo),
            NOW()
        );

        -- Detectar si este insumo cae en quiebre y apagar platos activos dependientes
        IF v_stock_nuevo <= v_insumo.stock_minimo THEN
            FOR v_prod IN
                SELECT DISTINCT p.id, p.nombre
                FROM producto_insumo pi
                JOIN producto p ON p.id = pi.producto_id
                WHERE pi.insumo_id = v_item.insumo_id
                  AND p.disponibilidad = 'disponible'
                  AND v_stock_nuevo < pi.cantidad_descuenta
            LOOP
                UPDATE producto
                SET disponibilidad = 'agotado',
                    updated_at = NOW()
                WHERE id = v_prod.id;

                v_platos_afectados := v_platos_afectados || jsonb_build_object(
                    'producto_id', v_prod.id,
                    'producto_nombre', v_prod.nombre,
                    'insumo_critico', v_item.insumo_nombre
                );
            END LOOP;
        END IF;

        v_insumos_afectados := v_insumos_afectados || jsonb_build_object(
            'insumo_id', v_item.insumo_id,
            'insumo_nombre', v_item.insumo_nombre,
            'unidad_medida', v_item.unidad_medida,
            'stock_anterior', v_stock_anterior,
            'stock_nuevo', v_stock_nuevo,
            'cantidad_a_restar', v_item.cantidad,
            'deficit_consumido', v_deficit,
            'quedara_en_quiebre', (v_stock_nuevo <= v_insumo.stock_minimo)
        );
    END LOOP;

    -- 4. Marcar ficha de compra como anulada
    UPDATE ficha_compra
    SET estado = 'anulada',
        motivo_anulacion = p_motivo,
        anulado_por = p_usuario_id,
        anulado_at = NOW()
    WHERE id = p_ficha_compra_id;

    RETURN jsonb_build_object(
        'ok', true,
        'ficha_id', p_ficha_compra_id,
        'numero_comprobante', v_ficha.numero_comprobante,
        'estado', 'anulada',
        'motivo_anulacion', p_motivo,
        'total_deficit_consumido', v_total_deficit,
        'insumos_afectados', v_insumos_afectados,
        'platos_agotados', v_platos_afectados
    );
END;
$$ LANGUAGE plpgsql;
SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP FUNCTION IF EXISTS fn_inventario_anular_compra(UUID, UUID, TEXT);');
    }
};
