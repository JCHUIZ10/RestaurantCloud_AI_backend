import React from 'react';
import { PisoAdminDTO, MesaAdminDTO } from '@/types/admin';
import { MesaAdminCard } from './MesaAdminCard';
import { Plus, Link2 } from 'lucide-react';

interface PlanoCuadriculaGridProps {
  piso: PisoAdminDTO;
  onEditarMesa: (mesa: MesaAdminDTO) => void;
  onAgregarMesaEnPosicion: (posX: number, posY: number) => void;
}

/** Cuerpo de la tarjeta del plano: la cuadrícula del ambiente y su simbología. */
export const PlanoCuadriculaGrid: React.FC<PlanoCuadriculaGridProps> = ({
  piso,
  onEditarMesa,
  onAgregarMesaEnPosicion,
}) => {
  const mapaMesas = new Map<string, MesaAdminDTO>();
  piso.mesas
    .filter((m) => m.estado !== 'inactiva')
    .forEach((m) => mapaMesas.set(`${m.posicion_x}-${m.posicion_y}`, m));

  const celdas = [];
  for (let f = 0; f < piso.filas; f++) {
    for (let c = 0; c < piso.columnas; c++) {
      celdas.push({ posX: c, posY: f, mesa: mapaMesas.get(`${c}-${f}`) });
    }
  }

  return (
    <>
      <div className="mx-3 sm:mx-5 p-3 sm:p-5 rounded-xl border border-aurea-champagne bg-aurea-ivory bg-[radial-gradient(#F4D7B0_1px,transparent_1px)] [background-size:18px_18px] shadow-inner overflow-auto max-h-[62dvh]">
        <div
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: `repeat(${piso.columnas}, minmax(120px, 1fr))` }}
        >
          {celdas.map(({ posX, posY, mesa }) =>
            mesa ? (
              <MesaAdminCard key={`${posX}-${posY}`} mesa={mesa} onEditarMesa={onEditarMesa} />
            ) : (
              <button
                key={`${posX}-${posY}`}
                type="button"
                onClick={() => onAgregarMesaEnPosicion(posX, posY)}
                aria-label={`Agregar mesa en columna ${posX + 1}, fila ${posY + 1}`}
                className="group min-h-[128px] rounded-2xl border-2 border-dashed border-aurea-copper/30 hover:border-aurea-copper hover:bg-white flex flex-col items-center justify-center gap-1.5 text-aurea-navy/40 hover:text-aurea-navy transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-white border border-aurea-copper/40 flex items-center justify-center text-aurea-copper shadow-sm group-hover:bg-aurea-navy group-hover:text-aurea-champagne group-hover:border-aurea-navy transition-colors">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold">Agregar</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 sm:px-6 pt-3 pb-4 text-xs text-aurea-navy/70">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md border-2 border-aurea-copper/60 bg-white" aria-hidden="true" />
          Cuadrada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-aurea-copper/60 bg-white" aria-hidden="true" />
          Redonda
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-3 rounded-sm border-2 border-aurea-copper/60 bg-white" aria-hidden="true" />
          Rectangular
        </span>
        <span className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
          Se puede unir
        </span>
        <span className="sm:ml-auto text-aurea-navy/50">Toca una mesa para editarla o una casilla vacía para agregar.</span>
      </div>
    </>
  );
};
