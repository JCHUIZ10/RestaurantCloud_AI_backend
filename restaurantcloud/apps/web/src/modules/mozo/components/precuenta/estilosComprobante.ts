import {
  Banknote,
  Building2,
  CreditCard,
  NotebookPen,
  Receipt,
  Smartphone,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TipoComprobanteVista = 'boleta' | 'factura' | 'nota_venta';

export interface EstiloComprobante {
  etiqueta: string;
  icono: LucideIcon;
  /** Franja superior de la tarjeta. */
  franja: string;
  /** Insignia con texto (el tipo nunca se comunica solo por color). */
  insignia: string;
  /** Punto de color de las pestañas. */
  acento: string;
}

export const ESTILOS_COMPROBANTE: Record<TipoComprobanteVista, EstiloComprobante> = {
  boleta: {
    etiqueta: 'Boleta',
    icono: Receipt,
    franja: 'bg-[#D5A06F]',
    insignia: 'bg-[#D5A06F]/20 text-[#F4D7B0] border-[#D5A06F]/50',
    acento: 'bg-[#D5A06F]',
  },
  factura: {
    etiqueta: 'Factura',
    icono: Building2,
    franja: 'bg-sky-400',
    insignia: 'bg-sky-500/20 text-sky-200 border-sky-400/50',
    acento: 'bg-sky-400',
  },
  nota_venta: {
    etiqueta: 'Nota de venta',
    icono: NotebookPen,
    franja: 'bg-violet-400',
    insignia: 'bg-violet-500/20 text-violet-200 border-violet-400/50',
    acento: 'bg-violet-400',
  },
};

export const estiloComprobante = (tipo?: string | null): EstiloComprobante =>
  ESTILOS_COMPROBANTE[(tipo ?? 'boleta').toLowerCase() as TipoComprobanteVista] ??
  ESTILOS_COMPROBANTE.boleta;

export interface EstiloMedioPago {
  etiqueta: string;
  icono: LucideIcon;
  esBilletera: boolean;
}

export const estiloMedioPago = (codigo?: string | null): EstiloMedioPago => {
  switch ((codigo ?? '').toLowerCase()) {
    case 'efectivo':
      return { etiqueta: 'Efectivo', icono: Banknote, esBilletera: false };
    case 'tarjeta':
      return { etiqueta: 'Tarjeta', icono: CreditCard, esBilletera: false };
    case 'yape':
      return { etiqueta: 'Yape', icono: Smartphone, esBilletera: true };
    case 'plin':
      return { etiqueta: 'Plin', icono: Smartphone, esBilletera: true };
    case 'billetera_digital':
      return { etiqueta: 'Yape / Plin', icono: Smartphone, esBilletera: true };
    case '':
      return { etiqueta: 'Pago por definir', icono: Wallet, esBilletera: false };
    default:
      return { etiqueta: codigo as string, icono: Wallet, esBilletera: false };
  }
};

export const formatearSoles = (monto: number | string | null | undefined): string =>
  `S/ ${Number(monto ?? 0).toFixed(2)}`;
