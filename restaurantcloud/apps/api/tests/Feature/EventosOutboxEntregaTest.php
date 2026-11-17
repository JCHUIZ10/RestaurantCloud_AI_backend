<?php

namespace Tests\Feature;

use App\Domains\Eventos\Jobs\EntregarEventoJob;
use App\Domains\Eventos\Services\PublicadorEventos;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Entrega de los eventos del outbox a los microservicios: firma, reintentos y despacho periódico.
 */
class EventosOutboxEntregaTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        config([
            'eventos.destinos.ms-analitica' => ['url' => 'http://analitica.test/', 'secreto' => 'secreto-analitica'],
            'eventos.destinos.ms-notificaciones' => ['url' => 'http://notificaciones.test', 'secreto' => 'secreto-notificaciones'],
        ]);
    }

    private function publicar(string $tipo = 'venta.registrada'): string
    {
        return app(PublicadorEventos::class)->publicar(
            $tipo,
            $this->empresaId,
            $this->localId,
            'comprobante',
            (string) Str::uuid(),
            ['total' => 75.00, 'mozo_nombre' => 'Lucía Paredes'],
        );
    }

    private function entrega(string $eventoId, string $destino = 'ms-analitica'): object
    {
        return DB::table('outbox_entrega')->where('evento_id', $eventoId)->where('destino', $destino)->first();
    }

    private function entregar(string $entregaId): void
    {
        (new EntregarEventoJob($entregaId))->handle();
    }

    public function test_una_respuesta_2xx_marca_la_entrega_y_el_evento_como_entregados_con_la_firma_del_contrato(): void
    {
        Http::fake(['analitica.test/*' => Http::response(null, 202)]);
        $eventoId = $this->publicar();
        $entrega = $this->entrega($eventoId);

        $this->entregar($entrega->id);

        Http::assertSent(function (Request $request) use ($eventoId): bool {
            $timestamp = $request->header('X-Timestamp')[0];
            $firmaEsperada = hash_hmac('sha256', $timestamp.'.'.$request->body(), 'secreto-analitica');

            return $request->url() === 'http://analitica.test/interno/eventos'
                && $request->method() === 'POST'
                && $request->header('Content-Type')[0] === 'application/json'
                && abs((int) $timestamp - now()->timestamp) <= 5
                && hash_equals($firmaEsperada, $request->header('X-Firma')[0])
                && $request['id'] === $eventoId
                && $request['tipo'] === 'venta.registrada'
                && $request['datos']['mozo_nombre'] === 'Lucía Paredes';
        });

        $entrega = $this->entrega($eventoId);
        $this->assertSame('entregado', $entrega->estado);
        $this->assertSame(1, $entrega->intentos);
        $this->assertNotNull($entrega->entregado_en);
        $this->assertSame('procesado', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_un_duplicado_respondido_con_200_tambien_cuenta_como_entregado(): void
    {
        Http::fake(['analitica.test/*' => Http::response(['estado' => 'duplicado'], 200)]);
        $eventoId = $this->publicar();

        $this->entregar($this->entrega($eventoId)->id);

        $this->assertSame('entregado', $this->entrega($eventoId)->estado);
    }

    public function test_un_error_del_destino_reprograma_la_entrega_con_espera_creciente(): void
    {
        Http::fake(['analitica.test/*' => Http::response('caido', 503)]);
        $eventoId = $this->publicar();
        $entregaId = $this->entrega($eventoId)->id;

        $this->entregar($entregaId);

        $entrega = $this->entrega($eventoId);
        $this->assertSame('pendiente', $entrega->estado);
        $this->assertSame(1, $entrega->intentos);
        $this->assertStringContainsString('HTTP 503', $entrega->ultimo_error);
        $this->assertEqualsWithDelta(now()->addMinute()->timestamp, strtotime($entrega->proximo_intento_en), 5);

        $this->entregar($entregaId);

        $entrega = $this->entrega($eventoId);
        $this->assertSame(2, $entrega->intentos);
        $this->assertEqualsWithDelta(now()->addMinutes(2)->timestamp, strtotime($entrega->proximo_intento_en), 5);
        $this->assertSame('pendiente', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_un_destino_que_no_responde_cuenta_como_fallo(): void
    {
        Http::fake(fn () => throw new ConnectionException('Connection timed out after 5000 milliseconds'));
        $eventoId = $this->publicar();

        $this->entregar($this->entrega($eventoId)->id);

        $entrega = $this->entrega($eventoId);
        $this->assertSame('pendiente', $entrega->estado);
        $this->assertSame(1, $entrega->intentos);
        $this->assertStringContainsString('timed out', $entrega->ultimo_error);
    }

    public function test_al_agotar_los_intentos_la_entrega_y_el_evento_quedan_fallidos(): void
    {
        Http::fake(['analitica.test/*' => Http::response(null, 500)]);
        $eventoId = $this->publicar();
        $entregaId = $this->entrega($eventoId)->id;
        DB::table('outbox_entrega')->where('id', $entregaId)->update(['intentos' => 7]);

        $this->entregar($entregaId);

        $this->assertSame('fallido', $this->entrega($eventoId)->estado);
        $this->assertSame(8, $this->entrega($eventoId)->intentos);
        $this->assertSame('fallido', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_cada_destino_se_reintenta_por_separado(): void
    {
        Http::fake([
            'analitica.test/*' => Http::response(null, 202),
            'notificaciones.test/*' => Http::response(null, 500),
        ]);
        $eventoId = $this->publicar('comprobante.anulado');

        $this->entregar($this->entrega($eventoId, 'ms-analitica')->id);
        $this->entregar($this->entrega($eventoId, 'ms-notificaciones')->id);

        $this->assertSame('entregado', $this->entrega($eventoId, 'ms-analitica')->estado);
        $this->assertSame('pendiente', $this->entrega($eventoId, 'ms-notificaciones')->estado);
        $this->assertSame('pendiente', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_una_entrega_ya_entregada_no_se_vuelve_a_enviar(): void
    {
        Http::fake();
        $eventoId = $this->publicar();
        $entregaId = $this->entrega($eventoId)->id;
        DB::table('outbox_entrega')->where('id', $entregaId)->update(['estado' => 'entregado']);

        $this->entregar($entregaId);

        Http::assertNothingSent();
    }

    public function test_el_despacho_encola_solo_las_entregas_vencidas_y_las_reserva(): void
    {
        $vencida = $this->entrega($this->publicar())->id;
        $reservada = $this->entrega($this->publicar())->id;
        $entregada = $this->entrega($this->publicar())->id;
        DB::table('outbox_entrega')->whereIn('id', [$vencida, $entregada])->update(['proximo_intento_en' => now()->subMinute()]);
        DB::table('outbox_entrega')->where('id', $entregada)->update(['estado' => 'entregado']);
        Queue::fake();

        $this->artisan('outbox:despachar-eventos')->assertSuccessful();

        Queue::assertPushedOn('eventos', EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => $job->entregaId === $vencida);
        Queue::assertNotPushed(EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => in_array($job->entregaId, [$reservada, $entregada], true));
        $this->assertTrue(now()->lt(DB::table('outbox_entrega')->where('id', $vencida)->value('proximo_intento_en')));

        // La entrega recién encolada queda reservada: un segundo despacho no la repite.
        Queue::fake();
        $this->artisan('outbox:despachar-eventos')->assertSuccessful();
        Queue::assertNotPushed(EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => $job->entregaId === $vencida);
    }
}
