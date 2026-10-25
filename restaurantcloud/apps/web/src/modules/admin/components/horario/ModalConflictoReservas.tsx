import React, { useState } from 'react';
import { ReservaConflictoDTO } from '@/types/admin';
import { AlertTriangle, MessageCircle, Phone, Armchair, Check } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalConflictoReservasProps {
  isOpen: boolean;
  onClose: () => void;
  fecha: string;
  motivo: string;
  reservas: ReservaConflictoDTO[];
  onConfirmarCierre: (reservasNotificadas: { reserva_id: string; notificado: boolean; metodo_notificacion: 'whatsapp' | 'llamada' | 'presencial' | 'ninguno' }[]) => Promise<void>;
  loading: boolean;
}

const fechaLegible = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

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
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!loading}
      tamano="lg"
      tono="alerta"
      icono={AlertTriangle}
      titulo={`${reservas.length} reserva${reservas.length === 1 ? '' : 's'} para ese día`}
      descripcion={`${motivo} · ${fechaLegible(fecha)}`}
      barra={
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className={cn('font-semibold', todosNotificados ? 'text-emerald-700' : 'text-amber-800')}>
            {totalNotificados} de {reservas.length} avisadas
          </span>
          <button
            type="button"
            onClick={handleToggleTodos}
            className="min-h-tactil px-2 text-sm font-semibold text-aurea-copper hover:underline"
          >
            {todosNotificados ? 'Desmarcar todas' : 'Marcar todas'}
          </button>
        </div>
      }
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Volver
          </Button>
          <Button variant="danger" onClick={handleConfirmar} disabled={!todosNotificados} loading={loading}>
            Cerrar y cancelar reservas
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-tinta-700">
          Hay {totalPax} comensales con reserva. Avisa a cada cliente por WhatsApp y márcalo como avisado; al confirmar, sus reservas quedan
          canceladas.
        </p>

        <ul className="space-y-2.5">
          {reservas.map((res) => {
            const horaRes = res.fecha_hora.includes('T') ? res.fecha_hora.split('T')[1].slice(0, 5) : res.fecha_hora;
            const estaNotificado = !!notificados[res.id];

            return (
              <li
                key={res.id}
                className={cn(
                  'p-3 sm:p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                  estaNotificado ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-tinta-200'
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-tinta-900">{res.cliente_nombre}</span>
                    <span className="px-2 py-0.5 bg-tinta-100 text-tinta-700 rounded-md text-xs font-semibold">{res.num_personas} pers.</span>
                    <span className="font-mono text-xs text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded-md">{horaRes}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      {res.cliente_telefono}
                    </span>
                    {res.mesas_asignadas.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5" aria-hidden="true" />
                        {res.mesas_asignadas.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={res.link_whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-tactil px-3 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={estaNotificado}
                    onClick={() => toggleNotificado(res.id)}
                    className={cn(
                      'min-h-tactil px-3 rounded-lg border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors',
                      estaNotificado ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-tinta-300 text-tinta-700 hover:bg-tinta-100'
                    )}
                  >
                    <Check className={cn('w-4 h-4', !estaNotificado && 'opacity-30')} aria-hidden="true" />
                    Avisado
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
};
