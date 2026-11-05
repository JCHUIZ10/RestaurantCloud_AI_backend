<?php

namespace App\Domains\Suscripcion\Exceptions;

class CambioPlanException extends \RuntimeException
{
    public function __construct(public string $codigo, string $mensaje, public int $status = 409)
    {
        parent::__construct($mensaje);
    }
}
