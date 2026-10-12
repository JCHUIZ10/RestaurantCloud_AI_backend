import React from 'react';
import { Filter } from 'lucide-react';

export type FiltroReservaEstado = 'todas' | 'en_espera' | 'atendidas' | 'inasistencias';

interface ReservasFiltrosPillsProps {
  filtroActivo: FiltroReservaEstado;
  onCambiarFiltro: (filtro: FiltroReservaEstado) => void;
  conteos: {
    todas: number;
    enEspera: number;
    atendidas: number;
    inasistencias: number;
  };
}

export const ReservasFiltrosPills: React.FC<ReservasFiltrosPillsProps> = ({
  filtroActivo,
  onCambiarFiltro,
  conteos,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 hidden sm:flex">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span>Filtrar:</span>
      </div>

      {/* Pill: Todas */}
      <button
        onClick={() => onCambiarFiltro('todas')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          filtroActivo === 'todas'
            ? 'bg-aurea-navy text-white shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Todas ({conteos.todas})
      </button>

      {/* Pill: Confirmadas / En Espera */}
      <button
        onClick={() => onCambiarFiltro('en_espera')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          filtroActivo === 'en_espera'
            ? 'bg-sky-700 text-white shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Confirmadas / En Espera ({conteos.enEspera})
      </button>

      {/* Pill: Atendidas */}
      <button
        onClick={() => onCambiarFiltro('atendidas')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          filtroActivo === 'atendidas'
            ? 'bg-emerald-700 text-white shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Atendidas ({conteos.atendidas})
      </button>

      {/* Pill: Inasistencia / Canceladas */}
      <button
        onClick={() => onCambiarFiltro('inasistencias')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          filtroActivo === 'inasistencias'
            ? 'bg-rose-700 text-white shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Inasistencias / Canceladas ({conteos.inasistencias})
      </button>
    </div>
  );
};
