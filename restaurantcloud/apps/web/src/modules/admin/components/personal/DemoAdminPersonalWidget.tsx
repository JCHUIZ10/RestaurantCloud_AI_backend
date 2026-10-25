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
      <div className="bg-aurea-navy text-white rounded-2xl shadow-xl border border-aurea-copper/40 overflow-hidden max-w-xs transition-all duration-200">
        {/* Cabecera toggle */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-300">
            <Wrench className="w-3.5 h-3.5" />
            <span>Laboratorio de pruebas</span>
          </div>
          {expandido ? (
            <ChevronDown className="w-3.5 h-3.5 text-white/60" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-white/60" />
          )}
        </button>

        {/* Panel expandido con atajos */}
        {expandido && (
          <div className="p-3 border-t border-white/10 space-y-2 text-xs">
            <p className="text-xs text-white/60 leading-tight">
              Herramientas de simulación para validar casos límite de cuotas y reasignación:
            </p>

            <button
              onClick={() => {
                onSimularCuotaLlena();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-left transition-colors font-medium text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Simular Límite Cuota (15/15)</span>
            </button>

            <button
              onClick={() => {
                onFiltrarMozoConMesas();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 text-left transition-colors font-medium text-xs"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Probar Reasignación (Carlos H.)</span>
            </button>

            <button
              onClick={() => {
                onSimularSedeVacia();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-left transition-colors font-medium text-xs"
            >
              <Inbox className="w-3.5 h-3.5 text-white/60 shrink-0" />
              <span>Simular Sede Vacía</span>
            </button>

            <button
              onClick={() => {
                onRestablecerSemillas();
                setExpandido(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-left transition-colors font-semibold text-xs border border-emerald-800/50"
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
