import React from 'react';
import { Search, X, Users, UtensilsCrossed, ChefHat, Banknote } from 'lucide-react';
import { MetricasPersonalDTO } from '@/types/admin';

interface PersonalToolbarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  rolSeleccionado: string;
  onRolChange: (rol: string) => void;
  estadoSeleccionado: string;
  onEstadoChange: (estado: string) => void;
  metricas?: MetricasPersonalDTO;
  totalFiltrados: number;
}

export const PersonalToolbar: React.FC<PersonalToolbarProps> = ({
  busqueda,
  onBusquedaChange,
  rolSeleccionado,
  onRolChange,
  estadoSeleccionado,
  onEstadoChange,
  metricas,
  totalFiltrados,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-aurea-champagne/80 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Buscador reactivo */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por nombre, correo o celular..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm border border-aurea-champagne bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper transition-all"
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-aurea-navy/40 hover:text-aurea-navy transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Estado */}
        <div className="flex items-center gap-1.5 self-start lg:self-center">
          <span className="text-xs text-aurea-navy/60 font-medium mr-1 hidden sm:inline">
            Estado:
          </span>
          {(['todos', 'activo', 'inactivo'] as const).map((est) => (
            <button
              key={est}
              onClick={() => onEstadoChange(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                estadoSeleccionado === est
                  ? 'bg-aurea-navy text-white shadow-xs'
                  : 'bg-slate-100 text-aurea-navy/70 hover:bg-slate-200'
              }`}
            >
              {est === 'todos' ? 'Todos' : est === 'activo' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Pestañas de Roles Operativos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
        <button
          onClick={() => onRolChange('todos')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            rolSeleccionado === 'todos'
              ? 'bg-aurea-copper text-white shadow-xs'
              : 'bg-white text-aurea-navy/70 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Todos los Colaboradores</span>
          {metricas && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                rolSeleccionado === 'todos'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-aurea-navy/80'
              }`}
            >
              {metricas.total_empleados}
            </span>
          )}
        </button>

        <button
          onClick={() => onRolChange('mozo')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            rolSeleccionado === 'mozo'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-900/80 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-blue-500" />
          <span>Mozos de Salón</span>
          {metricas && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                rolSeleccionado === 'mozo'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {metricas.mozos_activos}
            </span>
          )}
        </button>

        <button
          onClick={() => onRolChange('cocina')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            rolSeleccionado === 'cocina'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-950/80 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5 text-amber-500" />
          <span>Equipo de Cocina (KDS)</span>
          {metricas && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                rolSeleccionado === 'cocina'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {metricas.cocina_activos}
            </span>
          )}
        </button>

        <button
          onClick={() => onRolChange('cajero')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            rolSeleccionado === 'cajero'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-950/80 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cajeros en Turno</span>
          {metricas && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                rolSeleccionado === 'cajero'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {metricas.cajeros_activos}
            </span>
          )}
        </button>

        <span className="ml-auto text-xs text-aurea-navy/60 font-medium whitespace-nowrap">
          Mostrando {totalFiltrados} registros
        </span>
      </div>
    </div>
  );
};
