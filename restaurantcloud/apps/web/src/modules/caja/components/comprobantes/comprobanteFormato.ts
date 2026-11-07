import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ComprobanteHistorialItemDTO, MedioPagoCodigo } from '@/types/caja';

type TipoComprobante = ComprobanteHistorialItemDTO['tipo_comprobante'];

const ETIQUETAS_TIPO: Record<TipoComprobante, string> = {
  boleta: 'Boleta',
  factura: 'Factura',
  nota_venta: 'Nota de venta',
  nota_credito: 'Nota de crédito',
};

export const etiquetaTipo = (tipo: TipoComprobante): string => ETIQUETAS_TIPO[tipo];

/** Texto del botón que abre el documento digital: "Ver Boleta", "Ver NC", etc. */
export const etiquetaBotonVer = (tipo: TipoComprobante): string =>
  tipo === 'nota_credito' ? 'Ver NC' : `Ver ${ETIQUETAS_TIPO[tipo]}`;

export const ICONOS_MEDIO_PAGO: Record<MedioPagoCodigo, LucideIcon> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  billetera_digital: Smartphone,
};

export const NOMBRES_MEDIO_DEFECTO: Record<MedioPagoCodigo, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta POS',
  billetera_digital: 'Yape / Plin',
};

/** Una NC se guarda con monto negativo; en pantalla se muestra el monto acreditado en positivo. */
export const montoMostrado = (total: number): number => Math.abs(total);

/** Páginas visibles con elipsis: 1 … 4 5 6 … 40. Las elipsis llevan una clave propia para React. */
export function ventanaDePaginas(actual: number, total: number): (number | 'inicio' | 'fin')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const resultado: (number | 'inicio' | 'fin')[] = [];
  ordenadas.forEach((pagina, indice) => {
    const anterior = ordenadas[indice - 1];
    if (anterior !== undefined && pagina - anterior > 1) {
      resultado.push(anterior < actual ? 'inicio' : 'fin');
    }
    resultado.push(pagina);
  });
  return resultado;
}
