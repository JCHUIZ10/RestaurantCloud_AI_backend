import React, { useState, useEffect, useId } from 'react';
import { Smartphone, QrCode, User, AlertCircle, Check } from 'lucide-react';
import { DatosAdicionalesMetodoPago } from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalConfigurarBilleteraProps {
  isOpen: boolean;
  onClose: () => void;
  datosActuales?: DatosAdicionalesMetodoPago;
  onGuardar: (datos: DatosAdicionalesMetodoPago) => void;
}

const CLASE_CONTROL =
  'w-full min-h-tactil rounded-xl border bg-white text-base md:text-sm text-tinta-900 placeholder:text-tinta-400 focus:outline-none focus:ring-2 transition-all';

export const ModalConfigurarBilletera: React.FC<ModalConfigurarBilleteraProps> = ({
  isOpen,
  onClose,
  datosActuales,
  onGuardar,
}) => {
  const idForm = useId();
  const [telefono, setTelefono] = useState('');
  const [titular, setTitular] = useState('');
  const [errorTelefono, setErrorTelefono] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTelefono(datosActuales?.telefono || datosActuales?.telefono_billetera || '');
      setTitular(datosActuales?.titular || '');
      setErrorTelefono(null);
    }
  }, [isOpen, datosActuales]);

  const validarTelefono = (val: string): boolean => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      setErrorTelefono('El celular es obligatorio para recibir pagos.');
      return false;
    }
    if (cleaned.length !== 9 || !cleaned.startsWith('9')) {
      setErrorTelefono('Debe ser un celular de 9 dígitos que empiece con 9.');
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
      titular: titular.trim(),
    });
    onClose();
  };

  // El QR se genera a partir del celular del local
  const qrDisplayUrl =
    telefono.length === 9
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://yape.pe/pago/${telefono}`
      : null;

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      tamano="lg"
      icono={Smartphone}
      titulo="Yape / Plin"
      descripcion="Celular donde el cliente te paga; el QR se genera solo."
      pie={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <button
            type="submit"
            form={idForm}
            className="min-h-tactil px-5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Guardar y activar
          </button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div>
            <label htmlFor={`${idForm}-tel`} className="block text-sm font-semibold text-tinta-700 mb-1.5">
              Celular afiliado
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-tinta-400 pointer-events-none">+51</span>
              <input
                id={`${idForm}-tel`}
                type="tel"
                inputMode="numeric"
                value={telefono}
                onChange={handleTelefonoChange}
                placeholder="987654321"
                maxLength={9}
                aria-invalid={Boolean(errorTelefono)}
                className={cn(
                  CLASE_CONTROL,
                  'pl-12 pr-4 font-mono tracking-wider font-semibold',
                  errorTelefono ? 'border-rose-400 focus:ring-rose-400/20' : 'border-tinta-300 focus:border-purple-500 focus:ring-purple-500/20'
                )}
              />
            </div>
            {errorTelefono && (
              <p role="alert" className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {errorTelefono}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${idForm}-titular`} className="block text-sm font-semibold text-tinta-700 mb-1.5">
              Titular <span className="font-normal text-tinta-400">(lo ve el cliente al pagar)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-tinta-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id={`${idForm}-titular`}
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Nombre o razón social"
                className={cn(CLASE_CONTROL, 'pl-10 pr-4 border-tinta-300 focus:border-purple-500 focus:ring-purple-500/20')}
              />
            </div>
          </div>
        </div>

        {/* Vista previa del cartel de mostrador */}
        <div className="bg-tinta-50 p-4 rounded-xl border border-tinta-200 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-tinta-400 mb-2">Vista previa</p>
          <div className="w-48 bg-white rounded-xl p-4 shadow-md border border-tinta-200 flex flex-col items-center">
            <span className="mb-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold tracking-wider uppercase shadow-sm">
              Yape · Plin
            </span>
            <div className="w-32 h-32 bg-tinta-100 rounded-lg flex items-center justify-center border border-tinta-200 overflow-hidden mb-2">
              {qrDisplayUrl ? (
                <img src={qrDisplayUrl} alt="Código QR de Yape / Plin" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center p-2 text-tinta-400">
                  <QrCode className="w-8 h-8 mx-auto mb-1 opacity-40 text-purple-400" aria-hidden="true" />
                  <span className="text-xs">Escribe los 9 dígitos</span>
                </div>
              )}
            </div>
            <p className="text-sm font-bold font-mono text-purple-700">
              {telefono ? telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '--- --- ---'}
            </p>
            <p className="text-xs font-medium text-tinta-600 truncate max-w-full">{titular || 'Sin titular'}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
