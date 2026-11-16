<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class MozoDividirCuentaPromocionTest extends TestCase
{
    private string $localId = '00000000-0000-4000-8000-000000000010';

    private string $tokenMozo;

    protected function setUp(): void
    {
        parent::setUp();

        $rawToken = 'test_token_mozo_promo_'.Str::random(32);

        Redis::setex('auth:session:'.hash('sha256', $rawToken), 3600, json_encode([
            'id' => '00000000-0000-4000-8000-000000000102',
            'nombre' => 'Mozo Test Promociones',
            'correo' => 'mozo_promociones@aurea.local',
            'rol' => 'mozo',
            'empresa_id' => '00000000-0000-4000-8000-000000000001',
            'local_id' => $this->localId,
            'estado' => 'activo',
        ]));

        $this->tokenMozo = $rawToken;
    }

    /**
     * @param  array<string, mixed>  $atributos
     */
    private function crearPromocion(array $atributos = []): string
    {
        $id = (string) Str::uuid();
        $hoy = now('America/Lima');

        DB::table('promocion')->insert([
            'id' => $id,
            'local_id' => $this->localId,
            'codigo' => 'PROMO-T-'.Str::upper(Str::random(8)),
            'nombre' => 'Promo Division '.Str::random(6),
            'tipo_descuento' => 'porcentaje',
            'valor' => 50,
            'tope_maximo_descuento' => 6.00,
            'fecha_inicio' => $hoy->copy()->subDay()->toDateString(),
            'fecha_fin' => $hoy->copy()->addDays(30)->toDateString(),
            'activa' => true,
            'tipo_limite_usos' => 'sin_limite',
            'created_at' => now(),
            'updated_at' => now(),
            ...$atributos,
        ]);

        return $id;
    }

    /**
     * @return array<string, mixed>
     */
    private function subcuenta(int $numero, float $bruto, ?string $promocionId, float $descuento): array
    {
        $total = round($bruto - $descuento, 2);

        return [
            'numero_subcuenta' => $numero,
            'tipo_comprobante' => 'boleta',
            'documento_cliente' => '00000000',
            'nombre_cliente' => 'CONSUMIDOR FINAL',
            'medio_pago' => 'efectivo',
            'promocion_id' => $promocionId,
            'subtotal_bruto' => $bruto,
            'descuento' => $descuento,
            'monto_recargo' => 0.0,
            'total_neto' => $total,
            'items' => [[
                'pedido_item_id' => (string) Str::uuid(),
                'cantidad' => 1,
                'precio_unitario' => $bruto,
                'subtotal' => $bruto,
            ]],
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

    public function test_acepta_el_descuento_calculado_con_el_tope_de_la_promocion(): void
    {
        $promocionId = $this->crearPromocion();

        // 50% de 20.00 con tope de 6.00. La validación pasa; la mesa de prueba no existe (404).
        $this->dividir([$this->subcuenta(1, 20.00, $promocionId, 6.00)])->assertStatus(404);
    }

    public function test_rechaza_un_descuento_que_ignora_el_tope_de_la_promocion(): void
    {
        $promocionId = $this->crearPromocion();

        $this->dividir([$this->subcuenta(1, 20.00, $promocionId, 10.00)])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.0.descuento']);
    }

    public function test_rechaza_un_descuento_sin_promocion(): void
    {
        $this->dividir([$this->subcuenta(1, 20.00, null, 5.00)])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.0.descuento']);
    }

    public function test_rechaza_la_promocion_si_la_subcuenta_no_alcanza_el_consumo_minimo(): void
    {
        $promocionId = $this->crearPromocion(['monto_minimo_consumo' => 50.00]);

        $this->dividir([$this->subcuenta(1, 20.00, $promocionId, 6.00)])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas.0.promocion_id']);
    }

    public function test_rechaza_repartir_la_promocion_en_mas_subcuentas_que_usos_disponibles(): void
    {
        $promocionId = $this->crearPromocion([
            'tipo_limite_usos' => 'global',
            'limite_usos' => 2,
            'usos_actuales' => 1,
        ]);

        $this->dividir([
            $this->subcuenta(1, 20.00, $promocionId, 6.00),
            $this->subcuenta(2, 20.00, $promocionId, 6.00),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['subcuentas']);
    }
}
