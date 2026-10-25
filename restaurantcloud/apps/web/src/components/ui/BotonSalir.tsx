import React from 'react';
import { LogOut } from 'lucide-react';
import { useCerrarSesion } from '@/shared/hooks/useCerrarSesion';
import { cn } from '@/shared/utils';

interface BotonSalirProps {
  /** Tono de la cabecera donde se coloca */
  tono?: 'claro' | 'oscuro';
  className?: string;
}

/** Botón de cierre de sesión para las cabeceras de las terminales operativas. */
export const BotonSalir: React.FC<BotonSalirProps> = ({ tono = 'claro', className }) => {
  const cerrarSesion = useCerrarSesion();

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      aria-label="Cerrar sesión"
      className={cn(
        'min-h-tactil min-w-tactil px-3 rounded-lg border flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors shrink-0',
        tono === 'oscuro'
          ? 'border-tinta-700 text-tinta-100 hover:bg-estado-error-900/40 hover:text-estado-error-100 hover:border-estado-error-700'
          : 'border-tinta-200 text-tinta-700 hover:bg-estado-error-50 hover:text-estado-error-700 hover:border-estado-error-200',
        className
      )}
    >
      <LogOut className="w-4 h-4" aria-hidden="true" />
      <span className="hidden sm:inline">Salir</span>
    </button>
  );
};
