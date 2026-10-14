import React from 'react';
import {
  Search,
  Filter,
  X,
} from 'lucide-react';
import {
  CategoriaIncidente,
  GravedadIncidente,
  EstadoIncidente,
  FiltrosIncidentesRequest,
  EmpleadoDetalleDTO,
} from '@/types/admin';

interface IncidentesFiltrosProps {
  filtros: FiltrosIncidentesRequest;
  onCambiarFiltro: <K extends keyof FiltrosIncidentesRequest>(
    campo: K,
    valor: FiltrosIncidentesRequest[K]
  ) => void;
  onLimpiarFiltros: () => void;
  empleados: EmpleadoDetalleDTO[];
}

export const IncidentesFiltros: React.FC<IncidentesFiltrosProps> = ({
  filtros,
  onCambiarFiltro,
  onLimpiarFiltros,
  empleados,
}) => {
  const hayFiltrosActivos = Boolean(
    (filtros.estado && filtros.estado !== 'todos') ||
      (filtros.gravedad && filtros.gravedad !== 'todas') ||
      (filtros.categoria && filtros.categoria !== 'todas') ||
      filtros.empleado_id ||
      (filtros.busqueda && filtros.busqueda.trim() !== '')
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
        <div className="flex items-center gap-2 text-xs font-bold text-aurea-navy uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Filtros y Búsqueda Operativa</span>
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar Filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {/* Filtro 1: Estado */}
        <div>
          <label htmlFor="filtro-estado" className="block text-[11px] font-semibold text-stone-600 mb-1">
            Estado del Caso:
          </label>
          <select
            id="filtro-estado"
            value={filtros.estado || 'todos'}
            onChange={(e) => onCambiarFiltro('estado', e.target.value as EstadoIncidente | 'todos')}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:bg-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="abierto">Abiertos (Pendientes)</option>
            <option value="en_revision">En Investigación</option>
            <option value="resuelto">Resueltos (Archivados)</option>
          </select>
        </div>

        {/* Filtro 2: Gravedad */}
        <div>
          <label htmlFor="filtro-gravedad" className="block text-[11px] font-semibold text-stone-600 mb-1">
            Nivel de Gravedad:
          </label>
          <select
            id="filtro-gravedad"
            value={filtros.gravedad || 'todas'}
            onChange={(e) => onCambiarFiltro('gravedad', e.target.value as GravedadIncidente | 'todas')}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:bg-white"
          >
            <option value="todas">Todas las gravedades</option>
            <option value="baja">Baja (Menor)</option>
            <option value="media">Media (Intermedia)</option>
            <option value="alta">Alta (Crítica / SSE)</option>
          </select>
        </div>

        {/* Filtro 3: Categoría */}
        <div>
          <label htmlFor="filtro-categoria" className="block text-[11px] font-semibold text-stone-600 mb-1">
            Categoría:
          </label>
          <select
            id="filtro-categoria"
            value={filtros.categoria || 'todas'}
            onChange={(e) => onCambiarFiltro('categoria', e.target.value as CategoriaIncidente | 'todas')}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:bg-white"
          >
            <option value="todas">Todas las categorías</option>
            <option value="caja_dinero">Caja / Dinero</option>
            <option value="rotura_merma">Rotura / Merma</option>
            <option value="servicio_cliente">Servicio al Cliente</option>
            <option value="disciplinario">Disciplinario</option>
            <option value="seguridad_higiene">Seguridad e Higiene</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Filtro 4: Colaborador */}
        <div>
          <label htmlFor="filtro-colaborador" className="block text-[11px] font-semibold text-stone-600 mb-1">
            Colaborador Involucrado:
          </label>
          <select
            id="filtro-colaborador"
            value={filtros.empleado_id || ''}
            onChange={(e) => onCambiarFiltro('empleado_id', e.target.value || undefined)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:bg-white"
          >
            <option value="">Todos los colaboradores</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} ({emp.rol.charAt(0).toUpperCase() + emp.rol.slice(1)})
              </option>
            ))}
          </select>
        </div>

        {/* Filtro 5: Buscador rápido */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
          <label htmlFor="filtro-busqueda" className="block text-[11px] font-semibold text-stone-600 mb-1">
            Búsqueda rápida:
          </label>
          <div className="relative">
            <input
              id="filtro-busqueda"
              type="text"
              placeholder="Buscar asunto, código..."
              value={filtros.busqueda || ''}
              onChange={(e) => onCambiarFiltro('busqueda', e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 font-medium placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
