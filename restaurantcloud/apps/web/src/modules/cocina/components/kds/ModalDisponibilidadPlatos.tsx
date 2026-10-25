import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { PlatoDisponibilidadDTO } from '@/types/cocina';
import { Modal } from '@/components/ui';
import { PanelDisponibilidadPlatos } from './PanelDisponibilidadPlatos';

interface ModalDisponibilidadPlatosProps {
  abierto: boolean;
  onCerrar: () => void;
  catalogo: PlatoDisponibilidadDTO[];
  onConmutarDisponibilidad: (productoId: string, nuevoEstado: 'disponible' | 'agotado') => void;
}

/** Acceso rápido desde el KDS al mismo panel de la pantalla de stock rápido. */
export const ModalDisponibilidadPlatos: React.FC<ModalDisponibilidadPlatosProps> = ({
  abierto,
  onCerrar,
  catalogo,
  onConmutarDisponibilidad,
}) => {
  const agotados = (catalogo || []).filter((p) => p.disponibilidad === 'agotado').length;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      tema="oscuro"
      tamano="2xl"
      icono={UtensilsCrossed}
      titulo="Disponibilidad de platos"
      descripcion={`${agotados} de ${catalogo.length} platos agotados. Los cambios se reflejan al instante en la carta y la comanda.`}
    >
      <PanelDisponibilidadPlatos catalogo={catalogo} onConmutarDisponibilidad={onConmutarDisponibilidad} />
    </Modal>
  );
};
