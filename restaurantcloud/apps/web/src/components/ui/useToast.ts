import { createContext, useContext } from 'react';

export type TonoToast = 'ok' | 'error' | 'alerta' | 'info';

export interface ToastContexto {
  mostrar: (mensaje: string, tono?: TonoToast) => void;
}

export const ContextoToast = createContext<ToastContexto | null>(null);

/** Muestra avisos globales; requiere <ToastProvider> montado en main.tsx. */
export function useToast(): ToastContexto {
  const ctx = useContext(ContextoToast);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
