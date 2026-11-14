import type { CategoriaGastoManual } from '@/types/admin';

/** Categorías de un gasto operativo: el código lo valida el backend; aquí viven su etiqueta y su color. */
export interface CategoriaGastoConfig {
  valor: CategoriaGastoManual;
  etiqueta: string;
  /** Rótulo breve para espacios reducidos (detalle de egresos del cajero) */
  etiquetaCorta: string;
  /** Clases de la insignia de color de la categoría */
  clase: string;
}

export const CATEGORIAS_GASTO: readonly CategoriaGastoConfig[] = [
  {
    valor: 'servicios_basicos',
    etiqueta: 'Servicios Básicos (Luz/Gas/Agua)',
    etiquetaCorta: 'Servicios básicos',
    clase: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  },
  {
    valor: 'alquiler',
    etiqueta: 'Alquiler de Local',
    etiquetaCorta: 'Alquiler',
    clase: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800',
  },
  {
    valor: 'limpieza_aseo',
    etiqueta: 'Limpieza, Aseo y Menaje',
    etiquetaCorta: 'Limpieza y aseo',
    clase: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 border-teal-300 dark:border-teal-800',
  },
  {
    valor: 'mantenimiento',
    etiqueta: 'Mantenimiento y Equipamiento',
    etiquetaCorta: 'Mantenimiento',
    clase: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200 border-sky-300 dark:border-sky-800',
  },
  {
    valor: 'caja_chica',
    etiqueta: 'Caja Chica / Emergencias',
    etiquetaCorta: 'Caja chica',
    clase: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 dark:border-rose-800',
  },
  {
    valor: 'otros',
    etiqueta: 'Otros Egresos Operativos',
    etiquetaCorta: 'Otros',
    clase: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  },
];

const OTROS = CATEGORIAS_GASTO[CATEGORIAS_GASTO.length - 1];

/** Configuración de una categoría; un código desconocido se trata como "otros". */
export const configCategoriaGasto = (valor: string): CategoriaGastoConfig =>
  CATEGORIAS_GASTO.find((c) => c.valor === valor) ?? OTROS;

/** Etiqueta breve de una categoría, o el código tal cual si no se conoce. */
export const etiquetaCortaCategoriaGasto = (valor: string): string =>
  CATEGORIAS_GASTO.find((c) => c.valor === valor)?.etiquetaCorta ?? valor;

/** Tipos de comprobante de un gasto: el backend guarda el código y la pantalla muestra la etiqueta. */
export const TIPOS_COMPROBANTE_GASTO: ReadonlyArray<{ valor: string; etiqueta: string }> = [
  { valor: 'recibo_servicios', etiqueta: 'Recibo servicios públicos' },
  { valor: 'factura', etiqueta: 'Factura electrónica' },
  { valor: 'boleta', etiqueta: 'Boleta de venta' },
  { valor: 'recibo_honorarios', etiqueta: 'Recibo por honorarios' },
  { valor: 'recibo_interno', etiqueta: 'Recibo interno / declaración jurada' },
];

/** Etiqueta de un tipo de comprobante, o el texto crudo si no se reconoce. */
export const etiquetaTipoComprobanteGasto = (valor: string | null | undefined): string =>
  TIPOS_COMPROBANTE_GASTO.find((t) => t.valor === valor)?.etiqueta ?? valor ?? '—';
