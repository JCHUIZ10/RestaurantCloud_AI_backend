import React from 'react';
import type { CuotaPersonalDTO } from '@/types/propietarioAdmins';
import type { TabEstadoAdmin } from './AdminsFiltrosBar';
import { Building2, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface AdminsStatsCardsProps {
  conteos: {
    activos: number;
    pendientes: number;
    desactivados: number;
    todos: number;
  };
  cuota: CuotaPersonalDTO | null;
  totalSedes: number;
  sedesAsignadas: number;
  sedesAutogestionadas: number;
  onSeleccionarTab?: (tab: TabEstadoAdmin) => void;
}

export const AdminsStatsCards: React.FC<AdminsStatsCardsProps> = ({
  conteos,
  cuota,
  totalSedes,
  sedesAsignadas,
  sedesAutogestionadas,
  onSeleccionarTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Administradores Activos */}
      <button
        type="button"
        onClick={() => onSeleccionarTab?.('activos')}
        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-aurea-navy/30 transition-all text-left flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Admins Activos
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-aurea-navy">
              {conteos.activos}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              de {conteos.todos} en total
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Cuentas operativas activas
          </p>
        </div>
      </button>

      {/* 2. Cobertura de Sedes */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Cobertura de Sedes
          </span>
          <div className="p-2 rounded-xl bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/25">
            <Building2 className="w-4 h-4 text-aurea-copper" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-aurea-navy">
              {totalSedes > 0 ? `${sedesAsignadas}/${totalSedes}` : '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              sedes cubiertas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {sedesAutogestionadas > 0 ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {sedesAutogestionadas} autogestionada(s) por ti
              </span>
            ) : totalSedes > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Todas las sedes con admin
              </span>
            ) : (
              'Sin sedes registradas'
            )}
          </p>
        </div>
      </div>

      {/* 3. Invitaciones Pendientes (Token 24h) */}
      <button
        type="button"
        onClick={() => onSeleccionarTab?.('pendientes')}
        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-400 transition-all text-left flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Invitaciones
          </span>
          <div
            className={`p-2 rounded-xl border group-hover:scale-105 transition-transform ${
              conteos.pendientes > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif text-3xl font-extrabold ${
                conteos.pendientes > 0 ? 'text-amber-900' : 'text-slate-400'
              }`}
            >
              {conteos.pendientes}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              pendientes
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {conteos.pendientes > 0 ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Enlaces válidos por 24 horas
              </span>
            ) : (
              'Sin invitaciones en espera'
            )}
          </p>
        </div>
      </button>

      {/* 4. Cupo de Personal / Plan */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Cupo de Cuentas
          </span>
          <div className="p-2 rounded-xl bg-aurea-navy text-aurea-champagne shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-aurea-navy">
              {cuota?.cupos_disponibles ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              cupos libres
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Plan {cuota?.plan_nombre || 'Pro'}</span>
            <span className="font-mono text-[10px] text-slate-400">
              {cuota?.usuarios_activos ?? 0}/{cuota?.usuarios_permitidos ?? 0} usados
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
