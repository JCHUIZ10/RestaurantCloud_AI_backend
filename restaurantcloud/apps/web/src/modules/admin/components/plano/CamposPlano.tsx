import React, { useId } from 'react';
import { Minus, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FormaMesa } from '@/types/admin';
import { IconButton } from '@/components/ui';
import { cn } from '@/shared/utils';

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper disabled:opacity-50';

interface CampoProps {
  etiqueta: string;
  ayuda?: React.ReactNode;
  /** Recibe el id que debe llevar el control */
  children: (id: string) => React.ReactNode;
  className?: string;
}

/** Rótulo + control + ayuda con el id enlazado. */
export const Campo: React.FC<CampoProps> = ({ etiqueta, ayuda, children, className }) => {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-aurea-navy">
        {etiqueta}
      </label>
      {children(id)}
      {ayuda && <p className="text-xs text-aurea-navy/60">{ayuda}</p>}
    </div>
  );
};

export const CampoTexto = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(CLASE_CONTROL, className)} {...props} />
);
CampoTexto.displayName = 'CampoTexto';

export const CampoSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...props }) => (
  <select className={cn(CLASE_CONTROL, 'cursor-pointer', className)} {...props} />
);

const FORMAS: Array<{ valor: FormaMesa; etiqueta: string; glifo: string }> = [
  { valor: 'cuadrada', etiqueta: 'Cuadrada', glifo: 'w-4 h-4 rounded-md' },
  { valor: 'redonda', etiqueta: 'Redonda', glifo: 'w-4 h-4 rounded-full' },
  { valor: 'rectangular', etiqueta: 'Rectangular', glifo: 'w-6 h-3.5 rounded-sm' },
];

export const SelectorForma: React.FC<{ valor: FormaMesa; onCambiar: (forma: FormaMesa) => void }> = ({
  valor,
  onCambiar,
}) => (
  <div role="group" aria-label="Forma de la mesa" className="grid grid-cols-3 gap-2">
    {FORMAS.map((f) => {
      const activa = valor === f.valor;
      return (
        <button
          key={f.valor}
          type="button"
          aria-pressed={activa}
          onClick={() => onCambiar(f.valor)}
          className={cn(
            'min-h-tactil flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-sm font-semibold transition-colors',
            activa
              ? 'bg-aurea-champagne/50 border-aurea-copper text-aurea-navy shadow-sm'
              : 'bg-white border-aurea-champagne/70 text-aurea-navy/70 hover:border-aurea-copper/60'
          )}
        >
          <span
            className={cn('border-2', f.glifo, activa ? 'border-aurea-copper bg-white' : 'border-aurea-navy/30')}
            aria-hidden="true"
          />
          {f.etiqueta}
        </button>
      );
    })}
  </div>
);

interface ContadorCapacidadProps {
  valor: number;
  onCambiar: (valor: number) => void;
  /** Atajos de capacidad frecuentes */
  atajos?: number[];
}

export const ContadorCapacidad: React.FC<ContadorCapacidadProps> = ({ valor, onCambiar, atajos = [2, 4, 6, 8] }) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="flex items-center gap-2">
      <IconButton
        variant="outline"
        icono={Minus}
        etiqueta="Una persona menos"
        onClick={() => onCambiar(Math.max(1, valor - 1))}
        disabled={valor <= 1}
      />
      <span className="min-w-[6.5rem] text-center" aria-live="polite">
        <span className="font-serif text-2xl font-bold text-aurea-navy tabular-nums">{valor}</span>{' '}
        <span className="text-sm text-aurea-navy/60">personas</span>
      </span>
      <IconButton
        variant="outline"
        icono={Plus}
        etiqueta="Una persona más"
        onClick={() => onCambiar(Math.min(20, valor + 1))}
        disabled={valor >= 20}
      />
    </div>
    <div className="flex gap-1.5" role="group" aria-label="Capacidades frecuentes">
      {atajos.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={valor === c}
          onClick={() => onCambiar(c)}
          className={cn(
            'min-h-tactil min-w-[2.75rem] px-2 rounded-xl text-sm font-semibold border transition-colors',
            valor === c
              ? 'bg-aurea-navy border-aurea-navy text-white'
              : 'bg-white border-aurea-champagne/70 text-aurea-navy/70 hover:border-aurea-copper/60'
          )}
        >
          {c}
        </button>
      ))}
    </div>
  </div>
);

interface InterruptorUnionProps {
  activo: boolean;
  onCambiar: (activo: boolean) => void;
}

export const InterruptorUnion: React.FC<InterruptorUnionProps> = ({ activo, onCambiar }) => (
  <div className="p-4 rounded-xl border border-aurea-champagne/70 bg-aurea-ivory flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-aurea-navy">Se puede unir con otras mesas</p>
      <p className="text-sm text-aurea-navy/70 mt-0.5">Los mozos podrán juntarla para atender grupos.</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label="Se puede unir con otras mesas"
      onClick={() => onCambiar(!activo)}
      className="min-h-tactil min-w-tactil flex items-center justify-center shrink-0"
    >
      <span className={cn('relative inline-flex h-6 w-11 rounded-full transition-colors', activo ? 'bg-estado-ok-600' : 'bg-aurea-navy/20')}>
        <span
          className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', activo && 'translate-x-5')}
        />
      </span>
    </button>
  </div>
);

interface AvisoProps {
  tono: 'ok' | 'error';
  children: React.ReactNode;
  className?: string;
}

/** Mensaje en línea dentro de un formulario: error de validación o confirmación del impacto. */
export const AvisoFormulario: React.FC<AvisoProps> = ({ tono, children, className }) => {
  const Icono = tono === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tono === 'error' ? 'alert' : undefined}
      className={cn(
        'p-3 rounded-xl border text-sm flex items-start gap-2.5',
        tono === 'error'
          ? 'bg-estado-error-50 border-estado-error-200 text-estado-error-800'
          : 'bg-estado-ok-50 border-estado-ok-200 text-estado-ok-800',
        className
      )}
    >
      <Icono className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
};
