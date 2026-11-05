import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { RecursosConciliacionDTO } from '@/types/propietarioCambiarPlan';
import { validarSede, type Paso, type Seleccion } from './logicaConservar';

interface PasosConservarProps {
  datos: RecursosConciliacionDTO;
  sel: Seleccion;
  pasos: Paso[];
  indice: number;
  onIr: (clave: string) => void;
}

/** Barra fija: recorrido del asistente con el estado de cada pantalla y lo que seguirá activo. */
export const PasosConservar: React.FC<PasosConservarProps> = ({ datos, sel, pasos, indice, onIr }) => {
  const limites = datos.plan_destino.limites;

  const estado = (paso: Paso): 'ok' | 'alerta' | null => {
    if (paso.tipo === 'locales') return sel.locales.size >= 1 && sel.locales.size <= limites.max_locales ? 'ok' : 'alerta';
    if (paso.tipo === 'sede') {
      const local = datos.locales.find((l) => l.id === paso.localId);
      return local && validarSede(local, sel, limites).ok ? 'ok' : 'alerta';
    }
    return null;
  };

  return (
    <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-aurea-ivory/95 backdrop-blur border-b border-aurea-champagne/60 sm:border-0 sm:rounded-2xl">
      <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Pasos del asistente">
        {pasos.map((paso, i) => {
          const actual = i === indice;
          const e = estado(paso);
          return (
            <li key={paso.clave} className="flex items-center shrink-0">
              <button
                type="button"
                disabled={i > indice}
                aria-current={actual ? 'step' : undefined}
                onClick={() => onIr(paso.clave)}
                className={cn(
                  'min-h-tactil px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors',
                  actual ? 'bg-aurea-navy text-white' : 'text-aurea-navy/70 hover:bg-aurea-champagne/30 disabled:opacity-50 disabled:hover:bg-transparent'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full grid place-items-center text-[10px] shrink-0',
                    actual ? 'bg-white/20' : 'bg-aurea-champagne/50'
                  )}
                >
                  {e === 'ok' && i < indice ? (
                    <Check className="w-3 h-3" aria-label="Revisado" />
                  ) : e === 'alerta' && i < indice ? (
                    <AlertTriangle className="w-3 h-3 text-estado-alerta-700" aria-label="Excede el cupo" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="max-w-[10rem] truncate">{paso.titulo}</span>
              </button>
              {i < pasos.length - 1 && <span className="mx-1 text-aurea-navy/20" aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>

      <p className="mt-1.5 text-xs text-aurea-navy/70">
        Seguirán activos:{' '}
        <strong className="text-aurea-navy">
          {sel.locales.size}/{limites.max_locales} {limites.max_locales === 1 ? 'local' : 'locales'}
        </strong>{' '}
        · <strong className="text-aurea-navy">{sel.pisos.size}</strong> ambientes ·{' '}
        <strong className="text-aurea-navy">{sel.mesas.size}</strong> mesas ·{' '}
        <strong className="text-aurea-navy">{sel.usuarios.size}</strong> personas
      </p>
    </div>
  );
};
