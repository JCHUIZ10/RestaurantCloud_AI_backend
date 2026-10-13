import React from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';

interface ComprasToolbarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  tipoComprobante: string;
  onTipoComprobanteChange: (val: string) => void;
  estado: string;
  onEstadoChange: (val: string) => void;
  fechaDesde: string;
  onFechaDesdeChange: (val: string) => void;
  fechaHasta: string;
  onFechaHastaChange: (val: string) => void;
  onLimpiarFiltros: () => void;
}

export const ComprasToolbar: React.FC<ComprasToolbarProps> = ({
  busqueda,
  onBusquedaChange,
  tipoComprobante,
  onTipoComprobanteChange,
  estado,
  onEstadoChange,
  fechaDesde,
  onFechaDesdeChange,
  fechaHasta,
  onFechaHastaChange,
  onLimpiarFiltros,
}) => {
  const tieneFiltrosActivos =
    busqueda.trim() !== '' ||
    tipoComprobante !== 'TODOS' ||
    estado !== 'TODOS' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por N° comprobante, código o proveedor..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Select Tipo Comprobante */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={tipoComprobante}
            onChange={(e) => onTipoComprobanteChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-700"
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
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-700"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="REGISTRADA">Vigentes / Registradas</option>
          <option value="ANULADA">Anuladas (Auditoría)</option>
        </select>
      </div>

      {/* Rango de Fechas y Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 font-medium text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
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

        {tieneFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded hover:bg-rose-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>
    </div>
  );
};
