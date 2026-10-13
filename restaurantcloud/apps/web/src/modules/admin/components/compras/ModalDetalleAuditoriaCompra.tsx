import React, { useEffect, useState } from 'react';
import { X, Receipt, Ban, TrendingUp, TrendingDown, Clock, User, Building, Printer, Loader2 } from 'lucide-react';
import { FichaCompraDetalleCompletoDTO } from '@/types/admin';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';

interface ModalDetalleAuditoriaCompraProps {
  fichaId: string | null;
  abierto: boolean;
  onCerrar: () => void;
}

export const ModalDetalleAuditoriaCompra: React.FC<ModalDetalleAuditoriaCompraProps> = ({
  fichaId,
  abierto,
  onCerrar,
}) => {
  const [detalle, setDetalle] = useState<FichaCompraDetalleCompletoDTO | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (abierto && fichaId) {
      cargarDetalle(fichaId);
    }
  }, [abierto, fichaId]);

  const cargarDetalle = async (id: string) => {
    try {
      setCargando(true);
      const res = await mockAdminService.getFichaCompraDetalle(id);
      if (res.exito && res.datos) {
        setDetalle(res.datos);
      }
    } finally {
      setCargando(false);
    }
  };

  if (!abierto || !fichaId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 border border-primary-200">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">
                  Auditoría de Ficha: {detalle?.numero_comprobante || 'Cargando...'}
                </h3>
                {detalle && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      detalle.estado === 'ANULADA'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {detalle.estado}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono">
                {detalle?.codigo_correlativo} • {detalle?.tipo_comprobante}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {cargando || !detalle ? (
            <div className="py-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
              <span>Cargando detalles de comprobante...</span>
            </div>
          ) : (
            <>
              {/* Alerta de Anulación si aplica */}
              {detalle.estado === 'ANULADA' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Comprobante Anulado</span>
                  </div>
                  <p className="text-xs">
                    <strong>Motivo:</strong> {detalle.motivo_anulacion || 'Sin motivo especificado'}
                  </p>
                  {detalle.fecha_anulacion && (
                    <p className="text-[11px] text-rose-600 font-mono">
                      Anulado el: {new Date(detalle.fecha_anulacion).toLocaleString('es-PE')}
                    </p>
                  )}
                </div>
              )}

              {/* Ficha Header Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <div className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    <span>Proveedor</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{detalle.proveedor_nombre}</p>
                  {detalle.proveedor_telefono && (
                    <p className="text-gray-600 mt-0.5">Tel: {detalle.proveedor_telefono}</p>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Fechas y Registro</span>
                  </div>
                  <p className="text-gray-800">
                    <strong>Fecha Emisión:</strong> {detalle.fecha_emision}
                  </p>
                  <p className="text-gray-600 mt-0.5">
                    <strong>Método:</strong> {detalle.metodo_pago}
                  </p>
                  <p className="text-gray-500 mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Registrado por: {detalle.registrado_por_nombre}</span>
                  </p>
                </div>
              </div>

              {/* Tabla de Líneas de Insumos */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Líneas de Insumos ({detalle.items.length})
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Insumo</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Precio Unit. (S/)</th>
                        <th className="py-2.5 px-3 text-center">Variación</th>
                        <th className="py-2.5 px-3 text-right">Subtotal (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detalle.items.map((it) => (
                        <tr key={it.id} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {it.insumo_nombre}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {it.cantidad} {it.unidad_medida}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            S/ {it.precio_unitario.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {it.variacion_porcentaje === 0 ? (
                              <span className="text-[11px] text-gray-400 font-mono">0.0%</span>
                            ) : it.variacion_porcentaje > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                <TrendingUp className="w-3 h-3" />
                                +{it.variacion_porcentaje.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <TrendingDown className="w-3 h-3" />
                                {it.variacion_porcentaje.toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                            S/ {it.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Desglose Contable */}
              <div className="flex justify-end">
                <div className="w-64 bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                  {detalle.tipo_comprobante === 'FACTURA' && (
                    <>
                      <div className="flex justify-between text-gray-500 font-mono">
                        <span>Base Imponible:</span>
                        <span>S/ {detalle.subtotal_neto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-700 font-mono font-medium">
                        <span>IGV (18%):</span>
                        <span>S/ {detalle.igv_monto.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 my-1" />
                    </>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Total Comprobante:</span>
                    <span className="text-base text-primary-700 font-mono">
                      S/ {detalle.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {detalle.observaciones && (
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 border border-gray-200">
                  <span className="font-semibold text-gray-500 uppercase text-[10px] block mb-0.5">
                    Observaciones registradas
                  </span>
                  {detalle.observaciones}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ficha</span>
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
