-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 02: ESQUEMA DDL CANÓNICO (42 TABLAS)
-- Motor: PostgreSQL 16
-- Multi-tenancy: Esquema único compartido con Row-Level Security (RLS)
-- Identificadores: UUID v8 (RFC 9562 time-ordered) / PK numérico en catálogos
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PLATAFORMA Y FACTURACIÓN RECURRENTE SAAS
-- ------------------------------------------------------------------------------

-- 1.1 Catálogo de Planes de Suscripción (CU-SAAS-03)
CREATE TABLE IF NOT EXISTS plan (
    id INT PRIMARY KEY, -- 1: Starter, 2: Pro, 3: Enterprise
    nombre VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(60) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    precio_mensual DECIMAL(10, 2) NOT NULL CHECK (precio_mensual >= 0),
    precio_anual DECIMAL(10, 2) NOT NULL CHECK (precio_anual >= 0),
    max_locales INT NOT NULL CHECK (max_locales >= 1),
    max_pisos INT NOT NULL CHECK (max_pisos >= 1),
    max_mesas INT NOT NULL CHECK (max_mesas >= 1),
    max_usuarios INT NOT NULL CHECK (max_usuarios >= 1),
    incluye_reservas BOOL NOT NULL DEFAULT false,
    incluye_reportes_avanzados BOOL NOT NULL DEFAULT false,
    incluye_asistente_ia BOOL NOT NULL DEFAULT false,
    incluye_prediccion_ia BOOL NOT NULL DEFAULT false,
    activo BOOL NOT NULL DEFAULT true,
    visible_publico BOOL NOT NULL DEFAULT true,
    stripe_product_id VARCHAR(100),
    stripe_price_id_mensual VARCHAR(100),
    stripe_price_id_anual VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Tenant Principal: Empresa Gastronómica (CU-PROP-01, CU-SAAS-01)
CREATE TABLE IF NOT EXISTS empresa (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    razon_social VARCHAR(150) NOT NULL,
    tipo_identidad_fiscal VARCHAR(10) NOT NULL CHECK (tipo_identidad_fiscal IN ('RUC_20', 'RUC_10')),
    ruc VARCHAR(11) NOT NULL UNIQUE CHECK (ruc ~ '^[0-9]{11}$'),
    correo_contacto VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    plan_id INT NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
    ultima_suscripcion_id UUID, -- FK agregada posterior a la tabla suscripcion
    estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'periodo_gracia', 'suspendida', 'pendiente_baja', 'eliminada')),
    origen_alta VARCHAR(30) NOT NULL DEFAULT 'autoservicio_stripe' CHECK (origen_alta IN ('autoservicio_stripe', 'manual_admin')),
    nota_alta TEXT,
    stripe_customer_id VARCHAR(100),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Ciclo de Vida y Dunning de Suscripción Stripe (CU-PROP-02, CU-PROP-03)
CREATE TABLE IF NOT EXISTS suscripcion (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
    proximo_plan_id INT REFERENCES plan(id) ON DELETE RESTRICT,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin_periodo TIMESTAMPTZ NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'en_gracia', 'pendiente_ajuste', 'cancelada', 'suspendida')),
    dias_gracia_restantes INT NOT NULL DEFAULT 5 CHECK (dias_gracia_restantes BETWEEN 0 AND 5),
    fecha_corte_gracia TIMESTAMPTZ,
    ultimo_error_cobro TEXT,
    reintentos_stripe_conteo INT NOT NULL DEFAULT 0,
    recursos_conciliados BOOL NOT NULL DEFAULT false,
    config_downgrade JSONB,
    stripe_subscription_id VARCHAR(100),
    stripe_schedule_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE empresa 
    DROP CONSTRAINT IF EXISTS fk_empresa_ultima_suscripcion,
    ADD CONSTRAINT fk_empresa_ultima_suscripcion 
    FOREIGN KEY (ultima_suscripcion_id) REFERENCES suscripcion(id) ON DELETE SET NULL;

-- 1.4 Sedes Físicas / Locales de la Empresa (CU-PROP-04)
CREATE TABLE IF NOT EXISTS local (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    direccion VARCHAR(200) NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    giro_negocio VARCHAR(30) NOT NULL DEFAULT 'en_blanco' CHECK (giro_negocio IN ('polleria', 'cevicheria', 'chifa', 'en_blanco')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 Colaboradores y Usuarios del Sistema (CU-AUTH-01, CU-PROP-05, CU-ADMIN-08)
CREATE TABLE IF NOT EXISTS usuario (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE, -- NULL para admin_saas
    local_id UUID REFERENCES local(id) ON DELETE SET NULL,     -- NULL para admin_saas y propietario
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin_saas', 'propietario', 'admin_local', 'mozo', 'cocina', 'cajero')),
    estado VARCHAR(25) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'pendiente_activacion')),
    ultimo_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usuario_empresa_correo UNIQUE (empresa_id, correo)
);

-- 1.6 Protocolo Legal de Suspensión y Retención de 30 Días (CU-SAAS-02)
CREATE TABLE IF NOT EXISTS suscripcion_suspension (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    suscripcion_id UUID NOT NULL REFERENCES suscripcion(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(30) NOT NULL CHECK (tipo_evento IN ('suspension_temporal', 'baja_definitiva')),
    motivo VARCHAR(100) NOT NULL,
    detalle_justificacion TEXT NOT NULL CHECK (LENGTH(detalle_justificacion) >= 15),
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_reactivacion TIMESTAMPTZ,
    reactivado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    nota_reactivacion TEXT,
    ejecutado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    fecha_eliminacion_programada TIMESTAMPTZ,
    token_portabilidad VARCHAR(255),
    token_portabilidad_expira_at TIMESTAMPTZ,
    estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'resuelta_reactivada', 'ejecutada_baja')),
    creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 Historial de Pagos de Suscripción SaaS (CU-PROP-02, CU-SAAS-01)
CREATE TABLE IF NOT EXISTS pago (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE RESTRICT,
    suscripcion_id UUID REFERENCES suscripcion(id) ON DELETE SET NULL,
    plan_id INT NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('exitoso', 'fallido', 'reembolsado')),
    origen_pago VARCHAR(40) NOT NULL DEFAULT 'stripe' CHECK (origen_pago IN ('stripe', 'transferencia_bancaria', 'deposito_bancario', 'yape_empresa', 'efectivo')),
    stripe_payment_id VARCHAR(100),
    numero_operacion VARCHAR(100),
    nota TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. OPERACIÓN DE SEDE, ESPACIOS FÍSICOS Y PARÁMETROS OPERATIVOS
-- ------------------------------------------------------------------------------

-- 2.1 Horario Semanal de Atención (CU-ADMIN-09)
CREATE TABLE IF NOT EXISTS horario_atencion (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Lunes .. 7: Domingo
    nombre_turno VARCHAR(50) NOT NULL DEFAULT 'Principal',
    atiende BOOL NOT NULL DEFAULT true,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_horario_atencion UNIQUE (local_id, dia_semana, hora_inicio)
);

-- 2.2 Feriados y Cierres Extraordinarios (CU-ADMIN-09)
CREATE TABLE IF NOT EXISTS horario_excepcion (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cerrado BOOL NOT NULL DEFAULT true,
    hora_inicio TIME,
    hora_fin TIME,
    motivo VARCHAR(150) NOT NULL,
    created_by UUID REFERENCES usuario(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_horario_excepcion UNIQUE (local_id, fecha)
);

-- 2.3 Configuración de Tiempos y Semáforo KDS de Cocina (CU-ADMIN-18)
CREATE TABLE IF NOT EXISTS configuracion_kds (
    local_id UUID PRIMARY KEY REFERENCES local(id) ON DELETE CASCADE,
    tiempo_optimo_verde_min INT NOT NULL DEFAULT 15 CHECK (tiempo_optimo_verde_min BETWEEN 3 AND 60),
    tiempo_alerta_ambar_min INT NOT NULL DEFAULT 25 CHECK (tiempo_alerta_ambar_min BETWEEN 5 AND 120),
    tiempo_maximo_pase_min INT NOT NULL DEFAULT 3 CHECK (tiempo_maximo_pase_min BETWEEN 1 AND 30),
    alerta_sonora_nueva_comanda BOOL NOT NULL DEFAULT true,
    alerta_sonora_comanda_roja BOOL NOT NULL DEFAULT true,
    intervalo_sonido_rojo_seg INT NOT NULL DEFAULT 60 CHECK (intervalo_sonido_rojo_seg BETWEEN 15 AND 300),
    vista_predeterminada VARCHAR(20) NOT NULL DEFAULT 'fifo' CHECK (vista_predeterminada IN ('fifo', 'all_day')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_kds_umbrales_coherentes CHECK (tiempo_alerta_ambar_min > tiempo_optimo_verde_min)
);

-- 2.4 Políticas y Parámetros de Reserva de Salón (CU-ADMIN-10)
CREATE TABLE IF NOT EXISTS politicas_reserva (
    local_id UUID PRIMARY KEY REFERENCES local(id) ON DELETE CASCADE,
    acepta_reservas BOOL NOT NULL DEFAULT false,
    duracion_reserva_min INT NOT NULL DEFAULT 90 CHECK (duracion_reserva_min BETWEEN 30 AND 240),
    buffer_reserva_min INT NOT NULL DEFAULT 15 CHECK (buffer_reserva_min BETWEEN 0 AND 60),
    tolerancia_no_show_min INT NOT NULL DEFAULT 15 CHECK (tolerancia_no_show_min BETWEEN 5 AND 60),
    minutos_bloqueo_previo INT NOT NULL DEFAULT 30 CHECK (minutos_bloqueo_previo BETWEEN 0 AND 120),
    margen_recordatorio_min INT NOT NULL DEFAULT 120 CHECK (margen_recordatorio_min >= 0),
    anticipacion_minima_horas INT NOT NULL DEFAULT 2 CHECK (anticipacion_minima_horas BETWEEN 0 AND 48),
    anticipacion_maxima_dias INT NOT NULL DEFAULT 30 CHECK (anticipacion_maxima_dias BETWEEN 1 AND 90),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Pisos o Ambientes Físicos del Local (CU-ADMIN-01)
CREATE TABLE IF NOT EXISTS piso (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    nombre VARCHAR(60) NOT NULL,
    columnas INT NOT NULL DEFAULT 5 CHECK (columnas BETWEEN 1 AND 12),
    filas INT NOT NULL DEFAULT 3 CHECK (filas BETWEEN 1 AND 10),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Mesas de Salón y Grupos Unidos (CU-ADMIN-01, CU-MOZO-01, CU-MOZO-04)
CREATE TABLE IF NOT EXISTS mesa (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    piso_id UUID NOT NULL REFERENCES piso(id) ON DELETE CASCADE,
    numero VARCHAR(10) NOT NULL,
    capacidad INT NOT NULL CHECK (capacidad BETWEEN 1 AND 20),
    forma VARCHAR(20) NOT NULL DEFAULT 'cuadrada' CHECK (forma IN ('cuadrada', 'redonda', 'rectangular')),
    posicion_x INT NOT NULL DEFAULT 0,
    posicion_y INT NOT NULL DEFAULT 0,
    permite_union BOOL NOT NULL DEFAULT true,
    mesa_principal_id UUID REFERENCES mesa(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'bloqueada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mesa_piso_numero UNIQUE (local_id, piso_id, numero),
    CONSTRAINT chk_mesa_no_auto_referencia CHECK (mesa_principal_id IS NULL OR mesa_principal_id != id)
);

-- ------------------------------------------------------------------------------
-- 3. CARTA GASTRONÓMICA, RECETAS TÉCNICAS E INVENTARIO
-- ------------------------------------------------------------------------------

-- 3.1 Categorías de la Carta Gastronómica (CU-ADMIN-02)
CREATE TABLE IF NOT EXISTS categoria_producto (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    nombre VARCHAR(60) NOT NULL,
    orden INT NOT NULL DEFAULT 0 CHECK (orden >= 0),
    activa BOOL NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categoria_local_nombre 
    ON categoria_producto (local_id, LOWER(nombre));

-- 3.2 Directorio Comercial de Proveedores de Insumos (CU-ADMIN-05)
CREATE TABLE IF NOT EXISTS proveedor (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(80),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(150),
    activo BOOL NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_proveedor_local_nombre 
    ON proveedor (local_id, LOWER(nombre));

-- 3.3 Catálogo de Insumos e Ingredientes en Bodega (CU-ADMIN-03, CU-COCINA-03)
CREATE TABLE IF NOT EXISTS insumo (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    nombre VARCHAR(80) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('kg', 'L', 'und', 'botella', 'saco', 'lata', 'caja', 'paquete', 'bidon', 'jaba')),
    stock_actual DECIMAL(12, 3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo DECIMAL(12, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    costo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (costo_unitario >= 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    ultimo_proveedor_id UUID REFERENCES proveedor(id) ON DELETE SET NULL,
    fecha_ultima_compra TIMESTAMPTZ,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'agotado', 'inactivo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_insumo_local_nombre 
    ON insumo (local_id, LOWER(nombre));

-- 3.4 Insumos Habituales Suministrados por Proveedor (CU-ADMIN-05)
CREATE TABLE IF NOT EXISTS proveedor_insumo_habitual (
    proveedor_id UUID NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (proveedor_id, insumo_id)
);

-- 3.5 Platos y Productos de la Carta Gastronómica (CU-ADMIN-04, CU-COCINA-04, CU-CLIENTE-01)
CREATE TABLE IF NOT EXISTS producto (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categoria_producto(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    costo_estandar DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (costo_estandar >= 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    foto_url VARCHAR(255),
    disponibilidad VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (disponibilidad IN ('disponible', 'agotado')),
    motivo_agotado VARCHAR(30) CHECK (motivo_agotado IN ('quiebre_stock_receta', 'apagado_manual_cocina', 'decision_admin')),
    usuario_modifico_disp_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha_modificacion_disp TIMESTAMPTZ,
    requiere_preparacion BOOL NOT NULL DEFAULT true, -- true = fogones/KDS; false = despacho directo mozo
    activo BOOL NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_local_nombre 
    ON producto (local_id, LOWER(nombre));

-- 3.6 Fichas Técnicas / Recetas Culinarias por Producto (CU-ADMIN-04, CU-COCINA-03)
CREATE TABLE IF NOT EXISTS producto_insumo (
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE RESTRICT,
    modo_calculo VARCHAR(20) NOT NULL DEFAULT 'rendimiento' CHECK (modo_calculo IN ('rendimiento', 'exacto')),
    rendimiento_platos DECIMAL(10, 2),
    cantidad_descuenta DECIMAL(12, 5) NOT NULL CHECK (cantidad_descuenta > 0),
    PRIMARY KEY (producto_id, insumo_id)
);

-- 3.7 Auditoría de Ajustes Físicos de Stock e Inconsistencias (CU-ADMIN-03, CU-COCINA-03)
CREATE TABLE IF NOT EXISTS auditoria_stock_ajuste (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    stock_anterior DECIMAL(12, 3) NOT NULL,
    stock_nuevo DECIMAL(12, 3) NOT NULL CHECK (stock_nuevo >= 0),
    diferencia DECIMAL(12, 3) NOT NULL,
    motivo VARCHAR(40) NOT NULL CHECK (motivo IN ('conteo_fisico_inventario', 'merma_desperdicio', 'ingreso_manual', 'vencimiento_caducidad', 'rotura_accidente', 'inconsistencia_cocina')),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. COMPRAS FÍSICAS Y ABASTECIMIENTO
-- ------------------------------------------------------------------------------

-- 4.1 Fichas de Compra de Insumos (CU-ADMIN-06)
CREATE TABLE IF NOT EXISTS ficha_compra (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES proveedor(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    tipo_comprobante VARCHAR(20) NOT NULL DEFAULT 'factura' CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_venta', 'guia_remision', 'recibo')),
    numero_comprobante VARCHAR(30) NOT NULL,
    es_autogenerado BOOL NOT NULL DEFAULT false,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta_debito', 'credito_proveedor')),
    desglosa_igv BOOL NOT NULL DEFAULT true,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    impuestos DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    estado VARCHAR(20) NOT NULL DEFAULT 'registrada' CHECK (estado IN ('registrada', 'anulada')),
    motivo_anulacion TEXT,
    anulado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    anulado_at TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Detalle de Ítems Reabastecidos en la Compra (CU-ADMIN-06)
CREATE TABLE IF NOT EXISTS ficha_compra_detalle (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    ficha_compra_id UUID NOT NULL REFERENCES ficha_compra(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE RESTRICT,
    cantidad DECIMAL(10, 4) NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 4) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- ------------------------------------------------------------------------------
-- 5. RESERVAS, PEDIDOS Y COMANDAS DE SALÓN
-- ------------------------------------------------------------------------------

-- 5.1 Reservas de Mesas en Salón (CU-MOZO-05)
CREATE TABLE IF NOT EXISTS reserva (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL,
    num_personas INT NOT NULL CHECK (num_personas > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'bloqueada', 'atendida', 'cancelada', 'no_show')),
    creado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    excepcion_id UUID REFERENCES horario_excepcion(id) ON DELETE SET NULL,
    motivo_cancelacion TEXT,
    notificado_cliente BOOL NOT NULL DEFAULT false,
    metodo_notificacion VARCHAR(20) NOT NULL DEFAULT 'ninguno' CHECK (metodo_notificacion IN ('ninguno', 'whatsapp', 'llamada', 'presencial')),
    notificado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha_notificado TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 Asignación N:M de Mesas a Reservas (CU-MOZO-05)
CREATE TABLE IF NOT EXISTS reserva_mesa (
    reserva_id UUID NOT NULL REFERENCES reserva(id) ON DELETE CASCADE,
    mesa_id UUID NOT NULL REFERENCES mesa(id) ON DELETE CASCADE,
    PRIMARY KEY (reserva_id, mesa_id)
);

-- 5.3 Promociones Comerciales de Sede (CU-ADMIN-17, CU-CAJA-02)
CREATE TABLE IF NOT EXISTS promocion (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    tope_maximo_descuento DECIMAL(10, 2) CHECK (tope_maximo_descuento > 0),
    monto_minimo_consumo DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (monto_minimo_consumo >= 0),
    dias_semana SMALLINT[] DEFAULT '{1,2,3,4,5,6,7}',
    hora_inicio TIME,
    hora_fin TIME,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    limite_usos INT CHECK (limite_usos > 0),
    usos_actuales INT NOT NULL DEFAULT 0 CHECK (usos_actuales >= 0),
    activa BOOL NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_promocion_fechas CHECK (fecha_inicio <= fecha_fin)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_promocion_local_nombre 
    ON promocion (local_id, LOWER(nombre));

-- 5.4 Formas de Pago y Comisiones de Pasarela por Sede (CU-ADMIN-19)
CREATE TABLE IF NOT EXISTS metodo_pago_local (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL, -- efectivo, tarjeta, billetera_digital, transferencia
    nombre VARCHAR(60) NOT NULL,
    activo BOOL NOT NULL DEFAULT true,
    comision_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 50.00),
    datos_adicionales JSONB DEFAULT '{}'::jsonb,
    icono VARCHAR(30) NOT NULL DEFAULT 'wallet',
    orden INT NOT NULL DEFAULT 1 CHECK (orden >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_metodo_pago_local UNIQUE (local_id, codigo)
);

-- 5.5 Comandas y Cuentas Abiertas por Mesa (CU-MOZO-02, CU-MOZO-08, CU-CAJA-02)
CREATE TABLE IF NOT EXISTS pedido (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    numero_comanda INT NOT NULL, -- Identificador legible para cocina KDS y salón (ej. #42)
    mesa_id UUID NOT NULL REFERENCES mesa(id) ON DELETE RESTRICT,
    mozo_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    estado VARCHAR(20) NOT NULL DEFAULT 'enviado' CHECK (estado IN ('borrador', 'enviado', 'cuenta_pedida', 'cobrado', 'anulado')),
    comensales INT NOT NULL DEFAULT 1 CHECK (comensales > 0),
    precuenta_generada_at TIMESTAMPTZ,
    promocion_id UUID REFERENCES promocion(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.6 Ítems Culinarios Despachados por Rondas a Cocina/Bar (CU-MOZO-02, CU-COCINA-01..03)
CREATE TABLE IF NOT EXISTS pedido_item (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    nota_cocina VARCHAR(200),
    estado VARCHAR(20) NOT NULL DEFAULT 'en_cola' CHECK (estado IN ('en_cola', 'en_preparacion', 'listo', 'entregado', 'no_disponible', 'anulado')),
    numero_ronda INT NOT NULL DEFAULT 1 CHECK (numero_ronda >= 1),
    motivo_anulacion VARCHAR(255),
    anulado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    es_merma BOOL NOT NULL DEFAULT false,
    fecha_inicio_coccion TIMESTAMPTZ,
    fecha_listo_cocina TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cocina_tiempos_coherentes CHECK (fecha_listo_cocina IS NULL OR fecha_inicio_coccion IS NULL OR fecha_listo_cocina >= fecha_inicio_coccion)
);

-- ------------------------------------------------------------------------------
-- 6. CAJA, FACTURACIÓN SUNAT Y CUADRATURA CONTABLE
-- ------------------------------------------------------------------------------

-- 6.1 Directorio Fiscal de Clientes y Comensales (CU-CAJA-03)
CREATE TABLE IF NOT EXISTS cliente (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(10) NOT NULL CHECK (tipo_documento IN ('DNI', 'RUC')),
    numero_documento VARCHAR(20) NOT NULL,
    nombre_identificativo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    detalle JSONB NOT NULL DEFAULT '{}'::jsonb, -- Payload oficial ApiPerú
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cliente_empresa_documento UNIQUE (empresa_id, tipo_documento, numero_documento)
);

-- 6.2 Turnos de Caja y Terminal Única de Sede (CU-CAJA-01, CU-CAJA-05, CU-ADMIN-14)
CREATE TABLE IF NOT EXISTS caja (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    cajero_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    correlativo SERIAL NOT NULL, -- Turno #042 por sede
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    monto_apertura DECIMAL(10, 2) NOT NULL CHECK (monto_apertura >= 0.00),
    notas_apertura TEXT,
    fecha_cierre TIMESTAMPTZ,
    monto_esperado DECIMAL(10, 2),
    monto_real DECIMAL(10, 2),
    discrepancia DECIMAL(10, 2),
    comentario_discrepancia TEXT,
    notas_cierre TEXT,
    revisado BOOL NOT NULL DEFAULT false,
    revisado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    revisado_at TIMESTAMPTZ,
    notas_auditoria TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.3 Control Monótono de Series y Correlativos Oficiales (CU-CAJA-03, CU-CAJA-04)
CREATE TABLE IF NOT EXISTS comprobante_serie (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('factura', 'boleta', 'nota_venta', 'nota_credito')),
    serie VARCHAR(10) NOT NULL, -- F001, B001, NV01, FC01, BC01
    correlativo_actual INT NOT NULL DEFAULT 0 CHECK (correlativo_actual >= 0),
    activo BOOL NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comprobante_serie_local UNIQUE (local_id, tipo_comprobante, serie)
);

-- 6.4 Comprobantes Electrónicos Oficiales y Notas de Crédito (CU-CAJA-03, CU-CAJA-04, CU-CLIENTE-02)
CREATE TABLE IF NOT EXISTS comprobante (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    pedido_id UUID REFERENCES pedido(id) ON DELETE SET NULL,
    caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE RESTRICT,
    cliente_id UUID REFERENCES cliente(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('boleta', 'factura', 'nota_venta', 'nota_credito')),
    serie VARCHAR(10) NOT NULL,
    correlativo INT NOT NULL,
    documento_cliente VARCHAR(20),
    nombre_cliente VARCHAR(150) NOT NULL,
    telefono_envio VARCHAR(20),
    email_envio VARCHAR(100),
    metodo_pago_id UUID REFERENCES metodo_pago_local(id) ON DELETE SET NULL,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('tarjeta', 'billetera_digital', 'efectivo')),
    subtotal_consumo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    porcentaje_recargo DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    monto_recargo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_recibido DECIMAL(10, 2),
    vuelto DECIMAL(10, 2),
    total DECIMAL(10, 2) NOT NULL,
    base_imponible DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    igv DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    promocion_id UUID REFERENCES promocion(id) ON DELETE RESTRICT,
    token_qr UUID NOT NULL UNIQUE DEFAULT fn_uuid_v8(),
    impreso BOOL NOT NULL DEFAULT false,
    -- Campos exclusivos para Notas de Crédito (CU-CAJA-04)
    comprobante_modificado_id UUID REFERENCES comprobante(id) ON DELETE RESTRICT,
    motivo_codigo_sunat VARCHAR(10), -- Catálogo 09 SUNAT (01: anulación total, 02: error, 06: devolución)
    sustento_motivo TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'emitido' CHECK (estado IN ('emitido', 'anulado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comprobante_serie_correlativo UNIQUE (serie, correlativo)
);

-- 6.5 Subcuentas para División de Cuentas en Mesa/Counter (CU-MOZO-09, CU-CAJA-03)
CREATE TABLE IF NOT EXISTS pedido_subcuenta (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    numero_subcuenta INT NOT NULL CHECK (numero_subcuenta >= 1),
    promocion_id UUID REFERENCES promocion(id) ON DELETE RESTRICT,
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('boleta', 'factura', 'nota_venta')),
    documento_cliente VARCHAR(20),
    nombre_cliente VARCHAR(150) NOT NULL,
    direccion_cliente VARCHAR(255),
    metodo_pago_id UUID REFERENCES metodo_pago_local(id) ON DELETE RESTRICT,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('efectivo', 'tarjeta', 'billetera_digital')),
    subtotal_bruto DECIMAL(10, 2) NOT NULL CHECK (subtotal_bruto > 0),
    descuento DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_recargo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL CHECK (total > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cobrado', 'anulado')),
    comprobante_id UUID REFERENCES comprobante(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pedido_subcuenta UNIQUE (pedido_id, numero_subcuenta)
);

-- 6.6 Asignación Fraccionada de Ítems a Subcuentas (CU-MOZO-09)
CREATE TABLE IF NOT EXISTS pedido_subcuenta_item (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    subcuenta_id UUID NOT NULL REFERENCES pedido_subcuenta(id) ON DELETE CASCADE,
    pedido_item_id UUID NOT NULL REFERENCES pedido_item(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.7 Gastos Operativos de Sede y Compras Menores (CU-ADMIN-14)
CREATE TABLE IF NOT EXISTS gasto_manual (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    categoria VARCHAR(60) NOT NULL CHECK (categoria IN ('alquiler', 'servicios_basicos', 'limpieza_aseo', 'mantenimiento', 'caja_chica', 'otros')),
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0.00),
    origen_fondos VARCHAR(30) NOT NULL DEFAULT 'transferencia_bancaria' CHECK (origen_fondos IN ('transferencia_bancaria', 'efectivo_caja')),
    caja_id UUID REFERENCES caja(id) ON DELETE SET NULL, -- Si afectó la gaveta activa del turno
    proveedor_nombre VARCHAR(120) NOT NULL,
    tipo_comprobante VARCHAR(50) DEFAULT 'recibo_interno',
    numero_documento VARCHAR(80),
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    registrado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.8 Asientos Contables de Flujo de Gaveta de Caja (CU-CAJA-03, CU-CAJA-04, CU-CAJA-05, CU-ADMIN-14)
CREATE TABLE IF NOT EXISTS caja_movimiento (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('apertura', 'ingreso_venta', 'egreso_devolucion', 'egreso_gasto_manual', 'cierre')),
    monto DECIMAL(12, 2) NOT NULL, -- Positivo = entrada; Negativo = salida
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo',
    comprobante_id UUID REFERENCES comprobante(id) ON DELETE SET NULL,
    gasto_manual_id UUID REFERENCES gasto_manual(id) ON DELETE SET NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.9 Archivo Inmutable del Reporte Z Oficial del Turno (CU-CAJA-05, CU-ADMIN-14)
CREATE TABLE IF NOT EXISTS auditoria_caja_cierre (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    cajero_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    reporte_z_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. INCIDENTES, NOTIFICACIONES, AUDITORÍA Y ANULACIONES
-- ------------------------------------------------------------------------------

-- 7.1 Incidentes Internos de Sede y Supervisión Corporativa (CU-PROP-06, CU-ADMIN-11)
CREATE TABLE IF NOT EXISTS incidente (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- ej. INC-2026-084
    titulo VARCHAR(120) NOT NULL,
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('servicio_cliente', 'disciplinario', 'rotura_merma', 'seguridad_higiene', 'caja_dinero', 'otro')),
    descripcion TEXT NOT NULL,
    medidas_inmediatas TEXT,
    fecha_hora TIMESTAMPTZ NOT NULL,
    gravedad VARCHAR(20) NOT NULL CHECK (gravedad IN ('baja', 'media', 'alta')),
    foto_url VARCHAR(255),
    empleado_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    registrado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_revision', 'resuelto')),
    visto_por_propietario BOOL NOT NULL DEFAULT false,
    fecha_visto TIMESTAMPTZ,
    nota_propietario TEXT,
    motivo_revision TEXT,
    resolucion_nota TEXT,
    resuelto_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha_resolucion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.2 Notificaciones Transversales del Sistema (CU-TRANS-01)
CREATE TABLE IF NOT EXISTS notificacion (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    local_id UUID REFERENCES local(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE,
    rol_destinatario VARCHAR(30) CHECK (rol_destinatario IN ('mozo', 'cocina', 'cajero', 'admin_local', 'propietario')),
    tipo VARCHAR(50) NOT NULL, -- pedido_anulado, plato_agotado, plato_listo, etc.
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    titulo VARCHAR(120) NOT NULL,
    mensaje TEXT NOT NULL,
    entidad_tipo VARCHAR(50),
    entidad_id UUID,
    leida BOOL NOT NULL DEFAULT false,
    fecha_leida TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.3 Log de Auditoría para Acciones Sensibles de la Plataforma
CREATE TABLE IF NOT EXISTS log_auditoria (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    local_id UUID REFERENCES local(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    entidad_tipo VARCHAR(60) NOT NULL,
    entidad_id UUID NOT NULL,
    detalle JSONB,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.4 Registro Inmutable de Anulación de Pedidos y Mermas (CU-MOZO-06, CU-ADMIN-12)
CREATE TABLE IF NOT EXISTS pedido_anulacion (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    pedido_item_id UUID REFERENCES pedido_item(id) ON DELETE CASCADE,
    tipo_anulacion VARCHAR(30) NOT NULL CHECK (tipo_anulacion IN ('item_individual', 'comanda_completa')),
    mesa_id UUID NOT NULL REFERENCES mesa(id) ON DELETE RESTRICT,
    mesa_numero VARCHAR(50) NOT NULL, -- Etiqueta congelada (ej. Mesa 04 o Mesa [ 02 ; 03 ])
    producto_id UUID REFERENCES producto(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(120),
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    mozo_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    anulado_por UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    motivo_categoria VARCHAR(30) NOT NULL CHECK (motivo_categoria IN ('error_registro', 'demora_cliente', 'queja_calidad', 'cambio_plato', 'retiro_sin_consumo', 'otro')),
    motivo_detalle TEXT NOT NULL CHECK (LENGTH(motivo_detalle) >= 10),
    pedido_created_at TIMESTAMPTZ NOT NULL,
    anulado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    minutos_espera INT NOT NULL,
    estado_anterior VARCHAR(30) NOT NULL,
    es_merma BOOL NOT NULL DEFAULT false,
    costo_merma DECIMAL(10, 2),
    revisado BOOL NOT NULL DEFAULT false,
    revisado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    revisado_at TIMESTAMPTZ,
    notas_supervision TEXT,
    incidente_id UUID REFERENCES incidente(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.5 Snapshot Diario de Existencias para Futuro Forecasting (CU-SISTEMA-01)
CREATE TABLE IF NOT EXISTS snapshot_stock_diario (
    id UUID PRIMARY KEY DEFAULT fn_uuid_v8(),
    insumo_id UUID NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES local(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    stock_cantidad DECIMAL(12, 3) NOT NULL,
    estuvo_agotado BOOL NOT NULL DEFAULT false,
    CONSTRAINT uq_snapshot_stock_diario UNIQUE (insumo_id, local_id, fecha)
);

-- ------------------------------------------------------------------------------
-- 8. TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;', t);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();', t);
    END LOOP;
END $$;
