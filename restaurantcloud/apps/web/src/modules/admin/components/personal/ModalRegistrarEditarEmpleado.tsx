import React, { useState, useEffect, useId } from 'react';
import { User, UserCheck, Mail, Phone, Copy, Check, MessageCircle, AlertCircle } from 'lucide-react';
import {
  RolEmpleadoOperativo,
  RegistrarEmpleadoRequestDTO,
  ActualizarEmpleadoRequestDTO,
  EmpleadoResumenDTO,
  EmpleadoDetalleDTO,
} from '@/types/admin';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';
import { ORDEN_ROLES, ROLES_PERSONAL } from './rolesPersonal';

interface ModalRegistrarEditarEmpleadoProps {
  abierto: boolean;
  onCerrar: () => void;
  empleadoAEditar?: EmpleadoResumenDTO | null;
  onGuardarNuevo: (req: RegistrarEmpleadoRequestDTO) => Promise<EmpleadoDetalleDTO | null>;
  onGuardarEdicion: (id: string, req: ActualizarEmpleadoRequestDTO) => Promise<boolean>;
}

const CLASE_CONTROL =
  'w-full min-h-tactil pl-10 pr-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper disabled:bg-aurea-ivory disabled:text-aurea-navy/50';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';
const CLASE_ICONO = 'w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none';

export const ModalRegistrarEditarEmpleado: React.FC<ModalRegistrarEditarEmpleadoProps> = ({
  abierto,
  onCerrar,
  empleadoAEditar,
  onGuardarNuevo,
  onGuardarEdicion,
}) => {
  const idForm = useId();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('+51 ');
  const [rol, setRol] = useState<RolEmpleadoOperativo>('mozo');
  const [enviarBienvenida, setEnviarBienvenida] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Tras registrar se muestran las credenciales generadas para compartirlas
  const [empleadoCreado, setEmpleadoCreado] = useState<EmpleadoDetalleDTO | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (empleadoAEditar) {
      setNombre(empleadoAEditar.nombre);
      setCorreo(empleadoAEditar.correo);
      setTelefono(empleadoAEditar.telefono);
      setRol(empleadoAEditar.rol);
      setEmpleadoCreado(null);
      setErrorValidacion(null);
    } else {
      setNombre('');
      setCorreo('');
      setTelefono('+51 9');
      setRol('mozo');
      setEnviarBienvenida(true);
      setEmpleadoCreado(null);
      setErrorValidacion(null);
    }
  }, [empleadoAEditar, abierto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setErrorValidacion('Escribe el nombre completo (mínimo 3 caracteres).');
      return;
    }

    if (!correo.trim() || !correo.includes('@')) {
      setErrorValidacion('Escribe un correo válido; será su usuario de acceso.');
      return;
    }

    const cleanTel = telefono.replace(/\D/g, '');
    if (cleanTel.length < 9) {
      setErrorValidacion('Escribe un celular válido de 9 dígitos.');
      return;
    }

    setGuardando(true);
    try {
      if (empleadoAEditar) {
        const ok = await onGuardarEdicion(empleadoAEditar.id, {
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          rol,
        });
        if (ok) {
          onCerrar();
        }
      } else {
        const nuevo = await onGuardarNuevo({
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          rol,
          enviar_bienvenida: enviarBienvenida,
        });
        if (nuevo) {
          setEmpleadoCreado(nuevo);
        }
      }
    } finally {
      setGuardando(false);
    }
  };

  const copiarCredenciales = () => {
    if (!empleadoCreado) return;
    const texto = `Acceso RestaurantCloud AI:\nUsuario: ${empleadoCreado.correo}\nClave provisional: ${empleadoCreado.password_temporal}\nURL: https://app.restaurantcloud.pe/login`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (empleadoCreado) {
    const r = ROLES_PERSONAL[empleadoCreado.rol];
    return (
      <Modal
        abierto={abierto}
        onCerrar={onCerrar}
        icono={UserCheck}
        titulo={`${empleadoCreado.nombre} ya tiene acceso`}
        descripcion="Comparte su clave provisional; deberá cambiarla al entrar."
        pie={
          <>
            <Button
              variant="outline"
              onClick={copiarCredenciales}
              leftIcon={copiado ? <Check className="w-4 h-4 text-estado-ok-600" aria-hidden="true" /> : <Copy className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
            >
              {copiado ? 'Copiado' : 'Copiar acceso'}
            </Button>
            <Button onClick={onCerrar}>Listo</Button>
          </>
        }
      >
        <div className="space-y-4">
          <dl className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-aurea-navy/60">Usuario</dt>
              <dd className="font-mono font-semibold text-aurea-navy break-all">{empleadoCreado.correo}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-aurea-navy/60">Clave provisional</dt>
              <dd className="font-mono font-bold text-xl tracking-wider text-aurea-copper bg-white px-3 py-0.5 rounded-lg border border-aurea-copper/30">
                {empleadoCreado.password_temporal}
              </dd>
            </div>
            {r && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-aurea-navy/60">Rol</dt>
                <dd className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold', r.tag)}>
                  <r.icono className={cn('w-3.5 h-3.5', r.iconoColor)} aria-hidden="true" />
                  {r.etiqueta}
                </dd>
              </div>
            )}
          </dl>

          {empleadoCreado.enlace_whatsapp_link && (
            <a
              href={empleadoCreado.enlace_whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-tactil inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-estado-ok-600 hover:bg-estado-ok-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              Enviar acceso por WhatsApp
            </a>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!guardando}
      tamano="lg"
      icono={User}
      titulo={empleadoAEditar ? `Editar a ${empleadoAEditar.nombre}` : 'Nuevo colaborador'}
      descripcion={empleadoAEditar ? undefined : 'Se le generará una clave provisional para su primer ingreso.'}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={idForm} loading={guardando} leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}>
            {empleadoAEditar ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-5">
        {errorValidacion && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errorValidacion}
          </p>
        )}

        <fieldset>
          <legend className={CLASE_ROTULO}>Rol</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ORDEN_ROLES.map((valor) => {
              const r = ROLES_PERSONAL[valor];
              const Icono = r.icono;
              const activo = rol === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setRol(valor)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-colors',
                    activo ? r.opcionActiva : 'border-aurea-champagne/70 bg-white hover:border-aurea-copper/50'
                  )}
                >
                  <span className="flex items-center justify-between mb-1.5">
                    <span className={cn('w-8 h-8 rounded-lg ring-1 flex items-center justify-center', r.avatar)} aria-hidden="true">
                      <Icono className="w-4 h-4" />
                    </span>
                    <span
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center',
                        activo ? r.radio : 'border-aurea-champagne'
                      )}
                      aria-hidden="true"
                    >
                      {activo && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </span>
                  <span className="block font-semibold text-sm text-aurea-navy">{r.etiqueta}</span>
                  <span className="block text-xs text-aurea-navy/60">{r.descripcion}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${idForm}-nombre`} className={CLASE_ROTULO}>
            Nombre completo
          </label>
          <div className="relative">
            <User className={CLASE_ICONO} aria-hidden="true" />
            <input
              id={`${idForm}-nombre`}
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Carlos Mendoza Huamán"
              className={CLASE_CONTROL}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${idForm}-correo`} className={CLASE_ROTULO}>
              Correo <span className="font-normal text-aurea-navy/50">(usuario)</span>
            </label>
            <div className="relative">
              <Mail className={CLASE_ICONO} aria-hidden="true" />
              <input
                id={`${idForm}-correo`}
                type="email"
                required
                disabled={!!empleadoAEditar}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="cmendoza@local.pe"
                className={CLASE_CONTROL}
              />
            </div>
            {empleadoAEditar && <p className="mt-1 text-xs text-aurea-navy/50">El usuario no se puede cambiar.</p>}
          </div>

          <div>
            <label htmlFor={`${idForm}-tel`} className={CLASE_ROTULO}>
              Celular / WhatsApp
            </label>
            <div className="relative">
              <Phone className={CLASE_ICONO} aria-hidden="true" />
              <input
                id={`${idForm}-tel`}
                type="tel"
                inputMode="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 987 654 321"
                className={cn(CLASE_CONTROL, 'font-mono')}
              />
            </div>
          </div>
        </div>

        {!empleadoAEditar && (
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-aurea-navy select-none">
            <input
              type="checkbox"
              checked={enviarBienvenida}
              onChange={(e) => setEnviarBienvenida(e.target.checked)}
              className="w-5 h-5 rounded accent-aurea-copper"
            />
            Enviarle un correo de bienvenida con su acceso
          </label>
        )}
      </form>
    </Modal>
  );
};
