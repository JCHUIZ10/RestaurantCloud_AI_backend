import React from 'react';
import { motion } from 'framer-motion';
import type { CategoriaPublicaDTO } from '@/types/carta';

interface CategoryTabsProps {
  categorias: CategoriaPublicaDTO[];
  categoriaSeleccionada: string;
  onSelectCategoria: (id: string) => void;
  totalPlatos: number;
  layout?: 'horizontal' | 'vertical';
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categorias,
  categoriaSeleccionada,
  onSelectCategoria,
  totalPlatos,
  layout = 'horizontal',
}) => {
  if (layout === 'vertical') {
    return (
      <nav className="flex flex-col gap-1.5 w-full" aria-label="Categorías del menú">
        <button
          onClick={() => onSelectCategoria('todas')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative text-left ${
            categoriaSeleccionada === 'todas'
              ? 'bg-aurea-navy text-white shadow-sm'
              : 'bg-white/80 text-aurea-navy/80 hover:bg-white hover:text-aurea-navy border border-aurea-copper/20'
          }`}
        >
          <span>Todos los platos</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              categoriaSeleccionada === 'todas'
                ? 'bg-white/20 text-white'
                : 'bg-aurea-copper/15 text-aurea-navy'
            }`}
          >
            {totalPlatos}
          </span>
        </button>

        {categorias.map((cat) => {
          const isSelected = categoriaSeleccionada === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategoria(cat.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative text-left ${
                isSelected
                  ? 'bg-aurea-navy text-white shadow-sm'
                  : 'bg-white/80 text-aurea-navy/80 hover:bg-white hover:text-aurea-navy border border-aurea-copper/20'
              }`}
            >
              <span>{cat.nombre}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-aurea-copper/15 text-aurea-navy'
                }`}
              >
                {cat.platos.length}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="sticky top-[57px] z-30 bg-[#FFF9F0]/95 backdrop-blur-md py-2.5 -mx-4 px-4 border-b border-aurea-copper/20 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        {/* Pestaña: Todos los platos */}
        <button
          onClick={() => onSelectCategoria('todas')}
          className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            categoriaSeleccionada === 'todas'
              ? 'text-white shadow-sm'
              : 'bg-white/80 text-aurea-navy/70 border border-aurea-copper/20 hover:bg-white'
          }`}
        >
          {categoriaSeleccionada === 'todas' && (
            <motion.div
              layoutId="activeCategoryPill"
              className="absolute inset-0 bg-aurea-navy rounded-full z-0"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10">Todos</span>
          <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full ${
            categoriaSeleccionada === 'todas' ? 'bg-white/20 text-white' : 'bg-black/5 text-aurea-navy/60'
          }`}>
            {totalPlatos}
          </span>
        </button>

        {/* Pestañas por Categoría */}
        {categorias.map((cat) => {
          const isSelected = categoriaSeleccionada === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategoria(cat.id)}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'bg-white/80 text-aurea-navy/70 border border-aurea-copper/20 hover:bg-white'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-aurea-navy rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat.nombre}</span>
              <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-aurea-navy/60'
              }`}>
                {cat.platos.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
