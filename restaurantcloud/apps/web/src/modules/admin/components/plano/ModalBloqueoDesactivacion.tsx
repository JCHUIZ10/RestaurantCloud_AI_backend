import React from 'react';
import { ConflictoDesactivacionMesaDTO } from '@/types/admin';
import { AlertOctagon } from 'lucide-react';
import { Button, EstadoBadge, Modal } from '@/components/ui';

interface ModalBloqueoDesactivacionProps {
  conflicto: ConflictoDesactivacionMesaDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalBloqueoDesactivacion: React.FC<ModalBloqueoDesactivacionProps> = ({
  conflicto,
  isOpen,
  onClose,
}) => {
  if (!conflicto) return null;

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      tono="error"
      icono={AlertOctagon}
      titulo="La mesa tiene una cuenta abierta"
      descripcion="Cóbrala en caja o anúlala antes de desactivar la mesa, así no se pierden consumos sin facturar."
      pie={<Button onClick={onClose}>Entendido</Button>}
    >
      <dl className="rounded-xl border border-aurea-champagne/70 divide-y divide-aurea-champagne/50 text-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-aurea-navy/60">Comanda</dt>
          <dd className="font-mono font-bold text-aurea-navy">{conflicto.codigo_comanda}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-aurea-navy/60">Estado</dt>
          <dd>
            <EstadoBadge tono="alerta">{conflicto.estado_pedido}</EstadoBadge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-aurea-navy/60">Mozo</dt>
          <dd className="font-semibold text-aurea-navy">{conflicto.mozo_nombre}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-aurea-ivory/60">
          <dt className="text-aurea-navy/60">Consumo</dt>
          <dd className="font-serif font-bold text-lg text-aurea-navy tabular-nums">
            S/ {conflicto.total_cuenta.toFixed(2)}
          </dd>
        </div>
      </dl>
    </Modal>
  );
};
