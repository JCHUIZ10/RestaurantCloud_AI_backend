import React from 'react';
import { cn } from '@/shared/utils';
import type { MesaConciliacionDTO, PisoConciliacionDTO } from '@/types/propietarioCambiarPlan';

interface MiniPlanoSeleccionProps {
  piso: PisoConciliacionDTO;
  /** El ambiente completo se conserva; si no, sus mesas no se pueden elegir */
  pisoConservado: boolean;
  mesasConservadas: Set<string>;
  /** La sede ya llegó a su cupo de mesas: solo se pueden quitar */
  cupoLleno: boolean;
  onAlternar: (mesa: MesaConciliacionDTO) => void;
}

const FORMA: Record<MesaConciliacionDTO['forma'], string> = {
  cuadrada: 'rounded-lg',
  redonda: 'rounded-full',
  rectangular: 'rounded-md',
};

/** Plano del ambiente con cada mesa en su posición real; tocar una mesa decide si se conserva. */
export const MiniPlanoSeleccion: React.FC<MiniPlanoSeleccionProps> = ({
  piso,
  pisoConservado,
  mesasConservadas,
  cupoLleno,
  onAlternar,
}) => (
  <div>
    <div
      className="overflow-auto rounded-xl border border-aurea-champagne/70 bg-aurea-ivory/50 p-3 max-h-[55vh]"
      role="group"
      aria-label={`Plano de ${piso.nombre}`}
    >
      <div
        className="grid gap-1.5 w-max mx-auto"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, piso.columnas)}, 3.5rem)`,
          gridTemplateRows: `repeat(${Math.max(1, piso.filas)}, 3.5rem)`,
        }}
      >
        {Array.from({ length: piso.columnas * piso.filas }, (_, i) => (
          <div
            key={`celda-${i}`}
            aria-hidden="true"
            className="rounded-lg border border-dashed border-aurea-navy/10"
            style={{ gridColumn: (i % piso.columnas) + 1, gridRow: Math.floor(i / piso.columnas) + 1 }}
          />
        ))}

        {piso.mesas.map((mesa) => {
          const conservada = mesasConservadas.has(mesa.id);
          const bloqueada = !pisoConservado || (!conservada && cupoLleno);
          return (
            <button
              key={mesa.id}
              type="button"
              disabled={bloqueada}
              aria-pressed={conservada}
              aria-label={`Mesa ${mesa.numero}, ${mesa.capacidad} asientos, ${conservada ? 'se conserva' : 'pasa a inactiva'}`}
              onClick={() => onAlternar(mesa)}
              className={cn(
                'flex flex-col items-center justify-center border text-xs transition-colors',
                FORMA[mesa.forma],
                conservada
                  ? 'bg-aurea-navy text-white border-aurea-navy shadow-sm'
                  : 'bg-white text-aurea-navy/50 border-dashed border-aurea-navy/30',
                bloqueada ? 'opacity-40 cursor-not-allowed' : 'hover:ring-2 hover:ring-aurea-copper cursor-pointer'
              )}
              style={{ gridColumn: mesa.posicion_x + 1, gridRow: mesa.posicion_y + 1 }}
            >
              <span className={cn('font-mono font-bold leading-none', !conservada && 'line-through')}>{mesa.numero}</span>
              <span className="text-[10px] leading-none mt-1 opacity-80">{mesa.capacidad} pers.</span>
            </button>
          );
        })}
      </div>
    </div>

    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-aurea-navy/70" aria-label="Leyenda">
      <li className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded bg-aurea-navy" aria-hidden="true" /> Se conserva
      </li>
      <li className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded border border-dashed border-aurea-navy/40 bg-white" aria-hidden="true" /> Pasa a inactiva
      </li>
    </ul>
  </div>
);
