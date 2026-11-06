<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Catálogo Maestro Oficial de Ubicación Geográfica del Perú (UBIGEO INEI / SUNAT).
 * Carga 25 departamentos, 196 provincias y 1,891 distritos sincronizados con el frontend
 * (apps/web/src/shared/data/ubigeoPeru.ts).
 * Es completamente idempotente (ON CONFLICT DO UPDATE).
 */
class UbigeoPeruSeeder extends Seeder
{
    public function run(): void
    {
        DB::unprepared(file_get_contents(database_path('sql/09_seed_ubigeo_peru.sql')));
    }
}
