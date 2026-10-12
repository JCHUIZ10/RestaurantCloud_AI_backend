import React from 'react';
import { Receipt, CheckCircle, Clock, Utensils } from 'lucide-react';
import type { PrecuentaItemDTO, EstadoItemCocina } from '../../../../types/mozo';

interface PrecuentaConsolidadoCardProps {
  items: PrecuentaItemDTO[];
}

export const PrecuentaConsolidadoCard: React.FC<PrecuentaConsolidadoCardProps> = ({ items }) => {
  const renderEstadoBadge = (estado: EstadoItemCocina) => {
    switch (estado) {
      case 'entregado':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>Servido</span>
          </span>
        );
      case 'listo':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Utensils className="w-2.5 h-2.5" />
            <span>Listo en pase</span>
          </span>
        );
      case 'en_preparacion':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5" />
            <span>En cocina</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <span>Pendiente</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0B2340]/90 rounded-xl border border-[#D5A06F]/30 shadow-lg overflow-hidden backdrop-blur-sm">
      <div className="px-4 py-3 border-b border-[#D5A06F]/20 bg-[#0B2340] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-[#D5A06F]" />
          <h2 className="text-sm font-semibold tracking-wide text-[#FFF9F0] uppercase font-sans">
            Consumo en Mesa ({items.length} productos)
          </h2>
        </div>
        <span className="text-xs text-slate-400">Detalle digital</span>
      </div>

      <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={`${item.producto_id}-${index}`}
            className="p-3 hover:bg-white/[0.02] transition-colors flex items-start justify-between gap-3 text-sm"
          >
            <div className="flex items-start space-x-3">
              <span className="px-2 py-0.5 rounded bg-[#D5A06F]/20 text-[#F4D7B0] font-bold text-xs border border-[#D5A06F]/40 shrink-0 mt-0.5">
                {item.cantidad}x
              </span>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-100">{item.nombre}</span>
                  {renderEstadoBadge(item.estado_cocina)}
                </div>
                {item.nota_cocina && (
                  <p className="text-xs text-[#D5A06F]/80 italic mt-0.5">
                    Nota: "{item.nota_cocina}"
                  </p>
                )}
                <span className="text-xs text-slate-400">
                  Unit: S/ {item.precio_unitario.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-bold text-slate-200">
                S/ {item.subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No se han registrado consumos en esta mesa.
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-black/20 border-t border-[#D5A06F]/10 flex items-center justify-between text-xs text-slate-400">
        <span>Subtotal acumulado de rondas</span>
        <span className="font-medium text-slate-300">
          {items.reduce((acc, i) => acc + i.cantidad, 0)} unidades registradas
        </span>
      </div>
    </div>
  );
};
