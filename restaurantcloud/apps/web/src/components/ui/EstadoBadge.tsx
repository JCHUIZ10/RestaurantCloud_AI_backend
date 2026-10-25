import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { TemaUI } from './Button';

export type TonoEstado = 'ok' | 'alerta' | 'error' | 'info' | 'neutro';

interface EstadoBadgeProps {
  tono: TonoEstado;
  children: React.ReactNode;
  /** Icono lucide; sin él se dibuja un punto de color. El texto siempre acompaña (regla A4) */
  icono?: LucideIcon;
  tema?: TemaUI;
  className?: string;
}

const ESTILOS: Record<TemaUI, Record<TonoEstado, { caja: string; punto: string }>> = {
  claro: {
    ok: { caja: 'bg-estado-ok-100 text-estado-ok-800 border-transparent', punto: 'bg-estado-ok-600' },
    alerta: { caja: 'bg-estado-alerta-100 text-estado-alerta-800 border-transparent', punto: 'bg-estado-alerta-600' },
    error: { caja: 'bg-estado-error-100 text-estado-error-800 border-transparent', punto: 'bg-estado-error-600' },
    info: { caja: 'bg-aurea-champagne/40 text-aurea-navy border-transparent', punto: 'bg-aurea-copper' },
    neutro: { caja: 'bg-tinta-100 text-tinta-600 border-transparent', punto: 'bg-tinta-400' },
  },
  oscuro: {
    ok: { caja: 'bg-estado-ok-950/60 text-estado-ok-300 border-estado-ok-800', punto: 'bg-estado-ok-400' },
    alerta: { caja: 'bg-estado-alerta-950/60 text-estado-alerta-300 border-estado-alerta-800', punto: 'bg-estado-alerta-400' },
    error: { caja: 'bg-estado-error-950/60 text-estado-error-300 border-estado-error-800', punto: 'bg-estado-error-400' },
    info: { caja: 'bg-tinta-800 text-tinta-100 border-tinta-700', punto: 'bg-aurea-champagne' },
    neutro: { caja: 'bg-tinta-900 text-tinta-300 border-tinta-700', punto: 'bg-tinta-400' },
  },
};

/** Estado con color semántico + icono o punto + texto. Sustituye a los semáforos con emoji (regla I4). */
export const EstadoBadge: React.FC<EstadoBadgeProps> = ({
  tono,
  children,
  icono: Icono,
  tema = 'claro',
  className,
}) => {
  const estilo = ESTILOS[tema][tono];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap',
        estilo.caja,
        className
      )}
    >
      {Icono ? (
        <Icono className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', estilo.punto)} aria-hidden="true" />
      )}
      {children}
    </span>
  );
};
