<?php

namespace App\Support;

/**
 * Firma de las peticiones servidor a servidor (doc-2u/servicios/README.md, sección 2).
 *
 * HMAC-SHA256 en hexadecimal de `timestamp.mensaje`. El mensaje es el cuerpo exacto que se envía o, en una
 * petición GET sin cuerpo, la cadena de consulta tal como viaja en la URL.
 */
final class FirmaInterna
{
    public static function firmar(string $timestamp, string $mensaje, string $secreto): string
    {
        return hash_hmac('sha256', "{$timestamp}.{$mensaje}", $secreto);
    }

    /**
     * Cabeceras de autenticación de una petición a un microservicio.
     *
     * @return array{X-Timestamp: string, X-Firma: string}
     */
    public static function cabeceras(string $mensaje, string $secreto): array
    {
        $timestamp = (string) now()->timestamp;

        return ['X-Timestamp' => $timestamp, 'X-Firma' => self::firmar($timestamp, $mensaje, $secreto)];
    }
}
