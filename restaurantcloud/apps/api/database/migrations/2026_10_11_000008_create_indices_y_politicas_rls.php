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
            -- 1. ÍNDICES DE ALTO RENDIMIENTO Y TRGM GIN
            CREATE UNIQUE INDEX IF NOT EXISTS uq_caja_abierta_local ON caja(local_id) WHERE estado = 'abierta';
            CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_admin_saas_correo ON usuario(correo) WHERE empresa_id IS NULL;
            CREATE UNIQUE INDEX IF NOT EXISTS idx_comprobante_token_qr ON comprobante(token_qr);
            CREATE INDEX IF NOT EXISTS idx_local_slug ON local(slug) WHERE estado = 'activo';

            CREATE INDEX IF NOT EXISTS idx_pedido_mozo_activo ON pedido(local_id, mozo_id, mesa_id) WHERE estado IN ('borrador', 'enviado');
            CREATE INDEX IF NOT EXISTS idx_mesa_uniones ON mesa(local_id, piso_id, mesa_principal_id) WHERE mesa_principal_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_reserva_bloqueo_inminente ON reserva(local_id, estado, fecha_hora) WHERE estado = 'confirmada';
            CREATE INDEX IF NOT EXISTS idx_pedido_item_cocina_activo ON pedido_item(pedido_id, estado, fecha_listo_cocina) WHERE estado IN ('en_cola', 'en_preparacion', 'listo');
            CREATE INDEX IF NOT EXISTS idx_pedido_item_despachados_recientes ON pedido_item(pedido_id, fecha_listo_cocina) WHERE estado = 'listo';
            CREATE INDEX IF NOT EXISTS idx_producto_requiere_prep ON producto(local_id, requiere_preparacion) WHERE activo = true;
            CREATE INDEX IF NOT EXISTS idx_producto_disponibilidad ON producto(local_id, disponibilidad) WHERE activo = true;
            CREATE INDEX IF NOT EXISTS idx_promocion_caja_vigencia ON promocion(local_id, fecha_inicio, fecha_fin) WHERE activa = true;
            CREATE INDEX IF NOT EXISTS idx_metodo_pago_local_pos ON metodo_pago_local(local_id, orden) WHERE activo = true;
            CREATE INDEX IF NOT EXISTS idx_cliente_busqueda_pos ON cliente(empresa_id, tipo_documento, numero_documento);
            CREATE INDEX IF NOT EXISTS idx_suspension_activa ON suscripcion_suspension(empresa_id) WHERE estado = 'activa';
            CREATE INDEX IF NOT EXISTS idx_suspension_bajas_pendientes ON suscripcion_suspension(fecha_eliminacion_programada) WHERE estado = 'activa' AND tipo_evento = 'baja_definitiva';
            CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_leida ON notificacion(empresa_id, usuario_id, leida, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notificacion_local_rol ON notificacion(empresa_id, local_id, rol_destinatario, leida, created_at DESC);

            CREATE INDEX IF NOT EXISTS idx_producto_nombre_trgm ON producto USING gin (nombre gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_insumo_nombre_trgm ON insumo USING gin (nombre gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_proveedor_nombre_trgm ON proveedor USING gin (nombre gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_cliente_nombre_trgm ON cliente USING gin (nombre_identificativo gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_pedido_local_fecha ON pedido(local_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_pedido_mesa_estado ON pedido(mesa_id, estado);
            CREATE INDEX IF NOT EXISTS idx_comprobante_caja_fecha ON comprobante(caja_id, fecha DESC);
            CREATE INDEX IF NOT EXISTS idx_comprobante_serie_correlativo ON comprobante(serie, correlativo);
            CREATE INDEX IF NOT EXISTS idx_caja_movimiento_caja_fecha ON caja_movimiento(caja_id, created_at ASC);
            CREATE INDEX IF NOT EXISTS idx_gasto_manual_local_fecha ON gasto_manual(local_id, fecha DESC);
            CREATE INDEX IF NOT EXISTS idx_ficha_compra_local_fecha ON ficha_compra(local_id, fecha_emision DESC);
            CREATE INDEX IF NOT EXISTS idx_pedido_anulacion_local_fecha ON pedido_anulacion(local_id, anulado_at DESC);
            CREATE INDEX IF NOT EXISTS idx_incidente_local_fecha ON incidente(local_id, fecha_hora DESC);

            -- 2. FUNCIÓN AUXILIAR DE ÁMBITO Y POLÍTICAS RLS
            CREATE OR REPLACE FUNCTION fn_pertenece_tenant(p_local_id UUID)
            RETURNS BOOLEAN AS $$
            BEGIN
                IF fn_es_admin_saas() THEN
                    RETURN true;
                END IF;

                IF NULLIF(current_setting('app.current_local_id', true), '') IS NOT NULL THEN
                    RETURN p_local_id = current_setting('app.current_local_id', true)::UUID;
                END IF;

                IF NULLIF(current_setting('app.current_empresa_id', true), '') IS NOT NULL THEN
                    RETURN EXISTS (
                        SELECT 1 FROM local 
                        WHERE id = p_local_id 
                          AND empresa_id = current_setting('app.current_empresa_id', true)::UUID
                    );
                END IF;

                IF current_setting('app.public_access', true) = 'true' THEN
                    RETURN EXISTS (
                        SELECT 1 FROM local WHERE id = p_local_id AND estado = 'activo'
                    );
                END IF;

                RETURN false;
            END;
            $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

            -- Habilitación RLS en tablas de tenant
            ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_empresa_isolation ON empresa FOR ALL USING (fn_es_admin_saas() OR id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID OR current_setting('app.public_access', true) = 'true');

            ALTER TABLE suscripcion ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_suscripcion_isolation ON suscripcion FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID);

            ALTER TABLE pago ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_pago_isolation ON pago FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID);

            ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_usuario_isolation ON usuario FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID OR id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);

            ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_cliente_isolation ON cliente FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID);

            ALTER TABLE suscripcion_suspension ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_suscripcion_suspension_isolation ON suscripcion_suspension FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID);

            ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_notificacion_isolation ON notificacion FOR ALL USING (fn_es_admin_saas() OR (empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID AND (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID OR (usuario_id IS NULL AND (local_id IS NULL OR fn_pertenece_tenant(local_id)) AND (rol_destinatario IS NULL OR rol_destinatario = NULLIF(current_setting('app.current_user_role', true), ''))))));

            ALTER TABLE log_auditoria ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_log_auditoria_isolation ON log_auditoria FOR ALL USING (fn_es_admin_saas() OR empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::UUID);

            -- Habilitación RLS en tablas operativas de local_id
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

            ALTER TABLE reserva_mesa ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_reserva_mesa_tenant ON reserva_mesa FOR ALL USING (EXISTS (SELECT 1 FROM reserva r WHERE r.id = reserva_mesa.reserva_id AND fn_pertenece_tenant(r.local_id)));

            ALTER TABLE producto_insumo ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_producto_insumo_tenant ON producto_insumo FOR ALL USING (EXISTS (SELECT 1 FROM producto p WHERE p.id = producto_insumo.producto_id AND fn_pertenece_tenant(p.local_id)));

            ALTER TABLE proveedor_insumo_habitual ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_prov_insumo_hab_tenant ON proveedor_insumo_habitual FOR ALL USING (EXISTS (SELECT 1 FROM proveedor pr WHERE pr.id = proveedor_insumo_habitual.proveedor_id AND fn_pertenece_tenant(pr.local_id)));

            ALTER TABLE ficha_compra_detalle ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_ficha_compra_detalle_tenant ON ficha_compra_detalle FOR ALL USING (EXISTS (SELECT 1 FROM ficha_compra fc WHERE fc.id = ficha_compra_detalle.ficha_compra_id AND fn_pertenece_tenant(fc.local_id)));

            ALTER TABLE pedido_item ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_pedido_item_tenant ON pedido_item FOR ALL USING (EXISTS (SELECT 1 FROM pedido p WHERE p.id = pedido_item.pedido_id AND fn_pertenece_tenant(p.local_id)));

            ALTER TABLE pedido_subcuenta ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_pedido_subcuenta_tenant ON pedido_subcuenta FOR ALL USING (EXISTS (SELECT 1 FROM pedido p WHERE p.id = pedido_subcuenta.pedido_id AND fn_pertenece_tenant(p.local_id)));

            ALTER TABLE pedido_subcuenta_item ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_pedido_subcuenta_item_tenant ON pedido_subcuenta_item FOR ALL USING (EXISTS (SELECT 1 FROM pedido_subcuenta ps JOIN pedido p ON p.id = ps.pedido_id WHERE ps.id = pedido_subcuenta_item.subcuenta_id AND fn_pertenece_tenant(p.local_id)));

            ALTER TABLE comprobante ENABLE ROW LEVEL SECURITY;
            CREATE POLICY p_comprobante_tenant ON comprobante FOR ALL USING (fn_pertenece_tenant((SELECT local_id FROM caja WHERE id = comprobante.caja_id)) OR (current_setting('app.public_access', true) = 'true' AND token_qr = NULLIF(current_setting('app.public_token_qr', true), '')::UUID));
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            DROP FUNCTION IF EXISTS fn_pertenece_tenant(UUID);
        SQL);
    }
};
