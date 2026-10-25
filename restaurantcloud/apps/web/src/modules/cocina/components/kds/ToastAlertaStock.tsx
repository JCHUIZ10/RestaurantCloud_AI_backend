import React from 'react';
import { AlertTriangle, ShieldCheck, X, ArrowRight, PackageX } from 'lucide-react';
import { AlertaStockInsuficienteSSE } from '@/types/cocina';

interface ToastAlertaStockProps {
  alerta: AlertaStockInsuficienteSSE | null;
  onCerrar: () => void;
  onAbrirDisponibilidad?: () => void;
}

export const ToastAlertaStock: React.FC<ToastAlertaStockProps> = ({
  alerta,
  onCerrar,
  onAbrirDisponibilidad,
}) => {
  if (!alerta) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-lg w-full bg-amber-950/95 border-2 border-amber-500 rounded-3xl shadow-2xl shadow-amber-950/80 p-5 text-amber-100 backdrop-blur-md animate-slideUp select-none"
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 border-b border-amber-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <span>ALERTA DE INVENTARIO CULINARIO</span>
            </h4>
            <p className="text-xs text-amber-300/90 font-mono">
              Comanda #{alerta.numero_comanda} • Mesa {alerta.mesa_codigo}
            </p>
          </div>
        </div>

        <button
          onClick={onCerrar}
          className="p-1 rounded-lg hover:bg-amber-900/60 text-amber-400 hover:text-white transition-colors"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cuerpo */}
      <div className="space-y-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-900/60 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <PackageX className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Insumo sin stock suficiente en almacén:</span>
          </div>
          <p className="font-semibold text-white pl-5 text-sm">
            {alerta.insumo_nombre}
          </p>
          <div className="grid grid-cols-2 gap-2 pl-5 pt-1 text-[11px] font-mono text-amber-200/80">
            <div>
              <span>Consumo receta: </span>
              <strong className="text-white">
                {alerta.consumo_requerido} {alerta.unidad_medida}
              </strong>
            </div>
            <div>
              <span>Stock en almacén: </span>
              <strong className="text-rose-300">
                {alerta.stock_disponible} {alerta.unidad_medida}
              </strong>
            </div>
          </div>
          {alerta.faltante_teorico > 0 && (
            <div className="pl-5 text-[11px] font-mono text-rose-300">
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Faltante no registrado:
              </span>{' '}
              <strong>
                {alerta.faltante_teorico} {alerta.unidad_medida}
              </strong>
            </div>
          )}
        </div>

        {/* Política de continuidad */}
        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-2 text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>El servicio no se detuvo:</strong> la preparación continuó y el plato salió al pase. El plato cambió automáticamente a <em>&quot;Agotado por receta&quot;</em> en la carta digital.
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-3 mt-3 border-t border-amber-800/60 flex items-center justify-end gap-2">
        <button
          onClick={onCerrar}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-200 transition-colors"
        >
          Entendido
        </button>

        {onAbrirDisponibilidad && (
          <button
            onClick={() => {
              onCerrar();
              onAbrirDisponibilidad();
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition-all flex items-center gap-1.5"
          >
            <span>Gestionar Disponibilidad</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
