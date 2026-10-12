import React from 'react';
import { AlertTriangle, X, Check, RefreshCw } from 'lucide-react';
import { ConflictoStockDTO } from '@/types/mozo';

interface ModalConflictoStockProps {
  abierto: boolean;
  conflicto: ConflictoStockDTO | null;
  onCerrar: () => void;
  onQuitarYEnviarRestantes: (productoId: string) => void;
  onVolverACatalogo: () => void;
}

export const ModalConflictoStock: React.FC<ModalConflictoStockProps> = ({
  abierto,
  conflicto,
  onCerrar,
  onQuitarYEnviarRestantes,
  onVolverACatalogo,
}) => {
  if (!abierto || !conflicto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Cabecera de Alerta */}
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Conflicto de Stock al Enviar a Cocina
              </h2>
              <p className="text-[11px] text-rose-100">
                Respuesta del servidor: 409 Conflict (ERR_PRODUCTO_AGOTADO)
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo informativo */}
        <div className="p-5 space-y-4 text-xs">
          {/* Tarjeta del producto en conflicto */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-rose-900">
                Plato Agotado: {conflicto.producto_nombre}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-200/80 text-rose-900 border border-rose-300">
                409 CONFLICT
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {conflicto.mensaje}
            </p>
            <p className="text-[11px] font-medium text-rose-800">
              Insumo reportado agotado en cocina: <strong>{conflicto.insumo_critico}</strong>
            </p>
          </div>

          <p className="text-slate-600 font-medium">
            ¿Cómo deseas resolver este incidente con la mesa?
          </p>

          {/* Opciones de resolución rápida */}
          <div className="space-y-2">
            {/* Opción 1: Quitar plato y enviar el resto */}
            <button
              onClick={() => onQuitarYEnviarRestantes(conflicto.producto_id)}
              className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-left transition-all flex items-start gap-3 shadow-xs active:scale-99"
            >
              <Check className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs">
                  Quitar {conflicto.producto_nombre} y Enviar los Demás Platos a Cocina
                </p>
                <p className="text-[11px] font-normal text-emerald-100">
                  Despacha la comanda de inmediato sin hacer esperar el resto de la mesa.
                </p>
              </div>
            </button>

            {/* Opción 2: Volver al catálogo para sustituir */}
            <button
              onClick={onVolverACatalogo}
              className="w-full p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-left transition-all flex items-start gap-3 border border-slate-200 active:scale-99"
            >
              <RefreshCw className="w-4 h-4 text-aurea-navy shrink-0 mt-0.5" />
              <div>
                <p className="text-xs">
                  Volver al Catálogo y Ofrecer Sustitución al Cliente
                </p>
                <p className="text-[11px] font-normal text-slate-500">
                  Conserva los demás platos en el borrador para que puedas seleccionar otro plato alternativo.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Pie */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onCerrar}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar y Mantener Borrador
          </button>
        </div>
      </div>
    </div>
  );
};
