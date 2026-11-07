import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, ExternalLink, FileText } from 'lucide-react';
import { cn, formatPEN } from '@/shared/utils';
import type { ComprobanteHistorialItemDTO, PaginacionHistorialDTO } from '@/types/caja';
import { EstadoFiscalBadge, MedioPagoChip } from './ComprobanteBadges';
import { etiquetaBotonVer, etiquetaTipo, montoMostrado, ventanaDePaginas } from './comprobanteFormato';

interface TablaHistorialComprobantesProps {
  comprobantes: ComprobanteHistorialItemDTO[];
  paginacion: PaginacionHistorialDTO;
  seleccionadoId: string | null;
  cargando: boolean;
  onSeleccionar: (comprobante: ComprobanteHistorialItemDTO) => void;
  onVerDocumento: (token?: string | null) => void;
  onAnular: (comprobante: ComprobanteHistorialItemDTO) => void;
  onCambiarPagina: (pagina: number) => void;
}

const Paginacion: React.FC<{
  paginacion: PaginacionHistorialDTO;
  onCambiarPagina: (pagina: number) => void;
}> = ({ paginacion, onCambiarPagina }) => {
  const { total, pagina, limite, total_paginas: totalPaginas } = paginacion;
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  const botonBase =
    'min-h-10 min-w-10 px-2.5 rounded-lg border text-sm font-bold transition-colors flex items-center justify-center gap-1';

  return (
    <nav
      aria-label="Paginación de comprobantes"
      className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
    >
      <span className="text-slate-500 font-mono text-center sm:text-left">
        Mostrando <strong>{desde}</strong> - <strong>{hasta}</strong> de <strong>{total}</strong> comprobantes
      </span>

      <div className="flex items-center gap-1.5 font-mono">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => onCambiarPagina(pagina - 1)}
          className={cn(botonBase, 'border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100')}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {ventanaDePaginas(pagina, totalPaginas).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              aria-current={item === pagina ? 'page' : undefined}
              onClick={() => onCambiarPagina(item)}
              className={cn(
                botonBase,
                item === pagina
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-transparent text-slate-600 hover:bg-slate-200'
              )}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="px-1 text-slate-400" aria-hidden="true">
              …
            </span>
          )
        )}

        <button
          type="button"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiarPagina(pagina + 1)}
          className={cn(botonBase, 'border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100')}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

interface AccionesProps {
  comprobante: ComprobanteHistorialItemDTO;
  onVerDocumento: (token?: string | null) => void;
  onAnular: (comprobante: ComprobanteHistorialItemDTO) => void;
}

/** Acciones de la fila; se detienen los clics para no abrir el detalle al pulsarlas. */
const Acciones: React.FC<AccionesProps> = ({ comprobante, onVerDocumento, onAnular }) => {
  const esAnulado = comprobante.estado === 'anulado';
  const esNotaCredito = comprobante.tipo_comprobante === 'nota_credito';
  const detener = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={detener}>
      <button
        type="button"
        onClick={() => onVerDocumento(comprobante.token_digital)}
        className="min-h-10 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        title="Abrir el documento digital en una pestaña nueva"
      >
        <ExternalLink className="w-4 h-4 text-amber-500" aria-hidden="true" />
        <span>{etiquetaBotonVer(comprobante.tipo_comprobante)}</span>
      </button>

      {!esAnulado && !esNotaCredito && (
        <button
          type="button"
          onClick={() => onAnular(comprobante)}
          className="min-h-10 px-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Anular el comprobante y emitir una Nota de Crédito electrónica"
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" aria-hidden="true" />
          <span>Anular con NC</span>
        </button>
      )}

      {esAnulado && comprobante.nota_credito_token && (
        <button
          type="button"
          onClick={() => onVerDocumento(comprobante.nota_credito_token)}
          className="min-h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Ver la Nota de Crédito que anuló este comprobante"
        >
          <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span>Ver NC</span>
        </button>
      )}
    </div>
  );
};

const filaTotal = (c: ComprobanteHistorialItemDTO) => {
  const esAnulado = c.estado === 'anulado';
  return (
    <>
      <span
        className={cn(
          'font-mono font-bold',
          esAnulado ? 'line-through text-slate-400' : c.total < 0 ? 'text-rose-600' : 'text-slate-900'
        )}
      >
        {formatPEN(montoMostrado(c.total))}
      </span>
      {c.total < 0 && <span className="text-xs text-rose-500 block font-normal">Extorno</span>}
    </>
  );
};

const claseFila = (c: ComprobanteHistorialItemDTO, seleccionado: boolean) =>
  cn(
    'transition-colors cursor-pointer',
    seleccionado
      ? 'bg-amber-50'
      : c.estado === 'anulado'
      ? 'bg-rose-50/40 hover:bg-rose-50/70'
      : c.tipo_comprobante === 'nota_credito'
      ? 'bg-amber-50/30 hover:bg-amber-50/60'
      : 'hover:bg-slate-50'
  );

export const TablaHistorialComprobantes: React.FC<TablaHistorialComprobantesProps> = ({
  comprobantes,
  paginacion,
  seleccionadoId,
  cargando,
  onSeleccionar,
  onVerDocumento,
  onAnular,
  onCambiarPagina,
}) => {
  if (comprobantes.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">No se encontraron comprobantes con los filtros seleccionados</p>
        <p className="text-sm text-slate-400 mt-1">Ajuste la búsqueda o seleccione otro estado, tipo o medio de pago.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 shadow-xs bg-white overflow-hidden transition-opacity',
        cargando && 'opacity-60'
      )}
      aria-busy={cargando}
    >
      {/* Tablet y escritorio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase font-mono text-xs tracking-wider border-b border-slate-200">
              <th scope="col" className="py-3 px-4">Comprobante</th>
              <th scope="col" className="py-3 px-3">Hora</th>
              <th scope="col" className="py-3 px-3">Mesa</th>
              <th scope="col" className="py-3 px-4">Cliente</th>
              <th scope="col" className="py-3 px-3">Medio de pago</th>
              <th scope="col" className="py-3 px-3 text-right">Total</th>
              <th scope="col" className="py-3 px-3 text-center">Estado fiscal</th>
              <th scope="col" className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comprobantes.map((c) => (
              <tr key={c.id} onClick={() => onSeleccionar(c)} className={claseFila(c, c.id === seleccionadoId)}>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeleccionar(c);
                    }}
                    className={cn(
                      'font-mono font-bold text-left hover:underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded',
                      c.estado === 'anulado' ? 'line-through text-slate-400' : 'text-slate-900'
                    )}
                    aria-label={`Ver detalle de ${c.serie_numero}`}
                  >
                    {c.serie_numero}
                  </button>
                  <span className="text-xs text-slate-500 block">{etiquetaTipo(c.tipo_comprobante)}</span>
                </td>

                <td className="py-3 px-3 font-mono text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {c.hora}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-800">
                    Mesa {c.mesa_numero}
                    {c.subcuenta_numero && (
                      <span className="ml-1 text-xs font-normal text-amber-600">(Sub #{c.subcuenta_numero})</span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400 block">Comanda #{c.comanda_numero}</span>
                </td>

                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{c.cliente_nombre}</div>
                  {c.cliente_documento ? (
                    <span className="text-xs font-mono text-slate-500">DOC: {c.cliente_documento}</span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Consumidor final</span>
                  )}
                </td>

                <td className="py-3 px-3">
                  <MedioPagoChip medio={c.medio_pago} nombre={c.metodo_pago_nombre} numeroOperacion={c.numero_operacion} />
                </td>

                <td className="py-3 px-3 text-right">{filaTotal(c)}</td>

                <td className="py-3 px-3 text-center" title={c.sustento_motivo || undefined}>
                  <EstadoFiscalBadge comprobante={c} />
                  {c.motivo_codigo_sunat && (
                    <span className="text-xs text-slate-500 block mt-0.5">Motivo {c.motivo_codigo_sunat}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <Acciones comprobante={c} onVerDocumento={onVerDocumento} onAnular={onAnular} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: lista de tarjetas */}
      <ul className="md:hidden divide-y divide-slate-100">
        {comprobantes.map((c) => (
          <li key={c.id} className={cn('p-4 space-y-3', claseFila(c, c.id === seleccionadoId))} onClick={() => onSeleccionar(c)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeleccionar(c);
                  }}
                  className={cn(
                    'font-mono font-bold text-left',
                    c.estado === 'anulado' ? 'line-through text-slate-400' : 'text-slate-900'
                  )}
                  aria-label={`Ver detalle de ${c.serie_numero}`}
                >
                  {c.serie_numero}
                </button>
                <span className="text-xs text-slate-500 block">
                  {etiquetaTipo(c.tipo_comprobante)} · {c.hora} · Mesa {c.mesa_numero}
                </span>
              </div>
              <div className="text-right shrink-0">{filaTotal(c)}</div>
            </div>

            <div className="text-sm">
              <span className="font-semibold text-slate-800">{c.cliente_nombre}</span>
              <span className="text-xs text-slate-500 block">
                {c.cliente_documento ? `DOC: ${c.cliente_documento}` : 'Consumidor final'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <MedioPagoChip medio={c.medio_pago} nombre={c.metodo_pago_nombre} numeroOperacion={c.numero_operacion} />
              <EstadoFiscalBadge comprobante={c} />
            </div>

            <Acciones comprobante={c} onVerDocumento={onVerDocumento} onAnular={onAnular} />
          </li>
        ))}
      </ul>

      <Paginacion paginacion={paginacion} onCambiarPagina={onCambiarPagina} />
    </div>
  );
};
