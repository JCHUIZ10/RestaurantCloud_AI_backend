import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { SeleccionMesasReserva } from './useSeleccionMesasReserva';

interface SelectorMesasReservaProps {
  seleccion: SeleccionMesasReserva;
  numPersonas: number;
  /** Hay hora elegida; sin ella solo se muestra una invitación a elegirla. */
  hayHora: boolean;
}

/** Mini-mapa de mesas con el resumen de capacidad. Compartido por "Nueva reserva" y "Cambiar mesa". */
export const SelectorMesasReserva: React.FC<SelectorMesasReservaProps> = ({ seleccion, numPersonas, hayHora }) => {
  const {
    mesasMapa,
    bloqueoHorario,
    cargando,
    seleccionIds,
    avisoMesas,
    alternarMesa,
    mesasElegidas,
    capacidadTotal,
    etiquetaMesas,
    capacidadSuficiente,
    unionValida,
  } = seleccion;

  const lugaresFaltantes = Math.max(0, numPersonas - capacidadTotal);
  const hayMesaIndividual = mesasMapa.some((m) => m.disponible && m.capacidad >= numPersonas);

  return (
    <>
      {bloqueoHorario ? (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
          {bloqueoHorario}
        </div>
      ) : !hayHora ? (
        <div className="p-6 text-center text-slate-400">Elige una hora de llegada para ver las mesas.</div>
      ) : cargando ? (
        <div className="p-8 text-center text-slate-400">Consultando disponibilidad de salón...</div>
      ) : mesasMapa.length === 0 ? (
        <div className="p-6 text-center text-slate-400">No hay mesas activas registradas en el salón.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
          {mesasMapa.map((mesa) => {
            const seleccionada = seleccionIds.includes(mesa.mesa_id);
            return (
              <button
                key={mesa.mesa_id}
                type="button"
                onClick={() => alternarMesa(mesa)}
                disabled={!mesa.disponible}
                title={mesa.motivo_bloqueo ?? undefined}
                className={`p-2 sm:p-2.5 rounded-xl border-2 flex flex-col justify-between text-left transition-all min-h-[74px] touch-manipulation ${
                  seleccionada
                    ? 'bg-aurea-navy text-white border-aurea-copper ring-2 ring-aurea-copper/40 shadow-sm'
                    : mesa.disponible
                    ? 'bg-white hover:bg-emerald-50 text-slate-800 border-emerald-400/80 shadow-2xs cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      seleccionada ? 'text-aurea-champagne' : 'text-slate-400'
                    }`}
                  >
                    Mesa
                  </span>
                  <span
                    className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                      seleccionada
                        ? 'bg-aurea-copper text-aurea-navy'
                        : mesa.disponible
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {seleccionada ? '✓ ELEGIDA' : mesa.disponible ? 'LIBRE' : 'NO DISP.'}
                  </span>
                </div>

                <div className="font-serif text-lg font-bold my-0.5">{mesa.numero}</div>

                <div className={`text-[10px] truncate ${seleccionada ? 'text-slate-200' : 'text-slate-500'}`}>
                  {!mesa.disponible && mesa.motivo_bloqueo ? mesa.motivo_bloqueo : `Cap: ${mesa.capacidad}p`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Resumen de Asignación */}
      <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle
            className={`w-4 h-4 ${mesasElegidas.length > 0 && capacidadSuficiente ? 'text-emerald-600' : 'text-slate-300'}`}
          />
          <span>
            Mesa seleccionada: <strong>{etiquetaMesas}</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">
            Capacidad: <strong>{capacidadTotal} de {numPersonas} lugares</strong>
          </span>
        </div>
        {mesasElegidas.length > 0 && !capacidadSuficiente && (
          <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Faltan {lugaresFaltantes} {lugaresFaltantes === 1 ? 'lugar' : 'lugares'}: agrega otra mesa para agrupar
          </span>
        )}
        {mesasElegidas.length > 0 && !unionValida && (
          <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Una de las mesas no permite unión
          </span>
        )}
      </div>

      {/* Ninguna mesa alcanza sola: hay que agrupar */}
      {!bloqueoHorario && hayHora && !cargando && mesasMapa.length > 0 && !hayMesaIndividual && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Ninguna mesa libre cubre a {numPersonas} personas. Elige varias mesas para agruparlas hasta alcanzar los
            lugares necesarios.
          </span>
        </div>
      )}

      {avisoMesas && (
        <div role="alert" className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-semibold flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{avisoMesas}</span>
        </div>
      )}
    </>
  );
};
