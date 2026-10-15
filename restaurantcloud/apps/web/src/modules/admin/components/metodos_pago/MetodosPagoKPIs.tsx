import React from 'react';
import { CheckCircle2, TrendingUp, Percent, ShieldCheck } from 'lucide-react';
import { MetodosPagoKPIsDTO } from '@/types/admin';

interface MetodosPagoKPIsProps {
  kpis: MetodosPagoKPIsDTO;
}

export const MetodosPagoKPIs: React.FC<MetodosPagoKPIsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Formas Habilitadas */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Formas Habilitadas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-aurea-navy">
              {kpis.formas_habilitadas} / {kpis.total_formas}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Activas</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">En caja y mozos</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 2: Con Comisión Aplicada */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Con Recargo / Tarjeta
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-amber-700">
              {kpis.metodos_con_comision}
            </span>
            <span className="text-xs text-amber-600 font-medium">con recargo</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Traslado de pasarela POS</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
          <Percent className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3: Ventas Tarjeta (Mes) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Ventas Tarjeta (Mes)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-aurea-navy">
              S/ {kpis.ventas_tarjeta_mes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Volumen procesado</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4: Recargos Percibidos */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Recargos Percibidos
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-serif font-bold text-emerald-700">
              S/ {kpis.recargos_percibidos_mes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Compensación financiera</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
