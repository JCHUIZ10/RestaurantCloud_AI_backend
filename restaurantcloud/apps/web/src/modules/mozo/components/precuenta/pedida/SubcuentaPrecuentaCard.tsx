import React from 'react';
import { CheckCircle2, ChefHat, Hourglass, IdCard, Building2, Hash, UserRound } from 'lucide-react';
import type { PrecuentaSubcuentaDTO } from '../../../../../types/mozo';
import { DIVISOR_IGV } from '@/shared/constants/tributario';
import { EstadoCocinaBadge } from '../EstadoCocinaBadge';
import { estiloComprobante, estiloMedioPago, formatearSoles } from '../estilosComprobante';

interface SubcuentaPrecuentaCardProps {
  subcuenta: PrecuentaSubcuentaDTO;
}

/** Tarjeta de comprobante de una subcuenta: titular, pago, platos, desglose y estado de cobro. */
export const SubcuentaPrecuentaCard: React.FC<SubcuentaPrecuentaCardProps> = ({ subcuenta }) => {
  const comprobante = estiloComprobante(subcuenta.tipo_comprobante);
  const medioPago = estiloMedioPago(subcuenta.medio_pago_tentativo);
  const IconoComprobante = comprobante.icono;
  const IconoPago = medioPago.icono;

  const cobrada = subcuenta.estado === 'cobrado';
  const pendientesServicio = subcuenta.items_pendientes_servicio ?? 0;
  const items = subcuenta.items ?? [];
  const total = Number(subcuenta.total_neto);
  const baseImponible = subcuenta.base_imponible ?? Math.round((total / DIVISOR_IGV) * 100) / 100;
  const igv = subcuenta.igv ?? Math.round((total - baseImponible) * 100) / 100;
  const descuento = subcuenta.descuento ?? 0;
  const recargo = subcuenta.monto_recargo ?? 0;
  const documento = subcuenta.documento_cliente?.trim();
  const sinDocumento = !documento || documento === '00000000';
  const esRuc = (documento?.length ?? 0) === 11;
  const IconoDocumento = esRuc ? Building2 : IdCard;

  return (
    <article className="flex flex-col rounded-2xl overflow-hidden border border-[#D5A06F]/30 bg-[#0B2340] shadow-lg">
      <div className={`h-1.5 ${comprobante.franja}`} aria-hidden="true" />

      <header className="px-4 pt-3.5 pb-3 flex items-start gap-3 border-b border-white/10">
        <span className="font-serif text-4xl leading-none text-[#D5A06F] select-none">
          {subcuenta.numero_subcuenta}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${comprobante.insignia}`}
            >
              <IconoComprobante className="w-3.5 h-3.5" />
              {comprobante.etiqueta}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#FFF9F0] truncate">
            <UserRound className="w-4 h-4 text-[#D5A06F] shrink-0" />
            <span className="truncate">
              {subcuenta.nombre_titular || subcuenta.nombre_referencia}
            </span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
            <IconoDocumento className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {sinDocumento ? 'Sin documento (consumidor final)' : `${esRuc ? 'RUC' : 'DNI'} ${documento}`}
          </p>
        </div>
      </header>

      <div className="px-4 py-2.5 flex items-center justify-between gap-2 bg-white/[0.03] border-b border-white/10 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
          <IconoPago className="w-4 h-4 text-[#D5A06F]" />
          {medioPago.etiqueta}
        </span>
        {medioPago.esBilletera && subcuenta.numero_operacion && (
          <span className="inline-flex items-center gap-1 font-mono text-emerald-300">
            <Hash className="w-3.5 h-3.5" />
            Op. {subcuenta.numero_operacion}
          </span>
        )}
      </div>

      <ul className="divide-y divide-white/5 max-h-60 overflow-y-auto">
        {items.length === 0 && (
          <li className="px-4 py-5 text-center text-xs text-slate-400">
            Esta subcuenta no tiene platos asignados.
          </li>
        )}
        {items.map((item, indice) => (
          <li
            key={`${item.id ?? item.producto_id}-${indice}`}
            className="px-4 py-2.5 flex items-start justify-between gap-3 text-sm"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-[#D5A06F]/20 text-[#F4D7B0] border border-[#D5A06F]/40 text-xs font-bold shrink-0">
                {item.cantidad}x
              </span>
              <div className="min-w-0">
                <p className="font-medium text-slate-100 leading-snug">
                  {item.nombre || item.producto_nombre}
                </p>
                <div className="mt-1">
                  <EstadoCocinaBadge estado={item.estado_cocina} />
                </div>
              </div>
            </div>
            <span className="font-semibold text-slate-200 shrink-0">{formatearSoles(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="px-4 py-3 space-y-1 text-xs text-slate-300 border-t border-white/10 bg-black/20">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="font-mono">{formatearSoles(subcuenta.subtotal_bruto ?? total)}</dd>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-emerald-300">
            <dt>Descuento</dt>
            <dd className="font-mono">-{formatearSoles(descuento)}</dd>
          </div>
        )}
        {recargo > 0 && (
          <div className="flex justify-between text-amber-300">
            <dt>Recargo por medio de pago</dt>
            <dd className="font-mono">+{formatearSoles(recargo)}</dd>
          </div>
        )}
        <div className="flex justify-between text-slate-400">
          <dt>Base imponible</dt>
          <dd className="font-mono">{formatearSoles(baseImponible)}</dd>
        </div>
        <div className="flex justify-between text-slate-400">
          <dt>IGV 18%</dt>
          <dd className="font-mono">{formatearSoles(igv)}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 mt-1 border-t border-white/10">
          <dt className="text-sm font-semibold text-[#FFF9F0]">Total</dt>
          <dd className="font-serif text-2xl text-[#F4D7B0]">{formatearSoles(total)}</dd>
        </div>
      </dl>

      <footer
        className={`px-4 py-2.5 flex items-center gap-2 text-xs font-semibold border-t ${
          cobrada
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }`}
      >
        {cobrada ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <Hourglass className="w-4 h-4 shrink-0" />
        )}
        <span>{cobrada ? 'Cobrada en Caja' : 'Pendiente de cobro en Caja'}</span>
        {!cobrada && pendientesServicio > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <ChefHat className="w-3.5 h-3.5" />
            {pendientesServicio} {pendientesServicio === 1 ? 'plato por servir' : 'platos por servir'}
          </span>
        )}
      </footer>
    </article>
  );
};
