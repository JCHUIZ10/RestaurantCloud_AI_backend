import React from 'react';
import { Scale, Edit2, Archive, RotateCcw, AlertTriangle, UtensilsCrossed, ChevronDown, Search } from 'lucide-react';
import { InsumoAdminDTO, NivelSemaforoStock, UnidadInsumo, EstadoInsumo } from '@/types/admin';
import {
  Button,
  EstadoBadge,
  EstadoVacio,
  IconButton,
  ListaResponsive,
  Paginacion,
  Skeleton,
  type ColumnaTabla,
  type TonoEstado,
} from '@/components/ui';
import { cn } from '@/shared/utils';

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
  /** Filtros que van dentro de la tarjeta */
  cabecera?: React.ReactNode;
}

const UNIDADES: Record<UnidadInsumo, { label: string; esBase: boolean }> = {
  kg: { label: 'kg · Kilo', esBase: true },
  L: { label: 'L · Litro', esBase: true },
  und: { label: 'und · Unidad', esBase: true },
  saco: { label: 'Saco', esBase: false },
  botella: { label: 'Botella', esBase: false },
  lata: { label: 'Lata', esBase: false },
  caja: { label: 'Caja', esBase: false },
  paquete: { label: 'Paquete', esBase: false },
  bidon: { label: 'Bidón', esBase: false },
  jaba: { label: 'Jaba', esBase: false },
};

const SEMAFORO: Record<NivelSemaforoStock, { label: string; tono: TonoEstado; barra: string }> = {
  optimo: { label: 'Óptimo', tono: 'ok', barra: 'bg-estado-ok-500' },
  reposicion: { label: 'Reponer', tono: 'alerta', barra: 'bg-estado-alerta-500' },
  critico: { label: 'Crítico', tono: 'error', barra: 'bg-estado-error-500' },
  agotado: { label: 'Sin stock', tono: 'neutro', barra: 'bg-tinta-400' },
};

const ESTADO: Record<EstadoInsumo, { label: string; tono: TonoEstado }> = {
  activo: { label: 'Activo', tono: 'ok' },
  agotado: { label: 'Agotado', tono: 'error' },
  inactivo: { label: 'Inactivo', tono: 'neutro' },
};

const TagUnidad: React.FC<{ unidad: UnidadInsumo }> = ({ unidad }) => {
  const info = UNIDADES[unidad] ?? { label: unidad, esBase: false };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap',
        info.esBase
          ? 'bg-aurea-navy/5 text-aurea-navy border-aurea-navy/20'
          : 'bg-aurea-champagne/30 text-aurea-navy border-aurea-copper/40'
      )}
    >
      {info.label}
    </span>
  );
};

const Existencias: React.FC<{ ins: InsumoAdminDTO }> = ({ ins }) => {
  const sem = SEMAFORO[ins.nivel_semaforo];
  // La barra llena equivale al doble del mínimo
  const maxGrafico = Math.max(ins.stock_minimo * 2, ins.stock_actual, 1);
  const porcentaje = Math.min(100, Math.round((ins.stock_actual / maxGrafico) * 100));
  return (
    <div className="min-w-[11rem] space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-aurea-navy">
          {ins.stock_actual.toFixed(3)} <span className="font-sans font-normal text-aurea-navy/60">{ins.unidad_medida}</span>
        </span>
        <EstadoBadge tono={sem.tono}>{sem.label}</EstadoBadge>
      </div>
      <div className="h-1.5 rounded-full bg-aurea-champagne/30 overflow-hidden" aria-hidden="true">
        <div className={cn('h-full rounded-full transition-all', sem.barra)} style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-xs text-aurea-navy/60">
        Mín. {ins.stock_minimo.toFixed(3)} {ins.unidad_medida}
      </p>
    </div>
  );
};

/** Platos que usan el insumo; se despliega en la propia fila para no quedar recortado por el scroll de la tabla. */
const Recetas: React.FC<{ ins: InsumoAdminDTO }> = ({ ins }) => {
  if (ins.platos_afectados_si_quiebra === 0) {
    return <span className="text-xs text-aurea-navy/40">Sin recetas</span>;
  }
  const n = ins.platos_afectados_si_quiebra;
  return (
    <div className="space-y-1">
      <details className="group">
        <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-1.5 min-h-9 text-sm font-medium text-aurea-navy hover:text-aurea-copper">
          <UtensilsCrossed className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
          {n} {n === 1 ? 'plato' : 'platos'}
          <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="mt-1 pl-1 space-y-0.5 text-xs text-aurea-navy/80">
          {ins.platos_detalle.map((plato, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-aurea-copper" aria-hidden="true" />
              {plato}
            </li>
          ))}
        </ul>
      </details>
      {ins.estado === 'agotado' && (
        <EstadoBadge tono="error" icono={AlertTriangle}>
          Platos pausados
        </EstadoBadge>
      )}
    </div>
  );
};

export const InsumosTable: React.FC<InsumosTableProps> = ({
  insumos,
  cargando,
  paginacion,
  onCambiarPagina,
  onCambiarLimite,
  onAbrirAjusteStock,
  onAbrirEditarInsumo,
  onConmutarEstado,
  cabecera,
}) => {
  const acciones = (ins: InsumoAdminDTO, tamano: 'sm' | 'md') => (
    <div className="flex items-center justify-end gap-1">
      <Button
        size={tamano}
        onClick={() => onAbrirAjusteStock(ins)}
        leftIcon={<Scale className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
        className={tamano === 'md' ? 'flex-1' : undefined}
      >
        Ajustar stock
      </Button>
      <IconButton size={tamano} icono={Edit2} etiqueta={`Editar «${ins.nombre}»`} onClick={() => onAbrirEditarInsumo(ins)} />
      {ins.estado !== 'inactivo' ? (
        <IconButton
          size={tamano}
          variant="danger"
          icono={Archive}
          etiqueta={`Archivar «${ins.nombre}»`}
          onClick={() => onConmutarEstado(ins, 'inactivo')}
        />
      ) : (
        <IconButton
          size={tamano}
          icono={RotateCcw}
          etiqueta={`Reactivar «${ins.nombre}»`}
          onClick={() => onConmutarEstado(ins, 'activo')}
        />
      )}
    </div>
  );

  const nombreCelda = (ins: InsumoAdminDTO) => (
    <div className="min-w-0">
      <p className="font-semibold text-aurea-navy truncate">{ins.nombre}</p>
      <p className="text-xs text-aurea-navy/60 truncate">{ins.ultimo_proveedor_nombre || 'Sin compras registradas'}</p>
    </div>
  );

  const estadoCelda = (ins: InsumoAdminDTO) => {
    const e = ESTADO[ins.estado];
    return <EstadoBadge tono={e.tono}>{e.label}</EstadoBadge>;
  };

  const columnas: ColumnaTabla<InsumoAdminDTO>[] = [
    { id: 'insumo', cabecera: 'Insumo', celda: nombreCelda },
    { id: 'unidad', cabecera: 'Unidad', celda: (i) => <TagUnidad unidad={i.unidad_medida} /> },
    { id: 'stock', cabecera: 'Existencias', celda: (i) => <Existencias ins={i} /> },
    {
      id: 'costo',
      cabecera: 'Costo',
      alinear: 'derecha',
      celda: (i) => <span className="font-mono font-medium whitespace-nowrap">S/ {i.costo_unitario.toFixed(2)}</span>,
    },
    { id: 'estado', cabecera: 'Estado', celda: estadoCelda },
    { id: 'recetas', cabecera: 'Recetas', celda: (i) => <Recetas ins={i} /> },
    { id: 'acciones', cabecera: <span className="sr-only">Acciones</span>, alinear: 'derecha', celda: (i) => acciones(i, 'sm') },
  ];

  const tarjeta = (ins: InsumoAdminDTO) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        {nombreCelda(ins)}
        {estadoCelda(ins)}
      </div>
      <Existencias ins={ins} />
      <div className="flex flex-wrap items-center gap-2">
        <TagUnidad unidad={ins.unidad_medida} />
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-aurea-champagne bg-white text-xs font-mono text-aurea-navy">
          S/ {ins.costo_unitario.toFixed(2)}
        </span>
      </div>
      <Recetas ins={ins} />
      {acciones(ins, 'md')}
    </div>
  );

  const pie =
    paginacion && paginacion.total > 0 && onCambiarPagina && onCambiarLimite ? (
      <Paginacion
        pagina={paginacion.pagina}
        totalPaginas={paginacion.total_paginas}
        totalRegistros={paginacion.total}
        limite={paginacion.limite}
        onCambiarPagina={onCambiarPagina}
        onCambiarLimite={onCambiarLimite}
        unidad="insumos"
        opcionesLimite={[10, 20, 50]}
      />
    ) : undefined;

  if (cargando || insumos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm overflow-hidden">
        {cabecera && <div className="p-3 sm:p-4 border-b border-aurea-champagne/40 bg-aurea-ivory/40">{cabecera}</div>}
        {cargando ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Cargando insumos">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono={Search}
            titulo="No se encontraron insumos"
            descripcion="Prueba con otro estado (por ejemplo «Todos») o con otro término de búsqueda."
          />
        )}
      </div>
    );
  }

  return (
    <ListaResponsive
      etiqueta="Insumos de bodega"
      filas={insumos}
      columnas={columnas}
      claveFila={(i) => i.id}
      claseFila={(i) => (i.estado === 'agotado' ? 'bg-estado-error-50/40' : i.estado === 'inactivo' ? 'bg-aurea-ivory/70' : undefined)}
      cabecera={cabecera}
      tarjeta={tarjeta}
      pie={pie}
    />
  );
};
