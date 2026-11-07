import React from 'react';
import { BadgePercent, Building2, CheckCircle2, Hash, IdCard, UserRound } from 'lucide-react';
import type { CuentaRegistradaDTO, PromocionSedeDTO } from '../../../../../types/mozo';
import { estiloComprobante, estiloMedioPago } from '../estilosComprobante';

interface TarjetaCuentaRegistradaProps {
  cuenta: CuentaRegistradaDTO;
  promocion?: PromocionSedeDTO | null;
}

/** Lo que el mozo registró al pedir la cuenta: comprobante, cliente y medio de pago. */
export const TarjetaCuentaRegistrada: React.FC<TarjetaCuentaRegistradaProps> = ({ cuenta, promocion }) => {
  const comprobante = estiloComprobante(cuenta.tipo_comprobante);
  const medioPago = estiloMedioPago(cuenta.medio_pago);
  const IconoComprobante = comprobante.icono;
  const IconoPago = medioPago.icono;

  const documento = cuenta.documento_cliente?.trim();
  const esRuc = (documento?.length ?? 0) === 11;
  const IconoDocumento = esRuc ? Building2 : IdCard;
  const nombre = cuenta.consumidor_final ? 'Consumidor final' : cuenta.nombre_cliente || 'Cliente sin nombre';

  return (
    <section className="rounded-2xl overflow-hidden border border-[#D5A06F]/30 bg-[#0B2340] shadow-lg">
      <div className={`h-1.5 ${comprobante.franja}`} aria-hidden="true" />

      <header className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#FFF9F0]">Cuenta registrada</h3>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${comprobante.insignia}`}
        >
          <IconoComprobante className="w-3.5 h-3.5" />
          {comprobante.etiqueta}
        </span>
      </header>

      <dl className="p-4 space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <UserRound className="w-4 h-4 text-[#D5A06F] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <dt className="text-xs text-slate-400">Cliente</dt>
            <dd className="font-semibold text-slate-100 break-words">{nombre}</dd>
            {!cuenta.consumidor_final && documento && (
              <dd className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                <IconoDocumento className="w-3.5 h-3.5 text-slate-400" />
                {esRuc ? 'RUC' : 'DNI'} {documento}
              </dd>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <IconoPago className="w-4 h-4 text-[#D5A06F] mt-0.5 shrink-0" />
          <div>
            <dt className="text-xs text-slate-400">Medio de pago</dt>
            <dd className="font-semibold text-slate-100">{medioPago.etiqueta}</dd>
            {medioPago.esBilletera && cuenta.numero_operacion && (
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-mono text-emerald-300">
                  <Hash className="w-3.5 h-3.5" />
                  Op. {cuenta.numero_operacion}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pago verificado
                </span>
              </dd>
            )}
          </div>
        </div>

        {promocion && (
          <div className="flex items-start gap-3">
            <BadgePercent className="w-4 h-4 text-[#D5A06F] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-slate-400">Promoción aplicada</dt>
              <dd className="font-semibold text-slate-100">
                {promocion.nombre}
                {promocion.porcentaje_descuento > 0 && (
                  <span className="ml-2 text-emerald-300">-{promocion.porcentaje_descuento}%</span>
                )}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
};
