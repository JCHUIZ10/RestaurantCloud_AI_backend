<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoReservasTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $mozoId = '00000000-0000-4000-8000-000000000102';

    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_reservas_'.Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->mozoId,
            'nombre' => 'Mozo Test Reservas',
            'correo' => 'mozo_reservas@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenMozo = $rawToken;
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** Fija el reloj a las 12:00 de hoy (hora local) para pruebas que dependen de "ahora" y del horario de atención. */
    private function congelarAMediodia(): void
    {
        Carbon::setTestNow(Carbon::now(config('app.timezone'))->setTime(12, 0));
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->tokenMozo,
            'Accept' => 'application/json',
        ];
    }

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso '.Str::random(4),
            'columnas' => 5,
            'filas' => 3,
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pisoId;
    }

    private function crearMesa(string $pisoId, string $numero, int $capacidad = 4, bool $permiteUnion = true): string
    {
        $mesaId = (string) Str::uuid();
        DB::table('mesa')->insert([
            'id' => $mesaId,
            'local_id' => $this->localId,
            'piso_id' => $pisoId,
            'numero' => $numero,
            'capacidad' => $capacidad,
            'forma' => 'cuadrada',
            'posicion_x' => 1,
            'posicion_y' => 1,
            'permite_union' => $permiteUnion,
            'mesa_principal_id' => null,
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $mesaId;
    }

    private function abrirCaja(): void
    {
        if (DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->exists()) {
            return;
        }

        DB::table('caja')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'cajero_id' => '00000000-0000-4000-8000-000000000105',
            'monto_apertura' => 250.00,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reemplaza el horario semanal del día indicado por los turnos dados.
     *
     * @param  array<int, array{0: string, 1: string, 2: string}>  $turnos  [nombre, inicio, fin]
     */
    private function configurarHorario(int $diaSemana, array $turnos): void
    {
        DB::table('horario_atencion')
            ->where('local_id', $this->localId)
            ->where('dia_semana', $diaSemana)
            ->delete();

        foreach ($turnos as [$nombre, $inicio, $fin]) {
            DB::table('horario_atencion')->insert([
                'id' => (string) Str::uuid(),
                'local_id' => $this->localId,
                'dia_semana' => $diaSemana,
                'nombre_turno' => $nombre,
                'atiende' => true,
                'hora_inicio' => $inicio,
                'hora_fin' => $fin,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function crearReservaEnBd(string $mesaId, Carbon $fechaHora, string $estado = 'confirmada'): string
    {
        $reservaId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $reservaId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Cliente '.Str::random(4),
            'cliente_telefono' => '+51 987 654 321',
            'fecha_hora' => $fechaHora,
            'num_personas' => 2,
            'estado' => $estado,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert(['reserva_id' => $reservaId, 'mesa_id' => $mesaId]);

        return $reservaId;
    }

    public function test_obtener_politicas_reserva_retorna_parametros_y_turnos_de_bd(): void
    {
        // Asegurar que existan políticas de reserva
        DB::table('politicas_reserva')->updateOrInsert(
            ['local_id' => $this->localId],
            [
                'acepta_reservas' => true,
                'duracion_reserva_min' => 90,
                'buffer_reserva_min' => 15,
                'tolerancia_no_show_min' => 20,
                'minutos_bloqueo_previo' => 30,
                'anticipacion_minima_horas' => 2,
                'anticipacion_maxima_dias' => 30,
                'updated_at' => now(),
            ]
        );

        $response = $this->getJson('/api/v1/mozo/reservas/politicas', $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'duracion_reserva_min' => 90,
                    'buffer_reserva_min' => 15,
                    'tolerancia_no_show_min' => 20,
                    'minutos_bloqueo_previo' => 30,
                    'permite_reservas_online' => true,
                    'max_dias_anticipacion' => 30,
                ],
            ]);

        $this->assertArrayHasKey('turnos_operativos', $response->json('datos'));
        $this->assertArrayHasKey('almuerzo', $response->json('datos.turnos_operativos'));
        $this->assertArrayHasKey('cena', $response->json('datos.turnos_operativos'));
    }

    public function test_obtener_mesas_disponibles_filtra_por_aforo_y_detecta_colisiones(): void
    {
        $pisoId = $this->crearPiso();
        $mesa1 = $this->crearMesa($pisoId, 'R01', 4);
        $mesa2 = $this->crearMesa($pisoId, 'R02', 2, false);

        $fecha = now()->addDays(2)->toDateString();
        $hora = '14:00';
        $fechaHora = Carbon::parse("{$fecha} {$hora}");

        // Crear una reserva confirmada en mesa 1
        $resId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $resId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Sr. Valdivia',
            'cliente_telefono' => '+51 988 777 666',
            'fecha_hora' => $fechaHora,
            'num_personas' => 4,
            'estado' => 'confirmada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert([
            'reserva_id' => $resId,
            'mesa_id' => $mesa1,
        ]);

        $response = $this->getJson("/api/v1/mozo/reservas/mesas-disponibles?fecha={$fecha}&hora={$hora}&num_personas=4", $this->headers());

        $response->assertStatus(200)->assertJson(['exito' => true]);

        $mesas = collect($response->json('datos.mesas'));
        $m1 = $mesas->firstWhere('mesa_id', $mesa1);
        $m2 = $mesas->firstWhere('mesa_id', $mesa2);

        $this->assertNotNull($m1);
        $this->assertFalse($m1['disponible']);
        $this->assertStringContainsString('Reservada', (string) $m1['motivo_bloqueo']);

        $this->assertNotNull($m2);
        // Mesa 2 tiene capacidad 2 pero se pidieron 4 y no permite unión
        $this->assertFalse($m2['disponible']);
        $this->assertStringContainsString('Capacidad insuficiente', (string) $m2['motivo_bloqueo']);
    }

    public function test_crear_reserva_asocia_mesas_y_rechaza_colisiones(): void
    {
        $pisoId = $this->crearPiso();
        $mesa1 = $this->crearMesa($pisoId, 'R10', 4);
        $mesa2 = $this->crearMesa($pisoId, 'R11', 4);

        $fechaHora = now()->addDays(3)->setTime(13, 30);

        $payload = [
            'cliente_nombre' => 'Dra. Patricia Luna',
            'cliente_telefono' => '+51 999 444 333',
            'fecha_hora' => $fechaHora->toIso8601String(),
            'num_personas' => 6,
            'mesa_ids' => [$mesa1, $mesa2],
            'notas' => 'Cena de celebración familiar',
        ];

        $response = $this->postJson('/api/v1/mozo/reservas', $payload, $this->headers());

        $response->assertStatus(201)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'cliente_nombre' => 'Dra. Patricia Luna',
                    'num_personas' => 6,
                    'mesas_etiqueta' => 'Mesa [ R10 ; R11 ]',
                    'estado' => 'confirmada',
                    'notas' => 'Cena de celebración familiar',
                ],
            ]);

        $reservaId = $response->json('datos.id');

        // Verificar base de datos
        $this->assertDatabaseHas('reserva', [
            'id' => $reservaId,
            'cliente_nombre' => 'Dra. Patricia Luna',
            'estado' => 'confirmada',
        ]);

        $this->assertDatabaseHas('reserva_mesa', [
            'reserva_id' => $reservaId,
            'mesa_id' => $mesa1,
        ]);
        $this->assertDatabaseHas('reserva_mesa', [
            'reserva_id' => $reservaId,
            'mesa_id' => $mesa2,
        ]);

        $this->assertDatabaseHas('log_auditoria', [
            'entidad_id' => $reservaId,
            'accion' => 'CREACION_RESERVA',
        ]);

        // Intentar crear otra reserva que colisione con mesa 1 a la misma hora
        $payloadColision = [
            'cliente_nombre' => 'Cliente Solapado',
            'cliente_telefono' => '+51 911 222 333',
            'fecha_hora' => $fechaHora->toIso8601String(),
            'num_personas' => 2,
            'mesa_ids' => [$mesa1],
        ];

        $respColision = $this->postJson('/api/v1/mozo/reservas', $payloadColision, $this->headers());
        $respColision->assertStatus(422);
        $this->assertStringContainsString('Conflicto de horario', $respColision->json('errores.0.mensaje'));
    }

    public function test_sentar_reserva_une_mesas_abre_comanda_y_actualiza_estado(): void
    {
        $this->abrirCaja();
        $pisoId = $this->crearPiso();
        $mesa1 = $this->crearMesa($pisoId, 'R20', 4);
        $mesa2 = $this->crearMesa($pisoId, 'R21', 4);

        $resId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $resId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Familia Barreto',
            'cliente_telefono' => '+51 988 123 456',
            'fecha_hora' => now()->addMinutes(10),
            'num_personas' => 7,
            'estado' => 'confirmada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert([
            ['reserva_id' => $resId, 'mesa_id' => $mesa1],
            ['reserva_id' => $resId, 'mesa_id' => $mesa2],
        ]);

        $response = $this->postJson("/api/v1/mozo/reservas/{$resId}/sentar", [], $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'reserva_id' => $resId,
                    'mesa_id' => $mesa1,
                ],
            ]);

        $pedidoId = $response->json('datos.pedido_id');
        $this->assertNotNull($pedidoId);

        // 1. Reserva queda en atendida
        $this->assertDatabaseHas('reserva', [
            'id' => $resId,
            'estado' => 'atendida',
        ]);

        // 2. Mesas unificadas: mesa 2 vinculada a mesa 1
        $this->assertDatabaseHas('mesa', [
            'id' => $mesa2,
            'mesa_principal_id' => $mesa1,
        ]);

        // 3. Comanda abierta con 7 comensales
        $this->assertDatabaseHas('pedido', [
            'id' => $pedidoId,
            'mesa_id' => $mesa1,
            'comensales' => 7,
            'estado' => 'enviado',
        ]);

        // 4. Intentar sentar nuevamente debe rechazar con 422
        $respRepetida = $this->postJson("/api/v1/mozo/reservas/{$resId}/sentar", [], $this->headers());
        $respRepetida->assertStatus(422);
    }

    public function test_registrar_no_show_libera_mesas_y_actualiza_auditoria(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R30', 4);

        $resId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $resId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Sr. Ausente',
            'cliente_telefono' => '+51 900 000 000',
            'fecha_hora' => now()->subMinutes(20),
            'num_personas' => 2,
            'estado' => 'confirmada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert([
            'reserva_id' => $resId,
            'mesa_id' => $mesa,
        ]);

        $response = $this->postJson("/api/v1/mozo/reservas/{$resId}/no-show", [
            'motivo_inasistencia' => 'No contestó las llamadas de cortesía tras 20m de espera',
        ], $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'reservaId' => $resId,
                    'mesaLiberada' => true,
                ],
            ]);

        $this->assertDatabaseHas('reserva', [
            'id' => $resId,
            'estado' => 'no_show',
            'motivo_cancelacion' => 'No contestó las llamadas de cortesía tras 20m de espera',
        ]);

        $this->assertDatabaseHas('log_auditoria', [
            'entidad_id' => $resId,
            'accion' => 'NO_SHOW_RESERVA',
        ]);
    }

    public function test_cancelar_reserva_libera_mesas(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R40', 4);

        $resId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $resId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Sra. Cancelacion',
            'cliente_telefono' => '+51 977 111 222',
            'fecha_hora' => now()->addHours(3),
            'num_personas' => 3,
            'estado' => 'confirmada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert([
            'reserva_id' => $resId,
            'mesa_id' => $mesa,
        ]);

        $response = $this->postJson("/api/v1/mozo/reservas/{$resId}/cancelar", [
            'motivo_cancelacion' => 'Emergencia de salud del cliente',
        ], $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'reservaId' => $resId,
                ],
            ]);

        $this->assertDatabaseHas('reserva', [
            'id' => $resId,
            'estado' => 'cancelada',
            'motivo_cancelacion' => 'Emergencia de salud del cliente',
        ]);
    }

    public function test_reasignar_mesa_reserva_mueve_asignacion(): void
    {
        $pisoId = $this->crearPiso();
        $mesaVieja = $this->crearMesa($pisoId, 'R50', 4);
        $mesaNueva = $this->crearMesa($pisoId, 'R51', 4);

        $resId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $resId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Fam. Mendoza',
            'cliente_telefono' => '+51 955 444 333',
            'fecha_hora' => now()->addMinutes(45),
            'num_personas' => 4,
            'estado' => 'confirmada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert([
            'reserva_id' => $resId,
            'mesa_id' => $mesaVieja,
        ]);

        $response = $this->patchJson("/api/v1/mozo/reservas/{$resId}/reasignar-mesa", [
            'mesa_ids' => [$mesaNueva],
            'motivo' => 'Preferencia de cliente por mesa junto a la ventana',
        ], $this->headers());

        $response->assertStatus(200)
            ->assertJson([
                'exito' => true,
                'datos' => [
                    'id' => $resId,
                    'mesas_etiqueta' => 'Mesa R51',
                    'mesa_ids' => [$mesaNueva],
                ],
            ]);

        $this->assertDatabaseMissing('reserva_mesa', [
            'reserva_id' => $resId,
            'mesa_id' => $mesaVieja,
        ]);

        $this->assertDatabaseHas('reserva_mesa', [
            'reserva_id' => $resId,
            'mesa_id' => $mesaNueva,
        ]);
    }

    private function abrirComandaEn(string $mesaId): void
    {
        DB::table('pedido')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'numero_comanda' => ((int) DB::table('pedido')->where('local_id', $this->localId)->max('numero_comanda')) + 1,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->mozoId,
            'estado' => 'enviado',
            'comensales' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reserva para pasado mañana a las 13:00 (dentro del almuerzo configurado) con las mesas y personas dadas.
     *
     * @param  array<int, string>  $mesaIds
     */
    private function reservaFutura(array $mesaIds, int $personas, string $estado = 'confirmada'): string
    {
        $fecha = now()->addDays(2)->startOfDay();
        $this->configurarHorario($fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);

        $reservaId = $this->crearReservaEnBd($mesaIds[0], Carbon::parse($fecha->toDateString().' 13:00', config('app.timezone')), $estado);
        DB::table('reserva')->where('id', $reservaId)->update(['num_personas' => $personas]);
        foreach (array_slice($mesaIds, 1) as $mesaId) {
            DB::table('reserva_mesa')->insert(['reserva_id' => $reservaId, 'mesa_id' => $mesaId]);
        }

        return $reservaId;
    }

    public function test_disponibilidad_con_excluir_reserva_id_no_cuenta_a_la_propia_reserva(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R90', 4);
        $reservaId = $this->reservaFutura([$mesa], 2);
        $fecha = now()->addDays(2)->toDateString();

        $sinExcluir = collect($this->getJson("/api/v1/mozo/reservas/mesas-disponibles?fecha={$fecha}&hora=13:00&comensales=2", $this->headers())->json('datos.mesas'))
            ->firstWhere('mesa_id', $mesa);
        $this->assertFalse($sinExcluir['disponible']);
        $this->assertStringContainsString('Reservada', $sinExcluir['motivo_bloqueo']);
        $this->assertArrayNotHasKey('causa', $sinExcluir);

        $excluyendo = collect($this->getJson("/api/v1/mozo/reservas/mesas-disponibles?fecha={$fecha}&hora=13:00&comensales=2&excluir_reserva_id={$reservaId}", $this->headers())->json('datos.mesas'))
            ->firstWhere('mesa_id', $mesa);
        $this->assertTrue($excluyendo['disponible']);
    }

    public function test_reasignar_a_varias_mesas_que_suman_la_capacidad(): void
    {
        $pisoId = $this->crearPiso();
        $viejaA = $this->crearMesa($pisoId, 'R91', 4);
        $viejaB = $this->crearMesa($pisoId, 'R92', 4);
        $nuevaA = $this->crearMesa($pisoId, 'R93', 4);
        $nuevaB = $this->crearMesa($pisoId, 'R94', 4);
        $reservaId = $this->reservaFutura([$viejaA, $viejaB], 8);

        $this->patchJson("/api/v1/mozo/reservas/{$reservaId}/reasignar-mesa", ['mesa_ids' => [$nuevaA, $nuevaB], 'motivo' => 'Mesa ocupada por clientes anteriores'], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.mesas_etiqueta', 'Mesa [ R93 ; R94 ]')
            ->assertJsonCount(2, 'datos.mesa_ids');

        $this->assertDatabaseMissing('reserva_mesa', ['reserva_id' => $reservaId, 'mesa_id' => $viejaA]);
        $this->assertDatabaseHas('reserva_mesa', ['reserva_id' => $reservaId, 'mesa_id' => $nuevaB]);
        $auditoria = DB::table('log_auditoria')->where('entidad_id', $reservaId)->where('accion', 'REASIGNACION_MESA_RESERVA')->value('detalle');
        $this->assertStringContainsString('R91', $auditoria);
        $this->assertStringContainsString('R94', $auditoria);
    }

    public function test_reasignar_permite_quedarse_con_una_de_sus_mesas_actuales(): void
    {
        $pisoId = $this->crearPiso();
        $actual = $this->crearMesa($pisoId, 'R95', 4);
        $nueva = $this->crearMesa($pisoId, 'R96', 4);
        $reservaId = $this->reservaFutura([$actual], 8);

        // Pasa de [R95] a [R95, R96]: la mesa actual no choca consigo misma
        $this->patchJson("/api/v1/mozo/reservas/{$reservaId}/reasignar-mesa", ['mesa_ids' => [$actual, $nueva]], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.mesas_etiqueta', 'Mesa [ R95 ; R96 ]');
    }

    public function test_reasignar_rechaza_las_mismas_reglas_que_al_crear(): void
    {
        $pisoId = $this->crearPiso();
        $actual = $this->crearMesa($pisoId, 'R97', 4);
        $chica = $this->crearMesa($pisoId, 'R98', 4);
        $fija = $this->crearMesa($pisoId, 'R99', 4, false);
        $otra = $this->crearMesa($pisoId, 'S01', 4);
        $reservaId = $this->reservaFutura([$actual], 8);
        $this->reservaFutura([$otra], 2);

        $url = "/api/v1/mozo/reservas/{$reservaId}/reasignar-mesa";

        $this->patchJson($url, ['mesa_ids' => [$chica]], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_CAPACIDAD_INSUFICIENTE');

        $this->patchJson($url, ['mesa_ids' => [$chica, $fija]], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_MESAS_NO_UNIBLES');

        $respuesta = $this->patchJson($url, ['mesa_ids' => [$chica, $otra]], $this->headers());
        $respuesta->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_MESA_RESERVADA');
        $this->assertStringContainsString('Conflicto de horario', $respuesta->json('errores.0.mensaje'));

        $this->patchJson($url, ['mesa_ids' => [(string) Str::uuid(), $chica]], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_MESAS_INVALIDAS');

        DB::table('mesa')->where('id', $chica)->update(['estado' => 'inactiva']);
        $this->patchJson($url, ['mesa_ids' => [$chica, $actual]], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_MESAS_INVALIDAS');

        $this->patchJson($url, ['mesa_ids' => [$actual]], $this->headers())
            ->assertStatus(422);

        // Nada cambió tras los rechazos
        $this->assertDatabaseHas('reserva_mesa', ['reserva_id' => $reservaId, 'mesa_id' => $actual]);
        $this->assertSame(1, DB::table('reserva_mesa')->where('reserva_id', $reservaId)->count());
    }

    public function test_reasignar_rechaza_reservas_que_ya_no_estan_activas(): void
    {
        $pisoId = $this->crearPiso();
        $actual = $this->crearMesa($pisoId, 'S02', 4);
        $libre = $this->crearMesa($pisoId, 'S03', 4);

        foreach (['atendida', 'cancelada', 'no_show'] as $estado) {
            $reservaId = $this->reservaFutura([$actual], 2, $estado);

            $this->patchJson("/api/v1/mozo/reservas/{$reservaId}/reasignar-mesa", ['mesa_ids' => [$libre]], $this->headers())
                ->assertStatus(422);
        }
    }

    public function test_conflicto_de_mesa_ocupada_se_resuelve_cambiando_la_mesa_y_luego_sentando(): void
    {
        $this->congelarAMediodia();
        $this->abrirCaja();
        $pisoId = $this->crearPiso();
        $ocupada = $this->crearMesa($pisoId, 'S04', 4);
        $libre = $this->crearMesa($pisoId, 'S05', 4);
        $reservaId = $this->crearReservaEnBd($ocupada, now()->addMinutes(10));
        $this->abrirComandaEn($ocupada);

        // Sentar falla: los clientes anteriores siguen en la mesa y el mensaje remite a "Cambiar mesa"
        $respuesta = $this->postJson("/api/v1/mozo/reservas/{$reservaId}/sentar", [], $this->headers());
        $respuesta->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_MESA_OCUPADA');
        $this->assertStringContainsString('Cambiar mesa', $respuesta->json('errores.0.mensaje'));

        // La mesa con comanda no es candidata; la libre sí
        $this->patchJson("/api/v1/mozo/reservas/{$reservaId}/reasignar-mesa", ['mesa_ids' => [$ocupada]], $this->headers())
            ->assertStatus(422);

        $this->patchJson("/api/v1/mozo/reservas/{$reservaId}/reasignar-mesa", ['mesa_ids' => [$libre], 'motivo' => 'Mesa ocupada por clientes anteriores'], $this->headers())
            ->assertOk()
            ->assertJsonPath('datos.mesas_etiqueta', 'Mesa S05');

        $sentado = $this->postJson("/api/v1/mozo/reservas/{$reservaId}/sentar", [], $this->headers());
        $sentado->assertOk()->assertJsonPath('datos.mesa_id', $libre);
        $this->assertDatabaseHas('reserva', ['id' => $reservaId, 'estado' => 'atendida']);
    }

    public function test_crear_reserva_inminente_en_una_mesa_con_comanda_activa_se_rechaza(): void
    {
        $this->congelarAMediodia();
        $pisoId = $this->crearPiso();
        $ocupada = $this->crearMesa($pisoId, 'S06', 4);
        $this->abrirComandaEn($ocupada);

        // Reloj fijo a las 12:00: la llegada de las 12:30 cae dentro de la hora de la comanda y del horario de atención
        $hoy = now()->startOfDay();
        $this->configurarHorario($hoy->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', $hoy)->delete();
        $llegada = $hoy->toDateString().'T12:30:00';

        $this->postJson('/api/v1/mozo/reservas', [
            'cliente_nombre' => 'Cliente Inminente',
            'cliente_telefono' => '+51 987 654 321',
            'fecha_hora' => $llegada,
            'num_personas' => 2,
            'mesa_ids' => [$ocupada],
        ], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_MESA_OCUPADA');
    }

    public function test_get_plano_marca_mesas_como_bloqueadas_en_ventana_preventiva(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R60', 4);

        // Reserva para dentro de 15 minutos (dentro del buffer de 30m)
        $resId = (string) Str::uuid();
        DB::table('reserva')->insert([
            'id' => $resId,
            'local_id' => $this->localId,
            'cliente_nombre' => 'Gómez Bloqueo Preventivo',
            'cliente_telefono' => '+51 912 345 678',
            'fecha_hora' => now()->addMinutes(15),
            'num_personas' => 4,
            'estado' => 'confirmada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('reserva_mesa')->insert([
            'reserva_id' => $resId,
            'mesa_id' => $mesa,
        ]);

        $response = $this->getJson("/api/v1/mozo/plano?piso_id={$pisoId}", $this->headers());

        $response->assertStatus(200)->assertJson(['exito' => true]);

        $mesas = collect($response->json('datos.mesas'));
        $mesaBloqueada = $mesas->firstWhere('id', $mesa);

        $this->assertNotNull($mesaBloqueada);
        $this->assertEquals('bloqueada', $mesaBloqueada['estado']);
        $this->assertEquals('Gómez Bloqueo Preventivo', $mesaBloqueada['reserva_cliente']);
        $this->assertNotNull($mesaBloqueada['reserva_hora']);
        $this->assertNotNull($mesaBloqueada['minutos_para_reserva']);
    }

    public function test_bandeja_y_creacion_respetan_excepcion_de_cierre(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R70', 4);
        $fecha = now()->addDays(4)->startOfDay();
        $this->configurarHorario($fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', $fecha)->delete();
        DB::table('horario_excepcion')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'fecha' => $fecha->toDateString(),
            'cerrado' => true,
            'motivo' => 'Inventario anual',
            'created_at' => now(),
        ]);

        $politicas = $this->getJson("/api/v1/mozo/reservas/politicas?fecha={$fecha->toDateString()}", $this->headers());
        $politicas->assertStatus(200)
            ->assertJsonPath('datos.jornada.atiende', false)
            ->assertJsonPath('datos.jornada.cerrado_por_excepcion', true)
            ->assertJsonPath('datos.jornada.motivo_excepcion', 'Inventario anual')
            ->assertJsonPath('datos.turnos_operativos.almuerzo', null);

        $this->getJson("/api/v1/mozo/reservas?fecha={$fecha->toDateString()}&turno=almuerzo", $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos', []);

        $disponibles = $this->getJson("/api/v1/mozo/reservas/mesas-disponibles?fecha={$fecha->toDateString()}&hora=13:00&comensales=2", $this->headers());
        $disponibles->assertStatus(200)->assertJsonPath('datos.mesas', []);
        $this->assertStringContainsString('Inventario anual', (string) $disponibles->json('datos.bloqueo_horario'));

        $respuesta = $this->postJson('/api/v1/mozo/reservas', [
            'cliente_nombre' => 'Cliente Feriado',
            'cliente_telefono' => '+51 987 654 321',
            'fecha_hora' => $fecha->toDateString().'T13:00:00',
            'num_personas' => 2,
            'mesa_ids' => [$mesa],
        ], $this->headers());

        $respuesta->assertStatus(422);
        $this->assertStringContainsString('Inventario anual', $respuesta->json('errores.0.mensaje'));
    }

    public function test_crear_reserva_sin_desfase_horario_se_interpreta_en_hora_local(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R71', 4);
        $fecha = now()->addDays(1)->startOfDay();
        $this->configurarHorario($fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', $fecha)->delete();

        $respuesta = $this->postJson('/api/v1/mozo/reservas', [
            'cliente_nombre' => 'Cliente Hora Local',
            'cliente_telefono' => '+51 987 654 321',
            'fecha_hora' => $fecha->toDateString().'T13:00:00',
            'num_personas' => 2,
            'mesa_ids' => [$mesa],
        ], $this->headers());

        $esperado = (int) round((Carbon::parse($fecha->toDateString().' 13:00', config('app.timezone'))->timestamp - now()->timestamp) / 60);

        $respuesta->assertStatus(201)->assertJsonPath('datos.hora_texto', '13:00');
        $this->assertEqualsWithDelta($esperado, $respuesta->json('datos.minutos_restantes'), 1);
        $this->assertSame(
            $fecha->toDateString().' 13:00',
            Carbon::parse($respuesta->json('datos.fecha_hora'))->setTimezone(config('app.timezone'))->format('Y-m-d H:i')
        );
    }

    /**
     * @param  array<int, string>  $mesaIds
     * @return array<string, mixed>
     */
    private function payloadReserva(array $mesaIds, int $personas): array
    {
        $fecha = now()->addDays(2)->startOfDay();
        $this->configurarHorario($fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', $fecha)->delete();

        return [
            'cliente_nombre' => 'Cliente Capacidad',
            'cliente_telefono' => '+51 987 654 321',
            'fecha_hora' => $fecha->toDateString().'T13:00:00',
            'num_personas' => $personas,
            'mesa_ids' => $mesaIds,
        ];
    }

    public function test_crear_reserva_rechaza_mesas_que_no_alcanzan_para_los_comensales(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R80', 4);

        $respuesta = $this->postJson('/api/v1/mozo/reservas', $this->payloadReserva([$mesa], 8), $this->headers());

        $respuesta->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_CAPACIDAD_INSUFICIENTE');
        $this->assertStringContainsString('suman 4 lugares', $respuesta->json('errores.0.mensaje'));
        $this->assertDatabaseMissing('reserva_mesa', ['mesa_id' => $mesa]);
    }

    public function test_crear_reserva_acepta_mesas_agrupadas_cuya_suma_alcanza(): void
    {
        $pisoId = $this->crearPiso();
        $mesaA = $this->crearMesa($pisoId, 'R81', 4);
        $mesaB = $this->crearMesa($pisoId, 'R82', 4);

        $this->postJson('/api/v1/mozo/reservas', $this->payloadReserva([$mesaA, $mesaB], 8), $this->headers())
            ->assertStatus(201);
    }

    public function test_crear_reserva_rechaza_agrupar_mesas_que_no_permiten_union(): void
    {
        $pisoId = $this->crearPiso();
        $fija = $this->crearMesa($pisoId, 'R83', 4, false);
        $unible = $this->crearMesa($pisoId, 'R84', 4);

        $respuesta = $this->postJson('/api/v1/mozo/reservas', $this->payloadReserva([$fija, $unible], 8), $this->headers());

        $respuesta->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_MESAS_NO_UNIBLES');
        $this->assertStringContainsString('Mesa R83', $respuesta->json('errores.0.mensaje'));
    }

    public function test_crear_reserva_en_una_sola_mesa_fija_suficiente_no_requiere_union(): void
    {
        $pisoId = $this->crearPiso();
        $fija = $this->crearMesa($pisoId, 'R85', 6, false);

        $this->postJson('/api/v1/mozo/reservas', $this->payloadReserva([$fija], 6), $this->headers())
            ->assertStatus(201);
    }

    public function test_crear_reserva_rechaza_hora_pasada_y_llegada_fuera_del_turno(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R72', 4);
        $fecha = now()->addDays(2)->startOfDay();
        $this->configurarHorario($fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);
        DB::table('horario_excepcion')->where('local_id', $this->localId)->whereDate('fecha', $fecha)->delete();

        $payload = [
            'cliente_nombre' => 'Cliente Validaciones',
            'cliente_telefono' => '+51 987 654 321',
            'num_personas' => 2,
            'mesa_ids' => [$mesa],
        ];

        $this->postJson('/api/v1/mozo/reservas', [...$payload, 'fecha_hora' => now()->subDay()->format('Y-m-d\TH:i:s')], $this->headers())
            ->assertStatus(422);

        // Turno 12:00-16:00 con reservas de 90 min: la última llegada es 14:30
        $tarde = $this->postJson('/api/v1/mozo/reservas', [...$payload, 'fecha_hora' => $fecha->toDateString().'T14:45:00'], $this->headers());
        $tarde->assertStatus(422);
        $this->assertStringContainsString('14:30', $tarde->json('errores.0.mensaje'));

        $this->postJson('/api/v1/mozo/reservas', [...$payload, 'fecha_hora' => $fecha->toDateString().'T14:30:00'], $this->headers())
            ->assertStatus(201);
    }

    public function test_sentar_reserva_rechaza_mesa_con_comanda_ajena(): void
    {
        $this->abrirCaja();
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R73', 4);
        $reservaId = $this->crearReservaEnBd($mesa, now()->addMinutes(10));

        DB::table('pedido')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'numero_comanda' => ((int) DB::table('pedido')->where('local_id', $this->localId)->max('numero_comanda')) + 1,
            'mesa_id' => $mesa,
            'mozo_id' => $this->mozoId,
            'estado' => 'enviado',
            'comensales' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson("/api/v1/mozo/reservas/{$reservaId}/sentar", [], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_MESA_OCUPADA');

        $this->assertDatabaseHas('reserva', ['id' => $reservaId, 'estado' => 'confirmada']);
    }

    public function test_canal_suspendido_bloquea_crear_pero_no_atender_reservas_existentes(): void
    {
        $this->abrirCaja();
        $pisoId = $this->crearPiso();
        $mesaExistente = $this->crearMesa($pisoId, 'R75', 4);
        $mesaNueva = $this->crearMesa($pisoId, 'R76', 4);
        $reservaId = $this->crearReservaEnBd($mesaExistente, now()->addMinutes(10));

        DB::table('politicas_reserva')->where('local_id', $this->localId)->update(['acepta_reservas' => false]);

        $fecha = now()->addDay()->toDateString();
        $this->postJson('/api/v1/mozo/reservas', [
            'cliente_nombre' => 'Cliente Canal Cerrado',
            'cliente_telefono' => '+51 987 654 321',
            'fecha_hora' => $fecha.'T13:00:00',
            'num_personas' => 2,
            'mesa_ids' => [$mesaNueva],
        ], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_RESERVAS_DESHABILITADAS');

        $disponibles = $this->getJson("/api/v1/mozo/reservas/mesas-disponibles?fecha={$fecha}&hora=13:00&comensales=2", $this->headers());
        $disponibles->assertOk()->assertJsonPath('datos.mesas', []);
        $this->assertStringContainsString('suspendida', (string) $disponibles->json('datos.bloqueo_horario'));

        $this->postJson("/api/v1/mozo/reservas/{$reservaId}/sentar", [], $this->headers())->assertOk();
    }

    public function test_no_show_y_cancelacion_rechazan_reserva_ya_atendida(): void
    {
        $pisoId = $this->crearPiso();
        $mesa = $this->crearMesa($pisoId, 'R74', 4);
        $reservaId = $this->crearReservaEnBd($mesa, now()->subMinutes(30), 'atendida');

        $this->postJson("/api/v1/mozo/reservas/{$reservaId}/no-show", ['motivo_inasistencia' => 'No vino'], $this->headers())
            ->assertStatus(422);

        $this->postJson("/api/v1/mozo/reservas/{$reservaId}/cancelar", ['motivo_cancelacion' => 'Ya no viene'], $this->headers())
            ->assertStatus(422);

        $this->assertDatabaseHas('reserva', ['id' => $reservaId, 'estado' => 'atendida']);
    }
}
