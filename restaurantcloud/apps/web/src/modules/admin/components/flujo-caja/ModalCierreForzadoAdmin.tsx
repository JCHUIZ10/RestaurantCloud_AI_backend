import React, { useEffect, useState } from 'react';
import { X, Unlock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { TurnoCajaResumenDTO, CierreForzadoAdminRequestDTO } from '@/types/admin';
import { BalancePreArqueoDTO } from '@/types/caja';

interface ModalCierreForzadoAdminProps {
  isOpen: boolean;
  turno: TurnoCajaResumenDTO | null;
  /** Balance en vivo del turno, consultado justo antes de abrir el modal */
  balance: BalancePreArqueoDTO | null;
  onClose: () => void;
  onConfirmarCierreForzado: (turnoId: string, req: CierreForzadoAdminRequestDTO) => Promise<void>;
  isSubmitting?: boolean;
}

const MIN_CARACTERES_JUSTIFICACION = 15;

const formatoSoles = (monto: number): string => `S/ ${monto.toFixed(2)}`;

export const ModalCierreForzadoAdmin: React.FC<ModalCierreForzadoAdminProps> = ({
  isOpen,
  turno,
  balance,
  onClose,
  onConfirmarCierreForzado,
  isSubmitting = false,
}) => {
  const [efectivoContado, setEfectivoContado] = useState<string>('');
  const [justificacion, setJustificacion] = useState<string>('');
  // Efectivo esperado con que se abrió el modal: si cambia mientras se cuenta la caja, se avisa
  const [esperadoInicial] = useState<number | null>(balance ? balance.efectivo_esperado : null);

  // Escape cierra el modal, salvo mientras se ejecuta el cierre
  useEffect(() => {
    if (!isOpen) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !turno || !balance) return null;

  const esperado = balance.efectivo_esperado;
  const esperadoCambio = esperadoInicial !== null && Math.abs(esperado - esperadoInicial) >= 0.005;
  const gastosCaja = balance.egresos_gasto_caja ?? 0;
  const contadoIngresado = efectivoContado.trim() !== '';
  const montoNumero = parseFloat(efectivoContado);
  const montoValido = contadoIngresado && Number.isFinite(montoNumero) && montoNumero >= 0;
  const discrepancia = montoValido ? Math.round((montoNumero - esperado) * 100) / 100 : 0;
  const justificacionTexto = justificacion.trim();
  const justificacionValida = justificacionTexto.length >= MIN_CARACTERES_JUSTIFICACION;
  const caracteresFaltantes = Math.max(0, MIN_CARACTERES_JUSTIFICACION - justificacionTexto.length);
  const hayMesasActivas = !balance.salon_al_dia;
  const puedeConfirmar = montoValido && justificacionValida && !hayMesasActivas && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeConfirmar) return;

    await onConfirmarCierreForzado(turno.id, {
      efectivo_contado: montoNumero,
      justificacion: justificacionTexto,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cierre-forzado"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header de emergencia */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700/60">
                Protocolo de rescate de terminal
              </span>
              <h2 id="titulo-cierre-forzado" className="text-base font-bold font-serif text-white tracking-tight mt-0.5">
                Cierre administrativo forzado • Turno #{String(turno.correlativo).padStart(3, '0')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar sin forzar el cierre"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Esta acción cierra una caja que quedó abierta por abandono, relevo extraordinario o emergencia del colaborador, y libera la
            terminal única de la sede para que el siguiente cajero pueda abrir turno. Quedará registrada a tu nombre en la auditoría.
          </p>

          {/* El salón debe estar al día, igual que en el cierre normal */}
          {hayMesasActivas && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>No se puede cerrar la caja todavía.</strong> Hay {balance.mesas_activas_pendientes}{' '}
                {balance.mesas_activas_pendientes === 1 ? 'mesa con pedidos activos pendientes' : 'mesas con pedidos activos pendientes'} de cobro en el
                salón. Cóbralas o libéralas y vuelve a intentarlo.
              </div>
            </div>
          )}

          {/* El cajero sigue operando: si cambió el efectivo esperado, el conteo anterior ya no vale */}
          {esperadoCambio && esperadoInicial !== null && (
            <div
              role="status"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-aurea-ivory to-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>El efectivo esperado cambió</strong> de {formatoSoles(esperadoInicial)} a {formatoSoles(esperado)} mientras estabas aquí
                (el turno sigue registrando movimientos). Revisa tu conteo antes de confirmar.
              </div>
            </div>
          )}

          {/* Ficha del turno afectado, con las cifras reales del turno */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Cajero registrado:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {balance.cajero_nombre}
                {balance.cajero_rol ? ` (${balance.cajero_rol})` : ''}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Abierto desde:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {new Date(balance.fecha_apertura).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                {turno.horas_abierto != null ? ` (${turno.horas_abierto} h)` : ''}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Fondo de apertura:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatoSoles(balance.monto_apertura)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>(+) Ventas en efectivo:</span>
              <span className="font-bold">+ {formatoSoles(balance.ingresos_efectivo)}</span>
            </div>
            <div className="flex justify-between text-rose-500">
              <span>(−) Devoluciones / notas de crédito:</span>
              <span className="font-bold">- {formatoSoles(balance.egresos_devolucion_nc)}</span>
            </div>
            {gastosCaja > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>(−) Gastos pagados con efectivo de caja:</span>
                <span className="font-bold">- {formatoSoles(gastosCaja)}</span>
              </div>
            )}
            {(balance.egresos_compra_caja ?? 0) > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>(−) Compras de insumos pagadas con efectivo de caja:</span>
                <span className="font-bold">- {formatoSoles(balance.egresos_compra_caja ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Efectivo esperado por el sistema:</span>
              <span className="text-aurea-copper">{formatoSoles(esperado)}</span>
            </div>
          </div>

          {/* Importe contado físicamente */}
          <div className="space-y-2">
            <label htmlFor="efectivo-contado-forzado" className="font-semibold text-slate-800 dark:text-slate-200 block">
              Efectivo físico contado en la gaveta (S/) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">S/</span>
              <input
                id="efectivo-contado-forzado"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEfectivoContado(esperado.toFixed(2))}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {formatoSoles(esperado)} (coincide con el sistema)
              </button>
            </div>
          </div>

          {/* Diferencia calculada */}
          {montoValido && (
            <div
              className={`p-3 rounded-2xl border text-xs font-mono flex items-center justify-between ${
                discrepancia === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <span>Diferencia en conteo:</span>
              <span className="font-bold">
                {discrepancia === 0
                  ? 'S/ 0.00 (sin descuadre)'
                  : discrepancia < 0
                  ? `- ${formatoSoles(Math.abs(discrepancia))} (faltante)`
                  : `+ ${formatoSoles(discrepancia)} (sobrante)`}
              </span>
            </div>
          )}

          {/* Justificación administrativa */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="justificacion-forzado" className="font-semibold text-slate-800 dark:text-slate-200">
                Justificación administrativa <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${justificacionValida ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}`}>
                {justificacionValida
                  ? '✓ Justificación suficiente'
                  : `Mínimo ${MIN_CARACTERES_JUSTIFICACION} caracteres (faltan ${caracteresFaltantes})`}
              </span>
            </div>
            <textarea
              id="justificacion-forzado"
              rows={2}
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              maxLength={1000}
              placeholder="Explica el motivo del cierre forzado y quién asume la rendición del efectivo..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
              required
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Las cifras se calcularon al abrir esta ventana; el sistema las recalcula al confirmar el cierre.
          </p>

          {/* Confirmación */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!puedeConfirmar}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-rose-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 text-rose-200" />
              )}
              <span>Confirmar cierre forzado y liberar terminal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
