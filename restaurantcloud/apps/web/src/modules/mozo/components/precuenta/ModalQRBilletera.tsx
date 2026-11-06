import React, { useState } from 'react';
import { X, Check, Copy, CheckCircle2, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { DetalleBilleteraDigitalDTO } from '../../../../types/mozo';
import { esNumeroOperacionValido, normalizarNumeroOperacion } from '@/shared/utils';

interface ModalQRBilleteraProps {
  isOpen: boolean;
  onClose: () => void;
  detalle?: DetalleBilleteraDigitalDTO | null;
  monto: number;
  /** Recibe el N° de operación ya normalizado; solo se llama con un número válido y el pago verificado */
  onConfirmarPago: (numeroOperacion: string) => void;
  actor?: 'mozo' | 'cajero';
  /** Mensaje de rechazo del servidor (por ejemplo, un N° de operación ya usado) */
  errorExterno?: string | null;
  enviando?: boolean;
}

export const ModalQRBilletera: React.FC<ModalQRBilleteraProps> = ({
  isOpen,
  onClose,
  detalle,
  monto,
  onConfirmarPago,
  actor = 'mozo',
  errorExterno = null,
  enviando = false,
}) => {
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [copiado, setCopiado] = useState(false);
  // Empieza desmarcada: confirmar el pago exige validar la transferencia de forma consciente
  const [verificadoMozo, setVerificadoMozo] = useState(false);

  if (!isOpen) return null;

  // Los datos de cobro salen solo de la configuración de la sede; no hay valores de respaldo
  const qrPayload = detalle?.qr_payload || '';
  const telefono = detalle?.telefono || '';
  const titular = detalle?.titular || '';
  const ruc = detalle?.ruc || '';

  if (!qrPayload.trim()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#0B2340] border border-[#D5A06F]/40 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4">
          <h3 className="text-base font-serif font-bold text-[#FFF9F0]">Yape / Plin sin configurar</h3>
          <p className="text-sm text-slate-300">
            La sede no tiene registrado el QR de Yape/Plin. Un administrador debe subirlo en
            Formas de pago antes de cobrar por este medio.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-[#D5A06F] text-[#0B2340] font-bold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const handleCopiarNumero = () => {
    navigator.clipboard.writeText(telefono.replace(/\s+/g, ''));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const numeroValido = esNumeroOperacionValido(numeroOperacion);
  const mostrarErrorNumero = numeroOperacion.trim() !== '' && !numeroValido;
  const puedeConfirmar = verificadoMozo && numeroValido && !enviando;

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeConfirmar) return;
    onConfirmarPago(normalizarNumeroOperacion(numeroOperacion));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B2340] border border-[#D5A06F]/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-[#D5A06F]/20 flex items-center justify-between bg-black/20">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-[#D5A06F]/20 text-[#D5A06F]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#FFF9F0]">
                Pago Yape / Plin en Mesa
              </h3>
              <p className="text-[11px] text-slate-400">Escaneo directo para el comensal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del QR y Datos de Cobro */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Monto prominente */}
          <div className="text-center bg-black/30 p-3 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
              Monto Exacto a Transferir
            </span>
            <span className="text-3xl font-serif font-bold text-[#D5A06F]">
              S/ {monto.toFixed(2)}
            </span>
          </div>

          {/* QR oficial de la sede, redibujado en vectorial */}
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow-inner border-2 border-[#D5A06F]/40 mx-auto max-w-[220px]">
            <QRCodeSVG
              value={qrPayload}
              size={172}
              level="M"
              includeMargin={false}
              className="w-40 h-40"
            />
            <div className="text-center mt-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#0B2340] block">
                Escanea con Yape o Plin
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                Ingresa S/ {monto.toFixed(2)} en tu app
              </span>
            </div>
          </div>

          {/* Datos de cuenta destino configurados en BD */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-xs">
            {telefono && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Número Yape/Plin:</span>
                <div className="flex items-center space-x-1.5 font-mono font-bold text-white">
                  <span>{telefono}</span>
                  <button
                    type="button"
                    onClick={handleCopiarNumero}
                    className="p-1 rounded hover:bg-white/10 text-[#D5A06F]"
                    title="Copiar número"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Titular de Cuenta:</span>
              <span className="font-semibold text-slate-200">{titular}</span>
            </div>

            {ruc && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">RUC Vinculado:</span>
                <span className="font-mono text-slate-300">{ruc}</span>
              </div>
            )}
          </div>

          {/* Formulario de Verificación del Mozo / Cajero */}
          <form onSubmit={handleConfirmar} className="space-y-3 pt-2 border-t border-[#D5A06F]/20">
            <div>
              <label htmlFor="qr-numero-operacion" className="block text-xs font-semibold text-slate-300 mb-1">
                N° de Operación de la constancia <span className="text-rose-400">*</span>
              </label>
              <input
                id="qr-numero-operacion"
                type="text"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                placeholder="N° de operación de Yape/Plin"
                maxLength={30}
                autoComplete="off"
                aria-invalid={mostrarErrorNumero}
                className={`w-full px-3 py-2 rounded-lg bg-black/40 border text-white font-mono text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 ${
                  mostrarErrorNumero
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-white/20 focus:ring-[#D5A06F]'
                }`}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Lo ves en la constancia de pago del cliente. Es obligatorio para registrar el cobro.
              </p>
              {mostrarErrorNumero && (
                <p role="alert" className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                  Debe tener de 4 a 30 letras o números.
                </p>
              )}
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verificadoMozo}
                onChange={(e) => setVerificadoMozo(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-[#D5A06F] focus:ring-[#D5A06F] bg-black/40"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {actor === 'cajero'
                  ? 'Transferencia validada en pantalla del cliente o voucher'
                  : 'Transferencia validada en pantalla del cliente'}
              </span>
            </label>

            {errorExterno && (
              <p role="alert" className="text-xs text-rose-400 flex items-start gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                {errorExterno}
              </p>
            )}

            <button
              type="submit"
              disabled={!puedeConfirmar}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D5A06F] to-[#b88655] hover:from-[#e0aa78] hover:to-[#c4905e] text-[#0B2340] font-bold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {actor === 'cajero' ? 'Confirmar y Generar Cuenta' : 'Confirmar y Notificar a Caja'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
