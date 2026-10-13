import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  UtensilsCrossed,
  ChefHat,
  Banknote,
  CheckCircle2,
  Copy,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  RolEmpleadoOperativo,
  RegistrarEmpleadoRequestDTO,
  ActualizarEmpleadoRequestDTO,
  EmpleadoResumenDTO,
  EmpleadoDetalleDTO,
} from '@/types/admin';

interface ModalRegistrarEditarEmpleadoProps {
  abierto: boolean;
  onCerrar: () => void;
  empleadoAEditar?: EmpleadoResumenDTO | null;
  onGuardarNuevo: (req: RegistrarEmpleadoRequestDTO) => Promise<EmpleadoDetalleDTO | null>;
  onGuardarEdicion: (id: string, req: ActualizarEmpleadoRequestDTO) => Promise<boolean>;
}

export const ModalRegistrarEditarEmpleado: React.FC<ModalRegistrarEditarEmpleadoProps> = ({
  abierto,
  onCerrar,
  empleadoAEditar,
  onGuardarNuevo,
  onGuardarEdicion,
}) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('+51 ');
  const [rol, setRol] = useState<RolEmpleadoOperativo>('mozo');
  const [enviarBienvenida, setEnviarBienvenida] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Estado para visualización post-creación exitosa con clave generada
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

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setErrorValidacion('Por favor ingresa el nombre completo del colaborador (mínimo 3 caracteres).');
      return;
    }

    if (!correo.trim() || !correo.includes('@')) {
      setErrorValidacion('Ingresa un correo electrónico válido para el acceso.');
      return;
    }

    const cleanTel = telefono.replace(/\D/g, '');
    if (cleanTel.length < 9) {
      setErrorValidacion('Ingresa un número telefónico o celular válido (+51 9 dígitos).');
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
          // Mostrar pantalla de éxito con la clave autogenerada
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-aurea-champagne/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aurea-champagne/40 text-aurea-copper flex items-center justify-center border border-aurea-copper/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-aurea-navy">
                {empleadoCreado
                  ? '¡Colaborador Registrado Exitosamente!'
                  : empleadoAEditar
                  ? 'Modificar Datos de Colaborador'
                  : 'Registrar Nuevo Colaborador'}
              </h2>
              <p className="text-xs text-slate-500">
                {empleadoCreado
                  ? 'Credenciales de acceso provisionales listas para compartir'
                  : 'Asignación de rol operativo y credenciales de acceso a la sede'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO 1: PANTALLA DE ÉXITO CON CREDENCIALES GENERADAS */}
        {empleadoCreado ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {empleadoCreado.nombre} ya tiene acceso a la sede
                </p>
                <p className="text-xs text-emerald-700/90 mt-0.5">
                  Se ha generado una clave provisional segura y el cupo en el Plan Pro ha sido asignado.
                </p>
              </div>
            </div>

            {/* Credenciales destacadas */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Correo / Usuario:</span>
                <span className="font-mono font-semibold text-aurea-navy">
                  {empleadoCreado.correo}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Clave Provisional:</span>
                <span className="font-mono font-bold text-lg text-aurea-copper bg-white px-2.5 py-0.5 rounded-md border border-aurea-copper/30">
                  {empleadoCreado.password_temporal}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Rol Asignado:</span>
                <span className="font-semibold text-aurea-navy uppercase">
                  {empleadoCreado.rol}
                </span>
              </div>
            </div>

            {/* Botones de acción directa */}
            <div className="space-y-2">
              <a
                href={empleadoCreado.enlace_whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Credenciales por WhatsApp Directo</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copiarCredenciales}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiado ? '¡Copiado al portapapeles!' : 'Copiar Texto de Acceso'}</span>
                </button>
                <button
                  type="button"
                  onClick={onCerrar}
                  className="px-4 py-2 rounded-xl bg-aurea-navy text-white text-xs font-semibold hover:bg-aurea-navy/90"
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CONTENIDO 2: FORMULARIO ÁGIL DE ALTA O EDICIÓN */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorValidacion && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorValidacion}</span>
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy mb-1 uppercase tracking-wider">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Mendoza Huamán"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper"
                />
              </div>
            </div>

            {/* Correo y Teléfono en dos columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-aurea-navy mb-1 uppercase tracking-wider">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={!!empleadoAEditar}
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="cmendoza@aurea.pe"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                {empleadoAEditar && (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    El correo es el identificador único del usuario.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-aurea-navy mb-1 uppercase tracking-wider">
                  Celular / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper"
                  />
                </div>
              </div>
            </div>

            {/* Selector de Rol Operativo */}
            <div>
              <label className="block text-xs font-bold text-aurea-navy mb-1.5 uppercase tracking-wider">
                Rol Operativo de Sede *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Mozo */}
                <button
                  type="button"
                  onClick={() => setRol('mozo')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    rol === 'mozo'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        rol === 'mozo' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}
                    >
                      {rol === 'mozo' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-blue-950 block">Mozo de Salón</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Mesas, comandas y pedidos de salón
                    </span>
                  </div>
                </button>

                {/* Cocina */}
                <button
                  type="button"
                  onClick={() => setRol('cocina')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    rol === 'cocina'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ChefHat className="w-4 h-4 text-amber-600" />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        rol === 'cocina' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                      }`}
                    >
                      {rol === 'cocina' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-amber-950 block">Cocina (KDS)</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Pantalla KDS, tiempos y despacho
                    </span>
                  </div>
                </button>

                {/* Cajero */}
                <button
                  type="button"
                  onClick={() => setRol('cajero')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    rol === 'cajero'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        rol === 'cajero' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}
                    >
                      {rol === 'cajero' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-emerald-950 block">Cajero</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Cobro, comprobantes y arqueo
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Aviso de seguridad RBAC */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
              <span>
                <strong>Seguridad RBAC:</strong> Como Administrador de Local, puedes asignar roles de salón, cocina y caja. La creación de administradores corresponde a la Consola del Propietario.
              </span>
            </div>

            {/* Checkbox de bienvenida */}
            {!empleadoAEditar && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none pt-1">
                <input
                  type="checkbox"
                  checked={enviarBienvenida}
                  onChange={(e) => setEnviarBienvenida(e.target.checked)}
                  className="rounded-sm border-slate-300 text-aurea-copper focus:ring-aurea-copper/30"
                />
                <span>Enviar correo de bienvenida con credenciales automáticas</span>
              </label>
            )}

            {/* Botones inferiores */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {guardando
                  ? 'Guardando...'
                  : empleadoAEditar
                  ? 'Actualizar Datos'
                  : 'Guardar Colaborador'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
