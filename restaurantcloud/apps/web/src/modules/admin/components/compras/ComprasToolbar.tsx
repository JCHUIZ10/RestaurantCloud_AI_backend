import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Loader2 } from 'lucide-react';

export type CriterioBusquedaCompra = 'TODOS' | 'COMPROBANTE' | 'PROVEEDOR' | 'CODIGO';

interface ComprasToolbarProps {
  busqueda: string;
  criterioBusqueda?: CriterioBusquedaCompra;
  onEjecutarBusqueda: (termino: string, criterio: CriterioBusquedaCompra) => void;
  tipoComprobante: string;
  onTipoComprobanteChange: (val: string) => void;
  estado: string;
  onEstadoChange: (val: string) => void;
  fechaDesde: string;
  onFechaDesdeChange: (val: string) => void;
  fechaHasta: string;
  onFechaHastaChange: (val: string) => void;
  onLimpiarFiltros: () => void;
  cargando?: boolean;
}

export const ComprasToolbar: React.FC<ComprasToolbarProps> = ({
  busqueda,
  criterioBusqueda = 'TODOS',
  onEjecutarBusqueda,
  tipoComprobante,
  onTipoComprobanteChange,
  estado,
  onEstadoChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
  onLimpiarFiltros,
  cargando = false,
}) => {
  const [textoLocal, setTextoLocal] = useState(busqueda);
  const [criterioLocal, setCriterioLocal] = useState<CriterioBusquedaCompra>(criterioBusqueda);

  useEffect(() => {
    setTextoLocal(busqueda);
  }, [busqueda]);

  useEffect(() => {
    setCriterioLocal(criterioBusqueda);
  }, [criterioBusqueda]);

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onEjecutarBusqueda(textoLocal.trim(), criterioLocal);
  };

  const handleLimpiarTermino = () => {
    setTextoLocal('');
    if (busqueda !== '') {
      onEjecutarBusqueda('', criterioLocal);
    }
  };

  const obtenerPlaceholder = (crit: CriterioBusquedaCompra) => {
    switch (crit) {
      case 'COMPROBANTE':
        return 'Buscar por N° comprobante (ej: F001-00049281, B001)...';
      case 'PROVEEDOR':
        return 'Buscar por nombre o razón social de proveedor...';
      case 'CODIGO':
        return 'Buscar por código correlativo (ej: FC-202610-0024)...';
      case 'TODOS':
      default:
        return 'Buscar por N° comprobante, código o proveedor...';
    }
  };

  const obtenerEtiquetaCriterio = (crit: CriterioBusquedaCompra) => {
    switch (crit) {
      case 'COMPROBANTE':
        return 'N° Comprobante';
      case 'PROVEEDOR':
        return 'Proveedor';
      case 'CODIGO':
        return 'Código Interno';
      case 'TODOS':
      default:
        return 'Todos los campos';
    }
  };

  const tieneFiltrosActivos =
    busqueda.trim() !== '' ||
    criterioBusqueda !== 'TODOS' ||
    tipoComprobante !== 'TODOS' ||
    estado !== 'TODOS' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Formulario de Búsqueda Específica con Botón Explícito y Soporte Enter */}
        <form
          onSubmit={handleBuscar}
          className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          {/* Selector de Criterio Específico */}
          <div className="relative shrink-0">
            <select
              value={criterioLocal}
              onChange={(e) => setCriterioLocal(e.target.value as CriterioBusquedaCompra)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer min-h-[38px]"
              title="Seleccionar criterio específico de búsqueda"
            >
              <option value="TODOS">Todos los campos</option>
              <option value="COMPROBANTE">N° Comprobante</option>
              <option value="PROVEEDOR">Proveedor</option>
              <option value="CODIGO">Código Interno</option>
            </select>
          </div>

          {/* Input de texto de búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={textoLocal}
              onChange={(e) => setTextoLocal(e.target.value)}
              placeholder={obtenerPlaceholder(criterioLocal)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[38px]"
            />
            {textoLocal && (
              <button
                type="button"
                onClick={handleLimpiarTermino}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md transition-colors"
                title="Limpiar término"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Buscar Explícito */}
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[38px]"
            title="Ejecutar búsqueda específica (Enter)"
          >
            {cargando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Buscar</span>
          </button>
        </form>

        {/* Filtros rápidos: Tipo Comprobante y Estado */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          {/* Select Tipo Comprobante */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-gray-400 hidden sm:block shrink-0" />
            <select
              value={tipoComprobante}
              onChange={(e) => onTipoComprobanteChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-700 min-h-[38px]"
            >
              <option value="TODOS">Todos los comprobantes</option>
              <option value="FACTURA">Facturas (IGV 18%)</option>
              <option value="BOLETA">Boletas de Venta</option>
              <option value="NOTA_VENTA">Notas de Venta</option>
              <option value="GUIA_REMISION">Guías de Remisión</option>
              <option value="RECIBO">Recibos Simples</option>
            </select>
          </div>

          {/* Select Estado */}
          <select
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-700 min-h-[38px]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="REGISTRADA">Vigentes / Registradas</option>
            <option value="ANULADA">Anuladas (Auditoría)</option>
          </select>
        </div>
      </div>

      {/* Rango de Fechas, Búsqueda activa y Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 font-medium text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Rango de emisión:</span>
          </span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          <span className="text-gray-400">hasta</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Chip de Búsqueda Activa & Botón Limpiar */}
        <div className="flex flex-wrap items-center gap-2">
          {busqueda.trim() !== '' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium">
              <span className="text-primary-500">{obtenerEtiquetaCriterio(criterioBusqueda)}:</span>
              <span className="font-semibold max-w-[180px] truncate">"{busqueda}"</span>
              <button
                type="button"
                onClick={handleLimpiarTermino}
                className="hover:text-primary-900 p-0.5 rounded-full"
                title="Quitar filtro de búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {tieneFiltrosActivos && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar todos los filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
