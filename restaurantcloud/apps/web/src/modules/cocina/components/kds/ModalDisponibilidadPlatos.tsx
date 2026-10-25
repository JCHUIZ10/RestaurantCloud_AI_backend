import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Lock,
  RotateCcw,
  Ban,
  Flame,
  Clock,
  Radio,
  ArrowLeft,
  UtensilsCrossed,
} from 'lucide-react';
import { PlatoDisponibilidadDTO } from '@/types/cocina';

interface ModalDisponibilidadPlatosProps {
  abierto: boolean;
  onCerrar: () => void;
  catalogo: PlatoDisponibilidadDTO[];
  onConmutarDisponibilidad: (productoId: string, nuevoEstado: 'disponible' | 'agotado') => void;
}

export const ModalDisponibilidadPlatos: React.FC<ModalDisponibilidadPlatosProps> = ({
  abierto,
  onCerrar,
  catalogo,
  onConmutarDisponibilidad,
}) => {
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas');
  const [busqueda, setBusqueda] = useState<string>('');

  // Conteo de apagados
  const apagadosCount = useMemo(() => {
    return (catalogo || []).filter((p) => p.disponibilidad === 'agotado').length;
  }, [catalogo]);

  // Categorías disponibles con conteos
  const categorias = useMemo(() => {
    const safeCatalogo = catalogo || [];
    const catsMap: Record<string, { total: number; apagados: number }> = {};
    safeCatalogo.forEach((p) => {
      const cat = p.categoria_nombre || 'Sin categoría';
      if (!catsMap[cat]) {
        catsMap[cat] = { total: 0, apagados: 0 };
      }
      catsMap[cat].total += 1;
      if (p.disponibilidad === 'agotado') {
        catsMap[cat].apagados += 1;
      }
    });

    const list = [
      {
        nombre: 'Todas',
        total: safeCatalogo.length,
        apagados: apagadosCount,
      },
    ];

    Object.entries(catsMap).forEach(([nombre, stats]) => {
      list.push({
        nombre,
        total: stats.total,
        apagados: stats.apagados,
      });
    });

    return list;
  }, [catalogo, apagadosCount]);

  // Filtrado reactivo
  const platosFiltrados = useMemo(() => {
    const safeCatalogo = catalogo || [];
    return safeCatalogo.filter((p) => {
      const matchCat = categoriaActiva === 'Todas' || p.categoria_nombre === categoriaActiva;
      const matchBusqueda =
        busqueda.trim() === '' ||
        (p.nombre && p.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (p.receta_resumen && p.receta_resumen.toLowerCase().includes(busqueda.toLowerCase()));
      return matchCat && matchBusqueda;
    });
  }, [catalogo, categoriaActiva, busqueda]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-[1120px] bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal (1120px) */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-aurea-copper">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-black text-xl text-white tracking-wide">
                  GESTIÓN TÁCTIL DE DISPONIBILIDAD DE PLATOS
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Sincronización en tiempo real con cartas de mozos y QR digital • CU-COCINA-04
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl font-mono font-bold text-xs bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{apagadosCount} de {catalogo.length} Platos Apagados</span>
            </span>

            <button
              onClick={onCerrar}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros: Pestañas de Partidas Culinarias y Buscador */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Pestañas de Partida */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categorias.map((cat) => {
              const activa = categoriaActiva === cat.nombre;
              return (
                <button
                  key={cat.nombre}
                  onClick={() => setCategoriaActiva(cat.nombre)}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                    activa
                      ? 'bg-aurea-copper text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{cat.nombre}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      activa ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {cat.total}
                  </span>
                  {cat.apagados > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title={`${cat.apagados} apagados`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Buscador Táctil Rápido */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plato o insumo..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-aurea-copper font-sans"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Grid de Platos Culinarios (Grid responsivo 1 col móvil, 2 cols tablet, 3 cols desktop) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platosFiltrados.map((plato) => {
              const esDisponible = plato.disponibilidad === 'disponible';
              const esQuiebreStock = plato.motivo_agotado === 'quiebre_stock_receta';
              const esApagadoManual = plato.motivo_agotado === 'apagado_manual_cocina';

              return (
                <div
                  key={plato.producto_id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all space-y-3 ${
                    esDisponible
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      : esQuiebreStock
                      ? 'bg-rose-950/30 border-rose-900/60'
                      : 'bg-amber-950/30 border-amber-900/60'
                  }`}
                >
                  {/* Fila Superior: Nombre, Categoría y Estado */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {plato.categoria_nombre}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 ${
                          esDisponible
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : esQuiebreStock
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            esDisponible ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span>{esDisponible ? 'DISPONIBLE' : 'AGOTADO'}</span>
                      </span>
                    </div>

                    <h4
                      className={`font-serif font-bold text-base leading-snug ${
                        esDisponible ? 'text-white' : 'text-slate-400 line-through'
                      }`}
                    >
                      {plato.nombre}
                    </h4>

                    {/* Ficha de Receta Insumos */}
                    <p className="text-[11px] font-mono text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      🍲 {plato.receta_resumen}
                    </p>
                  </div>

                  {/* Estado Operativo / Badges de Origen de Quiebre */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    {/* Órdenes activas en cocina */}
                    {esDisponible && (plato.ordenes_en_fuego > 0 || plato.ordenes_en_cola > 0) && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        {plato.ordenes_en_fuego > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Flame className="w-3.5 h-3.5" />
                            <strong>{plato.ordenes_en_fuego}</strong> en fuego
                          </span>
                        )}
                        {plato.ordenes_en_cola > 0 && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <strong>{plato.ordenes_en_cola}</strong> en cola
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge Quiebre Automático por Stock (CU-03) */}
                    {esQuiebreStock && (
                      <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200">
                        <span className="font-bold flex items-center gap-1 text-rose-300 mb-0.5">
                          <Ban className="w-3.5 h-3.5" />
                          Quiebre Automático por Stock Cero:
                        </span>
                        <p className="font-mono text-[10px] text-rose-200/90">
                          {plato.insumo_bloqueante || 'Insumo de receta agotado en almacén'}
                        </p>
                      </div>
                    )}

                    {/* Badge Apagado Manual en Cocina */}
                    {esApagadoManual && (
                      <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/70 text-amber-200">
                        <span className="font-bold flex items-center gap-1 text-amber-300 mb-0.5">
                          ⚠️ Apagado Manual en Cocina:
                        </span>
                        <p className="font-mono text-[10px] text-amber-200/90">
                          Por {plato.usuario_modifico_nombre || 'Chef de Partida'}
                        </p>
                      </div>
                    )}

                    {/* Botones Táctiles de Acción (Mínimo 48px de altura táctil) */}
                    {esDisponible ? (
                      <button
                        onClick={() => onConmutarDisponibilidad(plato.producto_id, 'agotado')}
                        className="w-full min-h-[48px] rounded-xl font-bold text-xs bg-slate-900 hover:bg-rose-950/70 text-rose-300 border border-rose-900/60 hover:border-rose-600 transition-all flex items-center justify-center gap-2 shadow"
                      >
                        <Ban className="w-4 h-4 text-rose-400" />
                        <span>[ 🚫 MARCAR COMO AGOTADO ]</span>
                      </button>
                    ) : esQuiebreStock ? (
                      <button
                        disabled
                        className="w-full min-h-[48px] rounded-xl font-bold text-[11px] bg-slate-950/80 text-slate-500 border border-slate-800 cursor-not-allowed flex items-center justify-center gap-2"
                        title="El insumo físico se encuentra en 0. Requiere recepción de compras en almacén (CU-ADMIN-06/07)."
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>[ 🔒 Bloqueado por Stock Teórico ]</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onConmutarDisponibilidad(plato.producto_id, 'disponible')}
                        className="w-full min-h-[48px] rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>[ ↺ REACTIVAR A DISPONIBLE ]</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie de Control y Sincronización */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Sincronización en tiempo real activa: Los cambios bloquean o liberan la carta de inmediato</span>
          </div>

          <button
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Pantalla KDS de Comandas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
