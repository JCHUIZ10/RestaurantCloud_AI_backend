import React from 'react';
import { PlanSuscripcionDTO, EstadoSuscripcion, EstadoCobroDunningDTO } from '@/types/propietarioSuscripcion';
import { PageHeader } from '@/components/ui';
import { ShieldCheck, AlertTriangle, CreditCard } from 'lucide-react';

interface SuscripcionHeaderProps {
  plan: PlanSuscripcionDTO | null;
  estadoSuscripcion: EstadoSuscripcion;
  estadoCobro: EstadoCobroDunningDTO | null;
}

export const SuscripcionHeader: React.FC<SuscripcionHeaderProps> = ({
  plan,
  estadoSuscripcion,
  estadoCobro,
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
    <PageHeader
      icono={CreditCard}
      titulo="Suscripción y facturación"
      descripcion="Plan contratado, método de pago registrado en Stripe y tus facturas electrónicas."
      meta={
        <div className="flex flex-wrap items-center gap-2">
          {plan && (
            <span className="text-xs font-mono font-semibold text-aurea-navy bg-aurea-champagne/40 px-2.5 py-1 rounded-full border border-aurea-copper/30">
              Plan {plan.nombre} • S/ {(plan.periodicidad === 'anual' ? plan.precio_anual : plan.precio_mensual).toFixed(2)}/{plan.periodicidad === 'anual' ? 'año' : 'mes'}
            </span>
          )}
          {renderBadgeEstado()}
        </div>
      }
    />
  );
};
