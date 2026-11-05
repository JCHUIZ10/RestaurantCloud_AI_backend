import React from 'react';
import { Check, Info } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { RecursosConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { asientos, mesasDe, type Seleccion } from './logicaConservar';
import type { SeleccionConservar } from './useSeleccionConservar';

interface PasoLocalesProps {
  datos: RecursosConciliacionDTO;
  sel: Seleccion;
  alternarLocal: SeleccionConservar['alternarLocal'];
}

/** Elige qué locales siguen activos; el resto pasa a inactivo con todo lo que contiene. */
export const PasoLocales: React.FC<PasoLocalesProps> = ({ datos, sel, alternarLocal }) => {
  const max = datos.plan_destino.limites.max_locales;
  const completo = sel.locales.size >= max;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-bold text-aurea-navy">¿Qué locales conservas?</h2>
          <p className="mt-1 text-sm text-aurea-navy/70">
            El Plan {datos.plan_destino.nombre} admite {max} {max === 1 ? 'local' : 'locales'}.
          </p>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-bold font-mono',
            sel.locales.size === max ? 'bg-estado-ok-50 text-estado-ok-700' : 'bg-estado-alerta-50 text-estado-alerta-700'
          )}
          role="status"
        >
          {sel.locales.size} / {max} elegidos
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {datos.locales.map((local) => {
          const elegido = sel.locales.has(local.id);
          const bloqueado = !elegido && completo;
          const mesas = mesasDe(local);
          return (
            <li key={local.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={elegido}
                disabled={bloqueado}
                onClick={() => alternarLocal(local)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border-2 transition-colors flex gap-3',
                  elegido ? 'border-aurea-navy bg-aurea-ivory/70 shadow-sm' : 'border-slate-200 bg-white',
                  bloqueado ? 'opacity-50 cursor-not-allowed' : 'hover:border-aurea-copper'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-md border-2 grid place-items-center shrink-0 mt-0.5',
                    elegido ? 'bg-aurea-navy border-aurea-navy text-white' : 'border-slate-300'
                  )}
                  aria-hidden="true"
                >
                  {elegido && <Check className="w-4 h-4" />}
                </span>
                <span className="min-w-0">
                  <strong className="block text-aurea-navy truncate">{local.nombre}</strong>
                  <span className="mt-1 block text-xs text-aurea-navy/70">
                    {local.pisos.length} ambientes · {mesas.length} mesas ({asientos(mesas)} asientos) · {local.personal.length} personas
                  </span>
                  {bloqueado && (
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Ya elegiste {max}. Quita uno para conservar este.
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-aurea-copper" aria-hidden="true" />
        Al conservar un local te proponemos lo más antiguo hasta el cupo; podrás ajustarlo en el siguiente paso. Los locales
        que no elijas pasan a inactivos completos.
      </p>
    </div>
  );
};
