import React from 'react';
import { CreditCard, Check, Sparkles, ArrowLeft, ArrowRight, Calendar } from 'lucide-react';

export interface PlanOpcion {
  id: number;
  nombre: string;
  precioMensual: number;
  precioAnual: number;
  descripcion: string;
  locales: number;
  mesas: number;
  usuarios: number;
  destacado?: boolean;
}

const PLANES_DISPONIBLES: PlanOpcion[] = [
  {
    id: 1,
    nombre: 'Starter',
    precioMensual: 40.0,
    precioAnual: 400.0,
    descripcion: 'Para pollerías y restaurantes de salón único.',
    locales: 1,
    mesas: 25,
    usuarios: 5,
  },
  {
    id: 2,
    nombre: 'Plan Pro',
    precioMensual: 80.0,
    precioAnual: 800.0,
    descripcion: 'Para restaurantes en expansión con múltiples sedes, KDS y reservas.',
    locales: 3,
    mesas: 30,
    usuarios: 15,
    destacado: true,
  },
  {
    id: 3,
    nombre: 'Enterprise',
    precioMensual: 160.0,
    precioAnual: 1600.0,
    descripcion: 'Para franquicias y cadenas con suite completa de IA.',
    locales: 10,
    mesas: 60,
    usuarios: 40,
  },
];

interface Paso3PlanSaaSProps {
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
  planId,
  ciclo,
  fechaInicio,
  fechaFinPeriodo,
  onChange,
  onAnterior,
  onSiguiente,
}) => {
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

      {/* Grid de 3 Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANES_DISPONIBLES.map((plan) => {
          const seleccionado = planId === plan.id;
          const precioActual = ciclo === 'anual' ? plan.precioAnual : plan.precioMensual;

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
              {plan.destacado && (
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

                <p className="text-xs text-aurea-navy/70 mt-2 leading-relaxed">
                  {plan.descripcion}
                </p>

                <div className="mt-4 pt-3 border-t border-aurea-copper/15 space-y-1.5 text-xs text-aurea-navy/80">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta <strong>{plan.locales}</strong> sedes operativas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta <strong>{plan.mesas}</strong> mesas en salón</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hasta <strong>{plan.usuarios}</strong> cuentas de personal</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
            onChange={(e) => onChange({ fechaFinPeriodo: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-white border border-aurea-copper/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-aurea-copper/40"
          />
        </div>
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-aurea-navy text-white hover:bg-opacity-95 shadow-md border border-aurea-copper/40 transition-all active:scale-[0.98]"
        >
          <span>Continuar a Liquidación y Pago</span>
          <ArrowRight className="w-4 h-4 text-aurea-copper" />
        </button>
      </div>
    </div>
  );
};
