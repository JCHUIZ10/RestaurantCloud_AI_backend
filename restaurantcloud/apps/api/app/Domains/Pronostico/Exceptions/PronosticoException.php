<?php

namespace App\Domains\Pronostico\Exceptions;

use RuntimeException;

/**
 * Error de negocio del pronóstico o de la comunicación con ms-pronóstico. El controlador lo responde
 * con el formato de error del sistema, usando `codigo` y `status`.
 */
class PronosticoException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $detalles
     */
    public function __construct(
        public readonly string $codigo,
        string $mensaje,
        public readonly int $status,
        public readonly array $detalles = [],
    ) {
        parent::__construct($mensaje);
    }
}
