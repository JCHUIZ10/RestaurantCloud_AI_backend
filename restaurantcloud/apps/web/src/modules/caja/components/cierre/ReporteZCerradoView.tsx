import React, { useState, useEffect, useRef } from 'react';
import { DetalleNotasCreditoTurno } from './DetalleNotasCreditoTurno';
import { ResumenRecargosTurno } from './ResumenRecargosTurno';
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
  Info,
  ArrowLeft,
} from 'lucide-react';
import { ReporteZDTO } from '@/types/caja';
import { apiClient } from '@/services/api/client';
import { esMedioVisible } from '../../utils/mediosVisibles';

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

const ETIQUETA_TIPO_COMPROBANTE: Record<'boleta' | 'factura' | 'nota_venta', string> = {
  boleta: 'Boletas',
  factura: 'Facturas',
  nota_venta: 'Notas de venta',
};

export const ReporteZCerradoView: React.FC<ReporteZCerradoViewProps> = ({
  reporte,
  modo = 'cierre',
  onVolver,
  onIrAperturaNuevoTurno,
  onCerrarSesion,
}) => {
  const esConsulta = modo === 'consulta';
  const [descargando, setDescargando] = useState<boolean>(false);
  const [descargadoExito, setDescargadoExito] = useState<boolean>(false);
  const [errorDescarga, setErrorDescarga] = useState<boolean>(false);
  const avisoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (avisoTimerRef.current) clearTimeout(avisoTimerRef.current);
    };
  }, []);

  const handleDescargarPdf = async () => {
    setDescargando(true);
    setErrorDescarga(false);
    setDescargadoExito(false);
    if (avisoTimerRef.current) clearTimeout(avisoTimerRef.current);
    try {
      const endpoint =
        reporte.url_descarga_pdf ||
        (reporte.caja_id ? `/caja/turnos/${reporte.caja_id}/reporte-z/pdf` : null);

      if (!endpoint) {
        // Sin enlace de descarga no hay archivo que confirmar: se ofrece la impresión del navegador
        setErrorDescarga(true);
        return;
      }

      const response = await apiClient.get(endpoint, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `reporte-z-turno-${String(reporte.turno_correlativo).padStart(3, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      // El aviso de éxito solo aparece cuando el PDF realmente se descargó
      setDescargadoExito(true);
      avisoTimerRef.current = setTimeout(() => setDescargadoExito(false), 3000);
    } catch (err) {
      console.warn('Fallo al descargar el PDF del Reporte Z:', err);
      setErrorDescarga(true);
    } finally {
      setDescargando(false);
    }
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

  // Z cerrado antes de esta regla (sin medios_visibles): se muestran todos los medios, como se cerró.
  const esZAntiguo = reporte.medios_visibles === undefined;
  const mostrarTarjetas = esMedioVisible(reporte.medios_visibles, 'tarjeta');
  const mostrarBilleteras = esMedioVisible(reporte.medios_visibles, 'billetera_digital');
  const mostrarOtros = esZAntiguo || (reporte.otros_medios_total ?? 0) !== 0;
  // Clases literales para que Tailwind las incluya; evita huecos cuando se ocultan medios
  const columnasMedios = 1 + Number(mostrarTarjetas) + Number(mostrarBilleteras) + Number(mostrarOtros);
  const claseGrillaMedios =
    columnasMedios === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : columnasMedios === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : columnasMedios === 2
      ? 'grid-cols-2'
      : 'grid-cols-1';

  const isCuadrada = Math.abs(reporte.discrepancia) < 0.001;

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
        /* Banner Superior de Confirmación y Notificación */
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
              Fondo S/ {reporte.monto_apertura.toFixed(2)} + Ventas Efectivo S/ {reporte.total_ventas_efectivo.toFixed(2)}{(reporte.total_devoluciones_efectivo ?? 0) > 0 ? ` - Devoluciones NC S/ ${(reporte.total_devoluciones_efectivo ?? 0).toFixed(2)}` : ''} = S/ {reporte.efectivo_esperado.toFixed(2)} esperado en gaveta.
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

            <div className={`grid ${claseGrillaMedios} gap-2 text-center text-xs`}>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-aurea-copper" /> Efectivo Gaveta
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {(reporte.total_efectivo_neto ?? reporte.total_ventas_efectivo).toFixed(2)}
                </span>
              </div>

              {mostrarTarjetas && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <CreditCard className="w-3 h-3 text-sky-500" /> Tarjetas POS
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.total_tarjetas_pos.toFixed(2)}
                </span>
              </div>

              )}

              {mostrarBilleteras && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-purple-500" /> Billeteras Digital
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {reporte.total_billeteras_digital.toFixed(2)}
                </span>
              </div>

              )}

              {mostrarOtros && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                  <Receipt className="w-3 h-3 text-amber-500" /> Otros Medios
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  S/ {(reporte.otros_medios_total ?? 0.0).toFixed(2)}
                </span>
              </div>
              )}
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

          {/* Consumo vs recargos (solo en Z que lo guardaron y con recargos en el turno) */}
          {(reporte.total_recargos ?? 0) > 0 && (
            <div className="pt-5">
              <ResumenRecargosTurno
                totalNeto={reporte.total_neto_facturado}
                recargoTarjetas={reporte.recargo_tarjetas ?? 0}
                recargoBilleteras={reporte.recargo_billeteras ?? 0}
                totalRecargos={reporte.total_recargos ?? 0}
                ingresoConsumo={reporte.ingreso_consumo ?? reporte.total_neto_facturado}
              />
            </div>
          )}

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

          {/* Ventas por tipo de comprobante y descuentos (solo en Z que lo guardaron al cerrar) */}
          {(reporte.ventas_por_tipo?.length ?? 0) > 0 && (
            <div className="pt-5 space-y-3">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                Ventas vigentes por tipo de comprobante
              </span>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wide">
                      <th className="px-3 py-2 font-bold">Tipo</th>
                      <th className="px-3 py-2 text-center font-bold">Cantidad</th>
                      <th className="px-3 py-2 text-right font-bold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(reporte.ventas_por_tipo ?? []).map((t) => (
                      <tr key={t.tipo}>
                        <td className="px-3 py-2 font-sans text-slate-700 dark:text-slate-300">
                          {ETIQUETA_TIPO_COMPROBANTE[t.tipo]}
                          {t.tipo === 'nota_venta' && (
                            <span className="block text-[10px] text-slate-400">Documento interno, no es comprobante SUNAT</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">{t.cantidad}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">S/ {t.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(reporte.descuentos_turno?.total ?? 0) > 0 && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Descuentos y promociones aplicados: <strong>S/ {(reporte.descuentos_turno?.total ?? 0).toFixed(2)}</strong>{' '}
                  en {reporte.descuentos_turno?.comprobantes} comprobante{reporte.descuentos_turno?.comprobantes === 1 ? '' : 's'}.
                </p>
              )}
            </div>
          )}

          {/* Detalle de notas de crédito (solo en Z que lo guardaron al cerrar) */}
          {(reporte.notas_credito_detalle?.length ?? 0) > 0 && (
            <div className="pt-5 space-y-3">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                Detalle de notas de crédito del turno
              </span>
              <DetalleNotasCreditoTurno notas={reporte.notas_credito_detalle ?? []} />
            </div>
          )}

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
              <span>Archivado en CU-ADMIN-14</span>
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
      </div>
    </div>
  );
};
