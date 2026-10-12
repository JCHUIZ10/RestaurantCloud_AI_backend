import React from 'react';
import { AlertTriangle, ChevronRight, X, Clock } from 'lucide-react';

interface BannerIncidenciaCocinaProps {
  mesaNumero: string;
  productoNombre: string;
  minutosDesdeAlerta?: number;
  onAtender: () => void;
  onCerrar: () => void;
}

export const BannerIncidenciaCocina: React.FC<BannerIncidenciaCocinaProps> = ({
  mesaNumero,
  productoNombre,
  minutosDesdeAlerta = 2,
  onAtender,
  onCerrar,
}) => {
  return (
    <aside
      aria-label="Alerta de incidencia en cocina"
      className="relative z-20 mx-4 sm:mx-6 mb-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-900/90 p-3.5 sm:p-4 shadow-lg shadow-amber-950/30 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                ⚠️ Quiebre Cocina
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hace {minutosDesdeAlerta} min
              </span>
            </div>
            <p className="text-sm font-medium text-slate-100">
              Incidencia en <strong className="text-amber-200">Mesa {mesaNumero}</strong>: El plato{' '}
              <span className="font-semibold text-white">"{productoNombre}"</span> no está disponible por quiebre de stock en estación caliente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={onAtender}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-xs tracking-wide shadow transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <span>Resolver en Mesa {mesaNumero}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCerrar}
            title="Minimizar aviso"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
