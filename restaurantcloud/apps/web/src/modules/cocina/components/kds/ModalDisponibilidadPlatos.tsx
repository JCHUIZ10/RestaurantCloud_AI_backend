import React from 'react';
import { CircleSlash, UtensilsCrossed } from 'lucide-react';
import { PlatoDisponibilidadDTO } from '@/types/cocina';
import { EstadoBadge, Modal } from '@/components/ui';
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
  const total = (catalogo || []).length;
  const agotados = (catalogo || []).filter((p) => p.disponibilidad === 'agotado').length;
  const disponibles = total - agotados;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      tema="oscuro"
      tamano="2xl"
      icono={UtensilsCrossed}
      tono={agotados > 0 ? 'alerta' : 'neutro'}
      titulo="Disponibilidad de platos"
      descripcion="Los cambios se reflejan al instante en la carta y la comanda."
      barra={
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2.5 bg-tinta-950">
          <EstadoBadge tema="oscuro" tono="ok" className="text-sm px-3 py-1">
            {disponibles} disponibles
          </EstadoBadge>
          {agotados > 0 ? (
            <EstadoBadge tema="oscuro" tono="error" icono={CircleSlash} className="text-sm px-3 py-1">
              {agotados} agotados
            </EstadoBadge>
          ) : (
            <EstadoBadge tema="oscuro" tono="neutro" className="text-sm px-3 py-1">
              Sin platos agotados
            </EstadoBadge>
          )}
          <span className="text-xs text-tinta-500 ml-auto">{total} platos en catálogo</span>
        </div>
      }
    >
      <PanelDisponibilidadPlatos catalogo={catalogo} onConmutarDisponibilidad={onConmutarDisponibilidad} />
    </Modal>
  );
};
