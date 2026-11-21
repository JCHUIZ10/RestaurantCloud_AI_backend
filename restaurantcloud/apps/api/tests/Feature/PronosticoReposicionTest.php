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

    private string $modeloVersion;

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
        $this->modeloVersion = Identificador::ordenado();

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
     * Lo que respondería ms-pronóstico: el plato de prueba con 10 platos de P50 y 14 de P90 por día, con modelo
     * propio y un historial largo (nivel 3). Cada prueba cambia lo que necesita.
     *
     * @return array<string, mixed>
     */
    private function datosDelServicio(): array
    {
        return [
            'ejecucion_id' => $this->ejecucionId,
            'estado' => 'completada',
            'fecha_inicio' => Carbon::parse($this->jornadaActual())->addDay()->toDateString(),
            'horizonte_dias' => 7,
            'modelo' => ['modelo_version' => $this->modeloVersion],
            'datos' => ['actualizados_hasta' => now()->toIso8601String()],
            'historial' => ['dias_con_ventas' => 361],
            'advertencias' => [],
            'resumen' => ['modelo' => 7, 'baseline' => 0, 'cerrado' => 0, 'sin_historial' => 0],
            'predicciones' => $this->predicciones(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function predicciones(string $metodo = 'modelo', float $p50 = 10.0, float $p90 = 14.0): array
    {
        $inicio = Carbon::parse($this->jornadaActual())->addDay();

        return [[
            'producto_id' => $this->productoId,
            'nombre' => 'Ceviche',
            'dias' => array_map(fn (int $i): array => [
                'fecha' => $inicio->copy()->addDays($i)->toDateString(), 'p50' => $p50, 'p90' => $p90, 'metodo' => $metodo, 'motivo' => null,
            ], range(0, 6)),
        ]];
    }

    private function jornadaActual(): string
    {
        return app(JornadaOperativaService::class)->fechaJornadaDe($this->localId, now(), 0);
    }

    /**
     * ms-pronóstico responde con `datosDelServicio()` cambiado por `$cambios`; las métricas de su modelo, con `$metricas`.
     *
     * @param  array<string, mixed>  $cambios
     * @param  array<string, mixed>  $metricas
     */
    private function servicioResponde(array $cambios = [], array $metricas = ['mae_modelo' => 4.87, 'mae_ingenuo' => 6.37, 'aprobada' => true]): void
    {
        Http::fake(function (Request $peticion) use ($cambios, $metricas) {
            if (str_contains($peticion->url(), '/interno/modelos/vigente')) {
                return Http::response(['exito' => true, 'datos' => ['modelo' => ['metricas' => $metricas]]]);
            }

            return Http::response(
                ['exito' => true, 'datos' => array_replace($this->datosDelServicio(), $cambios)],
                $peticion->method() === 'POST' ? 201 : 200,
            );
        });
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

        Http::assertSent(fn (Request $peticion): bool => $peticion->method() === 'POST' && $peticion->data()['dias_cerrados'] === []);
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

    // --- Niveles de la predicción en locales nuevos ---

    public function test_con_modelo_propio_es_nivel_3_y_muestra_la_precision(): void
    {
        $this->servicioResponde();

        $this->generar()->assertCreated()
            ->assertJsonPath('datos.nivel', 3)
            ->assertJsonPath('datos.confianza.error_promedio', 4.9)
            ->assertJsonPath('datos.confianza.mejora_pct', 24)
            ->assertJsonPath('datos.progreso', null);
    }

    public function test_sin_modelo_y_con_historial_largo_es_nivel_2(): void
    {
        $this->servicioResponde(['modelo' => null, 'historial' => ['dias_con_ventas' => 40], 'predicciones' => $this->predicciones('baseline')]);

        $this->generar()->assertCreated()
            ->assertJsonPath('datos.nivel', 2)
            ->assertJsonPath('datos.confianza', null)
            ->assertJsonPath('datos.progreso.dias_con_ventas', 40)
            ->assertJsonPath('datos.progreso.faltan_para_siguiente', null);
    }

    public function test_un_local_con_pocos_dias_de_ventas_es_nivel_1_y_su_compra_lleva_la_reserva_minima(): void
    {
        $this->servicioResponde(['modelo' => null, 'historial' => ['dias_con_ventas' => 12], 'predicciones' => $this->predicciones('baseline', 10.0, 10.0)]);

        $respuesta = $this->generar(['cobertura_dias' => 3])->assertCreated()
            ->assertJsonPath('datos.nivel', 1)
            ->assertJsonPath('datos.progreso.dias_con_ventas', 12)
            ->assertJsonPath('datos.progreso.faltan_para_siguiente', 16);

        // 3 días × 10 × 0,2 = 6; el P90 del baseline es igual al P50, pero la reserva mínima del 35 % da 2,1; 8,1 − 5 de stock
        $linea = $respuesta->json('datos.reposicion.0');
        $this->assertEquals(2.1, $linea['margen_seguridad']);
        $this->assertEquals(3.1, $linea['cantidad_sugerida']);
    }

    public function test_un_local_sin_ventas_es_nivel_0_y_solo_pide_lo_que_esta_bajo_su_minimo(): void
    {
        DB::table('insumo')->where('id', $this->insumoId)->update(['stock_actual' => 2, 'stock_minimo' => 5]);
        $this->servicioResponde([
            'modelo' => null,
            'historial' => ['dias_con_ventas' => 0],
            'predicciones' => $this->predicciones('sin_historial', 0.0, 0.0),
        ]);

        $respuesta = $this->generar()->assertCreated()
            ->assertJsonPath('datos.nivel', 0)
            ->assertJsonPath('datos.progreso.faltan_para_siguiente', 1)
            ->assertJsonCount(1, 'datos.reposicion')
            ->assertJsonPath('datos.reposicion.0.motivo', 'bajo_minimo')
            ->assertJsonPath('datos.reposicion.0.prioridad', 'urgente')
            ->assertJsonPath('datos.totales.por_prioridad.urgente', 1);
        $this->assertEquals(3, $respuesta->json('datos.reposicion.0.cantidad_sugerida'));
    }

    public function test_ultimo_funciona_aunque_el_pronostico_no_haya_dejado_recomendaciones(): void
    {
        DB::table('insumo')->where('id', $this->insumoId)->update(['estado' => 'inactivo']);
        $this->servicioResponde(['modelo' => null, 'historial' => ['dias_con_ventas' => 0], 'predicciones' => $this->predicciones('sin_historial', 0.0, 0.0)]);
        $this->generar()->assertCreated()->assertJsonCount(0, 'datos.reposicion');

        $this->getJson('/api/v1/admin/pronosticos/ultimo', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.nivel', 0)
            ->assertJsonCount(0, 'datos.reposicion');
    }

    public function test_cada_pronostico_queda_registrado_con_su_nivel(): void
    {
        $this->servicioResponde(['modelo' => null, 'historial' => ['dias_con_ventas' => 12]]);

        $this->generar(['cobertura_dias' => 5])->assertCreated();

        $this->assertDatabaseHas('solicitud_pronostico', [
            'local_id' => $this->localId, 'ejecucion_id' => $this->ejecucionId, 'cobertura_dias' => 5,
            'nivel' => 1, 'dias_con_ventas' => 12, 'modelo_version' => null, 'solicitada_por' => $this->adminId,
        ]);
    }

    // --- Prioridad, proveedor y costo ---

    public function test_la_reposicion_trae_prioridad_dias_que_alcanza_proveedor_y_costo(): void
    {
        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first(['id', 'nombre']);
        DB::table('insumo')->where('id', $this->insumoId)->update(['costo_unitario' => 28, 'ultimo_proveedor_id' => $proveedor->id]);
        $this->servicioResponde();

        $respuesta = $this->generar()->assertCreated();

        // 2 kg por día: con 5 kg alcanza 2 días de los 7 de cobertura
        $linea = $respuesta->json('datos.reposicion.0');
        $this->assertSame(['pronto', 'consumo', 2], [$linea['prioridad'], $linea['motivo'], $linea['alcanza_dias']]);
        $this->assertSame($proveedor->nombre, $linea['proveedor']['nombre']);
        $this->assertEquals(28, $linea['proveedor']['precio']);
        // 14,6 kg × S/ 28
        $this->assertEquals(408.8, $linea['costo_estimado']);
        $this->assertEquals(408.8, $respuesta->json('datos.totales.costo'));
        $this->assertSame(1, $respuesta->json('datos.totales.proveedores'));
        $this->assertSame(1, $respuesta->json('datos.totales.por_prioridad.pronto'));
    }

    // --- Aviso de ventas atrasadas (N-5) ---

    private function crearVenta(string $fecha): void
    {
        $cajaId = Identificador::ordenado();
        DB::table('caja')->insert([
            'id' => $cajaId, 'local_id' => $this->localId, 'cajero_id' => $this->adminId,
            'monto_apertura' => 100, 'estado' => 'abierta', 'fecha_apertura' => now(),
        ]);
        DB::table('comprobante')->insert([
            'id' => Identificador::ordenado(), 'caja_id' => $cajaId, 'local_id' => $this->localId, 'tipo' => 'boleta',
            'serie' => 'B001', 'correlativo' => random_int(1000, 99999), 'nombre_cliente' => 'CONSUMIDOR FINAL',
            'medio_pago' => 'efectivo', 'subtotal_consumo' => 50, 'total' => 50, 'base_imponible' => 42.37, 'igv' => 7.63,
            'estado' => 'emitido', 'fecha' => $fecha, 'token_qr' => Identificador::aleatorio(),
        ]);
    }

    public function test_el_aviso_de_ventas_atrasadas_se_quita_si_el_nucleo_no_tiene_ventas_que_no_hayan_llegado(): void
    {
        $this->servicioResponde([
            'advertencias' => ['datos_desactualizados'],
            'datos' => ['actualizados_hasta' => now()->addYear()->toIso8601String()],
        ]);

        $this->generar()->assertCreated()->assertJsonPath('datos.pronostico.advertencias', []);
    }

    public function test_el_aviso_de_ventas_atrasadas_se_conserva_si_hay_ventas_posteriores_a_lo_recibido(): void
    {
        $this->crearVenta(now()->toDateTimeString());
        $this->servicioResponde([
            'advertencias' => ['datos_desactualizados'],
            'datos' => ['actualizados_hasta' => now()->subDays(5)->toIso8601String()],
        ]);

        $this->generar()->assertCreated()->assertJsonPath('datos.pronostico.advertencias', ['datos_desactualizados']);
    }

    // --- Decisiones en lote ---

    private function agregarSegundoInsumo(): string
    {
        $id = Identificador::ordenado();
        DB::table('insumo')->insert([
            'id' => $id, 'local_id' => $this->localId, 'nombre' => 'Limón de prueba '.Str::random(6), 'unidad_medida' => 'kg', 'stock_actual' => 0,
        ]);
        DB::table('producto_insumo')->insert([
            'producto_id' => $this->productoId, 'insumo_id' => $id, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.1,
        ]);

        return $id;
    }

    /**
     * @return list<string>
     */
    private function dosRecomendaciones(): array
    {
        $this->agregarSegundoInsumo();
        $this->servicioResponde();

        return array_column($this->generar()->assertCreated()->assertJsonCount(2, 'datos.reposicion')->json('datos.reposicion'), 'id');
    }

    public function test_el_lote_acepta_y_ajusta_varias_recomendaciones_a_la_vez(): void
    {
        [$primera, $segunda] = $this->dosRecomendaciones();

        $respuesta = $this->postJson('/api/v1/admin/reposiciones/decisiones', ['decisiones' => [
            ['id' => $primera, 'estado' => 'aceptada'],
            ['id' => $segunda, 'estado' => 'ajustada', 'cantidad_final' => 6],
        ]], $this->headers())->assertOk()->assertJsonCount(2, 'datos');

        $this->assertSame(['aceptada', 'ajustada'], array_column($respuesta->json('datos'), 'estado'));
        $this->assertEquals(6, DB::table('recomendacion_reposicion')->where('id', $segunda)->value('cantidad_final'));
    }

    public function test_si_una_decision_del_lote_falla_no_se_guarda_ninguna(): void
    {
        [$primera] = $this->dosRecomendaciones();

        $this->postJson('/api/v1/admin/reposiciones/decisiones', ['decisiones' => [
            ['id' => $primera, 'estado' => 'aceptada'],
            ['id' => Identificador::ordenado(), 'estado' => 'aceptada'],
        ]], $this->headers())->assertNotFound();

        $this->assertSame('pendiente', DB::table('recomendacion_reposicion')->where('id', $primera)->value('estado'));
    }

    public function test_el_lote_exige_la_cantidad_final_al_ajustar_y_no_repetir_recomendaciones(): void
    {
        [$primera] = $this->dosRecomendaciones();

        $this->postJson('/api/v1/admin/reposiciones/decisiones', ['decisiones' => [
            ['id' => $primera, 'estado' => 'ajustada'],
        ]], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.detalles.campos.0.campo', 'decisiones.0.cantidad_final');

        $this->postJson('/api/v1/admin/reposiciones/decisiones', ['decisiones' => [
            ['id' => $primera, 'estado' => 'aceptada'],
            ['id' => $primera, 'estado' => 'descartada'],
        ]], $this->headers())->assertStatus(422);
    }

    // --- Exportación ---

    public function test_exporta_la_compra_en_excel_y_en_pdf(): void
    {
        $this->servicioResponde();
        $this->generar()->assertCreated();

        $excel = $this->get('/api/v1/admin/pronosticos/ultimo/exportar?formato=xlsx', $this->headers())->assertOk();
        $this->assertStringContainsString('spreadsheetml.sheet', $excel->headers->get('Content-Type'));
        $this->assertStringContainsString('compra_sugerida_', $excel->headers->get('Content-Disposition'));
        $this->assertStringContainsString('.xlsx', $excel->headers->get('Content-Disposition'));

        $pdf = $this->get('/api/v1/admin/pronosticos/ultimo/exportar?formato=pdf', $this->headers())->assertOk();
        $this->assertStringContainsString('application/pdf', $pdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $pdf->getContent());
    }

    public function test_no_exporta_si_no_hay_pronostico_ni_nada_que_comprar_ni_un_formato_invalido(): void
    {
        $this->get('/api/v1/admin/pronosticos/ultimo/exportar', $this->headers())
            ->assertNotFound()->assertJsonPath('errores.0.codigo', 'ERR_SIN_PRONOSTICO');

        $id = $this->recomendacionPendiente();
        $this->get('/api/v1/admin/pronosticos/ultimo/exportar?formato=csv', $this->headers())->assertStatus(422);

        $this->patchJson("/api/v1/admin/reposiciones/{$id}", ['estado' => 'descartada'], $this->headers())->assertOk();
        $this->get('/api/v1/admin/pronosticos/ultimo/exportar', $this->headers())
            ->assertNotFound()->assertJsonPath('errores.0.codigo', 'ERR_SIN_COMPRA');
    }

    // --- Vista del propietario ---

    private function sesionDePropietario(): string
    {
        $token = 'test_token_propietario_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000101', 'nombre' => 'Propietario', 'correo' => 'propietario@aurea.local',
            'rol' => 'propietario', 'empresa_id' => $this->empresaId, 'local_id' => null, 'estado' => 'activo',
        ]));

        return $token;
    }

    public function test_el_propietario_ve_sus_sedes_con_y_sin_pronostico(): void
    {
        $this->servicioResponde();
        $propietario = $this->headers($this->sesionDePropietario());

        $antes = $this->getJson('/api/v1/propietario/pronosticos', $propietario)->assertOk();
        $this->assertSame('sin_pronostico', $antes->json('datos.sedes.0.estado'));
        $this->assertNull($antes->json('datos.sedes.0.nivel'));
        $this->assertEquals(0, $antes->json('datos.panorama.total_semana'));

        $this->generar()->assertCreated();

        $despues = $this->getJson('/api/v1/propietario/pronosticos', $propietario)->assertOk();
        $sede = $despues->json('datos.sedes.0');
        $this->assertSame(['ok', 3, 7], [$sede['estado'], $sede['nivel'], count($sede['pronostico']['dias'])]);
        // 7 días × 10 platos
        $this->assertEquals(70, $sede['pronostico']['total_semana']);
        $this->assertSame('Ceviche', $sede['pronostico']['platos'][0]['nombre']);
        $this->assertSame(1, $sede['reposicion']['por_prioridad']['pronto']);
        $this->assertEquals(70, $despues->json('datos.panorama.total_semana'));
        $this->assertCount(7, $despues->json('datos.panorama.dias'));
    }

    public function test_si_ms_pronostico_no_responde_el_propietario_igual_ve_la_reposicion_de_la_sede(): void
    {
        $this->servicioResponde();
        $this->generar()->assertCreated();
        Http::fake(fn () => throw new ConnectionException('caído'));

        $sede = $this->getJson('/api/v1/propietario/pronosticos', $this->headers($this->sesionDePropietario()))
            ->assertOk()->json('datos.sedes.0');

        $this->assertSame('no_disponible', $sede['estado']);
        $this->assertNull($sede['pronostico']);
        $this->assertSame(1, $sede['reposicion']['por_prioridad']['pronto']);
    }

    public function test_la_vista_del_propietario_exige_el_rol_y_el_plan(): void
    {
        Http::fake();

        $this->getJson('/api/v1/propietario/pronosticos', $this->headers())->assertForbidden();

        DB::table('empresa')->where('id', $this->empresaId)->update(['plan_id' => 1]);
        $this->getJson('/api/v1/propietario/pronosticos', $this->headers($this->sesionDePropietario()))
            ->assertForbidden()
            ->assertJsonPath('errores.0.codigo', 'ERR_MODULO_PREDICCION_NO_CONTRATADO');
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
