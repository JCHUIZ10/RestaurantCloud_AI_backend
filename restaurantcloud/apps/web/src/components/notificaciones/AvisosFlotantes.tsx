import React, { useEffect } from 'react';
import { cn } from '@/shared/utils';
import { ETIQUETA_SEVERIDAD } from './formato';
import type { Flotante } from './useNotificaciones';

interface Props {
  flotantes: Flotante[];
  onCerrar: (id: string) => void;
}

const Aviso: React.FC<{ flotante: Flotante; onCerrar: (id: string) => void }> = ({ flotante, onCerrar }) => {
  const { aviso, ms } = flotante;
  const critico = aviso.severidad === 'critica';

  useEffect(() => {
    const t = setTimeout(() => onCerrar(aviso.id), ms);
    return () => clearTimeout(t);
  }, [aviso.id, ms, onCerrar]);

  return (
    // Un crítico se anuncia de inmediato (assertive); el discreto, cuando el lector termine lo que dice (polite)
    <div
      role={critico ? 'alert' : 'status'}
      aria-live={critico ? 'assertive' : 'polite'}
      data-severidad={aviso.severidad}
      className={cn(
        'pointer-events-auto grid gap-1.5 rounded-2xl px-4 pt-3.5 pb-3 shadow-2xl motion-safe:animate-aviso-entra',
        critico ? 'bg-aurea-navy text-white border border-estado-error-600' : 'bg-white text-aurea-navy border border-tinta-200',
      )}
    >
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wide',
            critico ? 'bg-estado-error-600 text-white border-estado-error-600' : 'text-estado-info-700 bg-estado-info-50 border-estado-info-200',
          )}
        >
          {ETIQUETA_SEVERIDAD[aviso.severidad]}
        </span>
        <span className="ml-auto opacity-70">Ahora</span>
      </div>
      <h4 className="text-[15px] font-bold">{aviso.titulo}</h4>
      <p className="text-[13.5px] opacity-90">{aviso.mensaje}</p>
      <div className="mt-1 flex items-center gap-3">
        <span className={cn('flex-1 h-1 rounded-full overflow-hidden', critico ? 'bg-white/20' : 'bg-tinta-100')} aria-hidden="true">
          <i className="block h-full origin-left bg-aurea-copper animate-encoger" style={{ animationDuration: `${ms}ms` }} />
        </span>
        <button
          type="button"
          onClick={() => onCerrar(aviso.id)}
          className={cn('min-h-10 px-3.5 rounded-lg text-[13px] font-bold', critico ? 'bg-white text-aurea-navy' : 'bg-tinta-100 text-aurea-navy')}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

/** Avisos flotantes de la esquina superior derecha: no bloquean la pantalla ni toman el foco del teclado. */
export const AvisosFlotantes: React.FC<Props> = ({ flotantes, onCerrar }) => (
  <div className="fixed top-[calc(env(safe-area-inset-top,0px)+4.25rem)] right-4 z-[60] grid w-[380px] max-w-[calc(100%-2rem)] gap-2.5 pointer-events-none">
    {flotantes.map((f) => (
      <Aviso key={f.aviso.id} flotante={f} onCerrar={onCerrar} />
    ))}
  </div>
);
