import React, { useId, useState } from 'react';
import { CalendarPlus, AlertCircle } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

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

const CLASE_CAMPO =
  'w-full min-h-tactil px-3.5 bg-white border border-tinta-300 rounded-xl text-base md:text-sm text-tinta-900 placeholder:text-tinta-400 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper';
const CLASE_ROTULO = 'block text-sm font-semibold text-tinta-700 mb-1.5';

const MODALIDADES = [
  { cerrado: true, titulo: 'Cerrado todo el día', activa: 'border-red-500 bg-red-50/60 ring-1 ring-red-500', punto: 'bg-red-500' },
  { cerrado: false, titulo: 'Horario especial', activa: 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500', punto: 'bg-amber-500' },
];

export const ModalCrearEditarExcepcion: React.FC<ModalCrearEditarExcepcionProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const idForm = useId();
  const [fecha, setFecha] = useState('');
  const [cerrado, setCerrado] = useState(true);
  const [horaInicio, setHoraInicio] = useState('12:00');
  const [horaFin, setHoraFin] = useState('17:00');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fecha) {
      setError('Elige la fecha.');
      return;
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      setError('Escribe el motivo (mínimo 3 caracteres).');
      return;
    }

    if (!cerrado && (!horaInicio || !horaFin)) {
      setError('Indica la hora de apertura y la de cierre.');
      return;
    }

    if (!cerrado && horaInicio === horaFin) {
      setError('La apertura y el cierre no pueden ser a la misma hora.');
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
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'No se pudo registrar la fecha.');
    }
  };

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!loading}
      tamano="md"
      icono={CalendarPlus}
      titulo="Nueva fecha especial"
      descripcion="Ese día no se usa el horario semanal."
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form={idForm} loading={loading}>
            {loading ? 'Revisando reservas...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${idForm}-fecha`} className={CLASE_ROTULO}>
              Fecha
            </label>
            <input id={`${idForm}-fecha`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={CLASE_CAMPO} required />
          </div>
          <div>
            <label htmlFor={`${idForm}-motivo`} className={CLASE_ROTULO}>
              Motivo
            </label>
            <input
              id={`${idForm}-motivo`}
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Feriado nacional, mantenimiento"
              className={CLASE_CAMPO}
              required
            />
          </div>
        </div>

        <fieldset>
          <legend className={CLASE_ROTULO}>Ese día</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODALIDADES.map((m) => {
              const elegida = cerrado === m.cerrado;
              return (
                <label
                  key={m.titulo}
                  className={cn(
                    'min-h-tactil px-4 py-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-aurea-copper',
                    elegida ? m.activa : 'border-tinta-200 bg-white hover:border-tinta-300'
                  )}
                >
                  <input
                    type="radio"
                    name={`${idForm}-modalidad`}
                    checked={elegida}
                    onChange={() => setCerrado(m.cerrado)}
                    className="sr-only"
                  />
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', m.punto)} aria-hidden="true" />
                  <span className="text-sm font-semibold text-tinta-900">{m.titulo}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {!cerrado && (
          <div className="grid grid-cols-2 gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
            <div>
              <label htmlFor={`${idForm}-ini`} className={CLASE_ROTULO}>
                Abre
              </label>
              <input id={`${idForm}-ini`} type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={cn(CLASE_CAMPO, 'font-mono')} />
            </div>
            <div>
              <label htmlFor={`${idForm}-fin`} className={CLASE_ROTULO}>
                Cierra
              </label>
              <input id={`${idForm}-fin`} type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={cn(CLASE_CAMPO, 'font-mono')} />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
