import React from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Search,
} from 'lucide-react';
import { CategoriaAdminDTO } from '@/types/admin';

interface CategoriasTableProps {
  categorias: CategoriaAdminDTO[];
  todasCategoriasOrdenadas: CategoriaAdminDTO[];
  onSubirOrden: (categoriaId: string) => void;
  onBajarOrden: (categoriaId: string) => void;
  onConmutarVisibilidad: (categoriaId: string, activa: boolean) => void;
  onEditar: (categoria: CategoriaAdminDTO) => void;
  onEliminar: (categoria: CategoriaAdminDTO) => void;
  onLimpiarBusqueda?: () => void;
  filtroActivo: boolean;
  paginaActual?: number;
  totalPaginas?: number;
  totalRegistros?: number;
  limitePorPagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  onCambiarLimite?: (limite: number) => void;
}

export const CategoriasTable: React.FC<CategoriasTableProps> = ({
  categorias,
  todasCategoriasOrdenadas,
  onSubirOrden,
  onBajarOrden,
  onConmutarVisibilidad,
  onEditar,
  onEliminar,
  onLimpiarBusqueda,
  filtroActivo,
  paginaActual: paginaProp,
  totalPaginas: totalPaginasProp,
  totalRegistros: totalRegistrosProp,
  limitePorPagina: limiteProp,
  onCambiarPagina,
  onCambiarLimite,
}) => {
  const [paginaInterna, setPaginaInterna] = React.useState(1);
  const [limiteInterno, setLimiteInterno] = React.useState(10);

  const paginaActual = paginaProp ?? paginaInterna;
  const limitePorPagina = limiteProp ?? limiteInterno;
  const totalRegistros = totalRegistrosProp ?? categorias.length;
  const totalPaginas = totalPaginasProp ?? Math.max(1, Math.ceil(totalRegistros / limitePorPagina));

  const handleCambiarPagina = (pag: number) => {
    const paginaValida = Math.max(1, Math.min(pag, totalPaginas));
    if (onCambiarPagina) {
      onCambiarPagina(paginaValida);
    } else {
      setPaginaInterna(paginaValida);
    }
  };

  const handleCambiarLimite = (lim: number) => {
    if (onCambiarLimite) {
      onCambiarLimite(lim);
    } else {
      setLimiteInterno(lim);
      setPaginaInterna(1);
    }
  };

  React.useEffect(() => {
    if (paginaProp === undefined) {
      setPaginaInterna(1);
    }
  }, [categorias.length, paginaProp]);

  if (categorias.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-aurea-champagne/40 shadow-sm space-y-3">
        <div className="w-12 h-12 rounded-full bg-aurea-champagne/30 text-aurea-navy flex items-center justify-center mx-auto">
          <Search className="w-6 h-6 text-aurea-copper" />
        </div>
        <h3 className="text-base font-semibold text-aurea-navy">No se encontraron categorías</h3>
        <p className="text-sm text-aurea-navy/60 max-w-sm mx-auto">
          No existen categorías que coincidan con el filtro o término de búsqueda aplicado.
        </p>
        {onLimpiarBusqueda && (
          <button
            type="button"
            onClick={onLimpiarBusqueda}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-aurea-champagne/30 text-aurea-navy hover:bg-aurea-champagne/50 transition-colors"
          >
            Limpiar filtros de búsqueda
          </button>
        )}
      </div>
    );
  }

  const inicioRango = totalRegistros > 0 ? (paginaActual - 1) * limitePorPagina + 1 : 0;
  const finRango = Math.min(paginaActual * limitePorPagina, totalRegistros);
  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const categoriasPaginadas =
    paginaProp !== undefined && categorias.length <= limitePorPagina
      ? categorias
      : categorias.slice(indiceInicio, indiceInicio + limitePorPagina);

  return (
    <div className="bg-white rounded-2xl border border-aurea-champagne/40 shadow-sm overflow-hidden flex flex-col">
      {/* =====================================================================
          1. VISTA TABLA PARA DESKTOP Y TABLET (md en adelante)
          ===================================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-aurea-champagne/40 bg-aurea-ivory/50 text-xs font-semibold text-aurea-navy/70 uppercase tracking-wider">
              <th className="py-3.5 pl-6 pr-3 w-28">Secuencia</th>
              <th className="py-3.5 px-4">Nombre de la Categoría</th>
              <th className="py-3.5 px-4">Platos Vinculados</th>
              <th className="py-3.5 px-4 text-center">Visibilidad Carta</th>
              <th className="py-3.5 pr-6 pl-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurea-champagne/30 text-sm text-aurea-navy">
            {categoriasPaginadas.map((cat) => {
              // Buscar índice en la lista general para saber si se puede subir/bajar
              const indexGeneral = todasCategoriasOrdenadas.findIndex((c) => c.id === cat.id);
              const puedeSubir = indexGeneral > 0;
              const puedeBajar =
                indexGeneral >= 0 && indexGeneral < todasCategoriasOrdenadas.length - 1;

              return (
                <tr
                  key={cat.id}
                  className={`group transition-colors ${
                    !cat.activa ? 'bg-black/[0.015]' : 'hover:bg-aurea-champagne/10'
                  }`}
                >
                  {/* Secuencia / Reordenamiento */}
                  <td className="py-3.5 pl-6 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span title="Arrastrar para ordenar" className="cursor-grab">
                        <GripVertical className="w-4 h-4 text-aurea-navy/30 group-hover:text-aurea-copper transition-colors" />
                      </span>
                      <span className="w-6 h-6 rounded-md bg-aurea-champagne/30 text-aurea-navy font-mono text-xs font-bold flex items-center justify-center">
                        #{cat.orden}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => onSubirOrden(cat.id)}
                          disabled={!puedeSubir || filtroActivo}
                          className={`p-1 rounded hover:bg-aurea-champagne/40 transition-colors ${
                            !puedeSubir || filtroActivo
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-aurea-navy hover:text-aurea-copper'
                          }`}
                          title={
                            filtroActivo
                              ? 'Limpia el filtro para reordenar'
                              : 'Subir posición en comanda'
                          }
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onBajarOrden(cat.id)}
                          disabled={!puedeBajar || filtroActivo}
                          className={`p-1 rounded hover:bg-aurea-champagne/40 transition-colors ${
                            !puedeBajar || filtroActivo
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-aurea-navy hover:text-aurea-copper'
                          }`}
                          title={
                            filtroActivo
                              ? 'Limpia el filtro para reordenar'
                              : 'Bajar posición en comanda'
                          }
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Nombre de la Categoría */}
                  <td className="py-3.5 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-base font-semibold ${
                          cat.activa ? 'text-aurea-navy' : 'text-aurea-navy/60 line-through'
                        }`}
                      >
                        {cat.nombre}
                      </span>
                      {!cat.activa && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Oculta
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-aurea-navy/50 block">
                      ID: {cat.id.substring(0, 8)}...
                    </span>
                  </td>

                  {/* Platos Vinculados */}
                  <td className="py-3.5 px-4">
                    {cat.total_productos > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/20">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
                          {cat.total_productos} plato{cat.total_productos > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-aurea-navy/60">
                          ({cat.productos_disponibles} disp.
                          {cat.productos_agotados > 0 && `, ${cat.productos_agotados} agot.`})
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                        0 platos (Sin asignar)
                      </span>
                    )}
                  </td>

                  {/* Visibilidad Carta / Salón */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onConmutarVisibilidad(cat.id, !cat.activa)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                        cat.activa
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                      title={
                        cat.activa
                          ? 'Visible en salón y comanda. Clic para ocultar.'
                          : 'Oculta en salón y comanda. Clic para activar.'
                      }
                    >
                      {cat.activa ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                          <span>Oculta</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 pr-6 pl-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditar(cat)}
                        className="p-2 rounded-lg text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
                        title={`Editar categoría "${cat.nombre}"`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(cat)}
                        className="p-2 rounded-lg text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title={`Eliminar categoría "${cat.nombre}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =====================================================================
          2. VISTA DE TARJETAS PARA MÓVIL (< md)
          ===================================================================== */}
      <div className="md:hidden divide-y divide-aurea-champagne/30">
        {categoriasPaginadas.map((cat) => {
          const indexGeneral = todasCategoriasOrdenadas.findIndex((c) => c.id === cat.id);
          const puedeSubir = indexGeneral > 0;
          const puedeBajar =
            indexGeneral >= 0 && indexGeneral < todasCategoriasOrdenadas.length - 1;

          return (
            <div
              key={cat.id}
              className={`p-4 space-y-3 transition-colors ${
                !cat.activa ? 'bg-black/[0.015]' : ''
              }`}
            >
              {/* Fila superior: Orden + Nombre + Acciones */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-aurea-champagne/30 text-aurea-navy font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{cat.orden}
                  </span>
                  <div>
                    <h4
                      className={`text-base font-semibold leading-tight ${
                        cat.activa ? 'text-aurea-navy' : 'text-aurea-navy/60 line-through'
                      }`}
                    >
                      {cat.nombre}
                    </h4>
                    <span className="text-[11px] text-aurea-navy/50">
                      ID: {cat.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>

                {/* Botones de acción móvil */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditar(cat)}
                    className="p-2 rounded-lg text-aurea-navy/70 hover:bg-aurea-champagne/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEliminar(cat)}
                    className="p-2 rounded-lg text-rose-600/80 hover:bg-rose-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fila intermedia: Platos vinculados + Estado */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {cat.total_productos > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-aurea-champagne/30 text-aurea-navy">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-aurea-copper" />
                    {cat.total_productos} plato{cat.total_productos > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 italic">0 platos asociados</span>
                )}

                {/* Switch de visibilidad móvil */}
                <button
                  type="button"
                  onClick={() => onConmutarVisibilidad(cat.id, !cat.activa)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold min-h-[36px] ${
                    cat.activa
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {cat.activa ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                      <span>Oculta</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fila inferior: Botones táctiles de reordenamiento móvil */}
              <div className="flex items-center justify-between pt-2 border-t border-aurea-champagne/20">
                <span className="text-xs text-aurea-navy/60 font-medium">Reordenar en comanda:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSubirOrden(cat.id)}
                    disabled={!puedeSubir || filtroActivo}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[40px] ${
                      !puedeSubir || filtroActivo
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'border-aurea-copper/40 text-aurea-navy bg-white hover:bg-aurea-champagne/20'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>Subir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onBajarOrden(cat.id)}
                    disabled={!puedeBajar || filtroActivo}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[40px] ${
                      !puedeBajar || filtroActivo
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'border-aurea-copper/40 text-aurea-navy bg-white hover:bg-aurea-champagne/20'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span>Bajar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          3. PAGINACIÓN COMPACTA Y RESPONSIVA
          ===================================================================== */}
      <div className="p-4 border-t border-aurea-champagne/30 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-aurea-navy/70">
        {/* Contador de rango y selector de tamaño */}
        <div className="flex items-center gap-3">
          <span>
            Mostrando <strong>{inicioRango}</strong> - <strong>{finRango}</strong> de <strong>{totalRegistros}</strong> categorías
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-aurea-navy/50">|</span>
            <span>Mostrar</span>
            <select
              value={limitePorPagina}
              onChange={(e) => handleCambiarLimite(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-aurea-champagne/60 text-xs text-aurea-navy bg-white focus:border-aurea-copper outline-none"
            >
              <option value={5}>5</option>
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
            onClick={() => handleCambiarPagina(paginaActual - 1)}
            disabled={paginaActual <= 1}
            className="p-1.5 rounded-lg border border-aurea-champagne/60 text-aurea-navy hover:bg-aurea-champagne/20 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-aurea-champagne/20 border border-aurea-champagne/40 text-xs font-medium text-aurea-navy whitespace-nowrap">
            <span>Página</span>
            {totalPaginas > 1 ? (
              <select
                value={paginaActual}
                onChange={(e) => handleCambiarPagina(Number(e.target.value))}
                className="bg-transparent font-bold text-aurea-navy border-b border-aurea-copper/60 focus:outline-none cursor-pointer px-0.5"
                title="Seleccionar página"
              >
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            ) : (
              <strong className="font-bold">{paginaActual}</strong>
            )}
            <span>de</span>
            <strong className="font-bold">{totalPaginas}</strong>
          </div>

          <button
            type="button"
            onClick={() => handleCambiarPagina(paginaActual + 1)}
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

export default CategoriasTable;
