import { cn } from '@/shared/utils';
import type { TemaUI } from './Button';

export interface OpcionPestana<V extends string> {
  valor: V;
  etiqueta: string;
  conteo?: number;
  /** Clase de color del punto de estado que antecede a la etiqueta (ej. 'bg-estado-ok-500') */
  punto?: string;
  /** Marca la opción con un punto de alerta (ej. platos agotados en la categoría) */
  alerta?: string;
}

interface PestanasProps<V extends string> {
  opciones: OpcionPestana<V>[];
  valor: V;
  onCambiar: (valor: V) => void;
  /** Nombre accesible del grupo de filtros */
  etiqueta: string;
  tema?: TemaUI;
  className?: string;
}

/** Filtro segmentado con desplazamiento horizontal en móvil; cada opción mide 44px de alto. */
export function Pestanas<V extends string>({
  opciones,
  valor,
  onCambiar,
  etiqueta,
  tema = 'claro',
  className,
}: PestanasProps<V>) {
  const oscuro = tema === 'oscuro';

  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={cn(
        'flex items-center gap-1 p-1 rounded-xl border overflow-x-auto max-w-full',
        oscuro ? 'bg-tinta-900 border-tinta-800' : 'bg-white border-aurea-champagne/70 shadow-sm',
        className
      )}
    >
      {opciones.map((op) => {
        const activa = op.valor === valor;
        return (
          <button
            key={op.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => onCambiar(op.valor)}
            className={cn(
              'min-h-tactil px-3.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors',
              activa
                ? oscuro
                  ? 'bg-aurea-copper text-aurea-navy font-semibold'
                  : 'bg-aurea-navy text-white font-semibold'
                : oscuro
                  ? 'text-tinta-300 hover:bg-tinta-800 hover:text-white'
                  : 'text-aurea-navy/70 hover:bg-aurea-champagne/30 hover:text-aurea-navy'
            )}
          >
            {op.punto && (
              <span
                className={cn('w-2 h-2 rounded-full shrink-0', op.punto, activa && 'ring-2 ring-white/50')}
                aria-hidden="true"
              />
            )}
            <span>{op.etiqueta}</span>
            {op.conteo !== undefined && (
              <span
                className={cn(
                  'px-1.5 rounded-full text-xs font-semibold tabular-nums',
                  activa
                    ? oscuro
                      ? 'bg-aurea-navy/15'
                      : 'bg-white/20'
                    : oscuro
                      ? 'bg-tinta-800 text-tinta-300'
                      : 'bg-aurea-champagne/40 text-aurea-navy'
                )}
              >
                {op.conteo}
              </span>
            )}
            {op.alerta && (
              <>
                <span className="w-2 h-2 rounded-full bg-estado-error-500" aria-hidden="true" />
                <span className="sr-only">{op.alerta}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
