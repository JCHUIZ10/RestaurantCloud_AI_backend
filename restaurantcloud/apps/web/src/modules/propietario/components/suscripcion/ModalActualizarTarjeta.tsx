import React, { useState } from 'react';
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { FormularioTarjetaStripe } from '@/components/stripe/FormularioTarjetaStripe';
import type { SetupMetodoPagoDTO } from '@/types/propietarioSuscripcion';

interface ModalActualizarTarjetaProps {
  abierto: boolean;
  /** SetupIntent entregado por la API; null mientras se prepara o si falló */
  setup: SetupMetodoPagoDTO | null;
  cargandoSetup: boolean;
  /** Monto que se cobrará al confirmar la tarjeta si la suscripción tiene un pago pendiente */
  montoPendiente: number;
  titularInicial?: string;
  /** Error del servidor tras confirmar (cobro pendiente rechazado, tarjeta inválida...) o al preparar el formulario */
  error: string | null;
  onTarjetaConfirmada: (paymentMethodId: string) => Promise<void>;
  onReintentarPreparacion: () => void;
  onCerrar: () => void;
}

/** Cambio de tarjeta con Stripe Elements: el número y el CVC nunca pasan por nuestro servidor. */
export const ModalActualizarTarjeta: React.FC<ModalActualizarTarjetaProps> = ({
  abierto,
  setup,
  cargandoSetup,
  montoPendiente,
  titularInicial,
  error,
  onTarjetaConfirmada,
  onReintentarPreparacion,
  onCerrar,
}) => {
  const [procesando, setProcesando] = useState(false);
  const tieneDeuda = montoPendiente > 0;

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!procesando}
      icono={CreditCard}
      etiqueta="Método de pago"
      titulo="Actualizar tarjeta"
      descripcion="Los cobros futuros de tu suscripción se debitarán de esta tarjeta."
      tamano="md"
    >
      <div className="space-y-4">
        {tieneDeuda && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-950">
                Cobro pendiente de S/ {montoPendiente.toFixed(2)}
              </strong>
              Al confirmar la nueva tarjeta se cobrará de inmediato este importe para regularizar tu suscripción.
            </div>
          </div>
        )}

        {cargandoSetup && (
          <div className="py-10 flex flex-col items-center gap-2 text-sm text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin text-aurea-navy" />
            Preparando formulario seguro...
          </div>
        )}

        {!cargandoSetup && !setup && (
          <div className="space-y-3">
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error ?? 'No pudimos preparar el formulario de tarjeta.'}</span>
            </div>
            <Button variant="outline" onClick={onReintentarPreparacion}>
              Reintentar
            </Button>
          </div>
        )}

        {!cargandoSetup && setup && (
          <FormularioTarjetaStripe
            clientSecret={setup.client_secret}
            clavePublica={setup.stripe_public_key}
            titularInicial={titularInicial}
            errorExterno={error}
            onProcesandoChange={setProcesando}
            onTarjetaConfirmada={onTarjetaConfirmada}
            etiquetaBoton={tieneDeuda ? `Guardar tarjeta y pagar S/ ${montoPendiente.toFixed(2)}` : 'Guardar tarjeta'}
            accionSecundaria={
              <Button variant="ghost" type="button" onClick={onCerrar} disabled={procesando}>
                Cancelar
              </Button>
            }
          />
        )}
      </div>
    </Modal>
  );
};
