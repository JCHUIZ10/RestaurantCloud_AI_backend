import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
  onCambiarPagina: (pagina: number) => void;
  onCambiarLimite: (limite: number) => void;
  /** Sustantivo de los registros (ej. «platos») */
  unidad?: string;
  opcionesLimite?: number[];
}

/** Pie de tabla: rango visible, tamaño de página y navegación anterior/siguiente. */
export const Paginacion: React.FC<PaginacionProps> = ({
  pagina,
  totalPaginas,
  totalRegistros,
  limite,
  onCambiarPagina,
  onCambiarLimite,
  unidad,
  opcionesLimite = [5, 10, 20, 50],
}) => {
  const inicio = totalRegistros > 0 ? (pagina - 1) * limite + 1 : 0;
  const fin = Math.min(pagina * limite, totalRegistros);

  return (
    <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-aurea-navy/70">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="tabular-nums">
          {inicio}–{fin} de {totalRegistros}
          {unidad ? ` ${unidad}` : ''}
        </span>
        <label className="flex items-center gap-1.5">
          <span>Mostrar</span>
          <select
            value={limite}
            onChange={(e) => onCambiarLimite(Number(e.target.value))}
            className="min-h-9 px-2 rounded-lg border border-aurea-champagne bg-white text-aurea-navy text-sm"
          >
            {opcionesLimite.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          etiqueta="Página anterior"
          icono={ChevronLeft}
          variant="outline"
          onClick={() => onCambiarPagina(pagina - 1)}
          disabled={pagina <= 1}
        />
        <span className="px-3 tabular-nums">
          Página <strong className="text-aurea-navy">{pagina}</strong> de {Math.max(1, totalPaginas)}
        </span>
        <IconButton
          etiqueta="Página siguiente"
          icono={ChevronRight}
          variant="outline"
          onClick={() => onCambiarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
        />
      </div>
    </div>
  );
};
