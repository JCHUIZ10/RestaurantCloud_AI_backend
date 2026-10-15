import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

interface ModalBloqueoMinimoUnPagoProps {
  isOpen: boolean;
  onClose: () => void;
  metodoBloqueadoNombre?: string;
}

export const ModalBloqueoMinimoUnPago: React.FC<ModalBloqueoMinimoUnPagoProps> = ({
  isOpen,
  onClose,
  metodoBloqueadoNombre = 'Efectivo',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[540px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/40 overflow-hidden flex flex-col"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-bloqueo-title"
      >
        {/* Banner Alert Top */}
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent p-6 border-b border-rose-100 dark:border-rose-900/30 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex-shrink-0 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                HTTP 409 Conflict • ERR_MINIMO_UN_PAGO
              </span>
            </div>
            <h2
              id="modal-bloqueo-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Bloqueo de Seguridad Poka-Yoke
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              No es posible desactivar <strong className="text-rose-600 dark:text-rose-400">{metodoBloqueadoNombre}</strong> porque es el único método de pago actualmente disponible en el local.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Por regla operativa <strong className="font-mono text-slate-900 dark:text-white">RN-PAGO-06</strong>, el sistema RestaurantCloud impide que una sede activa quede sin ninguna vía de cobro. Si se desactiva, los mozos no podrán generar precuentas ni la caja emitir boletas/facturas SUNAT.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-amber-800 dark:text-amber-200">
            <span className="font-bold text-sm">💡</span>
            <div>
              <p className="font-semibold text-xs mb-0.5">Solución recomendada:</p>
              <p className="text-[11px] leading-normal opacity-90">
                Habilita primero una alternativa (como Tarjeta de Crédito/Débito POS o Yape/Plin) antes de desactivar {metodoBloqueadoNombre}.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>✓ Entendido / Mantener {metodoBloqueadoNombre} Activo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
