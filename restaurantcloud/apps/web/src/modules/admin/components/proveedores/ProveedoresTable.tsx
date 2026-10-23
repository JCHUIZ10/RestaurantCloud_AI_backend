import React from 'react';
import {
  MessageCircle,
  Phone,
  User,
  History,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  Mail,
  MapPin,
} from 'lucide-react';
import { ProveedorResumenDTO } from '@/types/admin';

interface ProveedoresTableProps {
  proveedores: ProveedorResumenDTO[];
  totalItems: number;
  paginaActual: number;
  limitePorPagina: number;
  totalPaginas: number;
  cargando: boolean;
  onCambiarPagina: (nuevaPagina: number) => void;
  onCambiarLimite: (nuevoLimite: number) => void;
  onAbrirHistorial: (proveedor: ProveedorResumenDTO) => void;
  onEditar: (proveedor: ProveedorResumenDTO) => void;
  onToggleEstado?: (proveedor: ProveedorResumenDTO) => void;
  onReactivar?: (proveedor: ProveedorResumenDTO) => void;
  onEliminar: (proveedor: ProveedorResumenDTO) => void;
}

export const ProveedoresTable: React.FC<ProveedoresTableProps> = ({
  proveedores,
  totalItems,
  paginaActual,
  limitePorPagina,
  totalPaginas,
  cargando,
  onCambiarPagina,
  onCambiarLimite,
  onAbrirHistorial,
  onEditar,
  onToggleEstado,
  onReactivar,
  onEliminar,
}) => {
  // Limpia el número telefónico para enlace universal de WhatsApp
  const formatearNumeroWhatsApp = (tel?: string | null): string => {
    if (!tel) return '';
    const digits = tel.replace(/\D/g, '');
    if (digits.startsWith('51')) return digits;
    if (digits.length === 9 && digits.startsWith('9')) return `51${digits}`;
    return digits;
  };

  const formatearFechaCorta = (fechaIso?: string | null): string => {
    if (!fechaIso) return '-';
    try {
      const d = new Date(fechaIso);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}`;
    } catch {
      return '-';
    }
  };

  const inicioRango = (paginaActual - 1) * limitePorPagina + 1;
  const finRango = Math.min(paginaActual * limitePorPagina, totalItems);

  return (
    <div className="bg-white rounded-2xl border border-aurea-champagne/80 shadow-sm overflow-hidden flex flex-col">
      {/* Contenedor responsivo con scroll horizontal si es necesario */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-aurea-ivory/80 border-b border-aurea-champagne/80 text-[11px] font-semibold uppercase tracking-wider text-aurea-navy/70">
              <th className="py-3.5 px-4">Proveedor / Razón Social</th>
              <th className="py-3.5 px-4">Contacto</th>
              <th className="py-3.5 px-4">Teléfono / WhatsApp</th>
              <th className="py-3.5 px-4">Insumos Habituales</th>
              <th className="py-3.5 px-4">Última Compra</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurea-champagne/40 text-sm">
            {cargando ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-aurea-navy/60">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-aurea-copper border-t-transparent rounded-full animate-spin" />
                    <span>Cargando directorio de proveedores...</span>
                  </div>
                </td>
              </tr>
            ) : proveedores.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-aurea-navy/60">
                  No se encontraron proveedores que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              proveedores.map((p) => {
                const wspNumero = formatearNumeroWhatsApp(p.telefono);
                const wspUrl = wspNumero
                  ? `https://wa.me/${wspNumero}?text=${encodeURIComponent(
                      `Hola ${p.nombre}, te escribimos de RestaurantCloud para coordinar pedidos y cotización de insumos.`
                    )}`
                  : null;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-aurea-ivory/30 transition-colors ${
                      !p.activo ? 'opacity-70 bg-black/[0.01]' : ''
                    }`}
                  >
                    {/* Proveedor / Razón Social */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-aurea-navy flex items-center gap-2">
                        <span>{p.nombre}</span>
                        {p.total_compras >= 8 && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                            title="Proveedor habitual con compras regulares semanales"
                          >
                            Frecuente
                          </span>
                        )}
                      </div>
                      {p.email && (
                        <div className="flex items-center gap-1 text-xs text-aurea-navy/60 mt-0.5">
                          <Mail className="w-3 h-3 text-aurea-copper/60 shrink-0" />
                          <span className="truncate max-w-[200px]">{p.email}</span>
                        </div>
                      )}
                      {p.direccion && (
                        <div className="flex items-center gap-1 text-[11px] text-aurea-navy/50 mt-0.5">
                          <MapPin className="w-3 h-3 text-aurea-copper/50 shrink-0" />
                          <span className="truncate max-w-[220px]">{p.direccion}</span>
                        </div>
                      )}
                    </td>

                    {/* Persona de Contacto */}
                    <td className="py-3 px-4 text-xs text-aurea-navy/80">
                      {p.contacto ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
                          <span>{p.contacto}</span>
                        </div>
                      ) : (
                        <span className="text-aurea-navy/40 italic">No especificado</span>
                      )}
                    </td>

                    {/* Teléfono y Botón Directo WhatsApp */}
                    <td className="py-3 px-4">
                      {p.telefono ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                          {wspUrl ? (
                            <a
                              href={wspUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir chat de WhatsApp con ${p.nombre} al número ${p.telefono}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold transition-all shadow-xs"
                              title="Abrir conversación directa en WhatsApp para cotizar o pedir"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                              <span>WhatsApp</span>
                            </a>
                          ) : null}
                          <a
                            href={`tel:${p.telefono}`}
                            className="inline-flex items-center gap-1 text-xs text-aurea-navy/70 hover:text-aurea-navy font-mono"
                          >
                            <Phone className="w-3 h-3 text-aurea-navy/40" />
                            <span>{p.telefono}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-aurea-navy/40 italic">Sin teléfono</span>
                      )}
                    </td>

                    {/* Insumos Habituales Suministrados */}
                    <td className="py-3 px-4">
                      {p.insumos_habituales && p.insumos_habituales.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 max-w-[260px]">
                          {p.insumos_habituales.slice(0, 3).map((ih) => (
                            <span
                              key={ih.insumo_id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/20"
                            >
                              <Package className="w-2.5 h-2.5 text-aurea-copper" />
                              <span className="truncate max-w-[90px]">{ih.nombre}</span>
                            </span>
                          ))}
                          {p.insumos_habituales.length > 3 && (
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-aurea-navy/5 text-aurea-navy/70 cursor-help"
                              title={p.insumos_habituales
                                .slice(3)
                                .map((i) => i.nombre)
                                .join(', ')}
                            >
                              +{p.insumos_habituales.length - 3} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-aurea-navy/40 italic">Sin insumos vinculados</span>
                      )}
                    </td>

                    {/* Última Compra */}
                    <td className="py-3 px-4">
                      {p.ultima_compra_fecha ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-aurea-navy">
                            <Calendar className="w-3 h-3 text-aurea-copper" />
                            <span>{formatearFechaCorta(p.ultima_compra_fecha)}</span>
                            {p.ultima_compra_total && (
                              <span className="text-emerald-700">
                                · S/ {p.ultima_compra_total.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-aurea-navy/50">
                            {p.total_compras} compras ({' '}
                            S/ {p.total_gastado.toLocaleString('es-PE', { minimumFractionDigits: 0 })}{' '}
                            )
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-aurea-navy/40 italic">Sin compras aún</span>
                      )}
                    </td>

                    {/* Estado: Etiqueta visual estática clara */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.activo
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.activo ? 'bg-emerald-600' : 'bg-zinc-400'
                          }`}
                        />
                        <span>{p.activo ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onAbrirHistorial(p)}
                          className="p-1.5 rounded-lg border border-aurea-champagne hover:bg-aurea-champagne/30 text-aurea-navy transition-colors text-xs inline-flex items-center gap-1"
                          title="Ver historial de compras y fluctuación de precios (Quick-Drawer)"
                        >
                          <History className="w-3.5 h-3.5 text-aurea-copper" />
                          <span className="hidden xl:inline text-xs font-medium">Historial</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditar(p)}
                          className="p-1.5 rounded-lg border border-aurea-champagne hover:bg-aurea-champagne/30 text-aurea-navy transition-colors"
                          title="Editar datos comerciales del proveedor"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-aurea-copper" />
                        </button>

                        {/* Si está activo, muestra la opción de eliminar/desactivar */}
                        {p.activo ? (
                          <button
                            type="button"
                            onClick={() => onEliminar(p)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                            title={
                              p.total_compras > 0
                                ? 'Desactivar proveedor'
                                : 'Eliminar proveedor del directorio'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          /* Si está inactivo, muestra la acción de Reactivar */
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => (onReactivar ? onReactivar(p) : onToggleEstado?.(p))}
                              className="p-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-50 text-emerald-700 transition-colors"
                              title="Reactivar proveedor para nuevas compras"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie con Paginación Interactiva */}
      <div className="p-3.5 border-t border-aurea-champagne/80 bg-aurea-ivory/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-aurea-navy/70">
        <div className="flex items-center gap-4">
          <span>
            Mostrando {totalItems > 0 ? `${inicioRango} - ${finRango}` : '0'} de {totalItems}{' '}
            proveedor(es)
          </span>

          <div className="flex items-center gap-1.5">
            <span>Por pág:</span>
            <select
              value={limitePorPagina}
              onChange={(e) => onCambiarLimite(Number(e.target.value))}
              className="bg-white border border-aurea-copper/20 rounded-lg px-2 py-1 text-xs text-aurea-navy focus:outline-none focus:border-aurea-copper"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-aurea-navy/50 hidden md:inline mr-2">
            Tip: Clic en WhatsApp para abrir chat directo con mensaje preformateado
          </span>

          <button
            type="button"
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="p-1.5 rounded-lg border border-aurea-copper/20 bg-white text-aurea-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-aurea-champagne/20 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            {paginaActual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onCambiarPagina(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className="p-1.5 rounded-lg border border-aurea-copper/20 bg-white text-aurea-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-aurea-champagne/20 transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
