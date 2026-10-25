import React, { useState, useEffect, useId } from 'react';
import { Truck, User, Mail, MapPin, Package, Plus, Check, AlertCircle, MessageCircle } from 'lucide-react';
import {
  ProveedorResumenDTO,
  CrearProveedorRequestDTO,
  ActualizarProveedorRequestDTO,
  InsumoAdminDTO,
} from '@/types/admin';
import {
  extraerDigitosMovilPeru,
  formatearTelefonoPeru,
} from '@/shared/utils/whatsapp';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';

interface ModalCrearEditarProveedorProps {
  abierto: boolean;
  onCerrar: () => void;
  proveedorParaEditar: ProveedorResumenDTO | null;
  catalogoInsumos: InsumoAdminDTO[];
  onGuardar: (
    datos: CrearProveedorRequestDTO | ActualizarProveedorRequestDTO
  ) => Promise<{ success: boolean; mensajeError?: string }>;
}

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';

/** Campo de texto con icono a la izquierda */
const CampoIcono: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icono: typeof User }
> = ({ icono: Icono, className, ...props }) => (
  <div className="relative">
    <Icono className="w-4 h-4 text-aurea-copper absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
    <input className={cn(CLASE_CONTROL, 'pl-10', className)} {...props} />
  </div>
);

export const ModalCrearEditarProveedor: React.FC<ModalCrearEditarProveedorProps> = ({
  abierto,
  onCerrar,
  proveedorParaEditar,
  catalogoInsumos,
  onGuardar,
}) => {
  const esEdicion = Boolean(proveedorParaEditar);
  const idForm = useId();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<string[]>([]);

  // Estados de validación y carga
  const [guardando, setGuardando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [busquedaInsumo, setBusquedaInsumo] = useState('');

  useEffect(() => {
    if (proveedorParaEditar) {
      setNombre(proveedorParaEditar.nombre);
      setContacto(proveedorParaEditar.contacto || '');
      setTelefono(proveedorParaEditar.telefono || '');
      setEmail(proveedorParaEditar.email || '');
      setDireccion(proveedorParaEditar.direccion || '');
      setInsumosSeleccionados(
        (proveedorParaEditar.insumos_habituales || []).map((ih) => ih.insumo_id)
      );
    } else {
      setNombre('');
      setContacto('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setInsumosSeleccionados([]);
    }
    setErrorGlobal(null);
    setBusquedaInsumo('');
  }, [proveedorParaEditar, abierto]);

  const digitosTelefono = extraerDigitosMovilPeru(telefono);
  const telefonoValido = digitosTelefono.length === 9 && digitosTelefono.startsWith('9');

  const toggleInsumo = (insumoId: string) => {
    setInsumosSeleccionados((prev) =>
      prev.includes(insumoId)
        ? prev.filter((id) => id !== insumoId)
        : [...prev, insumoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGlobal(null);

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || nombreLimpio.length < 3) {
      setErrorGlobal('El nombre comercial o razón social debe tener al menos 3 caracteres.');
      return;
    }

    const digitos = extraerDigitosMovilPeru(telefono);
    if (!digitos || digitos.length !== 9) {
      setErrorGlobal('Ingresa un número móvil peruano válido de 9 dígitos para WhatsApp y contacto.');
      return;
    }

    if (!digitos.startsWith('9')) {
      setErrorGlobal('El número de celular debe iniciar con el dígito 9 según el estándar móvil de Perú.');
      return;
    }

    setGuardando(true);

    const payload: CrearProveedorRequestDTO = {
      nombre: nombreLimpio,
      contacto: contacto.trim() || undefined,
      telefono: `+51 ${formatearTelefonoPeru(digitos)}`,
      email: email.trim() || undefined,
      direccion: direccion.trim() || undefined,
      insumos_ids: insumosSeleccionados,
    };

    const res = await onGuardar(payload);
    setGuardando(false);

    if (!res.success) {
      setErrorGlobal(res.mensajeError || 'Ocurrió un error al guardar el proveedor.');
    } else {
      onCerrar();
    }
  };

  // Filtrar insumos disponibles según el buscador local de tags
  const insumosFiltrados = catalogoInsumos.filter((ins) =>
    ins.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase())
  );

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!guardando}
      tamano="lg"
      icono={Truck}
      titulo={esEdicion ? `Editar «${proveedorParaEditar?.nombre ?? ''}»` : 'Nuevo proveedor'}
      descripcion={esEdicion ? undefined : 'Nombre y celular bastan; el RUC no es obligatorio.'}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form={idForm} loading={guardando} leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}>
            {esEdicion ? 'Guardar cambios' : 'Guardar proveedor'}
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-5">
        {errorGlobal && (
          <p
            role="alert"
            className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errorGlobal}
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
            placeholder="Ej. Distribuidora San Fernando, Casero Don Lucho"
            className={cn(CLASE_CONTROL, 'font-medium')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                maxLength={11}
                required
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
              Persona de contacto <span className="font-normal text-aurea-navy/50">(opcional)</span>
            </label>
            <CampoIcono
              id={`${idForm}-contacto`}
              icono={User}
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej. Carlos Meneses"
            />
          </div>
          <div>
            <label htmlFor={`${idForm}-email`} className={CLASE_ROTULO}>
              Correo <span className="font-normal text-aurea-navy/50">(opcional)</span>
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
              Dirección o puesto <span className="font-normal text-aurea-navy/50">(opcional)</span>
            </label>
            <CampoIcono
              id={`${idForm}-dir`}
              icono={MapPin}
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Mdo. Santa Anita, Pab. B, puesto 14"
            />
          </div>
        </div>

        <fieldset className="pt-4 border-t border-aurea-champagne/60 space-y-2">
          <legend className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
              <Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
              Insumos que te vende
            </span>
            <span className="text-xs text-aurea-navy/60">{insumosSeleccionados.length} elegidos</span>
          </legend>
          <input
            type="search"
            value={busquedaInsumo}
            onChange={(e) => setBusquedaInsumo(e.target.value)}
            placeholder="Filtrar insumos"
            aria-label="Filtrar insumos"
            className={cn(CLASE_CONTROL, 'min-h-10')}
          />
          <div className="max-h-44 overflow-y-auto p-2 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 flex flex-wrap gap-1.5">
            {insumosFiltrados.length === 0 ? (
              <span className="text-sm text-aurea-navy/50 p-2">No hay insumos con ese nombre.</span>
            ) : (
              insumosFiltrados.map((ins) => {
                const seleccionado = insumosSeleccionados.includes(ins.id);
                return (
                  <button
                    key={ins.id}
                    type="button"
                    aria-pressed={seleccionado}
                    onClick={() => toggleInsumo(ins.id)}
                    className={cn(
                      'min-h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-sm font-medium transition-colors',
                      seleccionado
                        ? 'bg-aurea-navy text-white shadow-sm'
                        : 'bg-white border border-aurea-champagne text-aurea-navy hover:border-aurea-copper/60'
                    )}
                  >
                    {seleccionado ? (
                      <Check className="w-3.5 h-3.5 text-aurea-champagne" aria-hidden="true" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                    )}
                    {ins.nombre}
                    <span className="text-xs opacity-60 font-mono">{ins.unidad_medida}</span>
                  </button>
                );
              })
            )}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};
