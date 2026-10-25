import React from 'react';
import { CheckCircle2, TrendingUp, Percent, ShieldCheck, type LucideIcon } from 'lucide-react';
import { MetodosPagoKPIsDTO } from '@/types/admin';

interface MetodosPagoKPIsProps {
  kpis: MetodosPagoKPIsDTO;
}

const soles = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Kpi: React.FC<{ etiqueta: string; valor: React.ReactNode; unidad?: string; icono: LucideIcon; colorValor: string; colorIcono: string }> = ({
  etiqueta,
  valor,
  unidad,
  icono: Icono,
  colorValor,
  colorIcono,
}) => (
  <div className="bg-white rounded-2xl p-4 border border-tinta-200/80 shadow-sm flex items-center justify-between gap-3 min-w-0">
    <div className="min-w-0">
      <p className="text-xs font-medium text-tinta-500 uppercase tracking-wider truncate">{etiqueta}</p>
      <p className="mt-1 flex items-baseline gap-2 min-w-0">
        <span className={`text-2xl font-serif font-bold tabular-nums truncate ${colorValor}`}>{valor}</span>
        {unidad && <span className="text-xs font-medium text-tinta-500 shrink-0">{unidad}</span>}
      </p>
    </div>
    <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorIcono}`} aria-hidden="true">
      <Icono className="w-5 h-5" />
    </span>
  </div>
);

export const MetodosPagoKPIs: React.FC<MetodosPagoKPIsProps> = ({ kpis }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    <Kpi
      etiqueta="Formas activas"
      valor={`${kpis.formas_habilitadas} / ${kpis.total_formas}`}
      icono={CheckCircle2}
      colorValor="text-aurea-navy"
      colorIcono="bg-emerald-50 text-emerald-600 border-emerald-100"
    />
    <Kpi
      etiqueta="Con recargo"
      valor={kpis.metodos_con_comision}
      unidad={kpis.metodos_con_comision === 1 ? 'método' : 'métodos'}
      icono={Percent}
      colorValor="text-amber-700"
      colorIcono="bg-amber-50 text-amber-700 border-amber-200"
    />
    <Kpi
      etiqueta="Ventas con tarjeta (mes)"
      valor={soles(kpis.ventas_tarjeta_mes)}
      icono={TrendingUp}
      colorValor="text-aurea-navy"
      colorIcono="bg-blue-50 text-blue-600 border-blue-100"
    />
    <Kpi
      etiqueta="Recargos cobrados (mes)"
      valor={soles(kpis.recargos_percibidos_mes)}
      icono={ShieldCheck}
      colorValor="text-emerald-700"
      colorIcono="bg-emerald-50 text-emerald-600 border-emerald-100"
    />
  </div>
);
