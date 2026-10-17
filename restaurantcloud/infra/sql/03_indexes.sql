-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 03: ÍNDICES DE ALTO RENDIMIENTO Y TRGM GIN
-- Motor: PostgreSQL 16
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ÍNDICES DE INTEGRIDAD POKA-YOKE Y REGLAS DE NEGOCIO
-- ------------------------------------------------------------------------------

-- 1.1 Terminal Única de Caja por Sede (CU-CAJA-01, CU-CAJA-05)
-- Impide estrictamente que dos cajeros abran turnos concurrentes en el mismo local
CREATE UNIQUE INDEX IF NOT EXISTS uq_caja_abierta_local 
    ON caja(local_id) 
    WHERE estado = 'abierta';

-- 1.2 Unicidad de Correo para Administradores Globales SaaS
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_admin_saas_correo 
    ON usuario(correo) 
    WHERE empresa_id IS NULL;

-- 1.3 Acceso Ultrarrápido (< 0.5ms) a Comprobantes Digitales por Token QR (CU-CLIENTE-02)
CREATE UNIQUE INDEX IF NOT EXISTS idx_comprobante_token_qr 
    ON comprobante(token_qr);

-- 1.4 Acceso a Menú Digital Público por Slug de Sede (CU-CLIENTE-01)
CREATE INDEX IF NOT EXISTS idx_local_slug 
    ON local(slug) 
    WHERE estado = 'activo';

-- 1.5 Índices de Búsqueda Geográfica Nacional y Localización (UBIGEO INEI)
CREATE INDEX IF NOT EXISTS idx_provincia_departamento 
    ON provincia(departamento_codigo);

CREATE INDEX IF NOT EXISTS idx_distrito_provincia 
    ON distrito(provincia_codigo);

CREATE INDEX IF NOT EXISTS idx_local_ubigeo 
    ON local(ubigeo_cod);

-- ------------------------------------------------------------------------------
-- 2. ÍNDICES PARCIALES DE ALTO RENDIMIENTO PARA OPERACIONES EN VIVO
-- ------------------------------------------------------------------------------

-- 2.1 Salón: Comandas activas por Mozo y Mesa (CU-MOZO-01)
CREATE INDEX IF NOT EXISTS idx_pedido_mozo_activo 
    ON pedido(local_id, mozo_id, mesa_id) 
    WHERE estado IN ('borrador', 'enviado');

-- 2.2 Salón: Mesas que integran grupos unidos (CU-MOZO-04)
CREATE INDEX IF NOT EXISTS idx_mesa_uniones 
    ON mesa(local_id, piso_id, mesa_principal_id) 
    WHERE mesa_principal_id IS NOT NULL;

-- 2.3 Salón: Reservas confirmadas inminentes para bloqueo preventivo (CU-MOZO-05, CU-ADMIN-10)
CREATE INDEX IF NOT EXISTS idx_reserva_bloqueo_inminente 
    ON reserva(local_id, estado, fecha_hora) 
    WHERE estado = 'confirmada';

-- 2.4 Cocina KDS: Comandas en curso del turno (CU-COCINA-01, CU-COCINA-02)
CREATE INDEX IF NOT EXISTS idx_pedido_item_cocina_activo 
    ON pedido_item(pedido_id, estado, fecha_listo_cocina) 
    WHERE estado IN ('en_cola', 'en_preparacion', 'listo');

-- 2.5 Cocina KDS: Platos despachados en los últimos 30 min para Deshacer/Recuperar (CU-COCINA-02)
CREATE INDEX IF NOT EXISTS idx_pedido_item_despachados_recientes 
    ON pedido_item(pedido_id, fecha_listo_cocina) 
    WHERE estado = 'listo';

-- 2.6 Caja y Salón: Ítems con cobro pendiente para precuentas y liquidación anti-sobrecobro (CU-CAJA-02, CU-MOZO-08)
CREATE INDEX IF NOT EXISTS idx_pedido_item_cobro_pendiente 
    ON pedido_item(pedido_id, estado_pago) 
    WHERE estado_pago = 'pendiente' AND estado != 'anulado';

-- 2.6 Carta y KDS: Filtrado de platos que requieren preparación vs despacho directo (CU-ADMIN-04, CU-COCINA-01)
CREATE INDEX IF NOT EXISTS idx_producto_requiere_prep 
    ON producto(local_id, requiere_preparacion) 
    WHERE activo = true;

-- 2.7 Carta y Salón: Platos activos y su estado de disponibilidad (CU-COCINA-04)
CREATE INDEX IF NOT EXISTS idx_producto_disponibilidad 
    ON producto(local_id, disponibilidad) 
    WHERE activo = true;

-- 2.8 Caja POS: Promociones activas filtradas por rango de vigencia (CU-ADMIN-17, CU-CAJA-02)
CREATE INDEX IF NOT EXISTS idx_promocion_caja_vigencia 
    ON promocion(local_id, fecha_inicio, fecha_fin) 
    WHERE activa = true;

-- 2.9 Caja POS: Métodos de pago activos ordenados para la botonera (CU-ADMIN-19)
CREATE INDEX IF NOT EXISTS idx_metodo_pago_local_pos 
    ON metodo_pago_local(local_id, orden) 
    WHERE activo = true;

-- 2.10 Caja POS: Búsqueda rápida de clientes recurrentes por identidad tributaria (CU-CAJA-03)
CREATE INDEX IF NOT EXISTS idx_cliente_busqueda_pos 
    ON cliente(empresa_id, tipo_documento, numero_documento);

-- 2.11 Suspensiones activas y bajas legales pendientes en 30 días (CU-SAAS-02)
CREATE INDEX IF NOT EXISTS idx_suspension_activa 
    ON suscripcion_suspension(empresa_id) 
    WHERE estado = 'activa';

CREATE INDEX IF NOT EXISTS idx_suspension_bajas_pendientes 
    ON suscripcion_suspension(fecha_eliminacion_programada) 
    WHERE estado = 'activa' AND tipo_evento = 'baja_definitiva';

-- 2.12 Bandeja de Notificaciones: Lectura por usuario y difusión por rol (CU-TRANS-01)
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_leida 
    ON notificacion(empresa_id, usuario_id, leida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notificacion_local_rol 
    ON notificacion(empresa_id, local_id, rol_destinatario, leida, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES TRIGRAM GIN PARA BÚSQUEDA RÁPIDA DE TEXTO (FUZZY SEARCH)
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_producto_nombre_trgm 
    ON producto USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_insumo_nombre_trgm 
    ON insumo USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_proveedor_nombre_trgm 
    ON proveedor USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cliente_nombre_trgm 
    ON cliente USING gin (nombre_identificativo gin_trgm_ops);

-- Verificar porque se han dado nuevos INDEX gin en CU como el CU-ADMIN-17-

-- ------------------------------------------------------------------------------
-- 4. ÍNDICES COMPUESTOS PARA CLAVES FORÁNEAS Y REPORTES ANALÍTICOS
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pedido_local_fecha 
    ON pedido(local_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pedido_mesa_estado 
    ON pedido(mesa_id, estado);

CREATE INDEX IF NOT EXISTS idx_comprobante_caja_fecha 
    ON comprobante(caja_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_comprobante_serie_correlativo 
    ON comprobante(serie, correlativo);

CREATE INDEX IF NOT EXISTS idx_comprobante_subcuenta 
    ON comprobante(subcuenta_id);

CREATE INDEX IF NOT EXISTS idx_comprobante_item_comprobante 
    ON comprobante_item(comprobante_id);

CREATE INDEX IF NOT EXISTS idx_caja_movimiento_caja_fecha 
    ON caja_movimiento(caja_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_gasto_manual_local_fecha 
    ON gasto_manual(local_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_ficha_compra_local_fecha 
    ON ficha_compra(local_id, fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_pedido_anulacion_local_fecha 
    ON pedido_anulacion(local_id, anulado_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidente_local_fecha 
    ON incidente(local_id, fecha_hora DESC);

-- 4.10 Índices para el Dominio de Archivos y Metadatos MinIO S3
CREATE INDEX IF NOT EXISTS idx_archivo_tenant_entidad 
    ON archivo(empresa_id, entidad_tipo, entidad_id);

CREATE INDEX IF NOT EXISTS idx_archivo_local 
    ON archivo(local_id) 
    WHERE local_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_archivo_expiracion 
    ON archivo(expira_at) 
    WHERE expira_at IS NOT NULL AND estado = 'disponible';
