import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';

interface DemoAdminPoliticasWidgetProps {
  onRecargar: () => void;
}

export const DemoAdminPoliticasWidget: React.FC<DemoAdminPoliticasWidgetProps> = ({
  onRecargar,
}) => {
  const [colapsado, setColapsado] = useState(true);
  const [planStarter, setPlanStarter] = useState(mockAdminService.getPlanSaaSActual() === 'starter');
  const [tieneReservas, setTieneReservas] = useState(mockAdminService.getReservasFuturasActivasCount() > 0);

  const handleTogglePlanStarter = () => {
    const nuevo = !planStarter;
    setPlanStarter(nuevo);
    mockAdminService.simularPlanStarter(nuevo);
    onRecargar();
  };

  const handleToggleReservasFuturas = () => {
    const nuevo = !tieneReservas;
    setTieneReservas(nuevo);
    mockAdminService.simularExistenciaReservasFuturas(nuevo);
    onRecargar();
  };

  const handleRestablecerTodo = () => {
    mockAdminService.restablecerSemillasPoliticas();
    setPlanStarter(false);
    setTieneReservas(true);
    onRecargar();
  };

  return (
    <aside
      aria-label="Banco de pruebas QA Políticas de Reserva"
      className="fixed bottom-4 right-4 z-40 max-w-xs transition-all duration-300"
    >
      <div className="bg-aurea-navy text-white rounded-2xl shadow-2xl border border-aurea-copper/50 overflow-hidden">
        {/* Cabecera del Widget */}
        <button
          type="button"
          onClick={() => setColapsado(!colapsado)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 bg-gradient-to-r from-aurea-navy to-slate-900 hover:from-slate-900 hover:to-aurea-navy transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-aurea-copper/20 flex items-center justify-center border border-aurea-copper/40 text-aurea-champagne">
              <Wrench className="w-3.5 h-3.5 text-aurea-copper" />
            </div>
            <div>
              <span className="text-xs font-bold block leading-none text-aurea-champagne">
                QA Test Bench
              </span>
              <span className="text-[10px] text-white/60 font-mono">CU-ADMIN-10 Políticas</span>
            </div>
          </div>
          {colapsado ? (
            <ChevronUp className="w-4 h-4 text-white/70" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/70" />
          )}
        </button>

        {/* Contenido Expandible */}
        {!colapsado && (
          <div className="p-3.5 space-y-3 text-xs bg-slate-950/80 border-t border-white/10">
            <p className="text-[11px] text-white/70 leading-relaxed">
              Herramientas de evaluación rápida para simular paywall SaaS o conflicto 409 de reservas pendientes:
            </p>

            {/* Toggle 1: Plan Starter (Paywall 403) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <span className="text-[11px] text-white/90 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Simular Plan Starter (Paywall)</span>
              </span>
              <button
                type="button"
                onClick={handleTogglePlanStarter}
                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                  planStarter ? 'bg-amber-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    planStarter ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Existencia de Reservas Futuras (409 Conflict) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <span className="text-[11px] text-white/90 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>3 Reservas Activas (Conflicto 409)</span>
              </span>
              <button
                type="button"
                onClick={handleToggleReservasFuturas}
                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                  tieneReservas ? 'bg-red-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    tieneReservas ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Restablecer estado */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleRestablecerTodo}
                className="w-full py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                <RotateCcw className="w-3 h-3 text-aurea-champagne" />
                <span>Restablecer Semillas Áurea</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
