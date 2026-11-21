<?php

namespace App\Support;

use RuntimeException;

/**
 * JWT firmado con RS256 (RFC 7515/7519) usando la extensión openssl, sin dependencias.
 *
 * El núcleo solo emite; `verificar` existe para las pruebas y para diagnosticar un token.
 * Kong y los microservicios hacen la validación completa (emisor, audiencia, caducidad).
 */
class JwtRs256
{
    /**
     * @param  array<string, mixed>  $claims
     *
     * @throws RuntimeException Si la clave privada no es válida.
     */
    public static function codificar(array $claims, string $clavePrivadaPem, ?string $kid = null): string
    {
        $cabecera = ['alg' => 'RS256', 'typ' => 'JWT'];
        if ($kid !== null) {
            $cabecera['kid'] = $kid;
        }

        $firmable = self::base64Url(json_encode($cabecera, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES))
            .'.'.self::base64Url(json_encode($claims, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));

        $clave = openssl_pkey_get_private($clavePrivadaPem);
        if ($clave === false || ! openssl_sign($firmable, $firma, $clave, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('JWT_PRIVATE_KEY no es una clave privada RSA válida.');
        }

        return $firmable.'.'.self::base64Url($firma);
    }

    /**
     * Claims del token si la firma RS256 es válida con la clave pública; null en otro caso.
     * No comprueba caducidad ni emisor.
     *
     * @return array<string, mixed>|null
     */
    public static function verificar(string $jwt, string $clavePublicaPem): ?array
    {
        $partes = explode('.', $jwt);
        if (count($partes) !== 3) {
            return null;
        }

        [$cabecera64, $claims64, $firma64] = $partes;
        $cabecera = json_decode(self::desdeBase64Url($cabecera64), true);
        $firma = self::desdeBase64Url($firma64);
        $clave = openssl_pkey_get_public($clavePublicaPem);

        if (! is_array($cabecera) || ($cabecera['alg'] ?? null) !== 'RS256' || $clave === false
            || openssl_verify($cabecera64.'.'.$claims64, $firma, $clave, OPENSSL_ALGO_SHA256) !== 1) {
            return null;
        }

        $claims = json_decode(self::desdeBase64Url($claims64), true);

        return is_array($claims) ? $claims : null;
    }

    /**
     * Cabecera del token sin verificar la firma (para leer `kid`).
     *
     * @return array<string, mixed>|null
     */
    public static function cabecera(string $jwt): ?array
    {
        $cabecera = json_decode(self::desdeBase64Url(explode('.', $jwt)[0]), true);

        return is_array($cabecera) ? $cabecera : null;
    }

    private static function base64Url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    private static function desdeBase64Url(string $texto): string
    {
        return (string) base64_decode(strtr($texto, '-_', '+/'), true);
    }
}
