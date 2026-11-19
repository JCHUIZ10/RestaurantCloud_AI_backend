<?php

namespace App\Domains\Eventos\Services;

use App\Domains\Eventos\Jobs\EntregarEventoJob;
use App\Support\Identificador;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Registra en el outbox los eventos que el núcleo envía a los microservicios
 * (doc-2u/servicios/README.md, sección 4, y eventos.md).
 *
 * Se llama dentro de la transacción del negocio: el evento y sus entregas se guardan o se descartan
 * junto con el hecho que los origina. No hace llamadas de red; el envío lo hace EntregarEventoJob,
 * encolado al confirmar la transacción y, si eso falla, por el comando outbox:despachar-eventos.
 */
class PublicadorEventos
{
    public const VERSION = 1;

    public const ORIGEN = 'nucleo';

    /**
     * Guarda el evento con su sobre completo y una entrega por cada destino configurado.
     *
     * @param  array<string, mixed>  $datos
     * @return string Identificador del evento
     */
    public function publicar(
        string $tipo,
        string $empresaId,
        ?string $localId,
        string $agregadoTipo,
        string $agregadoId,
        array $datos,
        ?CarbonInterface $ocurridoEn = null,
    ): string {
        $eventoId = Identificador::ordenado();
        $ahora = now();
        $destinos = $this->destinosDe($tipo);

        $sobre = [
            'id' => $eventoId,
            'tipo' => $tipo,
            'version' => self::VERSION,
            'ocurrido_en' => ($ocurridoEn ?? $ahora)->copy()->setTimezone(config('app.timezone'))->toIso8601String(),
            'origen' => self::ORIGEN,
            'empresa_id' => $empresaId,
            'local_id' => $localId,
            'datos' => $datos,
        ];

        // Sin destinos el evento queda solo como registro del hecho.
        DB::table('outbox_event')->insert([
            'id' => $eventoId,
            'empresa_id' => $empresaId,
            'local_id' => $localId,
            'agregado_tipo' => $agregadoTipo,
            'agregado_id' => $agregadoId,
            'tipo_evento' => $tipo,
            'payload' => json_encode($sobre, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'estado' => $destinos === [] ? 'procesado' : 'pendiente',
            'disponible_desde' => $ahora,
            'procesado_at' => $destinos === [] ? $ahora : null,
            'created_at' => $ahora,
            'updated_at' => $ahora,
        ]);

        if ($destinos === []) {
            return $eventoId;
        }

        // La entrega nace reservada: la encola el commit y el despacho periódico solo la recoge si eso falla.
        $reservadaHasta = $ahora->copy()->addSeconds((int) config('eventos.reserva_segundos'));
        $entregas = array_map(fn (string $destino): array => [
            'id' => Identificador::ordenado(),
            'evento_id' => $eventoId,
            'destino' => $destino,
            'estado' => 'pendiente',
            'intentos' => 0,
            'proximo_intento_en' => $reservadaHasta,
            'created_at' => $ahora,
        ], $destinos);

        DB::table('outbox_entrega')->insert($entregas);

        $entregaIds = array_column($entregas, 'id');
        DB::afterCommit(function () use ($entregaIds): void {
            foreach ($entregaIds as $entregaId) {
                try {
                    EntregarEventoJob::dispatch($entregaId);
                } catch (Throwable $exception) {
                    // El negocio ya se confirmó: la entrega queda para el despacho periódico.
                    Log::warning('No se pudo encolar la entrega de un evento', [
                        'entrega_id' => $entregaId,
                        'error' => $exception->getMessage(),
                    ]);
                }
            }
        });

        return $eventoId;
    }

    /**
     * Destinos suscritos al tipo de evento que tienen URL y secreto configurados.
     *
     * @return list<string>
     */
    public function destinosDe(string $tipo): array
    {
        // El tipo lleva puntos (venta.registrada), así que no se puede leer con la notación de config().
        $suscritos = config('eventos.suscripciones', [])[$tipo] ?? [];

        return array_values(array_filter(
            $suscritos,
            fn (string $destino): bool => filled(config("eventos.destinos.{$destino}.url"))
                && filled(config("eventos.destinos.{$destino}.secreto")),
        ));
    }
}
