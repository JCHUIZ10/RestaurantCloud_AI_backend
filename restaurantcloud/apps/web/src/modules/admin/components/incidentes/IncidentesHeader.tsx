import React from 'react';
import {
  AlertTriangle,
  Building2,
  Plus,
  Clock,
  CheckCircle2,
  Hourglass,
  Flame,
} from 'lucide-react';
import { IncidentesKPIsDTO } from '@/types/admin';

interface IncidentesHeaderProps {
  kpis: IncidentesKPIsDTO;
  onNuevoIncidente: () => void;
}

export const IncidentesHeader: React.FC<IncidentesHeaderProps> = ({
  kpis,
  onNuevoIncidente,
}) => {
  return (
    <div className="space-y-4">
      {/* Barra superior de migas de pan y sede activa */}
      <div className="bg-white rounded-2xl border border-aurea-copper/20 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav className="flex items-center gap-1.5 text-stone-500 font-medium">
            <span>Portal Administrador</span>
            <span className="text-stone-300">/</span>
            <span>Operaciones de Salón y Cocina</span>
            <span className="text-stone-300">/</span>
            <span className="text-aurea-navy font-semibold">Incidentes Internos</span>
          </nav>

          <div className="flex items-center gap-2 bg-aurea-ivory px-3 py-1 rounded-full border border-aurea-copper/30 text-stone-700 text-xs">
            <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Sede: <strong className="text-aurea-navy">Miraflores (Principal)</strong></span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>
        </div>

        {/* Título y botón de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-navy text-aurea-champagne flex items-center justify-center shadow-sm shrink-0">
              <AlertTriangle className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-aurea-navy tracking-tight">
                Historial de Incidentes Internos
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Registro, trazabilidad y resolución operativa de novedades, anomalías y quejas en la sede.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNuevoIncidente}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs sm:text-sm font-bold shadow-md shadow-aurea-navy/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-aurea-champagne" />
            <span>Registrar Nuevo Incidente</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 Tarjetas KPI Dinámicas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Incidentes Abiertos */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Incidentes Abiertos
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-aurea-navy">
            {kpis.abiertos}
          </div>
          <p className="text-[11px] text-stone-500">
            Pendientes de peritaje en sede
          </p>
        </div>

        {/* KPI 2: En Investigación */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              En Investigación
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Hourglass className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-blue-900">
            {kpis.en_revision}
          </div>
          <p className="text-[11px] text-stone-500">
            {kpis.con_nota_propietario > 0
              ? `${kpis.con_nota_propietario} con directiva de dueño`
              : 'En peritaje local'}
          </p>
        </div>

        {/* KPI 3: Gravedad Alta (Alerta Crítica) */}
        <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm space-y-1 bg-gradient-to-br from-red-50/50 to-white">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Gravedad Alta</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </span>
            <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-red-900">
            {kpis.gravedad_alta}
          </div>
          <p className="text-[11px] text-red-700 font-medium">
            Notificado a Dueño
          </p>
        </div>

        {/* KPI 4: Resueltos Este Mes */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm space-y-1 bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Resueltos Este Mes
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-900">
            {kpis.resueltos_mes}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            100% Subsanados y archivados
          </p>
        </div>
      </div>
    </div>
  );
};
