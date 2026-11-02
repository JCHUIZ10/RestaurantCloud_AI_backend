<?php

namespace Tests;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    // Cada test corre dentro de una transacción que se revierte al terminar,
    // para que la BD de tests conserve la semilla entre ejecuciones.
    use DatabaseTransactions;
}
