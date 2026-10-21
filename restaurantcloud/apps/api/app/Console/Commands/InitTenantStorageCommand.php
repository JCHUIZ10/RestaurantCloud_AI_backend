<?php

namespace App\Console\Commands;

use App\Domains\Archivos\Services\TenantStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InitTenantStorageCommand extends Command
{
    public const TEST_EMPRESA_ID = '00000000-0000-4000-8000-000000000001';

    protected $signature = 'tenant:init-storage 
                            {empresa_id? : UUID de la empresa a inicializar}
                            {--test : Inicializa la empresa canónica de prueba Áurea solo si no está registrada}
                            {--all : Inicializa todas las empresas de la base de datos que no tengan almacenamiento}
                            {--force : Fuerza la reinicialización incluso si ya existe el espacio}';

    protected $description = 'Inicializa el espacio de almacenamiento MinIO y registro de manifiesto en BD para uno o más tenants';

    public function handle(TenantStorageService $storageService): int
    {
        $salud = $storageService->verificarSalud();
        if (! ($salud['disponible'] ?? false)) {
            $this->error('No hay conexión con el servidor MinIO S3: ' . ($salud['error'] ?? 'desconocido'));
            return self::FAILURE;
        }

        $esTest = (bool) $this->option('test');
        $esAll = (bool) $this->option('all');
        $empresaId = $this->argument('empresa_id');
        $forzar = (bool) $this->option('force');

        if ($esTest) {
            return $this->inicializarEmpresaPrueba($storageService, $forzar);
        }

        if ($esAll) {
            return $this->inicializarTodasLasEmpresas($storageService, $forzar);
        }

        if ($empresaId) {
            return $this->inicializarPorId($storageService, $empresaId, $forzar);
        }

        $this->warn('Debes especificar un ID de empresa, la opción --test o la opción --all.');
        $this->line('Ejemplos:');
        $this->line('  php artisan tenant:init-storage --test');
        $this->line('  php artisan tenant:init-storage 00000000-0000-4000-8000-000000000001');
        $this->line('  php artisan tenant:init-storage --all');

        return self::INVALID;
    }

    private function inicializarEmpresaPrueba(TenantStorageService $storageService, bool $forzar): int
    {
        $testId = self::TEST_EMPRESA_ID;
        $empresa = DB::table('empresa')->where('id', $testId)->first();

        if (! $empresa) {
            $this->error("La empresa de prueba con ID {$testId} no existe en la base de datos. Asegúrate de haber ejecutado 07_seed_local_aurea_completo.sql.");
            return self::FAILURE;
        }

        if (! $forzar && $storageService->estaInicializado($testId)) {
            $this->warn("La empresa de prueba '{$empresa->razon_social}' (RUC: {$empresa->ruc}) ya cuenta con su espacio MinIO inicializado.");
            $this->info("Omitiendo para evitar duplicidad. (Usa --force si deseas regenerar el manifiesto).");
            return self::SUCCESS;
        }

        return $this->ejecutarInicializacion($storageService, $empresa, 'Escenario de prueba local ÁUREA');
    }

    private function inicializarPorId(TenantStorageService $storageService, string $empresaId, bool $forzar): int
    {
        $empresa = DB::table('empresa')->where('id', $empresaId)->first();

        if (! $empresa) {
            $this->error("No se encontró ninguna empresa con el ID: {$empresaId}");
            return self::FAILURE;
        }

        if (! $forzar && $storageService->estaInicializado($empresaId)) {
            $this->warn("La empresa '{$empresa->razon_social}' ya tiene almacenamiento inicializado. Usa --force para sobrescribir.");
            return self::SUCCESS;
        }

        return $this->ejecutarInicializacion($storageService, $empresa, 'Inicialización puntual por comando');
    }

    private function inicializarTodasLasEmpresas(TenantStorageService $storageService, bool $forzar): int
    {
        $empresas = DB::table('empresa')->orderBy('created_at')->get();

        if ($empresas->isEmpty()) {
            $this->warn('No hay empresas registradas en la base de datos.');
            return self::SUCCESS;
        }

        $procesadas = 0;
        $omitidas = 0;

        foreach ($empresas as $empresa) {
            if (! $forzar && $storageService->estaInicializado($empresa->id)) {
                $omitidas++;
                continue;
            }

            $exito = $storageService->inicializarEspacioTenant($empresa->id, [
                'ruc' => $empresa->ruc,
                'razon_social' => $empresa->razon_social,
                'plan_id' => $empresa->plan_id,
                'propietario_correo' => $empresa->correo_contacto,
                'origen' => 'tenant:init-storage --all',
            ]);

            if ($exito) {
                $procesadas++;
            }
        }

        $this->newLine();
        $this->info("Proceso completado. Inicializadas: {$procesadas} | Omitidas (ya registradas): {$omitidas}");

        return self::SUCCESS;
    }

    private function ejecutarInicializacion(TenantStorageService $storageService, object $empresa, string $nota): int
    {
        $this->info("Inicializando espacio MinIO para '{$empresa->razon_social}' (RUC: {$empresa->ruc})...");

        $exito = $storageService->inicializarEspacioTenant($empresa->id, [
            'ruc' => $empresa->ruc,
            'razon_social' => $empresa->razon_social,
            'plan_id' => $empresa->plan_id,
            'propietario_correo' => $empresa->correo_contacto,
            'nota' => $nota,
            'inicializado_por' => 'tenant:init-storage',
        ]);

        if (! $exito) {
            $this->error("Fallo al guardar el manifiesto en MinIO para {$empresa->id}.");
            return self::FAILURE;
        }

        $manifestKey = "tenants/{$empresa->id}/manifest.json";
        $archivo = DB::table('archivo')->where('object_key', $manifestKey)->first();

        $this->newLine();
        $this->info("✓ Espacio de almacenamiento MinIO registrado exitosamente:");
        $this->table(
            ['Propiedad', 'Valor'],
            [
                ['Empresa ID', $empresa->id],
                ['Razón Social', $empresa->razon_social],
                ['RUC', $empresa->ruc],
                ['Bucket MinIO', config('filesystems.disks.s3.bucket', 'restaurantcloud')],
                ['Clave Manifiesto', $manifestKey],
                ['Prefijo Catálogo', "catalogo/empresas/{$empresa->id}/"],
                ['Prefijo Privado', "privado/empresas/{$empresa->id}/"],
                ['ID Registro BD (archivo)', $archivo->id ?? 'N/A'],
                ['Visibilidad BD', $archivo->visibilidad ?? 'privado'],
                ['SHA-256', substr($archivo->sha256 ?? '', 0, 16) . '...'],
            ]
        );

        return self::SUCCESS;
    }
}
