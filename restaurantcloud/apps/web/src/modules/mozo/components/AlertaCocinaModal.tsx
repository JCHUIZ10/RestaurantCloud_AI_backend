import React from 'react';
import { Bell, AlertTriangle, ChefHat, Check, Clock, X } from 'lucide-react';
import { AlertaCocinaModalDTO } from '@/types/mozo';

interface AlertaCocinaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  alerta: AlertaCocinaModalDTO | null;
  onAceptar: () => void;
}

export const AlertaCocinaModal: React.FC<AlertaCocinaModalProps> = ({
  abierto,
  onCerrar,
  alerta,
  onAceptar,
}) => {
  if (!abierto || !alerta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onCerrar}
      />

      {/* Modal 560px */}
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-scale-up select-none">
        {/* Encabezado Prioritario */}
        <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                ¡Comanda Lista en Pase de Cocina!
              </h3>
              <p className="text-xs font-mono font-medium opacity-90">
                {alerta.pase_nombre} • Hace {alerta.segundos_transcurridos}s
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1 rounded-lg text-slate-950 hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo de la Alerta */}
        <div className="p-5 space-y-4 text-xs">
          {/* Ficha de Mesa y Plato */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Mesa Destino
              </div>
              <div className="font-serif text-2xl font-bold text-slate-900 mt-0.5">
                Mesa {alerta.mesa_numero}
              </div>
              <div className="text-slate-500 text-xs mt-0.5">
                {alerta.ambiente} • Comanda #{alerta.comanda_numero}
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                LISTO EN PASE
              </span>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 justify-end">
                <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                <span>Cocinero: {alerta.cocinero_nombre}</span>
              </p>
            </div>
          </div>

          {/* Plato Detalle */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="font-bold text-sm text-slate-900">
              {alerta.plato_nombre}
            </div>
            {alerta.nota_especial && (
              <p className="text-amber-800 text-xs mt-1 italic">
                ↳ Nota: {alerta.nota_especial}
              </p>
            )}
            <p className="text-slate-600 text-[11px] mt-2 leading-relaxed">
              El pase de cocina solicita entrega inmediata para garantizar la temperatura
              óptima de servicio al comensal.
            </p>
          </div>

          {/* Aviso adicional de quiebre de insumos (si aplica) */}
          {alerta.insumo_agotado && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Aviso adicional de cocina: </strong>
                <span>
                  Insumo <strong>{alerta.insumo_agotado}</strong> reportado agotado en KDS.
                  Mesa 07 requiere coordinar sustitución de plato.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Posponer 30s</span>
          </button>

          <button
            onClick={onAceptar}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>✓ Entendido / Voy al Pase Cocina</span>
          </button>
        </div>
      </div>
    </div>
  );
};
