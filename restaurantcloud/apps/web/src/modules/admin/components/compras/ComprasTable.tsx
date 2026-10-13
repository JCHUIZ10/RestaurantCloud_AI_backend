import React from 'react';
import { Eye, Ban, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import { FichaCompraResumenDTO, TipoComprobanteCompra, MetodoPagoCompra, EstadoFichaCompra } from '@/types/admin';

interface ComprasTableProps {
  fichas: FichaCompraResumenDTO[];
  cargando: boolean;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamanoPagina: number;
  onCambiarPagina: (pag: number) => void;
  onVerDetalle: (fichaId: string) => void;
  onSolicitarAnulacion: (ficha: FichaCompraResumenDTO) => void;
}

export const ComprasTable: React.FC<ComprasTableProps> = ({
  fichas,
  cargando,
  paginaActual,
  totalPaginas,
  totalRegistros,
  tamanoPagina,
  onCambiarPagina,
  onVerDetalle,
  onSolicitarAnulacion,
}) => {
  const getBadgeTipoComprobante = (tipo: TipoComprobanteCompra) => {
    switch (tipo) {
      case 'FACTURA':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            FACTURA (18%)
          </span>
        );
      case 'BOLETA':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            BOLETA
          </span>
        );
      case 'NOTA_VENTA':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            NOTA DE VENTA
          </span>
        );
      case 'GUIA_REMISION':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            GUÍA REMISIÓN
          </span>
        );
      case 'RECIBO':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            RECIBO
          </span>
        );
      default:
        return null;
    }
  };

  const getBadgeMetodoPago = (metodo: MetodoPagoCompra) => {
    switch (metodo) {
      case 'TRANSFERENCIA':
        return <span className="text-xs font-medium text-gray-700">Transferencia Bancaria</span>;
      case 'YAPE_PLIN':
        return <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Billetera (Yape/Plin)</span>;
      case 'EFECTIVO':
        return <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Efectivo Caja Chica</span>;
      case 'CREDITO_30D':
        return <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Crédito a 30 días</span>;
      default:
        return <span className="text-xs text-gray-500">{metodo}</span>;
    }
  };

  const getBadgeEstado = (estado: EstadoFichaCompra, motivo?: string) => {
    if (estado === 'ANULADA') {
      return (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
            <Ban className="w-3 h-3" />
            ANULADA
          </span>
          {motivo && (
            <span className="text-[11px] text-rose-600 line-clamp-1 max-w-[180px] mt-0.5" title={motivo}>
              {motivo}
            </span>
          )}
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
        <FileCheck className="w-3 h-3" />
        REGISTRADA
      </span>
    );
  };

  const formatoFecha = (fechaStr: string) => {
    try {
      const f = new Date(fechaStr + 'T12:00:00Z');
      return f.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  if (cargando) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
        <p className="mt-2 text-sm text-gray-500">Cargando fichas de compra...</p>
      </div>
    );
  }

  const inicio = totalRegistros === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1;
  const fin = Math.min(paginaActual * tamanoPagina, totalRegistros);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Comprobante / Código</th>
              <th className="py-3 px-4">Proveedor</th>
              <th className="py-3 px-4">Fecha Emisión</th>
              <th className="py-3 px-4">Método de Pago</th>
              <th className="py-3 px-4 text-right">Total Liquidado</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fichas.map((ficha) => {
              const esAnulada = ficha.estado === 'ANULADA';
              return (
                <tr
                  key={ficha.id}
                  className={`hover:bg-gray-50/70 transition-colors ${esAnulada ? 'bg-rose-50/20' : ''}`}
                >
                  {/* Comprobante */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {getBadgeTipoComprobante(ficha.tipo_comprobante)}
                        <span className={`font-semibold ${esAnulada ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {ficha.numero_comprobante}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {ficha.codigo_correlativo} • {ficha.cantidad_items} ítem(s)
                      </span>
                    </div>
                  </td>

                  {/* Proveedor */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900">{ficha.proveedor_nombre}</div>
                    {ficha.proveedor_telefono && (
                      <div className="text-xs text-gray-500">{ficha.proveedor_telefono}</div>
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                    {formatoFecha(ficha.fecha_emision)}
                  </td>

                  {/* Método Pago */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getBadgeMetodoPago(ficha.metodo_pago)}
                  </td>

                  {/* Total y desglose IGV */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className={`font-bold ${esAnulada ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      S/ {ficha.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {ficha.tipo_comprobante === 'FACTURA' && (
                      <div className="text-[11px] text-gray-400 font-mono">
                        Base: S/{ficha.subtotal_neto.toFixed(2)} | IGV: S/{ficha.igv_monto.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getBadgeEstado(ficha.estado, ficha.motivo_anulacion)}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onVerDetalle(ficha.id)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver detalle y auditoría de líneas"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!esAnulada ? (
                        <button
                          type="button"
                          onClick={() => onSolicitarAnulacion(ficha)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Anular ficha de compra"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-gray-300 cursor-not-allowed">
                          <Ban className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <div>
          Mostrando <span className="font-semibold text-gray-900">{inicio}</span> a{' '}
          <span className="font-semibold text-gray-900">{fin}</span> de{' '}
          <span className="font-semibold text-gray-900">{totalRegistros}</span> fichas
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={paginaActual <= 1}
            onClick={() => onCambiarPagina(paginaActual - 1)}
            className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-medium text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            type="button"
            disabled={paginaActual >= totalPaginas}
            onClick={() => onCambiarPagina(paginaActual + 1)}
            className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
