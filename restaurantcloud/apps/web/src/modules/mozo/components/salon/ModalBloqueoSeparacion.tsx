import React from 'react';
import { X, AlertTriangle, Receipt, Ban, ArrowLeft } from 'lucide-react';
import { ValidacionSeparacionMesaDTO } from '@/types/mozo';

interface ModalBloqueoSeparacionProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  validacion: ValidacionSeparacionMesaDTO | null;
  onSolicitarCuenta: (mesaId: string) => void;
  onAnularComanda?: (mesaId: string) => void;
}

export const ModalBloqueoSeparacion: React.FC<ModalBloqueoSeparacionProps> = ({
  isOpen,
  onClose,
  mesaId,
  validacion,
  onSolicitarCuenta,
  onAnularComanda,
}) => {
  if (!isOpen || !validacion) return null;

  const totalConsumo = validacion.total_consumo ?? 216.0;
  const itemsActivos = validacion.items_activos ?? 5;
  const labelMesa = validacion.mesa_label || 'Mesa Unificada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wide">
                🛑 No se puede separar {labelMesa}
              </h2>
              <p className="text-xs text-slate-300">
                Bloqueo de Seguridad Operativa • HTTP 409 Conflict
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Advertencia de comanda activa */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Comanda Activa con Consumos Pendientes de Cobro</span>
            </div>
            <p className="text-amber-900">
              {labelMesa} registra actualmente <strong>{itemsActivos} platos</strong> con preparación en cocina y servidos, sumando un consumo activo de{' '}
              <strong className="font-mono text-sm">S/ {totalConsumo.toFixed(2)}</strong>.
            </p>
            <p className="text-amber-800 pt-1 border-t border-amber-200/80 text-[11px]">
              Por regla de consistencia contable del restaurante, las mesas no pueden dividirse físicamente mientras mantengan una comanda abierta sin liquidar.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ¿Qué deseas hacer con esta mesa?
            </span>

            {/* Opción A: Solicitar Cuenta a Caja */}
            <button
              onClick={() => {
                onClose();
                onSolicitarCuenta(mesaId);
              }}
              className="w-full p-3.5 rounded-xl border-2 border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/40 text-left transition-all group flex items-start gap-3 shadow-2xs active:scale-99"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0 mt-0.5">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>🧾 [ Opción A ] Solicitar Cuenta a Caja (CU-CAJA-02)</span>
                  <span className="text-[10px] text-amber-600 font-semibold group-hover:underline">
                    Proceder →
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Abre la precuenta digital para revisar y conmutar la mesa a &apos;cuenta_pedida&apos;, permitiendo que Caja POS liquide la orden consolidada.
                </p>
              </div>
            </button>

            {/* Opción B: Anular Comanda si se retiraron */}
            <button
              onClick={() => {
                if (onAnularComanda) {
                  onAnularComanda(mesaId);
                } else {
                  alert(`Anulación de comanda CU-MOZO-06 para ${labelMesa}: Requiere motivo y autorización.`);
                }
              }}
              className="w-full p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition-all group flex items-start gap-3 shadow-2xs active:scale-99"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                <Ban className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-rose-950 text-xs flex items-center justify-between">
                  <span>⚠️ [ Opción B ] Anular Comanda si los clientes se retiraron</span>
                  <span className="text-[10px] text-rose-600 font-semibold group-hover:underline">
                    Anular →
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Abre el diálogo de anulación auditada (CU-MOZO-06) para cancelar los pedidos no consumidos y liberar ambas mesas.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mantener {labelMesa} Unida y Volver al Salón</span>
          </button>
        </div>
      </div>
    </div>
  );
};
