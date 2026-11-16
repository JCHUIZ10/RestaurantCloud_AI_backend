<?php

namespace App\Domains\Tenant\Exceptions;

/**
 * No fue posible registrar el enlace de activación (capability token) del titular.
 *
 * Se lanza dentro de la transacción del alta para revertirla: sin enlace válido
 * la empresa quedaría creada pero inaccesible para su propietario.
 */
class EnlaceActivacionException extends \RuntimeException
{
    public function __construct(string $mensaje = 'No se pudo generar el enlace de activación del titular. Intenta nuevamente.', ?\Throwable $previa = null)
    {
        parent::__construct($mensaje, 0, $previa);
    }
}
