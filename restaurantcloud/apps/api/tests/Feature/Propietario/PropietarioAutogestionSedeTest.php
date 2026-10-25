<?php

namespace Tests\Feature\Propietario;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class PropietarioAutogestionSedeTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $propietarioId = '00000000-0000-4000-8000-000000000101';

    private string $localMirafloresId = '00000000-0000-4000-8000-000000000010';

    private string $tokenPropietario;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_autogestion_'.Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->propietarioId,
            'nombre' => 'Rodrigo De Las Casas',
            'correo' => 'propietario@aurea.local',
            'rol' => 'propietario',
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenPropietario = $rawToken;
    }

    private function headers(?string $localId = null, ?string $token = null): array
    {
        $headers = [
            'Authorization' => 'Bearer '.($token ?: $this->tokenPropietario),
            'Accept' => 'application/json',
        ];

        if ($localId) {
            $headers['X-Local-Id'] = $localId;
        }

        return $headers;
    }

    /**
     * Test 1: Propietario con cabecera X-Local-Id puede consultar el plano de mesas de una sede autogestionada.
     */
    public function test_propietario_con_x_local_id_puede_acceder_a_pisos_de_sede_autogestionada(): void
    {
        $response = $this->getJson('/api/v1/admin/pisos', $this->headers($this->localMirafloresId));

        $response->assertStatus(200);
        $response->assertJsonPath('exito', true);
        $response->assertJsonPath('datos.local_id', $this->localMirafloresId);
        $this->assertNotEmpty($response->json('datos.pisos'));
    }

    /**
     * Test 2: Propietario con X-Local-Id puede consultar categorías y productos de la sede activa.
     */
    public function test_propietario_con_x_local_id_puede_acceder_a_categorias_y_productos(): void
    {
        // Categorías
        $resCategorias = $this->getJson('/api/v1/admin/categorias', $this->headers($this->localMirafloresId));
        $resCategorias->assertStatus(200);
        $resCategorias->assertJsonPath('exito', true);
        $resCategorias->assertJsonPath('datos.local_id', $this->localMirafloresId);

        // Productos
        $resProductos = $this->getJson('/api/v1/admin/productos', $this->headers($this->localMirafloresId));
        $resProductos->assertStatus(200);
        $resProductos->assertJsonPath('exito', true);
        $this->assertArrayHasKey('productos', $resProductos->json('datos'));
    }

    /**
     * Test 3: Propietario con X-Local-Id puede acceder a KDS y métodos de pago de su sede.
     */
    public function test_propietario_con_x_local_id_puede_acceder_a_configuracion_kds_y_metodos_pago(): void
    {
        $resKds = $this->getJson('/api/v1/admin/configuracion-kds', $this->headers($this->localMirafloresId));
        $resKds->assertStatus(200);
        $resKds->assertJsonPath('exito', true);

        $resMetodos = $this->getJson('/api/v1/admin/metodos-pago', $this->headers($this->localMirafloresId));
        $resMetodos->assertStatus(200);
        $resMetodos->assertJsonPath('exito', true);
    }

    /**
     * Test 4: Propietario enviando un X-Local-Id de otra empresa no puede acceder (aislamiento fail-closed).
     */
    public function test_propietario_con_local_id_de_otra_empresa_es_rechazado(): void
    {
        $otraEmpresaId = (string) Str::uuid();
        $otroLocalId = (string) Str::uuid();

        DB::table('empresa')->insert([
            'id' => $otraEmpresaId,
            'ruc' => '20'.random_int(100000000, 999999999),
            'razon_social' => 'Otra Empresa S.A.C.',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo_contacto' => 'otra@empresa.pe',
            'telefono' => '+51 999999999',
            'plan_id' => 1,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('local')->insert([
            'id' => $otroLocalId,
            'empresa_id' => $otraEmpresaId,
            'nombre' => 'Sede Ajena',
            'slug' => 'sede-ajena-'.Str::random(8),
            'direccion' => 'Calle Ajena 123',
            'ubigeo_cod' => '150101',
            'telefono' => '+51 987654321',
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $response = $this->getJson('/api/v1/admin/pisos', $this->headers($otroLocalId));
            // Como el local no pertenece a la empresa de Rodrigo, no se fija el local_id y PlanoController rechaza con ERR_SEDE_INVALIDA
            $response->assertStatus(403);
            $response->assertJsonPath('errores.0.codigo', 'ERR_SEDE_INVALIDA');
        } finally {
            DB::table('local')->where('id', $otroLocalId)->delete();
            DB::table('empresa')->where('id', $otraEmpresaId)->delete();
        }
    }

    /**
     * Test 5: Un admin_local tiene sede inmutable y no puede cambiarla mediante X-Local-Id.
     */
    public function test_admin_local_no_puede_cambiar_sede_mediante_x_local_id(): void
    {
        $adminId = '00000000-0000-4000-8000-000000000102'; // Valeria Mendoza
        $rawTokenAdmin = 'test_token_admin_'.Str::random(32);
        $tokenHashAdmin = hash('sha256', $rawTokenAdmin);

        $sessionPayloadAdmin = [
            'id' => $adminId,
            'nombre' => 'Valeria Mendoza',
            'correo' => 'admin@aurea.local',
            'rol' => 'admin_local',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localMirafloresId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHashAdmin}", 3600, json_encode($sessionPayloadAdmin));

        // Intento de forzar otro local_id ficticio
        $localFicticio = (string) Str::uuid();
        $response = $this->getJson('/api/v1/admin/pisos', $this->headers($localFicticio, $rawTokenAdmin));

        $response->assertStatus(200);
        $response->assertJsonPath('datos.local_id', $this->localMirafloresId); // Se mantiene Miraflores
    }
}
