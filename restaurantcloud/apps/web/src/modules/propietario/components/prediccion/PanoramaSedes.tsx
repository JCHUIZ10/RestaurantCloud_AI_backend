import React from 'react';
import { cn } from '@/shared/utils';
import type { PrediccionPropietarioDTO, SedePrediccionDTO } from '@/types/prediccion';
import { diaCorto, formatoEntero } from '@/modules/admin/components/prediccion';

/** Un color por sede sobre el fondo azul marino. */
const COLORES_SEDE = ['bg-aurea-champagne', 'bg-aurea-copper', 'bg-aurea-ivory', 'bg-tinta-300'];

interface PanoramaSedesProps {
  sedes: SedePrediccionDTO[];
  panorama: PrediccionPropietarioDTO['panorama'];
  /** Fechas del periodo elegido; el resto de la semana se atenúa */
  fechas: string[];
  total: number;
  titulo: string;
}

/** Cuánto venderá cada sede, día por día, y el total de la empresa. */
export const PanoramaSedes: React.FC<PanoramaSedesProps> = ({ sedes, panorama, fechas, total, titulo }) => {
  const conPronostico = sedes.filter((s) => s.pronostico !== null);
  const mayor = Math.max(1, ...panorama.dias.flatMap((d) => Object.values(d.por_sede)));

  return (
    <section aria-labelledby="titulo-panorama" className="relative overflow-hidden bg-aurea-navy text-aurea-ivory rounded-3xl p-5 sm:p-8 space-y-6">
      <span aria-hidden="true" className="absolute -left-24 -bottom-40 w-96 h-96 rounded-full border border-aurea-copper/20" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <h2 id="titulo-panorama" className="font-serif text-3xl sm:text-4xl leading-tight">
            Cerca de {formatoEntero(total)} platos y bebidas {titulo}
          </h2>
          <p className="text-base text-aurea-ivory/85">
            {conPronostico.length === 0
              ? 'Calcula la semana de tus sedes para ver cuánto venderá cada una.'
              : `Sumando ${conPronostico.length} ${conPronostico.length === 1 ? 'sede' : 'sedes'}.`}
          </p>
        </div>
        <ul className="flex flex-wrap gap-4 text-sm" aria-label="Sedes">
          {conPronostico.map((s, i) => (
            <li key={s.local_id} className="inline-flex items-center gap-2">
              <span className={cn('w-3.5 h-3.5 rounded', COLORES_SEDE[i % COLORES_SEDE.length])} aria-hidden="true" />
              {s.nombre}
            </li>
          ))}
        </ul>
      </div>

      {conPronostico.length > 0 && (
        <ul
          aria-label="Platos y bebidas por día y por sede"
          className="relative grid gap-1.5 sm:gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, panorama.dias.length)}, minmax(0, 1fr))` }}
        >
          {panorama.dias.map((d) => {
            const dentro = fechas.includes(d.fecha);
            const { dia, numero } = diaCorto(d.fecha);
            return (
              <li key={d.fecha} className={cn('flex flex-col items-center gap-2', !dentro && 'opacity-40')}>
                <div className="h-36 sm:h-44 w-full flex items-end justify-center gap-1" aria-hidden="true">
                  {conPronostico.map((s, i) => (
                    <div
                      key={s.local_id}
                      className={cn('w-2/5 max-w-7 rounded-t-lg rounded-b-sm', COLORES_SEDE[i % COLORES_SEDE.length])}
                      style={{ height: `${Math.max(3, Math.round(((d.por_sede[s.local_id] ?? 0) / mayor) * 100))}%` }}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-semibold">{dia} {numero}</span>
                <span className="text-xs text-aurea-ivory/70 tabular-nums">≈ {formatoEntero(Math.round(d.total_p50))}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
