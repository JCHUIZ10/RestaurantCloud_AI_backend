import React from 'react';
import { ArrowLeft, Clock, Users, User, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrecuentaHeaderProps {
  mesaId: string;
  mesaNumero: string;
  esMesaUnida?: boolean;
  mozoNombre: string;
  comensales: number;
  minutosEnMesa: number;
  tieneCocinaPendiente: boolean;
  alertaCocina?: string | null;
}

export const PrecuentaHeader: React.FC<PrecuentaHeaderProps> = ({
  mesaId,
  mesaNumero,
  esMesaUnida,
  mozoNombre,
  comensales,
  minutosEnMesa,
  tieneCocinaPendiente,
  alertaCocina,
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-[#0B2340] text-white border-b border-[#D5A06F]/20 px-4 py-3 sm:px-6 shadow-md">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lado izquierdo: Botón volver + Identificación de mesa */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/mozo/mesas')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F4D7B0] transition-colors border border-[#D5A06F]/30 focus:outline-none focus:ring-2 focus:ring-[#D5A06F]"
              title="Volver al plano de salón"
              aria-label="Volver a mesas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider text-[#D5A06F] font-semibold">
                  Precuenta Digital Móvil
                </span>
                {esMesaUnida && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-purple-900/60 text-purple-200 border border-purple-400/40 rounded-full">
                    Mesa Unida
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#FFF9F0] tracking-wide flex items-center gap-2">
                <span>Mesa {mesaNumero}</span>
                <span className="text-xs font-sans font-normal px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Pre-cobro
                </span>
              </h1>
            </div>
          </div>

          {/* Lado derecho: Metadatos y Acción de añadir comanda */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
              <User className="w-3.5 h-3.5 text-[#D5A06F]" />
              <span className="font-medium text-white">{mozoNombre}</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
              <Users className="w-3.5 h-3.5 text-[#D5A06F]" />
              <span>{comensales} pax</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#D5A06F]" />
              <span>{minutosEnMesa} min</span>
            </div>

            <button
              onClick={() => navigate(`/mozo/mesas/${mesaId}/comanda`)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#D5A06F]/20 hover:bg-[#D5A06F]/30 text-[#F4D7B0] border border-[#D5A06F]/50 font-medium transition-colors"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Editar Comanda</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo No Bloqueante de Cocina */}
        {tieneCocinaPendiente && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Aviso de cocina:</strong> {alertaCocina || "Hay platos en preparación para esta mesa."} Puede presentar la precuenta pero verifique el pase antes del cobro final.
              </span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
              No Bloqueante
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
