import { SubcuentaConfigDTO, PromocionSedeDTO } from '@/types/mozo';
import { DIVISOR_IGV, MONTO_MINIMO_COMPROBANTE } from '@/shared/constants/tributario';

/** Monto mínimo (S/) que debe pagar una subcuenta. */
export const MONTO_MINIMO_SUBCUENTA = MONTO_MINIMO_COMPROBANTE;

const aCentimos = (valor: number): number => Math.round(valor * 100) / 100;

/**
 * Recalcula bruto, descuento, comisión de tarjeta, total y desglose SUNAT (base + IGV)
 * de una subcuenta a partir de sus ítems, su promoción y su medio de pago.
 */
export const calcularMontosSubcuenta = (
  sub: SubcuentaConfigDTO,
  promociones: PromocionSedeDTO[],
  comisionTarjetaPct: number
): SubcuentaConfigDTO => {
  const bruto = sub.items.reduce((acc, it) => acc + it.subtotal, 0);

  let descuento = 0;
  if (sub.promocion_id) {
    const promo = promociones.find((p) => p.id === sub.promocion_id);
    if (promo) {
      descuento = aCentimos((bruto * promo.porcentaje_descuento) / 100);
    }
  }

  const subtotalConDescuento = Math.max(0, bruto - descuento);
  const recargo =
    sub.medio_pago === 'tarjeta'
      ? aCentimos(subtotalConDescuento * (comisionTarjetaPct / 100))
      : 0;

  const totalNeto = aCentimos(subtotalConDescuento + recargo);
  // Mismo criterio que el cobro en caja: la comisión forma parte del importe gravado.
  const baseImponible = aCentimos(totalNeto / DIVISOR_IGV);

  return {
    ...sub,
    subtotal_bruto: bruto,
    descuento,
    monto_recargo: recargo,
    total_neto: totalNeto,
    base_imponible: baseImponible,
    igv: aCentimos(totalNeto - baseImponible),
  };
};

/** Una subcuenta con platos pero sin importe a pagar no puede generar comprobante. */
export const subcuentaSinImporte = (sub: SubcuentaConfigDTO): boolean =>
  sub.items.length > 0 && sub.total_neto < MONTO_MINIMO_SUBCUENTA;
