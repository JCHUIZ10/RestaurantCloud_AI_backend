<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Esquema base de RestaurantCloud: punto de partida de todas las migraciones.
 *
 * Ejecuta los scripts canónicos de database/sql (los mismos que antes cargaba
 * docker-entrypoint-initdb.d). La semilla demo 07 no forma parte del esquema:
 * la carga LocalAureaDemoSeeder.
 *
 * Una BD creada antes con initdb ya tiene el esquema: en ese caso solo se
 * registra la migración como aplicada, y los cambios posteriores llegan por
 * las migraciones siguientes.
 */
return new class extends Migration
{
    private const SCRIPTS = [
        '01_extensions_and_functions.sql',
        '02_schema_ddl.sql',
        '03_indexes.sql',
        '04_rls_security.sql',
        '05_views_analytics.sql',
        '06_seed_initial_data.sql',
        '08_inventory_functions.sql',
        '09_seed_ubigeo_peru.sql',
    ];

    public function up(): void
    {
        if (Schema::hasTable('empresa')) {
            return;
        }

        foreach (self::SCRIPTS as $script) {
            DB::unprepared(file_get_contents(database_path("sql/{$script}")));
        }
    }

    public function down(): void
    {
        throw new RuntimeException('El esquema base no se revierte; recrea la base de datos.');
    }
};
