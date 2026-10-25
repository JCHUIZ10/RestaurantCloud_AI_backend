import React from 'react';
import { PisoAdminDTO } from '@/types/admin';
import { Plus, Minus, Settings, Grid3x3 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/shared/utils';

interface PisosTabsProps {
  pisos: PisoAdminDTO[];
  pisoActivoId: string;
  onSeleccionarPiso: (pisoId: string) => void;
  onAbrirNuevoPiso: () => void;
  onAbrirEditarPiso?: (piso: PisoAdminDTO) => void;
  onModificarDimensiones: (deltaCol: number, deltaFila: number) => void;
  isUpdatingDimensions?: boolean;
  /** Bloquea crear ambientes cuando el plan llegó a su máximo */
  puedeCrearPiso?: boolean;
}

interface AjusteProps {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  ocupado: boolean;
  onCambiar: (delta: number) => void;
}

/** Contador segmentado: [ − | 5 columnas | + ] en un solo bloque. */
const Ajuste: React.FC<AjusteProps> = ({ rotulo, valor, min, max, ocupado, onCambiar }) => (
  <div className="flex items-center rounded-xl border border-aurea-champagne bg-white shadow-sm">
    <IconButton
      size="sm"
      icono={Minus}
      etiqueta={`Quitar ${rotulo.toLowerCase().replace(/s$/, '')}`}
      onClick={() => onCambiar(-1)}
      disabled={ocupado || valor <= min}
      className="rounded-r-none"
    />
    <span className="px-2 min-w-[5.5rem] text-center border-x border-aurea-champagne/70 leading-9">
      <span className="font-serif font-bold text-base text-aurea-navy tabular-nums">{valor}</span>{' '}
      <span className="text-xs text-aurea-navy/60">{rotulo.toLowerCase()}</span>
    </span>
    <IconButton
      size="sm"
      icono={Plus}
      etiqueta={`Añadir ${rotulo.toLowerCase().replace(/s$/, '')}`}
      onClick={() => onCambiar(1)}
      disabled={ocupado || valor >= max}
      className="rounded-l-none"
    />
  </div>
);

/** Barra superior de la tarjeta del plano: ambientes a la izquierda, tamaño de la cuadrícula a la derecha. */
export const PisosTabs: React.FC<PisosTabsProps> = ({
  pisos,
  pisoActivoId,
  onSeleccionarPiso,
  onAbrirNuevoPiso,
  onAbrirEditarPiso,
  onModificarDimensiones,
  isUpdatingDimensions = false,
  puedeCrearPiso = true,
}) => {
  const pisoActivo = pisos.find((p) => p.id === pisoActivoId);

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-4 sm:px-5 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          role="group"
          aria-label="Ambientes del local"
          className="flex items-center gap-1 p-1 rounded-2xl bg-aurea-champagne/25 border border-aurea-champagne/70 overflow-x-auto min-w-0"
        >
          {pisos.map((piso) => {
            const activo = piso.id === pisoActivoId;
            const mesasActivas = piso.mesas.filter((m) => m.estado !== 'inactiva').length;
            return (
              <button
                key={piso.id}
                type="button"
                aria-pressed={activo}
                onClick={() => onSeleccionarPiso(piso.id)}
                className={cn(
                  'min-h-tactil flex items-center gap-2 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors',
                  activo
                    ? 'bg-aurea-navy text-white shadow-md'
                    : 'text-aurea-navy/70 hover:bg-white hover:text-aurea-navy'
                )}
              >
                {piso.nombre}
                <span
                  className={cn(
                    'min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-xs font-bold tabular-nums',
                    activo ? 'bg-aurea-copper text-aurea-navy' : 'bg-white text-aurea-navy/70'
                  )}
                >
                  {mesasActivas}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pisoActivo && onAbrirEditarPiso && (
            <IconButton
              variant="outline"
              icono={Settings}
              etiqueta={`Configurar ambiente ${pisoActivo.nombre}`}
              onClick={() => onAbrirEditarPiso(pisoActivo)}
            />
          )}
          <button
            type="button"
            onClick={onAbrirNuevoPiso}
            disabled={!puedeCrearPiso}
            title={puedeCrearPiso ? 'Nuevo ambiente' : 'Tu plan no admite más ambientes'}
            className="min-h-tactil flex items-center gap-1.5 px-3.5 rounded-xl border border-dashed border-aurea-copper text-aurea-navy hover:bg-aurea-champagne/30 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
            <span className="hidden sm:inline">Ambiente</span>
            <span className="sr-only sm:hidden">Nuevo ambiente</span>
          </button>
        </div>
      </div>

      {pisoActivo && (
        <div
          role="group"
          aria-label="Tamaño de la cuadrícula"
          className="flex flex-wrap items-center gap-3"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-aurea-copper">
            <Grid3x3 className="w-4 h-4" aria-hidden="true" />
            Cuadrícula
          </span>
          <Ajuste
            rotulo="Columnas"
            valor={pisoActivo.columnas}
            min={1}
            max={12}
            ocupado={isUpdatingDimensions}
            onCambiar={(d) => onModificarDimensiones(d, 0)}
          />
          <Ajuste
            rotulo="Filas"
            valor={pisoActivo.filas}
            min={1}
            max={10}
            ocupado={isUpdatingDimensions}
            onCambiar={(d) => onModificarDimensiones(0, d)}
          />
        </div>
      )}
    </div>
  );
};
