import React from 'react';
import { RotateCcw, Clock, Utensils, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { KDSPedidoDespachadoDTO, MetricasDespachoDTO } from '@/types/cocina';

interface ModalHistorialDespachadosProps {
  abierto: boolean;
  onCerrar: () => void;
  pedidos: KDSPedidoDespachadoDTO[];
  metricas: MetricasDespachoDTO;
  onRecuperarPedido: (pedidoId: string) => void;
}

export const ModalHistorialDespachados: React.FC<ModalHistorialDespachadosProps> = ({
  abierto,
  onCerrar,
  pedidos,
  metricas,
  onRecuperarPedido,
}) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl w-full max-w-[1120px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabecera del Modal (1120px) */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>BANDEJA DE PEDIDOS DESPACHADOS</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-aurea-champagne border border-slate-700 font-mono">
                  ÚLTIMOS 30 MINUTOS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Permite recuperar a fogones pedidos despachados por equivocación o reclamo de sala. Cero pérdida de comandas.
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver a Pantalla de Cocina</span>
          </button>
        </div>

        {/* Fila de Métricas Operativas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/60 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <p className="text-[11px] font-mono uppercase text-slate-400">Despachados (30m)</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {metricas.despachadosUltimos30m} <span className="text-xs font-normal text-slate-400">Comandas</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <p className="text-[11px] font-mono uppercase text-slate-400">Tiempo Prom. Cocción</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-aurea-champagne">
              {metricas.tiempoPromedioCoccionMin} <span className="text-xs font-normal text-slate-400">min</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <p className="text-[11px] font-mono uppercase text-slate-400">Tiempo Prom. en Pase</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-cyan-400">
              {metricas.tiempoPromedioPaseMin} <span className="text-xs font-normal text-slate-400">min</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <p className="text-[11px] font-mono uppercase text-slate-400">Total Turno Hoy</p>
            <p className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-200">
              {metricas.totalTurnoHoy} <span className="text-xs font-normal text-slate-400">Pedidos</span>
            </p>
          </div>
        </div>

        {/* Área Principal: Grid de Pedidos Despachados */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {pedidos.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="font-semibold text-slate-300">No hay pedidos despachados recientemente</p>
              <p className="text-xs text-slate-500 mt-1">
                Las órdenes despachadas durante los últimos 30 minutos aparecerán aquí para posible recuperación.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pedidos.map((pedido) => {
                const horaDespacho = new Date(pedido.fecha_despacho).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <article
                    key={pedido.pedido_id}
                    className="rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between overflow-hidden shadow-sm hover:border-slate-700 transition-all"
                  >
                    {/* Header de Tarjeta */}
                    <div className="p-3.5 bg-slate-900/80 border-b border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-base text-white">
                          <Utensils className="w-4 h-4 text-emerald-400" />
                          <span>MESA {pedido.mesa_codigo}</span>
                          <span className="text-xs font-normal text-slate-400">
                            #{pedido.numero_comanda}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          ✓ Hace {pedido.minutos_desde_despacho}m
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
                        <span>{pedido.piso_nombre} • {pedido.mozo_nombre}</span>
                        <span className="text-[11px] font-mono text-slate-500">{horaDespacho}</span>
                      </div>
                    </div>

                    {/* Desglose de Platos Servidos */}
                    <div className="p-3.5 space-y-2 flex-1 text-xs text-slate-300">
                      <p className="text-[11px] font-mono uppercase text-slate-400 font-bold border-b border-slate-800/60 pb-1">
                        Platos Despachados ({pedido.total_items}):
                      </p>
                      <ul className="space-y-1.5">
                        {pedido.items_resumen.map((it, idx) => (
                          <li key={idx} className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-emerald-400">{it.cantidad}x</span>
                              <span className="font-medium text-slate-200">{it.producto_nombre}</span>
                            </div>
                            {it.nota_cocina && (
                              <span className="text-[10px] text-amber-300/80 pl-5">
                                📝 {it.nota_cocina}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botón de Recuperación Táctil (Recall) */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800">
                      {pedido.puede_recuperar ? (
                        <button
                          onClick={() => onRecuperarPedido(pedido.pedido_id)}
                          className="w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-sky-600 hover:bg-sky-500 text-white shadow"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>[ ↺ Devolver a Cocina (Recall) ]</span>
                        </button>
                      ) : (
                        <div className="w-full min-h-[44px] rounded-xl font-mono text-xs flex items-center justify-center gap-1.5 bg-slate-800/50 text-slate-500 border border-slate-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
                          <span>Recuperación expirada (&gt;30m)</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Al devolver un pedido a cocina, reaparece en el tablero activo con sus platos en fuego.</span>
          <button
            onClick={onCerrar}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
