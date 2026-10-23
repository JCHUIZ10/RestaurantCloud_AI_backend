import React, { useState } from 'react';
import { X, Clock, Phone, MessageSquare, Users, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
import { ReservaCardDTO } from '@/types/mozo';

interface ModalFichaReservaProps {
  abierto: boolean;
  reserva: ReservaCardDTO | null;
  onCerrar: () => void;
  onSentarComensales: (reserva: ReservaCardDTO) => Promise<void>;
  onRegistrarNoShow: (reservaId: string, motivo: string) => Promise<void>;
  onCancelarReserva: (reservaId: string, motivo: string) => Promise<void>;
  onEnviarWhatsApp: (reserva: ReservaCardDTO) => void;
}

export const ModalFichaReserva: React.FC<ModalFichaReservaProps> = ({
  abierto,
  reserva,
  onCerrar,
  onSentarComensales,
  onRegistrarNoShow,
  onCancelarReserva,
  onEnviarWhatsApp,
}) => {
  const [modoCancelar, setModoCancelar] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('Cliente solicitó reprogramar por emergencia familiar');
  const [modoNoShowConfirm, setModoNoShowConfirm] = useState(false);
  const [motivoNoShow, setMotivoNoShow] = useState('Cliente no se presentó ni contestó al llamado');
  const [procesando, setProcesando] = useState(false);

  if (!abierto || !reserva) return null;

  const esExpirado = Boolean(
    reserva.tolerancia_expiro ||
    (typeof reserva.minutos_restantes === 'number' && reserva.minutos_restantes < -15)
  );

  const handleSentar = async () => {
    setProcesando(true);
    try {
      await onSentarComensales(reserva);
      onCerrar();
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarNoShow = async () => {
    setProcesando(true);
    try {
      await onRegistrarNoShow(reserva.id, motivoNoShow);
      onCerrar();
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarCancelacion = async () => {
    if (!motivoCancelacion.trim()) return;
    setProcesando(true);
    try {
      await onCancelarReserva(reserva.id, motivoCancelacion);
      onCerrar();
    } finally {
      setProcesando(false);
    }
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aurea-champagne">
                Recepción & Control de Cortesía
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-aurea-copper/20 text-aurea-champagne font-mono">
                560px
              </span>
            </div>
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
                  href={`tel:${reserva.cliente_telefono}`}
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

          {/* TIEMPO Y CORTESÍA (Reloj Dinámico) */}
          <section
            className={`p-4 rounded-xl border transition-all ${
              esExpirado
                ? 'bg-rose-50/70 border-rose-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-aurea-navy" />
                <span>Tiempo y Cortesía de Espera</span>
              </h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Hora Pactada:</span>
                <span className="font-mono font-bold text-slate-900">{reserva.hora_texto} (Turno Almuerzo)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ventana de Cortesía:</span>
                <span className="font-semibold text-slate-800">15 minutos (hasta 14:15)</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Estado del Reloj:</span>
                {esExpirado ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 font-bold border border-rose-300 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    <span>⏱️ Tolerancia expirada (16 min retraso)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>En ventana de cortesía (faltan 10 min)</span>
                  </span>
                )}
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
                  Motivo o detalle de inasistencia:
                </label>
                <input
                  type="text"
                  value={motivoNoShow}
                  onChange={(e) => setMotivoNoShow(e.target.value)}
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
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-sm"
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
                Ingresa el motivo auditado de la cancelación. La mesa asignada quedará disponible:
              </p>
              <textarea
                rows={2}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
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
                  disabled={procesando}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold"
                >
                  {procesando ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </div>
          )}

          {/* ACCIONES PRIMARIAS DE RECEPCIÓN */}
          {!modoNoShowConfirm && !modoCancelar && (
            <div className="space-y-2.5 pt-1">
              {/* Acción 1: Sentar Comensales */}
              <button
                type="button"
                onClick={handleSentar}
                disabled={procesando || reserva.estado === 'atendida'}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                style={{ minHeight: '48px' }}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>[ ✓ Sentar Comensales y Abrir Pedido (CU-MOZO-02) ]</span>
              </button>

              {/* Acción 2: Cliente no se presentó / No-Show */}
              <button
                type="button"
                onClick={() => setModoNoShowConfirm(true)}
                disabled={procesando || reserva.estado === 'atendida' || reserva.estado === 'no_show'}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  esExpirado
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                style={{ minHeight: '44px' }}
              >
                <UserX className="w-4 h-4 text-rose-600" />
                <span>[ ⚠️ Cliente No Se Presentó / Liberar Mesa ]</span>
              </button>

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
                  disabled={reserva.estado === 'cancelada'}
                  className="py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
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
