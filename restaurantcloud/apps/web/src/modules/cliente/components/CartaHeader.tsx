import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Clock, MapPin } from 'lucide-react';
import type { SedePublicaInfoDTO } from '@/types/carta';

interface CartaHeaderProps {
  sede: SedePublicaInfoDTO;
}

export const CartaHeader: React.FC<CartaHeaderProps> = ({ sede }) => {
  const whatsappUrl = `https://wa.me/51${sede.telefono}?text=Hola%20${encodeURIComponent(sede.nombre)},%20tengo%20una%20consulta%20desde%20mi%20mesa.`;
  const telUrl = `tel:+51${sede.telefono}`;

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white border-2 border-aurea-copper/25 shadow-sm space-y-3">
      {/* Información de Identidad de la Sede */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold leading-tight">
              {sede.nombre}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-aurea-navy/70 font-sans">
            <MapPin className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
            <span>{sede.direccion} • {sede.distrito}</span>
          </div>
        </div>

        {/* Badge de Horario y Estado Operativo */}
        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Abierto hoy</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-aurea-navy/60 font-mono mt-1 justify-end">
            <Clock className="w-3 h-3 text-aurea-copper" />
            <span>{sede.horario}</span>
          </div>
        </div>
      </div>

      {/* Botones de Contacto Rápido Directo */}
      <div className="pt-2 border-t border-aurea-copper/15 flex items-center gap-2">
        <motion.a
          whileTap={{ scale: 0.96 }}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Consultar por WhatsApp</span>
        </motion.a>

        <motion.a
          whileTap={{ scale: 0.96 }}
          href={telUrl}
          className="py-2 px-3.5 rounded-xl bg-aurea-champagne/40 hover:bg-aurea-champagne/60 text-aurea-navy border border-aurea-copper/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Llamar</span>
        </motion.a>
      </div>
    </div>
  );
};
