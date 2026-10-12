import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Lock, Flame, Zap } from 'lucide-react';
import { ProductoCatalogoMozoDTO, CategoriaCatalogoDTO } from '@/types/mozo';

interface CatalogoCartaGridProps {
  categorias: CategoriaCatalogoDTO[];
  productos: ProductoCatalogoMozoDTO[];
  onAgregarItem: (producto: ProductoCatalogoMozoDTO) => void;
}

export const CatalogoCartaGrid: React.FC<CatalogoCartaGridProps> = ({
  categorias,
  productos,
  onAgregarItem,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState<string>('');

  // Filtrado reactivo de productos
  const productosFiltrados = useMemo(() => {
    let lista = productos;

    if (categoriaSeleccionada !== 'todas') {
      lista = lista.filter((p) => p.categoria_id === categoriaSeleccionada);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          p.categoria_nombre.toLowerCase().includes(q)
      );
    }

    return lista;
  }, [productos, categoriaSeleccionada, busqueda]);

  const totalTodos = productos.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 border-r border-slate-200">
      {/* 1. Barra de Búsqueda y Filtros de Categoría */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
        {/* Buscador táctil */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato, postre o bebida en la carta..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:bg-white transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pestañas de categorías desplazables horizontalmente */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoriaSeleccionada('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all touch-manipulation flex items-center gap-1.5 ${
              categoriaSeleccionada === 'todas'
                ? 'bg-aurea-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-aurea-copper text-aurea-navy font-bold'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totalTodos}
            </span>
          </button>

          {categorias.map((cat) => {
            const isSelected = categoriaSeleccionada === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all touch-manipulation flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-aurea-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.nombre}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-aurea-copper text-aurea-navy font-bold'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Grilla de Platos y Productos */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {productosFiltrados.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Search className="w-8 h-8 mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron productos</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando la búsqueda o seleccionando otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {productosFiltrados.map((prod) => {
              const estaAgotado = prod.disponibilidad === 'agotado';

              return (
                <div
                  key={prod.id}
                  className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                    estaAgotado
                      ? 'border-slate-200 opacity-60 bg-slate-50/70 select-none'
                      : 'border-slate-200 hover:border-aurea-copper/50 hover:shadow-md'
                  }`}
                >
                  {/* Cabecera de la tarjeta: Título y Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug">
                        {prod.nombre}
                      </h3>

                      {/* Badge de tipo de preparación */}
                      {prod.requiere_preparacion ? (
                        <span
                          className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200"
                          title="Requiere cocción en KDS"
                        >
                          <Flame className="w-2.5 h-2.5" />
                          <span>Cocina</span>
                        </span>
                      ) : (
                        <span
                          className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"
                          title="Entrega directa sin pase de cocina"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          <span>Directo</span>
                        </span>
                      )}
                    </div>

                    {/* Descripción del plato */}
                    {prod.descripcion && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {prod.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Pie de tarjeta: Precio y Botón Táctil */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm sm:text-base font-extrabold text-aurea-navy">
                        S/ {prod.precio.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {estaAgotado ? 'Sin stock' : 'IGV incluido'}
                      </span>
                    </div>

                    {estaAgotado ? (
                      <button
                        disabled
                        className="py-1.5 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Agotado</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onAgregarItem(prod)}
                        className="min-h-[38px] py-1.5 px-3.5 rounded-lg bg-aurea-navy hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs touch-manipulation"
                      >
                        <Plus className="w-3.5 h-3.5 text-aurea-copper" />
                        <span>Añadir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
