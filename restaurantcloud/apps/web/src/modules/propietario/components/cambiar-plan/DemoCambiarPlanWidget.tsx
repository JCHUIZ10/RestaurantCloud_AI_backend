import React, { useState } from 'react';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';
import {
  Wrench,
  ChevronDown,
  RotateCcw,
  Zap,
  Calendar,
  XCircle,
} from 'lucide-react';

interface DemoCambiarPlanWidgetProps {
  onRecargar: () => void;
}

export const DemoCambiarPlanWidget: React.FC<DemoCambiarPlanWidgetProps> = ({
  onRecargar,
}) => {
  const [desplegado, setDesplegado] = useState(false);

  const handleUpgrade = () => {
    propietarioSuscripcionService.simularUpgradeEnterprise();
    onRecargar();
  };

  const handleDowngrade = () => {
    propietarioSuscripcionService.simularDowngradeProgramado();
    onRecargar();
  };

  const handleCancelarDowngrade = async () => {
    await propietarioSuscripcionService.cancelarDowngrade();
    onRecargar();
  };

  const handleReset = () => {
    propietarioSuscripcionService.resetDatabase();
    onRecargar();
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {desplegado && (
        <div className="mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-fadeIn space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-aurea-navy">
              <Wrench className="w-4 h-4 text-aurea-copper" />
              <span>Sandbox QA: Planes y Prorrateo</span>
            </div>
            <button
              onClick={() => setDesplegado(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Prueba de forma reactiva los diferentes estados y transiciones de suscripción en RestaurantCloud AI.
          </p>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={handleUpgrade}
              className="w-full text-left p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-2 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Simular Upgrade a Enterprise</span>
            </button>

            <button
              onClick={handleDowngrade}
              className="w-full text-left p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold flex items-center gap-2 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Simular Downgrade a Starter</span>
            </button>

            <button
              onClick={handleCancelarDowngrade}
              className="w-full text-left p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-2 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Cancelar Downgrade Programado</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full text-left p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Restablecer Plan Pro Inicial</span>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setDesplegado(!desplegado)}
        className="px-3.5 py-2 rounded-full bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-bold shadow-lg flex items-center gap-2 border border-white/20 transition-all hover:scale-105"
      >
        <Wrench className="w-3.5 h-3.5 text-aurea-champagne" />
        <span>Sandbox Planes QA</span>
      </button>
    </div>
  );
};
