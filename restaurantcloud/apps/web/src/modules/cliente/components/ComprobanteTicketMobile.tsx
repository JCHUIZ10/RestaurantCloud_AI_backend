import React from 'react';
import { motion } from 'framer-motion';
import { Download, MessageCircle, Copy, Utensils, CheckCircle2, QrCode } from 'lucide-react';
import { formatPEN } from '@/shared/utils';
import type { ComprobantePublicoDTO } from '@/types/comprobante';

interface ComprobanteTicketMobileProps {
  comprobante: ComprobantePublicoDTO;
  onCopiarEnlace: () => void;
  enlaceCopiado: boolean;
}

export const ComprobanteTicketMobile: React.FC<ComprobanteTicketMobileProps> = ({
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
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Tarjeta Tipo Ticket Térmico Digital */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-aurea-copper/25 shadow-xl space-y-5 relative overflow-hidden select-none">
        {/* Marca de agua si está anulado */}
        {isAnulado && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-30deg] z-10">
            <span className="font-serif font-black text-6xl text-rose-500/15 tracking-widest border-4 border-rose-500/20 px-8 py-2 rounded-2xl">
              ANULADO
            </span>
          </div>
        )}

        {/* 1. Cabecera del Emisor */}
        <div className="text-center space-y-1 pb-4 border-b border-dashed border-aurea-copper/30">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-aurea-navy leading-tight">
            {comprobante.emisor.razon_social}
          </h2>
          <p className="font-mono text-xs text-aurea-navy/80 font-bold">
            R.U.C. {comprobante.emisor.ruc}
          </p>
          <p className="text-xs text-aurea-navy/70 font-sans">
            {comprobante.emisor.direccion} • {comprobante.emisor.distrito}
          </p>
          <p className="text-xs text-aurea-navy/60 font-sans">
            Tel: +51 {comprobante.emisor.telefono}
          </p>
        </div>

        {/* 2. Datos del Comprobante */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-aurea-copper/15 text-xs">
          <div>
            <span className="font-bold block text-aurea-navy uppercase tracking-wider text-[11px]">
              {comprobante.tipo_label}
            </span>
            <span className={`font-mono text-base font-black ${isAnulado ? 'line-through text-slate-400' : 'text-aurea-navy'}`}>
              {comprobante.serie_numero}
            </span>
            <span className="text-[11px] text-aurea-navy/60 block mt-0.5">
              Fecha: {new Date(comprobante.fecha_emision).toLocaleDateString('es-PE')} • {new Date(comprobante.fecha_emision).toLocaleTimeString('es-PE')}
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isAnulado
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isAnulado ? '✕ ANULADO' : '✓ EMITIDO'}
            </span>
            {comprobante.cliente.mesa_codigo && (
              <span className="text-[11px] text-aurea-copper font-medium block mt-1">
                {comprobante.cliente.mesa_codigo}
              </span>
            )}
          </div>
        </div>

        {/* 3. Datos del Cliente / Adquiriente */}
        <div className="p-3 rounded-xl bg-[#FFF9F0] border border-aurea-copper/20 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-aurea-navy/60">
              Cliente
            </span>
            {comprobante.cliente.tipo_documento && (
              <span className="font-mono text-[10px] font-bold text-aurea-copper">
                {comprobante.cliente.tipo_documento}: {comprobante.cliente.numero_documento}
              </span>
            )}
          </div>
          <p className="font-sans font-bold text-aurea-navy truncate">
            {comprobante.cliente.nombre}
          </p>
          {comprobante.cliente.direccion && (
            <p className="text-[11px] text-aurea-navy/70 leading-tight">
              {comprobante.cliente.direccion}
            </p>
          )}
        </div>

        {/* 4. Desglose de Ítems */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-aurea-navy/60 uppercase border-b pb-1 border-aurea-copper/15">
            <span>Cant / Descripción</span>
            <span>Importe</span>
          </div>

          <div className="space-y-2.5 divide-y divide-aurea-copper/10">
            {comprobante.items.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-sans font-semibold text-aurea-navy leading-snug">
                    <span className="font-bold text-aurea-copper mr-1.5">{item.cantidad}x</span>
                    {item.descripcion}
                  </p>
                  <span className="text-[10px] text-aurea-navy/50 font-mono">
                    P. Unit: {formatPEN(item.precio_unitario)}
                  </span>
                </div>
                <span className="font-sans font-bold text-aurea-navy shrink-0">
                  {formatPEN(item.importe_total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Liquidación Financiera y Totales */}
        <div className="pt-3 border-t-2 border-dashed border-aurea-copper/30 space-y-1.5 text-xs">
          <div className="flex justify-between text-aurea-navy/70">
            <span>Subtotal Consumo:</span>
            <span>{formatPEN(comprobante.totales.subtotal_consumo)}</span>
          </div>

          {comprobante.totales.descuento > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>{comprobante.totales.descuento_motivo || 'Descuento Aplicado'}:</span>
              <span>- {formatPEN(comprobante.totales.descuento)}</span>
            </div>
          )}

          <div className="flex justify-between text-aurea-navy/70">
            <span>Op. Gravada:</span>
            <span>{formatPEN(comprobante.totales.base_imponible)}</span>
          </div>

          <div className="flex justify-between text-aurea-navy/70">
            <span>I.G.V. (18.00%):</span>
            <span>{formatPEN(comprobante.totales.igv)}</span>
          </div>

          <div className="pt-2 border-t border-aurea-copper/20 flex justify-between items-baseline text-aurea-navy">
            <span className="font-serif text-base font-bold">TOTAL PAGADO:</span>
            <span className="font-sans text-xl font-black text-aurea-navy">
              {formatPEN(comprobante.totales.total)}
            </span>
          </div>

          {/* Medio de pago */}
          <div className="pt-1 text-[11px] text-aurea-copper font-medium text-center">
            Medio de pago: {comprobante.pago.metodo_nombre}
            {comprobante.pago.numero_operacion && ` • Op. #${comprobante.pago.numero_operacion}`}
          </div>
        </div>

        {/* 6. Footer con Código QR de Verificación Oficial */}
        <div className="pt-3 border-t border-aurea-copper/15 flex items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 bg-white p-1 rounded-lg border border-aurea-copper/30 flex items-center justify-center shadow-inner">
            <QrCode className="w-10 h-10 text-aurea-navy" />
          </div>
          <div className="text-left text-[11px] text-aurea-navy/70 font-sans space-y-0.5">
            <p className="font-semibold text-aurea-navy">Comprobante Electrónico Autorizado</p>
            <p className="text-[10px] text-aurea-copper">Representación impresa oficial para fines tributarios</p>
          </div>
        </div>
      </div>

      {/* Botones de Acción Móviles */}
      <div className="space-y-2.5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadPdf}
          disabled={!pdfDisponible}
          className="w-full py-3 px-4 rounded-xl bg-aurea-navy hover:bg-aurea-navy/95 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4 text-aurea-copper" />
          <span>{pdfDisponible ? 'Descargar Comprobante PDF Oficial' : 'PDF en generación'}</span>
        </motion.button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={onCopiarEnlace}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-aurea-champagne/20 text-aurea-navy border border-aurea-copper/30 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {enlaceCopiado ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-aurea-copper" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>
        </div>

        {/* Re-enganche Comercial Directo */}
        <a
          href={comprobante.url_carta_digital}
          className="w-full py-2.5 px-4 rounded-xl bg-aurea-champagne/35 hover:bg-aurea-champagne/50 text-aurea-navy border border-aurea-copper/30 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Utensils className="w-4 h-4 text-aurea-copper" />
          <span>Explorar Carta Digital del Restaurante</span>
        </a>
      </div>
    </div>
  );
};
