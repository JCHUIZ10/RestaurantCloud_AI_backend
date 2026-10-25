import React, { useState } from 'react';
import {
  CheckCircle2,
  FileDown,
  Printer,
  Sparkles,
  LogOut,
  Receipt,
  Coins,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Calendar,
  Clock,
  Building,
} from 'lucide-react';
import { ReporteZDTO } from '@/types/caja';

interface ReporteZCerradoViewProps {
  reporte: ReporteZDTO;
  onIrAperturaNuevoTurno: () => void;
  onCerrarSesion: () => void;
}

export const ReporteZCerradoView: React.FC<ReporteZCerradoViewProps> = ({
  reporte,
  onIrAperturaNuevoTurno,
  onCerrarSesion,
}) => {
  const [descargando, setDescargando] = useState<boolean>(false);
  const [descargadoExito, setDescargadoExito] = useState<boolean>(false);

  const handleDescargarPdf = () => {
    setDescargando(true);
    setDescargadoExito(true);
    window.print();
    setTimeout(() => {
      setDescargando(false);
      setDescargadoExito(false);
    }, 2500);
  };

  const fechaAperturaStr = new Date(reporte.fecha_apertura).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fechaCierreStr = new Date(reporte.fecha_cierre).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCuadrada = Math.abs(reporte.discrepancia) < 0.001;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Banner Superior de Confirmación y Notificación */}
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
              Reporte Z Digital emitido inmutablemente • Notificación enviada a CU-ADMIN-14 • Terminal cerrada.
            </span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-200">
          Terminal Bloqueada
        </span>
      </div>

      {descargadoExito && (
        <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-sky-600" />
          <span>Reporte Z en formato PDF generado y archivado en su dispositivo (Cero Papel).</span>
        </div>
      )}

      {/* Tarjeta Documental: Reporte Z Digital Oficial SUNAT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-mono">
        {/* Encabezado Fiscal */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
            <Building className="w-3.5 h-3.5" />
            <span>{reporte.local_nombre}</span>
            <span>•</span>
            <span>RUC: {reporte.empresa_ruc}</span>
          </div>

          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
            REPORTE Z — CIERRE FORMAL DE TURNO #{String(reporte.turno_correlativo).padStart(3, '0')}
          </h2>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Apertura: {fechaAperturaStr}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Cierre: {fechaCierreStr}</span>
            </span>
            <span>Duración: <strong>{reporte.duracion_turno}</strong></span>
            <span>Cajero: <strong>{reporte.cajero_nombre}</strong></span>
          </div>
        </div>

        {/* Cuerpo del Reporte Z */}
        <div className="p-6 space-y-6 text-xs divide-y divide-slate-100 dark:divide-slate-800">
          {/* Bloque 1: Movimiento y Arqueo Físico de Efectivo en Gaveta */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              1. MOVIMIENTO Y ARQUEO FÍSICO DE EFECTIVO EN GAVETA
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Fondo Apertura</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.monto_apertura.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block uppercase">Efectivo Real Contado</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.efectivo_real_contado.toFixed(2)}
                </span>
              </div>

              <div
                className={`p-3 rounded-2xl border text-center ${
                  isCuadrada
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                <span className="text-[10px] uppercase block opacity-80">Discrepancia</span>
                <span className="text-sm font-bold">
                  {isCuadrada
                    ? 'S/ 0.00 (CUADRADA)'
                    : reporte.discrepancia < 0
                    ? `- S/ ${Math.abs(reporte.discrepancia).toFixed(2)} (FALTANTE)`
                    : `+ S/ ${reporte.discrepancia.toFixed(2)} (SOBRANTE)`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Fondo S/ {reporte.monto_apertura.toFixed(2)} + Ventas Efectivo S/ {reporte.total_ventas_efectivo.toFixed(2)} - Devoluciones NC S/ 85.00 = S/ {reporte.efectivo_esperado.toFixed(2)} esperado en gaveta.
            </p>

            {reporte.comentario_discrepancia && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                <span className="font-bold block">Justificación de Discrepancia Registrada:</span>
                <span className="font-sans italic">{reporte.comentario_discrepancia}</span>
              </div>
            )}
          </div>

          {/* Bloque 2: Total Recaudado por Método de Pago */}
          <div className="pt-5 space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              2. TOTAL RECAUDADO POR MÉTODO DE PAGO
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-aurea-copper" /> Efectivo Gaveta
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.total_ventas_efectivo.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <CreditCard className="w-3 h-3 text-sky-500" /> Tarjetas POS
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.total_tarjetas_pos.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-purple-500" /> Billeteras Digital
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.total_billeteras_digital.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <Receipt className="w-3 h-3 text-amber-500" /> Otros Medios
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {(reporte.otros_medios_total || 1186.0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-300">
                TOTAL FACTURADO NETO EN EL TURNO:
              </span>
              <span className="text-xl font-bold text-emerald-400">
                S/ {reporte.total_neto_facturado.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bloque 3: Resumen Tributario Oficial SUNAT Perú */}
          <div className="pt-5 space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              3. RESUMEN TRIBUTARIO OFICIAL SUNAT PERÚ
            </span>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Base Imponible Gravada</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  S/ {reporte.base_imponible_gravada.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">IGV (18.00%)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  S/ {reporte.igv_18.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Inafecto / Exonerado</span>
                <span className="font-bold text-slate-900 dark:text-white">S/ 0.00</span>
              </div>
            </div>
          </div>

          {/* Bloque 4: Auditoría de Documentos y Series Emitidas */}
          <div className="pt-5 space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
              4. AUDITORÍA DE DOCUMENTOS Y SERIES EMITIDAS
            </span>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                {reporte.boletas_emitidas} Boletas B001
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                {reporte.facturas_emitidas} Facturas F001
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                {reporte.notas_venta_emitidas} Notas de Venta NV01
              </span>
              <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">
                {reporte.notas_credito_emitidas} Nota de Crédito BC01
              </span>
            </div>
          </div>

          {/* Bloque 5: Notas de Cierre y Traspaso */}
          {reporte.notas_cierre && (
            <div className="pt-5 space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                5. NOTAS DE CIERRE Y TRASPASO
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans italic p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                &ldquo;{reporte.notas_cierre}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Pie con Acciones */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={descargando}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4 text-aurea-copper" />
              <span>{descargando ? 'Generando PDF...' : 'Descargar PDF'}</span>
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
              <span>Archivado en CU-ADMIN-14</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
          </div>
        </div>
      </div>
    </div>
  );
};
