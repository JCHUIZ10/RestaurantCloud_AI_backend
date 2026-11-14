import React from 'react';
import { ReporteZDocumento } from './ReporteZDocumento';
import { useDescargaReporteZ } from './useDescargaReporteZ';
import {
  CheckCircle2,
  FileDown,
  Printer,
  Sparkles,
  LogOut,
  ShieldCheck,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { ReporteZDTO } from '@/types/caja';

interface ReporteZCerradoViewProps {
  reporte: ReporteZDTO;
  /**
   * 'cierre': el Z que el cajero acaba de generar (banner de éxito y acciones de fin de turno).
   * 'consulta': un Z ya archivado que se abre a demanda (banner informativo y botón para volver).
   */
  modo?: 'cierre' | 'consulta';
  onVolver?: () => void;
  onIrAperturaNuevoTurno: () => void;
  onCerrarSesion: () => void;
}

export const ReporteZCerradoView: React.FC<ReporteZCerradoViewProps> = ({
  reporte,
  modo = 'cierre',
  onVolver,
  onIrAperturaNuevoTurno,
  onCerrarSesion,
}) => {
  const esConsulta = modo === 'consulta';
  const { descargando, descargadoExito, errorDescarga, descargar: handleDescargarPdf } = useDescargaReporteZ(reporte);

  const fechaCierreStr = new Date(reporte.fecha_cierre).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {esConsulta ? (
        /* Banner de consulta: documento archivado, no un cierre recién hecho */
        <div className="p-4 rounded-3xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-100 flex items-center gap-3 shadow-sm print:hidden">
          <div className="p-2 rounded-2xl bg-sky-200 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-sm block">
              Consulta del último Reporte Z • Turno #{String(reporte.turno_correlativo).padStart(3, '0')}
            </span>
            <span className="text-xs text-sky-700 dark:text-sky-300">
              Cajero: {reporte.cajero_nombre} • Cerrado el {fechaCierreStr}. Documento archivado e inmutable.
            </span>
          </div>
        </div>
      ) : (
        /* Banner superior de confirmación del cierre */
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-sm block">
                ¡Turno #{String(reporte.turno_correlativo).padStart(3, '0')} Cerrado con Éxito!
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300">
                Reporte Z Digital emitido inmutablemente • Terminal cerrada.
              </span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-200">
            Terminal Bloqueada
          </span>
        </div>
      )}

      {errorDescarga && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 print:hidden"
        >
          <span>No se pudo descargar el PDF del Reporte Z. Intente nuevamente o imprima esta página como respaldo.</span>
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

      {descargadoExito && (
        <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-sky-600" />
          <span>Reporte Z en formato PDF generado y archivado en su dispositivo (Cero Papel).</span>
        </div>
      )}

      <ReporteZDocumento
        reporte={reporte}
        pie={(
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={descargando}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4 text-aurea-copper" />
              <span>{descargando ? 'Descargando PDF...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              disabled
              className="px-3 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
              title="Política ecológica: Impresión de ticket deshabilitada (Cero Papel)"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Ticket (Cero Papel)</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-[10px] text-slate-500 font-sans flex items-center gap-1 hidden lg:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Archivado y disponible para la administración</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {esConsulta ? (
              <>
                <button
                  type="button"
                  onClick={onVolver}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  onClick={onIrAperturaNuevoTurno}
                  className="px-6 py-2.5 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 text-aurea-navy font-bold text-xs transition-all shadow-md shadow-aurea-copper/25 flex items-center gap-2"
                >
                  <span>Ir al Monitor POS</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCerrarSesion}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={onIrAperturaNuevoTurno}
                  className="px-6 py-2.5 rounded-2xl bg-aurea-copper hover:bg-aurea-copper/90 active:scale-95 text-aurea-navy font-bold text-xs transition-all shadow-md shadow-aurea-copper/25 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-aurea-navy" />
                  <span>Ir a Apertura de Nuevo Turno</span>
                </button>
              </>
            )}
          </div>
        </div>
        )}
      />
    </div>
  );
};
