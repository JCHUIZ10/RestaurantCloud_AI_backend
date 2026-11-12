<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class PoliticasReservaAdminTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $propietarioId = '00000000-0000-4000-8000-000000000101';

    /** @var array<string, mixed> */
    private array $parametros = [
        'acepta_reservas' => true,
        'duracion_reserva_min' => 120,
        'buffer_reserva_min' => 10,
        'tolerancia_no_show_min' => 20,
        'minutos_bloqueo_previo' => 45,
        'margen_recordatorio_min' => 90,
        'anticipacion_minima_horas' => 3,
        'anticipacion_maxima_dias' => 60,
    ];

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('politicas_reserva')->updateOrInsert(['local_id' => $this->localId], [
            'acepta_reservas' => true,
            'duracion_reserva_min' => 90,
            'buffer_reserva_min' => 15,
            'tolerancia_no_show_min' => 15,
            'minutos_bloqueo_previo' => 30,
            'margen_recordatorio_min' => 120,
            'anticipacion_minima_horas' => 2,
            'anticipacion_maxima_dias' => 30,
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function headers(string $rol = 'admin_local', ?string $usuarioId = null): array
    {
        $token = 'test_token_politicas_'.Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $usuarioId ?? $this->adminId,
            'nombre' => 'Usuario Test Políticas',
            'correo' => 'politicas@aurea.local',
            'rol' => $rol,
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    private function crearReservaFutura(string $estado = 'confirmada'): string
    {
        $mesaId = (string) Str::uuid();
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert(['id' => $pisoId, 'local_id' => $this->localId, 'nombre' => 'Piso '.Str::random(4), 'columnas' => 5, 'filas' => 3, 'estado' => 'activo', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('mesa')->insert(['id' => $mesaId, 'local_id' => $this->localId, 'piso_id' => $pisoId, 'numero' => 'P'.Str::random(3), 'capacidad' => 4, 'forma' => 'cuadrada', 'posicion_x' => 1, 'posicion_y' => 1, 'permite_union' => true, 'estado' => 'activa', 'created_at' => now(), 'updated_at' => now()]);

        $reservaId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $reservaId, 'local_id' => $this->localId, 'cliente_nombre' => 'Cliente Pendiente',
            'cliente_telefono' => '+51 987 654 321', 'fecha_hora' => Carbon::now()->addDays(2), 'num_personas' => 4,
            'estado' => $estado, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert(['reserva_id' => $reservaId, 'mesa_id' => $mesaId]);

        return $reservaId;
    }

    public function test_obtener_devuelve_valores_vigentes_con_nombre_de_sede(): void
    {
        $respuesta = $this->getJson('/api/v1/admin/reservas/politicas', $this->headers());

        $respuesta->assertOk()
            ->assertJsonPath('datos.acepta_reservas', true)
            ->assertJsonPath('datos.duracion_reserva_min', 90)
            ->assertJsonPath('datos.local_id', $this->localId);
        $this->assertNotEmpty($respuesta->json('datos.local_nombre'));
        $this->assertNotNull($respuesta->json('datos.updated_at'));
    }

    public function test_actualizar_persiste_y_el_mozo_usa_los_nuevos_valores(): void
    {
        $this->putJson('/api/v1/admin/reservas/politicas', $this->parametros, $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.duracion_reserva_min', 120);

        $this->getJson('/api/v1/mozo/reservas/politicas', $this->headers('mozo'))
            ->assertOk()
            ->assertJsonPath('datos.duracion_reserva_min', 120)
            ->assertJsonPath('datos.tolerancia_no_show_min', 20)
            ->assertJsonPath('datos.max_dias_anticipacion', 60)
            ->assertJsonPath('datos.acepta_reservas', true);
    }

    public function test_actualizar_rechaza_valores_fuera_de_rango(): void
    {
        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'duracion_reserva_min' => 10], $this->headers())
            ->assertStatus(422);
        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'anticipacion_maxima_dias' => 120], $this->headers())
            ->assertStatus(422);

        $this->assertDatabaseHas('politicas_reserva', ['local_id' => $this->localId, 'duracion_reserva_min' => 90]);
    }

    public function test_valor_fuera_de_rango_responde_con_mensaje_legible_que_nombra_el_campo_y_el_rango(): void
    {
        $respuesta = $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'duracion_reserva_min' => 10], $this->headers());

        $respuesta->assertStatus(422);
        $mensaje = $respuesta->json('errors.duracion_reserva_min.0');
        $this->assertSame('El campo duración de la reserva (minutos) debe estar entre 30 y 240.', $mensaje);
        $this->assertStringNotContainsString('validation.', $respuesta->getContent());
    }

    public function test_los_mensajes_de_validacion_estan_traducidos_en_todo_el_sistema(): void
    {
        $respuesta = $this->putJson('/api/v1/admin/reservas/politicas', [], $this->headers());

        $respuesta->assertStatus(422);
        $this->assertSame('El campo recepción de reservas es obligatorio.', $respuesta->json('errors.acepta_reservas.0'));
        $this->assertStringNotContainsString('validation.', $respuesta->getContent());
    }

    public function test_margen_de_recordatorio_acepta_solo_de_15_a_1440_minutos(): void
    {
        foreach ([10, 2000] as $invalido) {
            $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'margen_recordatorio_min' => $invalido], $this->headers())
                ->assertStatus(422)
                ->assertJsonValidationErrors(['margen_recordatorio_min']);
        }

        foreach ([15, 1440] as $valido) {
            $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'margen_recordatorio_min' => $valido], $this->headers())
                ->assertOk()
                ->assertJsonPath('datos.margen_recordatorio_min', $valido);
        }
    }

    public function test_guardar_sin_anticipacion_minima_conserva_el_valor_guardado(): void
    {
        DB::table('politicas_reserva')->where('local_id', $this->localId)->update(['anticipacion_minima_horas' => 5]);
        $sinAnticipacionMinima = collect($this->parametros)->except('anticipacion_minima_horas')->all();

        $this->putJson('/api/v1/admin/reservas/politicas', $sinAnticipacionMinima, $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.duracion_reserva_min', 120)
            ->assertJsonPath('datos.anticipacion_minima_horas', 5);

        $this->assertDatabaseHas('politicas_reserva', ['local_id' => $this->localId, 'anticipacion_minima_horas' => 5]);
    }

    public function test_apagar_con_reservas_pendientes_exige_confirmacion_y_audita(): void
    {
        $reservaId = $this->crearReservaFutura();
        $apagado = [...$this->parametros, 'acepta_reservas' => false];

        $precheck = $this->getJson('/api/v1/admin/reservas/politicas/precheck-desactivacion', $this->headers());
        $precheck->assertOk()->assertJsonPath('datos.permite_desactivar', false);
        $this->assertContains($reservaId, collect($precheck->json('datos.reservas'))->pluck('id')->all());

        $rechazo = $this->putJson('/api/v1/admin/reservas/politicas', $apagado, $this->headers());
        $rechazo->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_RESERVAS_FUTURAS_PENDIENTES');
        $this->assertGreaterThanOrEqual(1, $rechazo->json('errores.0.detalles.total_pendientes'));
        $this->assertTrue((bool) DB::table('politicas_reserva')->where('local_id', $this->localId)->value('acepta_reservas'));

        $this->putJson('/api/v1/admin/reservas/politicas', [...$apagado, 'confirmar_desactivacion' => true], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.acepta_reservas', false);

        $this->assertDatabaseHas('log_auditoria', ['local_id' => $this->localId, 'accion' => 'DESACTIVACION_CANAL_RESERVAS']);
        $this->assertDatabaseHas('reserva', ['id' => $reservaId, 'estado' => 'confirmada']);
    }

    public function test_apagar_sin_reservas_pendientes_no_pide_confirmacion(): void
    {
        DB::table('reserva')->where('local_id', $this->localId)->whereIn('estado', ['confirmada', 'bloqueada'])->update(['estado' => 'cancelada']);

        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'acepta_reservas' => false], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.acepta_reservas', false);
    }

    public function test_edicion_sobre_version_desactualizada_se_rechaza(): void
    {
        $version = $this->getJson('/api/v1/admin/reservas/politicas', $this->headers())->json('datos.updated_at');

        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'updated_at' => $version], $this->headers())
            ->assertOk();

        // Otro administrador guarda después. El trigger de la tabla fija updated_at a NOW() (inicio de la
        // transacción de este test, que no avanza), así que se desactiva solo para simular el instante posterior.
        DB::unprepared('ALTER TABLE politicas_reserva DISABLE TRIGGER trg_set_updated_at');
        DB::table('politicas_reserva')->where('local_id', $this->localId)->update(['updated_at' => Carbon::parse($version)->addMinute()]);
        DB::unprepared('ALTER TABLE politicas_reserva ENABLE TRIGGER trg_set_updated_at');

        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'duracion_reserva_min' => 60, 'updated_at' => $version], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_POLITICAS_MODIFICADAS');
    }

    public function test_restaurar_valores_conserva_el_estado_del_interruptor(): void
    {
        DB::table('reserva')->where('local_id', $this->localId)->whereIn('estado', ['confirmada', 'bloqueada'])->update(['estado' => 'cancelada']);
        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'acepta_reservas' => false], $this->headers())->assertOk();

        $this->postJson('/api/v1/admin/reservas/politicas/restaurar-default', [], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.acepta_reservas', false)
            ->assertJsonPath('datos.duracion_reserva_min', 90)
            ->assertJsonPath('datos.anticipacion_maxima_dias', 30);
    }

    public function test_propietario_puede_editar_las_politicas(): void
    {
        $this->putJson('/api/v1/admin/reservas/politicas', $this->parametros, $this->headers('propietario', $this->propietarioId))
            ->assertOk()
            ->assertJsonPath('datos.duracion_reserva_min', 120);
    }

    public function test_mozo_no_puede_editar_las_politicas(): void
    {
        $this->putJson('/api/v1/admin/reservas/politicas', $this->parametros, $this->headers('mozo'))
            ->assertStatus(403)
            ->assertJsonPath('errores.0.codigo', 'ROL_SIN_PERMISO');
    }

    public function test_plan_sin_modulo_de_reservas_bloquea_admin_y_mozo(): void
    {
        DB::table('plan')->where('id', 2)->update(['incluye_reservas' => false]);

        $this->getJson('/api/v1/admin/reservas/politicas', $this->headers())
            ->assertStatus(403)
            ->assertJsonPath('errores.0.codigo', 'ERR_MODULO_RESERVAS_NO_CONTRATADO');

        $this->getJson('/api/v1/mozo/reservas?fecha='.now()->toDateString(), $this->headers('mozo'))
            ->assertStatus(403)
            ->assertJsonPath('errores.0.codigo', 'ERR_MODULO_RESERVAS_NO_CONTRATADO');

        DB::table('plan')->where('id', 2)->update(['incluye_reservas' => true]);
        $this->getJson('/api/v1/admin/reservas/politicas', $this->headers())->assertOk();
    }

    /** @var array<int, string> */
    private array $reservasCreadas = [];

    protected function tearDown(): void
    {
        if ($this->reservasCreadas !== []) {
            DB::table('reserva')->whereIn('id', $this->reservasCreadas)->delete();
        }

        parent::tearDown();
    }

    /** Crea una mesa propia y reservas activas en ella a las horas dadas (hoy + 3 días). */
    private function reservasEnUnaMesa(array $horas): array
    {
        $pisoId = (string) Str::uuid();
        $mesaId = (string) Str::uuid();
        DB::table('piso')->insert(['id' => $pisoId, 'local_id' => $this->localId, 'nombre' => 'Piso '.Str::random(4), 'columnas' => 5, 'filas' => 3, 'estado' => 'activo', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('mesa')->insert(['id' => $mesaId, 'local_id' => $this->localId, 'piso_id' => $pisoId, 'numero' => 'I'.Str::random(3), 'capacidad' => 4, 'forma' => 'cuadrada', 'posicion_x' => 1, 'posicion_y' => 1, 'permite_union' => true, 'estado' => 'activa', 'created_at' => now(), 'updated_at' => now()]);

        $ids = [];
        foreach ($horas as $hora) {
            $id = (string) Str::uuid();
            DB::table('reserva')->insert([
                'id' => $id, 'local_id' => $this->localId, 'cliente_nombre' => 'Cliente '.$hora,
                'cliente_telefono' => '+51 987 654 321', 'fecha_hora' => Carbon::now()->addDays(3)->setTimeFromTimeString($hora),
                'num_personas' => 2, 'estado' => 'confirmada', 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('reserva_mesa')->insert(['reserva_id' => $id, 'mesa_id' => $mesaId]);
            $ids[] = $id;
        }
        $this->reservasCreadas = [...$this->reservasCreadas, ...$ids];

        return $ids;
    }

    public function test_subir_la_duracion_con_reservas_que_chocarian_exige_confirmacion(): void
    {
        [$primera, $segunda] = $this->reservasEnUnaMesa(['13:00', '15:00']);

        $respuesta = $this->putJson('/api/v1/admin/reservas/politicas', $this->parametros, $this->headers());

        $respuesta->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_POLITICAS_AFECTAN_RESERVAS');
        $detalles = $respuesta->json('errores.0.detalles');
        $this->assertEqualsCanonicalizing([$primera, $segunda], array_column($detalles['choques'], 'id'));
        $this->assertStringContainsString('se requieren 130 min', $detalles['choques'][0]['motivo']);
        $this->assertDatabaseHas('politicas_reserva', ['local_id' => $this->localId, 'duracion_reserva_min' => 90]);
    }

    public function test_confirmar_el_impacto_guarda_y_audita_los_cambios(): void
    {
        $this->reservasEnUnaMesa(['13:00', '15:00']);

        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'confirmar_impacto' => true], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.duracion_reserva_min', 120);

        $auditoria = DB::table('log_auditoria')->where('local_id', $this->localId)->where('accion', 'CAMBIO_POLITICAS_RESERVA')->latest('fecha')->first();
        $detalle = json_decode($auditoria->detalle, true);
        $this->assertSame(['antes' => 90, 'despues' => 120], $detalle['cambios']['duracion_reserva_min']);
        $this->assertSame(2, $detalle['reservas_afectadas']);
    }

    public function test_bajar_la_duracion_no_revisa_reservas(): void
    {
        $this->reservasEnUnaMesa(['13:00', '14:45']);

        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'duracion_reserva_min' => 60, 'buffer_reserva_min' => 10], $this->headers())
            ->assertOk();
    }

    public function test_un_choque_que_ya_existia_no_se_atribuye_al_cambio(): void
    {
        // 13:00 → 13:45 chocan ya con 90 + 15; subir solo la tolerancia no los vuelve a señalar
        $this->reservasEnUnaMesa(['13:00', '13:45']);

        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'duracion_reserva_min' => 90, 'buffer_reserva_min' => 15], $this->headers())
            ->assertOk();
    }

    public function test_reserva_de_la_ultima_franja_que_dejaria_de_caber_se_reporta_fuera_de_horario(): void
    {
        [$id] = $this->reservasEnUnaMesa(['21:30']);

        $respuesta = $this->postJson('/api/v1/admin/reservas/politicas/precheck-impacto', ['duracion_reserva_min' => 120, 'buffer_reserva_min' => 15], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.hay_impacto', true);

        $this->assertContains($id, array_column($respuesta->json('datos.fuera_de_horario'), 'id'));
    }

    public function test_precheck_sin_cambios_que_afecten_no_reporta_impacto(): void
    {
        $this->reservasEnUnaMesa(['13:00', '15:00']);

        $this->postJson('/api/v1/admin/reservas/politicas/precheck-impacto', ['duracion_reserva_min' => 90, 'buffer_reserva_min' => 15], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.hay_impacto', false)
            ->assertJsonPath('datos.total', 0);
    }

    public function test_cambiar_solo_la_tolerancia_se_audita_sin_pedir_confirmacion(): void
    {
        $this->putJson('/api/v1/admin/reservas/politicas', [...$this->parametros, 'duracion_reserva_min' => 90, 'buffer_reserva_min' => 15, 'tolerancia_no_show_min' => 25], $this->headers())
            ->assertOk();

        $auditoria = DB::table('log_auditoria')->where('local_id', $this->localId)->where('accion', 'CAMBIO_POLITICAS_RESERVA')->latest('fecha')->first();
        $this->assertSame(['antes' => 15, 'despues' => 25], json_decode($auditoria->detalle, true)['cambios']['tolerancia_no_show_min']);
    }
}
