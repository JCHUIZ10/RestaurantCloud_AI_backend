import React from 'react';
import { Banknote, CreditCard, Smartphone, ArrowRight, Sliders, type LucideIcon } from 'lucide-react';

interface OnboardingMetodosPagoViewProps {
  onAprovisionarEstandar: () => void;
  onIniciarManual: () => void;
  isLoading?: boolean;
}

const PAQUETE: Array<{ icono: LucideIcon; titulo: string; texto: string; caja: string; icon: string; pie: string }> = [
  {
    icono: Banknote,
    titulo: 'Efectivo',
    texto: 'Siempre activo y sin recargo.',
    caja: 'bg-emerald-50/60 border-emerald-200',
    icon: 'bg-emerald-600',
    pie: 'border-emerald-200/60 text-emerald-700',
  },
  {
    icono: CreditCard,
    titulo: 'Tarjeta (POS)',
    texto: 'Visa, Mastercard y Amex; el recargo lo decides tú.',
    caja: 'bg-blue-50/60 border-blue-200',
    icon: 'bg-blue-600',
    pie: 'border-blue-200/60 text-blue-700',
  },
  {
    icono: Smartphone,
    titulo: 'Yape / Plin',
    texto: 'QR y celular del local en la precuenta.',
    caja: 'bg-purple-50/60 border-purple-200',
    icon: 'bg-purple-600',
    pie: 'border-purple-200/60 text-purple-700',
  },
];

export const OnboardingMetodosPagoView: React.FC<OnboardingMetodosPagoViewProps> = ({
  onAprovisionarEstandar,
  onIniciarManual,
  isLoading = false,
}) => (
  <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-md border border-tinta-200 text-center">
    <div className="max-w-3xl mx-auto">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy">Elige cómo te pagarán</h2>
      <p className="mt-2 text-sm text-tinta-600">
        Empieza con el paquete básico, sin recargos al cliente. Podrás cambiarlo cuando quieras.
      </p>

      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {PAQUETE.map(({ icono: Icono, titulo, texto, caja, icon, pie }) => (
          <li key={titulo} className={`p-4 rounded-2xl border flex flex-col justify-between ${caja}`}>
            <div>
              <span className={`w-9 h-9 rounded-xl text-white flex items-center justify-center mb-3 shadow-sm ${icon}`} aria-hidden="true">
                <Icono className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-sm text-tinta-900">{titulo}</h3>
              <p className="text-xs text-tinta-600 mt-1">{texto}</p>
            </div>
            <p className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold ${pie}`}>
              <span>Recargo</span>
              <span>0.00%</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onAprovisionarEstandar}
          disabled={isLoading}
          className="w-full sm:w-auto min-h-tactil px-7 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          Usar el paquete básico
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onIniciarManual}
          disabled={isLoading}
          className="w-full sm:w-auto min-h-tactil px-5 rounded-xl text-sm font-semibold text-tinta-700 border border-tinta-200 hover:bg-tinta-100 transition-colors flex items-center justify-center gap-2"
        >
          <Sliders className="w-4 h-4 text-tinta-400" aria-hidden="true" />
          Configurar a mano
        </button>
      </div>
    </div>
  </div>
);
