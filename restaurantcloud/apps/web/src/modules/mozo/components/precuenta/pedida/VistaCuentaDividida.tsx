import React, { useState } from 'react';
import { CheckCircle2, Info, LayoutGrid } from 'lucide-react';
import type { PrecuentaMozoResponseDTO } from '../../../../../types/mozo';
import { estiloComprobante } from '../estilosComprobante';
import { SubcuentaPrecuentaCard } from './SubcuentaPrecuentaCard';
import { ProgresoCobro } from './ProgresoCobro';
import { ResumenConciliacion } from './ResumenConciliacion';

interface VistaCuentaDivididaProps {
  data: PrecuentaMozoResponseDTO;
}

const TODAS = 'todas';

export const VistaCuentaDividida: React.FC<VistaCuentaDivididaProps> = ({ data }) => {
  const subcuentas = data.subcuentas ?? [];
  const [vista, setVista] = useState<string>(TODAS);
  const seleccionada = subcuentas.find((s) => s.id === vista);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-8 space-y-4 min-w-0">
        <ProgresoCobro subcuentas={subcuentas} />

        <div
          role="tablist"
          aria-label="Subcuentas de la mesa"
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={vista === TODAS}
            onClick={() => setVista(TODAS)}
            className={`shrink-0 min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A06F] ${
              vista === TODAS
                ? 'bg-[#D5A06F] text-[#0B2340] border-[#D5A06F]'
                : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Todas ({subcuentas.length})
          </button>

          {subcuentas.map((sub) => {
            const activa = vista === sub.id;
            const cobrada = sub.estado === 'cobrado';
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setVista(sub.id)}
                className={`shrink-0 min-h-[44px] px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A06F] ${
                  activa
                    ? 'bg-[#D5A06F] text-[#0B2340] border-[#D5A06F]'
                    : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${estiloComprobante(sub.tipo_comprobante).acento}`}
                  aria-hidden="true"
                />
                <span>Subcuenta {sub.numero_subcuenta}</span>
                {cobrada && (
                  <CheckCircle2
                    className={`w-4 h-4 ${activa ? 'text-emerald-700' : 'text-emerald-400'}`}
                    aria-label="Cobrada"
                  />
                )}
              </button>
            );
          })}
        </div>

        {seleccionada ? (
          <div className="max-w-xl mx-auto lg:mx-0">
            <SubcuentaPrecuentaCard subcuenta={seleccionada} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subcuentas.map((sub) => (
              <SubcuentaPrecuentaCard key={sub.id} subcuenta={sub} />
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0">
        <ResumenConciliacion
          subcuentas={subcuentas}
          consumoMesa={data.tributacion_sunat.consumo_bruto}
        />
        <p className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-sky-100 leading-relaxed">
          <Info className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
          Esta mesa tiene la cuenta dividida: cada subcuenta se cobra con su propio comprobante en Caja.
        </p>
      </div>
    </div>
  );
};
