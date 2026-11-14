import React, { useEffect, useState } from 'react';
import { FileText, X, CheckCircle2, AlertTriangle, Download, Printer, ShieldCheck, Eye } from 'lucide-react';
import { ReporteZDTO } from '@/types/caja';
import { TurnoCajaResumenDTO, VisarTurnoRequestDTO, LevantarObservacionRequestDTO } from '@/types/admin';
import { ReporteZDocumento } from '@/modules/caja/components/cierre/ReporteZDocumento';
import { useDescargaReporteZ } from '@/modules/caja/components/cierre/useDescargaReporteZ';

interface ModalVisorReporteZAdminProps {
  isOpen: boolean;
  turno: TurnoCajaResumenDTO | null;
  reporteZ: ReporteZDTO | null;
  onClose: () => void;
  onVisarTurno: (turnoId: string, req: VisarTurnoRequestDTO) => Promise<void>;
  onLevantarObservacion?: (turnoId: string, req: LevantarObservacionRequestDTO) => Promise<void>;
  isSubmitting?: boolean;
}

const MIN_CARACTERES_OBSERVACION = 10;

/**
 * Visor del Reporte Z archivado y visado gerencial. El documento es el mismo que ve el cajero al cerrar;
 * debajo, la administración deja su conformidad o la observación del turno.
 */
export const ModalVisorReporteZAdmin: React.FC<ModalVisorReporteZAdminProps> = ({
  isOpen,
  turno,
  reporteZ,
  onClose,
  onVisarTurno,
  onLevantarObservacion,
  isSubmitting = false,
}) => {
  const [conforme, setConforme] = useState<boolean>(true);
  const [notasAuditoria, setNotasAuditoria] = useState<string>('');
  const [notasResolucion, setNotasResolucion] = useState<string>('');
  // El propietario no entra por /caja (solo cajero y admin_local): el PDF se pide por la ruta de finanzas
  const { descargando, descargadoExito, errorDescarga, descargar } = useDescargaReporteZ(
    reporteZ,
    reporteZ ? `/admin/finanzas/turnos/${reporteZ.caja_id}/reporte-z/pdf` : undefined
  );

  // Escape cierra el visor, salvo mientras se registra el visado
  useEffect(() => {
    if (!isOpen) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !turno) return null;

  const notas = notasAuditoria.trim();
  // Sin Reporte Z archivado la nota es la única constancia: se exige también al dar la conformidad
  const exigeNotas = !conforme || !reporteZ;
  const observacionValida = !exigeNotas || notas.length >= MIN_CARACTERES_OBSERVACION;
  const caracteresFaltantes = Math.max(0, MIN_CARACTERES_OBSERVACION - notas.length);
  const observado = turno.revisado && turno.visado_conforme === false;
  const observacionPendiente = observado && !turno.observacion_resuelta;
  const resolucion = notasResolucion.trim();
  const resolucionValida = resolucion.length >= MIN_CARACTERES_OBSERVACION;

  const handleSubmitResolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolucionValida || isSubmitting || !onLevantarObservacion) return;
    await onLevantarObservacion(turno.id, { notas: resolucion });
  };

  const handleSubmitVisado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observacionValida || isSubmitting) return;
    await onVisarTurno(turno.id, { conforme, notas_auditoria: notas });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-visor-z"
    >
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-aurea-navy via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-aurea-copper font-bold bg-aurea-copper/10 px-2 py-0.5 rounded-md border border-aurea-copper/30">
                Documento fiscal inmutable
              </span>
              <h2 id="titulo-visor-z" className="text-lg font-bold font-serif text-white tracking-tight mt-0.5">
                Reporte Z oficial • Turno #{String(turno.correlativo).padStart(3, '0')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar visor del Reporte Z"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorDescarga && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between gap-3"
            >
              <span>No se pudo descargar el PDF del Reporte Z. Intenta nuevamente o imprime esta página como respaldo.</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir página</span>
              </button>
            </div>
          )}

          {reporteZ ? (
            <ReporteZDocumento reporte={reporteZ} />
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Este turno no tiene un Reporte Z archivado
                {turno.revisado ? '.' : '. Puedes visarlo dejando una nota que explique en qué se basa tu revisión.'}
              </span>
            </div>
          )}

          {/* Visado gerencial */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-aurea-copper" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
                  Visado y conformidad gerencial
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  !turno.revisado
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : observado
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {!turno.revisado ? 'Pendiente de auditoría' : observacionPendiente ? 'Observado — por resolver' : observado ? 'Observado y resuelto' : 'Conforme y auditado'}
              </span>
            </div>

            {turno.revisado ? (
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  Visado por: <strong className="text-slate-900 dark:text-white">{turno.revisado_por_nombre ?? 'Administración'}</strong>
                  {turno.revisado_at ? ` el ${new Date(turno.revisado_at).toLocaleString('es-PE')}` : ''}
                </p>
                {turno.notas_auditoria && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                    &ldquo;{turno.notas_auditoria}&rdquo;
                  </div>
                )}
                {turno.observacion_resuelta && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                    <p>
                      Observación resuelta por <strong>{turno.observacion_resuelta_por_nombre ?? 'Administración'}</strong>
                      {turno.observacion_resuelta_at ? ` el ${new Date(turno.observacion_resuelta_at).toLocaleString('es-PE')}` : ''}
                    </p>
                    {turno.observacion_resolucion && <p>&ldquo;{turno.observacion_resolucion}&rdquo;</p>}
                  </div>
                )}
                {observacionPendiente && onLevantarObservacion && (
                  <form onSubmit={handleSubmitResolucion} className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="notas-resolucion" className="text-xs font-semibold text-rose-900">
                        Cómo se resolvió la observación<span className="text-rose-500"> *</span>
                      </label>
                      <span className={`text-[10px] font-mono ${resolucionValida ? 'text-emerald-600 font-bold' : 'text-rose-500'}`}>
                        {resolucionValida ? '✓ Válido' : `Mínimo ${MIN_CARACTERES_OBSERVACION} caracteres (faltan ${MIN_CARACTERES_OBSERVACION - resolucion.length})`}
                      </span>
                    </div>
                    <textarea
                      id="notas-resolucion"
                      rows={2}
                      value={notasResolucion}
                      onChange={(e) => setNotasResolucion(e.target.value)}
                      maxLength={1000}
                      disabled={isSubmitting}
                      placeholder="Ej. El cajero presentó el comprobante faltante y el monto cuadra."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 bg-white text-slate-900 focus:outline-none focus:border-aurea-copper resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !resolucionValida}
                      className="px-5 py-2.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-aurea-copper" />
                      <span>{isSubmitting ? 'Guardando…' : 'Levantar observación'}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitVisado} className="space-y-3">
                <fieldset className="flex flex-wrap gap-2" disabled={isSubmitting}>
                  <legend className="sr-only">Resultado de la auditoría</legend>
                  <label
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      conforme
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    <input type="radio" name="resultado-visado" checked={conforme} onChange={() => setConforme(true)} className="accent-emerald-600" />
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>Conforme</span>
                  </label>
                  <label
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                      !conforme
                        ? 'bg-rose-50 border-rose-400 text-rose-800'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    <input type="radio" name="resultado-visado" checked={!conforme} onChange={() => setConforme(false)} className="accent-rose-600" />
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    <span>Observado</span>
                  </label>
                </fieldset>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="notas-visado" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {!conforme ? 'Motivo de la observación' : reporteZ ? 'Notas de la auditoría (opcional)' : 'Notas de la auditoría'}
                      {exigeNotas && <span className="text-rose-500"> *</span>}
                    </label>
                    {exigeNotas && (
                      <span className={`text-[10px] font-mono ${observacionValida ? 'text-emerald-600 font-bold' : 'text-rose-500'}`}>
                        {observacionValida ? '✓ Válido' : `Mínimo ${MIN_CARACTERES_OBSERVACION} caracteres (faltan ${caracteresFaltantes})`}
                      </span>
                    )}
                  </div>
                  <textarea
                    id="notas-visado"
                    rows={2}
                    value={notasAuditoria}
                    onChange={(e) => setNotasAuditoria(e.target.value)}
                    maxLength={1000}
                    placeholder={
                      conforme
                        ? 'Ej. Arqueo verificado contra el lote POS y los comprobantes emitidos.'
                        : 'Explica por qué el turno queda observado (diferencia sin sustento, comprobantes faltantes, etc.).'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !observacionValida}
                  className={`px-5 py-2.5 rounded-xl active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 ${
                    conforme ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : conforme ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  ) : (
                    <Eye className="w-4 h-4 text-rose-200" />
                  )}
                  <span>{conforme ? 'Marcar turno auditado y conforme' : 'Registrar observación del turno'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => void descargar()}
            disabled={descargando || !reporteZ}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-700 disabled:opacity-50"
          >
            {descargando ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{descargando ? 'Descargando PDF...' : descargadoExito ? '✓ PDF descargado' : 'Descargar Reporte Z en PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cerrar visor
          </button>
        </div>
      </div>
    </div>
  );
};
