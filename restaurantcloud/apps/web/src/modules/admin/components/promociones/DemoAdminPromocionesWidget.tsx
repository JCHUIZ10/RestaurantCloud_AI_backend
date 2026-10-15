import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Tag,
  Zap,
  Sparkles,
  ShoppingBag,
  Clock,
  Sun,
} from 'lucide-react';
import { mockAdminService } from '../../services/mockAdminService';

interface DemoAdminPromocionesWidgetProps {
  onRecargar: () => void;
}

export const DemoAdminPromocionesWidget: React.FC<DemoAdminPromocionesWidgetProps> = ({
  onRecargar,
}) => {
  const [colapsado, setColapsado] = useState(true);

  const handleSimularUsoCaja = async () => {
    await mockAdminService.simularUsoEnCaja();
    onRecargar();
  };

  const handleSimularCupoAgotado = async () => {
    await mockAdminService.simularCupoAgotado();
    onRecargar();
  };

  const handleSimularCupoDiarioAgotado = async () => {
    await mockAdminService.simularCupoDiarioAgotado();
    onRecargar();
  };

  const handleSimularNuevoDia = async () => {
    await mockAdminService.simularNuevoDia();
    onRecargar();
  };

  const handleSimularSedeVacia = () => {
    mockAdminService.simularSedeVaciaPromociones();
    onRecargar();
  };

  const handleRestablecer = () => {
    mockAdminService.restablecerSemillasPromociones();
    onRecargar();
  };

  return (
    <aside
      aria-label="Banco de pruebas QA Gestión de Promociones"
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
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                QA Demo: Promociones & Caja
              </span>
              <span className="text-[10px] text-amber-400 font-mono block">
                CU-ADMIN-17 / CU-CAJA-02
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
              Pruebe la interacción en caliente de promociones con el Punto de Venta de Caja y estados de frontera:
            </p>

            <button
              onClick={handleSimularUsoCaja}
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Simular Venta en Caja (-S/ 18.00)</span>
            </button>

            <button
              onClick={handleSimularCupoAgotado}
              className="w-full py-1.5 px-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span>Agotar Cupo Global (50/50)</span>
            </button>

            <button
              onClick={handleSimularCupoDiarioAgotado}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Agotar Cupo de Hoy (25/25)</span>
            </button>

            <button
              onClick={handleSimularNuevoDia}
              className="w-full py-1.5 px-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <Sun className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span>Simular Nuevo Día (Reset O(1))</span>
            </button>

            <button
              onClick={handleSimularSedeVacia}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 text-left font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Simular Sede Nueva (Onboarding)</span>
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
