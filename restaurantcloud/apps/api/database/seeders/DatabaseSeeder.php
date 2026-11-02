<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Planes, ubigeo y Admin SaaS forman parte del esquema base (06_seed_initial_data.sql);
     * aquí solo se cargan los datos demo de desarrollo y tests.
     */
    public function run(): void
    {
        $this->call([
            LocalAureaDemoSeeder::class,
        ]);
    }
}
