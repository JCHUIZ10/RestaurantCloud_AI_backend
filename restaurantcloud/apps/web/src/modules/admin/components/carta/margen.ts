import type { TonoEstado } from '@/components/ui';

/** Semáforo de margen bruto usado en tabla, editor y simulador: ≥65 % sano, ≥50 % ajustado. */
export const tonoMargen = (pct: number): TonoEstado => (pct >= 65 ? 'ok' : pct >= 50 ? 'alerta' : 'error');

export const BARRA_MARGEN: Record<TonoEstado, string> = {
  ok: 'bg-estado-ok-500',
  alerta: 'bg-estado-alerta-500',
  error: 'bg-estado-error-500',
  info: 'bg-aurea-copper',
  neutro: 'bg-tinta-400',
};
