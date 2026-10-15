import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Banknote,
  CreditCard,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Sliders,
} from 'lucide-react';

interface OnboardingMetodosPagoViewProps {
  onAprovisionarEstandar: () => void;
  onIniciarManual: () => void;
  isLoading?: boolean;
}

export const OnboardingMetodosPagoView: React.FC<OnboardingMetodosPagoViewProps> = ({
  onAprovisionarEstandar,
  onIniciarManual,
  isLoading = false,
}) => {
  return (
    <div className="max-w-[920px] mx-auto py-8 px-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Sede Nueva • Primer Despliegue</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Aprovisiona los Métodos de Pago de tu Sede
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Para habilitar el punto de venta de caja, los pedidos en salón y las precuentas de los
            mozos, RestaurantCloud aprovisiona un paquete base de métodos de pago cumpliendo la normativa
            SUNAT y libre de recargos al cliente.
          </p>

          {/* Preset Cards Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {/* Efectivo */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm">
                  <Banknote className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Efectivo Físico</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Moneda nacional de curso legal. Siempre activo sin recargo adicional.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>Comisión</span>
                <span>0.00%</span>
              </div>
            </div>

            {/* Tarjeta POS */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">POS Tarjetas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Visa, Mastercard, Amex. Configurable con o sin traslado de comisión.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
                <span>Comisión Base</span>
                <span>0.00%</span>
              </div>
            </div>

            {/* Yape / Plin */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Yape / Plin</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Billetera digital instantánea con visualización de QR y celular de recepción.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
                <span>Comisión Base</span>
                <span>0.00%</span>
              </div>
            </div>
          </div>

          {/* Guarantees */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Cumplimiento tributario SUNAT
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Sincronización en vivo con Mozo y Caja
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onAprovisionarEstandar}
              disabled={isLoading}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>Aceptar y Aprovisionar Configuración Estándar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onIniciarManual}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Personalizar Métodos Manualmente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
