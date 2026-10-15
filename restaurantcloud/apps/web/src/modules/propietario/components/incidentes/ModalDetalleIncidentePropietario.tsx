import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  ShieldAlert,
  Send,
  FileText,
  History,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  IncidenteDetalleDTO,
  PasarARevisionRequest,
  CategoriaIncidente,
  GravedadIncidente,
  EstadoIncidente,
  TipoEventoBitacora,
} from '@/types/propietario';

interface ModalDetalleIncidentePropietarioProps {
  incidente: IncidenteDetalleDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardarDirectiva: (id: string, req: PasarARevisionRequest) => Promise<boolean>;
  guardandoDirectiva: boolean;
  sedeNombre?: string;
}

const CATEGORIA_LABELS: Record<CategoriaIncidente, string> = {
  servicio_cliente: 'Servicio al Cliente',
  disciplinario: 'Disciplinario',
  rotura_merma: 'Rotura o Merma',
  seguridad_higiene: 'Seguridad / Higiene',
  caja_dinero: 'Caja o Dinero',
  otro: 'Otro',
};

const GRAVEDAD_CONFIG: Record<
  GravedadIncidente,
  { label: string; badgeClass: string; icon: React.FC<{ className?: string }> }
> = {
  alta: {
    label: 'Alta',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    icon: AlertTriangle,
  },
  media: {
    label: 'Media',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    icon: AlertTriangle,
  },
  baja: {
    label: 'Baja',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
    icon: ShieldAlert,
  },
};

const ESTADO_CONFIG: Record<
  EstadoIncidente,
  { label: string; badgeClass: string }
> = {
  abierto: {
    label: 'Abierto',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  en_revision: {
    label: 'En Revisión',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
  },
  resuelto: {
    label: 'Resuelto',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  },
};

const EVENTO_CONFIG: Record<
  TipoEventoBitacora,
  { label: string; badgeClass: string; borderClass: string }
> = {
  apertura: {
    label: 'Apertura de Incidente',
    badgeClass: 'bg-blue-100 text-blue-800',
    borderClass: 'border-l-blue-500',
  },
  directiva_propietario: {
    label: 'Directiva del Propietario',
    badgeClass: 'bg-purple-100 text-purple-800',
    borderClass: 'border-l-purple-500',
  },
  indagacion: {
    label: 'Avance de Investigación',
    badgeClass: 'bg-amber-100 text-amber-800',
    borderClass: 'border-l-amber-500',
  },
  resolucion: {
    label: 'Resolución Operativa',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    borderClass: 'border-l-emerald-500',
  },
};

export const ModalDetalleIncidentePropietario: React.FC<ModalDetalleIncidentePropietarioProps> = ({
  incidente,
  isOpen,
  onClose,
  onGuardarDirectiva,
  guardandoDirectiva,
  sedeNombre,
}) => {
  const [notaDirectiva, setNotaDirectiva] = useState('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [zoomImagen, setZoomImagen] = useState(false);

  if (!isOpen || !incidente) return null;

  const gravedadInfo = GRAVEDAD_CONFIG[incidente.gravedad];
  const estadoInfo = ESTADO_CONFIG[incidente.estado];
  const GravedadIcon = gravedadInfo.icon;

  const fechaIncidenteStr = new Date(incidente.fecha_hora).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fechaVistoStr = incidente.fecha_visto
    ? new Date(incidente.fecha_visto).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'recién registrado';

  const handleEnviarDirectiva = async () => {
    setErrorValidacion(null);
    if (!notaDirectiva || notaDirectiva.trim().length < 5) {
      setErrorValidacion('La directiva u observación ejecutiva debe tener al menos 5 caracteres.');
      return;
    }
    if (notaDirectiva.trim().length > 2000) {
      setErrorValidacion('La instrucción no puede superar los 2,000 caracteres.');
      return;
    }

    const exito = await onGuardarDirectiva(incidente.id, { nota_propietario: notaDirectiva.trim() });
    if (exito) {
      setNotaDirectiva('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-aurea-navy/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-mono text-xs sm:text-sm font-bold bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-aurea-navy">
                #{incidente.codigo}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-aurea-copper" />
                {sedeNombre || (incidente.local_id === '00000000-0000-4000-8000-000000000020' ? 'Sede San Isidro' : 'Sede Miraflores')}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg border ${gravedadInfo.badgeClass}`}>
                <GravedadIcon className="w-3.5 h-3.5" />
                {gravedadInfo.label}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border font-semibold ${estadoInfo.badgeClass}`}>
                {estadoInfo.label}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-aurea-navy tracking-tight">
              {incidente.titulo}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Acuse de Lectura Automático (Regla Central CU-PROP-06) */}
        <div className="px-5 sm:px-6 py-2.5 bg-emerald-50 border-b border-emerald-200/70 flex items-center justify-between text-xs text-emerald-900 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Acuse de Lectura Automático:</strong> Visto por Propietario (Tú) el {fechaVistoStr} hrs.
            </span>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
            Auditado en DB
          </span>
        </div>

        {/* Contenido en 2 Columnas (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm text-aurea-navy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda: Reporte Operativo */}
            <div className="space-y-4">
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-aurea-copper" />
                  Datos del Reporte Operativo de Sede
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Categoría:</span>
                    <span className="font-semibold text-slate-700">
                      {CATEGORIA_LABELS[incidente.categoria]}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fecha y Hora:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {fechaIncidenteStr}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Registrado por:</span>
                    <span className="font-semibold text-slate-700">
                      {incidente.registrador_nombre || 'Administrador de Sede'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Personal Involucrado:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {incidente.empleado_nombre || 'Ninguno especificado'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Descripción de los hechos:</span>
                  <p className="text-xs sm:text-sm bg-white p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                    {incidente.descripcion}
                  </p>
                </div>

                {incidente.medidas_inmediatas && (
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Medidas inmediatas de la sede:</span>
                    <p className="text-xs sm:text-sm bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-emerald-900 leading-relaxed font-medium">
                      {incidente.medidas_inmediatas}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidencia Fotográfica Adjunta */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-aurea-copper" />
                  Evidencia Fotográfica / Adjunta
                </span>

                {incidente.foto_url ? (
                  <div className="space-y-2">
                    <div
                      onClick={() => setZoomImagen(true)}
                      className="group relative h-44 rounded-xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-900"
                    >
                      <img
                        src={incidente.foto_url}
                        alt="Evidencia del incidente"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <ExternalLink className="w-4 h-4" />
                        <span>Clic para ampliar imagen</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 block text-center">
                      Archivo seguro alojado con pre-signed URL temporal (15 min)
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No se adjuntaron fotografías para este reporte operativo.
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Bitácora Cronológica e Intervención Ejecutiva */}
            <div className="space-y-4 flex flex-col">
              {/* Bitácora Cronológica (incidente_bitacora) */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-aurea-copper" />
                    Línea de Tiempo y Bitácora ({incidente.bitacora?.length || 0})
                  </span>
                  <span className="text-[11px] text-slate-400">02_schema_ddl.sql</span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {incidente.bitacora && incidente.bitacora.length > 0 ? (
                    incidente.bitacora.map((item) => {
                      const eventoInfo = EVENTO_CONFIG[item.tipo_evento] || {
                        label: item.tipo_evento,
                        badgeClass: 'bg-slate-100 text-slate-700',
                        borderClass: 'border-l-slate-400',
                      };
                      return (
                        <div
                          key={item.id}
                          className={`bg-white p-3 rounded-lg border border-slate-200 border-l-4 ${eventoInfo.borderClass} text-xs space-y-1 shadow-sm`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${eventoInfo.badgeClass}`}>
                              {eventoInfo.label}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.created_at).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium pt-0.5">{item.nota}</p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            Por: {item.usuario_nombre} ({item.usuario_rol})
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Sin eventos registrados en bitácora.
                    </div>
                  )}
                </div>
              </div>

              {/* Intervención y Directiva del Propietario */}
              <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-900 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Intervención Ejecutiva del Propietario
                  </span>
                  {incidente.nota_propietario && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                      Directiva Activa
                    </span>
                  )}
                </div>

                {incidente.estado === 'resuelto' ? (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Incidente Concluido y Resuelto</span>
                    </div>
                    <p className="text-slate-600">
                      {incidente.resolucion_nota || 'El administrador de sede certificó la resolución satisfactoria.'}
                    </p>
                    <span className="text-[11px] text-slate-400 block pt-1 italic">
                      Este incidente ya fue cerrado operativamente por la administración del local y no admite nuevas directivas.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs text-purple-950 font-medium block">
                      Instrucción u observación vinculante para el Administrador de Sede:
                    </label>
                    <textarea
                      value={notaDirectiva}
                      onChange={(e) => setNotaDirectiva(e.target.value)}
                      placeholder="Ej: Por favor coordinar con el prevencionista la reposición de guantes de malla y dar seguimiento a la recuperación del colaborador..."
                      rows={3}
                      maxLength={2000}
                      className="w-full p-3 rounded-xl border border-purple-200 bg-white text-xs sm:text-sm text-aurea-navy placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all"
                    />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        {notaDirectiva.length} / 2,000 caracteres
                      </span>
                      {errorValidacion && (
                        <span className="text-rose-600 font-semibold text-[11px]">
                          {errorValidacion}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleEnviarDirectiva}
                      disabled={guardandoDirectiva || notaDirectiva.trim().length < 5}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                        guardandoDirectiva || notaDirectiva.trim().length < 5
                          ? 'bg-purple-200 text-purple-400 cursor-not-allowed'
                          : 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-900/10'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {incidente.estado === 'abierto'
                          ? 'Poner en Revisión y Enviar Directiva'
                          : 'Enviar Directiva Complementaria'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            El acuse de lectura ha quedado registrado de manera permanente.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors shadow-sm ml-auto"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>

      {/* Modal de Zoom para Imagen */}
      {zoomImagen && incidente.foto_url && (
        <div
          onClick={() => setZoomImagen(false)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img
              src={incidente.foto_url}
              alt="Evidencia ampliada"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setZoomImagen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
