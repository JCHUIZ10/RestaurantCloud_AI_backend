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
        // 1. SUPERVISIÓN CONSOLIDADA DE TENANTS SAAS (CU-SAAS-01)
        DB::statement("
            CREATE OR REPLACE VIEW v_saas_tenants_resumen AS
            SELECT 
                e.id AS empresa_id,
                e.razon_social,
                e.tipo_identidad_fiscal,
                e.ruc,
                e.correo_contacto,
                e.telefono,
                p.id AS plan_id,
                p.nombre AS plan_nombre,
                (SELECT COUNT(*) FROM local l WHERE l.empresa_id = e.id AND l.estado = 'activo')::INT AS locales_activos_conteo,
                s.estado AS estado_suscripcion,
                s.dias_gracia_restantes,
                s.fecha_corte_gracia,
                s.fecha_fin_periodo,
                pg.origen_pago AS ultimo_origen_pago,
                pg.monto AS ultimo_pago_monto,
                pg.fecha AS ultimo_pago_fecha,
                e.fecha_registro
            FROM empresa e
            JOIN plan p ON p.id = e.plan_id
            LEFT JOIN suscripcion s ON s.id = e.ultima_suscripcion_id
            LEFT JOIN LATERAL (
                SELECT origen_pago, monto, fecha 
                FROM pago 
                WHERE empresa_id = e.id 
                ORDER BY fecha DESC 
                LIMIT 1
            ) pg ON true;
        ");

        // 2. CURVA HORARIA DE VENTAS Y PICOS ALMUERZO/CENA (CU-ADMIN-13)
        DB::statement("
            CREATE OR REPLACE VIEW v_analitica_ventas_horarias AS
            SELECT
                p.local_id,
                DATE(p.created_at) AS fecha,
                EXTRACT(HOUR FROM p.created_at)::INT AS hora,
                CASE 
                    WHEN EXTRACT(HOUR FROM p.created_at) BETWEEN 12 AND 15 THEN 'almuerzo'
                    WHEN EXTRACT(HOUR FROM p.created_at) BETWEEN 19 AND 22 THEN 'cena'
                    ELSE 'resto_jornada'
                END AS franja_horaria,
                COUNT(DISTINCT p.id)::INT AS total_pedidos,
                COALESCE(SUM(c.total), 0) AS facturacion_bruta,
                COALESCE(SUM(c.base_imponible), 0) AS base_imponible,
                COALESCE(SUM(c.igv), 0) AS igv,
                ROUND(COALESCE(AVG(c.total), 0), 2) AS ticket_promedio
            FROM pedido p
            JOIN comprobante c ON c.pedido_id = p.id AND c.estado = 'emitido'
            WHERE p.estado = 'cobrado'
            GROUP BY p.local_id, DATE(p.created_at), EXTRACT(HOUR FROM p.created_at);
        ");

        // 3. MENÚ ENGINEERING & MATRIZ DE 4 CUADRANTES (CU-ADMIN-13)
        DB::statement("
            CREATE OR REPLACE VIEW v_menu_engineering_cuadrantes AS
            WITH metricas_plato AS (
                SELECT 
                    pr.local_id,
                    pr.id AS producto_id,
                    pr.nombre AS producto_nombre,
                    cat.nombre AS categoria_nombre,
                    pr.precio,
                    pr.costo_estandar,
                    (pr.precio - pr.costo_estandar) AS margen_contribucion_unitario,
                    COALESCE(SUM(pi.cantidad), 0)::INT AS unidades_vendidas,
                    COALESCE(SUM(pi.cantidad * pr.precio), 0) AS total_facturado
                FROM producto pr
                JOIN categoria_producto cat ON cat.id = pr.categoria_id
                LEFT JOIN pedido_item pi ON pi.producto_id = pr.id AND pi.estado = 'entregado'
                LEFT JOIN pedido ped ON ped.id = pi.pedido_id AND ped.estado = 'cobrado'
                WHERE pr.activo = true
                GROUP BY pr.local_id, pr.id, pr.nombre, cat.nombre, pr.precio, pr.costo_estandar
            ),
            umbrales_local AS (
                SELECT
                    local_id,
                    COALESCE(AVG(unidades_vendidas), 0) AS media_popularidad,
                    COALESCE(AVG(margen_contribucion_unitario), 0) AS media_rentabilidad
                FROM metricas_plato
                GROUP BY local_id
            )
            SELECT 
                mp.local_id,
                mp.producto_id,
                mp.producto_nombre,
                mp.categoria_nombre,
                mp.precio,
                mp.costo_estandar,
                mp.margen_contribucion_unitario,
                mp.unidades_vendidas,
                mp.total_facturado,
                u.media_popularidad,
                u.media_rentabilidad,
                CASE 
                    WHEN mp.unidades_vendidas >= u.media_popularidad AND mp.margen_contribucion_unitario >= u.media_rentabilidad THEN 'ESTRELLA'
                    WHEN mp.unidades_vendidas >= u.media_popularidad AND mp.margen_contribucion_unitario < u.media_rentabilidad THEN 'CABALLITO'
                    WHEN mp.unidades_vendidas < u.media_popularidad AND mp.margen_contribucion_unitario >= u.media_rentabilidad THEN 'PUZLE'
                    ELSE 'REZAGADO'
                END AS cuadrante
            FROM metricas_plato mp
            JOIN umbrales_local u ON u.local_id = mp.local_id;
        ");

        // 4. PRODUCTIVIDAD DEL EQUIPO DE SALÓN Y ROTACIÓN (CU-ADMIN-13)
        DB::statement("
            CREATE OR REPLACE VIEW v_desempeno_mozos_salon AS
            SELECT 
                p.local_id,
                u.id AS mozo_id,
                u.nombre AS mozo_nombre,
                DATE(p.created_at) AS fecha,
                COUNT(DISTINCT p.id)::INT AS mesas_atendidas,
                COALESCE(SUM(c.total), 0) AS facturacion_total,
                ROUND(COALESCE(AVG(c.total), 0), 2) AS ticket_promedio,
                ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(p.precuenta_generada_at, p.updated_at) - p.created_at)) / 60), 0))::INT AS minutos_permanencia_promedio,
                COUNT(DISTINCT p.id) FILTER (WHERE EXISTS (SELECT 1 FROM pedido_item pi WHERE pi.pedido_id = p.id AND pi.numero_ronda > 1))::INT AS mesas_con_upselling,
                COALESCE(COUNT(pa.id), 0)::INT AS anulaciones_registradas
            FROM usuario u
            JOIN pedido p ON p.mozo_id = u.id AND p.estado = 'cobrado'
            LEFT JOIN comprobante c ON c.pedido_id = p.id AND c.estado = 'emitido'
            LEFT JOIN pedido_anulacion pa ON pa.pedido_id = p.id
            WHERE u.rol = 'mozo'
            GROUP BY p.local_id, u.id, u.nombre, DATE(p.created_at);
        ");

        // 5. FLUJO DE CAJA MENSUAL, GASTOS Y CONCILIACIÓN DE LIQUIDEZ (CU-ADMIN-14)
        DB::statement("
            CREATE OR REPLACE VIEW v_analitica_flujo_caja_mensual AS
            WITH ventas AS (
                SELECT 
                    c.local_id,
                    DATE(comp.fecha) AS fecha,
                    SUM(CASE WHEN comp.medio_pago = 'efectivo' THEN comp.total ELSE 0 END) AS ingresos_efectivo,
                    SUM(CASE WHEN comp.medio_pago = 'tarjeta' THEN comp.total ELSE 0 END) AS ingresos_tarjeta,
                    SUM(CASE WHEN comp.medio_pago = 'billetera_digital' THEN comp.total ELSE 0 END) AS ingresos_digital,
                    SUM(comp.total) AS total_ingresos
                FROM comprobante comp
                JOIN caja c ON c.id = comp.caja_id
                WHERE comp.estado = 'emitido'
                GROUP BY c.local_id, DATE(comp.fecha)
            ),
            compras AS (
                SELECT 
                    local_id,
                    fecha_emision AS fecha,
                    SUM(total) AS total_compras_insumos
                FROM ficha_compra
                WHERE estado = 'registrada'
                GROUP BY local_id, fecha_emision
            ),
            gastos AS (
                SELECT 
                    local_id,
                    fecha,
                    SUM(CASE WHEN origen_fondos = 'efectivo_caja' THEN monto ELSE 0 END) AS gastos_caja_chica,
                    SUM(CASE WHEN origen_fondos = 'transferencia_bancaria' THEN monto ELSE 0 END) AS gastos_transferencia,
                    SUM(monto) AS total_gastos_operativos
                FROM gasto_manual
                GROUP BY local_id, fecha
            ),
            fechas_locales AS (
                SELECT local_id, fecha FROM ventas
                UNION
                SELECT local_id, fecha FROM compras
                UNION
                SELECT local_id, fecha FROM gastos
            )
            SELECT 
                fl.local_id,
                fl.fecha,
                COALESCE(v.ingresos_efectivo, 0) AS ingresos_efectivo,
                COALESCE(v.ingresos_tarjeta, 0) AS ingresos_tarjeta,
                COALESCE(v.ingresos_digital, 0) AS ingresos_digital,
                COALESCE(v.total_ingresos, 0) AS total_ingresos,
                COALESCE(c.total_compras_insumos, 0) AS total_compras_insumos,
                COALESCE(g.gastos_caja_chica, 0) AS gastos_caja_chica,
                COALESCE(g.gastos_transferencia, 0) AS gastos_transferencia,
                COALESCE(g.total_gastos_operativos, 0) AS total_gastos_operativos,
                (COALESCE(c.total_compras_insumos, 0) + COALESCE(g.total_gastos_operativos, 0)) AS total_egresos,
                (COALESCE(v.total_ingresos, 0) - (COALESCE(c.total_compras_insumos, 0) + COALESCE(g.total_gastos_operativos, 0))) AS balance_neto
            FROM fechas_locales fl
            LEFT JOIN ventas v ON v.local_id = fl.local_id AND v.fecha = fl.fecha
            LEFT JOIN compras c ON c.local_id = fl.local_id AND c.fecha = fl.fecha
            LEFT JOIN gastos g ON g.local_id = fl.local_id AND g.fecha = fl.fecha;
        ");

        // 6. HISTORIAL DINÁMICO DE CONSUMO POR COMENSAL (CU-CAJA-03)
        DB::statement("
            CREATE OR REPLACE VIEW vw_cliente_resumen_consumo AS
            SELECT 
                c.empresa_id,
                cl.id AS cliente_id,
                cl.tipo_documento,
                cl.numero_documento,
                cl.nombre_identificativo,
                COUNT(comp.id)::INT AS total_visitas,
                COALESCE(SUM(comp.total), 0) AS gasto_acumulado,
                ROUND(COALESCE(AVG(comp.total), 0), 2) AS ticket_promedio,
                MAX(comp.fecha) AS ultima_visita
            FROM cliente cl
            JOIN empresa c ON c.id = cl.empresa_id
            LEFT JOIN comprobante comp ON comp.cliente_id = cl.id AND comp.estado = 'emitido'
            GROUP BY c.empresa_id, cl.id, cl.tipo_documento, cl.numero_documento, cl.nombre_identificativo;
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS vw_cliente_resumen_consumo CASCADE;");
        DB::statement("DROP VIEW IF EXISTS v_analitica_flujo_caja_mensual CASCADE;");
        DB::statement("DROP VIEW IF EXISTS v_desempeno_mozos_salon CASCADE;");
        DB::statement("DROP VIEW IF EXISTS v_menu_engineering_cuadrantes CASCADE;");
        DB::statement("DROP VIEW IF EXISTS v_analitica_ventas_horarias CASCADE;");
        DB::statement("DROP VIEW IF EXISTS v_saas_tenants_resumen CASCADE;");
    }
};
