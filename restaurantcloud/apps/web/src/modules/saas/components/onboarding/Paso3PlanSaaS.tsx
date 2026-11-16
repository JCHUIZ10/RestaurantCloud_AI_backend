import React from 'react';
import {
  CreditCard,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { PlanSaaSDTO } from '@/types/saasTenants';
import { esPeriodoValido, validarPaso3 } from './validacionPasos';

interface Paso3PlanSaaSProps {
  /** Catálogo de planes activos (GET /saas/planes) */
  planes: PlanSaaSDTO[];
  cargandoPlanes: boolean;
  errorPlanes: string | null;
  onReintentarPlanes: () => void;
  planId: number;
  ciclo: 'mensual' | 'anual';
  fechaInicio: string;
  fechaFinPeriodo: string;
  onChange: (fields: {
    planId?: number;
    ciclo?: 'mensual' | 'anual';
    fechaInicio?: string;
    fechaFinPeriodo?: string;
  }) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}

export const Paso3PlanSaaS: React.FC<Paso3PlanSaaSProps> = ({
  planes,
  cargandoPlanes,
  errorPlanes,
  onReintentarPlanes,
  planId,
  ciclo,
  fechaInicio,
  fechaFinPeriodo,
  onChange,
  onAnterior,
  onSiguiente,
}) => {
  const periodoValido = esPeriodoValido(fechaInicio, fechaFinPeriodo);
  const planExiste = planes.some((plan) => plan.id === planId);
  const esValido =
    planExiste &&
    validarPaso3({
      plan_id: planId,
      fecha_inicio: fechaInicio,
      fecha_fin_periodo: fechaFinPeriodo,
    });
  // Se recomienda el plan intermedio del catálogo (ordenado por id en el backend)
  const planRecomendadoId = planes.length >= 3 ? planes[Math.floor(planes.length / 2)].id : null;

  return (
    <div className="bg-white rounded-3xl border border-aurea-copper/25 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-aurea-copper/15">
        <div className="w-10 h-10 rounded-xl bg-aurea-champagne/40 border border-aurea-copper/40 flex items-center justify-center text-aurea-navy">
          <CreditCard className="w-5 h-5 text-aurea-navy" />
        </div>
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy">
            3. Plan Contratado y Vigencia de Servicio
          </h2>
          <p className="text-xs sm:text-sm text-aurea-navy/70">
            Selección del plan comercial corporativo y periodicidad de renovación.
          </p>
        </div>
      </div>

      {/* Selector de Periodicidad: Mensual vs Anual */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-aurea-ivory border border-aurea-copper/25">
        <div>
          <span className="font-bold text-sm text-aurea-navy block">Ciclo de Facturación del Contrato:</span>
          <span className="text-xs text-aurea-navy/70">
            Los contratos anuales incluyen 2 meses de bonificación gratuita.
          </span>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border border-aurea-copper/30 shadow-inner">
          <button
            type="button"
            onClick={() => onChange({ ciclo: 'mensual' })}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              ciclo === 'mensual'
                ? 'bg-aurea-navy text-white shadow-sm'
                : 'text-aurea-navy/70 hover:text-aurea-navy'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => onChange({ ciclo: 'anual' })}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              ciclo === 'anual'
                ? 'bg-aurea-copper text-aurea-navy shadow-sm'
                : 'text-aurea-navy/70 hover:text-aurea-navy'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-aurea-navy" />
            <span>Anual (2 meses gratis)</span>
          </button>
        </div>
      </div>

      {/* Error al cargar el catálogo de planes */}
      {errorPlanes && !cargandoPlanes && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorPlanes}</span>
          </div>
          <button
            type="button"
            onClick={onReintentarPlanes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Skeleton mientras carga el catálogo */}
      {cargandoPlanes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true" aria-label="Cargando planes">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border-2 border-aurea-copper/15 bg-aurea-ivory/60 space-y-3 animate-pulse"
            >
              <div className="h-5 w-24 rounded bg-aurea-champagne/60" />
              <div className="h-7 w-32 rounded bg-aurea-copper/20" />
              <div className="h-3 w-full rounded bg-aurea-champagne/50" />
              <div className="h-3 w-3/4 rounded bg-aurea-champagne/50" />
            </div>
          ))}
        </div>
      )}

      {/* Grid de Planes del catálogo */}
      {!cargandoPlanes && planes.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planes.map((plan) => {
          const seleccionado = planId === plan.id;
          const precioActual = ciclo === 'anual' ? plan.precio_anual : plan.precio_mensual;
          const destacado = plan.id === planRecomendadoId;

          return (
            <div
              key={plan.id}
              onClick={() => onChange({ planId: plan.id })}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                seleccionado
                  ? 'border-aurea-copper bg-aurea-champagne/10 shadow-md ring-2 ring-aurea-copper/30'
                  : 'border-aurea-copper/20 hover:border-aurea-copper/50 bg-white'
              }`}
            >
              {destacado && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurea-copper text-aurea-navy uppercase tracking-wider shadow-sm">
                  Recomendado
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-aurea-navy">{plan.nombre}</h3>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      seleccionado
                        ? 'bg-aurea-navy border-aurea-navy text-white'
                        : 'border-aurea-copper/40'
                    }`}
                  >
                    {seleccionado && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-serif text-2xl font-bold text-aurea-navy">
                    S/ {precioActual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-aurea-navy/60 font-sans">
                    {ciclo === 'anual' ? ' / año' : ' / mes'}
                  </span>
                </div>

                {plan.descripcion && (
                  <p className="text-xs text-aurea-navy/70 mt-2 leading-relaxed">
                    {plan.descripcion}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-aurea-copper/15 space-y-1.5 text-xs text-aurea-navy/80">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta <strong>{plan.max_locales}</strong> sedes operativas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta <strong>{plan.max_mesas}</strong> mesas en salón</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta <strong>{plan.max_usuarios}</strong> cuentas de personal</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* El plan del borrador ya no existe o está inactivo */}
      {!cargandoPlanes && planes.length > 0 && !planExiste && (
        <p role="alert" className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Selecciona uno de los planes disponibles para continuar.</span>
        </p>
      )}

      {/* Fechas de Vigencia */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-bold text-aurea-navy mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Fecha de Inicio de Vigencia: *</span>
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => onChange({ fechaInicio: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
          />
        </div>

        <div>
          <label className="block font-bold text-aurea-navy mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Fecha de Fin de Periodo Contratado: *</span>
          </label>
          <input
            type="date"
            value={fechaFinPeriodo}
            min={fechaInicio || undefined}
            onChange={(e) => onChange({ fechaFinPeriodo: e.target.value })}
            aria-invalid={!periodoValido}
            aria-describedby={!periodoValido ? 'error-periodo-contrato' : undefined}
            className={`w-full px-3 py-2 rounded-xl bg-white border font-mono text-sm focus:outline-none focus:ring-2 ${
              periodoValido
                ? 'border-aurea-copper/30 focus:ring-aurea-copper/40'
                : 'border-rose-400 focus:ring-rose-300'
            }`}
          />
        </div>

        {!periodoValido && (
          <p
            id="error-periodo-contrato"
            role="alert"
            className="sm:col-span-2 text-[11px] text-rose-700 font-semibold flex items-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {!fechaInicio || !fechaFinPeriodo
                ? 'Indica la fecha de inicio y la de fin del periodo contratado.'
                : 'La fecha de fin debe ser posterior a la fecha de inicio.'}
            </span>
          </p>
        )}
      </div>

      {/* Botones de Navegación */}
      <div className="pt-4 border-t border-aurea-copper/15 flex items-center justify-between">
        <button
          type="button"
          onClick={onAnterior}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-aurea-navy/80 border border-aurea-copper/30 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Datos de Propietario</span>
        </button>

        <button
          type="button"
          onClick={onSiguiente}
          disabled={!esValido}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-aurea-navy text-white hover:bg-opacity-95 shadow-md border border-aurea-copper/40 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continuar a Liquidación y Pago</span>
          <ArrowRight className="w-4 h-4 text-aurea-copper" />
        </button>
      </div>
    </div>
  );
};
