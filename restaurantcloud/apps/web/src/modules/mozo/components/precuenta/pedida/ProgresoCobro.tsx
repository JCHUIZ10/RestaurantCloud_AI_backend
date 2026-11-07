import React from 'react';
import { Wallet } from 'lucide-react';
import type { PrecuentaSubcuentaDTO } from '../../../../../types/mozo';
import { formatearSoles } from '../estilosComprobante';

interface ProgresoCobroProps {
  subcuentas: PrecuentaSubcuentaDTO[];
}

/** Avance de cobro de la cuenta dividida: subcuentas cobradas e importe cobrado frente al pendiente. */
export const ProgresoCobro: React.FC<ProgresoCobroProps> = ({ subcuentas }) => {
  const cobradas = subcuentas.filter((s) => s.estado === 'cobrado');
  const importeTotal = subcuentas.reduce((acc, s) => acc + Number(s.total_neto), 0);
  const importeCobrado = cobradas.reduce((acc, s) => acc + Number(s.total_neto), 0);
  const porcentaje = importeTotal > 0 ? Math.round((importeCobrado / importeTotal) * 100) : 0;

  return (
    <section
      aria-label="Avance de cobro"
      className="rounded-2xl border border-[#D5A06F]/30 bg-[#0B2340] p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#D5A06F]/20 border border-[#D5A06F]/40 text-[#D5A06F]">
            <Wallet className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#FFF9F0]">
              {cobradas.length} de {subcuentas.length} subcuentas cobradas
            </p>
            <p className="text-xs text-slate-400">El cobro de cada comprobante se realiza en Caja</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="text-emerald-300 font-semibold">Cobrado {formatearSoles(importeCobrado)}</p>
          <p className="text-amber-300 font-semibold">
            Pendiente {formatearSoles(importeTotal - importeCobrado)}
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-2.5 rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D5A06F] to-emerald-400 transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </section>
  );
};
