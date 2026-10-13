import React from 'react';
import { Search, X, Smartphone } from 'lucide-react';

export type FiltroEstadoCategoria = 'todas' | 'activas' | 'ocultas';

interface CategoriasFiltrosTabsProps {
  filtroEstado: FiltroEstadoCategoria;
  onCambiarFiltroEstado: (estado: FiltroEstadoCategoria) => void;
  busqueda: string;
  onCambiarBusqueda: (texto: string) => void;
  conteos: {
    todas: number;
    activas: number;
    ocultas: number;
  };
}

export const CategoriasFiltrosTabs: React.FC<CategoriasFiltrosTabsProps> = ({
  filtroEstado,
  onCambiarFiltroEstado,
  busqueda,
  onCambiarBusqueda,
  conteos,
}) => {
  const tabs: Array<{ id: FiltroEstadoCategoria; label: string; count: number }> = [
    { id: 'todas', label: 'Todas las Secciones', count: conteos.todas },
    { id: 'activas', label: 'Visibles en Salón', count: conteos.activas },
    { id: 'ocultas', label: 'Ocultas', count: conteos.ocultas },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Pestañas de Filtrado */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-aurea-champagne/40 rounded-xl overflow-x-auto shadow-sm">
          {tabs.map((tab) => {
            const isSelected = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCambiarFiltroEstado(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[40px] ${
                  isSelected
                    ? 'bg-aurea-navy text-white shadow-sm font-semibold'
                    : 'text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20'
                }`}
              >
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

        {/* Buscador reactivo */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full pl-10 pr-9 py-2 bg-white border border-aurea-champagne/50 rounded-xl text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:ring-2 focus:ring-aurea-copper/50 focus:border-aurea-copper transition-all shadow-sm"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => onCambiarBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-aurea-navy/40 hover:text-aurea-navy transition-colors rounded-full"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nota de Usabilidad / Ergonomía de Comanda */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-aurea-champagne/20 border border-aurea-copper/20 text-xs text-aurea-navy/80">
        <Smartphone className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
        <span>
          <strong>Orden de Comanda:</strong> La posición vertical define la secuencia de pestañas que visualizarán los mozos en sus terminales móviles (CU-MOZO-01). Usa los botones <strong>[ ↑ / ↓ ]</strong> o arrastra las filas para reordenar.
        </span>
      </div>
    </div>
  );
};
