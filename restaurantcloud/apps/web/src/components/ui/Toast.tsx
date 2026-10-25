import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { ContextoToast, type TonoToast } from './useToast';

interface ToastItem {
  id: number;
  mensaje: string;
  tono: TonoToast;
}

const ICONOS: Record<TonoToast, { icono: LucideIcon; color: string }> = {
  ok: { icono: CheckCircle2, color: 'text-estado-ok-400' },
  error: { icono: AlertCircle, color: 'text-estado-error-400' },
  alerta: { icono: AlertTriangle, color: 'text-estado-alerta-400' },
  info: { icono: Info, color: 'text-aurea-champagne' },
};

// Los errores permanecen más tiempo para que se alcancen a leer
const DURACION_MS: Record<TonoToast, number> = { ok: 4000, info: 4000, alerta: 6000, error: 6000 };

/**
 * Avisos globales: abajo y centrados en móvil (al alcance del pulgar), arriba a la derecha desde md.
 * Se monta una vez en main.tsx; las páginas usan useToast().
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const siguienteId = useRef(0);
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const cerrar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(temporizadores.current.get(id));
    temporizadores.current.delete(id);
  }, []);

  const mostrar = useCallback(
    (mensaje: string, tono: TonoToast = 'ok') => {
      const id = ++siguienteId.current;
      // Máximo tres avisos a la vez: el más antiguo sale primero
      setToasts((prev) => [...prev.slice(-2), { id, mensaje, tono }]);
      temporizadores.current.set(id, setTimeout(() => cerrar(id), DURACION_MS[tono]));
    },
    [cerrar]
  );

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => mapa.forEach(clearTimeout);
  }, []);

  return (
    <ContextoToast.Provider value={{ mostrar }}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[70] inset-x-4 bottom-4 md:inset-x-auto md:bottom-auto md:top-4 md:right-4 flex flex-col items-center md:items-end gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const { icono: Icono, color } = ICONOS[t.tono];
          return (
            <div
              key={t.id}
              role={t.tono === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto w-full max-w-sm flex items-start gap-3 pl-4 pr-1 py-1 rounded-xl bg-aurea-navy text-white shadow-xl border border-white/10"
            >
              <Icono className={cn('w-5 h-5 shrink-0 mt-3', color)} aria-hidden="true" />
              <p className="flex-1 py-3 text-sm leading-snug">{t.mensaje}</p>
              <button
                type="button"
                onClick={() => cerrar(t.id)}
                aria-label="Cerrar aviso"
                className="min-h-tactil min-w-tactil flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ContextoToast.Provider>
  );
};
