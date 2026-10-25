import React from 'react';
import { cn } from '@/shared/utils';

export interface ColumnaTabla<T> {
  id: string;
  cabecera: React.ReactNode;
  celda: (fila: T) => React.ReactNode;
  alinear?: 'izquierda' | 'centro' | 'derecha';
  className?: string;
}

const ALINEACION = { izquierda: 'text-left', centro: 'text-center', derecha: 'text-right' };

interface DataTableProps<T> {
  filas: T[];
  columnas: ColumnaTabla<T>[];
  claveFila: (fila: T) => string;
  /** Nombre accesible de la tabla */
  etiqueta: string;
  claseFila?: (fila: T) => string | undefined;
  className?: string;
}

/** Tabla de escritorio con cabecera marfil y filas separadas. */
export function DataTable<T>({ filas, columnas, claveFila, etiqueta, claseFila, className }: DataTableProps<T>) {
  return (
    <table aria-label={etiqueta} className={cn('w-full border-collapse text-sm', className)}>
      <thead>
        <tr className="border-b border-aurea-champagne/40 bg-aurea-champagne/20 text-xs font-bold uppercase tracking-wider text-aurea-navy/70">
          {columnas.map((col) => (
            <th
              key={col.id}
              scope="col"
              className={cn('py-3 px-4 first:pl-6 last:pr-6', ALINEACION[col.alinear ?? 'izquierda'], col.className)}
            >
              {col.cabecera}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-aurea-champagne/40 text-aurea-navy">
        {filas.map((fila) => (
          <tr key={claveFila(fila)} className={cn('transition-colors hover:bg-aurea-champagne/10', claseFila?.(fila))}>
            {columnas.map((col) => (
              <td
                key={col.id}
                className={cn('py-3 px-4 first:pl-6 last:pr-6 align-middle', ALINEACION[col.alinear ?? 'izquierda'], col.className)}
              >
                {col.celda(fila)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface ListaResponsiveProps<T> extends DataTableProps<T> {
  /** Tarjeta que sustituye a la fila por debajo de md */
  tarjeta: (fila: T) => React.ReactNode;
  /** Barra superior dentro de la tarjeta (filtros, búsqueda) */
  cabecera?: React.ReactNode;
  /** Pie común (paginación, totales) */
  pie?: React.ReactNode;
  /**
   * Sustituye a las filas (carga o sin resultados). La cabecera no se desmonta,
   * así un buscador conserva el foco aunque el filtro deje la lista vacía.
   */
  vacio?: React.ReactNode;
}

/**
 * Patrón dual de la regla RS3: tabla desde md y lista de tarjetas en móvil,
 * dentro de un mismo contenedor y sin scroll horizontal de página.
 */
export function ListaResponsive<T>({ tarjeta, cabecera, pie, vacio, className, ...tabla }: ListaResponsiveProps<T>) {
  return (
    <div className={cn('bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm overflow-hidden', className)}>
      {cabecera && <div className="p-3 sm:p-4 border-b border-aurea-champagne/40 bg-aurea-ivory/40">{cabecera}</div>}
      {vacio ?? (
        <>
          <div className="hidden md:block overflow-x-auto">
            <DataTable {...tabla} />
          </div>
          <ul aria-label={tabla.etiqueta} className="md:hidden divide-y divide-aurea-champagne/40">
            {tabla.filas.map((fila) => (
              <li key={tabla.claveFila(fila)} className={cn('p-4', tabla.claseFila?.(fila))}>
                {tarjeta(fila)}
              </li>
            ))}
          </ul>
        </>
      )}
      {pie && !vacio && <div className="border-t border-aurea-champagne/40">{pie}</div>}
    </div>
  );
}
