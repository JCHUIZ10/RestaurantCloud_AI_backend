<?php

namespace App\Domains\Suscripcion\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Models\Archivo;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Constancia PDF de los pagos de suscripción SaaS (CU-PROP-01, CU-PROP-02).
 *
 * El PDF se guarda en el prefijo privado del tenant y se registra en `archivo`
 * para que el propietario pueda volver a descargarlo desde "Mi suscripción".
 */
class ReciboSuscripcionService
{
    public const ENTIDAD_TIPO = 'recibo_suscripcion';

    public function __construct(
        private TenantStorageService $storage,
    ) {}

    /**
     * Genera y persiste la constancia del pago. Es idempotente: si ya existe un
     * archivo disponible para el pago, lo reutiliza.
     */
    public function generarPdf(string $pagoId, ?string $creadoPor = null): Archivo
    {
        $existente = $this->archivoDisponible($pagoId);

        if ($existente) {
            return $existente;
        }

        $pago = $this->obtenerPago($pagoId);

        if (! $pago) {
            throw new RuntimeException('No se encontró el pago para generar su constancia.');
        }

        $html = view('pdf.recibo_suscripcion', ['pago' => $pago])->render();

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $pdf = new Dompdf($options);
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->setPaper('A4');
        $pdf->render();
        $pdfContent = $pdf->output();

        $archivoId = (string) Str::uuid();
        $objectKey = $this->storage->generarKeyReciboSuscripcion($pago->empresa_id, $pagoId, $archivoId);
        $nombre = "Constancia-{$pago->numero_recibo}.pdf";

        $guardado = Storage::disk('s3')->put($objectKey, $pdfContent, [
            'visibility' => 'private',
            'ContentType' => 'application/pdf',
            'ContentDisposition' => "inline; filename=\"{$nombre}\"",
        ]);

        if (! $guardado) {
            throw new RuntimeException('MinIO no confirmó el almacenamiento de la constancia de suscripción.');
        }

        try {
            return Archivo::create([
                'id' => $archivoId,
                'empresa_id' => $pago->empresa_id,
                'local_id' => null,
                'bucket' => config('filesystems.disks.s3.bucket', 'restaurantcloud'),
                'object_key' => $objectKey,
                'nombre_original' => $nombre,
                'mime_type' => 'application/pdf',
                'tamanio_bytes' => strlen($pdfContent),
                'sha256' => hash('sha256', $pdfContent),
                'visibilidad' => 'privado',
                'entidad_tipo' => self::ENTIDAD_TIPO,
                'entidad_id' => $pagoId,
                'estado' => 'disponible',
                'creado_por' => $creadoPor,
            ]);
        } catch (\Throwable $exception) {
            Storage::disk('s3')->delete($objectKey);

            throw $exception;
        }
    }

    public function archivoDisponible(string $pagoId): ?Archivo
    {
        return Archivo::query()
            ->where('entidad_tipo', self::ENTIDAD_TIPO)
            ->where('entidad_id', $pagoId)
            ->where('estado', 'disponible')
            ->whereNull('deleted_at')
            ->first();
    }

    /**
     * Pago con los datos de empresa, plan y periodo que imprime la constancia.
     */
    public function obtenerPago(string $pagoId): ?object
    {
        return DB::table('pago as pg')
            ->join('empresa as e', 'e.id', '=', 'pg.empresa_id')
            ->join('plan as p', 'p.id', '=', 'pg.plan_id')
            ->leftJoin('suscripcion as s', 's.id', '=', 'pg.suscripcion_id')
            ->where('pg.id', $pagoId)
            ->select([
                'pg.id',
                'pg.empresa_id',
                'pg.numero_recibo',
                'pg.monto',
                'pg.fecha',
                'pg.estado',
                'pg.origen_pago',
                'pg.stripe_payment_id',
                'pg.numero_operacion',
                'pg.nota',
                'e.razon_social',
                'e.ruc',
                'e.tipo_identidad_fiscal',
                'e.correo_contacto',
                'p.nombre as plan_nombre',
                's.ciclo_facturacion',
                's.fecha_inicio',
                's.fecha_fin_periodo',
            ])
            ->first();
    }
}
