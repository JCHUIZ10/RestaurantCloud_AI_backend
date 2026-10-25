import React from 'react';
import { Flame, Clock, Lightbulb, ConciergeBell, CheckCircle2 } from 'lucide-react';
import { ConsolidadoAllDayDTO } from '@/types/cocina';

interface ConsolidadoAllDayViewProps {
  consolidado: ConsolidadoAllDayDTO[];
  onIniciarCoccionPlato?: (productoId: string) => void;
  onPonerEnFuegoTanda?: (productoId: string) => void;
  onMarcarListoTanda?: (productoId: string, cantidad: number) => void;
}

export const ConsolidadoAllDayView: React.FC<ConsolidadoAllDayViewProps> = ({
  consolidado,
  onPonerEnFuegoTanda,
  onMarcarListoTanda,
}) => {
  // Cálculos globales
  const totalRaciones = consolidado.reduce((acc, cat) => acc + cat.total_raciones, 0);
  const totalEnFuego = consolidado.reduce(
    (acc, cat) => acc + cat.platos.reduce((pAcc, p) => pAcc + p.cantidad_en_fuego, 0),
    0
  );
  const totalEnCola = totalRaciones - totalEnFuego;

  if (consolidado.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <ConciergeBell className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-serif font-bold text-xl text-white mb-1">
          ¡Producción al día! No hay raciones pendientes
        </h3>
        <p className="text-sm text-slate-400 max-w-md">
          Todas las raciones activas han sido completadas o despachadas al pase de salón.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 animate-fadeIn select-none">
      {/* Subbarra informativa de Producción All-Day */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2 sm:gap-4 font-mono">
          <span className="text-white font-semibold">
            Total Raciones Pendientes: <strong className="text-aurea-champagne font-black">{totalRaciones}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-300">
            En Fuego / Sartenes: <strong className="text-amber-400 font-bold">{totalEnFuego}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-300">
            En Cola: <strong className="text-slate-200 font-bold">{totalEnCola}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-aurea-copper font-medium text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Lightbulb className="w-4 h-4 shrink-0" />
          <span>Cocción masiva por tandas acumuladas en wok/horno</span>
        </div>
      </div>

      {/* Rejilla de Columnas agrupadas por Categorías de la Carta Gastronómica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 items-start">
        {consolidado.map((cat) => (
          <div
            key={cat.categoria_nombre}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col"
          >
            {/* Cabecera de Categoría */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="font-serif font-bold text-sm sm:text-base text-white tracking-wide">
                {cat.categoria_nombre}
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-aurea-copper/20 text-aurea-champagne border border-aurea-copper/40">
                {cat.total_raciones} raciones
              </span>
            </div>

            {/* Lista de Platos Consolidados */}
            <div className="p-3 space-y-3">
              {cat.platos.map((plato) => {
                const racionesEnCola = plato.cantidad_total - plato.cantidad_en_fuego;

                return (
                  <div
                    key={plato.producto_id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                  >
                    {/* Fila del Plato con Total */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm sm:text-base text-white">
                        {plato.nombre_producto}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg font-mono font-black text-sm bg-slate-800 text-aurea-champagne border border-slate-700">
                        {plato.cantidad_total}x
                      </span>
                    </div>

                    {/* Estado rápido de fuego */}
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      {plato.cantidad_en_fuego > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          {plato.cantidad_en_fuego} en fuego
                        </span>
                      )}
                      {plato.cantidad_critica > 0 && (
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {plato.cantidad_critica} en alerta crítica
                        </span>
                      )}
                    </div>

                    {/* Botones de Acción por Tandas (CU-COCINA-02 Vista 3) */}
                    <div className="flex items-center gap-2 pt-1">
                      {racionesEnCola > 0 && onPonerEnFuegoTanda && (
                        <button
                          onClick={() => onPonerEnFuegoTanda(plato.producto_id)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono text-[11px] transition-all flex items-center justify-center gap-1 shadow"
                          title="Poner en fuego todas las raciones en cola de este plato"
                        >
                          <Flame className="w-3 h-3 fill-current" />
                          <span>Poner {racionesEnCola}x en Fuego</span>
                        </button>
                      )}

                      {plato.cantidad_en_fuego > 0 && onMarcarListoTanda && (
                        <button
                          onClick={() => onMarcarListoTanda(plato.producto_id, plato.cantidad_en_fuego)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-[11px] transition-all flex items-center justify-center gap-1 shadow"
                          title="Marcar listos en pase todas las raciones en fuego (FIFO)"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{plato.cantidad_en_fuego}x en Pase</span>
                        </button>
                      )}
                    </div>

                    {/* Desglose de Mesas Involucradas */}
                    <div className="pt-2 border-t border-slate-900 space-y-1 text-xs">
                      {plato.detalle_mesas.map((m, idx) => (
                        <div
                          key={`${m.mesa_codigo}-${idx}`}
                          className="flex items-center justify-between text-slate-300 py-0.5"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-aurea-champagne font-bold">
                              • Mesa {m.mesa_codigo} ({m.cantidad}x)
                            </span>
                            {m.nota_cocina && (
                              <span className="text-[11px] text-amber-300 truncate">
                                [{m.nota_cocina}]
                              </span>
                            )}
                          </div>

                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                              m.estado === 'en_preparacion'
                                ? 'bg-amber-950/80 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m.estado === 'en_preparacion' ? 'Fuego' : 'En cola'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
