import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';

export type TonoIndicador = 'navy' | 'cobre' | 'ok' | 'alerta' | 'error';

interface TarjetaIndicadorProps {
  icono: LucideIcon;
  etiqueta: string;
  valor: React.ReactNode;
  /** Unidad o complemento junto a la cifra */
  unidad?: string;
  /** Línea de contexto bajo la cifra */
  detalle?: React.ReactNode;
  tono?: TonoIndicador;
  className?: string;
  /** Contenido extra al pie (ej. barra de progreso de un cupo) */
  children?: React.ReactNode;
}

const TONOS: Record<TonoIndicador, { borde: string; etiqueta: string; icono: string; valor: string; detalle: string }> = {
  navy: {
    borde: 'border-aurea-champagne/50',
    etiqueta: 'text-aurea-navy/60',
    icono: 'bg-aurea-navy/5 text-aurea-navy',
    valor: 'text-aurea-navy',
    detalle: 'text-aurea-navy/60',
  },
  cobre: {
    borde: 'border-aurea-copper/25',
    etiqueta: 'text-aurea-copper',
    icono: 'bg-aurea-champagne/40 text-aurea-copper',
    valor: 'text-aurea-navy',
    detalle: 'text-aurea-navy/60',
  },
  ok: {
    borde: 'border-estado-ok-100',
    etiqueta: 'text-estado-ok-700',
    icono: 'bg-estado-ok-50 text-estado-ok-600',
    valor: 'text-estado-ok-700',
    detalle: 'text-estado-ok-700/80',
  },
  alerta: {
    borde: 'border-estado-alerta-100',
    etiqueta: 'text-estado-alerta-700',
    icono: 'bg-estado-alerta-50 text-estado-alerta-600',
    valor: 'text-estado-alerta-700',
    detalle: 'text-estado-alerta-700/80',
  },
  error: {
    borde: 'border-estado-error-100',
    etiqueta: 'text-estado-error-700',
    icono: 'bg-estado-error-50 text-estado-error-600',
    valor: 'text-estado-error-700',
    detalle: 'text-estado-error-700/80',
  },
};

/** Indicador de consola: rótulo y cifra en el color del tono, sobre tarjeta blanca. */
export const TarjetaIndicador: React.FC<TarjetaIndicadorProps> = ({
  icono: Icono,
  etiqueta,
  valor,
  unidad,
  detalle,
  tono = 'navy',
  className,
  children,
}) => {
  const t = TONOS[tono];
  return (
    <div className={cn('bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow min-w-0', t.borde, className)}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs font-semibold uppercase tracking-wider truncate', t.etiqueta)}>{etiqueta}</p>
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', t.icono)} aria-hidden="true">
          <Icono className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2 min-w-0">
        <span className={cn('text-2xl lg:text-3xl font-serif font-bold tabular-nums truncate', t.valor)}>{valor}</span>
        {unidad && <span className={cn('text-xs font-medium shrink-0', t.detalle)}>{unidad}</span>}
      </div>
      {detalle && <p className={cn('mt-1 text-xs truncate', t.detalle)}>{detalle}</p>}
      {children}
    </div>
  );
};
