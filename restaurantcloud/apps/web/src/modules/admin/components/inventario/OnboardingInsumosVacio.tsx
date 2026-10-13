import React from 'react';
import {
  Boxes,
  Zap,
  PackageCheck,
  ShieldAlert,
  Plus,
} from 'lucide-react';

interface OnboardingInsumosVacioProps {
  onAbrirNuevoInsumo: () => void;
}

export const OnboardingInsumosVacio: React.FC<OnboardingInsumosVacioProps> = ({
  onAbrirNuevoInsumo,
}) => {
  return (
    <div className="bg-white border border-aurea-champagne/60 rounded-3xl p-8 sm:p-12 text-center shadow-sm max-w-3xl mx-auto my-6">
      {/* Icono de Despensa en Blanco */}
      <div className="w-16 h-16 rounded-2xl bg-aurea-champagne/30 text-aurea-copper flex items-center justify-center mx-auto mb-4 border border-aurea-copper/20 shadow-inner">
        <Boxes className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-serif font-bold text-aurea-navy tracking-tight">
        Tu Despensa de Insumos está Vacía
      </h2>
      <p className="text-sm text-aurea-navy/70 mt-2 max-w-xl mx-auto leading-relaxed">
        Esta sede fue iniciada con plantilla en blanco. Registra tus primeros insumos clave para vincularlos a las recetas de los platos y activar el control de stock en tiempo real.
      </p>

      {/* 3 Pilares de Valor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-8 text-left">
        <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-copper/20">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Alta Ágil &lt; 8s
          </h4>
          <p className="text-xs text-aurea-navy/65 mt-1 leading-normal">
            Sin formularios engorrosos ni categorías rígidas forzadas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-copper/20">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2.5">
            <PackageCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            10 Unidades
          </h4>
          <p className="text-xs text-aurea-navy/65 mt-1 leading-normal">
            Catálogo cerrado estándar: kilos, litros, unidades y 7 empaques comerciales.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-copper/20">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
            Protección Total
          </h4>
          <p className="text-xs text-aurea-navy/65 mt-1 leading-normal">
            El stock en 0 bloquea automáticamente platos en salón y notifica a cocina.
          </p>
        </div>
      </div>

      {/* Botón Principal */}
      <button
        type="button"
        onClick={onAbrirNuevoInsumo}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 min-h-[48px]"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Registrar Mi Primer Insumo</span>
      </button>
    </div>
  );
};
