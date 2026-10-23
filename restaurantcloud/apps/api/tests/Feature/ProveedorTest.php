<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProveedorTest extends TestCase
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
        $rawToken = 'test_token_admin_prov_' . Str::random(32);
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
     * Test 1: Listado de proveedores retorna estructura esperada con KPIs y paginación.
     */
    public function test_listado_proveedores_retorna_kpis_y_estructura_correcta(): void
    {
        $response = $this->getJson('/api/v1/admin/proveedores', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'kpis' => [
                    'total_activos',
                    'compras_mes_total',
                    'fichas_mes_total',
                    'proveedores_frecuentes',
                ],
                'proveedores' => [
                    '*' => [
                        'id',
                        'local_id',
                        'nombre',
                        'contacto',
                        'telefono',
                        'email',
                        'direccion',
                        'activo',
                        'insumos_habituales',
                        'total_compras',
                        'total_gastado',
                        'ultima_compra_fecha',
                        'ultima_compra_total',
                        'created_at',
                    ],
                ],
                'total_items',
                'pagina',
                'items_pagina',
                'total_paginas',
            ],
        ]);
        $this->assertTrue($response->json('exito'));
    }

    /**
     * Test 2: Alta ágil de proveedor con insumos habituales de la sede.
     */
    public function test_crear_proveedor_exitoso_con_insumos_habituales(): void
    {
        // Obtener un insumo existente en la sede
        $insumoId = DB::table('insumo')->where('local_id', $this->localId)->value('id');

        $nombre = 'Avícola Santa Anita ' . Str::random(5);
        $payload = [
            'nombre' => $nombre,
            'contacto' => 'Carlos Méndez',
            'telefono' => '+51 988 777 666',
            'email' => 'ventas@santaanita.com',
            'direccion' => 'Av. Separadora Industrial 123',
            'insumos_ids' => $insumoId ? [$insumoId] : [],
        ];

        $response = $this->postJson('/api/v1/admin/proveedores', $payload, $this->headers());

        $response->assertStatus(201);
        $response->assertJsonPath('datos.nombre', $nombre);
        $response->assertJsonPath('datos.telefono', '+51 988 777 666');
        $response->assertJsonPath('datos.activo', true);

        if ($insumoId) {
            $this->assertNotEmpty($response->json('datos.insumos_habituales'));
            $this->assertEquals($insumoId, $response->json('datos.insumos_habituales.0.insumo_id'));
        }

        $provId = $response->json('datos.id');
        $this->assertDatabaseHas('proveedor', [
            'id' => $provId,
            'local_id' => $this->localId,
            'nombre' => $nombre,
        ]);
    }

    /**
     * Test 3: Duplicidad de nombre en la misma sede es rechazada con 409.
     */
    public function test_crear_proveedor_duplicado_rechaza_con_409(): void
    {
        $nombre = 'Distribuidora Panamericana ' . Str::random(5);
        $payload = [
            'nombre' => $nombre,
            'telefono' => '+51 911 222 333',
        ];

        // Primer registro exitoso
        $res1 = $this->postJson('/api/v1/admin/proveedores', $payload, $this->headers());
        $res1->assertStatus(201);

        // Segundo intento con variación de mayúsculas/espacios
        $payloadDuplicado = [
            'nombre' => '  ' . strtoupper($nombre) . '  ',
            'telefono' => '+51 999 000 111',
        ];

        $res2 = $this->postJson('/api/v1/admin/proveedores', $payloadDuplicado, $this->headers());
        $res2->assertStatus(409);
        $res2->assertJsonPath('errores.0.codigo', 'ERR_PROVEEDOR_DUPLICADO');
    }

    /**
     * Test 4: Actualizar proveedor y sincronizar insumos habituales.
     */
    public function test_actualizar_proveedor_exitoso_y_sincroniza_insumos(): void
    {
        $id = (string) Str::uuid();
        DB::table('proveedor')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'nombre' => 'Proveedor Original ' . Str::random(4),
            'telefono' => '+51 900 111 222',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $nuevoNombre = 'Proveedor Actualizado ' . Str::random(4);
        $payload = [
            'nombre' => $nuevoNombre,
            'contacto' => 'Gerente de Ventas',
            'telefono' => '+51 955 444 333',
            'email' => 'ventas@actualizado.com',
            'insumos_ids' => [],
        ];

        $response = $this->putJson("/api/v1/admin/proveedores/{$id}", $payload, $this->headers());
        $response->assertStatus(200);
        $response->assertJsonPath('datos.nombre', $nuevoNombre);
        $response->assertJsonPath('datos.telefono', '+51 955 444 333');
    }

    /**
     * Test 5: Conmutar estado activo/inactivo.
     */
    public function test_conmutar_estado_proveedor(): void
    {
        $id = (string) Str::uuid();
        DB::table('proveedor')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'nombre' => 'Proveedor Toggle ' . Str::random(4),
            'telefono' => '+51 900 888 777',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Desactivar
        $res1 = $this->patchJson("/api/v1/admin/proveedores/{$id}/estado", ['activo' => false], $this->headers());
        $res1->assertStatus(200);
        $res1->assertJsonPath('datos.activo', false);

        // Reactivar
        $res2 = $this->patchJson("/api/v1/admin/proveedores/{$id}/estado", ['activo' => true], $this->headers());
        $res2->assertStatus(200);
        $res2->assertJsonPath('datos.activo', true);
    }

    /**
     * Test 6: Bloqueo de eliminación con compras registradas (ON DELETE RESTRICT).
     */
    public function test_eliminar_proveedor_con_compras_bloquea_on_delete_restrict_409(): void
    {
        // En seed 07 existe 'Mercado Mayorista San Pedro' con ficha de compra registrada
        $provId = '00000000-0000-4000-8000-000000000411';

        $response = $this->deleteJson("/api/v1/admin/proveedores/{$provId}", [], $this->headers());

        $response->assertStatus(409);
        $response->assertJsonPath('errores.0.codigo', 'ERR_PROVEEDOR_TIENE_COMPRAS');
        $this->assertDatabaseHas('proveedor', ['id' => $provId]);
    }

    /**
     * Test 7: Eliminar proveedor sin compras se completa exitosamente.
     */
    public function test_eliminar_proveedor_sin_compras_elimina_correctamente(): void
    {
        $id = (string) Str::uuid();
        DB::table('proveedor')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'nombre' => 'Proveedor Efimero ' . Str::random(4),
            'telefono' => '+51 900 333 444',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->deleteJson("/api/v1/admin/proveedores/{$id}", [], $this->headers());
        $response->assertStatus(200);
        $this->assertDatabaseMissing('proveedor', ['id' => $id]);
    }

    /**
     * Test 8: Obtener historial de compras para el Drawer lateral.
     */
    public function test_obtener_historial_compras_proveedor(): void
    {
        $provId = '00000000-0000-4000-8000-000000000411';

        $response = $this->getJson("/api/v1/admin/proveedores/{$provId}/historial", $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'proveedor_id',
                'proveedor_nombre',
                'contacto',
                'telefono',
                'total_facturado',
                'total_fichas',
                'variacion_precio_texto',
                'compras' => [
                    '*' => [
                        'id',
                        'numero_comprobante',
                        'tipo_comprobante',
                        'fecha_emision',
                        'metodo_pago',
                        'total',
                        'items',
                    ],
                ],
            ],
        ]);
        $this->assertTrue($response->json('exito'));
    }
}
