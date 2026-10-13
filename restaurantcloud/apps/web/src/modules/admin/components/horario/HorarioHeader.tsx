import React from 'react';
import { Clock, Calendar} from 'lucide-react';

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
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Horario de Atención y Feriados</h1>
            {totalHorasSemanales !== undefined && totalHorasSemanales > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {totalHorasSemanales} hrs / semana
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configura los turnos operativos de apertura al público, excepciones por feriados nacionales y cierres extraordinarios con resolución de reservas.
          </p>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex gap-2 mt-6 border-b border-gray-200 -mb-5">
        <button
          type="button"
          onClick={() => onCambiarTab('semana')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tabActiva === 'semana'
              ? 'border-red-600 text-red-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Semana Regular (Lunes a Domingo)
        </button>

        <button
          type="button"
          onClick={() => onCambiarTab('excepciones')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tabActiva === 'excepciones'
              ? 'border-red-600 text-red-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Excepciones y Feriados
          {totalExcepciones > 0 && (
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                tabActiva === 'excepciones'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {totalExcepciones}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
