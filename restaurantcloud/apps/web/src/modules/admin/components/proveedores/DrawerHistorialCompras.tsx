import React, { useEffect } from 'react';
import {
  X,
  History,
  MessageCircle,
  Receipt,
  Calendar,
  CreditCard,
  Package,
  Plus,
} from 'lucide-react';
import {
  ProveedorResumenDTO,
  ProveedorHistorialComprasDTO,
} from '@/types/admin';

interface DrawerHistorialComprasProps {
  abierto: boolean;
  onCerrar: () => void;
  proveedor: ProveedorResumenDTO | null;
  historial: ProveedorHistorialComprasDTO | null;
  cargando: boolean;
  onNuevaCompra: (proveedor: ProveedorResumenDTO) => void;
}

export const DrawerHistorialCompras: React.FC<DrawerHistorialComprasProps> = ({
  abierto,
  onCerrar,
  proveedor,
  historial,
  cargando,
  onNuevaCompra,
}) => {
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) {
        onCerrar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto || !proveedor) return null;

  const formatearNumeroWhatsApp = (tel?: string | null): string => {
    if (!tel) return '';
    const digits = tel.replace(/\D/g, '');
    if (digits.startsWith('51')) return digits;
    if (digits.length === 9 && digits.startsWith('9')) return `51${digits}`;
    return digits;
  };

  const wspNumero = formatearNumeroWhatsApp(proveedor.telefono);
  const wspUrl = wspNumero
    ? `https://wa.me/${wspNumero}?text=${encodeURIComponent(
        `Hola ${proveedor.nombre}, te escribimos de RestaurantCloud para coordinar pedidos y cotización de insumos.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop oscuro con blur ligero */}
      <div
        className="fixed inset-0 bg-aurea-navy/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onCerrar}
      />

      {/* Panel lateral deslizante (560px) */}
      <div
        className="relative z-10 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full border-l border-aurea-copper/20 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-historial-titulo"
      >
        {/* Cabecera del Drawer */}
        <div className="p-6 bg-aurea-ivory/60 border-b border-aurea-champagne/80 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-aurea-copper uppercase tracking-wider mb-1">
                <History className="w-4 h-4" />
                <span>Historial de Compras & Costos</span>
              </div>
              <h2
                id="drawer-historial-titulo"
                className="text-xl font-serif font-bold text-aurea-navy"
              >
                {proveedor.nombre}
              </h2>
              {proveedor.contacto && (
                <p className="text-xs text-aurea-navy/70 mt-0.5">
                  Contacto comercial: <span className="font-medium">{proveedor.contacto}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-xl text-aurea-navy/50 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
              title="Cerrar panel lateral (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Enlace directo a WhatsApp en el Header */}
          {wspUrl && (
            <div className="mt-4 pt-3 border-t border-aurea-champagne/60 flex items-center justify-between">
              <span className="text-xs text-aurea-navy/70 font-mono">
                {proveedor.telefono}
              </span>
              <a
                href={wspUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir Chat de WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Métricas Acumuladas */}
        <div className="p-4 bg-aurea-champagne/10 border-b border-aurea-champagne/60 grid grid-cols-3 gap-2 text-center shrink-0">
          <div className="p-2 bg-white rounded-xl border border-aurea-champagne/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-aurea-navy/60 block">
              Total Facturado
            </span>
            <span className="text-sm sm:text-base font-serif font-bold text-aurea-navy block mt-0.5">
              S/ {proveedor.total_gastado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-aurea-champagne/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-aurea-navy/60 block">
              Fichas de Compra
            </span>
            <span className="text-sm sm:text-base font-serif font-bold text-aurea-navy block mt-0.5">
              {proveedor.total_compras} compras
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-aurea-champagne/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-aurea-navy/60 block">
              Insumos Vinculados
            </span>
            <span className="text-sm sm:text-base font-serif font-bold text-aurea-copper block mt-0.5">
              {proveedor.insumos_habituales?.length || 0} catálogo
            </span>
          </div>
        </div>

        {/* Contenido con Scroll: Cronología de Compras */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/70 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Cronología de Compras Emitidas</span>
            </h3>
            {historial?.variacion_precio_texto && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {historial.variacion_precio_texto}
              </span>
            )}
          </div>

          {cargando ? (
            <div className="py-12 text-center text-aurea-navy/60">
              <div className="w-5 h-5 border-2 border-aurea-copper border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Cargando compras históricas...</span>
            </div>
          ) : !historial?.compras || historial.compras.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-aurea-ivory/40 border border-dashed border-aurea-copper/30 p-6">
              <Receipt className="w-8 h-8 text-aurea-copper/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-aurea-navy">
                Sin compras históricas registradas
              </p>
              <p className="text-xs text-aurea-navy/60 mt-1 max-w-sm mx-auto">
                Aún no se han emitido fichas de compra para este proveedor. Puedes emitir la primera compra desde el botón inferior.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {historial.compras.map((fc) => (
                <div
                  key={fc.id}
                  className="p-4 rounded-2xl bg-white border border-aurea-champagne/80 shadow-xs space-y-3"
                >
                  {/* Encabezado de la Ficha */}
                  <div className="flex items-start justify-between gap-2 border-b border-aurea-champagne/50 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-aurea-navy">
                          {fc.numero_comprobante}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-aurea-champagne/40 text-aurea-navy">
                          {fc.tipo_comprobante}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-aurea-navy/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-aurea-copper" />
                          {fc.fecha_emision}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-aurea-copper" />
                          {fc.metodo_pago}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-aurea-navy/60 block">
                        Total
                      </span>
                      <span className="text-base font-serif font-bold text-emerald-800">
                        S/ {fc.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Desglose de Insumos Facturados */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-aurea-navy/60 block">
                      Insumos comprados:
                    </span>
                    <div className="divide-y divide-aurea-champagne/30 text-xs">
                      {fc.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="py-1 flex items-center justify-between text-aurea-navy"
                        >
                          <div className="flex items-center gap-1.5">
                            <Package className="w-3 h-3 text-aurea-copper/60" />
                            <span className="font-medium">{it.insumo_nombre}</span>
                            <span className="text-[11px] text-aurea-navy/60">
                              ({it.cantidad} {it.unidad_medida} × S/ {it.precio_unitario.toFixed(2)})
                            </span>
                          </div>
                          <span className="font-mono font-semibold">
                            S/ {it.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie con Acceso a Nueva Compra (CU-ADMIN-06) */}
        <div className="p-4 bg-aurea-ivory/60 border-t border-aurea-champagne/80 shrink-0 flex items-center justify-between gap-3">
          <span className="text-xs text-aurea-navy/60">
            Sede: Áurea Miraflores
          </span>
          <button
            type="button"
            onClick={() => onNuevaCompra(proveedor)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-semibold transition-all shadow-md"
            title="Abrir modal para formalizar compra física con este proveedor"
          >
            <Plus className="w-3.5 h-3.5 text-aurea-champagne" />
            <span>+ Registrar Nueva Compra</span>
          </button>
        </div>
      </div>
    </div>
  );
};
