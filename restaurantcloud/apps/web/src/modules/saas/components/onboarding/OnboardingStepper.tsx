import React from 'react';
import { Building2, User, CreditCard, ShieldCheck, Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PASOS_ONBOARDING: StepItem[] = [
  { id: 1, label: 'Empresa & RUC', sublabel: 'Validación Módulo 11', icon: Building2 },
  { id: 2, label: 'Titular Propietario', sublabel: 'Contacto & Claves', icon: User },
  { id: 3, label: 'Plan SaaS', sublabel: 'Términos & Vigencia', icon: CreditCard },
  { id: 4, label: 'Pago Verificado', sublabel: 'Asentamiento en BD', icon: ShieldCheck },
];

interface OnboardingStepperProps {
  pasoActual: number;
  pasoMaximo: number;
  onSelectPaso: (paso: number) => void;
}

export const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  pasoActual,
  pasoMaximo,
  onSelectPaso,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-aurea-copper/25 p-4 sm:p-5 shadow-sm">
      {/* Vista Desktop / Tablet: Stepper Horizontal */}
      <div className="hidden sm:flex items-center justify-between relative">
        {PASOS_ONBOARDING.map((paso, index) => {
          const Icon = paso.icon;
          const esActivo = pasoActual === paso.id;
          const esCompletado = pasoActual > paso.id || pasoMaximo > paso.id;
          const esClickable = paso.id <= pasoMaximo;

          return (
            <React.Fragment key={paso.id}>
              {/* Nodo del paso */}
              <button
                type="button"
                disabled={!esClickable}
                onClick={() => esClickable && onSelectPaso(paso.id)}
                className={`flex items-center gap-3 text-left transition-all group ${
                  esClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                    esCompletado && !esActivo
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : esActivo
                      ? 'bg-aurea-navy text-aurea-champagne border-aurea-copper/50 shadow-md ring-4 ring-aurea-copper/20'
                      : 'bg-aurea-ivory text-aurea-navy/60 border-aurea-copper/30'
                  }`}
                >
                  {esCompletado && !esActivo ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      esActivo
                        ? 'text-aurea-navy font-serif text-sm'
                        : esCompletado
                        ? 'text-emerald-800'
                        : 'text-aurea-navy/60'
                    }`}
                  >
                    {paso.id}. {paso.label}
                  </div>
                  <div className="text-[10px] text-aurea-navy/50 font-sans truncate">
                    {paso.sublabel}
                  </div>
                </div>
              </button>

              {/* Línea conectora */}
              {index < PASOS_ONBOARDING.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-aurea-copper/20 relative">
                  <div
                    className="absolute inset-0 bg-emerald-600 transition-all duration-300"
                    style={{
                      width: pasoActual > paso.id ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Vista Mobile: Barra de progreso compacta */}
      <div className="block sm:hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-aurea-navy">
          <span>
            Paso {pasoActual} de 4: {PASOS_ONBOARDING[pasoActual - 1]?.label}
          </span>
          <span className="font-mono text-aurea-copper font-bold">
            {Math.round((pasoActual / 4) * 100)}%
          </span>
        </div>
        <div className="w-full bg-aurea-copper/20 h-2 rounded-full overflow-hidden">
          <div
            className="bg-aurea-navy h-2 rounded-full transition-all duration-300"
            style={{ width: `${(pasoActual / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
