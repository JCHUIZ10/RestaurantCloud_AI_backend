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
            CREATE OR REPLACE FUNCTION fn_receta_guardar(
                p_producto_id UUID,
                p_local_id UUID,
                p_items JSONB
            )
            RETURNS JSONB AS $$
            DECLARE
                v_producto RECORD;
                v_item JSONB;
                v_insumo_id UUID;
                v_modo_calculo VARCHAR(20);
                v_rendimiento_platos DECIMAL(10, 2);
                v_cantidad_descuenta DECIMAL(12, 5);
                v_insumo_count INT;
                v_costo_teorico DECIMAL(10, 2) := 0.00;
                v_margen_bruto_pct DECIMAL(5, 1) := 0.0;
                v_hay_quiebre BOOLEAN := false;
                v_disponibilidad_nueva VARCHAR(20);
                v_motivo_agotado_nuevo VARCHAR(30);
                v_total_ingredientes INT := 0;
            BEGIN
                -- 1. Validar que el producto existe y pertenece al local
                SELECT id, local_id, nombre, precio, disponibilidad, motivo_agotado
                INTO v_producto
                FROM producto
                WHERE id = p_producto_id AND local_id = p_local_id
                FOR UPDATE;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'ERR_PRODUCTO_NO_ENCONTRADO: El producto % no existe en la sede %', p_producto_id, p_local_id;
                END IF;

                -- 2. Limpiar receta anterior
                DELETE FROM producto_insumo WHERE producto_id = p_producto_id;

                -- 3. Si p_items tiene elementos, procesar e insertar cada ingrediente
                IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
                    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
                    LOOP
                        v_insumo_id := (v_item->>'insumo_id')::UUID;
                        v_modo_calculo := COALESCE(v_item->>'modo_calculo', 'exacto');
                        
                        IF v_item ? 'rendimiento_platos' AND (v_item->>'rendimiento_platos') IS NOT NULL AND (v_item->>'rendimiento_platos') <> '' THEN
                            v_rendimiento_platos := (v_item->>'rendimiento_platos')::DECIMAL;
                        ELSE
                            v_rendimiento_platos := NULL;
                        END IF;

                        v_cantidad_descuenta := (v_item->>'cantidad_descuenta')::DECIMAL;

                        -- Validar que el insumo pertenece a la misma sede y está activo/agotado (no inactivo)
                        SELECT COUNT(*) INTO v_insumo_count
                        FROM insumo
                        WHERE id = v_insumo_id AND local_id = p_local_id AND estado != 'inactivo';

                        IF v_insumo_count = 0 THEN
                            RAISE EXCEPTION 'ERR_INSUMO_INVALIDO: El insumo % no pertenece a la sede o está inactivo', v_insumo_id;
                        END IF;

                        IF v_cantidad_descuenta <= 0 THEN
                            RAISE EXCEPTION 'ERR_DOSIS_INVALIDA: La dosis a descontar debe ser mayor a 0 para el insumo %', v_insumo_id;
                        END IF;

                        INSERT INTO producto_insumo (
                            producto_id, insumo_id, modo_calculo, rendimiento_platos, cantidad_descuenta
                        ) VALUES (
                            p_producto_id, v_insumo_id, v_modo_calculo, v_rendimiento_platos, v_cantidad_descuenta
                        );

                        v_total_ingredientes := v_total_ingredientes + 1;
                    END LOOP;
                END IF;

                -- 4. Calcular costo teórico en base a la receta real
                SELECT COALESCE(SUM(pi.cantidad_descuenta * i.costo_unitario), 0.00)
                INTO v_costo_teorico
                FROM producto_insumo pi
                JOIN insumo i ON i.id = pi.insumo_id
                WHERE pi.producto_id = p_producto_id;

                -- 5. Calcular margen bruto (%)
                IF v_producto.precio > 0 THEN
                    v_margen_bruto_pct := ROUND((((v_producto.precio - v_costo_teorico) / v_producto.precio) * 100)::NUMERIC, 1);
                ELSE
                    v_margen_bruto_pct := 0.0;
                END IF;

                -- 6. Evaluar quiebre de stock de insumos
                SELECT EXISTS (
                    SELECT 1
                    FROM producto_insumo pi
                    JOIN insumo i ON i.id = pi.insumo_id
                    WHERE pi.producto_id = p_producto_id
                      AND (i.stock_actual <= 0 OR i.estado = 'agotado')
                ) INTO v_hay_quiebre;

                v_disponibilidad_nueva := v_producto.disponibilidad;
                v_motivo_agotado_nuevo := v_producto.motivo_agotado;

                IF v_hay_quiebre THEN
                    v_disponibilidad_nueva := 'agotado';
                    v_motivo_agotado_nuevo := 'quiebre_stock_receta';
                ELSIF v_producto.disponibilidad = 'agotado' AND v_producto.motivo_agotado = 'quiebre_stock_receta' THEN
                    v_disponibilidad_nueva := 'disponible';
                    v_motivo_agotado_nuevo := NULL;
                END IF;

                -- 7. Actualizar tabla producto
                UPDATE producto
                SET costo_estandar = v_costo_teorico,
                    disponibilidad = v_disponibilidad_nueva,
                    motivo_agotado = v_motivo_agotado_nuevo,
                    updated_at = NOW()
                WHERE id = p_producto_id;

                RETURN jsonb_build_object(
                    'producto_id', p_producto_id,
                    'nombre', v_producto.nombre,
                    'costo_teorico', v_costo_teorico,
                    'margen_bruto_pct', v_margen_bruto_pct,
                    'disponibilidad', v_disponibilidad_nueva,
                    'motivo_agotado', v_motivo_agotado_nuevo,
                    'total_ingredientes', v_total_ingredientes,
                    'mensaje', FORMAT('Receta de "%s" guardada exitosamente (%s ingredientes).', v_producto.nombre, v_total_ingredientes)
                );
            END;
            $$ LANGUAGE plpgsql VOLATILE;

            CREATE OR REPLACE FUNCTION fn_receta_calcular_capacidad(
                p_producto_id UUID,
                p_local_id UUID
            )
            RETURNS JSONB AS $$
            DECLARE
                v_producto RECORD;
                v_detalles JSONB := '[]'::JSONB;
                v_capacidad_maxima INT := 0;
                v_cuello_botella_id UUID := NULL;
                v_cuello_botella_nombre VARCHAR := '';
                v_min_raciones INT := 2147483647;
                r RECORD;
            BEGIN
                SELECT id, local_id, nombre INTO v_producto
                FROM producto
                WHERE id = p_producto_id AND local_id = p_local_id;

                IF NOT FOUND THEN
                    RAISE EXCEPTION 'ERR_PRODUCTO_NO_ENCONTRADO: El producto % no existe en la sede %', p_producto_id, p_local_id;
                END IF;

                -- Si no tiene receta, capacidad es 0
                IF NOT EXISTS (SELECT 1 FROM producto_insumo WHERE producto_id = p_producto_id) THEN
                    RETURN jsonb_build_object(
                        'capacidad_maxima_platos', 0,
                        'insumo_cuello_botella_id', NULL,
                        'insumo_cuello_botella_nombre', 'Sin receta asignada',
                        'detalles', '[]'::JSONB
                    );
                END IF;

                FOR r IN
                    SELECT
                        pi.insumo_id,
                        i.nombre as insumo_nombre,
                        i.stock_actual,
                        i.unidad_medida,
                        pi.cantidad_descuenta,
                        CASE 
                            WHEN pi.cantidad_descuenta > 0 THEN FLOOR(i.stock_actual / pi.cantidad_descuenta)::INT
                            ELSE 0
                        END as platos_posibles
                    FROM producto_insumo pi
                    JOIN insumo i ON i.id = pi.insumo_id
                    WHERE pi.producto_id = p_producto_id
                    ORDER BY platos_posibles ASC
                LOOP
                    IF r.platos_posibles < v_min_raciones THEN
                        v_min_raciones := r.platos_posibles;
                        v_cuello_botella_id := r.insumo_id;
                        v_cuello_botella_nombre := r.insumo_nombre;
                    END IF;

                    v_detalles := v_detalles || jsonb_build_object(
                        'insumo_id', r.insumo_id,
                        'insumo_nombre', r.insumo_nombre,
                        'stock_actual', r.stock_actual,
                        'unidad_medida', r.unidad_medida,
                        'cantidad_descuenta', r.cantidad_descuenta,
                        'platos_posibles', r.platos_posibles,
                        'es_cuello_botella', false
                    );
                END LOOP;

                IF v_min_raciones = 2147483647 THEN
                    v_capacidad_maxima := 0;
                ELSE
                    v_capacidad_maxima := v_min_raciones;
                END IF;

                -- Marcar el cuello de botella en el array JSONB
                SELECT COALESCE(
                    jsonb_agg(
                        jsonb_set(
                            elem,
                            '{es_cuello_botella}',
                            to_jsonb((elem->>'insumo_id')::UUID = v_cuello_botella_id)
                        )
                    ),
                    '[]'::JSONB
                )
                INTO v_detalles
                FROM jsonb_array_elements(v_detalles) elem;

                RETURN jsonb_build_object(
                    'capacidad_maxima_platos', v_capacidad_maxima,
                    'insumo_cuello_botella_id', v_cuello_botella_id,
                    'insumo_cuello_botella_nombre', v_cuello_botella_nombre,
                    'detalles', v_detalles
                );
            END;
            $$ LANGUAGE plpgsql STABLE;
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP FUNCTION IF EXISTS fn_receta_calcular_capacidad(UUID, UUID);');
        DB::unprepared('DROP FUNCTION IF EXISTS fn_receta_guardar(UUID, UUID, JSONB);');
    }
};
