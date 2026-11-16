import { describe, expect, it } from 'vitest';
import type { PromocionSedeDTO } from '@/types/mozo';
import { avisoConsumoMinimo, calcularDescuentoPromocion, etiquetaPromocion } from './descuentoPromocion';

const promo = (overrides: Partial<PromocionSedeDTO>): PromocionSedeDTO => ({
  id: 'p1',
  nombre: 'Promo',
  descripcion: '',
  porcentaje_descuento: 0,
  ...overrides,
});

describe('calcularDescuentoPromocion', () => {
  it('aplica el porcentaje sobre el consumo', () => {
    expect(calcularDescuentoPromocion(promo({ tipo_descuento: 'porcentaje', valor: 15 }), 80)).toBe(12);
  });

  it('limita el porcentaje al tope máximo por cuenta', () => {
    const conTope = promo({ tipo_descuento: 'porcentaje', valor: 50, tope_maximo_descuento: 6 });
    expect(calcularDescuentoPromocion(conTope, 20)).toBe(6);
  });

  it('descuenta el monto fijo sin superar el consumo', () => {
    const fijo = promo({ tipo_descuento: 'monto_fijo', valor: 10, porcentaje_descuento: 0 });
    expect(calcularDescuentoPromocion(fijo, 25)).toBe(10);
    expect(calcularDescuentoPromocion(fijo, 7.5)).toBe(7.5);
  });

  it('usa porcentaje_descuento cuando la promoción no trae valor', () => {
    expect(calcularDescuentoPromocion(promo({ porcentaje_descuento: 10 }), 45)).toBe(4.5);
  });

  it('no descuenta sin promoción o sin consumo', () => {
    expect(calcularDescuentoPromocion(null, 50)).toBe(0);
    expect(calcularDescuentoPromocion(promo({ valor: 10 }), 0)).toBe(0);
  });
});

describe('avisoConsumoMinimo', () => {
  it('avisa solo cuando el consumo no alcanza el mínimo', () => {
    const conMinimo = promo({ monto_minimo_consumo: 60 });
    expect(avisoConsumoMinimo(conMinimo, 59.9)).toBe('Exige consumo mínimo de S/ 60.00');
    expect(avisoConsumoMinimo(conMinimo, 60)).toBeNull();
  });
});

describe('etiquetaPromocion', () => {
  it('muestra porcentaje o monto fijo según el tipo', () => {
    expect(etiquetaPromocion(promo({ tipo_descuento: 'porcentaje', valor: 20 }))).toBe('20% OFF');
    expect(etiquetaPromocion(promo({ tipo_descuento: 'monto_fijo', valor: 10 }))).toBe('- S/ 10.00');
  });
});
