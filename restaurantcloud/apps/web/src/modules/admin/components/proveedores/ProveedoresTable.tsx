import React from 'react';
import { MessageCircle, Phone, User, History, Edit2, Trash2, RotateCcw, Package, Mail, MapPin, Search } from 'lucide-react';
import { ProveedorResumenDTO } from '@/types/admin';
import {
  EstadoBadge,
  EstadoVacio,
  IconButton,
  ListaResponsive,
  Paginacion,
  Skeleton,
  type ColumnaTabla,
} from '@/components/ui';
import { enlaceWhatsAppProveedor } from './whatsappProveedor';

interface ProveedoresTableProps {
  proveedores: ProveedorResumenDTO[];
  totalItems: number;
  paginaActual: number;
  limitePorPagina: number;
  totalPaginas: number;
  cargando: boolean;
  onCambiarPagina: (nuevaPagina: number) => void;
  onCambiarLimite: (nuevoLimite: number) => void;
  onAbrirHistorial: (proveedor: ProveedorResumenDTO) => void;
  onEditar: (proveedor: ProveedorResumenDTO) => void;
  onToggleEstado?: (proveedor: ProveedorResumenDTO) => void;
  onReactivar?: (proveedor: ProveedorResumenDTO) => void;
  onEliminar: (proveedor: ProveedorResumenDTO) => void;
  /** Filtros que van dentro de la tarjeta */
  cabecera?: React.ReactNode;
}

const formatearFechaCorta = (fechaIso?: string | null): string => {
  if (!fechaIso) return '-';
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const soles = (n: number, decimales = 0) =>
  `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: 2 })}`;

const Telefono: React.FC<{ p: ProveedorResumenDTO }> = ({ p }) => {
  if (!p.telefono) return <span className="text-xs text-aurea-navy/40">Sin teléfono</span>;
  const wsp = enlaceWhatsAppProveedor(p.nombre, p.telefono);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {wsp && (
        <a
          href={wsp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Escribir por WhatsApp a ${p.nombre}`}
          className="min-h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-estado-ok-50 hover:bg-estado-ok-100 text-estado-ok-700 border border-estado-ok-200 text-xs font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          WhatsApp
        </a>
      )}
      <a href={`tel:${p.telefono}`} className="inline-flex items-center gap-1 text-xs font-mono text-aurea-navy/70 hover:text-aurea-navy">
        <Phone className="w-3 h-3 text-aurea-copper" aria-hidden="true" />
        {p.telefono}
      </a>
    </div>
  );
};

const Insumos: React.FC<{ p: ProveedorResumenDTO }> = ({ p }) => {
  const lista = p.insumos_habituales ?? [];
  if (lista.length === 0) return <span className="text-xs text-aurea-navy/40">Sin insumos</span>;
  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[16rem]">
      {lista.slice(0, 3).map((ih) => (
        <span
          key={ih.insumo_id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-aurea-champagne bg-aurea-champagne/20 text-xs font-medium text-aurea-navy"
        >
          <Package className="w-3 h-3 text-aurea-copper" aria-hidden="true" />
          <span className="truncate max-w-[6rem]">{ih.nombre}</span>
        </span>
      ))}
      {lista.length > 3 && (
        <span
          className="px-2 py-0.5 rounded-lg bg-aurea-navy/5 text-xs font-bold text-aurea-navy/70"
          title={lista.slice(3).map((i) => i.nombre).join(', ')}
        >
          +{lista.length - 3}
        </span>
      )}
    </div>
  );
};

const UltimaCompra: React.FC<{ p: ProveedorResumenDTO }> = ({ p }) =>
  p.ultima_compra_fecha ? (
    <div className="whitespace-nowrap">
      <p className="text-sm font-semibold text-aurea-navy">
        {formatearFechaCorta(p.ultima_compra_fecha)}
        {p.ultima_compra_total ? <span className="text-estado-ok-700"> · {soles(p.ultima_compra_total)}</span> : null}
      </p>
      <p className="text-xs text-aurea-navy/60">
        {p.total_compras} compras · {soles(p.total_gastado)}
      </p>
    </div>
  ) : (
    <span className="text-xs text-aurea-navy/40">Sin compras</span>
  );

export const ProveedoresTable: React.FC<ProveedoresTableProps> = ({
  proveedores,
  totalItems,
  paginaActual,
  limitePorPagina,
  totalPaginas,
  cargando,
  onCambiarPagina,
  onCambiarLimite,
  onAbrirHistorial,
  onEditar,
  onToggleEstado,
  onReactivar,
  onEliminar,
  cabecera,
}) => {
  const acciones = (p: ProveedorResumenDTO, tamano: 'sm' | 'md') => (
    <div className="flex items-center justify-end gap-1">
      <IconButton size={tamano} icono={History} etiqueta={`Historial de compras de «${p.nombre}»`} onClick={() => onAbrirHistorial(p)} />
      <IconButton size={tamano} icono={Edit2} etiqueta={`Editar «${p.nombre}»`} onClick={() => onEditar(p)} />
      {p.activo ? (
        <IconButton
          size={tamano}
          variant="danger"
          icono={Trash2}
          etiqueta={p.total_compras > 0 ? `Desactivar «${p.nombre}»` : `Eliminar «${p.nombre}»`}
          onClick={() => onEliminar(p)}
        />
      ) : (
        <IconButton
          size={tamano}
          icono={RotateCcw}
          etiqueta={`Reactivar «${p.nombre}»`}
          onClick={() => (onReactivar ? onReactivar(p) : onToggleEstado?.(p))}
        />
      )}
    </div>
  );

  const nombreCelda = (p: ProveedorResumenDTO) => (
    <div className="min-w-0 max-w-xs">
      <p className="flex items-center gap-2 font-semibold text-aurea-navy">
        <span className="truncate">{p.nombre}</span>
        {p.total_compras >= 8 && <EstadoBadge tono="info">Frecuente</EstadoBadge>}
      </p>
      {p.contacto && (
        <p className="flex items-center gap-1 text-xs text-aurea-navy/70">
          <User className="w-3 h-3 text-aurea-copper shrink-0" aria-hidden="true" />
          <span className="truncate">{p.contacto}</span>
        </p>
      )}
      {p.email && (
        <p className="flex items-center gap-1 text-xs text-aurea-navy/60">
          <Mail className="w-3 h-3 text-aurea-copper shrink-0" aria-hidden="true" />
          <span className="truncate">{p.email}</span>
        </p>
      )}
      {p.direccion && (
        <p className="flex items-center gap-1 text-xs text-aurea-navy/50">
          <MapPin className="w-3 h-3 text-aurea-copper shrink-0" aria-hidden="true" />
          <span className="truncate">{p.direccion}</span>
        </p>
      )}
    </div>
  );

  const estado = (p: ProveedorResumenDTO) =>
    p.activo ? <EstadoBadge tono="ok">Activo</EstadoBadge> : <EstadoBadge tono="neutro">Inactivo</EstadoBadge>;

  const columnas: ColumnaTabla<ProveedorResumenDTO>[] = [
    { id: 'proveedor', cabecera: 'Proveedor', celda: nombreCelda },
    { id: 'telefono', cabecera: 'Contacto', celda: (p) => <Telefono p={p} /> },
    { id: 'insumos', cabecera: 'Insumos', celda: (p) => <Insumos p={p} /> },
    { id: 'compra', cabecera: 'Última compra', celda: (p) => <UltimaCompra p={p} /> },
    { id: 'estado', cabecera: 'Estado', alinear: 'centro', celda: estado },
    { id: 'acciones', cabecera: <span className="sr-only">Acciones</span>, alinear: 'derecha', celda: (p) => acciones(p, 'sm') },
  ];

  const tarjeta = (p: ProveedorResumenDTO) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        {nombreCelda(p)}
        {estado(p)}
      </div>
      <Telefono p={p} />
      <Insumos p={p} />
      <UltimaCompra p={p} />
      {acciones(p, 'md')}
    </div>
  );

  if (cargando || proveedores.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm overflow-hidden">
        {cabecera && <div className="p-3 sm:p-4 border-b border-aurea-champagne/40 bg-aurea-ivory/40">{cabecera}</div>}
        {cargando ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Cargando proveedores">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <EstadoVacio
            icono={Search}
            titulo="No se encontraron proveedores"
            descripcion="Prueba con otro estado o con otro término de búsqueda."
          />
        )}
      </div>
    );
  }

  return (
    <ListaResponsive
      etiqueta="Proveedores"
      filas={proveedores}
      columnas={columnas}
      claveFila={(p) => p.id}
      claseFila={(p) => (!p.activo ? 'bg-aurea-ivory/70' : undefined)}
      cabecera={cabecera}
      tarjeta={tarjeta}
      pie={
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          totalRegistros={totalItems}
          limite={limitePorPagina}
          onCambiarPagina={onCambiarPagina}
          onCambiarLimite={onCambiarLimite}
          unidad="proveedores"
          opcionesLimite={[10, 20, 50]}
        />
      }
    />
  );
};
