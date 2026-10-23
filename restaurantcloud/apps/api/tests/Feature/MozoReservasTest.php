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

        $rawToken = 'test_token_reservas_' . Str::random(32);
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

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenMozo,
            'Accept' => 'application/json',
        ];
    }

    private function crearPiso(): string
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert([
            'id' => $pisoId,
            'local_id' => $this->localId,
            'nombre' => 'Piso ' . Str::random(4),
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
            'nueva_mesa_id' => $mesaNueva,
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
}
