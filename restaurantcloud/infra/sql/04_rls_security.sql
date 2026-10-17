-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 04: POLÍTICAS DE ROW-LEVEL SECURITY (RLS)
-- Motor: PostgreSQL 16
-- Aislamiento: Fail-Closed por empresa_id y local_id con Bypass para admin_saas
-- ==============================================================================

-- 1. FUNCIÓN AUXILIAR DE VALIDACIÓN DE ÁMBITO DE SEDE (LOCAL / PROPIETARIO)
CREATE OR REPLACE FUNCTION fn_pertenece_tenant(p_local_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Bypass para Administrador Global SaaS
    IF fn_es_admin_saas() THEN
        RETURN true;
    END IF;

    -- 2. Coincidencia directa de sede si está fijada en la sesión
    IF NULLIF(current_setting('app.current_local_id', true), '') IS NOT NULL THEN
        RETURN p_local_id = current_setting('app.current_local_id', true)::UUID;
    END IF;

    -- 3. Acceso multisede para Propietario (resuelto vía empresa_id)
    IF NULLIF(current_setting('app.current_empresa_id', true), '') IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM local 
            WHERE id = p_local_id 
              AND empresa_id = current_setting('app.current_empresa_id', true)::UUID
        );
    END IF;

    -- 4. Acceso público controlado (menú digital / QR)
    IF current_setting('app.public_access', true) = 'true' THEN
        RETURN EXISTS (
            SELECT 1 FROM local WHERE id = p_local_id AND estado = 'activo'
        );
    END IF;

    -- Falla cerrado por defecto
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. HABILITACIÓN DE RLS Y POLÍTICAS EN TABLAS DE TENANT (empresa_id)
-- ------------------------------------------------------------------------------

-- 2.1 Empresa
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_empresa_isolation ON empresa;
CREATE POLICY p_empresa_isolation ON empresa
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
        OR current_setting('app.public_access', true) = 'true'
    );

-- 2.2 Suscripción
ALTER TABLE suscripcion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_suscripcion_isolation ON suscripcion;
CREATE POLICY p_suscripcion_isolation ON suscripcion
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
    );

-- 2.3 Pagos
ALTER TABLE pago ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_pago_isolation ON pago;
CREATE POLICY p_pago_isolation ON pago
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
    );

-- 2.4 Usuarios
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_usuario_isolation ON usuario;
CREATE POLICY p_usuario_isolation ON usuario
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
        OR id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
    );

-- 2.5 Clientes
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_cliente_isolation ON cliente;
CREATE POLICY p_cliente_isolation ON cliente
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
    );

-- 2.6 Suspensiones de Suscripción
ALTER TABLE suscripcion_suspension ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_suscripcion_suspension_isolation ON suscripcion_suspension;
CREATE POLICY p_suscripcion_suspension_isolation ON suscripcion_suspension
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
    );

-- 2.7 Notificaciones del Sistema
ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_notificacion_isolation ON notificacion;
CREATE POLICY p_notificacion_isolation ON notificacion
    FOR ALL
    USING (
        fn_es_admin_saas() OR (
            empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
            AND (
                usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID
                OR (
                    usuario_id IS NULL 
                    AND (local_id IS NULL OR fn_pertenece_tenant(local_id))
                    AND (rol_destinatario IS NULL OR rol_destinatario = NULLIF(current_setting('app.current_user_role', true), ''))
                )
            )
        )
    );

-- 2.8 Log de Auditoría
ALTER TABLE log_auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_log_auditoria_isolation ON log_auditoria;
CREATE POLICY p_log_auditoria_isolation ON log_auditoria
    FOR ALL
    USING (
        fn_es_admin_saas() 
        OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
    );

-- ------------------------------------------------------------------------------
-- 3. HABILITACIÓN DE RLS Y POLÍTICAS EN TABLAS DE SEDE (local_id)
-- ------------------------------------------------------------------------------

-- Macro de políticas para entidades operativas vinculadas a local_id
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'local', 'horario_atencion', 'horario_excepcion', 'configuracion_kds',
        'politicas_reserva', 'piso', 'mesa', 'reserva', 'categoria_producto',
        'producto', 'insumo', 'auditoria_stock_ajuste', 'proveedor',
        'ficha_compra', 'promocion', 'metodo_pago_local', 'pedido',
        'caja', 'comprobante_serie', 'gasto_manual', 'caja_movimiento',
        'auditoria_caja_cierre', 'incidente', 'pedido_anulacion', 'snapshot_stock_diario'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'p_' || t || '_tenant', t);
        IF t = 'local' THEN
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting(''app.current_empresa_id'', true), '''')::UUID OR (current_setting(''app.public_access'', true) = ''true'' AND estado = ''activo''));', 'p_' || t || '_tenant', t);
        ELSE
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (fn_pertenece_tenant(local_id));', 'p_' || t || '_tenant', t);
        END IF;
    END LOOP;
END $$;

-- 3.1 Tablas hijas de 2do nivel (resueltas por relación padre)
ALTER TABLE reserva_mesa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_reserva_mesa_tenant ON reserva_mesa;
CREATE POLICY p_reserva_mesa_tenant ON reserva_mesa
    FOR ALL
    USING (EXISTS (SELECT 1 FROM reserva r WHERE r.id = reserva_mesa.reserva_id AND fn_pertenece_tenant(r.local_id)));

ALTER TABLE producto_insumo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_producto_insumo_tenant ON producto_insumo;
CREATE POLICY p_producto_insumo_tenant ON producto_insumo
    FOR ALL
    USING (EXISTS (SELECT 1 FROM producto p WHERE p.id = producto_insumo.producto_id AND fn_pertenece_tenant(p.local_id)));

ALTER TABLE proveedor_insumo_habitual ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_prov_insumo_hab_tenant ON proveedor_insumo_habitual;
CREATE POLICY p_prov_insumo_hab_tenant ON proveedor_insumo_habitual
    FOR ALL
    USING (EXISTS (SELECT 1 FROM proveedor pr WHERE pr.id = proveedor_insumo_habitual.proveedor_id AND fn_pertenece_tenant(pr.local_id)));

ALTER TABLE ficha_compra_detalle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_ficha_compra_detalle_tenant ON ficha_compra_detalle;
CREATE POLICY p_ficha_compra_detalle_tenant ON ficha_compra_detalle
    FOR ALL
    USING (EXISTS (SELECT 1 FROM ficha_compra fc WHERE fc.id = ficha_compra_detalle.ficha_compra_id AND fn_pertenece_tenant(fc.local_id)));

ALTER TABLE pedido_item ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_pedido_item_tenant ON pedido_item;
CREATE POLICY p_pedido_item_tenant ON pedido_item
    FOR ALL
    USING (EXISTS (SELECT 1 FROM pedido p WHERE p.id = pedido_item.pedido_id AND fn_pertenece_tenant(p.local_id)));

ALTER TABLE pedido_subcuenta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_pedido_subcuenta_tenant ON pedido_subcuenta;
CREATE POLICY p_pedido_subcuenta_tenant ON pedido_subcuenta
    FOR ALL
    USING (EXISTS (SELECT 1 FROM pedido p WHERE p.id = pedido_subcuenta.pedido_id AND fn_pertenece_tenant(p.local_id)));

ALTER TABLE pedido_subcuenta_item ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_pedido_subcuenta_item_tenant ON pedido_subcuenta_item;
CREATE POLICY p_pedido_subcuenta_item_tenant ON pedido_subcuenta_item
    FOR ALL
    USING (EXISTS (SELECT 1 FROM pedido_subcuenta ps JOIN pedido p ON p.id = ps.pedido_id WHERE ps.id = pedido_subcuenta_item.subcuenta_id AND fn_pertenece_tenant(p.local_id)));

-- 3.2 Comprobantes: Tenant isolation + Acceso público directo por Token QR (CU-CLIENTE-02)
ALTER TABLE comprobante ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_comprobante_tenant ON comprobante;
CREATE POLICY p_comprobante_tenant ON comprobante
    FOR ALL
    USING (
        fn_pertenece_tenant((SELECT local_id FROM caja WHERE id = comprobante.caja_id))
        OR (current_setting('app.public_access', true) = 'true' AND token_qr = NULLIF(current_setting('app.public_token_qr', true), '')::UUID)
    );

ALTER TABLE comprobante_item ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_comprobante_item_tenant ON comprobante_item;
CREATE POLICY p_comprobante_item_tenant ON comprobante_item
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM comprobante c 
            JOIN caja ca ON ca.id = c.caja_id 
            WHERE c.id = comprobante_item.comprobante_id 
            AND (
                fn_pertenece_tenant(ca.local_id) 
                OR (
                    current_setting('app.public_access', true) = 'true' 
                    AND c.token_qr = NULLIF(current_setting('app.public_token_qr', true), '')::UUID
                )
            )
        )
    );

-- 3.3 Archivos y Metadatos MinIO: Tenant isolation + Catálogo público + Descarga QR de comprobantes (CU-CLIENTE-02)
ALTER TABLE archivo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_archivo_tenant ON archivo;
CREATE POLICY p_archivo_tenant ON archivo
    FOR ALL
    USING (
        -- 1. Bypass para Administrador Global SaaS
        fn_es_admin_saas()
        -- 2. Aislamiento por tenant para archivos privados/temporales
        OR (
            empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID
            AND (local_id IS NULL OR fn_pertenece_tenant(local_id))
        )
        -- 3. Archivos públicos de catálogo para cartas QR abiertas
        OR (visibilidad = 'catalogo' AND (local_id IS NULL OR fn_pertenece_tenant(local_id)))
        -- 4. Acceso público controlado a comprobantes mediante token QR (CU-CLIENTE-02)
        OR (
            current_setting('app.public_access', true) = 'true'
            AND entidad_tipo = 'comprobante'
            AND EXISTS (
                SELECT 1 FROM comprobante c 
                WHERE c.id = archivo.entidad_id 
                  AND c.token_qr = NULLIF(current_setting('app.public_token_qr', true), '')::UUID
            )
        )
    );
