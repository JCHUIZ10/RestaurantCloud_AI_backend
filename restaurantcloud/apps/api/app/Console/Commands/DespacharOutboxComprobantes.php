<?php

namespace App\Console\Commands;

use App\Domains\Caja\Jobs\GenerarComprobanteDigitalJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DespacharOutboxComprobantes extends Command
{
    protected $signature = 'outbox:despachar-comprobantes {--limite=25 : Maximo de eventos por ejecucion}';
    protected $description = 'Encola los documentos de comprobantes pendientes registrados en Outbox.';

    public function handle(): int
    {
        $limite = max(1, min((int) $this->option('limite'), 100));

        // Un evento en "procesando" que excedio el timeout puede provenir de
        // un worker detenido. Lo devolvemos a pendiente para que sea recuperable.
        DB::table('outbox_event')
            ->where('tipo_evento', 'comprobante.digital.solicitado')
            ->where('estado', 'procesando')
            ->where('updated_at', '<=', now()->subMinutes(10))
            ->update([
                'estado' => 'pendiente',
                'disponible_desde' => now(),
                'updated_at' => now(),
            ]);

        $events = DB::table('outbox_event')
            ->where('tipo_evento', 'comprobante.digital.solicitado')
            ->whereIn('estado', ['pendiente', 'fallido'])
            ->where('disponible_desde', '<=', now())
            ->orderBy('created_at')
            ->limit($limite)
            ->get();

        foreach ($events as $event) {
            GenerarComprobanteDigitalJob::dispatch($event->id);
        }

        $this->info("Eventos de comprobante enviados a Redis: {$events->count()}");

        return self::SUCCESS;
    }
}
