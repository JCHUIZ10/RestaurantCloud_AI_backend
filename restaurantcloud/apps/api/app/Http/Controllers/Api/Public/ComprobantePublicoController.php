<?php

namespace App\Http\Controllers\Api\Public;

use App\Domains\Caja\Services\ComprobanteDigitalService;
use App\Models\Archivo;
use App\Support\ApiResponse;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Psr\Http\Message\StreamInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ComprobantePublicoController
{
    public function __construct(
        private ComprobanteDigitalService $service,
    ) {}

    /**
     * CU-CLIENTE-02: Consulta publica mediante token QR, sin exponer object_key.
     */
    public function show(string $token): JsonResponse
    {
        $comprobante = $this->buscarPorToken($token);

        if (! $comprobante) {
            return ApiResponse::error(
                'COMPROBANTE_NO_ENCONTRADO',
                'No pudimos encontrar ningun comprobante con el enlace suministrado.',
                404,
            );
        }

        $archivo = $this->archivoPdf($comprobante->id);
        $items = DB::table('comprobante_item')
            ->where('comprobante_id', $comprobante->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($item) => [
                'cantidad' => (int) $item->cantidad,
                'descripcion' => $item->descripcion,
                'precio_unitario' => (float) $item->precio_unitario,
                'importe_total' => (float) $item->subtotal,
            ]);

        return ApiResponse::ok([
            'token' => $comprobante->token_qr,
            'tipo' => $comprobante->tipo,
            'tipo_label' => $this->tipoLabel($comprobante->tipo),
            'serie' => $comprobante->serie,
            'correlativo' => (int) $comprobante->correlativo,
            'serie_numero' => $comprobante->serie . '-' . str_pad((string) $comprobante->correlativo, 8, '0', STR_PAD_LEFT),
            'fecha_emision' => $comprobante->fecha,
            'estado' => $comprobante->estado,
            'hash_seguridad' => $archivo?->sha256 ?? hash('sha256', $comprobante->id . $comprobante->token_qr),
            'documento_digital' => [
                'estado' => $archivo ? 'disponible' : 'generando',
                'pdf_disponible' => $archivo !== null,
                'url_descarga_pdf' => $archivo ? route('public.comprobantes.pdf', ['token' => $comprobante->token_qr]) : null,
            ],
            'emisor' => [
                'razon_social' => $comprobante->empresa_razon_social,
                'ruc' => $comprobante->empresa_ruc,
                'local_nombre' => $comprobante->local_nombre,
                'direccion' => $comprobante->local_direccion,
                'distrito' => $comprobante->local_distrito,
                'ciudad' => $comprobante->local_ciudad,
                'telefono' => $comprobante->local_telefono,
                'slug_sede' => $comprobante->local_slug,
                'horario' => null,
            ],
            'cliente' => [
                'nombre' => $comprobante->nombre_cliente,
                'tipo_documento' => $this->tipoDocumento($comprobante->documento_cliente),
                'numero_documento' => $comprobante->documento_cliente,
                'mesa_codigo' => $comprobante->mesa_numero ? "Mesa {$comprobante->mesa_numero}" : null,
            ],
            'items' => $items,
            'totales' => [
                'subtotal_consumo' => (float) $comprobante->subtotal_consumo,
                'descuento' => (float) $comprobante->descuento,
                'descuento_motivo' => null,
                'base_imponible' => (float) $comprobante->base_imponible,
                'igv' => (float) $comprobante->igv,
                'monto_recargo' => (float) $comprobante->monto_recargo,
                'total' => (float) $comprobante->total,
            ],
            'pago' => [
                'medio_pago' => $comprobante->medio_pago,
                'metodo_nombre' => $this->metodoNombre($comprobante->medio_pago),
                'monto_recibido' => (float) $comprobante->monto_recibido,
                'vuelto' => (float) $comprobante->vuelto,
            ],
            'url_carta_digital' => "/sede/{$comprobante->local_slug}/carta",
        ]);
    }

    /**
     * CU-CLIENTE-02: entrega el PDF por streaming desde Laravel. La clave
     * privada de MinIO y sus credenciales nunca llegan al navegador.
     */
    public function descargarPdf(string $token): StreamedResponse|JsonResponse
    {
        $comprobante = $this->buscarPorToken($token);

        if (! $comprobante) {
            return ApiResponse::error('COMPROBANTE_NO_ENCONTRADO', 'El comprobante solicitado no existe.', 404);
        }

        $archivo = $this->archivoPdf($comprobante->id);
        if (! $archivo) {
            return ApiResponse::error(
                'DOCUMENTO_AUN_NO_DISPONIBLE',
                'El documento digital todavia se encuentra en generacion. Intente nuevamente en unos segundos.',
                409,
            );
        }

        try {
            $disk = Storage::disk('s3');

            if (! $disk instanceof AwsS3V3Adapter) {
                throw new \RuntimeException('El disco de comprobantes no utiliza el adaptador S3 esperado.');
            }

            // El adaptador Flysystem puede devolver false en readStream() aun
            // cuando el objeto exista. El cliente S3 nativo entrega el stream
            // autenticado y ya fue validado contra MinIO.
            $resultado = $disk->getClient()->getObject([
                'Bucket' => config('filesystems.disks.s3.bucket'),
                'Key' => $archivo->object_key,
            ]);
            $stream = $resultado['Body'];

            if (! $stream instanceof StreamInterface) {
                throw new \RuntimeException('MinIO no devolvio un stream legible para el documento.');
            }
        } catch (\Throwable $exception) {
            Log::warning('No fue posible abrir el PDF privado del comprobante.', [
                'archivo_id' => $archivo->id,
                'comprobante_id' => $comprobante->id,
                'error' => $exception->getMessage(),
            ]);

            return ApiResponse::error(
                'DOCUMENTO_NO_ACCESIBLE',
                'El PDF fue generado, pero no se pudo abrir temporalmente. Intente nuevamente en unos segundos.',
                503,
            );
        }

        return response()->streamDownload(function () use ($stream): void {
            while (! $stream->eof()) {
                echo $stream->read(1024 * 1024);
            }

            $stream->close();
        }, $archivo->nombre_original, ['Content-Type' => $archivo->mime_type]);
    }

    private function buscarPorToken(string $token): ?object
    {
        if (! preg_match('/^[0-9a-fA-F-]{36}$/', $token)) {
            return null;
        }

        return $this->service->obtenerComprobantePorToken($token);
    }

    private function archivoPdf(string $comprobanteId): ?Archivo
    {
        return Archivo::query()
            ->where('entidad_tipo', 'comprobante_pdf')
            ->where('entidad_id', $comprobanteId)
            ->where('estado', 'disponible')
            ->whereNull('deleted_at')
            ->latest('created_at')
            ->first();
    }

    private function tipoLabel(string $tipo): string
    {
        return match ($tipo) {
            'factura' => 'Factura Electronica',
            'nota_venta' => 'Nota de Venta',
            'nota_credito' => 'Nota de Credito Electronica',
            default => 'Boleta de Venta Electronica',
        };
    }

    private function tipoDocumento(?string $documento): ?string
    {
        return match (strlen((string) $documento)) {
            8 => 'DNI',
            11 => 'RUC',
            default => null,
        };
    }

    private function metodoNombre(string $medioPago): string
    {
        return match ($medioPago) {
            'tarjeta' => 'Tarjeta POS',
            'billetera_digital' => 'Yape / Plin',
            default => 'Efectivo',
        };
    }
}
