-- =============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 07: ESCENARIO BASE LIMPIO LOCAL "ÁUREA"
-- Motor: PostgreSQL 16 | Preparado para Pruebas Operativas y Pre-Producción
-- =============================================================================
-- Propósito: poblar exclusivamente los datos maestros base de la sede:
-- empresa, suscripción, sede, usuarios con credenciales operativas,
-- parámetros KDS, políticas de reserva, horarios de atención,
-- distribución de salón (pisos y mesas libres), categorías, productos, recetas,
-- proveedores, insumos con stock positivo, métodos de pago y series electrónicas
-- inicializadas con correlativo 0.
--
-- ESTADO LIMPIO:
-- No contiene pedidos, comandas, turnos de caja, movimientos de efectivo,
-- gastos manuales, arqueos Z, comprobantes electrónicos ni PDFs huérfanos.
-- El salón inicia 100% libre y la caja inicia lista para su primera apertura.
--
-- Es idempotente: usa UUID fijos y ON CONFLICT, e incluye un bloque de purga
-- preventiva para dejar la sede Áurea en estado limpio si ya fue ejecutada antes.
--
-- Credenciales locales para pruebas:
-- propietario@aurea.local / propietario2026
-- admin@aurea.local       / admin-local2026
-- mozo@aurea.local        / mozo2026
-- mozo2@aurea.local       / mozo2-2026
-- mozo3@aurea.local       / mozo3-2026
-- cocina@aurea.local      / cocina2026
-- cajero@aurea.local      / cajero2026
-- =============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- =============================================================================
-- 0. PURGA PREVENTIVA DE TRANSACCIONES OPERACIONALES PREVIAS DE LA SEDE ÁUREA
-- Garantiza un entorno 100% limpio sin interferir con otras sedes ni datos SaaS.
-- =============================================================================
DELETE FROM log_auditoria WHERE local_id = '00000000-0000-4000-8000-000000000010';

-- Desvincular subcuentas y notas de crédito antes de purgar comprobantes
UPDATE pedido_subcuenta SET comprobante_id = NULL 
WHERE pedido_id IN (SELECT id FROM pedido WHERE local_id = '00000000-0000-4000-8000-000000000010');

UPDATE comprobante SET comprobante_modificado_id = NULL 
WHERE caja_id IN (SELECT id FROM caja WHERE local_id = '00000000-0000-4000-8000-000000000010');

DELETE FROM comprobante_item 
WHERE comprobante_id IN (
    SELECT id FROM comprobante 
    WHERE caja_id IN (SELECT id FROM caja WHERE local_id = '00000000-0000-4000-8000-000000000010')
);

DELETE FROM caja_movimiento WHERE local_id = '00000000-0000-4000-8000-000000000010';

DELETE FROM comprobante 
WHERE caja_id IN (SELECT id FROM caja WHERE local_id = '00000000-0000-4000-8000-000000000010');

DELETE FROM auditoria_caja_cierre WHERE local_id = '00000000-0000-4000-8000-000000000010';
DELETE FROM gasto_manual WHERE local_id = '00000000-0000-4000-8000-000000000010';
DELETE FROM caja WHERE local_id = '00000000-0000-4000-8000-000000000010';

DELETE FROM pedido_subcuenta_item 
WHERE subcuenta_id IN (
    SELECT id FROM pedido_subcuenta 
    WHERE pedido_id IN (SELECT id FROM pedido WHERE local_id = '00000000-0000-4000-8000-000000000010')
);

DELETE FROM pedido_subcuenta 
WHERE pedido_id IN (SELECT id FROM pedido WHERE local_id = '00000000-0000-4000-8000-000000000010');

DELETE FROM pedido_anulacion WHERE local_id = '00000000-0000-4000-8000-000000000010';

DELETE FROM pedido_item 
WHERE pedido_id IN (SELECT id FROM pedido WHERE local_id = '00000000-0000-4000-8000-000000000010');

DELETE FROM pedido WHERE local_id = '00000000-0000-4000-8000-000000000010';

DELETE FROM reserva_mesa 
WHERE reserva_id IN (SELECT id FROM reserva WHERE local_id = '00000000-0000-4000-8000-000000000010');

DELETE FROM reserva WHERE local_id = '00000000-0000-4000-8000-000000000010';

DELETE FROM ficha_compra_detalle 
WHERE ficha_compra_id IN (SELECT id FROM ficha_compra WHERE local_id = '00000000-0000-4000-8000-000000000010');

DELETE FROM ficha_compra WHERE local_id = '00000000-0000-4000-8000-000000000010';
DELETE FROM auditoria_stock_ajuste WHERE local_id = '00000000-0000-4000-8000-000000000010';

-- =============================================================================
-- 1. IDENTIFICADORES CANÓNICOS Y ALTA DEL TENANT
-- empresa: 00000000-0000-4000-8000-000000000001
-- local:   00000000-0000-4000-8000-000000000010
-- =============================================================================

INSERT INTO empresa (
    id, razon_social, tipo_identidad_fiscal, ruc, correo_contacto, telefono,
    plan_id, estado, origen_alta, nota_alta, stripe_customer_id
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Restaurante ÁUREA S.A.C.', 'RUC_20', '20612345678', 'contacto@aurea.local',
    '+51 987 654 321', 2, 'activa', 'manual_admin',
    'Tenant canónico base para pruebas operativas y pre-producción.', 'cus_local_aurea'
)
ON CONFLICT (id) DO UPDATE SET
    razon_social = EXCLUDED.razon_social, correo_contacto = EXCLUDED.correo_contacto,
    telefono = EXCLUDED.telefono, plan_id = EXCLUDED.plan_id, estado = EXCLUDED.estado,
    updated_at = NOW();

INSERT INTO suscripcion (
    id, empresa_id, plan_id, fecha_inicio, fecha_fin_periodo, estado,
    dias_gracia_restantes, ciclo_facturacion
) VALUES (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001', 2,
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'activa', 5,
    'mensual'
)
ON CONFLICT (id) DO UPDATE SET
    fecha_fin_periodo = EXCLUDED.fecha_fin_periodo, estado = EXCLUDED.estado,
    updated_at = NOW();

UPDATE empresa
SET ultima_suscripcion_id = '00000000-0000-4000-8000-000000000002'
WHERE id = '00000000-0000-4000-8000-000000000001';

INSERT INTO local (
    id, empresa_id, nombre, slug, direccion, ubigeo_cod, departamento, provincia, distrito, ciudad, telefono,
    zona_horaria, moneda, giro_negocio, estado
) VALUES (
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000001',
    'ÁUREA Miraflores', 'aurea-miraflores', 'Av. Larco 450', '150122', 'Lima', 'Lima', 'Miraflores', 'Lima',
    '+51 987 654 321', 'America/Lima', 'PEN', 'cevicheria', 'activo'
)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, estado = EXCLUDED.estado,
    ubigeo_cod = EXCLUDED.ubigeo_cod, departamento = EXCLUDED.departamento,
    provincia = EXCLUDED.provincia, distrito = EXCLUDED.distrito, ciudad = EXCLUDED.ciudad,
    updated_at = NOW();

-- =============================================================================
-- 2. USUARIOS DE TODOS LOS ROLES OPERATIVOS (crypt pgcrypto)
-- =============================================================================
INSERT INTO usuario (id, empresa_id, local_id, nombre, correo, password_hash, telefono, rol, estado)
VALUES
('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001',NULL,
 'Rodrigo De Las Casas','propietario@aurea.local',crypt('propietario2026', gen_salt('bf', 12)),'+51 900 000 101','propietario','activo'),
('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Valeria Mendoza','admin@aurea.local',crypt('admin-local2026', gen_salt('bf', 12)),'+51 900 000 102','admin_local','activo'),
('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Carlos Huamán','mozo@aurea.local',crypt('mozo2026', gen_salt('bf', 12)),'+51 900 000 103','mozo','activo'),
('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Roberto Vargas','cocina@aurea.local',crypt('cocina2026', gen_salt('bf', 12)),'+51 900 000 104','cocina','activo'),
('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Lucía Quispe','cajero@aurea.local',crypt('cajero2026', gen_salt('bf', 12)),'+51 900 000 105','cajero','activo'),
('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Ana Ríos','mozo2@aurea.local',crypt('mozo2-2026', gen_salt('bf', 12)),'+51 900 000 106','mozo','activo'),
('00000000-0000-4000-8000-000000000107','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Diego Salas','mozo3@aurea.local',crypt('mozo3-2026', gen_salt('bf', 12)),'+51 900 000 107','mozo','activo')
ON CONFLICT (empresa_id, correo) DO UPDATE SET
    nombre = EXCLUDED.nombre, local_id = EXCLUDED.local_id, telefono = EXCLUDED.telefono,
    rol = EXCLUDED.rol, estado = EXCLUDED.estado, password_hash = EXCLUDED.password_hash, updated_at = NOW();

-- =============================================================================
-- 3. PARÁMETROS OPERATIVOS, POLÍTICAS Y HORARIO DE LA SEDE
-- =============================================================================
INSERT INTO configuracion_kds (
    local_id, tiempo_optimo_verde_min, tiempo_alerta_ambar_min, tiempo_maximo_pase_min,
    alerta_sonora_nueva_comanda, alerta_sonora_comanda_roja, intervalo_sonido_rojo_seg,
    vista_predeterminada
) VALUES ('00000000-0000-4000-8000-000000000010',15,25,3,true,true,60,'fifo')
ON CONFLICT (local_id) DO UPDATE SET
    tiempo_optimo_verde_min = EXCLUDED.tiempo_optimo_verde_min,
    tiempo_alerta_ambar_min = EXCLUDED.tiempo_alerta_ambar_min,
    updated_at = NOW();

INSERT INTO politicas_reserva (
    local_id, acepta_reservas, duracion_reserva_min, buffer_reserva_min,
    tolerancia_no_show_min, minutos_bloqueo_previo, margen_recordatorio_min,
    anticipacion_minima_horas, anticipacion_maxima_dias
) VALUES ('00000000-0000-4000-8000-000000000010',true,90,15,15,30,120,2,30)
ON CONFLICT (local_id) DO UPDATE SET acepta_reservas = EXCLUDED.acepta_reservas, updated_at = NOW();

INSERT INTO horario_atencion (id, local_id, dia_semana, nombre_turno, atiende, hora_inicio, hora_fin)
SELECT
    ('00000000-0000-4000-8000-0000000002' || lpad(d.dia::text, 2, '0'))::uuid,
    '00000000-0000-4000-8000-000000000010'::uuid, d.dia, 'Turno continuo', true, '12:00', '23:00'
FROM generate_series(1, 7) AS d(dia)
ON CONFLICT (local_id, dia_semana, hora_inicio) DO UPDATE SET hora_fin = EXCLUDED.hora_fin, updated_at = NOW();

INSERT INTO horario_excepcion (id, local_id, fecha, cerrado, hora_inicio, hora_fin, motivo, created_by) VALUES
('00000000-0000-4000-8000-000000000462','00000000-0000-4000-8000-000000000010',CURRENT_DATE + INTERVAL '14 days',true,NULL,NULL,'Mantenimiento preventivo programado','00000000-0000-4000-8000-000000000102')
ON CONFLICT (id) DO UPDATE SET motivo = EXCLUDED.motivo, fecha = EXCLUDED.fecha, cerrado = EXCLUDED.cerrado;

-- =============================================================================
-- 4. DISTRIBUCIÓN DE SALÓN Y TERRAZA (MESAS 100% LIBRES)
-- =============================================================================
INSERT INTO piso (id, local_id, nombre, columnas, filas, estado) VALUES
('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000010','Salón Principal',5,3,'activo'),
('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000010','Terraza',4,2,'activo')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, columnas = EXCLUDED.columnas, filas = EXCLUDED.filas, updated_at = NOW();

INSERT INTO mesa (id, local_id, piso_id, numero, capacidad, forma, posicion_x, posicion_y, permite_union, estado) VALUES
('00000000-0000-4000-8000-000000000311','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000301','01',4,'cuadrada',0,0,true,'activa'),
('00000000-0000-4000-8000-000000000312','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000301','02',4,'cuadrada',1,0,true,'activa'),
('00000000-0000-4000-8000-000000000313','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000301','03',4,'cuadrada',2,0,true,'activa'),
('00000000-0000-4000-8000-000000000314','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000301','04',6,'rectangular',3,0,true,'activa'),
('00000000-0000-4000-8000-000000000315','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000301','05',4,'redonda',0,1,false,'activa'),
('00000000-0000-4000-8000-000000000316','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000301','06',2,'cuadrada',1,1,true,'activa'),
('00000000-0000-4000-8000-000000000317','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000302','T1',2,'redonda',0,0,false,'activa'),
('00000000-0000-4000-8000-000000000318','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000302','T2',4,'rectangular',1,0,true,'activa')
ON CONFLICT (id) DO UPDATE SET capacidad = EXCLUDED.capacidad, forma = EXCLUDED.forma, updated_at = NOW();

-- =============================================================================
-- 5. CARTA, PROVEEDORES, INSUMOS (STOCK SANO) Y RECETAS
-- =============================================================================
INSERT INTO categoria_producto (id, local_id, nombre, orden, activa) VALUES
('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000010','Entradas',1,true),
('00000000-0000-4000-8000-000000000402','00000000-0000-4000-8000-000000000010','Fondos',2,true),
('00000000-0000-4000-8000-000000000403','00000000-0000-4000-8000-000000000010','Bebidas',3,true),
('00000000-0000-4000-8000-000000000404','00000000-0000-4000-8000-000000000010','Postres',4,true)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden, activa = EXCLUDED.activa, updated_at = NOW();

INSERT INTO proveedor (id, local_id, nombre, contacto, telefono, email, direccion, activo) VALUES
('00000000-0000-4000-8000-000000000411','00000000-0000-4000-8000-000000000010','Mercado Mayorista San Pedro','Ana Torres','+51 900 100 411','ventas@sanpedro.local','Mercado San Pedro, Lima',true),
('00000000-0000-4000-8000-000000000412','00000000-0000-4000-8000-000000000010','Bebidas del Pacífico S.A.C.','Marcos Ríos','+51 900 100 412','pedidos@pacifico.local','Av. Argentina 890, Lima',true)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, activo = EXCLUDED.activo, updated_at = NOW();

INSERT INTO insumo (id, local_id, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario, ultimo_proveedor_id, fecha_ultima_compra, estado) VALUES
('00000000-0000-4000-8000-000000000421','00000000-0000-4000-8000-000000000010','Pescado fresco','kg',15.000,5.000,28.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000422','00000000-0000-4000-8000-000000000010','Lomo fino','kg',12.000,3.000,42.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000423','00000000-0000-4000-8000-000000000010','Papa amarilla','kg',20.000,3.000,4.50,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000424','00000000-0000-4000-8000-000000000010','Arroz','kg',25.000,4.000,5.80,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000425','00000000-0000-4000-8000-000000000010','Inca Kola 500ml','botella',48.000,8.000,3.20,'00000000-0000-4000-8000-000000000412',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000426','00000000-0000-4000-8000-000000000010','Limón','kg',10.000,2.500,6.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo')
ON CONFLICT (id) DO UPDATE SET stock_actual = EXCLUDED.stock_actual, stock_minimo = EXCLUDED.stock_minimo,
    costo_unitario = EXCLUDED.costo_unitario, estado = EXCLUDED.estado, updated_at = NOW();

-- Insumos adicionales de la carta ampliada (la reposición agrega el consumo de varios platos sobre los compartidos).
INSERT INTO insumo (id, local_id, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario, ultimo_proveedor_id, fecha_ultima_compra, estado) VALUES
('00000000-0000-4000-8000-000000000621','00000000-0000-4000-8000-000000000010','Cebolla roja','kg',14.000,3.000,3.20,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000622','00000000-0000-4000-8000-000000000010','Ají limo','kg',4.000,1.000,18.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000623','00000000-0000-4000-8000-000000000010','Mariscos mixtos','kg',9.000,3.000,45.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000624','00000000-0000-4000-8000-000000000010','Pechuga de pollo','kg',10.000,3.000,14.50,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000625','00000000-0000-4000-8000-000000000010','Camote','kg',12.000,3.000,3.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000626','00000000-0000-4000-8000-000000000010','Choclo','und',40.000,10.000,1.20,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000627','00000000-0000-4000-8000-000000000010','Cerveza Cusqueña 310ml','botella',72.000,12.000,5.50,'00000000-0000-4000-8000-000000000412',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000628','00000000-0000-4000-8000-000000000010','Maíz morado','kg',6.000,1.500,7.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '3 days','activo'),
('00000000-0000-4000-8000-000000000629','00000000-0000-4000-8000-000000000010','Agua mineral 625ml','botella',48.000,8.000,1.80,'00000000-0000-4000-8000-000000000412',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000630','00000000-0000-4000-8000-000000000010','Leche evaporada','lata',24.000,6.000,4.20,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '3 days','activo')
ON CONFLICT (id) DO UPDATE SET stock_actual = EXCLUDED.stock_actual, stock_minimo = EXCLUDED.stock_minimo,
    costo_unitario = EXCLUDED.costo_unitario, estado = EXCLUDED.estado, updated_at = NOW();

INSERT INTO proveedor_insumo_habitual (proveedor_id, insumo_id) VALUES
('00000000-0000-4000-8000-000000000411','00000000-0000-4000-8000-000000000421'),
('00000000-0000-4000-8000-000000000411','00000000-0000-4000-8000-000000000422'),
('00000000-0000-4000-8000-000000000412','00000000-0000-4000-8000-000000000425')
ON CONFLICT DO NOTHING;

INSERT INTO producto (id, local_id, categoria_id, nombre, descripcion, precio, costo_estandar, foto_url, disponibilidad, requiere_preparacion, activo) VALUES
('00000000-0000-4000-8000-000000000431','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Ceviche Clásico',
 'Pescado fresco en leche de tigre, camote y choclo.',38.00,15.20,'catalogo/aurea/ceviche-clasico.jpg','disponible',true,true),
('00000000-0000-4000-8000-000000000432','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000402','Lomo Saltado Criollo',
 'Lomo al wok con arroz y papas crocantes.',42.00,18.30,'catalogo/aurea/lomo-saltado.jpg','disponible',true,true),
('00000000-0000-4000-8000-000000000433','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000403','Inca Kola 500ml',
 'Bebida helada de despacho directo.',9.00,3.20,'catalogo/aurea/inca-kola-500.jpg','disponible',false,true),
('00000000-0000-4000-8000-000000000434','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000404','Suspiro Limeño',
 'Postre de vitrina con merengue italiano.',18.00,5.50,'catalogo/aurea/suspiro.jpg','disponible',false,true),
('00000000-0000-4000-8000-000000000435','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Causa Limeña de Pollo',
 'Causa de papa amarilla con pollo y palta.',24.00,9.80,'catalogo/aurea/causa-limena.jpg','disponible',true,true)
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, disponibilidad = EXCLUDED.disponibilidad,
    requiere_preparacion = EXCLUDED.requiere_preparacion, activo = EXCLUDED.activo, updated_at = NOW();

INSERT INTO producto_insumo (producto_id, insumo_id, modo_calculo, rendimiento_platos, cantidad_descuenta) VALUES
('00000000-0000-4000-8000-000000000431','00000000-0000-4000-8000-000000000421','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000432','00000000-0000-4000-8000-000000000422','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000432','00000000-0000-4000-8000-000000000424','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000433','00000000-0000-4000-8000-000000000425','exacto',NULL,1.00000),
('00000000-0000-4000-8000-000000000435','00000000-0000-4000-8000-000000000423','exacto',NULL,0.30000)
ON CONFLICT (producto_id, insumo_id) DO UPDATE SET cantidad_descuenta = EXCLUDED.cantidad_descuenta;

-- Carta ampliada: 15 platos más (20 en total) sin foto, con receta. Categorías: 401 Entradas, 402 Fondos, 403 Bebidas, 404 Postres.
INSERT INTO producto (id, local_id, categoria_id, nombre, descripcion, precio, costo_estandar, disponibilidad, requiere_preparacion, activo) VALUES
('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Leche de Tigre','Concentrado de pescado, limón y ají limo.',18.00,6.20,'disponible',true,true),
('00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Tiradito de Pescado','Láminas de pescado con crema de ají limo.',36.00,14.50,'disponible',true,true),
('00000000-0000-4000-8000-000000000603','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Choritos a la Chalaca','Choros frescos con salsa criolla.',28.00,10.80,'disponible',true,true),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Ceviche Mixto','Pescado y mariscos en leche de tigre.',46.00,19.00,'disponible',true,true),
('00000000-0000-4000-8000-000000000605','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000401','Papa a la Huancaína','Papa amarilla con crema de ají amarillo.',16.00,4.80,'disponible',true,true),
('00000000-0000-4000-8000-000000000606','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000402','Arroz con Mariscos','Arroz meloso con mariscos y ají limo.',44.00,17.50,'disponible',true,true),
('00000000-0000-4000-8000-000000000607','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000402','Jalea Mixta','Pescado y mariscos fritos con camote y salsa criolla.',58.00,23.00,'disponible',true,true),
('00000000-0000-4000-8000-000000000608','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000402','Chaufa de Mariscos','Arroz chaufa al wok con mariscos.',40.00,15.50,'disponible',true,true),
('00000000-0000-4000-8000-000000000609','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000402','Ají de Gallina','Pollo deshilachado en crema de ají amarillo.',32.00,11.00,'disponible',true,true),
('00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000402','Tacu Tacu con Lomo','Tacu tacu crocante con lomo saltado.',46.00,19.50,'disponible',true,true),
('00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000403','Chicha Morada (jarra)','Jarra de chicha morada helada.',16.00,4.00,'disponible',false,true),
('00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000403','Limonada Frozen','Limonada frozen de la casa.',12.00,3.00,'disponible',false,true),
('00000000-0000-4000-8000-000000000613','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000403','Cerveza Cusqueña','Botella de 310 ml, despacho directo.',12.00,5.50,'disponible',false,true),
('00000000-0000-4000-8000-000000000614','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000403','Agua Mineral 625ml','Agua mineral sin gas, despacho directo.',6.00,1.80,'disponible',false,true),
('00000000-0000-4000-8000-000000000615','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000404','Mazamorra Morada','Postre de maíz morado con camote.',12.00,3.50,'disponible',false,true)
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, disponibilidad = EXCLUDED.disponibilidad,
    requiere_preparacion = EXCLUDED.requiere_preparacion, activo = EXCLUDED.activo, updated_at = NOW();

-- Insumos: 421 pescado, 422 lomo, 423 papa, 424 arroz, 426 limón, 621 cebolla, 622 ají limo, 623 mariscos,
-- 624 pollo, 625 camote, 626 choclo, 627 cerveza, 628 maíz morado, 629 agua, 630 leche evaporada.
INSERT INTO producto_insumo (producto_id, insumo_id, modo_calculo, rendimiento_platos, cantidad_descuenta) VALUES
('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000421','exacto',NULL,0.10000),
('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000426','exacto',NULL,0.08000),
('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000622','exacto',NULL,0.02000),
('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000621','exacto',NULL,0.05000),
('00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000421','exacto',NULL,0.20000),
('00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000426','exacto',NULL,0.06000),
('00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000622','exacto',NULL,0.02000),
('00000000-0000-4000-8000-000000000603','00000000-0000-4000-8000-000000000623','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000603','00000000-0000-4000-8000-000000000426','exacto',NULL,0.05000),
('00000000-0000-4000-8000-000000000603','00000000-0000-4000-8000-000000000621','exacto',NULL,0.08000),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000421','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000623','exacto',NULL,0.10000),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000426','exacto',NULL,0.10000),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000621','exacto',NULL,0.06000),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000625','exacto',NULL,0.12000),
('00000000-0000-4000-8000-000000000604','00000000-0000-4000-8000-000000000626','exacto',NULL,1.00000),
('00000000-0000-4000-8000-000000000605','00000000-0000-4000-8000-000000000423','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000605','00000000-0000-4000-8000-000000000630','exacto',NULL,0.20000),
('00000000-0000-4000-8000-000000000606','00000000-0000-4000-8000-000000000623','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000606','00000000-0000-4000-8000-000000000424','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000606','00000000-0000-4000-8000-000000000621','exacto',NULL,0.05000),
('00000000-0000-4000-8000-000000000607','00000000-0000-4000-8000-000000000421','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000607','00000000-0000-4000-8000-000000000623','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000607','00000000-0000-4000-8000-000000000625','exacto',NULL,0.10000),
('00000000-0000-4000-8000-000000000607','00000000-0000-4000-8000-000000000621','exacto',NULL,0.05000),
('00000000-0000-4000-8000-000000000607','00000000-0000-4000-8000-000000000426','exacto',NULL,0.05000),
('00000000-0000-4000-8000-000000000608','00000000-0000-4000-8000-000000000424','exacto',NULL,0.18000),
('00000000-0000-4000-8000-000000000608','00000000-0000-4000-8000-000000000623','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000609','00000000-0000-4000-8000-000000000624','exacto',NULL,0.20000),
('00000000-0000-4000-8000-000000000609','00000000-0000-4000-8000-000000000424','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000609','00000000-0000-4000-8000-000000000423','exacto',NULL,0.12000),
('00000000-0000-4000-8000-000000000609','00000000-0000-4000-8000-000000000630','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000422','exacto',NULL,0.20000),
('00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000424','exacto',NULL,0.12000),
('00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000628','exacto',NULL,0.08000),
('00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000426','exacto',NULL,0.03000),
('00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000426','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000613','00000000-0000-4000-8000-000000000627','exacto',NULL,1.00000),
('00000000-0000-4000-8000-000000000614','00000000-0000-4000-8000-000000000629','exacto',NULL,1.00000),
('00000000-0000-4000-8000-000000000615','00000000-0000-4000-8000-000000000628','exacto',NULL,0.06000),
('00000000-0000-4000-8000-000000000615','00000000-0000-4000-8000-000000000625','exacto',NULL,0.05000)
ON CONFLICT (producto_id, insumo_id) DO UPDATE SET cantidad_descuenta = EXCLUDED.cantidad_descuenta;

-- =============================================================================
-- 6. PROMOCIONES COMERCIALES Y MÉTODOS DE PAGO
-- =============================================================================
INSERT INTO promocion (id, local_id, nombre, descripcion, tipo_descuento, valor, monto_minimo_consumo, dias_semana, hora_inicio, hora_fin, fecha_inicio, fecha_fin, limite_usos, usos_actuales, activa) VALUES
('00000000-0000-4000-8000-000000000441','00000000-0000-4000-8000-000000000010','15% Almuerzo Ejecutivo',
 'Válida de lunes a viernes para consumos de almuerzo.','porcentaje',15.00,50.00,'{1,2,3,4,5}','12:00','16:00',CURRENT_DATE-INTERVAL '10 days',CURRENT_DATE+INTERVAL '60 days',500,0,true)
ON CONFLICT (id) DO UPDATE SET valor = EXCLUDED.valor, usos_actuales = EXCLUDED.usos_actuales, activa = EXCLUDED.activa, updated_at = NOW();

-- El catálogo de ventas POS admite exclusivamente efectivo, tarjeta y billetera digital.
DELETE FROM metodo_pago_local WHERE codigo = 'transferencia';

INSERT INTO metodo_pago_local (id, local_id, codigo, nombre, activo, comision_porcentaje, datos_adicionales, icono, orden) VALUES
('00000000-0000-4000-8000-000000000451','00000000-0000-4000-8000-000000000010','efectivo','Efectivo',true,0.00,'{}','banknote',1),
('00000000-0000-4000-8000-000000000452','00000000-0000-4000-8000-000000000010','tarjeta','Tarjeta POS',true,3.50,'{"operador":"Niubiz"}','credit-card',2),
('00000000-0000-4000-8000-000000000453','00000000-0000-4000-8000-000000000010','billetera_digital','Yape / Plin',true,0.00,'{"telefono":"987654321","titular":"ÁUREA S.A.C."}','smartphone',3)
ON CONFLICT (id) DO UPDATE SET activo = EXCLUDED.activo, comision_porcentaje = EXCLUDED.comision_porcentaje, updated_at = NOW();

-- =============================================================================
-- 7. SERIES ELECTRÓNICAS (INICIALIZADAS EN CORRELATIVO 0)
-- Permite que la primera emisión formal de boleta, factura o nota inicie en #00000001
-- =============================================================================
INSERT INTO comprobante_serie (id, local_id, tipo_comprobante, serie, correlativo_actual, activo) VALUES
('00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000010','boleta','B001',0,true),
('00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000010','factura','F001',0,true),
('00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000010','nota_venta','NV01',0,true),
('00000000-0000-4000-8000-000000000514','00000000-0000-4000-8000-000000000010','nota_credito','BC01',0,true),
('00000000-0000-4000-8000-000000000515','00000000-0000-4000-8000-000000000010','nota_credito','FC01',0,true)
ON CONFLICT (id) DO UPDATE SET correlativo_actual = EXCLUDED.correlativo_actual, activo = EXCLUDED.activo, updated_at = NOW();

-- =============================================================================
-- 8. CLIENTE BASE DE PRUEBA (SIN COMPROBANTES NI TRANSACCIONES HISTÓRICAS)
-- =============================================================================
INSERT INTO cliente (id, empresa_id, tipo_documento, numero_documento, nombre_identificativo, telefono, email, detalle) VALUES
('00000000-0000-4000-8000-000000000521','00000000-0000-4000-8000-000000000001','DNI','45678901','María Torres','+51 999 111 222','maria.torres@example.test','{"origen":"seed_local"}')
ON CONFLICT (empresa_id, tipo_documento, numero_documento) DO UPDATE SET
    nombre_identificativo = EXCLUDED.nombre_identificativo, updated_at = NOW();

COMMIT;
