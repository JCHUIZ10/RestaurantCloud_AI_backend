import React, { useState } from 'react';
import { Sparkles, RefreshCw, Trash, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface DemoAdminCategoriasWidgetProps {
  onVaciarCategorias: () => void;
  onRestablecerSemillas: () => void;
  onSimularConflicto409: () => void;
  onAlternarErrorSimulado: () => void;
  simulandoError: boolean;
}

export const DemoAdminCategoriasWidget: React.FC<DemoAdminCategoriasWidgetProps> = ({
  onVaciarCategorias,
  onRestablecerSemillas,
  onSimularConflicto409,
  onAlternarErrorSimulado,
  simulandoError,
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
              Consola QA — Categorías
            </span>
            <button
              onClick={() => setAbierto(false)}
              className="text-aurea-navy/60 hover:text-aurea-navy text-xs px-1"
            >
              Cerrar
            </button>
          </div>

          <p className="text-[11px] text-aurea-navy/70">
            Herramientas interactivas para evaluar los 5 estados UX del Caso de Uso <strong>CU-ADMIN-02</strong>.
          </p>

          <div className="space-y-1.5">
            {/* Vaciar categorías */}
            <button
              type="button"
              onClick={onVaciarCategorias}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-between"
            >
              <span>1. Probar Onboarding (0 categorías)</span>
              <Trash className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* Simular 409 */}
            <button
              type="button"
              onClick={onSimularConflicto409}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 transition-colors flex items-center justify-between"
            >
              <span>2. Simular Bloqueo 409 (Platos)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            </button>

            {/* Simular error de red */}
            <button
              type="button"
              onClick={onAlternarErrorSimulado}
              className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex items-center justify-between ${
                simulandoError
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
            >
              <span>3. Error de Red: {simulandoError ? 'Activo' : 'Inactivo'}</span>
              {simulandoError ? (
                <EyeOff className="w-3.5 h-3.5 text-rose-700" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-rose-500" />
              )}
            </button>

            {/* Restablecer semillas canónicas */}
            <button
              type="button"
              onClick={onRestablecerSemillas}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-colors flex items-center justify-between font-semibold"
            >
              <span>Restablecer Semillas Áurea</span>
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      )}

      {/* Botón Flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-aurea-navy text-white text-xs font-semibold shadow-lg hover:shadow-xl hover:bg-aurea-navy/90 border border-aurea-copper/40 transition-all min-h-[44px]"
      >
        <Sparkles className="w-4 h-4 text-aurea-champagne" />
        <span>QA Demo CU-ADMIN-02</span>
      </button>
    </div>
  );
};
