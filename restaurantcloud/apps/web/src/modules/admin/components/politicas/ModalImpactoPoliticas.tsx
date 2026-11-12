import React from 'react';
import { AlertTriangle, Users, Calendar, ShieldAlert } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { ImpactoPoliticasReservaDTO, ReservaAfectadaPorPoliticaDTO } from '@/types/admin';

interface ModalImpactoPoliticasProps {
  isOpen: boolean;
  onClose: () => void;
  /** Confirma guardar los nuevos valores; las reservas se conservan. */
  onGuardarIgualmente: () => void;
  impacto: ImpactoPoliticasReservaDTO | null;
  loading: boolean;
}

const fechaLegible = (iso?: string): string => {
  if (!iso) return '';
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? iso
    : fecha.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const GrupoReservas: React.FC<{ titulo: string; reservas: ReservaAfectadaPorPoliticaDTO[] }> = ({ titulo, reservas }) => {
  if (reservas.length === 0) return null;
  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-stone-50 px-3.5 py-2.5 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
        <span>{titulo}</span>
        <span>{reservas.length}</span>
      </div>
      <ul className="divide-y divide-stone-100 max-h-52 overflow-y-auto">
        {reservas.map((reserva) => (
          <li key={reserva.id} className="p-3 text-xs space-y-1">
            <div className="font-semibold text-stone-900 flex flex-wrap items-center gap-2">
              <span>{reserva.cliente ?? 'Reserva'}</span>
              {reserva.pax !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-stone-100 text-stone-700 px-1.5 rounded font-medium">
                  <Users className="w-3 h-3 text-stone-500" aria-hidden="true" />
                  {reserva.pax} PAX
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-normal text-stone-500">
                <Calendar className="w-3 h-3 text-stone-400" aria-hidden="true" />
                {fechaLegible(reserva.fecha_hora)}
              </span>
              {reserva.mesas && reserva.mesas.length > 0 && (
                <span className="text-[11px] font-medium text-stone-700">{reserva.mesas.join(', ')}</span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">{reserva.motivo}</p>
            {reserva.link_whatsapp && (
              <a
                href={reserva.link_whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold"
              >
                WhatsApp
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Aviso al subir la duración o el buffer: lista las reservas ya registradas que dejarían de ser compatibles.
 * No se cancela ninguna; el mozo las verá marcadas y podrá cambiarlas de mesa.
 */
export const ModalImpactoPoliticas: React.FC<ModalImpactoPoliticasProps> = ({
  isOpen,
  onClose,
  onGuardarIgualmente,
  impacto,
  loading,
}) => {
  const total = impacto?.total ?? 0;

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      cerrable={!loading}
      tamano="lg"
      icono={AlertTriangle}
      titulo="Algunas reservas dejarían de ser compatibles"
      descripcion="Los nuevos valores afectan a reservas que ya están registradas."
      pie={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Volver a editar
          </Button>
          <Button onClick={onGuardarIgualmente} loading={loading}>
            Guardar igualmente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>
              {total} {total === 1 ? 'reserva' : 'reservas'}
            </strong>{' '}
            quedarían en conflicto. <br />
            <strong>No se cancela ninguna</strong>: el mozo las verá marcadas y podrá
            resolverlas con <strong>«Cambiar mesa»</strong> o avisando al cliente.
          </div>
        </div>

        <GrupoReservas titulo="Chocarían en la misma mesa" reservas={impacto?.choques ?? []} />
        <GrupoReservas titulo="Terminarían después del cierre del turno" reservas={impacto?.fuera_de_horario ?? []} />
      </div>
    </Modal>
  );
};
