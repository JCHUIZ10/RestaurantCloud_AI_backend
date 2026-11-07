import React from 'react';
import { CheckCircle, Clock, Utensils } from 'lucide-react';
import type { EstadoItemCocina } from '../../../../types/mozo';

interface EstadoCocinaBadgeProps {
  estado: EstadoItemCocina;
}

/** Etiqueta del avance de un plato en cocina: servido, listo en pase, en cocina o pendiente. */
export const EstadoCocinaBadge: React.FC<EstadoCocinaBadgeProps> = ({ estado }) => {
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
