import React from 'react';
import { Clock, Sparkles, UtensilsCrossed } from 'lucide-react';

interface OnboardingHorarioVacioProps {
  onAplicarPlantillaEstandar: () => Promise<void>;
  onIniciarVacioManual: () => void;
  loading: boolean;
}

export const OnboardingHorarioVacio: React.FC<OnboardingHorarioVacioProps> = ({
  onAplicarPlantillaEstandar,
  onIniciarVacioManual,
  loading,
}) => {
  return (
    <div className="p-8 max-w-3xl mx-auto my-12 bg-white rounded-2xl shadow-sm border border-gray-200 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-5">
        <Clock className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Configura el Horario de Atención de tu Sede
      </h2>
      <p className="text-sm text-gray-600 max-w-xl mx-auto mb-8">
        Tu sede aún no tiene días ni turnos asignados. Establecer un horario permite habilitar las reservas de salón y la recepción de pedidos en cocina en tus horas de servicio.
      </p>

      {/* Tarjeta de Recomendación */}
      <div className="p-6 bg-gradient-to-br from-red-50/60 to-orange-50/60 border border-red-200 rounded-xl mb-8 text-left">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white">
            Recomendado
          </span>
          <span className="text-sm font-bold text-gray-900">
            Plantilla Estándar de Gastronomía (Almuerzo + Cena)
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-4">
          Aplica automáticamente el esquema probado para salones de restaurante en Perú:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100">
            <UtensilsCrossed className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Lunes a Jueves:</strong> Almuerzo (12-16h) y Cena (19-23:30h)</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100">
            <UtensilsCrossed className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Viernes y Sábados:</strong> Almuerzo y Cena extendida / Continuo</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100 sm:col-span-2">
            <UtensilsCrossed className="w-4 h-4 text-red-500 shrink-0" />
            <span><strong>Domingos:</strong> Servicio de Almuerzo Familiar extendido (12:00 a 18:00h)</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={onAplicarPlantillaEstandar}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm transition disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Aplicando Plantilla...' : 'Aplicar Plantilla Estándar en 1 Clic'}
        </button>

        <button
          type="button"
          onClick={onIniciarVacioManual}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
        >
          Configurar Manualmente desde Cero
        </button>
      </div>
    </div>
  );
};
