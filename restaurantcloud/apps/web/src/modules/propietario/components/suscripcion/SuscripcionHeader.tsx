import React from 'react';
import { PlanSuscripcionDTO, EstadoSuscripcion, EstadoCobroDunningDTO } from '@/types/propietarioSuscripcion';
import { Button } from '@/components/ui/Button';
import { Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SuscripcionHeaderProps {
  plan: PlanSuscripcionDTO | null;
  estadoSuscripcion: EstadoSuscripcion;
  estadoCobro: EstadoCobroDunningDTO | null;
  onAbrirCambiarPlan: () => void;
}

export const SuscripcionHeader: React.FC<SuscripcionHeaderProps> = ({
  plan,
  estadoSuscripcion,
  estadoCobro,
  onAbrirCambiarPlan,
}) => {
  const renderBadgeEstado = () => {
    if (estadoSuscripcion === 'suspendida') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          Suscripción Suspendida
        </span>
      );
    }

    if (estadoCobro?.en_periodo_gracia || estadoSuscripcion === 'en_gracia') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          En Periodo de Gracia ({estadoCobro?.dias_gracia_restantes ?? 5} días)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Suscripción Activa y al Día
      </span>
    );
  };

  return (
    <header className="space-y-4">
      {/* Breadcrumbs y Título */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <nav
            aria-label="Migas de pan"
            className="text-[11px] font-mono uppercase tracking-wider text-aurea-navy/60 mb-1"
          >
            Configuración &gt; Facturación &gt;{' '}
            <span className="text-aurea-copper font-semibold">Suscripción</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-aurea-navy font-bold tracking-tight">
              Gestión de Suscripción y Facturación
            </h1>
            {plan && (
              <span className="text-xs font-mono font-semibold text-aurea-navy bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Plan {plan.nombre} • S/ {plan.precio_mensual.toFixed(2)}/mes
              </span>
            )}
            {renderBadgeEstado()}
          </div>
          <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 mt-1 max-w-2xl">
            Supervisa el plan contratado para tu restaurante, mantén al día tu método de pago registrado en Stripe y descarga tus facturas electrónicas oficiales.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            onClick={onAbrirCambiarPlan}
            className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold text-xs sm:text-sm py-2 px-4 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-aurea-champagne" />
            <span>Cambiar de Plan</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
