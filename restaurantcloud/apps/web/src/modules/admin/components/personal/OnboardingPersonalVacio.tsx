import React from 'react';
import {
  Users,
  UtensilsCrossed,
  ChefHat,
  Banknote,
  Plus,
  RotateCcw,
} from 'lucide-react';

interface OnboardingPersonalVacioProps {
  onRegistrarPrimero: () => void;
  onRestablecerSemillas: () => void;
}

export const OnboardingPersonalVacio: React.FC<OnboardingPersonalVacioProps> = ({
  onRegistrarPrimero,
  onRestablecerSemillas,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-aurea-champagne/80 p-8 sm:p-12 text-center shadow-sm max-w-3xl mx-auto space-y-6">
      {/* Icono central */}
      <div className="w-16 h-16 rounded-2xl bg-aurea-champagne/40 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper mx-auto shadow-sm">
        <Users className="w-8 h-8" />
      </div>

      {/* Títulos */}
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-aurea-navy">
          Construye tu Equipo Operativo de Sede
        </h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Registra a los colaboradores que operarán los 3 frentes de RestaurantCloud AI. Cada usuario activo consume 1 cupo de tu Plan Pro contratado.
        </p>
      </div>

      {/* 3 Frentes explicativos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-1">
            <UtensilsCrossed className="w-4 h-4 text-blue-600" />
            <span>1. Salón (Mozos)</span>
          </div>
          <p className="text-xs text-blue-950/70">
            Toma de pedidos en mesas y comandas móviles desde tablets o celulares.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
            <ChefHat className="w-4 h-4 text-amber-600" />
            <span>2. Cocina (KDS)</span>
          </div>
          <p className="text-xs text-amber-950/70">
            Visualización de comandas en tiempo real, control de tiempos y despacho.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>3. Caja (Cajeros)</span>
          </div>
          <p className="text-xs text-emerald-950/70">
            Apertura de turno, cobro de cuentas y emisión de comprobantes de pago.
          </p>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRegistrarPrimero}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Primer Colaborador</span>
        </button>

        <button
          onClick={onRestablecerSemillas}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>Cargar Equipo Demostrativo (Áurea)</span>
        </button>
      </div>
    </div>
  );
};
