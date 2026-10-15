import React from 'react';
import { AlertOctagon, X, ArrowRight, BellRing } from 'lucide-react';
import { SseIncidenteCriticoEvent } from '@/types/propietario';

interface BannerAlertaCriticaSSEProps {
  alerta: SseIncidenteCriticoEvent | null;
  onInspeccionar: (id: string) => void;
  onDescartar: () => void;
}

export const BannerAlertaCriticaSSE: React.FC<BannerAlertaCriticaSSEProps> = ({
  alerta,
  onInspeccionar,
  onDescartar,
}) => {
  if (!alerta) return null;

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white p-4 shadow-xl shadow-red-950/20 border border-white/20 animate-fade-in relative overflow-hidden">
      {/* Luz ambiental de fondo */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 animate-pulse">
            <BellRing className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-red-700 tracking-wide uppercase shadow-sm">
                <AlertOctagon className="w-3.5 h-3.5" />
                Alerta Crítica en Vivo (SSE)
              </span>
              <span className="text-xs text-white/90 font-medium">
                {alerta.local_nombre} • {new Date(alerta.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="font-semibold text-sm sm:text-base text-white mt-1">
              <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded text-yellow-200 mr-1.5 text-xs">
                {alerta.codigo}
              </span>
              {alerta.titulo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => onInspeccionar(alerta.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-yellow-100 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <span>Inspeccionar Ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDescartar}
            title="Descartar notificación"
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
