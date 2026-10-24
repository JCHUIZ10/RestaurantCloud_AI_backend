<?php

namespace Tests\Feature;

use App\Domains\Tenant\Services\LocalProvisioningService;
use App\Http\Middleware\RedisTokenAuth;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class PlanoMesasTest extends TestCase
{
    use DatabaseTransactions;

    private string $empresaId;

    private string $localId;

    private string $otroLocalId;

    private string $pisoId;

    private string $usuarioId;

    private int $planId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(RedisTokenAuth::class);
        DB::select("SELECT set_config('app.current_user_role', 'admin_saas', true)");
        DB::select("SELECT set_config('app.current_local_id', '', true)");
        DB::select("SELECT set_config('app.current_empresa_id', '', true)");

        $plan = (array) DB::table('plan')->first();
        $this->assertNotEmpty($plan, 'Se requieren los catálogos iniciales, sin modificar sus registros.');
        $this->planId = (int) DB::table('plan')->max('id') + 1;
        DB::table('plan')->insert([...$plan, 'id' => $this->planId, 'nombre' => 'Plano '.Str::random(8),
            'slug' => 'plano-'.Str::random(12), 'max_mesas' => 20, 'max_pisos' => 10]);
        $this->empresaId = (string) Str::uuid();
        DB::table('empresa')->insert(['id' => $this->empresaId, 'ruc' => '20'.random_int(100000000, 999999999),
            'razon_social' => 'Empresa de prueba de plano', 'tipo_identidad_fiscal' => 'RUC_20',
            'correo_contacto' => 'plano@example.test', 'telefono' => '999999999', 'plan_id' => $this->planId]);
        DB::table('departamento')->insertOrIgnore(['codigo' => '99', 'nombre' => 'Prueba']);
        DB::table('provincia')->insertOrIgnore(['codigo' => '9999', 'departamento_codigo' => '99', 'nombre' => 'Prueba']);
        DB::table('distrito')->insertOrIgnore(['codigo' => '999999', 'provincia_codigo' => '9999', 'departamento_codigo' => '99', 'nombre' => 'Prueba']);
        $this->localId = (string) Str::uuid();
        $this->otroLocalId = (string) Str::uuid();
        foreach ([$this->localId, $this->otroLocalId] as $id) {
            DB::table('local')->insert(['id' => $id, 'empresa_id' => $this->empresaId, 'nombre' => 'Sede de prueba',
                'direccion' => 'Dirección de prueba', 'ubigeo_cod' => '999999', 'telefono' => '999999999',
                'slug' => 'plano-'.Str::random(12), 'estado' => 'activo']);
        }
        $this->usuarioId = (string) Str::uuid();
        DB::table('usuario')->insert(['id' => $this->usuarioId, 'empresa_id' => $this->empresaId,
            'nombre' => 'Administrador de prueba', 'password_hash' => 'no-usado-en-estas-pruebas',
            'local_id' => $this->localId, 'correo' => Str::random(10).'@plano.test', 'rol' => 'admin_local', 'estado' => 'activo']);
        $this->actingAs(Usuario::findOrFail($this->usuarioId));
        $this->pisoId = $this->piso();
    }

    private function piso(?string $localId = null): string
    {
        $id = (string) Str::uuid();
        DB::table('piso')->insert(['id' => $id, 'local_id' => $localId ?? $this->localId,
            'nombre' => 'Ambiente '.Str::random(8), 'columnas' => 5, 'filas' => 3]);

        return $id;
    }

    private function datosMesa(array $cambios = []): array
    {
        return [...['numero' => '01', 'capacidad' => 4, 'forma' => 'cuadrada',
            'posicion_x' => 0, 'posicion_y' => 0, 'permite_union' => true], ...$cambios];
    }

    private function mesa(array $cambios = [], ?string $piso = null): string
    {
        return $this->postJson('/api/v1/admin/pisos/'.($piso ?? $this->pisoId).'/mesas', $this->datosMesa($cambios))
            ->assertCreated()->json('datos.id');
    }

    private function pedido(string $mesa, string $estado): string
    {
        $id = (string) Str::uuid();
        DB::table('pedido')->insert(['id' => $id, 'local_id' => $this->localId, 'mesa_id' => $mesa,
            'mozo_id' => $this->usuarioId, 'numero_comanda' => 713, 'estado' => $estado]);

        return $id;
    }

    public function test_crud_y_reubicacion_con_baja_no_destructiva(): void
    {
        $piso = $this->postJson('/api/v1/admin/pisos', ['nombre' => 'Terraza', 'columnas' => 2, 'filas' => 2])
            ->assertCreated()->json('datos.id');
        $mesa = $this->mesa();
        $this->putJson("/api/v1/admin/mesas/{$mesa}", $this->datosMesa(['piso_id' => $piso, 'numero' => 'VIP']))
            ->assertOk()->assertJsonPath('datos.piso_id', $piso);
        $this->patchJson("/api/v1/admin/pisos/{$piso}/nombre", ['nombre' => 'Patio'])->assertOk();
        $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertOk();
        $this->assertDatabaseHas('mesa', ['id' => $mesa, 'estado' => 'inactiva']);
        $this->patchJson("/api/v1/admin/pisos/{$piso}/desactivar")->assertOk();
        $this->assertDatabaseHas('piso', ['id' => $piso, 'estado' => 'inactivo']);
    }

    public function test_unicidad_historica_casilla_y_validaciones_sql(): void
    {
        $mesa = $this->mesa();
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas", $this->datosMesa(['numero' => '02']))
            ->assertConflict()->assertJsonPath('errores.0.codigo', 'ERR_POSICION_OCUPADA');
        $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertOk();
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas", $this->datosMesa())
            ->assertConflict()->assertJsonPath('errores.0.codigo', 'ERR_MESA_NUMERO_DUPLICADO');
        foreach ([['numero' => str_repeat('x', 11)], ['capacidad' => 21], ['posicion_x' => 5], ['posicion_y' => -1], ['forma' => 'ovalada']] as $cambio) {
            $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas", $this->datosMesa(['numero' => '02', ...$cambio]))->assertUnprocessable();
        }
        $this->postJson('/api/v1/admin/pisos', ['nombre' => str_repeat('x', 61), 'columnas' => 13, 'filas' => 11])->assertUnprocessable();
    }

    public function test_lote_es_atomico_no_reemplaza_mesas_y_respeta_codigos_historicos(): void
    {
        $payload = ['columnas' => 2, 'filas' => 1, 'prefijo' => '', 'numero_inicio' => 1,
            'capacidad' => 4, 'forma' => 'redonda', 'permite_union' => true];
        $mesa = $this->mesa(['numero' => '02']);
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas/lote", $payload)->assertConflict();
        $this->assertDatabaseHas('mesa', ['id' => $mesa, 'estado' => 'activa']);
        $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertOk();
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas/lote", $payload)->assertConflict();
        $this->assertSame(1, DB::table('mesa')->where('piso_id', $this->pisoId)->count());
        $this->assertDatabaseHas('piso', ['id' => $this->pisoId, 'columnas' => 5, 'filas' => 3]);
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas/lote", [...$payload, 'numero_inicio' => 10])
            ->assertCreated()->assertJsonPath('datos.mesas_creadas', 2);
    }

    public function test_cuota_incluye_otras_sedes_y_restaura_contexto(): void
    {
        $otroPiso = $this->piso($this->otroLocalId);
        DB::table('mesa')->insert(['id' => (string) Str::uuid(), 'local_id' => $this->otroLocalId,
            'piso_id' => $otroPiso, 'numero' => '99', 'capacidad' => 6, 'estado' => 'bloqueada']);
        DB::table('plan')->where('id', $this->planId)->update(['max_mesas' => 1, 'max_pisos' => 2]);
        $this->getJson('/api/v1/admin/pisos')->assertOk()->assertJsonPath('datos.cuota_mesas.mesas_activas_empresa', 1)
            ->assertJsonCount(1, 'datos.pisos')->assertJsonPath('datos.pisos.0.total_mesas', 0);
        $this->assertSame($this->localId, DB::selectOne("SELECT current_setting('app.current_local_id') AS id")->id);
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas", $this->datosMesa())->assertForbidden();
        $this->postJson('/api/v1/admin/pisos', ['nombre' => 'Extra', 'columnas' => 1, 'filas' => 1])->assertForbidden();
    }

    public function test_aislamiento_de_sede_rol_y_local_inactivo(): void
    {
        $otroPiso = $this->piso($this->otroLocalId);
        $this->postJson("/api/v1/admin/pisos/{$otroPiso}/mesas", $this->datosMesa())->assertNotFound();
        $this->patchJson("/api/v1/admin/pisos/{$otroPiso}/nombre", ['nombre' => 'Intruso'])->assertNotFound();
        $usuario = Usuario::findOrFail($this->usuarioId);
        $usuario->rol = 'mozo';
        $this->actingAs($usuario)->getJson('/api/v1/admin/pisos')->assertForbidden();
        $usuario->rol = 'admin_local';
        $this->actingAs($usuario);
        DB::table('local')->where('id', $this->localId)->update(['estado' => 'inactivo']);
        $this->getJson('/api/v1/admin/pisos')->assertForbidden();
    }

    public function test_recorte_baja_piso_y_casilla_respetan_mesas_bloqueadas(): void
    {
        $mesa = $this->mesa(['posicion_x' => 4]);
        DB::table('mesa')->where('id', $mesa)->update(['estado' => 'bloqueada']);
        $this->piso();
        $this->patchJson("/api/v1/admin/pisos/{$this->pisoId}/dimensiones", ['columnas' => 4, 'filas' => 3])->assertConflict();
        $this->patchJson("/api/v1/admin/pisos/{$this->pisoId}/desactivar")->assertConflict();
        $this->postJson("/api/v1/admin/pisos/{$this->pisoId}/mesas", $this->datosMesa(['numero' => '02', 'posicion_x' => 4]))->assertConflict();
    }

    public function test_no_se_puede_desactivar_ultimo_piso_y_nombre_es_unico(): void
    {
        $this->patchJson("/api/v1/admin/pisos/{$this->pisoId}/desactivar")->assertConflict();
        $nombre = DB::table('piso')->where('id', $this->pisoId)->value('nombre');
        $this->postJson('/api/v1/admin/pisos', ['nombre' => mb_strtoupper($nombre), 'columnas' => 1, 'filas' => 1])
            ->assertConflict()->assertJsonPath('errores.0.codigo', 'ERR_NOMBRE_PISO_DUPLICADO');
    }

    public function test_baja_y_movimiento_detectan_todos_los_estados_de_comanda_abierta(): void
    {
        $mesa = $this->mesa();
        foreach (['borrador', 'enviado', 'cuenta_pedida'] as $estado) {
            $pedido = $this->pedido($mesa, $estado);
            $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertConflict()
                ->assertJsonPath('errores.0.detalles.pedido_id', $pedido)
                ->assertJsonPath('errores.0.detalles.estado_pedido', $estado)
                ->assertJsonPath('errores.0.detalles.codigo_comanda', 'COM-0713');
            $this->putJson("/api/v1/admin/mesas/{$mesa}", $this->datosMesa(['posicion_x' => 1]))->assertConflict();
            DB::table('pedido')->where('id', $pedido)->update(['estado' => 'cobrado']);
        }
        $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertOk();
        $this->postJson("/api/v1/mozo/mesas/{$mesa}/abrir")->assertConflict();
    }

    public function test_baja_de_mesa_unida_detecta_pedido_en_principal(): void
    {
        $principal = $this->mesa();
        $secundaria = $this->mesa(['numero' => '02', 'posicion_x' => 1]);
        DB::table('mesa')->where('id', $secundaria)->update(['mesa_principal_id' => $principal]);
        $pedido = $this->pedido($principal, 'enviado');
        $this->patchJson("/api/v1/admin/mesas/{$secundaria}/desactivar")->assertConflict()
            ->assertJsonPath('errores.0.detalles.pedido_id', $pedido);
        DB::table('pedido')->where('id', $pedido)->update(['estado' => 'anulado']);
        $this->patchJson("/api/v1/admin/mesas/{$principal}/desactivar")->assertConflict()
            ->assertJsonPath('errores.0.codigo', 'ERR_MESA_UNIDA');
    }

    public function test_autenticacion_redis_real_y_acceso_sin_token(): void
    {
        $this->withMiddleware(RedisTokenAuth::class);
        $this->getJson('/api/v1/admin/pisos')->assertUnauthorized();
        $token = Str::random(48);
        $clave = 'auth:session:'.hash('sha256', $token);
        Redis::setex($clave, 60, json_encode([
            'id' => $this->usuarioId, 'empresa_id' => $this->empresaId,
            'local_id' => $this->localId, 'rol' => 'admin_local',
        ]));
        try {
            $this->withToken($token)->getJson('/api/v1/admin/pisos')->assertOk()
                ->assertJsonPath('datos.local_id', $this->localId);
        } finally {
            Redis::del($clave);
        }
    }

    public function test_envio_directo_no_reabre_mesa_inactiva(): void
    {
        $mesa = $this->mesa();
        $categoria = (string) Str::uuid();
        DB::table('categoria_producto')->insert(['id' => $categoria, 'local_id' => $this->localId, 'nombre' => 'Prueba']);
        $producto = (string) Str::uuid();
        DB::table('producto')->insert(['id' => $producto, 'local_id' => $this->localId, 'categoria_id' => $categoria,
            'nombre' => 'Producto de prueba', 'precio' => 12.5, 'requiere_preparacion' => false]);
        $pedido = $this->pedido($mesa, 'enviado');
        DB::table('pedido_item')->insert(['id' => (string) Str::uuid(), 'pedido_id' => $pedido,
            'producto_id' => $producto, 'cantidad' => 2, 'precio_unitario' => 12.5]);
        $this->getJson('/api/v1/admin/pisos')->assertOk()->assertJsonPath('datos.pisos.0.mesas.0.total_cuenta_activa', 25);
        $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertConflict()
            ->assertJsonPath('errores.0.detalles.total_cuenta', 25);
        DB::table('pedido')->where('id', $pedido)->update(['estado' => 'cobrado']);
        $this->patchJson("/api/v1/admin/mesas/{$mesa}/desactivar")->assertOk();
        $this->postJson("/api/v1/mozo/mesas/{$mesa}/pedidos", ['items' => [['producto_id' => $producto, 'cantidad' => 1]]])
            ->assertConflict()->assertJsonPath('errores.0.codigo', 'ERR_MESA_NO_DISPONIBLE');
        $this->assertSame(1, DB::table('pedido')->where('mesa_id', $mesa)->count());
    }

    public function test_aprovisionamiento_no_elude_cuota_de_ambientes(): void
    {
        DB::table('plan')->where('id', $this->planId)->update(['max_locales' => 10, 'max_pisos' => 1]);
        try {
            app(LocalProvisioningService::class)->provisionar($this->empresaId, [
                'nombre' => 'Sede sin cupo', 'slug' => 'sin-cupo-'.Str::random(10), 'giro_negocio' => 'en_blanco',
            ]);
            $this->fail('El aprovisionamiento debe rechazar la falta de cupo.');
        } catch (\OverflowException $exception) {
            $this->assertStringContainsString('ambientes', $exception->getMessage());
            $this->assertSame(2, DB::table('local')->where('empresa_id', $this->empresaId)->count());
        }
    }
}
