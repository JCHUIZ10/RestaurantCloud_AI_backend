import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';
import { BannerCambioProgramado } from '../cambiar-plan/BannerCambioProgramado';
import { PlanSuscripcionDTO, UsoRecursosDTO } from '@/types/propietarioSuscripcion';
import { ConsumoRecursosRealTime } from './ConsumoRecursosRealTime';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  XCircle,
} from 'lucide-react';

interface PlanActualCardProps {
  plan: PlanSuscripcionDTO;
  usoRecursos: UsoRecursosDTO;
  cancelandoCambio: boolean;
  onCancelarCambio: () => void;
  onElegirConservar: () => void;
}

export const PlanActualCard: React.FC<PlanActualCardProps> = ({
  plan,
  usoRecursos,
  cancelandoCambio,
  onCancelarCambio,
  onElegirConservar,
}) => {
  const esAnual = plan.periodicidad === 'anual';

  // Formatear fecha próximo cobro
  const fechaProximoCobro = !plan.proximo_cobro ? '—' : new Date(plan.proximo_cobro).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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
                S/ {(esAnual ? plan.precio_anual : plan.precio_mensual).toFixed(2)}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {esAnual ? '/ año (facturación anual)' : '/ mes (facturación recurrente)'}
              </span>
            </div>

            {plan.proximo_plan && (
              <div className="mt-4">
                <BannerCambioProgramado
                  nombrePlan={plan.proximo_plan.nombre}
                  ciclo={plan.proximo_plan.ciclo}
                  fechaEfectiva={plan.proximo_plan.fecha_efectiva}
                  diasRestantes={plan.proximo_plan.dias_restantes}
                  hayExcedentes={plan.proximo_plan.hay_excedentes}
                  seleccionGuardada={plan.proximo_plan.seleccion_guardada}
                  cancelando={cancelandoCambio}
                  onCancelar={onCancelarCambio}
                  onElegirConservar={onElegirConservar}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>
                Próximo cobro:{' '}
                <strong className="text-aurea-navy font-semibold">{fechaProximoCobro}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Consumo de Recursos en Tiempo Real */}
        <div className="py-6 border-b border-slate-100">
          <ConsumoRecursosRealTime usoRecursos={usoRecursos} />
        </div>

        {/* Funciones incluidas en el plan, según los flags reales del plan contratado */}
        <div className="pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
            Funciones del Plan {plan.nombre}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              [usoRecursos.incluye_reservas, 'Módulo de reservas'],
              [usoRecursos.incluye_reportes_avanzados, 'Reportes avanzados'],
              [usoRecursos.incluye_asistente_ia, 'Asistente IA de salón'],
              [usoRecursos.incluye_prediccion_ia, 'Predicción de demanda IA'],
            ].map(([incluido, texto]) => (
              <div
                key={texto as string}
                className={`flex items-center gap-2 text-xs font-medium ${
                  incluido ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {incluido ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span>{texto as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link
        to={ROUTES.PROPIETARIO_CAMBIAR_PLAN}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-aurea-copper/50 bg-white px-4 py-2.5 text-sm font-semibold text-aurea-navy shadow-sm transition-colors hover:bg-aurea-champagne/25"
      >
        <Sparkles className="w-4 h-4 text-aurea-copper" />
        Comparar y cambiar de plan
      </Link>
    </article>
  );
};
