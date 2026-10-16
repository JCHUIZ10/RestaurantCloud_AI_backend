import React, { useState, useMemo, useEffect } from 'react';
import { Flame, X, AlertOctagon, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { ItemEnFuegoResolucionDTO, PlatoDisponibilidadDTO } from '@/types/cocina';

interface DialogoResolucionFuegoProps {
  abierto: boolean;
  onCerrar: () => void;
  plato: PlatoDisponibilidadDTO | null;
  itemsEnFuego: ItemEnFuegoResolucionDTO[];
  onConfirmar: (
    productoId: string,
    itemsEnFuegoNoAlcanzadosIds: string[],
    motivo: string
  ) => void;
}

export const DialogoResolucionFuego: React.FC<DialogoResolucionFuegoProps> = ({
  abierto,
  onCerrar,
  plato,
  itemsEnFuego,
  onConfirmar,
}) => {
  const [porcionesCubiertas, setPorcionesCubiertas] = useState<number>(0);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>(
    'Falta de insumo fresco en partida culinaria'
  );

  const totalRacionesEnFuego = useMemo(() => {
    return (itemsEnFuego || []).reduce((acc, it) => acc + (it.cantidad || 0), 0);
  }, [itemsEnFuego]);

  // Sincronizar porciones cubiertas cuando se abre el diálogo o cambia el total en fuego
  useEffect(() => {
    if (abierto && plato) {
      setPorcionesCubiertas(Math.max(0, totalRacionesEnFuego - 1));
    }
  }, [abierto, plato, totalRacionesEnFuego]);

  // Determinar cuáles ítems quedan cubiertos (FIFO) y cuáles pasan a no_disponible
  const evaluacionItems = useMemo(() => {
    let saldo = porcionesCubiertas;
    const safeItems = itemsEnFuego || [];
    const resultado = safeItems.map((it) => {
      const cubierto = saldo >= it.cantidad;
      if (cubierto) {
        saldo -= it.cantidad;
      }
      return {
        ...it,
        cubierto,
      };
    });
    return resultado;
  }, [itemsEnFuego, porcionesCubiertas]);

  const noAlcanzados = useMemo(() => {
    return evaluacionItems.filter((i) => !i.cubierto);
  }, [evaluacionItems]);

  const handleConfirmarResolucion = () => {
    if (!plato) return;
    const idsNoAlcanzados = noAlcanzados.map((i) => i.item_id);
    onConfirmar(plato.producto_id, idsNoAlcanzados, motivoSeleccionado);
    onCerrar();
  };

  if (!abierto || !plato) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-rose-500/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-rose-950/60 border-b border-rose-900/60 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-white">
                  RESOLUCIÓN DE ÓRDENES EN FUEGO
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-900/80 text-rose-200 border border-rose-700 font-bold">
                  CU-COCINA-04
                </span>
              </div>
              <p className="text-xs text-rose-300 font-mono">
                Plato: <strong>{plato.nombre}</strong> ({totalRacionesEnFuego} raciones activas en fuego)
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Diálogo */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200 text-xs flex-1">
          {/* Advertencia Operativa */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Regla de Protección de Salón y No Desperdicio:</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Al declarar quiebre culinario, las órdenes que aún están <em>en cola</em> se cancelan automáticamente. Para las raciones que ya están <em>en sartén/wok</em>, selecciona con precisión para cuántas porciones alcanza la mise en place restante.
            </p>
          </div>

          {/* Selector Numérico FIFO */}
          <div className="space-y-2">
            <label className="font-bold text-slate-200 text-xs block">
              ¿Para cuántas porciones te alcanza la mise en place disponible en partida?
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: totalRacionesEnFuego + 1 }, (_, i) => i).map((num) => {
                const seleccionado = porcionesCubiertas === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPorcionesCubiertas(num)}
                    className={`min-h-[48px] min-w-[56px] px-3.5 rounded-xl font-mono font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                      seleccionado
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {num === 0 ? '0 (Ninguno)' : num === totalRacionesEnFuego ? `${num} (Todas)` : num}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              * El sistema aplica criterio <strong>FIFO</strong> automático: se completan prioritariamente las comandas con mayor tiempo de espera.
            </p>
          </div>

          {/* Desglose por Comanda */}
          <div className="space-y-2">
            <span className="font-bold text-slate-300 text-xs block">
              Distribución Comanda por Comanda en Fogones:
            </span>
            <div className="space-y-2">
              {evaluacionItems.map((item) => (
                <div
                  key={item.item_id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    item.cubierto
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-sm text-white">
                        Comanda #{item.numero_comanda}
                      </strong>
                      <span>•</span>
                      <span className="font-semibold text-slate-200">
                        Mesa {item.mesa_codigo}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-amber-300">
                        ⏱️ {item.minutos_espera} min espera
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mozo: {item.mozo_nombre} • Cantidad: {item.cantidad} ración(es)
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 shrink-0 ${
                      item.cubierto
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-rose-600 text-white shadow'
                    }`}
                  >
                    {item.cubierto ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SE PREPARA ({item.cantidad})</span>
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>NO ALCANZA ({item.cantidad})</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selector de Causa */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 text-xs block">
              Causa del Quiebre Culinario:
            </label>
            <select
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="Falta de insumo fresco en partida culinaria">
                Falta de insumo fresco en partida culinaria
              </option>
              <option value="Merma imprevista en proceso de cocción">
                Merma imprevista en proceso de cocción
              </option>
              <option value="Falla mecánica en wok / equipamiento de cocina">
                Falla mecánica en wok / equipamiento de cocina
              </option>
            </select>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onCerrar}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancelar y Mantener en Fuego</span>
          </button>

          <button
            onClick={handleConfirmarResolucion}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl transition-all flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            <span>
              ⚡ CONFIRMAR Y AVISAR A MOZOS ({noAlcanzados.length} Comandas Observadas)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
