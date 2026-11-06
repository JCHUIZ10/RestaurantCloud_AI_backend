<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class CobroFiscalComprobanteTest extends TestCase
{
    private string $empresaId = '00000000-0000-4000-8000-000000000001';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $cajeroId = '00000000-0000-4000-8000-000000000105';

    private string $tokenCajero;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_cobro_fiscal_'.Str::random(32);
        $tokenHash = hash('sha256', $rawToken);

        $sessionPayload = [
            'id' => $this->cajeroId,
            'nombre' => 'Lucía Quispe',
            'correo' => 'lucia.quispe@aurea.local',
            'rol' => 'cajero',
            'empresa_id' => $this->empresaId,
            'local_id' => $this->localId,
            'estado' => 'activo',
        ];

        Redis::setex("auth:session:{$tokenHash}", 3600, json_encode($sessionPayload));
        $this->tokenCajero = $rawToken;
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->tokenCajero,
            'Accept' => 'application/json',
        ];
    }

    private function asegurarCajaAbierta(): string
    {
        $caja = DB::table('caja')
            ->where('local_id', $this->localId)
            ->where('estado', 'abierta')
            ->first();

        if ($caja) {
            return $caja->id;
        }

        $id = (string) Str::uuid();
        DB::table('caja')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'cajero_id' => $this->cajeroId,
            'monto_apertura' => 250.00,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    public function test_cobrar_pedido_exitoso_y_emision_comprobante_sin_colisiones(): void
    {
        $this->asegurarCajaAbierta();

        // 1. Obtener o crear mesa activa para el cobro
        $mesa = DB::table('mesa')
            ->where('local_id', $this->localId)
            ->where('estado', 'activa')
            ->first();

        $this->assertNotNull($mesa, 'Debe existir una mesa activa.');

        // 2. Crear pedido con ítems pendientes de cobro
        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa->id,
            'mozo_id' => $this->cajeroId,
            'numero_comanda' => 999,
            'comensales' => 2,
            'estado' => 'cuenta_pedida',
            'tipo_comprobante_sugerido' => 'boleta',
            'medio_pago_sugerido' => 'efectivo',
            'nombre_cliente_sugerido' => 'CLIENTE DE PRUEBA',
            'documento_cliente_sugerido' => '12345678',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $producto = DB::table('producto')->where('local_id', $this->localId)->first();
        $this->assertNotNull($producto, 'Debe existir un producto.');

        $pedidoItemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $pedidoItemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $producto->id,
            'cantidad' => 2,
            'precio_unitario' => 35.00,
            'estado' => 'entregado',
            'estado_pago' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Mismo cálculo que fn_obtener_siguiente_correlativo: supera al acumulador y al máximo ya emitido
        $acumuladoSerie = (int) DB::table('comprobante_serie')
            ->where('local_id', $this->localId)
            ->where('tipo_comprobante', 'boleta')
            ->where('serie', 'B001')
            ->value('correlativo_actual');
        $maximoEmitido = (int) DB::table('comprobante')->where('local_id', $this->localId)->where('serie', 'B001')->max('correlativo');
        $correlativoEsperado = max($acumuladoSerie, $maximoEmitido) + 1;

        // 3. Ejecutar POST api/v1/caja/cobrar
        $response = $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', [
            'pedido_id' => $pedidoId,
            'tipo_comprobante' => 'boleta',
            'medio_pago' => 'efectivo',
            'monto_recibido' => 70.00,
            'nombre_cliente' => 'CLIENTE DE PRUEBA',
            'documento_cliente' => '12345678',
            'telefono_envio' => '+51988776655',
            'email_envio' => 'test@cliente.pe',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'exito' => true,
        ]);

        $datos = $response->json('datos');
        $this->assertNotEmpty($datos['serie_numero']);
        $this->assertNotEmpty($datos['token_digital']);
        $this->assertEquals(70.00, $datos['total_cobrado']);
        $this->assertEquals('CLIENTE DE PRUEBA', $datos['cliente_nombre']);
        $this->assertTrue($datos['pedido_cerrado']);
        $this->assertTrue($datos['mesa_liberada']);

        // 4. Verificar que se insertó en comprobante con estado 'emitido'
        $comprobanteDb = DB::table('comprobante')->where('id', $datos['comprobante_id'])->first();
        $this->assertNotNull($comprobanteDb);
        $this->assertEquals('emitido', $comprobanteDb->estado);
        $this->assertEquals('B001', $comprobanteDb->serie);
        $this->assertSame($correlativoEsperado, (int) $comprobanteDb->correlativo);

        // 5. Verificar que el token digital es consultable públicamente
        $publicResponse = $this->getJson('/api/v1/public/comprobantes/'.$datos['token_digital']);
        $publicResponse->assertStatus(200);
        $publicResponse->assertJson([
            'exito' => true,
            'datos' => [
                'token' => $datos['token_digital'],
                'serie_numero' => $datos['serie_numero'],
                'estado' => 'emitido',
            ],
        ]);
    }

    private function crearPedidoCobrable(): string
    {
        $this->asegurarCajaAbierta();

        $mesa = DB::table('mesa')->where('local_id', $this->localId)->where('estado', 'activa')->first();
        $producto = DB::table('producto')->where('local_id', $this->localId)->first();

        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa->id,
            'mozo_id' => $this->cajeroId,
            'numero_comanda' => 998,
            'comensales' => 1,
            'estado' => 'cuenta_pedida',
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
            'precio_unitario' => 20.00,
            'estado' => 'entregado',
            'estado_pago' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $pedidoId;
    }

    /**
     * @return array<string, mixed>
     */
    private function payloadCobro(string $pedidoId): array
    {
        return [
            'pedido_id' => $pedidoId,
            'tipo_comprobante' => 'boleta',
            'medio_pago' => 'efectivo',
            'monto_recibido' => 20.00,
            'nombre_cliente' => 'CLIENTE DE PRUEBA',
            'documento_cliente' => '12345678',
        ];
    }

    public function test_el_cobro_usa_la_serie_activa_de_la_sede(): void
    {
        $pedidoId = $this->crearPedidoCobrable();

        DB::table('comprobante_serie')
            ->where('local_id', $this->localId)
            ->where('tipo_comprobante', 'boleta')
            ->update(['serie' => 'B002']);

        $response = $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', $this->payloadCobro($pedidoId));

        $response->assertStatus(200);
        $this->assertSame(
            'B002',
            DB::table('comprobante')->where('id', $response->json('datos.comprobante_id'))->value('serie')
        );
    }

    public function test_el_cobro_falla_con_error_claro_si_la_sede_no_tiene_serie_activa(): void
    {
        $pedidoId = $this->crearPedidoCobrable();

        DB::table('comprobante_serie')
            ->where('local_id', $this->localId)
            ->where('tipo_comprobante', 'boleta')
            ->update(['activo' => false]);

        $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', $this->payloadCobro($pedidoId))
            ->assertStatus(409)
            ->assertJsonPath('errores.0.codigo', 'ERR_SERIE_NO_CONFIGURADA');
    }

    public function test_el_cobro_en_efectivo_registra_el_monto_recibido_y_el_vuelto(): void
    {
        $pedidoId = $this->crearPedidoCobrable();

        $response = $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', [
            ...$this->payloadCobro($pedidoId),
            'monto_recibido' => 50.00,
        ]);

        $response->assertStatus(200);
        $comprobante = DB::table('comprobante')->where('id', $response->json('datos.comprobante_id'))->first();
        $this->assertEquals(50.00, (float) $comprobante->monto_recibido);
        $this->assertEquals(30.00, (float) $comprobante->vuelto);
    }

    /**
     * Crea un pedido con una única subcuenta pendiente, tal como la deja dividirCuenta
     * (su total ya incluye el descuento y la comisión acordados en mesa).
     *
     * @return array{0: string, 1: string} [pedidoId, subcuentaId]
     */
    private function crearPedidoConSubcuenta(float $bruto, float $descuento, float $recargo, string $medioPago): array
    {
        $this->asegurarCajaAbierta();

        $mesa = DB::table('mesa')->where('local_id', $this->localId)->where('estado', 'activa')->first();
        $producto = DB::table('producto')->where('local_id', $this->localId)->first();

        $pedidoId = (string) Str::uuid();
        DB::table('pedido')->insert([
            'id' => $pedidoId,
            'local_id' => $this->localId,
            'mesa_id' => $mesa->id,
            'mozo_id' => $this->cajeroId,
            'numero_comanda' => 997,
            'comensales' => 2,
            'estado' => 'cuenta_pedida',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $pedidoItemId = (string) Str::uuid();
        DB::table('pedido_item')->insert([
            'id' => $pedidoItemId,
            'pedido_id' => $pedidoId,
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'precio_unitario' => $bruto,
            'estado' => 'entregado',
            'estado_pago' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $subcuentaId = (string) Str::uuid();
        DB::table('pedido_subcuenta')->insert([
            'id' => $subcuentaId,
            'pedido_id' => $pedidoId,
            'numero_subcuenta' => 1,
            'tipo_comprobante' => 'boleta',
            'documento_cliente' => '12345678',
            'nombre_cliente' => 'CLIENTE DE PRUEBA',
            'medio_pago' => $medioPago,
            'subtotal_bruto' => $bruto,
            'descuento' => $descuento,
            'monto_recargo' => $recargo,
            'total' => round($bruto - $descuento + $recargo, 2),
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('pedido_subcuenta_item')->insert([
            'id' => (string) Str::uuid(),
            'subcuenta_id' => $subcuentaId,
            'pedido_item_id' => $pedidoItemId,
            'cantidad' => 1,
            'precio_unitario' => $bruto,
            'subtotal' => $bruto,
            'created_at' => now(),
        ]);

        return [$pedidoId, $subcuentaId];
    }

    public function test_el_cobro_de_una_subcuenta_con_tarjeta_no_duplica_la_comision(): void
    {
        DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)->where('codigo', 'tarjeta')
            ->update(['activo' => true, 'comision_porcentaje' => 1.00]);

        // Consumo 19.00 + comisión 1% (0.19) = 19.19, como lo acordó el mozo al dividir la cuenta.
        [$pedidoId, $subcuentaId] = $this->crearPedidoConSubcuenta(19.00, 0.0, 0.19, 'tarjeta');

        $response = $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', [
            ...$this->payloadCobro($pedidoId),
            'subcuenta_id' => $subcuentaId,
            'medio_pago' => 'tarjeta',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(19.19, $response->json('datos.total_cobrado'));
        $this->assertEquals(19.00, $response->json('datos.subtotal_consumo'));
        $this->assertEquals(0.19, $response->json('datos.monto_recargo'));
    }

    public function test_el_cobro_de_una_subcuenta_con_descuento_cobra_el_total_acordado(): void
    {
        [$pedidoId, $subcuentaId] = $this->crearPedidoConSubcuenta(100.00, 10.00, 0.0, 'efectivo');

        $response = $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', [
            ...$this->payloadCobro($pedidoId),
            'subcuenta_id' => $subcuentaId,
            'monto_recibido' => 100.00,
        ]);

        $response->assertStatus(200);
        $this->assertEquals(90.00, $response->json('datos.total_cobrado'));
        $this->assertEquals(90.00, $response->json('datos.subtotal_consumo'));
    }

    public function test_el_cobro_rechaza_un_comprobante_con_total_menor_al_minimo(): void
    {
        $pedidoId = $this->crearPedidoCobrable();

        DB::table('pedido_item')->where('pedido_id', $pedidoId)->update(['precio_unitario' => 0.00]);

        $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', [
            ...$this->payloadCobro($pedidoId),
            'monto_recibido' => 0.00,
        ])
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'IMPORTE_MINIMO_NO_ALCANZADO');

        $this->assertEquals(0, DB::table('comprobante')->where('pedido_id', $pedidoId)->count());
    }

    public function test_el_cobro_en_efectivo_rechaza_un_monto_recibido_menor_al_total(): void
    {
        $pedidoId = $this->crearPedidoCobrable();

        $this->withHeaders($this->headers())->postJson('/api/v1/caja/cobrar', [
            ...$this->payloadCobro($pedidoId),
            'monto_recibido' => 10.00,
        ])
            ->assertStatus(422)
            ->assertJsonPath('errores.0.codigo', 'MONTO_RECIBIDO_INSUFICIENTE');
    }
}
