import React, { useState } from 'react';
import { PlanSaaSDTO } from '@/types/registroEmpresa';
import { formatPEN } from '@/shared/utils';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Paso4PagoStripeProps {
  plan: PlanSaaSDTO;
  cicloFacturacion?: 'mensual' | 'anual';
  nombrePropietario: string;
  onConfirmarPago: (paymentMethodId: string) => Promise<void>;
  cargando: boolean;
  errorPago: string | null;
}

export const Paso4PagoStripe: React.FC<Paso4PagoStripeProps> = ({
  plan,
  cicloFacturacion = 'mensual',
  nombrePropietario,
  onConfirmarPago,
  cargando,
  errorPago,
}) => {
  const esAnual = cicloFacturacion === 'anual';
  const montoCobro = esAnual ? plan.precio_anual : plan.precio_mensual;
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<'visa' | 'mastercard' | 'declinada'>('visa');
  const [numeroTarjeta, setNumeroTarjeta] = useState('4242 •••• •••• 4242');
  const [vencimiento, setVencimiento] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [titular, setTitular] = useState(nombrePropietario || 'Manuel García');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let stripePaymentMethodId = 'pm_card_visa';
    const cleanNumber = numeroTarjeta.replace(/\D/g, '');
    if (cleanNumber.startsWith('5555') || metodoPagoSeleccionado === 'mastercard') {
      stripePaymentMethodId = 'pm_card_mastercard';
    } else if (cleanNumber.startsWith('4000') || metodoPagoSeleccionado === 'declinada') {
      stripePaymentMethodId = 'pm_card_chargeCustomerFail';
    }
    onConfirmarPago(stripePaymentMethodId);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
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

          {/* Selector de Tarjetas Oficiales de Prueba Stripe */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Tarjetas Oficiales de Prueba Stripe:
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Stripe Test Mode Activo
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMetodoPagoSeleccionado('visa');
                  setNumeroTarjeta('4242 •••• •••• 4242');
                  setVencimiento('12/28');
                  setCvc('123');
                }}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  metodoPagoSeleccionado === 'visa'
                    ? 'border-aurea-navy bg-white shadow-sm ring-2 ring-aurea-copper/30 font-bold text-aurea-navy'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs font-bold text-emerald-700">✓ Visa Exitosa</span>
                <span className="text-[10px] text-slate-500 font-mono">4242 •••• 4242</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMetodoPagoSeleccionado('mastercard');
                  setNumeroTarjeta('5555 •••• •••• 4444');
                  setVencimiento('12/28');
                  setCvc('123');
                }}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  metodoPagoSeleccionado === 'mastercard'
                    ? 'border-aurea-navy bg-white shadow-sm ring-2 ring-aurea-copper/30 font-bold text-aurea-navy'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs font-bold text-blue-700">✓ Mastercard</span>
                <span className="text-[10px] text-slate-500 font-mono">5555 •••• 4444</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMetodoPagoSeleccionado('declinada');
                  setNumeroTarjeta('4000 •••• •••• 0002');
                  setVencimiento('12/28');
                  setCvc('123');
                }}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  metodoPagoSeleccionado === 'declinada'
                    ? 'border-rose-400 bg-rose-50 shadow-sm ring-2 ring-rose-200 font-bold text-rose-800'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs font-bold text-rose-600">✗ Declinada (402)</span>
                <span className="text-[10px] text-rose-500 font-mono">4000 •••• 0002</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Campo: Número de Tarjeta */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy mb-1 flex items-center justify-between">
                <span>Número de Tarjeta (Stripe Elements)</span>
                <div className="flex items-center gap-1.5 opacity-80">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">VISA</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">MC</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">AMEX</span>
                </div>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-aurea-navy/40">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={numeroTarjeta}
                  onChange={(e) => setNumeroTarjeta(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-mono focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Fila: Expiración y CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Mes / Año (MM / AA)
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={vencimiento}
                  onChange={(e) => setVencimiento(e.target.value)}
                  placeholder="12/28"
                  className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-aurea-navy mb-1">
                  Código de Seguridad (CVC)
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Titular */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy mb-1">
                Nombre del Titular de la Tarjeta
              </label>
              <input
                type="text"
                required
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Como figura en la tarjeta"
                className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all"
              />
            </div>

            {/* Aviso de seguridad Stripe */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-slate-900">Transacción Segura de Nivel Bancario: </span>
                Cifrado TLS de 256 bits directo con Stripe Payments. RestaurantCloud no almacena números de tarjeta ni códigos CVC en sus servidores.
              </div>
            </div>

            {/* Botón de Pago con Cobro Exacto */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-aurea-navy hover:bg-[#12345e] text-white font-semibold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {cargando ? (
                  <span>Confirmando cobro con Stripe...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-aurea-copper" />
                    <span>Pagar y activar empresa ({formatPEN(montoCobro)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
                    <span>Hasta {plan.max_locales} local(es) y {plan.max_pisos} salón(es)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                    <span>Hasta {plan.max_mesas} mesas y {plan.max_usuarios} usuarios</span>
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
    </form>
  );
};
