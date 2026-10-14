import React from 'react';
import {
  CheckCircle2,
  Plus,
  Sparkles,
} from 'lucide-react';

interface IncidentesVacioStateProps {
  onNuevoIncidente: () => void;
  esFiltrado?: boolean;
  onLimpiarFiltros?: () => void;
}

export const IncidentesVacioState: React.FC<IncidentesVacioStateProps> = ({
  onNuevoIncidente,
  esFiltrado = false,
  onLimpiarFiltros,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-6">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-aurea-navy text-aurea-champagne flex items-center justify-center border-2 border-white">
          <Sparkles className="w-3 h-3 text-aurea-copper" />
        </div>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-lg sm:text-xl font-serif font-bold text-aurea-navy">
          {esFiltrado
            ? 'No hay incidentes para los filtros seleccionados'
            : 'Operación sin incidentes activos en Sede Miraflores'}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {esFiltrado ? (
            'Intenta modificar o limpiar los criterios de búsqueda para visualizar otros registros de la sucursal.'
          ) : (
            'Todos los turnos de servicio, cocina y caja se están desarrollando con normalidad. Si surge alguna eventualidad, rotura de vajilla, queja o descuadre de caja, puedes registrarla para mantener la trazabilidad.'
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {esFiltrado && onLimpiarFiltros && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors"
          >
            Limpiar Filtros
          </button>
        )}

        <button
          type="button"
          onClick={onNuevoIncidente}
          className="px-5 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs font-bold shadow-md shadow-aurea-navy/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-aurea-champagne" />
          <span>Registrar Nuevo Incidente</span>
        </button>
      </div>
    </div>
  );
};
