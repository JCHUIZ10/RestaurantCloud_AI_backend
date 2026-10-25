import React, { useEffect, useState } from 'react';
import { Receipt, Ban, CalendarDays, User, Truck, Phone, Printer, Package, StickyNote } from 'lucide-react';
import { FichaCompraDetalleCompletoDTO } from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { Button, EstadoBadge, Modal, Skeleton } from '@/components/ui';
import { TagComprobante, TagPago, VariacionCosto } from './etiquetasCompra';
import { formatoFecha, soles } from './formatoCompra';

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
      const res = await adminService.getFichaCompraDetalle(id);
      if (res.exito && res.datos) {
        setDetalle(res.datos);
      }
    } finally {
      setCargando(false);
    }
  };

  // Evita mostrar la ficha anterior mientras llega la nueva
  const d = detalle && detalle.id === fichaId && !cargando ? detalle : null;

  return (
    <Modal
      abierto={abierto && Boolean(fichaId)}
      onCerrar={onCerrar}
      tamano="xl"
      icono={Receipt}
      etiqueta={d?.codigo_correlativo}
      titulo={d ? d.numero_comprobante : 'Detalle de compra'}
      pie={
        <>
          <Button variant="outline" onClick={() => window.print()} disabled={!d} leftIcon={<Printer className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}>
            Imprimir
          </Button>
          <Button onClick={onCerrar}>Cerrar</Button>
        </>
      }
    >
      {!d ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando detalle">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-5">
          {d.estado === 'ANULADA' && (
            <div className="p-3.5 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm space-y-0.5">
              <p className="flex items-center gap-1.5 font-semibold">
                <Ban className="w-4 h-4" aria-hidden="true" />
                Compra anulada
                {d.fecha_anulacion && (
                  <span className="font-normal text-estado-error-700">
                    · {new Date(d.fecha_anulacion).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                )}
              </p>
              <p>{d.motivo_anulacion || 'Sin motivo registrado'}</p>
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 space-y-1">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-aurea-navy/60">
                <Truck className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                Proveedor
              </dt>
              <dd className="font-semibold text-aurea-navy">{d.proveedor_nombre}</dd>
              {d.proveedor_telefono && (
                <dd>
                  <a href={`tel:${d.proveedor_telefono}`} className="inline-flex items-center gap-1 font-mono text-xs text-aurea-navy/70 hover:text-aurea-navy">
                    <Phone className="w-3 h-3 text-aurea-copper" aria-hidden="true" />
                    {d.proveedor_telefono}
                  </a>
                </dd>
              )}
            </div>
            <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 space-y-1.5">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-aurea-navy/60">
                <CalendarDays className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                Comprobante
              </dt>
              <dd className="flex flex-wrap items-center gap-2 text-aurea-navy">
                <TagComprobante tipo={d.tipo_comprobante} />
                {formatoFecha(d.fecha_emision)}
              </dd>
              <dd className="flex flex-wrap items-center gap-2">
                <TagPago metodo={d.metodo_pago} />
                {d.estado === 'ANULADA' ? <EstadoBadge tono="error">Anulada</EstadoBadge> : <EstadoBadge tono="ok">Vigente</EstadoBadge>}
              </dd>
            </div>
            <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 space-y-1">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-aurea-navy/60">
                <User className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                Registrado por
              </dt>
              <dd className="font-semibold text-aurea-navy">{d.registrado_por_nombre}</dd>
              <dd className="text-xs text-aurea-navy/60">{formatoFecha(d.fecha_registro.slice(0, 10))}</dd>
            </div>
          </dl>

          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
              <Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
              {d.items.length === 1 ? '1 insumo' : `${d.items.length} insumos`}
            </h3>
            <div className="rounded-xl border border-aurea-champagne/70 overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_8rem_7rem_6rem_7rem] gap-3 px-3 py-2 bg-aurea-ivory text-xs font-semibold uppercase tracking-wider text-aurea-navy/60">
                <span>Insumo</span>
                <span className="text-right">Cantidad</span>
                <span className="text-right">Precio</span>
                <span className="text-center">Variación</span>
                <span className="text-right">Subtotal</span>
              </div>
              <ul className="divide-y divide-aurea-champagne/40">
                {d.items.map((it) => {
                  const variacion =
                    typeof it.variacion_porcentaje === 'number'
                      ? it.variacion_porcentaje
                      : it.costo_anterior > 0
                        ? ((it.precio_unitario - it.costo_anterior) / it.costo_anterior) * 100
                        : 0;
                  return (
                    <li
                      key={it.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_8rem_7rem_6rem_7rem] items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm text-aurea-navy"
                    >
                      <span className="font-medium truncate">{it.insumo_nombre}</span>
                      <span className="md:hidden text-right font-mono font-semibold">S/ {it.subtotal.toFixed(2)}</span>
                      <span className="text-xs md:text-sm text-aurea-navy/70 md:text-right font-mono">
                        {it.cantidad} {it.unidad_medida}
                        <span className="md:hidden"> × S/ {it.precio_unitario.toFixed(2)}</span>
                      </span>
                      <span className="hidden md:block text-right font-mono">S/ {it.precio_unitario.toFixed(2)}</span>
                      <span className="justify-self-end md:justify-self-center">
                        <VariacionCosto porcentaje={variacion} />
                      </span>
                      <span className="hidden md:block text-right font-mono font-semibold">S/ {it.subtotal.toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-3">
            {d.observaciones ? (
              <p className="flex items-start gap-2 p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 text-sm text-aurea-navy/80 sm:max-w-sm">
                <StickyNote className="w-4 h-4 mt-0.5 text-aurea-copper shrink-0" aria-hidden="true" />
                {d.observaciones}
              </p>
            ) : (
              <span />
            )}
            <dl className="w-full sm:w-64 p-3.5 rounded-xl bg-white border border-aurea-copper/30 shadow-sm space-y-1.5 text-sm">
              {d.tipo_comprobante === 'FACTURA' && (
                <>
                  <div className="flex justify-between text-aurea-navy/70">
                    <dt>Base imponible</dt>
                    <dd className="font-mono">{soles(d.subtotal_neto)}</dd>
                  </div>
                  <div className="flex justify-between text-estado-ok-700 font-medium">
                    <dt>IGV 18%</dt>
                    <dd className="font-mono">{soles(d.igv_monto)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between items-baseline pt-1.5 border-t border-aurea-champagne/50">
                <dt className="font-semibold text-aurea-navy">Total</dt>
                <dd className="font-serif font-bold text-xl text-aurea-navy tabular-nums">{soles(d.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </Modal>
  );
};
