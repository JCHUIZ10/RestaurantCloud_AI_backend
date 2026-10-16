import React, { useState } from 'react';
import { IniciarRegistroRequestDTO } from '@/types/registroEmpresa';
import { Sparkles, ChevronDown, ChevronUp, Check, AlertCircle, CreditCard } from 'lucide-react';

interface DemoRegistroWidgetProps {
  pasoActual: number;
  onSetPaso: (paso: number) => void;
  onSelectPlan: (planId: number) => void;
  planIdActual: number;
  onAutoLlenarForm: (data: Partial<IniciarRegistroRequestDTO>) => void;
  onSimularRucDuplicado: () => void;
  onAutoLlenarOtp: () => void;
  onSimularErrorPago: () => void;
}

export const DemoRegistroWidget: React.FC<DemoRegistroWidgetProps> = ({
  pasoActual,
  onSetPaso,
  onSelectPlan,
  planIdActual,
  onAutoLlenarForm,
  onSimularRucDuplicado,
  onAutoLlenarOtp,
  onSimularErrorPago,
}) => {
  const [colapsado, setColapsado] = useState(false);

  return (
    <aside
      aria-label="Controles de demostración interactiva"
      className="fixed bottom-4 right-4 z-50 max-w-xs sm:max-w-sm w-full font-sans transition-all"
    >
      <div className="bg-aurea-navy text-aurea-ivory rounded-3xl border-2 border-aurea-copper shadow-2xl overflow-hidden">
        {/* Cabecera del Widget */}
        <div
          onClick={() => setColapsado(!colapsado)}
          className="px-4 py-2.5 bg-gradient-to-r from-aurea-navy to-[#15345b] flex items-center justify-between cursor-pointer border-b border-aurea-copper/20 select-none"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-xs text-aurea-champagne flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
              Demo CU-PROP-01 (Registro)
            </span>
          </div>

          <button
            type="button"
            className="text-white/60 hover:text-white p-1"
            aria-label={colapsado ? 'Expandir panel demo' : 'Colapsar panel demo'}
          >
            {colapsado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Contenido expandido */}
        {!colapsado && (
          <div className="p-4 space-y-3.5 text-xs">
            {/* 1. Selector Rápido de Plan */}
            <div>
              <span className="text-[10px] uppercase font-bold text-aurea-copper tracking-wider block mb-1">
                1. Alternar Plan (Cobro Dinámico):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 1, label: 'Starter S/ 99' },
                  { id: 2, label: 'Pro S/ 249' },
                  { id: 3, label: 'Enterprise S/ 499' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPlan(p.id)}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      planIdActual === p.id
                        ? 'bg-aurea-copper text-aurea-navy border-aurea-copper shadow-sm'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Saltos de Paso */}
            <div>
              <span className="text-[10px] uppercase font-bold text-aurea-copper tracking-wider block mb-1">
                2. Navegación Rápida de Pasos:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((paso) => (
                  <button
                    key={paso}
                    type="button"
                    onClick={() => onSetPaso(paso)}
                    className={`flex-1 py-1 rounded-lg text-center font-bold text-[11px] border transition-all ${
                      pasoActual === paso
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                    }`}
                  >
                    P{paso}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Atajos de Prueba */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-aurea-copper tracking-wider block">
                3. Autollenar Escenarios de Prueba:
              </span>

              <button
                type="button"
                onClick={() =>
                  onAutoLlenarForm({
                    tipo_contribuyente: 'RUC_20',
                    ruc: '20601234567',
                    razon_social: 'El Tenedor Gourmet S.A.C.',
                    telefono: '+51 987 654 321',
                    nombre_propietario: 'Manuel García Pardo',
                    correo: 'manuel.garcia@gmail.com',
                    password: 'PasswordPropietario2026!',
                  })
                }
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-medium flex items-center justify-between"
              >
                <span>RUC 20 Jurídica (El Tenedor)</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onAutoLlenarForm({
                    tipo_contribuyente: 'RUC_10',
                    ruc: '10456789012',
                    razon_social: 'Don Manuel Pollería & Parrillas',
                    telefono: '+51 912 345 678',
                    nombre_propietario: 'Manuel Antonio Quispe',
                    correo: 'donmanuel.polleria@gmail.com',
                    password: 'PasswordDonManuel2026!',
                  })
                }
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-medium flex items-center justify-between"
              >
                <span>RUC 10 Natural con Negocio</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={onSimularRucDuplicado}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-[11px] font-medium flex items-center justify-between"
              >
                <span>Simular RUC Duplicado (409)</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              </button>

              {pasoActual === 3 && (
                <button
                  type="button"
                  onClick={onAutoLlenarOtp}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium flex items-center justify-between"
                >
                  <span>Pegar OTP Válido (529148)</span>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              {pasoActual === 4 && (
                <button
                  type="button"
                  onClick={onSimularErrorPago}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-[11px] font-medium flex items-center justify-between"
                >
                  <span>Simular Tarjeta Declinada (402)</span>
                  <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
