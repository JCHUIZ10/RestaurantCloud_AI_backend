import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info, MessageCircle } from 'lucide-react';
import { formatPEN } from '@/shared/utils';
import type { ProductoPublicoDTO } from '@/types/carta';

interface PlatoModalProps {
  plato: ProductoPublicoDTO | null;
  onClose: () => void;
  telefonoSede?: string;
}

export const PlatoModal: React.FC<PlatoModalProps> = ({ plato, onClose, telefonoSede }) => {
  if (!plato) return null;

  const isAgotado = plato.disponibilidad === 'agotado';
  const whatsappUrl = `https://wa.me/51${telefonoSede || '987654321'}?text=Hola,%20quisiera%20consultar%20sobre%20el%20plato%20${encodeURIComponent(plato.nombre)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Fondo oscuro con desenfoque de cristal (Backdrop blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Contenedor del Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto border-t sm:border-2 border-aurea-copper/40 flex flex-col"
        >
          {/* Botón de cierre superior flotante */}
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Fotografía HD en la parte superior */}
          {plato.foto_url && (
            <div className="relative w-full h-56 sm:h-64 shrink-0 bg-aurea-navy overflow-hidden">
              <img
                src={plato.foto_url}
                alt={plato.nombre}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Badges superiores sobre la imagen */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  {isAgotado && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1 shadow-md">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Agotado por hoy
                    </span>
                  )}
                </div>

                <span className="font-sans font-bold text-2xl text-aurea-champagne drop-shadow-md">
                  {formatPEN(plato.precio)}
                </span>
              </div>
            </div>
          )}

          {/* Cuerpo y Ficha del Plato */}
          <div className="p-6 space-y-5 flex-1">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl text-aurea-navy font-bold leading-tight">
                {plato.nombre}
              </h2>
              {!plato.foto_url && (
                <span className="font-sans font-bold text-2xl text-aurea-navy block pt-1">
                  {formatPEN(plato.precio)}
                </span>
              )}
            </div>

            {/* Descripción Culinaria Real de la BD */}
            {plato.descripcion && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-aurea-copper uppercase tracking-wider block">
                  Descripción & Elaboración
                </span>
                <p className="font-sans text-sm text-aurea-navy/80 leading-relaxed">
                  {plato.descripcion}
                </p>
              </div>
            )}

            {/* AVISO CLAVE DE SALÓN: CERO PEDIDO AUTÓNOMO */}
            <div className="p-4 rounded-2xl bg-aurea-ivory border-2 border-aurea-copper/30 space-y-2">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-aurea-copper shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-aurea-navy/80 font-sans">
                  <p className="font-semibold text-aurea-navy text-sm">
                    {isAgotado
                      ? 'Este plato se encuentra agotado en cocina'
                      : '¿Deseas ordenar este plato?'}
                  </p>
                  <p>
                    {isAgotado
                      ? 'Nuestra cocina ha pausado temporalmente este producto por falta de insumos frescos. Te sugerimos revisar las demás opciones de la carta.'
                      : 'Pídeselo directamente al mozo de tu mesa cuando se acerque a atenderte. No requieres realizar ningún pago en este catálogo.'}
                  </p>
                </div>
              </div>

              {/* Botón de consulta rápida por WhatsApp si el comensal tiene dudas */}
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Consultar detalles al local por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Botón de Retorno */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-aurea-navy text-aurea-ivory font-semibold text-sm hover:bg-opacity-90 transition-all shadow-md"
            >
              ← Volver a la Carta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
