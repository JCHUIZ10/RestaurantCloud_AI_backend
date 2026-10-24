import React from 'react';
import { MesaAdminDTO } from '@/types/admin';
import { Users, Link2, Edit3, AlertCircle } from 'lucide-react';

interface MesaAdminCardProps {
  mesa: MesaAdminDTO;
  onEditarMesa: (mesa: MesaAdminDTO) => void;
}

export const MesaAdminCard: React.FC<MesaAdminCardProps> = ({ mesa, onEditarMesa }) => {
  const isRedonda = mesa.forma === 'redonda';
  const isRectangular = mesa.forma === 'rectangular';
  const isOcupada = mesa.tiene_pedido_activo;

  // Estilos de forma geométrica fiel a la especificación ÁUREA
  const getShapeClasses = () => {
    if (isRedonda) {
      return 'rounded-full aspect-square border-2';
    }
    if (isRectangular) {
      return 'rounded-2xl border-2 col-span-1 min-h-[140px]';
    }
    // Cuadrada por defecto
    return 'rounded-2xl border-2 min-h-[140px]';
  };

  return (
    <div
      onClick={() => onEditarMesa(mesa)}
      className={`relative p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${getShapeClasses()} ${
        isOcupada
          ? 'bg-rose-50/60 border-rose-400 text-aurea-navy'
          : 'bg-white border-aurea-copper/40 text-aurea-navy hover:border-aurea-copper'
      }`}
    >
      {/* Cabecera de la Tarjeta: Número y Estado */}
      <div className="flex items-center justify-between gap-1 w-full">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-bold text-base sm:text-lg text-aurea-navy">
            {/^(mesa\b)/i.test(mesa.numero) ? mesa.numero : `Mesa ${mesa.numero}`}
          </span>
          {mesa.permite_union && (
            <span title="Permite unión de grupos" className="text-aurea-copper">
              <Link2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Indicador de Estado Operativo */}
        {mesa.estado === 'bloqueada' ? (
          <span className="text-xs font-bold text-amber-800">Bloqueada</span>
        ) : isOcupada ? (
          <span
            title="Mesa con comanda activa en salón"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
          >
            <AlertCircle className="w-3 h-3" />
            <span>Ocupada</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Libre
          </span>
        )}
      </div>

      {/* Cuerpo Central: Capacidad y Forma */}
      <div className="my-2 flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 text-xs text-aurea-navy/80 font-medium">
          <Users className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Cap: {mesa.capacidad} pers.</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-aurea-navy/60">
          <span className="capitalize">{mesa.forma}</span>
          <span>·</span>
          <span>{mesa.permite_union ? 'Unible' : 'Fija'}</span>
        </div>

        {isOcupada && mesa.comanda_activa_codigo && (
          <div className="mt-1 text-[11px] font-mono font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
            {mesa.comanda_activa_codigo} · S/ {(mesa.total_cuenta_activa || 0).toFixed(2)}
          </div>
        )}
      </div>

      {/* Pie de la Tarjeta: Acción rápida de edición */}
      <div className="flex items-center justify-between pt-2 border-t border-aurea-copper/15 w-full text-[11px]">
        <span className="text-aurea-navy/50 font-mono">
          ({mesa.posicion_x},{mesa.posicion_y})
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditarMesa(mesa);
          }}
          className="flex items-center gap-1 text-aurea-navy font-semibold hover:text-aurea-copper transition-colors"
        >
          <Edit3 className="w-3 h-3 text-aurea-copper" />
          <span>Editar</span>
        </button>
      </div>
    </div>
  );
};
