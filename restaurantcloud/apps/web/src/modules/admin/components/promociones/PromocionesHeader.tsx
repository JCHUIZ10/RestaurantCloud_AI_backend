import React from 'react';
import {
  Tag,
  Plus,
  TrendingDown,
  Calendar,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { PromocionKPIsDTO } from '@/types/admin';

interface PromocionesHeaderProps {
  kpis: PromocionKPIsDTO;
  onNuevaPromocion: () => void;
}

export const PromocionesHeader: React.FC<PromocionesHeaderProps> = ({
  kpis,
  onNuevaPromocion,
}) => {
  return (
    <div className="space-y-6">
      {/* Cabecera Principal con Título y Acción Primaria */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Carta & Ventas
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Sede Miraflores
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-amber-600 shrink-0" />
            Gestión de Promociones y Descuentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configura campañas con cálculo predictivo en caja (<code className="text-slate-700 font-mono text-xs">CU-CAJA-02</code>) y salón (<code className="text-slate-700 font-mono text-xs">CU-MOZO-08</code>) para dinamizar la demanda y fidelizar comensales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNuevaPromocion}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-all shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Promoción
          </button>
        </div>
      </div>

      {/* 4 Tarjetas KPI Dinámicas de Sede */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Vigentes Hoy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Vigentes (Hoy)
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpis.vigentes_hoy}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Activas
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              Disponibles en Caja y Salón
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Programadas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Programadas
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpis.campanas_programadas}
              </span>
              <span className="text-xs font-semibold text-blue-600">
                A futuro
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              Inician en fechas posteriores
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Descuentos del Mes */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Descuentos del Mes
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                S/ {kpis.descuentos_mes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              Beneficio comercial trasladado
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Cuentas Beneficiadas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cuentas Beneficiadas
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpis.cuentas_beneficiadas}
              </span>
              <span className="text-xs font-semibold text-purple-600">
                comandas
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-1">
              Mesas y pedidos con beneficio
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
