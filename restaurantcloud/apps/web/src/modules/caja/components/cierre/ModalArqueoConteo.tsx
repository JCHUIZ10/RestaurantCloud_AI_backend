import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Lock,
  X,
  RotateCcw,
} from 'lucide-react';
import { BalancePreArqueoDTO, CerrarCajaRequest } from '@/types/caja';

interface ModalArqueoConteoProps {
  isOpen: boolean;
  balance: BalancePreArqueoDTO;
  onClose: () => void;
  onConfirmarCierre: (req: CerrarCajaRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export const ModalArqueoConteo: React.FC<ModalArqueoConteoProps> = ({
  isOpen,
  balance,
  onClose,
  onConfirmarCierre,
  isSubmitting = false,
}) => {
  const [montoContado, setMontoContado] = useState<string>(
    balance.efectivo_esperado.toFixed(2)
  );
  const [comentarioDiscrepancia, setComentarioDiscrepancia] = useState<string>('');
  const [notasCierre, setNotasCierre] = useState<string>(
    `Turno entregado sin novedades. Fondo S/ ${balance.monto_apertura.toFixed(2)} listo en gaveta.`
  );

  if (!isOpen) return null;

  const montoNumero = parseFloat(montoContado) || 0;
  const esperado = balance.efectivo_esperado;
  const discrepancia = Math.round((montoNumero - esperado) * 100) / 100;
  const tieneDiscrepancia = Math.abs(discrepancia) > 0.001;

  // Validación de justificación obligatoria si hay discrepancia (mínimo 10 caracteres)
  const comentarioValido = !tieneDiscrepancia || comentarioDiscrepancia.trim().length >= 10;
  const caracteresFaltantes = Math.max(0, 10 - comentarioDiscrepancia.trim().length);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(montoNumero) || montoNumero < 0) return;
    if (!comentarioValido) return;

    onConfirmarCierre({
      monto_real_fisico: montoNumero,
      comentario_discrepancia: tieneDiscrepancia ? comentarioDiscrepancia.trim() : undefined,
      notas_cierre: notasCierre.trim() || undefined,
    });
  };

  const setMontoPreset = (monto: number) => {
    setMontoContado(monto.toFixed(2));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-arqueo-title"
    >
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Diálogo Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-aurea-navy via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aurea-copper/20 border border-aurea-copper/40 text-aurea-champagne shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-aurea-copper font-bold bg-aurea-copper/10 px-2 py-0.5 rounded-md border border-aurea-copper/30">
                  Cierre Formal Z • CU-CAJA-05
                </span>
                <span className="text-xs text-slate-400">Terminal: POS-01</span>
              </div>
              <h2 id="modal-arqueo-title" className="text-lg font-bold font-serif text-white tracking-tight mt-0.5">
                Arqueo Físico de Efectivo y Cierre de Turno #{String(balance.turno_correlativo).padStart(3, '0')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">RESPONSABLE</span>
              <span className="font-bold text-white">{balance.cajero_nombre}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulario de Conteo y Arqueo en 2 Columnas */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna 1: Resumen de Flujo de Efectivo del Sistema */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block font-mono">
                  1. RESUMEN DE FLUJO DE EFECTIVO DEL SISTEMA
                </span>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Fondo de Apertura (Cambio Inicial):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      S/ {balance.monto_apertura.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span>(+) Ingresos Brutos en Efectivo (Ventas):</span>
                    <span className="font-bold">+ S/ {balance.ingresos_efectivo.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-rose-500">
                    <span>(-) Devoluciones / Notas de Crédito (BC01):</span>
                    <span className="font-bold">- S/ {balance.egresos_devolucion_nc.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-900 dark:text-white">Total Esperado en Efectivo:</span>
                    <span className="text-slate-900 dark:text-white font-mono">
                      S/ {balance.efectivo_esperado.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Box de Efectivo Objetivo */}
                <div className="p-3.5 rounded-xl bg-aurea-navy text-white text-center font-mono space-y-0.5">
                  <span className="text-[10px] text-aurea-copper uppercase tracking-wider block font-bold">
                    EFECTIVO OBJETIVO EN GAVETA
                  </span>
                  <span className="text-2xl font-extrabold text-aurea-champagne block">
                    S/ {balance.efectivo_esperado.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Calculado automáticamente por el backend
                  </span>
                </div>
              </div>

              {/* Conciliación de Medios Electrónicos */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block font-mono">
                  2. CONCILIACIÓN DE MEDIOS ELECTRÓNICOS
                </span>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-sans">
                        Tarjetas POS (Lote #012 Niubiz)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        S/ {balance.tarjetas_pos_total.toFixed(2)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 text-[10px] font-sans font-bold">
                        ✓ Conciliado
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-sans">
                        Billeteras Digitales (Yape / Plin)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        S/ {balance.billeteras_total.toFixed(2)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 text-[10px] font-sans font-bold">
                        ✓ Verificado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Conteo Físico Real en Gaveta & Discrepancia */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block font-mono">
                    3. CONTEO FÍSICO REAL EN GAVETA <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Digitación Directa</span>
                </div>

                {/* Input Grande de Efectivo Contado */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-mono font-bold text-slate-400 select-none">
                    PEN S/
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={montoContado}
                    onChange={(e) => setMontoContado(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-24 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-3xl font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20"
                    required
                    autoFocus
                  />
                </div>

                {/* Presets Rápidos de Cuadre y Prueba */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => setMontoPreset(balance.efectivo_esperado)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                  >
                    Cuadre Exacto S/ {balance.efectivo_esperado.toFixed(2)}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMontoPreset(balance.efectivo_esperado - 15)}
                    className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-mono font-bold text-[11px] hover:bg-rose-100 transition-colors"
                  >
                    Faltante -S/ 15.00
                  </button>

                  <button
                    type="button"
                    onClick={() => setMontoPreset(balance.efectivo_esperado + 20)}
                    className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-mono font-bold text-[11px] hover:bg-amber-100 transition-colors"
                  >
                    Sobrante +S/ 20.00
                  </button>

                  <button
                    type="button"
                    onClick={() => setMontoContado('0.00')}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors ml-auto"
                    title="Restablecer a cero"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Caja de Estado de Discrepancia Reactiva */}
                {!tieneDiscrepancia ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between font-mono animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">[✓ CAJA CUADRADA CON ÉXITO]</span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-sans">
                          Esperado: S/ {esperado.toFixed(2)} vs Contado: S/ {montoNumero.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono">DIF: S/ 0.00</span>
                  </div>
                ) : (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                      discrepancia < 0
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-current" />
                        <div>
                          <span className="font-bold block uppercase">
                            [⚠️ DISCREPANCIA: {discrepancia < 0 ? 'Faltante de Efectivo' : 'Sobrante de Efectivo'}]
                          </span>
                          <span className="text-[11px] opacity-90 font-sans">
                            Esperado: S/ {esperado.toFixed(2)} vs Contado: S/ {montoNumero.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="text-base font-bold font-mono">
                        {discrepancia < 0 ? `- S/ ${Math.abs(discrepancia).toFixed(2)}` : `+ S/ ${discrepancia.toFixed(2)}`}
                      </span>
                    </div>

                    {/* Campo de justificación obligatorio */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          Justificación Obligatoria de la Discrepancia <span className="text-rose-500">*</span>
                        </label>
                        <span
                          className={`text-[10px] font-mono ${
                            comentarioValido ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'
                          }`}
                        >
                          {comentarioValido
                            ? '✓ Justificación suficiente'
                            : `Faltan ${caracteresFaltantes} caracteres`}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={comentarioDiscrepancia}
                        onChange={(e) => setComentarioDiscrepancia(e.target.value)}
                        placeholder="Ej. Diferencia generada por cambio entregado de más en mesa 02 comprobado en arqueo..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper resize-none"
                        required={tieneDiscrepancia}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notas de Entrega de Turno (Opcional) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Notas de Entrega de Turno (Opcional)
                </label>
                <input
                  type="text"
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  placeholder="Ej. Turno entregado sin novedades..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-aurea-copper"
                />
                <span className="text-[10px] text-slate-400 block">
                  🔔 Se emitirá un evento reactivo SSE a Administración (CU-ADMIN-14).
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción del Modal */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar y Volver al Balance
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !comentarioValido}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-aurea-navy hover:bg-slate-800 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-aurea-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group border border-aurea-copper/30"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Consolidando Reporte Z y cerrando turno...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-aurea-champagne group-hover:rotate-12 transition-transform" />
                  <span>Confirmar y Cerrar Turno Definitivamente (F9)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
