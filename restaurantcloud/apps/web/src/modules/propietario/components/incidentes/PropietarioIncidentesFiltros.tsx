import React from 'react';
import { Search, Building2, RotateCcw, X, EyeOff } from 'lucide-react';
import {
  SedeResumenDTO,
  GravedadIncidente,
  CategoriaIncidente,
  EstadoIncidente,
} from '@/types/propietario';

interface PropietarioIncidentesFiltrosProps {
  sedes: SedeResumenDTO[];
  sedeSeleccionada: string;
  onSelectSede: (id: string) => void;
  gravedad: GravedadIncidente | 'todas';
  onChangeGravedad: (g: GravedadIncidente | 'todas') => void;
  categoria: CategoriaIncidente | 'todas';
  onChangeCategoria: (c: CategoriaIncidente | 'todas') => void;
  estado: EstadoIncidente | 'todos';
  onChangeEstado: (e: EstadoIncidente | 'todos') => void;
  soloNoVistos: boolean;
  onToggleSoloNoVistos: (val: boolean) => void;
  totalNoVistos: number;
  busqueda: string;
  onChangeBusqueda: (text: string) => void;
  onLimpiarFiltros: () => void;
  hayFiltrosActivos: boolean;
}

export const PropietarioIncidentesFiltros: React.FC<PropietarioIncidentesFiltrosProps> = ({
  sedes,
  sedeSeleccionada,
  onSelectSede,
  gravedad,
  onChangeGravedad,
  categoria,
  onChangeCategoria,
  estado,
  onChangeEstado,
  soloNoVistos,
  onToggleSoloNoVistos,
  totalNoVistos,
  busqueda,
  onChangeBusqueda,
  onLimpiarFiltros,
  hayFiltrosActivos,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Fila 1: Selectores de Sede, Gravedad, Categoría, Estado y Checkbox No Vistos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
        {/* Selector de Sede */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Sede Operativa</span>
          </label>
          <select
            value={sedeSeleccionada}
            onChange={(e) => onSelectSede(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper transition-all"
          >
            <option value="todas">Todas las sedes ({sedes.length})</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Gravedad */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Gravedad
          </label>
          <select
            value={gravedad}
            onChange={(e) => onChangeGravedad(e.target.value as any)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper transition-all"
          >
            <option value="todas">Todas las gravedades</option>
            <option value="alta">🔴 Alta (Crítica)</option>
            <option value="media">🟠 Media</option>
            <option value="baja">🔵 Baja</option>
          </select>
        </div>

        {/* Selector de Categoría */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => onChangeCategoria(e.target.value as any)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper transition-all"
          >
            <option value="todas">Todas las categorías</option>
            <option value="servicio_cliente">Servicio al Cliente</option>
            <option value="disciplinario">Disciplinario</option>
            <option value="rotura_merma">Rotura o Merma</option>
            <option value="seguridad_higiene">Seguridad e Higiene</option>
            <option value="caja_dinero">Caja o Dinero</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Selector de Estado */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Estado
          </label>
          <select
            value={estado}
            onChange={(e) => onChangeEstado(e.target.value as any)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper transition-all"
          >
            <option value="todos">Todos los estados</option>
            <option value="abierto">Abierto</option>
            <option value="en_revision">En Revisión</option>
            <option value="resuelto">Resuelto</option>
          </select>
        </div>

        {/* Toggle 'Solo no revisados por mí' */}
        <div className="flex items-center h-10">
          <label className="w-full flex items-center justify-between sm:justify-start gap-2.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 cursor-pointer transition-colors text-xs font-bold text-amber-900 select-none">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={soloNoVistos}
                onChange={(e) => onToggleSoloNoVistos(e.target.checked)}
                className="w-4 h-4 rounded text-aurea-copper border-slate-300 focus:ring-aurea-copper cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                Solo no revisados
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-200/90 text-amber-950 font-mono">
              {totalNoVistos}
            </span>
          </label>
        </div>
      </div>

      {/* Fila 2: Búsqueda textual y botón de limpiar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onChangeBusqueda(e.target.value)}
            placeholder="Buscar por asunto, involucrado, código..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-aurea-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper transition-all"
          />
          {busqueda && (
            <button
              onClick={() => onChangeBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hayFiltrosActivos && (
          <button
            onClick={onLimpiarFiltros}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-aurea-navy transition-colors self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar todos los filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
