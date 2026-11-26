<?php

namespace App\Support;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Despachador de correos transaccionales con aislamiento de fallos.
 *
 * Debe invocarse siempre fuera de transacciones de base de datos confirmadas
 * para no retener bloqueos ni emitir correos ante un rollback.
 */
final class CorreoTransaccional
{
    /**
     * Envía un Mailable de forma síncrona registrando cualquier error SMTP sin interrumpir la petición.
     *
     * @param  array<string, mixed>  $contextoLog
     */
    public static function enviarSeguro(string $destinatario, Mailable $mailable, array $contextoLog = []): bool
    {
        $correo = trim($destinatario);

        if ($correo === '') {
            Log::warning('Se omitió el envío de correo transaccional por destinatario vacío.', array_merge($contextoLog, [
                'mailable' => $mailable::class,
            ]));

            return false;
        }

        try {
            Mail::to($correo)->send($mailable);

            return true;
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo transaccional.', array_merge($contextoLog, [
                'destinatario' => $correo,
                'mailable' => $mailable::class,
                'error' => $e->getMessage(),
            ]));

            return false;
        }
    }
}
