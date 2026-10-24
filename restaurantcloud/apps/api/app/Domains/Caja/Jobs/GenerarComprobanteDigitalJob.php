<?php

namespace App\Domains\Caja\Jobs;

use App\Domains\Caja\Services\ComprobanteDigitalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Throwable;

class GenerarComprobanteDigitalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public string $outboxEventId,
    ) {
        $this->onQueue('documentos');
    }

    public function handle(ComprobanteDigitalService $service): void
    {
        $event = DB::transaction(function () {
            $event = DB::table('outbox_event')
                ->where('id', $this->outboxEventId)
                ->lockForUpdate()
                ->first();

            if (! $event || in_array($event->estado, ['procesado', 'procesando'], true)) {
                return null;
            }

            DB::table('outbox_event')->where('id', $event->id)->update([
                'estado' => 'procesando',
                'intentos' => $event->intentos + 1,
                'ultimo_error' => null,
                'updated_at' => now(),
            ]);

            return $event;
        });

        if (! $event) {
            return;
        }

        $payload = json_decode($event->payload, true) ?: [];

        try {
            $service->generarPdf($event->agregado_id, $payload['creado_por'] ?? null);

            DB::table('outbox_event')->where('id', $event->id)->update([
                'estado' => 'procesado',
                'procesado_at' => now(),
                'ultimo_error' => null,
                'updated_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $this->marcarFallo($event->id, $exception->getMessage());

            throw $exception;
        }
    }

    public function failed(Throwable $exception): void
    {
        $this->marcarFallo($this->outboxEventId, $exception->getMessage());
    }

    private function marcarFallo(string $eventId, string $error): void
    {
        DB::table('outbox_event')->where('id', $eventId)->update([
            'estado' => 'fallido',
            'ultimo_error' => mb_substr($error, 0, 2000),
            'disponible_desde' => now()->addMinutes(5),
            'updated_at' => now(),
        ]);
    }
}
