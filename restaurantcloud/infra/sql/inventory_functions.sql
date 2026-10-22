-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 08: INVENTORY FUNCTIONS (FUNCIONES DE INVENTARIO)
-- Motor: PostgreSQL 16
-- Dominio: Inventario, Control de Stock, Mermas y Auditoría (CU-ADMIN-03)
-- ==============================================================================

SET client_encoding = 'UTF8';

-- ------------------------------------------------------------------------------
-- 1. AJUSTE FÍSICO DE STOCK CON AUDITORÍA OBLIGATORIA (CU-ADMIN-03)
-- ------------------------------------------------------------------------------
-- Aplica bloqueo exclusivo a nivel de fila (FOR UPDATE) sobre el insumo.
-- Registra inmutablemente la diferencia en auditoria_stock_ajuste.
-- Si el stock llega a 0, conmuta insumo.estado = 'agotado' y en cascada
-- apaga la disponibilidad de los platos dependientes en la carta (producto)
-- observando pedidos en cola en cocina (pedido_item.estado = 'no_disponible').
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

        -- Identificar pedidos en cola en cocina para marcar 'no_disponible'
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


-- ------------------------------------------------------------------------------
-- 2. CALIBRACIÓN Y GUARDADO ATÓMICO DE RECETAS CULINARIAS (CU-ADMIN-04)
-- ------------------------------------------------------------------------------
-- Valida pertenencia de insumos al mismo local_id.
-- Reemplaza atómicamente producto_insumo, recalcula costo_estandar en producto
-- y evalúa disponibilidad (quiebre vs reactivación automática).
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

-- ------------------------------------------------------------------------------
-- 3. SIMULADOR DE CAPACIDAD DE BODEGA E INSUMO CUELLO DE BOTELLA (CU-ADMIN-04)
-- ------------------------------------------------------------------------------
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


-- ------------------------------------------------------------------------------
-- 4. DEDUCCIÓN ATÓMICA DE RECETA POR PRODUCCIÓN KDS / DESPACHO (CU-COCINA-02, CU-MOZO-02)
-- ------------------------------------------------------------------------------
-- Deduce insumos según receta culinaria y cantidad despachada.
-- Idempotente: Si pedido_item.stock_descontado = true, retorna sin duplicar.
-- Política Poka-Yoke de No-Bloqueo: Si stock < consumo, stock queda en 0 y
-- asienta 'inconsistencia_cocina' en auditoria_stock_ajuste sin detener fogones.
-- Conmuta automáticamente disponibilidad = 'agotado' en carta ante quiebre.
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
    SELECT pi.id, pi.pedido_id, pi.producto_id, pi.cantidad, pi.estado, pi.stock_descontado
    INTO v_item
    FROM pedido_item pi
    WHERE pi.id = p_pedido_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PEDIDO_ITEM_NO_ENCONTRADO: Ítem de pedido % no existe', p_pedido_item_id;
    END IF;

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

    SELECT p.id, p.local_id, p.numero_comanda
    INTO v_pedido
    FROM pedido p
    WHERE p.id = v_item.pedido_id;

    SELECT pr.id, pr.nombre, pr.requiere_preparacion
    INTO v_producto
    FROM producto pr
    WHERE pr.id = v_item.producto_id;

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

            IF v_stock_anterior < v_consumo THEN
                v_inconsistencias := v_inconsistencias + 1;
                v_stock_nuevo := 0.000;

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

            UPDATE insumo
            SET stock_actual = v_stock_nuevo,
                estado = CASE WHEN v_stock_nuevo <= 0 THEN 'agotado' ELSE estado END,
                updated_at = NOW()
            WHERE id = v_insumo.id;

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


-- ------------------------------------------------------------------------------
-- 5. REVERSIÓN / RESTITUCIÓN DE RECETA (DESHACER KDS 30s) (CU-COCINA-02)
-- ------------------------------------------------------------------------------
-- Restituye el 100% de los insumos consumidos si pedido_item.stock_descontado = true.
-- Reactiva insumos a 'activo' y reactiva platos en carta si el quiebre fue superado.
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
    SELECT pi.id, pi.pedido_id, pi.producto_id, pi.cantidad, pi.estado, pi.stock_descontado
    INTO v_item
    FROM pedido_item pi
    WHERE pi.id = p_pedido_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PEDIDO_ITEM_NO_ENCONTRADO: Ítem de pedido % no existe', p_pedido_item_id;
    END IF;

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

    SELECT p.id, p.local_id, p.numero_comanda
    INTO v_pedido
    FROM pedido p
    WHERE p.id = v_item.pedido_id;

    SELECT pr.id, pr.nombre
    INTO v_producto
    FROM producto pr
    WHERE pr.id = v_item.producto_id;

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

            UPDATE insumo
            SET stock_actual = v_stock_nuevo,
                estado = CASE WHEN v_insumo.estado = 'agotado' AND v_stock_nuevo > 0 THEN 'activo' ELSE estado END,
                updated_at = NOW()
            WHERE id = v_insumo.id;

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
                'stock_nuevo', v_stock_nuevo
            );
        END IF;
    END LOOP;

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
