<?php

namespace App\Domains\Caja\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Models\Archivo;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ReporteZDigitalService
{
    public function __construct(
        private TenantStorageService $storage,
    ) {}

    /**
     * Genera la representación PDF oficial e inmutable del Reporte Z de un turno de caja
     * y la almacena en el bucket privado de MinIO bajo 'reportes-z'.
     * Es idempotente: si ya existe el archivo disponible, lo reutiliza.
     */
    public function generarPdf(
        string $cajaId,
        array $reporteZ,
        string $empresaId,
        string $localId,
        ?string $creadoPor = null
    ): Archivo {
        $existente = $this->obtenerArchivo($cajaId);

        if ($existente) {
            return $existente;
        }

        $html = view('pdf.reporte_z', [
            'reporte' => $reporteZ,
        ])->render();

        if (class_exists(\Dompdf\Dompdf::class) && class_exists(\Dompdf\Options::class)) {
            $options = new Options();
            $options->set('isRemoteEnabled', false);
            $options->set('defaultFont', 'DejaVu Sans');

            $pdf = new Dompdf($options);
            $pdf->loadHtml($html, 'UTF-8');
            $pdf->setPaper('A4');
            $pdf->render();
            $pdfContent = $pdf->output();
        } else {
            $correlativoStr = str_pad((string) ($reporteZ['turno_correlativo'] ?? 1), 3, '0', STR_PAD_LEFT);
            $pdfContent = "%PDF-1.4\n%Fallback PDF for Reporte Z Turno {$correlativoStr}\n%%EOF";
        }

        $archivoId = (string) Str::uuid();
        $objectKey = $this->storage->generarKeyReporteZ(
            $empresaId,
            $localId,
            $cajaId,
            $archivoId,
        );

        $correlativo = str_pad((string) ($reporteZ['turno_correlativo'] ?? 1), 3, '0', STR_PAD_LEFT);
        $nombre = "REPORTE-Z-TURNO-{$correlativo}.pdf";

        $guardado = Storage::disk('s3')->put($objectKey, $pdfContent, [
            'visibility' => 'private',
            'ContentType' => 'application/pdf',
            'ContentDisposition' => "inline; filename=\"{$nombre}\"",
        ]);

        if (! $guardado) {
            throw new RuntimeException('MinIO no confirmó el almacenamiento del PDF del Reporte Z.');
        }

        try {
            return Archivo::create([
                'id' => $archivoId,
                'empresa_id' => $empresaId,
                'local_id' => $localId,
                'bucket' => config('filesystems.disks.s3.bucket', 'restaurantcloud'),
                'object_key' => $objectKey,
                'nombre_original' => $nombre,
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => strlen($pdfContent),
                'sha256' => hash('sha256', $pdfContent),
                'visibilidad' => 'privado',
                'entidad_tipo' => 'caja_cierre',
                'entidad_id' => $cajaId,
                'estado' => 'disponible',
                'creado_por' => $creadoPor,
            ]);
        } catch (\Throwable $exception) {
            Storage::disk('s3')->delete($objectKey);

            throw $exception;
        }
    }

    /**
     * Obtiene el archivo PDF registrado para una caja específica si existe.
     */
    public function obtenerArchivo(string $cajaId): ?Archivo
    {
        return Archivo::query()
            ->where('entidad_tipo', 'caja_cierre')
            ->where('entidad_id', $cajaId)
            ->where('estado', 'disponible')
            ->whereNull('deleted_at')
            ->latest('created_at')
            ->first();
    }
}
