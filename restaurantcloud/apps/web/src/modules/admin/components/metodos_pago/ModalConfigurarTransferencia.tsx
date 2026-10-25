import React, { useState, useEffect, useId } from 'react';
import { Building2, CreditCard, User, Hash, AlertCircle, Check, Copy, CheckCheck, type LucideIcon } from 'lucide-react';
import { DatosAdicionalesMetodoPago } from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

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

const CLASE_CONTROL =
  'w-full min-h-tactil rounded-xl border border-tinta-300 bg-white text-base md:text-sm text-tinta-900 placeholder:text-tinta-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const CLASE_ROTULO = 'block text-sm font-semibold text-tinta-700 mb-1.5';

const INSTRUCCION_POR_DEFECTO = 'Verificar el abono en la banca móvil y pedir la constancia con N° de operación antes de emitir el comprobante.';

export const ModalConfigurarTransferencia: React.FC<ModalConfigurarTransferenciaProps> = ({
  isOpen,
  onClose,
  datosActuales,
  onGuardar,
}) => {
  const idForm = useId();
  const [banco, setBanco] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [cci, setCci] = useState('');
  const [titular, setTitular] = useState('');
  const [ruc, setRuc] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [errorCci, setErrorCci] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Solo se precargan datos ya registrados; sin ellos los campos quedan vacíos
      setBanco(datosActuales?.banco || '');
      setCuenta(datosActuales?.cuenta || '');
      setCci(datosActuales?.cci || '');
      setTitular(datosActuales?.titular || '');
      setRuc(datosActuales?.ruc || '');
      setInstrucciones(datosActuales?.instrucciones_cajero || INSTRUCCION_POR_DEFECTO);
      setErrorCci(null);
      setErrorGeneral(null);
    }
  }, [isOpen, datosActuales]);

  const handleCciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCci(val);
    const digitsOnly = val.replace(/\D/g, '');
    setErrorCci(digitsOnly.length > 0 && digitsOnly.length !== 20 ? 'El CCI tiene 20 dígitos.' : null);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banco.trim() || (!cuenta.trim() && !cci.trim())) {
      setErrorGeneral('Indica el banco y al menos el número de cuenta o el CCI.');
      return;
    }
    const digitsOnly = cci.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length !== 20) {
      setErrorCci('El CCI tiene 20 dígitos.');
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

  const botonCopiar = (valor: string, campo: string, etiqueta: string) =>
    valor && (
      <button
        type="button"
        onClick={() => copyToClipboard(valor, campo)}
        aria-label={`Copiar ${etiqueta}`}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-tinta-400 hover:text-blue-600"
      >
        {copiedField === campo ? <CheckCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
      </button>
    );

  const icono = (Icono: LucideIcon) => (
    <Icono className="w-4 h-4 text-tinta-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
  );

  return (
    <Modal
      abierto={isOpen}
      onCerrar={onClose}
      tamano="lg"
      icono={Building2}
      titulo="Cuenta para transferencias"
      descripcion="La verá el cajero para indicarla a quien pague por banca en línea."
      pie={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <button
            type="submit"
            form={idForm}
            className="min-h-tactil px-5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Guardar y activar
          </button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-4">
        {errorGeneral && (
          <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errorGeneral}
          </p>
        )}

        <div>
          <label htmlFor={`${idForm}-banco`} className={CLASE_ROTULO}>
            Banco
          </label>
          <div className="relative">
            {icono(Building2)}
            <input
              id={`${idForm}-banco`}
              list={`${idForm}-bancos`}
              type="text"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Elige o escribe el banco"
              className={cn(CLASE_CONTROL, 'pl-10 pr-4')}
            />
            <datalist id={`${idForm}-bancos`}>
              {BANCOS_POPULARES.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${idForm}-cuenta`} className={CLASE_ROTULO}>
              N° de cuenta
            </label>
            <div className="relative">
              {icono(Hash)}
              <input
                id={`${idForm}-cuenta`}
                type="text"
                inputMode="numeric"
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
                placeholder="Ej. 191-87654321-0-99"
                className={cn(CLASE_CONTROL, 'pl-10 pr-11 font-mono')}
              />
              {botonCopiar(cuenta, 'cuenta', 'número de cuenta')}
            </div>
          </div>

          <div>
            <label htmlFor={`${idForm}-cci`} className={CLASE_ROTULO}>
              CCI
            </label>
            <div className="relative">
              {icono(CreditCard)}
              <input
                id={`${idForm}-cci`}
                type="text"
                inputMode="numeric"
                value={cci}
                onChange={handleCciChange}
                placeholder="20 dígitos"
                aria-invalid={Boolean(errorCci)}
                className={cn(CLASE_CONTROL, 'pl-10 pr-11 font-mono', errorCci && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/20')}
              />
              {botonCopiar(cci, 'cci', 'CCI')}
            </div>
            {errorCci && (
              <p role="alert" className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {errorCci}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${idForm}-titular`} className={CLASE_ROTULO}>
              Titular
            </label>
            <div className="relative">
              {icono(User)}
              <input
                id={`${idForm}-titular`}
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Razón social"
                className={cn(CLASE_CONTROL, 'pl-10 pr-4')}
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${idForm}-ruc`} className={CLASE_ROTULO}>
              RUC
            </label>
            <input
              id={`${idForm}-ruc`}
              type="text"
              inputMode="numeric"
              value={ruc}
              onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="11 dígitos"
              maxLength={11}
              className={cn(CLASE_CONTROL, 'px-3.5 font-mono')}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${idForm}-instr`} className={CLASE_ROTULO}>
            Indicación para caja
          </label>
          <textarea
            id={`${idForm}-instr`}
            rows={2}
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            className={cn(CLASE_CONTROL, 'px-3.5 py-2.5')}
          />
        </div>
      </form>
    </Modal>
  );
};
