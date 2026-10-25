import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useCapaModal } from '@/shared/hooks/useCapaModal';
import { IconButton } from './IconButton';
import type { TemaUI } from './Button';

interface DrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  pie?: React.ReactNode;
  ancho?: 'md' | 'lg' | 'xl';
  cerrable?: boolean;
  tema?: TemaUI;
  children: React.ReactNode;
}

const ANCHOS = { md: 'md:max-w-md', lg: 'md:max-w-xl', xl: 'md:max-w-3xl' };

/** Panel lateral derecho desde md; en móvil ocupa la pantalla completa. */
export const Drawer: React.FC<DrawerProps> = ({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  pie,
  ancho = 'md',
  cerrable = true,
  tema = 'claro',
  children,
}) => {
  const idTitulo = useId();
  const panelRef = useCapaModal<HTMLDivElement>(abierto, onCerrar, cerrable);
  const oscuro = tema === 'oscuro';

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={cn('absolute inset-0 backdrop-blur-sm', oscuro ? 'bg-black/70' : 'bg-aurea-navy/40')}
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
          'relative w-full h-dvh flex flex-col shadow-2xl focus:outline-none md:border-l',
          ANCHOS[ancho],
          oscuro ? 'bg-tinta-900 border-tinta-700 text-tinta-100' : 'bg-white border-aurea-champagne/70 text-aurea-navy'
        )}
      >
        <header
          className={cn(
            'shrink-0 flex items-start gap-3 px-4 sm:px-6 py-4 border-b',
            oscuro ? 'border-tinta-800' : 'border-aurea-champagne/40'
          )}
        >
          <div className="flex-1 min-w-0">
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

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">{children}</div>

        {pie && (
          <footer
            className={cn(
              'shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-4 border-t',
              '[&>*]:w-full sm:[&>*]:w-auto',
              oscuro ? 'border-tinta-800' : 'border-aurea-champagne/40'
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
