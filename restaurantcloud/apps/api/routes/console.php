<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// CU-ADMIN-04: limpieza diaria de fotos de catálogo huérfanas o eliminadas hace tiempo.
Schedule::command('archivos:purgar-catalogo-huerfano')
    ->dailyAt('03:30')
    ->withoutOverlapping();

// CU-PROP-02: renovación, reintentos y suspensión por falta de pago de las suscripciones SaaS.
Schedule::command('suscripciones:procesar-cobros')
    ->dailyAt('06:00')
    ->withoutOverlapping();

// CU-CAJA-03B: el scheduler entrega los eventos persistidos al worker Redis.
Schedule::command('outbox:despachar-comprobantes --limite=25')
    ->everyMinute()
    ->withoutOverlapping();
