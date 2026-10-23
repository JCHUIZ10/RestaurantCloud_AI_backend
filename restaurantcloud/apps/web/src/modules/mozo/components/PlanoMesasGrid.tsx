import React from 'react';
import { Utensils } from 'lucide-react';
import { MesaCardDTO } from '@/types/mozo';
import { MesaCard } from './MesaCard';

interface PlanoMesasGridProps {
  mesas: MesaCardDTO[];
  onSeleccionarMesa: (mesa: MesaCardDTO) => void;
  onAbrirMesaRapido: (mesa: MesaCardDTO) => void;
  onAtenderQuiebre?: (mesa: MesaCardDTO) => void;
  mesaSeleccionadaId?: string | null;
}

export const PlanoMesasGrid: React.FC<PlanoMesasGridProps> = ({
  mesas,
  onSeleccionarMesa,
  onAbrirMesaRapido,
  onAtenderQuiebre,
  mesaSeleccionadaId,
}) => {
  // Estado cuando el piso no registra mesas o no hay resultados con el filtro activo
  if (mesas.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500 mb-4 shadow-sm">
          <Utensils className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-serif text-xl font-bold text-slate-800 mb-2">
          No hay mesas en este ambiente o filtro
        </h3>
        <p className="text-slate-600 text-sm max-w-md leading-relaxed">
          Selecciona otro piso en el menú superior o ajusta los filtros para visualizar las mesas del salón.
        </p>
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
            onAtenderQuiebre={onAtenderQuiebre}
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
