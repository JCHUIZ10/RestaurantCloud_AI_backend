import React from 'react';
import { EyeOff, AlertTriangle, CalendarDays, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PropietarioIncidentesKpisDTO } from '@/types/propietario';

interface PropietarioIncidentesHeaderProps {
  kpis: PropietarioIncidentesKpisDTO;
  soloNoVistos: boolean;
  onToggleSoloNoVistos: () => void;
}

export const PropietarioIncidentesHeader: React.FC<PropietarioIncidentesHeaderProps> = ({
  kpis,
  soloNoVistos,
  onToggleSoloNoVistos,
}) => {
  return (
    <div className="space-y-6">
      {/* Título Principal y Alcance */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aurea-copper">
          <span>Supervisión Corporativa Multi-Sede</span>
          <span>•</span>
          <span>RestaurantCloud AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-aurea-navy tracking-tight mt-1">
          Consolidado de Incidentes de la Empresa
        </h1>
        <p className="text-sm text-aurea-navy/70 mt-1 max-w-3xl">
          Supervisión operativa, disciplinaria y de servicio en todas las sedes en tiempo real. 
          Auditoría de hechos, toma de conocimiento y emisión de directivas ejecutivas.
        </p>
      </div>

      {/* Tarjetas KPI Ejecutivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: No revisados por mí */}
        <div
          onClick={onToggleSoloNoVistos}
          className={`cursor-pointer rounded-2xl p-5 border transition-all relative overflow-hidden group shadow-sm hover:shadow-md ${
            soloNoVistos
              ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/30'
              : kpis.no_revisados > 0
              ? 'bg-white border-amber-200 hover:border-amber-400'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                No revisados por mí
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-serif text-aurea-navy">
                  {kpis.no_revisados}
                </span>
                <span className="text-xs text-slate-500">
                  {kpis.no_revisados === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </div>
            </div>

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                kpis.no_revisados > 0
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <EyeOff className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {kpis.no_revisados_alta > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                {kpis.no_revisados_alta} de gravedad alta
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sin críticos pendientes
              </span>
            )}
            <span className="text-[11px] text-aurea-copper font-medium group-hover:underline">
              {soloNoVistos ? '✓ Filtrando' : 'Clic para filtrar'}
            </span>
          </div>
        </div>

        {/* KPI 2: Gravedad Alta (En Curso) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Gravedad alta (en curso)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-bold font-serif ${
                    kpis.gravedad_alta_activos > 0 ? 'text-rose-600' : 'text-aurea-navy'
                  }`}
                >
                  {kpis.gravedad_alta_activos}
                </span>
                <span className="text-xs text-slate-500">
                  {kpis.gravedad_alta_activos === 1 ? 'crítico activo' : 'críticos activos'}
                </span>
              </div>
            </div>

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                kpis.gravedad_alta_activos > 0
                  ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            {kpis.gravedad_alta_activos > 0 ? (
              <span className="text-rose-700 font-medium">
                Atención requerida en sedes operativas
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Todas las sedes operando sin alertas graves
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Total del Mes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total incidentes (este mes)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold font-serif text-aurea-navy">
                  {kpis.total_mes}
                </span>
                <span className="text-xs text-slate-500">registrados</span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-slate-100 text-aurea-navy flex items-center justify-center border border-slate-200">
              <CalendarDays className="w-5 h-5 text-aurea-copper" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {kpis.desglose_mes.resueltos} resueltos
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              {kpis.desglose_mes.en_revision} en revisión
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 font-medium text-blue-700">
              {kpis.desglose_mes.abiertos} abiertos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
