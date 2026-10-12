import React from 'react';
import { Tag, Check, Sparkles } from 'lucide-react';
import type { PromocionSedeDTO } from '../../../../types/mozo';

interface PromocionComercialSelectorProps {
  promocionesDisponibles: PromocionSedeDTO[];
  promocionSeleccionada: PromocionSedeDTO | null;
  onSeleccionarPromocion: (promocion: PromocionSedeDTO | null) => void;
  consumoBruto: number;
}

export const PromocionComercialSelector: React.FC<PromocionComercialSelectorProps> = ({
  promocionesDisponibles,
  promocionSeleccionada,
  onSeleccionarPromocion,
  consumoBruto,
}) => {
  return (
    <div className="bg-[#0B2340]/90 rounded-xl border border-[#D5A06F]/30 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-[#D5A06F]" />
          <h2 className="text-sm font-semibold tracking-wide text-[#FFF9F0] uppercase font-sans">
            Promociones & Descuentos de Sede
          </h2>
        </div>
        <span className="text-[11px] text-[#D5A06F] bg-[#D5A06F]/10 px-2 py-0.5 rounded border border-[#D5A06F]/20 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> 1-Click
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Opción Sin Descuento */}
        <button
          type="button"
          onClick={() => onSeleccionarPromocion(null)}
          className={`p-3 rounded-lg border text-left transition-all relative ${
            promocionSeleccionada === null
              ? 'bg-[#D5A06F]/20 border-[#D5A06F] text-white shadow-md ring-1 ring-[#D5A06F]'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Sin Descuento</span>
            {promocionSeleccionada === null && (
              <Check className="w-3.5 h-3.5 text-[#D5A06F]" />
            )}
          </div>
          <p className="text-[11px] text-slate-400">Tarifa plena regular</p>
          <span className="text-xs font-bold text-slate-200 mt-2 block">
            S/ 0.00
          </span>
        </button>

        {/* Lista de Promociones de la Sede */}
        {promocionesDisponibles.map((promo) => {
          const isSelected = promocionSeleccionada?.id === promo.id;
          const montoAhorro = Math.round(consumoBruto * (promo.porcentaje_descuento / 100) * 100) / 100;

          return (
            <button
              key={promo.id}
              type="button"
              onClick={() => onSeleccionarPromocion(promo)}
              className={`p-3 rounded-lg border text-left transition-all relative ${
                isSelected
                  ? 'bg-[#D5A06F]/20 border-[#D5A06F] text-white shadow-md ring-1 ring-[#D5A06F]'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold truncate pr-2">{promo.nombre}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#D5A06F] shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{promo.descripcion}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {promo.porcentaje_descuento}% OFF
                </span>
                <span className="text-xs font-bold text-emerald-300">
                  -S/ {montoAhorro.toFixed(2)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
