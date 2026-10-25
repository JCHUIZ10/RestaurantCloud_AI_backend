import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';

export type TemaUI = 'claro' | 'oscuro';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Superficie sobre la que se dibuja: oscuro solo en el KDS de cocina (regla C5) */
  tema?: TemaUI;
  leftIcon?: React.ReactNode;
  /** Muestra un indicador de progreso y deshabilita el botón */
  loading?: boolean;
}

const VARIANTES: Record<TemaUI, Record<NonNullable<ButtonProps['variant']>, string>> = {
  claro: {
    primary: 'bg-aurea-navy text-aurea-ivory hover:bg-tinta-800 shadow-sm',
    secondary: 'bg-aurea-champagne text-aurea-navy hover:bg-aurea-champagne/80',
    outline: 'border border-aurea-copper/50 text-aurea-navy bg-white hover:bg-aurea-champagne/25 hover:border-aurea-copper shadow-sm',
    ghost: 'text-aurea-navy hover:bg-aurea-champagne/30',
    danger: 'bg-estado-error-600 text-white hover:bg-estado-error-700 shadow-sm',
  },
  oscuro: {
    primary: 'bg-aurea-copper text-aurea-navy hover:bg-aurea-champagne',
    secondary: 'bg-tinta-800 text-tinta-50 border border-tinta-700 hover:bg-tinta-700',
    outline: 'border border-tinta-600 text-tinta-100 hover:bg-tinta-800',
    ghost: 'text-tinta-200 hover:bg-tinta-800 hover:text-white',
    danger: 'bg-estado-error-600 text-white hover:bg-estado-error-500',
  },
};

const TAMANOS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-tactil px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

/** Botón base: una sola acción primaria por vista (regla L6); objetivo táctil de 44px desde md (RS5). */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      tema = 'claro',
      leftIcon,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none',
          VARIANTES[tema][variant],
          TAMANOS[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 motion-safe:animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
