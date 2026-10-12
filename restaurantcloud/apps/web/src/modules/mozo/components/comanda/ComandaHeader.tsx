import React from 'react';
import { ArrowLeft, Users, Clock, Wifi, UtensilsCrossed, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface ComandaHeaderProps {
  mesaId?: string;
  mesaNumero: string;
  ambiente: string;
  comensales: number;
  minutosEnMesa?: number;
  mozoNombre: string;
  rondaActual: number;
}

export const ComandaHeader: React.FC<ComandaHeaderProps> = ({
  mesaId,
  mesaNumero,
  ambiente,
  comensales,
  minutosEnMesa,
  mozoNombre,
  rondaActual,
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2.5 sm:px-6 shadow-xs shrink-0">
      <div className="flex items-center justify-between gap-3">
        {/* Izquierda: Volver al salón y datos de la mesa */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.MOZO_MESAS)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all touch-manipulation active:scale-95"
            title="Volver al plano de mesas"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Salón</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Badge de Mesa */}
          <div className="flex items-center gap-2">
            <span className="font-serif text-base sm:text-lg font-bold text-aurea-navy tracking-tight">
              MESA {mesaNumero}
            </span>

            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {ambiente}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
              <Users className="w-3 h-3 text-aurea-copper" />
              <span>{comensales} personas</span>
            </span>

            {minutosEnMesa && minutosEnMesa > 0 ? (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{minutosEnMesa}m en mesa</span>
              </span>
            ) : null}

            {rondaActual > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Ronda #{rondaActual} (Adicionales)
              </span>
            )}
          </div>
        </div>

        {/* Derecha: SSE y Mozo en turno */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Wifi className="w-3 h-3" />
            <span>KDS Conectado</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
            <span className="hidden sm:inline text-slate-400">Mozo:</span>
            <strong className="text-slate-800 text-[11px] sm:text-xs">{mozoNombre}</strong>
          </div>

          {mesaId && (
            <button
              onClick={() => navigate(ROUTES.MOZO_PRECUENTA(mesaId))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-800 hover:bg-amber-500/30 border border-amber-400/40 transition-colors"
              title="Ver Precuenta digital de la mesa"
            >
              <Receipt className="w-3 h-3 text-amber-700" />
              <span>Precuenta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
