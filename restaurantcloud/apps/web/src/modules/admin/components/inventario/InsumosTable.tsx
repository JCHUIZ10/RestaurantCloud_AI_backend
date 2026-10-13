import React, { useState } from 'react';
import {
  Scale,
  Edit2,
  Archive,
  RotateCcw,
  AlertTriangle,
  UtensilsCrossed,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { InsumoAdminDTO, NivelSemaforoStock, UnidadInsumo, EstadoInsumo } from '@/types/admin';

export interface PaginacionInsumosInfo {
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

interface InsumosTableProps {
  insumos: InsumoAdminDTO[];
  cargando: boolean;
  paginacion?: PaginacionInsumosInfo;
  onCambiarPagina?: (nuevaPagina: number) => void;
  onCambiarLimite?: (nuevoLimite: number) => void;
  onAbrirAjusteStock: (insumo: InsumoAdminDTO) => void;
  onAbrirEditarInsumo: (insumo: InsumoAdminDTO) => void;
  onConmutarEstado: (insumo: InsumoAdminDTO, nuevoEstado: EstadoInsumo) => void;
}

export const InsumosTable: React.FC<InsumosTableProps> = ({
  insumos,
  cargando,
  paginacion,
  onCambiarPagina,
  onCambiarLimite,
  onAbrirAjusteStock,
  onAbrirEditarInsumo,
  onConmutarEstado,
}) => {
  // Popover interactivo para ver los platos dependientes
  const [popoverInsumoId, setPopoverInsumoId] = useState<string | null>(null);

  const getUnidadBadgeInfo = (unidad: UnidadInsumo) => {
    switch (unidad) {
      case 'kg':
        return { label: 'kg · Kilo', esBase: true };
      case 'L':
        return { label: 'L · Litro', esBase: true };
      case 'und':
        return { label: 'und · Unidad', esBase: true };
      case 'saco':
        return { label: 'saco · Saco', esBase: false };
      case 'botella':
        return { label: 'botella · Botella', esBase: false };
      case 'lata':
        return { label: 'lata · Lata', esBase: false };
      case 'caja':
        return { label: 'caja · Caja', esBase: false };
      case 'paquete':
        return { label: 'paquete · Paquete', esBase: false };
      case 'bidon':
        return { label: 'bidón · Bidón', esBase: false };
      case 'jaba':
        return { label: 'jaba · Jaba', esBase: false };
      default:
        return { label: unidad, esBase: false };
    }
  };

  const getSemaforoBadge = (nivel: NivelSemaforoStock) => {
    switch (nivel) {
      case 'optimo':
        return {
          label: 'Óptimo',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          barColor: 'bg-emerald-500',
        };
      case 'reposicion':
        return {
          label: 'Reposición',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          barColor: 'bg-amber-500',
        };
      case 'critico':
        return {
          label: 'Crítico',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          barColor: 'bg-rose-500',
        };
      case 'agotado':
        return {
          label: 'Sin Stock',
          bg: 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold',
          dot: 'bg-zinc-900',
          barColor: 'bg-zinc-400',
        };
    }
  };

  if (cargando) {
    return (
      <div className="bg-white border border-aurea-champagne/60 rounded-2xl p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-aurea-copper border-t-transparent" />
        <p className="mt-3 text-sm text-aurea-navy/70 font-medium">
          Cargando catálogo de existencias y auditorías...
        </p>
      </div>
    );
  }

  if (insumos.length === 0) {
    return (
      <div className="bg-white border border-aurea-champagne/60 rounded-2xl p-12 text-center shadow-sm">
        <Scale className="w-10 h-10 text-aurea-copper/50 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-aurea-navy">
          No se encontraron insumos con este criterio
        </h3>
        <p className="text-sm text-aurea-navy/60 mt-1 max-w-md mx-auto">
          Prueba cambiando el filtro de estado (ej. "Todos") o ajustando el texto de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-aurea-champagne/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Vista Desktop (Tabla Completa) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-aurea-champagne/20 border-b border-aurea-champagne/40 text-[11px] font-bold text-aurea-navy/70 uppercase tracking-wider">
              <th className="py-3.5 px-4">Insumo</th>
              <th className="py-3.5 px-4">Unidad Almacén</th>
              <th className="py-3.5 px-4 min-w-[200px]">Existencias y Umbral</th>
              <th className="py-3.5 px-4">Costo Ref.</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 min-w-[170px]">Recetas / Impacto</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurea-champagne/30 text-sm">
            {insumos.map((ins) => {
              const sem = getSemaforoBadge(ins.nivel_semaforo);
              const unidadInfo = getUnidadBadgeInfo(ins.unidad_medida);
              // Porcentaje visual respecto al stock mínimo * 2
              const maxGrafico = Math.max(ins.stock_minimo * 2, ins.stock_actual, 1);
              const porcentaje = Math.min(100, Math.round((ins.stock_actual / maxGrafico) * 100));

              return (
                <tr
                  key={ins.id}
                  className={`hover:bg-aurea-champagne/10 transition-colors ${
                    ins.estado === 'agotado' ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* Nombre y Proveedor */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-aurea-navy flex items-center gap-1.5">
                      <span>{ins.nombre}</span>
                      {ins.estado === 'agotado' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Insumo en quiebre" />
                      )}
                    </div>
                    <div className="text-xs text-aurea-navy/55 mt-0.5">
                      {ins.ultimo_proveedor_nombre || 'Sin compras registradas'}
                    </div>
                  </td>

                  {/* Unidad de Almacén */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${
                        unidadInfo.esBase
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {unidadInfo.label}
                    </span>
                  </td>

                  {/* Existencias y Barra de Semáforo */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-aurea-navy">
                        {ins.stock_actual.toFixed(3)} {ins.unidad_medida}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${sem.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sem.dot}`} />
                        {sem.label}
                      </span>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${sem.barColor} transition-all duration-300`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-aurea-navy/50 mt-1">
                      <span>Mín: {ins.stock_minimo.toFixed(3)} {ins.unidad_medida}</span>
                      <span>{porcentaje}% cap.</span>
                    </div>
                  </td>

                  {/* Costo Referencial */}
                  <td className="py-3.5 px-4 font-mono text-xs text-aurea-navy font-medium">
                    S/ {ins.costo_unitario.toFixed(2)}
                  </td>

                  {/* Estado Operativo */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        ins.estado === 'activo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ins.estado === 'agotado'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ins.estado === 'activo'
                            ? 'bg-emerald-600'
                            : ins.estado === 'agotado'
                            ? 'bg-rose-600'
                            : 'bg-zinc-400'
                        }`}
                      />
                      {ins.estado.charAt(0).toUpperCase() + ins.estado.slice(1)}
                    </span>
                  </td>

                  {/* Recetas / Impacto en Carta */}
                  <td className="py-3.5 px-4 relative">
                    {ins.platos_afectados_si_quiebra > 0 ? (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setPopoverInsumoId(popoverInsumoId === ins.id ? null : ins.id)
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-aurea-navy font-medium hover:text-aurea-copper transition-colors"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
                          <span>
                            {ins.platos_afectados_si_quiebra}{' '}
                            {ins.platos_afectados_si_quiebra === 1 ? 'plato' : 'platos'} en carta
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        {ins.estado === 'agotado' && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Platos bloqueados</span>
                          </div>
                        )}

                        {/* Popover desplegable con la lista de platos */}
                        {popoverInsumoId === ins.id && (
                          <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-aurea-copper/40 rounded-xl shadow-xl p-3 z-30 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b border-aurea-champagne/40 pb-1.5 mb-2">
                              <span className="text-xs font-bold text-aurea-navy">
                                Recetas Vinculadas
                              </span>
                              <button
                                type="button"
                                onClick={() => setPopoverInsumoId(null)}
                                className="text-xs text-aurea-navy/60 hover:text-aurea-navy"
                              >
                                ✕
                              </button>
                            </div>
                            <ul className="space-y-1 text-xs text-aurea-navy/80">
                              {ins.platos_detalle.map((plato, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-aurea-copper" />
                                  <span>{plato}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2.5 pt-2 border-t border-aurea-champagne/40 text-[10px] text-aurea-navy/60">
                              Ficha técnica editable en <strong>CU-ADMIN-04</strong>.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-aurea-navy/40 italic">
                        Insumo sin receta asignada
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAbrirAjusteStock(ins)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-semibold transition-all shadow-sm"
                        title="Registrar recuento físico, merma o ingreso manual"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Ajustar Stock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAbrirEditarInsumo(ins)}
                        className="p-1.5 rounded-lg text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20 transition-colors"
                        title="Editar datos maestros del insumo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {ins.estado !== 'inactivo' ? (
                        <button
                          type="button"
                          onClick={() => onConmutarEstado(ins, 'inactivo')}
                          className="p-1.5 rounded-lg text-aurea-navy/50 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Archivar como inactivo"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onConmutarEstado(ins, 'activo')}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Reactivar insumo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile (Tarjetas Táctiles) */}
      <div className="lg:hidden divide-y divide-aurea-champagne/30">
        {insumos.map((ins) => {
          const sem = getSemaforoBadge(ins.nivel_semaforo);
          const unidadInfo = getUnidadBadgeInfo(ins.unidad_medida);

          return (
            <div key={ins.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-aurea-navy text-base">
                    {ins.nombre}
                  </h4>
                  <div className="text-xs text-aurea-navy/60 mt-0.5">
                    {ins.ultimo_proveedor_nombre || 'Sin compras'}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${sem.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${sem.dot}`} />
                  {sem.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-aurea-champagne/15 p-2.5 rounded-xl">
                <div>
                  <span className="text-aurea-navy/60 block">Existencias:</span>
                  <span className="font-mono font-bold text-aurea-navy text-sm">
                    {ins.stock_actual.toFixed(3)} {ins.unidad_medida}
                  </span>
                </div>
                <div>
                  <span className="text-aurea-navy/60 block">Umbral Mínimo:</span>
                  <span className="font-mono text-aurea-navy">
                    {ins.stock_minimo.toFixed(3)} {ins.unidad_medida}
                  </span>
                </div>
                <div>
                  <span className="text-aurea-navy/60 block">Unidad Almacén:</span>
                  <span className="font-medium text-aurea-navy">{unidadInfo.label}</span>
                </div>
                <div>
                  <span className="text-aurea-navy/60 block">Costo Referencial:</span>
                  <span className="font-mono font-medium text-aurea-navy">
                    S/ {ins.costo_unitario.toFixed(2)}
                  </span>
                </div>
              </div>

              {ins.platos_afectados_si_quiebra > 0 && (
                <div className="text-xs text-aurea-navy/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
                    <span>{ins.platos_afectados_si_quiebra} recetas dependen de este insumo</span>
                  </span>
                  {ins.estado === 'agotado' && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                      Bloquea Carta
                    </span>
                  )}
                </div>
              )}

              {/* Botones Móviles */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onAbrirAjusteStock(ins)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-aurea-navy text-white text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  <Scale className="w-4 h-4" />
                  <span>Ajustar Stock Físico</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirEditarInsumo(ins)}
                  className="p-2.5 rounded-xl border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/20 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Editar insumo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Paginación Interactiva */}
      {paginacion && paginacion.total > 0 && (
        <div className="px-4 py-3.5 bg-aurea-champagne/15 border-t border-aurea-champagne/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-aurea-navy">
          {/* Lado izquierdo: Resumen de registros y selector de límite por página */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-aurea-navy/70">
              Mostrando{' '}
              <strong>{(paginacion.pagina - 1) * paginacion.limite + 1}</strong> a{' '}
              <strong>{Math.min(paginacion.pagina * paginacion.limite, paginacion.total)}</strong> de{' '}
              <strong>{paginacion.total}</strong> insumos
            </span>

            {onCambiarLimite && (
              <div className="flex items-center gap-1.5">
                <span className="text-aurea-navy/50 text-[11px] hidden sm:inline">Mostrar:</span>
                <select
                  value={paginacion.limite}
                  onChange={(e) => onCambiarLimite(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-aurea-champagne/60 rounded-lg text-xs text-aurea-navy font-medium focus:outline-none focus:ring-1 focus:ring-aurea-copper shadow-sm cursor-pointer"
                >
                  <option value={10}>10 / pág</option>
                  <option value={20}>20 / pág</option>
                  <option value={50}>50 / pág</option>
                </select>
              </div>
            )}
          </div>

          {/* Lado derecho: Controles de navegación de páginas */}
          {onCambiarPagina && (
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
              <button
                type="button"
                disabled={paginacion.pagina <= 1}
                onClick={() => onCambiarPagina(paginacion.pagina - 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-aurea-champagne/60 bg-white hover:bg-aurea-champagne/20 text-aurea-navy disabled:opacity-35 disabled:cursor-not-allowed transition-colors font-medium text-xs min-h-[32px] shadow-sm"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: paginacion.total_paginas }, (_, i) => i + 1).map((num) => {
                  const activa = num === paginacion.pagina;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onCambiarPagina(num)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        activa
                          ? 'bg-aurea-navy text-white shadow-sm'
                          : 'bg-white border border-aurea-champagne/60 text-aurea-navy hover:bg-aurea-champagne/20 shadow-sm'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={paginacion.pagina >= paginacion.total_paginas}
                onClick={() => onCambiarPagina(paginacion.pagina + 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-aurea-champagne/60 bg-white hover:bg-aurea-champagne/20 text-aurea-navy disabled:opacity-35 disabled:cursor-not-allowed transition-colors font-medium text-xs min-h-[32px] shadow-sm"
                title="Página siguiente"
              >
                <span className="hidden md:inline">Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

