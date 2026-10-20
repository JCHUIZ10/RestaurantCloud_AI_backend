<?php

namespace App\Domains\Archivos\Services;

use App\Models\Archivo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TenantStorageService
{
    private string $disk = 's3';
    private string $bucket;

    public function __construct()
    {
        $this->bucket = config('filesystems.disks.s3.bucket', 'restaurantcloud');
    }

    /**
     * Inicializa el espacio y estructura de carpetas virtuales del tenant en MinIO.
     * Crea un manifiesto json inmutable para certificar el alta de almacenamiento del tenant.
     */
    public function inicializarEspacioTenant(string $empresaId, array $metadata = []): bool
    {
        $manifestKey = "tenants/{$empresaId}/manifest.json";

        $manifestContent = json_encode([
            'empresa_id' => $empresaId,
            'fecha_alta' => now()->toIso8601String(),
            'bucket' => $this->bucket,
            'prefijos_asignados' => [
                'catalogo' => "catalogo/empresas/{$empresaId}/",
                'privado' => "privado/empresas/{$empresaId}/",
            ],
            'metadata' => $metadata,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $saved = Storage::disk($this->disk)->put($manifestKey, $manifestContent, [
            'visibility' => 'private',
            'ContentType' => 'application/json',
        ]);

        if ($saved) {
            // Registrar metadatos en la tabla archivo
            Archivo::updateOrCreate(
                [
                    'empresa_id' => $empresaId,
                    'object_key' => $manifestKey,
                ],
                [
                    'id' => (string) Str::uuid(),
                    'local_id' => null,
                    'bucket' => $this->bucket,
                    'nombre_original' => 'manifest.json',
                    'mime_type' => 'application/json',
                    'tamanio_bytes' => strlen($manifestContent),
                    'sha256' => hash('sha256', $manifestContent),
                    'visibilidad' => 'privado',
                    'entidad_tipo' => 'tenant_manifest',
                    'entidad_id' => $empresaId,
                    'estado' => 'disponible',
                ]
            );
        }

        return $saved;
    }

    /**
     * Genera la ruta canónica para archivos públicos de catálogo (platos, cartas, etc.)
     */
    public function generarKeyCatalogo(string $empresaId, ?string $localId, string $seccion, string $entidadId, string $extension): string
    {
        $uuid = (string) Str::uuid();
        $ext = ltrim($extension, '.');
        
        if ($localId) {
            return "catalogo/empresas/{$empresaId}/locales/{$localId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
        }

        return "catalogo/empresas/{$empresaId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
    }

    /**
     * Genera la ruta canónica para archivos privados (comprobantes SUNAT, reportes Z, incidentes)
     */
    public function generarKeyPrivado(string $empresaId, ?string $localId, string $seccion, string $entidadId, string $extension): string
    {
        $uuid = (string) Str::uuid();
        $ext = ltrim($extension, '.');

        if ($localId) {
            return "privado/empresas/{$empresaId}/locales/{$localId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
        }

        return "privado/empresas/{$empresaId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
    }

    /**
     * Obtiene el manifiesto de inicialización del tenant
     */
    public function obtenerManifiestoTenant(string $empresaId): ?array
    {
        $manifestKey = "tenants/{$empresaId}/manifest.json";

        if (! Storage::disk($this->disk)->exists($manifestKey)) {
            return null;
        }

        $content = Storage::disk($this->disk)->get($manifestKey);
        return json_decode($content, true);
    }

    /**
     * Comprueba la salud y disponibilidad de MinIO S3
     */
    public function verificarSalud(): array
    {
        try {
            $testKey = '.healthcheck_' . time() . '.tmp';
            Storage::disk($this->disk)->put($testKey, 'ok');
            $read = Storage::disk($this->disk)->get($testKey);
            Storage::disk($this->disk)->delete($testKey);

            return [
                'disponible' => ($read === 'ok'),
                'bucket' => $this->bucket,
                'driver' => $this->disk,
            ];
        } catch (\Throwable $e) {
            return [
                'disponible' => false,
                'error' => $e->getMessage(),
                'bucket' => $this->bucket,
                'driver' => $this->disk,
            ];
        }
    }
}
