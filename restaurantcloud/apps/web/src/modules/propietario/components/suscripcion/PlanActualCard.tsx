import React from 'react';
import { PlanSuscripcionDTO, UsoRecursosDTO } from '@/types/propietarioSuscripcion';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Building2,
  Users,
  Grid,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface PlanActualCardProps {
  plan: PlanSuscripcionDTO;
  usoRecursos: UsoRecursosDTO;
  onCambiarPlan: () => void;
}

export const PlanActualCard: React.FC<PlanActualCardProps> = ({
  plan,
  usoRecursos,
  onCambiarPlan,
}) => {
  // Formatear fecha próximo cobro
  const fechaProximoCobro = new Date(plan.proximo_cobro).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getProgressColor = (porcentaje: number, limite: boolean) => {
    if (limite || porcentaje >= 90) return 'bg-amber-500';
    if (porcentaje >= 75) return 'bg-aurea-copper';
    return 'bg-aurea-navy';
  };

  return (
    <article className="rounded-2xl border border-aurea-navy/10 bg-white p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      {/* Detalle visual superior de acento */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-aurea-navy via-aurea-copper to-aurea-champagne" />

      <div>
        {/* Cabecera del Plan */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/30">
                <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
                Plan Activo
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: #{plan.id}</span>
            </div>

            <h2 className="font-serif text-3xl font-bold text-aurea-navy mt-2 flex items-baseline gap-2">
              Plan {plan.nombre}
            </h2>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-aurea-navy tracking-tight font-sans">
                S/ {plan.precio_mensual.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-slate-500">/ mes (facturación recurrente)</span>
            </div>

            {plan.proximo_plan && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Downgrade programado a <strong>Plan {plan.proximo_plan.nombre}</strong> a partir del <strong>01/Nov/2026</strong>.
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>
                Próximo cobro:{' '}
                <strong className="text-aurea-navy font-semibold">{fechaProximoCobro}</strong>
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onCambiarPlan}
              className="text-xs font-bold border-aurea-navy/20 text-aurea-navy hover:bg-aurea-navy/5 flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>Mejorar Plan</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-aurea-copper" />
            </Button>
          </div>
        </div>

        {/* Consumo de Recursos en Tiempo Real */}
        <div className="py-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-aurea-copper" />
              Consumo de Recursos en Tiempo Real
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Sincronizado con BD</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Medidor Locales */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-aurea-copper" />
                    Locales / Sedes
                  </span>
                  <span className="font-mono text-aurea-navy font-bold">
                    {usoRecursos.locales.usados} / {usoRecursos.locales.maximo}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      usoRecursos.locales.porcentaje,
                      usoRecursos.locales.limite_alcanzado
                    )}`}
                    style={{ width: `${usoRecursos.locales.porcentaje}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
                <span>{usoRecursos.locales.porcentaje}% utilizado</span>
                {usoRecursos.locales.limite_alcanzado && (
                  <span className="text-amber-600 font-bold">Límite alcanzado</span>
                )}
              </p>
            </div>

            {/* Medidor Mesas */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-aurea-copper" />
                    Mesas Activas
                  </span>
                  <span className="font-mono text-aurea-navy font-bold">
                    {usoRecursos.mesas.usados} / {usoRecursos.mesas.maximo}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      usoRecursos.mesas.porcentaje,
                      usoRecursos.mesas.limite_alcanzado
                    )}`}
                    style={{ width: `${usoRecursos.mesas.porcentaje}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
                <span>{usoRecursos.mesas.porcentaje}% utilizado</span>
                {usoRecursos.mesas.limite_alcanzado && (
                  <span className="text-amber-600 font-bold">Límite alcanzado</span>
                )}
              </p>
            </div>

            {/* Medidor Colaboradores */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-aurea-copper" />
                    Personal & Admins
                  </span>
                  <span className="font-mono text-aurea-navy font-bold">
                    {usoRecursos.usuarios_personal.usados} / {usoRecursos.usuarios_personal.maximo}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      usoRecursos.usuarios_personal.porcentaje,
                      usoRecursos.usuarios_personal.limite_alcanzado
                    )}`}
                    style={{ width: `${usoRecursos.usuarios_personal.porcentaje}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
                <span>{usoRecursos.usuarios_personal.porcentaje}% utilizado</span>
                {usoRecursos.usuarios_personal.limite_alcanzado && (
                  <span className="text-amber-600 font-bold">Límite alcanzado</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Módulos y Capacidades del Plan */}
        <div className="pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
            Capacidades Pro Habilitadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>KDS Cocina & Stock Rápido</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Carta Digital & Pedidos QR</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Asistente IA Predictivo</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Facturación SUNAT Integrada</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
