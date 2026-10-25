import React, { useState } from 'react';
import { Wrench, ChevronUp, ChevronDown, Calendar, AlertTriangle, RotateCcw, Clock } from 'lucide-react';

interface DemoAdminHorarioWidgetProps {
  onSimularConflictoNavidad: () => void;
  onCargarFeriadosPeru: () => void;
  onSimularSedeSinHorario: () => void;
  onRestablecerSemillas: () => void;
}

export const DemoAdminHorarioWidget: React.FC<DemoAdminHorarioWidgetProps> = ({
  onSimularConflictoNavidad,
  onCargarFeriadosPeru,
  onSimularSedeSinHorario,
  onRestablecerSemillas,
}) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 font-sans">
      <div className="bg-white rounded-2xl shadow-xl border border-tinta-300 overflow-hidden w-80 transition-all duration-200">
        {/* Barra superior del widget */}
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="w-full px-4 py-3 bg-tinta-900 text-white flex items-center justify-between hover:bg-tinta-800 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>QA: horario y feriados</span>
          </div>
          {abierto ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Opciones cuando está desplegado */}
        {abierto && (
          <div className="p-4 space-y-2.5 bg-tinta-50 text-xs">
            <p className="text-xs text-tinta-500 mb-2">
              Atajos de prueba:
            </p>

            <button
              type="button"
              onClick={() => {
                onSimularConflictoNavidad();
                setAbierto(false);
              }}
              className="w-full text-left p-2.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-900 font-medium flex items-center gap-2 transition shadow-xs"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>1. Simular Conflicto Navidad (25/12 con 3 reservas)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCargarFeriadosPeru();
                setAbierto(false);
              }}
              className="w-full text-left p-2.5 bg-white border border-tinta-200 rounded-lg hover:bg-tinta-100 text-tinta-800 font-medium flex items-center gap-2 transition shadow-xs"
            >
              <Calendar className="w-4 h-4 text-red-600 shrink-0" />
              <span>2. Cargar Feriados Nacionales Perú 2026</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSimularSedeSinHorario();
                setAbierto(false);
              }}
              className="w-full text-left p-2.5 bg-white border border-tinta-200 rounded-lg hover:bg-tinta-100 text-tinta-800 font-medium flex items-center gap-2 transition shadow-xs"
            >
              <Clock className="w-4 h-4 text-tinta-500 shrink-0" />
              <span>3. Simular Sede sin Horario (Empty State)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onRestablecerSemillas();
                setAbierto(false);
              }}
              className="w-full text-left p-2.5 bg-white border border-tinta-200 rounded-lg hover:bg-tinta-100 text-tinta-800 font-medium flex items-center gap-2 transition shadow-xs"
            >
              <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
              <span>4. Restablecer Semillas Canónicas Áurea</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
