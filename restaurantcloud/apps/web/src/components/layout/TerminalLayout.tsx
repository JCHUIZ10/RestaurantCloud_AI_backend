import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/shared/utils';

/**
 * Layout de terminales sin cabecera propia: cada pantalla operativa (KDS, salón, POS)
 * trae la suya e incluye el botón de salir (BotonSalir).
 */
export const TerminalLayout: React.FC = () => {
  const location = useLocation();
  const isCocina = location.pathname.startsWith('/cocina');

  return (
    <div
      className={cn(
        'h-dvh flex flex-col select-none',
        isCocina ? 'bg-tinta-950 text-tinta-50' : 'bg-tinta-50 text-tinta-900'
      )}
    >
      <main className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
