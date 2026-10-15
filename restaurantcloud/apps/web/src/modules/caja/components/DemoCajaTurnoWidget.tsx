import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface DemoCajaTurnoWidgetProps {
  onSelectEscenario: (escenario: 'cerrada' | 'conflicto_409' | 'abierta_operativa' | 'forzar_cierre' | 'restablecer') => void;
  estadoActual: string;
}

export const DemoCajaTurnoWidget: React.FC<DemoCajaTurnoWidgetProps> = ({
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
            <span>QA Sandbox • CU-CAJA-01</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-aurea-copper">
              {estadoActual}
            </span>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {/* Panel de pruebas */}
        {isOpen && (
          <div className="p-4 border-t border-slate-800 space-y-2.5 text-xs">
            <p className="text-[11px] text-slate-400 leading-tight">
              Herramienta de testing para alternar estados del ciclo de apertura y conflicto Poka-Yoke:
            </p>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('cerrada');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-sky-400" />
                  <span>1. Caja Cerrada (Vista 1)</span>
                </div>
                <span className="text-[10px] text-slate-400">Modal Apertura</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('conflicto_409');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. Conflicto 409 (Vista 2)</span>
                </div>
                <span className="text-[10px] text-rose-300 font-mono">Turno Previo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('abierta_operativa');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. POS Operativo (Vista 3)</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono">Desbloqueado</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('forzar_cierre');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>4. Simular Cierre en CU-ADMIN-14</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">Admin Local</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-mono">Sede: Miraflores</span>
              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('restablecer');
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer Todo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
