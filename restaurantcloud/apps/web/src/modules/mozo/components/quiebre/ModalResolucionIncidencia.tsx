import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  XCircle,
  X,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ModalResolucionIncidenciaProps {
  abierto: boolean;
  mesaNumero: string;
  comandaNumero: number | string;
  productoNombre: string;
  precioUnitario: number;
  motivoCocina?: string;
  onCerrar: () => void;
  onElegirSustitucion: () => void;
  onElegirAnulacion: () => void;
}

export const ModalResolucionIncidencia: React.FC<ModalResolucionIncidenciaProps> = ({
  abierto,
  mesaNumero,
  comandaNumero,
  productoNombre,
  precioUnitario,
  motivoCocina = 'Agotamiento imprevisto de insumo (Lomo fino) en estación caliente.',
  onCerrar,
  onElegirSustitucion,
  onElegirAnulacion,
}) => {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-resolucion-titulo"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900 shadow-2xl shadow-amber-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-resolucion-titulo" className="text-lg font-bold text-slate-100 font-serif">
                  Incidencia en Cocina • Mesa {mesaNumero}
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Quiebre de Stock
                </span>
              </div>
              <p className="text-xs text-slate-400">Comanda #{comandaNumero} • Resolución asistida en mesa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Card del plato observado */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ChefHat className="h-5 w-5 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Plato Observado
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{productoNombre}</h3>
                </div>
              </div>
              <span className="text-base font-bold text-amber-300 font-mono">
                S/ {precioUnitario.toFixed(2)}
              </span>
            </div>
            <div className="rounded-lg bg-slate-900/80 p-2.5 border border-amber-500/20 text-xs text-slate-300">
              <span className="font-semibold text-amber-300">Motivo informado por Cocina: </span>
              {motivoCocina}
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
              ¿Cómo desea resolver con el comensal?
            </p>

            {/* Opciones A y B */}
            <div className="grid grid-cols-1 gap-3">
              {/* Opción A: Sustituir plato (Recomendada) */}
              <button
                type="button"
                onClick={onElegirSustitucion}
                className="group relative text-left rounded-xl border-2 border-emerald-500/50 hover:border-emerald-400 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 p-4 transition-all hover:shadow-lg hover:shadow-emerald-950/40 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors text-sm sm:text-base">
                          Opción A: Sustituir plato en la carta
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Zap className="h-2.5 w-2.5" /> Recomendado
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        El comensal elige otro plato alternativo. El sistema calcula la diferencia de precio (+S/, -S/, S/ 0) y despacha la nueva orden a cocina con máxima prioridad.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-emerald-400 shrink-0 self-center group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Opción B: Anular plato sin costo */}
              <button
                type="button"
                onClick={onElegirAnulacion}
                className="group relative text-left rounded-xl border border-slate-700 hover:border-amber-500/50 bg-slate-900/80 hover:bg-slate-900 p-4 transition-all hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 group-hover:text-amber-200 transition-colors text-sm sm:text-base">
                          Opción B: Anular plato sin costo
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" /> Sin merma
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        El comensal no desea nada más. Se descuenta S/ {precioUnitario.toFixed(2)} del subtotal de la comanda y se registra auditoría automática sin penalidad al mozo.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-300 shrink-0 self-center group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="border-t border-slate-800 bg-slate-950/60 px-5 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            Decidir después
          </button>
        </div>
      </div>
    </div>
  );
};
