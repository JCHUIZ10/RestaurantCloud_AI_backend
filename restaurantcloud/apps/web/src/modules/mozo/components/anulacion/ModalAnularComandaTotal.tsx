import React, { useState } from 'react';
import { X, AlertOctagon, AlertTriangle, CheckSquare, Square, Trash2, ArrowLeft } from 'lucide-react';
import { AnularPedidoCompletoRequestDTO, MotivoCategoriaComanda } from '@/types/mozo';

interface ModalAnularComandaTotalProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  mesaNumero: string;
  totalConsumo: number;
  totalItems: number;
  onConfirmarAnulacionTotal: (request: AnularPedidoCompletoRequestDTO) => Promise<void>;
}

export const ModalAnularComandaTotal: React.FC<ModalAnularComandaTotalProps> = ({
  isOpen,
  onClose,
  mesaNumero,
  totalConsumo,
  totalItems,
  onConfirmarAnulacionTotal,
}) => {
  const [motivoCategoria, setMotivoCategoria] =
    useState<MotivoCategoriaComanda>('retiro_sin_consumo');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [confirmarVacio, setConfirmarVacio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const opcionesMotivos: { id: MotivoCategoriaComanda; label: string }[] = [
    { id: 'retiro_sin_consumo', label: 'Grupo se retiró sin consumir' },
    { id: 'error_apertura', label: 'Error de apertura de mesa' },
    { id: 'reclamo_general', label: 'Reclamo generalizado / Disconformidad' },
    { id: 'emergencia', label: 'Emergencia en salón / Evacuación' },
    { id: 'otro', label: 'Otro motivo de fuerza mayor' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmarVacio) {
      setErrorMsg('Debes marcar la casilla confirmando que la mesa queda desocupada.');
      return;
    }
    if (motivoDetalle.trim().length < 10) {
      setErrorMsg('La justificación debe contener al menos 10 caracteres para la auditoría.');
      return;
    }

    setEnviando(true);
    setErrorMsg(null);
    try {
      await onConfirmarAnulacionTotal({
        motivo_categoria: motivoCategoria,
        motivo_detalle: motivoDetalle.trim(),
        confirmar_vacio: true,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al anular la comanda completa');
    } finally {
      setEnviando(false);
    }
  };

  const puedeConfirmar = confirmarVacio && motivoDetalle.trim().length >= 10 && !enviando;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => !enviando && onClose()}
      />

      {/* Modal 550px */}
      <div className="relative w-full max-w-[550px] bg-white rounded-2xl shadow-2xl border border-rose-300 overflow-hidden z-10 animate-scale-up select-none">
        {/* Cabecera de Alerta Crítica */}
        <div className="p-4 bg-rose-950 text-white flex items-start justify-between border-b border-rose-900">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-900/60 text-rose-300 shrink-0 mt-0.5">
              <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-rose-200 border border-rose-700">
                  PELIGRO OPERATIVO
                </span>
                <span className="text-xs text-rose-300">Mesa {mesaNumero}</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-white mt-1">
                Anular Comanda Completa — Mesa {mesaNumero}
              </h3>
              <p className="text-xs text-rose-200 mt-0.5 font-mono">
                Total a anular: <span className="font-bold text-white">S/ {totalConsumo.toFixed(2)}</span> ({totalItems} platos en cocina y servidos)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={enviando}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Advertencia de Consecuencia Directa */}
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 text-rose-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Consecuencia Operativa Directa</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Se cancelarán <strong>todos los pedidos asociados a esta mesa en Cocina KDS y Caja POS</strong>. La <strong>Mesa {mesaNumero} pasará automáticamente a estado LIBRE</strong> en el plano de salón y se enviará una notificación prioritaria de auditoría a la Administración.
            </p>
          </div>

          {/* Selector de Motivos de Mesa (Chips 1 Toque) */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Selecciona el motivo de cancelación de la comanda (1 toque):
            </label>
            <div className="flex flex-wrap gap-2">
              {opcionesMotivos.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setMotivoCategoria(opt.id)}
                  className={`py-1.5 px-3 rounded-xl font-medium text-xs border transition-all active:scale-95 text-left ${
                    motivoCategoria === opt.id
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {motivoCategoria === opt.id ? '● ' : '○ '}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Justificación Detallada */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="comandaMotivoDetalle" className="font-bold text-slate-800">
                Justificación detallada del incidente (mínimo 10 caracteres):
              </label>
              <span
                className={`text-[10px] font-mono ${
                  motivoDetalle.trim().length >= 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'
                }`}
              >
                {motivoDetalle.trim().length} / 10 mín.
              </span>
            </div>
            <textarea
              id="comandaMotivoDetalle"
              rows={3}
              value={motivoDetalle}
              onChange={(e) => {
                setMotivoDetalle(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej. Los comensales tuvieron una urgencia laboral imprevista y se retiraron antes de salir los platos de cocina."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs outline-none bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Casilla de Verificación Obligatoria */}
          <div
            onClick={() => setConfirmarVacio(!confirmarVacio)}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              confirmarVacio
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="mt-0.5">
              {confirmarVacio ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="text-xs">
              <span className="font-bold block">
                Confirmo que la Mesa {mesaNumero} queda desocupada
              </span>
              <span className="text-[11px] text-slate-500 block">
                Entiendo que esta acción no se puede deshacer y liberará la mesa para nuevos comensales.
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="py-2.5 px-4 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mantener Comanda</span>
            </button>

            <button
              type="submit"
              disabled={!puedeConfirmar}
              className={`py-2.5 px-5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-98 ${
                puedeConfirmar
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {enviando ? (
                <span>Cancelando Comanda...</span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>🛑 Anular y Liberar Mesa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
