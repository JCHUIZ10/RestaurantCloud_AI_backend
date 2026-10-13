import React from 'react';
import {
  Users,
  Plus,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { MetricasPersonalDTO } from '@/types/admin';

interface PersonalHeaderProps {
  localNombre: string;
  metricas?: MetricasPersonalDTO;
  onAbrirNuevoEmpleado: () => void;
}

export const PersonalHeader: React.FC<PersonalHeaderProps> = ({
  localNombre,
  metricas,
  onAbrirNuevoEmpleado,
}) => {
  const cuotaLlena = metricas ? metricas.cupos_disponibles <= 0 : false;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-aurea-navy/60 mb-1.5">
          <span>Portal Administrador</span>
          <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
          <span>Gestión de Personal</span>
          <ChevronRight className="w-3 h-3 text-aurea-copper/60" />
          <span className="font-semibold text-aurea-navy">Equipo Operativo</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aurea-champagne/30 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-serif text-aurea-navy font-bold tracking-tight">
                Gestión de Personal del Local
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30">
                <MapPin className="w-3 h-3 text-aurea-copper" />
                {localNombre}
              </span>
            </div>
            <p className="text-sm text-aurea-navy/70 mt-0.5 max-w-3xl">
              Administración de colaboradores de salón (mozos), cocina y caja con control de acceso, reasignación asistida y cuota SaaS.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción Superior */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onAbrirNuevoEmpleado}
          disabled={cuotaLlena}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all min-h-[44px] ${
            cuotaLlena
              ? 'bg-slate-400 cursor-not-allowed opacity-75'
              : 'bg-aurea-copper hover:bg-aurea-copper/90 active:scale-[0.98]'
          }`}
          title={
            cuotaLlena
              ? 'Límite de usuarios del Plan Pro alcanzado (15/15). Libera cupos o contacta al propietario.'
              : 'Registrar nuevo colaborador de salón, cocina o caja'
          }
        >
          {cuotaLlena ? (
            <ShieldAlert className="w-4 h-4 text-amber-200" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>+ Nuevo Empleado</span>
        </button>
      </div>
    </div>
  );
};
