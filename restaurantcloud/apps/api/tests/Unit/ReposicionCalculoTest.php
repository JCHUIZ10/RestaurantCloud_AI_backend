<?php

namespace Tests\Unit;

use App\Domains\Pronostico\Services\ReposicionService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Fórmula de la reposición, sin tocar la base: consumo (P50 × receta) + reserva − stock, la reserva mínima
 * de los días sin modelo, las prioridades y los insumos por debajo de su mínimo.
 */
class ReposicionCalculoTest extends TestCase
{
    private const CEVICHE = 'prod-ceviche';

    private const LOMO = 'prod-lomo';

    private const PESCADO = 'ins-pescado';

    private const BEBIDA = 'ins-bebida';

    /**
     * @return array<string, mixed>
     */
    private function plato(string $productoId, float $p50, float $p90, int $dias = 7, string $metodo = 'modelo'): array
    {
        return [
            'producto_id' => $productoId,
            'dias' => array_map(fn (int $i): array => ['fecha' => "2026-11-2{$i}", 'p50' => $p50, 'p90' => $p90, 'metodo' => $metodo], range(1, $dias)),
        ];
    }

    /**
     * @return array<string, array{stock: float, minimo: float, unidad: string}>
     */
    private function insumo(float $stock, float $minimo = 0.0, string $unidad = 'kg', string $id = self::PESCADO): array
    {
        return [$id => ['stock' => $stock, 'minimo' => $minimo, 'unidad' => $unidad]];
    }

    /**
     * @return array<string, list<array{insumo_id: string, cantidad: float}>>
     */
    private function receta(float $cantidad, string $producto = self::CEVICHE, string $insumo = self::PESCADO): array
    {
        return [$producto => [['insumo_id' => $insumo, 'cantidad' => $cantidad]]];
    }

    private function calcular(array $predicciones, array $recetas, array $insumos, int $cobertura = 7, float $reservaMinima = 0.0): array
    {
        return (new ReposicionService)->calcular($predicciones, $recetas, $insumos, $cobertura, $reservaMinima);
    }

    public function test_suma_el_consumo_y_el_margen_de_la_cobertura_y_resta_el_stock(): void
    {
        $resultado = $this->calcular([$this->plato(self::CEVICHE, 10, 14)], $this->receta(0.2), $this->insumo(5.0), 3);

        // 3 días × 10 platos × 0,2 kg = 6; margen 3 × 4 × 0,2 = 2,4; 6 + 2,4 − 5 = 3,4
        $this->assertEquals([
            'consumo_previsto' => 6.0, 'margen_seguridad' => 2.4, 'stock_al_calcular' => 5.0, 'stock_minimo_al_calcular' => 0.0,
            'cantidad_sugerida' => 3.4, 'alcanza_dias' => 2, 'prioridad' => 'pronto', 'motivo' => 'consumo',
        ], $resultado[self::PESCADO]);
    }

    public function test_la_cobertura_recorta_los_dias_del_pronostico(): void
    {
        $sugerida = fn (int $cobertura): float => $this->calcular(
            [$this->plato(self::CEVICHE, 10, 14)], $this->receta(0.2), $this->insumo(0.0), $cobertura,
        )[self::PESCADO]['cantidad_sugerida'];

        $this->assertSame(8.4, $sugerida(3));
        $this->assertSame(14.0, $sugerida(5));
        $this->assertSame(19.6, $sugerida(7));
    }

    public function test_un_insumo_compartido_por_dos_platos_suma_sus_consumos(): void
    {
        $recetas = [
            self::CEVICHE => [['insumo_id' => self::PESCADO, 'cantidad' => 0.2]],
            self::LOMO => [['insumo_id' => self::PESCADO, 'cantidad' => 0.1]],
        ];

        $resultado = $this->calcular(
            [$this->plato(self::CEVICHE, 10, 12), $this->plato(self::LOMO, 5, 5)], $recetas, $this->insumo(0.0),
        )[self::PESCADO];

        // Ceviche: 70 × 0,2 = 14 y reserva 14 × 0,2 = 2,8; lomo: 35 × 0,1 = 3,5 y sin reserva
        $this->assertSame(17.5, $resultado['consumo_previsto']);
        $this->assertSame(2.8, $resultado['margen_seguridad']);
        $this->assertSame(20.3, $resultado['cantidad_sugerida']);
    }

    public function test_con_stock_de_sobra_no_hay_que_comprar_y_el_insumo_sigue_en_la_lista(): void
    {
        $resultado = $this->calcular([$this->plato(self::CEVICHE, 10, 14)], $this->receta(0.2), $this->insumo(500.0))[self::PESCADO];

        $this->assertSame(0.0, $resultado['cantidad_sugerida']);
        $this->assertSame(500.0, $resultado['stock_al_calcular']);
        $this->assertSame([7, 'cubierto'], [$resultado['alcanza_dias'], $resultado['prioridad']]);
    }

    public function test_un_p90_menor_que_el_p50_no_resta_a_la_reserva(): void
    {
        $resultado = $this->calcular([$this->plato(self::CEVICHE, 10, 8)], $this->receta(1.0), $this->insumo(0.0), 1)[self::PESCADO];

        $this->assertSame(0.0, $resultado['margen_seguridad']);
        $this->assertSame(10.0, $resultado['cantidad_sugerida']);
    }

    public function test_platos_sin_receta_o_sin_demanda_no_generan_recomendaciones(): void
    {
        $resultado = $this->calcular(
            [$this->plato(self::CEVICHE, 0, 0), $this->plato(self::LOMO, 9, 9)], $this->receta(0.2), $this->insumo(1.0),
        );

        $this->assertSame([], $resultado);
    }

    public function test_los_insumos_que_no_son_de_la_sede_activa_se_ignoran(): void
    {
        $this->assertSame([], $this->calcular([$this->plato(self::CEVICHE, 10, 14)], $this->receta(0.2), []));
    }

    // --- Reserva mínima (N-2) ---

    public function test_en_dias_baseline_la_reserva_no_baja_de_la_minima(): void
    {
        $resultado = $this->calcular(
            [$this->plato(self::CEVICHE, 10, 10, 7, 'baseline')], $this->receta(1.0), $this->insumo(0.0), 3, 0.35,
        )[self::PESCADO];

        // 3 días × 10 = 30 de consumo y una reserva de 35 % de lo más probable: 10,5
        $this->assertSame(30.0, $resultado['consumo_previsto']);
        $this->assertSame(10.5, $resultado['margen_seguridad']);
        $this->assertSame(40.5, $resultado['cantidad_sugerida']);
    }

    public function test_en_dias_con_modelo_la_reserva_minima_no_se_aplica(): void
    {
        $resultado = $this->calcular(
            [$this->plato(self::CEVICHE, 10, 10, 7, 'modelo')], $this->receta(1.0), $this->insumo(0.0), 3, 0.35,
        )[self::PESCADO];

        $this->assertSame(0.0, $resultado['margen_seguridad']);
    }

    public function test_si_el_p90_del_baseline_ya_supera_la_minima_se_conserva(): void
    {
        $resultado = $this->calcular(
            [$this->plato(self::CEVICHE, 10, 20, 7, 'baseline')], $this->receta(1.0), $this->insumo(0.0), 3, 0.35,
        )[self::PESCADO];

        $this->assertSame(30.0, $resultado['margen_seguridad']);
    }

    // --- Prioridades y días que alcanza ---

    /**
     * @return array<string, array{float, float, int, int|null, string}>
     */
    public static function prioridades(): array
    {
        // Consumo de 10 por día durante 7 días.        stock, mínimo, cobertura, alcanza, prioridad
        return [
            'no alcanza ni para el primer día' => [5.0, 0.0, 5, 0, 'urgente'],
            'por debajo del mínimo aunque alcance' => [100.0, 150.0, 5, 7, 'urgente'],
            'alcanza menos días que la cobertura' => [25.0, 0.0, 5, 2, 'pronto'],
            'alcanza justo la cobertura' => [50.0, 0.0, 5, 5, 'cubierto'],
            'alcanza toda la semana' => [100.0, 0.0, 5, 7, 'cubierto'],
        ];
    }

    #[DataProvider('prioridades')]
    public function test_prioridad_y_dias_que_alcanza(float $stock, float $minimo, int $cobertura, int $alcanza, string $prioridad): void
    {
        $resultado = $this->calcular(
            [$this->plato(self::CEVICHE, 10, 10)], $this->receta(1.0), $this->insumo($stock, $minimo), $cobertura,
        )[self::PESCADO];

        $this->assertSame([$alcanza, $prioridad], [$resultado['alcanza_dias'], $resultado['prioridad']]);
    }

    // --- Insumos bajo su mínimo (N-4) ---

    public function test_un_insumo_bajo_su_minimo_entra_aunque_ninguna_receta_lo_use(): void
    {
        $insumos = $this->insumo(2.0, 5.0) + $this->insumo(10.0, 5.0, 'kg', 'ins-suficiente');

        $resultado = $this->calcular([], [], $insumos);

        $this->assertSame([self::PESCADO], array_keys($resultado));
        $this->assertEquals([
            'consumo_previsto' => 0.0, 'margen_seguridad' => 0.0, 'stock_al_calcular' => 2.0, 'stock_minimo_al_calcular' => 5.0,
            'cantidad_sugerida' => 3.0, 'alcanza_dias' => null, 'prioridad' => 'urgente', 'motivo' => 'bajo_minimo',
        ], $resultado[self::PESCADO]);
    }

    public function test_un_insumo_con_consumo_no_se_duplica_como_bajo_minimo(): void
    {
        $resultado = $this->calcular([$this->plato(self::CEVICHE, 10, 10)], $this->receta(1.0), $this->insumo(2.0, 5.0));

        $this->assertSame('consumo', $resultado[self::PESCADO]['motivo']);
        $this->assertSame('urgente', $resultado[self::PESCADO]['prioridad']);
    }

    // --- Redondeo ---

    public function test_las_unidades_contables_se_compran_enteras_hacia_arriba(): void
    {
        $recetas = $this->receta(0.34, self::CEVICHE, self::BEBIDA);

        $resultado = $this->calcular([$this->plato(self::CEVICHE, 30, 30)], $recetas, $this->insumo(0.0, 0.0, 'botella', self::BEBIDA), 1);

        // 30 × 0,34 = 10,2 + reserva 0 → 11 botellas
        $this->assertSame(11.0, $resultado[self::BEBIDA]['cantidad_sugerida']);
    }

    public function test_los_kilos_se_redondean_a_un_decimal_hacia_arriba_sin_errores_de_coma_flotante(): void
    {
        $arriba = $this->calcular([$this->plato(self::CEVICHE, 34.1, 34.1)], $this->receta(0.1), $this->insumo(0.0), 1);
        $exacto = $this->calcular([$this->plato(self::CEVICHE, 34, 34)], $this->receta(0.1), $this->insumo(0.0), 1);

        $this->assertSame(3.5, $arriba[self::PESCADO]['cantidad_sugerida']);   // 3,41 sube a 3,5
        $this->assertSame(3.4, $exacto[self::PESCADO]['cantidad_sugerida']);   // 3,4 (3,4000000000000004) no sube a 3,5
    }
}
