import React from 'react';
import { Search, X, Users, Clock, UserX, ShieldCheck } from 'lucide-react';

export type TabEstadoAdmin = 'activos' | 'pendientes' | 'desactivados' | 'todos';

export interface ConteosAdminDTO {
  activos: number;
  pendientes: number;
  desactivados: number;
  todos: number;
}

interface AdminsFiltrosBarProps {
  tabActivo: TabEstadoAdmin;
  onTabChange: (tab: TabEstadoAdmin) => void;
  conteos: ConteosAdminDTO;
  busqueda: string;
  onBusquedaChange: (texto: string) => void;
  onLimpiarBusqueda: () => void;
}

export const AdminsFiltrosBar: React.FC<AdminsFiltrosBarProps> = ({
  tabActivo,
  onTabChange,
  conteos,
  busqueda,
  onBusquedaChange,
  onLimpiarBusqueda,
}) => {
  interface TabDef {
    id: TabEstadoAdmin;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    highlight?: boolean;
  }

  const tabs: TabDef[] = [
    {
      id: 'activos',
      label: 'Activos',
      count: conteos.activos,
      icon: ShieldCheck,
    },
    {
      id: 'pendientes',
      label: 'Pendientes',
      count: conteos.pendientes,
      icon: Clock,
      highlight: conteos.pendientes > 0,
    },
    {
      id: 'desactivados',
      label: 'Desactivados',
      count: conteos.desactivados,
      icon: UserX,
    },
    {
      id: 'todos',
      label: 'Todos',
      count: conteos.todos,
      icon: Users,
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-aurea-copper/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all">
      {/* 1. Control Segmentado tipo Pill-Tabs */}
      <div
        role="tablist"
        aria-label="Filtro por estado de administrador"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
      >
        {tabs.map((tab) => {
          const esActivo = tabActivo === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={esActivo}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 select-none active:scale-[0.98] ${
                esActivo
                  ? 'bg-aurea-navy text-white shadow-sm border border-aurea-navy'
                  : 'bg-white text-aurea-navy/70 border border-aurea-copper/25 hover:bg-aurea-champagne/20 hover:text-aurea-navy'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  esActivo
                    ? 'text-aurea-copper'
                    : tab.highlight
                    ? 'text-amber-600'
                    : 'text-aurea-navy/50'
                }`}
              />
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                  esActivo
                    ? 'bg-aurea-copper text-aurea-navy'
                    : tab.highlight
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-aurea-champagne/40 text-aurea-navy/80'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Buscador en Tiempo Real por Nombre, Correo o Sede */}
      <div className="relative w-full md:w-80 lg:w-96 shrink-0">
        <Search className="w-4 h-4 text-aurea-copper absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar por nombre, correo o sede..."
          aria-label="Buscar administrador"
          className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-white border border-aurea-copper/30 focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper text-aurea-navy placeholder:text-aurea-navy/40 transition-all font-sans"
        />
        {busqueda && (
          <button
            type="button"
            onClick={onLimpiarBusqueda}
            title="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-aurea-navy/40 hover:text-aurea-navy p-0.5 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
