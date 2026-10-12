import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Utensils, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface ReservasHeaderProps {
  fechaTexto: string;
  turnoActivo: 'almuerzo' | 'cena';
  onCambiarTurno: (turno: 'almuerzo' | 'cena') => void;
  onFechaAnterior: () => void;
  onFechaSiguiente: () => void;
  onFechaHoy: () => void;
  onNuevaReserva: () => void;
  esPlanStarter?: boolean;
}

export const ReservasHeader: React.FC<ReservasHeaderProps> = ({
  fechaTexto,
  turnoActivo,
  onCambiarTurno,
  onFechaAnterior,
  onFechaSiguiente,
  onFechaHoy,
  onNuevaReserva,
  esPlanStarter = false,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Lado izquierdo: Identificación, fecha y enlaces */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={ROUTES.MOZO_MESAS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <Utensils className="w-3.5 h-3.5 text-aurea-copper" />
            <span>‹ Volver al Salón</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-copper">
                Salón & Recepción
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-aurea-champagne/40 text-aurea-navy font-bold">
                CU-MOZO-05
              </span>
              {esPlanStarter && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  Plan Starter (Simulado)
                </span>
              )}
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy leading-tight">
              Bandeja de Reservas del Salón
            </h1>
          </div>
        </div>

        {/* Lado derecho: Selector de fecha, turno, SSE y botón de acción */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Navegador de Fecha */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={onFechaAnterior}
              aria-label="Día anterior"
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onFechaHoy}
              className="px-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-aurea-copper flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
              <span>{fechaTexto}</span>
            </button>
            <button
              onClick={onFechaSiguiente}
              aria-label="Día siguiente"
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Turno */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => onCambiarTurno('almuerzo')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                turnoActivo === 'almuerzo'
                  ? 'bg-aurea-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ● Almuerzo
            </button>
            <button
              onClick={() => onCambiarTurno('cena')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                turnoActivo === 'cena'
                  ? 'bg-aurea-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cena
            </button>
          </div>

          {/* Badge SSE */}
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Wifi className="w-3 h-3" />
            <span>SSE Conectado</span>
          </div>

          {/* Botón de Acción Principal */}
          <button
            onClick={onNuevaReserva}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs sm:text-sm shadow-sm transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nueva Reserva</span>
          </button>
        </div>
      </div>
    </header>
  );
};
