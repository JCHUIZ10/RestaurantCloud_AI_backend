import React from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check } from 'lucide-react';
import type { ComprobantePublicoDTO } from '@/types/comprobante';

interface ComprobanteSidebarDesktopProps {
  comprobante: ComprobantePublicoDTO;
  onCopiarEnlace: () => void;
  enlaceCopiado: boolean;
}

export const ComprobanteSidebarDesktop: React.FC<ComprobanteSidebarDesktopProps> = ({
  comprobante,
  onCopiarEnlace,
  enlaceCopiado,
}) => {
  const isAnulado = comprobante.estado === 'anulado';
  const pdfDisponible = comprobante.documento_digital?.pdf_disponible ?? true;
  const urlPdf = comprobante.documento_digital?.url_descarga_pdf;

  const handleDownloadPdf = () => {
    if (urlPdf) {
      window.open(urlPdf, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!comprobante.documento_digital) {
      window.print();
    }
  };

  return (
    <aside className="space-y-5 lg:sticky lg:top-20">
      {/* 1. Card de Estado del Comprobante */}
      <div className="bg-white rounded-3xl p-5 border-2 border-aurea-copper/25 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-aurea-navy font-serif">
            Estado del Documento
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              isAnulado
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAnulado ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span>{isAnulado ? 'Comprobante Anulado' : 'Comprobante Emitido'}</span>
          </span>
        </div>

        <p className="text-xs text-aurea-navy/70 leading-relaxed font-sans">
          {isAnulado
            ? 'Este comprobante fue modificado por una Nota de Crédito tributaria.'
            : 'Comprobante validado electrónicamente. Documento oficial listo para descarga.'}
        </p>
      </div>

      {/* 2. Panel de Descargas Oficiales */}
      <div className="bg-white rounded-3xl p-5 border-2 border-aurea-copper/25 shadow-sm space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-aurea-navy font-serif block">
          Descargar & Archivar
        </span>

        <div className="space-y-2">
          {/* Botón Descargar PDF */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPdf}
            disabled={!pdfDisponible}
            className="w-full py-3 px-4 rounded-xl bg-aurea-navy hover:bg-aurea-navy/95 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-aurea-copper" />
            <span>{pdfDisponible ? 'Descargar PDF Oficial' : 'PDF en generación'}</span>
          </motion.button>
        </div>

        {/* Enlace Permanente y Copiado */}
        <div className="pt-2 border-t border-aurea-copper/15 space-y-1.5">
          <span className="text-[11px] text-aurea-navy/60 font-semibold block">
            Enlace permanente del comprobante:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFF9F0] border border-aurea-copper/20 text-[11px] font-mono text-aurea-navy/80 select-all"
            />
            <button
              onClick={onCopiarEnlace}
              className="p-2 rounded-lg bg-white border border-aurea-copper/30 text-aurea-navy hover:bg-aurea-champagne/20 transition-colors shrink-0 cursor-pointer"
              title="Copiar enlace"
            >
              {enlaceCopiado ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-aurea-copper" />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
