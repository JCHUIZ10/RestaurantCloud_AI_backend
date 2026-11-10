<?php

namespace App\Domains\Archivos\Services;

use App\Models\Archivo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class TenantStorageService
{
    /** Tipos MIME de imagen aceptados para el catálogo y su extensión canónica. */
    private const EXTENSIONES_IMAGEN = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private string $disk = 's3';

    private string $bucket;

    public function __construct(private ProcesadorImagenService $procesadorImagen)
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
     * Comprueba si el espacio y manifiesto del local ya ha sido inicializado.
     */
    public function estaLocalInicializado(string $empresaId, string $localId): bool
    {
        $manifestKey = "tenants/{$empresaId}/locales/{$localId}/manifest.json";

        return Storage::disk($this->disk)->exists($manifestKey)
            || Archivo::where('empresa_id', $empresaId)
                ->where('local_id', $localId)
                ->where('object_key', $manifestKey)
                ->exists();
    }

    /**
     * Inicializa el espacio y estructura de carpetas virtuales del local en MinIO.
     * Crea un manifiesto json inmutable para certificar el alta de almacenamiento del local.
     */
    public function inicializarEspacioLocal(string $empresaId, string $localId, array $metadata = []): bool
    {
        $manifestKey = "tenants/{$empresaId}/locales/{$localId}/manifest.json";

        $manifestContent = json_encode([
            'empresa_id' => $empresaId,
            'local_id' => $localId,
            'fecha_alta' => now()->toIso8601String(),
            'bucket' => $this->bucket,
            'prefijos_asignados' => [
                'catalogo_productos' => "catalogo/empresas/{$empresaId}/locales/{$localId}/productos/",
                'privado_comprobantes' => "privado/empresas/{$empresaId}/locales/{$localId}/comprobantes/",
                'privado_reportes_z' => "privado/empresas/{$empresaId}/locales/{$localId}/reportes-z/",
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
                    'local_id' => $localId,
                    'bucket' => $this->bucket,
                    'nombre_original' => 'manifest.json',
                    'mime_type' => 'application/json',
                    'tamanio_bytes' => strlen($manifestContent),
                    'sha256' => hash('sha256', $manifestContent),
                    'visibilidad' => 'privado',
                    'entidad_tipo' => 'local_manifest',
                    'entidad_id' => $localId,
                    'estado' => 'disponible',
                ]
            );
        }

        return $saved;
    }

    /**
     * Obtiene el manifiesto de inicialización de un local específico.
     */
    public function obtenerManifiestoLocal(string $empresaId, string $localId): ?array
    {
        $manifestKey = "tenants/{$empresaId}/locales/{$localId}/manifest.json";

        if (! Storage::disk($this->disk)->exists($manifestKey)) {
            return null;
        }

        $content = Storage::disk($this->disk)->get($manifestKey);

        return json_decode($content, true);
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
     * Genera la ruta canónica para archivos privados (comprobantes SUNAT, reportes Z)
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
     * CU-ADMIN-04: Guarda la fotografía de un producto en el catálogo público y registra su metadato.
     * El tipo se toma del contenido real del archivo, nunca de su extensión original.
     *
     * Con GD disponible la foto se re-codifica a WebP (sin EXIF, lado máximo acotado) y se guarda
     * también una miniatura. Sin GD se guarda tal cual llegó, sin miniatura.
     *
     * @return array{archivo_id: string, object_key: string, miniatura_key: ?string, url: string}
     *
     * @throws InvalidArgumentException si el archivo no es JPEG, PNG o WebP.
     * @throws RuntimeException si el objeto no pudo escribirse en MinIO.
     */
    public function guardarFotoProducto(
        string $empresaId,
        string $localId,
        string $productoId,
        UploadedFile $foto,
        ?string $usuarioId = null
    ): array {
        $mime = (string) $foto->getMimeType();
        $extension = self::EXTENSIONES_IMAGEN[$mime] ?? null;

        if ($extension === null) {
            throw new InvalidArgumentException('La foto debe ser una imagen JPEG, PNG o WebP.');
        }

        $miniatura = null;
        if ($this->procesadorImagen->disponible()) {
            $procesada = $this->procesadorImagen->procesarFotoCatalogo($foto->getRealPath());
            $contenido = $procesada['principal'];
            $miniatura = $procesada['miniatura'];
            $mime = 'image/webp';
            $extension = 'webp';
        } else {
            Log::warning('GD no está disponible: la foto de catálogo se guarda sin re-codificar ni miniatura.');
            $contenido = (string) file_get_contents($foto->getRealPath());
        }

        $archivoId = (string) Str::uuid();
        $objectKey = $this->generarKeyProducto($empresaId, $localId, $productoId, $extension, $archivoId);
        $miniaturaKey = $miniatura !== null ? $this->claveMiniatura($objectKey) : null;
        $nombreOriginal = Str::limit($foto->getClientOriginalName(), 255, '');
        $subidos = [];

        try {
            $this->subirObjetoCatalogo($objectKey, $contenido, $mime);
            $subidos[] = $objectKey;

            if ($miniaturaKey !== null) {
                $this->subirObjetoCatalogo($miniaturaKey, $miniatura, 'image/webp');
                $subidos[] = $miniaturaKey;
            }

            $this->registrarArchivoCatalogo($archivoId, 'producto', $objectKey, $contenido, $mime, $nombreOriginal, $empresaId, $localId, $productoId, $usuarioId);
            if ($miniaturaKey !== null) {
                $this->registrarArchivoCatalogo((string) Str::uuid(), 'producto_miniatura', $miniaturaKey, $miniatura, 'image/webp', $nombreOriginal, $empresaId, $localId, $productoId, $usuarioId);
            }
        } catch (Throwable $e) {
            // Compensación: sin metadato los objetos quedarían huérfanos en MinIO.
            foreach ($subidos as $clave) {
                Storage::disk($this->disk)->delete($clave);
            }

            throw $e;
        }

        return [
            'archivo_id' => $archivoId,
            'object_key' => $objectKey,
            'miniatura_key' => $miniaturaKey,
            'url' => $this->resolverUrlCatalogo($objectKey),
        ];
    }

    /**
     * Elimina un objeto de catálogo de la empresa (y su miniatura, si la tiene) y marca su metadato
     * como eliminado. Es idempotente. Devuelve false, sin tocar nada, si la clave no es de catálogo
     * de esta empresa (por ejemplo una URL externa de las semillas).
     */
    public function eliminarArchivoPorKey(string $empresaId, string $objectKey): bool
    {
        if (! str_starts_with($objectKey, "catalogo/empresas/{$empresaId}/")) {
            return false;
        }

        foreach (array_filter([$objectKey, $this->claveMiniatura($objectKey)]) as $clave) {
            Storage::disk($this->disk)->delete($clave);

            Archivo::where('empresa_id', $empresaId)
                ->where('object_key', $clave)
                ->update(['estado' => 'eliminado']);
        }

        return true;
    }

    /**
     * Clave de la miniatura de una foto principal WebP (`…/{id}.webp` → `…/{id}_thumb.webp`).
     * Null si la clave no es una foto WebP o ya es una miniatura.
     */
    public function claveMiniatura(string $objectKey): ?string
    {
        if (! str_ends_with($objectKey, '.webp') || str_ends_with($objectKey, '_thumb.webp')) {
            return null;
        }

        return substr($objectKey, 0, -5).'_thumb.webp';
    }

    /**
     * De un conjunto de fotos principales, devuelve la miniatura de las que realmente la tienen
     * (las anteriores a la re-codificación no). Una sola consulta.
     *
     * @param  list<string>  $objectKeys
     * @return array<string, string> clave principal => clave de miniatura
     */
    public function miniaturasDisponibles(array $objectKeys): array
    {
        $candidatas = [];
        foreach ($objectKeys as $clave) {
            $miniatura = $this->claveMiniatura($clave);
            if ($miniatura !== null) {
                $candidatas[$clave] = $miniatura;
            }
        }

        if ($candidatas === []) {
            return [];
        }

        $existentes = array_flip(
            Archivo::whereIn('object_key', array_values($candidatas))->where('estado', 'disponible')->pluck('object_key')->all()
        );

        return array_filter($candidatas, fn (string $miniatura): bool => isset($existentes[$miniatura]));
    }

    private function subirObjetoCatalogo(string $objectKey, string $contenido, string $mime): void
    {
        $guardado = Storage::disk($this->disk)->put($objectKey, $contenido, [
            'ContentType' => $mime,
            'CacheControl' => 'public, max-age=31536000, immutable',
        ]);

        if ($guardado === false) {
            throw new RuntimeException('No se pudo guardar la foto en el almacenamiento.');
        }
    }

    private function registrarArchivoCatalogo(
        string $archivoId,
        string $entidadTipo,
        string $objectKey,
        string $contenido,
        string $mime,
        string $nombreOriginal,
        string $empresaId,
        string $localId,
        string $productoId,
        ?string $usuarioId
    ): void {
        Archivo::create([
            'id' => $archivoId,
            'empresa_id' => $empresaId,
            'local_id' => $localId,
            'bucket' => $this->bucket,
            'object_key' => $objectKey,
            'nombre_original' => $nombreOriginal,
            'mime_type' => $mime,
            'tamanio_bytes' => strlen($contenido),
            'sha256' => hash('sha256', $contenido),
            'visibilidad' => 'catalogo',
            'entidad_tipo' => $entidadTipo,
            'entidad_id' => $productoId,
            'estado' => 'disponible',
            'creado_por' => $usuarioId,
        ]);
    }

    /**
     * Devuelve la URL pública de una clave de catálogo. Las URLs absolutas (semillas) pasan sin cambios.
     */
    public function resolverUrlCatalogo(?string $objectKey): ?string
    {
        if ($objectKey === null || $objectKey === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $objectKey) === 1) {
            return $objectKey;
        }

        return Storage::disk($this->disk)->url($objectKey);
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
     * CU-PROP-01 / CU-PROP-02: Constancia PDF de un pago de suscripción SaaS (nivel empresa)
     */
    public function generarKeyReciboSuscripcion(
        string $empresaId,
        string $pagoId,
        ?string $archivoId = null
    ): string {
        return $this->generarKeyPrivado($empresaId, null, 'suscripcion/recibos', $pagoId, 'pdf', $archivoId);
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
            $testKey = '.healthcheck_'.time().'.tmp';
            Storage::disk($this->disk)->put($testKey, 'ok');
            $read = Storage::disk($this->disk)->get($testKey);
            Storage::disk($this->disk)->delete($testKey);

            return [
                'disponible' => ($read === 'ok'),
                'bucket' => $this->bucket,
                'driver' => $this->disk,
            ];
        } catch (Throwable $e) {
            return [
                'disponible' => false,
                'error' => $e->getMessage(),
                'bucket' => $this->bucket,
                'driver' => $this->disk,
            ];
        }
    }
}
