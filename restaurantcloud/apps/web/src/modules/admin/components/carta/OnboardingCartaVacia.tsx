import React from 'react';
import { UtensilsCrossed, Plus, Sparkles } from 'lucide-react';

interface OnboardingCartaVaciaProps {
  onCrearPrimerPlato: () => void;
  onCargarSemillasAurea: () => void;
}

export const OnboardingCartaVacia: React.FC<OnboardingCartaVaciaProps> = ({
  onCrearPrimerPlato,
  onCargarSemillasAurea,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-aurea-champagne/40 p-8 lg:p-12 shadow-sm text-center max-w-3xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-aurea-champagne/30 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper mx-auto mb-4 shadow-sm">
        <UtensilsCrossed className="w-8 h-8" />
      </div>

      <h2 className="text-xl lg:text-2xl font-serif font-bold text-aurea-navy tracking-tight">
        Tu Carta Aún No Tiene Platos Registrados
      </h2>
      <p className="text-sm text-aurea-navy/70 mt-2 max-w-xl mx-auto">
        Para habilitar la venta en salón y la comanda móvil de mozos, registra tus platos vinculando su categoría obligatoria y los insumos de su receta culinaria.
      </p>

      {/* 3 Pasos del Onboarding */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 text-left">
        <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-champagne/40 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-aurea-copper/20 text-aurea-copper flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
            Categoría Obligatoria
          </h3>
          <p className="text-xs text-aurea-navy/60">
            Secciones como Entradas, Fondos o Bebidas configuradas en CU-ADMIN-02.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-champagne/40 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-aurea-copper/20 text-aurea-copper flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
            Insumos de Almacén
          </h3>
          <p className="text-xs text-aurea-navy/60">
            Ingredientes en kilos, sacos o botellas registrados en CU-ADMIN-03.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-champagne/40 space-y-2">
          <div className="w-7 h-7 rounded-lg bg-aurea-copper/20 text-aurea-copper flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
            Receta Dual y Margen
          </h3>
          <p className="text-xs text-aurea-navy/60">
            Dosifica por rinde o cantidad directa y obtén tu margen de ganancia en vivo.
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onCrearPrimerPlato}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear Mi Primer Plato</span>
        </button>

        <button
          type="button"
          onClick={onCargarSemillasAurea}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-aurea-champagne/80 hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-semibold transition-all min-h-[44px]"
        >
          <Sparkles className="w-4 h-4 text-aurea-copper" />
          <span>Cargar Carta Canónica Áurea</span>
        </button>
      </div>
    </div>
  );
};
