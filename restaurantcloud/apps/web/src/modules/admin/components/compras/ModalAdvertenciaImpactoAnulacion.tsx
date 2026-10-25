import React, { useEffect, useId, useState } from 'react';
import { AlertTriangle, AlertCircle, Ban, ChefHat, Package, Utensils } from 'lucide-react';
import { FichaCompraResumenDTO, ImpactoAnulacionDTO } from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { Button, EstadoBadge, Modal, Skeleton } from '@/components/ui';
import { cn } from '@/shared/utils';
import { TagComprobante } from './etiquetasCompra';
import { formatoFecha, soles } from './formatoCompra';

interface ModalAdvertenciaImpactoAnulacionProps {
  ficha: FichaCompraResumenDTO | null;
  abierto: boolean;
  onCerrar: () => void;
  onAnulacionConfirmada: (fichaActualizada: FichaCompraResumenDTO) => void;
}

const CLASE_CONTROL =
  'w-full px-3.5 py-2.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';

export const ModalAdvertenciaImpactoAnulacion: React.FC<ModalAdvertenciaImpactoAnulacionProps> = ({
  ficha,
  abierto,
  onCerrar,
  onAnulacionConfirmada,
}) => {
  const idForm = useId();
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
      setImpacto(null);
      evaluarImpacto(ficha.id);
    }
  }, [abierto, ficha]);

  const evaluarImpacto = async (id: string) => {
    try {
      setCargandoImpacto(true);
      const res = await adminService.obtenerImpactoAnulacion(id);
      if (res.exito && res.datos) {
        setImpacto(res.datos);
      }
    } finally {
      setCargandoImpacto(false);
    }
  };

  if (!ficha) return null;

  const exigeConfirmacion = Boolean(impacto?.requiere_confirmacion_estricta);
  const confirmacionOk = !exigeConfirmacion || confirmacionTexto.trim().toUpperCase() === 'ANULAR';
  const motivoOk = motivo.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoOk) {
      setError('Escribe el motivo de la anulación (mínimo 5 caracteres).');
      return;
    }
    if (!confirmacionOk) {
      setError('Escribe ANULAR para confirmar que asumes el impacto en la carta.');
      return;
    }

    try {
      setAnulando(true);
      setError(null);
      const res = await adminService.anularFichaCompra({
        ficha_id: ficha.id,
        motivo: motivo.trim(),
      });

      if (res.exito && res.datos) {
        onAnulacionConfirmada(res.datos);
        onCerrar();
      } else {
        setError(res.errores?.[0]?.mensaje || 'No se pudo anular la compra.');
      }
    } catch {
      setError('Ocurrió un error inesperado al procesar la anulación.');
    } finally {
      setAnulando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!anulando}
      tamano="lg"
      tono="error"
      icono={AlertTriangle}
      etiqueta={ficha.proveedor_nombre}
      titulo={`Anular ${ficha.numero_comprobante}`}
      descripcion="Se descontará del inventario lo que ingresó con esta compra."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={anulando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={idForm}
            variant="danger"
            loading={anulando}
            disabled={cargandoImpacto || !motivoOk || !confirmacionOk}
            leftIcon={<Ban className="w-4 h-4" aria-hidden="true" />}
          >
            Anular compra
          </Button>
        </>
      }
    >
      <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
          <span className="flex items-center gap-2 text-sm text-aurea-navy/70">
            <TagComprobante tipo={ficha.tipo_comprobante} />
            {formatoFecha(ficha.fecha_emision)}
          </span>
          <span className="font-serif font-bold text-lg text-aurea-navy tabular-nums">{soles(ficha.total)}</span>
        </div>

        {cargandoImpacto ? (
          <div className="space-y-2" aria-busy="true" aria-label="Calculando impacto">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : (
          impacto && (
            <>
              {impacto.insumos_afectados.length > 0 && (
                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
                    <Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                    Stock que se descontará
                  </h3>
                  <ul className="rounded-xl border border-aurea-champagne/70 divide-y divide-aurea-champagne/40 overflow-hidden">
                    {impacto.insumos_afectados.map((ins) => (
                      <li
                        key={ins.insumo_id}
                        className={cn(
                          'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 text-sm',
                          ins.quedara_en_quiebre ? 'bg-estado-alerta-50' : 'bg-white'
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium text-aurea-navy">
                          {ins.insumo_nombre}
                          {ins.quedara_en_quiebre && <EstadoBadge tono="alerta">Se agota</EstadoBadge>}
                        </span>
                        <span className="font-mono text-xs text-aurea-navy/70 whitespace-nowrap">
                          {ins.stock_actual}
                          <span className="text-estado-error-700"> − {ins.cantidad_a_restar}</span> ={' '}
                          <strong className="text-sm text-aurea-navy">
                            {ins.stock_proyectado} {ins.unidad_medida}
                          </strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {impacto.platos_que_se_agotaran.length > 0 && (
                <section className="p-3.5 rounded-xl bg-estado-alerta-50 border border-estado-alerta-200 space-y-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-estado-alerta-800">
                    <Utensils className="w-4 h-4" aria-hidden="true" />
                    {impacto.platos_que_se_agotaran.length === 1
                      ? '1 plato quedará agotado en la carta'
                      : `${impacto.platos_que_se_agotaran.length} platos quedarán agotados en la carta`}
                  </h3>
                  <ul className="space-y-1 text-sm text-estado-alerta-800">
                    {impacto.platos_que_se_agotaran.map((p) => (
                      <li key={p.plato_id}>
                        <strong className="font-semibold">{p.plato_nombre}</strong>
                        <span className="text-estado-alerta-700"> · falta {p.insumo_critico}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {impacto.pedidos_cocina_en_riesgo.length > 0 && (
                <section className="p-3.5 rounded-xl bg-estado-error-50 border border-estado-error-200 space-y-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-estado-error-800">
                    <ChefHat className="w-4 h-4" aria-hidden="true" />
                    Pedidos en cocina que usan estos insumos
                  </h3>
                  <ul className="space-y-1 text-sm text-estado-error-800">
                    {impacto.pedidos_cocina_en_riesgo.map((ped) => (
                      <li key={ped.comanda_id}>
                        <strong className="font-semibold">{ped.mesa_codigo}</strong> · {ped.plato_nombre}
                        <span className="text-estado-error-700"> ({ped.estado_comanda})</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )
        )}

        <div>
          <label htmlFor={`${idForm}-motivo`} className="block text-sm font-semibold text-aurea-navy mb-1.5">
            Motivo de la anulación
          </label>
          <textarea
            id={`${idForm}-motivo`}
            rows={2}
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. El proveedor emitió nota de crédito por error en el comprobante"
            className={CLASE_CONTROL}
          />
        </div>

        {exigeConfirmacion && (
          <div>
            <label htmlFor={`${idForm}-confirmar`} className="block text-sm font-semibold text-aurea-navy mb-1.5">
              Escribe <span className="font-mono text-estado-error-700">ANULAR</span> para confirmar
            </label>
            <input
              id={`${idForm}-confirmar`}
              type="text"
              value={confirmacionTexto}
              onChange={(e) => setConfirmacionTexto(e.target.value)}
              autoComplete="off"
              className={cn(CLASE_CONTROL, 'min-h-tactil font-mono font-bold tracking-wider uppercase text-estado-error-700')}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
