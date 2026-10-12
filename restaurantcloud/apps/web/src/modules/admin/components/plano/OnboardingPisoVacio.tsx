import React from 'react';
import { Sparkles, Plus, LayoutGrid } from 'lucide-react';

interface OnboardingPisoVacioProps {
  pisoNombre: string;
  onAbrirAsistenteLote: () => void;
  onAbrirMesaIndividual: () => void;
}

export const OnboardingPisoVacio: React.FC<OnboardingPisoVacioProps> = ({
  pisoNombre,
  onAbrirAsistenteLote,
  onAbrirMesaIndividual,
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-dashed border-aurea-copper/40 text-center max-w-3xl mx-auto shadow-sm space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-aurea-champagne/30 border border-aurea-copper/40 flex items-center justify-center mx-auto text-aurea-navy">
        <LayoutGrid className="w-8 h-8 text-aurea-copper" />
      </div>

      <div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">
          ¡Tu {pisoNombre} está listo para diseñar!
        </h3>
        <p className="text-sm text-aurea-navy/70 mt-2 max-w-xl mx-auto">
          Aún no tienes mesas registradas en este ambiente. Elige cómo prefieres comenzar a
          configurar la distribución de tu restaurante:
        </p>
      </div>

      {/* Tarjetas de Doble Camino */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left pt-2">
        {/* Opción 1: Asistente en Lote (Recomendado) */}
        <div className="p-6 rounded-2xl bg-aurea-ivory border-2 border-aurea-copper/50 relative flex flex-col justify-between hover:shadow-md transition-all">
          <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-aurea-copper text-aurea-navy shadow-sm">
            Recomendado · 10 segundos
          </div>

          <div className="space-y-2 mt-2">
            <h4 className="font-serif text-lg font-bold text-aurea-navy flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aurea-copper" />
              <span>Asistente Rápido en Lote</span>
            </h4>
            <p className="text-xs text-aurea-navy/70 leading-relaxed">
              Genera 5, 10 o 20 mesas correlativas de 4 personas con un solo clic. El sistema
              calculará y distribuirá automáticamente la cuadrícula geométrica.
            </p>
          </div>

          <button
            onClick={onAbrirAsistenteLote}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-aurea-champagne" />
            <span>Usar Asistente Rápido en Lote</span>
          </button>
        </div>

        {/* Opción 2: Individual Manual */}
        <div className="p-6 rounded-2xl bg-white border border-aurea-copper/30 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <h4 className="font-serif text-lg font-bold text-aurea-navy flex items-center gap-2">
              <Plus className="w-4 h-4 text-aurea-copper" />
              <span>Crear Mesas Individualmente</span>
            </h4>
            <p className="text-xs text-aurea-navy/70 leading-relaxed">
              Agrega cada mesa una a una especificando número exacto, capacidad y forma personalizada,
              eligiendo su posición en el mini-mapa espacial.
            </p>
          </div>

          <button
            onClick={onAbrirMesaIndividual}
            className="mt-5 w-full py-2.5 px-4 rounded-xl border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/20 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-aurea-copper" />
            <span>+ Agregar Mi Primera Mesa</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-aurea-navy/60 italic pt-2">
        No te preocupes: podrás modificar la capacidad, mover o reconfigurar cualquier mesa en
        cualquier momento.
      </p>
    </div>
  );
};
