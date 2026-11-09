<?php

namespace Tests\Feature;

use App\Domains\Horario\Services\JornadaOperativaService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class JornadaOperativaServiceTest extends TestCase
{
    private string $localId = '00000000-0000-4000-8000-000000000010';

    private JornadaOperativaService $jornadas;

    private Carbon $fecha;

    protected function setUp(): void
    {
        parent::setUp();

        $this->jornadas = app(JornadaOperativaService::class);
        $this->fecha = now()->addDays(5)->startOfDay();

        // Cada test define su propio horario y excepciones para la fecha y el día siguiente
        DB::table('horario_excepcion')
            ->where('local_id', $this->localId)
            ->whereBetween('fecha', [$this->fecha->toDateString(), $this->fecha->copy()->addDay()->toDateString()])
            ->delete();
        $this->configurarHorario($this->fecha->copy()->addDay()->dayOfWeekIso, []);
    }

    /**
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

    private function crearExcepcion(bool $cerrado, ?string $inicio = null, ?string $fin = null): void
    {
        DB::table('horario_excepcion')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'fecha' => $this->fecha->toDateString(),
            'cerrado' => $cerrado,
            'hora_inicio' => $inicio,
            'hora_fin' => $fin,
            'motivo' => $cerrado ? 'Feriado local' : 'Evento privado',
            'created_at' => now(),
        ]);
    }

    private function enFecha(string $hora, int $diasDespues = 0): Carbon
    {
        return Carbon::parse($this->fecha->copy()->addDays($diasDespues)->toDateString().' '.$hora, config('app.timezone'));
    }

    public function test_excepcion_de_cierre_deja_el_dia_sin_turnos_e_invalida_reservas(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00'], ['Cena', '19:00', '23:00']]);
        $this->crearExcepcion(true);

        $jornada = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 90);

        $this->assertFalse($jornada['atiende']);
        $this->assertTrue($jornada['cerrado_por_excepcion']);
        $this->assertNull($jornada['turnos']['almuerzo']);
        $this->assertNull($jornada['turnos']['cena']);

        $validacion = $this->jornadas->validarInicioReserva($this->localId, $this->enFecha('13:00'), 90);
        $this->assertFalse($validacion['valido']);
        $this->assertStringContainsString('Feriado local', $validacion['mensaje']);
    }

    public function test_horario_especial_reemplaza_al_horario_semanal(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00'], ['Cena', '19:00', '23:00']]);
        $this->crearExcepcion(false, '18:00', '22:00');

        $jornada = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 90);

        $this->assertTrue($jornada['es_horario_especial']);
        $this->assertNull($jornada['turnos']['almuerzo']);
        $this->assertSame('18:00', $jornada['turnos']['cena']['inicio']);
        $this->assertSame('22:00', $jornada['turnos']['cena']['fin']);
        $this->assertSame('20:30', collect($jornada['turnos']['cena']['franjas'])->last()['hora']);

        $this->assertFalse($this->jornadas->validarInicioReserva($this->localId, $this->enFecha('13:00'), 90)['valido']);

        $validacion = $this->jornadas->validarInicioReserva($this->localId, $this->enFecha('19:00'), 90);
        $this->assertTrue($validacion['valido']);
        $this->assertNotNull($validacion['excepcion_id']);
    }

    public function test_dia_solo_con_almuerzo_no_inventa_cena(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, [['Almuerzo Familiar', '12:00', '18:00']]);

        $jornada = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 90);

        $this->assertTrue($jornada['atiende']);
        $this->assertSame('Almuerzo Familiar', $jornada['turnos']['almuerzo']['nombre']);
        $this->assertNull($jornada['turnos']['cena']);
    }

    public function test_dia_sin_horario_no_atiende(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, []);

        $jornada = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 90);

        $this->assertFalse($jornada['atiende']);
        $this->assertFalse($jornada['cerrado_por_excepcion']);
        $this->assertNull($jornada['turnos']['almuerzo']);
        $this->assertNull($jornada['turnos']['cena']);
    }

    public function test_turno_continuo_se_reparte_en_el_corte_de_las_17(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, [['Turno continuo', '12:00', '23:00']]);

        $turnos = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 90)['turnos'];

        $this->assertSame(['12:00', '17:00'], [$turnos['almuerzo']['inicio'], $turnos['almuerzo']['fin']]);
        $this->assertSame(['17:00', '23:00'], [$turnos['cena']['inicio'], $turnos['cena']['fin']]);
    }

    public function test_turno_que_cruza_medianoche_pertenece_a_la_jornada_anterior(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, [['Cena', '19:00', '00:30']]);

        $cena = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 15)['turnos']['cena'];
        $this->assertTrue($cena['cruza_medianoche']);
        $this->assertSame($this->enFecha('00:30', 1)->toIso8601String(), $cena['hasta']);

        $pasadaMedianoche = $this->enFecha('00:10', 1);
        $validacion = $this->jornadas->validarInicioReserva($this->localId, $pasadaMedianoche, 15);
        $this->assertTrue($validacion['valido']);
        $this->assertSame($this->fecha->toDateString(), $validacion['fecha_jornada']);

        $this->assertSame(
            ['fecha' => $this->fecha->toDateString(), 'turno' => 'cena'],
            $this->jornadas->fechaOperativa($this->localId, $this->enFecha('00:20', 1), 90)
        );
        $this->assertSame($this->fecha->toDateString(), $this->jornadas->fechaJornadaDe($this->localId, $pasadaMedianoche, 90));
    }

    public function test_ultima_hora_de_llegada_respeta_la_duracion_de_la_reserva(): void
    {
        $this->configurarHorario($this->fecha->dayOfWeekIso, [['Almuerzo', '12:00', '16:00']]);

        $almuerzo = $this->jornadas->resolver($this->localId, $this->fecha->toDateString(), 90)['turnos']['almuerzo'];
        $this->assertSame('14:30', collect($almuerzo['franjas'])->last()['hora']);
        $this->assertSame($this->fecha->toDateString().'T14:30:00', collect($almuerzo['franjas'])->last()['fecha_hora']);

        $this->assertTrue($this->jornadas->validarInicioReserva($this->localId, $this->enFecha('14:30'), 90)['valido']);

        $tarde = $this->jornadas->validarInicioReserva($this->localId, $this->enFecha('14:45'), 90);
        $this->assertFalse($tarde['valido']);
        $this->assertStringContainsString('14:30', $tarde['mensaje']);
    }
}
