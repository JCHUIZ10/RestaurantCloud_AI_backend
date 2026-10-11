<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminSaaSSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Usuario Administrador Global de la Plataforma SaaS (CU-SAAS-01)
     */
    public function run(): void
    {
        $correo = 'admin@restaurantcloud.pe';
        
        $existe = DB::table('usuario')
            ->where('correo', $correo)
            ->whereNull('empresa_id')
            ->first();

        if ($existe) {
            DB::table('usuario')
                ->where('id', $existe->id)
                ->update([
                    'nombre' => 'Super Administrador SaaS',
                    'telefono' => '+51 930 723 537',
                    'rol' => 'admin_saas',
                    'estado' => 'activo',
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('usuario')->insert([
                'id' => DB::raw('fn_uuid_v8()'),
                'empresa_id' => null,
                'local_id' => null,
                'nombre' => 'Super Administrador SaaS',
                'correo' => $correo,
                'password_hash' => Hash::make('AdminSaaS2026!'),
                'telefono' => '+51 930 723 537',
                'rol' => 'admin_saas',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
