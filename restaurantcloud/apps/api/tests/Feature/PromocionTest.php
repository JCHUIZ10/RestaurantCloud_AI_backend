<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class PromocionTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $adminId = '00000000-0000-4000-8000-000000000102';

    private string $adminCorreo = 'admin@aurea.local';

    private string $tokenAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        // Autenticación en Redis para admin_local
        $rawToken = 'test_token_admin_promo_'.Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->adminId,
            'nombre' => 'Mariana Ramos',
            'correo' => $this->adminCorreo,
            'rol' => 'admin_local',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenAdmin = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->tokenAdmin,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Test 1: Listado de promociones retorna estructura esperada con KPIs de sede y estado visual.
     */
    public function test_listado_promociones_retorna_kpis_y_estructura_correcta(): void
    {
        $response = $this->getJson('/api/v1/admin/promociones', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'kpis' => [
                    'vigentes_hoy',
                    'campanas_programadas',
                    'descuentos_mes',
                    'cuentas_beneficiadas',
                ],
                'promociones' => [
                    '*' => [
                        'id',
                        'codigo',
                        'nombre',
                        'tipo_descuento',
                        'valor',
                        'fecha_inicio',
                        'fecha_fin',
                        'tipo_limite_usos',
                        'activa',
                        'estado_visual',
                    ],
                ],
                'total',
            ],
        ]);
        $this->assertTrue($response->json('exito'));
    }

    /**
     * Test 2: Búsqueda bajo demanda con endpoint optimizado.
     */
    public function test_busqueda_optimizada_promociones(): void
    {
        $response = $this->getJson('/api/v1/admin/promociones/buscar?q=Almuerzo', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'termino',
                'resultados',
                'total',
            ],
        ]);
        $this->assertEquals('Almuerzo', $response->json('datos.termino'));
    }

    /**
     * Test 3: Alta de nueva promoción autogenera el código correlativo de sede (CU-ADMIN-17).
     */
    public function test_crear_promocion_autogenera_codigo_exitosamente(): void
    {
        $payload = [
            'nombre' => 'Test Martes de Parrillas '.Str::random(5),
            'descripcion' => 'Descuento especial en carnes',
            'tipo_descuento' => 'porcentaje',
            'valor' => 20,
            'tope_maximo_descuento' => 50,
            'monto_minimo_consumo' => 60,
            'fecha_inicio' => date('Y-m-d'),
            'fecha_fin' => date('Y-m-d', strtotime('+30 days')),
            'dias_semana' => [2],
            'tipo_limite_usos' => 'global',
            'limite_usos' => 100,
            'activa' => true,
        ];

        $response = $this->postJson('/api/v1/admin/promociones', $payload, $this->headers());

        $response->assertStatus(201);
        $this->assertTrue($response->json('exito'));
        $codigo = $response->json('datos.codigo');
        $this->assertNotEmpty($codigo);
        $this->assertStringStartsWith('PROMO-'.date('Y').'-', $codigo);

        // Limpieza
        $id = $response->json('datos.id');
        DB::table('promocion')->where('id', $id)->delete();
    }

    /**
     * Test 4: Rechazo por nombre comercial duplicado en la misma sede (409 Conflict).
     */
    public function test_crear_promocion_rechaza_nombre_duplicado_en_sede(): void
    {
        $payload = [
            'nombre' => '15% Almuerzo Ejecutivo', // Ya existe en semillas canónicas
            'tipo_descuento' => 'porcentaje',
            'valor' => 15,
            'fecha_inicio' => date('Y-m-d'),
            'fecha_fin' => date('Y-m-d', strtotime('+30 days')),
        ];

        $response = $this->postJson('/api/v1/admin/promociones', $payload, $this->headers());

        $response->assertStatus(409);
        $this->assertEquals('ERR_PROMOCION_DUPLICADA', $response->json('errores.0.codigo'));
    }

    /**
     * Test 5: Validaciones numéricas y temporales estrictas (RN-PROM-03, RN-PROM-04).
     */
    public function test_crear_promocion_valida_rango_fechas_y_porcentajes(): void
    {
        // Caso A: Fecha inicio posterior a fecha fin
        $payloadFechas = [
            'nombre' => 'Promo Fechas Invalidas '.Str::random(5),
            'tipo_descuento' => 'porcentaje',
            'valor' => 15,
            'fecha_inicio' => '2026-11-10',
            'fecha_fin' => '2026-10-10',
        ];

        $resFechas = $this->postJson('/api/v1/admin/promociones', $payloadFechas, $this->headers());
        $resFechas->assertStatus(422);

        // Caso B: Porcentaje mayor a 100%
        $payloadPorcentaje = [
            'nombre' => 'Promo Porcentaje Excesivo '.Str::random(5),
            'tipo_descuento' => 'porcentaje',
            'valor' => 150,
            'fecha_inicio' => date('Y-m-d'),
            'fecha_fin' => date('Y-m-d', strtotime('+10 days')),
        ];

        $resPorc = $this->postJson('/api/v1/admin/promociones', $payloadPorcentaje, $this->headers());
        $resPorc->assertStatus(422);
    }

    /**
     * Test 6: Bloqueo estricto de reactivación en caja de campaña vencida (RN-PROM-06).
     */
    public function test_toggle_estado_bloquea_reactivacion_de_promocion_vencida(): void
    {
        // Insertamos una promoción expirada
        $id = Str::uuid()->toString();
        DB::table('promocion')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'codigo' => 'PROMO-TEST-VENC',
            'nombre' => 'Promo Vencida '.Str::random(5),
            'tipo_descuento' => 'porcentaje',
            'valor' => 10,
            'fecha_inicio' => '2026-08-01',
            'fecha_fin' => '2026-08-31',
            'activa' => false,
            'tipo_limite_usos' => 'sin_limite',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->patchJson("/api/v1/admin/promociones/{$id}/estado", [
            'activa' => true,
        ], $this->headers());

        $response->assertStatus(400);
        $this->assertEquals('ERR_PROMOCION_VENCIDA', $response->json('errores.0.codigo'));

        // Limpieza
        DB::table('promocion')->where('id', $id)->delete();
    }

    /**
     * Test 7: Salvaguarda contable ante eliminación con historial de comprobantes (RN-PROM-02).
     */
    public function test_salvaguarda_contable_bloquea_eliminar_promocion_con_historial(): void
    {
        // La semilla deja la promoción canónica sin usos; se le simula historial de comprobantes
        $idConHistorial = '00000000-0000-4000-8000-000000000441';
        DB::table('promocion')->where('id', $idConHistorial)->update(['usos_actuales' => 12]);

        $response = $this->deleteJson("/api/v1/admin/promociones/{$idConHistorial}", [], $this->headers());

        $response->assertStatus(409);
        $this->assertEquals('ERR_PROMOCION_CON_HISTORIAL', $response->json('errores.0.codigo'));
    }

    /**
     * Test 8: Eliminación física exitosa de promoción sin usos.
     */
    public function test_eliminacion_fisica_exitosa_promocion_sin_usos(): void
    {
        $id = Str::uuid()->toString();
        DB::table('promocion')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'codigo' => 'PROMO-TEST-DEL',
            'nombre' => 'Promo Sin Usos '.Str::random(5),
            'tipo_descuento' => 'monto_fijo',
            'valor' => 10,
            'fecha_inicio' => date('Y-m-d'),
            'fecha_fin' => date('Y-m-d', strtotime('+10 days')),
            'activa' => true,
            'usos_actuales' => 0,
            'tipo_limite_usos' => 'sin_limite',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->deleteJson("/api/v1/admin/promociones/{$id}", [], $this->headers());

        $response->assertStatus(200);
        $this->assertDatabaseMissing('promocion', ['id' => $id]);
    }

    /**
     * Test 9: Consulta de rendimiento comercial y auditoría de comprobantes (CU-ADMIN-17 Vista 3).
     */
    public function test_rendimiento_comercial_retorna_metricas_y_comprobantes(): void
    {
        $id = '00000000-0000-4000-8000-000000000441';

        $response = $this->getJson("/api/v1/admin/promociones/{$id}/rendimiento", $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'promocion',
                'ventas_totales',
                'descuentos_totales',
                'ticket_promedio',
                'usos_totales',
                'comprobantes',
            ],
        ]);
    }

    /**
     * Test 10: Cálculo predictivo en tiempo real para Caja POS (CU-CAJA-02).
     */
    public function test_caja_calculo_predictivo_promociones_vigentes(): void
    {
        $response = $this->getJson('/api/v1/caja/promociones-vigentes?total_consumo=100.00', $this->headers());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'exito',
            'datos' => [
                'subtotal_cuenta',
                'elegibles',
                'no_elegibles',
            ],
        ]);
        $this->assertEquals(100.00, $response->json('datos.subtotal_cuenta'));
    }

    /**
     * @return array<string, string>
     */
    private function headersPropietario(): array
    {
        $rawToken = 'test_token_propietario_promo_'.Str::random(32);
        Redis::setex('auth:session:'.hash('sha256', $rawToken), 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000101',
            'nombre' => 'Rodrigo De Las Casas',
            'correo' => 'propietario@aurea.local',
            'rol' => 'propietario',
            'empresa_id' => $this->empresaId,
            'local_id' => null,
            'estado' => 'activo',
        ]));

        return ['Authorization' => 'Bearer '.$rawToken, 'Accept' => 'application/json'];
    }

    public function test_propietario_lista_promociones_de_su_sede_indicada_por_parametro(): void
    {
        $this->getJson("/api/v1/admin/promociones?local_id={$this->localId}", $this->headersPropietario())
            ->assertOk()
            ->assertJsonPath('exito', true);
    }

    public function test_propietario_no_accede_a_una_sede_que_el_middleware_rechazo(): void
    {
        // Sede ajena o inexistente: TenantContext no la asigna y el controlador no debe usarla
        $this->getJson('/api/v1/admin/promociones?local_id='.Str::uuid(), $this->headersPropietario())
            ->assertStatus(400)
            ->assertJsonPath('errores.0.codigo', 'ERR_LOCAL_REQUERIDO');
    }

    /**
     * @return array<string, mixed>
     */
    private function payloadConFranja(string $horaInicio, string $horaFin): array
    {
        return [
            'nombre' => 'Promo Franja '.Str::random(6),
            'tipo_descuento' => 'porcentaje',
            'valor' => 10,
            'fecha_inicio' => now('America/Lima')->toDateString(),
            'fecha_fin' => now('America/Lima')->addDays(10)->toDateString(),
            'hora_inicio' => $horaInicio,
            'hora_fin' => $horaFin,
        ];
    }

    public function test_crear_promocion_rechaza_una_franja_que_termina_antes_de_empezar(): void
    {
        // 22:00 a 02:00 cruza la medianoche: la caja nunca la aplicaría
        $this->postJson('/api/v1/admin/promociones', $this->payloadConFranja('22:00', '02:00'), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_VALIDACION_PROMOCION');

        $this->postJson('/api/v1/admin/promociones', $this->payloadConFranja('18:00', '18:00'), $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_VALIDACION_PROMOCION');
    }

    public function test_crear_promocion_rechaza_una_hora_con_formato_invalido(): void
    {
        $this->postJson('/api/v1/admin/promociones', $this->payloadConFranja('6pm', '21:00'), $this->headers())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['hora_inicio']);
    }

    public function test_crear_promocion_acepta_solo_dias_sin_franja_horaria(): void
    {
        $response = $this->postJson('/api/v1/admin/promociones', [
            ...$this->payloadConFranja('18:00', '21:00'),
            'hora_inicio' => null,
            'hora_fin' => null,
            'dias_semana' => [2, 4],
        ], $this->headers());

        $response->assertStatus(201);
        $this->assertSame([2, 4], $response->json('datos.dias_semana'));
        $this->assertNull($response->json('datos.hora_inicio'));
        $this->assertNull($response->json('datos.hora_fin'));
    }

    public function test_actualizar_promocion_valida_la_franja_contra_la_hora_ya_guardada(): void
    {
        $id = $this->postJson('/api/v1/admin/promociones', $this->payloadConFranja('12:00', '15:00'), $this->headers())
            ->assertStatus(201)
            ->json('datos.id');

        // Solo cambia el fin: 11:00 queda antes del inicio guardado (12:00)
        $this->putJson("/api/v1/admin/promociones/{$id}", ['hora_fin' => '11:00'], $this->headers())
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'ERR_VALIDACION_PROMOCION');

        $this->assertSame('15:00', substr((string) DB::table('promocion')->where('id', $id)->value('hora_fin'), 0, 5));
    }

    public function test_rendimiento_atribuye_el_comprobante_al_cajero_del_turno_y_suma_sus_totales(): void
    {
        $caja = DB::table('caja')->where('local_id', $this->localId)->where('estado', 'abierta')->first();
        if (! $caja) {
            $cajaId = (string) Str::uuid();
            DB::table('caja')->insert([
                'id' => $cajaId,
                'local_id' => $this->localId,
                'cajero_id' => '00000000-0000-4000-8000-000000000105',
                'monto_apertura' => 100.00,
                'estado' => 'abierta',
                'fecha_apertura' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $caja = DB::table('caja')->where('id', $cajaId)->first();
        }
        $cajeroNombre = DB::table('usuario')->where('id', $caja->cajero_id)->value('nombre');

        $promocionId = $this->postJson('/api/v1/admin/promociones', [
            ...$this->payloadConFranja('00:00', '23:59'),
            'hora_inicio' => null,
            'hora_fin' => null,
        ], $this->headers())->assertStatus(201)->json('datos.id');

        $mesa = DB::table('mesa')->where('local_id', $this->localId)->where('estado', 'activa')->first();
        $producto = DB::table('producto')->where('local_id', $this->localId)->first();
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa->id,
            'mozo_id' => $this->adminId,
            'numero_comanda' => 995,
            'comensales' => 1,
            'estado' => 'cuenta_pedida',
            'promocion_id' => $promocionId,
            'tipo_comprobante_sugerido' => 'boleta',
            'medio_pago_sugerido' => 'efectivo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('pedido_item')->insert([
            'id' => (string) Str::uuid(),
            'pedido_id' => $pedidoId,
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'precio_unitario' => 50.00,
            'estado' => 'entregado',
            'estado_pago' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson('/api/v1/caja/cobrar', [
            'pedido_id' => $pedidoId,
            'tipo_comprobante' => 'boleta',
            'medio_pago' => 'efectivo',
            'monto_recibido' => 45.00,
            'nombre_cliente' => 'CLIENTE DE PRUEBA',
        ], $this->headers())->assertStatus(200);

        $rendimiento = $this->getJson("/api/v1/admin/promociones/{$promocionId}/rendimiento", $this->headers())
            ->assertOk()
            ->json('datos');

        $this->assertSame(1, $rendimiento['usos_totales']);
        $this->assertEquals(50.00, $rendimiento['ventas_totales']);
        $this->assertEquals(5.00, $rendimiento['descuentos_totales']);
        $this->assertSame($cajeroNombre, $rendimiento['comprobantes'][0]['cajero_nombre']);
    }
}
