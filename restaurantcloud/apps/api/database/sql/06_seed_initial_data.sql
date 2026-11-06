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
    40.00, 
    400.00, 
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
    80.00, 
    800.00, 
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
    160.00, 
    1600.00, 
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

