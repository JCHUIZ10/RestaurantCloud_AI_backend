import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  RotateCcw,
  Inbox,
  UtensilsCrossed,
} from 'lucide-react';

interface DemoAdminPersonalWidgetProps {
  onSimularCuotaLlena: () => void;
  onSimularSedeVacia: () => void;
  onRestablecerSemillas: () => void;
  onFiltrarMozoConMesas: () => void;
}

export const DemoAdminPersonalWidget: React.FC<DemoAdminPersonalWidgetProps> = ({
  onSimularCuotaLlena,
  onSimularSedeVacia,
  onRestablecerSemillas,
  onFiltrarMozoConMesas,
}) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-slate-900/95 text-white rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md overflow-hidden max-w-xs transition-all duration-200">
        {/* Cabecera toggle */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-300">
            <Wrench className="w-3.5 h-3.5" />
            <span>QA Test Bench (CU-ADMIN-08)</span>
          </div>
          {expandido ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Panel expandido con atajos */}
        {expandido && (
          <div className="p-3 border-t border-slate-800 space-y-2 text-xs">
            <p className="text-[11px] text-slate-400 leading-tight">
              Herramientas de simulación para validar casos límite de cuotas y reasignación:
            </p>

            <button
              onClick={() => {
                onSimularCuotaLlena();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 text-left transition-colors font-medium text-[11px]"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Simular Límite Cuota (15/15)</span>
            </button>

            <button
              onClick={() => {
                onFiltrarMozoConMesas();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-200 text-left transition-colors font-medium text-[11px]"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Probar Reasignación (Carlos H.)</span>
            </button>

            <button
              onClick={() => {
                onSimularSedeVacia();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-left transition-colors font-medium text-[11px]"
            >
              <Inbox className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Simular Sede Vacía</span>
            </button>

            <button
              onClick={() => {
                onRestablecerSemillas();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-left transition-colors font-semibold text-[11px] border border-emerald-800/50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Restablecer Semillas (12 personal)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
