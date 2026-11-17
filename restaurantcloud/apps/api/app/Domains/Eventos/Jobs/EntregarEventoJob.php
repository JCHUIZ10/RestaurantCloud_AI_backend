<?php

namespace App\Domains\Eventos\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Envía un evento del outbox a un microservicio (`POST {url}/interno/eventos`).
 *
 * El cuerpo se firma con HMAC-SHA256 de `timestamp.cuerpo` y el secreto del destino
 * (cabeceras X-Timestamp y X-Firma). Una respuesta 2xx marca la entrega como entregada;
 * cualquier otro resultado la reprograma con espera creciente hasta agotar los intentos.
 * Los reintentos los lleva outbox_entrega, no la cola.
 */
class EntregarEventoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(
        public string $entregaId,
    ) {
        $this->onQueue('eventos');
    }

    public function handle(): void
    {
        $entrega = DB::table('outbox_entrega as oe')
            ->join('outbox_event as ev', 'ev.id', '=', 'oe.evento_id')
            ->where('oe.id', $this->entregaId)
            ->select(['oe.id', 'oe.evento_id', 'oe.destino', 'oe.estado', 'oe.intentos', 'ev.payload'])
            ->first();

        if (! $entrega || $entrega->estado !== 'pendiente') {
            return;
        }

        $destino = config("eventos.destinos.{$entrega->destino}");
        if (blank($destino['url'] ?? null) || blank($destino['secreto'] ?? null)) {
            $this->registrarFallo($entrega, "El destino {$entrega->destino} no tiene URL o secreto configurado.");

            return;
        }

        $cuerpo = json_encode(json_decode($entrega->payload, true), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $timestamp = (string) now()->timestamp;

        try {
            $respuesta = Http::timeout((int) config('eventos.timeout_segundos'))
                ->withHeaders([
                    'X-Timestamp' => $timestamp,
                    'X-Firma' => self::firmar($timestamp, $cuerpo, $destino['secreto']),
                ])
                ->withBody($cuerpo, 'application/json')
                ->post(rtrim($destino['url'], '/').'/interno/eventos');
        } catch (Throwable $exception) {
            $this->registrarFallo($entrega, $exception->getMessage());

            return;
        }

        if (! $respuesta->successful()) {
            $this->registrarFallo($entrega, "HTTP {$respuesta->status()}: ".mb_substr($respuesta->body(), 0, 500));

            return;
        }

        DB::transaction(function () use ($entrega): void {
            DB::table('outbox_entrega')->where('id', $entrega->id)->update([
                'estado' => 'entregado',
                'intentos' => $entrega->intentos + 1,
                'ultimo_error' => null,
                'entregado_en' => now(),
            ]);

            $this->cerrarEventoSiTermino($entrega->evento_id);
        });
    }

    /**
     * Firma de una petición servidor a servidor (doc-2u/servicios/README.md).
     */
    public static function firmar(string $timestamp, string $cuerpo, string $secreto): string
    {
        return hash_hmac('sha256', "{$timestamp}.{$cuerpo}", $secreto);
    }

    private function registrarFallo(object $entrega, string $error): void
    {
        $intentos = $entrega->intentos + 1;
        $agotado = $intentos >= (int) config('eventos.max_intentos');

        // Espera creciente: 1, 2, 4, 8… minutos, con un tope.
        $esperaMin = min(2 ** ($intentos - 1), (int) config('eventos.espera_maxima_min'));

        DB::transaction(function () use ($entrega, $error, $intentos, $agotado, $esperaMin): void {
            DB::table('outbox_entrega')->where('id', $entrega->id)->update([
                'estado' => $agotado ? 'fallido' : 'pendiente',
                'intentos' => $intentos,
                'proximo_intento_en' => now()->addMinutes($esperaMin),
                'ultimo_error' => mb_substr($error, 0, 2000),
            ]);

            if ($agotado) {
                $this->cerrarEventoSiTermino($entrega->evento_id);
            }
        });
    }

    /**
     * Cuando ningún destino sigue pendiente, el evento queda procesado si todos lo recibieron
     * o fallido si alguno agotó sus intentos.
     */
    private function cerrarEventoSiTermino(string $eventoId): void
    {
        $estados = DB::table('outbox_entrega')->where('evento_id', $eventoId)->pluck('estado');

        if ($estados->contains('pendiente')) {
            return;
        }

        $fallido = $estados->contains('fallido');

        DB::table('outbox_event')->where('id', $eventoId)->update([
            'estado' => $fallido ? 'fallido' : 'procesado',
            'procesado_at' => $fallido ? null : now(),
            'ultimo_error' => $fallido ? 'Uno o más destinos agotaron sus intentos.' : null,
            'updated_at' => now(),
        ]);
    }
}
