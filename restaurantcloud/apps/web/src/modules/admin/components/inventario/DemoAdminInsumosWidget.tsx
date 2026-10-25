import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Trash,
  AlertTriangle,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface DemoAdminInsumosWidgetProps {
  onVaciarInsumos: () => void;
  onRestablecerSemillas: () => void;
  onSimularQuiebreLimon: () => void;
  onSimularQuiebreLomo: () => void;
  onSimularReposicion: () => void;
  totalAuditorias: number;
}

export const DemoAdminInsumosWidget: React.FC<DemoAdminInsumosWidgetProps> = ({
  onVaciarInsumos,
  onRestablecerSemillas,
  onSimularQuiebreLimon,
  onSimularQuiebreLomo,
  onSimularReposicion,
  totalAuditorias,
}) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Panel Desplegable */}
      {abierto && (
        <div className="mb-2 w-80 bg-white rounded-2xl border border-aurea-champagne shadow-2xl p-4 text-xs space-y-3 animate-fade-in text-aurea-navy">
          <div className="flex items-center justify-between border-b border-aurea-champagne/40 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-aurea-copper">
              <Sparkles className="w-3.5 h-3.5" />
              Consola QA — Inventario
            </span>
            <button
              onClick={() => setAbierto(false)}
              className="text-aurea-navy/60 hover:text-aurea-navy text-xs px-1"
            >
              Cerrar
            </button>
          </div>

          <p className="text-xs text-aurea-navy/70">
            Herramientas interactivas para evaluar los estados operativos.
          </p>

          <div className="space-y-1.5">
            {/* 1. Probar Onboarding vacío */}
            <button
              type="button"
              onClick={onVaciarInsumos}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-between"
            >
              <span>1. Probar Despensa Vacía (Onboarding)</span>
              <Trash className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* 2. Quiebre de Limón */}
            <button
              type="button"
              onClick={onSimularQuiebreLimon}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 transition-colors flex items-center justify-between"
            >
              <span>2. Quiebre Limón (0 kg $\rightarrow$ Agotado)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </button>

            {/* 3. Quiebre de Lomo */}
            <button
              type="button"
              onClick={onSimularQuiebreLomo}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 transition-colors flex items-center justify-between"
            >
              <span>3. Quiebre Lomo Fino (Bloquea Carta)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </button>

            {/* 4. Reponer stock */}
            <button
              type="button"
              onClick={onSimularReposicion}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition-colors flex items-center justify-between"
            >
              <span>4. Reponer Limón (8 kg $\rightarrow$ Óptimo)</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            {/* 5. Restablecer semillas */}
            <button
              type="button"
              onClick={onRestablecerSemillas}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-aurea-champagne/30 hover:bg-aurea-champagne/50 border border-aurea-copper/30 text-aurea-navy font-semibold transition-colors flex items-center justify-between"
            >
              <span>5. Restablecer Semillas Canónicas</span>
              <RefreshCw className="w-3.5 h-3.5 text-aurea-copper" />
            </button>
          </div>

          <div className="pt-2 border-t border-aurea-champagne/40 flex items-center justify-between text-xs text-aurea-navy/60">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-aurea-copper" />
              Auditorías en memoria:
            </span>
            <span className="font-mono font-bold text-aurea-navy">
              {totalAuditorias} registros
            </span>
          </div>
        </div>
      )}

      {/* Botón Flotante Disparador */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-aurea-navy text-white text-xs font-semibold shadow-lg hover:bg-aurea-navy/90 hover:scale-105 transition-all border border-aurea-copper/40"
      >
        <Sparkles className="w-4 h-4 text-aurea-copper" />
        <span>Demo QA Inventario</span>
      </button>
    </div>
  );
};
