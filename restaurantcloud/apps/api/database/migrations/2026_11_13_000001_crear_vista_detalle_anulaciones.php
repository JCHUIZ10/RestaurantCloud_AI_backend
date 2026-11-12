<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Vista de lectura de la auditoría de anulaciones: concentra los joins con los nombres
 * (mozo, quien anuló, revisor, partida de cocina y local) que usan la bandeja, la ficha
 * y la exportación a Excel, para que las tres muestren siempre lo mismo.
 *
 * Es una vista normal (no materializada): Postgres la integra en la consulta, así que no
 * cuesta rendimiento, nunca está desactualizada y los filtros por local_id y anulado_at
 * siguen usando el índice idx_pedido_anulacion_local_fecha.
 *
 * security_invoker = true es imprescindible: sin esa opción la vista se ejecuta con los
 * permisos de su dueño y se saltaría la RLS de pedido_anulacion.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE VIEW v_pedido_anulacion_detalle WITH (security_invoker = true) AS
            SELECT
                pa.*,
                mozo.nombre AS mozo_nombre,
                anulador.nombre AS anulador_nombre,
                revisor.nombre AS revisor_nombre,
                cat.nombre AS categoria_nombre,
                l.nombre AS local_nombre
            FROM pedido_anulacion pa
            LEFT JOIN usuario mozo ON mozo.id = pa.mozo_id
            LEFT JOIN usuario anulador ON anulador.id = pa.anulado_por
            LEFT JOIN usuario revisor ON revisor.id = pa.revisado_por
            LEFT JOIN producto prod ON prod.id = pa.producto_id
            LEFT JOIN categoria_producto cat ON cat.id = prod.categoria_id
            LEFT JOIN local l ON l.id = pa.local_id
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP VIEW IF EXISTS v_pedido_anulacion_detalle');
    }
};
