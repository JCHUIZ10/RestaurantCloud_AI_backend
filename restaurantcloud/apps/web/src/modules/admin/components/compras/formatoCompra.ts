import { TipoComprobanteCompra, MetodoPagoCompra } from '@/types/admin';

export const soles = (n: number) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatoFecha = (fechaStr: string) => {
  const f = new Date(fechaStr + 'T12:00:00Z');
  if (isNaN(f.getTime())) return fechaStr;
  return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const TIPOS_COMPROBANTE: Record<TipoComprobanteCompra, { label: string; clase: string }> = {
  FACTURA: { label: 'Factura', clase: 'bg-aurea-navy text-white border-aurea-navy' },
  BOLETA: { label: 'Boleta', clase: 'bg-aurea-navy/5 text-aurea-navy border-aurea-navy/20' },
  NOTA_VENTA: { label: 'Nota de venta', clase: 'bg-aurea-champagne/30 text-aurea-navy border-aurea-copper/40' },
  GUIA_REMISION: { label: 'Guía de remisión', clase: 'bg-estado-info-50 text-estado-info-700 border-estado-info-200' },
  RECIBO: { label: 'Recibo', clase: 'bg-tinta-100 text-tinta-600 border-tinta-200' },
};

export const METODOS_PAGO: Record<MetodoPagoCompra, { label: string; clase: string }> = {
  TRANSFERENCIA: { label: 'Transferencia', clase: 'bg-estado-info-50 text-estado-info-700 border-estado-info-200' },
  YAPE_PLIN: { label: 'Yape / Plin', clase: 'bg-aurea-champagne/30 text-aurea-navy border-aurea-copper/40' },
  EFECTIVO: { label: 'Efectivo', clase: 'bg-estado-ok-50 text-estado-ok-700 border-estado-ok-200' },
  CREDITO_30D: { label: 'Crédito 30 días', clase: 'bg-estado-alerta-50 text-estado-alerta-800 border-estado-alerta-200' },
};

/**
 * Determina si el comprobante tiene serie/número físico visible.
 * NOTA_VENTA y RECIBO son comprobantes sin enumeración/serie formal (S/N).
 */
export const esComprobanteEnumerado = (ficha: {
  numero_comprobante?: string;
  tipo_comprobante?: TipoComprobanteCompra;
}): boolean => {
  if (ficha.tipo_comprobante === 'NOTA_VENTA' || ficha.tipo_comprobante === 'RECIBO') {
    return false;
  }
  const num = ficha.numero_comprobante?.trim().toUpperCase();
  return Boolean(num && num !== 'S/N' && num !== 'SIN NUMERO' && num !== 'SIN NÚMERO');
};

/**
 * Retorna el identificador legible para títulos, modales y etiquetas accesibles.
 * Si es enumerado: ej. "F001-12356566"
 * Si no es enumerado: ej. "Nota de venta" o "Recibo"
 */
export const identificadorComprobante = (ficha: {
  numero_comprobante?: string;
  tipo_comprobante?: TipoComprobanteCompra;
}): string => {
  if (esComprobanteEnumerado(ficha) && ficha.numero_comprobante) {
    return ficha.numero_comprobante;
  }
  return (ficha.tipo_comprobante && TIPOS_COMPROBANTE[ficha.tipo_comprobante]?.label) ?? 'Comprobante';
};

