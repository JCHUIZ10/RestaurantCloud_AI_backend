<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Planes y Admin SaaS forman parte de 06_seed_initial_data.sql;
     * el catálogo nacional UBIGEO forma parte de 09_seed_ubigeo_peru.sql (esquema base).
     * Ambos se cargan en la migración base; aquí solo se cargan los datos demo de desarrollo y tests.
     */
    public function run(): void
    {
        $this->call([
            LocalAureaDemoSeeder::class,
        ]);
    }
}
