import React from 'react';
import { ConflictoDesactivacionMesaDTO } from '@/types/admin';
import { AlertOctagon, X } from 'lucide-react';

interface ModalBloqueoDesactivacionProps {
  conflicto: ConflictoDesactivacionMesaDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalBloqueoDesactivacion: React.FC<ModalBloqueoDesactivacionProps> = ({
  conflicto,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !conflicto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-rose-300 overflow-hidden">
        {/* Cabecera de Alerta Dura */}
        <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-200 block">
                Error 409 Conflict · ERR_MESA_CON_PEDIDOS_ACTIVOS
              </span>
              <h3 className="font-serif text-xl font-bold">Bloqueo Duro de Desactivación</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Explicativo */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm">
            <p className="font-semibold">
              No es posible desactivar esta mesa en este momento porque alberga comensales con una
              comanda abierta en salón y cocina.
            </p>
            <p className="text-xs text-rose-700/90 mt-1">
              Para preservar la trazabilidad fiscal y no perder consumos no facturados, la cuenta debe
              ser liquidada en Caja o anulada antes de retirar la mesa del plano físico.
            </p>
          </div>

          {/* Ficha de la Comanda en Conflicto */}
          <div className="p-4 rounded-2xl bg-aurea-ivory border border-aurea-copper/30 space-y-2.5 text-xs text-aurea-navy">
            <div className="flex items-center justify-between pb-2 border-b border-aurea-copper/20">
              <span className="text-aurea-navy/60">Código de Comanda:</span>
              <span className="font-mono font-bold text-sm text-aurea-navy">
                {conflicto.codigo_comanda}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-aurea-navy/60">Estado de la Orden:</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {conflicto.estado_pedido}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-aurea-navy/60">Mozo Responsable:</span>
              <span className="font-semibold text-aurea-navy">{conflicto.mozo_nombre}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-aurea-copper/20">
              <span className="text-aurea-navy/60">Consumo Acumulado:</span>
              <span className="font-serif font-bold text-base text-aurea-navy">
                S/ {conflicto.total_cuenta.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Acciones de Resolución Asistida */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">

            <button
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
