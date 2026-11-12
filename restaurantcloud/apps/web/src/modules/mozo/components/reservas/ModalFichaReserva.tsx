import React, { useEffect, useState } from 'react';
import { X, Clock, Phone, MessageSquare, Users, AlertTriangle, CheckCircle2, UserX, Repeat } from 'lucide-react';
import { ReservaCardDTO } from '@/types/mozo';

interface ModalFichaReservaProps {
  abierto: boolean;
  reserva: ReservaCardDTO | null;
  /** Minutos de cortesía antes de considerar inasistencia (politicas_reserva.tolerancia_no_show_min). */
  toleranciaMin: number;
  /** Nombre del turno de la reserva (ej. "Almuerzo"), si se conoce. */
  nombreTurno?: string | null;
  /** Solo se sienta a comensales de la jornada en curso. */
  permiteSentar?: boolean;
  onCerrar: () => void;
  onSentarComensales: (reserva: ReservaCardDTO) => Promise<boolean>;
  onRegistrarNoShow: (reservaId: string, motivo: string) => Promise<boolean>;
  onCancelarReserva: (reservaId: string, motivo: string) => Promise<boolean>;
  onEnviarWhatsApp: (reserva: ReservaCardDTO) => void;
  /** Abre el cambio de mesa de una reserva activa. Sin esta función el botón no se muestra. */
  onCambiarMesa?: (reserva: ReservaCardDTO) => void;
}

const ETIQUETA_ESTADO_CERRADO: Partial<Record<ReservaCardDTO['estado'], string>> = {
  atendida: 'Comensales ya sentados',
  no_show: 'Inasistencia registrada',
  cancelada: 'Reserva cancelada',
};

const formatearDuracion = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto > 0 ? `${horas}h ${resto}m` : `${horas}h`;
};

const horaMasMinutos = (fechaHoraIso: string, minutos: number): string => {
  const fecha = new Date(fechaHoraIso);
  if (Number.isNaN(fecha.getTime())) return '';
  fecha.setMinutes(fecha.getMinutes() + minutos);
  return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const ModalFichaReserva: React.FC<ModalFichaReservaProps> = ({
  abierto,
  reserva,
  toleranciaMin,
  nombreTurno,
  permiteSentar = true,
  onCerrar,
  onSentarComensales,
  onRegistrarNoShow,
  onCancelarReserva,
  onEnviarWhatsApp,
  onCambiarMesa,
}) => {
  const [modoCancelar, setModoCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [modoNoShowConfirm, setModoNoShowConfirm] = useState(false);
  const [motivoNoShow, setMotivoNoShow] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Cada ficha empieza limpia: sin confirmaciones abiertas ni motivos de otra reserva
  useEffect(() => {
    setModoCancelar(false);
    setModoNoShowConfirm(false);
    setMotivoCancelacion('');
    setMotivoNoShow('');
    setProcesando(false);
  }, [reserva?.id, abierto]);

  if (!abierto || !reserva) return null;

  const esActiva = reserva.estado === 'confirmada' || reserva.estado === 'bloqueada';
  const minutosRetraso = Math.max(0, -reserva.minutos_restantes);
  const esExpirado = esActiva && (reserva.tolerancia_expiro || minutosRetraso > toleranciaMin);
  const finCortesia = horaMasMinutos(reserva.fecha_hora, toleranciaMin);
  const motivoCancelacionValido = motivoCancelacion.trim().length >= 3;

  const ejecutar = async (accion: () => Promise<boolean>) => {
    setProcesando(true);
    try {
      const ok = await accion();
      if (ok) onCerrar();
    } finally {
      setProcesando(false);
    }
  };

  const handleSentar = () => ejecutar(() => onSentarComensales(reserva));
  const handleConfirmarNoShow = () => ejecutar(() => onRegistrarNoShow(reserva.id, motivoNoShow.trim()));
  const handleConfirmarCancelacion = () => {
    if (!motivoCancelacionValido) return;
    return ejecutar(() => onCancelarReserva(reserva.id, motivoCancelacion.trim()));
  };

  const renderEstadoReloj = () => {
    if (!esActiva) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-300">
          {ETIQUETA_ESTADO_CERRADO[reserva.estado] ?? reserva.estado}
        </span>
      );
    }
    if (esExpirado) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 font-bold border border-rose-300 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          <span>Tolerancia expirada ({formatearDuracion(minutosRetraso)} de retraso)</span>
        </span>
      );
    }
    if (reserva.minutos_restantes <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          <span>En ventana de cortesía (quedan {toleranciaMin - minutosRetraso} min)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-900 font-bold border border-sky-200">
        <Clock className="w-3.5 h-3.5 text-sky-700" />
        <span>Llega en {formatearDuracion(reserva.minutos_restantes)}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-h-[92vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '560px' }}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-aurea-navy text-white flex items-center justify-between border-b border-aurea-copper/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne">
              Recepción & Control de Cortesía
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
              <span>👤 Ficha de Reserva: {reserva.cliente_nombre}</span>
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {esActiva && reserva.conflicto_mesa && (
            <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="font-bold">Choque de mesa</div>
                <p className="text-[11px] leading-relaxed">{reserva.conflicto_mesa}</p>
                <p className="text-[11px] mt-1">Usa «Cambiar mesa» para asignar esta reserva a una mesa libre.</p>
              </div>
            </div>
          )}

          {/* Tarjeta de Mesa Asignada */}
          <div className="p-3.5 rounded-xl bg-aurea-navy/5 border border-aurea-navy/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mesa(s) Asignada(s)
              </span>
              <div className="font-serif text-xl font-bold text-aurea-navy">
                {reserva.mesas_etiqueta}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Aforo Reservado
              </span>
              <div className="font-bold text-slate-800 text-sm flex items-center justify-end gap-1">
                <Users className="w-4 h-4 text-aurea-copper" />
                <span>{reserva.num_personas} personas</span>
              </div>
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <section className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-2">
              Datos del Comensal
            </h3>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Nombre Titular:</span>
              <span className="font-bold text-slate-800">{reserva.cliente_nombre}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Teléfono Móvil:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-800">
                  {reserva.cliente_telefono}
                </span>
                <a
                  href={`tel:${reserva.cliente_telefono.replace(/\s/g, '')}`}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Llamar</span>
                </a>
                <button
                  type="button"
                  onClick={() => onEnviarWhatsApp(reserva)}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold text-emerald-800 inline-flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>WA</span>
                </button>
              </div>
            </div>

            {reserva.notas && (
              <div className="pt-1">
                <span className="text-slate-500 block mb-0.5">Nota o requerimiento especial:</span>
                <p className="bg-white p-2 rounded border border-slate-200 text-slate-700 italic">
                  "{reserva.notas}"
                </p>
              </div>
            )}
          </section>

          {/* TIEMPO Y CORTESÍA */}
          <section
            className={`p-4 rounded-xl border transition-all ${
              esExpirado
                ? 'bg-rose-50/70 border-rose-300'
                : esActiva
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-aurea-navy" />
              <span>Tiempo y Cortesía de Espera</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Hora Pactada:</span>
                <span className="font-mono font-bold text-slate-900">
                  {reserva.hora_texto}
                  {nombreTurno ? ` (Turno ${nombreTurno})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ventana de Cortesía:</span>
                <span className="font-semibold text-slate-800">
                  {toleranciaMin} minutos{finCortesia ? ` (hasta ${finCortesia})` : ''}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">Estado del Reloj:</span>
                {renderEstadoReloj()}
              </div>
            </div>
          </section>

          {/* MODO NO-SHOW / CONFIRMACIÓN */}
          {modoNoShowConfirm && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 space-y-2 animate-fade-in">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-rose-700" />
                <span>¿Confirmar Inasistencia (No-Show)?</span>
              </div>
              <p className="text-[11px] text-rose-800">
                La mesa <strong>{reserva.mesas_etiqueta}</strong> será liberada de inmediato a verde <strong>LIBRE</strong> en el salón y la cita quedará registrada en auditoría.
              </p>
              <div>
                <label className="block text-[10px] font-semibold text-rose-900 mb-1">
                  Motivo o detalle de inasistencia (opcional):
                </label>
                <input
                  type="text"
                  value={motivoNoShow}
                  onChange={(e) => setMotivoNoShow(e.target.value)}
                  placeholder="Ej. No se presentó ni contestó las llamadas"
                  maxLength={500}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs bg-white text-slate-800 font-medium"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModoNoShowConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarNoShow}
                  disabled={procesando}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {procesando ? 'Liberando...' : 'Liberar Mesa a LIBRE'}
                </button>
              </div>
            </div>
          )}

          {/* MODO CANCELACIÓN DE RESERVA */}
          {modoCancelar && (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 space-y-2 animate-fade-in">
              <div className="font-bold text-slate-900">Cancelar Reserva Anticipadamente</div>
              <p className="text-[11px] text-slate-600">
                Ingresa el motivo auditado de la cancelación (mínimo 3 caracteres). La mesa asignada quedará disponible:
              </p>
              <textarea
                rows={2}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej. El cliente llamó para reprogramar"
                maxLength={500}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModoCancelar(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCancelacion}
                  disabled={procesando || !motivoCancelacionValido}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold disabled:opacity-50"
                >
                  {procesando ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </div>
          )}

          {/* ACCIONES PRIMARIAS DE RECEPCIÓN */}
          {!modoNoShowConfirm && !modoCancelar && (
            <div className="space-y-2.5 pt-1">
              {esActiva && !permiteSentar && (
                <p className="text-[11px] text-slate-500 text-center">
                  Esta reserva no es de la jornada en curso: los comensales se sientan el día de la cita.
                </p>
              )}

              {/* Acción 1: Sentar Comensales */}
              <button
                type="button"
                onClick={handleSentar}
                disabled={procesando || !esActiva || !permiteSentar}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                style={{ minHeight: '48px' }}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>{procesando ? 'Procesando...' : '✓ Sentar Comensales y Abrir Pedido'}</span>
              </button>

              {/* Acción 2: Cliente no se presentó / No-Show */}
              <button
                type="button"
                onClick={() => setModoNoShowConfirm(true)}
                disabled={procesando || !esActiva}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all disabled:opacity-50 ${
                  esExpirado
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                style={{ minHeight: '44px' }}
              >
                <UserX className="w-4 h-4 text-rose-600" />
                <span>⚠️ Cliente No Se Presentó / Liberar Mesa</span>
              </button>

              {/* Acción 3: Cambiar mesa (p. ej. la mesa sigue ocupada por clientes anteriores) */}
              {onCambiarMesa && (
                <button
                  type="button"
                  onClick={() => onCambiarMesa(reserva)}
                  disabled={procesando || !esActiva}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors disabled:opacity-50 ${
                    reserva.conflicto_mesa
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md"
                      : "bg-white hover:bg-slate-100 text-aurea-navy border-aurea-navy/30"
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <Repeat className={`w-4 h-4 ${reserva.conflicto_mesa ? "text-white" : "text-aurea-copper"}`} />
                  <span>Cambiar mesa</span>
                </button>
              )}

              {/* Acciones Secundarias */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onEnviarWhatsApp(reserva)}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>💬 Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoCancelar(true)}
                  disabled={procesando || !esActiva}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>✕ Cancelar Reserva</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie de Cierre */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
