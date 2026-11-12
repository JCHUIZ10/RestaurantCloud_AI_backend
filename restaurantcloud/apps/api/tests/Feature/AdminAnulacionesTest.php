<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminAnulacionesTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $mozoId = '00000000-0000-4000-8000-000000000103';

    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_admin_anul_'.Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->adminId,
            'nombre' => 'Admin Test Auditoria',
            'correo' => 'admin_anul@aurea.local',
            'rol' => 'admin_local',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenAdmin = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->tokenAdmin,
            'Accept' => 'application/json',
        ];
    }

    private function crearEntornoBase(): array
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso Auditoria '.Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $mesaId = (string) Str::uuid();
        DB::table('mesa')->insert([
            'id' => $mesaId,
            'local_id' => $this->localId,
            'piso_id' => $pisoId,
            'numero' => '99',
            'capacidad' => 4,
            'forma' => 'cuadrada',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => rand(1000, 9999),
            'estado' => 'anulado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $catId = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $catId,
            'local_id' => $this->localId,
            'nombre' => 'Pase Caliente '.Str::random(4),
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productoId = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $catId,
            'nombre' => 'Lomo Saltado Test '.Str::random(4),
            'precio' => 45.00,
            'costo_estandar' => 18.50,
            'requiere_preparacion' => true,
            'activo' => true,
            'disponibilidad' => 'disponible',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'piso_id' => $pisoId,
            'mesa_id' => $mesaId,
            'pedido_id' => $pedidoId,
            'producto_id' => $productoId,
        ];
    }

    private function crearAnulacion(array $base, array $overrides = []): string
    {
        $id = (string) Str::uuid();
        $anuladoAt = $overrides['anulado_at'] ?? now();

        DB::table('pedido_anulacion')->insert(array_merge([
            'id' => $id,
            'local_id' => $this->localId,
            'pedido_id' => $base['pedido_id'],
            'pedido_item_id' => null,
            'tipo_anulacion' => 'item_individual',
            'mesa_id' => $base['mesa_id'],
            'mesa_numero' => 'Mesa 99',
            'producto_id' => $base['producto_id'],
            'producto_nombre' => 'Lomo Saltado Test',
            'cantidad' => 1,
            'precio_unitario' => 45.00,
            'monto_total' => 45.00,
            'mozo_id' => $this->mozoId,
            'anulado_por' => $this->mozoId,
            'motivo_categoria' => 'demora_cliente',
            'motivo_detalle' => 'Cliente desiste por exceso de demora en cocina.',
            'pedido_created_at' => now()->subMinutes(25),
            'anulado_at' => $anuladoAt,
            'minutos_espera' => 25,
            'estado_anterior' => 'en_preparacion',
            'es_merma' => false,
            'costo_merma' => 0.00,
            'revisado' => false,
            'created_at' => $anuladoAt,
        ], $overrides));

        return $id;
    }

    public function test_listado_anulaciones_retorna_kpis_y_estructura_correcta(): void
    {
        $base = $this->crearEntornoBase();
        $hoy = now()->toDateString();

        // 1 anulación limpia (sin merma)
        $this->crearAnulacion($base, [
            'es_merma' => false,
            'costo_merma' => 0.00,
            'monto_total' => 45.00,
            'revisado' => false,
            'anulado_at' => now(),
        ]);

        // 1 anulación con merma culinaria
        $this->crearAnulacion($base, [
            'es_merma' => true,
            'costo_merma' => 18.50,
            'monto_total' => 45.00,
            'revisado' => false,
            'anulado_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/admin/anulaciones?fecha={$hoy}", $this->headers());

        $response->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonStructure([
                'exito',
                'datos' => [
                    'fecha',
                    'kpis' => [
                        'total_anulaciones',
                        'monto_total',
                        'con_merma_cantidad',
                        'costo_merma_total',
                        'mesas_afectadas',
                        'pendientes_revision',
                        'comandas_totales',
                    ],
                    'anulaciones',
                ],
            ]);

        $kpis = $response->json('datos.kpis');
        $this->assertGreaterThanOrEqual(2, $kpis['total_anulaciones']);
        $this->assertGreaterThanOrEqual(1, $kpis['con_merma_cantidad']);
        $this->assertGreaterThanOrEqual(18.50, $kpis['costo_merma_total']);
        $this->assertGreaterThanOrEqual(2, $kpis['pendientes_revision']);

        $anulaciones = $response->json('datos.anulaciones');
        $this->assertNotEmpty($anulaciones);

        $primerItem = $anulaciones[0];
        $this->assertArrayHasKey('id', $primerItem);
        $this->assertArrayHasKey('codigo', $primerItem);
        $this->assertStringStartsWith('ANUL-', $primerItem['codigo']);
        $this->assertArrayHasKey('mozo_nombre', $primerItem);
        $this->assertArrayHasKey('es_merma', $primerItem);
    }

    public function test_listado_filtros_rapidos(): void
    {
        $base = $this->crearEntornoBase();
        $hoy = now()->toDateString();

        $idMerma = $this->crearAnulacion($base, [
            'es_merma' => true,
            'costo_merma' => 20.00,
            'anulado_at' => now(),
        ]);

        $idSinMerma = $this->crearAnulacion($base, [
            'es_merma' => false,
            'anulado_at' => now(),
        ]);

        // Filtrar con_merma
        $respMerma = $this->getJson("/api/v1/admin/anulaciones?fecha={$hoy}&filtro_rapido=con_merma", $this->headers());
        $respMerma->assertStatus(200);
        $itemsMerma = collect($respMerma->json('datos.anulaciones'));
        $this->assertTrue($itemsMerma->contains('id', $idMerma));
        $this->assertFalse($itemsMerma->contains('id', $idSinMerma));

        // Filtrar sin_merma
        $respSinMerma = $this->getJson("/api/v1/admin/anulaciones?fecha={$hoy}&filtro_rapido=sin_merma", $this->headers());
        $respSinMerma->assertStatus(200);
        $itemsSinMerma = collect($respSinMerma->json('datos.anulaciones'));
        $this->assertTrue($itemsSinMerma->contains('id', $idSinMerma));
        $this->assertFalse($itemsSinMerma->contains('id', $idMerma));
    }

    public function test_listado_expone_fechas_iso8601_y_codigo_de_ocho_caracteres(): void
    {
        $base = $this->crearEntornoBase();
        $id = $this->crearAnulacion($base, ['anulado_at' => now()]);

        $response = $this->getJson('/api/v1/admin/anulaciones?fecha='.now()->toDateString(), $this->headers());

        $item = collect($response->json('datos.anulaciones'))->firstWhere('id', $id);
        $this->assertNotNull($item);

        foreach (['anulado_at', 'pedido_created_at', 'created_at'] as $campo) {
            $this->assertMatchesRegularExpression(
                '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/',
                $item[$campo],
                "El campo {$campo} no es ISO 8601"
            );
        }

        $this->assertMatchesRegularExpression('/^ANUL-\d{4}-[0-9A-F]{8}$/', $item['codigo']);
    }

    public function test_busqueda_por_codigo_visible_encuentra_la_anulacion(): void
    {
        $base = $this->crearEntornoBase();
        $id = $this->crearAnulacion($base, ['anulado_at' => now()]);
        $otroId = $this->crearAnulacion($base, ['anulado_at' => now()]);

        $codigo = collect($this->getJson('/api/v1/admin/anulaciones?fecha='.now()->toDateString(), $this->headers())
            ->json('datos.anulaciones'))->firstWhere('id', $id)['codigo'];

        $response = $this->getJson(
            '/api/v1/admin/anulaciones?fecha='.now()->toDateString().'&busqueda='.urlencode($codigo),
            $this->headers()
        );

        $ids = collect($response->json('datos.anulaciones'))->pluck('id');
        $this->assertTrue($ids->contains($id));
        $this->assertFalse($ids->contains($otroId));
    }

    public function test_busqueda_trata_los_comodines_like_como_texto_literal(): void
    {
        $base = $this->crearEntornoBase();
        $this->crearAnulacion($base, ['anulado_at' => now()]);
        $hoy = now()->toDateString();

        foreach (['%', '_', '\\'] as $comodin) {
            $response = $this->getJson(
                "/api/v1/admin/anulaciones?fecha={$hoy}&busqueda=".urlencode($comodin),
                $this->headers()
            );

            $response->assertStatus(200);
            $this->assertCount(0, $response->json('datos.anulaciones'), "El comodín '{$comodin}' no debe coincidir con todo");
        }
    }

    public function test_kpi_comandas_totales_cuenta_solo_comandas_completas_sin_depender_del_filtro(): void
    {
        $base = $this->crearEntornoBase();
        $hoy = now()->toDateString();

        $antes = $this->getJson("/api/v1/admin/anulaciones?fecha={$hoy}", $this->headers())
            ->json('datos.kpis.comandas_totales');

        $this->crearAnulacion($base, ['tipo_anulacion' => 'comanda_completa', 'anulado_at' => now()]);
        $this->crearAnulacion($base, ['tipo_anulacion' => 'item_individual', 'anulado_at' => now()]);

        $response = $this->getJson("/api/v1/admin/anulaciones?fecha={$hoy}&filtro_rapido=sin_merma", $this->headers());

        $this->assertSame($antes + 1, $response->json('datos.kpis.comandas_totales'));
    }

    public function test_detalle_anulacion_individual(): void
    {
        $base = $this->crearEntornoBase();
        $id = $this->crearAnulacion($base, [
            'motivo_detalle' => 'Detalle de prueba para verificación individual.',
        ]);

        $response = $this->getJson("/api/v1/admin/anulaciones/{$id}", $this->headers());

        $response->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.id', $id)
            ->assertJsonPath('datos.motivo_detalle', 'Detalle de prueba para verificación individual.');
    }

    public function test_marcar_anulacion_como_revisada(): void
    {
        $base = $this->crearEntornoBase();
        $id = $this->crearAnulacion($base, [
            'revisado' => false,
        ]);

        $response = $this->postJson("/api/v1/admin/anulaciones/{$id}/revisar", [
            'notas_supervision' => 'Conformidad administrativa verificada por gerencia.',
        ], $this->headers());

        $response->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.revisado', true)
            ->assertJsonPath('datos.revisado_por', $this->adminId)
            ->assertJsonPath('datos.notas_supervision', 'Conformidad administrativa verificada por gerencia.');

        $anulacionDb = DB::table('pedido_anulacion')->where('id', $id)->first();
        $this->assertTrue((bool) $anulacionDb->revisado);
        $this->assertEquals($this->adminId, $anulacionDb->revisado_por);
        $this->assertEquals('Conformidad administrativa verificada por gerencia.', $anulacionDb->notas_supervision);

        // Verificar log de auditoría
        $log = DB::table('log_auditoria')
            ->where('entidad_tipo', 'pedido_anulacion')
            ->where('entidad_id', $id)
            ->where('accion', 'anulacion.revisada')
            ->first();
        $this->assertNotNull($log);
    }

    public function test_revisar_anulacion_ya_revisada_retorna_409_y_conserva_la_auditoria_original(): void
    {
        $base = $this->crearEntornoBase();
        $revisadoAt = now()->subHour()->startOfSecond();
        $id = $this->crearAnulacion($base, [
            'revisado' => true,
            'revisado_por' => $this->mozoId,
            'revisado_at' => $revisadoAt,
            'notas_supervision' => 'Nota original.',
        ]);

        $response = $this->postJson("/api/v1/admin/anulaciones/{$id}/revisar", [
            'notas_supervision' => 'Intento de sobrescribir.',
        ], $this->headers());

        $response->assertStatus(409)
            ->assertJsonPath('exito', false)
            ->assertJsonPath('errores.0.codigo', 'ERR_ANULACION_YA_REVISADA');

        $anulacionDb = DB::table('pedido_anulacion')->where('id', $id)->first();
        $this->assertEquals($this->mozoId, $anulacionDb->revisado_por);
        $this->assertEquals('Nota original.', $anulacionDb->notas_supervision);

        $this->assertSame(0, DB::table('log_auditoria')
            ->where('entidad_tipo', 'pedido_anulacion')
            ->where('entidad_id', $id)
            ->where('accion', 'anulacion.revisada')
            ->count());
    }

    public function test_revisar_anulacion_inexistente_retorna_404(): void
    {
        $response = $this->postJson('/api/v1/admin/anulaciones/'.Str::uuid().'/revisar', [], $this->headers());

        $response->assertStatus(404)
            ->assertJsonPath('errores.0.codigo', 'ERR_ANULACION_NO_ENCONTRADA');
    }

    private function headersPropietarioSinSede(?string $localIdHeader): array
    {
        $rawToken = 'test_token_prop_anul_'.Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $rawToken), 3600, json_encode([
            'id' => (string) Str::uuid(),
            'nombre' => 'Propietario Test Auditoria',
            'correo' => 'prop_anul@aurea.local',
            'rol' => 'propietario',
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'estado' => 'activo',
        ]));

        $headers = [
            'Authorization' => 'Bearer '.$rawToken,
            'Accept' => 'application/json',
        ];

        if ($localIdHeader !== null) {
            $headers['X-Local-Id'] = $localIdHeader;
        }

        return $headers;
    }

    public function test_propietario_con_sede_ajena_en_header_no_accede_a_la_bandeja(): void
    {
        $response = $this->getJson(
            '/api/v1/admin/anulaciones',
            $this->headersPropietarioSinSede((string) Str::uuid())
        );

        $response->assertStatus(400)
            ->assertJsonPath('errores.0.codigo', 'ERR_LOCAL_REQUERIDO');
    }

    public function test_propietario_con_sede_propia_en_header_accede_a_la_bandeja(): void
    {
        $response = $this->getJson(
            '/api/v1/admin/anulaciones',
            $this->headersPropietarioSinSede($this->localId)
        );

        $response->assertStatus(200)
            ->assertJsonPath('exito', true);
    }
}
