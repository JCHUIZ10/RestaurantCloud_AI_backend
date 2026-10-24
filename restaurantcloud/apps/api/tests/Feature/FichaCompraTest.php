<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class FichaCompraTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';
    private string $localId = '00000000-0000-4000-8000-000000000010';
    private string $adminId = '00000000-0000-4000-8000-000000000102';
    private string $adminCorreo = 'admin@aurea.local';
    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

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
     * Test 1: Listado de compras retorna KPIs de abastecimiento y estructura paginada.
     */
    public function test_listado_fichas_compra_retorna_kpis_y_estructura_correcta(): void
    {
        $response = $this->getJson('/api/v1/admin/compras', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'fichas',
                'kpis' => [
                    'gasto_mes_total',
                    'variacion_gasto_mes_pct',
                    'total_compras_mes',
                    'facturas_con_igv_monto',
                    'creditos_pendientes_monto',
                ],
                'paginacion' => [
                    'total',
                    'pagina',
                    'limite',
                    'total_paginas',
                ],
            ],
        ]);
    }

    /**
     * Test 2: Registro de compra con Factura formal (con numeración e IGV 18%)
     */
    public function test_registrar_ficha_compra_con_factura_e_igv_exitoso(): void
    {
        // 1. Obtener proveedor e insumo existentes en la sede
        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first();
        $insumo = DB::table('insumo')->where('local_id', $this->localId)->first();

        $this->assertNotNull($proveedor);
        $this->assertNotNull($insumo);

        $stockInicial = (float) $insumo->stock_actual;

        $payload = [
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'FACTURA',
            'numero_comprobante' => 'F001-009988',
            'fecha_emision' => date('Y-m-d'),
            'metodo_pago' => 'TRANSFERENCIA',
            'observaciones' => 'Compra formal de reposición semanal con factura.',
            'items' => [
                [
                    'insumo_id' => $insumo->id,
                    'cantidad' => 10.0,
                    'precio_unitario' => 25.50,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/compras', $payload, $this->headers());

        $response->assertStatus(201);
        $response->assertJson([
            'exito' => true,
            'datos' => [
                'ficha' => [
                    'tipo_comprobante' => 'FACTURA',
                    'numero_comprobante' => 'F001-009988',
                    'total' => 255.00,
                ],
            ],
        ]);

        $ficha = $response->json('datos.ficha');
        $this->assertEquals(216.10, $ficha['subtotal_neto']); // 255 / 1.18
        $this->assertEquals(38.90, $ficha['igv_monto']);

        // Verificar que el stock físico se incrementó y el costo unitario se actualizó
        $insumoActualizado = DB::table('insumo')->where('id', $insumo->id)->first();
        $this->assertEquals(round($stockInicial + 10.0, 3), (float) $insumoActualizado->stock_actual);
        $this->assertEquals(25.50, (float) $insumoActualizado->costo_unitario);
        $this->assertEquals($proveedor->id, $insumoActualizado->ultimo_proveedor_id);

        // Verificar kardex
        $ajuste = DB::table('auditoria_stock_ajuste')
            ->where('insumo_id', $insumo->id)
            ->where('motivo', 'ingreso_manual')
            ->orderBy('created_at', 'desc')
            ->first();

        $this->assertNotNull($ajuste);
        $this->assertEquals(10.0, (float) $ajuste->diferencia);
    }

    /**
     * Test 3: Registro de compra sin enumeración ('S/N' con es_autogenerado = true)
     */
    public function test_registrar_ficha_compra_sin_enumeracion_asigna_sn_y_es_autogenerado(): void
    {
        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first();
        $insumo = DB::table('insumo')->where('local_id', $this->localId)->first();

        $payload = [
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'NOTA_VENTA',
            'numero_comprobante' => '', // Sin enumeración
            'fecha_emision' => date('Y-m-d'),
            'metodo_pago' => 'EFECTIVO',
            'observaciones' => 'Compra directa en mercado mayorista sin serie ni número.',
            'items' => [
                [
                    'insumo_id' => $insumo->id,
                    'cantidad' => 5.0,
                    'precio_unitario' => 12.00,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/compras', $payload, $this->headers());

        $response->assertStatus(201);
        $ficha = $response->json('datos.ficha');

        $this->assertEquals('S/N', $ficha['numero_comprobante']);

        // Verificar persistencia de es_autogenerado = true en base de datos
        $dbFicha = DB::table('ficha_compra')->where('id', $ficha['id'])->first();
        $this->assertEquals('S/N', $dbFicha->numero_comprobante);
        $this->assertTrue((bool) $dbFicha->es_autogenerado);
    }

    /**
     * Test 4: Detección de platos reactivables tras reposición de inventario
     */
    public function test_registrar_ficha_compra_detecta_platos_reactivables(): void
    {
        // 1. Crear insumo de prueba en 0
        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Trucha Arcoíris ' . Str::random(5),
            'unidad_medida' => 'kg',
            'stock_actual' => 0.000,
            'stock_minimo' => 2.000,
            'costo_unitario' => 18.00,
            'estado' => 'agotado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $categoria = DB::table('categoria_producto')->where('local_id', $this->localId)->first();
        $productoId = (string) Str::uuid();

        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => 'Trucha Frita ' . Str::random(5),
            'precio' => 38.00,
            'disponibilidad' => 'agotado',
            'motivo_agotado' => 'quiebre_stock_receta',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('producto_insumo')->insert([
            'producto_id' => $productoId,
            'insumo_id' => $insumoId,
            'modo_calculo' => 'exacto',
            'cantidad_descuenta' => 0.400,
        ]);

        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first();

        // 2. Registrar compra del insumo agotado
        $payload = [
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'BOLETA',
            'numero_comprobante' => 'B001-00234',
            'fecha_emision' => date('Y-m-d'),
            'metodo_pago' => 'TRANSFERENCIA',
            'items' => [
                [
                    'insumo_id' => $insumoId,
                    'cantidad' => 10.0,
                    'precio_unitario' => 20.00,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/admin/compras', $payload, $this->headers());
        $response->assertStatus(201);

        $platosReactivables = $response->json('datos.platosReactivables');
        $this->assertNotEmpty($platosReactivables);
        $this->assertEquals($productoId, $platosReactivables[0]['id']);
    }

    /**
     * Test 5: Evaluación de impacto predictivo antes de la anulación
     */
    public function test_obtener_impacto_anulacion_proyecta_stock_y_riesgos(): void
    {
        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first();
        $insumo = DB::table('insumo')->where('local_id', $this->localId)->first();

        // Registrar compra previa
        $regResponse = $this->postJson('/api/v1/admin/compras', [
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'BOLETA',
            'numero_comprobante' => 'B002-00511',
            'fecha_emision' => date('Y-m-d'),
            'metodo_pago' => 'EFECTIVO',
            'items' => [
                ['insumo_id' => $insumo->id, 'cantidad' => 5.0, 'precio_unitario' => 10.0],
            ],
        ], $this->headers());

        $fichaId = $regResponse->json('datos.ficha.id');

        $response = $this->getJson("/api/v1/admin/compras/{$fichaId}/impacto-anulacion", $this->headers());
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'ficha_id',
                'numero_comprobante',
                'insumos_afectados' => [
                    '*' => [
                        'insumo_id',
                        'insumo_nombre',
                        'stock_actual',
                        'cantidad_a_restar',
                        'stock_proyectado',
                        'quedara_en_quiebre',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Test 6: Anulación con contingencia de Piso 0 (GREATEST 0 Floor) y absorción de déficit en cocina
     */
    public function test_anular_ficha_compra_con_piso_0_evita_saldos_negativos_y_audita_deficit(): void
    {
        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first();

        // 1. Crear insumo exclusivo para la prueba con stock 0
        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert([
            'id' => $insumoId,
            'local_id' => $this->localId,
            'nombre' => 'Lomo Fino Premium ' . Str::random(5),
            'unidad_medida' => 'kg',
            'stock_actual' => 0.000,
            'stock_minimo' => 2.000,
            'costo_unitario' => 45.00,
            'estado' => 'agotado',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Registrar compra de 20 kg
        $regResponse = $this->postJson('/api/v1/admin/compras', [
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'FACTURA',
            'numero_comprobante' => 'F002-004411',
            'fecha_emision' => date('Y-m-d'),
            'metodo_pago' => 'TRANSFERENCIA',
            'items' => [
                ['insumo_id' => $insumoId, 'cantidad' => 20.0, 'precio_unitario' => 45.0],
            ],
        ], $this->headers());

        $fichaId = $regResponse->json('datos.ficha.id');
        $this->assertEquals(20.0, (float) DB::table('insumo')->where('id', $insumoId)->value('stock_actual'));

        // 3. Simular consumo en cocina de 15 kg (quedan 5 kg en bodega física)
        DB::table('insumo')->where('id', $insumoId)->update(['stock_actual' => 5.000]);

        // 4. Anular la compra de 20 kg
        $anularResponse = $this->postJson("/api/v1/admin/compras/{$fichaId}/anular", [
            'motivo' => 'Proveedor canceló factura por error formal en RUC de la empresa.',
        ], $this->headers());

        $anularResponse->assertStatus(200);
        $this->assertEquals('ANULADA', $anularResponse->json('datos.estado'));

        // 5. Verificar que el stock físico es exactamente 0.000 (Piso 0, no -15 kg)
        $insumoFinal = DB::table('insumo')->where('id', $insumoId)->first();
        $this->assertEquals(0.000, (float) $insumoFinal->stock_actual);
        $this->assertEquals('agotado', $insumoFinal->estado);

        // 6. Verificar que se asentó la auditoría con el déficit de 15 kg consumido por cocina
        $auditoria = DB::table('auditoria_stock_ajuste')
            ->where('insumo_id', $insumoId)
            ->where('motivo', 'conteo_fisico_inventario')
            ->orderBy('created_at', 'desc')
            ->first();

        $this->assertNotNull($auditoria);
        $this->assertEquals(5.000, (float) $auditoria->stock_anterior);
        $this->assertEquals(0.000, (float) $auditoria->stock_nuevo);
        $this->assertEquals(-5.000, (float) $auditoria->diferencia);
        $this->assertStringContainsString('Déficit cocina absorbido: 15', $auditoria->notas);
    }

    /**
     * Test 7: Anular compra ya anulada es rechazada (idempotencia y protección)
     */
    public function test_anular_ficha_ya_anulada_rechaza_con_error(): void
    {
        $proveedor = DB::table('proveedor')->where('local_id', $this->localId)->first();
        $insumo = DB::table('insumo')->where('local_id', $this->localId)->first();

        $regResponse = $this->postJson('/api/v1/admin/compras', [
            'proveedor_id' => $proveedor->id,
            'tipo_comprobante' => 'BOLETA',
            'numero_comprobante' => 'B003-009911',
            'fecha_emision' => date('Y-m-d'),
            'metodo_pago' => 'EFECTIVO',
            'items' => [
                ['insumo_id' => $insumo->id, 'cantidad' => 2.0, 'precio_unitario' => 10.0],
            ],
        ], $this->headers());

        $fichaId = $regResponse->json('datos.ficha.id');

        // Primera anulación exitosa
        $this->postJson("/api/v1/admin/compras/{$fichaId}/anular", [
            'motivo' => 'Anulación inicial justificada.',
        ], $this->headers())->assertStatus(200);

        // Segunda anulación rechazada con 422
        $segunda = $this->postJson("/api/v1/admin/compras/{$fichaId}/anular", [
            'motivo' => 'Intento repetido de anulación.',
        ], $this->headers());

        $segunda->assertStatus(422);
    }

    /**
     * Test 8: Reactivación batch de platos
     */
    public function test_reactivar_platos_lote(): void
    {
        $categoria = DB::table('categoria_producto')->where('local_id', $this->localId)->first();
        $productoId = (string) Str::uuid();

        DB::table('producto')->insert([
            'id' => $productoId,
            'local_id' => $this->localId,
            'categoria_id' => $categoria->id,
            'nombre' => 'Ceviche Mixto ' . Str::random(5),
            'precio' => 45.00,
            'disponibilidad' => 'agotado',
            'motivo_agotado' => 'quiebre_stock_receta',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/admin/compras/reactivar-platos', [
            'plato_ids' => [$productoId],
        ], $this->headers());

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('datos.actualizados'));

        $prodActualizado = DB::table('producto')->where('id', $productoId)->first();
        $this->assertEquals('disponible', $prodActualizado->disponibilidad);
        $this->assertNull($prodActualizado->motivo_agotado);
    }
}
