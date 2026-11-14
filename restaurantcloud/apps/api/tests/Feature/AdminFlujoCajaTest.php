<?php

namespace Tests\Feature;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * CU-ADMIN-14: flujo de caja, auditoría de turnos / cierres Z, gastos operativos y cierre forzado.
 *
 * Cada test trabaja en una sede nueva y vacía, para que los totales no dependan de la semilla.
 */
class AdminFlujoCajaTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $semillaLocalId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $cajeroId = '00000000-0000-4000-8000-000000000105';

    private string $otroCajeroId = '00000000-0000-4000-8000-000000000104';

    private string $localId;

    private string $tokenAdmin;

    private string $tokenCajero;

    private int $correlativoComprobante = 0;

    protected function setUp(): void
    {
        parent::setUp();

        $this->localId = $this->crearSede('Sede Finanzas A');

        $this->tokenAdmin = $this->abrirSesion($this->adminId, 'admin_local', $this->localId);
        $this->tokenCajero = $this->abrirSesion($this->cajeroId, 'cajero', $this->localId);
    }

    // ------------------------------------------------------------------
    // Flujo de caja
    // ------------------------------------------------------------------

    public function test_resumen_suma_ventas_vigentes_compras_y_gastos_del_periodo(): void
    {
        $caja = $this->crearCaja();
        $this->crearVenta($caja, 'efectivo', 100.00);
        $this->crearVenta($caja, 'tarjeta', 200.00);
        // Una venta anulada y su nota de crédito no son ingreso
        $this->crearVenta($caja, 'efectivo', 500.00, 'boleta', 'anulado');
        $this->crearVenta($caja, 'efectivo', -500.00, 'nota_credito');

        $this->crearCompra(80.00, 'transferencia');
        $this->crearGasto(40.00, 'alquiler', 'transferencia_bancaria');

        $res = $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('datos.local_id', $this->localId)
            ->assertJsonPath('datos.ingresos_totales', 300)
            ->assertJsonPath('datos.ingresos_desglose.efectivo_monto', 100)
            ->assertJsonPath('datos.ingresos_desglose.efectivo_porcentaje', 33.3)
            ->assertJsonPath('datos.ingresos_desglose.tarjeta_pos_monto', 200)
            ->assertJsonPath('datos.ingresos_desglose.billeteras_monto', 0)
            ->assertJsonPath('datos.compras_insumos_total', 80)
            ->assertJsonPath('datos.gastos_manuales_total', 40)
            ->assertJsonPath('datos.egresos_totales', 120)
            ->assertJsonPath('datos.balance_neto', 180)
            ->assertJsonPath('datos.margen_neto_porcentaje', 60)
            ->assertJsonPath('datos.ratio_cobertura', 2.5)
            ->assertJsonPath('datos.gastos_por_categoria.0.categoria', 'alquiler')
            ->assertJsonPath('datos.gastos_por_categoria.0.porcentaje_de_gastos', 100)
            ->assertJsonPath('datos.top_insumos_comprados.0.monto_total', 80)
            ->assertJsonCount(1, 'datos.curva_diaria')
            ->assertJsonPath('datos.curva_diaria.0.ingresos_dia', 300)
            ->assertJsonPath('datos.curva_diaria.0.egresos_dia', 120)
            ->assertJsonPath('datos.curva_diaria.0.saldo_neto_dia', 180);
    }

    public function test_resumen_reparte_la_liquidez_entre_gavetas_y_bancos(): void
    {
        $caja = $this->crearCaja();
        $this->crearVenta($caja, 'efectivo', 100.00);
        $this->crearVenta($caja, 'billetera_digital', 100.00);
        $this->crearGasto(20.00, 'limpieza_aseo', 'efectivo_caja');
        $this->crearGasto(30.00, 'alquiler', 'transferencia_bancaria');

        $res = $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_monto', 80)
            ->assertJsonPath('datos.conciliacion_liquidez.en_bancos_monto', 70)
            ->assertJsonPath('datos.conciliacion_liquidez.total_disponible', 150);
    }

    public function test_resumen_sin_movimientos_devuelve_ceros_y_dias_vacios(): void
    {
        $desde = now()->subDays(9)->toDateString();
        $hasta = now()->subDays(5)->toDateString();

        $res = $this->getJson("/api/v1/admin/finanzas/flujo-caja?periodo=personalizado&desde={$desde}&hasta={$hasta}", $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('datos.ingresos_totales', 0)
            ->assertJsonPath('datos.balance_neto', 0)
            ->assertJsonPath('datos.ratio_cobertura', 0)
            ->assertJsonPath('datos.delta_ingresos_pct', null)
            ->assertJsonPath('datos.delta_egresos_pct', null)
            ->assertJsonCount(5, 'datos.curva_diaria')
            ->assertJsonPath('datos.curva_diaria.0.fecha', $desde);
    }

    public function test_resumen_compara_con_el_periodo_anterior(): void
    {
        $caja = $this->crearCaja();
        $this->crearVenta($caja, 'efectivo', 150.00);
        // Ayer: el periodo anterior a "hoy" tiene la misma duración (1 día)
        $this->crearVenta($caja, 'efectivo', 100.00, 'boleta', 'emitido', now()->subDay()->setTime(12, 0));

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.ingresos_totales', 150)
            ->assertJsonPath('datos.delta_ingresos_pct', 50);
    }

    public function test_la_variacion_de_egresos_se_calcula_y_es_nula_sin_periodo_anterior(): void
    {
        $this->crearGasto(30.00, 'servicios_basicos', 'transferencia_bancaria', now()->subDay()->toDateString());
        $this->crearGasto(45.00, 'servicios_basicos', 'transferencia_bancaria');

        // Ayer hubo 30 de egresos y hoy 45: +50 %. Ingresos: sin ventas ayer, no hay con qué comparar
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.delta_egresos_pct', 50)
            ->assertJsonPath('datos.delta_ingresos_pct', null);
    }

    public function test_resumen_no_mezcla_datos_de_otras_sedes(): void
    {
        $otraSede = $this->crearSede('Sede Finanzas B');
        DB::table('gasto_manual')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $otraSede,
            'categoria' => 'alquiler',
            'monto' => 999.00,
            'origen_fondos' => 'transferencia_bancaria',
            'proveedor_nombre' => 'Inmobiliaria Otra Sede',
            'descripcion' => 'Alquiler de otra sede del mismo dueño',
            'registrado_por' => $this->adminId,
        ]);

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.gastos_manuales_total', 0);

        $this->getJson('/api/v1/admin/finanzas/gastos?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->assertJsonCount(0, 'datos');
    }

    public function test_rangos_invalidos_se_rechazan(): void
    {
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=personalizado', $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_RANGO_INVALIDO');

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=personalizado&desde=2026-05-10&hasta=2026-05-01', $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_RANGO_INVALIDO');

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=personalizado&desde=2024-01-01&hasta=2026-01-01', $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_RANGO_EXCEDIDO');

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=ayer', $this->headers())
            ->assertStatus(422);
    }

    public function test_solo_la_administracion_accede_a_las_finanzas(): void
    {
        $headersCajero = ['Authorization' => 'Bearer '.$this->tokenCajero, 'Accept' => 'application/json'];

        $this->getJson('/api/v1/admin/finanzas/flujo-caja', $headersCajero)->assertStatus(403);
        $this->getJson('/api/v1/admin/finanzas/turnos', $headersCajero)->assertStatus(403);
        $this->postJson('/api/v1/admin/finanzas/gastos', [], $headersCajero)->assertStatus(403);
        $this->getJson('/api/v1/admin/finanzas/flujo-caja')->assertStatus(401);
    }

    // ------------------------------------------------------------------
    // Gastos operativos
    // ------------------------------------------------------------------

    public function test_gasto_por_transferencia_no_necesita_turno_ni_toca_la_gaveta(): void
    {
        $res = $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['origen_fondos' => 'transferencia_bancaria']), $this->headers());

        $res->assertStatus(201)
            ->assertJsonPath('datos.monto', 30)
            ->assertJsonPath('datos.origen_fondos', 'transferencia_bancaria')
            ->assertJsonPath('datos.caja_id', null)
            ->assertJsonPath('datos.registrado_por', $this->adminId);

        $this->assertSame(0, DB::table('caja_movimiento')->where('local_id', $this->localId)->count());
        $this->assertDatabaseHas('log_auditoria', ['accion' => 'gasto.registrado', 'entidad_id' => $res->json('datos.id')]);
    }

    public function test_gasto_en_efectivo_se_descuenta_de_la_gaveta_del_turno_abierto(): void
    {
        $caja = $this->crearCaja(['monto_apertura' => 100.00]);

        $res = $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(), $this->headers());

        $res->assertStatus(201)
            ->assertJsonPath('datos.caja_id', $caja)
            ->assertJsonPath('datos.origen_fondos', 'efectivo_caja');

        $movimiento = DB::table('caja_movimiento')->where('caja_id', $caja)->where('tipo', 'egreso_gasto_manual')->first();
        $this->assertNotNull($movimiento);
        $this->assertEquals(-30.00, (float) $movimiento->monto);
        $this->assertSame($res->json('datos.id'), $movimiento->gasto_manual_id);

        // El esperado de la gaveta baja y el gasto no se confunde con una devolución
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.efectivo_esperado', 70)
            ->assertJsonPath('datos.egresos_gasto_caja', 30)
            ->assertJsonPath('datos.egresos_devolucion_nc', 0)
            ->assertJsonPath('datos.gastos_caja_detalle.0.proveedor_nombre', 'Bodega El Sol');
    }

    public function test_gasto_en_efectivo_sin_turno_abierto_retorna_409(): void
    {
        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(), $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_SIN_TURNO_ABIERTO');

        $this->assertSame(0, DB::table('gasto_manual')->where('local_id', $this->localId)->count());
    }

    public function test_gasto_en_efectivo_mayor_al_efectivo_de_la_gaveta_se_rechaza(): void
    {
        $this->crearCaja(['monto_apertura' => 20.00]);

        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['monto' => 30]), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_EFECTIVO_INSUFICIENTE');

        $this->assertSame(0, DB::table('gasto_manual')->where('local_id', $this->localId)->count());
    }

    public function test_gasto_en_efectivo_exige_la_fecha_de_hoy(): void
    {
        $this->crearCaja(['monto_apertura' => 100.00]);

        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['fecha' => now()->subDay()->toDateString()]), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_FECHA_EGRESO_EFECTIVO');
    }

    public function test_gasto_valida_los_datos_de_entrada(): void
    {
        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['descripcion' => 'corta', 'origen_fondos' => 'transferencia_bancaria']), $this->headers())
            ->assertStatus(422);
        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['monto' => 0, 'origen_fondos' => 'transferencia_bancaria']), $this->headers())
            ->assertStatus(422);
        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['categoria' => 'viajes', 'origen_fondos' => 'transferencia_bancaria']), $this->headers())
            ->assertStatus(422);
        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['fecha' => now()->addDay()->toDateString(), 'origen_fondos' => 'transferencia_bancaria']), $this->headers())
            ->assertStatus(422);
    }

    public function test_el_tipo_de_comprobante_del_gasto_solo_admite_los_codigos_definidos(): void
    {
        foreach (['factura', 'boleta', 'recibo_honorarios', 'recibo_servicios', 'recibo_interno'] as $codigo) {
            $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['origen_fondos' => 'transferencia_bancaria', 'tipo_comprobante' => $codigo]), $this->headers())
                ->assertStatus(201)
                ->assertJsonPath('datos.tipo_comprobante', $codigo);
        }

        // Sin tipo se asume recibo interno
        $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['origen_fondos' => 'transferencia_bancaria', 'tipo_comprobante' => null]), $this->headers())
            ->assertStatus(201)
            ->assertJsonPath('datos.tipo_comprobante', 'recibo_interno');

        // Una etiqueta antigua o un código inventado se rechazan
        foreach (['Boleta de Venta', 'ticket'] as $invalido) {
            $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['origen_fondos' => 'transferencia_bancaria', 'tipo_comprobante' => $invalido]), $this->headers())
                ->assertStatus(422);
        }
    }

    public function test_listado_de_gastos_filtra_por_periodo(): void
    {
        $this->crearGasto(25.00, 'servicios_basicos', 'transferencia_bancaria');
        $this->crearGasto(75.00, 'alquiler', 'transferencia_bancaria', now()->subDays(40)->toDateString());

        $this->getJson('/api/v1/admin/finanzas/gastos?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->assertJsonCount(1, 'datos')
            ->assertJsonPath('datos.0.monto', 25)
            ->assertJsonPath('datos.0.registrado_por_nombre', DB::table('usuario')->where('id', $this->adminId)->value('nombre'));

        $desde = now()->subDays(60)->toDateString();
        $hasta = now()->toDateString();
        $this->getJson("/api/v1/admin/finanzas/gastos?periodo=personalizado&desde={$desde}&hasta={$hasta}", $this->headers())
            ->assertStatus(200)
            ->assertJsonCount(2, 'datos');
    }

    // ------------------------------------------------------------------
    // Auditoría de turnos y visado
    // ------------------------------------------------------------------

    public function test_historial_de_turnos_calcula_indicadores_sin_compensar_faltantes_y_sobrantes(): void
    {
        $this->crearCajaCerrada(['monto_esperado' => 200, 'monto_real' => 200, 'discrepancia' => 0]);
        $this->crearCajaCerrada(['monto_esperado' => 300, 'monto_real' => 285, 'discrepancia' => -15, 'comentario_discrepancia' => 'Faltante en conteo de monedas']);
        $this->crearCajaCerrada(['monto_esperado' => 100, 'monto_real' => 110, 'discrepancia' => 10, 'comentario_discrepancia' => 'Sobrante por propina en efectivo']);
        $abierta = $this->crearCaja(['monto_apertura' => 150.00, 'fecha_apertura' => now()->subHours(3)]);

        $res = $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers());

        $res->assertStatus(200)
            ->assertJsonCount(4, 'datos.turnos')
            ->assertJsonPath('datos.kpis.total_turnos', 4)
            ->assertJsonPath('datos.kpis.turnos_cuadrados', 1)
            ->assertJsonPath('datos.kpis.porcentaje_cuadratura', 33.3)
            ->assertJsonPath('datos.kpis.turnos_con_discrepancia', 2)
            ->assertJsonPath('datos.kpis.monto_faltantes', 15)
            ->assertJsonPath('datos.kpis.monto_sobrantes', 10)
            ->assertJsonPath('datos.kpis.monto_total_discrepancias', -5)
            ->assertJsonPath('datos.kpis.turnos_pendientes_auditoria', 3)
            ->assertJsonPath('datos.kpis.turnos_auditados', 0)
            ->assertJsonPath('datos.kpis.turno_activo.id', $abierta)
            ->assertJsonPath('datos.kpis.turno_activo.horas_abierto', 3)
            ->assertJsonPath('datos.kpis.turno_activo.monto_esperado', 150);
    }

    public function test_el_turno_activo_de_los_indicadores_es_el_mismo_de_la_lista_cuando_cae_en_el_periodo(): void
    {
        $abierta = $this->crearCaja(['monto_apertura' => 120.00]);
        $this->crearVenta($abierta, 'efectivo', 30.00);

        $datos = $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->json('datos');

        $enLista = collect($datos['turnos'])->firstWhere('id', $abierta);
        $this->assertNotNull($enLista);
        $this->assertEquals(150.00, $enLista['monto_esperado']);
        $this->assertEquals($enLista, $datos['kpis']['turno_activo']);
    }

    public function test_un_turno_abierto_se_marca_sin_cerrar_pasada_la_jornada_de_la_sede_mas_la_tolerancia(): void
    {
        // Sin horario configurado la jornada termina a las 24:00; con la tolerancia de 60 min el aviso llega a la 01:00
        DB::table('horario_atencion')->where('local_id', $this->localId)->delete();
        $dia = now()->startOfDay();
        $this->travelTo($dia->copy()->setTime(10, 0));
        $caja = $this->crearCaja(['fecha_apertura' => now()]);

        $abandonado = function (): bool {
            $dia = now()->toDateString();

            return (bool) $this->getJson("/api/v1/admin/finanzas/turnos?periodo=personalizado&desde={$dia}&hasta={$dia}", $this->headers())
                ->assertStatus(200)
                ->json('datos.kpis.turno_activo.abandonado');
        };

        $this->assertFalse($abandonado());
        $this->travelTo($dia->copy()->setTime(23, 30));
        $this->assertFalse($abandonado());
        $this->travelTo($dia->copy()->addDay()->setTime(0, 59));
        $this->assertFalse($abandonado());
        $this->travelTo($dia->copy()->addDay()->setTime(1, 5));
        $this->assertTrue($abandonado());

        // El aviso no cierra nada: el turno sigue abierto
        $this->assertSame('abierta', DB::table('caja')->where('id', $caja)->value('estado'));
    }

    public function test_el_horario_nocturno_de_la_sede_extiende_la_jornada_del_turno(): void
    {
        $dia = now()->startOfDay();
        DB::table('horario_atencion')->where('local_id', $this->localId)->delete();
        DB::table('horario_atencion')->insert([
            'id' => (string) Str::uuid(), 'local_id' => $this->localId, 'dia_semana' => $dia->dayOfWeekIso,
            'nombre_turno' => 'Cena', 'atiende' => true, 'hora_inicio' => '19:00', 'hora_fin' => '02:30',
        ]);
        $this->travelTo($dia->copy()->setTime(19, 30));
        $this->crearCaja(['fecha_apertura' => now()]);

        $estado = function (): bool {
            $dia = now()->toDateString();

            return (bool) $this->getJson("/api/v1/admin/finanzas/turnos?periodo=personalizado&desde={$dia}&hasta={$dia}", $this->headers())
                ->assertStatus(200)
                ->json('datos.kpis.turno_activo.abandonado');
        };

        // La jornada llega hasta las 02:30 del día siguiente; con la tolerancia el aviso llega a las 03:30
        $this->travelTo($dia->copy()->addDay()->setTime(3, 0));
        $this->assertFalse($estado());
        $this->travelTo($dia->copy()->addDay()->setTime(3, 45));
        $this->assertTrue($estado());
    }

    public function test_el_turno_activo_se_informa_aunque_quede_fuera_del_periodo(): void
    {
        $abandonada = $this->crearCaja(['fecha_apertura' => now()->subDays(3)]);

        $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())
            ->assertStatus(200)
            ->assertJsonCount(0, 'datos.turnos')
            ->assertJsonPath('datos.kpis.turno_activo.id', $abandonada);
    }

    public function test_visar_un_turno_cerrado_registra_revisor_y_auditoria(): void
    {
        $caja = $this->crearCajaCerrada(['monto_esperado' => 200, 'monto_real' => 200, 'discrepancia' => 0]);

        $res = $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/visar", ['conforme' => true, 'notas_auditoria' => 'Arqueo verificado contra el lote POS.'], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('datos.revisado', true)
            ->assertJsonPath('datos.visado_conforme', true)
            ->assertJsonPath('datos.revisado_por', $this->adminId)
            ->assertJsonPath('datos.notas_auditoria', 'Arqueo verificado contra el lote POS.');

        $this->assertDatabaseHas('log_auditoria', ['accion' => 'turno.visado', 'entidad_id' => $caja, 'usuario_id' => $this->adminId]);

        // Un turno visado no se visa dos veces
        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/visar", ['conforme' => true], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_TURNO_YA_VISADO');
    }

    public function test_los_pendientes_de_visado_cuentan_toda_la_sede_sin_importar_el_periodo(): void
    {
        $antiguo = $this->crearCajaCerrada(['fecha_apertura' => now()->subDays(5)->subHours(8), 'fecha_cierre' => now()->subDays(5)]);
        $this->crearCajaCerrada();
        $this->crearCaja(['fecha_apertura' => now()->subDays(6)]);
        $otraSede = $this->crearSede('Sede Finanzas Pendientes');
        DB::table('caja')->insert([
            'id' => (string) Str::uuid(), 'local_id' => $otraSede, 'cajero_id' => $this->cajeroId, 'monto_apertura' => 50,
            'estado' => 'cerrada', 'fecha_apertura' => now()->subDays(9), 'fecha_cierre' => now()->subDays(8),
        ]);

        // Con el periodo "hoy" solo se ve el turno de hoy, pero el pendiente de hace 5 días sigue contando
        $kpis = $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())->assertStatus(200)->json('datos.kpis');
        $this->assertSame(1, $kpis['turnos_pendientes_auditoria']);
        $this->assertSame(2, $kpis['pendientes_auditoria_total']);
        $this->assertSame(
            now()->subDays(5)->subHours(8)->toDateString(),
            Carbon::parse($kpis['pendiente_mas_antiguo'])->toDateString()
        );

        $this->postJson("/api/v1/admin/finanzas/turnos/{$antiguo}/visar", ['conforme' => true, 'notas_auditoria' => 'Revisado contra el cuaderno de caja.'], $this->headers())->assertStatus(200);

        $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.kpis.pendientes_auditoria_total', 1);
    }

    public function test_sin_turnos_pendientes_el_total_global_es_cero_y_no_hay_mas_antiguo(): void
    {
        $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.kpis.pendientes_auditoria_total', 0)
            ->assertJsonPath('datos.kpis.pendiente_mas_antiguo', null);
    }

    public function test_un_turno_sin_reporte_z_exige_notas_para_visarse_y_lo_informa_en_el_listado(): void
    {
        $sinZ = $this->crearCajaCerrada(['monto_esperado' => 80, 'monto_real' => 80, 'discrepancia' => 0]);
        $conZ = $this->crearCajaCerrada(['monto_esperado' => 90, 'monto_real' => 90, 'discrepancia' => 0, 'fecha_apertura' => now()->subHours(10), 'fecha_cierre' => now()->subHours(9)]);
        DB::table('auditoria_caja_cierre')->insert([
            'id' => (string) Str::uuid(), 'caja_id' => $conZ, 'local_id' => $this->localId, 'cajero_id' => $this->cajeroId,
            'reporte_z_json' => json_encode(['caja_id' => $conZ]),
        ]);

        $turnos = collect($this->getJson('/api/v1/admin/finanzas/turnos?periodo=personalizado&desde='.now()->subDays(3)->toDateString().'&hasta='.now()->toDateString(), $this->headers())->json('datos.turnos'));
        $this->assertFalse($turnos->firstWhere('id', $sinZ)['tiene_reporte_z']);
        $this->assertTrue($turnos->firstWhere('id', $conZ)['tiene_reporte_z']);

        // Con Z archivado, la conformidad no exige notas
        $this->postJson("/api/v1/admin/finanzas/turnos/{$conZ}/visar", ['conforme' => true], $this->headers())->assertStatus(200);

        // Sin Z: sin notas o con notas cortas se rechaza, aunque sea conforme
        $this->postJson("/api/v1/admin/finanzas/turnos/{$sinZ}/visar", ['conforme' => true], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_VISADO_SIN_Z_REQUIERE_NOTAS');
        $this->postJson("/api/v1/admin/finanzas/turnos/{$sinZ}/visar", ['conforme' => true, 'notas_auditoria' => 'corta'], $this->headers())
            ->assertStatus(422);
        $this->assertFalse((bool) DB::table('caja')->where('id', $sinZ)->value('revisado'));

        $this->postJson("/api/v1/admin/finanzas/turnos/{$sinZ}/visar", ['conforme' => true, 'notas_auditoria' => 'Revisado contra los comprobantes del turno.'], $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.revisado', true)
            ->assertJsonPath('datos.tiene_reporte_z', false);

        $detalle = json_decode((string) DB::table('log_auditoria')->where('accion', 'turno.visado')->where('entidad_id', $sinZ)->value('detalle'), true);
        $this->assertTrue($detalle['sin_reporte_z']);
    }

    public function test_un_turno_observado_queda_pendiente_hasta_levantar_la_observacion(): void
    {
        $caja = $this->crearCajaCerrada(['monto_esperado' => 300, 'monto_real' => 285, 'discrepancia' => -15]);
        $conforme = $this->crearCajaCerrada(['fecha_apertura' => now()->subHours(3), 'fecha_cierre' => now()->subHours(2)]);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$conforme}/visar", ['conforme' => true, 'notas_auditoria' => 'Conforme con el arqueo.'], $this->headers())->assertStatus(200);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/visar", ['conforme' => false, 'notas_auditoria' => 'El faltante no tiene sustento.'], $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.visado_resultado', 'observado')
            ->assertJsonPath('datos.observacion_resuelta', false);

        $rango = '/api/v1/admin/finanzas/turnos?periodo=personalizado&desde='.now()->subDays(3)->toDateString().'&hasta='.now()->toDateString();
        $kpis = $this->getJson($rango, $this->headers())->json('datos.kpis');
        $this->assertSame(1, $kpis['turnos_observados_pendientes']);
        $this->assertSame(1, $kpis['turnos_auditados']);
        $this->assertSame(1, $kpis['observados_pendientes_total']);

        // Resolver exige una nota de al menos 10 caracteres
        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/levantar-observacion", [], $this->headers())->assertStatus(422);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/levantar-observacion", ['notas' => 'corta'], $this->headers())->assertStatus(422);

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/levantar-observacion", ['notas' => 'El cajero presentó el voucher faltante.'], $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.observacion_resuelta', true)
            ->assertJsonPath('datos.observacion_resuelta_por_nombre', DB::table('usuario')->where('id', $this->adminId)->value('nombre'))
            ->assertJsonPath('datos.observacion_resolucion', 'El cajero presentó el voucher faltante.')
            ->assertJsonPath('datos.visado_conforme', false);
        $this->assertDatabaseHas('log_auditoria', ['accion' => 'turno.observacion_levantada', 'entidad_id' => $caja, 'usuario_id' => $this->adminId]);

        $kpis = $this->getJson($rango, $this->headers())->json('datos.kpis');
        $this->assertSame(0, $kpis['turnos_observados_pendientes']);
        $this->assertSame(2, $kpis['turnos_auditados']);
        $this->assertSame(0, $kpis['observados_pendientes_total']);

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/levantar-observacion", ['notas' => 'Intento de resolver otra vez.'], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_OBSERVACION_YA_RESUELTA');
    }

    public function test_los_observados_pendientes_se_cuentan_en_toda_la_sede_y_dan_su_fecha_mas_antigua(): void
    {
        $antiguo = $this->crearCajaCerrada(['fecha_apertura' => now()->subDays(5)->subHours(8), 'fecha_cierre' => now()->subDays(5)]);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$antiguo}/visar", ['conforme' => false, 'notas_auditoria' => 'Diferencia sin sustento alguno.'], $this->headers())->assertStatus(200);

        $kpis = $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())->json('datos.kpis');
        $this->assertSame(0, $kpis['turnos_observados_pendientes']);
        $this->assertSame(1, $kpis['observados_pendientes_total']);
        $this->assertSame(
            now()->subDays(5)->subHours(8)->toDateString(),
            Carbon::parse($kpis['observado_mas_antiguo'])->toDateString()
        );

        $this->postJson("/api/v1/admin/finanzas/turnos/{$antiguo}/levantar-observacion", ['notas' => 'Se regularizó con el voucher.'], $this->headers())->assertStatus(200);
        $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.kpis.observados_pendientes_total', 0)
            ->assertJsonPath('datos.kpis.observado_mas_antiguo', null);
    }

    public function test_levantar_la_observacion_solo_aplica_a_turnos_observados_de_la_sede_y_a_la_administracion(): void
    {
        $nota = ['notas' => 'Se revisó y quedó resuelto.'];
        $conforme = $this->crearCajaCerrada();
        $this->postJson("/api/v1/admin/finanzas/turnos/{$conforme}/visar", ['conforme' => true, 'notas_auditoria' => 'Todo conforme con el turno.'], $this->headers())->assertStatus(200);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$conforme}/levantar-observacion", $nota, $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_TURNO_NO_OBSERVADO');

        $sinVisar = $this->crearCajaCerrada();
        $this->postJson("/api/v1/admin/finanzas/turnos/{$sinVisar}/levantar-observacion", $nota, $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_TURNO_NO_OBSERVADO');

        $otraSede = $this->crearSede('Sede Finanzas Observados');
        $ajeno = (string) Str::uuid();
        DB::table('caja')->insert([
            'id' => $ajeno, 'local_id' => $otraSede, 'cajero_id' => $this->cajeroId, 'monto_apertura' => 50, 'estado' => 'cerrada',
            'fecha_cierre' => now(), 'revisado' => true, 'visado_resultado' => 'observado',
        ]);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$ajeno}/levantar-observacion", $nota, $this->headers())
            ->assertStatus(404)
            ->assertJsonPath('errores.0.codigo', 'ERR_TURNO_NO_ENCONTRADO');

        $headersCajero = ['Authorization' => 'Bearer '.$this->tokenCajero, 'Accept' => 'application/json'];
        $this->postJson("/api/v1/admin/finanzas/turnos/{$ajeno}/levantar-observacion", $nota, $headersCajero)->assertStatus(403);
    }

    public function test_observar_un_turno_exige_motivo_y_queda_registrado(): void
    {
        $caja = $this->crearCajaCerrada(['monto_esperado' => 300, 'monto_real' => 285, 'discrepancia' => -15, 'comentario_discrepancia' => 'Faltante en conteo de monedas']);

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/visar", ['conforme' => false], $this->headers())
            ->assertStatus(422);

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/visar", ['conforme' => false, 'notas_auditoria' => 'El faltante no se justifica con el comprobante.'], $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.revisado', true)
            ->assertJsonPath('datos.visado_conforme', false);

        $this->getJson('/api/v1/admin/finanzas/turnos?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.turnos.0.visado_conforme', false);
    }

    public function test_no_se_puede_visar_un_turno_abierto_ni_de_otra_sede(): void
    {
        $abierta = $this->crearCaja();
        $this->postJson("/api/v1/admin/finanzas/turnos/{$abierta}/visar", ['conforme' => true], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_TURNO_ABIERTO');

        $otraSede = $this->crearSede('Sede Finanzas C');
        $ajeno = (string) Str::uuid();
        DB::table('caja')->insert([
            'id' => $ajeno, 'local_id' => $otraSede, 'cajero_id' => $this->cajeroId, 'monto_apertura' => 50,
            'estado' => 'cerrada', 'fecha_cierre' => now(), 'monto_esperado' => 50, 'monto_real' => 50, 'discrepancia' => 0,
        ]);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$ajeno}/visar", ['conforme' => true], $this->headers())
            ->assertStatus(404)
            ->assertJsonPath('errores.0.codigo', 'ERR_TURNO_NO_ENCONTRADO');
        $this->assertFalse((bool) DB::table('caja')->where('id', $ajeno)->value('revisado'));
    }

    public function test_reporte_z_archivado_solo_se_entrega_a_su_sede(): void
    {
        $caja = $this->crearCajaCerrada(['monto_esperado' => 200, 'monto_real' => 200, 'discrepancia' => 0]);
        DB::table('auditoria_caja_cierre')->insert([
            'id' => (string) Str::uuid(),
            'caja_id' => $caja,
            'local_id' => $this->localId,
            'cajero_id' => $this->cajeroId,
            'reporte_z_json' => json_encode(['caja_id' => $caja, 'turno_correlativo' => 7, 'efectivo_esperado' => 200]),
        ]);

        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/reporte-z", $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.caja_id', $caja)
            ->assertJsonPath('datos.turno_correlativo', 7);

        $abierta = $this->crearCaja();
        $this->getJson("/api/v1/admin/finanzas/turnos/{$abierta}/reporte-z", $this->headers())
            ->assertStatus(404)
            ->assertJsonPath('errores.0.codigo', 'ERR_REPORTE_Z_NO_ENCONTRADO');

        // Quien administra otra sede no puede leer este Z
        $otraSede = $this->crearSede('Sede Finanzas D');
        $headersOtra = ['Authorization' => 'Bearer '.$this->abrirSesion($this->adminId, 'admin_local', $otraSede), 'Accept' => 'application/json'];
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/reporte-z", $headersOtra)->assertStatus(404);
    }

    // ------------------------------------------------------------------
    // Cierre forzado
    // ------------------------------------------------------------------

    public function test_cierre_forzado_cierra_el_turno_abandonado_y_libera_la_terminal(): void
    {
        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId, 'monto_apertura' => 200.00, 'fecha_apertura' => now()->subHours(14)]);

        $res = $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/cierre-forzado", [
            'efectivo_contado' => 190.00,
            'justificacion' => 'Cajero salió por emergencia médica sin cerrar su turno.',
        ], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('datos.id', $caja)
            ->assertJsonPath('datos.estado', 'cerrada')
            ->assertJsonPath('datos.monto_real', 190)
            ->assertJsonPath('datos.discrepancia', -10)
            ->assertJsonPath('datos.revisado', false);

        $fila = DB::table('caja')->where('id', $caja)->first();
        $this->assertSame('cerrada', $fila->estado);
        $this->assertSame('Cajero salió por emergencia médica sin cerrar su turno.', $fila->comentario_discrepancia);
        $this->assertStringContainsString('Cierre forzado por administración', $fila->notas_cierre);

        // El Z queda marcado y a nombre del cajero del turno, no de quien lo forzó
        $audit = DB::table('auditoria_caja_cierre')->where('caja_id', $caja)->first();
        $this->assertSame($this->otroCajeroId, $audit->cajero_id);
        $z = json_decode($audit->reporte_z_json, true);
        $this->assertTrue($z['cierre_forzado']);
        $this->assertSame('Usuario Finanzas', $z['cerrado_por_nombre']);

        // El PDF deja constancia del cierre de rescate; un Z de cierre normal no lo menciona
        $html = view('pdf.reporte_z', ['reporte' => $z])->render();
        $this->assertStringContainsString('Cierre forzado por administración', $html);
        $this->assertStringContainsString('Cajero salió por emergencia médica', $html);
        // Sin la marca (ni las notas que repiten el texto) el aviso no aparece
        unset($z['cierre_forzado'], $z['notas_cierre']);
        $this->assertStringNotContainsString('Cierre forzado por administración', view('pdf.reporte_z', ['reporte' => $z])->render());
        $this->assertSame(DB::table('usuario')->where('id', $this->otroCajeroId)->value('nombre'), $z['cajero_nombre']);

        $this->assertDatabaseHas('log_auditoria', ['accion' => 'turno.cierre_forzado', 'entidad_id' => $caja, 'usuario_id' => $this->adminId]);

        // La terminal queda libre para un nuevo turno
        DB::table('caja')->insert([
            'id' => (string) Str::uuid(), 'local_id' => $this->localId, 'cajero_id' => $this->cajeroId,
            'monto_apertura' => 100, 'estado' => 'abierta',
        ]);
        $this->assertSame(1, DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->count());
    }

    public function test_cierre_forzado_sin_diferencia_no_registra_comentario_de_discrepancia(): void
    {
        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId, 'monto_apertura' => 120.00]);

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/cierre-forzado", [
            'efectivo_contado' => 120.00,
            'justificacion' => 'Relevo extraordinario de guardia por la administración.',
        ], $this->headers())->assertStatus(200)->assertJsonPath('datos.discrepancia', 0);

        $this->assertNull(DB::table('caja')->where('id', $caja)->value('comentario_discrepancia'));
    }

    public function test_cierre_forzado_exige_justificacion_detallada(): void
    {
        $caja = $this->crearCaja();

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/cierre-forzado", ['efectivo_contado' => 100, 'justificacion' => 'Muy corta'], $this->headers())
            ->assertStatus(422);

        $this->assertSame('abierta', DB::table('caja')->where('id', $caja)->value('estado'));
    }

    public function test_cierre_forzado_solo_actua_sobre_el_turno_abierto_de_la_sede(): void
    {
        $cerrada = $this->crearCajaCerrada(['monto_esperado' => 100, 'monto_real' => 100, 'discrepancia' => 0]);
        $abierta = $this->crearCaja();

        $datos = ['efectivo_contado' => 100, 'justificacion' => 'Cierre de rescate por abandono de turno.'];

        // Un turno ya cerrado no se cierra otra vez y el abierto no se toca por error
        $this->postJson("/api/v1/admin/finanzas/turnos/{$cerrada}/cierre-forzado", $datos, $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_CAJA_NO_ABIERTA');
        $this->assertSame('abierta', DB::table('caja')->where('id', $abierta)->value('estado'));

        // Tampoco desde otra sede
        $otraSede = $this->crearSede('Sede Finanzas E');
        $headersOtra = ['Authorization' => 'Bearer '.$this->abrirSesion($this->adminId, 'admin_local', $otraSede), 'Accept' => 'application/json'];
        $this->postJson("/api/v1/admin/finanzas/turnos/{$abierta}/cierre-forzado", $datos, $headersOtra)
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_CAJA_NO_ABIERTA');
        $this->assertSame('abierta', DB::table('caja')->where('id', $abierta)->value('estado'));
    }

    public function test_cierre_forzado_respeta_el_bloqueo_por_mesas_activas(): void
    {
        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId]);
        $this->crearPedidoActivo();

        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/cierre-forzado", [
            'efectivo_contado' => 100,
            'justificacion' => 'Cierre de rescate por abandono de turno.',
        ], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_SALON_CON_MESAS_ACTIVAS');

        $this->assertSame('abierta', DB::table('caja')->where('id', $caja)->value('estado'));
    }

    public function test_balance_del_turno_solo_existe_mientras_esta_abierto(): void
    {
        $abierta = $this->crearCaja(['monto_apertura' => 80.00]);
        $this->getJson("/api/v1/admin/finanzas/turnos/{$abierta}/balance", $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.caja_id', $abierta)
            ->assertJsonPath('datos.efectivo_esperado', 80)
            ->assertJsonPath('datos.salon_al_dia', true);

        $cerrada = $this->crearCajaCerrada(['monto_esperado' => 100, 'monto_real' => 100, 'discrepancia' => 0]);
        $this->getJson("/api/v1/admin/finanzas/turnos/{$cerrada}/balance", $this->headers())
            ->assertStatus(404)
            ->assertJsonPath('errores.0.codigo', 'ERR_CAJA_NO_ABIERTA');
    }

    // ------------------------------------------------------------------
    // Anulación de gastos
    // ------------------------------------------------------------------

    public function test_anular_un_gasto_por_transferencia_lo_saca_del_flujo_y_deja_rastro(): void
    {
        $gastoId = $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['origen_fondos' => 'transferencia_bancaria', 'monto' => 50]), $this->headers())
            ->assertStatus(201)
            ->assertJsonPath('datos.estado', 'registrado')
            ->assertJsonPath('datos.puede_anularse', true)
            ->json('datos.id');

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.gastos_manuales_total', 50);

        $res = $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'Monto digitado con un cero de más'], $this->headers());

        $res->assertStatus(200)
            ->assertJsonPath('datos.estado', 'anulado')
            ->assertJsonPath('datos.motivo_anulacion', 'Monto digitado con un cero de más')
            ->assertJsonPath('datos.puede_anularse', false)
            ->assertJsonPath('datos.anulado_por_nombre', DB::table('usuario')->where('id', $this->adminId)->value('nombre'));

        // El gasto anulado deja de contar, pero se sigue viendo en el listado
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.gastos_manuales_total', 0)
            ->assertJsonPath('datos.egresos_totales', 0)
            ->assertJsonCount(0, 'datos.gastos_por_categoria');
        $this->getJson('/api/v1/admin/finanzas/gastos?periodo=hoy', $this->headers())
            ->assertJsonCount(1, 'datos')
            ->assertJsonPath('datos.0.estado', 'anulado');

        $this->assertDatabaseHas('log_auditoria', ['accion' => 'gasto.anulado', 'entidad_id' => $gastoId, 'usuario_id' => $this->adminId]);

        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'Intento de anular otra vez'], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_GASTO_YA_ANULADO');
    }

    public function test_anular_un_gasto_en_efectivo_con_turno_abierto_devuelve_el_efectivo_a_la_gaveta(): void
    {
        $caja = $this->crearCaja(['monto_apertura' => 100.00]);
        $gastoId = $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(), $this->headers())->assertStatus(201)->json('datos.id');

        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertJsonPath('datos.efectivo_esperado', 70)
            ->assertJsonCount(1, 'datos.gastos_caja_detalle');

        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'Se pagó por transferencia, no en efectivo'], $this->headers())
            ->assertStatus(200);

        // El asiento sigue en la BD (auditoría) pero ya no cuenta para el esperado del cajero
        $this->assertSame(1, DB::table('caja_movimiento')->where('caja_id', $caja)->where('gasto_manual_id', $gastoId)->count());
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertJsonPath('datos.efectivo_esperado', 100)
            ->assertJsonPath('datos.egresos_gasto_caja', 0)
            ->assertJsonCount(0, 'datos.gastos_caja_detalle');
    }

    public function test_un_gasto_en_efectivo_de_un_turno_cerrado_no_se_puede_anular(): void
    {
        $caja = $this->crearCaja(['monto_apertura' => 100.00]);
        $gastoId = $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(), $this->headers())->assertStatus(201)->json('datos.id');
        DB::table('caja')->where('id', $caja)->update(['estado' => 'cerrada', 'fecha_cierre' => now(), 'monto_esperado' => 70, 'monto_real' => 70, 'discrepancia' => 0]);

        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'Registrado por error del cajero'], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_GASTO_TURNO_CERRADO');

        $this->assertSame('registrado', DB::table('gasto_manual')->where('id', $gastoId)->value('estado'));
        $this->getJson('/api/v1/admin/finanzas/gastos?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.0.puede_anularse', false);
    }

    public function test_anular_un_gasto_valida_motivo_sede_y_rol(): void
    {
        $gastoId = $this->postJson('/api/v1/admin/finanzas/gastos', $this->datosGasto(['origen_fondos' => 'transferencia_bancaria']), $this->headers())->json('datos.id');

        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'corto'], $this->headers())->assertStatus(422);
        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", [], $this->headers())->assertStatus(422);

        $otraSede = $this->crearSede('Sede Finanzas F');
        $headersOtra = ['Authorization' => 'Bearer '.$this->abrirSesion($this->adminId, 'admin_local', $otraSede), 'Accept' => 'application/json'];
        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'Gasto de otra sede ajena'], $headersOtra)
            ->assertStatus(404)
            ->assertJsonPath('errores.0.codigo', 'ERR_GASTO_NO_ENCONTRADO');

        $headersCajero = ['Authorization' => 'Bearer '.$this->tokenCajero, 'Accept' => 'application/json'];
        $this->postJson("/api/v1/admin/finanzas/gastos/{$gastoId}/anular", ['motivo' => 'Un cajero no puede anular'], $headersCajero)->assertStatus(403);

        $this->assertSame('registrado', DB::table('gasto_manual')->where('id', $gastoId)->value('estado'));
    }

    // ------------------------------------------------------------------
    // Compras de insumos pagadas con efectivo
    // ------------------------------------------------------------------

    // ------------------------------------------------------------------
    // Compras a crédito: el egreso cuenta cuando se paga
    // ------------------------------------------------------------------

    /** Compra a crédito de S/ 60 (3 kg a S/ 20) emitida en la fecha dada. */
    private function registrarCompraACredito(?string $fechaEmision = null): string
    {
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();
        $res = $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, [
            'metodo_pago' => 'CREDITO_30D',
            'fecha_emision' => $fechaEmision ?? now()->toDateString(),
        ]), $this->headers());
        $res->assertStatus(201);

        return (string) $res->json('datos.ficha.id');
    }

    public function test_una_compra_a_credito_sin_pagar_no_cuenta_como_egreso_y_figura_por_pagar(): void
    {
        $ficha = $this->registrarCompraACredito();

        $res = $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())->assertStatus(200);
        $res->assertJsonPath('datos.egresos_totales', 0)
            ->assertJsonPath('datos.compras_insumos_total', 0)
            ->assertJsonPath('datos.top_insumos_comprados', [])
            ->assertJsonPath('datos.conciliacion_liquidez.por_pagar_proveedores_monto', 60);

        $compras = $this->getJson('/api/v1/admin/compras', $this->headers())->assertStatus(200);
        $compras->assertJsonPath('datos.kpis.creditos_pendientes_monto', 60);
        $detalle = $this->getJson("/api/v1/admin/compras/{$ficha}", $this->headers())->assertStatus(200);
        $detalle->assertJsonPath('datos.por_pagar', true)->assertJsonPath('datos.pagada', false)->assertJsonPath('datos.fecha_pago', null);
    }

    public function test_pagar_una_compra_a_credito_la_cuenta_en_su_fecha_de_pago(): void
    {
        $ficha = $this->registrarCompraACredito(now()->subDays(10)->toDateString());
        $fechaPago = now()->subDays(2)->toDateString();

        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'transferencia', 'fecha_pago' => $fechaPago], $this->headers())
            ->assertStatus(200)
            ->assertJsonPath('datos.pagada', true)
            ->assertJsonPath('datos.por_pagar', false)
            ->assertJsonPath('datos.fecha_pago', $fechaPago)
            ->assertJsonPath('datos.pago_metodo', 'transferencia');

        // Cuenta en el periodo que contiene la fecha de pago, no en el de la emisión
        $enPago = '/api/v1/admin/finanzas/flujo-caja?periodo=personalizado&desde='.now()->subDays(3)->toDateString().'&hasta='.now()->subDay()->toDateString();
        $this->getJson($enPago, $this->headers())
            ->assertJsonPath('datos.compras_insumos_total', 60)
            ->assertJsonPath('datos.conciliacion_liquidez.en_bancos_monto', -60)
            ->assertJsonPath('datos.conciliacion_liquidez.por_pagar_proveedores_monto', 0);
        $enEmision = '/api/v1/admin/finanzas/flujo-caja?periodo=personalizado&desde='.now()->subDays(11)->toDateString().'&hasta='.now()->subDays(9)->toDateString();
        $this->getJson($enEmision, $this->headers())->assertJsonPath('datos.compras_insumos_total', 0);

        $this->getJson('/api/v1/admin/compras', $this->headers())->assertJsonPath('datos.kpis.creditos_pendientes_monto', 0);
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'transferencia'], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_COMPRA_YA_PAGADA');
    }

    public function test_el_pago_de_una_compra_valida_fecha_tipo_estado_y_sede(): void
    {
        $ficha = $this->registrarCompraACredito(now()->subDays(3)->toDateString());

        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", [], $this->headers())->assertStatus(422);
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'cheque'], $this->headers())->assertStatus(422);
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'transferencia', 'fecha_pago' => now()->addDay()->toDateString()], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_FECHA_PAGO_INVALIDA');
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'transferencia', 'fecha_pago' => now()->subDays(5)->toDateString()], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_FECHA_PAGO_INVALIDA');
        $this->assertNull(DB::table('ficha_compra')->where('id', $ficha)->value('fecha_pago'));

        // Una compra que no es a crédito no tiene pago pendiente
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();
        $contado = (string) $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['metodo_pago' => 'TRANSFERENCIA']), $this->headers())->json('datos.ficha.id');
        $this->postJson("/api/v1/admin/compras/{$contado}/pagar", ['metodo' => 'transferencia'], $this->headers())
            ->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_COMPRA_NO_ES_CREDITO');

        // Una compra anulada no se paga
        $this->postJson("/api/v1/admin/compras/{$ficha}/anular", ['motivo' => 'Compra registrada por error'], $this->headers())->assertStatus(200);
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'transferencia'], $this->headers())
            ->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_COMPRA_ANULADA');

        // Una compra que no es de la sede no existe para ella
        $this->postJson('/api/v1/admin/compras/'.Str::uuid().'/pagar', ['metodo' => 'transferencia'], $this->headers())
            ->assertStatus(404)->assertJsonPath('errores.0.codigo', 'ERR_COMPRA_NO_ENCONTRADA');
    }

    public function test_pagar_una_compra_a_credito_con_la_gaveta_descuenta_del_esperado_y_exige_turno_y_fecha_de_hoy(): void
    {
        $ficha = $this->registrarCompraACredito(now()->subDays(4)->toDateString());
        $pago = ['metodo' => 'efectivo', 'origen_efectivo' => 'gaveta_turno'];

        // Sin turno abierto
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", $pago, $this->headers())
            ->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_SIN_TURNO_ABIERTO');

        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId, 'monto_apertura' => 500.00]);
        // Con la gaveta la fecha es hoy
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", $pago + ['fecha_pago' => now()->subDay()->toDateString()], $this->headers())
            ->assertStatus(422)->assertJsonPath('errores.0.codigo', 'ERR_FECHA_EGRESO_EFECTIVO');

        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", $pago, $this->headers())->assertStatus(200);
        $this->assertSame($caja, DB::table('ficha_compra')->where('id', $ficha)->value('pago_caja_id'));
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertJsonPath('datos.efectivo_esperado', 440)
            ->assertJsonPath('datos.egresos_compra_caja', 60);
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_monto', -60)
            ->assertJsonPath('datos.compras_insumos_total', 60);

        // Anular la compra con el turno abierto devuelve el efectivo a la gaveta
        $this->postJson("/api/v1/admin/compras/{$ficha}/anular", ['motivo' => 'Se pagó dos veces al proveedor'], $this->headers())->assertStatus(200);
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())->assertJsonPath('datos.efectivo_esperado', 500);
    }

    public function test_una_compra_a_credito_pagada_con_la_gaveta_de_un_turno_cerrado_no_se_puede_anular(): void
    {
        $ficha = $this->registrarCompraACredito(now()->subDays(4)->toDateString());
        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId, 'monto_apertura' => 500.00]);
        $this->postJson("/api/v1/admin/compras/{$ficha}/pagar", ['metodo' => 'efectivo', 'origen_efectivo' => 'gaveta_turno'], $this->headers())->assertStatus(200);

        DB::table('caja')->where('id', $caja)->update(['estado' => 'cerrada', 'fecha_cierre' => now(), 'monto_esperado' => 440, 'monto_real' => 440, 'discrepancia' => 0]);

        $this->postJson("/api/v1/admin/compras/{$ficha}/anular", ['motivo' => 'Intento tardío de anular'], $this->headers())
            ->assertStatus(409)->assertJsonPath('errores.0.codigo', 'ERR_COMPRA_TURNO_CERRADO');
        $this->assertSame('registrada', DB::table('ficha_compra')->where('id', $ficha)->value('estado'));
    }

    public function test_la_liquidez_cierra_con_el_balance_neto_y_oculta_porcentajes_con_un_canal_negativo(): void
    {
        $caja = $this->crearCaja();
        $this->crearVenta($caja, 'efectivo', 100.00);
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();
        // Efectivo de caja chica (fuera del POS): sale del balance pero no de la gaveta
        $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['origen_efectivo' => 'caja_chica']), $this->headers())->assertStatus(201);

        $res = $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())->assertStatus(200);
        $res->assertJsonPath('datos.balance_neto', 40)
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_monto', 100)
            ->assertJsonPath('datos.conciliacion_liquidez.pagado_caja_chica_monto', 60)
            ->assertJsonPath('datos.conciliacion_liquidez.total_disponible', 40)
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_porcentaje', 100);

        // Un gasto por transferencia sin ingresos digitales deja los bancos en negativo: no hay reparto porcentual
        $this->crearGasto(50.00, 'alquiler', 'transferencia_bancaria');
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.conciliacion_liquidez.en_bancos_monto', -50)
            ->assertJsonPath('datos.conciliacion_liquidez.en_bancos_porcentaje', null)
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_porcentaje', null)
            ->assertJsonPath('datos.conciliacion_liquidez.total_disponible', -10)
            ->assertJsonPath('datos.balance_neto', -10);
    }

    public function test_compra_en_efectivo_de_la_gaveta_descuenta_del_esperado_y_llega_al_z_y_al_pdf(): void
    {
        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId, 'monto_apertura' => 500.00]);
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();

        $res = $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['origen_efectivo' => 'gaveta_turno']), $this->headers());
        $res->assertStatus(201);
        $fichaId = $res->json('datos.ficha.id');

        $ficha = DB::table('ficha_compra')->where('id', $fichaId)->first();
        $this->assertSame('gaveta_turno', $ficha->origen_efectivo);
        $this->assertSame($caja, $ficha->caja_id);

        $movimiento = DB::table('caja_movimiento')->where('ficha_compra_id', $fichaId)->first();
        $this->assertSame('egreso_compra_insumo', $movimiento->tipo);
        $this->assertEquals(-60.00, (float) $movimiento->monto);

        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertJsonPath('datos.efectivo_esperado', 440)
            ->assertJsonPath('datos.egresos_compra_caja', 60)
            ->assertJsonPath('datos.egresos_gasto_caja', 0)
            ->assertJsonPath('datos.egresos_devolucion_nc', 0)
            ->assertJsonPath('datos.gastos_caja_detalle.0.tipo', 'compra');

        // Lo comprado cuenta como egreso del flujo y sale de las gavetas
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.compras_insumos_total', 60)
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_monto', -60);

        // El cierre de rescate archiva la compra en el Z y el PDF la explica
        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/cierre-forzado", [
            'efectivo_contado' => 440,
            'justificacion' => 'Cierre de rescate por abandono de turno.',
        ], $this->headers())->assertStatus(200)->assertJsonPath('datos.discrepancia', 0);

        $reporte = $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/reporte-z", $this->headers())->assertStatus(200)->json('datos');
        $this->assertEquals(60.00, $reporte['total_compras_caja_efectivo']);
        $this->assertSame('compra', $reporte['gastos_caja_detalle'][0]['tipo']);
        $html = view('pdf.reporte_z', ['reporte' => $reporte])->render();
        $this->assertStringContainsString('Compras de insumos S/ 60.00', $html);
        $this->assertStringContainsString('Egresos Pagados con Efectivo de la Gaveta', $html);
    }

    public function test_compra_con_efectivo_de_la_gaveta_exige_turno_fecha_de_hoy_y_saldo(): void
    {
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();
        $stockInicial = (float) DB::table('insumo')->where('id', $insumoId)->value('stock_actual');
        $datos = fn (array $extra = []) => $this->datosCompra($proveedorId, $insumoId, array_merge(['origen_efectivo' => 'gaveta_turno'], $extra));

        // Sin turno abierto
        $this->postJson('/api/v1/admin/compras', $datos(), $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_SIN_TURNO_ABIERTO');

        // Con turno, pero la gaveta no alcanza
        $this->crearCaja(['monto_apertura' => 20.00]);
        $this->postJson('/api/v1/admin/compras', $datos(), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_EFECTIVO_INSUFICIENTE');

        // Fecha de emisión distinta de hoy
        $this->postJson('/api/v1/admin/compras', $datos(['fecha_emision' => now()->subDay()->toDateString()]), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_FECHA_EGRESO_EFECTIVO');

        // Ninguna compra rechazada dejó rastro ni movió el stock
        $this->assertSame(0, DB::table('ficha_compra')->where('local_id', $this->localId)->count());
        $this->assertEquals($stockInicial, (float) DB::table('insumo')->where('id', $insumoId)->value('stock_actual'));
    }

    public function test_compra_en_efectivo_de_caja_chica_no_toca_la_gaveta(): void
    {
        $caja = $this->crearCaja(['monto_apertura' => 100.00]);
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();

        $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['origen_efectivo' => 'caja_chica']), $this->headers())->assertStatus(201);

        $this->assertSame(0, DB::table('caja_movimiento')->where('caja_id', $caja)->where('tipo', 'egreso_compra_insumo')->count());
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertJsonPath('datos.efectivo_esperado', 100)
            ->assertJsonPath('datos.egresos_compra_caja', 0);

        // Es un egreso del flujo, pero no sale de las gavetas ni de los bancos
        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $this->headers())
            ->assertJsonPath('datos.compras_insumos_total', 60)
            ->assertJsonPath('datos.conciliacion_liquidez.en_gavetas_monto', 0)
            ->assertJsonPath('datos.conciliacion_liquidez.en_bancos_monto', 0);
    }

    public function test_compra_en_efectivo_sin_origen_se_trata_como_caja_chica_y_el_origen_invalido_se_rechaza(): void
    {
        $caja = $this->crearCaja(['monto_apertura' => 100.00]);
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();

        $fichaId = $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId), $this->headers())
            ->assertStatus(201)->json('datos.ficha.id');
        $this->assertSame('caja_chica', DB::table('ficha_compra')->where('id', $fichaId)->value('origen_efectivo'));
        $this->assertSame(0, DB::table('caja_movimiento')->where('caja_id', $caja)->where('tipo', 'egreso_compra_insumo')->count());

        $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['origen_efectivo' => 'billetera']), $this->headers())
            ->assertStatus(422);

        // Pagar por transferencia ignora el origen del efectivo
        $transferencia = $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['metodo_pago' => 'TRANSFERENCIA', 'origen_efectivo' => 'gaveta_turno']), $this->headers())
            ->assertStatus(201)->json('datos.ficha.id');
        $this->assertNull(DB::table('ficha_compra')->where('id', $transferencia)->value('origen_efectivo'));
        $this->assertSame(0, DB::table('caja_movimiento')->where('caja_id', $caja)->where('tipo', 'egreso_compra_insumo')->count());
    }

    public function test_anular_una_compra_de_la_gaveta_solo_con_el_turno_abierto(): void
    {
        $caja = $this->crearCaja(['monto_apertura' => 500.00]);
        [$proveedorId, $insumoId] = $this->crearProveedorEInsumo();
        $fichaId = $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['origen_efectivo' => 'gaveta_turno']), $this->headers())
            ->assertStatus(201)->json('datos.ficha.id');

        $this->postJson("/api/v1/admin/compras/{$fichaId}/anular", ['motivo' => 'Compra duplicada por error'], $this->headers())->assertStatus(200);
        $this->assertSame('anulada', DB::table('ficha_compra')->where('id', $fichaId)->value('estado'));
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/balance", $this->headers())
            ->assertJsonPath('datos.efectivo_esperado', 500)
            ->assertJsonPath('datos.egresos_compra_caja', 0)
            ->assertJsonCount(0, 'datos.gastos_caja_detalle');

        // Con el turno cerrado, el Z ya la incluyó: no se puede anular
        $segunda = $this->postJson('/api/v1/admin/compras', $this->datosCompra($proveedorId, $insumoId, ['origen_efectivo' => 'gaveta_turno', 'numero_comprobante' => 'F001-2']), $this->headers())
            ->assertStatus(201)->json('datos.ficha.id');
        DB::table('caja')->where('id', $caja)->update(['estado' => 'cerrada', 'fecha_cierre' => now(), 'monto_esperado' => 440, 'monto_real' => 440, 'discrepancia' => 0]);

        $this->postJson("/api/v1/admin/compras/{$segunda}/anular", ['motivo' => 'Compra registrada por error'], $this->headers())
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_COMPRA_TURNO_CERRADO');
        $this->assertSame('registrada', DB::table('ficha_compra')->where('id', $segunda)->value('estado'));
    }

    // ------------------------------------------------------------------
    // Acceso del propietario
    // ------------------------------------------------------------------

    public function test_propietario_con_sede_activa_consulta_las_finanzas_y_descarga_el_pdf_del_z(): void
    {
        $caja = $this->crearCaja(['cajero_id' => $this->otroCajeroId, 'monto_apertura' => 100.00]);
        $this->postJson("/api/v1/admin/finanzas/turnos/{$caja}/cierre-forzado", [
            'efectivo_contado' => 100,
            'justificacion' => 'Cierre de rescate por abandono de turno.',
        ], $this->headers())->assertStatus(200);

        $propietario = '00000000-0000-4000-8000-000000000101';
        $conSede = ['Authorization' => 'Bearer '.$this->abrirSesion($propietario, 'propietario', null), 'Accept' => 'application/json', 'X-Local-Id' => $this->localId];

        $this->getJson('/api/v1/admin/finanzas/flujo-caja?periodo=hoy', $conSede)
            ->assertStatus(200)
            ->assertJsonPath('datos.local_id', $this->localId);
        $this->getJson("/api/v1/admin/finanzas/turnos/{$caja}/reporte-z", $conSede)->assertStatus(200);

        $pdf = $this->get("/api/v1/admin/finanzas/turnos/{$caja}/reporte-z/pdf", $conSede);
        $pdf->assertStatus(200);
        $this->assertSame('application/pdf', $pdf->headers->get('content-type'));
    }

    public function test_propietario_sin_sede_o_con_sede_inexistente_no_accede_a_las_finanzas(): void
    {
        $propietario = '00000000-0000-4000-8000-000000000101';
        $caja = $this->crearCajaCerrada(['monto_esperado' => 100, 'monto_real' => 100, 'discrepancia' => 0]);
        $tokenSinSede = $this->abrirSesion($propietario, 'propietario', null);

        $this->getJson('/api/v1/admin/finanzas/flujo-caja', ['Authorization' => 'Bearer '.$tokenSinSede, 'Accept' => 'application/json'])
            ->assertStatus(400)
            ->assertJsonPath('errores.0.codigo', 'ERR_LOCAL_REQUERIDO');

        $this->getJson('/api/v1/admin/finanzas/flujo-caja', ['Authorization' => 'Bearer '.$tokenSinSede, 'Accept' => 'application/json', 'X-Local-Id' => (string) Str::uuid()])
            ->assertStatus(400);

        // Sin sede activa tampoco se sirve el PDF de ningún turno
        $this->get("/api/v1/admin/finanzas/turnos/{$caja}/reporte-z/pdf", ['Authorization' => 'Bearer '.$tokenSinSede, 'Accept' => 'application/json'])
            ->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // Ayudas de datos
    // ------------------------------------------------------------------

    /** @return array{0: string, 1: string} proveedor e insumo de la sede de prueba */
    private function crearProveedorEInsumo(): array
    {
        $proveedorId = (string) Str::uuid();
        DB::table('proveedor')->insert(['id' => $proveedorId, 'local_id' => $this->localId, 'nombre' => 'Mercado '.Str::random(5)]);

        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert(['id' => $insumoId, 'local_id' => $this->localId, 'nombre' => 'Insumo '.Str::random(5), 'unidad_medida' => 'kg', 'stock_actual' => 10]);

        return [$proveedorId, $insumoId];
    }

    /**
     * Compra de 3 kg a S/ 20 (S/ 60) pagada en efectivo, sin desglose de IGV.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function datosCompra(string $proveedorId, string $insumoId, array $extra = []): array
    {
        return array_merge([
            'proveedor_id' => $proveedorId,
            'tipo_comprobante' => 'NOTA_VENTA',
            'numero_comprobante' => 'NV-'.random_int(1000, 9999),
            'fecha_emision' => now()->toDateString(),
            'metodo_pago' => 'EFECTIVO',
            'items' => [['insumo_id' => $insumoId, 'cantidad' => 3, 'precio_unitario' => 20]],
        ], $extra);
    }

    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->tokenAdmin, 'Accept' => 'application/json'];
    }

    private function abrirSesion(string $usuarioId, string $rol, ?string $localId): string
    {
        $raw = 'test_token_finanzas_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $raw), 3600, json_encode([
            'id' => $usuarioId,
            'nombre' => 'Usuario Finanzas',
            'correo' => 'finanzas@aurea.local',
            'rol' => $rol,
            'empresa_id' => $this->empresaId,
            'local_id' => $localId,
            'estado' => 'activo',
        ]));

        return $raw;
    }

    private function crearSede(string $nombre): string
    {
        $semilla = DB::table('local')->where('id', $this->semillaLocalId)->first();
        $localId = (string) Str::uuid();

        DB::table('local')->insert([
            'id' => $localId,
            'empresa_id' => $semilla->empresa_id,
            'nombre' => $nombre,
            'slug' => 'finanzas-'.Str::lower(Str::random(8)),
            'direccion' => $semilla->direccion,
            'ubigeo_cod' => $semilla->ubigeo_cod,
            'telefono' => $semilla->telefono,
        ]);

        DB::table('comprobante_serie')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $localId,
            'tipo_comprobante' => 'boleta',
            'serie' => 'B001',
            'correlativo_actual' => 0,
            'activo' => true,
        ]);

        return $localId;
    }

    /** @param  array<string, mixed>  $extra */
    private function crearCaja(array $extra = []): string
    {
        $id = (string) Str::uuid();
        DB::table('caja')->insert(array_merge([
            'id' => $id,
            'local_id' => $this->localId,
            'cajero_id' => $this->cajeroId,
            'monto_apertura' => 100.00,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
        ], $extra));

        return $id;
    }

    /** @param  array<string, mixed>  $extra */
    private function crearCajaCerrada(array $extra = []): string
    {
        return $this->crearCaja(array_merge([
            'estado' => 'cerrada',
            'fecha_apertura' => now()->subHours(8),
            'fecha_cierre' => now()->subHours(1),
        ], $extra));
    }

    private function crearVenta(string $cajaId, string $medio, float $total, string $tipo = 'boleta', string $estado = 'emitido', $fecha = null): void
    {
        DB::table('comprobante')->insert([
            'id' => (string) Str::uuid(),
            'caja_id' => $cajaId,
            'local_id' => $this->localId,
            'tipo' => $tipo,
            'serie' => 'B001',
            'correlativo' => ++$this->correlativoComprobante,
            'nombre_cliente' => 'CONSUMIDOR FINAL',
            'medio_pago' => $medio,
            'subtotal_consumo' => $total,
            'total' => $total,
            'base_imponible' => round($total / 1.18, 2),
            'igv' => round($total - $total / 1.18, 2),
            'estado' => $estado,
            'fecha' => $fecha ?? now(),
            'token_qr' => (string) Str::uuid(),
        ]);
    }

    private function crearCompra(float $total, string $metodoPago): void
    {
        $proveedorId = (string) Str::uuid();
        DB::table('proveedor')->insert(['id' => $proveedorId, 'local_id' => $this->localId, 'nombre' => 'Proveedor '.Str::random(5)]);

        $insumoId = (string) Str::uuid();
        DB::table('insumo')->insert(['id' => $insumoId, 'local_id' => $this->localId, 'nombre' => 'Insumo '.Str::random(5), 'unidad_medida' => 'kg']);

        $fichaId = (string) Str::uuid();
        DB::table('ficha_compra')->insert([
            'id' => $fichaId,
            'local_id' => $this->localId,
            'proveedor_id' => $proveedorId,
            'usuario_id' => $this->adminId,
            'numero_comprobante' => 'F001-'.random_int(1000, 9999),
            'metodo_pago' => $metodoPago,
            'subtotal' => $total,
            'total' => $total,
            'fecha_emision' => now()->toDateString(),
        ]);
        DB::table('ficha_compra_detalle')->insert([
            'id' => (string) Str::uuid(),
            'ficha_compra_id' => $fichaId,
            'insumo_id' => $insumoId,
            'cantidad' => 4,
            'precio_unitario' => $total / 4,
            'subtotal' => $total,
        ]);
    }

    private function crearGasto(float $monto, string $categoria, string $origen, ?string $fecha = null): void
    {
        DB::table('gasto_manual')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'categoria' => $categoria,
            'monto' => $monto,
            'origen_fondos' => $origen,
            'proveedor_nombre' => 'Proveedor de prueba',
            'descripcion' => 'Gasto operativo de prueba del periodo',
            'registrado_por' => $this->adminId,
            'fecha' => $fecha ?? now()->toDateString(),
        ]);
    }

    private function crearPedidoActivo(): void
    {
        $pisoId = (string) Str::uuid();
        DB::table('piso')->insert(['id' => $pisoId, 'local_id' => $this->localId, 'nombre' => 'Piso finanzas']);

        $mesaId = (string) Str::uuid();
        DB::table('mesa')->insert(['id' => $mesaId, 'local_id' => $this->localId, 'piso_id' => $pisoId, 'numero' => '1', 'capacidad' => 4]);

        DB::table('pedido')->insert([
            'id' => (string) Str::uuid(),
            'local_id' => $this->localId,
            'numero_comanda' => 1,
            'mesa_id' => $mesaId,
            'mozo_id' => $this->otroCajeroId,
            'estado' => 'enviado',
        ]);
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function datosGasto(array $extra = []): array
    {
        return array_merge([
            'categoria' => 'limpieza_aseo',
            'monto' => 30.00,
            'origen_fondos' => 'efectivo_caja',
            'proveedor_nombre' => 'Bodega El Sol',
            'tipo_comprobante' => 'boleta',
            'numero_documento' => 'B001-1234',
            'descripcion' => 'Compra de insumos de limpieza para el salón',
            'fecha' => now()->toDateString(),
        ], $extra);
    }
}
