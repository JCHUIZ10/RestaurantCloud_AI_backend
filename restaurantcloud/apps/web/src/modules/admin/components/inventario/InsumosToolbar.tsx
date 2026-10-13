import React, { useEffect, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { ResumenInventarioDTO } from '@/types/admin';

export type FiltroEstadoInsumo = 'activo' | 'agotado' | 'inactivo' | 'todos';

interface InsumosToolbarProps {
  filtroActual: FiltroEstadoInsumo;
  onCambiarFiltro: (filtro: FiltroEstadoInsumo) => void;
  busqueda: string;
  onEjecutarBusqueda: (texto: string) => void;
  kpis: ResumenInventarioDTO;
}

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
    { id: 'activo', label: 'Activos', count: kpis.total_activos, dotColor: 'bg-emerald-500' },
    { id: 'agotado', label: 'Agotados', count: kpis.total_agotados, dotColor: 'bg-rose-500' },
    { id: 'inactivo', label: 'Inactivos', count: kpis.total_inactivos, dotColor: 'bg-zinc-400' },
    { id: 'todos', label: 'Todos', count: totalTodos },
  ];

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onEjecutarBusqueda(textoLocal.trim());
  };

  const handleLimpiar = () => {
    setTextoLocal('');
    onEjecutarBusqueda('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Pestañas de Filtrado por Estado Operativo */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-aurea-champagne/40 rounded-xl overflow-x-auto shadow-sm">
          {tabs.map((tab) => {
            const isSelected = filtroActual === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCambiarFiltro(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[40px] ${
                  isSelected
                    ? 'bg-aurea-navy text-white shadow-sm font-semibold'
                    : 'text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20'
                }`}
              >
                {tab.dotColor && (
                  <span
                    className={`w-2 h-2 rounded-full ${tab.dotColor} ${
                      isSelected ? 'ring-2 ring-white/50' : ''
                    }`}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-aurea-champagne/40 text-aurea-navy'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador explícito con botón y soporte para tecla Enter (Cero sobreconsultas) */}
        <form
          onSubmit={handleBuscar}
          className="flex items-center gap-1.5 w-full md:w-auto shrink-0"
        >
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={textoLocal}
              onChange={(e) => setTextoLocal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBuscar(e);
                }
              }}
              placeholder="Buscar por nombre de insumo..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-white border border-aurea-champagne/60 text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 focus:border-aurea-copper shadow-sm min-h-[40px]"
            />
            {textoLocal.length > 0 && (
              <button
                type="button"
                onClick={handleLimpiar}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-aurea-navy/40 hover:text-aurea-navy rounded-full"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-semibold shadow-sm transition-all min-h-[40px] shrink-0"
            title="Ejecutar búsqueda (Enter)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar</span>
          </button>
        </form>
      </div>

      {/* Nota sutil de contexto */}
      {filtroActual === 'activo' && (
        <div className="flex items-center gap-2 text-xs text-aurea-navy/60 px-1">
          <Filter className="w-3 h-3 text-aurea-copper" />
          <span>
            Mostrando insumos <strong>activos</strong> en bodega. Presiona <strong>Enter</strong> o <strong>[Buscar]</strong> para filtrar.
          </span>
        </div>
      )}
    </div>
  );
};
