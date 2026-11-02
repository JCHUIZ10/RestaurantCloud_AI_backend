<?php

namespace Tests\Feature;

use App\Http\Middleware\RedisTokenAuth;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CategoriaOrdenTest extends TestCase
{
    use DatabaseTransactions;

    private string $empresaId;
    private string $localId;
    private Usuario $usuario;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(RedisTokenAuth::class);
        DB::select("SELECT set_config('app.current_user_role', 'admin_saas', true)");
        DB::select("SELECT set_config('app.current_local_id', '', true)");
        DB::select("SELECT set_config('app.current_empresa_id', '', true)");

        $this->empresaId = (string) Str::uuid();
        DB::table('empresa')->insert([
            'id' => $this->empresaId,
            'ruc' => '20' . random_int(100000000, 999999999),
            'razon_social' => 'Empresa Test Categorias',
            'tipo_identidad_fiscal' => 'RUC_20',
            'correo_contacto' => 'cat@example.test',
            'telefono' => '999999999',
            'plan_id' => 1,
        ]);

        DB::table('departamento')->insertOrIgnore(['codigo' => '99', 'nombre' => 'Prueba']);
        DB::table('provincia')->insertOrIgnore(['codigo' => '9999', 'departamento_codigo' => '99', 'nombre' => 'Prueba']);
        DB::table('distrito')->insertOrIgnore(['codigo' => '999999', 'provincia_codigo' => '9999', 'departamento_codigo' => '99', 'nombre' => 'Prueba']);

        $this->localId = (string) Str::uuid();
        DB::table('local')->insert([
            'id' => $this->localId,
            'empresa_id' => $this->empresaId,
            'nombre' => 'Local Test Categorias',
            'direccion' => 'Calle Falsa 123',
            'ubigeo_cod' => '999999',
            'telefono' => '999999999',
            'slug' => 'local-cat-' . Str::random(8),
            'estado' => 'activo',
        ]);

        $usuarioId = (string) Str::uuid();
        DB::table('usuario')->insert([
            'id' => $usuarioId,
            'empresa_id' => $this->empresaId,
            'nombre' => 'Admin Categorias',
            'password_hash' => 'hash',
            'local_id' => $this->localId,
            'correo' => 'admin-' . Str::random(8) . '@test.com',
            'rol' => 'admin_local',
            'estado' => 'activo',
        ]);

        $this->usuario = Usuario::query()->findOrFail($usuarioId);
    }

    public function test_crear_categoria_al_final_por_defecto(): void
    {
        $res1 = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', [
            'nombre' => 'Cat 1',
        ]);
        $res1->assertCreated();
        $this->assertEquals(1, $res1->json('datos.orden'));

        $res2 = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', [
            'nombre' => 'Cat 2',
            'posicion' => 'fin',
        ]);
        $res2->assertCreated();
        $this->assertEquals(2, $res2->json('datos.orden'));
    }

    public function test_crear_categoria_al_inicio(): void
    {
        $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Existente 1']);
        $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Existente 2']);

        // Insertar al inicio
        $res = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', [
            'nombre' => 'Nueva Primera',
            'posicion' => 'inicio',
        ]);

        $res->assertCreated();
        $this->assertEquals(1, $res->json('datos.orden'));

        // Verificar que las demás se desplazaron a 2 y 3
        $list = $this->actingAs($this->usuario)->getJson('/api/v1/admin/categorias');
        $categorias = collect($list->json('datos.categorias'))->sortBy('orden')->values();

        $this->assertEquals('Nueva Primera', $categorias[0]['nombre']);
        $this->assertEquals(1, $categorias[0]['orden']);
        $this->assertEquals('Existente 1', $categorias[1]['nombre']);
        $this->assertEquals(2, $categorias[1]['orden']);
        $this->assertEquals('Existente 2', $categorias[2]['nombre']);
        $this->assertEquals(3, $categorias[2]['orden']);
    }

    public function test_crear_categoria_en_posicion_especifica(): void
    {
        $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Cat A'])->assertCreated();
        $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Cat B'])->assertCreated();
        $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Cat C'])->assertCreated();

        // Insertar en posicion 2
        $res = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', [
            'nombre' => 'Intermedia',
            'posicion' => 2,
        ]);

        $res->assertCreated();
        $this->assertEquals(2, $res->json('datos.orden'));

        $list = $this->actingAs($this->usuario)->getJson('/api/v1/admin/categorias');
        $categorias = collect($list->json('datos.categorias'))->sortBy('orden')->values();

        $this->assertEquals('Cat A', $categorias[0]['nombre']);
        $this->assertEquals(1, $categorias[0]['orden']);
        $this->assertEquals('Intermedia', $categorias[1]['nombre']);
        $this->assertEquals(2, $categorias[1]['orden']);
        $this->assertEquals('Cat B', $categorias[2]['nombre']);
        $this->assertEquals(3, $categorias[2]['orden']);
        $this->assertEquals('Cat C', $categorias[3]['nombre']);
        $this->assertEquals(4, $categorias[3]['orden']);
    }

    public function test_reordenar_salto_directo_posicion(): void
    {
        $c1 = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Primero'])->json('datos.id');
        $c2 = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Segundo'])->json('datos.id');
        $c3 = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Tercero'])->json('datos.id');
        $c4 = $this->actingAs($this->usuario)->postJson('/api/v1/admin/categorias', ['nombre' => 'Cuarto'])->json('datos.id');

        // Mover Cuarto a posicion 2
        $resReorden = $this->actingAs($this->usuario)->patchJson('/api/v1/admin/categorias/reordenar', [
            'categorias' => [
                ['id' => $c1, 'orden' => 1],
                ['id' => $c4, 'orden' => 2],
                ['id' => $c2, 'orden' => 3],
                ['id' => $c3, 'orden' => 4],
            ],
        ]);

        $resReorden->assertOk();

        $list = $this->actingAs($this->usuario)->getJson('/api/v1/admin/categorias');
        $categorias = collect($list->json('datos.categorias'))->sortBy('orden')->values();

        $this->assertEquals('Primero', $categorias[0]['nombre']);
        $this->assertEquals(1, $categorias[0]['orden']);
        $this->assertEquals('Cuarto', $categorias[1]['nombre']);
        $this->assertEquals(2, $categorias[1]['orden']);
        $this->assertEquals('Segundo', $categorias[2]['nombre']);
        $this->assertEquals(3, $categorias[2]['orden']);
        $this->assertEquals('Tercero', $categorias[3]['nombre']);
        $this->assertEquals(4, $categorias[3]['orden']);
    }
}
