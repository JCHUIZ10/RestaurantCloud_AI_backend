import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  Lock,
  TrendingDown,
  TrendingUp,
  CalendarOff,
} from 'lucide-react';

interface DemoAdminFinanzasWidgetProps {
  onSelectEscenario: (
    escenario: 'superavit' | 'deficit' | 'discrepancia_pendiente' | 'terminal_bloqueada' | 'dias_vacios' | 'restablecer'
  ) => void;
  estadoActual: string;
}

export const DemoAdminFinanzasWidget: React.FC<DemoAdminFinanzasWidgetProps> = ({
  onSelectEscenario,
  estadoActual,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm font-sans">
      <div className="bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md overflow-hidden">
        {/* Barra Colapsable */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-aurea-copper/20 text-aurea-champagne">
              <Wrench className="w-3.5 h-3.5" />
            </span>
            <span>QA Sandbox • CU-ADMIN-14</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-aurea-copper">
              {estadoActual}
            </span>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {/* Panel Desplegable */}
        {isOpen && (
          <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
            <p className="text-[11px] text-slate-400 leading-tight">
              Herramienta de pruebas para alternar entre los estados financieros y de supervisión de cajas:
            </p>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('superavit');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-emerald-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Mes Normal Superávit</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono">+S/ 11,630</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('deficit');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. Déficit Operativo Temporal</span>
                </div>
                <span className="text-[10px] text-rose-300 font-mono">-S/ 2,750</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('discrepancia_pendiente');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Turno con Discrepancia</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">Por Visar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('terminal_bloqueada');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-purple-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>4. Terminal Bloqueada (Rescate)</span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">Abandono</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('dias_vacios');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CalendarOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>5. Días Vacíos (Sin Actividad)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">S/ 0.00</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-mono">Sede Miraflores</span>
              <button
                type="button"
                onClick={() => {
                  onSelectEscenario('restablecer');
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
