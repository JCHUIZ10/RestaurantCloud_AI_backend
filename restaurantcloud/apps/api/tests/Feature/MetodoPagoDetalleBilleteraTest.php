<?php

namespace Tests\Feature;

use App\Domains\Caja\Services\MetodoPagoLocalService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MetodoPagoDetalleBilleteraTest extends TestCase
{
    private const QR_VALIDO = '00020101021126180014com.bcp.example5204000053036045802PE5909RESTAURANTE6004LIMA63047C44';

    private string $localId = '00000000-0000-4000-8000-000000000010';

    public function test_usa_los_datos_configurados_por_la_sede(): void
    {
        $detalle = app(MetodoPagoLocalService::class)->detalleBilletera($this->localId, [
            'telefono' => '987654321',
            'titular' => 'Titular Configurado',
            'ruc' => '20555555555',
        ], 45.5);

        $this->assertSame('987654321', $detalle['telefono']);
        $this->assertSame('Titular Configurado', $detalle['titular']);
        $this->assertSame('20555555555', $detalle['ruc']);
        $this->assertSame(45.5, $detalle['monto_exacto']);
    }

    public function test_titular_y_ruc_faltantes_salen_de_la_empresa_de_la_sede(): void
    {
        $empresa = DB::table('local as l')
            ->join('empresa as e', 'e.id', '=', 'l.empresa_id')
            ->where('l.id', $this->localId)
            ->select('e.razon_social', 'e.ruc')
            ->first();

        $detalle = app(MetodoPagoLocalService::class)->detalleBilletera($this->localId, ['telefono' => '987654321'], 10);

        $this->assertSame($empresa->razon_social, $detalle['titular']);
        $this->assertSame($empresa->ruc, $detalle['ruc']);
    }

    public function test_sin_telefono_configurado_no_inventa_uno(): void
    {
        $detalle = app(MetodoPagoLocalService::class)->detalleBilletera($this->localId, [], 10);

        $this->assertSame('', $detalle['telefono']);
        $this->assertSame('', $detalle['qr_payload']);
    }

    public function test_devuelve_el_qr_oficial_configurado(): void
    {
        $detalle = app(MetodoPagoLocalService::class)->detalleBilletera($this->localId, ['qr_payload' => self::QR_VALIDO], 10);

        $this->assertSame(self::QR_VALIDO, $detalle['qr_payload']);
    }

    public function test_activar_la_billetera_exige_un_qr_emvco_valido(): void
    {
        foreach (['', 'https://yape.pe/pago/987654321', substr(self::QR_VALIDO, 0, -4).'0000'] as $qrInvalido) {
            try {
                app(MetodoPagoLocalService::class)->actualizar($this->localId, $this->items(['qr_payload' => $qrInvalido]));
                $this->fail('Debio rechazar el QR: '.$qrInvalido);
            } catch (\LogicException $e) {
                $this->assertStringContainsString('QR oficial', $e->getMessage());
            }
        }
    }

    public function test_acepta_la_billetera_con_qr_valido_y_sin_celular(): void
    {
        DB::beginTransaction();
        try {
            $catalogo = app(MetodoPagoLocalService::class)->actualizar($this->localId, $this->items(['qr_payload' => self::QR_VALIDO]));
            $billetera = collect($catalogo['metodos'])->firstWhere('codigo', 'billetera_digital');

            $this->assertSame(self::QR_VALIDO, $billetera['datos_adicionales']['qr_payload']);
        } finally {
            DB::rollBack();
        }
    }

    public function test_guarda_el_recargo_de_billetera(): void
    {
        DB::beginTransaction();
        try {
            $items = $this->items(['qr_payload' => self::QR_VALIDO]);
            $items[2]['comision_porcentaje'] = 2.5;

            $catalogo = app(MetodoPagoLocalService::class)->actualizar($this->localId, $items);
            $porCodigo = collect($catalogo['metodos'])->keyBy('codigo');

            $this->assertEquals(2.5, $porCodigo['billetera_digital']['comision_porcentaje']);
            $this->assertEquals(0.0, $porCodigo['efectivo']['comision_porcentaje']);
        } finally {
            DB::rollBack();
        }
    }

    public function test_efectivo_sigue_sin_admitir_recargo(): void
    {
        $items = $this->items(['qr_payload' => self::QR_VALIDO]);
        $items[0]['comision_porcentaje'] = 5;

        $this->expectException(\DomainException::class);

        app(MetodoPagoLocalService::class)->actualizar($this->localId, $items);
    }

    public function test_el_porcentaje_de_recargo_solo_aplica_a_tarjeta_y_billetera(): void
    {
        $this->assertSame(3.0, MetodoPagoLocalService::porcentajeRecargo('tarjeta', '3.00'));
        $this->assertSame(2.0, MetodoPagoLocalService::porcentajeRecargo('billetera_digital', 2));
        $this->assertSame(0.0, MetodoPagoLocalService::porcentajeRecargo('efectivo', 9));
    }

    public function test_rechaza_un_celular_invalido_si_se_envia(): void
    {
        $this->expectException(\LogicException::class);

        app(MetodoPagoLocalService::class)->actualizar(
            $this->localId,
            $this->items(['qr_payload' => self::QR_VALIDO, 'telefono' => '12345'])
        );
    }

    /**
     * @param  array<string, string>  $datosBilletera
     * @return list<array<string, mixed>>
     */
    private function items(array $datosBilletera): array
    {
        return [
            ['codigo' => 'efectivo', 'activo' => true, 'comision_porcentaje' => 0],
            ['codigo' => 'tarjeta', 'activo' => true, 'comision_porcentaje' => 0],
            ['codigo' => 'billetera_digital', 'activo' => true, 'comision_porcentaje' => 0, 'datos_adicionales' => $datosBilletera],
        ];
    }
}
