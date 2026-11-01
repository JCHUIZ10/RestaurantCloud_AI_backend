import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PisoAdminDTO, MesaAdminDTO } from '@/types/admin';
import { MesaAdminCard } from './MesaAdminCard';
import { Plus, Minus, Link2, Scan, Maximize } from 'lucide-react';

const ANCHO_MIN_CELDA = 120;
const ESCALA_MIN = 0.3;
const ESCALA_PASO = 0.15;

const redondear = (n: number) => Math.round(n * 100) / 100;

interface PlanoCuadriculaGridProps {
  piso: PisoAdminDTO;
  onEditarMesa: (mesa: MesaAdminDTO) => void;
  onAgregarMesaEnPosicion: (posX: number, posY: number) => void;
}

interface Medidas {
  disponibleAncho: number;
  naturalAncho: number;
  naturalAlto: number;
  ajuste: number;
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

  // Vista reducida: la grilla se maqueta siempre igual que al 100% y solo se escala con transform,
  // así las proporciones no cambian. El envoltorio toma el tamaño escalado para que el scroll sea real.
  const visorRef = useRef<HTMLDivElement>(null);
  const grillaRef = useRef<HTMLDivElement>(null);
  const [medidas, setMedidas] = useState<Medidas | null>(null);
  const [escala, setEscala] = useState(1);

  const medir = useCallback(() => {
    const visor = visorRef.current;
    const grilla = grillaRef.current;
    if (!visor || !grilla) return;
    const estiloVisor = getComputedStyle(visor);
    const disponibleAncho =
      visor.clientWidth - parseFloat(estiloVisor.paddingLeft) - parseFloat(estiloVisor.paddingRight);
    const disponibleAlto =
      parseFloat(estiloVisor.maxHeight) - parseFloat(estiloVisor.paddingTop) - parseFloat(estiloVisor.paddingBottom);
    const gap = parseFloat(getComputedStyle(grilla).columnGap) || 0;
    const naturalAncho = Math.max(
      disponibleAncho,
      piso.columnas * ANCHO_MIN_CELDA + (piso.columnas - 1) * gap
    );
    const naturalAlto = grilla.offsetHeight;
    const proporcionAlto =
      Number.isFinite(disponibleAlto) && naturalAlto > 0 ? disponibleAlto / naturalAlto : 1;
    // Se redondea hacia abajo para que "Ver todo" nunca deje un desborde de pocos píxeles.
    const ajuste = Math.max(
      ESCALA_MIN,
      Math.floor(Math.min(1, disponibleAncho / naturalAncho, proporcionAlto) * 100) / 100
    );

    setMedidas((prev) =>
      prev &&
      prev.disponibleAncho === disponibleAncho &&
      prev.naturalAncho === naturalAncho &&
      prev.naturalAlto === naturalAlto &&
      prev.ajuste === ajuste
        ? prev
        : { disponibleAncho, naturalAncho, naturalAlto, ajuste }
    );
    setEscala((e) => Math.max(e, ajuste));
  }, [piso.columnas]);

  useEffect(() => {
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(medir);
    if (visorRef.current) observer.observe(visorRef.current);
    if (grillaRef.current) observer.observe(grillaRef.current);
    return () => observer.disconnect();
  }, [medir]);

  useEffect(() => {
    setEscala(1);
  }, [piso.id]);

  const ajuste = medidas?.ajuste ?? 1;
  const hayDesborde = ajuste < 1;
  const viendoTodo = escala <= ajuste;
  const reducir = () => setEscala((e) => Math.max(ajuste, redondear(e - ESCALA_PASO)));
  const ampliar = () => setEscala((e) => Math.min(1, redondear(e + ESCALA_PASO)));
  const alternarVista = () => setEscala(viendoTodo ? 1 : ajuste);

  const botonControl =
    'h-10 w-10 flex items-center justify-center rounded-full text-aurea-navy hover:bg-aurea-ivory active:bg-aurea-champagne/60 disabled:opacity-30 disabled:pointer-events-none transition-colors';

  return (
    <>
      <div className="relative mx-3 sm:mx-5">
        <div
          ref={visorRef}
          className={`p-3 sm:p-5 ${hayDesborde ? 'pb-16 sm:pb-20' : ''} rounded-xl border border-aurea-champagne bg-aurea-ivory bg-[radial-gradient(#F4D7B0_1px,transparent_1px)] [background-size:18px_18px] shadow-inner overflow-auto max-h-[62dvh] [scrollbar-gutter:stable]`}
        >
          <div
            className="mx-auto transition-[width,height] duration-200 ease-out"
            style={
              medidas
                ? { width: medidas.naturalAncho * escala, height: medidas.naturalAlto * escala }
                : undefined
            }
          >
            <div
              ref={grillaRef}
              className="grid gap-3 sm:gap-4 origin-top-left transition-transform duration-200 ease-out"
              style={{
                gridTemplateColumns: `repeat(${piso.columnas}, minmax(${ANCHO_MIN_CELDA}px, 1fr))`,
                width: medidas?.disponibleAncho,
                transform: escala < 1 ? `scale(${escala})` : undefined,
              }}
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
        </div>

        {/* Controles flotantes: solo cuando el plano no cabe completo en pantalla */}
        {hayDesborde && (
          <div
            role="toolbar"
            aria-label="Tamaño de vista del plano"
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-0.5 p-1 rounded-full bg-white/95 backdrop-blur border border-aurea-champagne shadow-lg"
          >
            <button type="button" onClick={reducir} disabled={viendoTodo} aria-label="Reducir vista" className={botonControl}>
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span aria-live="polite" className="w-11 text-center text-xs font-semibold tabular-nums text-aurea-navy/70">
              {Math.round(escala * 100)}%
            </span>
            <button type="button" onClick={ampliar} disabled={escala >= 1} aria-label="Ampliar vista" className={botonControl}>
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={alternarVista}
              aria-label={viendoTodo ? 'Volver al tamaño normal' : 'Ver plano completo'}
              className="h-10 ml-0.5 px-4 flex items-center gap-2 rounded-full bg-aurea-navy text-aurea-champagne text-xs font-semibold hover:bg-aurea-navy/90 active:scale-[0.97] transition"
            >
              {viendoTodo ? (
                <Maximize className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Scan className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{viendoTodo ? 'Tamaño normal' : 'Ver todo'}</span>
            </button>
          </div>
        )}
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
