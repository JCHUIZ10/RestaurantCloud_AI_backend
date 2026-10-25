import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { TemaUI } from './Button';

interface CampoBusquedaProps {
  valor: string;
  onCambiar: (texto: string) => void;
  placeholder: string;
  /** Nombre accesible del campo */
  etiqueta: string;
  tema?: TemaUI;
  className?: string;
}

/** Buscador con 16px en móvil para evitar el zoom automático de iOS (regla T3). */
export const CampoBusqueda: React.FC<CampoBusquedaProps> = ({
  valor,
  onCambiar,
  placeholder,
  etiqueta,
  tema = 'claro',
  className,
}) => {
  const oscuro = tema === 'oscuro';

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-aurea-copper"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        className={cn(
          'w-full min-h-tactil pl-10 pr-11 rounded-xl border text-base md:text-sm transition-colors focus:outline-none focus:border-aurea-copper',
          '[&::-webkit-search-cancel-button]:hidden',
          oscuro
            ? 'bg-tinta-900 border-tinta-700 text-white placeholder:text-tinta-400'
            : 'bg-white border-aurea-champagne/70 text-aurea-navy placeholder:text-aurea-navy/40 shadow-sm'
        )}
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambiar('')}
          aria-label="Limpiar búsqueda"
          className={cn(
            'absolute right-0.5 top-1/2 -translate-y-1/2 min-h-tactil min-w-tactil flex items-center justify-center rounded-xl',
            oscuro ? 'text-tinta-400 hover:text-white' : 'text-aurea-navy/40 hover:text-aurea-navy'
          )}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
