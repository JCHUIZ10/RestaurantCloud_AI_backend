import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, MessageCircle, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes.constants';

interface ComprobanteZeroDeadEndProps {
  onBuscarCodigo: (codigo: string) => void;
  mensajeError?: string | null;
  modoInicial?: boolean;
}

export const ComprobanteZeroDeadEnd: React.FC<ComprobanteZeroDeadEndProps> = ({
  onBuscarCodigo,
  mensajeError,
  modoInicial = false,
}) => {
  const [codigoInput, setCodigoInput] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoInput.trim()) {
      onBuscarCodigo(codigoInput.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 border-2 border-aurea-copper/25 shadow-xl space-y-6 text-center select-none"
    >
      {/* Icono Principal */}
      <div className="w-16 h-16 rounded-2xl bg-[#FFF9F0] border-2 border-aurea-copper/40 text-aurea-navy flex items-center justify-center mx-auto shadow-sm">
        <Search className="w-8 h-8 text-aurea-copper" />
      </div>

      {/* Textos Informativos */}
      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold leading-tight">
          Consultar Comprobante
        </h2>
        <p className="font-sans text-xs sm:text-sm text-aurea-navy/70 leading-relaxed max-w-sm mx-auto">
          {modoInicial
            ? 'Ingresa el código o serie-número recibido en tu consumo para consultar y descargar tu boleta o factura:'
            : mensajeError ||
              'No encontramos un comprobante con el enlace suministrado. Si cuentas con el código de tu ticket, ingrésalo a continuación:'}
        </p>
      </div>

      {/* Formulario de Búsqueda por Código */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value)}
            placeholder="Ej: B001-0012894 o token-boleta-demo"
            className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#FFF9F0]/60 border-2 border-aurea-copper/25 text-sm font-mono text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 transition-all text-center"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-3 rounded-lg bg-aurea-navy text-white hover:bg-aurea-navy/90 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Buscar comprobante"
          >
            <Search className="w-4 h-4 text-aurea-copper" />
          </button>
        </div>

        <p className="text-[11px] text-aurea-navy/50 font-sans">
          Prueba con los demos: <span className="font-mono font-bold text-aurea-copper">B001-0012894</span> o <span className="font-mono font-bold text-aurea-copper">F001-0004521</span>
        </p>
      </form>

      {/* Nota de Privacidad y Anti-Scraping */}
      <div className="p-3.5 rounded-xl bg-[#FFF9F0] border border-aurea-copper/20 text-left flex items-start gap-3 text-xs font-sans">
        <ShieldAlert className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
        <div className="text-[11px] text-aurea-navy/70 leading-relaxed">
          <span className="font-bold text-aurea-navy">Protección de Datos del Comensal: </span>
          Por seguridad y estricta privacidad, los comprobantes solo se consultan mediante su código único o enlace directo QR. No se permite la búsqueda masiva por DNI o RUC.
        </div>
      </div>

      {/* Alternativas y Contacto */}
      <div className="pt-4 border-t border-aurea-copper/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <a
          href="https://wa.me/51987654321"
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Ayuda por WhatsApp</span>
        </a>

        <Link
          to={ROUTES.CARTA_DEMO}
          className="py-2.5 px-3 rounded-xl bg-white hover:bg-aurea-champagne/20 text-aurea-navy border border-aurea-copper/30 font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Utensils className="w-4 h-4 text-aurea-copper" />
          <span>Carta Digital ÁUREA</span>
        </Link>
      </div>
    </motion.div>
  );
};
