import React from 'react';
import { Search, User, X, Filter } from 'lucide-react';
import { FiltroRapidoAnulaciones } from '@/types/admin';

interface AnulacionesFiltrosProps {
  filtroRapido: FiltroRapidoAnulaciones;
  onChangeFiltroRapido: (f: FiltroRapidoAnulaciones) => void;
  mozoId: string;
  onChangeMozoId: (id: string) => void;
  mozos: { id: string; nombre: string }[];
  busqueda: string;
  onChangeBusqueda: (text: string) => void;
  conteoFiltros: {
    todas: number;
    pendientes: number;
    con_merma: number;
    sin_merma: number;
    comandas_totales: number;
  };
}

export const AnulacionesFiltros: React.FC<AnulacionesFiltrosProps> = ({
  filtroRapido,
  onChangeFiltroRapido,
  mozoId,
  onChangeMozoId,
  mozos,
  busqueda,
  onChangeBusqueda,
  conteoFiltros,
}) => {
  const pills: { key: FiltroRapidoAnulaciones; label: string; count: number; dotColor?: string }[] = [
    { key: 'todas', label: 'Todas', count: conteoFiltros.todas },
    { key: 'pendientes', label: 'Pendientes de Revisar', count: conteoFiltros.pendientes, dotColor: 'bg-amber-500' },
    { key: 'con_merma', label: 'Con Merma', count: conteoFiltros.con_merma, dotColor: 'bg-rose-500' },
    { key: 'sin_merma', label: 'Sin Merma', count: conteoFiltros.sin_merma, dotColor: 'bg-emerald-500' },
    { key: 'comandas_totales', label: 'Comandas Totales', count: conteoFiltros.comandas_totales },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Fila 1: Píldoras de Filtro Rápido */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filtrar:
        </span>
        {pills.map((pill) => {
          const activo = filtroRapido === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => onChangeFiltroRapido(pill.key)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activo
                  ? 'bg-aurea-navy text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              {pill.dotColor && (
                <span className={`w-2 h-2 rounded-full ${pill.dotColor}`} />
              )}
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activo ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fila 2: Selector de Mozo y Buscador */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        {/* Selector de Mozo */}
        <div className="sm:col-span-1">
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={mozoId}
              onChange={(e) => onChangeMozoId(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper/30 focus:border-aurea-copper transition-all"
            >
              <option value="todos">Todos los mozos</option>
              {mozos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buscador reactivo */}
        <div className="sm:col-span-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => onChangeBusqueda(e.target.value)}
              placeholder="Buscar por plato, mesa, código, justificación..."
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
        </div>
      </div>
    </div>
  );
};
