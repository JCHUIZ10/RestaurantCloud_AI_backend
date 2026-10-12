import React from 'react';
import { LayoutGrid, Wifi, Filter, UtensilsCrossed } from 'lucide-react';
import { PisoAmbienteDTO } from '@/types/mozo';

export type FiltroMesaTipo = 'todas' | 'mis_mesas' | 'libres' | 'ocupadas';

interface SalonHeaderMozoProps {
  pisos: PisoAmbienteDTO[];
  pisoActivoId: string;
  onSeleccionarPiso: (pisoId: string) => void;
  filtroActivo: FiltroMesaTipo;
  onCambiarFiltro: (filtro: FiltroMesaTipo) => void;
  misMesasCount: number;
  totalMesasCount: number;
  libresCount: number;
  ocupadasCount: number;
  mozoNombre: string;
}

export const SalonHeaderMozo: React.FC<SalonHeaderMozoProps> = ({
  pisos,
  pisoActivoId,
  onSeleccionarPiso,
  filtroActivo,
  onCambiarFiltro,
  misMesasCount,
  totalMesasCount,
  libresCount,
  ocupadasCount,
  mozoNombre,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm shrink-0">
      {/* Fila 1: Pestañas de Ambientes y Disponibilidad de Mesas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Selector de Pisos / Ambientes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Ambiente:
          </span>
          {pisos.map((piso) => {
            const isActive = piso.id === pisoActivoId;
            return (
              <button
                key={piso.id}
                onClick={() => onSeleccionarPiso(piso.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all touch-manipulation ${
                  isActive
                    ? 'bg-aurea-navy text-white shadow-sm font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <span>{piso.nombre}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-aurea-copper text-aurea-navy font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {piso.total_mesas}
                </span>
              </button>
            );
          })}
        </div>

        {/* Disponibilidad de Mesas del Piso en Vivo e Info de Mozo */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
            <LayoutGrid className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
            <span className="text-slate-500 font-medium">Mesas en piso:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {libresCount} Libres
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 text-slate-700 font-semibold font-mono">
              {ocupadasCount} Ocupadas
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline font-medium">
              (de {totalMesasCount})
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Wifi className="w-3 h-3" />
            <span>SSE Activo</span>
          </div>
        </div>
      </div>

      {/* Fila 2: Filtros de Foco Operativo Táctil */}
      <div className="flex items-center justify-between gap-2 pt-2.5 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />

          {/* Filtro: Mis Mesas Asignadas */}
          <button
            onClick={() => onCambiarFiltro('mis_mesas')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filtroActivo === 'mis_mesas'
                ? 'bg-aurea-copper text-aurea-navy font-bold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Mis Mesas ({misMesasCount})</span>
          </button>

          {/* Filtro: Todo el Salón */}
          <button
            onClick={() => onCambiarFiltro('todas')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filtroActivo === 'todas'
                ? 'bg-aurea-navy text-white font-semibold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todo el Salón ({totalMesasCount})
          </button>

          {/* Filtro: Solo Libres */}
          <button
            onClick={() => onCambiarFiltro('libres')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filtroActivo === 'libres'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Libres ({libresCount})
          </button>

          {/* Filtro: Solo Ocupadas */}
          <button
            onClick={() => onCambiarFiltro('ocupadas')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filtroActivo === 'ocupadas'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ocupadas ({ocupadasCount})
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Mozo en turno:</span>
          <strong className="text-slate-800">{mozoNombre}</strong>
        </div>
      </div>
    </div>
  );
};
