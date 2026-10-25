import React, { useState, useEffect } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Button, CampoBusqueda, Pestanas } from '@/components/ui';
import { cn } from '@/shared/utils';
import { TIPOS_COMPROBANTE } from './formatoCompra';

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

const CLASE_CONTROL =
  'min-h-tactil px-3 rounded-xl border border-aurea-champagne/70 bg-white text-base md:text-sm text-aurea-navy shadow-sm focus:outline-none focus:border-aurea-copper';

const PLACEHOLDER: Record<CriterioBusquedaCompra, string> = {
  TODOS: 'N° de comprobante, código o proveedor',
  COMPROBANTE: 'Ej. F001-00049281',
  PROVEEDOR: 'Nombre del proveedor',
  CODIGO: 'Ej. FC-202610-0024',
};

/** Estado, búsqueda, tipo y fechas; va dentro de la tarjeta de la tabla. */
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

  // La búsqueda se envía al confirmar (Enter o botón) para no consultar en cada tecla
  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    onEjecutarBusqueda(textoLocal.trim(), criterioLocal);
  };

  const handleCambiarTexto = (texto: string) => {
    setTextoLocal(texto);
    if (texto === '' && busqueda !== '') onEjecutarBusqueda('', criterioLocal);
  };

  const tieneFiltrosActivos =
    busqueda.trim() !== '' ||
    criterioBusqueda !== 'TODOS' ||
    tipoComprobante !== 'TODOS' ||
    estado !== 'TODOS' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  return (
    <div className="space-y-3">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <Pestanas
          etiqueta="Filtrar por estado"
          valor={estado}
          onCambiar={onEstadoChange}
          opciones={[
            { valor: 'TODOS', etiqueta: 'Todas' },
            { valor: 'REGISTRADA', etiqueta: 'Vigentes', punto: 'bg-estado-ok-500' },
            { valor: 'ANULADA', etiqueta: 'Anuladas', punto: 'bg-estado-error-500' },
          ]}
          className="self-start xl:self-auto"
        />
        <form onSubmit={handleBuscar} role="search" className="flex flex-col sm:flex-row sm:items-center gap-2 w-full xl:w-auto xl:min-w-[36rem]">
          <select
            value={criterioLocal}
            onChange={(e) => setCriterioLocal(e.target.value as CriterioBusquedaCompra)}
            aria-label="Buscar en"
            className={cn(CLASE_CONTROL, 'sm:w-44 shrink-0 font-medium')}
          >
            <option value="TODOS">Todos los campos</option>
            <option value="COMPROBANTE">N° de comprobante</option>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="CODIGO">Código interno</option>
          </select>
          <div className="flex items-center gap-2 flex-1">
            <CampoBusqueda
              valor={textoLocal}
              onCambiar={handleCambiarTexto}
              placeholder={PLACEHOLDER[criterioLocal]}
              etiqueta="Buscar compras"
            />
            <Button type="submit" variant="outline" disabled={cargando} className="shrink-0">
              Buscar
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={tipoComprobante}
          onChange={(e) => onTipoComprobanteChange(e.target.value)}
          aria-label="Tipo de comprobante"
          className={cn(CLASE_CONTROL, 'w-full sm:w-auto')}
        >
          <option value="TODOS">Todos los comprobantes</option>
          {Object.entries(TIPOS_COMPROBANTE).map(([valor, { label }]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>

        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Fecha de emisión</legend>
          <CalendarDays className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
          <input
            type="date"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => onFechaDesdeChange(e.target.value)}
            aria-label="Desde"
            className={CLASE_CONTROL}
          />
          <span className="text-sm text-aurea-navy/60">a</span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => onFechaHastaChange(e.target.value)}
            aria-label="Hasta"
            className={CLASE_CONTROL}
          />
        </fieldset>

        {tieneFiltrosActivos && (
          <Button
            variant="ghost"
            onClick={onLimpiarFiltros}
            leftIcon={<X className="w-4 h-4" aria-hidden="true" />}
            className="sm:ml-auto"
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
};
