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
CREATE OR REPLACE FUNCTION fn_inventario_reingresar_item_sellado(
    p_pedido_item_id UUID,
    p_usuario_id UUID,
    p_motivo TEXT DEFAULT NULL
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
    v_auditoria_id UUID;
    v_insumos_restituidos JSONB := '[]'::JSONB;
    v_platos_reactivados JSONB := '[]'::JSONB;
BEGIN
    -- 1. Obtener y bloquear el pedido_item
    SELECT pi.id, pi.pedido_id, pi.producto_id, pi.cantidad, pi.estado, pi.stock_descontado, pi.es_merma
    INTO v_item
    FROM pedido_item pi
    WHERE pi.id = p_pedido_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PEDIDO_ITEM_NO_ENCONTRADO: Ítem de pedido % no existe', p_pedido_item_id;
    END IF;

    -- Si NO estaba descontado, retornar de forma idempotente sin error
    IF NOT v_item.stock_descontado THEN
        RETURN jsonb_build_object(
            'pedido_item_id', p_pedido_item_id,
            'reingresado', false,
            'no_descontado', true,
            'mensaje', 'El stock de este ítem no estaba descontado previamente.',
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

            -- Actualizar existencias del insumo y reactivar si estaba agotado
            UPDATE insumo
            SET stock_actual = v_stock_nuevo,
                estado = CASE WHEN v_insumo.estado = 'agotado' AND v_stock_nuevo > 0 THEN 'activo' ELSE estado END,
                updated_at = NOW()
            WHERE id = v_insumo.id;

            -- Asentar movimiento inmutable en auditoria_stock_ajuste con motivo 'ingreso_manual'
            v_auditoria_id := fn_uuid_v8();
            INSERT INTO auditoria_stock_ajuste (
                id, local_id, insumo_id, usuario_id,
                stock_anterior, stock_nuevo, diferencia,
                motivo, notas, created_at
            ) VALUES (
                v_auditoria_id, v_pedido.local_id, v_insumo.id, p_usuario_id,
                v_stock_anterior, v_stock_nuevo, v_consumo,
                'ingreso_manual',
                FORMAT('Reingreso de ítem sellado: %s x "%s" (Comanda #%s). Motivo: %s',
                       v_item.cantidad, v_producto.nombre, v_pedido.numero_comanda, COALESCE(p_motivo, 'Restitución asistida de ítem sellado')),
                NOW()
            );

            -- Reactivación de platos en carta que estaban agotados por quiebre_stock_receta
            IF v_insumo.estado = 'agotado' AND v_stock_nuevo > 0 THEN
                WITH platos_reactivados AS (
                    UPDATE producto p
                    SET disponibilidad = 'disponible',
                        motivo_agotado = NULL,
                        updated_at = NOW()
                    WHERE p.local_id = v_pedido.local_id
                      AND p.disponibilidad = 'agotado'
                      AND p.motivo_agotado = 'quiebre_stock_receta'
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
                'stock_nuevo', v_stock_nuevo,
                'auditoria_id', v_auditoria_id
            );
        END IF;
    END LOOP;

    -- 5. Conmutar el ítem a stock_descontado = false y descartar merma
    UPDATE pedido_item
    SET stock_descontado = false,
        es_merma = false,
        updated_at = NOW()
    WHERE id = p_pedido_item_id;

    RETURN jsonb_build_object(
        'pedido_item_id', p_pedido_item_id,
        'reingresado', true,
        'producto_nombre', v_producto.nombre,
        'cantidad', v_item.cantidad,
        'insumos_restituidos', v_insumos_restituidos,
        'platos_reactivados', v_platos_reactivados,
        'mensaje', FORMAT('Ítem sellado "%s" reingresado a bodega exitosamente (%s insumos devueltos).', v_producto.nombre, jsonb_array_length(v_insumos_restituidos))
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
        DB::statement('DROP FUNCTION IF EXISTS fn_inventario_reingresar_item_sellado(UUID, UUID, TEXT);');
    }
};
