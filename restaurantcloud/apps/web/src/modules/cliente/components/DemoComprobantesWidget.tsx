import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Check, Sparkles, X, ArrowRight } from 'lucide-react';
import { DEMO_COMPROBANTES } from '../services/mockComprobanteService';

interface DemoComprobantesWidgetProps {
  onSelectToken: (token: string) => void;
  tokenActual: string;
}

export const DemoComprobantesWidget: React.FC<DemoComprobantesWidgetProps> = ({
  onSelectToken,
  tokenActual,
}) => {
  const [abierto, setAbierto] = useState<boolean>(false);

  return (
    <>
      {/* Botón Flotante en Pantalla */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAbierto(!abierto)}
        aria-label="Ver comprobantes electrónicos de prueba"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-aurea-navy text-white shadow-xl border-2 border-aurea-copper/60 hover:bg-opacity-95 transition-all text-xs font-semibold select-none group cursor-pointer"
      >
        <span className="p-1 rounded-full bg-aurea-copper/20 text-aurea-champagne group-hover:rotate-12 transition-transform">
          <Receipt className="w-4 h-4 text-aurea-copper" />
        </span>
        <span className="tracking-wide">Comprobantes Demo</span>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </motion.button>

      {/* Modal / Popover Flotante */}
      <AnimatePresence>
        {abierto && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-end p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAbierto(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 35, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#FFF9F0] rounded-2xl sm:rounded-3xl border-2 border-aurea-copper/40 shadow-2xl overflow-hidden flex flex-col pointer-events-auto z-10"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-aurea-navy text-white flex items-center justify-between border-b border-aurea-copper/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-aurea-copper" />
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold leading-tight">
                      Comprobantes de Prueba
                    </h3>
                    <p className="text-[11px] text-aurea-champagne/80 font-sans">
                      Alterna escenarios fiscales en 1 toque
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAbierto(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Presets */}
              <div className="p-4 space-y-2.5">
                {DEMO_COMPROBANTES.map((item) => {
                  const isSelected = tokenActual === item.token;

                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        onSelectToken(item.token);
                        setAbierto(false);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-aurea-copper bg-white shadow-sm'
                          : 'border-aurea-copper/20 hover:border-aurea-copper/50 hover:bg-white/70 bg-white/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <p className="text-xs text-aurea-navy/70 line-clamp-1 font-sans">
                          {item.descripcion}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-full bg-aurea-navy/5 text-aurea-navy/50 group-hover:text-aurea-navy">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 bg-white/50 border-t border-aurea-copper/15 text-center text-[10px] text-aurea-navy/60 font-sans">
                Cumplimiento UBL 2.1 SUNAT • RestaurantCloud AI
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
