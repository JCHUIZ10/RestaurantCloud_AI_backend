<?php

namespace App\Domains\Caja\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Models\Archivo;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ComprobanteDigitalService
{
    public function __construct(
        private TenantStorageService $storage,
    ) {}

    /**
     * Genera la representacion PDF de un comprobante emitido. Es idempotente:
     * una ejecucion posterior reutiliza el archivo disponible ya registrado.
     */
    public function generarPdf(string $comprobanteId, ?string $creadoPor = null): Archivo
    {
        $existente = Archivo::query()
            ->where('entidad_tipo', 'comprobante_pdf')
            ->where('entidad_id', $comprobanteId)
            ->where('estado', 'disponible')
            ->whereNull('deleted_at')
            ->first();

        if ($existente) {
            return $existente;
        }

        $comprobante = $this->obtenerComprobante($comprobanteId);

        if (! $comprobante) {
            throw new RuntimeException('No se encontro el comprobante para generar su documento digital.');
        }

        $items = DB::table('comprobante_item')
            ->where('comprobante_id', $comprobanteId)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($item) => [
                'descripcion' => $item->descripcion,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'subtotal' => (float) $item->subtotal,
            ]);

        $html = view('pdf.comprobante', [
            'comprobante' => $comprobante,
            'items' => $items,
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
            $pdfContent = "%PDF-1.4\n%Fallback PDF for Comprobante {$comprobante->serie}-{$comprobante->correlativo}\n%%EOF";
        }

        $archivoId = (string) Str::uuid();
        $objectKey = $this->storage->generarKeyComprobante(
            $comprobante->empresa_id,
            $comprobante->local_id,
            $comprobanteId,
            'pdf',
            $archivoId,
        );

        $numero = $comprobante->serie . '-' . str_pad((string) $comprobante->correlativo, 8, '0', STR_PAD_LEFT);
        $nombre = strtoupper($comprobante->tipo) . '-' . $numero . '.pdf';

        $guardado = Storage::disk('s3')->put($objectKey, $pdfContent, [
            'visibility' => 'private',
            'ContentType' => 'application/pdf',
            'ContentDisposition' => "inline; filename=\"{$nombre}\"",
        ]);

        if (! $guardado) {
            throw new RuntimeException('MinIO no confirmo el almacenamiento del PDF del comprobante.');
        }

        try {
            return Archivo::create([
                'id' => $archivoId,
                'empresa_id' => $comprobante->empresa_id,
                'local_id' => $comprobante->local_id,
                'bucket' => config('filesystems.disks.s3.bucket', 'restaurantcloud'),
                'object_key' => $objectKey,
                'nombre_original' => $nombre,
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => strlen($pdfContent),
                'sha256' => hash('sha256', $pdfContent),
                'visibilidad' => 'privado',
                'entidad_tipo' => 'comprobante_pdf',
                'entidad_id' => $comprobanteId,
                'estado' => 'disponible',
                'creado_por' => $creadoPor,
            ]);
        } catch (\Throwable $exception) {
            Storage::disk('s3')->delete($objectKey);

            throw $exception;
        }
    }

    public function obtenerComprobante(string $comprobanteId): ?object
    {
        return DB::table('comprobante as c')
            ->join('caja as ca', 'ca.id', '=', 'c.caja_id')
            ->join('local as l', 'l.id', '=', 'ca.local_id')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->where('c.id', $comprobanteId)
            ->select([
                'c.*',
                'ca.local_id',
                'l.nombre as local_nombre',
                'l.slug as local_slug',
                'l.direccion as local_direccion',
                'l.distrito as local_distrito',
                'l.ciudad as local_ciudad',
                'l.telefono as local_telefono',
                'e.id as empresa_id',
                'e.razon_social as empresa_razon_social',
                'e.ruc as empresa_ruc',
                'm.numero as mesa_numero',
            ])
            ->first();
    }

    public function obtenerComprobantePorToken(string $token): ?object
    {
        return DB::table('comprobante as c')
            ->join('caja as ca', 'ca.id', '=', 'c.caja_id')
            ->join('local as l', 'l.id', '=', 'ca.local_id')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->leftJoin('pedido as p', 'p.id', '=', 'c.pedido_id')
            ->leftJoin('mesa as m', 'm.id', '=', 'p.mesa_id')
            ->where('c.token_qr', $token)
            ->select([
                'c.*',
                'ca.local_id',
                'l.nombre as local_nombre',
                'l.slug as local_slug',
                'l.direccion as local_direccion',
                'l.distrito as local_distrito',
                'l.ciudad as local_ciudad',
                'l.telefono as local_telefono',
                'e.id as empresa_id',
                'e.razon_social as empresa_razon_social',
                'e.ruc as empresa_ruc',
                'm.numero as mesa_numero',
            ])
            ->first();
    }
}
