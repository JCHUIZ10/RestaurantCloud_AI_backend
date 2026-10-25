import React from 'react';
import { ArrowRight, Sliders } from 'lucide-react';

interface OnboardingHorarioVacioProps {
  onAplicarPlantillaEstandar: () => Promise<void>;
  onIniciarVacioManual: () => void;
  loading: boolean;
}

const PLANTILLA = [
  { dias: 'Lunes a jueves', horario: '12:00–16:00 y 19:00–23:30', color: 'bg-red-500' },
  { dias: 'Viernes y sábado', horario: 'Cena hasta las 00:30', color: 'bg-amber-500' },
  { dias: 'Domingo', horario: '12:00–18:00', color: 'bg-emerald-500' },
];

export const OnboardingHorarioVacio: React.FC<OnboardingHorarioVacioProps> = ({
  onAplicarPlantillaEstandar,
  onIniciarVacioManual,
  loading,
}) => (
  <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-md border border-tinta-200 text-center">
    <div className="max-w-2xl mx-auto">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">¿Cuándo abre tu local?</h2>
      <p className="mt-2 text-sm text-tinta-600">Sin horario no se pueden tomar reservas. Empieza con almuerzo y cena y ajústalo después.</p>

      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {PLANTILLA.map(({ dias, horario, color }) => (
          <li key={dias} className="p-4 rounded-2xl bg-aurea-ivory/70 border border-aurea-champagne/70">
            <span className="flex items-center gap-2 text-sm font-bold text-tinta-900">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} aria-hidden="true" />
              {dias}
            </span>
            <span className="block mt-1 text-xs font-mono text-tinta-600">{horario}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAplicarPlantillaEstandar}
          disabled={loading}
          className="w-full sm:w-auto min-h-tactil px-7 rounded-xl text-sm font-bold text-aurea-navy bg-aurea-copper hover:bg-aurea-copper/90 shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          {loading ? 'Aplicando...' : 'Usar almuerzo y cena'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onIniciarVacioManual}
          disabled={loading}
          className="w-full sm:w-auto min-h-tactil px-5 rounded-xl text-sm font-semibold text-tinta-700 border border-tinta-200 hover:bg-tinta-100 transition-colors flex items-center justify-center gap-2"
        >
          <Sliders className="w-4 h-4 text-tinta-400" aria-hidden="true" />
          Configurar a mano
        </button>
      </div>
    </div>
  </div>
);
