import React from 'react';
import { Eye, CreditCard, Store, Calendar } from 'lucide-react';
import type { TenantItemDTO } from '@/types/saasTenants';

interface TenantCardMobileProps {
  tenants: TenantItemDTO[];
  onVerExpediente: (empresaId: string) => void;
}

export const TenantCardMobile: React.FC<TenantCardMobileProps> = ({
  tenants,
  onVerExpediente,
}) => {
  const getBadgeEstado = (tenant: TenantItemDTO) => {
    switch (tenant.estado_suscripcion) {
      case 'activa':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Activa</span>
          </span>
        );
      case 'periodo_gracia':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Gracia (Día {tenant.dia_gracia_actual ?? 1}/5)</span>
          </span>
        );
      case 'suspendida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Suspendida</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Baja</span>
          </span>
        );
    }
  };

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="block lg:hidden space-y-3">
      {tenants.map((item) => {
        const esGracia = item.estado_suscripcion === 'periodo_gracia';
        return (
          <div
            key={item.empresa_id}
            className={`p-4 rounded-2xl bg-white border shadow-sm space-y-3 transition-all ${
              esGracia ? 'border-amber-300 bg-amber-50/20' : 'border-aurea-copper/25'
            }`}
          >
            {/* Cabecera de la tarjeta móvil */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-aurea-navy text-aurea-ivory flex items-center justify-center font-serif text-base font-bold shrink-0 border border-aurea-copper/30">
                  {item.razon_social.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-aurea-navy truncate leading-tight">
                    {item.razon_social}
                  </h3>
                  <div className="text-xs text-aurea-navy/60 font-mono mt-0.5">
                    {item.codigo_display} • RUC {item.ruc}
                  </div>
                </div>
              </div>
              <div>{getBadgeEstado(item)}</div>
            </div>

            {/* Metadatos en 2 columnas */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-aurea-copper/10 text-aurea-navy/80">
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                <span>{item.locales_activos} sedes activas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold px-2 py-0.5 rounded bg-aurea-champagne/40 border border-aurea-copper/30 text-[10px]">
                  {item.plan_nombre}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                <span>Cobro: {formatearFecha(item.fecha_proximo_cobro)}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <CreditCard className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                <span className="truncate">{item.metodo_pago_detalle}</span>
              </div>
            </div>

            {/* Botón táctil grande de acción */}
            <button
              onClick={() => onVerExpediente(item.empresa_id)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-aurea-navy text-aurea-ivory hover:bg-opacity-95 shadow-sm border border-aurea-copper/30 flex items-center justify-center gap-2 active:scale-[0.99] transition-all min-h-[44px]"
            >
              <Eye className="w-4 h-4 text-aurea-copper" />
              <span>Ver Expediente del Tenant</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
