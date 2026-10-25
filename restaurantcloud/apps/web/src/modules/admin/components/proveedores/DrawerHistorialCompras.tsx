import React from 'react';
import { MessageCircle, Receipt, Calendar, CreditCard, Package, Plus, Phone } from 'lucide-react';
import { ProveedorResumenDTO, ProveedorHistorialComprasDTO } from '@/types/admin';
import { Button, Drawer, EstadoBadge, EstadoVacio, Skeleton } from '@/components/ui';
import { enlaceWhatsAppProveedor } from './whatsappProveedor';

interface DrawerHistorialComprasProps {
  abierto: boolean;
  onCerrar: () => void;
  proveedor: ProveedorResumenDTO | null;
  historial: ProveedorHistorialComprasDTO | null;
  cargando: boolean;
  onNuevaCompra: (proveedor: ProveedorResumenDTO) => void;
}

const soles = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DrawerHistorialCompras: React.FC<DrawerHistorialComprasProps> = ({
  abierto,
  onCerrar,
  proveedor,
  historial,
  cargando,
  onNuevaCompra,
}) => {
  if (!proveedor) return null;

  const wsp = enlaceWhatsAppProveedor(proveedor.nombre, proveedor.telefono);
  const compras = historial?.compras ?? [];

  return (
    <Drawer
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      titulo={proveedor.nombre}
      descripcion={proveedor.contacto ? `Contacto: ${proveedor.contacto}` : 'Historial de compras'}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button onClick={() => onNuevaCompra(proveedor)} leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}>
            Registrar compra
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {proveedor.telefono && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-estado-ok-50 border border-estado-ok-200">
            <a href={`tel:${proveedor.telefono}`} className="inline-flex items-center gap-1.5 font-mono text-sm text-aurea-navy">
              <Phone className="w-4 h-4 text-estado-ok-700" aria-hidden="true" />
              {proveedor.telefono}
            </a>
            {wsp && (
              <a
                href={wsp}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-tactil inline-flex items-center gap-2 px-4 rounded-xl bg-estado-ok-600 hover:bg-estado-ok-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                Escribir por WhatsApp
              </a>
            )}
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Total comprado</dt>
            <dd className="font-serif font-bold text-lg text-aurea-navy tabular-nums">{soles(proveedor.total_gastado)}</dd>
          </div>
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Compras</dt>
            <dd className="font-serif font-bold text-lg text-aurea-navy tabular-nums">{proveedor.total_compras}</dd>
          </div>
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Insumos</dt>
            <dd className="font-serif font-bold text-lg text-aurea-copper tabular-nums">{proveedor.insumos_habituales?.length || 0}</dd>
          </div>
        </dl>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
              <Receipt className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
              Compras
            </h3>
            {historial?.variacion_precio_texto && <EstadoBadge tono="ok">{historial.variacion_precio_texto}</EstadoBadge>}
          </div>

          {cargando ? (
            <div className="space-y-3" aria-busy="true" aria-label="Cargando compras">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : compras.length === 0 ? (
            <div className="rounded-xl border border-dashed border-aurea-copper/50 bg-aurea-ivory">
              <EstadoVacio
                icono={Receipt}
                titulo="Sin compras todavía"
                descripcion="Registra la primera compra con este proveedor desde el botón de abajo."
              />
            </div>
          ) : (
            <ul className="space-y-3">
              {compras.map((fc) => (
                <li key={fc.id} className="p-4 rounded-xl bg-white border border-aurea-champagne/70 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-aurea-champagne/50">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-aurea-navy">{fc.numero_comprobante}</span>
                        <span className="px-2 py-0.5 rounded-lg border border-aurea-champagne bg-aurea-champagne/20 text-xs font-medium text-aurea-navy capitalize">
                          {fc.tipo_comprobante}
                        </span>
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-aurea-navy/60">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                          {fc.fecha_emision}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                          {fc.metodo_pago}
                        </span>
                      </p>
                    </div>
                    <span className="font-serif font-bold text-lg text-aurea-navy tabular-nums whitespace-nowrap">{soles(fc.total)}</span>
                  </div>
                  <ul className="divide-y divide-aurea-champagne/40 text-sm">
                    {fc.items.map((it, idx) => (
                      <li key={idx} className="py-1.5 flex items-center justify-between gap-3 text-aurea-navy">
                        <span className="min-w-0">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <Package className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                            {it.insumo_nombre}
                          </span>
                          <span className="block text-xs text-aurea-navy/60">
                            {it.cantidad} {it.unidad_medida} × S/ {it.precio_unitario.toFixed(2)}
                          </span>
                        </span>
                        <span className="font-mono font-semibold whitespace-nowrap">S/ {it.subtotal.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
};
