import React from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Pestanas, type OpcionPestana } from '@/components/ui';
import { cn } from '@/shared/utils';
import type { RangoDTO } from '@/types/reportes';
import {
  ETIQUETA_PERIODO,
  MAXIMO_DIAS_REPORTE,
  diasDelRango,
  etiquetaRango,
  fechaCorta,
  periodoAnterior,
  textoDias,
  type OpcionPeriodo,
} from './utilidades';

const OPCIONES: OpcionPestana<OpcionPeriodo>[] = (Object.keys(ETIQUETA_PERIODO) as OpcionPeriodo[]).map((valor) => ({
  valor,
  etiqueta: ETIQUETA_PERIODO[valor],
}));

interface ComparadorProps {
  activo: boolean;
  onCambiar: (activo: boolean) => void;
  /** Periodo que se está viendo; el anterior se calcula igual que lo hace el servicio */
  rango: RangoDTO;
}

/**
 * Un solo control para comparar: el interruptor y, al activarlo, desde qué día hasta qué día se compara y
 * cuántos días abarca. El periodo anterior dura lo mismo y termina el día antes de que empiece el elegido.
 */
export const ComparadorPeriodos: React.FC<ComparadorProps> = ({ activo, onCambiar, rango }) => {
  const anterior = periodoAnterior(rango);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-aurea-champagne/70 bg-white p-1 shadow-sm">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={() => onCambiar(!activo)}
        className="min-h-11 px-3 inline-flex items-center gap-2.5 rounded-xl text-sm font-medium text-aurea-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper"
      >
        <span className={cn('relative w-10 h-6 rounded-full transition-colors shrink-0', activo ? 'bg-estado-ok-600' : 'bg-aurea-navy/20')} aria-hidden="true">
          <span className={cn('absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-[left]', activo ? 'left-[19px]' : 'left-[3px]')} />
        </span>
        Comparar con el periodo anterior
      </button>
      {activo && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-aurea-champagne/50 bg-aurea-ivory px-3 py-1.5">
          <span className="leading-tight">
            <span className="block text-xs text-aurea-navy/65">Desde</span>
            <span className="block text-sm font-semibold text-aurea-navy tabular-nums whitespace-nowrap">{fechaCorta(anterior.desde)}</span>
          </span>
          <ArrowRight className="w-4 h-4 text-aurea-navy/50" aria-hidden="true" />
          <span className="leading-tight">
            <span className="block text-xs text-aurea-navy/65">Hasta</span>
            <span className="block text-sm font-semibold text-aurea-navy tabular-nums whitespace-nowrap">{fechaCorta(anterior.hasta)}</span>
          </span>
          <span className="rounded-full bg-aurea-champagne px-2.5 py-0.5 text-sm font-bold text-aurea-navy tabular-nums whitespace-nowrap">
            {textoDias(diasDelRango(anterior))}
          </span>
        </div>
      )}
    </div>
  );
};

interface FiltrosProps {
  opcion: OpcionPeriodo;
  onOpcion: (opcion: OpcionPeriodo) => void;
  rango: RangoDTO;
  /** Fechas del periodo personalizado (siempre se muestran editables solo con esa opción) */
  personalizado: RangoDTO;
  onPersonalizado: (rango: RangoDTO) => void;
  /** Fecha del servidor; es el último día que se puede elegir */
  hoy: string;
  errorRango: string | null;
  comparando: boolean;
  onComparar: (activo: boolean) => void;
}

const CAMPO_FECHA =
  'min-h-11 w-full px-3 rounded-xl border border-aurea-champagne bg-white text-sm text-aurea-navy tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper';

/** Periodo del reporte y comparación, en una sola tarjeta sobre las pestañas. */
export const FiltrosReporte: React.FC<FiltrosProps> = ({ opcion, onOpcion, rango, personalizado, onPersonalizado, hoy, errorRango, comparando, onComparar }) => (
  <section aria-label="Periodo del reporte" className="rounded-2xl border border-aurea-champagne/70 bg-white p-3 sm:p-4 shadow-sm space-y-3">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <Pestanas opciones={OPCIONES} valor={opcion} onCambiar={onOpcion} etiqueta="Periodo" className="shadow-none" />
      <p className="flex items-center gap-2 text-sm text-aurea-navy tabular-nums">
        <CalendarDays className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
        <span className="font-semibold">{errorRango ? 'Elige un periodo válido' : etiquetaRango(rango)}</span>
        {!errorRango && <span className="text-aurea-navy/65">· {textoDias(diasDelRango(rango))}</span>}
      </p>
      <div className="lg:ml-auto">
        <ComparadorPeriodos activo={comparando} onCambiar={onComparar} rango={errorRango ? { desde: hoy, hasta: hoy } : rango} />
      </div>
    </div>

    {opcion === 'personalizado' && (
      <div className="grid gap-3 sm:grid-cols-[repeat(2,minmax(0,13rem))] items-end">
        <label className="space-y-1 text-sm text-aurea-navy/75">
          <span>Desde</span>
          <input type="date" className={CAMPO_FECHA} value={personalizado.desde} max={hoy} onChange={(e) => onPersonalizado({ ...personalizado, desde: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm text-aurea-navy/75">
          <span>Hasta</span>
          <input type="date" className={CAMPO_FECHA} value={personalizado.hasta} max={hoy} onChange={(e) => onPersonalizado({ ...personalizado, hasta: e.target.value })} />
        </label>
      </div>
    )}

    {errorRango ? (
      <p role="alert" className="text-sm font-medium text-estado-error-700">
        {errorRango}
      </p>
    ) : (
      opcion === 'personalizado' && <p className="text-sm text-aurea-navy/65">Puedes elegir hasta {MAXIMO_DIAS_REPORTE} días.</p>
    )}
  </section>
);
