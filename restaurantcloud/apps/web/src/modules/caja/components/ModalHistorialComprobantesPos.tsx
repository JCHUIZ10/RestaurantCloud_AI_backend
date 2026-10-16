import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Search,
  FileText,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Ban,
  Clock,
  Receipt,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  CajaTurnoDTO,
  ComprobanteHistorialItemDTO,
} from '@/types/caja';
import { mockCajaService } from '../services/mockCajaService';

interface ModalHistorialComprobantesPosProps {
  isOpen: boolean;
  onClose: () => void;
  turnoActivo: CajaTurnoDTO;
  onAnularComprobante: (comp: ComprobanteHistorialItemDTO) => void;
  onVerQR: (comp: ComprobanteHistorialItemDTO) => void;
}

const ITEMS_POR_PAGINA = 5;

export const ModalHistorialComprobantesPos: React.FC<ModalHistorialComprobantesPosProps> = ({
  isOpen,
  onClose,
  turnoActivo,
  onAnularComprobante,
  onVerQR,
}) => {
  const [comprobantes, setComprobantes] = useState<ComprobanteHistorialItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<'vigente' | 'anulado' | 'todos'>('vigente');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'boleta' | 'factura' | 'nota_venta' | 'nota_credito'>('todos');
  
  // Búsqueda no dinámica (solo se ejecuta al pulsar el botón Buscar o Enter)
  const [inputBusqueda, setInputBusqueda] = useState<string>('');
  const [busquedaAplicada, setBusquedaAplicada] = useState<string>('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState<number>(1);

  const cargarComprobantes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mockCajaService.getComprobantesTurno({
        estado: filtroEstado,
        tipo: filtroTipo,
        q: busquedaAplicada,
      });
      if (res.exito && res.datos) {
        setComprobantes(res.datos);
      }
    } catch (err) {
      console.error('Error al cargar comprobantes:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo, busquedaAplicada]);

  useEffect(() => {
    if (isOpen) {
      cargarComprobantes();
    }
  }, [isOpen, cargarComprobantes]);

  // Manejo de atajo de teclado Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Contadores y métricas agregadas del turno
  const metricasTurno = useMemo(() => {
    const vigentes = comprobantes.filter((c) => c.estado === 'emitido' && c.tipo_comprobante !== 'nota_credito');
    const anulados = comprobantes.filter((c) => c.estado === 'anulado');
    const totalFacturadoNeto = vigentes.reduce((acc, c) => acc + c.total, 0);

    return {
      vigentesCount: vigentes.length,
      anuladosCount: anulados.length,
      totalComprobantes: comprobantes.length,
      totalFacturadoNeto,
    };
  }, [comprobantes]);

  // Cálculos de Paginación
  const totalItems = comprobantes.length;
  const totalPaginas = Math.ceil(totalItems / ITEMS_POR_PAGINA) || 1;
  const paginaSegura = Math.min(Math.max(1, paginaActual), totalPaginas);
  const indiceInicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const indiceFin = Math.min(indiceInicio + ITEMS_POR_PAGINA, totalItems);
  const comprobantesPaginados = useMemo(() => {
    return comprobantes.slice(indiceInicio, indiceFin);
  }, [comprobantes, indiceInicio, indiceFin]);

  const handleCambiarFiltroEstado = (nuevoEstado: 'vigente' | 'anulado' | 'todos') => {
    setFiltroEstado(nuevoEstado);
    setPaginaActual(1);
  };

  const handleCambiarFiltroTipo = (nuevoTipo: 'todos' | 'boleta' | 'factura' | 'nota_venta' | 'nota_credito') => {
    setFiltroTipo(nuevoTipo);
    setPaginaActual(1);
  };

  const handleEjecutarBusqueda = () => {
    setBusquedaAplicada(inputBusqueda.trim());
    setPaginaActual(1);
  };

  const handleLimpiarBusqueda = () => {
    setInputBusqueda('');
    setBusquedaAplicada('');
    setPaginaActual(1);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-historial-comprobantes"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        {/* 1. Header con Información de Turno */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="titulo-historial-comprobantes" className="text-base font-bold text-slate-900 dark:text-white">
                  Historial de Comprobantes Emitidos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-mono font-bold">
                  ● Turno #{String(turnoActivo.correlativo).padStart(3, '0')} Abierto
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Cajero: <strong>{turnoActivo.cajero_nombre}</strong></span>
                <span>•</span>
                <span>Gestión de ventas, trazabilidad fiscal SUNAT y emisión de Notas de Crédito</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Tarjetas KPI de Resumen del Turno */}
        <div className="px-6 py-3.5 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 font-mono">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Vigentes / Emitidos
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metricasTurno.vigentesCount}
              </span>
              <span className="text-[11px] text-slate-500 font-sans">comprobantes</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-500 block">
              Anulados (con NC)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                {metricasTurno.anuladosCount}
              </span>
              <span className="text-[11px] text-slate-500 font-sans">extornados</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Facturado Neto
            </span>
            <div className="mt-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                S/ {metricasTurno.totalFacturadoNeto.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
              Efectivo en Gaveta
            </span>
            <div className="mt-1">
              <span className="text-xl font-extrabold text-amber-900 dark:text-amber-100">
                S/ {(turnoActivo.efectivo_actual || turnoActivo.monto_apertura).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Barra de Filtros de Estado, Tipo y Buscador No Dinámico */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs Estado */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleCambiarFiltroEstado('vigente')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filtroEstado === 'vigente'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ● Vigentes
              </button>
              <button
                type="button"
                onClick={() => handleCambiarFiltroEstado('anulado')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filtroEstado === 'anulado'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🚫 Anulados
              </button>
              <button
                type="button"
                onClick={() => handleCambiarFiltroEstado('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filtroEstado === 'todos'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Selector de Tipo */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-medium">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'boleta', label: 'Boletas' },
                  { id: 'factura', label: 'Facturas' },
                  { id: 'nota_venta', label: 'Notas Venta' },
                  { id: 'nota_credito', label: 'NC' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleCambiarFiltroTipo(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all ${
                    filtroTipo === t.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buscador No Dinámico con Botón Buscar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEjecutarBusqueda();
            }}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputBusqueda}
                onChange={(e) => setInputBusqueda(e.target.value)}
                placeholder="Serie, cliente o documento..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
              />
              {inputBusqueda && (
                <button
                  type="button"
                  onClick={handleLimpiarBusqueda}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs w-4 h-4 flex items-center justify-center rounded-full"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
              title="Buscar comprobantes"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </form>
        </div>

        {/* 4. Tabla de Listado de Comprobantes Oficiales */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[320px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RotateCcw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
              <p className="text-xs">Cargando registros fiscales del turno...</p>
            </div>
          ) : comprobantes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No se encontraron comprobantes con los filtros seleccionados
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste el término de búsqueda o seleccione otro estado / tipo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 uppercase font-mono text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Comprobante / Serie</th>
                    <th className="py-3 px-3">Hora</th>
                    <th className="py-3 px-3">Mesa / Subcuenta</th>
                    <th className="py-3 px-4">Cliente / Documento</th>
                    <th className="py-3 px-3">Medio Pago</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-center">Estado Fiscal</th>
                    <th className="py-3 px-4 text-right">Acciones Caja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {comprobantesPaginados.map((c) => {
                    const isAnulado = c.estado === 'anulado';
                    const isNC = c.tipo_comprobante === 'nota_credito';

                    return (
                      <tr
                        key={c.id}
                        className={`transition-colors ${
                          isAnulado
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70'
                            : isNC
                            ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Serie y Tipo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isAnulado
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {c.serie_numero}
                            </span>
                            {isNC && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                NC
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block capitalize">
                            {c.tipo_comprobante === 'nota_credito'
                              ? 'Nota de Crédito'
                              : c.tipo_comprobante.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Hora */}
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {c.hora}
                          </span>
                        </td>

                        {/* Mesa / Subcuenta */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Mesa {c.mesa_numero}
                            {c.subcuenta_numero && (
                              <span className="ml-1 text-[11px] font-normal text-amber-600 dark:text-amber-400">
                                (Sub #{c.subcuenta_numero})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Comanda #{c.comanda_numero}
                          </span>
                        </td>

                        {/* Cliente y Documento Limpio */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {c.cliente_nombre}
                          </div>
                          {c.cliente_documento ? (
                            <span className="text-[11px] font-mono text-slate-500">
                              DOC: {c.cliente_documento}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Consumidor Final
                            </span>
                          )}
                        </td>

                        {/* Medio de Pago */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                            {c.medio_pago === 'efectivo' && '💵 Efectivo'}
                            {c.medio_pago === 'tarjeta' && '💳 Tarjeta POS'}
                            {c.medio_pago === 'billetera_digital' && '📱 Billetera / Yape'}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              isAnulado
                                ? 'line-through text-slate-400'
                                : c.total < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }
                          >
                            S/ {Math.abs(c.total).toFixed(2)}
                          </span>
                          {c.total < 0 && (
                            <span className="text-[10px] text-rose-500 block font-normal">
                              Extorno
                            </span>
                          )}
                        </td>

                        {/* Estado Fiscal */}
                        <td className="py-3 px-3 text-center">
                          {isAnulado ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-bold">
                                <Ban className="w-3 h-3" />
                                ANULADO
                              </span>
                              {c.nota_credito_serie_numero && (
                                <span className="text-[10px] text-rose-500 block font-mono mt-0.5">
                                  Por {c.nota_credito_serie_numero}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              EMITIDO
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón QR Dinámico */}
                            <button
                              type="button"
                              onClick={() => onVerQR(c)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                              title="Ver Token Digital QR y enlace público"
                            >
                              <QrCode className="w-3.5 h-3.5 text-slate-500" />
                              <span>QR</span>
                            </button>

                            {/* Botón Anular con NC (Solo para emitidos vigentes no-NC) */}
                            {!isAnulado && !isNC && (
                              <button
                                type="button"
                                onClick={() => onAnularComprobante(c)}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                title="Anular comprobante y emitir Nota de Crédito Electrónica"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Anular NC</span>
                              </button>
                            )}

                            {/* Si ya está anulado, botón para ver NC */}
                            {isAnulado && c.nota_credito_id && (
                              <button
                                type="button"
                                onClick={() => onVerQR(c)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Ver comprobante de anulación"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ver NC</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Barra de Paginación */}
              {totalItems > 0 && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-mono text-center sm:text-left">
                    Mostrando <strong>{totalItems === 0 ? 0 : indiceInicio + 1}</strong> -{' '}
                    <strong>{indiceFin}</strong> de <strong>{totalItems}</strong> comprobantes
                  </span>

                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      disabled={paginaSegura <= 1}
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-bold shadow-2xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPaginaActual(num)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            paginaSegura === num
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={paginaSegura >= totalPaginas}
                      onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-bold shadow-2xs"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Footer con Salvaguarda y Atajos */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Normativa SUNAT:</span>
            <span>Los comprobantes emitidos son inmutables; las rectificaciones requieren Nota de Crédito.</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
              Esc cerrar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
