import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { CategoriaAdminDTO } from '@/types/admin';

interface ProductosToolbarProps {
  categorias: CategoriaAdminDTO[];
  categoriaSeleccionada: string; // 'todas' o id de categoría
  onSeleccionarCategoria: (id: string) => void;
  disponibilidadSeleccionada: 'todos' | 'disponible' | 'agotado';
  onSeleccionarDisponibilidad: (disp: 'todos' | 'disponible' | 'agotado') => void;
  busquedaActiva: string;
  onBuscar: (termino: string) => void;
  totalProductos: number;
}

export const ProductosToolbar: React.FC<ProductosToolbarProps> = ({
  categorias,
  categoriaSeleccionada,
  onSeleccionarCategoria,
  disponibilidadSeleccionada,
  onSeleccionarDisponibilidad,
  busquedaActiva,
  onBuscar,
  totalProductos,
}) => {
  const [terminoLocal, setTerminoLocal] = useState(busquedaActiva);

  const handleEjecutarBusqueda = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onBuscar(terminoLocal.trim());
  };

  const handleLimpiarBusqueda = () => {
    setTerminoLocal('');
    onBuscar('');
  };

  return (
    <div className="bg-white rounded-2xl border border-aurea-champagne/40 p-4 shadow-sm space-y-4">
      {/* Fila Superior: Buscador y Filtro de Disponibilidad */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Buscador Explícito (0 Over-fetching) */}
        <form
          onSubmit={handleEjecutarBusqueda}
          className="flex items-center gap-2 flex-1 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={terminoLocal}
              onChange={(e) => setTerminoLocal(e.target.value)}
              placeholder="Buscar plato, ingrediente o descripción..."
              className="w-full pl-9 pr-9 py-2 rounded-xl text-sm border border-aurea-champagne/60 focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 outline-none transition-all"
            />
            {terminoLocal && (
              <button
                type="button"
                onClick={handleLimpiarBusqueda}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aurea-navy/40 hover:text-aurea-navy p-0.5 rounded-full hover:bg-black/5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-sm font-medium transition-all shrink-0 min-h-[38px]"
          >
            Buscar
          </button>
        </form>

        {/* Filtro de Disponibilidad Operativa */}
        <div className="flex items-center gap-1.5 self-start md:self-auto bg-aurea-champagne/20 p-1 rounded-xl border border-aurea-champagne/40">
          <button
            type="button"
            onClick={() => onSeleccionarDisponibilidad('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              disponibilidadSeleccionada === 'todos'
                ? 'bg-white text-aurea-navy font-semibold shadow-xs'
                : 'text-aurea-navy/70 hover:text-aurea-navy'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onSeleccionarDisponibilidad('disponible')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              disponibilidadSeleccionada === 'disponible'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            Disponibles
          </button>
          <button
            type="button"
            onClick={() => onSeleccionarDisponibilidad('agotado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              disponibilidadSeleccionada === 'agotado'
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'text-rose-700 hover:text-rose-800'
            }`}
          >
            Agotados
          </button>
        </div>
      </div>

      {/* Fila Inferior: Pestañas de Categoría */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSeleccionarCategoria('todas')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
            categoriaSeleccionada === 'todas'
              ? 'bg-aurea-copper text-white border-aurea-copper shadow-xs font-semibold'
              : 'bg-white text-aurea-navy/70 border-aurea-champagne/60 hover:border-aurea-copper/40 hover:text-aurea-navy'
          }`}
        >
          Todas ({totalProductos})
        </button>

        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSeleccionarCategoria(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              categoriaSeleccionada === cat.id
                ? 'bg-aurea-copper text-white border-aurea-copper shadow-xs font-semibold'
                : 'bg-white text-aurea-navy/70 border-aurea-champagne/60 hover:border-aurea-copper/40 hover:text-aurea-navy'
            }`}
          >
            {cat.nombre} ({cat.total_productos})
          </button>
        ))}
      </div>
    </div>
  );
};
