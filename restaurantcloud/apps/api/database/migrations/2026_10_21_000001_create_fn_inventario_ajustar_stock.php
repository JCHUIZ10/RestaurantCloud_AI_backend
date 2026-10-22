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
            CREATE OR REPLACE FUNCTION fn_inventario_ajustar_stock(
                p_insumo_id UUID,
                p_local_id UUID,
                p_usuario_id UUID,
                p_stock_nuevo DECIMAL,
                p_motivo VARCHAR,
                p_notas TEXT
            )
            RETURNS JSONB AS $$
            DECLARE
                v_insumo RECORD;
                v_stock_anterior DECIMAL(12, 3);
                v_diferencia DECIMAL(12, 3);
                v_estado_resultante VARCHAR(20);
                v_auditoria_id UUID;
                v_platos_bloqueados JSONB := '[]'::JSONB;
                v_pedidos_observados JSONB := '[]'::JSONB;
            BEGIN
                -- 1. Bloqueo exclusivo de fila
                SELECT id, nombre, stock_actual, estado, local_id
                INTO v_insumo
                FROM insumo
                WHERE id = p_insumo_id AND local_id = p_local_id
                FOR UPDATE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'ERR_INSUMO_NO_ENCONTRADO: Insumo % no existe en sede %', p_insumo_id, p_local_id;
                END IF;

                IF p_stock_nuevo < 0 THEN
                    RAISE EXCEPTION 'ERR_STOCK_NEGATIVO: El stock físico no puede ser menor a 0';
                END IF;

                v_stock_anterior := v_insumo.stock_actual;
                v_diferencia := p_stock_nuevo - v_stock_anterior;

                -- 2. Estado resultante
                IF p_stock_nuevo = 0 THEN
                    v_estado_resultante := 'agotado';
                ELSIF v_insumo.estado = 'agotado' AND p_stock_nuevo > 0 THEN
                    v_estado_resultante := 'activo';
                ELSE
                    v_estado_resultante := v_insumo.estado;
                END IF;

                -- 3. Inserción inmutable de auditoría
                v_auditoria_id := fn_uuid_v8();

                INSERT INTO auditoria_stock_ajuste (
                    id, local_id, insumo_id, usuario_id,
                    stock_anterior, stock_nuevo, diferencia,
                    motivo, notas, created_at
                ) VALUES (
                    v_auditoria_id, p_local_id, p_insumo_id, p_usuario_id,
                    v_stock_anterior, p_stock_nuevo, v_diferencia,
                    p_motivo, p_notas, NOW()
                );

                -- 4. Actualizar insumo
                UPDATE insumo
                SET stock_actual = p_stock_nuevo,
                    estado = v_estado_resultante,
                    updated_at = NOW()
                WHERE id = p_insumo_id;

                -- 5. Cascada a carta si stock = 0
                IF p_stock_nuevo = 0 THEN
                    WITH platos_afectados AS (
                        UPDATE producto p
                        SET disponibilidad = 'agotado',
                            motivo_agotado = 'quiebre_stock_receta',
                            updated_at = NOW()
                        FROM producto_insumo pi
                        WHERE pi.producto_id = p.id
                          AND pi.insumo_id = p_insumo_id
                          AND p.disponibilidad = 'disponible'
                        RETURNING p.id, p.nombre
                    )
                    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre)), '[]'::JSONB)
                    INTO v_platos_bloqueados
                    FROM platos_afectados;

                    -- Pedidos en cola afectados en cocina
                    WITH items_afectados AS (
                        UPDATE pedido_item pit
                        SET estado = 'no_disponible',
                            updated_at = NOW()
                        FROM producto_insumo pi, pedido ped, mesa m
                        WHERE pit.producto_id = pi.producto_id
                          AND pi.insumo_id = p_insumo_id
                          AND pit.estado = 'en_cola'
                          AND pit.pedido_id = ped.id
                          AND ped.mesa_id = m.id
                          AND ped.local_id = p_local_id
                        RETURNING ped.id as pedido_id, m.numero as mesa, pit.producto_id, ped.mozo_id
                    )
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'pedido_id', pedido_id,
                        'mesa', mesa,
                        'producto', p.nombre,
                        'mozo_id', mozo_id,
                        'alerta_emitida', true
                    )), '[]'::JSONB)
                    INTO v_pedidos_observados
                    FROM items_afectados ia
                    JOIN producto p ON p.id = ia.producto_id;
                END IF;

                RETURN jsonb_build_object(
                    'insumo_id', p_insumo_id,
                    'nombre', v_insumo.nombre,
                    'stock_anterior', v_stock_anterior,
                    'stock_nuevo', p_stock_nuevo,
                    'diferencia', v_diferencia,
                    'estado_resultante', v_estado_resultante,
                    'auditoria_id', v_auditoria_id,
                    'platos_bloqueados_en_carta', v_platos_bloqueados,
                    'pedidos_en_cola_observados', v_pedidos_observados,
                    'mensaje', FORMAT('Stock de "%s" ajustado de %s a %s (Dif: %s).', v_insumo.nombre, v_stock_anterior, p_stock_nuevo, v_diferencia)
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
        DB::unprepared('DROP FUNCTION IF EXISTS fn_inventario_ajustar_stock(UUID, UUID, UUID, DECIMAL, VARCHAR, TEXT);');
    }
};
