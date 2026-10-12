import React, { useState } from 'react';
import { CuotaMesasPlanDTO, CrearPisoRequest } from '@/types/admin';
import { X, Layers, AlertCircle, Check } from 'lucide-react';

interface ModalNuevoPisoProps {
  cuota: CuotaMesasPlanDTO;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CrearPisoRequest) => Promise<void>;
}

export const ModalNuevoPiso: React.FC<ModalNuevoPisoProps> = ({
  cuota,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [columnas, setColumnas] = useState(4);
  const [filas, setFilas] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const excedePisos = cuota.pisos_activos_empresa >= cuota.max_pisos_plan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || excedePisos) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        nombre: nombre.trim(),
        columnas,
        filas,
      });
      setNombre('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-aurea-copper/30 overflow-hidden">
        {/* Cabecera */}
        <div className="p-6 bg-aurea-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center">
              <Layers className="w-5 h-5 text-aurea-champagne" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">Registrar Nuevo Ambiente</h3>
              <p className="text-xs text-white/70">
                Pisos o secciones físicas independientes en tu local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {excedePisos ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Límite de Ambientes Alcanzado:</span> Tu plan actual permite
                hasta {cuota.max_pisos_plan} ambientes físicos en la sede. Contacta a gerencia para
                ampliar tu plan.
              </div>
            </div>
          ) : (
            <div className="text-xs text-aurea-navy/60">
              Actualmente tienes {cuota.pisos_activos_empresa} de {cuota.max_pisos_plan} ambientes
              permitidos en tu suscripción.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1.5">
              Nombre del Ambiente
            </label>
            <input
              type="text"
              required
              disabled={excedePisos}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Mezzanine VIP, Terraza 2do Piso"
              className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-copper/40 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                Columnas iniciales
              </label>
              <input
                type="number"
                min="1"
                max="12"
                disabled={excedePisos}
                value={columnas}
                onChange={(e) => setColumnas(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-aurea-copper/40 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider mb-1">
                Filas iniciales
              </label>
              <input
                type="number"
                min="1"
                max="10"
                disabled={excedePisos}
                value={filas}
                onChange={(e) => setFilas(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-aurea-copper/40 text-sm text-aurea-navy focus:outline-none focus:ring-2 focus:ring-aurea-copper disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-aurea-copper/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-aurea-copper/40 text-aurea-navy hover:bg-aurea-champagne/20 text-xs sm:text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || excedePisos || !nombre.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-navy text-white hover:bg-aurea-navy/90 text-xs sm:text-sm font-semibold transition-all shadow-md disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-aurea-champagne" />
              <span>{isSubmitting ? 'Registrando...' : 'Crear Ambiente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
