import React from 'react';
import { AlertOctagon, CheckCircle, ShieldAlert, Clock, User, Utensils } from 'lucide-react';
import { ItemAnuladoSSEEvent } from '@/types/cocina';

interface ModalAlertaParadaFogonesProps {
  evento: ItemAnuladoSSEEvent | null;
  onConfirmarEntendido: () => void;
}

export const ModalAlertaParadaFogones: React.FC<ModalAlertaParadaFogonesProps> = ({
  evento,
  onConfirmarEntendido,
}) => {
  if (!evento) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-rose-500 rounded-3xl overflow-hidden shadow-2xl shadow-rose-950/80 flex flex-col">
        {/* Cabecera de Alerta */}
        <div className="p-4 sm:p-5 bg-rose-950/80 border-b border-rose-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 animate-bounce">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg sm:text-xl text-rose-100 tracking-wide">
              🛑 ATENCIÓN COCINA • PARADA DE FOGONES
            </h3>
            <p className="text-xs font-mono text-rose-300">
              Alerta en Salón: item anulado • Salón revocó preparación
            </p>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-4 text-sm text-slate-200">
          {/* Ficha del Plato Anulado */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-900/60 flex items-center justify-between gap-3">
            <div>
              <span className="font-serif font-bold text-lg text-rose-200 line-through block">
                1x {evento.nombre_producto}
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span className="flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-aurea-copper" />
                  Mesa {evento.mesa_codigo}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Mozo: {evento.mozo_nombre}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  {evento.minutos_transcurridos} min
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-mono font-bold text-xs uppercase shadow">
              ANULADO
            </span>
          </div>

          {/* Causa Reportada por Salón */}
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-xs">
            <span className="font-bold text-amber-300 block mb-1">
              ⚠️ Causa reportada por Salón (CU-MOZO-06 / CU-MOZO-07):
            </span>
            <p className="text-amber-100 font-medium leading-relaxed">
              &quot;{evento.motivo_anulacion}&quot;
            </p>
          </div>

          {/* Instrucción Operativa de Merma */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Instrucción Operativa Antimerma (es_merma = false):</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Detener inmediatamente la cocción en wok o sartén. No emplatar para evitar merma de insumos físicos no cocinados.
            </p>
          </div>
        </div>

        {/* Botón de Acuse Táctil Obligatorio */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onConfirmarEntendido}
            className="w-full min-h-[48px] rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>[ ✓ Entendido / Retirar Plato de la Comanda ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
