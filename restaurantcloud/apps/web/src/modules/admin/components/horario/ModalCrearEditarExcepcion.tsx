import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

interface ModalCrearEditarExcepcionProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fecha: string;
    cerrado: boolean;
    hora_inicio?: string;
    hora_fin?: string;
    motivo: string;
  }) => Promise<void>;
  loading: boolean;
}

export const ModalCrearEditarExcepcion: React.FC<ModalCrearEditarExcepcionProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [fecha, setFecha] = useState('');
  const [cerrado, setCerrado] = useState(true);
  const [horaInicio, setHoraInicio] = useState('12:00');
  const [horaFin, setHoraFin] = useState('17:00');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fecha) {
      setError('Debes seleccionar una fecha para el cierre o feriado.');
      return;
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      setError('Debes especificar un motivo descriptivo (mínimo 3 caracteres).');
      return;
    }

    if (!cerrado && (!horaInicio || !horaFin)) {
      setError('Debes indicar tanto la hora de apertura como la hora de cierre especial.');
      return;
    }

    if (!cerrado && horaInicio === horaFin) {
      setError('La hora de apertura y cierre especial no pueden ser iguales.');
      return;
    }

    try {
      await onSubmit({
        fecha,
        cerrado,
        hora_inicio: cerrado ? undefined : horaInicio,
        hora_fin: cerrado ? undefined : horaFin,
        motivo: motivo.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Error al procesar la excepción.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header del Modal */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Programar Cierre o Feriado</h3>
              <p className="text-xs text-gray-500">Configura fechas especiales y verifica posibles reservas activas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Fecha de la Excepción <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Tipo de Excepción (Radio cards) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Modalidad de Operación <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition ${
                  cerrado
                    ? 'border-red-500 bg-red-50/50 text-red-900 ring-1 ring-red-500'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">Cierre Total</span>
                  <input
                    type="radio"
                    name="modalidad"
                    checked={cerrado}
                    onChange={() => setCerrado(true)}
                    className="text-red-600 focus:ring-red-500"
                  />
                </div>
                <span className="text-[11px] text-gray-500">
                  El local permanecerá completamente cerrado las 24 horas.
                </span>
              </label>

              <label
                className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition ${
                  !cerrado
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">Horario Especial</span>
                  <input
                    type="radio"
                    name="modalidad"
                    checked={!cerrado}
                    onChange={() => setCerrado(false)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                </div>
                <span className="text-[11px] text-gray-500">
                  Atención acotada (ej. solo turno almuerzo o horario festivo).
                </span>
              </label>
            </div>
          </div>

          {/* Rango Horario Especial */}
          {!cerrado && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Horario permitido de atención</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Hora Apertura
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Hora Cierre
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Motivo o Descripción */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Motivo o Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="ej. Mantenimiento preventivo de campanas extractoras / Feriado Nacional"
              className="w-full text-sm px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Verificando Reservas...' : 'Continuar y Verificar Reservas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
