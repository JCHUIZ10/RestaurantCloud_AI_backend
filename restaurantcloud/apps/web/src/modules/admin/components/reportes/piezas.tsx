import React from 'react';
import { ArrowDownRight, ArrowUpRight, Info, Lightbulb, Star, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { tenue } from './colores';
import { porcentaje } from './utilidades';

/** Piezas pequeñas que se repiten en las tres pestañas de Reportes. */

/** Frase de «lo más importante del periodo», lo primero que se lee en cada pestaña. */
export const LoMasImportante: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside className="flex items-start gap-3 rounded-2xl border border-aurea-champagne bg-gradient-to-r from-aurea-champagne/45 to-aurea-champagne/10 px-4 py-3.5">
    <span className="w-9 h-9 rounded-xl bg-aurea-navy text-aurea-champagne flex items-center justify-center shrink-0" aria-hidden="true">
      <Lightbulb className="w-[18px] h-[18px]" />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-bold text-aurea-navy">Lo más importante del periodo</p>
      <p className="text-sm text-aurea-navy/75">{children}</p>
    </div>
  </aside>
);

/** Aviso informativo corto con icono; no es un error. */
export const NotaInformativa: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('flex items-start gap-2 rounded-xl bg-aurea-navy/5 px-3 py-2.5 text-sm text-aurea-navy/75', className)}>
    <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

/** Variación frente al periodo anterior: sube en verde, baja en rojo, siempre con flecha y signo. */
export const VariacionPildora: React.FC<{
  valor: number | null;
  sufijo?: string;
  /** Texto propio en lugar del número (por ejemplo, una diferencia en soles) */
  etiqueta?: string;
  oscuro?: boolean;
  className?: string;
}> = ({ valor, sufijo = '%', etiqueta, oscuro = false, className }) => {
  if (valor === null) return null;
  const sube = valor > 0;
  const baja = valor < 0;
  const Flecha = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-sm font-semibold tabular-nums whitespace-nowrap',
        sube && (oscuro ? 'bg-estado-ok-500/20 text-estado-ok-200' : 'bg-estado-ok-50 text-estado-ok-700'),
        baja && (oscuro ? 'bg-estado-error-500/25 text-estado-error-100' : 'bg-estado-error-50 text-estado-error-700'),
        !sube && !baja && (oscuro ? 'bg-white/15 text-white' : 'bg-aurea-navy/5 text-aurea-navy/70'),
        className
      )}
    >
      {(sube || baja) && <Flecha className="w-3.5 h-3.5" aria-hidden="true" />}
      <span className="sr-only">{sube ? 'Subió' : baja ? 'Bajó' : 'Sin cambio'}</span>
      {etiqueta ?? `${sube ? '+' : ''}${porcentaje(valor).replace(' %', '')} ${sufijo}`}
    </span>
  );
};

/** Barra de una cifra con su valor del periodo anterior: «Actual» y «Anterior» a la misma escala. */
export const BarrasActualAnterior: React.FC<{ actual: number; anterior: number; color: string }> = ({ actual, anterior, color }) => {
  const mayor = Math.max(actual, anterior, 1);
  return (
    <div className="mt-2 grid gap-1" aria-hidden="true">
      {[
        { nombre: 'Actual', valor: actual, fondo: color },
        { nombre: 'Anterior', valor: anterior, fondo: tenue(color, 0.35) },
      ].map((fila) => (
        <div key={fila.nombre} className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-2 text-xs text-aurea-navy/65">
          <span>{fila.nombre}</span>
          <span className="h-1.5 rounded-full bg-aurea-navy/[0.06] overflow-hidden">
            <span className="block h-full rounded-full" style={{ width: `${(fila.valor / mayor) * 100}%`, background: fila.fondo }} />
          </span>
        </div>
      ))}
    </div>
  );
};

interface TarjetaKpiProps {
  icono: LucideIcon;
  color: string;
  etiqueta: string;
  valor: React.ReactNode;
  unidad?: string;
  /** Línea bajo la cifra, junto a la variación */
  detalle?: React.ReactNode;
  variacion?: number | null;
  /** Valores para las barras «Actual» y «Anterior»; sin ellos no se dibujan */
  comparacion?: { actual: number; anterior: number };
}

/** Indicador de ventas: cifra grande en serif, variación y, si se compara, sus barras. */
export const TarjetaKpi: React.FC<TarjetaKpiProps> = ({ icono: Icono, color, etiqueta, valor, unidad, detalle, variacion = null, comparacion }) => (
  <article className="bg-white rounded-2xl border border-aurea-champagne/70 shadow-sm p-4 min-w-0 flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-aurea-navy/70 truncate">{etiqueta}</h3>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tenue(color, 0.12), color }} aria-hidden="true">
        <Icono className="w-[18px] h-[18px]" />
      </span>
    </div>
    <p className="flex items-baseline gap-1.5 min-w-0">
      <span className="font-serif font-bold text-3xl text-aurea-navy tabular-nums truncate">{valor}</span>
      {unidad && <span className="text-sm text-aurea-navy/65 shrink-0">{unidad}</span>}
    </p>
    {(variacion !== null || detalle) && (
      <div className="flex flex-wrap items-center gap-2">
        <VariacionPildora valor={variacion} />
        {detalle && <span className="text-sm text-aurea-navy/70">{detalle}</span>}
      </div>
    )}
    {comparacion && <BarrasActualAnterior actual={comparacion.actual} anterior={comparacion.anterior} color={color} />}
  </article>
);

interface EstrellasProps {
  /** De 1 a 5; `null` si el plato no se califica */
  valor: number | null;
  className?: string;
}

/** Rentabilidad de un plato en estrellas; el texto accesible dice «N de 5 estrellas». */
export const Estrellas: React.FC<EstrellasProps> = ({ valor, className }) => {
  if (valor === null) return <span className="text-sm text-aurea-navy/60">Sin calificar</span>;
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn('w-4 h-4', n <= valor ? 'text-[#C98F12] fill-[#C98F12]' : 'text-aurea-navy/25')}
          strokeWidth={n <= valor ? 1.5 : 2}
        />
      ))}
    </span>
  );
};

interface TooltipGraficoProps {
  titulo: string;
  filas: Array<{ etiqueta: string; valor: string }>;
}

/** Cuadro que aparece al pasar el cursor o tocar una marca de un gráfico. */
export const TooltipGrafico: React.FC<TooltipGraficoProps> = ({ titulo, filas }) => (
  <div className="rounded-xl bg-aurea-navy px-3 py-2 text-sm text-white shadow-lg max-w-[15rem]">
    <p className="font-bold text-aurea-champagne">{titulo}</p>
    {filas.map((f) => (
      <p key={f.etiqueta} className="flex justify-between gap-4">
        <span className="text-white/70">{f.etiqueta}</span>
        <span className="tabular-nums">{f.valor}</span>
      </p>
    ))}
  </div>
);
