import React from 'react';
import { X, Utensils, Link2, CheckCircle2, Flame, ArrowLeft } from 'lucide-react';
import { KDSComandaDTO } from '@/types/cocina';

interface ModalDetalleComandaProps {
  comanda: KDSComandaDTO | null;
  onClose: () => void;
  onCambiarEstadoItem: (itemId: string, nuevoEstado: 'en_preparacion' | 'listo') => void;
  onDespacharTodo: (pedidoId: string) => void;
}

export const ModalDetalleComanda: React.FC<ModalDetalleComandaProps> = ({
  comanda,
  onClose,
  onCambiarEstadoItem,
  onDespacharTodo,
}) => {
  if (!comanda) return null;

  const esRojo = comanda.semaforo_color === 'rojo';
  const esAmbar = comanda.semaforo_color === 'ambar';

  const badgeColor = esRojo
    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
    : esAmbar
    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-lg sm:text-xl text-white">
                FICHA TÉCNICA DE COMANDA #{comanda.numero_comanda}
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1 font-mono font-bold text-lg text-aurea-champagne">
                {comanda.es_mesa_agrupada ? (
                  <Link2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <Utensils className="w-4 h-4" />
                )}
                <span>MESA {comanda.mesa_codigo}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {comanda.piso_nombre} • {comanda.ronda_tipo === 'adicional' ? `Ronda ${comanda.ronda_numero} (Adicionales)` : `Ronda ${comanda.ronda_numero} (Entradas y Principales)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${badgeColor}`}>
              ⏱️ {comanda.minutos_espera} min ({esRojo ? 'Crítico' : esAmbar ? 'Alerta' : 'Óptimo'})
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadatos de la Comanda */}
        <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Mozo Asignado:</span>
            <strong className="text-slate-200">{comanda.mozo_nombre}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Comensales:</span>
            <strong className="text-slate-200">{comanda.comensales} personas</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Hora de Envío:</span>
            <strong className="text-slate-200 font-mono">
              {new Date(comanda.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Estado General:</span>
            <strong className="text-emerald-400">En Preparación</strong>
          </div>
        </div>

        {/* Lista de Platos con Trazabilidad de Receta e Insumos */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {comanda.items.map((item) => {
            const esListo = item.estado === 'listo';
            const esEnFuego = item.estado === 'en_preparacion';
            const esAnulado = item.estado === 'anulado';

            return (
              <div
                key={item.item_id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5"
              >
                {/* Cabecera del Plato */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-aurea-champagne">
                      {item.cantidad}x
                    </span>
                    <span className="font-bold text-base text-white">
                      {item.nombre_producto}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {item.categoria_nombre}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      esListo
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : esEnFuego
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : esAnulado
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {esListo
                      ? '✓ LISTO EN PASE'
                      : esEnFuego
                      ? '🔥 EN FUEGO'
                      : esAnulado
                      ? 'ANULADO'
                      : 'EN COLA'}
                  </span>
                </div>

                {/* Nota de Comensal / Alérgenos */}
                {item.nota_cocina && (
                  <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-700/50 text-amber-200 text-xs">
                    📝 <strong>Especificación:</strong> {item.nota_cocina}
                  </div>
                )}

                {/* Ficha de Receta Culinaria (CU-ADMIN-04 / producto_insumo + insumo) */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                  <span className="text-[11px] font-mono text-aurea-copper block font-semibold mb-1">
                    🍲 Receta Culinaria (Insumos de Almacén):
                  </span>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {item.receta_resumen}
                  </p>
                </div>

                {/* Acciones del Plato */}
                {!esListo && !esAnulado && (
                  <div className="pt-1 flex items-center justify-end gap-2">
                    {item.estado === 'en_cola' && (
                      <button
                        onClick={() => onCambiarEstadoItem(item.item_id, 'en_preparacion')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors flex items-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Iniciar Cocción</span>
                      </button>
                    )}
                    <button
                      onClick={() => onCambiarEstadoItem(item.item_id, 'listo')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Marcar Terminado</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Despacho Directo en Salón */}
          {comanda.bebidas_salon_count > 0 && (
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300 block">
                  🥤 Despacho Directo en Salón (requiere_preparacion = false):
                </span>
                <span>{comanda.bebidas_salon_count} bebidas atendidas directamente por mozo en mesa.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[11px]">
                ✓ SERVIDO EN MESA
              </span>
            </div>
          )}
        </div>

        {/* Botones de Pie de Modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Tablero KDS</span>
          </button>

          <button
            onClick={() => {
              onDespacharTodo(comanda.pedido_id);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ Despachar Todo al Pase de Salón</span>
          </button>
        </div>
      </div>
    </div>
  );
};
