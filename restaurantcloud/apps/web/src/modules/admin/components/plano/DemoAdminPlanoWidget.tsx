import React, { useState } from 'react';
import { Sliders, Sparkles, RefreshCw, AlertOctagon, Layers, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface DemoAdminPlanoWidgetProps {
  onRestablecerSemillas: () => void;
  onSimularCuotaLlena: () => void;
  onSimularPisoVacio: () => void;
  onProbarBloqueoMesa04: () => void;
  onSimularErrorRed: () => void;
}

export const DemoAdminPlanoWidget: React.FC<DemoAdminPlanoWidgetProps> = ({
  onRestablecerSemillas,
  onSimularCuotaLlena,
  onSimularPisoVacio,
  onProbarBloqueoMesa04,
  onSimularErrorRed,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {isOpen ? (
        <div className="bg-aurea-navy text-white rounded-2xl shadow-2xl border-2 border-aurea-copper/60 p-4 w-80 space-y-3 animate-fadeIn text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <div className="flex items-center gap-2 font-serif font-bold text-sm text-aurea-champagne">
              <Sliders className="w-4 h-4 text-aurea-copper" />
              <span>Simulador CU-ADMIN-01</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-white/60 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-white/70">
            Alterna en 1 clic entre escenarios de prueba para validar los 5 estados UX y reglas de
            negocio del plano de mesas:
          </p>

          <div className="space-y-1.5">
            {/* 1. Restablecer */}
            <button
              onClick={onRestablecerSemillas}
              className="w-full text-left p-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold flex items-center justify-between text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-aurea-copper" />
                <span>Restablecer Semillas Áurea (17 mesas)</span>
              </span>
            </button>

            {/* 2. Cuota Llena */}
            <button
              onClick={onSimularCuotaLlena}
              className="w-full text-left p-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold flex items-center justify-between text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Cuota Llena (30 / 30)</span>
              </span>
            </button>

            {/* 3. Salón Vacío */}
            <button
              onClick={onSimularPisoVacio}
              className="w-full text-left p-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold flex items-center justify-between text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                <span>Simular Salón Vacío (Onboarding)</span>
              </span>
            </button>

            {/* 4. Bloqueo 409 Mesa 04 */}
            <button
              onClick={onProbarBloqueoMesa04}
              className="w-full text-left p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 font-semibold flex items-center justify-between text-rose-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>Probar Bloqueo 409 (Mesa 04)</span>
              </span>
            </button>

            {/* 5. Error de Red */}
            <button
              onClick={onSimularErrorRed}
              className="w-full text-left p-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold flex items-center justify-between text-white/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>⚠️</span>
                <span>Simular Error de Red (Reintento)</span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-aurea-navy text-white border-2 border-aurea-copper shadow-xl hover:bg-aurea-navy/90 text-xs font-semibold active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-aurea-champagne animate-pulse" />
          <span>⚡ Demo Plano (CU-ADMIN-01)</span>
          <ChevronUp className="w-3.5 h-3.5 text-aurea-copper" />
        </button>
      )}
    </div>
  );
};
