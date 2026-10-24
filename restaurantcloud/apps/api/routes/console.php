<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// CU-CAJA-03B: el scheduler entrega los eventos persistidos al worker Redis.
Schedule::command('outbox:despachar-comprobantes --limite=25')
    ->everyMinute()
    ->withoutOverlapping();
