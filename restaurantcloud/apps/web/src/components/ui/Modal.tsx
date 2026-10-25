import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useCapaModal } from '@/shared/hooks/useCapaModal';
import { IconButton } from './IconButton';
import type { TemaUI } from './Button';

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: React.ReactNode;
  /** Rótulo corto sobre el título */
  etiqueta?: string;
  descripcion?: React.ReactNode;
  icono?: LucideIcon;
  /** Tono del icono de cabecera para diálogos de alerta o bloqueo */
  tono?: 'neutro' | 'alerta' | 'error';
  tamano?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Acciones del pie; se apilan a ancho completo en móvil */
  pie?: React.ReactNode;
  /** Franja fija bajo la cabecera que no se desplaza (pasos de un asistente, resumen en vivo) */
  barra?: React.ReactNode;
  /** false mientras una operación está en curso: desactiva Escape, fondo y botón de cierre */
  cerrable?: boolean;
  tema?: TemaUI;
  children: React.ReactNode;
}

const ANCHOS = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
  '2xl': 'md:max-w-6xl',
};

const ICONO_TONO: Record<TemaUI, Record<NonNullable<ModalProps['tono']>, string>> = {
  claro: {
    neutro: 'bg-aurea-champagne/40 text-aurea-navy border-aurea-copper/30',
    alerta: 'bg-estado-alerta-50 text-estado-alerta-700 border-estado-alerta-200',
    error: 'bg-estado-error-50 text-estado-error-700 border-estado-error-200',
  },
  oscuro: {
    neutro: 'bg-tinta-800 text-aurea-champagne border-tinta-700',
    alerta: 'bg-estado-alerta-950/60 text-estado-alerta-300 border-estado-alerta-800',
    error: 'bg-estado-error-950/60 text-estado-error-300 border-estado-error-800',
  },
};

/**
 * Modal base (reglas RS4 y A2): hoja inferior a ancho completo en móvil, centrado desde md,
 * cabecera y pie siempre visibles con scroll solo en el cuerpo.
 */
export const Modal: React.FC<ModalProps> = ({
  abierto,
  onCerrar,
  titulo,
  etiqueta,
  descripcion,
  icono: Icono,
  tono = 'neutro',
  tamano = 'md',
  pie,
  barra,
  cerrable = true,
  tema = 'claro',
  children,
}) => {
  const idTitulo = useId();
  const panelRef = useCapaModal<HTMLDivElement>(abierto, onCerrar, cerrable);
  const oscuro = tema === 'oscuro';

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div
        className={cn('absolute inset-0 backdrop-blur-sm', oscuro ? 'bg-black/70' : 'bg-aurea-navy/50')}
        onClick={cerrable ? onCerrar : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          'relative w-full flex flex-col max-h-[90dvh] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden border focus:outline-none',
          ANCHOS[tamano],
          oscuro ? 'bg-tinta-900 border-tinta-700 text-tinta-100' : 'bg-white border-aurea-champagne/70 text-aurea-navy'
        )}
      >
        <header
          className={cn(
            'shrink-0 flex items-start gap-3 px-4 sm:px-6 py-4 border-b',
            oscuro ? 'border-tinta-800 bg-tinta-950' : 'border-aurea-champagne/40 bg-aurea-ivory/60'
          )}
        >
          {Icono && (
            <span
              className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', ICONO_TONO[tema][tono])}
              aria-hidden="true"
            >
              <Icono className="w-5 h-5" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            {etiqueta && (
              <p className={cn('text-xs font-semibold uppercase tracking-wide', oscuro ? 'text-aurea-copper' : 'text-aurea-navy/60')}>
                {etiqueta}
              </p>
            )}
            <h2
              id={idTitulo}
              className={cn('text-lg leading-snug', oscuro ? 'font-semibold text-white' : 'font-serif font-bold text-xl text-aurea-navy')}
            >
              {titulo}
            </h2>
            {descripcion && (
              <p className={cn('mt-0.5 text-sm', oscuro ? 'text-tinta-300' : 'text-aurea-navy/70')}>{descripcion}</p>
            )}
          </div>
          <IconButton etiqueta="Cerrar" icono={X} tema={tema} onClick={onCerrar} disabled={!cerrable} className="-mr-2 -mt-1" />
        </header>

        {barra && (
          <div className={cn('shrink-0 border-b', oscuro ? 'border-tinta-800' : 'border-aurea-champagne/40')}>{barra}</div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">{children}</div>

        {pie && (
          <footer
            className={cn(
              'shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t',
              '[&>*]:w-full sm:[&>*]:w-auto',
              oscuro ? 'border-tinta-800 bg-tinta-950' : 'border-aurea-champagne/40 bg-aurea-ivory/60'
            )}
          >
            {pie}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};
