import React from 'react';
import { cn } from '@/shared/utils';
import type { LineaReposicionDTO, PrioridadReposicion } from '@/types/prediccion';
import { TarjetaInsumo } from './TarjetaInsumo';

interface GrupoPrioridadProps {
  prioridad: PrioridadReposicion;
  lineas: LineaReposicionDTO[];
  cobertura: number;
  guardandoId: string | null;
  onAceptar: (linea: LineaReposicionDTO) => void;
  onDescartar: (linea: LineaReposicionDTO) => void;
}

const TEXTOS: Record<PrioridadReposicion, { titulo: string; subtitulo: string; punto: string }> = {
  urgente: { titulo: 'Comprar cuanto antes', subtitulo: 'no alcanzan para el primer día o están por debajo de tu mínimo', punto: 'bg-estado-error-600' },
  pronto: { titulo: 'Se acaban en estos días', subtitulo: 'alcanzan, pero no para toda tu compra', punto: 'bg-estado-alerta-600' },
  cubierto: { titulo: 'Tienes suficiente', subtitulo: 'no hace falta comprar, o muy poco', punto: 'bg-estado-ok-600' },
};

/** Insumos de una misma urgencia, con su título. No se dibuja si no hay ninguno. */
export const GrupoPrioridad: React.FC<GrupoPrioridadProps> = ({ prioridad, lineas, cobertura, guardandoId, onAceptar, onDescartar }) => {
  if (lineas.length === 0) return null;
  const t = TEXTOS[prioridad];

  return (
    <section aria-label={t.titulo} className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn('w-2.5 h-2.5 rounded-full', t.punto)} aria-hidden="true" />
        <h2 className="text-lg font-bold text-aurea-navy">{t.titulo}</h2>
        <span className="text-sm text-aurea-navy/60">{t.subtitulo}</span>
      </div>
      <div className="space-y-3">
        {lineas.map((l) => (
          <TarjetaInsumo
            key={l.id}
            linea={l}
            cobertura={cobertura}
            guardando={guardandoId === l.id}
            onAceptar={onAceptar}
            onDescartar={onDescartar}
          />
        ))}
      </div>
    </section>
  );
};
