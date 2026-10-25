import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TipoComprobanteCompra, MetodoPagoCompra } from '@/types/admin';
import { cn } from '@/shared/utils';
import { METODOS_PAGO, TIPOS_COMPROBANTE } from './formatoCompra';

const CLASE_TAG = 'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap';

export const TagComprobante: React.FC<{ tipo: TipoComprobanteCompra }> = ({ tipo }) => {
  const t = TIPOS_COMPROBANTE[tipo] ?? { label: tipo, clase: TIPOS_COMPROBANTE.RECIBO.clase };
  return <span className={cn(CLASE_TAG, t.clase)}>{t.label}</span>;
};

export const TagPago: React.FC<{ metodo: MetodoPagoCompra }> = ({ metodo }) => {
  const m = METODOS_PAGO[metodo] ?? { label: metodo, clase: TIPOS_COMPROBANTE.RECIBO.clase };
  return <span className={cn(CLASE_TAG, m.clase)}>{m.label}</span>;
};

/** Variación del precio frente al costo anterior: subir es malo (rojo), bajar es bueno (verde). */
export const VariacionCosto: React.FC<{ porcentaje: number }> = ({ porcentaje }) => {
  if (Math.abs(porcentaje) < 0.05) return <span className="text-xs text-aurea-navy/40">Igual</span>;
  const sube = porcentaje > 0;
  const Icono = sube ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-semibold tabular-nums whitespace-nowrap',
        sube
          ? 'bg-estado-error-50 text-estado-error-700 border-estado-error-200'
          : 'bg-estado-ok-50 text-estado-ok-700 border-estado-ok-200'
      )}
    >
      <Icono className="w-3 h-3" aria-hidden="true" />
      {sube ? '+' : ''}
      {porcentaje.toFixed(1)}%
    </span>
  );
};
