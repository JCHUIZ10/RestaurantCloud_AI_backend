import React from 'react';
import { Eye, Ban, Phone, Search, X } from 'lucide-react';
import { FichaCompraResumenDTO } from '@/types/admin';
import {
  Button,
  EstadoBadge,
  EstadoVacio,
  IconButton,
  ListaResponsive,
  Paginacion,
  Skeleton,
  type ColumnaTabla,
} from '@/components/ui';
import { cn } from '@/shared/utils';
import { TagComprobante, TagPago } from './etiquetasCompra';
import { formatoFecha, soles } from './formatoCompra';

interface ComprasTableProps {
  fichas: FichaCompraResumenDTO[];
  cargando: boolean;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamanoPagina: number;
  onCambiarPagina: (pag: number) => void;
  onCambiarTamanoPagina: (tamano: number) => void;
  onVerDetalle: (fichaId: string) => void;
  onSolicitarAnulacion: (ficha: FichaCompraResumenDTO) => void;
  /** Filtros que van dentro de la tarjeta */
  cabecera?: React.ReactNode;
  onLimpiarFiltros?: () => void;
}

const Comprobante: React.FC<{ f: FichaCompraResumenDTO }> = ({ f }) => {
  const anulada = f.estado === 'ANULADA';
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <TagComprobante tipo={f.tipo_comprobante} />
        <span className={cn('font-mono text-sm font-semibold', anulada ? 'line-through text-aurea-navy/40' : 'text-aurea-navy')}>
          {f.numero_comprobante}
        </span>
      </div>
      <p className="text-xs text-aurea-navy/60">
        <span className="font-mono">{f.codigo_correlativo}</span> · {f.cantidad_items} {f.cantidad_items === 1 ? 'insumo' : 'insumos'}
      </p>
    </div>
  );
};

const Proveedor: React.FC<{ f: FichaCompraResumenDTO }> = ({ f }) => (
  <div className="min-w-0">
    <p className="font-semibold text-aurea-navy truncate max-w-[14rem]">{f.proveedor_nombre}</p>
    {f.proveedor_telefono && (
      <a href={`tel:${f.proveedor_telefono}`} className="inline-flex items-center gap-1 text-xs font-mono text-aurea-navy/60 hover:text-aurea-navy">
        <Phone className="w-3 h-3 text-aurea-copper" aria-hidden="true" />
        {f.proveedor_telefono}
      </a>
    )}
  </div>
);

const Total: React.FC<{ f: FichaCompraResumenDTO }> = ({ f }) => {
  const anulada = f.estado === 'ANULADA';
  return (
    <div className="whitespace-nowrap">
      <p className={cn('font-serif font-bold text-base tabular-nums', anulada ? 'line-through text-aurea-navy/40' : 'text-aurea-navy')}>
        {soles(f.total)}
      </p>
      {f.tipo_comprobante === 'FACTURA' && (
        <p className="text-xs text-estado-ok-700 tabular-nums">IGV {soles(f.igv_monto)}</p>
      )}
    </div>
  );
};

const Estado: React.FC<{ f: FichaCompraResumenDTO }> = ({ f }) =>
  f.estado === 'ANULADA' ? (
    <div className="space-y-0.5">
      <EstadoBadge tono="error">Anulada</EstadoBadge>
      {f.motivo_anulacion && (
        <p className="text-xs text-estado-error-700 line-clamp-1 max-w-[12rem]" title={f.motivo_anulacion}>
          {f.motivo_anulacion}
        </p>
      )}
    </div>
  ) : (
    <EstadoBadge tono="ok">Vigente</EstadoBadge>
  );

export const ComprasTable: React.FC<ComprasTableProps> = ({
  fichas,
  cargando,
  paginaActual,
  totalPaginas,
  totalRegistros,
  tamanoPagina,
  onCambiarPagina,
  onCambiarTamanoPagina,
  onVerDetalle,
  onSolicitarAnulacion,
  cabecera,
  onLimpiarFiltros,
}) => {
  const acciones = (f: FichaCompraResumenDTO, tamano: 'sm' | 'md') => (
    <div className="flex items-center justify-end gap-1">
      <IconButton size={tamano} icono={Eye} etiqueta={`Ver detalle de ${f.numero_comprobante}`} onClick={() => onVerDetalle(f.id)} />
      {f.estado !== 'ANULADA' && (
        <IconButton
          size={tamano}
          variant="danger"
          icono={Ban}
          etiqueta={`Anular ${f.numero_comprobante}`}
          onClick={() => onSolicitarAnulacion(f)}
        />
      )}
    </div>
  );

  const columnas: ColumnaTabla<FichaCompraResumenDTO>[] = [
    { id: 'comprobante', cabecera: 'Comprobante', celda: (f) => <Comprobante f={f} /> },
    { id: 'proveedor', cabecera: 'Proveedor', celda: (f) => <Proveedor f={f} /> },
    {
      id: 'fecha',
      cabecera: 'Emisión',
      celda: (f) => <span className="text-sm text-aurea-navy/80 whitespace-nowrap">{formatoFecha(f.fecha_emision)}</span>,
    },
    { id: 'pago', cabecera: 'Pago', celda: (f) => <TagPago metodo={f.metodo_pago} /> },
    { id: 'total', cabecera: 'Total', alinear: 'derecha', celda: (f) => <Total f={f} /> },
    { id: 'estado', cabecera: 'Estado', celda: (f) => <Estado f={f} /> },
    { id: 'acciones', cabecera: <span className="sr-only">Acciones</span>, alinear: 'derecha', celda: (f) => acciones(f, 'sm') },
  ];

  const tarjeta = (f: FichaCompraResumenDTO) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Comprobante f={f} />
        <Estado f={f} />
      </div>
      <Proveedor f={f} />
      <div className="flex flex-wrap items-center gap-2 text-sm text-aurea-navy/80">
        <TagPago metodo={f.metodo_pago} />
        <span>{formatoFecha(f.fecha_emision)}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <Total f={f} />
        {acciones(f, 'md')}
      </div>
    </div>
  );

  // Va en el cuerpo de la lista para que los filtros no se desmonten (ni pierdan el foco) al recargar
  const vacio = cargando ? (
    <div className="p-4 space-y-3" aria-busy="true" aria-label="Cargando compras">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  ) : fichas.length === 0 ? (
    <EstadoVacio
      icono={Search}
      titulo="No hay compras con estos filtros"
      descripcion="Prueba con otro estado, tipo de comprobante o rango de fechas."
      accion={
        onLimpiarFiltros && (
          <Button variant="outline" onClick={onLimpiarFiltros} leftIcon={<X className="w-4 h-4" aria-hidden="true" />}>
            Limpiar filtros
          </Button>
        )
      }
    />
  ) : undefined;

  return (
    <ListaResponsive
      etiqueta="Compras"
      filas={fichas}
      columnas={columnas}
      claveFila={(f) => f.id}
      claseFila={(f) => (f.estado === 'ANULADA' ? 'bg-estado-error-50/40' : undefined)}
      cabecera={cabecera}
      tarjeta={tarjeta}
      vacio={vacio}
      pie={
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          totalRegistros={totalRegistros}
          limite={tamanoPagina}
          onCambiarPagina={onCambiarPagina}
          onCambiarLimite={onCambiarTamanoPagina}
          unidad="compras"
          opcionesLimite={[10, 20, 50]}
        />
      }
    />
  );
};
