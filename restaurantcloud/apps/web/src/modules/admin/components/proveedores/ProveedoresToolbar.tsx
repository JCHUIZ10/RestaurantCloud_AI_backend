import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface ProveedoresToolbarProps {
  busqueda: string;
  onBuscar: (texto: string) => void;
  estadoFiltro: 'activos' | 'inactivos' | 'todos';
  onChangeEstadoFiltro: (estado: 'activos' | 'inactivos' | 'todos') => void;
  conteos: {
    activos: number;
    inactivos: number;
    todos: number;
  };
}

export const ProveedoresToolbar: React.FC<ProveedoresToolbarProps> = ({
  busqueda,
  onBuscar,
  estadoFiltro,
  onChangeEstadoFiltro,
  conteos,
}) => {
  const [inputLocal, setInputLocal] = useState(busqueda);

  useEffect(() => {
    setInputLocal(busqueda);
  }, [busqueda]);

  const handleEjecutarBusqueda = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onBuscar(inputLocal);
  };

  const handleLimpiar = () => {
    setInputLocal('');
    onBuscar('');
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-aurea-champagne/80 shadow-sm">
      {/* Buscador reactivo y explícito */}
      <form onSubmit={handleEjecutarBusqueda} className="relative flex-1 max-w-md flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputLocal}
            onChange={(e) => setInputLocal(e.target.value)}
            placeholder="Buscar proveedor o insumo que vende..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-aurea-ivory/40 border border-aurea-copper/20 rounded-xl focus:outline-none focus:border-aurea-copper focus:bg-white text-aurea-navy placeholder:text-aurea-navy/40 transition-all"
          />
          {inputLocal && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-aurea-navy/40 hover:text-aurea-navy transition-colors p-0.5 rounded-md"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-semibold transition-all shadow-sm shrink-0"
        >
          Buscar
        </button>
      </form>

      {/* Selector de Estado Rápido (Tabs) */}
      <div className="flex items-center gap-1.5 bg-aurea-ivory/60 p-1 rounded-xl border border-aurea-copper/20 self-start sm:self-auto overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => onChangeEstadoFiltro('activos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            estadoFiltro === 'activos'
              ? 'bg-white text-aurea-navy shadow-sm'
              : 'text-aurea-navy/60 hover:text-aurea-navy hover:bg-white/50'
          }`}
        >
          <span>Activos</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              estadoFiltro === 'activos'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-black/5 text-aurea-navy/60'
            }`}
          >
            {conteos.activos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeEstadoFiltro('inactivos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            estadoFiltro === 'inactivos'
              ? 'bg-white text-aurea-navy shadow-sm'
              : 'text-aurea-navy/60 hover:text-aurea-navy hover:bg-white/50'
          }`}
        >
          <span>Inactivos</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              estadoFiltro === 'inactivos'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-black/5 text-aurea-navy/60'
            }`}
          >
            {conteos.inactivos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeEstadoFiltro('todos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            estadoFiltro === 'todos'
              ? 'bg-white text-aurea-navy shadow-sm'
              : 'text-aurea-navy/60 hover:text-aurea-navy hover:bg-white/50'
          }`}
        >
          <span>Todos</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              estadoFiltro === 'todos'
                ? 'bg-aurea-champagne text-aurea-navy'
                : 'bg-black/5 text-aurea-navy/60'
            }`}
          >
            {conteos.todos}
          </span>
        </button>
      </div>
    </div>
  );
};
