import React, { useState } from 'react';
import { ReservaConflictoDTO } from '@/types/admin';
import { AlertTriangle, MessageCircle, X, Users, CheckCircle2 } from 'lucide-react';

interface ModalConflictoReservasProps {
  isOpen: boolean;
  onClose: () => void;
  fecha: string;
  motivo: string;
  reservas: ReservaConflictoDTO[];
  onConfirmarCierre: (reservasNotificadas: { reserva_id: string; notificado: boolean; metodo_notificacion: 'whatsapp' | 'llamada' | 'presencial' | 'ninguno' }[]) => Promise<void>;
  loading: boolean;
}

export const ModalConflictoReservas: React.FC<ModalConflictoReservasProps> = ({
  isOpen,
  onClose,
  fecha,
  motivo,
  reservas,
  onConfirmarCierre,
  loading,
}) => {
  // Estado local para checkboxes de notificación
  const [notificados, setNotificados] = useState<Record<string, boolean>>(() => {
    const inicial: Record<string, boolean> = {};
    reservas.forEach((r) => {
      inicial[r.id] = r.notificado || false;
    });
    return inicial;
  });

  if (!isOpen) return null;

  const toggleNotificado = (id: string) => {
    setNotificados((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalNotificados = reservas.filter((r) => !!notificados[r.id]).length;
  const todosNotificados = reservas.length > 0 && totalNotificados === reservas.length;

  const handleToggleTodos = () => {
    const nuevoValor = !todosNotificados;
    const mapa: Record<string, boolean> = {};
    reservas.forEach((r) => {
      mapa[r.id] = nuevoValor;
    });
    setNotificados(mapa);
  };

  const handleConfirmar = async () => {
    if (!todosNotificados) return;
    const payload = reservas.map((r) => ({
      reserva_id: r.id,
      notificado: !!notificados[r.id],
      metodo_notificacion: notificados[r.id] ? ('whatsapp' as const) : ('ninguno' as const),
    }));
    await onConfirmarCierre(payload);
  };

  const totalPax = reservas.reduce((acc, r) => acc + r.num_personas, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header de Alerta en Rojo / Ámbar */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                Advertencia de Impacto: {reservas.length} Reservas Afectadas
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                Cierre programado para el <span className="font-semibold underline">{fecha}</span> ({motivo})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Resumen de comensales */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold text-sm">
                Se detectaron {reservas.length} reserva(s) confirmada(s) que totalizan {totalPax} comensales.
              </p>
              <p className="text-amber-800">
                Para garantizar la satisfacción del cliente y evitar reclamos en puerta, utiliza el botón directo de WhatsApp para coordinar la reprogramación de su mesa con el texto de cortesía pre-redactado.
              </p>
            </div>
          </div>

          {/* Lista de Reservas en Conflicto */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
              <span>
                Comensales Programados ({totalNotificados}/{reservas.length} contactados)
              </span>
              <button
                type="button"
                onClick={handleToggleTodos}
                className="text-xs font-semibold text-red-600 hover:text-red-700 normal-case cursor-pointer hover:underline"
              >
                {todosNotificados ? 'Desmarcar todos' : 'Marcar todos como notificados'}
              </button>
            </div>

            <div className="space-y-2.5">
              {reservas.map((res) => {
                const horaRes = res.fecha_hora.includes('T')
                  ? res.fecha_hora.split('T')[1].slice(0, 5)
                  : res.fecha_hora;
                const estaNotificado = !!notificados[res.id];

                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      estaNotificado
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Datos Comensal */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{res.cliente_nombre}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                          {res.num_personas} PAX
                        </span>
                        <span className="font-mono text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">
                          {horaRes} hrs
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>📞 {res.cliente_telefono}</span>
                        <span>•</span>
                        <span>🪑 {res.mesas_asignadas.join(', ') || 'Mesa pendiente'}</span>
                      </div>
                    </div>

                    {/* Acciones WhatsApp y Checkbox */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <a
                        href={res.link_whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold rounded-lg shadow-xs transition"
                        title="Abrir chat de WhatsApp Web con mensaje de cortesía pre-redactado"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Abrir WhatsApp
                      </a>

                      <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={estaNotificado}
                          onChange={() => toggleNotificado(res.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className={estaNotificado ? 'font-semibold text-emerald-800' : ''}>
                          {estaNotificado ? 'Notificado' : 'Marcar notificado'}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nota de impacto atómico */}
          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span>
              Al confirmar, las reservas pasarán automáticamente al estado <strong>cancelada</strong> y el cierre quedará activo en el calendario del local.
            </span>
          </div>
        </div>

        {/* Footer con Alerta de Bloqueo */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            {!todosNotificados ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                Debes contactar y marcar a todos los comensales ({totalNotificados}/{reservas.length}) antes de proceder.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                Todos los comensales ({totalNotificados}/{reservas.length}) han sido marcados como notificados.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            >
              Cancelar Operación
            </button>

            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading || !todosNotificados}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl shadow-sm transition ${
                todosNotificados && !loading
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
              }`}
              title={
                !todosNotificados
                  ? 'Marca a todos los comensales como notificados para habilitar este botón'
                  : 'Confirmar cierre y cancelar reservas'
              }
            >
              <AlertTriangle className="w-4 h-4" />
              {loading ? 'Cancelando Reservas y Guardando...' : 'Confirmar Cierre y Cancelar Reservas Afectadas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
