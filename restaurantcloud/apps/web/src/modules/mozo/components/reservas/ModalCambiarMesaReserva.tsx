import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Repeat, Users, Clock } from 'lucide-react';
import { ReservaCardDTO } from '@/types/mozo';
import { mozoService } from '@/services/serviceAdapter';
import { mensajeDeErrorApi } from '@/shared/utils/errorApi';
import { SelectorMesasReserva } from './SelectorMesasReserva';
import { useSeleccionMesasReserva } from './useSeleccionMesasReserva';

interface ModalCambiarMesaReservaProps {
  abierto: boolean;
  reserva: ReservaCardDTO | null;
  onCerrar: () => void;
  /** La reserva ya cambió de mesa en el servidor: la pantalla debe refrescar sus datos. */
  onReasignada: (reserva: ReservaCardDTO) => void;
}

const MOTIVOS_RAPIDOS = ['Mesa ocupada por clientes anteriores', 'Preferencia del cliente'];

const mismoConjunto = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

/** Cambia la mesa (o mesas) de una reserva con las mismas reglas que al crearla. */
export const ModalCambiarMesaReserva: React.FC<ModalCambiarMesaReservaProps> = ({
  abierto,
  reserva,
  onCerrar,
  onReasignada,
}) => {
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fecha = reserva ? new Date(reserva.fecha_hora).toLocaleDateString('en-CA') : null;

  const seleccion = useSeleccionMesasReserva({
    activo: abierto && reserva !== null,
    fecha,
    hora: reserva?.hora_texto ?? null,
    numPersonas: reserva?.num_personas ?? 1,
    excluirReservaId: reserva?.id,
    mesasIniciales: reserva?.mesa_ids,
    onError: setError,
  });

  // Cada apertura empieza limpia
  useEffect(() => {
    setMotivo('');
    setError(null);
    setGuardando(false);
  }, [abierto, reserva?.id]);

  if (!abierto || !reserva) return null;

  const { seleccionIds, capacidadSuficiente, unionValida, bloqueoHorario, cargando, recargar } = seleccion;
  const cambio = !mismoConjunto(seleccionIds, reserva.mesa_ids);
  const puedeConfirmar =
    !guardando && !cargando && !bloqueoHorario && seleccionIds.length > 0 && capacidadSuficiente && unionValida && cambio;

  const confirmar = async () => {
    setError(null);
    setGuardando(true);
    try {
      const res = await mozoService.reasignarMesaReserva(reserva.id, {
        mesa_ids: seleccionIds,
        motivo: motivo.trim() || undefined,
      });
      if (!res.exito) throw new Error();
      onReasignada(res.datos ?? { ...reserva, mesa_ids: seleccionIds, mesas_etiqueta: seleccion.etiquetaMesas });
      onCerrar();
    } catch (e) {
      setError(mensajeDeErrorApi(e, 'No se pudo cambiar la mesa de la reserva.'));
      // Otro mozo pudo ocupar la mesa mientras tanto: mostrar la disponibilidad real
      recargar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-h-[92vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '680px' }}
      >
        <div className="px-5 py-4 bg-aurea-navy text-white flex items-center justify-between border-b border-aurea-copper/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne">
              Recepción • Asignación de Mesa
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
              <Repeat className="w-5 h-5 text-aurea-copper" aria-hidden="true" />
              <span>Cambiar mesa</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumen de la reserva */}
          <div className="p-3.5 rounded-xl bg-aurea-navy/5 border border-aurea-navy/15 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">{reserva.cliente_nombre}</div>
              <div className="flex items-center gap-3 mt-0.5 text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                  {reserva.hora_texto}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                  {reserva.num_personas} {reserva.num_personas === 1 ? 'persona' : 'personas'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mesa actual</span>
              <div className="font-serif text-lg font-bold text-aurea-navy">{reserva.mesas_etiqueta}</div>
            </div>
          </div>

          <section className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Nueva mesa</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Las mesas atenuadas no están disponibles a esta hora. La mesa actual aparece libre para conservarla.
            </p>
            <SelectorMesasReserva seleccion={seleccion} numPersonas={reserva.num_personas} hayHora />
          </section>

          <section>
            <label htmlFor="motivo-cambio-mesa" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Motivo (opcional):
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {MOTIVOS_RAPIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                    motivo === m
                      ? 'bg-aurea-navy text-white border-aurea-navy'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              id="motivo-cambio-mesa"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              placeholder="Ej. El cliente pidió una mesa junto a la ventana"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
            />
            <p className="text-[10px] text-slate-400 mt-1">Queda registrado en auditoría. No se avisa al cliente.</p>
          </section>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!puedeConfirmar}
            className="px-6 py-2.5 rounded-xl bg-aurea-navy hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            style={{ minHeight: '44px' }}
          >
            {guardando ? (
              <span>Cambiando...</span>
            ) : (
              <>
                <Repeat className="w-4 h-4 text-aurea-copper" />
                <span>Cambiar a {seleccion.etiquetaMesas}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
