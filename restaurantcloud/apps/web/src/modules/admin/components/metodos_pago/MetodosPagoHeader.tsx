import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui';

interface MetodosPagoHeaderProps {
  isDirty: boolean;
}

export const MetodosPagoHeader: React.FC<MetodosPagoHeaderProps> = ({ isDirty }) => (
  <PageHeader
    icono={CreditCard}
    titulo="Métodos de pago"
    descripcion="Qué formas de pago acepta tu local y qué recargo se cobra al cliente en caja y precuenta."
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
