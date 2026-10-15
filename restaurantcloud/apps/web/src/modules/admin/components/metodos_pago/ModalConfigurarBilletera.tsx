import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  User,
  AlertCircle,
  Check,
} from 'lucide-react';
import { DatosAdicionalesMetodoPago } from '@/types/admin';

interface ModalConfigurarBilleteraProps {
  isOpen: boolean;
  onClose: () => void;
  datosActuales?: DatosAdicionalesMetodoPago;
  onGuardar: (datos: DatosAdicionalesMetodoPago) => void;
}

export const ModalConfigurarBilletera: React.FC<ModalConfigurarBilleteraProps> = ({
  isOpen,
  onClose,
  datosActuales,
  onGuardar,
}) => {
  const [telefono, setTelefono] = useState('');
  const [titular, setTitular] = useState('');
  const [errorTelefono, setErrorTelefono] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTelefono(datosActuales?.telefono || datosActuales?.telefono_billetera || '');
      setTitular(datosActuales?.titular || 'RESTAURANTE ÁUREA S.A.C.');
      setErrorTelefono(null);
    }
  }, [isOpen, datosActuales]);

  if (!isOpen) return null;

  const validarTelefono = (val: string): boolean => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      setErrorTelefono('El número telefónico es obligatorio para recibir pagos Yape/Plin');
      return false;
    }
    if (cleaned.length !== 9 || !cleaned.startsWith('9')) {
      setErrorTelefono('Debe ser un número celular peruano válido de 9 dígitos (inicia con 9)');
      return false;
    }
    setErrorTelefono(null);
    return true;
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setTelefono(val);
    if (val.length === 9) {
      validarTelefono(val);
    } else {
      setErrorTelefono(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarTelefono(telefono)) return;

    onGuardar({
      ...datosActuales,
      telefono: telefono,
      telefono_billetera: telefono,
      titular: titular.trim() || 'RESTAURANTE ÁUREA S.A.C.',
    });
    onClose();
  };

  // El código QR se autogenera en tiempo real a partir del celular de la sede
  const qrDisplayUrl =
    telefono.length === 9
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://yape.pe/pago/${telefono}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[620px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-billetera-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-billetera-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Configurar Billetera Digital (Yape / Plin)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define el número de recepción para los comensales en caja y en la precuenta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Número Celular Afiliado <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    +51
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={telefono}
                    onChange={handleTelefonoChange}
                    placeholder="987654321"
                    maxLength={9}
                    className={`w-full pl-12 pr-4 py-2.5 rounded-xl border text-sm font-mono tracking-wider font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-all focus:outline-none focus:ring-2 ${
                      errorTelefono
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                </div>
                {errorTelefono ? (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errorTelefono}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    9 dígitos. Requerido para validar pagos y autogenerar el código QR.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre o Razón Social del Titular
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    placeholder="Ej. RESTAURANTE ÁUREA S.A.C."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-all focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Nombre que confirmará el cliente en su aplicación Yape o Plin al escanear.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-[11px] text-purple-800 dark:text-purple-300 space-y-1">
                <span className="font-semibold block">⚡ Código QR Dinámico Automático</span>
                <p className="text-[10px] leading-relaxed opacity-90">
                  No es necesario cargar imágenes ni URLs. El código QR oficial interoperable se genera automáticamente a partir del número celular registrado.
                </p>
              </div>
            </div>

            {/* Live Visual Sticker Preview */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Vista Previa del Mostrador / Ticket
              </span>

              <div className="w-48 bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                {/* Yape / Plin pill */}
                <div className="flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  <span>Yape</span>
                  <span>•</span>
                  <span>Plin</span>
                </div>

                {/* QR box */}
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden mb-2">
                  {qrDisplayUrl ? (
                    <img
                      src={qrDisplayUrl}
                      alt="Código QR Billetera"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=YAPE-PLIN-AUREA';
                      }}
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <QrCode className="w-8 h-8 mx-auto mb-1 opacity-40 text-purple-400" />
                      <span className="text-[10px]">Ingresa los 9 dígitos</span>
                    </div>
                  )}
                </div>

                {/* Telefono & Titular */}
                <div className="w-full">
                  <div className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400">
                    {telefono ? telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '--- --- ---'}
                  </div>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {titular || 'Sin titular'}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 max-w-[220px]">
                Este código QR y celular se proyectarán al pie de la precuenta y en la pantalla del cajero.
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
