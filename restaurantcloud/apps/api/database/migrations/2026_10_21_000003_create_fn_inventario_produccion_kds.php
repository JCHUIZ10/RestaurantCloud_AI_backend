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
        // 1. Agregar columna de control de idempotencia a pedido_item
        DB::statement('ALTER TABLE pedido_item ADD COLUMN IF NOT EXISTS stock_descontado BOOL NOT NULL DEFAULT false;');

        // 2. Función PL/pgSQL: Descontar receta culinaria (KDS y despacho de salón)
        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_inventario_descontar_receta(
    p_pedido_item_id UUID,
    p_usuario_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_producto RECORD;
    v_pedido RECORD;
    v_ing RECORD;
    v_insumo RECORD;
    v_dosis DECIMAL(12, 5);
    v_consumo DECIMAL(12, 3);
    v_stock_anterior DECIMAL(12, 3);
    v_stock_nuevo DECIMAL(12, 3);
    v_insumos_descontados JSONB := '[]'::JSONB;
    v_platos_afectados JSONB := '[]'::JSONB;
    v_inconsistencias INT := 0;
    v_auditoria_id UUID;
    v_quiebres_insumo INT := 0;
BEGIN
    -- 1. Obtener y bloquear el pedido_item
    SELECT pi.id, pi.pedido_id, pi.producto_id, pi.cantidad, pi.estado, pi.stock_descontado
    INTO v_item
    FROM pedido_item pi
    WHERE pi.id = p_pedido_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PEDIDO_ITEM_NO_ENCONTRADO: Ítem de pedido % no existe', p_pedido_item_id;
    END IF;

    -- Si ya fue descontado, retornar idempotente sin duplicar
    IF v_item.stock_descontado THEN
        RETURN jsonb_build_object(
            'pedido_item_id', p_pedido_item_id,
            'descontado', false,
            'ya_descontado', true,
            'mensaje', 'El stock de este ítem ya fue descontado previamente.',
            'insumos_descontados', '[]'::JSONB,
            'quiebres_generados', '[]'::JSONB
        );
    END IF;

    -- 2. Obtener datos del pedido y local
    SELECT p.id, p.local_id, p.numero_comanda
    INTO v_pedido
    FROM pedido p
    WHERE p.id = v_item.pedido_id;

    -- 3. Obtener datos del producto
    SELECT pr.id, pr.nombre, pr.requiere_preparacion
    INTO v_producto
    FROM producto pr
    WHERE pr.id = v_item.producto_id;

    -- 4. Iterar sobre la receta culinaria de producto_insumo
    FOR v_ing IN
        SELECT
            pi.insumo_id,
            pi.modo_calculo,
            pi.rendimiento_platos,
            pi.cantidad_descuenta
        FROM producto_insumo pi
        WHERE pi.producto_id = v_item.producto_id
    LOOP
        -- Calcular dosis unitaria
        IF v_ing.modo_calculo = 'rendimiento' AND v_ing.rendimiento_platos > 0 THEN
            v_dosis := (1.0 / v_ing.rendimiento_platos);
        ELSE
            v_dosis := v_ing.cantidad_descuenta;
        END IF;

        -- Consumo total para la cantidad del ítem
        v_consumo := ROUND((v_dosis * v_item.cantidad)::NUMERIC, 3);

        -- Bloquear fila del insumo
        SELECT i.id, i.nombre, i.unidad_medida, i.stock_actual, i.estado
        INTO v_insumo
        FROM insumo i
        WHERE i.id = v_ing.insumo_id AND i.local_id = v_pedido.local_id
        FOR UPDATE;

        IF FOUND THEN
            v_stock_anterior := v_insumo.stock_actual;

            -- Política de No-Bloqueo de Fogones:
            IF v_stock_anterior < v_consumo THEN
                v_inconsistencias := v_inconsistencias + 1;
                v_stock_nuevo := 0.000;

                -- Asentar inconsistencia en auditoria_stock_ajuste
                v_auditoria_id := fn_uuid_v8();
                INSERT INTO auditoria_stock_ajuste (
                    id, local_id, insumo_id, usuario_id,
                    stock_anterior, stock_nuevo, diferencia,
                    motivo, notas, created_at
                ) VALUES (
                    v_auditoria_id, v_pedido.local_id, v_insumo.id, p_usuario_id,
                    v_stock_anterior, 0.000, -v_stock_anterior,
                    'inconsistencia_cocina',
                    FORMAT('Inconsistencia en cocina: Plato "%s" (Comanda #%s) requería %s %s pero solo había %s',
                           v_producto.nombre, v_pedido.numero_comanda, v_consumo, v_insumo.unidad_medida, v_stock_anterior),
                    NOW()
                );
            ELSE
                v_stock_nuevo := v_stock_anterior - v_consumo;
            END IF;

            -- Actualizar stock del insumo y conmutar a agotado si stock = 0
            UPDATE insumo
            SET stock_actual = v_stock_nuevo,
                estado = CASE WHEN v_stock_nuevo <= 0 THEN 'agotado' ELSE estado END,
                updated_at = NOW()
            WHERE id = v_insumo.id;

            -- Cascada a carta si stock llegó a 0
            IF v_stock_nuevo <= 0 THEN
                v_quiebres_insumo := v_quiebres_insumo + 1;

                WITH platos_quiebre AS (
                    UPDATE producto p
                    SET disponibilidad = 'agotado',
                        motivo_agotado = 'quiebre_stock_receta',
                        updated_at = NOW()
                    FROM producto_insumo pi2
                    WHERE pi2.producto_id = p.id
                      AND pi2.insumo_id = v_insumo.id
                      AND p.disponibilidad = 'disponible'
                      AND p.local_id = v_pedido.local_id
                    RETURNING p.id, p.nombre
                )
                SELECT COALESCE(v_platos_afectados || jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'insumo_agotado', v_insumo.nombre)), v_platos_afectados)
                INTO v_platos_afectados
                FROM platos_quiebre;
            END IF;

            v_insumos_descontados := v_insumos_descontados || jsonb_build_object(
                'insumo_id', v_insumo.id,
                'insumo_nombre', v_insumo.nombre,
                'unidad_medida', v_insumo.unidad_medida,
                'dosis', v_dosis,
                'cantidad_item', v_item.cantidad,
                'consumo_total', v_consumo,
                'stock_anterior', v_stock_anterior,
                'stock_nuevo', v_stock_nuevo,
                'hubo_inconsistencia', (v_stock_anterior < v_consumo)
            );
        END IF;
    END LOOP;

    -- 5. Marcar item como stock_descontado = true
    UPDATE pedido_item
    SET stock_descontado = true,
        updated_at = NOW()
    WHERE id = p_pedido_item_id;

    RETURN jsonb_build_object(
        'pedido_item_id', p_pedido_item_id,
        'descontado', true,
        'ya_descontado', false,
        'producto_nombre', v_producto.nombre,
        'cantidad', v_item.cantidad,
        'insumos_descontados', v_insumos_descontados,
        'inconsistencias', v_inconsistencias,
        'quiebres_generados', v_platos_afectados,
        'mensaje', FORMAT('Receta de "%s" descontada exitosamente (%s insumos procesados).', v_producto.nombre, jsonb_array_length(v_insumos_descontados))
    );
END;
$$ LANGUAGE plpgsql VOLATILE;
SQL);

        // 3. Función PL/pgSQL: Revertir receta culinaria (Deshacer KDS de 30s)
        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_inventario_revertir_receta(
    p_pedido_item_id UUID,
    p_usuario_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_producto RECORD;
    v_pedido RECORD;
    v_ing RECORD;
    v_insumo RECORD;
    v_dosis DECIMAL(12, 5);
    v_consumo DECIMAL(12, 3);
    v_stock_anterior DECIMAL(12, 3);
    v_stock_nuevo DECIMAL(12, 3);
    v_insumos_restituidos JSONB := '[]'::JSONB;
    v_platos_reactivados JSONB := '[]'::JSONB;
BEGIN
    -- 1. Obtener y bloquear el pedido_item
    SELECT pi.id, pi.pedido_id, pi.producto_id, pi.cantidad, pi.estado, pi.stock_descontado
    INTO v_item
    FROM pedido_item pi
    WHERE pi.id = p_pedido_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PEDIDO_ITEM_NO_ENCONTRADO: Ítem de pedido % no existe', p_pedido_item_id;
    END IF;

    -- Si NO estaba descontado, retornar sin error
    IF NOT v_item.stock_descontado THEN
        RETURN jsonb_build_object(
            'pedido_item_id', p_pedido_item_id,
            'revertido', false,
            'no_descontado', true,
            'mensaje', 'El stock de este ítem no estaba descontado.',
            'insumos_restituidos', '[]'::JSONB,
            'platos_reactivados', '[]'::JSONB
        );
    END IF;

    -- 2. Obtener datos del pedido y local
    SELECT p.id, p.local_id, p.numero_comanda
    INTO v_pedido
    FROM pedido p
    WHERE p.id = v_item.pedido_id;

    -- 3. Obtener datos del producto
    SELECT pr.id, pr.nombre
    INTO v_producto
    FROM producto pr
    WHERE pr.id = v_item.producto_id;

    -- 4. Iterar sobre la receta culinaria de producto_insumo
    FOR v_ing IN
        SELECT
            pi.insumo_id,
            pi.modo_calculo,
            pi.rendimiento_platos,
            pi.cantidad_descuenta
        FROM producto_insumo pi
        WHERE pi.producto_id = v_item.producto_id
    LOOP
        IF v_ing.modo_calculo = 'rendimiento' AND v_ing.rendimiento_platos > 0 THEN
            v_dosis := (1.0 / v_ing.rendimiento_platos);
        ELSE
            v_dosis := v_ing.cantidad_descuenta;
        END IF;

        v_consumo := ROUND((v_dosis * v_item.cantidad)::NUMERIC, 3);

        SELECT i.id, i.nombre, i.unidad_medida, i.stock_actual, i.estado
        INTO v_insumo
        FROM insumo i
        WHERE i.id = v_ing.insumo_id AND i.local_id = v_pedido.local_id
        FOR UPDATE;

        IF FOUND THEN
            v_stock_anterior := v_insumo.stock_actual;
            v_stock_nuevo := v_stock_anterior + v_consumo;

            -- Actualizar insumo y reactivar si estaba agotado
            UPDATE insumo
            SET stock_actual = v_stock_nuevo,
                estado = CASE WHEN v_insumo.estado = 'agotado' AND v_stock_nuevo > 0 THEN 'activo' ELSE estado END,
                updated_at = NOW()
            WHERE id = v_insumo.id;

            -- Evaluar reactivación de platos en carta que estaban agotados por quiebre_stock_receta
            IF v_insumo.estado = 'agotado' AND v_stock_nuevo > 0 THEN
                WITH platos_reactivados AS (
                    UPDATE producto p
                    SET disponibilidad = 'disponible',
                        motivo_agotado = NULL,
                        updated_at = NOW()
                    WHERE p.local_id = v_pedido.local_id
                      AND p.disponibilidad = 'agotado'
                      AND p.motivo_agotado = 'quiebre_stock_receta'
                      -- Verificar que NO tenga ningún otro insumo en quiebre
                      AND NOT EXISTS (
                          SELECT 1
                          FROM producto_insumo pi2
                          JOIN insumo i2 ON i2.id = pi2.insumo_id
                          WHERE pi2.producto_id = p.id
                            AND (i2.stock_actual <= 0 OR i2.estado = 'agotado')
                      )
                    RETURNING p.id, p.nombre
                )
                SELECT COALESCE(v_platos_reactivados || jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre)), v_platos_reactivados)
                INTO v_platos_reactivados
                FROM platos_reactivados;
            END IF;

            v_insumos_restituidos := v_insumos_restituidos || jsonb_build_object(
                'insumo_id', v_insumo.id,
                'insumo_nombre', v_insumo.nombre,
                'unidad_medida', v_insumo.unidad_medida,
                'consumo_revertido', v_consumo,
                'stock_anterior', v_stock_anterior,
                'stock_nuevo', v_stock_nuevo
            );
        END IF;
    END LOOP;

    -- 5. Marcar item como stock_descontado = false
    UPDATE pedido_item
    SET stock_descontado = false,
        updated_at = NOW()
    WHERE id = p_pedido_item_id;

    RETURN jsonb_build_object(
        'pedido_item_id', p_pedido_item_id,
        'revertido', true,
        'producto_nombre', v_producto.nombre,
        'insumos_restituidos', v_insumos_restituidos,
        'platos_reactivados', v_platos_reactivados,
        'mensaje', FORMAT('Receta de "%s" restituida exitosamente (%s insumos devueltos a bodega).', v_producto.nombre, jsonb_array_length(v_insumos_restituidos))
    );
END;
$$ LANGUAGE plpgsql VOLATILE;
SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP FUNCTION IF EXISTS fn_inventario_revertir_receta(UUID, UUID);');
        DB::statement('DROP FUNCTION IF EXISTS fn_inventario_descontar_receta(UUID, UUID);');
        DB::statement('ALTER TABLE pedido_item DROP COLUMN IF EXISTS stock_descontado;');
    }
};
