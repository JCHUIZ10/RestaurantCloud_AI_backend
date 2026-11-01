<?php

namespace App\Console\Commands;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Models\Archivo;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PurgarCatalogoHuerfano extends Command
{
    protected $signature = 'archivos:purgar-catalogo-huerfano
        {--dias=7 : Días que un archivo eliminado conserva su registro antes de borrarse del todo}
        {--horas-gracia=24 : Antigüedad mínima de una foto sin producto asociado para darla por huérfana}
        {--dry-run : Solo informa lo que haría, sin borrar nada}';

    protected $description = 'Borra fotos de catálogo huérfanas o eliminadas hace tiempo, tanto en MinIO como en la tabla archivo.';

    private const TIPOS_FOTO = ['producto', 'producto_miniatura'];

    public function handle(TenantStorageService $almacenamiento): int
    {
        // Comando de plataforma: recorre todos los tenants, por lo que actúa como admin SaaS ante RLS.
        DB::statement("SELECT set_config('app.current_user_role', 'admin_saas', false)");

        $simular = (bool) $this->option('dry-run');
        $dias = max(1, (int) $this->option('dias'));
        $horasGracia = max(1, (int) $this->option('horas-gracia'));
        $huerfanas = 0;
        $depuradas = 0;
        $errores = 0;

        // 1. Fotos disponibles que ya ningún producto referencia (subida a medias, compensación fallida…).
        $this->consultaHuerfanas($horasGracia)->chunkById(100, function ($lote) use ($almacenamiento, $simular, &$huerfanas, &$errores): void {
            foreach ($lote as $archivo) {
                $this->line("Huérfana: {$archivo->object_key}");
                $huerfanas++;

                if (! $simular) {
                    $this->intentar(fn () => $almacenamiento->eliminarArchivoPorKey($archivo->empresa_id, $archivo->object_key), $archivo->object_key, $errores);
                }
            }
        });

        // 2. Fotos eliminadas hace más de N días: se reintenta borrar el objeto si siguió en MinIO y se retira el registro.
        Archivo::whereIn('entidad_tipo', self::TIPOS_FOTO)
            ->where('estado', 'eliminado')
            ->where('updated_at', '<', now()->subDays($dias))
            ->chunkById(100, function ($lote) use ($simular, &$depuradas, &$errores): void {
                foreach ($lote as $archivo) {
                    $this->line("Eliminada: {$archivo->object_key}");
                    $depuradas++;

                    if (! $simular) {
                        $this->intentar(function () use ($archivo): void {
                            Storage::disk('s3')->delete($archivo->object_key);
                            $archivo->forceDelete();
                        }, $archivo->object_key, $errores);
                    }
                }
            });

        $prefijo = $simular ? '[dry-run] ' : '';
        $this->info("{$prefijo}Huérfanas: {$huerfanas}. Registros depurados: {$depuradas}. Errores: {$errores}.");

        return $errores > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Foto principal sin producto que apunte a ella, o miniatura cuya principal ya no está en uso.
     *
     * @return Builder<Archivo>
     */
    private function consultaHuerfanas(int $horasGracia): Builder
    {
        return Archivo::whereIn('entidad_tipo', self::TIPOS_FOTO)
            ->where('estado', 'disponible')
            ->where('created_at', '<', now()->subHours($horasGracia))
            ->where(function (Builder $query): void {
                $query->where(fn (Builder $foto) => $foto
                    ->where('entidad_tipo', 'producto')
                    ->whereNotExists(fn (QueryBuilder $uso) => $uso->selectRaw('1')->from('producto')
                        ->whereColumn('producto.foto_url', 'archivo.object_key')))
                    ->orWhere(fn (Builder $miniatura) => $miniatura
                        ->where('entidad_tipo', 'producto_miniatura')
                        ->whereNotExists(fn (QueryBuilder $uso) => $uso->selectRaw('1')->from('producto')
                            ->whereRaw('regexp_replace(producto.foto_url, \'\\.webp$\', \'_thumb.webp\') = archivo.object_key')));
            });
    }

    private function intentar(callable $accion, string $objectKey, int &$errores): void
    {
        try {
            $accion();
        } catch (Throwable $e) {
            $errores++;
            $this->error("No se pudo limpiar {$objectKey}: {$e->getMessage()}");
        }
    }
}
