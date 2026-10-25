import React from 'react';
import { UtensilsCrossed, Plus, Sparkles, FolderTree, Package, TrendingUp, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui';

interface OnboardingCartaVaciaProps {
  onCrearPrimerPlato: () => void;
  onCargarSemillasAurea: () => void;
  habilitarReceta?: boolean;
}

const PASOS: Array<{ icono: LucideIcon; titulo: string; texto: string }> = [
  { icono: FolderTree, titulo: 'Categoría', texto: 'Cada plato va en una sección: Entradas, Fondos, Bebidas…' },
  { icono: Package, titulo: 'Insumos', texto: 'Vincula los ingredientes de bodega que consume cada ración.' },
  { icono: TrendingUp, titulo: 'Margen', texto: 'Con precio y receta ves la ganancia de cada plato al instante.' },
];

export const OnboardingCartaVacia: React.FC<OnboardingCartaVaciaProps> = ({
  onCrearPrimerPlato,
  onCargarSemillasAurea,
  habilitarReceta = true,
}) => {
  const pasos = habilitarReceta ? PASOS : PASOS.slice(0, 1);

  return (
    <div className="bg-white rounded-2xl border border-aurea-copper/30 border-t-4 border-t-aurea-copper shadow-md p-6 sm:p-10 text-center space-y-8">
      <div className="space-y-2">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-aurea-navy text-aurea-champagne ring-1 ring-aurea-copper/40 flex items-center justify-center">
          <UtensilsCrossed className="w-7 h-7" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-2xl font-bold text-aurea-navy">Tu carta aún no tiene platos</h2>
        <p className="text-sm text-aurea-navy/70 max-w-xl mx-auto">
          Registra tus platos para venderlos en salón y en la comanda de los mozos.
        </p>
      </div>

      <ol className={`grid grid-cols-1 ${pasos.length > 1 ? 'sm:grid-cols-3' : ''} gap-4 max-w-3xl mx-auto text-left`}>
        {pasos.map(({ icono: Icono, titulo, texto }, i) => (
          <li key={titulo} className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne space-y-2">
            <span className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-aurea-copper text-aurea-navy font-serif font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <Icono className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
              <span className="font-semibold text-aurea-navy">{titulo}</span>
            </span>
            <p className="text-sm text-aurea-navy/70">{texto}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={onCrearPrimerPlato}
          leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
        >
          Crear mi primer plato
        </Button>
        {habilitarReceta && (
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCargarSemillasAurea}
            leftIcon={<Sparkles className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
          >
            Cargar carta de ejemplo
          </Button>
        )}
      </div>
    </div>
  );
};
