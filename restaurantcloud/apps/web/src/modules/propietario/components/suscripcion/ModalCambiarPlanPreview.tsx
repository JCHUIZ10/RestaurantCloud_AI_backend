import React from 'react';
import { PlanSuscripcionDTO } from '@/types/propietarioSuscripcion';
import { Button } from '@/components/ui/Button';
import {
  X,
  Sparkles,
  Check,
  Building2,
  Users,
  Grid,
  Info,
} from 'lucide-react';

interface ModalCambiarPlanPreviewProps {
  abierto: boolean;
  planActual: PlanSuscripcionDTO | null;
  onCerrar: () => void;
  onSolicitarCambio: (nombrePlan: string) => void;
}

export const ModalCambiarPlanPreview: React.FC<ModalCambiarPlanPreviewProps> = ({
  abierto,
  planActual,
  onCerrar,
  onSolicitarCambio,
}) => {
  if (!abierto) return null;

  const planes = [
    {
      id: 1,
      nombre: 'Starter',
      precio: 99.0,
      descripcion: 'Para restaurantes individuales y cafeterías en etapa inicial.',
      locales: '1 Sede física',
      mesas: 'Hasta 10 mesas',
      usuarios: 'Hasta 5 colaboradores',
      destacado: false,
      caracteristicas: [
        'Carta digital y menú QR',
        'Toma de comandas básica',
        'Boletas y facturas electrónicas SUNAT',
        'Soporte por correo en 24h',
      ],
    },
    {
      id: 2,
      nombre: 'Pro',
      precio: 249.0,
      descripcion: 'Para restaurantes consolidados y negocios multisede en crecimiento.',
      locales: 'Hasta 3 Locales',
      mesas: 'Hasta 30 mesas activas',
      usuarios: 'Hasta 15 colaboradores',
      destacado: true,
      caracteristicas: [
        'KDS de Cocina en tiempo real',
        'Asistente IA predictivo de demanda',
        'Gestión multi-local centralizada',
        'Stock rápido y recetas',
        'Soporte prioritario 24/7',
      ],
    },
    {
      id: 3,
      nombre: 'Enterprise',
      precio: 499.0,
      descripcion: 'Para franquicias y cadenas gastronómicas de alto volumen operativo.',
      locales: 'Locales ilimitados (hasta 10)',
      mesas: 'Hasta 100 mesas activas',
      usuarios: 'Hasta 50 colaboradores',
      destacado: false,
      caracteristicas: [
        'Múltiples centros de producción KDS',
        'IA generativa para menú & precios dinámicos',
        'API y Webhooks corporativos',
        'SLA 99.9% y backups dedicados',
        'Account Manager gastronómico exclusivo',
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cambiar-plan-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-aurea-navy/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-aurea-navy p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-aurea-champagne">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-cambiar-plan-titulo"
                className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white"
              >
                Planes Disponibles en RestaurantCloud AI
              </h2>
              <p className="text-xs text-slate-300">
                Ajusta tu capacidad según el crecimiento de tu negocio gastronómico
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar modal"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tarjetas comparativas de planes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {planes.map((p) => {
              const esPlanActual =
                planActual?.nombre.toLowerCase() === p.nombre.toLowerCase();

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    esPlanActual
                      ? 'border-2 border-aurea-navy bg-white shadow-lg ring-2 ring-aurea-navy/10'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-serif text-xl font-bold text-aurea-navy">
                        {p.nombre}
                      </h3>
                      {esPlanActual && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-aurea-navy text-white">
                          Plan Actual
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-extrabold text-aurea-navy font-sans">
                        S/ {p.precio.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium"> / mes</span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      {p.descripcion}
                    </p>

                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                        <span>{p.locales}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Grid className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                        <span>{p.mesas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                        <span>{p.usuarios}</span>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                      {p.caracteristicas.map((carac, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{carac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-3">
                    {esPlanActual ? (
                      <Button
                        type="button"
                        disabled
                        className="w-full bg-slate-100 text-slate-400 cursor-not-allowed text-xs font-bold py-2 shadow-none"
                      >
                        Plan en uso
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => onSolicitarCambio(p.nombre)}
                        className={`w-full text-xs font-bold py-2 shadow-sm ${
                          p.nombre === 'Enterprise'
                            ? 'bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy'
                            : 'bg-aurea-navy hover:bg-aurea-navy/90 text-white'
                        }`}
                      >
                        {p.precio > (planActual?.precio_mensual ?? 0)
                          ? `Mejorar a ${p.nombre}`
                          : `Cambiar a ${p.nombre}`}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicación de Prorrateo Stripe */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-aurea-navy shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-aurea-navy font-semibold block mb-0.5">
                Facturación Prorrateada Automática en Stripe (CU-PROP-03):
              </strong>
              Al cambiar de plan, Stripe calculará los días no disfrutados de tu ciclo actual y aplicará un crédito o débito proporcional de inmediato sin cobrar duplicado.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCerrar}
            className="text-xs font-semibold text-slate-600"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
