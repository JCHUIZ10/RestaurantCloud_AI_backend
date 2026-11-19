<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class ReenviarEventosFallidos extends Command
{
    protected $signature = 'outbox:reenviar-eventos
        {--destino= : Destino al que reenviar (ms-analitica, ms-notificaciones). Obligatorio}
        {--desde= : Solo eventos ocurridos desde este día (YYYY-MM-DD)}
        {--hasta= : Solo eventos ocurridos hasta este día, incluido (YYYY-MM-DD)}
        {--tipo= : Solo este tipo de evento (por ejemplo venta.registrada)}
        {--incluir-rechazados : Incluye las entregas que el destino rechazó con 422}
        {--dry-run : Muestra qué se reenviaría sin cambiar nada}
        {--forzar : Reenvía aunque el destino no responda a /health}';

    protected $description = 'Devuelve a pendiente las entregas fallidas de un destino para que se envíen de nuevo, de la más antigua a la más reciente.';

    public function handle(): int
    {
        $destino = (string) $this->option('destino');
        if ($destino === '' || ! array_key_exists($destino, config('eventos.destinos', []))) {
            $this->error('Indique un destino válido con --destino. Disponibles: '.implode(', ', array_keys(config('eventos.destinos', []))));

            return self::FAILURE;
        }

        try {
            $desde = $this->option('desde') ? Carbon::parse($this->option('desde'), config('app.timezone'))->startOfDay() : null;
            $hasta = $this->option('hasta') ? Carbon::parse($this->option('hasta'), config('app.timezone'))->endOfDay() : null;
        } catch (Throwable) {
            $this->error('Las fechas deben tener el formato YYYY-MM-DD.');

            return self::FAILURE;
        }

        $fallidas = $this->fallidas($destino, $desde, $hasta);

        $resumen = (clone $fallidas)
            ->selectRaw('ev.tipo_evento, oe.motivo_fallo, count(*) as total, min(ev.created_at) as primero, max(ev.created_at) as ultimo')
            ->groupBy('ev.tipo_evento', 'oe.motivo_fallo')
            ->orderBy('ev.tipo_evento')
            ->get();

        if ($resumen->isEmpty()) {
            $this->info("No hay entregas fallidas para {$destino} con esos filtros.");

            return self::SUCCESS;
        }

        $this->table(
            ['Tipo de evento', 'Motivo', 'Entregas', 'Evento más antiguo', 'Evento más reciente'],
            $resumen->map(fn (object $fila): array => [
                $fila->tipo_evento,
                $fila->motivo_fallo ?? '(sin clasificar)',
                $fila->total,
                Carbon::parse($fila->primero)->format('Y-m-d H:i'),
                Carbon::parse($fila->ultimo)->format('Y-m-d H:i'),
            ])->all(),
        );
        $total = (int) $resumen->sum('total');

        if ($this->option('dry-run')) {
            $this->info("Simulación: se reenviarían {$total} entregas a {$destino}. No se cambió nada.");

            return self::SUCCESS;
        }

        if (! $this->option('forzar') && ! $this->destinoResponde($destino)) {
            $this->error("{$destino} no responde en /health. Reenviar ahora gastaría intentos en vano; use --forzar para hacerlo igual.");

            return self::FAILURE;
        }

        $reencoladas = $this->reencolar($fallidas);
        $this->info("Entregas devueltas a pendiente: {$reencoladas}. El despacho las enviará de la más antigua a la más reciente.");

        return self::SUCCESS;
    }

    /**
     * Entregas fallidas del destino que cumplen los filtros. Las rechazadas con 422 solo entran si se pide.
     */
    private function fallidas(string $destino, ?Carbon $desde, ?Carbon $hasta): Builder
    {
        return DB::table('outbox_entrega as oe')
            ->join('outbox_event as ev', 'ev.id', '=', 'oe.evento_id')
            ->where('oe.estado', 'fallido')
            ->where('oe.destino', $destino)
            ->when(! $this->option('incluir-rechazados'), fn (Builder $q) => $q->where(
                fn (Builder $q) => $q->whereNull('oe.motivo_fallo')->orWhere('oe.motivo_fallo', '!=', 'rechazado'),
            ))
            ->when($this->option('tipo'), fn (Builder $q, string $tipo) => $q->where('ev.tipo_evento', $tipo))
            ->when($desde, fn (Builder $q, Carbon $fecha) => $q->where('ev.created_at', '>=', $fecha))
            ->when($hasta, fn (Builder $q, Carbon $fecha) => $q->where('ev.created_at', '<=', $fecha));
    }

    private function destinoResponde(string $destino): bool
    {
        $url = config("eventos.destinos.{$destino}.url");
        if (blank($url)) {
            return false;
        }

        try {
            return Http::timeout((int) config('eventos.timeout_segundos'))->get(rtrim($url, '/').'/health')->successful();
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Cada entrega vuelve a pendiente con sus contadores en cero y vence en la fecha de su evento,
     * así el despacho (que ordena por vencimiento) las envía en orden cronológico. El evento se
     * reenvía tal como se guardó: no se reconstruye con los datos de hoy.
     */
    private function reencolar(Builder $fallidas): int
    {
        $ids = (clone $fallidas)->pluck('oe.id')->all();

        DB::transaction(function () use ($ids): void {
            foreach (array_chunk($ids, 1000) as $lote) {
                $marcas = implode(',', array_fill(0, count($lote), '?'));

                DB::update(<<<SQL
                    UPDATE outbox_entrega oe
                       SET estado = 'pendiente', intentos = 0, fallos_receptor = 0, fallando_desde = NULL,
                           proximo_intento_en = ev.created_at, reenvios = oe.reenvios + 1
                      FROM outbox_event ev
                     WHERE ev.id = oe.evento_id AND oe.id IN ({$marcas})
                SQL, $lote);

                DB::update(<<<SQL
                    UPDATE outbox_event
                       SET estado = 'pendiente', procesado_at = NULL, ultimo_error = NULL, updated_at = NOW()
                     WHERE estado = 'fallido'
                       AND id IN (SELECT evento_id FROM outbox_entrega WHERE id IN ({$marcas}))
                SQL, $lote);
            }
        });

        return count($ids);
    }
}
