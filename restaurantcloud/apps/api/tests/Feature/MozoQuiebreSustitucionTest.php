<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoQuiebreSustitucionTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $mozoId = '00000000-0000-4000-8000-000000000102';
    private string $cocineroId = '00000000-0000-4000-8000-000000000104';
    private string $tokenMozo;
    private string $tokenCocinero;

    protected function setUp(): void
    {
        parent::setUp();

        // Sesión Mozo
        $rawTokenMozo = 'test_token_mozo_quiebre_' . Str::random(32);
        $tokenHashMozo = hash('sha256', $rawTokenMozo);
        $sessionMozo = [
            'id' => $this->mozoId,
            'nombre' => 'Carlos Mendoza',
            'correo' => 'mozo_quiebre@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];
        Redis::setex("auth:session:{$tokenHashMozo}", 3600, json_encode($sessionMozo));
        $this->tokenMozo = $rawTokenMozo;

        // Sesión Cocinero
        $rawTokenCocinero = 'test_token_cocinero_quiebre_' . Str::random(32);
        $tokenHashCocinero = hash('sha256', $rawTokenCocinero);
        $sessionCocinero = [
            'id' => $this->cocineroId,
            'nombre' => 'Chef KDS',
            'correo' => 'chef_quiebre@aurea.local',
            'rol' => 'cocinero',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];
        Redis::setex("auth:session:{$tokenHashCocinero}", 3600, json_encode($sessionCocinero));
        $this->tokenCocinero = $rawTokenCocinero;
    }

    private function headersMozo(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenMozo,
            'Accept' => 'application/json',
        ];
    }

    private function headersCocinero(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenCocinero,
            'Accept' => 'application/json',
        ];
    }

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso ' . Str::random(6),
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

    private function crearCategoria(string $nombre): string
    {
        $catId = (string) Str::uuid();
        DB::table('categoria_producto')->insert([
            'id' => $catId,
            'local_id' => $this->localId,
            'nombre' => $nombre . ' ' . Str::random(6),
            'orden' => 1,
            'activa' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $catId;
    }

    private function crearProducto(string $nombre, float $precio, ?string $catId = null, string $disp = 'disponible'): array
    {
        if (! $catId) {
            $catId = $this->crearCategoria('Cat');
        }

        $prodId = (string) Str::uuid();
        $nombreUnico = $nombre . ' ' . Str::random(6);

        DB::table('producto')->insert([
            'id' => $prodId,
            'local_id' => $this->localId,
            'categoria_id' => $catId,
            'nombre' => $nombreUnico,
            'descripcion' => 'Descripción de ' . $nombreUnico,
            'precio' => $precio,
            'disponibilidad' => $disp,
            'activo' => true,
            'requiere_preparacion' => true,
            'costo_estandar' => round($precio * 0.35, 2),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$prodId, $nombreUnico];
    }

    private function crearPedidoConItem(string $mesaId, string $prodId, float $precio, string $estadoItem = 'en_cola'): array
    {
        $pedidoId = (string) Str::uuid();
        $comandaNum = rand(100, 9999);

        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'numero_comanda' => $comandaNum,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'estado' => 'enviado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $itemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $itemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $prodId,
            'cantidad' => 1,
            'precio_unitario' => $precio,
            'nota_cocina' => null,
            'estado' => $estadoItem,
            'numero_ronda' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$pedidoId, $itemId];
    }

    public function test_obtener_catalogo_sustitucion_retorna_sugerencias_y_delta_precio(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, (string) rand(100, 999));

        $catCriollos = $this->crearCategoria('Criollos');
        $catPastas = $this->crearCategoria('Pastas');

        // Plato original observado: Lomo Saltado S/ 38.00
        [$prodOriginal, $nombreOrig] = $this->crearProducto('Lomo Saltado', 38.00, $catCriollos);
        [$pedidoId, $itemId] = $this->crearPedidoConItem($mesaId, $prodOriginal, 38.00, 'no_disponible');

        // Candidatos
        [$prodSeco, $nombreSeco] = $this->crearProducto('Seco de Res', 38.00, $catCriollos); // Misma cat, delta 0
        [$prodBife, $nombreBife] = $this->crearProducto('Bife Angosto', 45.00, $catCriollos); // Misma cat, delta +7
        [$prodTallarines, $nombreTallarines] = $this->crearProducto('Tallarines', 32.00, $catPastas); // Otra cat, delta -6
        [$prodAgotado, $nombreAgotado] = $this->crearProducto('Arroz con Pato', 40.00, $catCriollos, 'agotado'); // Agotado en cocina

        $res = $this->getJson("/api/v1/mozo/mesas/{$mesaId}/items/{$itemId}/catalogo-sustitucion", $this->headersMozo());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.plato_original', $nombreOrig);

        $this->assertEquals(38.0, (float) $res->json('datos.precio_original'));

        $datos = $res->json('datos');

        // Verificar que el producto agotado NO aparece
        $idsProductos = collect($datos['productos'])->pluck('producto_id')->all();
        $this->assertNotContains($prodAgotado, $idsProductos);
        $this->assertContains($prodSeco, $idsProductos);
        $this->assertContains($prodBife, $idsProductos);
        $this->assertContains($prodTallarines, $idsProductos);

        // Verificar delta de precio en Seco de Res
        $itemSeco = collect($datos['productos'])->firstWhere('producto_id', $prodSeco);
        $this->assertEquals(0.00, $itemSeco['diferencia']);
        $this->assertTrue($itemSeco['es_misma_categoria']);

        // Verificar delta de precio en Bife
        $itemBife = collect($datos['productos'])->firstWhere('producto_id', $prodBife);
        $this->assertEquals(7.00, $itemBife['diferencia']);

        // Top sugerencias calculadas
        $this->assertNotEmpty($datos['sugerencias_top']);
        $this->assertLessThanOrEqual(6, count($datos['sugerencias_top']));

        // Categorías chips presentes
        $this->assertNotEmpty($datos['categorias']);
    }

    public function test_sustituir_plato_anula_previo_y_crea_nuevo_en_cola_con_prioridad(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, (string) rand(100, 999));

        $cat = $this->crearCategoria('Criollos');
        [$prod1, $nombreProd1] = $this->crearProducto('Lomo Saltado', 38.00, $cat);
        [$prod2, $nombreProd2] = $this->crearProducto('Chicha 1L', 15.00, $cat);
        [$prodSustituto, $nombreSustituto] = $this->crearProducto('Seco a la Norteña', 42.00, $cat);

        // Pedido inicial: Lomo (38) + Chicha (15) = 53.00
        [$pedidoId, $item1Id] = $this->crearPedidoConItem($mesaId, $prod1, 38.00, 'no_disponible');

        DB::table('pedido_item')->insert([
            'id' => (string) Str::uuid(),
            'pedido_id' => $pedidoId,
            'producto_id' => $prod2,
            'cantidad' => 1,
            'precio_unitario' => 15.00,
            'estado' => 'entregado',
            'numero_ronda' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payload = [
            'nuevo_producto_id' => $prodSustituto,
            'cantidad' => 1,
            'notas_cocina' => 'Término medio, poco cilantro',
        ];

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$item1Id}/sustituir", $payload, $this->headersMozo());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true)
            ->assertJsonPath('datos.nuevo_producto', $nombreSustituto);

        $this->assertEquals(4.0, (float) $res->json('datos.diferencia_monto'));
        $this->assertEquals(57.0, (float) $res->json('datos.nuevo_subtotal'));

        // Verificar ítem original anulado sin merma
        $itemOrigDB = DB::table('pedido_item')->where('id', $item1Id)->first();
        $this->assertEquals('anulado', $itemOrigDB->estado);
        $this->assertEquals('sustitucion_quiebre_cocina', $itemOrigDB->motivo_anulacion);
        $this->assertFalse((bool) $itemOrigDB->es_merma);

        // Verificar nuevo ítem en_cola con prioridad en nota de cocina
        $nuevoItemId = $res->json('datos.nuevo_item_id');
        $nuevoItemDB = DB::table('pedido_item')->where('id', $nuevoItemId)->first();
        $this->assertNotNull($nuevoItemDB);
        $this->assertEquals('en_cola', $nuevoItemDB->estado);
        $this->assertEquals(42.00, (float) $nuevoItemDB->precio_unitario);
        $this->assertStringContainsString('SUSTITUCIÓN URGENTE (Quiebre): Término medio', $nuevoItemDB->nota_cocina);

        // Verificar auditoría
        $auditoria = DB::table('log_auditoria')
            ->where('accion', 'SUSTITUCION_PLATO_QUIEBRE')
            ->where('entidad_id', $nuevoItemId)
            ->first();
        $this->assertNotNull($auditoria);

        // Verificar notificación para cocina
        $notif = DB::table('notificacion')
            ->where('tipo', 'sustitucion_plato_urgente')
            ->where('entidad_id', $nuevoItemId)
            ->first();
        $this->assertNotNull($notif);
        $this->assertEquals('cocina', $notif->rol_destinatario);
    }

    public function test_sustituir_plato_rechaza_si_nuevo_producto_esta_agotado(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, (string) rand(100, 999));

        [$prod1, $nombre1] = $this->crearProducto('Plato A', 30.00);
        [$prodAgotado, $nombreAgotado] = $this->crearProducto('Plato B Agotado', 35.00, null, 'agotado');

        [$pedidoId, $item1Id] = $this->crearPedidoConItem($mesaId, $prod1, 30.00, 'no_disponible');

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$item1Id}/sustituir", [
            'nuevo_producto_id' => $prodAgotado,
            'cantidad' => 1,
        ], $this->headersMozo());

        $res->assertStatus(422)
            ->assertJsonPath('exito', false);
    }

    public function test_anular_plato_por_quiebre_sin_merma_descuenta_subtotal(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, (string) rand(100, 999));

        [$prod1, $nombre1] = $this->crearProducto('Lomo Fino', 40.00);
        [$prod2, $nombre2] = $this->crearProducto('Tequeños', 18.00);

        [$pedidoId, $item1Id] = $this->crearPedidoConItem($mesaId, $prod1, 40.00, 'no_disponible');

        // Segundo ítem activo en la comanda
        DB::table('pedido_item')->insert([
            'id' => (string) Str::uuid(),
            'pedido_id' => $pedidoId,
            'producto_id' => $prod2,
            'cantidad' => 1,
            'precio_unitario' => 18.00,
            'estado' => 'entregado',
            'numero_ronda' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payload = [
            'motivo_detalle' => 'Comensal no desea sustitución tras agotamiento de insumo carne',
        ];

        $res = $this->postJson("/api/v1/mozo/mesas/{$mesaId}/items/{$item1Id}/anular-quiebre", $payload, $this->headersMozo());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true);

        $this->assertEquals(40.0, (float) $res->json('datos.monto_anulado'));
        $this->assertEquals(18.0, (float) $res->json('datos.nuevo_subtotal'));
        $this->assertFalse((bool) $res->json('datos.mesa_liberada'));

        // Verificar pedido_anulacion con es_merma = false
        $anulacionDB = DB::table('pedido_anulacion')->where('pedido_item_id', $item1Id)->first();
        $this->assertNotNull($anulacionDB);
        $this->assertFalse((bool) $anulacionDB->es_merma);
        $this->assertEquals(0.00, (float) $anulacionDB->costo_merma);
        $this->assertEquals(40.00, (float) $anulacionDB->monto_total);
    }

    public function test_anular_ultimo_plato_por_quiebre_cancela_pedido_y_libera_mesas_unidas(): void
    {
        $pisoId = $this->crearPiso();
        $titularId = $this->crearMesa($pisoId, (string) rand(100, 999));
        $secundariaId = $this->crearMesa($pisoId, (string) rand(100, 999), true, $titularId);

        [$prod, $nombreProd] = $this->crearProducto('Plato Único', 50.00);
        [$pedidoId, $itemId] = $this->crearPedidoConItem($titularId, $prod, 50.00, 'no_disponible');

        $payload = [
            'motivo_detalle' => 'Único plato quebrado en cocina, comensales deciden retirarse',
        ];

        $res = $this->postJson("/api/v1/mozo/mesas/{$titularId}/items/{$itemId}/anular-quiebre", $payload, $this->headersMozo());

        $res->assertStatus(200)
            ->assertJsonPath('exito', true);

        $this->assertEquals(50.0, (float) $res->json('datos.monto_anulado'));
        $this->assertEquals(0.0, (float) $res->json('datos.nuevo_subtotal'));
        $this->assertTrue((bool) $res->json('datos.mesa_liberada'));

        // Verificar que el pedido quedó anulado
        $pedidoDB = DB::table('pedido')->where('id', $pedidoId)->first();
        $this->assertEquals('anulado', $pedidoDB->estado);

        // Verificar que la mesa secundaria fue desvinculada
        $secundariaDB = DB::table('mesa')->where('id', $secundariaId)->first();
        $this->assertNull($secundariaDB->mesa_principal_id);
    }

    public function test_flujo_integrado_kds_a_salon_quiebre_reflejado_en_plano(): void
    {
        $pisoId = $this->crearPiso();
        $mesaId = $this->crearMesa($pisoId, (string) rand(100, 999));

        [$prod, $nombreProd] = $this->crearProducto('Pescado a la Plancha', 44.00);
        [$pedidoId, $itemId] = $this->crearPedidoConItem($mesaId, $prod, 44.00, 'en_cola');

        // 1. Verificar plano inicial: sin quiebre
        $resPlanoInicial = $this->getJson("/api/v1/mozo/plano?piso_id={$pisoId}", $this->headersMozo());
        $mesaInicial = collect($resPlanoInicial->json('datos.mesas'))->firstWhere('id', $mesaId);
        $this->assertFalse((bool) $mesaInicial['tiene_quiebre_cocina']);

        // 2. KDS marca producto como agotado (CU-COCINA-04)
        $resCocina = $this->postJson("/api/v1/cocina/productos/{$prod}/marcar-agotado", [], $this->headersCocinero());
        $resCocina->assertStatus(200);

        // 3. Mozo consulta plano (Polling regular cada 3.5s): debe detectar tiene_quiebre_cocina = true
        $resPlanoDespues = $this->getJson("/api/v1/mozo/plano?piso_id={$pisoId}", $this->headersMozo());
        $mesaDespues = collect($resPlanoDespues->json('datos.mesas'))->firstWhere('id', $mesaId);

        $this->assertTrue((bool) $mesaDespues['tiene_quiebre_cocina']);
        $this->assertEquals($nombreProd, $mesaDespues['quiebre_producto_nombre']);
        $this->assertEquals($itemId, $mesaDespues['quiebre_item_id']);
    }
}
