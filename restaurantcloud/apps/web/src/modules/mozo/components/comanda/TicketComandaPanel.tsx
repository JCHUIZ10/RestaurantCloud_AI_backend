import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  RotateCcw,
  Receipt,
  ShoppingCart,
} from 'lucide-react';
import { ItemPedidoBorrador, ItemDetalleComandaDTO } from '@/types/mozo';

interface TicketComandaPanelProps {
  mesaNumero: string;
  rondaActual: number;
  itemsBorrador: ItemPedidoBorrador[];
  rondaPreviaItems?: ItemDetalleComandaDTO[];
  totalPrevio?: number;
  onIncrementarCantidad: (itemId: string) => void;
  onDecrementarCantidad: (itemId: string) => void;
  onEliminarItem: (itemId: string) => void;
  onAbrirModalNota: (item: ItemPedidoBorrador) => void;
  onConfirmarEnvio: () => void;
  onDescartarBorrador: () => void;
  enviando: boolean;
}

export const TicketComandaPanel: React.FC<TicketComandaPanelProps> = ({
  mesaNumero,
  rondaActual,
  itemsBorrador,
  rondaPreviaItems = [],
  totalPrevio = 0,
  onIncrementarCantidad,
  onDecrementarCantidad,
  onEliminarItem,
  onAbrirModalNota,
  onConfirmarEnvio,
  onDescartarBorrador,
  enviando,
}) => {
  const [mostrarRondaPrevia, setMostrarRondaPrevia] = useState(false);

  // Split transaccional de ítems
  const itemsCocina = itemsBorrador.filter((it) => it.requiere_preparacion);
  const itemsDirecto = itemsBorrador.filter((it) => !it.requiere_preparacion);

  // Cálculos contables de la ronda en curso
  const totalRonda = itemsBorrador.reduce(
    (acc, it) => acc + it.precio_unitario * it.cantidad,
    0
  );
  const subtotalSinIgv = totalRonda / 1.18;
  const igvCalculado = totalRonda - subtotalSinIgv;

  const totalConsolidado = totalPrevio + totalRonda;
  const tieneItems = itemsBorrador.length > 0;

  return (
    <div className="w-full lg:w-[460px] xl:w-[480px] flex flex-col h-full bg-white border-l border-slate-200 shrink-0 shadow-lg">
      {/* 1. Cabecera del Ticket */}
      <div className="p-3.5 sm:p-4 bg-aurea-navy text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-aurea-copper" />
          <div>
            <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <span>COMANDA MESA {mesaNumero}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-aurea-copper text-aurea-navy">
                Ronda #{rondaActual}
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              {rondaActual === 1 ? 'Pedido inicial de mesa' : 'Ronda de consumos adicionales'}
            </p>
          </div>
        </div>

        {tieneItems && (
          <button
            onClick={onDescartarBorrador}
            className="text-[11px] text-rose-300 hover:text-rose-100 flex items-center gap-1 p-1 hover:bg-white/10 rounded transition-colors"
            title="Limpiar platos del borrador"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descartar</span>
          </button>
        )}
      </div>

      {/* 2. Cuerpo del Ticket desplazable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* Acordeón de Ronda Histórica Previa (Vista 3: Segunda Ronda) */}
        {rondaPreviaItems.length > 0 && (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <button
              onClick={() => setMostrarRondaPrevia(!mostrarRondaPrevia)}
              className="w-full p-2.5 bg-slate-100/90 text-slate-700 flex items-center justify-between text-xs font-semibold hover:bg-slate-200/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ronda #01 previa (Servida / En cocina)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800">
                  S/ {totalPrevio.toFixed(2)}
                </span>
                {mostrarRondaPrevia ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </button>

            {mostrarRondaPrevia && (
              <div className="p-3 space-y-2 border-t border-slate-200 bg-white text-xs">
                {rondaPreviaItems.map((prev) => (
                  <div
                    key={prev.id}
                    className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-1.5 last:border-0"
                  >
                    <div>
                      <span className="font-bold text-slate-800 mr-1.5">
                        {prev.cantidad}x
                      </span>
                      <span>{prev.producto_nombre}</span>
                      {prev.nota_cocina && (
                        <p className="text-[10px] text-amber-700 italic">
                          Nota: {prev.nota_cocina}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-medium">
                      S/ {prev.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Estado Vacío cuando no hay platos en borrador */}
        {!tieneItems && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ShoppingCart className="w-10 h-10 mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600">Borrador de Comanda Vacío</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Toca <strong>[ ＋ Añadir ]</strong> en los platos del catálogo izquierdo para armar la orden de la Mesa {mesaNumero}.
            </p>
          </div>
        )}

        {/* SECCIÓN 1: COCINA KDS (PREPARACIÓN) */}
        {itemsCocina.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-orange-200">
              <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Cocina KDS (Preparación)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 font-mono">
                {itemsCocina.length} plato{itemsCocina.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {itemsCocina.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-orange-50/40 border border-orange-200/80 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                        {item.nombre}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        S/ {item.precio_unitario.toFixed(2)} c/u
                      </span>
                    </div>

                    <span className="font-mono font-extrabold text-sm text-aurea-navy">
                      S/ {(item.precio_unitario * item.cantidad).toFixed(2)}
                    </span>
                  </div>

                  {/* Stepper y Acciones */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-orange-100">
                    {/* Botón Nota Cocina */}
                    <button
                      onClick={() => onAbrirModalNota(item)}
                      className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        item.nota_cocina
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-aurea-copper" />
                      <span className="truncate max-w-[150px]">
                        {item.nota_cocina ? `Nota: ${item.nota_cocina}` : '+ Nota a cocina'}
                      </span>
                    </button>

                    {/* Stepper táctil */}
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
                      <button
                        onClick={() => onDecrementarCantidad(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Restar 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-7 text-center font-mono font-bold text-slate-900 text-xs">
                        {item.cantidad}
                      </span>

                      <button
                        onClick={() => onIncrementarCantidad(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        title="Sumar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEliminarItem(item.id)}
                        className="w-7 h-7 ml-1 flex items-center justify-center rounded text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Quitar plato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: PRODUCTOS DE DESPACHO DIRECTO */}
        {itemsDirecto.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-sky-200">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5 text-sky-600" />
                <span>Productos de Despacho Directo (Entrega directa)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 font-mono">
                {itemsDirecto.length} ítem{itemsDirecto.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {itemsDirecto.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-sky-50/40 border border-sky-200/80 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-[13px]">
                        {item.nombre}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        S/ {item.precio_unitario.toFixed(2)} c/u
                      </span>
                    </div>

                    <span className="font-mono font-extrabold text-sm text-aurea-navy">
                      S/ {(item.precio_unitario * item.cantidad).toFixed(2)}
                    </span>
                  </div>

                  {/* Stepper y Acciones */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-sky-100">
                    <button
                      onClick={() => onAbrirModalNota(item)}
                      className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        item.nota_cocina
                          ? 'bg-sky-100 border-sky-300 text-sky-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-sky-600" />
                      <span className="truncate max-w-[150px]">
                        {item.nota_cocina ? `Servicio: ${item.nota_cocina}` : '+ Indicación'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
                      <button
                        onClick={() => onDecrementarCantidad(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-7 text-center font-mono font-bold text-slate-900 text-xs">
                        {item.cantidad}
                      </span>

                      <button
                        onClick={() => onIncrementarCantidad(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEliminarItem(item.id)}
                        className="w-7 h-7 ml-1 flex items-center justify-center rounded text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel Financiero y Botón de Despacho Principal */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
        {/* Desglose Contable */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal Consumo (sin IGV):</span>
            <span className="font-mono">S/ {subtotalSinIgv.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>IGV (18% incluido):</span>
            <span className="font-mono">S/ {igvCalculado.toFixed(2)}</span>
          </div>

          {rondaActual > 1 && totalPrevio > 0 && (
            <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Ronda #01 previa:</span>
              <span className="font-mono font-semibold">S/ {totalPrevio.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
            <span className="font-bold text-slate-900">
              {rondaActual > 1 ? 'TOTAL CONSOLIDADO:' : 'TOTAL COMANDA:'}
            </span>
            <span className="font-serif text-xl sm:text-2xl font-black text-aurea-navy">
              S/ {(rondaActual > 1 ? totalConsolidado : totalRonda).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botón Principal de Envío */}
        <button
          onClick={onConfirmarEnvio}
          disabled={!tieneItems || enviando}
          className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm touch-manipulation active:scale-98 ${
            tieneItems && !enviando
              ? 'bg-aurea-navy hover:bg-slate-800 text-white cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {enviando ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Despachando a Cocina...</span>
            </div>
          ) : (
            <>
              <Send className="w-4 h-4 text-aurea-copper" />
              <span>
                {rondaActual > 1
                  ? `🚀 Enviar Ronda #${rondaActual} (${itemsCocina.length} Cocina • ${itemsDirecto.length} Salón)`
                  : `🚀 Confirmar y Enviar (${itemsCocina.length} Cocina • ${itemsDirecto.length} Salón)`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
