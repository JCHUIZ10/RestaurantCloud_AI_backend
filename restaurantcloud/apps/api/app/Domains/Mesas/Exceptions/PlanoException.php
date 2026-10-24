<?php

namespace App\Domains\Mesas\Exceptions;

class PlanoException extends \RuntimeException
{
    public function __construct(public string $codigo, string $mensaje, public int $status = 409, public ?array $detalles = null)
    {
        parent::__construct($mensaje);
    }
}
