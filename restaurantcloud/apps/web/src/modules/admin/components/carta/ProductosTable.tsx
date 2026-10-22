import React from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Zap,
  BookOpen,
  Edit2,
  Archive,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ProductoAdminDTO } from '@/types/admin';

interface ProductosTableProps {
  productos: ProductoAdminDTO[];
  cargando: boolean;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limitePorPagina: number;
  onCambiarPagina: (pagina: number) => void;
  onCambiarLimite: (limite: number) => void;
  onVerReceta: (producto: ProductoAdminDTO) => void;
  onEditarProducto: (producto: ProductoAdminDTO) => void;
  onArchivarProducto: (producto: ProductoAdminDTO) => void;
  onConmutarDisponibilidad: (producto: ProductoAdminDTO) => void;
  mostrarDatosReceta?: boolean;
}

export const ProductosTable: React.FC<ProductosTableProps> = ({
  productos,
  cargando,
  paginaActual,
  totalPaginas,
  totalRegistros,
  limitePorPagina,
  onCambiarPagina,
  onCambiarLimite,
  onVerReceta,
  onEditarProducto,
  onArchivarProducto,
  onConmutarDisponibilidad,
  mostrarDatosReceta = true,
}) => {
  const inicioRango = totalRegistros > 0 ? (paginaActual - 1) * limitePorPagina + 1 : 0;
  const finRango = Math.min(paginaActual * limitePorPagina, totalRegistros);
  const totalColumnas = mostrarDatosReceta ? 8 : 6;

  const getMargenColor = (margen: number) => {
    if (margen >= 65) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (margen >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getMargenBarColor = (margen: number) => {
    if (margen >= 65) return 'bg-emerald-500';
    if (margen >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-aurea-champagne/40 shadow-sm overflow-hidden flex flex-col">
      {/* Tabla Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-aurea-champagne/15 border-b border-aurea-champagne/40 text-aurea-navy text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Plato / Descripción</th>
              <th className="py-3.5 px-4">Categoría</th>
              <th className="py-3.5 px-4 text-center">Destino</th>
              <th className="py-3.5 px-4 text-right">Precio Venta</th>
              {mostrarDatosReceta && <th className="py-3.5 px-4 text-right">Costo Receta</th>}
              {mostrarDatosReceta && <th className="py-3.5 px-4 text-center">Margen Bruto</th>}
              <th className="py-3.5 px-4 text-center">Disponibilidad</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurea-champagne/30 text-aurea-navy/90">
            {cargando ? (
              <tr>
                <td colSpan={totalColumnas} className="py-12 text-center text-aurea-navy/60">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-aurea-copper border-t-transparent mb-2" />
                  <p className="text-sm font-medium">Cargando catálogo de carta...</p>
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} className="py-12 text-center text-aurea-navy/60">
                  <UtensilsCrossed className="w-10 h-10 mx-auto text-aurea-navy/30 mb-2" />
                  <p className="text-base font-semibold text-aurea-navy">No se encontraron productos</p>
                  <p className="text-xs text-aurea-navy/60 mt-0.5">
                    Intenta cambiar los filtros de categoría o el término de búsqueda.
                  </p>
                </td>
              </tr>
            ) : (
              productos.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-aurea-champagne/10 transition-colors"
                >
                  {/* 1. Plato / Descripción */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-aurea-champagne/30 border border-aurea-copper/20 flex items-center justify-center text-aurea-copper shrink-0 font-serif font-bold text-sm">
                        {prod.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-aurea-navy text-sm truncate">
                            {prod.nombre}
                          </span>
                        </div>
                        {prod.descripcion && (
                          <p className="text-xs text-aurea-navy/60 truncate max-w-xs mt-0.5" title={prod.descripcion}>
                            {prod.descripcion}
                          </p>
                        )}
                        {prod.insumos_en_quiebre > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            {prod.insumos_en_quiebre} insumo(s) sin stock
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Categoría */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-aurea-champagne/30 text-aurea-navy border border-aurea-champagne/60">
                      {prod.categoria_nombre}
                    </span>
                  </td>

                  {/* 3. Destino Operativo */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {prod.requiere_preparacion ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                        title="Se despacha a los monitores KDS de cocina para cocción"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                        Cocina KDS
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200"
                        title="Despacho directo por mozo o barra sin monitor de cocina"
                      >
                        <Zap className="w-3.5 h-3.5 text-sky-600" />
                        Directo Salón
                      </span>
                    )}
                  </td>

                  {/* 4. Precio Venta */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-serif font-bold text-aurea-navy text-sm">
                      S/ {prod.precio.toFixed(2)}
                    </span>
                  </td>

                  {/* 5. Costo Receta */}
                  {mostrarDatosReceta && (<td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="font-medium text-aurea-navy text-sm">
                      S/ {prod.costo_teorico.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-aurea-navy/60">
                      ({prod.total_ingredientes} {prod.total_ingredientes === 1 ? 'insumo' : 'insumos'})
                    </span>
                  </td>)}

                  {/* 6. Margen Bruto */}
                  {mostrarDatosReceta && (<td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getMargenColor(prod.margen_bruto_pct)}`}>
                        {prod.margen_bruto_pct}%
                      </span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full ${getMargenBarColor(prod.margen_bruto_pct)}`}
                          style={{ width: `${Math.min(100, Math.max(0, prod.margen_bruto_pct))}%` }}
                        />
                      </div>
                    </div>
                  </td>)}

                  {/* 7. Disponibilidad Intercativa */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onConmutarDisponibilidad(prod)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        prod.disponibilidad === 'disponible'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Clic para cambiar disponibilidad rápida"
                    >
                      {prod.disponibilidad === 'disponible' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Disponible</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Agotado</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* 8. Acciones */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {mostrarDatosReceta && (<button
                        type="button"
                        onClick={() => onVerReceta(prod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-aurea-copper bg-aurea-champagne/30 hover:bg-aurea-champagne/50 transition-colors border border-aurea-copper/20"
                        title="Ver simulación de capacidad en bodega e insumos"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Capacidad</span>
                      </button>)}
                      <button
                        type="button"
                        onClick={() => onEditarProducto(prod)}
                        className="p-1.5 rounded-lg text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
                        title="Editar datos comerciales"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onArchivarProducto(prod)}
                        className="p-1.5 rounded-lg text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Archivar de carta (retiro seguro sin borrar histórico)"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Banner de Protección Legal y Auditoría */}
      <div className="px-4 py-2.5 bg-aurea-champagne/15 border-t border-aurea-champagne/40 flex items-center gap-2 text-xs text-aurea-navy/70">
        <ShieldCheck className="w-4 h-4 text-aurea-copper shrink-0" />
        <span>
          <strong>{mostrarDatosReceta ? 'Protección activa:' : 'Carta comercial:'}</strong>{' '}
          {mostrarDatosReceta
            ? 'Todo plato descuenta automáticamente insumos de su receta al completarse en cocina. Borrado físico prohibido para preservar auditoría de comandas históricas.'
            : 'La receta, costos y control de insumos se integrarán cuando el módulo de stock esté disponible. El archivado conserva el historial de ventas.'}
        </span>
      </div>

      {/* Controles de Paginación Interactiva */}
      <div className="p-4 border-t border-aurea-champagne/30 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-aurea-navy/70">
        {/* Contador de rango y selector de tamaño */}
        <div className="flex items-center gap-3">
          <span>
            Mostrando <strong>{inicioRango}</strong> - <strong>{finRango}</strong> de <strong>{totalRegistros}</strong> platos
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-aurea-navy/50">|</span>
            <span>Mostrar</span>
            <select
              value={limitePorPagina}
              onChange={(e) => onCambiarLimite(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-aurea-champagne/60 text-xs text-aurea-navy bg-white focus:border-aurea-copper outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>por pág.</span>
          </div>
        </div>

        {/* Botones de navegación de página */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCambiarPagina(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="p-1.5 rounded-lg border border-aurea-champagne/60 text-aurea-navy hover:bg-aurea-champagne/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onCambiarPagina(num)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                paginaActual === num
                  ? 'bg-aurea-copper text-white shadow-xs'
                  : 'text-aurea-navy hover:bg-aurea-champagne/30'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onCambiarPagina(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
            className="p-1.5 rounded-lg border border-aurea-champagne/60 text-aurea-navy hover:bg-aurea-champagne/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
