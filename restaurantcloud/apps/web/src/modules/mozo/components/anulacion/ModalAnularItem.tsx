import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Archive,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { ItemDetalleComandaDTO, AnularItemRequestDTO, MotivoCategoriaItem } from '@/types/mozo';

interface ModalAnularItemProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemDetalleComandaDTO | null;
  mesaNumero: string;
  onConfirmarAnulacion: (request: AnularItemRequestDTO) => Promise<void>;
}

export const ModalAnularItem: React.FC<ModalAnularItemProps> = ({
  isOpen,
  onClose,
  item,
  mesaNumero,
  onConfirmarAnulacion,
}) => {
  const [motivoCategoria, setMotivoCategoria] = useState<MotivoCategoriaItem>('demora_cliente');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // Detección de merma contable según el wireframe oficial (Vista 4)
  const esMerma = item.estado === 'entregado';

  // Opciones de chips para cocina en curso (Vista 2)
  const opcionesCocina: { id: MotivoCategoriaItem; label: string }[] = [
    { id: 'demora_cliente', label: 'Cliente desistió por demora' },
    { id: 'error_toma', label: 'Error al registrar comanda' },
    { id: 'queja_calidad', label: 'Queja de preparación / calidad' },
    { id: 'cambio_plato', label: 'Cambio de plato por cliente' },
    { id: 'otro', label: 'Otro motivo de salón' },
  ];

  // Opciones de chips para merma de plato ya entregado (Vista 4)
  const opcionesMerma: { id: MotivoCategoriaItem; label: string }[] = [
    { id: 'queja_calidad', label: 'Queja de cliente / Devolución' },
    { id: 'plato_caido', label: 'Plato caído en sala / derrame' },
    { id: 'contaminacion', label: 'Error de pase / Contaminación' },
    { id: 'otro', label: 'Plato frío / Defecto de cocción' },
  ];

  const opcionesActuales = esMerma ? opcionesMerma : opcionesCocina;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivoDetalle.trim().length < 10) {
      setErrorMsg('La justificación debe contener al menos 10 caracteres para la auditoría.');
      return;
    }

    setEnviando(true);
    setErrorMsg(null);
    try {
      await onConfirmarAnulacion({
        motivo_categoria: motivoCategoria,
        motivo_detalle: motivoDetalle.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar la anulación del plato');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => !enviando && onClose()}
      />

      {/* Modal 520px - 530px */}
      <div className="relative w-full max-w-[530px] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden z-10 animate-scale-up select-none">
        {/* Cabecera */}
        <div
          className={`p-4 text-white flex items-start justify-between ${
            esMerma ? 'bg-amber-900 border-b border-amber-800' : 'bg-slate-900 border-b border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              {esMerma ? (
                <Archive className="w-5 h-5 text-amber-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <h3 className="font-serif text-lg font-bold">
                {esMerma ? 'Anular Ítem ya Servido (Registro de Merma)' : 'Anular Ítem de Comanda'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Plato: <span className="font-semibold text-white">{item.cantidad}x {item.producto_nombre}</span> (S/ {item.subtotal.toFixed(2)}) — Mesa {mesaNumero}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={enviando}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Alerta de Consecuencia según Tipo */}
          {esMerma ? (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                  Tratamiento Contable de Inventario
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-950">
                  es_merma = true
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Este plato fue marcado como <strong>ENTREGADO</strong> en sala. Dado que los insumos ya salieron de cocina, el sistema <strong>NO revertirá el stock físico</strong>; registrará una <strong>MERMA OPERATIVA</strong> para preservar la exactitud del costo de recetas (<span className="font-mono text-amber-900">CU-ADMIN-05</span>).
              </p>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 text-rose-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 text-rose-800">
                  <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  Estado Actual: {item.estado === 'en_preparacion' ? 'En Preparación en Cocina' : item.estado === 'listo' ? 'Listo en Pase' : 'En Cola de Cocina'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-950">
                  Frenar Cocina KDS
                </span>
              </div>
              <p className="text-[11px] text-rose-900 leading-relaxed">
                Al confirmar, el sistema emitirá una <strong>alerta acústica y visual instantánea (&lt; 30ms)</strong> al monitor KDS de Cocina para detener la cocción de inmediato y prevenir desperdicio de insumos.
              </p>
            </div>
          )}

          {/* Selector de Motivos Frecuentes (Chips 1 Toque) */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              {esMerma ? 'Selecciona la causa de la merma o reclamo (1 toque):' : 'Selecciona el motivo frecuente (1 toque):'}
            </label>
            <div className="flex flex-wrap gap-2">
              {opcionesActuales.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setMotivoCategoria(opt.id)}
                  className={`py-1.5 px-3 rounded-xl font-medium text-xs border transition-all active:scale-95 text-left ${
                    motivoCategoria === opt.id
                      ? esMerma
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-semibold'
                        : 'bg-rose-600 text-white border-rose-700 shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {motivoCategoria === opt.id ? '● ' : '○ '}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detalle o Justificación Obligatoria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="motivoDetalle" className="font-bold text-slate-800">
                {esMerma ? 'Detalle del reclamo para auditoría administrativa:' : 'Detalle o justificación obligatoria (mínimo 10 caracteres):'}
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
              id="motivoDetalle"
              rows={3}
              value={motivoDetalle}
              onChange={(e) => {
                setMotivoDetalle(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={
                esMerma
                  ? 'Ej. El comensal indica inconformidad con el sabor (demasiado salado) y solicita retirar el plato de la cuenta.'
                  : 'Ej. El comensal lleva esperando 20 minutos y solicita retirar el plato porque ya debe retirarse a una reunión.'
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-aurea-copper focus:border-aurea-copper text-xs outline-none bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Nota de Operatividad Ágil */}
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-start gap-2 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              💡 <strong>Anulación inmediata sin clave gerencial:</strong> Se procesa al instante para evitar demoras en cocina y se notifica automáticamente al Administrador del Local (<span className="font-mono">CU-ADMIN-12</span>).
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="py-2 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={enviando || motivoDetalle.trim().length < 10}
              className={`py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-98 ${
                enviando || motivoDetalle.trim().length < 10
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : esMerma
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {enviando ? (
                <span>Procesando...</span>
              ) : esMerma ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Registrar Merma y Retirar</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>🛑 Confirmar Anulación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
