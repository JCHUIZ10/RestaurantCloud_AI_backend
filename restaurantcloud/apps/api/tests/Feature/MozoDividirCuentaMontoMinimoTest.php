<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoDividirCuentaMontoMinimoTest extends TestCase
{
    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_mozo_'.Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $rawToken), 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000102',
            'nombre' => 'Mozo Test Monto Minimo',
            'correo' => 'mozo_monto_minimo@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => '00000000-0000-4000-8000-000000000001',
            'local_id' => '00000000-0000-4000-8000-000000000010',
            'estado' => 'activo',
        ]));

        $this->tokenMozo = $rawToken;
    }

    /**
     * @param  array<int, float>  $preciosItems
     * @return array<string, mixed>
     */
    private function subcuenta(int $numero, array $preciosItems): array
    {
        $total = round(array_sum($preciosItems), 2);

        return [
            'numero_subcuenta' => $numero,
            'tipo_comprobante' => 'boleta',
            'documento_cliente' => '00000000',
            'nombre_cliente' => 'CONSUMIDOR FINAL',
            'medio_pago' => 'efectivo',
            'subtotal_bruto' => $total,
            'monto_recargo' => 0.0,
            'total_neto' => $total,
            'items' => array_map(fn (float $precio): array => [
                'pedido_item_id' => (string) Str::uuid(),
                'cantidad' => 1,
                'precio_unitario' => $precio,
                'subtotal' => $precio,
            ], $preciosItems),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $subcuentas
     */
    private function dividir(array $subcuentas)
    {
        return $this->postJson(
            '/api/v1/mozo/mesas/'.Str::uuid().'/dividir-cuenta',
            ['pedido_id' => (string) Str::uuid(), 'subcuentas' => $subcuentas],
            ['Authorization' => 'Bearer '.$this->tokenMozo]
        );
    }

    public function test_rechaza_subcuenta_compuesta_solo_por_items_de_cero_soles(): void
    {
        $respuesta = $this->dividir([
            $this->subcuenta(1, [19.00]),
            $this->subcuenta(2, [0.0]),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.1.subtotal_bruto', 'subcuentas.1.total_neto'])
            ->assertJsonMissingValidationErrors(['subcuentas.0.subtotal_bruto']);

        $this->assertSame(
            'Cada subcuenta debe incluir al menos un producto con precio; los productos de S/ 0.00 deben acompañar a otro.',
            $respuesta->json('errors')['subcuentas.1.subtotal_bruto'][0]
        );
    }

    public function test_acepta_item_de_cero_soles_junto_a_un_item_con_precio(): void
    {
        // La validación pasa; la mesa de prueba no existe, así que responde 404 y no 422.
        $this->dividir([
            $this->subcuenta(1, [19.00, 0.0]),
            $this->subcuenta(2, [9.00]),
        ])->assertStatus(404);
    }

    public function test_rechaza_total_menor_al_minimo_de_diez_centimos(): void
    {
        $respuesta = $this->dividir([
            $this->subcuenta(1, [19.00]),
            $this->subcuenta(2, [0.05]),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.1.total_neto']);

        $this->assertSame(
            'El total a pagar de cada subcuenta debe ser como mínimo S/ 0.10.',
            $respuesta->json('errors')['subcuentas.1.total_neto'][0]
        );
    }
}
