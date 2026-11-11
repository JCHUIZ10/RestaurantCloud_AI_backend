import React, { useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';
import { TurnoOperativoDTO, TurnoReserva } from '@/types/mozo';

interface ReservasHeaderProps {
  fechaStr: string;
  fechaTexto: string;
  esFechaOperativa: boolean;
  turnoActivo: TurnoReserva;
  /** Turnos de la jornada visible; null mientras se consulta el horario. */
  turnos: Record<TurnoReserva, TurnoOperativoDTO | null> | null;
  onCambiarTurno: (turno: TurnoReserva) => void;
  onFechaAnterior: () => void;
  onFechaSiguiente: () => void;
  onFechaHoy: () => void;
  onSeleccionarFecha: (fecha: string) => void;
  onNuevaReserva: () => void;
  /** El administrador suspendió la recepción de reservas nuevas. */
  nuevaReservaDeshabilitada?: boolean;
}

const ETIQUETA_TURNO: Record<TurnoReserva, string> = { almuerzo: 'Almuerzo', cena: 'Cena' };

export const ReservasHeader: React.FC<ReservasHeaderProps> = ({
  fechaStr,
  fechaTexto,
  esFechaOperativa,
  turnoActivo,
  turnos,
  onCambiarTurno,
  onFechaAnterior,
  onFechaSiguiente,
  onFechaHoy,
  onSeleccionarFecha,
  onNuevaReserva,
  nuevaReservaDeshabilitada = false,
}) => {
  const inputFechaRef = useRef<HTMLInputElement>(null);

  const abrirCalendario = () => {
    const input = inputFechaRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm shrink-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Lado izquierdo: Identificación y enlace al salón */}
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-copper">
              Salón & Recepción
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy leading-tight">
              Bandeja de Reservas del Salón
            </h1>
          </div>
        </div>

        {/* Lado derecho: Selector de fecha, turno y botón de acción */}
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
            <div className="relative">
              <button
                onClick={abrirCalendario}
                title="Elegir fecha"
                className="px-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-aurea-copper flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
                <span>{fechaTexto}</span>
              </button>
              <input
                ref={inputFechaRef}
                type="date"
                value={fechaStr}
                onChange={(e) => e.target.value && onSeleccionarFecha(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <button
              onClick={onFechaSiguiente}
              aria-label="Día siguiente"
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!esFechaOperativa && (
            <button
              onClick={onFechaHoy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-aurea-navy bg-aurea-champagne/40 hover:bg-aurea-champagne/60 border border-aurea-champagne transition-colors"
            >
              Ir a la jornada actual
            </button>
          )}

          {/* Selector de Turno (según el horario real de la fecha) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(Object.keys(ETIQUETA_TURNO) as TurnoReserva[]).map((turno) => {
              const datosTurno = turnos?.[turno] ?? null;
              const sinAtencion = turnos !== null && datosTurno === null;
              const activo = turnoActivo === turno && !sinAtencion;
              return (
                <button
                  key={turno}
                  onClick={() => onCambiarTurno(turno)}
                  disabled={sinAtencion}
                  title={
                    sinAtencion
                      ? `Sin atención de ${ETIQUETA_TURNO[turno].toLowerCase()} en esta fecha`
                      : datosTurno
                      ? `${datosTurno.nombre}: ${datosTurno.inicio} a ${datosTurno.fin}`
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all disabled:cursor-not-allowed ${
                    activo
                      ? 'bg-aurea-navy text-white shadow-xs'
                      : sinAtencion
                      ? 'text-slate-400 line-through'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ETIQUETA_TURNO[turno]}
                </button>
              );
            })}
          </div>

          {/* Botón de Acción Principal */}
          <button
            onClick={onNuevaReserva}
            disabled={nuevaReservaDeshabilitada}
            title={nuevaReservaDeshabilitada ? 'El administrador suspendió la recepción de nuevas reservas' : undefined}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs sm:text-sm shadow-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>
    </header>
  );
};
