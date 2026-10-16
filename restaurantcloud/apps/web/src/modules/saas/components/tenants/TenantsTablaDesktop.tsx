import React from 'react';
import { CreditCard, Eye, Store } from 'lucide-react';
import type { TenantItemDTO } from '@/types/saasTenants';

interface TenantsTablaDesktopProps {
  tenants: TenantItemDTO[];
  onVerExpediente: (empresaId: string) => void;
}

export const TenantsTablaDesktop: React.FC<TenantsTablaDesktopProps> = ({
  tenants,
  onVerExpediente,
}) => {
  const getBadgeEstado = (tenant: TenantItemDTO) => {
    switch (tenant.estado_suscripcion) {
      case 'activa':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Activa / Al Día</span>
          </span>
        );
      case 'periodo_gracia':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>En Gracia (Día {tenant.dia_gracia_actual ?? 1}/5)</span>
          </span>
        );
      case 'suspendida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Suspendida (Impago)</span>
          </span>
        );
      case 'pendiente_baja':
      case 'eliminada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Baja Solicitada</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getBadgePlan = (planNombre: string) => {
    if (planNombre.toLowerCase().includes('enterprise')) {
      return (
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Enterprise
        </span>
      );
    }
    if (planNombre.toLowerCase().includes('pro')) {
      return (
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
          Plan Pro
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        Starter
      </span>
    );
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
    <div className="hidden lg:block bg-white rounded-2xl border border-aurea-copper/25 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-aurea-champagne/20 border-b border-aurea-copper/20 text-[11px] font-bold text-aurea-navy/70 uppercase tracking-wider">
              <th className="py-3.5 px-4">Empresa / Razón Social</th>
              <th className="py-3.5 px-3">RUC</th>
              <th className="py-3.5 px-3">Plan SaaS</th>
              <th className="py-3.5 px-3 text-center">Sedes</th>
              <th className="py-3.5 px-3">Estado Suscripción</th>
              <th className="py-3.5 px-3">Próximo Cobro / Venc.</th>
              <th className="py-3.5 px-3">Medio Pago</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurea-copper/10 text-sm font-sans">
            {tenants.map((item) => {
              const esGracia = item.estado_suscripcion === 'periodo_gracia';
              return (
                <tr
                  key={item.empresa_id}
                  className={`hover:bg-aurea-champagne/10 transition-colors ${
                    esGracia ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Empresa y Razón Social */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-aurea-navy text-aurea-ivory flex items-center justify-center font-serif text-sm font-bold shrink-0 border border-aurea-copper/30">
                        {item.razon_social.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-aurea-navy truncate flex items-center gap-1.5">
                          <span>{item.razon_social}</span>
                          {item.origen_alta === 'manual_admin' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-aurea-champagne/50 text-aurea-navy border border-aurea-copper/30 font-medium">
                              B2B Manual
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-aurea-navy/60 font-mono truncate">
                          {item.codigo_display} • {item.nombre_comercial_sede || 'Sede Principal'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* RUC */}
                  <td className="py-4 px-3">
                    <span className="font-mono text-xs font-semibold text-aurea-navy bg-aurea-ivory px-2 py-1 rounded border border-aurea-copper/20">
                      {item.ruc}
                    </span>
                  </td>

                  {/* Plan SaaS */}
                  <td className="py-4 px-3">{getBadgePlan(item.plan_nombre)}</td>

                  {/* Sedes */}
                  <td className="py-4 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-aurea-navy/80 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      <Store className="w-3.5 h-3.5 text-aurea-copper" />
                      <span>{item.locales_activos} sed.</span>
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-3">{getBadgeEstado(item)}</td>

                  {/* Próximo cobro */}
                  <td className="py-4 px-3 text-xs text-aurea-navy/80">
                    <div className="font-medium">{formatearFecha(item.fecha_proximo_cobro)}</div>
                    {item.estado_suscripcion === 'periodo_gracia' ? (
                      <span className="text-[10px] text-amber-700 font-bold uppercase">
                        (En reintento)
                      </span>
                    ) : item.estado_suscripcion === 'suspendida' ? (
                      <span className="text-[10px] text-rose-700 font-bold uppercase">(Cortado)</span>
                    ) : (
                      <span className="text-[10px] text-emerald-700">(Al día)</span>
                    )}
                  </td>

                  {/* Medio Pago */}
                  <td className="py-4 px-3">
                    <div className="inline-flex items-center gap-1.5 text-xs text-aurea-navy/80 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                      <span className="truncate max-w-[120px]">{item.metodo_pago_detalle}</span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => onVerExpediente(item.empresa_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-champagne/40 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-aurea-copper" />
                      <span>Expediente</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer de la tabla */}
      <div className="p-4 bg-aurea-ivory/50 border-t border-aurea-copper/15 flex items-center justify-between text-xs text-aurea-navy/60">
        <span>Mostrando {tenants.length} empresas registradas en la consola</span>
        <span className="font-mono">Página 1 de 1</span>
      </div>
    </div>
  );
};
