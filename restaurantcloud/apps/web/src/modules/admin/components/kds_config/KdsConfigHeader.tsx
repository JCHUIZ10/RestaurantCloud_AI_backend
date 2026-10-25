import React from 'react';
import { Flame, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui';

interface KdsConfigHeaderProps {
  isDirty: boolean;
}

export const KdsConfigHeader: React.FC<KdsConfigHeaderProps> = ({ isDirty }) => (
  <PageHeader
    icono={Flame}
    titulo="Tiempos de cocina"
    descripcion="Cuándo cambia de color una comanda en cocina, cuánto puede esperar un plato en el pase y qué sonidos se emiten."
    meta={
      isDirty && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          Cambios sin guardar
        </span>
      )
    }
  />
);
