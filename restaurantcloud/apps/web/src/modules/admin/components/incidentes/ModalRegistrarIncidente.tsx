import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Upload,
  FileText,
  Check,
  Zap,
  Trash2,
} from 'lucide-react';
import {
  CategoriaIncidente,
  GravedadIncidente,
  RegistrarIncidenteRequest,
  EmpleadoDetalleDTO,
} from '@/types/admin';

interface ModalRegistrarIncidenteProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (req: RegistrarIncidenteRequest) => Promise<boolean>;
  empleados: EmpleadoDetalleDTO[];
}

export const ModalRegistrarIncidente: React.FC<ModalRegistrarIncidenteProps> = ({
  isOpen,
  onClose,
  onGuardar,
  empleados,
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaIncidente>('caja_dinero');
  const [gravedad, setGravedad] = useState<GravedadIncidente>('media');
  const [fechaHora, setFechaHora] = useState(() => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  });
  const [involucraEmpleado, setInvolucraEmpleado] = useState(false);
  const [empleadoId, setEmpleadoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [medidasInmediatas, setMedidasInmediatas] = useState('');
  const [archivoEvidencia, setArchivoEvidencia] = useState<{ nombre: string; tamano: string } | null>(null);
  const [resolucionInmediata, setResolucionInmediata] = useState(false);
  const [resolucionNota, setResolucionNota] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !guardando) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, guardando]);

  // Si cambia a gravedad alta, no permitir resolución inmediata
  useEffect(() => {
    if (gravedad === 'alta' && resolucionInmediata) {
      setResolucionInmediata(false);
      setResolucionNota('');
    }
  }, [gravedad, resolucionInmediata]);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setCategoria('caja_dinero');
      setGravedad('media');
      const ahora = new Date();
      ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
      setFechaHora(ahora.toISOString().slice(0, 16));
      setInvolucraEmpleado(false);
      setEmpleadoId('');
      setDescripcion('');
      setMedidasInmediatas('');
      setArchivoEvidencia(null);
      setResolucionInmediata(false);
      setResolucionNota('');
      setErrorValidacion(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (titulo.trim().length < 5) {
      setErrorValidacion('El título del incidente debe tener al menos 5 caracteres.');
      return;
    }

    if (descripcion.trim().length < 15) {
      setErrorValidacion('La descripción pormenorizada debe contener al menos 15 caracteres.');
      return;
    }

    if (involucraEmpleado && !empleadoId) {
      setErrorValidacion('Has indicado que involucra a un colaborador, debes seleccionarlo de la lista.');
      return;
    }

    if (resolucionInmediata && resolucionNota.trim().length < 10) {
      setErrorValidacion('Para registrar con resolución inmediata, la nota de resolución debe tener al menos 10 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      const exitoso = await onGuardar({
        titulo: titulo.trim(),
        categoria,
        gravedad,
        fecha_hora: new Date(fechaHora).toISOString(),
        involucra_empleado: involucraEmpleado,
        empleado_id: involucraEmpleado && empleadoId ? empleadoId : null,
        descripcion: descripcion.trim(),
        medidas_inmediatas: medidasInmediatas.trim() || null,
        foto_url: archivoEvidencia ? `privado/empresas/aurea/incidentes/evidencias/${archivoEvidencia.nombre}` : null,
        resolucion_inmediata: resolucionInmediata,
        resolucion_nota: resolucionInmediata ? resolucionNota.trim() : undefined,
      });

      if (exitoso) {
        onClose();
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleSimularCargaArchivo = () => {
    setArchivoEvidencia({
      nombre: `evidencia_incidente_${Date.now().toString().slice(-4)}.jpg`,
      tamano: '1.4 MB',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-registro-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-[700px] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del modal */}
        <div className="p-5 pb-4 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-aurea-navy text-aurea-champagne flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <h2 id="modal-registro-title" className="text-base sm:text-lg font-bold text-aurea-navy">
                Registrar Nuevo Incidente Interno
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Documenta la novedad operativa para trazabilidad, supervisión y remediación en sede.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del formulario con scroll */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorValidacion && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Campo 1: Título */}
          <div className="space-y-1">
            <label htmlFor="incidente-titulo" className="block font-bold text-stone-700">
              Título del Incidente <span className="text-red-500">*</span>
            </label>
            <input
              id="incidente-titulo"
              type="text"
              placeholder="Ej. Diferencia negativa en arqueo de turno tarde"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent text-xs"
              required
            />
          </div>

          {/* Campos 2 y 3: Categoría y Gravedad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="incidente-categoria" className="block font-bold text-stone-700">
                Categoría Operativa <span className="text-red-500">*</span>
              </label>
              <select
                id="incidente-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaIncidente)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy text-xs"
              >
                <option value="caja_dinero">Caja / Dinero</option>
                <option value="rotura_merma">Rotura / Merma</option>
                <option value="servicio_cliente">Servicio al Cliente</option>
                <option value="disciplinario">Disciplinario</option>
                <option value="seguridad_higiene">Seguridad e Higiene</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Selector de Gravedad */}
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">
                Nivel de Gravedad <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['baja', 'media', 'alta'] as GravedadIncidente[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGravedad(g)}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      gravedad === g
                        ? g === 'alta'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : g === 'media'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {g === 'alta' && <Flame className="w-3 h-3" />}
                    <span>{g}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alerta Reactiva si es Alta */}
          {gravedad === 'alta' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-900 text-xs">
              <Zap className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <strong>Alerta en vivo (Server-Sent Events):</strong> Clasificar como{' '}
                <em>Gravedad Alta</em> emitirá una alerta instantánea sonora y visual en el panel del{' '}
                <strong>Propietario de la Empresa (CU-PROP-09)</strong> para supervisión inmediata.
              </div>
            </div>
          )}

          {/* Campos 4 y 5: Fecha/Hora y Checkbox Colaborador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label htmlFor="incidente-fechahora" className="block font-bold text-stone-700">
                Fecha y Hora del Suceso <span className="text-red-500">*</span>
              </label>
              <input
                id="incidente-fechahora"
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy text-xs"
                required
              />
            </div>

            {/* Checkbox condicional de colaborador */}
            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-stone-50 border border-stone-200 select-none">
                <input
                  type="checkbox"
                  checked={involucraEmpleado}
                  onChange={(e) => setInvolucraEmpleado(e.target.checked)}
                  className="rounded border-stone-300 text-aurea-navy focus:ring-aurea-navy w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-stone-800 text-xs">
                  Involucra a un colaborador específico
                </span>
              </label>
            </div>
          </div>

          {/* Desplegable condicional si el checkbox está activo */}
          {involucraEmpleado && (
            <div className="space-y-1 p-3 bg-stone-50 border border-stone-200 rounded-xl animate-in fade-in duration-150">
              <label htmlFor="incidente-empleado" className="block font-bold text-stone-700">
                Seleccionar Colaborador de Sede <span className="text-red-500">*</span>
              </label>
              <select
                id="incidente-empleado"
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy text-xs"
                required={involucraEmpleado}
              >
                <option value="">-- Elige al colaborador asignado --</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} — {emp.rol.charAt(0).toUpperCase() + emp.rol.slice(1)} ({emp.correo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo 6: Descripción Pormenorizada */}
          <div className="space-y-1">
            <label htmlFor="incidente-desc" className="block font-bold text-stone-700">
              Descripción Pormenorizada de lo Acontecido <span className="text-red-500">*</span>
            </label>
            <textarea
              id="incidente-desc"
              rows={3}
              placeholder="Detalla qué sucedió, testimonios, lugar específico del restaurante y factores involucrados (mínimo 15 caracteres)..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy text-xs leading-relaxed"
              required
            />
          </div>

          {/* Campo 7: Medidas Inmediatas */}
          <div className="space-y-1">
            <label htmlFor="incidente-medidas" className="block font-bold text-stone-700">
              Medidas Inmediatas de Contención Adoptadas <span className="text-stone-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="incidente-medidas"
              rows={2}
              placeholder="Ej. Se aisló la estación, se coordinó conteo ciego o se ofreció atención de cortesía..."
              value={medidasInmediatas}
              onChange={(e) => setMedidasInmediatas(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-aurea-navy text-xs"
            />
          </div>

          {/* Campo 8: Evidencia Dropzone */}
          <div className="space-y-1 pt-1">
            <label className="block font-bold text-stone-700">
              Evidencia Fotográfica / Comprobante <span className="text-stone-400 font-normal">(Opcional, máx. 5MB)</span>
            </label>
            {archivoEvidencia ? (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-stone-800">
                  <FileText className="w-4 h-4 text-aurea-copper" />
                  <span className="font-semibold">{archivoEvidencia.nombre}</span>
                  <span className="text-stone-400">({archivoEvidencia.tamano})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivoEvidencia(null)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                  title="Quitar comprobante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimularCargaArchivo}
                className="w-full p-4 border-2 border-dashed border-stone-300 hover:border-aurea-copper rounded-2xl bg-stone-50/50 hover:bg-aurea-ivory/50 flex flex-col items-center justify-center gap-1.5 transition-colors text-stone-600 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-stone-400" />
                <span className="font-semibold">Arrastra una imagen o haz clic para adjuntar comprobante</span>
                <span className="text-[10px] text-stone-400 font-mono">Formatos JPG, PNG hasta 5MB</span>
              </button>
            )}
          </div>

          {/* Opción de Resolución Inmediata en el Turno */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                id="check-resolucion-inmediata"
                type="checkbox"
                checked={resolucionInmediata}
                disabled={gravedad === 'alta'}
                onChange={(e) => setResolucionInmediata(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-aurea-navy focus:ring-aurea-navy cursor-pointer disabled:opacity-40"
              />
              <div>
                <label
                  htmlFor="check-resolucion-inmediata"
                  className={`font-bold cursor-pointer ${
                    gravedad === 'alta' ? 'text-stone-400' : 'text-stone-800'
                  }`}
                >
                  El incidente ya fue subsanado en este turno (Registrar con Resolución Inmediata)
                </label>
                <p className="text-[11px] text-stone-500">
                  {gravedad === 'alta'
                    ? '⚠️ Los incidentes de Gravedad Alta requieren seguimiento activo y no admiten resolución inmediata sin conocimiento previo de Gerencia.'
                    : 'Permite registrar la novedad y archivarla directamente como resuelta sin pasar por investigación prolongada.'}
                </p>
              </div>
            </div>

            {resolucionInmediata && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <label htmlFor="incidente-resolucion-inmediata-nota" className="block font-bold text-emerald-950">
                  Acciones Correctivas y Notas de Cierre Inmediato <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="incidente-resolucion-inmediata-nota"
                  rows={2}
                  placeholder="Explica qué medidas definitivas se tomaron en el momento para subsanar el incidente (mínimo 10 caracteres)..."
                  value={resolucionNota}
                  onChange={(e) => setResolucionNota(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                  required
                />
              </div>
            )}
          </div>

          {/* Botones del modal */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white font-bold shadow-md shadow-aurea-navy/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-aurea-champagne" />
                  <span>{resolucionInmediata ? 'Registrar y Concluir Incidente' : 'Registrar Incidente'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
