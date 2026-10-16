import React, { useState, useEffect } from 'react';
import {
  MetodoPagoDTO,
  EstadoCobroDunningDTO,
  ConfirmarTarjetaRequestDTO,
} from '@/types/propietarioSuscripcion';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';
import { Button } from '@/components/ui/Button';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';

interface ModalActualizarTarjetaProps {
  abierto: boolean;
  estadoCobro: EstadoCobroDunningDTO | null;
  onCerrar: () => void;
  onExito: (metodo: MetodoPagoDTO, cobroRegularizado: boolean) => void;
}

export const ModalActualizarTarjeta: React.FC<ModalActualizarTarjetaProps> = ({
  abierto,
  estadoCobro,
  onCerrar,
  onExito,
}) => {
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [cvc, setCvc] = useState('');
  const [titular, setTitular] = useState('Rodrigo De Las Casas');

  const [procesando, setProcesando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setNumeroTarjeta('');
      setExpiracion('');
      setCvc('');
      setTitular('Rodrigo De Las Casas');
      setErrorValidacion(null);
      setProcesando(false);
    }
  }, [abierto]);

  if (!abierto) return null;

  // Formateador de tarjeta con espacios cada 4 dígitos
  const handleNumeroTarjetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setNumeroTarjeta(parts ? parts.join(' ') : raw);
    setErrorValidacion(null);
  };

  // Formateador de expiración MM/YY
  const handleExpiracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setExpiracion(raw);
    setErrorValidacion(null);
  };

  // Formateador de CVC (3 o 4 dígitos)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
    setErrorValidacion(null);
  };

  // Detección de marca
  const detectarMarca = () => {
    const limpio = numeroTarjeta.replace(/\s+/g, '');
    if (limpio.startsWith('4')) return 'VISA';
    if (limpio.startsWith('5')) return 'MASTERCARD';
    if (limpio.startsWith('3')) return 'AMEX';
    return 'TARJETA';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const numLimpio = numeroTarjeta.replace(/\s+/g, '');
    if (numLimpio.length < 15) {
      setErrorValidacion('Por favor ingresa un número de tarjeta válido (15 o 16 dígitos).');
      return;
    }

    if (!expiracion.includes('/') || expiracion.length < 5) {
      setErrorValidacion('Ingresa una fecha de vencimiento válida en formato MM/AA.');
      return;
    }

    const [mesStr, anoStr] = expiracion.split('/');
    const mes = parseInt(mesStr, 10);
    const ano = parseInt(anoStr, 10);

    if (mes < 1 || mes > 12) {
      setErrorValidacion('El mes de vencimiento debe estar entre 01 y 12.');
      return;
    }

    const anoCompleto = ano < 100 ? 2000 + ano : ano;
    const anoActual = new Date().getFullYear();
    const mesActual = new Date().getMonth() + 1;

    if (anoCompleto < anoActual || (anoCompleto === anoActual && mes < mesActual)) {
      setErrorValidacion('La tarjeta ya se encuentra vencida.');
      return;
    }

    if (cvc.length < 3) {
      setErrorValidacion('El código de seguridad CVC debe tener al menos 3 dígitos.');
      return;
    }

    if (!titular.trim()) {
      setErrorValidacion('Ingresa el nombre del titular tal como figura en el plástico.');
      return;
    }

    setProcesando(true);
    try {
      const dto: ConfirmarTarjetaRequestDTO = {
        numero_tarjeta: numLimpio,
        mes_expiracion: mes,
        ano_expiracion: anoCompleto,
        cvc,
        titular: titular.trim(),
      };

      const res = await propietarioSuscripcionService.confirmarTarjeta(dto);
      if (res.exito && res.datos) {
        onExito(res.datos.metodo_pago, res.datos.cobro_pendiente_regularizado);
        onCerrar();
      } else {
        setErrorValidacion(
          res.errores?.[0]?.mensaje || 'No pudimos validar la tarjeta con tu banco emisor.'
        );
      }
    } catch {
      setErrorValidacion('Error de conexión con la pasarela de pagos. Inténtalo nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  const montoPendiente = estadoCobro?.monto_pendiente ?? 0;
  const tieneDeuda = montoPendiente > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-actualizar-tarjeta-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-aurea-navy/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="bg-aurea-navy p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-aurea-champagne">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-actualizar-tarjeta-titulo"
                className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white"
              >
                Actualizar Método de Pago
              </h2>
              <p className="text-xs text-slate-300">
                Stripe Billing Elements • Tokenización Segura PCI-DSS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            aria-label="Cerrar ventana"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Alerta de regularización de deuda si aplica */}
          {tieneDeuda && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-950">
                  Cobro pendiente de S/ {montoPendiente.toFixed(2)}
                </strong>
                Al confirmar tu nueva tarjeta, Stripe procesará inmediatamente este importe para regularizar tu suscripción y mantener tu cuenta al día.
              </div>
            </div>
          )}

          {/* Mensaje de Error de Validación */}
          {errorValidacion && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Nombre del Titular */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nombre en la Tarjeta
            </label>
            <input
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Ej. RODRIGO DE LAS CASAS"
              required
              disabled={procesando}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-navy/20 focus:border-aurea-navy font-sans uppercase"
            />
          </div>

          {/* Número de Tarjeta */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Número de Tarjeta
              </label>
              <span className="text-[11px] font-mono font-bold text-aurea-navy bg-slate-100 px-2 py-0.5 rounded">
                {detectarMarca()}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={numeroTarjeta}
                onChange={handleNumeroTarjetaChange}
                placeholder="4242 4242 4242 4242"
                required
                disabled={procesando}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-navy/20 focus:border-aurea-navy font-mono tracking-wider"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Vencimiento y CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vencimiento (MM/AA)
              </label>
              <input
                type="text"
                value={expiracion}
                onChange={handleExpiracionChange}
                placeholder="12/28"
                required
                disabled={procesando}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-navy/20 focus:border-aurea-navy font-mono text-center tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                CVC / Código de Seg.
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={cvc}
                  onChange={handleCvcChange}
                  placeholder="123"
                  required
                  disabled={procesando}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-aurea-navy/20 focus:border-aurea-navy font-mono text-center tracking-widest"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Garantía de Seguridad Stripe */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5 mt-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="leading-tight">
              Los datos se transmiten directamente a <strong>Stripe Billing</strong> mediante encriptación <strong>TLS 1.3 de 256 bits</strong>. Cumple los estándares PCI-DSS Service Provider Nivel 1.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              disabled={procesando}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={procesando}
              className="bg-aurea-navy hover:bg-aurea-navy/90 text-white font-bold text-xs sm:text-sm py-2.5 px-5 flex items-center gap-2 shadow-md"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-aurea-champagne" />
                  <span>Validando y Tokenizando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-aurea-champagne" />
                  <span>Guardar y Confirmar Tarjeta</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
