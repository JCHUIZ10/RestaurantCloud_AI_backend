import React from 'react';
import { CheckCircle, ShieldCheck, Building2, RotateCcw, ListFilter } from 'lucide-react';
import { SedeResumenDTO } from '@/types/propietario';

interface PropietarioIncidentesVacioStateProps {
  soloNoVistos: boolean;
  sedes: SedeResumenDTO[];
  resueltosPorSede: Record<string, { total_resueltos: number; no_revisados: number }>;
  onVerTodos: () => void;
  onLimpiarFiltros: () => void;
  hayFiltrosActivos: boolean;
}

export const PropietarioIncidentesVacioState: React.FC<PropietarioIncidentesVacioStateProps> = ({
  soloNoVistos,
  sedes,
  resueltosPorSede,
  onVerTodos,
  onLimpiarFiltros,
  hayFiltrosActivos,
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 shadow-sm text-center max-w-3xl mx-auto my-6 animate-fade-in">
      {/* Icono de Estado Positivo */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
        <CheckCircle className="w-3.5 h-3.5" />
        {soloNoVistos ? 'Al Día con tus Revisiones' : 'Bandeja Despejada'}
      </div>

      <h3 className="text-xl sm:text-2xl font-serif font-bold text-aurea-navy mt-1">
        {soloNoVistos
          ? 'No Existen Incidentes Pendientes de Revisión'
          : 'No se encontraron incidentes con los filtros seleccionados'}
      </h3>

      <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
        {soloNoVistos
          ? 'Has revisado todos los reportes operativos de tus sedes o no existen novedades pendientes de acuse. Los administradores de cada sede registrarán cualquier incidencia en tiempo real.'
          : 'Ajusta los criterios de búsqueda o limpia los filtros activos para consultar el historial completo de incidencias.'}
      </p>

      {/* Tarjeta de Resumen por Sede (Wireframe Vista 3) */}
      <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-left max-w-md mx-auto space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Estado Actual por Sede Operativa:
        </span>
        {sedes.map((s) => {
          const stats = resueltosPorSede[s.id] || { total_resueltos: 0, no_revisados: 0 };
          return (
            <div
              key={s.id}
              className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-slate-200/60 last:border-0"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-aurea-copper" />
                <span className="font-semibold text-aurea-navy">{s.nombre}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-700">0 pendientes</span>
                <span className="text-slate-400 text-xs ml-1.5">
                  ({stats.total_resueltos} resueltos este mes)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones de Recuperación */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {soloNoVistos && (
          <button
            onClick={onVerTodos}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-copper text-aurea-navy font-bold text-xs sm:text-sm hover:bg-aurea-copper/90 shadow-md transition-all active:scale-95"
          >
            <ListFilter className="w-4 h-4" />
            <span>Ver Todos los Incidentes</span>
          </button>
        )}

        {hayFiltrosActivos && (
          <button
            onClick={onLimpiarFiltros}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Limpiar Filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
