import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ResumenInventarioDTO } from '@/types/admin';
import { cn } from '@/shared/utils';

export type FiltroEstadoInsumo = 'activo' | 'agotado' | 'inactivo' | 'todos';

interface InsumosToolbarProps {
  filtroActual: FiltroEstadoInsumo;
  onCambiarFiltro: (filtro: FiltroEstadoInsumo) => void;
  busqueda: string;
  onEjecutarBusqueda: (texto: string) => void;
  kpis: ResumenInventarioDTO;
}

/** Filtros de estado y búsqueda; va dentro de la tarjeta de la tabla. */
export const InsumosToolbar: React.FC<InsumosToolbarProps> = ({
  filtroActual,
  onCambiarFiltro,
  busqueda,
  onEjecutarBusqueda,
  kpis,
}) => {
  // Estado local del input: no realiza consultas mientras se escribe para evitar sobreconsultas
  const [textoLocal, setTextoLocal] = useState(busqueda);

  useEffect(() => {
    setTextoLocal(busqueda);
  }, [busqueda]);

  const totalTodos = kpis.total_activos + kpis.total_agotados + kpis.total_inactivos;

  const tabs: Array<{ id: FiltroEstadoInsumo; label: string; count: number; dotColor?: string }> = [
    { id: 'activo', label: 'Activos', count: kpis.total_activos, dotColor: 'bg-estado-ok-500' },
    { id: 'agotado', label: 'Agotados', count: kpis.total_agotados, dotColor: 'bg-estado-error-500' },
    { id: 'inactivo', label: 'Inactivos', count: kpis.total_inactivos, dotColor: 'bg-tinta-400' },
    { id: 'todos', label: 'Todos', count: totalTodos },
  ];

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    onEjecutarBusqueda(textoLocal.trim());
  };

  const handleLimpiar = () => {
    setTextoLocal('');
    onEjecutarBusqueda('');
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Filtrar por estado"
        className="flex items-center gap-1 p-1 bg-white border border-aurea-champagne/40 rounded-xl overflow-x-auto shadow-sm max-w-full"
      >
        {tabs.map((tab) => {
          const isSelected = filtroActual === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onCambiarFiltro(tab.id)}
              className={cn(
                'min-h-tactil flex items-center gap-2 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                isSelected
                  ? 'bg-aurea-navy text-white shadow-sm font-semibold'
                  : 'text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20'
              )}
            >
              {tab.dotColor && (
                <span
                  className={cn('w-2 h-2 rounded-full', tab.dotColor, isSelected && 'ring-2 ring-white/50')}
                  aria-hidden="true"
                />
              )}
              {tab.label}
              <span
                className={cn(
                  'min-w-[1.5rem] px-1.5 rounded-full text-xs font-bold tabular-nums',
                  isSelected ? 'bg-white/20 text-white' : 'bg-aurea-champagne/40 text-aurea-navy'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Búsqueda explícita: se consulta al pulsar Enter o «Buscar», no en cada tecla */}
      <form onSubmit={handleBuscar} role="search" className="flex items-center gap-2 w-full lg:w-auto lg:min-w-[22rem]">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={textoLocal}
            onChange={(e) => setTextoLocal(e.target.value)}
            placeholder="Buscar insumo por nombre"
            aria-label="Buscar insumo"
            className="w-full min-h-tactil pl-10 pr-11 rounded-xl text-base md:text-sm bg-white border border-aurea-champagne/60 text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 focus:border-aurea-copper shadow-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {textoLocal.length > 0 && (
            <button
              type="button"
              onClick={handleLimpiar}
              aria-label="Limpiar búsqueda"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-tactil min-w-tactil flex items-center justify-center text-aurea-navy/40 hover:text-aurea-navy rounded-xl"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="min-h-tactil inline-flex items-center gap-2 px-4 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Buscar</span>
          <span className="sr-only sm:hidden">Buscar</span>
        </button>
      </form>
    </div>
  );
};
