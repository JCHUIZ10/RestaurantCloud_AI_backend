import React, { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe, type StripeCardElementOptions } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertCircle, Lock } from 'lucide-react';

// Una sola promesa por clave pública: evita recargar Stripe.js al reabrir el formulario
const stripePorClave = new Map<string, Promise<Stripe | null>>();

function cargarStripe(clavePublica: string): Promise<Stripe | null> {
  let promesa = stripePorClave.get(clavePublica);
  if (!promesa) {
    promesa = loadStripe(clavePublica, { locale: 'es' });
    stripePorClave.set(clavePublica, promesa);
  }
  return promesa;
}

const OPCIONES_TARJETA: StripeCardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '15px',
      color: '#0B2340',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#be123c' },
  },
};

export interface FormularioTarjetaStripeProps {
  /** client_secret del SetupIntent creado por el backend */
  clientSecret: string;
  /** Clave publicable entregada por el backend junto al SetupIntent */
  clavePublica: string;
  titularInicial?: string;
  /** Contenido del botón principal cuando no se está procesando */
  etiquetaBoton: React.ReactNode;
  /** Mensaje del botón mientras se valida la tarjeta con el banco */
  etiquetaProcesando?: string;
  /** Proceso externo en curso (p. ej. el cobro posterior a guardar la tarjeta) */
  ocupado?: boolean;
  /** Error ya producido fuera del formulario (cobro rechazado, etc.) */
  errorExterno?: string | null;
  /** Se invoca con el `pm_...` una vez que Stripe confirmó la tarjeta */
  onTarjetaConfirmada: (paymentMethodId: string) => Promise<void>;
  /** Avisa cuando el formulario empieza o termina de procesar (para bloquear el cierre de un modal) */
  onProcesandoChange?: (procesando: boolean) => void;
  /** Acción secundaria opcional junto al botón principal (p. ej. Cancelar) */
  accionSecundaria?: React.ReactNode;
}

const CuerpoFormulario: React.FC<FormularioTarjetaStripeProps> = ({
  clientSecret,
  titularInicial = '',
  etiquetaBoton,
  etiquetaProcesando = 'Validando con tu banco...',
  ocupado = false,
  errorExterno,
  onTarjetaConfirmada,
  accionSecundaria,
  onProcesandoChange,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [titular, setTitular] = useState(titularInicial);
  const [tarjetaCompleta, setTarjetaCompleta] = useState(false);
  const [fase, setFase] = useState<'libre' | 'validando' | 'cobrando'>('libre');
  const [error, setError] = useState<string | null>(null);

  const procesando = fase !== 'libre';

  useEffect(() => {
    onProcesandoChange?.(procesando);
  }, [procesando, onProcesandoChange]);
  const deshabilitado = !stripe || !tarjetaCompleta || procesando || ocupado;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tarjeta = elements?.getElement(CardElement);
    if (!stripe || !tarjeta || procesando) return;

    setError(null);
    setFase('validando');

    try {
      const { error: errorStripe, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: tarjeta,
          billing_details: { name: titular.trim() || undefined },
        },
      });

      if (errorStripe || !setupIntent?.payment_method) {
        setError(errorStripe?.message ?? 'No pudimos verificar la tarjeta con tu banco.');
        return;
      }

      const metodo = setupIntent.payment_method;
      setFase('cobrando');
      await onTarjetaConfirmada(typeof metodo === 'string' ? metodo : metodo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al procesar la tarjeta.');
    } finally {
      setFase('libre');
    }
  };

  const mensajeError = error ?? errorExterno ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mensajeError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{mensajeError}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-aurea-navy mb-1">
          Nombre del titular de la tarjeta
        </label>
        <input
          type="text"
          required
          value={titular}
          onChange={(e) => setTitular(e.target.value)}
          disabled={procesando || ocupado}
          autoComplete="cc-name"
          placeholder="Como figura en la tarjeta"
          className="w-full px-4 py-2.5 rounded-xl border border-aurea-copper/30 bg-white text-aurea-navy text-sm font-sans focus:outline-none focus:ring-2 focus:ring-aurea-copper focus:border-transparent transition-all disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-aurea-navy mb-1">
          Datos de la tarjeta
        </label>
        <div className="px-4 py-3 rounded-xl border border-aurea-copper/30 bg-white focus-within:ring-2 focus-within:ring-aurea-copper transition-all">
          <CardElement
            options={{ ...OPCIONES_TARJETA, disabled: procesando || ocupado }}
            onChange={(ev) => {
              setTarjetaCompleta(ev.complete);
              if (ev.error) setError(ev.error.message);
              else setError(null);
            }}
          />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <span className="font-bold text-slate-900">Cifrado directo con Stripe. </span>
          Los datos de tu tarjeta viajan de tu navegador a Stripe; RestaurantCloud nunca ve ni almacena el número ni el CVC.
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        {accionSecundaria}
        <button
          type="submit"
          disabled={deshabilitado}
          className="w-full sm:w-auto bg-aurea-navy hover:bg-[#12345e] text-white font-semibold py-3 px-6 rounded-full shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {fase === 'validando' ? etiquetaProcesando : fase === 'cobrando' || ocupado ? 'Procesando cobro...' : etiquetaBoton}
        </button>
      </div>
    </form>
  );
};

/**
 * Formulario de tarjeta con Stripe Elements: confirma el SetupIntent del backend en el navegador
 * y entrega solo el id del método de pago. Lo comparten el registro de empresa y "Mi suscripción".
 */
export const FormularioTarjetaStripe: React.FC<FormularioTarjetaStripeProps> = (props) => {
  const stripe = useMemo(() => cargarStripe(props.clavePublica), [props.clavePublica]);

  return (
    <Elements stripe={stripe} options={{ locale: 'es' }}>
      <CuerpoFormulario {...props} />
    </Elements>
  );
};
