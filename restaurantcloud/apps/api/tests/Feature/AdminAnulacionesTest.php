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

        $rawToken = 'test_token_admin_anul_' . Str::random(32);
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
            'Authorization' => 'Bearer ' . $this->tokenAdmin,
            'Accept' => 'application/json',
        ];
    }

    private function crearEntornoBase(): array
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso Auditoria ' . Str::random(4),
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
            'nombre' => 'Pase Caliente ' . Str::random(4),
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
            'nombre' => 'Lomo Saltado Test ' . Str::random(4),
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

    public function test_escalar_anulacion_a_incidente(): void
    {
        $base = $this->crearEntornoBase();
        $id = $this->crearAnulacion($base, [
            'es_merma' => true,
            'costo_merma' => 18.50,
            'revisado' => false,
        ]);

        $payload = [
            'titulo' => 'Queja severa por lomo saltado quemado',
            'categoria' => 'rotura_merma',
            'gravedad' => 'alta',
            'medidas_adoptadas' => 'Se reentrenará al cocinero de partida en control térmico de wok.',
        ];

        $response = $this->postJson("/api/v1/admin/anulaciones/{$id}/escalar-incidente", $payload, $this->headers());

        $response->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.anulacion.id', $id)
            ->assertJsonPath('datos.anulacion.revisado', true)
            ->assertJsonPath('datos.incidente.categoria', 'rotura_merma')
            ->assertJsonPath('datos.incidente.gravedad', 'alta')
            ->assertJsonPath('datos.incidente.estado', 'en_revision');

        $incidenteId = $response->json('datos.incidente.id');
        $this->assertNotEmpty($incidenteId);

        // Verificar relación en DB
        $anulacionDb = DB::table('pedido_anulacion')->where('id', $id)->first();
        $this->assertEquals($incidenteId, $anulacionDb->incidente_id);

        $incidenteDb = DB::table('incidente')->where('id', $incidenteId)->first();
        $this->assertNotNull($incidenteDb);
        $this->assertStringStartsWith('INC-', $incidenteDb->codigo);
        $this->assertEquals('rotura_merma', $incidenteDb->categoria);

        // Verificar bitácora de incidente
        $bitacora = DB::table('incidente_bitacora')->where('incidente_id', $incidenteId)->first();
        $this->assertNotNull($bitacora);
        $this->assertEquals('apertura', $bitacora->tipo_evento);

        // Segundo intento debe fallar con 422 (ERR_YA_ESCALADO)
        $segundoIntento = $this->postJson("/api/v1/admin/anulaciones/{$id}/escalar-incidente", $payload, $this->headers());
        $segundoIntento->assertStatus(422)
            ->assertJsonPath('exito', false)
            ->assertJsonPath('errores.0.codigo', 'ERR_ESCALAR_INCIDENTE');
    }
}
