import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Trash2,
} from 'lucide-react';
import { AnularPorQuiebreRequestDTO } from '@/types/mozo';

interface ModalAnulacionQuiebreProps {
  abierto: boolean;
  mesaNumero: string;
  comandaNumero: number | string;
  productoNombre: string;
  precioUnitario: number;
  subtotalActual: number;
  onVolver: () => void;
  onCerrar: () => void;
  onConfirmarAnulacion: (payload: AnularPorQuiebreRequestDTO) => Promise<void>;
}

export const ModalAnulacionQuiebre: React.FC<ModalAnulacionQuiebreProps> = ({
  abierto,
  mesaNumero,
  comandaNumero,
  productoNombre,
  precioUnitario,
  subtotalActual,
  onVolver,
  onCerrar,
  onConfirmarAnulacion,
}) => {
  const [notaAdicional, setNotaAdicional] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  const nuevoSubtotal = Math.max(0, subtotalActual - precioUnitario);

  const handleConfirmar = async () => {
    try {
      setProcesando(true);
      setError(null);
      const motivoCompleto = notaAdicional.trim()
        ? `Quiebre de stock en cocina: ${notaAdicional.trim()}`
        : 'Quiebre de stock de insumo en cocina informado al comensal';

      await onConfirmarAnulacion({
        motivo_detalle: motivoCompleto,
      });
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.errores?.[0]?.mensaje ||
        (err as any)?.response?.data?.mensaje ||
        (err instanceof Error ? err.message : 'Error al anular plato.');
      setError(msg);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-anulacion-quiebre-titulo"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl shadow-red-950/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-red-950/30 to-slate-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onVolver}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 id="modal-anulacion-quiebre-titulo" className="text-base sm:text-lg font-bold text-slate-100 font-serif">
                Confirmar Anulación por Quiebre
              </h2>
              <p className="text-xs text-slate-400">
                Mesa {mesaNumero} • Comanda #{comandaNumero}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Tarjeta de impacto en comanda */}
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400">Plato a retirar:</span>
              <span className="text-xs font-bold text-slate-100">{productoNombre}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Monto a descontar:</span>
              <span className="font-mono font-bold text-red-400">-S/ {precioUnitario.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Recálculo de Subtotal:</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-500 line-through">S/ {subtotalActual.toFixed(2)}</span>
                <span className="text-sm font-bold text-emerald-400">➔ S/ {nuevoSubtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bloque de Auditoría y Control de Merma */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Garantía de Auditoría Interna</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-white">Sin costo para el comensal:</strong> Se recalcula la comanda inmediatamente.
              </li>
              <li>
                <strong className="text-emerald-300">Merma no imputable:</strong> Control de merma marcado como{' '}
                <code className="text-[11px] bg-slate-900 px-1 py-0.5 rounded text-emerald-400">es_merma = false</code>.
              </li>
              <li>
                <strong className="text-white">Notificación automática:</strong> Alerta inmediata enviada a Administrador de Sede (CU-ADMIN-12).
              </li>
            </ul>
          </div>

          {/* Nota opcional */}
          <div className="space-y-1.5">
            <label htmlFor="nota-anulacion-quiebre" className="text-xs font-medium text-slate-300">
              Nota o aclaración para bitácora (opcional):
            </label>
            <input
              id="nota-anulacion-quiebre"
              type="text"
              placeholder="Ej: Comensal prefirió no pedir otro plato por falta de tiempo..."
              value={notaAdicional}
              onChange={(e) => setNotaAdicional(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 flex items-center gap-2 text-red-300 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Regresar
          </button>

          <button
            type="button"
            disabled={procesando}
            onClick={handleConfirmar}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-lg transition-all ${
              procesando
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 active:scale-95'
            }`}
          >
            {procesando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Anulando...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Anulación y Recalcular</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
