import React, { useState } from 'react';
import { X, Scissors, CheckCircle2, Info, Users, RefreshCw } from 'lucide-react';
import { ValidacionSeparacionMesaDTO } from '@/types/mozo';

interface ModalSepararMesasProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  validacion: ValidacionSeparacionMesaDTO | null;
  onConfirmarSeparacion: (mesaId: string) => Promise<void>;
}

export const ModalSepararMesas: React.FC<ModalSepararMesasProps> = ({
  isOpen,
  onClose,
  mesaId,
  validacion,
  onConfirmarSeparacion,
}) => {
  const [separando, setSeparando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !validacion) return null;

  const handleConfirmar = async () => {
    setSeparando(true);
    setErrorMsg(null);
    try {
      await onConfirmarSeparacion(mesaId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al desvincular las mesas');
    } finally {
      setSeparando(false);
    }
  };

  const mesas = validacion.mesas_a_restaurar || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-amber-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wide">
                ✂️ Separar {validacion.mesa_label}
              </h2>
              <p className="text-xs text-slate-300">
                Salón Principal • Desvinculación de Grupo Físico
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
          {/* Mensaje de validación positiva */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-bold">✓ Cuenta liquidada y mesas desocupadas.</div>
              <div className="text-emerald-700 mt-0.5">
                No existen platos pendientes de cobro en esta mesa. Al confirmar, cada mesa retornará a su estado individual en el plano de salón recuperando su capacidad original:
              </div>
            </div>
          </div>

          {/* Tarjetas comparativas de mesas a restaurar */}
          <div className="space-y-2.5">
            {mesas.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-slate-900 text-sm">
                      MESA {m.numero}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      LIBRE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {m.rol === 'titular' ? 'Ex-titular' : 'Ex-secundaria'} • Mesa individual activa en salón
                  </p>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cap: {m.capacidad}p</span>
                </div>
              </div>
            ))}
          </div>

          {/* Nota informativa */}
          <div className="flex items-start gap-2 text-slate-500 text-xs bg-slate-100/70 p-3 rounded-xl border border-slate-200/60">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Ambas mesas quedarán disponibles de inmediato en el plano para recibir nuevos comensales o para conformar nuevas uniones grupales.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={separando}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors min-h-[44px]"
          >
            Mantener Unidas
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={separando}
            className="py-2.5 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-sm active:scale-98"
          >
            {separando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Separando mesas...</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>✂️ Confirmar Separación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
