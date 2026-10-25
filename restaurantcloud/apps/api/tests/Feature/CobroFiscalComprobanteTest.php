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

        $rawToken = 'test_token_cobro_fiscal_' . Str::random(32);
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
            'Authorization' => 'Bearer ' . $this->tokenCajero,
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
        $this->assertGreaterThan(37922, $comprobanteDb->correlativo);

        // 5. Verificar que el token digital es consultable públicamente
        $publicResponse = $this->getJson('/api/v1/public/comprobantes/' . $datos['token_digital']);
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
}
