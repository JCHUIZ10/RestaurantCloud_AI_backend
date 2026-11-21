import React from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { PronosticoDTO } from '@/types/prediccion';
import { diaCorto, esDiaFuerte, formatoEntero, nombreDia, rangoDeSemana, totalesPorDia } from './utilidades';

interface CintaSemanaProps {
  pronostico: PronosticoDTO;
  /** Días que cubre la compra elegida: esos días se resaltan */
  cobertura: number;
  className?: string;
}

/** La semana de un vistazo: cuántos platos y bebidas se esperan cada día. */
export const CintaSemana: React.FC<CintaSemanaProps> = ({ pronostico, cobertura, className }) => {
  const dias = totalesPorDia(pronostico);
  if (dias.length === 0) return null;

  const mayor = Math.max(...dias.map((d) => d.p50));
  const mejor = dias.find((d) => d.p50 === mayor)!;
  const finDeSemana = ['viernes', 'sábado', 'domingo'].includes(nombreDia(mejor.fecha));
  const titular = finDeSemana ? 'Se viene un fin de semana fuerte' : 'Tu semana de un vistazo';
  const hasta = pronostico.datos.hasta;

  return (
    <section aria-labelledby="titulo-semana" className={cn('relative overflow-hidden bg-aurea-navy text-aurea-ivory rounded-3xl p-5 sm:p-8 space-y-6', className)}>
      <span aria-hidden="true" className="absolute -right-20 -top-28 w-80 h-80 rounded-full border border-aurea-copper/25" />
      <span aria-hidden="true" className="absolute -right-6 -top-14 w-56 h-56 rounded-full border border-aurea-copper/20" />

      <div className="relative flex flex-wrap justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-aurea-champagne border border-aurea-copper/50 rounded-full px-3 py-1">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
            {rangoDeSemana(dias.map((d) => d.fecha))}
          </span>
          <h2 id="titulo-semana" className="font-serif text-3xl sm:text-4xl leading-tight">{titular}</h2>
          <p className="text-base text-aurea-ivory/85">
            El {nombreDia(mejor.fecha)} esperamos alrededor de{' '}
            <strong className="text-aurea-champagne">{formatoEntero(Math.round(mayor))} platos y bebidas</strong>.
          </p>
        </div>
        {hasta && (
          <p className="inline-flex items-start gap-2 text-sm text-aurea-ivory/80 self-end">
            <Clock3 className="w-4 h-4 mt-0.5 shrink-0 text-aurea-champagne" aria-hidden="true" />
            Con tus ventas hasta el {nombreDia(hasta)} {Number(hasta.slice(8, 10))}
          </p>
        )}
      </div>

      <ul aria-label="Platos y bebidas esperados por día" className="relative grid grid-cols-7 gap-1.5 sm:gap-3">
        {dias.map((d, i) => {
          const { dia, numero } = diaCorto(d.fecha);
          const fuerte = esDiaFuerte(d.p50, mayor);
          const dentro = i < cobertura;
          return (
            <li
              key={d.fecha}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl border px-1 pt-3 pb-2.5',
                dentro ? 'bg-aurea-champagne/10 border-aurea-copper/50' : 'border-aurea-ivory/10'
              )}
            >
              <span className="text-xs font-semibold text-aurea-ivory/70">{dia}</span>
              <span className="text-lg sm:text-xl font-bold leading-none">{numero}</span>
              <div className="h-24 sm:h-28 w-full flex items-end justify-center" aria-hidden="true">
                <div
                  className={cn('w-3/5 max-w-10 rounded-t-lg rounded-b-sm', fuerte ? 'bg-aurea-copper' : 'bg-aurea-champagne')}
                  style={{ height: `${Math.max(4, Math.round((d.p50 / mayor) * 100))}%` }}
                />
              </div>
              <span className="text-xs sm:text-sm font-bold tabular-nums">≈ {formatoEntero(Math.round(d.p50))}</span>
              <span className="min-h-5 flex items-center">
                {fuerte && <span className="text-xs font-semibold bg-aurea-champagne text-aurea-navy rounded-full px-1.5 py-0.5">Fuerte</span>}
              </span>
              <span className={cn('h-1 w-6 rounded-full', dentro ? 'bg-aurea-champagne' : 'bg-transparent')} aria-hidden="true" />
              {dentro && <span className="sr-only">Incluido en tu compra</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
