import React from 'react';
import { Receipt, Plus, RefreshCw, Sparkles } from 'lucide-react';

interface OnboardingComprasVacioProps {
  onNuevaCompra: () => void;
  onRestablecerSemillas: () => void;
  esFiltroSinResultados?: boolean;
  onLimpiarFiltros?: () => void;
}

export const OnboardingComprasVacio: React.FC<OnboardingComprasVacioProps> = ({
  onNuevaCompra,
  onRestablecerSemillas,
  esFiltroSinResultados = false,
  onLimpiarFiltros,
}) => {
  if (esFiltroSinResultados) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          No se encontraron fichas con los filtros actuales
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
          Intente ajustando el término de búsqueda, rango de fechas o tipo de comprobante.
        </p>
        {onLimpiarFiltros && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="mt-4 px-4 py-2 text-xs font-semibold text-primary-700 bg-primary-50 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center shadow-sm max-w-xl mx-auto my-8">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 text-primary-600 border border-primary-100 mx-auto flex items-center justify-center mb-5 shadow-sm">
        <Receipt className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Historial de Compras Inicializado</span>
      </div>

      <h3 className="text-lg font-bold text-gray-900">
        Aún no hay fichas de compra registradas
      </h3>
      <p className="mt-2 text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
        El registro de fichas de compra permite ingresar insumos al inventario, calcular costos reales con o sin IGV y reactivar platos agotados en el salón.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNuevaCompra}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Primera Compra</span>
        </button>

        <button
          type="button"
          onClick={onRestablecerSemillas}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Cargar Semillas de Prueba</span>
        </button>
      </div>
    </div>
  );
};
