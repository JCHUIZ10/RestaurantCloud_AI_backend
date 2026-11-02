<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Empresa y local demo ÁUREA (desarrollo y tests). Es idempotente: el script
 * purga y vuelve a sembrar los datos operativos del local con UUID fijos.
 */
class LocalAureaDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::unprepared(file_get_contents(database_path('sql/07_seed_local_aurea_completo.sql')));
    }
}
