<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class ConfiguracionKdsAdminTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    /** @var array<string, mixed> */
    private array $parametros = [
        'tiempo_optimo_verde_min' => 12,
        'tiempo_alerta_ambar_min' => 20,
        'tiempo_maximo_pase_min' => 5,
        'alerta_sonora_nueva_comanda' => false,
        'alerta_sonora_comanda_roja' => true,
        'intervalo_sonido_rojo_seg' => 90,
        'vista_predeterminada' => 'all_day',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('configuracion_kds')->updateOrInsert(['local_id' => $this->localId], [
            'tiempo_optimo_verde_min' => 15,
            'tiempo_alerta_ambar_min' => 25,
            'tiempo_maximo_pase_min' => 3,
            'alerta_sonora_nueva_comanda' => true,
            'alerta_sonora_comanda_roja' => true,
            'intervalo_sonido_rojo_seg' => 60,
            'vista_predeterminada' => 'fifo',
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function headers(string $rol = 'admin_local'): array
    {
        $token = 'test_token_kds_'.Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->adminId,
            'nombre' => 'Usuario Test KDS',
            'correo' => 'kds@aurea.local',
            'rol' => $rol,
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    public function test_actualizar_persiste_los_nuevos_valores(): void
    {
        $this->putJson('/api/v1/admin/configuracion-kds', $this->parametros, $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.tiempo_optimo_verde_min', 12)
            ->assertJsonPath('datos.vista_predeterminada', 'all_day');

        $this->getJson('/api/v1/admin/configuracion-kds', $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.tiempo_alerta_ambar_min', 20)
            ->assertJsonPath('datos.alerta_sonora_nueva_comanda', false);
    }

    public function test_ambar_menor_o_igual_al_verde_responde_422_con_codigo_de_negocio(): void
    {
        $this->putJson('/api/v1/admin/configuracion-kds', [...$this->parametros, 'tiempo_alerta_ambar_min' => 12], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_UMBRALES_KDS_INCOHERENTES');

        $this->assertDatabaseHas('configuracion_kds', ['local_id' => $this->localId, 'tiempo_optimo_verde_min' => 15]);
    }

    public function test_valores_fuera_de_rango_se_rechazan(): void
    {
        $this->putJson('/api/v1/admin/configuracion-kds', [...$this->parametros, 'tiempo_optimo_verde_min' => 2], $this->headers())
            ->assertStatus(422);
        $this->putJson('/api/v1/admin/configuracion-kds', [...$this->parametros, 'intervalo_sonido_rojo_seg' => 400], $this->headers())
            ->assertStatus(422);

        $this->assertDatabaseHas('configuracion_kds', ['local_id' => $this->localId, 'tiempo_optimo_verde_min' => 15]);
    }

    public function test_restaurar_valores_recomendados_vuelve_a_los_estandar(): void
    {
        $this->putJson('/api/v1/admin/configuracion-kds', $this->parametros, $this->headers())->assertOk();

        $this->postJson('/api/v1/admin/configuracion-kds/restaurar-valores-recomendados', [], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.tiempo_optimo_verde_min', 15)
            ->assertJsonPath('datos.tiempo_alerta_ambar_min', 25)
            ->assertJsonPath('datos.tiempo_maximo_pase_min', 3)
            ->assertJsonPath('datos.vista_predeterminada', 'fifo');
    }

    public function test_roles_sin_permiso_reciben_403(): void
    {
        foreach (['mozo', 'cocinero', 'cajero'] as $rol) {
            $this->getJson('/api/v1/admin/configuracion-kds', $this->headers($rol))->assertStatus(403);
            $this->putJson('/api/v1/admin/configuracion-kds', $this->parametros, $this->headers($rol))->assertStatus(403);
        }

        $this->assertDatabaseHas('configuracion_kds', ['local_id' => $this->localId, 'tiempo_optimo_verde_min' => 15]);
    }

    public function test_edicion_sobre_version_desactualizada_se_rechaza_con_409(): void
    {
        $version = $this->getJson('/api/v1/admin/configuracion-kds', $this->headers())->json('datos.updated_at');

        $this->putJson('/api/v1/admin/configuracion-kds', [...$this->parametros, 'updated_at' => $version], $this->headers())
            ->assertOk();

        // Otro administrador guarda después. El trigger fija updated_at a NOW() (inicio de la transacción del test,
        // que no avanza), así que se desactiva solo para simular el instante posterior.
        DB::unprepared('ALTER TABLE configuracion_kds DISABLE TRIGGER trg_set_updated_at');
        DB::table('configuracion_kds')->where('local_id', $this->localId)->update(['updated_at' => Carbon::parse($version)->addMinute()]);
        DB::unprepared('ALTER TABLE configuracion_kds ENABLE TRIGGER trg_set_updated_at');

        $this->putJson('/api/v1/admin/configuracion-kds', [...$this->parametros, 'tiempo_maximo_pase_min' => 9, 'updated_at' => $version], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_KDS_MODIFICADA');

        $this->assertDatabaseMissing('configuracion_kds', ['local_id' => $this->localId, 'tiempo_maximo_pase_min' => 9]);
    }

    public function test_edicion_con_la_version_vigente_se_acepta(): void
    {
        $version = $this->getJson('/api/v1/admin/configuracion-kds', $this->headers())->json('datos.updated_at');

        $this->putJson('/api/v1/admin/configuracion-kds', [...$this->parametros, 'updated_at' => $version], $this->headers())
            ->assertOk();
    }
}
