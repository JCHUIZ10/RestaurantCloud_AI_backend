import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FlaskConical,
} from 'lucide-react';

interface DemoAdminProductosWidgetProps {
  onSimularQuiebreLimon: () => void;
  onSimularReposicionLimon: () => void;
  onSimularCartaVacia: () => void;
  onRestablecerAurea: () => void;
}

export const DemoAdminProductosWidget: React.FC<DemoAdminProductosWidgetProps> = ({
  onSimularQuiebreLimon,
  onSimularReposicionLimon,
  onSimularCartaVacia,
  onRestablecerAurea,
}) => {
  const [colapsado, setColapsado] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-white rounded-2xl shadow-xl border border-aurea-champagne/60 overflow-hidden transition-all text-xs">
      {/* Cabecera del Widget de Pruebas */}
      <button
        type="button"
        onClick={() => setColapsado(!colapsado)}
        className="w-full px-4 py-2.5 bg-aurea-navy text-white font-semibold flex items-center justify-between hover:bg-aurea-navy/90 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-aurea-copper" />
          <span>Laboratorio de Pruebas • CU-ADMIN-04</span>
        </div>
        {colapsado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Contenido desplegable */}
      {!colapsado && (
        <div className="p-3.5 space-y-2.5 bg-aurea-champagne/10">
          <p className="text-[11px] text-aurea-navy/70">
            Simula escenarios operativos y reactividad de recetas culinarias:
          </p>

          <div className="grid grid-cols-1 gap-2">
            {/* Quiebre de Limón */}
            <button
              type="button"
              onClick={onSimularQuiebreLimon}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium transition-colors text-left"
            >
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Quiebre de Limón (Stock = 0)</div>
                <div className="text-[10px] text-rose-600">Pasa Ceviche y Causa a Agotado</div>
              </div>
            </button>

            {/* Reposición de Limón */}
            <button
              type="button"
              onClick={onSimularReposicionLimon}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition-colors text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Reponer Limón (Stock = 10 kg)</div>
                <div className="text-[10px] text-emerald-600">Reactiva disponibilidad de platos</div>
              </div>
            </button>

            {/* Simular Carta Vacía */}
            <button
              type="button"
              onClick={onSimularCartaVacia}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-black/5 text-aurea-navy/80 border border-aurea-champagne/60 font-medium transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 text-aurea-navy/60 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Simular Carta Vacía</div>
                <div className="text-[10px] text-aurea-navy/50">Muestra el onboarding guiado</div>
              </div>
            </button>

            {/* Restablecer Semillas */}
            <button
              type="button"
              onClick={onRestablecerAurea}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white font-bold transition-all shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Semillas Áurea</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
