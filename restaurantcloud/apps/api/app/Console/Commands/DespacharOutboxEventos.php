<?php

namespace App\Console\Commands;

use App\Domains\Eventos\Jobs\EntregarEventoJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DespacharOutboxEventos extends Command
{
    protected $signature = 'outbox:despachar-eventos {--limite=50 : Maximo de entregas por ejecucion}';

    protected $description = 'Encola las entregas de eventos a microservicios que estan pendientes y vencidas.';

    public function handle(): int
    {
        $limite = max(1, min((int) $this->option('limite'), 200));
        $reservaSegundos = (int) config('eventos.reserva_segundos');

        // Reserva y lee en una sola sentencia: dos despachos simultáneos no encolan la misma entrega,
        // y una entrega encolada no se vuelve a encolar hasta que venza su reserva.
        $entregas = DB::select(
            <<<'SQL'
                UPDATE outbox_entrega
                   SET proximo_intento_en = NOW() + make_interval(secs => ?)
                 WHERE id IN (
                       SELECT id
                         FROM outbox_entrega
                        WHERE estado = 'pendiente'
                          AND proximo_intento_en <= NOW()
                        ORDER BY proximo_intento_en
                        LIMIT ?
                          FOR UPDATE SKIP LOCKED
                 )
             RETURNING id
            SQL,
            [$reservaSegundos, $limite],
        );

        foreach ($entregas as $entrega) {
            EntregarEventoJob::dispatch($entrega->id);
        }

        $this->info('Entregas de eventos enviadas a Redis: '.count($entregas));

        return self::SUCCESS;
    }
}
