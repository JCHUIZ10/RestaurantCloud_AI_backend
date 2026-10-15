import React, { useState } from 'react';
import {
  X,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Clock,
  User,
  Users,
} from 'lucide-react';
import { MesaCajaMonitorDTO } from '@/types/caja';

interface ModalCobroPrecuentaDemoProps {
  isOpen: boolean;
  mesa: MesaCajaMonitorDTO | null;
  onClose: () => void;
  onConfirmarCobro: (mesaId: string) => Promise<void>;
}

export const ModalCobroPrecuentaDemo: React.FC<ModalCobroPrecuentaDemoProps> = ({
  isOpen,
  mesa,
  onClose,
  onConfirmarCobro,
}) => {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'efectivo' | 'tarjeta' | 'billetera'>('efectivo');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cobradoExito, setCobradoExito] = useState<boolean>(false);

  if (!isOpen || !mesa) return null;

  const handleCobrar = async () => {
    setIsProcessing(true);
    await onConfirmarCobro(mesa.id);
    setIsProcessing(false);
    setCobradoExito(true);
    setTimeout(() => {
      setCobradoExito(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-aurea-copper/20 text-aurea-navy dark:text-aurea-champagne font-bold font-mono">
              Mesa {mesa.numero}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Precuenta y Cobro • CU-CAJA-02
              </h3>
              <p className="text-[11px] text-slate-500">
                {mesa.piso_nombre} • Pedido #{mesa.pedido_id || 'PED-104'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          {cobradoExito ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                ¡Cobro Registrado Exitosamente!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Se emitió el comprobante B001-{Math.floor(Math.random() * 89999 + 10000)} y la mesa ha sido liberada.
              </p>
            </div>
          ) : (
            <>
              {/* Resumen de Mesa */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> Comensales
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {mesa.comensales || 2} personas
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                    <User className="w-3 h-3" /> Mozo
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {mesa.mozo_nombre || 'Carlos M.'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Espera
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {mesa.minutos_espera_cuenta ? `${mesa.minutos_espera_cuenta} min` : '5 min'}
                  </span>
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoSeleccionado('efectivo')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      metodoSeleccionado === 'efectivo'
                        ? 'border-aurea-copper bg-aurea-copper/10 text-aurea-navy dark:text-aurea-champagne shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoSeleccionado('tarjeta')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      metodoSeleccionado === 'tarjeta'
                        ? 'border-aurea-copper bg-aurea-copper/10 text-aurea-navy dark:text-aurea-champagne shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    <span>Tarjeta POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoSeleccionado('billetera')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      metodoSeleccionado === 'billetera'
                        ? 'border-aurea-copper bg-aurea-copper/10 text-aurea-navy dark:text-aurea-champagne shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span>Yape / Plin</span>
                  </button>
                </div>
              </div>

              {/* Total a cobrar */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-mono">TOTAL CONSUMO</span>
                  <span className="text-xs text-aurea-copper font-medium">Incluye IGV 18%</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-bold text-aurea-champagne">
                    S/ {mesa.total_consumo.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botón de emisión */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCobrar}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-aurea-navy bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 transition-all shadow-md shadow-aurea-copper/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin" />
                      <span>Procesando cobro...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Emitir Boleta y Cobrar S/ {mesa.total_consumo.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
