import React from 'react';
import { Gauge, Sprout, Target, Hourglass, Check } from 'lucide-react';
import { EstadoBadge } from '@/components/ui';
import { cn } from '@/shared/utils';
import type { NivelPrediccion, PrediccionDTO } from '@/types/prediccion';
import { NIVELES, textoProgreso } from './utilidades';

interface IndicadorNivelProps {
  nivel: NivelPrediccion;
  progreso: PrediccionDTO['progreso'];
  confianza: PrediccionDTO['confianza'];
  className?: string;
}

const ICONOS = { 0: Hourglass, 1: Sprout, 2: Gauge, 3: Target } as const;

/**
 * En qué nivel está la predicción de la sede y cuánto falta para el siguiente. En el último nivel muestra
 * qué tan bien acierta, en lenguaje de usuario.
 */
export const IndicadorNivel: React.FC<IndicadorNivelProps> = ({ nivel, progreso, confianza, className }) => {
  const info = NIVELES[nivel];
  const avance = textoProgreso(nivel, progreso);
  const Icono = ICONOS[nivel];

  return (
    <section
      aria-label="Nivel de la predicción"
      className={cn('bg-white border border-aurea-copper/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center', className)}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="w-11 h-11 rounded-xl bg-aurea-champagne/40 text-aurea-navy flex items-center justify-center shrink-0" aria-hidden="true">
          <Icono className="w-5 h-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge tono={info.tono} icono={nivel === 3 ? Check : undefined}>
              {info.nombre}
            </EstadoBadge>
            <span className="text-xs text-aurea-navy/60">Nivel {nivel + 1} de 4</span>
          </div>
          <p className="text-sm text-aurea-navy/80">{info.explicacion}</p>
          {avance && <p className="text-sm font-medium text-aurea-navy">{avance}</p>}
          {confianza && (
            <p className="text-sm text-aurea-navy/80">
              Se equivoca en unos <strong className="text-aurea-navy">{confianza.error_promedio.toLocaleString('es-PE')}</strong> platos al día por plato
              {confianza.mejora_pct > 0 && (
                <>
                  {' '}y acierta <strong className="text-aurea-navy">{confianza.mejora_pct} % mejor</strong> que repetir la semana anterior
                </>
              )}
              .
            </p>
          )}
        </div>
      </div>

      <ol aria-hidden="true" className="flex items-center gap-1.5 shrink-0">
        {([0, 1, 2, 3] as const).map((n) => (
          <li key={n} className={cn('h-2 w-10 rounded-full', n <= nivel ? 'bg-aurea-copper' : 'bg-aurea-champagne/50')} />
        ))}
      </ol>
    </section>
  );
};
