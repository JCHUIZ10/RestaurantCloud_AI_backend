import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Radio,
} from 'lucide-react';
import { mockAdminService } from '../../services/mockAdminService';

interface DemoAdminAnulacionesWidgetProps {
  onRecargar: () => void;
}

export const DemoAdminAnulacionesWidget: React.FC<DemoAdminAnulacionesWidgetProps> = ({
  onRecargar,
}) => {
  const [colapsado, setColapsado] = useState(true);

  const handleSimularItem = () => {
    mockAdminService.simularNuevaAnulacionSse('item');
    onRecargar();
  };

  const handleSimularComanda = () => {
    mockAdminService.simularNuevaAnulacionSse('comanda');
    onRecargar();
  };

  const handleSimularDiaVacio = () => {
    mockAdminService.simularDiaSinAnulaciones();
    onRecargar();
  };

  const handleRestablecer = () => {
    mockAdminService.restablecerSemillasAnulaciones();
    onRecargar();
  };

  return (
    <aside
      aria-label="Banco de pruebas QA Auditoría de Anulaciones"
      className="fixed bottom-4 right-4 z-40 max-w-xs transition-all duration-300"
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-500/50 overflow-hidden">
        {/* Cabecera del Widget */}
        <button
          type="button"
          onClick={() => setColapsado(!colapsado)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-900 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                QA Demo: SSE & Anulaciones
              </span>
              <span className="text-[10px] text-amber-400 font-mono block">
                CU-ADMIN-12 Auditoría
              </span>
            </div>
          </div>
          {colapsado ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Contenido desplegable */}
        {!colapsado && (
          <div className="p-3 bg-slate-950/90 text-xs space-y-2 border-t border-slate-800">
            <p className="text-[11px] text-slate-400 leading-tight">
              Simule eventos reactivos de anulación emitidos por mozos en salón y verifique la llegada de SSE, el toast flotante y la campana.
            </p>

            <button
              onClick={handleSimularItem}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Simular Anulación Ítem (Cebiche)</span>
            </button>

            <button
              onClick={handleSimularComanda}
              className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>Simular Comanda Completa</span>
            </button>

            <button
              onClick={handleSimularDiaVacio}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Simular Día sin Anulaciones (0)</span>
            </button>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleRestablecer}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5 font-semibold text-[11px] transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                Restablecer Semillas Aúrea
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
