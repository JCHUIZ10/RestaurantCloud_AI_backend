import React, { useState } from 'react';
import {
  Wrench,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Percent,
  RotateCcw,
  Store,
  Layers,
} from 'lucide-react';

interface DemoAdminMetodosPagoWidgetProps {
  onAplicarPreset: (preset: 'canonico' | 'cero_recargo' | 'alta_comision' | 'solo_efectivo') => void;
  onSimularOnboarding: () => void;
  onRestablecerSemillas: () => void;
}

export const DemoAdminMetodosPagoWidget: React.FC<DemoAdminMetodosPagoWidgetProps> = ({
  onAplicarPreset,
  onSimularOnboarding,
  onRestablecerSemillas,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-tinta-900 text-white shadow-xl border border-tinta-700 text-xs font-bold hover:scale-105 active:scale-95 transition-all ml-auto"
        title="Laboratorio de pruebas"
      >
        <Wrench className="w-4 h-4 text-amber-400" />
        <span>QA Demo: Métodos de Pago</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-tinta-200 text-tinta-800 space-y-3 animate-in slide-in-from-bottom-2 duration-200 w-80">
          <div className="flex items-center justify-between border-b border-tinta-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-tinta-500">
              Escenarios de Prueba
            </span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                onAplicarPreset('canonico');
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-tinta-100 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-tinta-900">Canónico Áurea</div>
                <div className="text-xs text-tinta-400">Efectivo 0%, Tarjeta 3.5%, Yape 0%</div>
              </div>
            </button>

            <button
              onClick={() => {
                onAplicarPreset('cero_recargo');
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-tinta-100 transition-colors flex items-center gap-2"
            >
              <Percent className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-tinta-900">Cero Recargo General</div>
                <div className="text-xs text-tinta-400">Todas las formas al 0.00%</div>
              </div>
            </button>

            <button
              onClick={() => {
                onAplicarPreset('alta_comision');
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-tinta-100 transition-colors flex items-center gap-2"
            >
              <Layers className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-tinta-900">Recargo Pasarela 5.0%</div>
                <div className="text-xs text-tinta-400">Tarjeta con 5.00% de comisión</div>
              </div>
            </button>

            <button
              onClick={() => {
                onAplicarPreset('solo_efectivo');
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-tinta-100 transition-colors flex items-center gap-2"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-tinta-900">Provocar Bloqueo 409</div>
                <div className="text-xs text-tinta-400">Solo 1 activo para probar Poka-Yoke</div>
              </div>
            </button>

            <button
              onClick={() => {
                onSimularOnboarding();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-tinta-100 transition-colors flex items-center gap-2"
            >
              <Store className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-tinta-900">Simular Sede Nueva</div>
                <div className="text-xs text-tinta-400">Ver flujo de onboarding inicial</div>
              </div>
            </button>
          </div>

          <div className="border-t border-tinta-100 pt-2">
            <button
              onClick={() => {
                onRestablecerSemillas();
                setIsOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Semillas de Prueba</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
