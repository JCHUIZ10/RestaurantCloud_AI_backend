<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Normaliza gasto_manual.tipo_comprobante a códigos (CU-ADMIN-14).
 *
 * El formulario guardaba etiquetas ("Boleta de Venta") mientras el backend usaba códigos ("recibo_interno").
 * Códigos admitidos: factura, boleta, recibo_honorarios, recibo_servicios, recibo_interno.
 * Lo que no se reconoce pasa a recibo_interno (el valor por defecto). Solo toca filas con valores no normalizados.
 *
 * Idempotente: una segunda ejecución no encuentra filas por convertir.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
            UPDATE gasto_manual
               SET tipo_comprobante = CASE
                   WHEN lower(trim(tipo_comprobante)) IN ('factura electrónica', 'factura electronica', 'factura') THEN 'factura'
                   WHEN lower(trim(tipo_comprobante)) IN ('boleta de venta', 'boleta') THEN 'boleta'
                   WHEN lower(trim(tipo_comprobante)) IN ('recibo por honorarios', 'recibo honorarios') THEN 'recibo_honorarios'
                   WHEN lower(trim(tipo_comprobante)) IN ('recibo servicios públicos', 'recibo servicios publicos', 'recibo servicios') THEN 'recibo_servicios'
                   ELSE 'recibo_interno'
               END
             WHERE tipo_comprobante IS NULL
                OR tipo_comprobante NOT IN ('factura', 'boleta', 'recibo_honorarios', 'recibo_servicios', 'recibo_interno');
        SQL);
    }

    public function down(): void
    {
        // Sin reversión: los códigos son el formato definitivo.
    }
};
