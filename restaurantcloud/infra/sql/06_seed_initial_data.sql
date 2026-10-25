-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 06: DATOS SEMILLA BASE DE PLATAFORMA
-- Motor: PostgreSQL 16
-- Alcance: Catálogo comercial oficial (CU-SAAS-03) y Usuario raíz Admin SaaS
-- ==============================================================================

SET client_encoding = 'UTF8';

-- 1. CATÁLOGO COMERCIAL OFICIAL DE PLANES (CU-SAAS-03)
INSERT INTO plan (
    id, nombre, slug, descripcion, precio_mensual, precio_anual, 
    max_locales, max_pisos, max_mesas, max_usuarios, 
    incluye_reservas, incluye_reportes_avanzados, incluye_asistente_ia, incluye_prediccion_ia, 
    activo, visible_publico
) VALUES 
(
    1, 
    'Starter', 
    'plan-starter', 
    'Ideal para restaurantes pequeños y pollerías de salón único con hasta 25 mesas.', 
    99.00, 
    990.00, 
    1, 
    1, 
    25, 
    5, 
    false, 
    false, 
    false, 
    false, 
    true, 
    true
),
(
    2, 
    'Pro', 
    'plan-pro', 
    'Para restaurantes en expansión con múltiples ambientes, reservas de salón y KDS.', 
    249.00, 
    2490.00, 
    3, 
    6, 
    60, 
    15, 
    true, 
    true, 
    true, 
    false, 
    true, 
    true
),
(
    3, 
    'Enterprise', 
    'plan-enterprise', 
    'Para cadenas gastronómicas y franquicias con operaciones complejas y suite completa de IA.', 
    499.00, 
    4990.00, 
    10, 
    50, 
    600, 
    40, 
    true, 
    true, 
    true, 
    true, 
    true, 
    true
)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    slug = EXCLUDED.slug,
    descripcion = EXCLUDED.descripcion,
    precio_mensual = EXCLUDED.precio_mensual,
    precio_anual = EXCLUDED.precio_anual,
    max_locales = EXCLUDED.max_locales,
    max_pisos = EXCLUDED.max_pisos,
    max_mesas = EXCLUDED.max_mesas,
    max_usuarios = EXCLUDED.max_usuarios,
    incluye_reservas = EXCLUDED.incluye_reservas,
    incluye_reportes_avanzados = EXCLUDED.incluye_reportes_avanzados,
    incluye_asistente_ia = EXCLUDED.incluye_asistente_ia,
    incluye_prediccion_ia = EXCLUDED.incluye_prediccion_ia,
    activo = EXCLUDED.activo,
    visible_publico = EXCLUDED.visible_publico,
    updated_at = NOW();

-- 2. USUARIO RAÍZ ADMINISTRADOR GLOBAL SAAS (CU-SAAS-01)
-- Credencial de inicio: admin@restaurantcloud.pe / admin-saas2026
INSERT INTO usuario (
    id, empresa_id, local_id, nombre, correo, password_hash, telefono, rol, estado
) VALUES (
    fn_uuid_v8(),
    NULL,
    NULL,
    'Super Administrador SaaS',
    'admin@restaurantcloud.pe',
    crypt('admin-saas2026', gen_salt('bf', 12)),
    '+51 930 723 537',
    'admin_saas',
    'activo'
)
ON CONFLICT (correo) WHERE empresa_id IS NULL DO UPDATE SET
    nombre = EXCLUDED.nombre,
    password_hash = EXCLUDED.password_hash,
    telefono = EXCLUDED.telefono,
    estado = EXCLUDED.estado,
    updated_at = NOW();

-- 3. CATÁLOGO MAESTRO DE UBICACIÓN GEOGRÁFICA NACIONAL (UBIGEO INEI / SUNAT)
-- 3.1 Departamentos / Regiones del Perú (25 Regiones)
INSERT INTO departamento (codigo, nombre) VALUES
('01', 'Amazonas'),
('02', 'Áncash'),
('03', 'Apurímac'),
('04', 'Arequipa'),
('05', 'Ayacucho'),
('06', 'Cajamarca'),
('07', 'Callao'),
('08', 'Cusco'),
('09', 'Huancavelica'),
('10', 'Huánuco'),
('11', 'Ica'),
('12', 'Junín'),
('13', 'La Libertad'),
('14', 'Lambayeque'),
('15', 'Lima'),
('16', 'Loreto'),
('17', 'Madre de Dios'),
('18', 'Moquegua'),
('19', 'Pasco'),
('20', 'Piura'),
('21', 'Puno'),
('22', 'San Martín'),
('23', 'Tacna'),
('24', 'Tumbes'),
('25', 'Ucayali')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 3.2 Provincias Principales
INSERT INTO provincia (codigo, departamento_codigo, nombre) VALUES
-- Áncash (02)
('0218', '02', 'Santa'),
('0201', '02', 'Huaraz'),
('0207', '02', 'Casma'),
('0211', '02', 'Huarmey'),
-- Lima (15) y Callao (07)
('1501', '15', 'Lima'),
('0701', '07', 'Callao'),
-- Norte: La Libertad, Lambayeque, Piura
('1301', '13', 'Trujillo'),
('1401', '14', 'Chiclayo'),
('2001', '20', 'Piura'),
-- Sur: Arequipa, Cusco, Ica
('0401', '04', 'Arequipa'),
('0801', '08', 'Cusco'),
('1101', '11', 'Ica')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 3.3 Distritos Oficiales
INSERT INTO distrito (codigo, provincia_codigo, departamento_codigo, nombre) VALUES
-- Provincia del Santa (0218) - Áncash (02) [PREDETERMINADO NACIONAL]
('021801', '0218', '02', 'Chimbote'),
('021808', '0218', '02', 'Nuevo Chimbote'),
('021803', '0218', '02', 'Coishco'),
('021809', '0218', '02', 'Santa'),
('021807', '0218', '02', 'Samanco'),
('021806', '0218', '02', 'Nepeña'),
('021805', '0218', '02', 'Moro'),
('021804', '0218', '02', 'Macate'),
('021802', '0218', '02', 'Cáceres del Perú'),
-- Provincia de Huaraz (0201) - Áncash (02)
('020101', '0201', '02', 'Huaraz'),
('020102', '0201', '02', 'Independencia'),
-- Provincia de Lima (1501) - Lima (15)
('150122', '1501', '15', 'Miraflores'),
('150131', '1501', '15', 'San Isidro'),
('150140', '1501', '15', 'Santiago de Surco'),
('150130', '1501', '15', 'San Borja'),
('150104', '1501', '15', 'Barranco'),
('150101', '1501', '15', 'Lima'),
-- Provincia de Trujillo (1301) - La Libertad (13)
('130101', '1301', '13', 'Trujillo'),
('130102', '1301', '13', 'Huanchaco'),
('130107', '1301', '13', 'Víctor Larco Herrera'),
-- Provincia de Arequipa (0401) - Arequipa (04)
('040101', '0401', '04', 'Arequipa'),
('040129', '0401', '04', 'Yanahuara'),
('040103', '0401', '04', 'Cayma')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
