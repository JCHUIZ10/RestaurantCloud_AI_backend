import React from 'react';
import { PlanSaaSDTO } from '@/types/registroEmpresa';
import { formatPEN } from '@/shared/utils';
import { FormularioTarjetaStripe } from '@/components/stripe/FormularioTarjetaStripe';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface StripeSetupRegistro {
  clientSecret: string;
  clavePublica: string;
}

interface Paso4PagoStripeProps {
  plan: PlanSaaSDTO;
  cicloFacturacion?: 'mensual' | 'anual';
  nombrePropietario: string;
  /** SetupIntent entregado por el backend al verificar el OTP; null si la sesión de pago expiró */
  stripeSetup: StripeSetupRegistro | null;
  onConfirmarPago: (paymentMethodId: string) => Promise<void>;
  onReiniciarRegistro: () => void;
  cargando: boolean;
  errorPago: string | null;
}

export const Paso4PagoStripe: React.FC<Paso4PagoStripeProps> = ({
  plan,
  cicloFacturacion = 'mensual',
  nombrePropietario,
  stripeSetup,
  onConfirmarPago,
  onReiniciarRegistro,
  cargando,
  errorPago,
}) => {
  const esAnual = cicloFacturacion === 'anual';
  const montoCobro = esAnual ? plan.precio_anual : plan.precio_mensual;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================
            COLUMNA IZQUIERDA (7 COLS): STRIPE ELEMENTS CHECKOUT
            ============================================================ */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-aurea-copper/25 shadow-sm space-y-6">
          <div className="border-b border-aurea-copper/20 pb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-aurea-copper">
              Paso 4: Checkout Bancario Seguro
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold mt-1">
              Método de Pago y Facturación
            </h2>
            <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 mt-1">
              Ingresa los datos de tu tarjeta para procesar la suscripción oficial a través de la pasarela segura Stripe.
            </p>
          </div>

          {/* Banner de Error si la tarjeta es declinada */}
          {errorPago && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold">Pago Rechazado por el Banco</p>
                <p className="mt-0.5">{errorPago}</p>
                <p className="mt-1 text-[11px] text-rose-700">
                  Tus datos de empresa están a salvo. Por favor verifica los datos o intenta con otra tarjeta.
                </p>
              </div>
            </div>
          )}

          {stripeSetup ? (
            <FormularioTarjetaStripe
              clientSecret={stripeSetup.clientSecret}
              clavePublica={stripeSetup.clavePublica}
              titularInicial={nombrePropietario}
              ocupado={cargando}
              onTarjetaConfirmada={onConfirmarPago}
              etiquetaBoton={
                <>
                  <ShieldCheck className="w-5 h-5 text-aurea-copper" />
                  <span>Pagar y activar empresa ({formatPEN(montoCobro)})</span>
                </>
              }
            />
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>La sesión de pago expiró o se perdió al recargar la página. Reinicia el registro para generar una nueva.</p>
                <button
                  type="button"
                  onClick={onReiniciarRegistro}
                  className="px-3 py-1.5 rounded-full bg-amber-200 hover:bg-amber-300 font-bold text-amber-950 transition-colors"
                >
                  Reiniciar registro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            COLUMNA DERECHA (5 COLS): RESUMEN DE COMPRA EXACTO POR PLAN
            ============================================================ */}
        <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="bg-aurea-navy text-aurea-ivory rounded-3xl p-6 sm:p-7 border border-aurea-copper/30 shadow-xl space-y-5">
            <div className="border-b border-aurea-copper/20 pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-aurea-champagne">
                Resumen de Compra
              </span>
              <h3 className="font-serif text-xl font-bold text-white mt-1">
                Suscripción {esAnual ? 'Anual' : 'Mensual'} SaaS
              </h3>
            </div>

            {/* Detalle del plan seleccionado */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="font-serif text-lg font-bold text-aurea-champagne">
                    {plan.nombre}
                  </span>
                  <span className="text-xs text-white/70 block mt-0.5">
                    {esAnual
                      ? plan.precio_mensual * 12 > plan.precio_anual
                        ? 'Ciclo de renovación anual (12 meses con tarifa reducida)'
                        : 'Ciclo de renovación anual (12 meses)'
                      : 'Ciclo de renovación mensual recurrente'}
                  </span>
                  {esAnual && (
                    <span className="text-[11px] text-aurea-champagne font-semibold block mt-1">
                      Equiv. {formatPEN(plan.precio_anual / 12)}/mes
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-sans">
                    {formatPEN(montoCobro)}
                  </span>
                  <span className="text-[10px] text-white/60 block">
                    {esAnual ? '/ año + IGV' : '/ mes + IGV'}
                  </span>
                </div>
              </div>

              {/* Inclusiones específicas del plan */}
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-aurea-copper block">
                  Incluye en este plan:
                </span>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                    <span>Hasta {plan.max_locales} local(es), con {plan.max_pisos} salón(es) cada uno</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                    <span>Hasta {plan.max_mesas} mesas y {plan.max_usuarios} personas por local</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                    <span>Mozo POS móvil y KDS Cocina en tiempo real</span>
                  </li>
                  {plan.incluye_reservas && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                      <span>Módulo de Reservas y Recepción de Salón</span>
                    </li>
                  )}
                  {plan.incluye_asistente_ia && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                      <span>Asistente IA para predicción de demanda</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Total a Pagar Hoy */}
              <div className="pt-4 border-t-2 border-aurea-copper/30 bg-white/5 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-aurea-champagne">
                    Total a Cobrar Hoy:
                  </span>
                  <span className="text-3xl font-extrabold text-white font-sans">
                    {formatPEN(montoCobro)}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 mt-1">
                  Monto final debitado en moneda nacional (PEN). Próxima renovación dentro de {esAnual ? '1 año' : '30 días'} calendario.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
