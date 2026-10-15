import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  Eye,
} from 'lucide-react';
import { PedidoAnulacionItemDTO } from '@/types/admin';

interface ToastAlertaAnulacionProps {
  alerta: PedidoAnulacionItemDTO | null;
  onVerFicha: (id: string) => void;
  onCerrar: () => void;
}

export const ToastAlertaAnulacion: React.FC<ToastAlertaAnulacionProps> = ({
  alerta,
  onVerFicha,
  onCerrar,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alerta) {
      setVisible(true);
      // Auto-descartar después de 12 segundos
      const timer = setTimeout(() => {
        setVisible(false);
        onCerrar();
      }, 12000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [alerta, onCerrar]);

  if (!alerta || !visible) return null;

  return (
    <aside
      aria-label="Notificación de anulación en tiempo real"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-500/50 p-4 transition-all duration-300 animate-in slide-in-from-top-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              ALERTA EN VIVO (SSE)
            </span>
            <span className="text-[11px] text-slate-400">Hace instantes</span>
          </div>

          <h5 className="font-bold text-xs sm:text-sm text-white mt-1 leading-tight">
            Anulación en {alerta.mesa_numero}
          </h5>

          <p className="text-xs text-slate-300 mt-0.5 truncate">
            {alerta.cantidad}x {alerta.producto_nombre} (S/ {alerta.monto_total.toFixed(2)})
          </p>

          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>Mozo: <strong className="text-slate-200">{alerta.mozo_nombre}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400 font-mono font-medium">
              <Clock className="w-3 h-3" />
              Espera: {alerta.minutos_espera}m
            </span>
          </div>

          {alerta.es_merma && (
            <div className="mt-1.5 text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded-md inline-block">
              ⚠️ Con Merma Culinaria (S/ {(alerta.costo_merma || 0).toFixed(2)})
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onVerFicha(alerta.id);
                setVisible(false);
                onCerrar();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Auditar Ficha
            </button>
            <button
              onClick={() => {
                setVisible(false);
                onCerrar();
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setVisible(false);
            onCerrar();
          }}
          aria-label="Cerrar notificación"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
