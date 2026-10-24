import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileCode, Copy, MessageCircle, Utensils, Clock, Check } from 'lucide-react';
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
  const whatsappUrl = `https://wa.me/51${comprobante.emisor.telefono}?text=Hola%20${encodeURIComponent(
    comprobante.emisor.razon_social
  )},%20tengo%20una%20consulta%20sobre%20mi%20comprobante%20${comprobante.serie_numero}.`;

  const handleDownloadXML = () => {
    if (comprobante.documento_digital) {
      return;
    }

    // Generar y descargar string mock de XML UBL 2.1
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${comprobante.serie_numero}</ID>
  <IssueDate>${comprobante.fecha_emision.slice(0, 10)}</IssueDate>
  <AccountingSupplierParty>
    <PartyTaxScheme>
      <CompanyID>${comprobante.emisor.ruc}</CompanyID>
      <RegistrationName>${comprobante.emisor.razon_social}</RegistrationName>
    </PartyTaxScheme>
  </AccountingSupplierParty>
  <LegalMonetaryTotal>
    <PayableAmount currencyID="PEN">${comprobante.totales.total.toFixed(2)}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comprobante.emisor.ruc}-${comprobante.tipo === 'factura' ? '01' : '03'}-${comprobante.serie_numero}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            : 'Comprobante validado electrónicamente. Archivos oficiales listos para descarga.'}
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

          {/* Botón Descargar XML (UBL 2.1) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadXML}
            disabled={Boolean(comprobante.documento_digital)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FFF9F0] hover:bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/30 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-aurea-copper" />
            <span>Descargar XML Electrónico (UBL 2.1)</span>
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

      {/* 3. Información del Restaurante y Re-enganche */}
      <div className="bg-white rounded-3xl p-5 border-2 border-aurea-copper/25 shadow-sm space-y-3 font-sans">
        <span className="text-xs font-bold uppercase tracking-wider text-aurea-navy font-serif block">
          Restaurante & Sede
        </span>

        <div className="space-y-1 text-xs">
          <p className="font-bold text-aurea-navy">{comprobante.emisor.local_nombre}</p>
          <p className="text-aurea-navy/70">{comprobante.emisor.direccion}</p>
          <div className="flex items-center gap-1 text-[11px] text-aurea-copper pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{comprobante.emisor.horario}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-aurea-copper/15 space-y-2">
          {/* Enlace a la Carta Digital */}
          <a
            href={comprobante.url_carta_digital}
            className="w-full py-2.5 px-3 rounded-xl bg-aurea-champagne/35 hover:bg-aurea-champagne/60 text-aurea-navy border border-aurea-copper/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Utensils className="w-4 h-4 text-aurea-copper" />
            <span>Explorar Carta Digital del Local</span>
          </a>

          {/* Enlace WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Contactar por WhatsApp</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
