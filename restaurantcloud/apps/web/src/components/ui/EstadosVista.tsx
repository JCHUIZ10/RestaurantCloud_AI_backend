import React from 'react';
import { AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button, type TemaUI } from './Button';

/** Estados de carga, vacío y error compartidos por todas las vistas (§2.7 de la guía). */

interface SkeletonProps {
  className?: string;
  tema?: TemaUI;
}

/** Bloque de carga con la forma del contenido final; se compone con clases de tamaño. */
export const Skeleton: React.FC<SkeletonProps> = ({ className, tema = 'claro' }) => (
  <div
    aria-hidden="true"
    className={cn(
      'motion-safe:animate-pulse rounded-xl',
      tema === 'oscuro' ? 'bg-tinta-800' : 'bg-aurea-champagne/30',
      className
    )}
  />
);

interface EstadoVacioProps {
  icono: LucideIcon;
  titulo: string;
  descripcion?: React.ReactNode;
  accion?: React.ReactNode;
  tema?: TemaUI;
  className?: string;
}

export const EstadoVacio: React.FC<EstadoVacioProps> = ({
  icono: Icono,
  titulo,
  descripcion,
  accion,
  tema = 'claro',
  className,
}) => {
  const oscuro = tema === 'oscuro';
  return (
    <div className={cn('flex flex-col items-center text-center gap-3 px-4 py-10 sm:py-12', className)}>
      <span
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center',
          oscuro ? 'bg-tinta-800 text-aurea-champagne' : 'bg-aurea-champagne/40 text-aurea-navy'
        )}
        aria-hidden="true"
      >
        <Icono className="w-6 h-6" />
      </span>
      <h3 className={cn(oscuro ? 'text-base font-semibold text-white' : 'font-serif font-bold text-xl text-aurea-navy')}>{titulo}</h3>
      {descripcion && (
        <p className={cn('text-sm max-w-sm', oscuro ? 'text-tinta-300' : 'text-aurea-navy/70')}>{descripcion}</p>
      )}
      {accion && <div className="pt-1">{accion}</div>}
    </div>
  );
};

interface EstadoErrorProps {
  mensaje: string;
  titulo?: string;
  /** Código técnico mostrado de forma discreta */
  codigo?: string;
  onReintentar?: () => void;
  reintentando?: boolean;
  tema?: TemaUI;
  className?: string;
}

export const EstadoError: React.FC<EstadoErrorProps> = ({
  mensaje,
  titulo = 'No se pudo cargar la información',
  codigo,
  onReintentar,
  reintentando = false,
  tema = 'claro',
  className,
}) => {
  const oscuro = tema === 'oscuro';
  return (
    <div role="alert" className={cn('flex flex-col items-center text-center gap-3 px-4 py-10 sm:py-12', className)}>
      <span
        className={cn(
          'w-12 h-12 rounded-2xl border flex items-center justify-center',
          oscuro
            ? 'bg-estado-error-950/60 text-estado-error-300 border-estado-error-800'
            : 'bg-estado-error-50 text-estado-error-700 border-estado-error-200'
        )}
        aria-hidden="true"
      >
        <AlertCircle className="w-6 h-6" />
      </span>
      <h3 className={cn(oscuro ? 'text-base font-semibold text-white' : 'font-serif font-bold text-xl text-aurea-navy')}>{titulo}</h3>
      <p className={cn('text-sm max-w-sm', oscuro ? 'text-tinta-300' : 'text-aurea-navy/70')}>{mensaje}</p>
      {codigo && <p className="text-xs text-aurea-navy/50 tabular-nums">Código: {codigo}</p>}
      {onReintentar && (
        <Button
          variant={oscuro ? 'secondary' : 'primary'}
          tema={tema}
          onClick={onReintentar}
          loading={reintentando}
          leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
          className="mt-1"
        >
          Reintentar
        </Button>
      )}
    </div>
  );
};
