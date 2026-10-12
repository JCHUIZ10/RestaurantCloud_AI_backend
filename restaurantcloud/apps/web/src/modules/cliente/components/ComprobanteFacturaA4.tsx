import React from 'react';
import { formatPEN } from '@/shared/utils';
import { QrCode } from 'lucide-react';
import type { ComprobantePublicoDTO } from '@/types/comprobante';

interface ComprobanteFacturaA4Props {
  comprobante: ComprobantePublicoDTO;
}

export const ComprobanteFacturaA4: React.FC<ComprobanteFacturaA4Props> = ({ comprobante }) => {
  const isAnulado = comprobante.estado === 'anulado';

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-aurea-copper/25 shadow-xl relative overflow-hidden select-none">
      {/* Marca de agua si está anulado */}
      {isAnulado && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-25deg] z-10">
          <span className="font-serif font-black text-8xl text-rose-500/10 tracking-widest border-8 border-rose-500/15 px-16 py-4 rounded-3xl">
            ANULADO
          </span>
        </div>
      )}

      {/* 1. Cabecera A4: Emisor a la izquierda, Cuadro Fiscal a la derecha */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b-2 border-aurea-copper/20 items-start">
        {/* Datos del Restaurante Emisor */}
        <div className="md:col-span-7 space-y-1.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy leading-tight">
            {comprobante.emisor.razon_social}
          </h1>
          <p className="text-xs text-aurea-navy/80 font-sans">
            {comprobante.emisor.direccion} • {comprobante.emisor.distrito}, {comprobante.emisor.ciudad}
          </p>
          <p className="text-xs text-aurea-navy/70 font-sans">
            Teléfono: +51 {comprobante.emisor.telefono} • Email: facturacion@{comprobante.emisor.slug_sede}.pe
          </p>
          <div className="pt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#FFF9F0] border border-aurea-copper/25 text-[11px] font-semibold text-aurea-copper">
              {comprobante.emisor.local_nombre}
            </span>
          </div>
        </div>

        {/* Cuadro Fiscal Oficial (R.U.C. • Tipo • Serie-Número) */}
        <div className="md:col-span-5 border-2 border-aurea-navy rounded-2xl p-4 text-center bg-[#FFF9F0]/60 space-y-1 shadow-sm">
          <span className="font-mono text-sm font-bold block text-aurea-navy">
            R.U.C. {comprobante.emisor.ruc}
          </span>
          <span className="font-serif text-base sm:text-lg font-bold block uppercase text-aurea-navy tracking-wide">
            {comprobante.tipo_label}
          </span>
          <span className={`font-mono text-lg sm:text-xl font-black block tracking-wider ${
            isAnulado ? 'line-through text-slate-400' : 'text-aurea-navy'
          }`}>
            Nº {comprobante.serie_numero}
          </span>
        </div>
      </div>

      {/* 2. Cuadro de Datos del Adquiriente / Comensal */}
      <div className="my-6 p-4 sm:p-5 rounded-2xl bg-[#FFF9F0] border border-aurea-copper/25 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
        <div className="space-y-1">
          <p className="text-aurea-navy/60 font-semibold uppercase text-[10px]">Señor(es):</p>
          <p className="font-bold text-sm text-aurea-navy">{comprobante.cliente.nombre}</p>
          {comprobante.cliente.direccion && (
            <p className="text-aurea-navy/70 leading-relaxed pt-0.5">{comprobante.cliente.direccion}</p>
          )}
        </div>

        <div className="space-y-1 md:text-right">
          {comprobante.cliente.tipo_documento && (
            <div>
              <span className="text-aurea-navy/60 font-semibold uppercase text-[10px]">
                {comprobante.cliente.tipo_documento}:{' '}
              </span>
              <span className="font-mono font-bold text-aurea-navy text-xs">
                {comprobante.cliente.numero_documento}
              </span>
            </div>
          )}
          <div>
            <span className="text-aurea-navy/60 font-semibold uppercase text-[10px]">Fecha Emisión: </span>
            <span className="font-mono text-aurea-navy font-medium">
              {new Date(comprobante.fecha_emision).toLocaleDateString('es-PE')} • {new Date(comprobante.fecha_emision).toLocaleTimeString('es-PE')}
            </span>
          </div>
          <div>
            <span className="text-aurea-navy/60 font-semibold uppercase text-[10px]">Moneda: </span>
            <span className="font-bold text-aurea-navy">Soles (PEN)</span>
          </div>
        </div>
      </div>

      {/* 3. Tabla Formal de Productos y Servicios */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b-2 border-aurea-navy text-aurea-navy uppercase text-[11px] font-bold">
              <th className="py-2.5 px-3">Código</th>
              <th className="py-2.5 px-3 text-center">Cant.</th>
              <th className="py-2.5 px-3">Descripción Culinaria</th>
              <th className="py-2.5 px-3 text-right">P. Unitario</th>
              <th className="py-2.5 px-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aurea-copper/15">
            {comprobante.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#FFF9F0]/40 transition-colors">
                <td className="py-3 px-3 font-mono text-[11px] text-aurea-navy/60">
                  {item.codigo || `ITM-${idx + 1}`}
                </td>
                <td className="py-3 px-3 font-bold text-center text-aurea-navy">
                  {item.cantidad}
                </td>
                <td className="py-3 px-3 text-aurea-navy font-medium">
                  {item.descripcion}
                </td>
                <td className="py-3 px-3 font-mono text-right text-aurea-navy/80">
                  {formatPEN(item.precio_unitario)}
                </td>
                <td className="py-3 px-3 font-sans font-bold text-right text-aurea-navy">
                  {formatPEN(item.importe_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Pie de Hoja A4: Código QR SUNAT + Liquidación */}
      <div className="mt-8 pt-6 border-t-2 border-aurea-copper/20 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        {/* QR y Validación Oficial */}
        <div className="md:col-span-7 flex items-center gap-4">
          <div className="w-16 h-16 bg-white p-1 rounded-xl border-2 border-aurea-copper/30 flex items-center justify-center shrink-0 shadow-inner">
            <QrCode className="w-14 h-14 text-aurea-navy" />
          </div>
          <div className="space-y-0.5 text-xs font-sans text-aurea-navy/75">
            <p className="font-bold text-aurea-navy text-sm">
              Comprobante de Pago Electrónico Autorizado
            </p>
            <p className="text-[11px] text-aurea-navy/60">
              Representación impresa oficial generada según resolución SUNAT.
            </p>
            <p className="text-[11px] text-aurea-copper font-medium pt-0.5">
              Medio de Pago: <span className="font-semibold text-aurea-navy">{comprobante.pago.metodo_nombre}</span>
            </p>
          </div>
        </div>

        {/* Desglose Numérico de Totales */}
        <div className="md:col-span-5 space-y-2 text-xs font-sans">
          <div className="flex justify-between text-aurea-navy/70">
            <span>Subtotal Consumo:</span>
            <span className="font-mono">{formatPEN(comprobante.totales.subtotal_consumo)}</span>
          </div>

          {comprobante.totales.descuento > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>{comprobante.totales.descuento_motivo || 'Descuento'}:</span>
              <span className="font-mono">- {formatPEN(comprobante.totales.descuento)}</span>
            </div>
          )}

          <div className="flex justify-between text-aurea-navy/70">
            <span>Operación Gravada:</span>
            <span className="font-mono">{formatPEN(comprobante.totales.base_imponible)}</span>
          </div>

          <div className="flex justify-between text-aurea-navy/70">
            <span>I.G.V. (18.00%):</span>
            <span className="font-mono">{formatPEN(comprobante.totales.igv)}</span>
          </div>

          <div className="pt-2 border-t-2 border-aurea-navy flex justify-between items-baseline text-aurea-navy">
            <span className="font-serif text-base font-bold">TOTAL A PAGAR:</span>
            <span className="font-sans text-2xl font-black text-aurea-navy">
              {formatPEN(comprobante.totales.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
