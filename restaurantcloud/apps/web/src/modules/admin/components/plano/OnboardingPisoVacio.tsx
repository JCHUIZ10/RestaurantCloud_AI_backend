import React from 'react';
import { Sparkles, Plus, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui';

interface OnboardingPisoVacioProps {
  pisoNombre: string;
  onAbrirAsistenteLote: () => void;
  onAbrirMesaIndividual: () => void;
}

/** Cuerpo de la tarjeta del plano cuando el ambiente aún no tiene mesas. */
export const OnboardingPisoVacio: React.FC<OnboardingPisoVacioProps> = ({
  pisoNombre,
  onAbrirAsistenteLote,
  onAbrirMesaIndividual,
}) => (
  <div className="mx-3 sm:mx-5 mb-3 sm:mb-5 p-6 sm:p-10 rounded-xl border border-aurea-champagne bg-aurea-ivory bg-[radial-gradient(#F4D7B0_1px,transparent_1px)] [background-size:18px_18px] text-center space-y-6">
    <div className="space-y-2">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-aurea-navy text-aurea-champagne ring-1 ring-aurea-copper/40 flex items-center justify-center">
        <LayoutGrid className="w-7 h-7" aria-hidden="true" />
      </span>
      <h2 className="font-serif text-2xl font-bold text-aurea-navy">{pisoNombre} aún no tiene mesas</h2>
      <p className="text-sm text-aurea-navy/70 max-w-lg mx-auto">
        Elige cómo empezar. Después podrás mover o cambiar cualquier mesa.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
      <div className="relative p-5 rounded-2xl bg-white border-2 border-aurea-copper/60 shadow-sm flex flex-col gap-4">
        <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-xs font-bold bg-aurea-copper text-aurea-navy">
          Recomendado
        </span>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-aurea-navy flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            Generar en lote
          </h3>
          <p className="text-sm text-aurea-navy/70">
            Crea varias mesas numeradas de una vez, ordenadas en filas y columnas.
          </p>
        </div>
        <Button
          className="mt-auto w-full"
          onClick={onAbrirAsistenteLote}
          leftIcon={<Sparkles className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
        >
          Usar el asistente
        </Button>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-aurea-champagne/70 shadow-sm flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-aurea-navy flex items-center gap-2">
            <Plus className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            Una por una
          </h3>
          <p className="text-sm text-aurea-navy/70">
            Define número, capacidad, forma y la casilla exacta de cada mesa.
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-auto w-full"
          onClick={onAbrirMesaIndividual}
          leftIcon={<Plus className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
        >
          Agregar primera mesa
        </Button>
      </div>
    </div>
  </div>
);
