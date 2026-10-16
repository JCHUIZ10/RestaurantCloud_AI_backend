import React, { useState, useEffect } from 'react';
import {
  GiroNegocioLocal,
  ModoAdministracionLocal,
  CrearLocalRequestDTO,
  AdministradorResumenDTO,
  CuotaPlanLocalesDTO,
} from '@/types/propietarioLocales';
import { propietarioLocalesService } from '../../services/propietarioLocalesService';
import { Button } from '@/components/ui/Button';
import {
  X,
  Building2,
  Globe,
  MapPin,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from 'lucide-react';

interface ModalCrearLocalProps {
  isOpen: boolean;
  onClose: () => void;
  cuotaPlan: CuotaPlanLocalesDTO | null;
  onLocalCreado: () => void;
  mostrarToast: (tipo: 'success' | 'error', mensaje: string) => void;
}

const DISTRITOS_LIMA = [
  'Miraflores',
  'San Isidro',
  'Santiago de Surco',
  'San Borja',
  'Barranco',
  'La Molina',
  'Magdalena del Mar',
  'Pueblo Libre',
  'Jesús María',
  'Lince',
  'Surquillo',
  'San Miguel',
  'Cercado de Lima',
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const ModalCrearLocal: React.FC<ModalCrearLocalProps> = ({
  isOpen,
  onClose,
  cuotaPlan,
  onLocalCreado,
  mostrarToast,
}) => {
  const [paso, setPaso] = useState<1 | 2>(1);

  // Form State
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [distrito, setDistrito] = useState('San Borja');
  const [telefono, setTelefono] = useState('');
  const [modoAdmin, setModoAdmin] = useState<ModoAdministracionLocal>('propietario');
  const [adminId, setAdminId] = useState<string>('');
  const [giroNegocio, setGiroNegocio] = useState<GiroNegocioLocal>('polleria');

  // Slug check state
  const [verificandoSlug, setVerificandoSlug] = useState(false);
  const [slugDisponible, setSlugDisponible] = useState<boolean | null>(null);
  const [slugSugerencia, setSlugSugerencia] = useState<string | null>(null);
  const [slugMensaje, setSlugMensaje] = useState<string>('');

  // Admins state
  const [adminsDisponibles, setAdminsDisponibles] = useState<AdministradorResumenDTO[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Cargar administradores al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setNombre('');
      setSlug('');
      setSlugEditadoManualmente(false);
      setDireccion('');
      setDistrito('San Borja');
      setTelefono('');
      setModoAdmin('propietario');
      setAdminId('');
      setGiroNegocio('polleria');
      setSlugDisponible(null);
      setSlugSugerencia(null);
      setSlugMensaje('');

      propietarioLocalesService.verificarDisponibilidad().then((res) => {
        if (res.exito && res.datos) {
          setAdminsDisponibles(res.datos.administradores_disponibles);
          if (res.datos.administradores_disponibles.length > 0) {
            setAdminId(res.datos.administradores_disponibles[0].id);
          }
        }
      });
    }
  }, [isOpen]);

  // Autogenerar slug predictivo cuando cambia nombre o distrito (si no fue desacoplado manualmente)
  useEffect(() => {
    if (!slugEditadoManualmente && nombre.trim().length > 0) {
      const sugerido = `${slugify(nombre)}${distrito ? '-' + slugify(distrito) : ''}`;
      setSlug(sugerido);
      // Validar reactivamente
      propietarioLocalesService.verificarSlug(sugerido).then((res) => {
        if (res.exito && res.datos) {
          setSlugDisponible(res.datos.disponible);
          setSlugSugerencia(res.datos.sugerencia);
          setSlugMensaje(res.datos.mensaje);
        }
      });
    }
  }, [nombre, distrito, slugEditadoManualmente]);

  const handleComprobarSlug = async () => {
    if (!slug.trim()) return;
    setVerificandoSlug(true);
    try {
      const res = await propietarioLocalesService.verificarSlug(slug.trim());
      if (res.exito && res.datos) {
        setSlugDisponible(res.datos.disponible);
        setSlugSugerencia(res.datos.sugerencia);
        setSlugMensaje(res.datos.mensaje);
      }
    } finally {
      setVerificandoSlug(false);
    }
  };

  const aplicarSugerenciaSlug = () => {
    if (slugSugerencia) {
      setSlug(slugSugerencia);
      setSlugDisponible(true);
      setSlugSugerencia(null);
      setSlugMensaje('Enlace web disponible para la carta digital.');
    }
  };

  const puedeAvanzarPaso1 =
    nombre.trim().length >= 3 &&
    slug.trim().length >= 3 &&
    slugDisponible === true &&
    direccion.trim().length >= 5 &&
    distrito.trim().length > 0 &&
    telefono.trim().length >= 7 &&
    (modoAdmin === 'propietario' || (modoAdmin === 'asignar_admin' && !!adminId));

  const handleCrearSede = async () => {
    if (!puedeAvanzarPaso1) return;
    setGuardando(true);
    try {
      const req: CrearLocalRequestDTO = {
        nombre: nombre.trim(),
        slug: slug.trim().toLowerCase(),
        direccion: direccion.trim(),
        distrito: distrito.trim(),
        ciudad: 'Lima',
        telefono: telefono.trim(),
        modo_administracion: modoAdmin,
        administrador_usuario_id: modoAdmin === 'asignar_admin' ? adminId : null,
        giro_negocio: giroNegocio,
      };

      const res = await propietarioLocalesService.crearLocal(req);
      if (res.exito && res.datos) {
        mostrarToast(
          'success',
          `¡Sede "${res.datos.nombre}" creada y aprovisionada con éxito! (Salón Principal y carta inicial activos)`
        );
        onLocalCreado();
        onClose();
      } else {
        const err = res.errores?.[0]?.mensaje || 'No se pudo crear la sede.';
        mostrarToast('error', err);
      }
    } catch {
      mostrarToast('error', 'Ocurrió un error inesperado al registrar el local.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop difuminado */}
      <div
        className="fixed inset-0 bg-aurea-navy/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-aurea-copper/30 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header con Stepper */}
        <div className="bg-aurea-ivory/60 border-b border-aurea-copper/20 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-aurea-gold/15 text-aurea-navy border border-aurea-gold/30">
                <Building2 className="w-5 h-5 text-aurea-navy" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-aurea-navy">
                  Registrar Nueva Sede
                </h3>
                <p className="text-xs text-aurea-navy/60">
                  {paso === 1
                    ? 'Paso 1 de 2: Datos Comerciales & Enlace Web'
                    : 'Paso 2 de 2: Giro Gastronómico & Plantilla'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-aurea-navy/50 hover:text-aurea-navy hover:bg-aurea-copper/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper visual */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-aurea-copper/15">
            <div
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                paso === 1
                  ? 'bg-aurea-navy text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {paso > 1 ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-white/20 text-center leading-4 text-[10px]">
                  1
                </span>
              )}
              <span>(1) Datos de Sede</span>
            </div>

            <div className="flex-1 h-0.5 bg-aurea-copper/20" />

            <div
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                paso === 2
                  ? 'bg-aurea-navy text-white'
                  : 'bg-aurea-ivory text-aurea-navy/60 border border-aurea-copper/20'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-center leading-4 text-[10px]">
                2
              </span>
              <span>(2) Giro Gastronómico</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[calc(85vh-200px)] overflow-y-auto space-y-6">
          {paso === 1 ? (
            /* ================================================================= */
            /* PASO 1: DATOS COMERCIALES Y ENLACE WEB                            */
            /* ================================================================= */
            <div className="space-y-5">
              {/* Reminder de Cuota */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Consumirás <strong>1</strong> de los{' '}
                  <strong>{cuotaPlan?.cupos_disponibles ?? 1} cupos disponibles</strong> en tu
                  Plan Pro (Máximo {cuotaPlan?.locales_permitidos ?? 3} locales).
                </span>
              </div>

              {/* Nombre Comercial */}
              <div>
                <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Nombre Comercial del Local / Sede <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. ÁUREA San Isidro o Brasas Gourmet Surco"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
                />
              </div>

              {/* Dirección Web / Slug de la Carta Digital */}
              <div>
                <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Dirección web de tu carta digital (Enlace público para comensales y QR){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center rounded-xl border border-aurea-copper/30 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-aurea-gold/50 focus-within:border-aurea-copper">
                    <span className="bg-aurea-ivory/80 px-3 py-2.5 text-xs text-aurea-navy/60 font-mono border-r border-aurea-copper/20 select-none hidden sm:inline">
                      app.restaurantcloud.pe/sede/
                    </span>
                    <input
                      type="text"
                      placeholder="nombre-de-tu-sede"
                      value={slug}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                        setSlugEditadoManualmente(true);
                        setSlugDisponible(null);
                        setSlugSugerencia(null);
                        setSlugMensaje('');
                      }}
                      className="w-full px-3 py-2.5 text-xs font-mono text-aurea-navy bg-transparent focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleComprobarSlug}
                    disabled={verificandoSlug || !slug.trim()}
                    className="shrink-0 text-xs px-3.5 py-2.5 border-aurea-copper/40 text-aurea-navy hover:bg-aurea-ivory flex items-center gap-1.5"
                  >
                    {verificandoSlug ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Comprobar</span>
                  </Button>
                </div>

                {/* Feedback predictivo del Slug */}
                <div className="mt-2 text-xs">
                  {slugDisponible === true && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{slugMensaje || 'Enlace disponible para tu restaurante'}</span>
                    </div>
                  )}

                  {slugDisponible === false && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{slugMensaje}</span>
                      </div>
                      {slugSugerencia && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-amber-800">Sugerencia:</span>
                          <button
                            type="button"
                            onClick={aplicarSugerenciaSlug}
                            className="px-2.5 py-1 text-xs font-mono font-semibold bg-amber-200/70 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors"
                          >
                            Usar: {slugSugerencia}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {slugEditadoManualmente && slugDisponible === null && (
                    <div className="text-aurea-navy/60 italic text-[11px]">
                      ℹ️ Pulsa &quot;Comprobar&quot; para verificar que el enlace web esté disponible.
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección Física */}
              <div>
                <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Dirección Física <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Ej. Av. Primavera 1230, Of. 4"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
                  />
                </div>
              </div>

              {/* Distrito y Teléfono en dos columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                    Distrito <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
                  >
                    {DISTRITOS_LIMA.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
                    Teléfono de Contacto <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Ej. +51 1 221-3410 o 987 654 321"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Supervisión y Asignación del Local */}
              <div className="p-4 rounded-2xl bg-aurea-ivory/50 border border-aurea-copper/25 space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-aurea-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                    Supervisión y Administración Operativa
                  </span>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-aurea-copper/20 bg-white hover:bg-aurea-gold/5 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="supervision"
                      checked={modoAdmin === 'propietario'}
                      onChange={() => setModoAdmin('propietario')}
                      className="mt-1 text-aurea-gold focus:ring-aurea-gold"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-aurea-navy flex items-center gap-1.5">
                        <span>👑 Administraré yo mismo esta sede (Autogestionado)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-aurea-navy/60 mt-0.5">
                        Tendrás acceso directo e instantáneo a la operativa de esta sede desde tu
                        directorio. No consume licencias de personal adicionales.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-aurea-copper/20 bg-white hover:bg-aurea-gold/5 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="supervision"
                      checked={modoAdmin === 'asignar_admin'}
                      onChange={() => setModoAdmin('asignar_admin')}
                      className="mt-1 text-aurea-gold focus:ring-aurea-gold"
                    />
                    <div className="text-xs flex-1">
                      <div className="font-bold text-aurea-navy">
                        👤 Asignar a un Administrador de Local de mi equipo
                      </div>
                      <p className="text-aurea-navy/60 mt-0.5">
                        Delega la apertura de caja, control de comanda y reportes de turno a un
                        administrador específico.
                      </p>

                      {modoAdmin === 'asignar_admin' && (
                        <div className="mt-3 pt-3 border-t border-aurea-copper/15">
                          {adminsDisponibles.length > 0 ? (
                            <select
                              value={adminId}
                              onChange={(e) => setAdminId(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50"
                            >
                              {adminsDisponibles.map((adm) => (
                                <option key={adm.id} value={adm.id}>
                                  {adm.nombre} ({adm.correo})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                              ⚠️ No hay administradores adicionales registrados. Podrás crear y
                              asignar uno después desde el panel de Equipo.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* PASO 2: GIRO GASTRONÓMICO Y PLANTILLA INICIAL                     */
            /* ================================================================= */
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-aurea-ivory/80 border border-aurea-copper/25 text-xs text-aurea-navy space-y-1">
                <p className="font-semibold">
                  Selecciona la plantilla culinaria base para inicializar tu sede.
                </p>
                <p className="text-aurea-navy/70 text-[11px]">
                  RestaurantCloud aprovisionará automáticamente el Salón Principal (5x3 mesas),
                  categorías de carta e insumos de inventario correspondientes.
                </p>
              </div>

              {/* 4 Cards de Giros Gastronómicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Pollería */}
                <div
                  onClick={() => setGiroNegocio('polleria')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    giroNegocio === 'polleria'
                      ? 'border-aurea-gold bg-aurea-gold/10 shadow-sm'
                      : 'border-aurea-copper/20 bg-white hover:border-aurea-copper/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-aurea-navy flex items-center gap-2">
                      <span>🍗</span> Pollería & Brasas
                    </span>
                    <input
                      type="radio"
                      checked={giroNegocio === 'polleria'}
                      onChange={() => setGiroNegocio('polleria')}
                      className="text-aurea-gold focus:ring-aurea-gold"
                    />
                  </div>
                  <div className="text-xs space-y-1.5 text-aurea-navy/80">
                    <p>
                      <strong>Categorías (5):</strong> Pollos a la brasa, Guarniciones, Ensaladas,
                      Bebidas, Cremas.
                    </p>
                    <p className="text-[11px] text-aurea-navy/60">
                      <strong>Insumos (15):</strong> Pollo fresco, papa canchán, carbón, ají amarillo,
                      aceite vegetal...
                    </p>
                  </div>
                </div>

                {/* Cevichería */}
                <div
                  onClick={() => setGiroNegocio('cevicheria')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    giroNegocio === 'cevicheria'
                      ? 'border-aurea-gold bg-aurea-gold/10 shadow-sm'
                      : 'border-aurea-copper/20 bg-white hover:border-aurea-copper/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-aurea-navy flex items-center gap-2">
                      <span>🐟</span> Cevichería & Mariscos
                    </span>
                    <input
                      type="radio"
                      checked={giroNegocio === 'cevicheria'}
                      onChange={() => setGiroNegocio('cevicheria')}
                      className="text-aurea-gold focus:ring-aurea-gold"
                    />
                  </div>
                  <div className="text-xs space-y-1.5 text-aurea-navy/80">
                    <p>
                      <strong>Categorías (5):</strong> Ceviches, Causas, Arroces marinos,
                      Chicharrones, Bebidas.
                    </p>
                    <p className="text-[11px] text-aurea-navy/60">
                      <strong>Insumos (15):</strong> Pescado blanco, limón sutil, choclo desgranado,
                      camote, mariscos...
                    </p>
                  </div>
                </div>

                {/* Chifa */}
                <div
                  onClick={() => setGiroNegocio('chifa')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    giroNegocio === 'chifa'
                      ? 'border-aurea-gold bg-aurea-gold/10 shadow-sm'
                      : 'border-aurea-copper/20 bg-white hover:border-aurea-copper/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-aurea-navy flex items-center gap-2">
                      <span>🥢</span> Chifa & Comida China
                    </span>
                    <input
                      type="radio"
                      checked={giroNegocio === 'chifa'}
                      onChange={() => setGiroNegocio('chifa')}
                      className="text-aurea-gold focus:ring-aurea-gold"
                    />
                  </div>
                  <div className="text-xs space-y-1.5 text-aurea-navy/80">
                    <p>
                      <strong>Categorías (5):</strong> Wantanes, Arroz Chaufa, Tallarines Saltados,
                      Sopas, Especiales.
                    </p>
                    <p className="text-[11px] text-aurea-navy/60">
                      <strong>Insumos (15):</strong> Arroz grano largo, sillao, pechuga de pollo,
                      cebolla china, kion...
                    </p>
                  </div>
                </div>

                {/* Totalmente en Blanco */}
                <div
                  onClick={() => setGiroNegocio('en_blanco')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    giroNegocio === 'en_blanco'
                      ? 'border-aurea-gold bg-aurea-gold/10 shadow-sm'
                      : 'border-aurea-copper/20 bg-white hover:border-aurea-copper/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-aurea-navy flex items-center gap-2">
                      <span>⚪</span> Totalmente en Blanco
                    </span>
                    <input
                      type="radio"
                      checked={giroNegocio === 'en_blanco'}
                      onChange={() => setGiroNegocio('en_blanco')}
                      className="text-aurea-gold focus:ring-aurea-gold"
                    />
                  </div>
                  <div className="text-xs space-y-1.5 text-aurea-navy/80">
                    <p>
                      <strong>Sin categorías ni insumos precargados.</strong>
                    </p>
                    <p className="text-[11px] text-aurea-navy/60">
                      Ideal para conceptos culinarios únicos, cafeterías o cartas personalizadas desde
                      cero.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nota de ambiente común */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  En todas las opciones se aprovisionará el <strong>&quot;Salón Principal&quot;</strong> con
                  cuadrícula base de mesas lista para operar.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="bg-aurea-ivory/60 border-t border-aurea-copper/20 px-6 py-4 flex items-center justify-between">
          {paso === 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs text-aurea-navy/70 hover:bg-aurea-copper/10"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => setPaso(2)}
                disabled={!puedeAvanzarPaso1}
                className="text-xs px-5 py-2.5 bg-aurea-navy hover:bg-aurea-navy/90 text-white font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span>Siguiente: Elegir Giro</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaso(1)}
                className="text-xs px-4 py-2 border-aurea-copper/40 text-aurea-navy hover:bg-aurea-ivory flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Datos</span>
              </Button>
              <Button
                type="button"
                onClick={handleCrearSede}
                disabled={guardando}
                className="text-xs px-6 py-2.5 bg-aurea-gold hover:bg-aurea-gold/90 text-aurea-navy font-bold flex items-center gap-2 shadow-sm"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aprovisionando Sede...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-aurea-navy" />
                    <span>Crear y Activar Sede</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
