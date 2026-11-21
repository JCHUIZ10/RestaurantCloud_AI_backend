<?php

namespace Tests\Feature;

use App\Domains\Horario\Services\JornadaOperativaService;
use App\Support\Identificador;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * POST /admin/pronosticos, GET /admin/pronosticos/ultimo y PATCH /admin/reposiciones/{id} (5B.4).
 * ms-pronóstico se simula con Http::fake; el cálculo de la reposición se prueba aparte (ReposicionCalculoTest).
 */
class PronosticoReposicionTest extends TestCase
{
    private const SECRETO = 'secreto-de-prueba';

    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $productoId;

    private string $insumoId;

    private string $ejecucionId;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.pronostico.url' => 'http://pronostico.test',
            'services.pronostico.secreto' => self::SECRETO,
        ]);

        $this->token = $this->sesion('admin_local');
        $this->ejecucionId = Identificador::ordenado();

        // Un plato y un insumo propios: 0,2 kg de pescado por plato y 5 kg en bodega.
        $this->productoId = Identificador::ordenado();
        DB::table('producto')->insert([
            'id' => $this->productoId,
            'local_id' => $this->localId,
            'categoria_id' => DB::table('categoria_producto')->where('local_id', $this->localId)->value('id'),
            'nombre' => 'Ceviche de prueba '.Str::random(6),
            'precio' => 40,
            'activo' => true,
        ]);
        $this->insumoId = Identificador::ordenado();
        DB::table('insumo')->insert([
            'id' => $this->insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Pescado de prueba '.Str::random(6),
            'unidad_medida' => 'kg',
            'stock_actual' => 5,
        ]);
        DB::table('producto_insumo')->insert([
            'producto_id' => $this->productoId,
            'insumo_id' => $this->insumoId,
            'modo_calculo' => 'exacto',
            'cantidad_descuenta' => 0.2,
        ]);
    }

    private function sesion(string $rol): string
    {
        $token = 'test_token_pronostico_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => 'admin@aurea.local',
            'rol' => $rol,
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        return $token;
    }

    /**
     * @return array<string, string>
     */
    private function headers(?string $token = null): array
    {
        return ['Authorization' => 'Bearer '.($token ?? $this->token), 'Accept' => 'application/json'];
    }

    /**
     * Lo que respondería ms-pronóstico: el plato de prueba con 10 platos de P50 y 14 de P90 por día.
     *
     * @return array<string, mixed>
     */
    private function datosDelServicio(): array
    {
        $inicio = Carbon::parse($this->jornadaActual())->addDay();

        return [
            'ejecucion_id' => $this->ejecucionId,
            'estado' => 'completada',
            'fecha_inicio' => $inicio->toDateString(),
            'horizonte_dias' => 7,
            'resumen' => ['modelo' => 7, 'baseline' => 0, 'cerrado' => 0, 'sin_historial' => 0],
            'predicciones' => [[
                'producto_id' => $this->productoId,
                'nombre' => 'Ceviche',
                'dias' => array_map(fn (int $i): array => [
                    'fecha' => $inicio->copy()->addDays($i)->toDateString(), 'p50' => 10.0, 'p90' => 14.0, 'metodo' => 'modelo', 'motivo' => null,
                ], range(0, 6)),
            ]],
        ];
    }

    private function jornadaActual(): string
    {
        return app(JornadaOperativaService::class)->fechaJornadaDe($this->localId, now(), 0);
    }

    private function servicioResponde(): void
    {
        Http::fake(fn (Request $peticion) => Http::response(['exito' => true, 'datos' => $this->datosDelServicio()], $peticion->method() === 'POST' ? 201 : 200));
    }

    /**
     * @return array<string, mixed>
     */
    private function generar(array $cuerpo = []): TestResponse
    {
        return $this->postJson('/api/v1/admin/pronosticos', $cuerpo, $this->headers());
    }

    public function test_generar_envia_la_solicitud_firmada_con_jornada_platos_y_cierres_y_devuelve_la_reposicion(): void
    {
        $this->servicioResponde();
        $inicio = Carbon::parse($this->jornadaActual())->addDay();
        $cierre = $inicio->copy()->addDays(2)->toDateString();
        DB::table('horario_excepcion')->updateOrInsert(
            ['local_id' => $this->localId, 'fecha' => $cierre],
            ['id' => Identificador::ordenado(), 'cerrado' => true, 'motivo' => 'Cierre de prueba'],
        );

        $respuesta = $this->generar(['cobertura_dias' => 3])->assertCreated();

        Http::assertSent(function (Request $peticion) use ($inicio, $cierre): bool {
            $cuerpo = $peticion->data();
            $timestamp = $peticion->header('X-Timestamp')[0];

            return $peticion->method() === 'POST'
                && $peticion->url() === 'http://pronostico.test/interno/pronosticos'
                && $peticion->header('X-Firma')[0] === hash_hmac('sha256', $timestamp.'.'.$peticion->body(), self::SECRETO)
                && $cuerpo['empresa_id'] === $this->empresaId
                && $cuerpo['local_id'] === $this->localId
                && $cuerpo['solicitada_por'] === $this->adminId
                && $cuerpo['jornada_actual'] === $this->jornadaActual()
                && $cuerpo['fecha_inicio'] === $inicio->toDateString()
                && $cuerpo['horizonte_dias'] === 7
                && in_array($this->productoId, array_column($cuerpo['productos'], 'producto_id'), true)
                && in_array($cierre, $cuerpo['dias_cerrados'], true)
                && Str::isUuid($cuerpo['solicitud_id']);
        });

        $respuesta->assertJsonPath('datos.cobertura_dias', 3)
            ->assertJsonPath('datos.pronostico.ejecucion_id', $this->ejecucionId)
            ->assertJsonCount(1, 'datos.reposicion');
        // 3 días × 10 platos × 0,2 kg = 6; margen 3 × 4 × 0,2 = 2,4; 6 + 2,4 − 5 de stock = 3,4
        $this->assertEquals(
            ['insumo_id' => $this->insumoId, 'unidad_medida' => 'kg', 'consumo_previsto' => 6.0, 'margen_seguridad' => 2.4,
                'stock_al_calcular' => 5.0, 'cantidad_sugerida' => 3.4, 'estado' => 'pendiente', 'cantidad_final' => null],
            collect($respuesta->json('datos.reposicion.0'))->only(
                ['insumo_id', 'unidad_medida', 'consumo_previsto', 'margen_seguridad', 'stock_al_calcular', 'cantidad_sugerida', 'estado', 'cantidad_final'],
            )->all(),
        );
        $this->assertDatabaseHas('recomendacion_reposicion', [
            'local_id' => $this->localId, 'ejecucion_id' => $this->ejecucionId, 'insumo_id' => $this->insumoId, 'cobertura_dias' => 3,
        ]);
    }

    public function test_un_local_sin_horario_no_informa_cierres(): void
    {
        $this->servicioResponde();
        DB::table('horario_atencion')->where('local_id', $this->localId)->delete();

        $this->generar()->assertCreated();

        Http::assertSent(fn (Request $peticion): bool => $peticion->data()['dias_cerrados'] === []);
    }

    public function test_reintentar_con_la_misma_solicitud_no_duplica_ni_recalcula_la_reposicion(): void
    {
        $this->servicioResponde();
        $solicitud = Identificador::ordenado();

        $this->generar(['solicitud_id' => $solicitud])->assertCreated();
        DB::table('insumo')->where('id', $this->insumoId)->update(['stock_actual' => 100]);
        $segunda = $this->generar(['solicitud_id' => $solicitud])->assertCreated();

        $this->assertSame(1, DB::table('recomendacion_reposicion')->where('ejecucion_id', $this->ejecucionId)->count());
        $this->assertEquals(5.0, $segunda->json('datos.reposicion.0.stock_al_calcular'));
    }

    public function test_los_insumos_inactivos_no_entran_en_la_reposicion(): void
    {
        $this->servicioResponde();
        DB::table('insumo')->where('id', $this->insumoId)->update(['estado' => 'inactivo']);

        $this->generar()->assertCreated()->assertJsonCount(0, 'datos.reposicion');
    }

    public function test_cobertura_distinta_de_3_5_o_7_se_rechaza_sin_llamar_al_servicio(): void
    {
        Http::fake();

        $this->generar(['cobertura_dias' => 4])
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_VALIDACION')
            ->assertJsonPath('errores.0.detalles.campos.0.campo', 'cobertura_dias');

        Http::assertNothingSent();
    }

    public function test_un_plan_sin_prediccion_recibe_403_y_no_se_llama_al_servicio(): void
    {
        Http::fake();
        DB::table('empresa')->where('id', $this->empresaId)->update(['plan_id' => 1]);

        $this->generar()
            ->assertForbidden()
            ->assertJsonPath('errores.0.codigo', 'ERR_MODULO_PREDICCION_NO_CONTRATADO');
        $this->getJson('/api/v1/admin/pronosticos/ultimo', $this->headers())->assertForbidden();

        Http::assertNothingSent();
    }

    public function test_un_rol_sin_permiso_recibe_403(): void
    {
        Http::fake();

        $this->postJson('/api/v1/admin/pronosticos', [], $this->headers($this->sesion('mozo')))->assertForbidden();

        Http::assertNothingSent();
    }

    public function test_si_ms_pronostico_no_responde_se_informa_503_y_no_se_guarda_nada(): void
    {
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $this->generar()
            ->assertStatus(503)
            ->assertJsonPath('errores.0.codigo', 'ERR_PRONOSTICO_NO_DISPONIBLE');

        $this->assertSame(0, DB::table('recomendacion_reposicion')->where('local_id', $this->localId)->count());
    }

    public function test_si_ms_analitica_cae_el_error_conserva_la_ejecucion_fallida(): void
    {
        $fallida = Identificador::ordenado();
        Http::fake(['*' => Http::response(['exito' => false, 'errores' => [[
            'codigo' => 'ERR_ANALITICA_NO_DISPONIBLE', 'mensaje' => 'x', 'detalles' => ['ejecucion_id' => $fallida],
        ]]], 503)]);

        $this->generar()
            ->assertStatus(503)
            ->assertJsonPath('errores.0.codigo', 'ERR_ANALITICA_NO_DISPONIBLE')
            ->assertJsonPath('errores.0.detalles.ejecucion_id', $fallida);
    }

    public function test_si_el_servicio_rechaza_la_solicitud_es_un_error_del_nucleo_502(): void
    {
        Http::fake(['*' => Http::response(['exito' => false, 'errores' => [['codigo' => 'ERR_FIRMA_INVALIDA', 'mensaje' => 'x']]], 401)]);

        $this->generar()->assertStatus(502)->assertJsonPath('errores.0.codigo', 'ERR_PRONOSTICO_RECHAZADO');
    }

    public function test_ultimo_sin_pronosticos_responde_404(): void
    {
        Http::fake();

        $this->getJson('/api/v1/admin/pronosticos/ultimo', $this->headers())
            ->assertNotFound()
            ->assertJsonPath('errores.0.codigo', 'ERR_SIN_PRONOSTICO');
    }

    public function test_ultimo_devuelve_el_pronostico_guardado_en_el_servicio_y_la_reposicion(): void
    {
        $this->servicioResponde();
        $this->generar(['cobertura_dias' => 5])->assertCreated();

        $respuesta = $this->getJson('/api/v1/admin/pronosticos/ultimo', $this->headers())->assertOk();

        Http::assertSent(function (Request $peticion): bool {
            if ($peticion->method() !== 'GET') {
                return false;
            }
            $consulta = "empresa_id={$this->empresaId}&local_id={$this->localId}";
            $timestamp = $peticion->header('X-Timestamp')[0];

            return $peticion->url() === "http://pronostico.test/interno/pronosticos/{$this->ejecucionId}?{$consulta}"
                && $peticion->header('X-Firma')[0] === hash_hmac('sha256', "{$timestamp}.{$consulta}", self::SECRETO);
        });
        $respuesta->assertJsonPath('datos.pronostico.ejecucion_id', $this->ejecucionId)
            ->assertJsonPath('datos.cobertura_dias', 5)
            ->assertJsonPath('datos.reposicion.0.insumo_id', $this->insumoId);
    }

    public function test_ultimo_conserva_la_reposicion_aunque_ms_pronostico_no_responda(): void
    {
        $this->servicioResponde();
        $this->generar()->assertCreated();
        Http::fake(fn () => throw new ConnectionException('caído'));

        $this->getJson('/api/v1/admin/pronosticos/ultimo', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.pronostico', null)
            ->assertJsonPath('datos.reposicion.0.insumo_id', $this->insumoId);
    }

    private function recomendacionPendiente(): string
    {
        $this->servicioResponde();

        return $this->generar()->assertCreated()->json('datos.reposicion.0.id');
    }

    public function test_aceptar_registra_la_cantidad_sugerida_quien_decidio_y_cuando(): void
    {
        $id = $this->recomendacionPendiente();

        $respuesta = $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'aceptada'], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.estado', 'aceptada');
        // 7 días: consumo 14 + margen 5,6 − stock 5
        $this->assertEquals(14.6, $respuesta->json('datos.cantidad_final'));

        $fila = DB::table('recomendacion_reposicion')->where('id', $id)->first();
        $this->assertSame($this->adminId, $fila->decidido_por);
        $this->assertNotNull($fila->decidido_en);
    }

    public function test_ajustar_exige_la_cantidad_final(): void
    {
        $id = $this->recomendacionPendiente();

        $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'ajustada'], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.detalles.campos.0.campo', 'cantidad_final');

        $respuesta = $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'ajustada', 'cantidad_final' => 8], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.estado', 'ajustada');
        $this->assertEquals(8, $respuesta->json('datos.cantidad_final'));
    }

    public function test_descartar_no_guarda_cantidad_final(): void
    {
        $id = $this->recomendacionPendiente();

        $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'descartada', 'cantidad_final' => 3], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.estado', 'descartada')
            ->assertJsonPath('datos.cantidad_final', null);
    }

    public function test_una_recomendacion_decidida_no_cambia(): void
    {
        $id = $this->recomendacionPendiente();
        $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'aceptada'], $this->headers())->assertOk();

        $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'descartada'], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_REPOSICION_YA_DECIDIDA');
        $this->assertSame('aceptada', DB::table('recomendacion_reposicion')->where('id', $id)->value('estado'));
    }

    public function test_una_recomendacion_de_otra_sede_o_inexistente_responde_404(): void
    {
        $id = $this->recomendacionPendiente();
        $ajena = $this->sesionDeOtraSede();

        $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'aceptada'], $this->headers($ajena))->assertNotFound();
        $this->patchJson('/api/v1/admin/reposiciones/'.Identificador::ordenado(), ['estado' => 'aceptada'], $this->headers())->assertNotFound();
        $this->assertSame('pendiente', DB::table('recomendacion_reposicion')->where('id', $id)->value('estado'));
    }

    /**
     * Sesión de un administrador de la misma empresa en una sede que no es la del pronóstico.
     */
    private function sesionDeOtraSede(): string
    {
        $token = 'test_token_otra_sede_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->adminId, 'nombre' => 'Otro', 'correo' => 'otro@test.local', 'rol' => 'admin_local',
            'empresa_id' => $this->empresaId, 'local_id' => Identificador::ordenado(), 'estado' => 'activo',
        ]));

        return $token;
    }
}
