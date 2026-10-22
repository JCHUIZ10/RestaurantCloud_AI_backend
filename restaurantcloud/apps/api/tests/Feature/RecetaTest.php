<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class RecetaTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $adminId = '00000000-0000-4000-8000-000000000102';
    private string $adminCorreo = 'admin@aurea.local';
    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        // Autenticación en Redis para admin_local
        $rawToken = 'test_token_admin_' . Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => $this->adminCorreo,
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

    /**
     * Test 1: Calibrar receta calcula costo teórico, margen bruto y actualiza tabla producto.
     */
    public function test_calibrar_receta_guarda_insumos_y_recalcula_costo_en_producto(): void
    {
        // 1. Obtener una categoría válida del local
        $categoria = DB::table('categoria_producto')
            ->where('local_id', $this->localId)
            ->first();
        $this->assertNotNull($categoria);

        // 2. Crear producto de prueba
        $productoId = (string) Str::uuid();
        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => 'Ceviche Mixto Test ' . Str::random(4),
            'precio' => 50.00,
            'costo_estandar' => 0.00,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Crear 2 insumos de prueba
        $insumo1Id = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumo1Id,
            'local_id' => $this->localId,
            'nombre' => 'Pescado Corvina Test ' . Str::random(4),
            'unidad_medida' => 'kg',
            'stock_actual' => 10.0,
            'stock_minimo' => 2.0,
            'costo_unitario' => 30.00, // S/. 30 el kg
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $insumo2Id = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumo2Id,
            'local_id' => $this->localId,
            'nombre' => 'Limón Sutil Test ' . Str::random(4),
            'unidad_medida' => 'kg',
            'stock_actual' => 5.0,
            'stock_minimo' => 1.0,
            'costo_unitario' => 6.00, // S/. 6 el kg
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Guardar receta:
        // Corvina: modo 'rendimiento' 5 platos por kg -> dosis = 0.20 kg -> costo = S/. 6.00
        // Limón: modo 'exacto' dosis = 0.10 kg -> costo = S/. 0.60
        // Costo teórico total = 6.60, Margen = ((50 - 6.60) / 50) * 100 = 86.8%
        $payload = [
            'receta' => [
                [
                    'insumo_id' => $insumo1Id,
                    'modo_calculo' => 'rendimiento',
                    'rendimiento_platos' => 5,
                ],
                [
                    'insumo_id' => $insumo2Id,
                    'modo_calculo' => 'exacto',
                    'cantidad_descuenta' => 0.10,
                ],
            ],
        ];

        $response = $this->putJson("/api/v1/admin/productos/{$productoId}/receta", $payload, $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('datos.total_ingredientes', 2);
        $response->assertJsonPath('datos.costo_teorico', 6.6);
        $response->assertJsonPath('datos.margen_bruto_pct', 86.8);

        // Verificar que producto.costo_estandar se sincronizó en BD
        $prodBd = DB::table('producto')->where('id', $productoId)->first();
        $this->assertEquals(6.60, (float) $prodBd->costo_estandar);

        // Limpieza
        DB::table('producto_insumo')->where('producto_id', $productoId)->delete();
        DB::table('producto')->where('id', $productoId)->delete();
        DB::table('insumo')->whereIn('id', [$insumo1Id, $insumo2Id])->delete();
    }

    /**
     * Test 2: Simulación de capacidad detecta cuello de botella e insumo limitante.
     */
    public function test_simular_capacidad_bodega_detecta_cuello_de_botella(): void
    {
        $categoria = DB::table('categoria_producto')->where('local_id', $this->localId)->first();
        $productoId = (string) Str::uuid();

        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => 'Lomo Saltado Test ' . Str::random(4),
            'precio' => 45.00,
            'costo_estandar' => 12.00,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insumo A: Carne (Stock 6 kg, dosis 0.2 kg -> 30 platos posibles)
        $insumoCarne = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoCarne,
            'local_id' => $this->localId,
            'nombre' => 'Lomo Fino Test ' . Str::random(4),
            'unidad_medida' => 'kg',
            'stock_actual' => 6.0,
            'stock_minimo' => 2.0,
            'costo_unitario' => 45.00,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insumo B: Papa Amarilla (Stock 2 kg, dosis 0.25 kg -> 8 platos posibles - ¡CUELLO DE BOTELLA!)
        $insumoPapa = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoPapa,
            'local_id' => $this->localId,
            'nombre' => 'Papa Amarilla Test ' . Str::random(4),
            'unidad_medida' => 'kg',
            'stock_actual' => 2.0,
            'stock_minimo' => 5.0,
            'costo_unitario' => 3.50,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Asignar receta
        $this->putJson("/api/v1/admin/productos/{$productoId}/receta", [
            'receta' => [
                ['insumo_id' => $insumoCarne, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.20],
                ['insumo_id' => $insumoPapa, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.25],
            ],
        ], $this->headers());

        // Consultar capacidad de bodega
        $response = $this->getJson("/api/v1/admin/productos/{$productoId}/capacidad", $this->headers());

        $response->assertStatus(200);
        $response->assertJsonPath('datos.capacidad_maxima_platos', 8);
        $response->assertJsonPath('datos.insumo_cuello_botella_id', $insumoPapa);

        // Limpieza
        DB::table('producto_insumo')->where('producto_id', $productoId)->delete();
        DB::table('producto')->where('id', $productoId)->delete();
        DB::table('insumo')->whereIn('id', [$insumoCarne, $insumoPapa])->delete();
    }

    /**
     * Test 3: Quiebre de insumo a stock 0 conmuta plato a agotado automáticamente.
     */
    public function test_quiebre_de_insumo_conmuta_producto_a_agotado(): void
    {
        $categoria = DB::table('categoria_producto')->where('local_id', $this->localId)->first();
        $productoId = (string) Str::uuid();

        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => 'Arroz con Mariscos ' . Str::random(4),
            'precio' => 48.00,
            'costo_estandar' => 10.00,
            'requiere_preparacion' => true,
            'disponibilidad' => 'disponible',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Mix de Mariscos ' . Str::random(4),
            'unidad_medida' => 'kg',
            'stock_actual' => 5.0,
            'stock_minimo' => 2.0,
            'costo_unitario' => 25.00,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Asignar receta
        $this->putJson("/api/v1/admin/productos/{$productoId}/receta", [
            'receta' => [
                ['insumo_id' => $insumoId, 'modo_calculo' => 'exacto', 'cantidad_descuenta' => 0.20],
            ],
        ], $this->headers());

        // Realizar ajuste físico de stock del insumo a 0 (quiebre de inventario)
        $resAjuste = $this->postJson("/api/v1/admin/insumos/{$insumoId}/ajuste", [
            'stock_fisico' => 0,
            'motivo' => 'conteo_fisico_inventario',
            'notas' => 'Agotado en cocina durante el servicio',
        ], $this->headers());

        $resAjuste->assertStatus(200);

        // Verificar que el plato pasó automáticamente a agotado por quiebre de receta
        $prodBd = DB::table('producto')->where('id', $productoId)->first();
        $this->assertEquals('agotado', $prodBd->disponibilidad);
        $this->assertEquals('quiebre_stock_receta', $prodBd->motivo_agotado);

        // Limpieza
        DB::table('producto_insumo')->where('producto_id', $productoId)->delete();
        DB::table('producto')->where('id', $productoId)->delete();
        DB::table('auditoria_stock_ajuste')->where('insumo_id', $insumoId)->delete();
        DB::table('insumo')->where('id', $insumoId)->delete();
    }
}
