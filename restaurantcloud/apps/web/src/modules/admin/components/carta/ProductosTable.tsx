import React from 'react';
import {
  ChefHat,
  Zap,
  Boxes,
  Edit2,
  Archive,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Search,
} from 'lucide-react';
import { ProductoAdminDTO } from '@/types/admin';
import {
  EstadoBadge,
  EstadoVacio,
  IconButton,
  ListaResponsive,
  Paginacion,
  Skeleton,
  type ColumnaTabla,
} from '@/components/ui';
import { cn } from '@/shared/utils';
import { BARRA_MARGEN, tonoMargen } from './margen';

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
  /** Filtros que van dentro de la tarjeta */
  cabecera?: React.ReactNode;
}

const Inicial: React.FC<{ nombre: string }> = ({ nombre }) => (
  <span
    className="w-10 h-10 rounded-xl bg-aurea-champagne/30 border border-aurea-champagne flex items-center justify-center text-aurea-copper font-serif font-bold shrink-0"
    aria-hidden="true"
  >
    {nombre.charAt(0)}
  </span>
);

const TagCategoria: React.FC<{ nombre: string }> = ({ nombre }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-aurea-champagne bg-aurea-champagne/20 text-xs font-medium text-aurea-navy whitespace-nowrap">
    {nombre}
  </span>
);

const TagDestino: React.FC<{ cocina: boolean }> = ({ cocina }) =>
  cocina ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-aurea-copper/40 bg-aurea-champagne/30 text-xs font-medium text-aurea-navy whitespace-nowrap">
      <ChefHat className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
      Cocina
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-aurea-navy/20 bg-white text-xs font-medium text-aurea-navy whitespace-nowrap">
      <Zap className="w-3.5 h-3.5 text-aurea-navy/70" aria-hidden="true" />
      Directo
    </span>
  );

const Margen: React.FC<{ pct: number }> = ({ pct }) => {
  const tono = tonoMargen(pct);
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <EstadoBadge tono={tono}>{pct}%</EstadoBadge>
      <span className="w-14 h-1.5 rounded-full bg-aurea-champagne/30 overflow-hidden" aria-hidden="true">
        <span
          className={cn('block h-full rounded-full', BARRA_MARGEN[tono])}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </span>
    </span>
  );
};

const Disponibilidad: React.FC<{ prod: ProductoAdminDTO }> = ({ prod }) =>
  prod.disponibilidad === 'disponible' ? (
    <EstadoBadge tono="ok">Disponible</EstadoBadge>
  ) : (
    <EstadoBadge tono="error">Agotado</EstadoBadge>
  );

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
  cabecera,
}) => {
  const acciones = (prod: ProductoAdminDTO, tamano: 'sm' | 'md') => {
    const disponible = prod.disponibilidad === 'disponible';
    return (
      <div className="flex items-center justify-end gap-1">
        {mostrarDatosReceta && (
          <IconButton
            size={tamano}
            icono={Boxes}
            etiqueta={`Capacidad e insumos de «${prod.nombre}»`}
            onClick={() => onVerReceta(prod)}
          />
        )}
        <IconButton
          size={tamano}
          icono={disponible ? PackageX : PackageCheck}
          etiqueta={disponible ? `Marcar «${prod.nombre}» como agotado` : `Marcar «${prod.nombre}» como disponible`}
          onClick={() => onConmutarDisponibilidad(prod)}
        />
        <IconButton size={tamano} icono={Edit2} etiqueta={`Editar «${prod.nombre}»`} onClick={() => onEditarProducto(prod)} />
        <IconButton
          size={tamano}
          variant="danger"
          icono={Archive}
          etiqueta={`Archivar «${prod.nombre}»`}
          onClick={() => onArchivarProducto(prod)}
        />
      </div>
    );
  };

  const nombreCelda = (prod: ProductoAdminDTO) => (
    <div className="flex items-start gap-3 min-w-0 max-w-xs">
      <Inicial nombre={prod.nombre} />
      <div className="min-w-0">
        <p className="font-semibold text-aurea-navy truncate">{prod.nombre}</p>
        {prod.descripcion && (
          <p className="text-xs text-aurea-navy/60 truncate" title={prod.descripcion}>
            {prod.descripcion}
          </p>
        )}
        {prod.insumos_en_quiebre > 0 && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-estado-error-700">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            {prod.insumos_en_quiebre} insumo{prod.insumos_en_quiebre === 1 ? '' : 's'} sin stock
          </p>
        )}
      </div>
    </div>
  );

  const columnas: ColumnaTabla<ProductoAdminDTO>[] = [
    { id: 'plato', cabecera: 'Plato', celda: nombreCelda },
    { id: 'categoria', cabecera: 'Categoría', celda: (p) => <TagCategoria nombre={p.categoria_nombre} /> },
    { id: 'destino', cabecera: 'Destino', alinear: 'centro', celda: (p) => <TagDestino cocina={p.requiere_preparacion} /> },
    {
      id: 'precio',
      cabecera: 'Precio',
      alinear: 'derecha',
      celda: (p) => <span className="font-serif font-bold tabular-nums whitespace-nowrap">S/ {p.precio.toFixed(2)}</span>,
    },
    ...(mostrarDatosReceta
      ? [
          {
            id: 'costo',
            cabecera: 'Costo',
            alinear: 'derecha' as const,
            celda: (p: ProductoAdminDTO) => (
              <span className="whitespace-nowrap">
                <span className="block tabular-nums">S/ {p.costo_teorico.toFixed(2)}</span>
                <span className="text-xs text-aurea-navy/60">
                  {p.total_ingredientes} insumo{p.total_ingredientes === 1 ? '' : 's'}
                </span>
              </span>
            ),
          },
          {
            id: 'margen',
            cabecera: 'Margen',
            alinear: 'centro' as const,
            celda: (p: ProductoAdminDTO) => <Margen pct={p.margen_bruto_pct} />,
          },
        ]
      : []),
    { id: 'estado', cabecera: 'Estado', alinear: 'centro', celda: (p) => <Disponibilidad prod={p} /> },
    { id: 'acciones', cabecera: <span className="sr-only">Acciones</span>, alinear: 'derecha', celda: (p) => acciones(p, 'sm') },
  ];

  const tarjeta = (prod: ProductoAdminDTO) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        {nombreCelda(prod)}
        <span className="font-serif font-bold text-lg tabular-nums whitespace-nowrap">S/ {prod.precio.toFixed(2)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TagCategoria nombre={prod.categoria_nombre} />
        <TagDestino cocina={prod.requiere_preparacion} />
        <Disponibilidad prod={prod} />
        {mostrarDatosReceta && <EstadoBadge tono={tonoMargen(prod.margen_bruto_pct)}>Margen {prod.margen_bruto_pct}%</EstadoBadge>}
      </div>
      {acciones(prod, 'md')}
    </div>
  );

  const pie = (
    <Paginacion
      pagina={paginaActual}
      totalPaginas={totalPaginas}
      totalRegistros={totalRegistros}
      limite={limitePorPagina}
      onCambiarPagina={onCambiarPagina}
      onCambiarLimite={onCambiarLimite}
      unidad="platos"
      opcionesLimite={[10, 20, 50]}
    />
  );

  if (cargando || productos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm overflow-hidden">
        {cabecera && <div className="p-3 sm:p-4 border-b border-aurea-champagne/40 bg-aurea-ivory/40">{cabecera}</div>}
        {cargando ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Cargando productos">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono={Search}
            titulo="No se encontraron productos"
            descripcion="Prueba con otra categoría, otro estado o un término de búsqueda distinto."
          />
        )}
      </div>
    );
  }

  return (
    <ListaResponsive
      etiqueta="Productos de la carta"
      filas={productos}
      columnas={columnas}
      claveFila={(p) => p.id}
      claseFila={(p) => (p.disponibilidad !== 'disponible' ? 'bg-estado-error-50/40' : undefined)}
      cabecera={cabecera}
      tarjeta={tarjeta}
      pie={pie}
    />
  );
};
