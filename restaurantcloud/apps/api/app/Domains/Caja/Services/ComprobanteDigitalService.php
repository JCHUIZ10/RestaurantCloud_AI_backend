<?php

namespace App\Domains\Caja\Services;

use App\Domains\Archivos\Services\TenantStorageService;
use App\Models\Archivo;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Carbon;
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

        $html = $this->renderizarHtml($comprobante);

        if (class_exists(Dompdf::class) && class_exists(Options::class)) {
            $options = new Options;
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

        $numero = $comprobante->serie.'-'.str_pad((string) $comprobante->correlativo, 8, '0', STR_PAD_LEFT);
        $nombre = strtoupper($comprobante->tipo).'-'.$numero.'.pdf';

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

    /**
     * HTML de la representación impresa. Una nota de crédito incluye el documento que modifica.
     */
    public function renderizarHtml(object $comprobante): string
    {
        $items = DB::table('comprobante_item')
            ->where('comprobante_id', $comprobante->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($item) => [
                'descripcion' => $item->descripcion,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'subtotal' => (float) $item->subtotal,
            ]);

        return view('pdf.comprobante', [
            'comprobante' => $comprobante,
            'items' => $items,
            'referencia' => $this->referenciaFiscal($comprobante),
        ])->render();
    }

    /**
     * Referencia fiscal cruzada entre un comprobante anulado y su nota de crédito.
     *
     * - Un comprobante anulado devuelve la NC que lo anuló en `nota_credito`.
     * - Una nota de crédito devuelve el comprobante que modifica en `documento_afectado`.
     * - Cualquier otro comprobante devuelve ambos en null.
     *
     * @return array{nota_credito: array<string, mixed>|null, documento_afectado: array<string, mixed>|null}
     */
    public function referenciaFiscal(object $comprobante): array
    {
        $referencia = ['nota_credito' => null, 'documento_afectado' => null];

        if ($comprobante->tipo === 'nota_credito') {
            $original = $comprobante->comprobante_modificado_id
                ? DB::table('comprobante')->where('id', $comprobante->comprobante_modificado_id)->first()
                : null;

            if ($original) {
                $referencia['documento_afectado'] = [
                    'serie_numero' => $this->serieNumero($original),
                    'tipo' => $original->tipo,
                    'tipo_label' => $this->tipoLabel($original->tipo),
                    'fecha' => Carbon::parse($original->fecha)->toIso8601String(),
                    'token' => (string) $original->token_qr,
                    'url_publica' => "/c/{$original->token_qr}",
                    ...$this->motivo($comprobante->motivo_codigo_sunat, $comprobante->sustento_motivo),
                ];
            }

            return $referencia;
        }

        if ($comprobante->estado === 'anulado') {
            $nota = DB::table('comprobante')
                ->where('comprobante_modificado_id', $comprobante->id)
                ->where('tipo', 'nota_credito')
                ->first();

            if ($nota) {
                $referencia['nota_credito'] = [
                    'serie_numero' => $this->serieNumero($nota),
                    'fecha' => Carbon::parse($nota->fecha)->toIso8601String(),
                    'token' => (string) $nota->token_qr,
                    'url_publica' => "/c/{$nota->token_qr}",
                    ...$this->motivo($nota->motivo_codigo_sunat, $nota->sustento_motivo),
                ];
            }
        }

        return $referencia;
    }

    public function tipoLabel(string $tipo): string
    {
        return match ($tipo) {
            'factura' => 'Factura Electronica',
            'nota_venta' => 'Nota de Venta',
            'nota_credito' => 'Nota de Credito Electronica',
            default => 'Boleta de Venta Electronica',
        };
    }

    private function serieNumero(object $comprobante): string
    {
        return $comprobante->serie.'-'.str_pad((string) $comprobante->correlativo, 8, '0', STR_PAD_LEFT);
    }

    /**
     * @return array{motivo_codigo: string|null, motivo_texto: string|null, sustento: string|null}
     */
    private function motivo(?string $codigo, ?string $sustento): array
    {
        return [
            'motivo_codigo' => $codigo,
            'motivo_texto' => $codigo !== null ? (HistorialComprobantesService::MOTIVOS_SUNAT[$codigo] ?? null) : null,
            'sustento' => $sustento,
        ];
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
