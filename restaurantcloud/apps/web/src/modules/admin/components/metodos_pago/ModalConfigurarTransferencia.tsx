import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CreditCard,
  User,
  Hash,
  AlertCircle,
  Check,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { DatosAdicionalesMetodoPago } from '@/types/admin';

interface ModalConfigurarTransferenciaProps {
  isOpen: boolean;
  onClose: () => void;
  datosActuales?: DatosAdicionalesMetodoPago;
  onGuardar: (datos: DatosAdicionalesMetodoPago) => void;
}

const BANCOS_POPULARES = [
  'Banco de Crédito del Perú (BCP)',
  'BBVA Perú',
  'Interbank',
  'Scotiabank Perú',
  'Banco de la Nación',
  'BanBif',
  'Banco Pichincha',
];

export const ModalConfigurarTransferencia: React.FC<ModalConfigurarTransferenciaProps> = ({
  isOpen,
  onClose,
  datosActuales,
  onGuardar,
}) => {
  const [banco, setBanco] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [cci, setCci] = useState('');
  const [titular, setTitular] = useState('');
  const [ruc, setRuc] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [errorCci, setErrorCci] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBanco(datosActuales?.banco || 'Banco de Crédito del Perú (BCP)');
      setCuenta(datosActuales?.cuenta || '191-87654321-0-99');
      setCci(datosActuales?.cci || '002-191-008765432109-99');
      setTitular(datosActuales?.titular || 'RESTAURANTE ÁUREA S.A.C.');
      setRuc(datosActuales?.ruc || '20601234567');
      setInstrucciones(
        datosActuales?.instrucciones_cajero ||
          'Verificar abono en banca móvil y adjuntar constancia con N° Operación antes de emitir comprobante.'
      );
      setErrorCci(null);
    }
  }, [isOpen, datosActuales]);

  if (!isOpen) return null;

  const handleCciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCci(val);
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length !== 20) {
      setErrorCci('El CCI debe tener exactamente 20 dígitos numéricos');
    } else {
      setErrorCci(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = cci.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length !== 20) {
      setErrorCci('El CCI debe tener exactamente 20 dígitos numéricos');
      return;
    }

    onGuardar({
      ...datosActuales,
      banco,
      cuenta,
      cci,
      titular,
      ruc,
      instrucciones_cajero: instrucciones,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[620px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-transferencia-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-transferencia-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Configuración de Cuentas para Transferencias
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Información para eventos corporativos y clientes que pagan por banca en línea
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Entidad Financiera (Banco)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                list="bancos-list"
                type="text"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                placeholder="Selecciona o escribe el banco..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <datalist id="bancos-list">
                {BANCOS_POPULARES.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Número de Cuenta Corriente / Ahorros
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cuenta}
                  onChange={(e) => setCuenta(e.target.value)}
                  placeholder="Ej. 191-87654321-0-99"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                {cuenta && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cuenta, 'cuenta')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    title="Copiar cuenta"
                  >
                    {copiedField === 'cuenta' ? (
                      <CheckCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Código Interbancario (CCI)
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cci}
                  onChange={handleCciChange}
                  placeholder="002-191-008765432109-99"
                  className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errorCci
                      ? 'border-rose-400 focus:ring-rose-400/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {cci && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cci, 'cci')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    title="Copiar CCI"
                  >
                    {copiedField === 'cci' ? (
                      <CheckCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              {errorCci && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errorCci}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Titular de la Cuenta
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  placeholder="RESTAURANTE ÁUREA S.A.C."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                RUC de la Empresa
              </label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="20601234567"
                maxLength={11}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Protocolo para Cajeros / Mozo
            </label>
            <textarea
              rows={2}
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Instrucción que verá el personal de caja antes de liberar la comanda..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Instrucción operacional de seguridad para evitar estafas con transferencias diferidas.
            </p>
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Datos Bancarios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
