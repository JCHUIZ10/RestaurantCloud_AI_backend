import React, { useState, useEffect } from 'react';
import { X, Scissors, Check, Users, RefreshCw, Receipt, Anchor, AlertCircle } from 'lucide-react';
import { ValidacionSeparacionMesaDTO } from '@/types/mozo';

interface ModalSepararMesasProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  validacion: ValidacionSeparacionMesaDTO | null;
  onConfirmarSeparacion: (mesaId: string, secundariasIds?: string[]) => Promise<void>;
}

export const ModalSepararMesas: React.FC<ModalSepararMesasProps> = ({
  isOpen,
  onClose,
  mesaId,
  validacion,
  onConfirmarSeparacion,
}) => {
  const [seleccionadasIds, setSeleccionadasIds] = useState<string[]>([]);
  const [separando, setSeparando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Obtener titular y secundarias del DTO
  const mesaTitular =
    validacion?.mesa_titular ||
    validacion?.mesas_a_restaurar.find((m) => m.rol === 'titular') || {
      id: mesaId,
      numero: 'Titular',
      capacidad: 4,
    };

  const secundarias =
    validacion?.mesas_secundarias ||
    validacion?.mesas_a_restaurar.filter((m) => m.rol === 'secundaria') ||
    [];

  // Por defecto, preseleccionar todas las secundarias
  useEffect(() => {
    if (validacion && secundarias.length > 0) {
      setSeleccionadasIds(secundarias.map((s) => s.id));
    }
  }, [validacion]);

  if (!isOpen || !validacion) return null;

  const toggleSeleccion = (id: string) => {
    setSeleccionadasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarTodas = () => {
    setSeleccionadasIds(secundarias.map((s) => s.id));
  };

  const deseleccionarTodas = () => {
    setSeleccionadasIds([]);
  };

  const handleConfirmar = async () => {
    if (seleccionadasIds.length === 0) return;
    setSeparando(true);
    setErrorMsg(null);
    try {
      await onConfirmarSeparacion(mesaId, seleccionadasIds);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al desvincular las mesas');
    } finally {
      setSeparando(false);
    }
  };

  // Cálculos predictivos de las mesas que quedan y las que se van
  const secundariasADesvincular = secundarias.filter((s) => seleccionadasIds.includes(s.id));
  const secundariasQuePermanecen = secundarias.filter((s) => !seleccionadasIds.includes(s.id));
  const grupoQuedaraDisuelto = secundariasQuePermanecen.length === 0;

  const numerosRestantes = [mesaTitular.numero, ...secundariasQuePermanecen.map((s) => s.numero)].sort();
  const labelFuturo = grupoQuedaraDisuelto
    ? `Mesa ${mesaTitular.numero} (Individual)`
    : `Mesa [ ${numerosRestantes.join(' ; ')} ]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-amber-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wide">
                ✂️ Separar {validacion.mesa_label}
              </h2>
              <p className="text-xs text-slate-300">
                Gestión Física de Salón • Desvinculación Selectiva de Mesas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Banner de Consumo Activo: Reasegura que el pedido se conserva */}
          {validacion.tiene_consumo_activo && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs flex items-start gap-2.5">
              <Receipt className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Comanda y Consumos Activos Protegidos:</span>
                <p className="text-sky-800 mt-0.5 leading-relaxed">
                  El pedido actual de <strong className="font-mono">S/ {validacion.total_consumo?.toFixed(2) || '0.00'}</strong> ({validacion.items_activos || 0} platos) <strong>permanecerá activo e intacto</strong> en la <strong>Mesa Titular {mesaTitular.numero}</strong>. Las mesas que desvincules quedarán disponibles como libres.
                </p>
              </div>
            </div>
          )}

          {/* Bloque A: Mesa Titular (Fija) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              1. Mesa Principal (Ancla del pedido)
            </span>
            <div className="p-3 rounded-xl border-2 border-aurea-copper/40 bg-[#0B2340] text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-aurea-copper/20 flex items-center justify-center text-aurea-champagne">
                  <Anchor className="w-4 h-4 text-aurea-copper" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-white text-base">
                      MESA {mesaTitular.numero}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-aurea-copper/30 text-aurea-champagne border border-aurea-copper/40">
                      TITULAR
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      OCUPADA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Conserva la comanda y comensales sentados (No se libera).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 font-mono text-xs font-bold text-aurea-champagne px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                <Users className="w-3.5 h-3.5 text-aurea-copper" />
                <span>Cap: {mesaTitular.capacidad}p</span>
              </div>
            </div>
          </div>

          {/* Bloque B: Mesas Secundarias a Desvincular (Interactivas) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                2. Elige las mesas secundarias a desvincular
              </span>
              {secundarias.length > 1 && (
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={seleccionarTodas}
                    className="text-aurea-copper hover:underline font-semibold"
                  >
                    Marcar todas
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={deseleccionarTodas}
                    className="text-slate-500 hover:underline"
                  >
                    Desmarcar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {secundarias.map((s) => {
                const seleccionada = seleccionadasIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSeleccion(s.id)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between select-none ${
                      seleccionada
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          seleccionada
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {seleccionada && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-slate-900 text-sm">
                            MESA {s.numero}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              seleccionada
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {seleccionada ? 'SEPARAR Y LIBERAR' : 'MANTENER UNIDA'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {seleccionada
                            ? 'Volverá al salón en estado LIBRE e independiente.'
                            : 'Continuará anexa al grupo de la mesa titular.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-700 px-2 py-1 rounded-lg bg-white border border-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.capacidad}p</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen de Impacto */}
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1.5 text-slate-700">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>Resultado tras confirmar:</span>
            </div>
            <div className="text-[11px] space-y-1">
              <p>
                🟢 <strong>Mesas que pasan a LIBRE:</strong>{' '}
                {secundariasADesvincular.length > 0
                  ? secundariasADesvincular.map((s) => `Mesa ${s.numero}`).join(', ')
                  : 'Ninguna (selecciona al menos una mesa)'}
              </p>
              <p>
                🔵 <strong>Mesa(s) que continúan OCUPADAS con el pedido:</strong>{' '}
                <strong className="text-slate-900">{labelFuturo}</strong>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={separando}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors min-h-[44px]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={separando || seleccionadasIds.length === 0}
            className="py-2.5 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-sm active:scale-98"
          >
            {separando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Separando mesas...</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>
                  ✂️ Separar {seleccionadasIds.length}{' '}
                  {seleccionadasIds.length === 1 ? 'Mesa' : 'Mesas'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
