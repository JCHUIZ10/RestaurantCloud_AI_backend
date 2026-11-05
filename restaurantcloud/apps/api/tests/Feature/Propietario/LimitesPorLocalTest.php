<?php

namespace Tests\Feature\Propietario;

use App\Domains\Administradores\Services\AdministradorService;
use App\Domains\Personal\Services\PersonalService;
use App\Domains\Suscripcion\Services\ConciliacionRecursosService;
use App\Domains\Suscripcion\Services\UsoRecursosEmpresa;
use App\Domains\Tenant\Services\LocalService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class LimitesPorLocalTest extends TestCase
{
    private string $empresaId;

    private int $planId;

    /** @var list<string> */
    private array $locales = [];

    private int $orden = 0;

    protected function setUp(): void
    {
        parent::setUp();
        DB::select("SELECT set_config('app.current_user_role', 'admin_saas', true)");
        DB::select("SELECT set_config('app.current_local_id', '', true)");
        DB::select("SELECT set_config('app.current_empresa_id', '', true)");

        $plan = (array) DB::table('plan')->first();
        $this->planId = (int) DB::table('plan')->max('id') + 1;
        DB::table('plan')->insert([...$plan, 'id' => $this->planId, 'nombre' => 'Local '.Str::random(8),
            'slug' => 'local-'.Str::random(12), 'max_locales' => 2, 'max_pisos' => 2, 'max_mesas' => 3, 'max_usuarios' => 2]);

        $this->empresaId = (string) Str::uuid();
        DB::table('empresa')->insert(['id' => $this->empresaId, 'ruc' => '20'.random_int(100000000, 999999999),
            'razon_social' => 'Empresa por local', 'tipo_identidad_fiscal' => 'RUC_20',
            'correo_contacto' => 'local@example.test', 'telefono' => '999999999', 'plan_id' => $this->planId]);
        DB::table('departamento')->insertOrIgnore(['codigo' => '99', 'nombre' => 'Prueba']);
        DB::table('provincia')->insertOrIgnore(['codigo' => '9999', 'departamento_codigo' => '99', 'nombre' => 'Prueba']);
        DB::table('distrito')->insertOrIgnore(['codigo' => '999999', 'provincia_codigo' => '9999', 'departamento_codigo' => '99', 'nombre' => 'Prueba']);

        foreach ([1, 2] as $n) {
            $this->locales[] = $id = (string) Str::uuid();
            DB::table('local')->insert(['id' => $id, 'empresa_id' => $this->empresaId, 'nombre' => "Sede {$n}",
                'direccion' => 'Dirección de prueba', 'ubigeo_cod' => '999999', 'telefono' => '999999999',
                'slug' => 'local-'.Str::random(12), 'estado' => 'activo', 'created_at' => now()->addMinutes($n)]);
        }
    }

    private function usuario(string $rol, ?string $localId, string $estado = 'activo'): string
    {
        $id = (string) Str::uuid();
        DB::table('usuario')->insert(['id' => $id, 'empresa_id' => $this->empresaId, 'local_id' => $localId,
            'nombre' => Str::random(8), 'correo' => Str::random(10).'@local.test', 'password_hash' => 'x',
            'rol' => $rol, 'estado' => $estado, 'created_at' => now()->addSeconds(++$this->orden)]);

        return $id;
    }

    private function datosPersonal(): array
    {
        return ['nombre' => 'Nuevo Mozo', 'correo' => Str::random(8).'@local.test', 'telefono' => '987654321', 'rol' => 'mozo'];
    }

    public function test_el_cupo_de_personal_es_por_sede_y_no_cuenta_al_propietario(): void
    {
        $this->usuario('propietario', null);
        $this->usuario('mozo', $this->locales[0]);
        $this->usuario('cajero', $this->locales[0]);

        try {
            app(PersonalService::class)->crear($this->empresaId, $this->locales[0], $this->datosPersonal());
            $this->fail('La sede llena debe rechazar más personal.');
        } catch (\OverflowException $e) {
            $this->assertStringContainsString('por sede', $e->getMessage());
        }

        $creado = app(PersonalService::class)->crear($this->empresaId, $this->locales[1], $this->datosPersonal());
        $this->assertNotEmpty($creado['id']);
    }

    public function test_los_administradores_sin_sede_se_limitan_a_la_cantidad_de_locales_del_plan(): void
    {
        $this->usuario('admin_local', null, 'pendiente_activacion');
        $servicio = app(AdministradorService::class);

        $this->assertTrue($servicio->cuotaPersonal($this->empresaId)['puede_invitar']);

        $this->usuario('admin_local', null);

        $cuota = $servicio->cuotaPersonal($this->empresaId);
        $this->assertFalse($cuota['puede_invitar']);
        $this->assertSame(2, $cuota['cuota']['administradores_sin_sede']);
        $this->assertSame(2, $cuota['cuota']['max_sin_sede']);
    }

    public function test_un_administrador_con_sede_ocupa_cupo_de_su_sede_y_no_de_la_cola_sin_sede(): void
    {
        $this->usuario('admin_local', $this->locales[0]);
        $this->usuario('admin_local', $this->locales[0], 'inactivo');

        $this->assertSame(0, app(UsoRecursosEmpresa::class)->administradoresSinSede($this->empresaId));
        $this->assertSame(1, app(UsoRecursosEmpresa::class)->personalDelLocal($this->locales[0]));
    }

    public function test_asignar_un_administrador_a_una_sede_llena_es_rechazado(): void
    {
        $this->usuario('mozo', $this->locales[0]);
        $this->usuario('cajero', $this->locales[0]);
        $admin = $this->usuario('admin_local', null);

        $this->expectException(\OverflowException::class);

        app(LocalService::class)->actualizar($this->locales[0], $this->empresaId, [
            'modo_administracion' => 'asignar_admin',
            'administrador_usuario_id' => $admin,
        ]);
    }

    public function test_el_uso_y_los_excedentes_se_calculan_por_sede(): void
    {
        foreach ($this->locales as $local) {
            for ($i = 0; $i < 2; $i++) {
                $this->usuario('mozo', $local);
            }
        }
        $plan = DB::table('plan')->where('id', $this->planId)->first();
        $uso = app(UsoRecursosEmpresa::class);

        $this->assertFalse($uso->supera($this->empresaId, $plan));

        $this->usuario('mozo', $this->locales[1]);

        $excedidos = $uso->excedidos($this->empresaId, $plan);
        $this->assertCount(1, $excedidos);
        $this->assertSame('usuarios', $excedidos[0]['recurso']);
        $this->assertSame($this->locales[1], $excedidos[0]['local_id']);
        $this->assertSame(3, $excedidos[0]['usados']);
    }

    public function test_la_conciliacion_recorta_cada_sede_y_respeta_al_administrador_y_a_quienes_no_tienen_sede(): void
    {
        $propietario = $this->usuario('propietario', null);
        $adminSinSede = $this->usuario('admin_local', null);
        $antiguo = $this->usuario('mozo', $this->locales[0]);
        $admin = $this->usuario('admin_local', $this->locales[0]);
        $reciente = $this->usuario('cajero', $this->locales[0]);

        $plan = (object) ['nombre' => 'Mínimo', 'max_locales' => 2, 'max_pisos' => 1, 'max_mesas' => 1, 'max_usuarios' => 2];
        $desactivados = app(ConciliacionRecursosService::class)->aplicar($this->empresaId, $plan);

        $this->assertSame(1, $desactivados['usuarios']);
        foreach ([$propietario, $adminSinSede, $admin, $antiguo] as $id) {
            $this->assertSame('activo', DB::table('usuario')->where('id', $id)->value('estado'));
        }
        $this->assertSame('inactivo', DB::table('usuario')->where('id', $reciente)->value('estado'));
    }
}
