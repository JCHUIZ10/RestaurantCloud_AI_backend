<?php

namespace App\Console\Commands;

use App\Domains\Eventos\Jobs\EntregarEventoJob;
use App\Domains\Eventos\Services\PausaDeDestinos;
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

        // Un destino en pausa (no responde) no recibe envíos hasta que venza: encolarlos solo llenaría la cola.
        $pausados = app(PausaDeDestinos::class)->destinosPausados();
        $excluirPausados = $pausados === [] ? '' : 'AND destino NOT IN ('.implode(',', array_fill(0, count($pausados), '?')).')';

        // Reserva y lee en una sola sentencia: dos despachos simultáneos no encolan la misma entrega,
        // y una entrega encolada no se vuelve a encolar hasta que venza su reserva.
        $entregas = DB::select(
            <<<SQL
                UPDATE outbox_entrega
                   SET proximo_intento_en = NOW() + make_interval(secs => ?)
                 WHERE id IN (
                       SELECT id
                         FROM outbox_entrega
                        WHERE estado = 'pendiente'
                          AND proximo_intento_en <= NOW()
                          {$excluirPausados}
                        ORDER BY proximo_intento_en
                        LIMIT ?
                          FOR UPDATE SKIP LOCKED
                 )
             RETURNING id
            SQL,
            [$reservaSegundos, ...$pausados, $limite],
        );

        foreach ($entregas as $entrega) {
            EntregarEventoJob::dispatch($entrega->id);
        }

        $this->info('Entregas de eventos enviadas a Redis: '.count($entregas));

        return self::SUCCESS;
    }
}
