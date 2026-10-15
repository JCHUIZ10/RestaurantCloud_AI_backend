import React, { useState } from 'react';
import {
  X,
  Unlock,
  ShieldAlert,
} from 'lucide-react';
import { TurnoCajaResumenDTO, CierreForzadoAdminRequestDTO } from '@/types/admin';

interface ModalCierreForzadoAdminProps {
  isOpen: boolean;
  turno: TurnoCajaResumenDTO | null;
  onClose: () => void;
  onConfirmarCierreForzado: (turnoId: string, req: CierreForzadoAdminRequestDTO) => Promise<void>;
  isSubmitting?: boolean;
}

export const ModalCierreForzadoAdmin: React.FC<ModalCierreForzadoAdminProps> = ({
  isOpen,
  turno,
  onClose,
  onConfirmarCierreForzado,
  isSubmitting = false,
}) => {
  const [efectivoContado, setEfectivoContado] = useState<string>(
    turno?.monto_esperado ? turno.monto_esperado.toFixed(2) : '1440.00'
  );
  const [justificacion, setJustificacion] = useState<string>(
    'Cierre administrativo forzado por abandono de turno y cambio de guardia de personal.'
  );

  if (!isOpen || !turno) return null;

  const montoNumero = parseFloat(efectivoContado) || 0;
  const esperado = turno.monto_esperado;
  const discrepancia = Math.round((montoNumero - esperado) * 100) / 100;
  const justificacionValida = justificacion.trim().length >= 15;
  const caracteresFaltantes = Math.max(0, 15 - justificacion.trim().length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoNumero < 0 || !justificacionValida) return;

    await onConfirmarCierreForzado(turno.id, {
      efectivo_contado: montoNumero,
      justificacion: justificacion.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header de Emergencia */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700/60">
                Protocolo de Rescate de Terminal • CU-ADMIN-14
              </span>
              <h2 className="text-base font-bold font-serif text-white tracking-tight mt-0.5">
                Cierre Administrativo Forzado • Turno #{String(turno.correlativo).padStart(3, '0')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Esta acción permite forzar el cierre de una caja que quedó abierta por abandono, relevo extraordinario o emergencia médica del colaborador, liberando la restricción de terminal única (<strong className="font-mono">uq_caja_abierta_local</strong>) para que el siguiente cajero pueda operar.
          </p>

          {/* Ficha de Turno Afectado */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Cajero Saliente Registrado:</span>
              <span className="font-bold text-slate-900 dark:text-white">{turno.cajero_nombre} ({turno.cajero_rol || 'Turno Mañana'})</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Fondo Inicial de Apertura:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">S/ {turno.monto_apertura.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Efectivo Esperado por Sistema:</span>
              <span className="text-aurea-copper">S/ {esperado.toFixed(2)}</span>
            </div>
          </div>

          {/* Importe Contado Físicamente */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Efectivo Físico Contado en Gaveta (PEN S/) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0.00"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {/* Chips de Ajuste Rápido */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEfectivoContado(esperado.toFixed(2))}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                S/ {esperado.toFixed(2)} (Exacto)
              </button>
              <button
                type="button"
                onClick={() => setEfectivoContado((esperado - 10).toFixed(2))}
                className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] font-mono hover:bg-amber-100 text-amber-700 dark:text-amber-300 transition-colors"
              >
                -S/ 10.00 (Faltante)
              </button>
              <button
                type="button"
                onClick={() => setEfectivoContado((esperado + 10).toFixed(2))}
                className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[11px] font-mono hover:bg-sky-100 text-sky-700 dark:text-sky-300 transition-colors"
              >
                +S/ 10.00 (Sobrante)
              </button>
            </div>
          </div>

          {/* Cuadro de Discrepancia Calculada */}
          <div
            className={`p-3 rounded-2xl border text-xs font-mono flex items-center justify-between ${
              discrepancia === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span>Diferencia en Conteo:</span>
            <span className="font-bold">
              {discrepancia === 0 ? 'S/ 0.00 (Sin descuadre)' : `${discrepancia < 0 ? `- S/ ${Math.abs(discrepancia).toFixed(2)} (Faltante)` : `+ S/ ${discrepancia.toFixed(2)} (Sobrante)`}`}
            </span>
          </div>

          {/* Justificación Administrativa */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Justificación Administrativa Vinculante <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  justificacionValida ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'
                }`}
              >
                {justificacionValida ? '✓ Justificación suficiente' : `Mínimo 15 caracteres (faltan ${caracteresFaltantes})`}
              </span>
            </div>
            <textarea
              rows={2}
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="Explique el motivo del cierre forzado y la persona que asume la rendición..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
              required
            />
          </div>

          {/* Footer de Confirmación */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !justificacionValida || montoNumero < 0}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-rose-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 text-rose-200" />
              )}
              <span>Confirmar Cierre Forzado y Liberar Terminal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
