import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { TemaUI } from './Button';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** Texto accesible obligatorio: el icono es el único contenido (regla I3) */
  etiqueta: string;
  icono: LucideIcon;
  variant?: 'ghost' | 'outline' | 'danger';
  /** sm solo en tablas densas de escritorio; md cumple el objetivo táctil de 44px */
  size?: 'sm' | 'md';
  tema?: TemaUI;
}

const VARIANTES = {
  claro: {
    ghost: 'text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/30',
    outline: 'border border-aurea-champagne/70 bg-white text-aurea-navy/80 hover:bg-aurea-champagne/20',
    danger: 'text-estado-error-600 hover:text-estado-error-700 hover:bg-estado-error-50',
  },
  oscuro: {
    ghost: 'text-tinta-300 hover:text-white hover:bg-tinta-800',
    outline: 'border border-tinta-700 text-tinta-200 hover:bg-tinta-800 hover:text-white',
    danger: 'text-estado-error-300 hover:text-estado-error-200 hover:bg-estado-error-900/40',
  },
} as const;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { etiqueta, icono: Icono, variant = 'ghost', size = 'md', tema = 'claro', className, title, ...props },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      aria-label={etiqueta}
      title={title ?? etiqueta}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none',
        size === 'md' ? 'min-h-tactil min-w-tactil' : 'w-9 h-9',
        VARIANTES[tema][variant],
        className
      )}
      {...props}
    >
      <Icono className={size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
    </button>
  )
);

IconButton.displayName = 'IconButton';
