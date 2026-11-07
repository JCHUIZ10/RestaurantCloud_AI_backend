import React from 'react';
import { Banknote, Ban, CheckCircle2, FileMinus2 } from 'lucide-react';
import type { ComprobanteHistorialItemDTO, MedioPagoCodigo } from '@/types/caja';
import { ICONOS_MEDIO_PAGO, NOMBRES_MEDIO_DEFECTO } from './comprobanteFormato';

interface MedioPagoChipProps {
  medio: MedioPagoCodigo;
  nombre?: string;
  numeroOperacion?: string | null;
}

/** Medio de pago con su ícono y, si existe, el N° de operación (Yape / Plin). */
export const MedioPagoChip: React.FC<MedioPagoChipProps> = ({ medio, nombre, numeroOperacion }) => {
  const Icono = ICONOS_MEDIO_PAGO[medio] ?? Banknote;

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
        <Icono className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
        {nombre || NOMBRES_MEDIO_DEFECTO[medio]}
      </span>
      {numeroOperacion && (
        <span className="pl-1 text-xs font-mono text-slate-500">Op. {numeroOperacion}</span>
      )}
    </span>
  );
};

interface EstadoFiscalBadgeProps {
  comprobante: ComprobanteHistorialItemDTO;
}

/**
 * Estado fiscal del comprobante. Una nota de crédito no es "vigente" ni "anulada": se muestra
 * como NC junto al documento que modifica, para no confundirla con una venta.
 */
export const EstadoFiscalBadge: React.FC<EstadoFiscalBadgeProps> = ({ comprobante }) => {
  if (comprobante.tipo_comprobante === 'nota_credito') {
    return (
      <div className="inline-flex flex-col items-center gap-0.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
          <FileMinus2 className="w-3 h-3" aria-hidden="true" />
          NOTA DE CRÉDITO
        </span>
        {comprobante.documento_modificado && (
          <span className="text-xs text-amber-700 font-mono">Anula {comprobante.documento_modificado}</span>
        )}
      </div>
    );
  }

  if (comprobante.estado === 'anulado') {
    return (
      <div className="inline-flex flex-col items-center gap-0.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold">
          <Ban className="w-3 h-3" aria-hidden="true" />
          ANULADO
        </span>
        {comprobante.nota_credito_serie_numero && (
          <span className="text-xs text-rose-600 font-mono">Por {comprobante.nota_credito_serie_numero}</span>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
      EMITIDO
    </span>
  );
};

