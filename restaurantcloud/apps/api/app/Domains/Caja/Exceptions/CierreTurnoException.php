<?php

namespace App\Domains\Caja\Exceptions;

use RuntimeException;

/**
 * Error de negocio al cerrar un turno de caja (turno no abierto, salón con mesas activas, etc.).
 * Lleva el código de error de la API y el status HTTP con el que debe responder el controlador.
 */
class CierreTurnoException extends RuntimeException
{
    public function __construct(
        public readonly string $codigoError,
        string $mensaje,
        public readonly int $status = 409,
    ) {
        parent::__construct($mensaje, $status);
    }
}
