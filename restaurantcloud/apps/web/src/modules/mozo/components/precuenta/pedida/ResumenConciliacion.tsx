import React from 'react';
import { AlertCircle, CheckCircle2, Scale } from 'lucide-react';
import type { PrecuentaSubcuentaDTO } from '../../../../../types/mozo';
import { formatearSoles } from '../estilosComprobante';

interface ResumenConciliacionProps {
  subcuentas: PrecuentaSubcuentaDTO[];
  /** Consumo bruto de toda la mesa, antes de descuentos y recargos. */
  consumoMesa: number;
}

const redondear = (valor: number) => Math.round(valor * 100) / 100;

/** Compara la suma de las subcuentas con el consumo de la mesa para detectar diferencias. */
export const ResumenConciliacion: React.FC<ResumenConciliacionProps> = ({ subcuentas, consumoMesa }) => {
  const sumaBruta = redondear(
    subcuentas.reduce((acc, s) => acc + Number(s.subtotal_bruto ?? s.total_neto), 0)
  );
  const descuentos = redondear(subcuentas.reduce((acc, s) => acc + Number(s.descuento ?? 0), 0));
  const recargos = redondear(subcuentas.reduce((acc, s) => acc + Number(s.monto_recargo ?? 0), 0));
  const totalComprobantes = redondear(subcuentas.reduce((acc, s) => acc + Number(s.total_neto), 0));
  const igvTotal = redondear(subcuentas.reduce((acc, s) => acc + Number(s.igv ?? 0), 0));
  const diferencia = redondear(consumoMesa - sumaBruta);
  const cuadra = Math.abs(diferencia) < 0.01;

  return (
    <aside className="rounded-2xl border border-[#D5A06F]/30 bg-[#0B2340] p-4 shadow-lg space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#FFF9F0]">
        <Scale className="w-4 h-4 text-[#D5A06F]" />
        Resumen de la mesa
      </h3>

      <dl className="space-y-1.5 text-xs text-slate-300">
        <div className="flex justify-between">
          <dt>Consumo de la mesa</dt>
          <dd className="font-mono">{formatearSoles(consumoMesa)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Suma de subcuentas</dt>
          <dd className="font-mono">{formatearSoles(sumaBruta)}</dd>
        </div>
        {descuentos > 0 && (
          <div className="flex justify-between text-emerald-300">
            <dt>Descuentos</dt>
            <dd className="font-mono">-{formatearSoles(descuentos)}</dd>
          </div>
        )}
        {recargos > 0 && (
          <div className="flex justify-between text-amber-300">
            <dt>Recargos</dt>
            <dd className="font-mono">+{formatearSoles(recargos)}</dd>
          </div>
        )}
        <div className="flex justify-between text-slate-400">
          <dt>IGV incluido</dt>
          <dd className="font-mono">{formatearSoles(igvTotal)}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
          <dt className="text-sm font-semibold text-[#FFF9F0]">Total a cobrar</dt>
          <dd className="font-serif text-2xl text-[#F4D7B0]">{formatearSoles(totalComprobantes)}</dd>
        </div>
      </dl>

      {cuadra ? (
        <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Las subcuentas cubren todo el consumo
        </p>
      ) : (
        <p className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs font-semibold text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Las subcuentas no cuadran con el consumo: diferencia de {formatearSoles(Math.abs(diferencia))}
            {diferencia > 0 ? ' sin asignar.' : ' de más.'}
          </span>
        </p>
      )}
    </aside>
  );
};
