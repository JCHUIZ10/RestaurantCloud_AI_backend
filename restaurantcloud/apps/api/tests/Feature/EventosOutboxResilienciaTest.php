<?php

namespace Tests\Feature;

use App\Domains\Eventos\Jobs\EntregarEventoJob;
use App\Domains\Eventos\Services\PausaDeDestinos;
use App\Domains\Eventos\Services\PublicadorEventos;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Resiliencia de la entrega de eventos: un destino apagado no pierde eventos, se retiene sin saturar
 * la cola y los fallidos se pueden revisar y reenviar en orden.
 */
class EventosOutboxResilienciaTest extends TestCase
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

    /**
     * Publica un evento cuyo momento y vencimiento se fijan en el pasado, para probar el orden.
     */
    private function publicar(string $tipo = 'venta.registrada', ?CarbonInterface $ocurridoEn = null): string
    {
        $eventoId = app(PublicadorEventos::class)->publicar(
            $tipo,
            $this->empresaId,
            $this->localId,
            'comprobante',
            (string) Str::uuid(),
            ['total' => 75.00],
        );

        $momento = $ocurridoEn ?? now();
        DB::table('outbox_event')->where('id', $eventoId)->update(['created_at' => $momento]);
        DB::table('outbox_entrega')->where('evento_id', $eventoId)->update(['proximo_intento_en' => $momento]);

        return $eventoId;
    }

    private function entrega(string $eventoId, string $destino = 'ms-analitica'): object
    {
        return DB::table('outbox_entrega')->where('evento_id', $eventoId)->where('destino', $destino)->first();
    }

    private function entregar(string $entregaId): void
    {
        (new EntregarEventoJob($entregaId))->handle();
    }

    /**
     * Deja la entrega como fallida, tal como queda tras agotar los intentos.
     */
    private function marcarFallida(string $eventoId, ?string $motivo, string $destino = 'ms-analitica'): void
    {
        DB::table('outbox_entrega')->where('evento_id', $eventoId)->where('destino', $destino)->update([
            'estado' => 'fallido',
            'intentos' => 8,
            'fallos_receptor' => 8,
            'motivo_fallo' => $motivo,
            'ultimo_error' => 'HTTP 500',
        ]);
        DB::table('outbox_event')->where('id', $eventoId)->update(['estado' => 'fallido']);
    }

    // ------------------------------------------------------------------ clasificación de los fallos

    public function test_un_destino_caido_no_gasta_intentos_ni_llega_a_fallido_en_muchos_reintentos(): void
    {
        Http::fake(['analitica.test/*' => Http::response('caido', 503)]);
        $eventoId = $this->publicar();
        $entregaId = $this->entrega($eventoId)->id;

        // Doce intentos, muy por encima del límite de 8 que sí aplica a un destino que responde con errores.
        for ($i = 0; $i < 12; $i++) {
            $this->entregar($entregaId);
            $this->travel(61)->minutes();
        }

        $entrega = $this->entrega($eventoId);
        $this->assertSame('pendiente', $entrega->estado);
        $this->assertSame(12, $entrega->intentos);
        $this->assertSame(0, $entrega->fallos_receptor);
        $this->assertSame('no_disponible', $entrega->motivo_fallo);
        $this->assertSame('pendiente', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_un_destino_caido_por_mas_del_horizonte_pasa_a_fallido(): void
    {
        Http::fake(['analitica.test/*' => Http::response('caido', 503)]);
        $eventoId = $this->publicar();
        $entregaId = $this->entrega($eventoId)->id;

        $this->entregar($entregaId);
        $this->travel(config('eventos.horizonte_dias'))->days();
        $this->travel(1)->hours();
        $this->entregar($entregaId);

        $entrega = $this->entrega($eventoId);
        $this->assertSame('fallido', $entrega->estado);
        $this->assertSame('no_disponible', $entrega->motivo_fallo);
        $this->assertSame('fallido', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_un_destino_caido_justo_antes_del_horizonte_sigue_pendiente(): void
    {
        Http::fake(['analitica.test/*' => Http::response('caido', 503)]);
        $eventoId = $this->publicar();
        $entregaId = $this->entrega($eventoId)->id;

        $this->entregar($entregaId);
        $this->travel(config('eventos.horizonte_dias') * 24 - 2)->hours();
        $this->entregar($entregaId);

        $this->assertSame('pendiente', $this->entrega($eventoId)->estado);
    }

    public function test_un_401_se_trata_como_destino_mal_configurado_y_no_gasta_intentos(): void
    {
        Http::fake(['analitica.test/*' => Http::response('firma', 401)]);
        $eventoId = $this->publicar();

        $this->entregar($this->entrega($eventoId)->id);

        $entrega = $this->entrega($eventoId);
        $this->assertSame('pendiente', $entrega->estado);
        $this->assertSame('no_autorizado', $entrega->motivo_fallo);
        $this->assertSame(0, $entrega->fallos_receptor);
        $this->assertTrue(app(PausaDeDestinos::class)->estaPausado('ms-analitica'));
    }

    public function test_un_destino_sin_url_configurada_espera_sin_gastar_intentos(): void
    {
        $eventoId = $this->publicar();
        config(['eventos.destinos.ms-analitica.url' => null]);

        $this->entregar($this->entrega($eventoId)->id);

        $entrega = $this->entrega($eventoId);
        $this->assertSame('pendiente', $entrega->estado);
        $this->assertSame('sin_configurar', $entrega->motivo_fallo);
        $this->assertSame(0, $entrega->fallos_receptor);
    }

    public function test_un_error_500_cuenta_contra_el_limite_y_no_pausa_el_destino(): void
    {
        Http::fake(['analitica.test/*' => Http::response('boom', 500)]);
        $eventoId = $this->publicar();

        $this->entregar($this->entrega($eventoId)->id);

        $entrega = $this->entrega($eventoId);
        $this->assertSame('pendiente', $entrega->estado);
        $this->assertSame('error_receptor', $entrega->motivo_fallo);
        $this->assertSame(1, $entrega->fallos_receptor);
        $this->assertFalse(app(PausaDeDestinos::class)->estaPausado('ms-analitica'));
    }

    public function test_un_422_queda_clasificado_como_rechazado(): void
    {
        Http::fake(['analitica.test/*' => Http::response('{"errores":[]}', 422)]);
        $eventoId = $this->publicar();

        $this->entregar($this->entrega($eventoId)->id);

        $this->assertSame('rechazado', $this->entrega($eventoId)->motivo_fallo);
        $this->assertFalse(app(PausaDeDestinos::class)->estaPausado('ms-analitica'));
    }

    // ------------------------------------------------------------------ pausa por destino

    public function test_con_el_destino_en_pausa_no_se_envia_nada_ni_se_gasta_un_intento(): void
    {
        Http::fake(['analitica.test/*' => Http::response('caido', 503)]);
        $primero = $this->publicar();
        $segundo = $this->publicar();

        $this->entregar($this->entrega($primero)->id);
        $this->entregar($this->entrega($segundo)->id);

        Http::assertSentCount(1);
        $entrega = $this->entrega($segundo);
        $this->assertSame(0, $entrega->intentos);
        $this->assertNull($entrega->motivo_fallo);
        $this->assertEqualsWithDelta(
            app(PausaDeDestinos::class)->pausadoHasta('ms-analitica')->timestamp,
            strtotime($entrega->proximo_intento_en),
            2,
        );
    }

    public function test_la_pausa_de_un_destino_no_afecta_a_los_demas(): void
    {
        Http::fake([
            'analitica.test/*' => Http::response('caido', 503),
            'notificaciones.test/*' => Http::response(null, 202),
        ]);
        $eventoId = $this->publicar('comprobante.anulado');

        $this->entregar($this->entrega($eventoId, 'ms-analitica')->id);
        $this->entregar($this->entrega($eventoId, 'ms-notificaciones')->id);

        $this->assertSame('entregado', $this->entrega($eventoId, 'ms-notificaciones')->estado);
    }

    public function test_al_vencer_la_pausa_solo_sale_una_entrega_de_prueba_a_la_vez(): void
    {
        $primero = $this->publicar();
        $segundo = $this->publicar();
        $tercero = $this->publicar();
        app(PausaDeDestinos::class)->pausar('ms-analitica', 1);
        $this->travel(2)->minutes();

        // Mientras la primera está en vuelo, otra entrega intenta salir: debe quedar retenida.
        $enviadas = 0;
        Http::fake(function (Request $request) use ($segundo, &$enviadas) {
            $enviadas++;
            if ($enviadas === 1) {
                $this->entregar($this->entrega($segundo)->id);
            }

            return Http::response(null, 202);
        });

        $this->entregar($this->entrega($primero)->id);

        $this->assertSame(1, $enviadas, 'La segunda entrega no debió enviarse mientras la sonda estaba en vuelo.');
        $this->assertSame('pendiente', $this->entrega($segundo)->estado);
        $this->assertSame(0, $this->entrega($segundo)->intentos);
        $this->assertSame('entregado', $this->entrega($primero)->estado);

        // La sonda tuvo éxito: el destino quedó reanudado y el siguiente envío sale con normalidad.
        $this->entregar($this->entrega($tercero)->id);
        $this->assertSame('entregado', $this->entrega($tercero)->estado);
        $this->assertSame(2, $enviadas);
    }

    public function test_si_la_prueba_falla_la_pausa_se_renueva_y_nadie_mas_intenta(): void
    {
        $primero = $this->publicar();
        $segundo = $this->publicar();
        app(PausaDeDestinos::class)->pausar('ms-analitica', 1);
        $this->travel(2)->minutes();
        Http::fake(['analitica.test/*' => Http::response('caido', 503)]);

        $this->entregar($this->entrega($primero)->id);
        $this->entregar($this->entrega($segundo)->id);

        Http::assertSentCount(1);
        $this->assertTrue(app(PausaDeDestinos::class)->estaPausado('ms-analitica'));
    }

    public function test_al_volver_el_destino_se_adelantan_las_entregas_retenidas_en_orden_cronologico(): void
    {
        $reciente = $this->publicar('venta.registrada', now()->subDay());
        $antiguo = $this->publicar('venta.registrada', now()->subDays(3));
        $medio = $this->publicar('venta.registrada', now()->subDays(2));
        $conError = $this->publicar('venta.registrada', now()->subDays(4));
        $prueba = $this->publicar();

        $esperando = now()->addMinutes(40);
        foreach ([$reciente, $antiguo, $medio] as $eventoId) {
            DB::table('outbox_entrega')->where('evento_id', $eventoId)->update([
                'intentos' => 3, 'motivo_fallo' => 'no_disponible', 'proximo_intento_en' => $esperando,
            ]);
        }
        // Una entrega que espera por un error propio del evento no se adelanta.
        DB::table('outbox_entrega')->where('evento_id', $conError)->update([
            'intentos' => 3, 'motivo_fallo' => 'error_receptor', 'proximo_intento_en' => $esperando,
        ]);

        app(PausaDeDestinos::class)->pausar('ms-analitica', 1);
        $this->travel(2)->minutes();
        Http::fake(['analitica.test/*' => Http::response(null, 202)]);

        $this->entregar($this->entrega($prueba)->id);

        $vence = fn (string $eventoId): int => strtotime($this->entrega($eventoId)->proximo_intento_en);
        $creado = fn (string $eventoId): int => strtotime(DB::table('outbox_event')->where('id', $eventoId)->value('created_at'));

        foreach ([$reciente, $antiguo, $medio] as $eventoId) {
            $this->assertSame($creado($eventoId), $vence($eventoId));
        }
        $this->assertLessThan($vence($medio), $vence($antiguo));
        $this->assertLessThan($vence($reciente), $vence($medio));
        $this->assertEqualsWithDelta($esperando->timestamp, $vence($conError), 2);
        $this->assertFalse(app(PausaDeDestinos::class)->degradado('ms-analitica'));
    }

    public function test_el_despacho_no_encola_entregas_de_un_destino_en_pausa(): void
    {
        $eventoId = $this->publicar('comprobante.anulado');
        app(PausaDeDestinos::class)->pausar('ms-analitica', 10);
        Queue::fake();

        $this->artisan('outbox:despachar-eventos')->assertSuccessful();

        $analitica = $this->entrega($eventoId, 'ms-analitica')->id;
        $notificaciones = $this->entrega($eventoId, 'ms-notificaciones')->id;
        Queue::assertPushed(EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => $job->entregaId === $notificaciones);
        Queue::assertNotPushed(EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => $job->entregaId === $analitica);
    }

    // ------------------------------------------------------------------ outbox:reenviar-eventos

    public function test_reenviar_exige_un_destino_valido(): void
    {
        $this->artisan('outbox:reenviar-eventos')->assertFailed();
        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-inexistente'])->assertFailed();
    }

    public function test_la_simulacion_muestra_lo_que_reenviaria_sin_cambiar_nada(): void
    {
        $eventoId = $this->publicar('venta.registrada', now()->subDays(3));
        $this->marcarFallida($eventoId, 'no_disponible');

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica', '--dry-run' => true])
            ->expectsOutputToContain('Simulación: se reenviarían 1 entregas')
            ->assertSuccessful();

        $this->assertSame('fallido', $this->entrega($eventoId)->estado);
        $this->assertSame('fallido', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    public function test_reenviar_devuelve_los_fallidos_a_pendiente_en_orden_cronologico(): void
    {
        Http::fake(['analitica.test/health' => Http::response(['exito' => true], 200)]);
        $antiguo = $this->publicar('venta.registrada', now()->subDays(20));
        $reciente = $this->publicar('venta.registrada', now()->subDays(2));
        $this->marcarFallida($antiguo, 'no_disponible');
        $this->marcarFallida($reciente, 'error_receptor');

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica'])->assertSuccessful();

        foreach ([$antiguo, $reciente] as $eventoId) {
            $entrega = $this->entrega($eventoId);
            $this->assertSame('pendiente', $entrega->estado);
            $this->assertSame(0, $entrega->intentos);
            $this->assertSame(0, $entrega->fallos_receptor);
            $this->assertNull($entrega->fallando_desde);
            $this->assertSame(1, $entrega->reenvios);
            $this->assertNotNull($entrega->ultimo_error, 'El último error se conserva para el historial.');
            $this->assertSame('pendiente', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
            $this->assertSame(
                strtotime(DB::table('outbox_event')->where('id', $eventoId)->value('created_at')),
                strtotime($entrega->proximo_intento_en),
            );
        }

        // El despacho las encola de la más antigua a la más reciente.
        Queue::fake();
        $this->artisan('outbox:despachar-eventos', ['--limite' => 1])->assertSuccessful();
        Queue::assertPushed(EntregarEventoJob::class, 1);
        Queue::assertPushed(EntregarEventoJob::class, fn (EntregarEventoJob $job): bool => $job->entregaId === $this->entrega($antiguo)->id);
    }

    public function test_reenviar_no_incluye_los_rechazados_con_422_salvo_que_se_pida(): void
    {
        Http::fake(['analitica.test/health' => Http::response(null, 200)]);
        $rechazado = $this->publicar();
        $roto = $this->publicar();
        $this->marcarFallida($rechazado, 'rechazado');
        $this->marcarFallida($roto, 'error_receptor');

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica'])->assertSuccessful();

        $this->assertSame('fallido', $this->entrega($rechazado)->estado);
        $this->assertSame('pendiente', $this->entrega($roto)->estado);

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica', '--incluir-rechazados' => true])->assertSuccessful();

        $this->assertSame('pendiente', $this->entrega($rechazado)->estado);
    }

    public function test_reenviar_incluye_los_fallidos_anteriores_a_la_clasificacion(): void
    {
        Http::fake(['analitica.test/health' => Http::response(null, 200)]);
        $eventoId = $this->publicar();
        $this->marcarFallida($eventoId, null);

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica'])->assertSuccessful();

        $this->assertSame('pendiente', $this->entrega($eventoId)->estado);
    }

    public function test_reenviar_respeta_los_filtros_de_tipo_y_de_fechas(): void
    {
        Http::fake(['analitica.test/health' => Http::response(null, 200)]);
        $venta = $this->publicar('venta.registrada', now()->subDays(10));
        $anulacion = $this->publicar('comprobante.anulado', now()->subDays(10));
        $ventaReciente = $this->publicar('venta.registrada', now()->subDay());
        foreach ([$venta, $anulacion, $ventaReciente] as $eventoId) {
            $this->marcarFallida($eventoId, 'no_disponible');
        }

        $this->artisan('outbox:reenviar-eventos', [
            '--destino' => 'ms-analitica',
            '--tipo' => 'venta.registrada',
            '--hasta' => now()->subDays(5)->toDateString(),
        ])->assertSuccessful();

        $this->assertSame('pendiente', $this->entrega($venta)->estado);
        $this->assertSame('fallido', $this->entrega($anulacion)->estado, 'Otro tipo de evento.');
        $this->assertSame('fallido', $this->entrega($ventaReciente)->estado, 'Posterior a --hasta.');

        $this->artisan('outbox:reenviar-eventos', [
            '--destino' => 'ms-analitica',
            '--desde' => now()->subDays(3)->toDateString(),
        ])->assertSuccessful();

        $this->assertSame('pendiente', $this->entrega($ventaReciente)->estado);
        $this->assertSame('fallido', $this->entrega($anulacion)->estado, 'Anterior a --desde.');
    }

    public function test_reenviar_se_niega_si_el_destino_no_responde_salvo_que_se_fuerce(): void
    {
        Http::fake(['analitica.test/health' => Http::response('caido', 503)]);
        $eventoId = $this->publicar();
        $this->marcarFallida($eventoId, 'no_disponible');

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica'])->assertFailed();
        $this->assertSame('fallido', $this->entrega($eventoId)->estado);

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica', '--forzar' => true])->assertSuccessful();
        $this->assertSame('pendiente', $this->entrega($eventoId)->estado);
    }

    public function test_un_evento_con_otro_destino_fallido_sigue_fallido_tras_reenviar_a_uno(): void
    {
        Http::fake([
            'analitica.test/*' => Http::response(null, 202),
        ]);
        $eventoId = $this->publicar('comprobante.anulado');
        $this->marcarFallida($eventoId, 'no_disponible', 'ms-analitica');
        $this->marcarFallida($eventoId, 'rechazado', 'ms-notificaciones');

        $this->artisan('outbox:reenviar-eventos', ['--destino' => 'ms-analitica'])->assertSuccessful();
        $this->assertSame('pendiente', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));

        $this->entregar($this->entrega($eventoId, 'ms-analitica')->id);

        $this->assertSame('entregado', $this->entrega($eventoId, 'ms-analitica')->estado);
        $this->assertSame('fallido', $this->entrega($eventoId, 'ms-notificaciones')->estado);
        $this->assertSame('fallido', DB::table('outbox_event')->where('id', $eventoId)->value('estado'));
    }

    // ------------------------------------------------------------------ outbox:estado

    public function test_el_estado_resume_pendientes_fallidos_y_pausa_por_destino(): void
    {
        $esperando = $this->publicar();
        DB::table('outbox_entrega')->where('evento_id', $esperando)->update(['intentos' => 2, 'motivo_fallo' => 'no_disponible']);
        $fallido = $this->publicar('venta.registrada', now()->subDays(4));
        $this->marcarFallida($fallido, 'error_receptor');
        app(PausaDeDestinos::class)->pausar('ms-analitica', 30);

        $this->assertSame(0, Artisan::call('outbox:estado'));
        $salida = Artisan::output();

        $this->assertStringContainsString('ms-analitica', $salida);
        $this->assertStringContainsString('en pausa hasta', $salida);
        $this->assertStringContainsString('error_receptor', $salida);
        $this->assertStringContainsString('venta.registrada', $salida);
        $this->assertStringContainsString('ms-notificaciones', $salida);
    }
}
