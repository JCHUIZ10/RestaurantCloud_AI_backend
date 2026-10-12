import { AlertTriangle } from 'lucide-react';
import type { NotaCreditoReferenciaDTO } from '@/types/comprobante';

interface ComprobanteAnuladoBannerProps {
  notaCredito?: NotaCreditoReferenciaDTO;
  serieNumeroComprobante: string;
}

export const ComprobanteAnuladoBanner: React.FC<ComprobanteAnuladoBannerProps> = ({
  notaCredito,
  serieNumeroComprobante,
}) => {
  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-3 shadow-sm select-none">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 border border-rose-200">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-rose-950 leading-tight">
            Este comprobante ha sido anulado
          </h3>
          <p className="text-xs text-rose-800/80 font-sans">
            El documento <span className="font-mono font-bold">{serieNumeroComprobante}</span> no tiene validez tributaria actual.
          </p>
        </div>
      </div>

      {notaCredito && (
        <div className="p-3.5 rounded-xl bg-white/80 border border-rose-200 space-y-1.5 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-rose-900">
              Modificado por Nota de Crédito:
            </span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {notaCredito.serie_numero}
            </span>
          </div>

          <div className="text-[11px] text-rose-800/80 space-y-0.5">
            <p>
              <span className="font-semibold">Fecha de anulación: </span>
              {new Date(notaCredito.fecha).toLocaleDateString('es-PE')} • {new Date(notaCredito.fecha).toLocaleTimeString('es-PE')}
            </p>
            <p>
              <span className="font-semibold">Motivo SUNAT ({notaCredito.motivo_codigo}): </span>
              {notaCredito.motivo_texto}
            </p>
            <p className="italic pt-0.5 text-rose-900">
              "{notaCredito.sustento}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
