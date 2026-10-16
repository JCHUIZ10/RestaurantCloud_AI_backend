import React, { useState, useEffect } from 'react';
import {
  LocalItemDTO,
  ModoAdministracionLocal,
  ActualizarLocalRequestDTO,
  AdministradorResumenDTO,
} from '@/types/propietarioLocales';
import { propietarioLocalesService } from '../../services/propietarioLocalesService';
import { Button } from '@/components/ui/Button';
import {
  X,
  Building2,
  MapPin,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  Save,
} from 'lucide-react';

interface ModalEditarLocalProps {
  isOpen: boolean;
  local: LocalItemDTO | null;
  onClose: () => void;
  onLocalActualizado: () => void;
  mostrarToast: (tipo: 'success' | 'error', mensaje: string) => void;
}

import {
  DEPARTAMENTOS_PERU,
  DISTRITOS_PERU,
  DEFAULT_DEPARTAMENTO_COD,
  DEFAULT_PROVINCIA_COD,
  DEFAULT_DISTRITO_COD,
  getProvinciasByDepartamento,
  getDistritosByProvincia,
  getUbigeoCompleto,
} from '../../services/propietarioLocalesService';

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

export const ModalEditarLocal: React.FC<ModalEditarLocalProps> = ({
  isOpen,
  local,
  onClose,
  onLocalActualizado,
  mostrarToast,
}) => {
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [direccion, setDireccion] = useState('');

  // Estados Geográficos UBIGEO
  const [departamentoCod, setDepartamentoCod] = useState(DEFAULT_DEPARTAMENTO_COD);
  const [provinciaCod, setProvinciaCod] = useState(DEFAULT_PROVINCIA_COD);
  const [distritoCod, setDistritoCod] = useState(DEFAULT_DISTRITO_COD);

  const [telefono, setTelefono] = useState('');
  const [modoAdmin, setModoAdmin] = useState<ModoAdministracionLocal>('propietario');
  const [adminId, setAdminId] = useState<string>('');

  const [verificandoSlug, setVerificandoSlug] = useState(false);
  const [slugDisponible, setSlugDisponible] = useState<boolean | null>(true);
  const [slugSugerencia, setSlugSugerencia] = useState<string | null>(null);
  const [slugMensaje, setSlugMensaje] = useState<string>('');

  const [adminsDisponibles, setAdminsDisponibles] = useState<AdministradorResumenDTO[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Listas en cascada reactivas
  const provinciasDisponibles = getProvinciasByDepartamento(departamentoCod);
  const distritosDisponibles = getDistritosByProvincia(provinciaCod);
  const ubigeoActual = getUbigeoCompleto(distritoCod);
  const distritoNombre = ubigeoActual?.distrito.nombre || local?.distrito || 'Chimbote';
  const provinciaNombre = ubigeoActual?.provincia.nombre || local?.provincia || 'Santa';
  const departamentoNombre = ubigeoActual?.departamento.nombre || local?.departamento || 'Áncash';

  const handleDepartamentoChange = (nuevoDepCod: string) => {
    setDepartamentoCod(nuevoDepCod);
    const nuevasProvs = getProvinciasByDepartamento(nuevoDepCod);
    if (nuevasProvs.length > 0) {
      const primerProv = nuevasProvs[0];
      setProvinciaCod(primerProv.codigo);
      const nuevosDists = getDistritosByProvincia(primerProv.codigo);
      if (nuevosDists.length > 0) {
        setDistritoCod(nuevosDists[0].codigo);
      }
    }
  };

  const handleProvinciaChange = (nuevaProvCod: string) => {
    setProvinciaCod(nuevaProvCod);
    const nuevosDists = getDistritosByProvincia(nuevaProvCod);
    if (nuevosDists.length > 0) {
      setDistritoCod(nuevosDists[0].codigo);
    }
  };

  useEffect(() => {
    if (isOpen && local) {
      setNombre(local.nombre);
      setSlug(local.slug);
      setDireccion(local.direccion);

      // Resolver UBIGEO del local
      let distFound = null;
      if (local.ubigeo_cod) {
        distFound = DISTRITOS_PERU.find((d) => d.codigo === local.ubigeo_cod);
      } else {
        distFound = DISTRITOS_PERU.find(
          (d) => d.nombre.toLowerCase() === local.distrito.toLowerCase()
        );
      }

      if (distFound) {
        setDepartamentoCod(distFound.departamento_codigo);
        setProvinciaCod(distFound.provincia_codigo);
        setDistritoCod(distFound.codigo);
      } else {
        setDepartamentoCod(DEFAULT_DEPARTAMENTO_COD);
        setProvinciaCod(DEFAULT_PROVINCIA_COD);
        setDistritoCod(DEFAULT_DISTRITO_COD);
      }

      setTelefono(local.telefono);
      setModoAdmin(local.es_autogestionado ? 'propietario' : 'asignar_admin');
      setAdminId(local.administrador?.id || '');
      setSlugDisponible(true);
      setSlugSugerencia(null);
      setSlugMensaje('');

      propietarioLocalesService.verificarDisponibilidad().then((res) => {
        if (res.exito && res.datos) {
          setAdminsDisponibles(res.datos.administradores_disponibles);
          if (!local.es_autogestionado && !local.administrador && res.datos.administradores_disponibles.length > 0) {
            setAdminId(res.datos.administradores_disponibles[0].id);
          }
        }
      });
    }
  }, [isOpen, local]);

  const handleComprobarSlug = async () => {
    if (!slug.trim() || !local) return;
    setVerificandoSlug(true);
    try {
      const res = await propietarioLocalesService.verificarSlug(slug.trim(), local.id);
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
      setSlugMensaje('Enlace web disponible.');
    }
  };

  const puedeGuardar =
    nombre.trim().length >= 3 &&
    slug.trim().length >= 3 &&
    slugDisponible === true &&
    direccion.trim().length >= 5 &&
    distritoNombre.trim().length > 0 &&
    telefono.trim().length >= 7 &&
    (modoAdmin === 'propietario' || (modoAdmin === 'asignar_admin' && !!adminId));

  const handleGuardar = async () => {
    if (!puedeGuardar || !local) return;
    setGuardando(true);
    try {
      const req: ActualizarLocalRequestDTO = {
        nombre: nombre.trim(),
        slug: slug.trim().toLowerCase(),
        direccion: direccion.trim(),
        ubigeo_cod: distritoCod,
        departamento: departamentoNombre,
        provincia: provinciaNombre,
        distrito: distritoNombre,
        ciudad: provinciaNombre === 'Santa' ? 'Chimbote' : distritoNombre,
        telefono: telefono.trim(),
        modo_administracion: modoAdmin,
        administrador_usuario_id: modoAdmin === 'asignar_admin' ? adminId : null,
      };

      const res = await propietarioLocalesService.actualizarLocal(local.id, req);
      if (res.exito && res.datos) {
        mostrarToast('success', `Sede "${res.datos.nombre}" actualizada correctamente.`);
        onLocalActualizado();
        onClose();
      } else {
        const err = res.errores?.[0]?.mensaje || 'No se pudo actualizar la sede.';
        mostrarToast('error', err);
      }
    } catch {
      mostrarToast('error', 'Ocurrió un error inesperado al actualizar la sede.');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen || !local) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-aurea-navy/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl border-2 border-aurea-copper/30 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="bg-aurea-ivory/60 border-b border-aurea-copper/20 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-gold/15 text-aurea-navy border border-aurea-gold/30">
              <Building2 className="w-5 h-5 text-aurea-navy" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-aurea-navy">
                Editar Datos de la Sede
              </h3>
              <p className="text-xs text-aurea-navy/60">
                {local.nombre} &bull; {local.distrito}
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

        {/* Form Body */}
        <div className="p-6 max-h-[calc(85vh-180px)] overflow-y-auto space-y-4">
          {/* Nombre Comercial */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Nombre Comercial de la Sede <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Dirección web de la carta digital <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center rounded-xl border border-aurea-copper/30 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-aurea-gold/50 focus-within:border-aurea-copper">
                <span className="bg-aurea-ivory/80 px-3 py-2 text-xs text-aurea-navy/60 font-mono border-r border-aurea-copper/20 select-none hidden sm:inline">
                  app.restaurantcloud.pe/sede/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugDisponible(null);
                    setSlugSugerencia(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono text-aurea-navy bg-transparent focus:outline-none"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleComprobarSlug}
                disabled={verificandoSlug || !slug.trim()}
                className="shrink-0 text-xs px-3 py-2 border-aurea-copper/40 text-aurea-navy hover:bg-aurea-ivory flex items-center gap-1.5"
              >
                {verificandoSlug ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Comprobar</span>
              </Button>
            </div>

            {/* Slug Feedback */}
            <div className="mt-1.5 text-xs">
              {slugDisponible === true && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{slugMensaje || 'Enlace disponible y válido'}</span>
                </div>
              )}
              {slugDisponible === false && (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{slugMensaje}</span>
                  </div>
                  {slugSugerencia && (
                    <div className="flex items-center gap-2">
                      <span>Sugerencia:</span>
                      <button
                        type="button"
                        onClick={aplicarSugerenciaSlug}
                        className="px-2 py-0.5 text-xs font-mono font-semibold bg-amber-200 text-amber-950 rounded hover:bg-amber-300"
                      >
                        {slugSugerencia}
                      </button>
                    </div>
                  )}
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
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
              />
            </div>
          </div>

          {/* Ubicación Territorial Nacional (UBIGEO INEI / SUNAT) */}
          <div className="space-y-3 p-4 rounded-2xl bg-aurea-ivory/40 border border-aurea-copper/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurea-navy uppercase tracking-wider">
                Ubicación Territorial (Perú) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-aurea-gold/20 text-aurea-navy border border-aurea-gold/40">
                UBIGEO: {distritoCod}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Departamento */}
              <div>
                <label className="block text-[11px] font-semibold text-aurea-navy/80 mb-1">
                  Región / Departamento
                </label>
                <select
                  value={departamentoCod}
                  onChange={(e) => handleDepartamentoChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50"
                >
                  {DEPARTAMENTOS_PERU.map((dep) => (
                    <option key={dep.codigo} value={dep.codigo}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-[11px] font-semibold text-aurea-navy/80 mb-1">
                  Provincia
                </label>
                <select
                  value={provinciaCod}
                  onChange={(e) => handleProvinciaChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50"
                >
                  {provinciasDisponibles.map((prov) => (
                    <option key={prov.codigo} value={prov.codigo}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Distrito */}
              <div>
                <label className="block text-[11px] font-semibold text-aurea-navy/80 mb-1">
                  Distrito
                </label>
                <select
                  value={distritoCod}
                  onChange={(e) => setDistritoCod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50"
                >
                  {distritosDisponibles.map((dist) => (
                    <option key={dist.codigo} value={dist.codigo}>
                      {dist.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-aurea-navy/60 italic">
              📍 Ubicado en: <strong>{distritoNombre}</strong>, Provincia de{' '}
              <strong>{provinciaNombre}</strong>, Región <strong>{departamentoNombre}</strong>.
            </p>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Teléfono de Contacto <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-aurea-navy/40 absolute left-3.5 top-3" />
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-aurea-copper/30 bg-white focus:outline-none focus:ring-2 focus:ring-aurea-gold/50 focus:border-aurea-copper transition-all"
              />
            </div>
          </div>

          {/* Modo de Supervisión */}
          <div className="p-4 rounded-2xl bg-aurea-ivory/50 border border-aurea-copper/25 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-aurea-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                Supervisión de la Sede
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-aurea-copper/20 bg-white hover:bg-aurea-gold/5 cursor-pointer">
                <input
                  type="radio"
                  name="editSupervision"
                  checked={modoAdmin === 'propietario'}
                  onChange={() => setModoAdmin('propietario')}
                  className="text-aurea-gold focus:ring-aurea-gold"
                />
                <span className="text-xs font-semibold text-aurea-navy">
                  👑 Administrada directamente por mí (Autogestionado)
                </span>
              </label>

              <label className="flex flex-col gap-2 p-2.5 rounded-xl border border-aurea-copper/20 bg-white hover:bg-aurea-gold/5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="editSupervision"
                    checked={modoAdmin === 'asignar_admin'}
                    onChange={() => setModoAdmin('asignar_admin')}
                    className="text-aurea-gold focus:ring-aurea-gold"
                  />
                  <span className="text-xs font-semibold text-aurea-navy">
                    👤 Asignar a un Administrador de Local
                  </span>
                </div>

                {modoAdmin === 'asignar_admin' && (
                  <div className="pl-6 pt-1">
                    {adminsDisponibles.length > 0 ? (
                      <select
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-aurea-copper/30 bg-white focus:outline-none"
                      >
                        {adminsDisponibles.map((adm) => (
                          <option key={adm.id} value={adm.id}>
                            {adm.nombre} ({adm.correo})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-amber-800">
                        No hay administradores registrados actualmente.
                      </span>
                    )}
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-aurea-ivory/60 border-t border-aurea-copper/20 px-6 py-4 flex items-center justify-between">
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
            onClick={handleGuardar}
            disabled={!puedeGuardar || guardando}
            className="text-xs px-5 py-2.5 bg-aurea-navy hover:bg-aurea-navy/90 text-white font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-aurea-gold" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
