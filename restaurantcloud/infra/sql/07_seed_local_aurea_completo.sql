-- =============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 07: ESCENARIO LOCAL COMPLETO "ÁUREA"
-- Motor: PostgreSQL 16 | Exclusivo para desarrollo local
-- =============================================================================
-- Propósito: poblar una empresa, sede, usuarios, carta, inventario, mesas,
-- pedidos, caja, comprobantes, incidentes y notificaciones para desarrollar
-- verticalmente Auth → Carta → Mozo → Cocina → Caja.
--
-- Es idempotente: usa UUID fijos y ON CONFLICT. No elimina datos existentes.
-- Nunca ejecutar este archivo en staging ni producción.
--
-- Credenciales locales (la contraseña de todos los usuarios es PasswordLocal2026!):
-- propietario@aurea.local | admin@aurea.local | mozo@aurea.local
-- cocina@aurea.local      | cajero@aurea.local
-- =============================================================================

BEGIN;

-- Identificadores canónicos del escenario local.
-- empresa: 00000000-0000-4000-8000-000000000001
-- local:   00000000-0000-4000-8000-000000000010

INSERT INTO empresa (
    id, razon_social, tipo_identidad_fiscal, ruc, correo_contacto, telefono,
    plan_id, estado, origen_alta, nota_alta, stripe_customer_id
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Restaurante ÁUREA S.A.C.', 'RUC_20', '20612345678', 'contacto@aurea.local',
    '+51 987 654 321', 2, 'activa', 'manual_admin',
    'Tenant ficticio exclusivo para desarrollo local.', 'cus_local_aurea'
)
ON CONFLICT (id) DO UPDATE SET
    razon_social = EXCLUDED.razon_social, correo_contacto = EXCLUDED.correo_contacto,
    telefono = EXCLUDED.telefono, plan_id = EXCLUDED.plan_id, estado = EXCLUDED.estado,
    updated_at = NOW();

INSERT INTO suscripcion (
    id, empresa_id, plan_id, fecha_inicio, fecha_fin_periodo, estado,
    dias_gracia_restantes, stripe_subscription_id
) VALUES (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001', 2,
    NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 'activa', 5,
    'sub_local_aurea'
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

-- Usuarios de todos los roles operativos. crypt() usa pgcrypto (script 01).
INSERT INTO usuario (id, empresa_id, local_id, nombre, correo, password_hash, telefono, rol, estado)
VALUES
('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001',NULL,
 'Rodrigo De Las Casas','propietario@aurea.local',crypt('PasswordLocal2026!', gen_salt('bf', 12)),'+51 900 000 101','propietario','activo'),
('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Valeria Mendoza','admin@aurea.local',crypt('PasswordLocal2026!', gen_salt('bf', 12)),'+51 900 000 102','admin_local','activo'),
('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Carlos Huamán','mozo@aurea.local',crypt('PasswordLocal2026!', gen_salt('bf', 12)),'+51 900 000 103','mozo','activo'),
('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Roberto Vargas','cocina@aurea.local',crypt('PasswordLocal2026!', gen_salt('bf', 12)),'+51 900 000 104','cocina','activo'),
('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',
 'Lucía Quispe','cajero@aurea.local',crypt('PasswordLocal2026!', gen_salt('bf', 12)),'+51 900 000 105','cajero','activo')
ON CONFLICT (empresa_id, correo) DO UPDATE SET
    nombre = EXCLUDED.nombre, local_id = EXCLUDED.local_id, telefono = EXCLUDED.telefono,
    rol = EXCLUDED.rol, estado = EXCLUDED.estado, updated_at = NOW();

-- Parámetros operativos y horario de la sede.
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

-- Plano de salón y terraza. Las mesas activas se reflejan mediante pedidos,
-- no mediante la columna administrativa mesa.estado.
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

-- Carta, proveedores e inventario.
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
('00000000-0000-4000-8000-000000000421','00000000-0000-4000-8000-000000000010','Pescado fresco','kg',8.500,5.000,28.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000422','00000000-0000-4000-8000-000000000010','Lomo fino','kg',6.000,3.000,42.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000423','00000000-0000-4000-8000-000000000010','Papa amarilla','kg',1.000,3.000,4.50,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','activo'),
('00000000-0000-4000-8000-000000000424','00000000-0000-4000-8000-000000000010','Arroz','kg',12.000,4.000,5.80,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000425','00000000-0000-4000-8000-000000000010','Inca Kola 500ml','botella',24.000,8.000,3.20,'00000000-0000-4000-8000-000000000412',NOW()-INTERVAL '2 days','activo'),
('00000000-0000-4000-8000-000000000426','00000000-0000-4000-8000-000000000010','Limón','kg',2.000,2.500,6.00,'00000000-0000-4000-8000-000000000411',NOW()-INTERVAL '1 day','agotado')
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
 'Causa de papa amarilla con pollo y palta.',24.00,9.80,'catalogo/aurea/causa-limena.jpg','agotado',true,true)
ON CONFLICT (id) DO UPDATE SET precio = EXCLUDED.precio, disponibilidad = EXCLUDED.disponibilidad,
    requiere_preparacion = EXCLUDED.requiere_preparacion, activo = EXCLUDED.activo, updated_at = NOW();

INSERT INTO producto_insumo (producto_id, insumo_id, modo_calculo, rendimiento_platos, cantidad_descuenta) VALUES
('00000000-0000-4000-8000-000000000431','00000000-0000-4000-8000-000000000421','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000432','00000000-0000-4000-8000-000000000422','exacto',NULL,0.25000),
('00000000-0000-4000-8000-000000000432','00000000-0000-4000-8000-000000000424','exacto',NULL,0.15000),
('00000000-0000-4000-8000-000000000433','00000000-0000-4000-8000-000000000425','exacto',NULL,1.00000),
('00000000-0000-4000-8000-000000000435','00000000-0000-4000-8000-000000000423','exacto',NULL,0.30000)
ON CONFLICT (producto_id, insumo_id) DO UPDATE SET cantidad_descuenta = EXCLUDED.cantidad_descuenta;

INSERT INTO promocion (id, local_id, nombre, descripcion, tipo_descuento, valor, monto_minimo_consumo, dias_semana, hora_inicio, hora_fin, fecha_inicio, fecha_fin, limite_usos, usos_actuales, activa) VALUES
('00000000-0000-4000-8000-000000000441','00000000-0000-4000-8000-000000000010','15% Almuerzo Ejecutivo',
 'Válida de lunes a viernes para consumos de almuerzo.','porcentaje',15.00,50.00,'{1,2,3,4,5}','12:00','16:00',CURRENT_DATE-INTERVAL '10 days',CURRENT_DATE+INTERVAL '60 days',500,12,true)
ON CONFLICT (id) DO UPDATE SET valor = EXCLUDED.valor, usos_actuales = EXCLUDED.usos_actuales, activa = EXCLUDED.activa, updated_at = NOW();

INSERT INTO metodo_pago_local (id, local_id, codigo, nombre, activo, comision_porcentaje, datos_adicionales, icono, orden) VALUES
('00000000-0000-4000-8000-000000000451','00000000-0000-4000-8000-000000000010','efectivo','Efectivo',true,0.00,'{}','banknote',1),
('00000000-0000-4000-8000-000000000452','00000000-0000-4000-8000-000000000010','tarjeta','Tarjeta POS',true,3.50,'{"operador":"Niubiz"}','credit-card',2),
('00000000-0000-4000-8000-000000000453','00000000-0000-4000-8000-000000000010','billetera_digital','Yape / Plin',true,0.00,'{"telefono":"987654321","titular":"ÁUREA S.A.C."}','smartphone',3)
ON CONFLICT (id) DO UPDATE SET activo = EXCLUDED.activo, comision_porcentaje = EXCLUDED.comision_porcentaje, updated_at = NOW();

-- Reservas y tres estados de pedido: en cocina, cuenta solicitada y cobrado.
INSERT INTO reserva (id, local_id, cliente_nombre, cliente_telefono, fecha_hora, num_personas, estado, creado_por) VALUES
('00000000-0000-4000-8000-000000000461','00000000-0000-4000-8000-000000000010','Familia Gómez','+51 999 222 333',NOW()+INTERVAL '45 minutes',4,'confirmada','00000000-0000-4000-8000-000000000103')
ON CONFLICT (id) DO UPDATE SET fecha_hora = EXCLUDED.fecha_hora, estado = EXCLUDED.estado, updated_at = NOW();

INSERT INTO reserva_mesa (reserva_id, mesa_id) VALUES
('00000000-0000-4000-8000-000000000461','00000000-0000-4000-8000-000000000315') ON CONFLICT DO NOTHING;

INSERT INTO horario_excepcion (id, local_id, fecha, cerrado, hora_inicio, hora_fin, motivo, created_by) VALUES
('00000000-0000-4000-8000-000000000462','00000000-0000-4000-8000-000000000010',CURRENT_DATE + INTERVAL '7 days',true,NULL,NULL,'Mantenimiento preventivo del local','00000000-0000-4000-8000-000000000102')
ON CONFLICT (local_id, fecha) DO UPDATE SET motivo = EXCLUDED.motivo;

INSERT INTO pedido (id, local_id, numero_comanda, mesa_id, mozo_id, estado, comensales, created_at) VALUES
('00000000-0000-4000-8000-000000000471','00000000-0000-4000-8000-000000000010',148,'00000000-0000-4000-8000-000000000312','00000000-0000-4000-8000-000000000103','enviado',2,NOW()-INTERVAL '14 minutes'),
('00000000-0000-4000-8000-000000000472','00000000-0000-4000-8000-000000000010',149,'00000000-0000-4000-8000-000000000314','00000000-0000-4000-8000-000000000103','cuenta_pedida',4,NOW()-INTERVAL '32 minutes'),
('00000000-0000-4000-8000-000000000473','00000000-0000-4000-8000-000000000010',147,'00000000-0000-4000-8000-000000000316','00000000-0000-4000-8000-000000000103','cobrado',2,NOW()-INTERVAL '3 hours'),
('00000000-0000-4000-8000-000000000474','00000000-0000-4000-8000-000000000010',146,'00000000-0000-4000-8000-000000000313','00000000-0000-4000-8000-000000000103','anulado',2,NOW()-INTERVAL '4 hours')
ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, comensales = EXCLUDED.comensales, updated_at = NOW();

INSERT INTO pedido_item (id, pedido_id, producto_id, cantidad, precio_unitario, nota_cocina, estado, numero_ronda, fecha_inicio_coccion, fecha_listo_cocina) VALUES
('00000000-0000-4000-8000-000000000481','00000000-0000-4000-8000-000000000471','00000000-0000-4000-8000-000000000431',1,38.00,'Picante medio','listo',1,NOW()-INTERVAL '12 minutes',NOW()-INTERVAL '1 minute'),
('00000000-0000-4000-8000-000000000482','00000000-0000-4000-8000-000000000471','00000000-0000-4000-8000-000000000432',1,42.00,'Término 3/4','en_preparacion',1,NOW()-INTERVAL '8 minutes',NULL),
('00000000-0000-4000-8000-000000000483','00000000-0000-4000-8000-000000000471','00000000-0000-4000-8000-000000000433',2,9.00,'Servir heladas','entregado',1,NULL,NULL),
('00000000-0000-4000-8000-000000000484','00000000-0000-4000-8000-000000000472','00000000-0000-4000-8000-000000000432',2,42.00,'Papas crocantes','entregado',1,NOW()-INTERVAL '25 minutes',NOW()-INTERVAL '14 minutes'),
('00000000-0000-4000-8000-000000000485','00000000-0000-4000-8000-000000000472','00000000-0000-4000-8000-000000000434',1,18.00,'Con velita','listo',1,NULL,NULL),
('00000000-0000-4000-8000-000000000486','00000000-0000-4000-8000-000000000473','00000000-0000-4000-8000-000000000431',2,38.00,NULL,'entregado',1,NOW()-INTERVAL '170 minutes',NOW()-INTERVAL '155 minutes'),
('00000000-0000-4000-8000-000000000487','00000000-0000-4000-8000-000000000474','00000000-0000-4000-8000-000000000435',2,24.00,'Cliente reportó demora prolongada','anulado',1,NOW()-INTERVAL '230 minutes',NULL)
ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, nota_cocina = EXCLUDED.nota_cocina, updated_at = NOW();

-- Dos subcuentas pendientes en la mesa 04 para CU-MOZO-09 / Caja POS.
INSERT INTO pedido_subcuenta (
    id, pedido_id, numero_subcuenta, promocion_id, tipo_comprobante, documento_cliente,
    nombre_cliente, direccion_cliente, metodo_pago_id, medio_pago, subtotal_bruto,
    descuento, monto_recargo, total, estado
) VALUES
('00000000-0000-4000-8000-000000000491','00000000-0000-4000-8000-000000000472',1,NULL,'boleta','45678901',
 'María Torres',NULL,'00000000-0000-4000-8000-000000000451','efectivo',84.00,0.00,0.00,84.00,'pendiente'),
('00000000-0000-4000-8000-000000000492','00000000-0000-4000-8000-000000000472',2,'00000000-0000-4000-8000-000000000441','nota_venta',NULL,
 'Grupo mesa 04',NULL,'00000000-0000-4000-8000-000000000453','billetera_digital',18.00,2.70,0.00,15.30,'pendiente')
ON CONFLICT (id) DO UPDATE SET total = EXCLUDED.total, estado = EXCLUDED.estado, updated_at = NOW();

INSERT INTO pedido_subcuenta_item (id, subcuenta_id, pedido_item_id, cantidad, precio_unitario, subtotal) VALUES
('00000000-0000-4000-8000-000000000493','00000000-0000-4000-8000-000000000491','00000000-0000-4000-8000-000000000484',2,42.00,84.00),
('00000000-0000-4000-8000-000000000494','00000000-0000-4000-8000-000000000492','00000000-0000-4000-8000-000000000485',1,18.00,18.00)
ON CONFLICT (id) DO UPDATE SET cantidad = EXCLUDED.cantidad, subtotal = EXCLUDED.subtotal;

-- Caja abierta para probar apertura, egresos y cobro. Caja histórica cerrada para Reporte Z.
INSERT INTO caja (id, local_id, cajero_id, fecha_apertura, monto_apertura, notas_apertura, estado) VALUES
('00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000105',NOW()-INTERVAL '4 hours',200.00,'Turno de almuerzo activo','abierta'),
('00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000105',NOW()-INTERVAL '1 day',150.00,'Turno cerrado de referencia','cerrada')
ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, monto_apertura = EXCLUDED.monto_apertura, updated_at = NOW();

UPDATE caja SET fecha_cierre = NOW()-INTERVAL '16 hours', monto_esperado = 842.00, monto_real = 842.00,
    discrepancia = 0.00, notas_cierre = 'Turno cuadrado correctamente.', revisado = true,
    revisado_por = '00000000-0000-4000-8000-000000000102', revisado_at = NOW()-INTERVAL '15 hours'
WHERE id = '00000000-0000-4000-8000-000000000502';

INSERT INTO comprobante_serie (id, local_id, tipo_comprobante, serie, correlativo_actual, activo) VALUES
('00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000010','boleta','B001',1289,true),
('00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000010','factura','F001',452,true),
('00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000010','nota_venta','NV01',91,true),
('00000000-0000-4000-8000-000000000514','00000000-0000-4000-8000-000000000010','nota_credito','BC01',12,true),
('00000000-0000-4000-8000-000000000515','00000000-0000-4000-8000-000000000010','nota_credito','FC01',3,true)
ON CONFLICT (id) DO UPDATE SET correlativo_actual = EXCLUDED.correlativo_actual, activo = EXCLUDED.activo, updated_at = NOW();

INSERT INTO cliente (id, empresa_id, tipo_documento, numero_documento, nombre_identificativo, telefono, email, detalle) VALUES
('00000000-0000-4000-8000-000000000521','00000000-0000-4000-8000-000000000001','DNI','45678901','María Torres','+51 999 111 222','maria.torres@example.test','{"origen":"seed_local"}')
ON CONFLICT (empresa_id, tipo_documento, numero_documento) DO UPDATE SET
    nombre_identificativo = EXCLUDED.nombre_identificativo, updated_at = NOW();

INSERT INTO comprobante (
    id, pedido_id, caja_id, cliente_id, tipo, serie, correlativo, documento_cliente,
    nombre_cliente, telefono_envio, email_envio, metodo_pago_id, medio_pago,
    subtotal_consumo, descuento, total, base_imponible, igv, estado
) VALUES (
    '00000000-0000-4000-8000-000000000531','00000000-0000-4000-8000-000000000473',
    '00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000521',
    'boleta','B001',1289,'45678901','María Torres','+51 999 111 222','maria.torres@example.test',
    '00000000-0000-4000-8000-000000000451','efectivo',76.00,0.00,76.00,64.41,11.59,'emitido'
)
ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, total = EXCLUDED.total, updated_at = NOW();

INSERT INTO caja_movimiento (id, caja_id, local_id, tipo, monto, metodo_pago, comprobante_id, descripcion) VALUES
('00000000-0000-4000-8000-000000000541','00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000010','apertura',200.00,'efectivo',NULL,'Fondo inicial del turno'),
('00000000-0000-4000-8000-000000000542','00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000010','ingreso_venta',76.00,'efectivo','00000000-0000-4000-8000-000000000531','Boleta B001-1289')
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, descripcion = EXCLUDED.descripcion;

INSERT INTO gasto_manual (id, local_id, categoria, monto, origen_fondos, caja_id, proveedor_nombre, tipo_comprobante, numero_documento, descripcion, fecha, registrado_por) VALUES
('00000000-0000-4000-8000-000000000543','00000000-0000-4000-8000-000000000010','limpieza_aseo',35.50,'efectivo_caja','00000000-0000-4000-8000-000000000501','Limpieza Miraflores','boleta','B001-778','Compra urgente de insumos de limpieza.',CURRENT_DATE,'00000000-0000-4000-8000-000000000102')
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, descripcion = EXCLUDED.descripcion;

INSERT INTO caja_movimiento (id, caja_id, local_id, tipo, monto, metodo_pago, gasto_manual_id, descripcion) VALUES
('00000000-0000-4000-8000-000000000544','00000000-0000-4000-8000-000000000501','00000000-0000-4000-8000-000000000010','egreso_gasto_manual',-35.50,'efectivo','00000000-0000-4000-8000-000000000543','Gasto de limpieza registrado')
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, descripcion = EXCLUDED.descripcion;

INSERT INTO auditoria_caja_cierre (id, caja_id, local_id, cajero_id, reporte_z_json) VALUES
('00000000-0000-4000-8000-000000000551','00000000-0000-4000-8000-000000000502','00000000-0000-4000-8000-000000000010',
 '00000000-0000-4000-8000-000000000105','{"turno":"referencia local","monto_esperado":842.00,"monto_real":842.00,"diferencia":0.00}'::jsonb)
ON CONFLICT (id) DO UPDATE SET reporte_z_json = EXCLUDED.reporte_z_json;

-- Incidente y notificaciones para probar panel propietario/admin y SSE posteriormente.
INSERT INTO incidente (
    id, local_id, codigo, titulo, categoria, descripcion, medidas_inmediatas, fecha_hora,
    gravedad, foto_url, empleado_id, registrado_por, estado
) VALUES (
    '00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000010','INC-2026-001',
    'Retraso de preparación en mesa 02','servicio_cliente',
    'La comanda 148 superó el tiempo objetivo de preparación durante el turno de almuerzo.',
    'Se informó al cliente y se priorizó el plato principal en KDS.',NOW()-INTERVAL '10 minutes','alta',
    'privado/empresas/aurea/incidentes/INC-2026-001/evidencia.jpg',
    '00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000102','abierto'
)
ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, gravedad = EXCLUDED.gravedad, updated_at = NOW();

INSERT INTO notificacion (id, empresa_id, local_id, usuario_id, rol_destinatario, tipo, prioridad, titulo, mensaje, entidad_tipo, entidad_id, leida) VALUES
('00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010',NULL,'propietario','incidente.alta','alta','Incidente operativo de alta prioridad','Mesa 02 presenta un retraso de cocina que requiere supervisión.','incidente','00000000-0000-4000-8000-000000000601',false),
('00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000103',NULL,'pedido.item_listo','media','Plato listo para despacho','El ceviche de la mesa 02 está listo en el pase.','pedido_item','00000000-0000-4000-8000-000000000481',false)
ON CONFLICT (id) DO UPDATE SET leida = EXCLUDED.leida, mensaje = EXCLUDED.mensaje;

INSERT INTO log_auditoria (id, empresa_id, local_id, usuario_id, accion, entidad_tipo, entidad_id, detalle) VALUES
('00000000-0000-4000-8000-000000000621','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000103','pedido.creado','pedido','00000000-0000-4000-8000-000000000471','{"origen":"seed_local","numero_comanda":148}'::jsonb)
ON CONFLICT (id) DO UPDATE SET detalle = EXCLUDED.detalle;

INSERT INTO pedido_anulacion (
    id, local_id, pedido_id, pedido_item_id, tipo_anulacion, mesa_id, mesa_numero,
    producto_id, producto_nombre, cantidad, precio_unitario, monto_total, mozo_id,
    anulado_por, motivo_categoria, motivo_detalle, pedido_created_at, minutos_espera,
    estado_anterior, es_merma, costo_merma
) VALUES (
    '00000000-0000-4000-8000-000000000622','00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000474','00000000-0000-4000-8000-000000000487',
    'item_individual','00000000-0000-4000-8000-000000000313','03',
    '00000000-0000-4000-8000-000000000435','Causa Limeña de Pollo',2,24.00,48.00,
    '00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000103',
    'demora_cliente','El cliente no pudo esperar el tiempo adicional informado.',NOW()-INTERVAL '4 hours',35,
    'en_preparacion',true,19.60
)
ON CONFLICT (id) DO UPDATE SET motivo_detalle = EXCLUDED.motivo_detalle, costo_merma = EXCLUDED.costo_merma;

INSERT INTO ficha_compra (id, local_id, proveedor_id, usuario_id, tipo_comprobante, numero_comprobante, fecha_emision, metodo_pago, desglosa_igv, subtotal, impuestos, total, estado, notas) VALUES
('00000000-0000-4000-8000-000000000623','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000411','00000000-0000-4000-8000-000000000102','factura','F001-009821',CURRENT_DATE-1,'transferencia',true,100.00,18.00,118.00,'registrada','Compra de reposición para pruebas locales')
ON CONFLICT (id) DO UPDATE SET total = EXCLUDED.total, notas = EXCLUDED.notas;

INSERT INTO ficha_compra_detalle (id, ficha_compra_id, insumo_id, cantidad, precio_unitario, subtotal) VALUES
('00000000-0000-4000-8000-000000000624','00000000-0000-4000-8000-000000000623','00000000-0000-4000-8000-000000000421',2.0000,28.0000,56.00),
('00000000-0000-4000-8000-000000000625','00000000-0000-4000-8000-000000000623','00000000-0000-4000-8000-000000000423',10.0000,4.4000,44.00)
ON CONFLICT (id) DO UPDATE SET cantidad = EXCLUDED.cantidad, subtotal = EXCLUDED.subtotal;

INSERT INTO auditoria_stock_ajuste (id, local_id, insumo_id, usuario_id, stock_anterior, stock_nuevo, diferencia, motivo, notas) VALUES
('00000000-0000-4000-8000-000000000626','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000423','00000000-0000-4000-8000-000000000102',4.000,1.000,-3.000,'merma_desperdicio','Merma simulada para probar auditoría de inventario.')
ON CONFLICT (id) DO UPDATE SET stock_nuevo = EXCLUDED.stock_nuevo, diferencia = EXCLUDED.diferencia;

INSERT INTO snapshot_stock_diario (id, insumo_id, local_id, fecha, stock_cantidad, estuvo_agotado) VALUES
('00000000-0000-4000-8000-000000000631','00000000-0000-4000-8000-000000000423','00000000-0000-4000-8000-000000000010',CURRENT_DATE,1.000,false),
('00000000-0000-4000-8000-000000000632','00000000-0000-4000-8000-000000000426','00000000-0000-4000-8000-000000000010',CURRENT_DATE,2.000,true)
ON CONFLICT (insumo_id, local_id, fecha) DO UPDATE SET stock_cantidad = EXCLUDED.stock_cantidad, estuvo_agotado = EXCLUDED.estuvo_agotado;

COMMIT;
