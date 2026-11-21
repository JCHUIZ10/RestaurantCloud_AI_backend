import React from 'react';
import { cn } from '@/shared/utils';
import type { CoberturaDias } from '@/types/prediccion';
import { diaConNumero } from './utilidades';

interface SelectorCoberturaProps {
  valor: CoberturaDias;
  onChange: (cobertura: CoberturaDias) => void;
  /** Primer día pronosticado, para decir hasta qué día alcanza cada opción */
  fechaInicio: string;
  deshabilitado?: boolean;
}

const OPCIONES: CoberturaDias[] = [3, 5, 7];

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

/** Cuántos días quiere cubrir la compra: 3, 5 o 7. */
export const SelectorCobertura: React.FC<SelectorCoberturaProps> = ({ valor, onChange, fechaInicio, deshabilitado }) => (
  <section aria-labelledby="titulo-cobertura" className="space-y-3">
    <div className="flex flex-wrap items-baseline justify-between gap-1">
      <h2 id="titulo-cobertura" className="text-lg font-bold text-aurea-navy">¿Para cuántos días quieres comprar?</h2>
      <p className="text-sm text-aurea-navy/60">Lo sugerido cambia al elegir otra opción</p>
    </div>
    <div role="radiogroup" aria-label="Días que cubre la compra" className="grid grid-cols-3 gap-2 sm:gap-3">
      {OPCIONES.map((n) => {
        const activa = n === valor;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={activa}
            disabled={deshabilitado}
            onClick={() => !activa && onChange(n)}
            className={cn(
              'min-h-[4.5rem] rounded-2xl border-2 px-3 sm:px-4 py-3 text-left transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2',
              activa
                ? 'bg-aurea-navy border-aurea-navy text-aurea-ivory'
                : 'bg-white border-tinta-100 text-aurea-navy hover:border-aurea-copper'
            )}
          >
            <span className="block text-lg font-bold">{n} días</span>
            <span className={cn('block text-sm', activa ? 'text-aurea-champagne' : 'text-aurea-navy/70')}>
              Hasta el {diaConNumero(sumarDias(fechaInicio, n - 1))}
            </span>
          </button>
        );
      })}
    </div>
  </section>
);
