import React, { useState } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { ReporteZDTO } from '@/types/caja';
import { TurnoCajaResumenDTO, VisarTurnoRequestDTO } from '@/types/admin';

interface ModalVisorReporteZAdminProps {
  isOpen: boolean;
  turno: TurnoCajaResumenDTO | null;
  reporteZ: ReporteZDTO | null;
  onClose: () => void;
  onVisarTurno: (turnoId: string, req: VisarTurnoRequestDTO) => Promise<void>;
  isSubmitting?: boolean;
}

export const ModalVisorReporteZAdmin: React.FC<ModalVisorReporteZAdminProps> = ({
  isOpen,
  turno,
  reporteZ,
  onClose,
  onVisarTurno,
  isSubmitting = false,
}) => {
  const [notasAuditoria, setNotasAuditoria] = useState<string>(
    turno?.notas_auditoria || 'Arqueo verificado conforme contra lote POS y comprobantes SUNAT.'
  );
  const [descargando, setDescargando] = useState<boolean>(false);
  const [descargaExitosa, setDescargaExitosa] = useState<boolean>(false);

  if (!isOpen || !turno) return null;

  const isCuadrada = turno.discrepancia !== null && turno.discrepancia !== undefined && Math.abs(turno.discrepancia) < 0.001;

  const handleDescargar = () => {
    setDescargando(true);
    setTimeout(() => {
      setDescargando(false);
      setDescargaExitosa(true);
      setTimeout(() => setDescargaExitosa(false), 3000);
    }, 900);
  };

  const handleSubmitVisado = async (e: React.FormEvent) => {
    e.preventDefault();
    await onVisarTurno(turno.id, {
      conforme: true,
      notas_auditoria: notasAuditoria.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Visor Oficial Z */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-aurea-navy via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-aurea-copper font-bold bg-aurea-copper/10 px-2 py-0.5 rounded-md border border-aurea-copper/30">
                  Documento Fiscal Inmutable
                </span>
                <span className="text-xs text-slate-400">Terminal: POS-01</span>
              </div>
              <h2 className="text-lg font-bold font-serif text-white tracking-tight mt-0.5">
                Reporte Z Oficial de Cierre de Caja • Turno #{String(turno.correlativo).padStart(3, '0')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Documento Fiscal Z */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Membrete Oficial de Sede */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-serif font-bold text-base text-slate-900 dark:text-white block">
                AÚREA COCINA CONTEMPORÁNEA & BRASAS
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                RUC: 20609876543 • Sede Miraflores (Av. La Mar 1230)
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Cajero Responsable: <strong className="text-slate-900 dark:text-white">{turno.cajero_nombre}</strong> • Apertura: {new Date(turno.fecha_apertura).toLocaleString('es-PE')} • Duración: {reporteZ?.duracion_turno || turno.duracion_horas || '5h 02m'}
              </div>
            </div>

            <div className="text-right shrink-0">
              {isCuadrada ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold font-mono text-xs inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ARQUEO CUADRADO EXACTO</span>
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold font-mono text-xs inline-flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>DISCREPANCIA {turno.discrepancia != null && (turno.discrepancia < 0 ? `- S/ ${Math.abs(turno.discrepancia).toFixed(2)}` : `+ S/ ${turno.discrepancia.toFixed(2)}`)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Dos Paneles: Cuadratura Gaveta vs Medios de Pago & SUNAT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Panel 1: Cuadratura Gaveta Efectivo */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
                1. CUADRATURA DE GAVETA EN EFECTIVO
              </span>

              <div className="space-y-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Fondo Inicial de Apertura:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    S/ {turno.monto_apertura.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>(+) Cobros en Efectivo Salón:</span>
                  <span>+ S/ 885.00</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>(-) Egresos por Devolución NC:</span>
                  <span>- S/ 85.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>(-) Gastos de Caja Chica:</span>
                  <span>- S/ 0.00</span>
                </div>
                <hr className="border-slate-100 dark:border-slate-800" />
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>(=) Efectivo Esperado en Gaveta:</span>
                  <span>S/ {turno.monto_esperado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>(✓) Efectivo Real Contado por Cajero:</span>
                  <span>
                    S/ {turno.monto_real !== null && turno.monto_real !== undefined ? turno.monto_real.toFixed(2) : turno.monto_esperado.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span>DIFERENCIA / DESCUADRE:</span>
                  <span className={isCuadrada ? 'text-emerald-600' : 'text-rose-600'}>
                    {turno.discrepancia !== null && turno.discrepancia !== undefined
                      ? turno.discrepancia === 0
                        ? 'S/ 0.00 (✓ Cuadrada)'
                        : `${turno.discrepancia < 0 ? `- S/ ${Math.abs(turno.discrepancia).toFixed(2)}` : `+ S/ ${turno.discrepancia.toFixed(2)}`}`
                      : 'S/ 0.00'}
                  </span>
                </div>
              </div>

              {turno.comentario_discrepancia && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                  <strong>Justificación del Cajero:</strong> "{turno.comentario_discrepancia}"
                </div>
              )}
            </div>

            {/* Panel 2: Medios de Pago & SUNAT */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
                2. RECAUDACIÓN POR CANAL Y FISCAL SUNAT
              </span>

              <div className="space-y-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Tarjeta Débito/Crédito ({turno.lote_pos || 'Lote #012'}):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">S/ 1,540.00 (18)</span>
                </div>
                <div className="flex justify-between">
                  <span>Billeteras Digitales (Yape / Plin):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">S/ 420.00 (12)</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo Físico Recaudado:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">S/ 885.00 (14)</span>
                </div>
                <hr className="border-slate-100 dark:border-slate-800" />
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>TOTAL FACTURADO NETO:</span>
                  <span>S/ {turno.total_facturado ? turno.total_facturado.toFixed(2) : '2,845.00'} (44 ctas)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Base Imponible Gravada:</span>
                  <span>S/ 2,411.02</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Impuesto General a las Ventas (IGV 18%):</span>
                  <span>S/ 433.98</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 font-mono">
                Series Fiscales: B001-0004510..4520 (Boletas) • F001-0001201..1203 (Facturas)
              </div>
            </div>
          </div>

          {/* Bloque de Visado Gerencial */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-aurea-copper" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
                  VISADO Y CONFORMIDAD GERENCIAL DE AUDITORÍA
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  turno.revisado
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {turno.revisado ? '✓ Conforme y Auditado' : '⏳ Pendiente de Auditoría'}
              </span>
            </div>

            {turno.revisado ? (
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  Visado firmado digitalmente por: <strong className="text-slate-900 dark:text-white">{turno.revisado_por_nombre || 'Mariana Ramos'}</strong>
                  {turno.revisado_at ? ` el ${new Date(turno.revisado_at).toLocaleString('es-PE')}` : ''}
                </p>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  "{turno.notas_auditoria || 'Turno verificado conforme sin observaciones contables.'}"
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitVisado} className="space-y-3">
                <p className="text-slate-500 text-xs">
                  Como administradora de sede, ingresa tus observaciones de conciliación para asentar la conformidad oficial del turno Z:
                </p>
                <textarea
                  rows={2}
                  value={notasAuditoria}
                  onChange={(e) => setNotasAuditoria(e.target.value)}
                  placeholder="Ej. Arqueo verificado conforme contra lote POS #012 y comprobantes SUNAT..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !notasAuditoria.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  )}
                  <span>Marcar Turno Auditado y Conforme</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleDescargar}
            disabled={descargando}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-700"
          >
            {descargando ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{descargaExitosa ? '✓ PDF Descargado' : 'Descargar Reporte Z en PDF'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
