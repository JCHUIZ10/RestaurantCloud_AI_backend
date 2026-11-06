import React, { useState, useEffect, useId, useRef } from 'react';
import { Smartphone, QrCode, User, AlertCircle, Check, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DatosAdicionalesMetodoPago } from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';
import { esPayloadEmvcoValido, leerQrDeImagen } from '@/shared/utils/emvcoQr';

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
  const inputArchivo = useRef<HTMLInputElement>(null);
  const [telefono, setTelefono] = useState('');
  const [titular, setTitular] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [errorTelefono, setErrorTelefono] = useState<string | null>(null);
  const [errorQr, setErrorQr] = useState<string | null>(null);
  const [leyendoQr, setLeyendoQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTelefono(datosActuales?.telefono || '');
      setTitular(datosActuales?.titular || '');
      setQrPayload(datosActuales?.qr_payload || '');
      setErrorTelefono(null);
      setErrorQr(null);
    }
  }, [isOpen, datosActuales]);

  // El celular es opcional (sirve para "yapear al número"); si se escribe debe ser válido
  const validarTelefono = (val: string): boolean => {
    if (val && (val.length !== 9 || !val.startsWith('9'))) {
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

  const handleArchivoQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;

    setLeyendoQr(true);
    setErrorQr(null);
    try {
      const contenido = await leerQrDeImagen(archivo);
      if (contenido && esPayloadEmvcoValido(contenido)) {
        setQrPayload(contenido);
      } else {
        setErrorQr('No encontramos un QR de pago de Yape / Plin en la imagen. Sube la captura de "Mi QR" completa y nítida.');
      }
    } catch {
      setErrorQr('No se pudo leer la imagen. Prueba con otra captura.');
    } finally {
      setLeyendoQr(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrPayload) {
      setErrorQr('Sube el QR oficial de Yape / Plin para poder cobrar con este medio.');
      return;
    }
    if (!validarTelefono(telefono)) return;

    onGuardar({
      ...datosActuales,
      qr_payload: qrPayload,
      telefono,
      titular: titular.trim(),
    });
    onClose();
  };

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      tamano="lg"
      icono={Smartphone}
      titulo="Yape / Plin"
      descripcion="Sube el QR oficial de tu Yape o Plin; el cliente lo escanea para pagarte."
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
            <span className="block text-sm font-semibold text-tinta-700 mb-1.5">QR oficial</span>
            <input
              ref={inputArchivo}
              type="file"
              accept="image/*"
              onChange={handleArchivoQr}
              className="sr-only"
              aria-label="Subir imagen del QR de Yape o Plin"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputArchivo.current?.click()}
              disabled={leyendoQr}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              {leyendoQr ? 'Leyendo QR…' : qrPayload ? 'Cambiar QR' : 'Subir captura de “Mi QR”'}
            </Button>
            <p className="mt-1 text-xs text-tinta-500">
              En la app de Yape o Plin abre “Mi QR” y toma una captura.
            </p>
            {errorQr && (
              <p role="alert" className="mt-1 text-xs text-rose-600 flex items-start gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                {errorQr}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${idForm}-tel`} className="block text-sm font-semibold text-tinta-700 mb-1.5">
              Celular afiliado <span className="font-normal text-tinta-400">(opcional)</span>
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
          <div className="w-52 bg-purple-700 rounded-xl p-4 shadow-md flex flex-col items-center">
            <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              {qrPayload ? (
                <QRCodeSVG value={qrPayload} size={144} level="M" aria-label="Código QR de Yape / Plin" />
              ) : (
                <div className="text-center p-2 text-tinta-400">
                  <QrCode className="w-8 h-8 mx-auto mb-1 opacity-40 text-purple-400" aria-hidden="true" />
                  <span className="text-xs">Sube tu QR</span>
                </div>
              )}
            </div>
            <span className="-mt-3 px-3 py-1 rounded-full bg-teal-400 text-white text-xs font-bold shadow-sm">
              Paga aquí con Yape
            </span>
            <p className="mt-3 text-sm font-semibold text-white truncate max-w-full">{titular || 'Sin titular'}</p>
            {telefono && (
              <p className="text-xs font-mono text-purple-200">
                {telefono.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
