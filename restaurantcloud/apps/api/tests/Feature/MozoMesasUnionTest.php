<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoMesasUnionTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $mozoId = '00000000-0000-4000-8000-000000000102';
    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_union_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->mozoId,
            'nombre' => 'Mozo Test Union',
            'correo' => 'mozo_union@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenMozo = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenMozo,
            'Accept' => 'application/json',
        ];
    }

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso ' . Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pisoId;
    }

    private function crearMesa(string $pisoId, string $numero, bool $permiteUnion = true, ?string $principalId = null): string
    {
        $mesaId = (string) Str::uuid();
        DB::table('mesa')->insert([
            'id' => $mesaId,
            'local_id' => $this->localId,
            'piso_id' => $pisoId,
            'numero' => $numero,
            'capacidad' => 4,
            'forma' => 'cuadrada',
            'posicion_x' => 1,
            'posicion_y' => 1,
            'permite_union' => $permiteUnion,
            'mesa_principal_id' => $principalId,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function crearPedidoConItem(string $mesaId): string
    {
        $catId = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $catId,
            'local_id' => $this->localId,
            'nombre' => 'Cat ' . Str::random(4),
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $prodId = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $prodId,
            'categoria_id' => $catId,
            'local_id' => $this->localId,
            'nombre' => 'Lomo Test ' . Str::random(4),
            'precio' => 42.0,
            'disponibilidad' => 'disponible',
            'requiere_preparacion' => true,
            'activo' => true,
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
            'estado' => 'enviado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('pedido_item')->insert([
            'id' => (string) Str::uuid(),
            'pedido_id' => $pedidoId,
            'producto_id' => $prodId,
            'cantidad' => 1,
            'precio_unitario' => 42.0,
            'estado' => 'en_preparacion',
            'numero_ronda' => 1,
            'stock_descontado' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pedidoId;
    }

    public function test_obtener_candidatas_union_filtra_por_mismo_piso_y_detecta_bloqueos(): void
    {
        $piso1 = $this->crearPiso();
        $piso2 = $this->crearPiso();

        $mesaA = $this->crearMesa($piso1, '61');
        $mesaB = $this->crearMesa($piso1, '62', true); // Libre y elegible
        $mesaC = $this->crearMesa($piso1, '63', false); // No permite unión
        $mesaD = $this->crearMesa($piso1, '64', true); // Ocupada
        $this->crearPedidoConItem($mesaD);

        $mesaE = $this->crearMesa($piso2, '65', true); // Otro piso

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesaA}/candidatas-union", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_origen_id', $mesaA);

        $candidatas = collect($res->json('datos.candidatas'));

        // No debe incluir mesas de otro piso ni la propia mesa origen
        $this->assertNull($candidatas->firstWhere('id', $mesaA));
        $this->assertNull($candidatas->firstWhere('id', $mesaE));

        // Mesa B debe ser elegible
        $candB = $candidatas->firstWhere('id', $mesaB);
        $this->assertNotNull($candB);
        $this->assertTrue($candB['elegible']);
        $this->assertNull($candB['motivo_bloqueo']);

        // Mesa C bloqueada por no permitir unión
        $candC = $candidatas->firstWhere('id', $mesaC);
        $this->assertNotNull($candC);
        $this->assertFalse($candC['elegible']);
        $this->assertStringContainsStringIgnoringCase('no permite unión', $candC['motivo_bloqueo']);

        // Mesa D bloqueada por pedido activo
        $candD = $candidatas->firstWhere('id', $mesaD);
        $this->assertNotNull($candD);
        $this->assertFalse($candD['elegible']);
        $this->assertStringContainsStringIgnoringCase('ocupada', $candD['motivo_bloqueo']);
    }

    public function test_unir_mesas_asocia_secundarias_y_genera_etiqueta_unificada(): void
    {
        $piso = $this->crearPiso();
        $mesa71 = $this->crearMesa($piso, '71');
        $mesa72 = $this->crearMesa($piso, '72');

        $payload = [
            'mesa_titular_id' => $mesa71,
            'mesas_secundarias_ids' => [$mesa72],
        ];

        $res = $this->postJson('/api/v1/mozo/mesas/unir', $payload, $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_principal_id', $mesa71)
            ->assertJsonPath('datos.label_unificado', 'Mesa [ 71 ; 72 ]')
            ->assertJsonPath('datos.capacidad_total', 8);

        $mesa72DB = DB::table('mesa')->where('id', $mesa72)->first();
        $this->assertEquals($mesa71, $mesa72DB->mesa_principal_id);
    }

    public function test_unir_mesas_rechaza_si_secundaria_tiene_comanda_activa(): void
    {
        $piso = $this->crearPiso();
        $mesa73 = $this->crearMesa($piso, '73');
        $mesa74 = $this->crearMesa($piso, '74');
        $this->crearPedidoConItem($mesa74); // Mesa secundaria ocupada

        $payload = [
            'mesa_titular_id' => $mesa73,
            'mesas_secundarias_ids' => [$mesa74],
        ];

        $res = $this->postJson('/api/v1/mozo/mesas/unir', $payload, $this->headers());

        $res->assertStatus(422)
            ->assertJsonPath('exito', false);

        $this->assertStringContainsStringIgnoringCase('comanda activa', $res->json('errores.0.mensaje'));
    }

    public function test_validar_separacion_permite_separar_mesas_incluso_con_consumos_activos(): void
    {
        $piso = $this->crearPiso();
        $mesa75 = $this->crearMesa($piso, '75');
        $mesa76 = $this->crearMesa($piso, '76', true, $mesa75);

        // Mesa titular con plato en preparación
        $this->crearPedidoConItem($mesa75);

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesa75}/validar-separacion", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.puede_separar', true)
            ->assertJsonPath('datos.tiene_consumo_activo', true)
            ->assertJsonPath('datos.items_activos', 1);

        $this->assertEquals(42.0, (float) $res->json('datos.total_consumo'));
        $this->assertCount(1, $res->json('datos.mesas_secundarias'));
    }

    public function test_separar_mesas_desvincula_hijas_y_restaura_estado_libre(): void
    {
        $piso = $this->crearPiso();
        $mesa77 = $this->crearMesa($piso, '77');
        $mesa78 = $this->crearMesa($piso, '78', true, $mesa77);

        // Separación limpia
        $res = $this->postJson("/api/v1/mozo/mesas/{$mesa77}/separar", [], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.mesa_principal_id', $mesa77);

        $mesa78DB = DB::table('mesa')->where('id', $mesa78)->first();
        $this->assertNull($mesa78DB->mesa_principal_id);
    }

    public function test_separar_mesas_parcial_desvincula_solo_secundaria_seleccionada(): void
    {
        $piso = $this->crearPiso();
        $mesa70 = $this->crearMesa($piso, '70');
        $mesa71 = $this->crearMesa($piso, '71', true, $mesa70);
        $mesa72 = $this->crearMesa($piso, '72', true, $mesa70);

        // Mesa titular con consumo activo
        $pedidoId = $this->crearPedidoConItem($mesa70);

        // Separar únicamente mesa 72
        $res = $this->postJson("/api/v1/mozo/mesas/{$mesa70}/separar", [
            'mesas_secundarias_ids' => [$mesa72],
        ], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.grupo_disuelto', false)
            ->assertJsonPath('datos.nueva_etiqueta', 'Mesa [ 70 ; 71 ]');

        // Mesa 72 debe quedar desvinculada
        $mesa72DB = DB::table('mesa')->where('id', $mesa72)->first();
        $this->assertNull($mesa72DB->mesa_principal_id);

        // Mesa 71 debe permanecer unida a mesa 70
        $mesa71DB = DB::table('mesa')->where('id', $mesa71)->first();
        $this->assertEquals($mesa70, $mesa71DB->mesa_principal_id);

        // La comanda en la mesa 70 debe seguir activa (NO anulada)
        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('enviado', $pedidoDB->estado);
    }

    public function test_separar_todas_las_mesas_mantiene_titular_ocupada_con_su_comanda(): void
    {
        $piso = $this->crearPiso();
        $mesa73 = $this->crearMesa($piso, '73');
        $mesa74 = $this->crearMesa($piso, '74', true, $mesa73);

        $pedidoId = $this->crearPedidoConItem($mesa73);

        // Separar todas las secundarias
        $res = $this->postJson("/api/v1/mozo/mesas/{$mesa73}/separar", [], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.grupo_disuelto', true);

        // Mesa 74 liberada
        $mesa74DB = DB::table('mesa')->where('id', $mesa74)->first();
        $this->assertNull($mesa74DB->mesa_principal_id);

        // Comanda de mesa 73 sigue intacta
        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('enviado', $pedidoDB->estado);

        // En getPlano, mesa 73 sigue OCUPADA con sus consumos y mesa 74 está LIBRE
        $planoRes = $this->getJson("/api/v1/mozo/plano?piso_id={$piso}", $this->headers());
        $planoRes->assertStatus(200);

        $mesasPlano = collect($planoRes->json('datos.mesas'));
        $dto73 = $mesasPlano->firstWhere('id', $mesa73);
        $dto74 = $mesasPlano->firstWhere('id', $mesa74);

        $this->assertEquals('ocupada', $dto73['estado']);
        $this->assertNull($dto73['etiqueta_union']);
        $this->assertEquals(42.0, (float) $dto73['total_consumo']);

        $this->assertEquals('libre', $dto74['estado']);
        $this->assertNull($dto74['etiqueta_union']);
    }

    public function test_liberar_mesa_unida_sin_consumo_deshace_union_automaticamente_y_restaura_mesas_como_nuevas(): void
    {
        $piso = $this->crearPiso();
        $mesa81 = $this->crearMesa($piso, '81');
        $mesa82 = $this->crearMesa($piso, '82', true, $mesa81);

        // Crear comanda vacía en la mesa titular (clientes recién sentados sin consumo)
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa81,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => 9081,
            'estado' => 'enviado',
            'comensales' => 6,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesa81}/liberar", [], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.union_disuelta', true)
            ->assertJsonPath('datos.mesas_restauradas', ['81', '82']);

        // Verificar en DB que la mesa secundaria volvió a ser independiente (mesa_principal_id = null)
        $mesa82DB = DB::table('mesa')->where('id', $mesa82)->first();
        $this->assertNull($mesa82DB->mesa_principal_id);

        // Verificar que la comanda vacía quedó anulada
        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('anulado', $pedidoDB->estado);
    }

    public function test_liberar_mesa_unida_desde_secundaria_resuelve_titular_y_deshace_union(): void
    {
        $piso = $this->crearPiso();
        $mesa83 = $this->crearMesa($piso, '83');
        $mesa84 = $this->crearMesa($piso, '84', true, $mesa83);

        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa83,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => 9083,
            'estado' => 'enviado',
            'comensales' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Llamar a liberar desde la mesa secundaria (84)
        $res = $this->postJson("/api/v1/mozo/mesas/{$mesa84}/liberar", [], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.union_disuelta', true);

        $mesa84DB = DB::table('mesa')->where('id', $mesa84)->first();
        $this->assertNull($mesa84DB->mesa_principal_id);

        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('anulado', $pedidoDB->estado);
    }

    public function test_liberar_mesa_unida_con_items_activos_bloquea_con_error_422(): void
    {
        $piso = $this->crearPiso();
        $mesa85 = $this->crearMesa($piso, '85');
        $mesa86 = $this->crearMesa($piso, '86', true, $mesa85);

        // Mesa titular con comanda y plato activo
        $this->crearPedidoConItem($mesa85);

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesa85}/liberar", [], $this->headers());

        $res->assertStatus(422)
            ->assertJsonPath('exito', false);

        $this->assertStringContainsStringIgnoringCase('platos o bebidas', $res->json('errores.0.mensaje'));

        // La mesa secundaria debe permanecer unida
        $mesa86DB = DB::table('mesa')->where('id', $mesa86)->first();
        $this->assertEquals($mesa85, $mesa86DB->mesa_principal_id);
    }

    public function test_get_plano_refleja_coherencia_visual_en_mesas_unidas(): void
    {
        $piso = $this->crearPiso();
        $mesa91 = $this->crearMesa($piso, '91');
        $mesa92 = $this->crearMesa($piso, '92');

        // Pedido activo en mesa titular 91
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa91,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => 9091,
            'estado' => 'enviado',
            'comensales' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Unir mesa 92 a mesa 91
        $this->postJson('/api/v1/mozo/mesas/unir', [
            'mesa_titular_id' => $mesa91,
            'mesas_secundarias_ids' => [$mesa92],
        ], $this->headers())->assertStatus(200);

        // Consultar el plano del piso
        $res = $this->getJson("/api/v1/mozo/plano?piso_id={$piso}", $this->headers());
        $res->assertStatus(200);

        $mesas = collect($res->json('datos.mesas'));
        $dto91 = $mesas->firstWhere('id', $mesa91);
        $dto92 = $mesas->firstWhere('id', $mesa92);

        $this->assertNotNull($dto91);
        $this->assertNotNull($dto92);

        // Mesa titular: capacidad combinada 4+4=8, ocupada y con etiqueta unificada
        $this->assertEquals('ocupada', $dto91['estado']);
        $this->assertEquals(8, $dto91['capacidad']);
        $this->assertEquals('Mesa [ 91 ; 92 ]', $dto91['etiqueta_union']);
        $this->assertNull($dto91['mesa_principal_id']);

        // Mesa secundaria: debe ser 'ocupada' (NUNCA 'libre'), tener mesa_principal_id y heredar pedido
        $this->assertEquals('ocupada', $dto92['estado']);
        $this->assertEquals($mesa91, $dto92['mesa_principal_id']);
        $this->assertEquals('Mesa [ 91 ; 92 ]', $dto92['etiqueta_union']);
        $this->assertEquals($pedidoId, $dto92['pedido_id']);
        $this->assertTrue($dto92['es_mi_mesa']);
    }

    public function test_get_plano_despues_de_liberar_muestra_todas_las_mesas_como_libres(): void
    {
        $piso = $this->crearPiso();
        $mesa93 = $this->crearMesa($piso, '93');
        $mesa94 = $this->crearMesa($piso, '94');

        // Pedido activo vacío en mesa titular 93
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa93,
            'mozo_id' => $this->mozoId,
            'numero_comanda' => 9093,
            'estado' => 'enviado',
            'comensales' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Unir mesa 94 a mesa 93
        $this->postJson('/api/v1/mozo/mesas/unir', [
            'mesa_titular_id' => $mesa93,
            'mesas_secundarias_ids' => [$mesa94],
        ], $this->headers())->assertStatus(200);

        // Liberar mesa unificada sin consumo
        $liberarRes = $this->postJson("/api/v1/mozo/mesas/{$mesa93}/liberar", [], $this->headers());
        $liberarRes->assertStatus(200)->assertJsonPath('datos.union_disuelta', true);

        // Consultar plano del piso
        $res = $this->getJson("/api/v1/mozo/plano?piso_id={$piso}", $this->headers());
        $res->assertStatus(200);

        $mesas = collect($res->json('datos.mesas'));
        $dto93 = $mesas->firstWhere('id', $mesa93);
        $dto94 = $mesas->firstWhere('id', $mesa94);

        // Ambas mesas deben estar LIBRES simultáneamente y sin residuos de unión
        $this->assertEquals('libre', $dto93['estado']);
        $this->assertEquals(4, $dto93['capacidad']);
        $this->assertNull($dto93['etiqueta_union']);
        $this->assertNull($dto93['mesa_principal_id']);
        $this->assertNull($dto93['pedido_id']);

        $this->assertEquals('libre', $dto94['estado']);
        $this->assertEquals(4, $dto94['capacidad']);
        $this->assertNull($dto94['etiqueta_union']);
        $this->assertNull($dto94['mesa_principal_id']);
        $this->assertNull($dto94['pedido_id']);
    }
}
