import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { CategoriaAdminDTO } from '@/types/admin';
import { Button, EstadoBadge, EstadoVacio, IconButton, ListaResponsive, Paginacion, type ColumnaTabla } from '@/components/ui';
import { cn } from '@/shared/utils';

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
  /** Filtros y búsqueda que se muestran dentro de la tarjeta de la tabla */
  cabecera?: React.ReactNode;
  paginaActual?: number;
  totalPaginas?: number;
  totalRegistros?: number;
  limitePorPagina?: number;
  onCambiarPagina?: (pagina: number) => void;
  onCambiarLimite?: (limite: number) => void;
}

/** Etiqueta de conteo con el estilo de las unidades de Insumos */
const TagPlatos: React.FC<{ cat: CategoriaAdminDTO }> = ({ cat }) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border tabular-nums',
        cat.total_productos > 0
          ? 'bg-aurea-champagne/30 text-aurea-navy border-aurea-champagne'
          : 'bg-tinta-50 text-tinta-500 border-tinta-200'
      )}
    >
      <UtensilsCrossed className="w-3 h-3 text-aurea-copper" aria-hidden="true" />
      {cat.total_productos > 0 ? `${cat.total_productos} plato${cat.total_productos > 1 ? 's' : ''}` : 'Sin platos'}
    </span>
    {cat.productos_agotados > 0 && (
      <EstadoBadge tono="error">
        {cat.productos_agotados} agotado{cat.productos_agotados > 1 ? 's' : ''}
      </EstadoBadge>
    )}
  </span>
);

const TagEstado: React.FC<{ activa: boolean }> = ({ activa }) => (
  <EstadoBadge tono={activa ? 'ok' : 'neutro'}>{activa ? 'Visible' : 'Oculta'}</EstadoBadge>
);

/** Muestra u oculta la categoría en salón y comanda */
const BotonVisibilidad: React.FC<{
  cat: CategoriaAdminDTO;
  onConmutar: (categoriaId: string, activa: boolean) => void;
}> = ({ cat, onConmutar }) => (
  <IconButton
    etiqueta={cat.activa ? `Ocultar «${cat.nombre}» en salón` : `Mostrar «${cat.nombre}» en salón`}
    icono={cat.activa ? EyeOff : Eye}
    onClick={() => onConmutar(cat.id, !cat.activa)}
  />
);

/** Posición en la comanda */
const NumeroOrden: React.FC<{ orden: number }> = ({ orden }) => (
  <span className="w-8 h-8 rounded-lg bg-aurea-champagne/30 border border-aurea-champagne text-aurea-navy font-serif font-bold text-sm tabular-nums flex items-center justify-center shrink-0">
    {orden}
  </span>
);

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
  cabecera,
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
      <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm overflow-hidden">
        {cabecera && <div className="p-3 sm:p-4 border-b border-aurea-champagne/40 bg-aurea-ivory/40">{cabecera}</div>}
        <EstadoVacio
          icono={Search}
          titulo="No se encontraron categorías"
          descripcion="Ninguna categoría coincide con el filtro o la búsqueda."
          accion={
            onLimpiarBusqueda && (
              <Button variant="secondary" onClick={onLimpiarBusqueda}>
                Limpiar filtros
              </Button>
            )
          }
        />
      </div>
    );
  }

  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const categoriasPaginadas =
    paginaProp !== undefined && categorias.length <= limitePorPagina
      ? categorias
      : categorias.slice(indiceInicio, indiceInicio + limitePorPagina);

  // Posición en la lista completa: decide si se puede subir o bajar
  const limitesOrden = (cat: CategoriaAdminDTO) => {
    const indice = todasCategoriasOrdenadas.findIndex((c) => c.id === cat.id);
    return {
      puedeSubir: indice > 0 && !filtroActivo,
      puedeBajar: indice >= 0 && indice < todasCategoriasOrdenadas.length - 1 && !filtroActivo,
    };
  };
  const ayudaOrden = filtroActivo ? 'Limpia el filtro para reordenar' : undefined;

  const columnas: ColumnaTabla<CategoriaAdminDTO>[] = [
    {
      id: 'orden',
      cabecera: 'Orden',
      className: 'w-40',
      celda: (cat) => {
        const { puedeSubir, puedeBajar } = limitesOrden(cat);
        return (
          <div className="flex items-center gap-1.5">
            <NumeroOrden orden={cat.orden} />
            <IconButton
              etiqueta={`Subir «${cat.nombre}»`}
              title={ayudaOrden}
              icono={ChevronUp}
              size="sm"
              onClick={() => onSubirOrden(cat.id)}
              disabled={!puedeSubir}
            />
            <IconButton
              etiqueta={`Bajar «${cat.nombre}»`}
              title={ayudaOrden}
              icono={ChevronDown}
              size="sm"
              onClick={() => onBajarOrden(cat.id)}
              disabled={!puedeBajar}
            />
          </div>
        );
      },
    },
    {
      id: 'nombre',
      cabecera: 'Categoría',
      celda: (cat) => (
        <span className={cn('font-semibold', cat.activa ? 'text-aurea-navy' : 'text-aurea-navy/60')}>{cat.nombre}</span>
      ),
    },
    { id: 'platos', cabecera: 'Platos', celda: (cat) => <TagPlatos cat={cat} /> },
    { id: 'estado', cabecera: 'Estado', celda: (cat) => <TagEstado activa={cat.activa} /> },
    {
      id: 'acciones',
      cabecera: <span className="sr-only">Acciones</span>,
      alinear: 'derecha',
      celda: (cat) => (
        <div className="flex items-center justify-end gap-1">
          <BotonVisibilidad cat={cat} onConmutar={onConmutarVisibilidad} />
          <IconButton etiqueta={`Editar «${cat.nombre}»`} icono={Pencil} onClick={() => onEditar(cat)} />
          <IconButton etiqueta={`Eliminar «${cat.nombre}»`} icono={Trash2} variant="danger" onClick={() => onEliminar(cat)} />
        </div>
      ),
    },
  ];

  const tarjeta = (cat: CategoriaAdminDTO) => {
    const { puedeSubir, puedeBajar } = limitesOrden(cat);
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <NumeroOrden orden={cat.orden} />
            <div className="min-w-0 space-y-1.5">
              <p className={cn('text-base font-semibold leading-tight', cat.activa ? 'text-aurea-navy' : 'text-aurea-navy/60')}>
                {cat.nombre}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <TagEstado activa={cat.activa} />
                <TagPlatos cat={cat} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center -ml-2">
            <BotonVisibilidad cat={cat} onConmutar={onConmutarVisibilidad} />
            <IconButton etiqueta={`Editar «${cat.nombre}»`} icono={Pencil} onClick={() => onEditar(cat)} />
            <IconButton etiqueta={`Eliminar «${cat.nombre}»`} icono={Trash2} variant="danger" onClick={() => onEliminar(cat)} />
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              etiqueta={`Subir «${cat.nombre}»`}
              title={ayudaOrden}
              icono={ChevronUp}
              variant="outline"
              onClick={() => onSubirOrden(cat.id)}
              disabled={!puedeSubir}
            />
            <IconButton
              etiqueta={`Bajar «${cat.nombre}»`}
              title={ayudaOrden}
              icono={ChevronDown}
              variant="outline"
              onClick={() => onBajarOrden(cat.id)}
              disabled={!puedeBajar}
            />
          </div>
        </div>
      </div>
    );
  };

  const pie = (
    <Paginacion
      pagina={paginaActual}
      totalPaginas={totalPaginas}
      totalRegistros={totalRegistros}
      limite={limitePorPagina}
      onCambiarPagina={handleCambiarPagina}
      onCambiarLimite={handleCambiarLimite}
    />
  );

  return (
    <ListaResponsive
      etiqueta="Categorías de la carta"
      filas={categoriasPaginadas}
      columnas={columnas}
      claveFila={(cat) => cat.id}
      claseFila={(cat) => (!cat.activa ? 'bg-aurea-ivory/70' : undefined)}
      cabecera={cabecera}
      tarjeta={tarjeta}
      pie={pie}
    />
  );
};

export default CategoriasTable;
