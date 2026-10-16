import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw, FileText, ChevronUp, ChevronDown } from 'lucide-react';

interface DemoSaasTenantsWidgetProps {
  onVaciarGracia: () => void;
  onForzarDia5: () => void;
  onRegularizarElTenedor: () => void;
  onPrellenarAlta: () => void;
  onRestablecerSemillas: () => void;
}

export const DemoSaasTenantsWidget: React.FC<DemoSaasTenantsWidgetProps> = ({
  onVaciarGracia,
  onForzarDia5,
  onRegularizarElTenedor,
  onPrellenarAlta,
  onRestablecerSemillas,
}) => {
  const [expandido, setExpandido] = useState(false);

  return (
    <aside aria-label="Simulador Sandbox QA" className="fixed bottom-5 right-5 z-40 font-sans">
      <div className="bg-aurea-navy text-aurea-ivory rounded-2xl shadow-2xl border border-aurea-copper/40 overflow-hidden w-80 transition-all">
        {/* Cabecera del Widget */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full px-4 py-3 bg-aurea-navy hover:bg-white/5 flex items-center justify-between border-b border-white/10 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-aurea-copper/20 border border-aurea-copper/50 flex items-center justify-center text-aurea-copper">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">Sandbox QA • CU-SAAS-01</div>
              <div className="text-[10px] text-aurea-champagne/70 font-mono">Simulador de Estados en 1 Clic</div>
            </div>
          </div>
          {expandido ? (
            <ChevronDown className="w-4 h-4 text-aurea-copper" />
          ) : (
            <ChevronUp className="w-4 h-4 text-aurea-copper" />
          )}
        </button>

        {/* Controles Colapsables */}
        {expandido && (
          <div className="p-3.5 space-y-2 bg-slate-900/90 text-xs">
            <p className="text-[11px] text-white/60 pb-1 border-b border-white/10 leading-tight">
              Alterna escenarios del wireframe y prueba la resiliencia en tiempo real:
            </p>

            <button
              onClick={onVaciarGracia}
              className="w-full text-left px-2.5 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white flex items-center gap-2 border border-white/10 hover:border-emerald-500/40 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Simular 0 en Gracia (Vista 4 Vacía)</span>
            </button>

            <button
              onClick={onForzarDia5}
              className="w-full text-left px-2.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white flex items-center gap-2 border border-white/10 hover:border-amber-500/40 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Forzar Día 5/5 (Vence Hoy 23:59)</span>
            </button>

            <button
              onClick={onRegularizarElTenedor}
              className="w-full text-left px-2.5 py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 text-white flex items-center gap-2 border border-white/10 hover:border-blue-500/40 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Regularizar Cobro El Tenedor</span>
            </button>

            <button
              onClick={onPrellenarAlta}
              className="w-full text-left px-2.5 py-2 rounded-xl bg-white/5 hover:bg-purple-500/20 text-white flex items-center gap-2 border border-white/10 hover:border-purple-500/40 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Abrir Alta con RUC 20603849201</span>
            </button>

            <div className="pt-1.5 border-t border-white/10">
              <button
                onClick={onRestablecerSemillas}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 border border-rose-500/20 transition-colors text-[11px]"
              >
                <RotateCcw className="w-3 h-3 text-rose-400 shrink-0" />
                <span>Restablecer Semillas Canónicas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
