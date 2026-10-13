import React from 'react';
import { UtensilsCrossed, Plus, BookOpen, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';

interface OnboardingCategoriasVaciaProps {
  onCrearPrimeraCategoria: () => void;
  onExplorarPlantillas: () => void;
}

export const OnboardingCategoriasVacia: React.FC<OnboardingCategoriasVaciaProps> = ({
  onCrearPrimeraCategoria,
  onExplorarPlantillas,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-aurea-champagne/50 shadow-sm p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Icono Principal */}
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-3xl bg-aurea-champagne/30 text-aurea-navy flex items-center justify-center mx-auto shadow-inner border border-aurea-copper/20">
          <UtensilsCrossed className="w-10 h-10 text-aurea-copper" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-aurea-navy text-aurea-champagne flex items-center justify-center shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Titulares */}
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-aurea-navy">
          Estructura las Categorías de tu Carta
        </h2>
        <p className="text-sm sm:text-base text-aurea-navy/70 max-w-xl mx-auto leading-relaxed">
          Las categorías son las columnas vertebrales de tu restaurante: agrupan tus platos, ordenan el menú en los códigos QR y definen las pestañas que tus mozos utilizarán al tomar comandas.
        </p>
      </div>

      {/* Beneficios Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left">
        <div className="p-3.5 rounded-2xl bg-aurea-ivory/60 border border-aurea-champagne/40 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-aurea-navy">
            <Smartphone className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Comanda Móvil</span>
          </div>
          <p className="text-xs text-aurea-navy/60">
            Los mozos verán las pestañas en el orden exacto que decidas aquí.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-aurea-ivory/60 border border-aurea-champagne/40 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-aurea-navy">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Carta QR en Salón</span>
          </div>
          <p className="text-xs text-aurea-navy/60">
            Controla qué secciones ven los comensales en sus teléfonos.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-aurea-ivory/60 border border-aurea-champagne/40 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-aurea-navy">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cero Fugas</span>
          </div>
          <p className="text-xs text-aurea-navy/60">
            Protección estricta para evitar platos huérfanos sin categoría.
          </p>
        </div>
      </div>

      {/* Acciones de Inicio */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCrearPrimeraCategoria}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg min-h-[48px]"
        >
          <Plus className="w-4 h-4 text-aurea-champagne" />
          <span>Crear Primera Categoría</span>
        </button>

        <button
          type="button"
          onClick={onExplorarPlantillas}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-aurea-copper/40 bg-white hover:bg-aurea-champagne/20 text-aurea-navy font-semibold text-sm transition-colors min-h-[48px]"
        >
          <BookOpen className="w-4 h-4 text-aurea-copper" />
          <span>Usar Plantilla Peruana (Pollería, Chifa...)</span>
        </button>
      </div>
    </div>
  );
};
