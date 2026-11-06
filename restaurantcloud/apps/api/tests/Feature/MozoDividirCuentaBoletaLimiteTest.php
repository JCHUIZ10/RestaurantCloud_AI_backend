<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoDividirCuentaBoletaLimiteTest extends TestCase
{
    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_mozo_'.Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $rawToken), 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000102',
            'nombre' => 'Mozo Test Limite Boleta',
            'correo' => 'mozo_limite@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => '00000000-0000-4000-8000-000000000001',
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        $this->tokenMozo = $rawToken;
    }

    /**
     * @return array<string, mixed>
     */
    private function subcuenta(
        int $numero,
        float $total,
        string $documento,
        string $nombre,
        string $medioPago = 'efectivo',
        float $recargo = 0.0,
    ): array {
        $subcuenta = [
            'numero_subcuenta' => $numero,
            'tipo_comprobante' => 'boleta',
            'documento_cliente' => $documento,
            'nombre_cliente' => $nombre,
            'medio_pago' => $medioPago,
            'subtotal_bruto' => round($total - $recargo, 2),
            'monto_recargo' => $recargo,
            'total_neto' => $total,
            'items' => [[
                'pedido_item_id' => (string) Str::uuid(),
                'cantidad' => 1,
                'precio_unitario' => $total,
                'subtotal' => $total,
            ]],
        ];

        // Yape/Plin viaja con el N° de operación y la verificación del pago
        if ($medioPago === 'billetera_digital') {
            $subcuenta['numero_operacion'] = 'YAPE'.str_pad((string) $numero, 6, '0', STR_PAD_LEFT);
            $subcuenta['pago_verificado'] = true;
        }

        return $subcuenta;
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

    public function test_rechaza_boleta_consumidor_final_desde_700(): void
    {
        $this->dividir([
            $this->subcuenta(1, 700.00, '00000000', 'CONSUMIDOR FINAL'),
            $this->subcuenta(2, 50.00, '00000000', 'CONSUMIDOR FINAL'),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.0.documento_cliente'])
            ->assertJsonMissingValidationErrors(['subcuentas.1.documento_cliente']);
    }

    public function test_rechaza_boleta_desde_700_sin_documento(): void
    {
        $this->dividir([
            $this->subcuenta(1, 900.00, '', 'Cliente'),
            $this->subcuenta(2, 50.00, '00000000', 'CONSUMIDOR FINAL'),
        ])->assertJsonValidationErrors(['subcuentas.0.documento_cliente']);
    }

    public function test_acepta_boleta_desde_700_con_dni_y_consumidor_final_bajo_limite(): void
    {
        // La validación pasa; la mesa de prueba no existe, así que responde 404 y no 422.
        $this->dividir([
            $this->subcuenta(1, 900.00, '45678912', 'Juan Perez'),
            $this->subcuenta(2, 699.99, '00000000', 'CONSUMIDOR FINAL'),
        ])->assertStatus(404);
    }

    public function test_rechaza_medio_pago_no_habilitado_en_la_sede(): void
    {
        DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)
            ->where('codigo', 'billetera_digital')
            ->update(['activo' => false]);

        $this->dividir([
            $this->subcuenta(1, 30.00, '00000000', 'CONSUMIDOR FINAL'),
            $this->subcuenta(2, 15.00, '00000000', 'CONSUMIDOR FINAL', 'billetera_digital'),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.1.medio_pago'])
            ->assertJsonMissingValidationErrors(['subcuentas.0.medio_pago']);
    }

    public function test_acepta_medio_pago_habilitado_en_la_sede(): void
    {
        DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)
            ->where('codigo', 'billetera_digital')
            ->update(['activo' => true]);

        // La validación pasa; la mesa de prueba no existe, así que responde 404 y no 422.
        $this->dividir([
            $this->subcuenta(1, 30.00, '00000000', 'CONSUMIDOR FINAL'),
            $this->subcuenta(2, 15.00, '00000000', 'CONSUMIDOR FINAL', 'billetera_digital'),
        ])->assertStatus(404);
    }

    private function habilitarBilletera(): void
    {
        DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)
            ->where('codigo', 'billetera_digital')
            ->update(['activo' => true]);
    }

    public function test_rechaza_una_subcuenta_yape_sin_numero_de_operacion(): void
    {
        $this->habilitarBilletera();
        $yape = $this->subcuenta(2, 15.00, '00000000', 'CONSUMIDOR FINAL', 'billetera_digital');
        unset($yape['numero_operacion']);

        $this->dividir([$this->subcuenta(1, 30.00, '00000000', 'CONSUMIDOR FINAL'), $yape])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.1.numero_operacion'])
            ->assertJsonMissingValidationErrors(['subcuentas.0.numero_operacion']);
    }

    public function test_rechaza_una_subcuenta_yape_sin_verificar_el_pago(): void
    {
        $this->habilitarBilletera();
        $yape = $this->subcuenta(2, 15.00, '00000000', 'CONSUMIDOR FINAL', 'billetera_digital');
        $yape['pago_verificado'] = false;

        $this->dividir([$this->subcuenta(1, 30.00, '00000000', 'CONSUMIDOR FINAL'), $yape])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.1.pago_verificado']);
    }

    public function test_rechaza_numeros_de_operacion_repetidos_entre_subcuentas(): void
    {
        $this->habilitarBilletera();
        $primera = $this->subcuenta(1, 30.00, '00000000', 'CONSUMIDOR FINAL', 'billetera_digital');
        $segunda = $this->subcuenta(2, 15.00, '00000000', 'CONSUMIDOR FINAL', 'billetera_digital');
        $segunda['numero_operacion'] = ' '.strtolower($primera['numero_operacion']).' ';

        $this->dividir([$primera, $segunda])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.1.numero_operacion'])
            ->assertJsonMissingValidationErrors(['subcuentas.0.numero_operacion']);
    }

    public function test_acepta_recargo_de_tarjeta_igual_a_la_comision_de_la_sede(): void
    {
        $comision = (float) DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)->where('codigo', 'tarjeta')->value('comision_porcentaje');
        $recargo = round(100 * ($comision / 100), 2);

        // La validación pasa; la mesa de prueba no existe, así que responde 404 y no 422.
        $this->dividir([
            $this->subcuenta(1, 100 + $recargo, '00000000', 'CONSUMIDOR FINAL', 'tarjeta', $recargo),
            $this->subcuenta(2, 20.00, '00000000', 'CONSUMIDOR FINAL'),
        ])->assertStatus(404);
    }

    public function test_rechaza_recargo_de_tarjeta_distinto_a_la_comision_de_la_sede(): void
    {
        DB::table('metodo_pago_local')
            ->where('local_id', $this->localId)->where('codigo', 'tarjeta')
            ->update(['comision_porcentaje' => 3.5]);

        $this->dividir([
            $this->subcuenta(1, 100.00, '00000000', 'CONSUMIDOR FINAL', 'tarjeta', 0.0),
            $this->subcuenta(2, 20.00, '00000000', 'CONSUMIDOR FINAL'),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.0.monto_recargo'])
            ->assertJsonMissingValidationErrors(['subcuentas.1.monto_recargo']);
    }

    public function test_rechaza_recargo_en_un_medio_de_pago_sin_comision(): void
    {
        $this->dividir([
            $this->subcuenta(1, 103.50, '00000000', 'CONSUMIDOR FINAL', 'efectivo', 3.50),
            $this->subcuenta(2, 20.00, '00000000', 'CONSUMIDOR FINAL'),
        ])->assertJsonValidationErrors(['subcuentas.0.monto_recargo']);
    }

    public function test_rechaza_total_que_no_coincide_con_subtotal_y_recargo(): void
    {
        $subcuenta = $this->subcuenta(1, 50.00, '00000000', 'CONSUMIDOR FINAL');
        $subcuenta['total_neto'] = 5.00;

        $this->dividir([$subcuenta, $this->subcuenta(2, 20.00, '00000000', 'CONSUMIDOR FINAL')])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.0.total_neto']);
    }
}
