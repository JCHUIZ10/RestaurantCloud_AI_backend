import React from 'react';
import { MetodoPagoDTO, EstadoCobroDunningDTO } from '@/types/propietarioSuscripcion';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Lock,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface MetodoPagoCardProps {
  metodoPago: MetodoPagoDTO | null;
  estadoCobro: EstadoCobroDunningDTO | null;
  onActualizarTarjeta: () => void;
}

export const MetodoPagoCard: React.FC<MetodoPagoCardProps> = ({
  metodoPago,
  estadoCobro,
  onActualizarTarjeta,
}) => {
  const formatExp = (mes?: number, ano?: number) => {
    if (!mes || !ano) return '12/28';
    const mm = String(mes).padStart(2, '0');
    const yy = String(ano).slice(-2);
    return `${mm}/${yy}`;
  };

  const tieneErrorCobro =
    !estadoCobro?.al_dia ||
    metodoPago?.estado_cobro_tarjeta === 'rechazado' ||
    (estadoCobro?.monto_pendiente ?? 0) > 0;

  return (
    <article className="rounded-2xl border border-aurea-navy/10 bg-white p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Cabecera de la sección */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-aurea-copper" />
              Método de Pago Registrado
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarjeta principal asociada a los débitos recurrentes de tu suscripción.
            </p>
          </div>

          <div>
            {tieneErrorCobro ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Cobro Rechazado
              </span>
            ) : metodoPago?.proximo_a_vencer ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Expira Pronto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Al Día
              </span>
            )}
          </div>
        </div>

        {/* Tarjeta Visual de Crédito */}
        <div className="my-6">
          <div className="relative mx-auto max-w-sm rounded-2xl bg-gradient-to-br from-[#0B2340] via-[#163861] to-[#081729] text-white p-5 sm:p-6 shadow-xl overflow-hidden border border-slate-700">
            {/* Holograma / Chip decorativo */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-11 h-8 rounded-md bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 opacity-90 shadow-inner flex items-center justify-center border border-yellow-500/40">
                <div className="w-7 h-5 border border-amber-700/30 rounded grid grid-cols-2 gap-0.5" />
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-mono tracking-widest text-aurea-champagne uppercase">
                  {metodoPago?.marca || 'VISA'}
                </span>
              </div>
            </div>

            {/* Número enmascarado */}
            <div className="py-2">
              <p className="font-mono text-lg sm:text-xl tracking-[0.25em] text-slate-100 font-semibold drop-shadow">
                •••• •••• •••• {metodoPago?.ultimos_4 || '4242'}
              </p>
            </div>

            {/* Titular y Expiración */}
            <div className="flex items-end justify-between mt-4 pt-3 border-t border-white/10 text-xs">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-300 font-mono">
                  Titular de la Tarjeta
                </p>
                <p className="font-medium tracking-wide uppercase text-slate-100 truncate max-w-[190px]">
                  {metodoPago?.titular || 'Rodrigo De Las Casas'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-slate-300 font-mono">
                  Expira
                </p>
                <p className="font-mono font-semibold text-slate-100">
                  {formatExp(metodoPago?.exp_mes, metodoPago?.exp_ano)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso si la tarjeta está por vencer o rechazada */}
        {tieneErrorCobro && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              El último intento de cobro fue rechazado. Registra una nueva tarjeta de crédito o débito para mantener tu plan activo.
            </span>
          </div>
        )}

        {metodoPago?.proximo_a_vencer && !tieneErrorCobro && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4 text-xs text-amber-800 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Tu tarjeta expira en los próximos 30 días. Te sugerimos actualizarla antes del próximo ciclo de facturación.
            </span>
          </div>
        )}
      </div>

      {/* Botón de acción y garantía de seguridad */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          onClick={onActualizarTarjeta}
          className="w-full bg-aurea-navy hover:bg-aurea-navy/90 text-white font-bold text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-aurea-champagne" />
          <span>Cambiar Método de Pago</span>
        </Button>

        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 text-center leading-tight">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Tokenizado con <strong>Stripe Billing (PCI-DSS Nivel 1)</strong>. RestaurantCloud nunca almacena tu número de tarjeta ni CVC.
          </span>
        </p>
      </div>
    </article>
  );
};
