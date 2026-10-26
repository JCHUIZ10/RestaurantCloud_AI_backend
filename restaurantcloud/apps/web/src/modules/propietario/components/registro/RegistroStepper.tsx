import React from 'react';
import { Check, ShieldCheck, Mail, CreditCard, Building2, Layers } from 'lucide-react';

interface RegistroStepperProps {
  pasoActual: number; // 1: Plan, 2: Datos, 3: OTP, 4: Pago, 5: Exito
  onSelectPaso?: (paso: number) => void;
  pasoMaximoAlcanzado: number;
}

const PASOS = [
  { id: 1, titulo: 'Plan SaaS', icono: Layers, descripcion: 'Selección de plan' },
  { id: 2, titulo: 'Datos de Empresa', icono: Building2, descripcion: 'RUC y propietario' },
  { id: 3, titulo: 'Verificar Correo', icono: Mail, descripcion: 'Código OTP' },
  { id: 4, titulo: 'Pago Seguro', icono: CreditCard, descripcion: 'Suscripción Stripe' },
  { id: 5, titulo: 'Activación', icono: ShieldCheck, descripcion: 'Restaurante activo' },
];

export const RegistroStepper: React.FC<RegistroStepperProps> = ({
  pasoActual,
  onSelectPaso,
  pasoMaximoAlcanzado,
}) => {
  return (
    <div className="w-full bg-[#FFF9F0]/90 backdrop-blur-md border-b border-aurea-copper/25 py-3.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Vista Mobile: Barra de progreso compacta */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between text-xs font-sans text-aurea-navy mb-2">
            <span className="font-semibold uppercase tracking-wider text-aurea-copper">
              Paso {pasoActual} de 5
            </span>
            <span className="font-bold text-aurea-navy">
              {PASOS[pasoActual - 1]?.titulo}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-aurea-ivory border border-aurea-copper/20 overflow-hidden">
            <div
              className="h-full bg-aurea-copper transition-all duration-300 rounded-full"
              style={{ width: `${(pasoActual / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Vista Tablet / Desktop: Tren de pasos horizontales */}
        <div className="hidden md:flex items-center justify-between relative">
          {PASOS.map((paso, idx) => {
            const completado = pasoActual > paso.id;
            const activo = pasoActual === paso.id;
            const alcanzable = paso.id <= pasoMaximoAlcanzado && onSelectPaso;
            const Icon = paso.icono;

            return (
              <React.Fragment key={paso.id}>
                {/* Conector lineal entre pasos */}
                {idx > 0 && (
                  <div className="flex-1 h-0.5 mx-2 bg-aurea-copper/20 relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-aurea-copper transition-all duration-300"
                      style={{
                        width: pasoActual >= paso.id ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}

                {/* Nodo de paso */}
                <button
                  type="button"
                  disabled={!alcanzable}
                  onClick={() => alcanzable && onSelectPaso(paso.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full transition-all duration-200 text-left ${
                    alcanzable ? 'cursor-pointer hover:bg-aurea-champagne/20' : 'cursor-default'
                  } ${activo ? 'bg-aurea-navy text-white shadow-sm' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      completado
                        ? 'bg-aurea-navy text-aurea-champagne border border-aurea-copper/40'
                        : activo
                        ? 'bg-aurea-copper text-aurea-navy shadow-sm'
                        : 'bg-aurea-ivory text-aurea-navy/60 border border-aurea-copper/30'
                    }`}
                  >
                    {completado ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        activo ? 'text-white' : completado ? 'text-aurea-navy font-semibold' : 'text-aurea-navy/60'
                      }`}
                    >
                      {paso.id}. {paso.titulo}
                    </span>
                    <span
                      className={`text-[10px] hidden lg:block ${
                        activo ? 'text-white/70' : 'text-aurea-navy/50'
                      }`}
                    >
                      {paso.descripcion}
                    </span>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
