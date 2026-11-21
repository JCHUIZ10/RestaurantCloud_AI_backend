<?php

namespace Tests\Unit;

use App\Domains\Pronostico\Services\ReposicionService;
use PHPUnit\Framework\TestCase;

/**
 * Fórmula de la reposición: consumo (P50 × receta) + margen (P90 − P50) − stock, sin tocar la base.
 */
class ReposicionCalculoTest extends TestCase
{
    private const CEVICHE = 'prod-ceviche';

    private const LOMO = 'prod-lomo';

    private const PESCADO = 'ins-pescado';

    /**
     * @return array<string, mixed>
     */
    private function plato(string $productoId, float $p50, float $p90, int $dias = 7): array
    {
        return [
            'producto_id' => $productoId,
            'dias' => array_map(fn (int $i): array => ['fecha' => "2026-11-2{$i}", 'p50' => $p50, 'p90' => $p90], range(1, $dias)),
        ];
    }

    public function test_suma_el_consumo_y_el_margen_de_la_cobertura_y_resta_el_stock(): void
    {
        $resultado = (new ReposicionService)->calcular(
            [$this->plato(self::CEVICHE, 10, 14)],
            [self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 0.2]]],
            [self::PESCADO => 5.0],
            3,
        );

        // 3 días × 10 platos × 0,2 kg = 6; margen 3 × 4 × 0,2 = 2,4; 6 + 2,4 − 5 = 3,4
        $this->assertSame(
            ['consumo_previsto' => 6.0, 'margen_seguridad' => 2.4, 'stock_al_calcular' => 5.0, 'cantidad_sugerida' => 3.4],
            $resultado[self::PESCADO],
        );
    }

    public function test_la_cobertura_recorta_los_dias_del_pronostico(): void
    {
        $calcular = fn (int $cobertura): float => (new ReposicionService)->calcular(
            [$this->plato(self::CEVICHE, 10, 14)],
            [self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 0.2]]],
            [self::PESCADO => 0.0],
            $cobertura,
        )[self::PESCADO]['cantidad_sugerida'];

        $this->assertSame(8.4, $calcular(3));
        $this->assertSame(14.0, $calcular(5));
        $this->assertSame(19.6, $calcular(7));
    }

    public function test_un_insumo_compartido_por_dos_platos_suma_sus_consumos(): void
    {
        $resultado = (new ReposicionService)->calcular(
            [$this->plato(self::CEVICHE, 10, 12), $this->plato(self::LOMO, 5, 5)],
            [
                self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 0.2]],
                self::LOMO => [['insumo_id' => self::PESCADO, 'cantidad' => 0.1]],
            ],
            [self::PESCADO => 0.0],
            7,
        )[self::PESCADO];

        // Ceviche: 70 × 0,2 = 14 y margen 14 × 0,2 = 2,8; lomo: 35 × 0,1 = 3,5 y sin margen
        $this->assertSame(17.5, $resultado['consumo_previsto']);
        $this->assertSame(2.8, $resultado['margen_seguridad']);
        $this->assertSame(20.3, $resultado['cantidad_sugerida']);
    }

    public function test_con_stock_de_sobra_la_cantidad_sugerida_es_cero_y_el_insumo_sigue_en_la_lista(): void
    {
        $resultado = (new ReposicionService)->calcular(
            [$this->plato(self::CEVICHE, 10, 14)],
            [self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 0.2]]],
            [self::PESCADO => 500.0],
            7,
        );

        $this->assertSame(0.0, $resultado[self::PESCADO]['cantidad_sugerida']);
        $this->assertSame(500.0, $resultado[self::PESCADO]['stock_al_calcular']);
    }

    public function test_un_p90_menor_que_el_p50_no_resta_al_margen(): void
    {
        $resultado = (new ReposicionService)->calcular(
            [$this->plato(self::CEVICHE, 10, 8)],
            [self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 1.0]]],
            [],
            1,
        );

        $this->assertSame(0.0, $resultado[self::PESCADO]['margen_seguridad']);
        $this->assertSame(10.0, $resultado[self::PESCADO]['cantidad_sugerida']);
    }

    public function test_platos_sin_receta_o_sin_demanda_no_generan_recomendaciones(): void
    {
        $resultado = (new ReposicionService)->calcular(
            [$this->plato(self::CEVICHE, 0, 0), $this->plato(self::LOMO, 9, 9)],
            [self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 0.2]]],
            [self::PESCADO => 1.0],
            7,
        );

        $this->assertSame([], $resultado);
    }
}
