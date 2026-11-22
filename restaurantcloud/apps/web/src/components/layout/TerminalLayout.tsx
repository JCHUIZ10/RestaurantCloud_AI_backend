import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/shared/utils';
import { CampanaNotificaciones } from '@/components/notificaciones/CampanaNotificaciones';
import { IS_REAL_API } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';

/**
 * Layout de terminales sin cabecera propia: cada pantalla operativa (KDS, salón, POS)
 * trae la suya e incluye el botón de salir (BotonSalir). La campana de avisos va aquí, una sola vez, y no en cada cabecera.
 */
export const TerminalLayout: React.FC = () => {
  const location = useLocation();
  const isCocina = location.pathname.startsWith('/cocina');
  const rol = useAuthStore((s) => s.usuario?.rol);
  const conBandeja = IS_REAL_API && (rol === 'mozo' || rol === 'cocina' || rol === 'cajero');

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
      {/* Avisos del personal: botón flotante que solo se muestra con avisos sin leer, para no quitar sitio a la pantalla */}
      {conBandeja && <CampanaNotificaciones variante="flotante" fondoOscuro={isCocina} />}
    </div>
  );
};
