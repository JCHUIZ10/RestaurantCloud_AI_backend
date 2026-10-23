import React, { useState } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { ProveedorResumenDTO } from '@/types/admin';

interface ModalConfirmarEliminarProveedorProps {
  abierto: boolean;
  onCerrar: () => void;
  proveedor: ProveedorResumenDTO | null;
  onConfirmarAccion: (proveedor: ProveedorResumenDTO) => Promise<void>;
}

export const ModalConfirmarEliminarProveedor: React.FC<ModalConfirmarEliminarProveedorProps> = ({
  abierto,
  onCerrar,
  proveedor,
  onConfirmarAccion,
}) => {
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!abierto || !proveedor) return null;

  const tieneCompras = (proveedor.total_compras ?? 0) > 0;

  const handleConfirmar = async () => {
    setErrorMsg(null);
    setProcesando(true);
    try {
      await onConfirmarAccion(proveedor);
      onCerrar();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aurea-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-aurea-copper/20 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmar-proveedor-titulo"
      >
        {/* Cabecera */}
        <div className="px-6 py-4.5 bg-aurea-ivory/60 border-b border-aurea-champagne/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                tieneCompras
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {tieneCompras ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2
                id="modal-confirmar-proveedor-titulo"
                className="text-base font-serif font-bold text-aurea-navy"
              >
                {tieneCompras ? 'Desactivar Proveedor' : 'Eliminar Proveedor'}
              </h2>
              <p className="text-xs text-aurea-navy/60">
                {proveedor.nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="p-1.5 rounded-lg text-aurea-navy/40 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {tieneCompras ? (
            /* Modo con compras: Desactivación amigable */
            <div className="space-y-3">
              <p className="text-sm text-aurea-navy leading-relaxed">
                <span className="font-semibold">{proveedor.nombre}</span> cuenta con{' '}
                <span className="font-semibold text-amber-700">
                  {proveedor.total_compras} {proveedor.total_compras === 1 ? 'compra registrada' : 'compras registradas'}
                </span>{' '}
                en tu historial.
              </p>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-2 font-semibold">
                  <Receipt className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Conservación de tus registros contables</span>
                </div>
                <p>
                  Para mantener el histórico de tus gastos e informes intactos, no es posible borrar a este proveedor por completo.
                </p>
                <p className="font-medium">
                  Al <span className="underline">desactivarlo</span>, dejará de aparecer como opción al registrar nuevas compras, pero tus reportes pasados seguirán protegidos.
                </p>
              </div>

              {proveedor.insumos_habituales && proveedor.insumos_habituales.length > 0 && (
                <div className="text-xs text-aurea-navy/60 flex items-center gap-1.5 pt-1">
                  <Package className="w-3.5 h-3.5 text-aurea-copper" />
                  <span>Suministra {proveedor.insumos_habituales.length} insumos en bodega.</span>
                </div>
              )}
            </div>
          ) : (
            /* Modo sin compras: Eliminación definitiva */
            <div className="space-y-3">
              <p className="text-sm text-aurea-navy leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente a{' '}
                <span className="font-semibold">{proveedor.nombre}</span>?
              </p>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 leading-relaxed space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Acción definitiva</span>
                </p>
                <p>
                  Este proveedor no tiene compras ni movimientos registrados. Se eliminará por completo del directorio y sus datos no se podrán recuperar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={procesando}
            className={`px-4.5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
              tieneCompras
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {procesando ? (
              <span>Procesando...</span>
            ) : tieneCompras ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Desactivar proveedor</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar definitivamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
