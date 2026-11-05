import React from 'react';
import { Building2, Layers, PowerOff } from 'lucide-react';

export type TabEstadoLocal = 'activos' | 'desactivados' | 'todos';

export interface ConteosLocalDTO {
  activos: number;
  desactivados: number;
  todos: number;
}

interface LocalesFiltrosBarProps {
  tabActivo: TabEstadoLocal;
  onTabChange: (tab: TabEstadoLocal) => void;
  conteos: ConteosLocalDTO;
}

export const LocalesFiltrosBar: React.FC<LocalesFiltrosBarProps> = ({
  tabActivo,
  onTabChange,
  conteos,
}) => {
  interface TabDef {
    id: TabEstadoLocal;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }

  const tabs: TabDef[] = [
    {
      id: 'activos',
      label: 'Activos',
      count: conteos.activos,
      icon: Building2,
    },
    {
      id: 'desactivados',
      label: 'Desactivados',
      count: conteos.desactivados,
      icon: PowerOff,
    },
    {
      id: 'todos',
      label: 'Todos',
      count: conteos.todos,
      icon: Layers,
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2.5 sm:p-3 border-2 border-aurea-copper/20 shadow-xs flex items-center justify-between transition-all">
      <div
        role="tablist"
        aria-label="Filtro de estado de sedes"
        className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto"
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
                  ? 'bg-aurea-navy text-white shadow-xs border border-aurea-navy'
                  : 'bg-white text-aurea-navy/70 border border-aurea-copper/25 hover:bg-aurea-champagne/20 hover:text-aurea-navy'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  esActivo ? 'text-aurea-copper' : 'text-aurea-navy/50'
                }`}
              />
              <span>{tab.label}</span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                  esActivo
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-aurea-navy/70'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
