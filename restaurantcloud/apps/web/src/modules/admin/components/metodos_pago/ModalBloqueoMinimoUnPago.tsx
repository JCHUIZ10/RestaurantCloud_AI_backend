import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

interface ModalBloqueoMinimoUnPagoProps {
  isOpen: boolean;
  onClose: () => void;
  metodoBloqueadoNombre?: string;
}

export const ModalBloqueoMinimoUnPago: React.FC<ModalBloqueoMinimoUnPagoProps> = ({
  isOpen,
  onClose,
  metodoBloqueadoNombre = 'Efectivo',
}) => (
  <Modal
    abierto={isOpen}
    onCerrar={onClose}
    tamano="sm"
    tono="error"
    icono={ShieldAlert}
    titulo={`No puedes desactivar ${metodoBloqueadoNombre}`}
    pie={<Button onClick={onClose}>Entendido</Button>}
  >
    <div className="space-y-3 text-sm text-tinta-700">
      <p>Es la única forma de pago activa. Sin ninguna, caja no podría cobrar ni emitir comprobantes.</p>
      <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
        Activa otra primero (tarjeta o Yape/Plin) y luego desactiva {metodoBloqueadoNombre}.
      </p>
    </div>
  </Modal>
);
