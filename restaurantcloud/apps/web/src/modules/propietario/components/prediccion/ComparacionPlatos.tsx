import React from 'react';
import { cn } from '@/shared/utils';
import type { SedePrediccionDTO } from '@/types/prediccion';
import { formatoEntero } from '@/modules/admin/components/prediccion';
import { platosComparados } from './periodos';

const BARRAS = ['bg-aurea-navy', 'bg-aurea-copper', 'bg-tinta-400', 'bg-tinta-300'];

interface ComparacionPlatosProps {
  sedes: SedePrediccionDTO[];
}

/** Los platos más pedidos de la semana, sede por sede. */
export const ComparacionPlatos: React.FC<ComparacionPlatosProps> = ({ sedes }) => {
  const conPronostico = sedes.filter((s) => s.pronostico !== null);
  const platos = platosComparados(conPronostico);
  if (platos.length === 0) return null;

  const mayor = Math.max(1, ...platos.flatMap((p) => Object.values(p.porSede).map((v) => v ?? 0)));

  return (
    <section aria-labelledby="titulo-comparar" className="bg-white border border-tinta-100 rounded-3xl overflow-hidden">
      <div className="px-5 py-4 border-b border-tinta-50">
        <h2 id="titulo-comparar" className="text-lg font-bold text-aurea-navy">Los platos más pedidos de la semana, sede por sede</h2>
      </div>
      <ul className="divide-y divide-tinta-50">
        {platos.map((p) => (
          <li key={p.nombre} className="px-5 py-4 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)] md:items-center">
            <p className="text-sm font-semibold text-aurea-navy">{p.nombre}</p>
            <div className="space-y-2">
              {conPronostico.map((s, i) => {
                const valor = p.porSede[s.local_id];
                return (
                  <div key={s.local_id} className="flex items-center gap-3">
                    <span className="w-24 sm:w-32 text-xs text-tinta-600 truncate">{s.nombre}</span>
                    <div className="flex-1 h-3 rounded-full bg-tinta-50 overflow-hidden" aria-hidden="true">
                      <div className={cn('h-full rounded-full', BARRAS[i % BARRAS.length])} style={{ width: `${valor ? Math.round((valor / mayor) * 100) : 0}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm font-bold tabular-nums text-aurea-navy">{valor === null ? '—' : formatoEntero(Math.round(valor))}</span>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
