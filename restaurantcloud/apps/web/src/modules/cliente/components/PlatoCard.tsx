import React from 'react';
import { motion } from 'framer-motion';
import { formatPEN } from '@/shared/utils';
import { Eye, AlertCircle } from 'lucide-react';
import type { ProductoPublicoDTO } from '@/types/carta';

interface PlatoCardProps {
  plato: ProductoPublicoDTO;
  onOpenModal: (plato: ProductoPublicoDTO) => void;
}

export const PlatoCard: React.FC<PlatoCardProps> = ({ plato, onOpenModal }) => {
  const isAgotado = plato.disponibilidad === 'agotado';

  return (
    <motion.div
      whileHover={!isAgotado ? { y: -4, scale: 1.01 } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpenModal(plato)}
      className={`rounded-2xl bg-white border-2 transition-all cursor-pointer relative overflow-hidden flex flex-row lg:flex-col select-none ${
        isAgotado
          ? 'border-slate-200 bg-slate-50/70 opacity-75'
          : 'border-aurea-copper/25 shadow-sm hover:shadow-md hover:border-aurea-copper/50'
      }`}
      style={{ perspective: 800 }}
    >
      {/* 1. Imagen del Plato (lateral en smartphone, cabecera panorámica en desktop grid) */}
      {plato.foto_url && (
        <div className="w-28 sm:w-32 lg:w-full h-28 sm:h-32 lg:h-44 shrink-0 bg-aurea-ivory relative border-r lg:border-r-0 lg:border-b border-aurea-copper/20 overflow-hidden order-2 lg:order-1">
          <img
            src={plato.foto_url}
            alt={plato.nombre}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isAgotado ? 'grayscale filter' : 'hover:scale-105'
            }`}
            loading="lazy"
          />

          {isAgotado && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 text-center backdrop-blur-[1px]">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-rose-600/90 px-2 py-0.5 rounded shadow">
                Agotado
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Contenido Textual del Plato */}
      <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 min-w-0 order-1 lg:order-2">
        <div className="space-y-1.5">
          {/* Badge condicional de Agotado */}
          {isAgotado && (
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                Agotado por hoy
              </span>
            </div>
          )}

          <h3
            className={`font-serif text-base sm:text-lg font-bold leading-snug line-clamp-2 ${
              isAgotado ? 'text-slate-500 line-through decoration-rose-400' : 'text-aurea-navy'
            }`}
          >
            {plato.nombre}
          </h3>

          {plato.descripcion && (
            <p className="font-sans text-xs text-aurea-navy/70 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {plato.descripcion}
            </p>
          )}
        </div>

        {/* Precio y Llamado a inspección visual (CERO botón de compra) */}
        <div className="pt-3 mt-3 border-t border-aurea-copper/15 flex items-center justify-between">
          <span
            className={`font-sans font-bold text-base sm:text-lg ${
              isAgotado ? 'text-slate-400' : 'text-aurea-navy'
            }`}
          >
            {formatPEN(plato.precio)}
          </span>

          <span className="text-[11px] text-aurea-copper font-medium flex items-center gap-1 bg-aurea-champagne/25 hover:bg-aurea-champagne/40 px-2.5 py-1 rounded-lg transition-colors">
            <Eye className="w-3.5 h-3.5" />
            <span>Detalles</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
