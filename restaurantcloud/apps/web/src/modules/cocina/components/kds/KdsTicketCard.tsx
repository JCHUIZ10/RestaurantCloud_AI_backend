import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle2, RotateCcw, AlertTriangle, Users, Utensils, Link2, BellRing, Eye, Timer, NotebookPen, CupSoda } from 'lucide-react';
import { KDSComandaDTO } from '@/types/cocina';

interface KdsTicketCardProps {
  comanda: KDSComandaDTO;
  onCambiarEstadoItem: (itemId: string, nuevoEstado: 'en_preparacion' | 'listo') => void;
  onDeshacerListo: (itemId: string) => void;
  onDespacharTodo: (pedidoId: string) => void;
  onVerDetalle: (comanda: KDSComandaDTO) => void;
}

export const KdsTicketCard: React.FC<KdsTicketCardProps> = ({
  comanda,
  onCambiarEstadoItem,
  onDeshacerListo,
  onDespacharTodo,
  onVerDetalle,
}) => {
  // Tiempo relativo en vivo en segundos
  const [segundos, setSegundos] = useState(comanda.segundos_transcurridos);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutos = Math.floor(segundos / 60);
  const segRestantes = segundos % 60;
  const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`;

  // Clases cromáticas según semáforo de configuracion_kds
  const esRojo = comanda.semaforo_color === 'rojo';
  const esAmbar = comanda.semaforo_color === 'ambar';

  const borderClass = esRojo
    ? 'border-2 border-rose-500 shadow-rose-950/50 shadow-lg'
    : esAmbar
    ? 'border-2 border-amber-500'
    : 'border-2 border-emerald-500';

  const headerBgClass = esRojo
    ? 'bg-rose-950/80 border-b border-rose-800/80 text-rose-100'
    : esAmbar
    ? 'bg-amber-950/80 border-b border-amber-800/80 text-amber-100'
    : 'bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-100';

  const todosListos = comanda.items.every(
    (i) => i.estado === 'listo' || i.estado === 'anulado'
  );

  return (
    <article
      className={`rounded-2xl bg-slate-900 flex flex-col justify-between overflow-hidden transition-all duration-200 select-none ${borderClass}`}
    >
      {/* Cabecera del Ticket (Mesa, Ronda, Mozo, PAX y Timer) */}
      <div className={`p-3 sm:p-3.5 ${headerBgClass}`}>
        <div className="flex items-center justify-between gap-2">
          {/* Identificador de Mesa */}
          <div className="flex items-center gap-2">
            {comanda.es_mesa_agrupada ? (
              <span className="flex items-center gap-1 font-mono font-bold text-base sm:text-lg text-white">
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>MESA {comanda.mesa_codigo}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono font-bold text-base sm:text-lg text-white">
                <Utensils className="w-4 h-4 text-aurea-champagne" />
                <span>MESA {comanda.mesa_codigo}</span>
              </span>
            )}

            {/* Número de Comanda */}
            <span className="text-[11px] font-mono text-slate-300">
              #{comanda.numero_comanda}
            </span>
          </div>

          {/* Badge de Ronda */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              comanda.ronda_tipo === 'adicional'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}
          >
            {comanda.ronda_tipo === 'adicional'
              ? `RONDA ${comanda.ronda_numero} ADIC`
              : `RONDA ${comanda.ronda_numero}`}
          </span>
        </div>

        {/* Datos de Salón: Mozo y Comensales */}
        <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
          <span className="truncate">Mozo: {comanda.mozo_nombre}</span>
          <span className="flex items-center gap-1 shrink-0 font-mono">
            <Users className="w-3.5 h-3.5" />
            {comanda.comensales} pax
          </span>
        </div>

        {/* Banner Crítico en Rojo (>25m) */}
        {esRojo && (
          <div className="mt-2 px-2 py-1 rounded bg-rose-600 text-white font-mono font-bold text-xs flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              REQUERIDO FOGÓN INMEDIATO
            </span>
            <span>&gt;25m</span>
          </div>
        )}

        {/* Temporizador Dinámico */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono font-bold text-sm sm:text-base">
            <Timer className="w-4 h-4" />
            <span>{tiempoFormateado} min</span>
            <span className="text-[11px] font-normal opacity-80">
              {esRojo
                ? 'CRÍTICO'
                : esAmbar
                ? comanda.es_mesa_agrupada
                  ? 'GRUPO UNIDO'
                  : 'ADVERTENCIA'
                : 'ÓPTIMO'}
            </span>
          </div>

          <button
            onClick={() => onVerDetalle(comanda)}
            title="Ver receta y detalle ampliado"
            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4 text-aurea-champagne" />
          </button>
        </div>
      </div>

      {/* Lista de Ítems Culinarios de la Comanda */}
      <div className="p-3 sm:p-3.5 space-y-3 flex-1 overflow-y-auto">
        {comanda.items.map((item) => {
          const esListo = item.estado === 'listo';
          const esEnFuego = item.estado === 'en_preparacion';
          const esAnulado = item.estado === 'anulado';
          const esEnCola = item.estado === 'en_cola';

          return (
            <div
              key={item.item_id}
              className={`p-2.5 rounded-xl border transition-all ${
                esAnulado
                  ? 'bg-rose-950/20 border-rose-900/50 opacity-70'
                  : esListo
                  ? 'bg-emerald-950/30 border-emerald-900/50'
                  : esEnFuego
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              {/* Línea Principal del Plato */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-black text-base sm:text-lg ${
                        esAnulado
                          ? 'line-through text-slate-500'
                          : esListo
                          ? 'text-emerald-400'
                          : 'text-aurea-champagne'
                      }`}
                    >
                      {item.cantidad}x
                    </span>
                    <span
                      className={`font-semibold text-sm sm:text-base leading-snug ${
                        esAnulado
                          ? 'line-through text-slate-500'
                          : esListo
                          ? 'text-slate-300'
                          : 'text-white'
                      }`}
                    >
                      {item.nombre_producto}
                    </span>
                  </div>

                  {/* Categoría real de la carta */}
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                    {item.categoria_nombre}
                  </span>
                </div>

                {/* Badge de Anulado */}
                {esAnulado && (
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-xs uppercase">
                    ANULADO
                  </span>
                )}
              </div>

              {/* Notas de Cocina / Alérgenos */}
              {item.nota_cocina && (
                <div className="mt-2 p-1.5 rounded-lg bg-amber-950/40 border border-amber-700/50 text-amber-200 text-xs font-medium flex items-start gap-1.5">
                  <NotebookPen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{item.nota_cocina}</span>
                </div>
              )}

              {/* Botones Táctiles de Acción Culinaria (Touch Targets >= 44px - CU-COCINA-02) */}
              {!esAnulado && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {esEnCola && (
                    <button
                      onClick={() => onCambiarEstadoItem(item.item_id, 'en_preparacion')}
                      className="w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 shadow"
                    >
                      <Flame className="w-4 h-4 fill-current" />
                      <span>Poner en Fuego</span>
                    </button>
                  )}

                  {esEnFuego && (
                    <div className="w-full flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1.5 rounded-lg border border-amber-800/60">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
                          <span>En Fuego</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          {(() => {
                            if (!item.fecha_inicio_coccion) return '00:00';
                            const diffSec = Math.max(0, Math.floor((Date.now() - new Date(item.fecha_inicio_coccion).getTime()) / 1000));
                            const m = Math.floor(diffSec / 60);
                            const s = diffSec % 60;
                            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                          })()}
                        </span>
                      </div>

                      <button
                        onClick={() => onCambiarEstadoItem(item.item_id, 'listo')}
                        className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow ${
                          esRojo
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{esRojo ? 'Listo Urgente' : 'Listo en Pase'}</span>
                      </button>
                    </div>
                  )}

                  {esListo && (
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>LISTO EN PASE</span>
                      </div>

                      {(() => {
                        const segundosRestantes = item.deshacer_hasta
                          ? Math.max(0, Math.ceil((item.deshacer_hasta - Date.now()) / 1000))
                          : 0;

                        if (segundosRestantes > 0) {
                          return (
                            <button
                              onClick={() => onDeshacerListo(item.item_id)}
                              className="min-h-[38px] px-3 rounded-lg text-xs font-bold transition-all bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 shadow animate-pulse"
                              title="Revertir a fuego y restaurar existencias en inventario"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>[ ↺ Deshacer ({segundosRestantes}s) ]</span>
                            </button>
                          );
                        }

                        return (
                          <span className="text-[10px] font-mono text-slate-500">
                            (Deshacer vencido)
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pie del Ticket: Bebidas de Salón y Despacho Masivo */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 space-y-2">
        {/* Chip informativo de bebidas atendidas por mozo (requiere_preparacion = false) */}
        {comanda.bebidas_salon_count > 0 && (
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center justify-between">
            <span>🥤 {comanda.bebidas_salon_count} Bebidas de salón</span>
            <span className="text-[10px] text-slate-500">Atend. por mozo</span>
          </div>
        )}

        {/* Botón de Despacho Masivo de la Comanda */}
        <button
          onClick={() => onDespacharTodo(comanda.pedido_id)}
          className={`w-full min-h-[46px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            esRojo
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : todosListos
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {esRojo ? (
            <>
              <BellRing className="w-4 h-4" />
              <span>[ 🚨 Despachar y Notificar Mozo ]</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>[ ✓ Despachar Todo al Pase ]</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
