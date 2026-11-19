<?php

namespace App\Console\Commands;

use App\Domains\Eventos\Services\PausaDeDestinos;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class EstadoDeEventos extends Command
{
    protected $signature = 'outbox:estado';

    protected $description = 'Muestra, por destino, cuántas entregas de eventos esperan, cuántas fallaron y si el destino está en pausa.';

    public function handle(PausaDeDestinos $pausa): int
    {
        $filas = DB::table('outbox_entrega as oe')
            ->join('outbox_event as ev', 'ev.id', '=', 'oe.evento_id')
            ->whereIn('oe.estado', ['pendiente', 'fallido'])
            ->groupBy('oe.destino')
            ->selectRaw(<<<'SQL'
                oe.destino,
                count(*) FILTER (WHERE oe.estado = 'pendiente') AS pendientes,
                count(*) FILTER (WHERE oe.estado = 'pendiente' AND oe.intentos > 0) AS reintentando,
                count(*) FILTER (WHERE oe.estado = 'fallido') AS fallidos,
                count(*) FILTER (WHERE oe.estado = 'fallido' AND oe.motivo_fallo = 'rechazado') AS rechazados,
                min(ev.created_at) FILTER (WHERE oe.estado = 'pendiente') AS pendiente_mas_antigua,
                min(ev.created_at) FILTER (WHERE oe.estado = 'fallido') AS fallido_mas_antigua
            SQL)
            ->get()
            ->keyBy('destino');

        $destinos = array_keys(config('eventos.destinos', []));
        $this->table(
            ['Destino', 'Pendientes', 'Reintentando', 'Fallidos', 'Rechazados (422)', 'Pendiente más antigua', 'Fallido más antiguo', 'Estado'],
            array_map(function (string $destino) use ($filas, $pausa): array {
                $fila = $filas->get($destino);

                return [
                    $destino,
                    $fila->pendientes ?? 0,
                    $fila->reintentando ?? 0,
                    $fila->fallidos ?? 0,
                    $fila->rechazados ?? 0,
                    $this->antiguedad($fila->pendiente_mas_antigua ?? null),
                    $this->antiguedad($fila->fallido_mas_antigua ?? null),
                    $this->estadoDe($destino, $pausa),
                ];
            }, $destinos),
        );

        $detalle = DB::table('outbox_entrega as oe')
            ->join('outbox_event as ev', 'ev.id', '=', 'oe.evento_id')
            ->where('oe.estado', 'fallido')
            ->groupBy('oe.destino', 'oe.motivo_fallo', 'ev.tipo_evento')
            ->orderBy('oe.destino')
            ->selectRaw('oe.destino, oe.motivo_fallo, ev.tipo_evento, count(*) AS total')
            ->get();

        if ($detalle->isNotEmpty()) {
            $this->newLine();
            $this->line('Fallidos por motivo (revisar y reenviar con outbox:reenviar-eventos --dry-run):');
            $this->table(
                ['Destino', 'Motivo', 'Tipo de evento', 'Entregas'],
                $detalle->map(fn (object $fila): array => [$fila->destino, $fila->motivo_fallo ?? '(sin clasificar)', $fila->tipo_evento, $fila->total])->all(),
            );
        }

        return self::SUCCESS;
    }

    private function antiguedad(?string $fecha): string
    {
        return $fecha ? Carbon::parse($fecha)->diffForHumans() : '-';
    }

    private function estadoDe(string $destino, PausaDeDestinos $pausa): string
    {
        if ($pausa->estaPausado($destino)) {
            return 'en pausa hasta '.$pausa->pausadoHasta($destino)->format('H:i');
        }

        return $pausa->degradado($destino) ? 'probando' : 'normal';
    }
}
