import type { PromocionSedeDTO } from '@/types/mozo';

const aCentimos = (valor: number): number => Math.round(valor * 100) / 100;

const esMontoFijo = (promo: PromocionSedeDTO): boolean => promo.tipo_descuento === 'monto_fijo';

const valorPromocion = (promo: PromocionSedeDTO): number =>
  Number(promo.valor ?? promo.porcentaje_descuento ?? 0) || 0;

/**
 * Descuento de una promoción sobre un consumo, con el mismo cálculo que el backend
 * (PromocionService::calcularDescuento): el porcentaje respeta el tope por cuenta y el monto fijo
 * nunca supera el consumo.
 */
export const calcularDescuentoPromocion = (
  promo: PromocionSedeDTO | null | undefined,
  consumo: number
): number => {
  if (!promo || consumo <= 0) return 0;

  const valor = valorPromocion(promo);
  if (esMontoFijo(promo)) return aCentimos(Math.min(valor, consumo));

  const descuento = aCentimos((consumo * valor) / 100);
  const tope = Number(promo.tope_maximo_descuento ?? 0) || 0;
  return tope > 0 ? Math.min(descuento, tope) : descuento;
};

/** Aviso cuando el consumo no alcanza el mínimo que exige la promoción, o null si lo cumple. */
export const avisoConsumoMinimo = (
  promo: PromocionSedeDTO | null | undefined,
  consumo: number
): string | null => {
  const minimo = Number(promo?.monto_minimo_consumo ?? 0) || 0;
  return minimo > 0 && consumo < minimo
    ? `Exige consumo mínimo de S/ ${minimo.toFixed(2)}`
    : null;
};

/** Etiqueta corta del beneficio: "15% OFF" o "- S/ 10.00". */
export const etiquetaPromocion = (promo: PromocionSedeDTO): string => {
  const valor = valorPromocion(promo);
  return esMontoFijo(promo) ? `- S/ ${valor.toFixed(2)}` : `${valor}% OFF`;
};
