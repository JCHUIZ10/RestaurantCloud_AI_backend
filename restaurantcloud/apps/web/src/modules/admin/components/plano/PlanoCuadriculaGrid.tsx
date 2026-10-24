import React from 'react';
import { PisoAdminDTO, MesaAdminDTO } from '@/types/admin';
import { MesaAdminCard } from './MesaAdminCard';
import { Plus } from 'lucide-react';

interface PlanoCuadriculaGridProps {
  piso: PisoAdminDTO;
  onEditarMesa: (mesa: MesaAdminDTO) => void;
  onAgregarMesaEnPosicion: (posX: number, posY: number) => void;
}

export const PlanoCuadriculaGrid: React.FC<PlanoCuadriculaGridProps> = ({
  piso,
  onEditarMesa,
  onAgregarMesaEnPosicion,
}) => {
  const columnas = piso.columnas;
  const filas = piso.filas;

  // Mapa de mesas activas por clave "x-y"
  const mapaMesas = new Map<string, MesaAdminDTO>();
  piso.mesas
    .filter((m) => m.estado !== 'inactiva')
    .forEach((m) => {
      mapaMesas.set(`${m.posicion_x}-${m.posicion_y}`, m);
    });

  // Generar cuadrícula completa
  const celdas = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const mesa = mapaMesas.get(`${c}-${f}`);
      celdas.push({
        posX: c,
        posY: f,
        mesa,
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Contenedor del Salón con Cuadrícula Dinámica */}
      <div className="p-4 sm:p-6 rounded-3xl bg-aurea-ivory/80 border-2 border-aurea-copper/25 shadow-inner">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-aurea-copper/20">
          <div>
            <h2 className="font-serif text-lg font-bold text-aurea-navy uppercase tracking-wide">
              {piso.nombre} — {piso.total_mesas} Mesas Configurada(s)
            </h2>
            <span className="text-xs text-aurea-navy/60">
              Distribución visual del ambiente ({columnas} columnas × {filas} filas). Haz clic en una
              mesa para editar o en un casillero vacío para agregar.
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-aurea-navy/70">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Libre</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-2" />
            <span>Ocupada</span>
          </div>
        </div>

        {/* Grilla CSS adaptativa por número de columnas */}
        <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-3 sm:gap-4.5"
          style={{
            gridTemplateColumns: `repeat(${columnas}, minmax(130px, 1fr))`,
          }}
        >
          {celdas.map(({ posX, posY, mesa }) => {
            const key = `cell-${posX}-${posY}`;
            if (mesa) {
              return (
                <MesaAdminCard
                  key={key}
                  mesa={mesa}
                  onEditarMesa={onEditarMesa}
                />
              );
            }

            // Celda vacía interactuable (Slot libre)
            return (
              <button
                key={key}
                type="button"
                onClick={() => onAgregarMesaEnPosicion(posX, posY)}
                className="group min-h-[140px] rounded-2xl border-2 border-dashed border-aurea-copper/30 bg-white/40 hover:bg-aurea-champagne/20 hover:border-aurea-copper flex flex-col items-center justify-center p-3 text-aurea-navy/40 hover:text-aurea-navy transition-all duration-200"
                title={`Agregar mesa en Columna ${posX + 1}, Fila ${posY + 1}`}
              >
                <div className="w-8 h-8 rounded-full bg-white border border-aurea-copper/30 flex items-center justify-center text-aurea-copper group-hover:bg-aurea-navy group-hover:text-white transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold mt-2 group-hover:font-bold">
                  + Casilla
                </span>
                <span className="text-[10px] text-aurea-navy/40 font-mono mt-0.5">
                  ({posX},{posY})
                </span>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Simbología y Leyenda Canónica */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-aurea-copper/20 text-xs text-aurea-navy/70">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-aurea-navy">Simbología:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md border border-aurea-copper/60 bg-aurea-champagne/30 inline-block" />
            <span>Cuadrada</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border border-aurea-copper/60 bg-aurea-champagne/30 inline-block" />
            <span>Redonda</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-3 rounded-md border border-aurea-copper/60 bg-aurea-champagne/30 inline-block" />
            <span>Rectangular</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-bold text-aurea-copper">🔗</span>
            <span>Permite unión</span>
          </span>
        </div>

        <div className="text-[11px] text-aurea-navy/50 font-mono">
          Coordenadas: (columna, fila) base 0
        </div>
      </div>
    </div>
  );
};
