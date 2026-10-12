import React, { useRef, useState } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ChefHat,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

export const SaasDashboard3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'kds' | 'salon'>('ai');

  // Coordenadas suavizadas con resortes físicos de Framer Motion
  const rotateX = useSpring(8, { stiffness: 140, damping: 18 });
  const rotateY = useSpring(-10, { stiffness: 140, damping: 18 });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24; // -12 a +12 deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -24; // -12 a +12 deg
    rotateX.set(y);
    rotateY.set(x);
  };

  const handlePointerLeave = () => {
    rotateX.set(8);
    rotateY.set(-10);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full max-w-[540px] sm:max-w-[620px] mx-auto select-none py-6 group"
      style={{ perspective: 1200 }}
    >
      {/* Selector de vistas interactivas del SaaS en la cabecera del mockup */}
      <div className="flex items-center justify-center gap-2 mb-4 relative z-30">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            activeTab === 'ai'
              ? 'bg-aurea-navy text-aurea-champagne border border-aurea-copper/60 shadow-md scale-105'
              : 'bg-white/80 text-aurea-navy/70 border border-aurea-copper/20 hover:bg-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
          <span>AI Demand Forecast</span>
        </button>

        <button
          onClick={() => setActiveTab('kds')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            activeTab === 'kds'
              ? 'bg-aurea-navy text-aurea-champagne border border-aurea-copper/60 shadow-md scale-105'
              : 'bg-white/80 text-aurea-navy/70 border border-aurea-copper/20 hover:bg-white'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Cocina KDS en Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('salon')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
            activeTab === 'salon'
              ? 'bg-aurea-navy text-aurea-champagne border border-aurea-copper/60 shadow-md scale-105'
              : 'bg-white/80 text-aurea-navy/70 border border-aurea-copper/20 hover:bg-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Mapa de Salón</span>
        </button>
      </div>

      {/* Sombra proyectada del Dashboard en 3D */}
      <motion.div
        className="absolute inset-x-12 bottom-0 h-16 bg-aurea-navy/25 rounded-full blur-2xl pointer-events-none"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />

      {/* Contenedor del Dashboard 3D */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-2xl bg-gradient-to-b from-[#0F2D52] via-[#0B2340] to-[#07172B] p-5 sm:p-7 border-2 border-aurea-copper/50 shadow-2xl text-aurea-ivory backdrop-blur-xl transition-shadow duration-300 group-hover:shadow-[0_25px_50px_-12px_rgba(213,160,111,0.25)]"
      >
        {/* Barra superior de la ventana del Software */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-sans text-xs text-aurea-champagne font-medium tracking-wide">
              RestaurantCloud AI • Sede Miraflores (Activa)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono">SSE: Sincronizado</span>
          </div>
        </div>

        {/* Resumen de KPIs en tiempo real */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-aurea-champagne/80 uppercase font-medium block">Ventas Hoy</span>
            <span className="font-serif text-lg sm:text-xl font-normal text-white">S/ 6,480.50</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-sans font-semibold">
              <TrendingUp className="w-3 h-3" /> +18.4% vs promedio
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-aurea-champagne/80 uppercase font-medium block">Mesas Ocupadas</span>
            <span className="font-serif text-lg sm:text-xl font-normal text-white">19 / 24</span>
            <span className="text-[10px] text-aurea-copper flex items-center gap-0.5 mt-0.5 font-sans">
              79% capacidad sala
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-aurea-champagne/80 uppercase font-medium block">Tiempo Ticket</span>
            <span className="font-serif text-lg sm:text-xl font-normal text-white">11.4 min</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-sans">
              -3.2 min optimizado
            </span>
          </div>
        </div>

        {/* Área de Visualización Dinámica por Tabs */}
        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {/* Tarjeta Flotante: Predicción de Demanda IA */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-white/10 to-aurea-copper/15 border border-aurea-copper/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-aurea-copper/20 flex items-center justify-center text-aurea-champagne">
                        <Zap className="w-4 h-4 text-aurea-copper" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Predicción de Demanda para Turno Noche</h4>
                        <p className="text-[11px] text-aurea-champagne/70 font-sans">Modelo Predictivo de Series Temporales (Precisión 94.2%)</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Alta Afluencia
                    </span>
                  </div>

                  {/* Simulación de Curva Predictiva */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] text-white/70">
                      <span>Proyección de Comensales: +38% esperado</span>
                      <span className="font-mono text-aurea-copper">140 - 165 platos</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                      <div className="h-full bg-aurea-copper w-[65%]" />
                      <div className="h-full bg-aurea-champagne w-[20%] animate-pulse" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                    <p className="text-[11px] text-aurea-ivory/90 leading-tight">
                      <strong>Recomendación IA:</strong> Preparar mise en place para 40 porciones adicionales de Lomo y 25 Risottos. El inventario actual cubre la demanda sin desabastecimiento.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'kds' && (
              <motion.div
                key="kds"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 gap-3"
              >
                {/* Ticket KDS 1 */}
                <div className="p-3 rounded-xl bg-white/5 border border-aurea-copper/40 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="font-bold text-xs text-white">Mesa 4 • Salón B</span>
                    <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 07:12 min
                    </span>
                  </div>
                  <ul className="text-xs space-y-1 text-white/80">
                    <li className="flex justify-between font-medium text-white">
                      <span>2x Lomo Saltado Criollo</span>
                      <span className="text-emerald-400 font-bold">Wok 1</span>
                    </li>
                    <li className="flex justify-between text-white/70">
                      <span>1x Risotto de Hongos</span>
                      <span className="text-amber-400">Cocción</span>
                    </li>
                  </ul>
                  <span className="block text-[10px] text-aurea-champagne/80 bg-white/5 p-1 rounded text-center">
                    Nota: Sin cebolla en un lomo
                  </span>
                </div>

                {/* Ticket KDS 2 */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 opacity-85">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="font-bold text-xs text-white">Mesa 9 • Terraza</span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 02:45 min
                    </span>
                  </div>
                  <ul className="text-xs space-y-1 text-white/80">
                    <li className="flex justify-between font-medium text-white">
                      <span>3x Cóctel Golden Sour</span>
                      <span className="text-emerald-400">Listo</span>
                    </li>
                    <li className="flex justify-between text-white/70">
                      <span>1x Carpaccio Salmón</span>
                      <span className="text-white/60">Pendiente</span>
                    </li>
                  </ul>
                  <span className="block text-[10px] text-emerald-300/90 bg-emerald-950/40 p-1 rounded text-center">
                    Listo para despacho a sala
                  </span>
                </div>
              </motion.div>
            )}

            {activeTab === 'salon' && (
              <motion.div
                key="salon"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Distribución de Mesas — Salón Principal (Piso 1)</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Disponible
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Ocupada
                    </span>
                    <span className="flex items-center gap-1 text-sky-400">
                      <span className="w-2 h-2 rounded-full bg-sky-500" /> Precuenta
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {[
                    { id: 'M-1', est: 'ocupada', pax: '4p' },
                    { id: 'M-2', est: 'libre', pax: '2p' },
                    { id: 'M-3', est: 'ocupada', pax: '6p' },
                    { id: 'M-4', est: 'precuenta', pax: '4p' },
                    { id: 'M-5', est: 'libre', pax: '2p' },
                    { id: 'M-6', est: 'ocupada', pax: '4p' },
                    { id: 'M-7', est: 'ocupada', pax: '8p' },
                    { id: 'M-8', est: 'libre', pax: '2p' },
                    { id: 'M-9', est: 'ocupada', pax: '4p' },
                    { id: 'M-10', est: 'ocupada', pax: '4p' },
                    { id: 'M-11', est: 'precuenta', pax: '6p' },
                    { id: 'M-12', est: 'libre', pax: '2p' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-lg text-center border font-mono text-xs transition-transform hover:scale-105 cursor-pointer ${
                        m.est === 'ocupada'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                          : m.est === 'precuenta'
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                      }`}
                    >
                      <div className="font-bold">{m.id}</div>
                      <div className="text-[10px] opacity-75">{m.pax}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pie del Dashboard con llamado a interactuar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
          <span>Vista previa en vivo del motor RestaurantCloud AI</span>
          <span className="flex items-center gap-1 text-aurea-copper">
            Probar funciones <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>
    </div>
  );
};
