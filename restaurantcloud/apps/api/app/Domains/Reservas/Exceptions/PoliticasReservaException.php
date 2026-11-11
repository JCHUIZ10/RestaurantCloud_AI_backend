<?php

namespace App\Domains\Reservas\Exceptions;

/**
 * Error de negocio de las políticas de reserva, con el código y el estado HTTP que debe recibir el cliente.
 */
class PoliticasReservaException extends \RuntimeException
{
    /**
     * @param  array<string, mixed>|null  $detalles
     */
    public function __construct(public string $codigo, string $mensaje, public int $status = 409, public ?array $detalles = null)
    {
        parent::__construct($mensaje);
    }
}
