import React from 'react';
import { Clock } from 'lucide-react';
import { PageHeader, Pestanas } from '@/components/ui';

interface HorarioHeaderProps {
  tabActiva: 'semana' | 'excepciones';
  onCambiarTab: (tab: 'semana' | 'excepciones') => void;
  totalExcepciones: number;
  totalHorasSemanales?: number;
}

export const HorarioHeader: React.FC<HorarioHeaderProps> = ({
  tabActiva,
  onCambiarTab,
  totalExcepciones,
  totalHorasSemanales,
}) => (
  <div className="space-y-4">
    <PageHeader
      icono={Clock}
      titulo="Horario de atención"
      descripcion="Días y turnos en que el local abre, y fechas con cierre u horario especial."
      meta={
        totalHorasSemanales !== undefined &&
        totalHorasSemanales > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            {totalHorasSemanales} h por semana
          </span>
        )
      }
    />
    <Pestanas
      etiqueta="Sección del horario"
      valor={tabActiva}
      onCambiar={onCambiarTab}
      opciones={[
        { valor: 'semana', etiqueta: 'Semana', punto: 'bg-emerald-500' },
        { valor: 'excepciones', etiqueta: 'Feriados y cierres', punto: 'bg-red-500', conteo: totalExcepciones },
      ]}
    />
  </div>
);
