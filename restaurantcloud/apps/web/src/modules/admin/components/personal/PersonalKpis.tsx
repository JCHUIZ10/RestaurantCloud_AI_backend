import React from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { MetricasPersonalDTO } from '@/types/admin';

interface PersonalKpisProps {
  metricas: MetricasPersonalDTO;
}

export const PersonalKpis: React.FC<PersonalKpisProps> = ({ metricas }) => {
  const cuotaPorcentaje = metricas.porcentaje_ocupacion;
  const esCuotaCritica = metricas.cupos_disponibles <= 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Cuota SaaS Plan Pro */}
      <div className="bg-white rounded-2xl p-4 border border-aurea-champagne/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider">
            Consumo Cuota SaaS
          </span>
          <div className="w-8 h-8 rounded-lg bg-aurea-champagne/30 text-aurea-copper flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-serif text-aurea-navy">
            {metricas.total_empleados} / {metricas.max_usuarios_plan}
          </span>
          <span className="text-xs text-aurea-navy/60 font-medium">
            {metricas.plan_nombre}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="mt-2.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                esCuotaCritica
                  ? 'bg-amber-500'
                  : cuotaPorcentaje > 85
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, cuotaPorcentaje)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-aurea-navy/60">
            <span>{cuotaPorcentaje}% ocupado</span>
            <span
              className={`font-semibold ${
                metricas.cupos_disponibles === 0
                  ? 'text-rose-600'
                  : metricas.cupos_disponibles <= 2
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {metricas.cupos_disponibles === 0
                ? 'Cupo agotado'
                : `${metricas.cupos_disponibles} cupo(s) disponible(s)`}
            </span>
          </div>
        </div>
      </div>

      {/* KPI 2: Mozos de Salón */}
      <div className="bg-white rounded-2xl p-4 border border-aurea-champagne/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider">
            Mozos de Salón
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-serif text-blue-900">
            {metricas.mozos_activos}
          </span>
          <span className="text-xs font-medium text-blue-700/70">
            activos en salón
          </span>
        </div>
        <p className="text-xs text-aurea-navy/60 mt-1">
          Atención en mesas y comandas móviles (CU-MOZO-01)
        </p>
      </div>

      {/* KPI 3: Equipo de Cocina */}
      <div className="bg-white rounded-2xl p-4 border border-aurea-champagne/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider">
            Equipo de Cocina
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ChefHat className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-serif text-amber-950">
            {metricas.cocina_activos}
          </span>
          <span className="text-xs font-medium text-amber-700/70">
            estaciones KDS
          </span>
        </div>
        <p className="text-xs text-aurea-navy/60 mt-1">
          Pantalla de cocina KDS y despacho (CU-COCINA-01)
        </p>
      </div>

      {/* KPI 4: Control de Caja */}
      <div className="bg-white rounded-2xl p-4 border border-aurea-champagne/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider">
            Cajeros de Turno
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-serif text-emerald-950">
            {metricas.cajeros_activos}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Turno 1 activo
          </span>
        </div>
        <p className="text-xs text-aurea-navy/60 mt-1">
          Cobro de cuentas y cierre de turno (CU-CAJA-01 / CU-ADMIN-14)
        </p>
      </div>
    </div>
  );
};
