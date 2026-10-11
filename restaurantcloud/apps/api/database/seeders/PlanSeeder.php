<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Catálogo comercial oficial según CU-SAAS-03
     */
    public function run(): void
    {
        $planes = [
            [
                'id' => 1,
                'nombre' => 'Starter',
                'slug' => 'plan-starter',
                'descripcion' => 'Ideal para restaurantes pequeños y pollerías de salón único con hasta 25 mesas.',
                'precio_mensual' => 99.00,
                'precio_anual' => 990.00,
                'max_locales' => 1,
                'max_pisos' => 1,
                'max_mesas' => 25,
                'max_usuarios' => 5,
                'incluye_reservas' => false,
                'incluye_reportes_avanzados' => false,
                'incluye_asistente_ia' => false,
                'incluye_prediccion_ia' => false,
                'activo' => true,
                'visible_publico' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'nombre' => 'Pro',
                'slug' => 'plan-pro',
                'descripcion' => 'Para restaurantes en expansión con múltiples ambientes, reservas de salón y KDS.',
                'precio_mensual' => 249.00,
                'precio_anual' => 2490.00,
                'max_locales' => 3,
                'max_pisos' => 2,
                'max_mesas' => 30,
                'max_usuarios' => 15,
                'incluye_reservas' => true,
                'incluye_reportes_avanzados' => true,
                'incluye_asistente_ia' => true,
                'incluye_prediccion_ia' => false,
                'activo' => true,
                'visible_publico' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'nombre' => 'Enterprise',
                'slug' => 'plan-enterprise',
                'descripcion' => 'Para cadenas gastronómicas y franquicias con operaciones complejas y suite completa de IA.',
                'precio_mensual' => 499.00,
                'precio_anual' => 4990.00,
                'max_locales' => 10,
                'max_pisos' => 5,
                'max_mesas' => 60,
                'max_usuarios' => 40,
                'incluye_reservas' => true,
                'incluye_reportes_avanzados' => true,
                'incluye_asistente_ia' => true,
                'incluye_prediccion_ia' => true,
                'activo' => true,
                'visible_publico' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($planes as $plan) {
            DB::table('plan')->updateOrInsert(
                ['id' => $plan['id']],
                $plan
            );
        }
    }
}
