import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import type { DesgloseSUNATMozoDTO } from '../../../../types/mozo';

interface DesgloseSUNATCardProps {
  desglose: DesgloseSUNATMozoDTO;
}

export const DesgloseSUNATCard: React.FC<DesgloseSUNATCardProps> = ({ desglose }) => {
  return (
    <div className="bg-[#0B2340]/90 rounded-xl border border-[#D5A06F]/30 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#D5A06F]/20 mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[#D5A06F]" />
          <h2 className="text-sm font-semibold tracking-wide text-[#FFF9F0] uppercase font-sans">
            Desglose Fiscal SUNAT Perú
          </h2>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-[#D5A06F] bg-[#D5A06F]/10 px-2 py-0.5 rounded border border-[#D5A06F]/20 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>IGV 18% Conforme</span>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        {/* Consumo Bruto */}
        <div className="flex items-center justify-between text-slate-300">
          <span>Consumo Bruto en Salón</span>
          <span className="font-semibold text-slate-200">
            S/ {desglose.consumo_bruto.toFixed(2)}
          </span>
        </div>

        {/* Descuento si aplica */}
        {desglose.descuento_comercial > 0 && (
          <div className="flex items-center justify-between text-emerald-400">
            <span>Descuento Comercial Aplicado</span>
            <span className="font-bold">
              -S/ {desglose.descuento_comercial.toFixed(2)}
            </span>
          </div>
        )}

        {/* Total Neto Destacado */}
        <div className="pt-2 pb-2 border-y border-white/10 my-2 flex items-baseline justify-between">
          <div>
            <span className="text-base font-serif font-bold text-[#FFF9F0] block">
              Total Neto a Pagar
            </span>
            <span className="text-[11px] text-slate-400">
              Monto exacto final con IGV incluido
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#D5A06F] tracking-tight">
              S/ {desglose.total_neto.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Desglose Base Imponible e IGV */}
        <div className="pt-1 space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Base Imponible (Operación Gravada)</span>
            <span className="font-mono text-slate-300">
              S/ {desglose.base_imponible.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>IGV (18.00% según Ley SUNAT)</span>
            <span className="font-mono text-slate-300">
              S/ {desglose.igv.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span>Moneda oficial: Soles (PEN)</span>
        <span className="text-slate-400 italic">Suma exacta garantizada</span>
      </div>
    </div>
  );
};
