<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Genera un par de claves RSA para el JWT de microservicios y lo imprime como líneas de .env.
 *
 * No escribe ningún archivo: las claves son por entorno y nunca van al repositorio.
 */
class GenerarClavesJwt extends Command
{
    protected $signature = 'jwt:claves {--bits=2048 : Tamaño de la clave RSA (2048 a 4096)}';

    protected $description = 'Imprime un par de claves RSA nuevo (JWT_PRIVATE_KEY y JWT_PUBLIC_KEY) en formato de .env.';

    public function handle(): int
    {
        $bits = (int) $this->option('bits');
        if ($bits < 2048 || $bits > 4096) {
            $this->error('--bits debe estar entre 2048 y 4096.');

            return self::FAILURE;
        }

        $clave = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => $bits]);
        if ($clave === false || ! openssl_pkey_export($clave, $privada)) {
            $this->error('openssl no pudo generar la clave.');

            return self::FAILURE;
        }

        $publica = openssl_pkey_get_details($clave)['key'];

        $this->line('JWT_PRIVATE_KEY="'.$this->unaLinea($privada).'"');
        $this->line('JWT_PUBLIC_KEY="'.$this->unaLinea($publica).'"');

        return self::SUCCESS;
    }

    /** El PEM en una línea, con "\n" literales, como lo lee config/jwt.php. */
    private function unaLinea(string $pem): string
    {
        return str_replace("\n", '\n', trim($pem));
    }
}
