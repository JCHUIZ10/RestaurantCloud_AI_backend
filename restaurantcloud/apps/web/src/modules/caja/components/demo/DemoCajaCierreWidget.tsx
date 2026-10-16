import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Coins,
} from 'lucide-react';

interface DemoCajaCierreWidgetProps {
  onSelectEscenario: (
    escenario: 'salon_al_dia' | 'mesas_pendientes' | 'faltante' | 'sobrante' | 'caja_cerrada' | 'restablecer'
  ) => void;
  estadoActual: string;
}

export const DemoCajaCierreWidget: React.FC<DemoCajaCierreWidgetProps> = ({
  onSelectEscenario,
  estadoActual,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm font-sans">
      <div className="bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md overflow-hidden">
        {/* Barra colapsable */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-aurea-copper/20 text-aurea-champagne">
              <Wrench className="w-3.5 h-3.5" />
            </span>
            <span>QA Sandbox • CU-CAJA-05</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-aurea-copper">
              {estadoActual}
            </span>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {/* Panel desplegable */}
        {isOpen && (
          <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
            <p className="text-[11px] text-slate-400 leading-tight">
              Herramienta de pruebas para alternar entre los 5 estados de cierre y arqueo Z:
            </p>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('salon_al_dia');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Salón al Día (Arqueo F8)</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono">0 Mesas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('mesas_pendientes');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. Mesas Pendientes (Poka-Yoke)</span>
                </div>
                <span className="text-[10px] text-rose-300 font-mono">Bloqueo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('faltante');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Simular Faltante (-S/ 15.00)</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">Exige Justif</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('sobrante');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 text-sky-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-sky-400" />
                  <span>4. Simular Sobrante (+S/ 20.00)</span>
                </div>
                <span className="text-[10px] text-sky-300 font-mono">Exige Justif</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('caja_cerrada');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-aurea-copper" />
                  <span>5. Ver Reporte Z Emitido (Vista 3)</span>
                </div>
                <span className="text-[10px] text-aurea-champagne font-mono">Reporte Z</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-mono">Turno #042</span>
              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('restablecer');
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer Turno</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
