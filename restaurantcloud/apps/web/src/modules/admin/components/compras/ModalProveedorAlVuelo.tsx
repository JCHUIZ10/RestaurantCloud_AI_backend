import React, { useState, useEffect, useId } from 'react';
import { Truck, Check, MessageCircle, User, Mail, MapPin, AlertCircle } from 'lucide-react';
import { adminService } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import { ProveedorResumenDTO } from '@/types/admin';
import { extraerDigitosMovilPeru, formatearTelefonoPeru, cn } from '@/shared/utils';
import { Button, Modal } from '@/components/ui';

interface ModalProveedorAlVueloProps {
  abierto: boolean;
  onCerrar: () => void;
  onProveedorCreado: (proveedor: ProveedorResumenDTO) => void;
}

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';
const OPCIONAL = <span className="font-normal text-aurea-navy/50">(opcional)</span>;

/** Campo de texto con icono a la izquierda */
const CampoIcono: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icono: typeof User }> = ({
  icono: Icono,
  className,
  ...props
}) => (
  <div className="relative">
    <Icono className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
    <input className={cn(CLASE_CONTROL, 'pl-10', className)} {...props} />
  </div>
);

/** Alta rápida de proveedor desde el registro de una compra; se apila sobre ese modal. */
export const ModalProveedorAlVuelo: React.FC<ModalProveedorAlVueloProps> = ({
  abierto,
  onCerrar,
  onProveedorCreado,
}) => {
  const idForm = useId();
  const usuario = useAuthStore((s) => s.usuario);
  const localId = usuario?.local?.id || '';

  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setNombre('');
      setContacto('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setError(null);
      setGuardando(false);
    }
  }, [abierto]);

  const digitosTelefono = extraerDigitosMovilPeru(telefono);
  const telefonoValido = digitosTelefono.length === 9 && digitosTelefono.startsWith('9');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!localId) {
      setError('No se identificó una sede activa en tu sesión para asociar el proveedor.');
      return;
    }

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || nombreLimpio.length < 3) {
      setError('El nombre comercial o razón social debe tener al menos 3 caracteres.');
      return;
    }

    if (!digitosTelefono || digitosTelefono.length !== 9) {
      setError('Ingresa un celular peruano válido de 9 dígitos.');
      return;
    }

    if (!digitosTelefono.startsWith('9')) {
      setError('El celular debe empezar con 9.');
      return;
    }

    try {
      setGuardando(true);
      const res = await adminService.crearProveedor(localId, {
        nombre: nombreLimpio,
        contacto: contacto.trim() || undefined,
        telefono: `+51 ${formatearTelefonoPeru(digitosTelefono)}`,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });

      if (res.exito && res.datos) {
        onProveedorCreado(res.datos);
        onCerrar();
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo registrar el proveedor.');
      }
    } catch {
      setError('Ocurrió un error inesperado al registrar el proveedor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!guardando}
      icono={Truck}
      titulo="Nuevo proveedor"
      descripcion="Nombre y celular bastan; el RUC no es obligatorio."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={idForm} loading={guardando} leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}>
            Guardar y usar
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div>
          <label htmlFor={`${idForm}-nombre`} className={CLASE_ROTULO}>
            Nombre o razón social
          </label>
          <input
            id={`${idForm}-nombre`}
            type="text"
            required
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Distribuidora Los Andes, Casero Don Lucho"
            className={cn(CLASE_CONTROL, 'font-medium')}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${idForm}-tel`} className="text-sm font-semibold text-aurea-navy">
              Celular / WhatsApp
            </label>
            {telefonoValido ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-estado-ok-700">
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Válido
              </span>
            ) : digitosTelefono.length > 0 ? (
              <span className="text-xs font-mono text-aurea-navy/60">{digitosTelefono.length}/9</span>
            ) : null}
          </div>
          <div className="flex min-h-tactil rounded-xl border border-aurea-champagne/70 bg-white overflow-hidden focus-within:border-aurea-copper">
            <span className="inline-flex items-center px-3 bg-aurea-champagne/30 border-r border-aurea-champagne/70 font-mono text-sm font-semibold text-aurea-navy select-none">
              +51
            </span>
            <input
              id={`${idForm}-tel`}
              type="tel"
              inputMode="numeric"
              required
              maxLength={11}
              value={formatearTelefonoPeru(telefono)}
              onChange={(e) => {
                const digits = extraerDigitosMovilPeru(e.target.value);
                const formatted = formatearTelefonoPeru(digits);
                setTelefono(digits ? `+51 ${formatted}` : '');
              }}
              placeholder="987 654 321"
              className="w-full px-3 font-mono text-base md:text-sm text-aurea-navy bg-transparent focus:outline-none placeholder:text-aurea-navy/40"
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${idForm}-contacto`} className={CLASE_ROTULO}>
            Persona de contacto {OPCIONAL}
          </label>
          <CampoIcono
            id={`${idForm}-contacto`}
            icono={User}
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${idForm}-email`} className={CLASE_ROTULO}>
              Correo {OPCIONAL}
            </label>
            <CampoIcono
              id={`${idForm}-email`}
              icono={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ventas@proveedor.pe"
            />
          </div>
          <div>
            <label htmlFor={`${idForm}-dir`} className={CLASE_ROTULO}>
              Dirección o puesto {OPCIONAL}
            </label>
            <CampoIcono
              id={`${idForm}-dir`}
              icono={MapPin}
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Mdo. Santa Anita, Pab. 4"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
