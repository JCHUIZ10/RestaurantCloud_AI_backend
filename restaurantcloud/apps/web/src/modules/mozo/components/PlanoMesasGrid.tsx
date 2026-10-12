import React from 'react';
import { Utensils, PlusCircle } from 'lucide-react';
import { MesaCardDTO } from '@/types/mozo';
import { MesaCard } from './MesaCard';

interface PlanoMesasGridProps {
  mesas: MesaCardDTO[];
  onSeleccionarMesa: (mesa: MesaCardDTO) => void;
  onAbrirMesaRapido: (mesa: MesaCardDTO) => void;
  mesaSeleccionadaId?: string | null;
  esTurnoVacio?: boolean;
}

export const PlanoMesasGrid: React.FC<PlanoMesasGridProps> = ({
  mesas,
  onSeleccionarMesa,
  onAbrirMesaRapido,
  mesaSeleccionadaId,
  esTurnoVacio = false,
}) => {
  // Vista 4: Estado Inicial / Turno Listo y Vacío
  if (esTurnoVacio || mesas.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
          <Utensils className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-slate-800 mb-2">
          Salón listo para el servicio
        </h3>
        <p className="text-slate-600 text-sm max-w-md mb-6 leading-relaxed">
          Todas las mesas se encuentran libres y preparadas. Cuando ingresen los primeros
          comensales, selecciona una mesa para sentarlos y abrir su comanda.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full">
          {mesas.slice(0, 4).map((m) => (
            <button
              key={m.id}
              onClick={() => onAbrirMesaRapido(m)}
              className="p-3 rounded-xl border border-dashed border-emerald-300 bg-white hover:bg-emerald-50 text-left transition-all group"
            >
              <div className="text-xs font-semibold text-slate-400">Mesa</div>
              <div className="font-serif text-xl font-bold text-slate-800 group-hover:text-emerald-700">
                {m.numero}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <PlusCircle className="w-3 h-3" />
                <span>Sentar</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Grilla visual de mesas touch-first */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {mesas.map((mesa) => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            onSeleccionar={onSeleccionarMesa}
            onAbrirMesaRapido={onAbrirMesaRapido}
            esSeleccionada={mesaSeleccionadaId === mesa.id}
          />
        ))}
      </div>

      {/* Simbología / Leyenda cromática al pie */}
      <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700">Simbología:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#0B2340] border border-aurea-copper/40" />
            <span className="text-slate-800 font-medium">Ocupada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 border border-amber-600" />
            <span>Cuenta Pedida</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-dashed border-sky-400 bg-sky-50" />
            <span>Reserva</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-1 rounded bg-slate-200 text-slate-700 font-semibold">
              🔗
            </span>
            <span>Mesas Unidas</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Toca cualquier mesa ocupada para desplegar el panel de comanda
        </div>
      </div>
    </div>
  );
};
