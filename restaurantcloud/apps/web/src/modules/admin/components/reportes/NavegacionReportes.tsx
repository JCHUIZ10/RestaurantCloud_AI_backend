import { Lock, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import { tenue } from './colores';

export interface PestanaReporte<V extends string> {
  valor: V;
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  color: string;
  /** El plan de la empresa no incluye esta pestaña */
  bloqueada?: boolean;
}

interface Props<V extends string> {
  pestanas: PestanaReporte<V>[];
  activa: V;
  onCambiar: (valor: V) => void;
}

/** Las tres pestañas de Reportes como tarjetas: la activa en navy, las demás con su color de marca. */
export function NavegacionReportes<V extends string>({ pestanas, activa, onCambiar }: Props<V>) {
  return (
    <nav aria-label="Reportes" className="grid grid-cols-3 gap-2 sm:gap-3">
      {pestanas.map((p) => {
        const seleccionada = p.valor === activa;
        const Icono = p.icono;
        return (
          <button
            key={p.valor}
            type="button"
            aria-current={seleccionada ? 'page' : undefined}
            onClick={() => onCambiar(p.valor)}
            className={cn(
              'relative min-h-16 rounded-2xl border p-2.5 sm:p-3.5 text-left flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 transition-shadow',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurea-copper focus-visible:ring-offset-2',
              seleccionada ? 'bg-aurea-navy border-aurea-navy text-white shadow-lg shadow-aurea-navy/20' : 'bg-white border-aurea-champagne/70 text-aurea-navy hover:shadow-md'
            )}
          >
            <span
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
              style={seleccionada ? { background: 'rgba(244,215,176,.16)', color: '#F4D7B0' } : { background: tenue(p.color, 0.12), color: p.color }}
              aria-hidden="true"
            >
              <Icono className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm sm:text-base font-bold leading-tight">{p.nombre}</span>
              <span className={cn('hidden sm:block text-sm truncate', seleccionada ? 'text-aurea-champagne' : 'text-aurea-navy/65')}>
                {p.bloqueada ? 'No incluido en tu plan' : p.descripcion}
              </span>
            </span>
            {p.bloqueada && (
              <>
                <Lock className={cn('absolute top-2.5 right-2.5 w-3.5 h-3.5', seleccionada ? 'text-aurea-champagne' : 'text-aurea-navy/55')} aria-hidden="true" />
                <span className="sr-only">No incluido en tu plan</span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}
