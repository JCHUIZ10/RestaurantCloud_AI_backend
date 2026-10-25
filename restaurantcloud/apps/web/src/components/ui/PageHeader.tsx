import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { TemaUI } from './Button';

interface PageHeaderProps {
  titulo: string;
  /** Icono de la sección junto al título (consolas) */
  icono?: LucideIcon;
  descripcion?: React.ReactNode;
  /** Enlace «Volver a <padre>» de las subpantallas (regla NV6) */
  volver?: { etiqueta: string; to: string };
  /** Insignias junto al título (sede, contadores) */
  meta?: React.ReactNode;
  /** Acciones de la vista; se apilan bajo el título en móvil */
  acciones?: React.ReactNode;
  /** Cabecera de terminal: título en DM Sans, más compacta (regla T1) */
  compacto?: boolean;
  tema?: TemaUI;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  titulo,
  icono: Icono,
  descripcion,
  volver,
  meta,
  acciones,
  compacto = false,
  tema = 'claro',
  className,
}) => {
  const oscuro = tema === 'oscuro';

  return (
    <header
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6',
        className
      )}
    >
      <div className="min-w-0 flex items-center gap-4">
        {Icono && (
          <span
            className="hidden sm:flex w-12 h-12 rounded-2xl bg-aurea-navy text-aurea-champagne items-center justify-center shrink-0 shadow-md ring-1 ring-aurea-copper/40"
            aria-hidden="true"
          >
            <Icono className="w-6 h-6" />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          {volver && (
            <Link
              to={volver.to}
              className={cn(
                'inline-flex items-center gap-1.5 min-h-tactil -ml-1 px-1 text-sm font-semibold rounded-lg transition-colors',
                oscuro ? 'text-aurea-champagne hover:text-white' : 'text-aurea-navy/70 hover:text-aurea-navy'
              )}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {volver.etiqueta}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1
              className={cn(
                compacto ? 'font-sans font-semibold text-xl md:text-2xl' : 'font-serif font-bold tracking-tight text-2xl lg:text-3xl',
                oscuro ? 'text-white' : 'text-aurea-navy'
              )}
            >
              {titulo}
            </h1>
            {meta}
          </div>
          {descripcion && (
            <p className={cn('text-sm max-w-2xl', oscuro ? 'text-tinta-300' : 'text-aurea-navy/70')}>{descripcion}</p>
          )}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2 md:shrink-0">{acciones}</div>}
    </header>
  );
};
