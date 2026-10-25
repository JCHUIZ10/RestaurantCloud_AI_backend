import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Clock,
  CheckCircle2,
  Hourglass,
  Flame,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Lock,
  ExternalLink,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  IncidenteDetalleDTO,
  InvestigacionIncidenteRequest,
  ResolverIncidenteRequest,
} from '@/types/admin';

interface ModalDetalleResolucionProps {
  isOpen: boolean;
  onClose: () => void;
  incidente: IncidenteDetalleDTO | null;
  onGuardarInvestigacion: (id: string, req: InvestigacionIncidenteRequest) => Promise<boolean>;
  onResolverDefinitivo: (id: string, req: ResolverIncidenteRequest) => Promise<boolean>;
}

export const ModalDetalleResolucion: React.FC<ModalDetalleResolucionProps> = ({
  isOpen,
  onClose,
  incidente,
  onGuardarInvestigacion,
  onResolverDefinitivo,
}) => {
  const [tabAccion, setTabAccion] = useState<'resolucion' | 'investigacion'>('resolucion');
  const [notasCierre, setNotasCierre] = useState('');
  const [nuevoAvanceNota, setNuevoAvanceNota] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !procesando) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, procesando]);

  // Reset al abrir
  useEffect(() => {
    if (incidente) {
      setTabAccion('resolucion');
      setNotasCierre('');
      setNuevoAvanceNota('');
      setErrorLocal(null);
    }
  }, [incidente, isOpen]);

  if (!isOpen || !incidente) return null;

  const esResuelto = incidente.estado === 'resuelto';
  const esAltaGravedadNoVista = incidente.gravedad === 'alta' && !incidente.visto_por_propietario;

  const handleConfirmarResolucion = async () => {
    setErrorLocal(null);
    if (esAltaGravedadNoVista) {
      setErrorLocal('Este incidente es de Gravedad Alta. Requiere que la Gerencia General tome conocimiento previo en el portal de supervisión antes del cierre definitivo.');
      return;
    }

    if (notasCierre.trim().length < 10) {
      setErrorLocal('Las acciones correctivas definitivas y notas de cierre son obligatorias (mínimo 10 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      const exito = await onResolverDefinitivo(incidente.id, {
        resolucion_nota: notasCierre.trim(),
      });
      if (exito) {
        onClose();
      }
    } finally {
      setProcesando(false);
    }
  };

  const handleAgregarAvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    if (nuevoAvanceNota.trim().length < 5) {
      setErrorLocal('El avance de investigación debe contener al menos 5 caracteres.');
      return;
    }

    setProcesando(true);
    try {
      const exito = await onGuardarInvestigacion(incidente.id, {
        motivo_revision: nuevoAvanceNota.trim(),
      });
      if (exito) {
        setNuevoAvanceNota('');
      }
    } finally {
      setProcesando(false);
    }
  };

  const fechaOcurrido = new Date(incidente.fecha_hora);
  const fechaLegible = !isNaN(fechaOcurrido.getTime())
    ? fechaOcurrido.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : incidente.fecha_hora;

  const fechaVistoLegible = incidente.fecha_visto
    ? new Date(incidente.fecha_visto).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-detalle-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-[720px] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del expediente */}
        <div className="p-5 pb-4 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-stone-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-aurea-navy bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-300">
                Expediente: {incidente.codigo}
              </span>

              {/* Badge Estado */}
              {incidente.estado === 'abierto' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Abierto</span>
                </span>
              ) : incidente.estado === 'en_revision' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  <Hourglass className="w-3 h-3 text-blue-700" />
                  <span>En Investigación</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Resuelto Inmutable</span>
                </span>
              )}

              {/* Badge Gravedad */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  incidente.gravedad === 'alta'
                    ? 'bg-red-100 text-red-900 border border-red-300'
                    : incidente.gravedad === 'media'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {incidente.gravedad === 'alta' && <Flame className="w-3 h-3 text-red-600" />}
                <span>Gravedad {incidente.gravedad}</span>
              </span>
            </div>

            <h2 id="modal-detalle-title" className="text-base sm:text-lg font-bold text-aurea-navy leading-snug pt-1">
              {incidente.titulo}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={procesando}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del expediente */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorLocal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Banner de Estado de Supervisión de Gerencia */}
          {incidente.visto_por_propietario ? (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Visto por Gerencia General:</strong> El Propietario tomó conocimiento el{' '}
                  <span className="font-semibold">{fechaVistoLegible || 'recientemente'}</span>.
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase px-2 py-0.5 bg-white rounded-md border border-emerald-300 shrink-0">
                Supervisado
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Pendiente de lectura por Gerencia:</strong> El Propietario aún no ha inspeccionado este caso en el portal corporativo.
                </span>
              </div>
              {incidente.gravedad === 'alta' && (
                <span className="text-[10px] font-bold text-red-900 uppercase px-2 py-0.5 bg-red-100 rounded-md border border-red-300 shrink-0 animate-pulse">
                  Alerta Push
                </span>
              )}
            </div>
          )}

          {/* Tarjeta de Datos del Suceso */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-600 text-[11px] border-b border-stone-200/70 pb-2.5">
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Ocurrido: <strong>{fechaLegible}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {incidente.empleado_nombre ? (
                    <strong>{incidente.empleado_nombre}</strong>
                  ) : (
                    <em className="text-stone-400">Sin colaborador</em>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <span>Registrado por: <strong>{incidente.registrador_nombre}</strong></span>
              </div>
            </div>

            {/* Hecho pormenorizado */}
            <div className="space-y-1">
              <span className="font-bold text-stone-700 uppercase text-[10px] tracking-wider block">
                Hecho Ocurrido:
              </span>
              <p className="text-stone-800 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/60 font-medium">
                {incidente.descripcion}
              </p>
            </div>

            {/* Medidas inmediatas si existen */}
            {incidente.medidas_inmediatas && (
              <div className="space-y-1">
                <span className="font-bold text-stone-700 uppercase text-[10px] tracking-wider block">
                  Medidas Inmediatas de Contención:
                </span>
                <p className="text-stone-700 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/50">
                  {incidente.medidas_inmediatas}
                </p>
              </div>
            )}

            {/* Evidencia fotográfica si existe */}
            {incidente.foto_url && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-600">
                <FileText className="w-3.5 h-3.5 text-aurea-copper" />
                <span>Evidencia adjunta:</span>
                <a
                  href={`#${incidente.foto_url}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Comprobante adjunto: ${incidente.foto_url}`);
                  }}
                  className="font-semibold text-aurea-navy hover:underline flex items-center gap-1"
                >
                  <span>Ver imagen o comprobante</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* LÍNEA DE TIEMPO (TIMELINE) DE BITÁCORA Y DIRECTIVAS */}
          {/* ================================================================ */}
          <div className="bg-stone-50/70 rounded-2xl border border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-aurea-navy" />
                <span className="font-bold text-xs text-stone-800 uppercase tracking-wide">
                  Línea de Tiempo de Indagación y Directivas
                </span>
              </div>
              <span className="text-[11px] font-medium text-stone-500">
                {(incidente.bitacora || []).length} hitos registrados
              </span>
            </div>

            {(!incidente.bitacora || incidente.bitacora.length === 0) ? (
              <p className="text-stone-400 text-xs italic py-2">
                No hay hitos registrados en la bitácora de este incidente.
              </p>
            ) : (
              <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {incidente.bitacora.map((item) => {
                  const itemFecha = new Date(item.created_at);
                  const fechaHito = !isNaN(itemFecha.getTime())
                    ? itemFecha.toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : item.created_at;

                  const isApertura = item.tipo_evento === 'apertura';
                  const isDirectiva = item.tipo_evento === 'directiva_propietario';
                  const isIndagacion = item.tipo_evento === 'indagacion';
                  const isResolucion = item.tipo_evento === 'resolucion';

                  return (
                    <div key={item.id} className="relative group">
                      {/* Círculo del hito en el timeline */}
                      <div
                        className={`absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isDirectiva
                            ? 'border-purple-600 ring-2 ring-purple-100'
                            : isResolucion
                            ? 'border-emerald-600 ring-2 ring-emerald-100'
                            : isIndagacion
                            ? 'border-blue-500 ring-2 ring-blue-100'
                            : 'border-stone-400 ring-2 ring-stone-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDirectiva
                              ? 'bg-purple-600'
                              : isResolucion
                              ? 'bg-emerald-600'
                              : isIndagacion
                              ? 'bg-blue-500'
                              : 'bg-stone-400'
                          }`}
                        />
                      </div>

                      {/* Tarjeta del evento */}
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isDirectiva
                            ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                            : isResolucion
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : isIndagacion
                            ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                            : 'bg-white border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold">
                            {isDirectiva && <Shield className="w-3.5 h-3.5 text-purple-700" />}
                            {isResolucion && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isIndagacion && <Hourglass className="w-3.5 h-3.5 text-blue-600" />}
                            {isApertura && <FileText className="w-3.5 h-3.5 text-stone-500" />}
                            <span>
                              {isDirectiva
                                ? 'Directiva del Propietario (Gerencia)'
                                : isResolucion
                                ? 'Resolución Definitiva'
                                : isIndagacion
                                ? 'Avance de Investigación'
                                : 'Apertura del Caso'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-stone-500 text-[10px] font-mono">
                            <span>{item.usuario_nombre}</span>
                            <span>•</span>
                            <span>{fechaHito}</span>
                          </div>
                        </div>

                        <p
                          className={`text-xs leading-relaxed ${
                            isDirectiva
                              ? 'font-serif italic text-purple-950'
                              : 'text-stone-800 font-medium'
                          }`}
                        >
                          {item.nota}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* RESOLUCIÓN O PESTAÑAS DE ACCIÓN */}
          {/* ================================================================ */}
          {esResuelto ? (
            /* Modo Solo Lectura: Incidente Resuelto */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 text-emerald-900">
                <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Resolución Definitiva (Cierre Inmutable)</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-800">
                  {incidente.fecha_resolucion
                    ? new Date(incidente.fecha_resolucion).toLocaleString('es-PE')
                    : 'Fecha sellada'}
                </span>
              </div>

              <p className="text-xs text-emerald-950 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-200/60">
                {incidente.resolucion_nota}
              </p>

              <div className="text-[11px] text-emerald-800 pt-1 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>
                  Sellado por <strong>{incidente.resuelto_por_nombre || 'Administrador'}</strong>. Este registro no admite alteraciones.
                </span>
              </div>
            </div>
          ) : (
            /* Modo Acción: Pestañas para Resolver o Dejar en Investigación */
            <div className="space-y-3 pt-1">
              <div className="inline-flex w-full p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTabAccion('resolucion')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tabAccion === 'resolucion'
                      ? 'bg-white text-aurea-navy font-bold shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Confirmar Resolución Definitiva (Cierre)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabAccion('investigacion')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tabAccion === 'investigacion'
                      ? 'bg-white text-aurea-navy font-bold shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Hourglass className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Registrar Avance de Investigación</span>
                </button>
              </div>

              {tabAccion === 'resolucion' ? (
                /* Tab 1: Cierre Definitivo */
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="text-xs text-stone-700 leading-relaxed">
                    ℹ️ <strong>Efecto del cierre:</strong> El incidente pasará irreversiblemente a estado{' '}
                    <strong className="text-emerald-800">RESUELTO</strong> de solo lectura. Se asentará tu usuario y la
                    fecha actual en auditoría inmutable.
                  </div>

                  {esAltaGravedadNoVista && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Resolución bloqueada preventivamente</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Este incidente es de <strong>Gravedad Alta</strong> y aún no ha sido visualizado por la Gerencia General en el portal corporativo. Requiere conocimiento previo de Gerencia antes de permitir el cierre definitivo. Mientras tanto, puedes registrar todos tus avances en la pestaña de investigación.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="resolucion-notas" className="block font-bold text-stone-800">
                      Acciones Correctivas Definitivas y Notas de Cierre <span className="text-red-500">*</span>
                      <span className="text-stone-400 font-normal"> (Mínimo 10 caracteres)</span>
                    </label>
                    <textarea
                      id="resolucion-notas"
                      rows={3}
                      disabled={esAltaGravedadNoVista}
                      placeholder={
                        esAltaGravedadNoVista
                          ? 'Cierre bloqueado hasta que Gerencia tome conocimiento previo...'
                          : 'Describe las medidas finales adoptadas, acuerdos de pago, reemplazo de equipos o aclaración bancaria con el POS...'
                      }
                      value={notasCierre}
                      onChange={(e) => setNotasCierre(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs leading-relaxed disabled:bg-stone-100 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmarResolucion}
                      disabled={procesando || esAltaGravedadNoVista || notasCierre.trim().length < 10}
                      className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {procesando ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Confirmar Resolución Definitiva</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab 2: Registrar Avance de Investigación */
                <form
                  onSubmit={handleAgregarAvance}
                  className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-3"
                >
                  <div className="text-xs text-stone-700 leading-relaxed">
                    ℹ️ <strong>Registrar avance en la investigación:</strong> Cada nota que agregues se anexará a la
                    línea de tiempo cronológica con tu autoría y fecha exacta, manteniendo el expediente en estado{' '}
                    <strong className="text-blue-800">EN REVISIÓN</strong>.
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="nuevo-avance-nota" className="block font-bold text-stone-800">
                      Hallazgo, diligencia o avance realizado <span className="text-red-500">*</span>
                      <span className="text-stone-400 font-normal"> (Mínimo 5 caracteres)</span>
                    </label>
                    <textarea
                      id="nuevo-avance-nota"
                      rows={3}
                      placeholder="Ej. Se revisaron las grabaciones del pasillo a las 14:30; se confirmó que el técnico asistirá mañana a primera hora..."
                      value={nuevoAvanceNota}
                      onChange={(e) => setNuevoAvanceNota(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-700 text-xs leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={procesando || nuevoAvanceNota.trim().length < 5}
                      className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {procesando ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Guardando avance...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-blue-200" />
                          <span>+ Registrar Avance en Bitácora</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Registro inmutable con auditoría PostgreSQL</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold transition-colors"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};
