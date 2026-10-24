import React from 'react';
import { CuotaMesasPlanDTO } from '@/types/admin';
import { LayoutGrid, Users, Plus, Building2, Utensils } from 'lucide-react';

interface PlanoHeaderProps {
  cuota: CuotaMesasPlanDTO;
  totalCapacidadSentados: number;
  totalMesasLocal: number;
  totalPisosLocal: number;
  localNombre: string;
  onAbrirMesaIndividual: () => void;
  onAbrirNuevoPiso: () => void;
}

export const PlanoHeader: React.FC<PlanoHeaderProps> = ({
  cuota,
  totalCapacidadSentados,
  totalMesasLocal,
  totalPisosLocal,
  localNombre,
  onAbrirMesaIndividual,
  onAbrirNuevoPiso,
}) => {
  const porcentajeUso = Math.min(
    100,
    Math.round((cuota.mesas_activas_empresa / cuota.max_mesas_plan) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Título y Acciones Principales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aurea-copper">
            <Building2 className="w-4 h-4" />
            <span>Configuración de Sede · {localNombre}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-aurea-navy font-bold mt-1">
            Plano y Distribución de Mesas
          </h1>
          <p className="font-sans text-sm text-aurea-navy/70 mt-1 max-w-2xl">
            Organiza los ambientes físicos del restaurante, administra la capacidad del salón y
            optimiza el flujo operativo para salón y cocina.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAbrirMesaIndividual}
            disabled={cuota.mesas_disponibles <= 0 || totalPisosLocal === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Utensils className="w-4 h-4 text-aurea-champagne" />
            <span>+ Mesa Individual</span>
          </button>

          <button
            onClick={onAbrirNuevoPiso}
            disabled={cuota.pisos_activos_empresa >= cuota.max_pisos_plan}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/20 text-xs sm:text-sm font-semibold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-aurea-copper" />
            <span>+ Nuevo Ambiente</span>
          </button>

        </div>
      </div>

      {/* Tarjetas KPI de Aforo y Cupo de Plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: Mesas Activas en Local */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/30 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-aurea-champagne/30 border border-aurea-copper/40 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-6 h-6 text-aurea-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider block">
              Mesas en este Local
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">
                {totalMesasLocal}
              </span>
              <span className="text-xs text-aurea-navy/70">mesas activas</span>
            </div>
            <p className="text-[11px] text-aurea-navy/60 mt-1 truncate">
              Distribuidas en {totalPisosLocal} ambientes físicos
            </p>
          </div>
        </div>

        {/* KPI 2: Capacidad Total Sentados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/30 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider block">
              Capacidad Total Sentados
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">
                {totalCapacidadSentados}
              </span>
              <span className="text-xs text-aurea-navy/70">comensales (aforo)</span>
            </div>
            <p className="text-[11px] text-aurea-navy/60 mt-1 truncate">
              Promedio:{' '}
              {totalMesasLocal > 0
                ? (totalCapacidadSentados / totalMesasLocal).toFixed(1)
                : 0}{' '}
              personas por mesa
            </p>
          </div>
        </div>

        {/* KPI 3: Cupo del Plan Pro */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-aurea-copper/30 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-aurea-navy/60 uppercase tracking-wider">
              Cupo de Mesas (Plan {cuota.plan_nombre || 'actual'})
            </span>
            <span className="text-xs font-bold text-aurea-copper">
              {cuota.mesas_disponibles} disponibles
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">
              {cuota.mesas_activas_empresa}
            </span>
            <span className="text-sm font-semibold text-aurea-navy/50">
              / {cuota.max_mesas_plan} mesas
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-aurea-ivory rounded-full h-2.5 mt-2.5 border border-aurea-copper/20 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                porcentajeUso >= 90
                  ? 'bg-rose-500'
                  : porcentajeUso >= 70
                  ? 'bg-amber-500'
                  : 'bg-aurea-copper'
              }`}
              style={{ width: `${porcentajeUso}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-aurea-navy/60 mt-1.5">
            <span>{porcentajeUso}% utilizado</span>
            <span>Máx. {cuota.max_pisos_plan} ambientes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
