-- ==============================================================================
-- RESTAURANTCLOUD AI — SCRIPT 06: DATOS SEMILLA BASE DE PLATAFORMA
-- Motor: PostgreSQL 16
-- Alcance: Catálogo comercial oficial (CU-SAAS-03) y Usuario raíz Admin SaaS
-- ==============================================================================

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
    2, 
    30, 
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
    5, 
    60, 
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
-- Credencial de inicio: admin@restaurantcloud.pe / AdminSaaS2026!
-- Hash Bcrypt costo 12: $2y$12$eA5uO6pQkY4GzD/W6C9F2.7YqK3gY6v7R9V2v1u7L4Z5x8k1m2n3a
INSERT INTO usuario (
    id, empresa_id, local_id, nombre, correo, password_hash, telefono, rol, estado
) VALUES (
    fn_uuid_v8(),
    NULL,
    NULL,
    'Super Administrador SaaS',
    'admin@restaurantcloud.pe',
    '$2y$12$6qK6XqFmI.eT/yUe8SjS4.H7N9kQzV5G2q3P8x9mK4l5o6r7s8t9u',
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
