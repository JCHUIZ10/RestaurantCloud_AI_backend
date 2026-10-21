<?php

namespace Database\Seeders;

use App\Console\Commands\InitTenantStorageCommand;
use App\Domains\Archivos\Services\TenantStorageService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TenantStorageSeeder extends Seeder
{
    public function run(TenantStorageService $storageService): void
    {
        $testId = InitTenantStorageCommand::TEST_EMPRESA_ID;
        $empresa = DB::table('empresa')->where('id', $testId)->first();

        if (! $empresa) {
            if (isset($this->command)) {
                $this->command->warn("Empresa de prueba ({$testId}) no encontrada en BD. Omitiendo seed de almacenamiento.");
            }
            return;
        }

        if ($storageService->estaInicializado($testId)) {
            // Inicializar sedes que falten
            $locales = DB::table('local')->where('empresa_id', $testId)->get();
            foreach ($locales as $local) {
                if (! $storageService->estaLocalInicializado($testId, $local->id)) {
                    $storageService->inicializarEspacioLocal($testId, $local->id, [
                        'nombre' => $local->nombre,
                        'slug' => $local->slug,
                        'giro_negocio' => $local->giro_negocio,
                    ]);
                }
            }

            if (isset($this->command)) {
                $this->command->info("Empresa de prueba '{$empresa->razon_social}' ya tiene espacio MinIO inicializado. Omitiendo.");
            }
            return;
        }

        $storageService->inicializarEspacioTenant($testId, [
            'ruc' => $empresa->ruc,
            'razon_social' => $empresa->razon_social,
            'plan_id' => $empresa->plan_id,
            'propietario_correo' => $empresa->correo_contacto,
            'origen' => 'TenantStorageSeeder',
        ]);

        $locales = DB::table('local')->where('empresa_id', $testId)->get();
        foreach ($locales as $local) {
            $storageService->inicializarEspacioLocal($testId, $local->id, [
                'nombre' => $local->nombre,
                'slug' => $local->slug,
                'giro_negocio' => $local->giro_negocio,
            ]);
        }

        if (isset($this->command)) {
            $this->command->info("Espacio MinIO inicializado con éxito para {$empresa->razon_social}.");
        }
    }
}
