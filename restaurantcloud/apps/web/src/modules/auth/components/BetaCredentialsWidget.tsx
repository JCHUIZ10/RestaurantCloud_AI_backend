import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Copy, Check, Zap, X, Sparkles, Building2 } from 'lucide-react';
import { BETA_CREDENTIALS } from '../services/mockAuthService';
import type { BetaCredentialPreset } from '@/types/auth';

interface BetaCredentialsWidgetProps {
  onAutoFill: (correo: string, password: string) => void;
}

export const BetaCredentialsWidget: React.FC<BetaCredentialsWidgetProps> = ({ onAutoFill }) => {
  const [abierto, setAbierto] = useState<boolean>(false);
  const [copiadoKey, setCopiadoKey] = useState<string | null>(null);

  const handleCopy = (texto: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(texto);
    setCopiadoKey(key);
    setTimeout(() => setCopiadoKey(null), 2000);
  };

  const handleSelectPreset = (preset: BetaCredentialPreset) => {
    onAutoFill(preset.correo, preset.password);
  };

  return (
    <>
      {/* Botón Flotante Permanente */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAbierto(!abierto)}
        aria-label="Ver credenciales de prueba beta"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-aurea-navy text-white shadow-xl border-2 border-aurea-copper/60 hover:bg-opacity-95 transition-all text-xs font-semibold select-none group"
      >
        <span className="p-1 rounded-full bg-aurea-copper/20 text-aurea-champagne group-hover:rotate-12 transition-transform">
          <KeyRound className="w-4 h-4 text-aurea-copper" />
        </span>
        <span className="tracking-wide">Accesos Demo & Beta</span>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </motion.button>

      {/* Drawer / Modal Flotante */}
      <AnimatePresence>
        {abierto && (
          <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-end p-4 sm:p-6">
            {/* Backdrop clicable para cerrar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAbierto(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
            />

            {/* Contenedor del Drawer */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-lg max-h-[85vh] bg-[#FFF9F0] rounded-2xl sm:rounded-3xl border-2 border-aurea-copper/40 shadow-2xl overflow-hidden flex flex-col pointer-events-auto z-10"
            >
              {/* Cabecera del Drawer */}
              <div className="px-5 py-4 bg-aurea-navy text-white flex items-center justify-between border-b border-aurea-copper/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-aurea-copper/20 text-aurea-champagne">
                    <Sparkles className="w-4 h-4 text-aurea-copper" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold leading-tight">
                      Credenciales de Prueba Beta
                    </h3>
                    <p className="text-[11px] text-aurea-champagne/80 font-sans">
                      Haz clic en auto-llenar para probar cada rol en 1 toque
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAbierto(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Cerrar panel de credenciales"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista Scrollable de Presets */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-aurea-copper/15">
                {BETA_CREDENTIALS.map((preset) => {
                  const isCopiadoCorreo = copiadoKey === `${preset.correo}-user`;
                  const isCopiadoPass = copiadoKey === `${preset.correo}-pass`;

                  return (
                    <div
                      key={preset.correo}
                      className="pt-3 first:pt-0 group rounded-xl p-3 hover:bg-white/70 transition-all border border-transparent hover:border-aurea-copper/20"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}
                            >
                              {preset.rolLabel}
                            </span>
                            <span className="text-xs font-bold text-aurea-navy font-sans">
                              {preset.nombrePersona}
                            </span>
                          </div>
                          <p className="text-[11px] text-aurea-navy/70 leading-snug font-sans">
                            {preset.descripcion}
                          </p>
                        </div>

                        {/* Botón Primario de Auto-Llenado */}
                        <button
                          onClick={() => {
                            handleSelectPreset(preset);
                            setAbierto(false);
                          }}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aurea-navy hover:bg-aurea-navy/90 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 text-aurea-copper fill-aurea-copper" />
                          <span>Auto-llenar</span>
                        </button>
                      </div>

                      {/* Datos de acceso y botones de copiado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-aurea-copper/10 text-[11px]">
                        {/* Campo Correo */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white border border-aurea-copper/20">
                          <span className="font-mono text-aurea-navy truncate select-all">
                            {preset.correo}
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(preset.correo, `${preset.correo}-user`, e)
                            }
                            title="Copiar correo"
                            className="p-1 hover:text-aurea-navy text-aurea-navy/50 transition-colors shrink-0 ml-1"
                          >
                            {isCopiadoCorreo ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Campo Password */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white border border-aurea-copper/20">
                          <span className="font-mono text-aurea-navy truncate select-all">
                            {preset.password}
                          </span>
                          <button
                            onClick={(e) =>
                              handleCopy(preset.password, `${preset.correo}-pass`, e)
                            }
                            title="Copiar contraseña"
                            className="p-1 hover:text-aurea-navy text-aurea-navy/50 transition-colors shrink-0 ml-1"
                          >
                            {isCopiadoPass ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Destino de Redirección */}
                      <div className="flex items-center gap-1 text-[10px] text-aurea-copper font-medium mt-1.5">
                        <Building2 className="w-3 h-3" />
                        <span>Destino: {preset.destinoDashboard}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pie del Drawer */}
              <div className="p-3 bg-white/60 border-t border-aurea-copper/20 text-center text-[11px] text-aurea-navy/60">
                <span>RestaurantCloud AI • Plataforma Multi-Tenant Gastronómica</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
