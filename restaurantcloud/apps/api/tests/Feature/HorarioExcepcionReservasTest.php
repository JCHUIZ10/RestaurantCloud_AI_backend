<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class HorarioExcepcionReservasTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private Carbon $fecha;

    /** @var array<string, string> */
    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fecha = now()->addDays(20)->startOfDay();
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', $this->fecha)->delete();
        DB::table('politicas_reserva')->updateOrInsert(['local_id' => $this->localId], [
            'acepta_reservas' => true, 'duracion_reserva_min' => 90, 'buffer_reserva_min' => 15,
            'tolerancia_no_show_min' => 15, 'minutos_bloqueo_previo' => 30, 'updated_at' => now(),
        ]);

        $token = 'test_token_horario_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $token), 3600, json_encode([
            'id' => $this->adminId, 'nombre' => 'Admin Test', 'correo' => 'admin_horario@aurea.local',
            'rol' => 'admin_local', 'empresa_id' => $this->empresaId, 'local_id' => $this->localId, 'estado' => 'activo',
        ]));
        $this->headers = ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    private function crearReserva(Carbon $llegada, string $estado = 'confirmada', string $cliente = 'Cliente Cierre'): string
    {
        $id = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $id, 'local_id' => $this->localId, 'cliente_nombre' => $cliente,
            'cliente_telefono' => '+51 987 654 321', 'fecha_hora' => $llegada, 'num_personas' => 4,
            'estado' => $estado, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return $id;
    }

    private function a(string $hora, int $diasDespues = 0): Carbon
    {
        return Carbon::parse($this->fecha->copy()->addDays($diasDespues)->toDateString().' '.$hora, config('app.timezone'));
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function cierre(array $extra = []): array
    {
        return ['fecha' => $this->fecha->toDateString(), 'cerrado' => true, 'motivo' => 'Corte de luz', ...$extra];
    }

    public function test_precheck_de_cierre_lista_solo_reservas_activas_de_la_jornada(): void
    {
        $almuerzo = $this->crearReserva($this->a('13:00'));
        $cena = $this->crearReserva($this->a('20:00'), 'bloqueada');
        $this->crearReserva($this->a('14:00'), 'atendida');
        $this->crearReserva($this->a('14:30'), 'cancelada');
        $this->crearReserva($this->a('13:00', 1));

        $respuesta = $this->getJson('/api/v1/admin/horario/excepciones/precheck?'.http_build_query([
            'fecha' => $this->fecha->toDateString(), 'cerrado' => 'true', 'motivo' => 'Corte de luz',
        ]), $this->headers);

        $respuesta->assertOk()->assertJsonPath('datos.hay_conflictos', true)->assertJsonPath('datos.total_afectadas', 2);
        $this->assertSame([$almuerzo, $cena], collect($respuesta->json('datos.reservas'))->pluck('id')->all());
        $this->assertStringContainsString('wa.me/51987654321', $respuesta->json('datos.reservas.0.link_whatsapp'));
        $this->assertStringContainsString('Corte%20de%20luz', $respuesta->json('datos.reservas.0.link_whatsapp'));
    }

    public function test_precheck_de_horario_especial_lista_solo_las_reservas_que_no_caben(): void
    {
        $fueraDeVentana = $this->crearReserva($this->a('13:00'));
        $this->crearReserva($this->a('20:00'));
        $terminaTarde = $this->crearReserva($this->a('21:00'));

        $respuesta = $this->getJson('/api/v1/admin/horario/excepciones/precheck?'.http_build_query([
            'fecha' => $this->fecha->toDateString(), 'cerrado' => 'false', 'hora_inicio' => '18:00', 'hora_fin' => '22:00',
        ]), $this->headers);

        $respuesta->assertOk()->assertJsonPath('datos.total_afectadas', 2);
        $this->assertSame([$fueraDeVentana, $terminaTarde], collect($respuesta->json('datos.reservas'))->pluck('id')->all());
    }

    public function test_cierre_incluye_reserva_pasada_la_medianoche_del_turno_nocturno(): void
    {
        DB::table('horario_atencion')->where('local_id', $this->localId)->whereIn('dia_semana', [$this->fecha->dayOfWeekIso, $this->fecha->copy()->addDay()->dayOfWeekIso])->delete();
        DB::table('horario_atencion')->insert([
            'id' => (string) Str::uuid(), 'local_id' => $this->localId, 'dia_semana' => $this->fecha->dayOfWeekIso,
            'nombre_turno' => 'Cena', 'atiende' => true, 'hora_inicio' => '19:00', 'hora_fin' => '00:30',
        ]);
        $madrugada = $this->crearReserva($this->a('00:10', 1));

        $this->getJson('/api/v1/admin/horario/excepciones/precheck?'.http_build_query(['fecha' => $this->fecha->toDateString(), 'cerrado' => 'true']), $this->headers)
            ->assertOk()
            ->assertJsonPath('datos.reservas.0.id', $madrugada);

        // La misma reserva no pertenece a la jornada siguiente
        $this->getJson('/api/v1/admin/horario/excepciones/precheck?'.http_build_query(['fecha' => $this->fecha->copy()->addDay()->toDateString(), 'cerrado' => 'true']), $this->headers)
            ->assertOk()
            ->assertJsonPath('datos.hay_conflictos', false);
    }

    public function test_crear_cierre_con_reservas_afectadas_sin_cancelar_se_rechaza(): void
    {
        $reserva = $this->crearReserva($this->a('13:00'));

        $this->postJson('/api/v1/admin/horario/excepciones', $this->cierre(), $this->headers)
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_RESERVAS_AFECTADAS')
            ->assertJsonPath('errores.0.detalles.total_afectadas', 1);

        $this->assertDatabaseMissing('horario_excepcion', ['local_id' => $this->localId, 'fecha' => $this->fecha->toDateString()]);
        $this->assertDatabaseHas('reserva', ['id' => $reserva, 'estado' => 'confirmada']);
    }

    public function test_crear_cierre_cancelando_registra_aviso_auditoria_y_conteo(): void
    {
        $avisada = $this->crearReserva($this->a('13:00'));
        $sinAvisar = $this->crearReserva($this->a('20:00'));
        $atendida = $this->crearReserva($this->a('14:00'), 'atendida');

        $respuesta = $this->postJson('/api/v1/admin/horario/excepciones', $this->cierre([
            'cancelar_reservas' => true,
            'reservas_notificadas' => [
                ['reserva_id' => $avisada, 'notificado' => true, 'metodo_notificacion' => 'whatsapp'],
                ['reserva_id' => $sinAvisar, 'notificado' => false, 'metodo_notificacion' => 'ninguno'],
            ],
        ]), $this->headers);

        $respuesta->assertStatus(201)->assertJsonPath('datos.reservas_canceladas_count', 2);
        $excepcionId = $respuesta->json('datos.id');

        $this->assertDatabaseHas('reserva', [
            'id' => $avisada, 'estado' => 'cancelada', 'excepcion_id' => $excepcionId,
            'motivo_cancelacion' => 'Cierre: Corte de luz', 'notificado_cliente' => true,
            'metodo_notificacion' => 'whatsapp', 'notificado_por' => $this->adminId,
        ]);
        $this->assertDatabaseHas('reserva', ['id' => $sinAvisar, 'estado' => 'cancelada', 'notificado_cliente' => false, 'metodo_notificacion' => 'ninguno']);
        $this->assertDatabaseHas('reserva', ['id' => $atendida, 'estado' => 'atendida']);
        $this->assertDatabaseHas('log_auditoria', ['entidad_id' => $avisada, 'accion' => 'CANCELACION_POR_CIERRE']);

        $listado = collect($this->getJson('/api/v1/admin/horario/excepciones', $this->headers)->json('datos'))->firstWhere('id', $excepcionId);
        $this->assertSame(2, $listado['reservas_canceladas_count']);
    }

    public function test_cancelar_reservas_ignora_avisos_de_reservas_no_afectadas(): void
    {
        $afectada = $this->crearReserva($this->a('13:00'));
        $ajena = $this->crearReserva($this->a('13:00', 1));

        $this->postJson('/api/v1/admin/horario/excepciones', $this->cierre([
            'cancelar_reservas' => true,
            'reservas_notificadas' => [
                ['reserva_id' => $afectada, 'notificado' => false, 'metodo_notificacion' => 'ninguno'],
                ['reserva_id' => $ajena, 'notificado' => true, 'metodo_notificacion' => 'llamada'],
            ],
        ]), $this->headers)->assertStatus(201);

        $this->assertDatabaseHas('reserva', ['id' => $afectada, 'estado' => 'cancelada', 'notificado_cliente' => false]);
        $this->assertDatabaseHas('reserva', ['id' => $ajena, 'estado' => 'confirmada', 'notificado_cliente' => false]);
    }

    public function test_cancelar_exige_decidir_el_aviso_de_cada_reserva_y_no_guarda_nada_si_falta(): void
    {
        $decidida = $this->crearReserva($this->a('13:00'));
        $sinDecidir = $this->crearReserva($this->a('20:00'));
        $avisoSinMedio = $this->crearReserva($this->a('21:00'));

        $respuesta = $this->postJson('/api/v1/admin/horario/excepciones', $this->cierre([
            'cancelar_reservas' => true,
            'reservas_notificadas' => [
                ['reserva_id' => $decidida, 'notificado' => true, 'metodo_notificacion' => 'whatsapp'],
                ['reserva_id' => $avisoSinMedio, 'notificado' => true, 'metodo_notificacion' => 'ninguno'],
            ],
        ]), $this->headers);

        $respuesta->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_AVISOS_INCOMPLETOS');
        $this->assertEqualsCanonicalizing([$sinDecidir, $avisoSinMedio], $respuesta->json('errores.0.detalles.reservas_sin_decision'));

        $this->assertDatabaseMissing('horario_excepcion', ['local_id' => $this->localId, 'fecha' => $this->fecha->toDateString()]);
        $this->assertDatabaseHas('reserva', ['id' => $decidida, 'estado' => 'confirmada']);
        $this->assertDatabaseHas('reserva', ['id' => $sinDecidir, 'estado' => 'confirmada']);
    }

    public function test_cambio_de_horario_semanal_tambien_exige_decidir_el_aviso(): void
    {
        $afectada = $this->crearReserva($this->a('20:00'));

        $this->putJson('/api/v1/admin/horario', $this->semanaSoloAlmuerzo(['cancelar_reservas' => true]), $this->headers)
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_AVISOS_INCOMPLETOS');

        $this->assertDatabaseHas('reserva', ['id' => $afectada, 'estado' => 'confirmada']);
        $this->assertDatabaseHas('horario_atencion', ['local_id' => $this->localId, 'nombre_turno' => 'Turno continuo']);
    }

    public function test_crear_cierre_sin_reservas_y_fecha_duplicada(): void
    {
        $this->postJson('/api/v1/admin/horario/excepciones', $this->cierre(), $this->headers)
            ->assertStatus(201)
            ->assertJsonPath('datos.reservas_canceladas_count', 0);

        $this->postJson('/api/v1/admin/horario/excepciones', $this->cierre(), $this->headers)
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_EXCEPCION_DUPLICADA');
    }

    /**
     * Horario semanal con un único almuerzo de 12:00 a 16:00 todos los días.
     *
     * @return array<string, mixed>
     */
    private function semanaSoloAlmuerzo(array $extra = []): array
    {
        return [
            'dias' => collect(range(1, 7))->map(fn (int $dia): array => [
                'dia_semana' => $dia, 'atiende' => true,
                'turnos' => [['nombre_turno' => 'Almuerzo', 'hora_inicio' => '12:00', 'hora_fin' => '16:00']],
            ])->all(),
            ...$extra,
        ];
    }

    public function test_precheck_semanal_lista_reservas_que_dejan_de_caber_y_no_guarda_nada(): void
    {
        $quedaFuera = $this->crearReserva($this->a('20:00'));
        $this->crearReserva($this->a('13:00'));
        $this->crearReserva($this->a('03:00'));

        $respuesta = $this->postJson('/api/v1/admin/horario/precheck', $this->semanaSoloAlmuerzo(), $this->headers);

        $respuesta->assertOk()->assertJsonPath('datos.total_afectadas', 1)->assertJsonPath('datos.reservas.0.id', $quedaFuera);
        $this->assertStringContainsString('cambio%20en%20nuestro%20horario', $respuesta->json('datos.reservas.0.link_whatsapp'));
        $this->assertDatabaseHas('horario_atencion', ['local_id' => $this->localId, 'nombre_turno' => 'Turno continuo']);
        $this->assertDatabaseMissing('horario_atencion', ['local_id' => $this->localId, 'nombre_turno' => 'Almuerzo']);
    }

    public function test_guardar_semana_con_reservas_afectadas_sin_cancelar_se_rechaza_y_conserva_el_horario(): void
    {
        $reserva = $this->crearReserva($this->a('20:00'));

        $this->putJson('/api/v1/admin/horario', $this->semanaSoloAlmuerzo(), $this->headers)
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_RESERVAS_AFECTADAS')
            ->assertJsonPath('errores.0.detalles.total_afectadas', 1);

        $this->assertDatabaseHas('horario_atencion', ['local_id' => $this->localId, 'nombre_turno' => 'Turno continuo']);
        $this->assertDatabaseHas('reserva', ['id' => $reserva, 'estado' => 'confirmada']);
    }

    public function test_guardar_semana_cancelando_registra_aviso_y_auditoria(): void
    {
        $afectada = $this->crearReserva($this->a('20:00'));
        $cabe = $this->crearReserva($this->a('13:00'));

        $this->putJson('/api/v1/admin/horario', $this->semanaSoloAlmuerzo([
            'cancelar_reservas' => true,
            'reservas_notificadas' => [['reserva_id' => $afectada, 'notificado' => true, 'metodo_notificacion' => 'llamada']],
        ]), $this->headers)->assertOk();

        $this->assertDatabaseHas('reserva', [
            'id' => $afectada, 'estado' => 'cancelada', 'motivo_cancelacion' => 'Cambio de horario: nuevo horario de atención',
            'notificado_cliente' => true, 'metodo_notificacion' => 'llamada', 'notificado_por' => $this->adminId,
        ]);
        $this->assertDatabaseHas('reserva', ['id' => $cabe, 'estado' => 'confirmada']);
        $this->assertDatabaseHas('log_auditoria', ['entidad_id' => $afectada, 'accion' => 'CANCELACION_POR_CAMBIO_HORARIO']);
        $this->assertDatabaseHas('horario_atencion', ['local_id' => $this->localId, 'nombre_turno' => 'Almuerzo']);
        $this->assertDatabaseMissing('horario_atencion', ['local_id' => $this->localId, 'nombre_turno' => 'Turno continuo']);
    }

    public function test_guardar_semana_sin_reservas_afectadas_no_pide_confirmacion(): void
    {
        $this->crearReserva($this->a('13:00'));
        $this->crearReserva($this->a('03:00'));

        $this->putJson('/api/v1/admin/horario', $this->semanaSoloAlmuerzo(), $this->headers)->assertOk();

        $this->assertDatabaseHas('reserva', ['local_id' => $this->localId, 'estado' => 'confirmada', 'cliente_nombre' => 'Cliente Cierre']);
    }

    public function test_plantilla_con_reservas_afectadas_exige_cancelarlas(): void
    {
        $afectada = $this->crearReserva($this->a('20:00'));

        $this->postJson('/api/v1/admin/horario/precheck', ['plantilla' => 'solo_almuerzo'], $this->headers)
            ->assertOk()
            ->assertJsonPath('datos.reservas.0.id', $afectada);

        $this->postJson('/api/v1/admin/horario/plantilla', ['plantilla' => 'solo_almuerzo'], $this->headers)
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_RESERVAS_AFECTADAS');

        $this->postJson('/api/v1/admin/horario/plantilla', [
            'plantilla' => 'solo_almuerzo',
            'cancelar_reservas' => true,
            'reservas_notificadas' => [['reserva_id' => $afectada, 'notificado' => false, 'metodo_notificacion' => 'ninguno']],
        ], $this->headers)->assertOk();
        $this->assertDatabaseHas('reserva', ['id' => $afectada, 'estado' => 'cancelada']);
    }

    public function test_feriados_nacionales_con_reservas_se_omiten_y_se_informan(): void
    {
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', '2026-12-25')->delete();
        $this->crearReserva(Carbon::parse('2026-12-25 13:00', config('app.timezone')));

        $respuesta = $this->postJson('/api/v1/admin/horario/feriados-peru/cargar', [], $this->headers);

        $respuesta->assertOk();
        $this->assertContains('2026-12-25', collect($respuesta->json('datos.omitidos_por_reservas'))->pluck('fecha')->all());
        $this->assertDatabaseMissing('horario_excepcion', ['local_id' => $this->localId, 'fecha' => '2026-12-25']);
        $this->assertDatabaseHas('horario_excepcion', ['local_id' => $this->localId, 'fecha' => '2026-12-08']);
    }
}
