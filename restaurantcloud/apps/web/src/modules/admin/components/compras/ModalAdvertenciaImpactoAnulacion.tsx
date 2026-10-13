import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Ban, ChefHat, Utensils, Loader2 } from 'lucide-react';
import { FichaCompraResumenDTO, ImpactoAnulacionDTO } from '@/types/admin';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';

interface ModalAdvertenciaImpactoAnulacionProps {
  ficha: FichaCompraResumenDTO | null;
  abierto: boolean;
  onCerrar: () => void;
  onAnulacionConfirmada: (fichaActualizada: FichaCompraResumenDTO) => void;
}

export const ModalAdvertenciaImpactoAnulacion: React.FC<ModalAdvertenciaImpactoAnulacionProps> = ({
  ficha,
  abierto,
  onCerrar,
  onAnulacionConfirmada,
}) => {
  const [impacto, setImpacto] = useState<ImpactoAnulacionDTO | null>(null);
  const [cargandoImpacto, setCargandoImpacto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto && ficha) {
      setMotivo('');
      setConfirmacionTexto('');
      setError(null);
      evaluarImpacto(ficha.id);
    }
  }, [abierto, ficha]);

  const evaluarImpacto = async (id: string) => {
    try {
      setCargandoImpacto(true);
      const res = await mockAdminService.obtenerImpactoAnulacion(id);
      if (res.exito && res.datos) {
        setImpacto(res.datos);
      }
    } finally {
      setCargandoImpacto(false);
    }
  };

  if (!abierto || !ficha) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 5) {
      setError('Debe especificar un motivo de anulación claro (mínimo 5 caracteres).');
      return;
    }

    if (impacto?.requiere_confirmacion_estricta && confirmacionTexto.trim().toUpperCase() !== 'ANULAR') {
      setError('Para confirmar el impacto crítico, debe escribir exactamente "ANULAR".');
      return;
    }

    try {
      setAnulando(true);
      setError(null);
      const res = await mockAdminService.anularFichaCompra({
        ficha_id: ficha.id,
        motivo: motivo.trim(),
      });

      if (res.exito && res.datos) {
        onAnulacionConfirmada(res.datos);
        onCerrar();
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo anular la ficha de compra.');
      }
    } catch {
      setError('Ocurrió un error inesperado al procesar la anulación.');
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header con alerta roja */}
        <div className="px-6 py-4 border-b border-rose-200 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-950 text-base">
                Anular Ficha de Compra #{ficha.numero_comprobante}
              </h3>
              <p className="text-xs text-rose-700">
                Evaluación de impacto en stock, platos de carta y comandas en cocina
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={anulando}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          {cargandoImpacto ? (
            <div className="py-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
              <span>Calculando proyecciones de stock y recetas...</span>
            </div>
          ) : (
            <>
              {/* Resumen de la Ficha */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-gray-700">
                <div>
                  <span className="font-semibold text-gray-900">{ficha.proveedor_nombre}</span>
                  <span className="text-gray-400 mx-1.5">•</span>
                  <span>Emisión: {ficha.fecha_emision}</span>
                </div>
                <div className="font-bold text-gray-900 font-mono">
                  Total: S/ {ficha.total.toFixed(2)}
                </div>
              </div>

              {/* 1. Impacto en Insumos */}
              {impacto && impacto.insumos_afectados.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 uppercase text-[11px] tracking-wider">
                    Insumos a Restar del Inventario (GREATEST 0 Floor)
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Insumo</th>
                          <th className="py-2 px-3 text-right">Stock Actual</th>
                          <th className="py-2 px-3 text-right text-rose-600">Resta Compra</th>
                          <th className="py-2 px-3 text-right font-bold">Stock Proyectado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {impacto.insumos_afectados.map((ins) => (
                          <tr key={ins.insumo_id} className={ins.quedara_en_quiebre ? 'bg-amber-50/40' : ''}>
                            <td className="py-2 px-3">
                              <span className="font-medium text-gray-900">{ins.insumo_nombre}</span>
                              {ins.quedara_en_quiebre && (
                                <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  Quedará en Quiebre
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {ins.stock_actual} {ins.unidad_medida}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-rose-600">
                              -{ins.cantidad_a_restar} {ins.unidad_medida}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                              {ins.stock_proyectado} {ins.unidad_medida}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Platos que se apagarán en carta */}
              {impacto && impacto.platos_que_se_agotaran.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Platos que se apagarán en carta por quiebre de receta ({impacto.platos_que_se_agotaran.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-800 text-xs pl-2">
                    {impacto.platos_que_se_agotaran.map((p) => (
                      <li key={p.plato_id}>
                        <strong>{p.plato_nombre}</strong> ({p.categoria_nombre}) — Quiebre en: <em>{p.insumo_critico}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Comandas de cocina en riesgo */}
              {impacto && impacto.pedidos_cocina_en_riesgo.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                    <ChefHat className="w-4 h-4 text-rose-600" />
                    <span>Comandas activas en cocina con insumos involucrados:</span>
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {impacto.pedidos_cocina_en_riesgo.map((ped) => (
                      <div key={ped.comanda_id} className="text-rose-800 text-xs">
                        • <strong>{ped.mesa_codigo}</strong> ({ped.comanda_id}): {ped.plato_nombre} — <em>{ped.estado_comanda}</em>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input de Motivo Obligatorio */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Motivo de Anulación Contable (Obligatorio) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Proveedor anuló comprobante por error de digitación en RUC; se emitió nota de crédito compensatoria..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Confirmación estricta si hay impacto crítico */}
              {impacto?.requiere_confirmacion_estricta && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-gray-800">
                    Escriba <span className="text-rose-600 font-mono font-black">ANULAR</span> para confirmar que asume el apagado de platos en carta:
                  </label>
                  <input
                    type="text"
                    value={confirmacionTexto}
                    onChange={(e) => setConfirmacionTexto(e.target.value)}
                    placeholder="Escriba ANULAR aquí..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold tracking-wider text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
                  />
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={anulando}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                anulando ||
                motivo.trim().length < 5 ||
                (impacto?.requiere_confirmacion_estricta && confirmacionTexto.trim().toUpperCase() !== 'ANULAR')
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {anulando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Anulando comprobante...</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirmar Anulación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
