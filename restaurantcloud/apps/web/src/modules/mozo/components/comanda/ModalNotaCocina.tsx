import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Check, AlertCircle } from 'lucide-react';
import { ItemPedidoBorrador } from '@/types/mozo';

interface ModalNotaCocinaProps {
  item: ItemPedidoBorrador | null;
  abierto: boolean;
  onCerrar: () => void;
  onGuardarNota: (itemId: string, nota: string | null) => void;
}

export const ModalNotaCocina: React.FC<ModalNotaCocinaProps> = ({
  item,
  abierto,
  onCerrar,
  onGuardarNota,
}) => {
  const [habilitada, setHabilitada] = useState<boolean>(false);
  const [textoNota, setTextoNota] = useState<string>('');

  useEffect(() => {
    if (item) {
      if (item.nota_cocina && item.nota_cocina.trim() !== '') {
        setHabilitada(true);
        setTextoNota(item.nota_cocina);
      } else {
        setHabilitada(false);
        setTextoNota('');
      }
    }
  }, [item, abierto]);

  if (!abierto || !item) return null;

  const handleGuardar = () => {
    if (habilitada && textoNota.trim()) {
      onGuardarNota(item.id, textoNota.trim());
    } else {
      // Semántica NULL nativa: sin nota para cocina
      onGuardarNota(item.id, null);
    }
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up">
        {/* Cabecera del modal */}
        <div className="p-4 bg-aurea-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-aurea-copper" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Nota para Cocina</h2>
              <p className="text-[11px] text-slate-300 font-sans">
                {item.nombre} · S/ {item.precio_unitario.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Checkbox de habilitación (Semántica NULL nativa) */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none hover:bg-slate-100/70 transition-colors">
            <input
              type="checkbox"
              checked={habilitada}
              onChange={(e) => setHabilitada(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-aurea-navy focus:ring-aurea-copper accent-aurea-navy cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Habilitar nota para el equipo de cocina
              </span>
              <span className="text-[11px] text-slate-500">
                Desmarca la casilla si el cliente no requiere personalización (se registrará como valor NULL).
              </span>
            </div>
          </label>

          {/* Textarea de la nota */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Indicación de preparación:
            </label>
            <textarea
              rows={3}
              maxLength={200}
              disabled={!habilitada}
              value={textoNota}
              onChange={(e) => setTextoNota(e.target.value)}
              placeholder="Ej: Término 3/4, sin cebolla, salsa aparte, bien cocido..."
              className={`w-full p-3 rounded-xl text-xs sm:text-sm border transition-all resize-none ${
                habilitada
                  ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-aurea-copper/40 focus:border-aurea-copper'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-slate-400" />
                Esta nota se reflejará en el monitor KDS.
              </span>
              <span>{textoNota.length} / 200</span>
            </div>
          </div>
        </div>

        {/* Pie de acciones */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleGuardar}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-aurea-navy hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5 text-aurea-copper" />
            <span>✓ Guardar Nota</span>
          </button>
        </div>
      </div>
    </div>
  );
};
