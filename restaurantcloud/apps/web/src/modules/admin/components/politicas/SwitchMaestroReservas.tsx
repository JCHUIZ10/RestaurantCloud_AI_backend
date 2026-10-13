import React from 'react';
import {
  CalendarCheck2,
  CalendarX2,
  AlertTriangle,
} from 'lucide-react';

interface SwitchMaestroReservasProps {
  aceptaReservas: boolean;
  onToggle: (nuevoEstado: boolean) => void;
  disabled?: boolean;
}

export const SwitchMaestroReservas: React.FC<SwitchMaestroReservasProps> = ({
  aceptaReservas,
  onToggle,
  disabled = false,
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-5 ${
        aceptaReservas
          ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border-emerald-300 shadow-sm'
          : 'bg-amber-50/60 border-amber-300 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado izquierdo: Icono de estado y explicaciones */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              aceptaReservas
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {aceptaReservas ? (
              <CalendarCheck2 className="w-6 h-6" />
            ) : (
              <CalendarX2 className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-aurea-navy">
                Habilitar Recepción de Reservas de Salón
              </h2>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  aceptaReservas
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {aceptaReservas ? 'Canal Activo' : 'Canal Suspendido'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              {aceptaReservas ? (
                <>
                  El local está admitiendo reservas anticipadas. Los comensales pueden reservar desde la{' '}
                  <strong className="text-stone-800">carta digital pública</strong> y el personal de salón puede
                  asignar mesas prioritarias en el terminal de mozos.
                </>
              ) : (
                <>
                  La recepción de reservas está deshabilitada temporalmente en esta sede. Se prohíbe la creación
                  de nuevas solicitudes tanto desde el portal público como en las terminales operativas.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Lado derecho: Switch semántico accesible */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <span className="text-xs font-semibold text-stone-700">
            {aceptaReservas ? 'Activo' : 'Inactivo'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={aceptaReservas}
            disabled={disabled}
            onClick={() => onToggle(!aceptaReservas)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              aceptaReservas ? 'bg-emerald-600' : 'bg-stone-300'
            }`}
          >
            <span className="sr-only">Habilitar recepción de reservas</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                aceptaReservas ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Nota preventiva ante desactivación */}
      {!aceptaReservas && (
        <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>Advertencia de salvaguarda:</strong> Para desactivar el servicio de forma definitiva, el sistema
            verificará que no existan reservas confirmadas pendientes para los próximos días.
          </span>
        </div>
      )}
    </div>
  );
};
