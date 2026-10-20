import React, { useState } from 'react';
import { IniciarRegistroRequestDTO } from '@/types/registroEmpresa';
import { Sparkles, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface DemoRegistroWidgetProps {
  onAutoLlenarForm: (data: Partial<IniciarRegistroRequestDTO>) => void;
}

export const DemoRegistroWidget: React.FC<DemoRegistroWidgetProps> = ({
  onAutoLlenarForm,
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
            {/* 1. Atajos de Prueba */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-aurea-copper tracking-wider block">
                Autollenar Escenarios de Prueba:
              </span>

              <button
                type="button"
                onClick={() =>
                  onAutoLlenarForm({
                    tipo_contribuyente: 'RUC_20',
                    ruc: '20601234565',
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
                    ruc: '10456789019',
                    razon_social: 'Don Manuel Pollería & Parrillas',
                    telefono: '+51 912 345 678',
                    nombre_propietario: 'Manuel Antonio Quispe',
                    correo: 'donmanuel.polleria@gmail.com',
                    password: 'PasswordPropietario2026!',
                  })
                }
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-medium flex items-center justify-between"
              >
                <span>RUC 10 Natural con Negocio</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
