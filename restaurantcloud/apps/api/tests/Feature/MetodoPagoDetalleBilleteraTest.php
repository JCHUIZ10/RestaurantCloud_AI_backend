<?php

namespace Tests\Feature;

use App\Domains\Caja\Services\MetodoPagoLocalService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MetodoPagoDetalleBilleteraTest extends TestCase
{
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
    }
}
