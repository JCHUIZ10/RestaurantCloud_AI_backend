import React, { useState } from 'react';
import {
  PackageCheck,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChefHat,
  ChevronDown,
} from 'lucide-react';
import {
  ItemDespachoListoDTO,
  ComandaEnPreparacionDTO,
  AlertaOperativaDTO,
} from '@/types/mozo';

interface SidebarDespachoVivoProps {
  itemsDespacho: ItemDespachoListoDTO[];
  comandasPreparacion: ComandaEnPreparacionDTO[];
  alertas: AlertaOperativaDTO[];
  onMarcarServido: (itemId: string) => void;
  misMesasActivas: number;
  totalVentaTurno: number;
  onVerAlertaModal?: () => void;
}

export const SidebarDespachoVivo: React.FC<SidebarDespachoVivoProps> = ({
  itemsDespacho,
  comandasPreparacion,
  alertas,
  onMarcarServido,
  misMesasActivas,
  totalVentaTurno,
  onVerAlertaModal,
}) => {
  // Estado para acordeones interactivos colapsables
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    directo: true,      // Productos de Despacho Directo (Entrega directa)
    cocina: true,       // Listos en Pase de Cocina KDS
    preparacion: false, // En Preparación KDS (colapsado por defecto para ahorrar espacio)
    alertas: true,      // Alertas operativas activas
  });

  const toggleSeccion = (clave: keyof typeof seccionesAbiertas) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  // Separamos en dos bloques: Despacho Directo vs Cocina KDS
  const productosDirectos = itemsDespacho.filter((i) => !i.requiere_preparacion);
  const platosCocina = itemsDespacho.filter((i) => i.requiere_preparacion);
  const totalListos = itemsDespacho.length;

  return (
    <aside className="w-full lg:w-[390px] bg-slate-900 text-slate-100 border-l border-slate-800 flex flex-col shrink-0 overflow-hidden select-none">
      {/* Encabezado del Despacho General */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center text-aurea-copper">
            <Bell className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Despacho en Salón</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Entrega directa y pase de cocina
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
            totalListos > 0
              ? 'bg-amber-500 text-slate-950 shadow-sm animate-bounce-slow'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {totalListos} {totalListos === 1 ? 'LISTO' : 'LISTOS'}
        </span>
      </div>

      {/* Contenido scrolleable con Acordeones */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
        {/* ========================================================================= */}
        {/* ACORDEÓN 1: ⚡ Productos de Despacho Directo (Entrega directa)           */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
          <button
            onClick={() => toggleSeccion('directo')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <PackageCheck className="w-4 h-4 text-aurea-copper shrink-0" />
              <div>
                <span className="text-xs font-bold text-aurea-champagne tracking-wider uppercase block">
                  Productos de Despacho Directo
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Entrega directa
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                  productosDirectos.length > 0
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {productosDirectos.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  seccionesAbiertas.directo ? 'rotate-180 text-white' : ''
                }`}
              />
            </div>
          </button>

          {seccionesAbiertas.directo && (
            <div className="p-3 pt-1 border-t border-slate-800/80 space-y-2.5 animate-fade-in">
              {productosDirectos.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-center text-xs text-slate-500">
                  No hay productos pendientes de entrega directa.
                </div>
              ) : (
                productosDirectos.map((item) => (
                  <div
                    key={item.item_id}
                    className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-aurea-copper/60 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          Mesa {item.mesa_numero}
                        </span>
                        <span className="text-[11px] text-slate-400">({item.ambiente})</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ⏱️ Hace {item.segundos_listo}s
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                        <span className="text-aurea-copper font-mono font-bold">
                          {item.cantidad}x
                        </span>
                        <span>{item.producto_nombre}</span>
                      </div>
                      {item.nota_especial && (
                        <p className="text-[11px] text-amber-300/90 mt-0.5 italic">
                          ↳ Nota: {item.nota_especial}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onMarcarServido(item.item_id)}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Marcar Producto Servido</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ACORDEÓN 2: 🔔 Listos en Pase de Cocina KDS                               */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
          <button
            onClick={() => toggleSeccion('cocina')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase block">
                  Listos en Pase de Cocina
                </span>
                <span className="text-[10px] text-slate-400 font-mono">KDS Fuego</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                  platosCocina.length > 0
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {platosCocina.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  seccionesAbiertas.cocina ? 'rotate-180 text-white' : ''
                }`}
              />
            </div>
          </button>

          {seccionesAbiertas.cocina && (
            <div className="p-3 pt-1 border-t border-slate-800/80 space-y-2.5 animate-fade-in">
              {platosCocina.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-center text-xs text-slate-500">
                  Cocina no tiene platos esperando en pase caliente.
                </div>
              ) : (
                platosCocina.map((item) => (
                  <div
                    key={item.item_id}
                    className="p-3 rounded-xl bg-slate-800/90 border border-amber-500/50 hover:border-amber-400 transition-all shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

                    <div className="flex items-start justify-between pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-amber-500/40">
                          Mesa {item.mesa_numero}
                        </span>
                        <span className="text-[10px] text-amber-200/80 font-mono">
                          {item.pase_cocina || 'Pase Principal'}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono font-semibold">
                        ⏱️ Hace {item.segundos_listo}s
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                        <span className="text-amber-400 font-mono font-bold">
                          {item.cantidad}x
                        </span>
                        <span>{item.producto_nombre}</span>
                      </div>
                      {item.nota_especial && (
                        <p className="text-[11px] text-slate-300 mt-0.5 italic">
                          ↳ Nota cocina: {item.nota_especial}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onMarcarServido(item.item_id)}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Retirar del Pase y Servir</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ACORDEÓN 3: ⏳ En Preparación Cocina KDS                                   */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
          <button
            onClick={() => toggleSeccion('preparacion')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase block">
                  En Preparación KDS
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cocción en fogones
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-800 text-orange-300 border border-slate-700">
                {comandasPreparacion.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  seccionesAbiertas.preparacion ? 'rotate-180 text-white' : ''
                }`}
              />
            </div>
          </button>

          {seccionesAbiertas.preparacion && (
            <div className="p-3 pt-1 border-t border-slate-800/80 space-y-1.5 animate-fade-in">
              {comandasPreparacion.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-900/60 text-center text-xs text-slate-500">
                  No hay órdenes en cocción actualmente.
                </div>
              ) : (
                comandasPreparacion.map((c) => (
                  <div
                    key={c.pedido_id}
                    className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-serif">Mesa {c.mesa_numero}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Comanda #{c.numero_comanda}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-orange-400 font-mono">
                        ⏳ {c.minutos_transcurridos} min
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({c.items_en_fuego} platos)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ACORDEÓN 4: ⚠️ Alertas Operativas                                        */}
        {/* ========================================================================= */}
        {alertas.length > 0 && (
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 overflow-hidden transition-all">
            <button
              onClick={() => toggleSeccion('alertas')}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-rose-950/40 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-rose-300 tracking-wider uppercase block">
                    Alertas Operativas
                  </span>
                  <span className="text-[10px] text-rose-400/80 font-mono">
                    Quiebres / demoras
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-600 text-white">
                  {alertas.length}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-rose-400 transition-transform duration-200 ${
                    seccionesAbiertas.alertas ? 'rotate-180 text-white' : ''
                  }`}
                />
              </div>
            </button>

            {seccionesAbiertas.alertas && (
              <div className="p-3 pt-1 border-t border-rose-900/40 space-y-2 animate-fade-in">
                {alertas.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-900/50 text-xs">
                    <div className="flex items-center justify-between text-rose-200 font-semibold mb-1">
                      <span>{a.titulo}</span>
                      {onVerAlertaModal && (
                        <button
                          onClick={onVerAlertaModal}
                          className="text-[10px] text-rose-300 underline hover:text-white"
                        >
                          Ver modal
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {a.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pie de Estadísticas del Mozo */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="text-slate-400">
          Mis mesas activas: <strong className="text-white">{misMesasActivas}</strong>
        </div>
        <div className="text-slate-400">
          Venta acumulada:{' '}
          <strong className="text-aurea-champagne font-serif text-sm">
            S/ {totalVentaTurno.toFixed(2)}
          </strong>
        </div>
      </div>
    </aside>
  );
};
