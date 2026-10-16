import React, { useState } from 'react';
import { PlanSaaSDTO } from '@/types/registroEmpresa';
import { Button } from '@/components/ui/Button';
import { formatPEN } from '@/shared/utils';
import { CheckCircle2, Sparkles, Building, Layers, Users, UtensilsCrossed, ArrowRight } from 'lucide-react';

interface Paso1PlanSelectorProps {
  planes: PlanSaaSDTO[];
  planSeleccionadoId: number;
  onSelectPlan: (planId: number) => void;
  onContinuar: () => void;
}

export const Paso1PlanSelector: React.FC<Paso1PlanSelectorProps> = ({
  planes,
  planSeleccionadoId,
  onSelectPlan,
  onContinuar,
}) => {
  const [esAnual, setEsAnual] = useState(false);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabecera de Paso */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
          Paso 1: Selección de Suscripción
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold">
          Elige el plan adecuado para tu restaurante
        </h2>
        <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 leading-relaxed">
          Comienza con el plan que mejor se adapte al tamaño de tu operación. Puedes cambiar de plan o cancelar en cualquier momento desde tu panel de propietario.
        </p>

        {/* Toggle Mensual / Anual */}
        <div className="pt-3 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-semibold ${
              !esAnual ? 'text-aurea-navy' : 'text-aurea-navy/50'
            }`}
          >
            Facturación Mensual
          </span>
          <button
            type="button"
            onClick={() => setEsAnual(!esAnual)}
            className="w-12 h-6 rounded-full bg-aurea-navy relative p-0.5 transition-colors focus:outline-none"
            aria-label="Alternar ciclo de facturación"
          >
            <div
              className={`w-5 h-5 rounded-full bg-aurea-champagne shadow-sm transition-transform duration-200 ${
                esAnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold flex items-center gap-1.5 ${
              esAnual ? 'text-aurea-navy' : 'text-aurea-navy/50'
            }`}
          >
            Facturación Anual
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Ahorra 2 meses
            </span>
          </span>
        </div>
      </div>

      {/* Grid de 3 Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        {planes.map((plan) => {
          const seleccionado = plan.id === planSeleccionadoId;
          const precio = esAnual ? plan.precio_anual / 12 : plan.precio_mensual;

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                seleccionado
                  ? 'bg-aurea-navy text-aurea-ivory border-2 border-aurea-copper shadow-2xl scale-[1.02] ring-4 ring-aurea-copper/20'
                  : 'bg-white text-aurea-navy border-2 border-aurea-copper/25 shadow-sm hover:shadow-lg hover:border-aurea-copper/60'
              }`}
            >
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-aurea-copper text-aurea-navy font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Más Elegido
                </div>
              )}

              <div className="space-y-5">
                {/* Nombre y descripción */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-serif text-xl sm:text-2xl font-bold ${
                        seleccionado ? 'text-aurea-champagne' : 'text-aurea-navy'
                      }`}
                    >
                      {plan.nombre}
                    </h3>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        seleccionado
                          ? 'border-aurea-copper bg-aurea-copper text-aurea-navy'
                          : 'border-aurea-copper/40 bg-transparent'
                      }`}
                    >
                      {seleccionado && <div className="w-2 h-2 rounded-full bg-aurea-navy" />}
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${
                      seleccionado ? 'text-white/75' : 'text-aurea-navy/70'
                    }`}
                  >
                    {plan.descripcion}
                  </p>
                </div>

                {/* Precio canónico */}
                <div className="pb-4 border-b border-aurea-copper/20">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold font-sans">
                      {formatPEN(precio)}
                    </span>
                    <span
                      className={`text-xs ${
                        seleccionado ? 'text-white/60' : 'text-aurea-navy/60'
                      }`}
                    >
                      / mes + IGV
                    </span>
                  </div>
                  {esAnual && (
                    <span className="text-[11px] text-emerald-400 font-medium block mt-1">
                      Cobrado anualmente ({formatPEN(plan.precio_anual)} / año)
                    </span>
                  )}
                </div>

                {/* Límites de capacidad oficial (02_schema_ddl.sql) */}
                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-2 font-mono ${
                    seleccionado ? 'bg-white/10' : 'bg-aurea-ivory'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <Building className="w-3.5 h-3.5" /> Locales:
                    </span>
                    <span className="font-bold">Hasta {plan.max_locales}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <Layers className="w-3.5 h-3.5" /> Pisos / Salones:
                    </span>
                    <span className="font-bold">Hasta {plan.max_pisos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <UtensilsCrossed className="w-3.5 h-3.5" /> Mesas totales:
                    </span>
                    <span className="font-bold">Hasta {plan.max_mesas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <Users className="w-3.5 h-3.5" /> Personal / Usuarios:
                    </span>
                    <span className="font-bold">Hasta {plan.max_usuarios}</span>
                  </div>
                </div>

                {/* Características oficiales */}
                <div className="space-y-2 pt-1 text-xs">
                  <span
                    className={`font-semibold uppercase tracking-wider text-[10px] block ${
                      seleccionado ? 'text-aurea-champagne' : 'text-aurea-copper'
                    }`}
                  >
                    Módulos y Beneficios:
                  </span>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          seleccionado ? 'text-aurea-copper' : 'text-emerald-600'
                        }`}
                      />
                      <span>Toma de comandas Mozo & Carta QR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          seleccionado ? 'text-aurea-copper' : 'text-emerald-600'
                        }`}
                      />
                      <span>KDS Cocina en vivo & Control de Stock</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          plan.incluye_reservas
                            ? seleccionado
                              ? 'text-aurea-copper'
                              : 'text-emerald-600'
                            : 'opacity-30'
                        }`}
                      />
                      <span className={!plan.incluye_reservas ? 'line-through opacity-40' : ''}>
                        Gestión de Reservas de Salón
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          plan.incluye_asistente_ia
                            ? seleccionado
                              ? 'text-aurea-copper'
                              : 'text-emerald-600'
                            : 'opacity-30'
                        }`}
                      />
                      <span className={!plan.incluye_asistente_ia ? 'line-through opacity-40' : ''}>
                        Suite de Asistente IA Predictivo
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Botón selector individual */}
              <div className="pt-6 mt-4 border-t border-aurea-copper/20">
                <Button
                  type="button"
                  variant={seleccionado ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(plan.id);
                  }}
                  className={`w-full font-semibold ${
                    seleccionado
                      ? 'bg-aurea-champagne text-aurea-navy hover:bg-white'
                      : 'border-aurea-navy/30 text-aurea-navy hover:bg-aurea-ivory'
                  }`}
                >
                  {seleccionado ? 'Plan Seleccionado ✓' : `Elegir ${plan.nombre}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón de Continuación a Paso 2 */}
      <div className="flex justify-center pt-4">
        <Button
          type="button"
          size="lg"
          onClick={onContinuar}
          className="bg-aurea-navy text-white hover:bg-aurea-navy/90 font-bold px-8 shadow-xl flex items-center gap-2"
        >
          <span>Continuar a Datos de Empresa</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
