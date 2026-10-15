import React from 'react';
import {
  Search,
  Filter,
  X,
} from 'lucide-react';
import {
  FiltroEstadoPromocion,
  FiltroTipoPromocion,
} from '@/types/admin';

interface PromocionesFiltrosProps {
  filtroEstado: FiltroEstadoPromocion;
  onChangeFiltroEstado: (estado: FiltroEstadoPromocion) => void;
  filtroTipo: FiltroTipoPromocion;
  onChangeFiltroTipo: (tipo: FiltroTipoPromocion) => void;
  busqueda: string;
  onBuscar: (busqueda: string) => void;
  onLimpiar: () => void;
  conteos: {
    todas: number;
    vigentes: number;
    programadas: number;
    pausadas: number;
    vencidas: number;
    agotadas: number;
  };
}

export const PromocionesFiltros: React.FC<PromocionesFiltrosProps> = ({
  filtroEstado,
  onChangeFiltroEstado,
  filtroTipo,
  onChangeFiltroTipo,
  busqueda,
  onBuscar,
  onLimpiar,
  conteos,
}) => {
  const [inputBusqueda, setInputBusqueda] = React.useState(busqueda);

  // Sincronizar si el valor externo cambia (ej. al restaurar o cambiar sede)
  React.useEffect(() => {
    setInputBusqueda(busqueda);
  }, [busqueda]);

  const handleEjecutarBusqueda = () => {
    onBuscar(inputBusqueda);
  };

  const handleLimpiar = () => {
    setInputBusqueda('');
    onLimpiar();
  };

  const pills: {
    key: FiltroEstadoPromocion;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { key: 'todas', label: 'Todas', count: conteos.todas },
    { key: 'vigentes', label: 'Vigentes', count: conteos.vigentes, dotColor: 'bg-emerald-500' },
    { key: 'programadas', label: 'Programadas', count: conteos.programadas, dotColor: 'bg-blue-500' },
    { key: 'pausadas', label: 'Pausadas', count: conteos.pausadas, dotColor: 'bg-amber-500' },
    { key: 'vencidas', label: 'Vencidas', count: conteos.vencidas, dotColor: 'bg-slate-400' },
    { key: 'agotadas', label: 'Agotadas', count: conteos.agotadas, dotColor: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Fila 1: Píldoras de Filtro por Estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Estado:
        </span>
        {pills.map((pill) => {
          const activo = filtroEstado === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => onChangeFiltroEstado(pill.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activo
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {pill.dotColor && (
                <span className={`w-2 h-2 rounded-full ${pill.dotColor} ${activo ? 'ring-2 ring-white/30' : ''}`} />
              )}
              <span>{pill.label}</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activo ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-600'
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fila 2: Tipo de Descuento y Buscador Optimizado con Botón */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 border-t border-slate-100">
        {/* Selector de Tipo */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
            Tipo de Descuento:
          </span>
          <select
            value={filtroTipo}
            onChange={(e) => onChangeFiltroTipo(e.target.value as FiltroTipoPromocion)}
            aria-label="Filtrar por tipo de descuento"
            className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="todos">Todos los tipos</option>
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto_fijo">Monto Fijo (S/)</option>
          </select>
        </div>

        {/* Buscador Optimizado con Botón Explícito y Tecla Enter */}
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputBusqueda}
              onChange={(e) => setInputBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEjecutarBusqueda();
                }
              }}
              placeholder="Buscar por nombre comercial, código (PROMO-2026) o presiona Enter..."
              className="w-full text-xs pl-9 pr-9 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400 font-medium text-slate-800"
            />
            {inputBusqueda && (
              <button
                type="button"
                onClick={handleLimpiar}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda y restaurar lista completa"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Explícito de Búsqueda */}
          <button
            type="button"
            onClick={handleEjecutarBusqueda}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            title="Ejecutar búsqueda optimizada"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
