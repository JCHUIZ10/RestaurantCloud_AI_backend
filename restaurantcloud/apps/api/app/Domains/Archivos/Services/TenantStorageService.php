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
     * Comprueba si el espacio y manifiesto del tenant ya ha sido inicializado.
     */
    public function estaInicializado(string $empresaId): bool
    {
        $manifestKey = "tenants/{$empresaId}/manifest.json";

        return Storage::disk($this->disk)->exists($manifestKey)
            || Archivo::where('empresa_id', $empresaId)
                ->where('object_key', $manifestKey)
                ->exists();
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
    public function generarKeyCatalogo(
        string $empresaId,
        ?string $localId,
        string $seccion,
        string $entidadId,
        string $extension,
        ?string $archivoId = null
    ): string {
        $uuid = $archivoId ?: (string) Str::uuid();
        $ext = ltrim($extension, '.');

        if ($localId) {
            return "catalogo/empresas/{$empresaId}/locales/{$localId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
        }

        return "catalogo/empresas/{$empresaId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
    }

    /**
     * Genera la ruta canónica para archivos privados (comprobantes SUNAT, reportes Z, incidentes)
     */
    public function generarKeyPrivado(
        string $empresaId,
        ?string $localId,
        string $seccion,
        string $entidadId,
        string $extension,
        ?string $archivoId = null
    ): string {
        $uuid = $archivoId ?: (string) Str::uuid();
        $ext = ltrim($extension, '.');

        if ($localId) {
            return "privado/empresas/{$empresaId}/locales/{$localId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
        }

        return "privado/empresas/{$empresaId}/{$seccion}/{$entidadId}/{$uuid}.{$ext}";
    }

    /**
     * CU-ADMIN-04 / CU-CLIENTE-01: Fotografía de producto en catálogo
     */
    public function generarKeyProducto(
        string $empresaId,
        string $localId,
        string $productoId,
        string $extension,
        ?string $archivoId = null
    ): string {
        return $this->generarKeyCatalogo($empresaId, $localId, 'productos', $productoId, $extension, $archivoId);
    }

    /**
     * CU-ADMIN-11 / CU-PROP-06: Foto o comprobante escaneado de incidente
     */
    public function generarKeyIncidente(
        string $empresaId,
        string $localId,
        string $incidenteId,
        string $extension,
        ?string $archivoId = null
    ): string {
        return $this->generarKeyPrivado($empresaId, $localId, 'incidentes', $incidenteId, $extension, $archivoId);
    }

    /**
     * CU-CAJA-03 / CU-CAJA-04: Boleta, factura, nota de venta o nota de crédito (PDF o XML)
     */
    public function generarKeyComprobante(
        string $empresaId,
        string $localId,
        string $comprobanteId,
        string $extension,
        ?string $archivoId = null
    ): string {
        return $this->generarKeyPrivado($empresaId, $localId, 'comprobantes', $comprobanteId, $extension, $archivoId);
    }

    /**
     * CU-CAJA-05: Reporte Z digital del turno de caja (inmutable, siempre PDF)
     */
    public function generarKeyReporteZ(
        string $empresaId,
        string $localId,
        string $cajaId,
        ?string $archivoId = null
    ): string {
        $uuid = $archivoId ?: (string) Str::uuid();

        return "privado/empresas/{$empresaId}/locales/{$localId}/reportes-z/{$cajaId}/{$uuid}.pdf";
    }

    /**
     * CU-SAAS-02: Paquete ZIP de portabilidad de datos del tenant (siempre ZIP)
     */
    public function generarKeyPortabilidad(
        string $empresaId,
        string $solicitudId,
        ?string $archivoId = null
    ): string {
        $uuid = $archivoId ?: (string) Str::uuid();

        return "privado/empresas/{$empresaId}/portabilidad/{$solicitudId}/{$uuid}.zip";
    }

    /**
     * CU-PROP-07 / CU-ADMIN-14: Exportación pesada o temporal (PDF, XLSX, CSV, etc.)
     */
    public function generarKeyExportacionTemporal(
        string $empresaId,
        string $exportacionId,
        string $extension,
        ?string $archivoId = null
    ): string {
        $uuid = $archivoId ?: (string) Str::uuid();
        $ext = ltrim($extension, '.');

        return "privado/empresas/{$empresaId}/temporales/exportaciones/{$exportacionId}/{$uuid}.{$ext}";
    }

    /**
     * Genera una URL firmada de corta duración para descarga privada segura (5 a 15 minutos)
     */
    public function generarUrlDescargaTemporal(string $objectKey, int $minutos = 15): string
    {
        return Storage::disk($this->disk)->temporaryUrl($objectKey, now()->addMinutes($minutos));
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
