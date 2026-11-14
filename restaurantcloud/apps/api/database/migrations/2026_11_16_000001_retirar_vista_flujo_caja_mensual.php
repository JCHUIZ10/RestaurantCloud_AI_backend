<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Retira la vista v_analitica_flujo_caja_mensual (CU-ADMIN-14).
 *
 * Nadie la consume (el flujo de caja del administrador se calcula en FlujoCajaService) y su cálculo era
 * incorrecto: sumaba las notas de crédito, que ya llevan total negativo, además de las ventas que anulan.
 *
 * Idempotente: en BDs nuevas el esquema base ya no la crea.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP VIEW IF EXISTS v_analitica_flujo_caja_mensual');
    }

    public function down(): void
    {
        // Sin reversión: la definición anterior era incorrecta y no debe volver a crearse.
    }
};
