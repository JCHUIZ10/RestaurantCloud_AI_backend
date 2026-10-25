import React, { useState } from 'react';
import { Trash2, AlertTriangle, Package } from 'lucide-react';
import { ProveedorResumenDTO } from '@/types/admin';
import { Button, Modal } from '@/components/ui';

interface ModalConfirmarEliminarProveedorProps {
  abierto: boolean;
  onCerrar: () => void;
  proveedor: ProveedorResumenDTO | null;
  onConfirmarAccion: (proveedor: ProveedorResumenDTO) => Promise<void>;
}

/** Con compras previas solo se desactiva (conserva el historial); sin compras se elimina. */
export const ModalConfirmarEliminarProveedor: React.FC<ModalConfirmarEliminarProveedorProps> = ({
  abierto,
  onCerrar,
  proveedor,
  onConfirmarAccion,
}) => {
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!proveedor) return null;

  const tieneCompras = (proveedor.total_compras ?? 0) > 0;
  const nInsumos = proveedor.insumos_habituales?.length ?? 0;

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
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!procesando}
      tamano="sm"
      tono={tieneCompras ? 'alerta' : 'error'}
      icono={tieneCompras ? AlertTriangle : Trash2}
      etiqueta={proveedor.nombre}
      titulo={tieneCompras ? 'Desactivar proveedor' : 'Eliminar proveedor'}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="danger" loading={procesando} onClick={handleConfirmar}>
            {tieneCompras ? 'Desactivar' : 'Eliminar'}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-aurea-navy">
        {errorMsg && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800">
            {errorMsg}
          </p>
        )}
        {tieneCompras ? (
          <>
            <p>
              Tiene{' '}
              <strong className="font-semibold text-estado-alerta-800">
                {proveedor.total_compras} {proveedor.total_compras === 1 ? 'compra registrada' : 'compras registradas'}
              </strong>
              , así que no se puede borrar sin perder tu historial de gastos.
            </p>
            <p className="text-aurea-navy/70">
              Al desactivarlo deja de aparecer al registrar compras; tus reportes pasados se conservan y puedes reactivarlo cuando quieras.
            </p>
            {nInsumos > 0 && (
              <p className="flex items-center gap-1.5 text-aurea-navy/60">
                <Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                Suministra {nInsumos} {nInsumos === 1 ? 'insumo' : 'insumos'}.
              </p>
            )}
          </>
        ) : (
          <p>
            No tiene compras registradas. Se eliminará del directorio y <strong className="font-semibold">no se podrá recuperar</strong>.
          </p>
        )}
      </div>
    </Modal>
  );
};
