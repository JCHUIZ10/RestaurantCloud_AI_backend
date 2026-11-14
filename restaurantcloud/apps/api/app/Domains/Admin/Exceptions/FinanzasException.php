<?php

namespace App\Domains\Admin\Exceptions;

use RuntimeException;

/**
 * Error de negocio del módulo de finanzas del administrador (turno inexistente, ya visado,
 * gasto en efectivo sin turno abierto, etc.). Lleva el código de la API y el status HTTP.
 */
class FinanzasException extends RuntimeException
{
    public function __construct(
        public readonly string $codigoError,
        string $mensaje,
        public readonly int $status = 409,
    ) {
        parent::__construct($mensaje, $status);
    }
}
