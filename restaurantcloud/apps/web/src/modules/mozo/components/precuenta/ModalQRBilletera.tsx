import React, { useState } from 'react';
import { X, Check, Copy, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { DetalleBilleteraDigitalDTO } from '../../../../types/mozo';
import { generateYapeEmvcoPayload } from '@/shared/utils/emvcoQr';

interface ModalQRBilleteraProps {
  isOpen: boolean;
  onClose: () => void;
  detalle?: DetalleBilleteraDigitalDTO | null;
  monto: number;
  onConfirmarPago: (numeroOperacion: string) => void;
  actor?: 'mozo' | 'cajero';
}

export const ModalQRBilletera: React.FC<ModalQRBilleteraProps> = ({
  isOpen,
  onClose,
  detalle,
  monto,
  onConfirmarPago,
  actor = 'mozo',
}) => {
  const [numeroOperacion, setNumeroOperacion] = useState('581902');
  const [copiado, setCopiado] = useState(false);
  const [verificadoMozo, setVerificadoMozo] = useState(true);
  const [conMontoExacto, setConMontoExacto] = useState(true);

  if (!isOpen) return null;

  const telefono = detalle?.telefono || '930723537';
  const titular = detalle?.titular || 'AUREA RESTAURANTE';
  const ruc = detalle?.ruc || '20601234567';

  // Payload estándar EMVCo MPM oficial interoperable para Yape y Plin
  const qrPayload = generateYapeEmvcoPayload({
    phone: telefono,
    name: titular,
    amount: conMontoExacto ? monto : 0,
    isDynamic: conMontoExacto,
    city: 'LIMA',
  });

  const handleCopiarNumero = () => {
    navigator.clipboard.writeText(telefono.replace(/\s+/g, ''));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmarPago(numeroOperacion);
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

          {/* Selector de modo QR (Exacto vs Libre) */}
          <div className="flex rounded-lg bg-black/40 p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setConMontoExacto(true)}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
                conMontoExacto
                  ? 'bg-[#D5A06F] text-[#0B2340] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monto Exacto (S/ {monto.toFixed(2)})
            </button>
            <button
              type="button"
              onClick={() => setConMontoExacto(false)}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
                !conMontoExacto
                  ? 'bg-[#D5A06F] text-[#0B2340] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              QR Simple (Digitar en App)
            </button>
          </div>

          {/* QR Renderizado Vectorial Real con QRCodeSVG */}
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
                YAPE / PLIN EMVCo
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                {conMontoExacto ? `S/ ${monto.toFixed(2)} precargado` : 'Monto a digitar por el cliente'}
              </span>
            </div>
          </div>

          {/* Datos de cuenta destino configurados en BD */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2 text-xs">
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

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Titular de Cuenta:</span>
              <span className="font-semibold text-slate-200">{titular}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">RUC Vinculado:</span>
              <span className="font-mono text-slate-300">{ruc}</span>
            </div>
          </div>

          {/* Formulario de Verificación del Mozo / Cajero */}
          <form onSubmit={handleConfirmar} className="space-y-3 pt-2 border-t border-[#D5A06F]/20">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                N° de Operación del Voucher (Opcional):
              </label>
              <input
                type="text"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                placeholder="Ej. 581902"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D5A06F]"
              />
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

            <button
              type="submit"
              disabled={!verificadoMozo}
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
