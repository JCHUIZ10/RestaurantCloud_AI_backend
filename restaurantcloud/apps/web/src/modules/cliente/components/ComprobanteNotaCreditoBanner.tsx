import React from 'react';
import { Link } from 'react-router-dom';
import { FileMinus2, ArrowUpRight } from 'lucide-react';
import type { DocumentoAfectadoDTO } from '@/types/comprobante';

interface ComprobanteNotaCreditoBannerProps {
  documentoAfectado?: DocumentoAfectadoDTO | null;
}

/** Aviso que identifica el documento como Nota de Crédito y enlaza con el comprobante que modifica. */
export const ComprobanteNotaCreditoBanner: React.FC<ComprobanteNotaCreditoBannerProps> = ({
  documentoAfectado,
}) => {
  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
          <FileMinus2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-base sm:text-lg font-bold leading-tight">Nota de Crédito electrónica</h3>
          <p className="text-xs sm:text-sm text-amber-900/80 font-sans">
            {documentoAfectado
              ? 'Este documento deja sin efecto, total o parcialmente, el comprobante indicado.'
              : 'Este documento acredita el monto de un comprobante emitido anteriormente.'}
          </p>
        </div>
      </div>

      {documentoAfectado && (
        <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 space-y-2 text-xs sm:text-sm font-sans">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-amber-950">Documento que modifica:</span>
            <Link
              to={documentoAfectado.url_publica}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-mono font-bold transition-colors min-h-8"
            >
              {documentoAfectado.serie_numero}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="text-amber-900/85 space-y-0.5">
            <p>
              <span className="font-semibold">Tipo: </span>
              {documentoAfectado.tipo_label}
            </p>
            <p>
              <span className="font-semibold">Emitido: </span>
              {new Date(documentoAfectado.fecha).toLocaleDateString('es-PE')} •{' '}
              {new Date(documentoAfectado.fecha).toLocaleTimeString('es-PE')}
            </p>
            {documentoAfectado.motivo_codigo && (
              <p>
                <span className="font-semibold">Motivo SUNAT ({documentoAfectado.motivo_codigo}): </span>
                {documentoAfectado.motivo_texto}
              </p>
            )}
            {documentoAfectado.sustento && (
              <p className="italic pt-0.5 text-amber-950">"{documentoAfectado.sustento}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
