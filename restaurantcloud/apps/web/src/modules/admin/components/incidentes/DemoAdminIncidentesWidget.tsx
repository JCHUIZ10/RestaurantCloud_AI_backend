import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';

interface DemoAdminIncidentesWidgetProps {
  onRecargar: () => void;
}

export const DemoAdminIncidentesWidget: React.FC<DemoAdminIncidentesWidgetProps> = ({
  onRecargar,
}) => {
  const [colapsado, setColapsado] = useState(true);

  const handleSimularCasoCritico = () => {
    mockAdminService.simularIncidenteCriticoDirectiva();
    onRecargar();
  };

  const handleSimularLecturaPropietario = () => {
    mockAdminService.simularLecturaPropietario();
    onRecargar();
  };

  const handleSimularNuevaDirectiva = () => {
    mockAdminService.simularDirectivaPropietario(
      '00000000-0000-4000-8000-000000000685',
      'Directiva complementaria de Gerencia: Disponer arqueo sorpresivo al cierre de turno y enviar copia al contador.'
    );
    onRecargar();
  };

  const handleVaciarBandeja = () => {
    mockAdminService.simularBandejaVacia();
    onRecargar();
  };

  const handleRestablecerTodo = () => {
    mockAdminService.restablecerSemillasIncidentes();
    onRecargar();
  };

  return (
    <aside
      aria-label="Banco de pruebas QA Incidentes Internos"
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
              <span className="text-[10px] text-white/60 font-mono">CU-ADMIN-11 Incidentes</span>
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
          <div className="p-3.5 space-y-2 text-xs bg-slate-950/80 border-t border-white/10">
            <p className="text-[11px] text-white/70 leading-relaxed">
              Herramientas de evaluación rápida para probar directivas corporativas y estados de auditoría:
            </p>

            {/* Acción: Simular lectura de propietario */}
            <button
              type="button"
              onClick={handleSimularLecturaPropietario}
              className="w-full py-1.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-emerald-500/30 text-left"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Simular que Propietario Vio Casos</span>
            </button>

            {/* Acción: Simular nueva directiva */}
            <button
              type="button"
              onClick={handleSimularNuevaDirectiva}
              className="w-full py-1.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-purple-500/30 text-left"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Añadir Directiva Propietario en INC-085</span>
            </button>

            {/* Acción: Inyectar caso crítico con directiva */}
            <button
              type="button"
              onClick={handleSimularCasoCritico}
              className="w-full py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/30 text-left"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Inyectar Caso INC-2026-085 Semilla</span>
            </button>

            {/* Acción: Vaciar bandeja */}
            <button
              type="button"
              onClick={handleVaciarBandeja}
              className="w-full py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-white/10 text-left"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Simular Bandeja Vacía (Estado Cero)</span>
            </button>

            {/* Acción 3: Restablecer todo */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleRestablecerTodo}
                className="w-full py-1.5 px-2 rounded-xl bg-aurea-copper/20 hover:bg-aurea-copper/30 text-aurea-champagne text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-aurea-copper/30"
              >
                <RotateCcw className="w-3 h-3 text-aurea-copper" />
                <span>Restablecer Semillas Canónicas</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
