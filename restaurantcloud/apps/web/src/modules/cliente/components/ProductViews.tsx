import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIEWS = [
  {
    id: 'salon',
    title: 'Salón y mesas',
    description: 'Ocupación, comandas y despacho en una sola vista.',
  },
  {
    id: 'cocina',
    title: 'Cocina KDS',
    description: 'Comandas organizadas para el equipo de cocina.',
  },
  {
    id: 'caja',
    title: 'Caja y cobros',
    description: 'Cuentas pendientes, medios de pago y comprobantes.',
  },
] as const;

// =========================================================================
// MOCKUP 1: Salón y Mesas (Terminal Mozo POS a grandes rasgos)
// =========================================================================
const SalonMockup: React.FC = () => (
  <div className="p-4 sm:p-6 bg-slate-50/60 min-h-[460px] flex flex-col justify-between select-none font-sans">
    {/* Barra de cabecera del terminal */}
    <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-200/80 gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-sm text-aurea-navy">Salón Principal · Miraflores</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">Turno Tarde</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          4 Libres
        </span>
        <span className="px-2.5 py-1 rounded-full bg-aurea-navy/10 text-aurea-navy border border-aurea-navy/20">
          7 Ocupadas
        </span>
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          1 Precuenta
        </span>
      </div>
    </div>

    {/* Layout: Plano de Mesas (Izq) + Pase Rápido de Cocina (Der) */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-3.5 flex-1">
      {/* Grilla de Mesas (8 columnas) */}
      <div className="md:col-span-8 grid grid-cols-3 gap-2.5">
        {/* Mesa 01: Ocupada */}
        <div className="rounded-xl p-3 bg-aurea-navy text-white flex flex-col justify-between shadow-sm border border-aurea-navy">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wide">MESA 01</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-medium">4p</span>
          </div>
          <div className="my-1.5">
            <div className="text-[10px] text-white/70">Consumo</div>
            <div className="text-base font-bold text-aurea-champagne">S/ 86.00</div>
          </div>
          <div className="text-[10px] text-white/60 flex items-center justify-between border-t border-white/10 pt-1">
            <span>Carlos H.</span>
            <span>22 min</span>
          </div>
        </div>

        {/* Mesa 02: Ocupada */}
        <div className="rounded-xl p-3 bg-aurea-navy text-white flex flex-col justify-between shadow-sm border border-aurea-navy">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wide">MESA 02</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-medium">2p</span>
          </div>
          <div className="my-1.5">
            <div className="text-[10px] text-white/70">Consumo</div>
            <div className="text-base font-bold text-aurea-champagne">S/ 56.00</div>
          </div>
          <div className="text-[10px] text-white/60 flex items-center justify-between border-t border-white/10 pt-1">
            <span>Valeria M.</span>
            <span>14 min</span>
          </div>
        </div>

        {/* Mesa 03: Libre */}
        <div className="rounded-xl p-3 bg-white border-2 border-dashed border-emerald-400/80 flex flex-col justify-between text-aurea-navy">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-emerald-700">MESA 03</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">LIBRE</span>
          </div>
          <div className="my-1 text-center text-xs text-emerald-600 font-medium">
            Capacidad: 6 pers.
          </div>
          <div className="w-full py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 rounded-lg text-center">
            + Sentar Mesa
          </div>
        </div>

        {/* Mesa 04: Por cobrar (Precuenta) */}
        <div className="rounded-xl p-3 bg-amber-500 text-aurea-navy flex flex-col justify-between shadow-md border-2 border-amber-600">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wide">MESA 04</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/25 text-white font-black">PRECUENTA</span>
          </div>
          <div className="my-1.5">
            <div className="text-[10px] font-bold text-aurea-navy/80">Por cobrar en caja</div>
            <div className="text-lg font-black text-aurea-navy">S/ 126.00</div>
          </div>
          <div className="text-[10px] text-aurea-navy font-bold flex items-center justify-between border-t border-aurea-navy/20 pt-1">
            <span>3 platos servidos</span>
            <span>Cobro pendiente</span>
          </div>
        </div>

        {/* Mesa 05: Ocupada */}
        <div className="rounded-xl p-3 bg-aurea-navy text-white flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wide">MESA 05</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-medium">2p</span>
          </div>
          <div className="my-1.5">
            <div className="text-[10px] text-white/70">Consumo</div>
            <div className="text-base font-bold text-aurea-champagne">S/ 44.00</div>
          </div>
          <div className="text-[10px] text-white/60 flex items-center justify-between border-t border-white/10 pt-1">
            <span>Carlos H.</span>
            <span>8 min</span>
          </div>
        </div>

        {/* Mesa 06: Libre */}
        <div className="rounded-xl p-3 bg-white border-2 border-dashed border-emerald-400/80 flex flex-col justify-between text-aurea-navy">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-emerald-700">MESA 06</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">LIBRE</span>
          </div>
          <div className="my-1 text-center text-xs text-emerald-600 font-medium">
            Capacidad: 4 pers.
          </div>
          <div className="w-full py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 rounded-lg text-center">
            + Sentar Mesa
          </div>
        </div>
      </div>

      {/* Panel Lateral: Pase de Cocina en Vivo (4 columnas) */}
      <div className="md:col-span-4 bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-aurea-navy flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Pase de Cocina
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              2 listos
            </span>
          </div>

          <div className="space-y-2 mt-2">
            <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs">
              <div className="flex justify-between font-bold text-emerald-950 text-[11px]">
                <span>Mesa 04 · Salón</span>
                <span className="text-emerald-700">Hace 1 min</span>
              </div>
              <div className="text-emerald-900 font-bold mt-1 text-xs">2x Lomo Saltado Criollo</div>
              <div className="mt-2 w-full py-1 bg-emerald-600 text-white rounded text-[11px] font-bold text-center shadow-xs">
                ✓ Servido a Mesa
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                <span>Mesa 02 · Terraza</span>
                <span className="text-slate-500">Hace 3 min</span>
              </div>
              <div className="text-slate-700 font-semibold mt-1 text-xs">1x Ceviche Mixto</div>
              <div className="mt-2 w-full py-1 bg-slate-200 text-slate-800 rounded text-[11px] font-semibold text-center">
                ✓ Servido a Mesa
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-100">
          Sincronización instantánea salón-cocina
        </div>
      </div>
    </div>

    {/* Footer del mockup */}
    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
      <span>Terminal POS Mozo · Mapa interactivo de salón</span>
      <span className="font-semibold text-emerald-700">● Conexión activa en tiempo real</span>
    </div>
  </div>
);

// =========================================================================
// MOCKUP 2: Cocina KDS (Comandas en tiempo real a grandes rasgos)
// =========================================================================
const CocinaMockup: React.FC = () => (
  <div className="p-4 sm:p-6 bg-[#0a1626] text-slate-100 min-h-[460px] flex flex-col justify-between select-none font-sans">
    {/* Cabecera KDS */}
    <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="font-bold text-sm text-white">Monitor KDS Cocina Caliente & Fría</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          3 Comandas Activas
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-400">Promedio preparación: <strong className="text-emerald-400 font-mono">9.4 min</strong></span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px]">
          KDS en vivo
        </span>
      </div>
    </div>

    {/* 3 Tickets de cocina estilo KDS */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3.5 flex-1">
      {/* Ticket 1: Urgente / Emplatado */}
      <div className="rounded-xl p-3.5 bg-slate-900/90 border-2 border-amber-500/80 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-black text-amber-400 text-sm tracking-wide">#104 · MESA 04</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
              ⏱ 12:40 min
            </span>
          </div>
          <div className="py-2.5 space-y-2 text-xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">2x Lomo Saltado</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 text-[10px] font-bold border border-emerald-700">Listo</span>
              </div>
              <p className="text-[11px] text-amber-200/90 italic mt-0.5">» Término medio, sin cebolla</p>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">1x Risotto Hongos</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 text-[10px] font-bold border border-amber-700">Emplatando</span>
              </div>
              <p className="text-[11px] text-slate-400 italic mt-0.5">» Queso parmesano extra</p>
            </div>
          </div>
        </div>
        <div className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold text-center shadow-md">
          ✓ Marcar Comanda Lista
        </div>
      </div>

      {/* Ticket 2: En Fuego */}
      <div className="rounded-xl p-3.5 bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-black text-white text-sm tracking-wide">#105 · MESA 02</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/40">
              ⏱ 06:15 min
            </span>
          </div>
          <div className="py-2.5 space-y-2 text-xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">1x Ceviche Mixto</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 text-[10px] font-bold border border-blue-700">En fuego</span>
              </div>
              <p className="text-[11px] text-slate-400 italic mt-0.5">» Ají limo aparte</p>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">1x Tiradito Nikkei</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 text-[10px] font-bold border border-blue-700">En fuego</span>
              </div>
              <p className="text-[11px] text-slate-400 italic mt-0.5">» Con palta tatemada</p>
            </div>
          </div>
        </div>
        <div className="w-full py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold text-center">
          Avanzar a Emplatado →
        </div>
      </div>

      {/* Ticket 3: Nueva */}
      <div className="rounded-xl p-3.5 bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-black text-slate-300 text-sm tracking-wide">#106 · MESA 05</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
              ⏱ 02:00 min
            </span>
          </div>
          <div className="py-2.5 space-y-2 text-xs">
            <div>
              <span className="font-bold text-white text-sm">1x Causa Limeña</span>
              <p className="text-[11px] text-slate-400 italic mt-0.5">» Pulpo anticuchero</p>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <span className="font-bold text-white text-sm">2x Chicha Morada</span>
              <p className="text-[11px] text-slate-400 italic mt-0.5">» Jarra 1L</p>
            </div>
          </div>
        </div>
        <div className="w-full py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold text-center">
          Iniciar Preparación
        </div>
      </div>
    </div>

    {/* Footer del KDS */}
    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
      <span>Cero comandas en papel · Alertas visuales y sonoras por tiempo</span>
      <span className="text-emerald-400 font-semibold">● Sincronización instantánea</span>
    </div>
  </div>
);

// =========================================================================
// MOCKUP 3: Caja y Cobros (Facturación & Cierre a grandes rasgos)
// =========================================================================
const CajaMockup: React.FC = () => (
  <div className="p-4 sm:p-6 bg-slate-50/60 min-h-[460px] flex flex-col justify-between select-none font-sans">
    {/* Cabecera Caja */}
    <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-200/80 gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span className="font-bold text-sm text-aurea-navy">Caja & Facturación Electrónica SUNAT</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">Turno Tarde</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="text-slate-600">Cajero: <strong>Carlos Huamán</strong></span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold">
          Caja Abierta
        </span>
      </div>
    </div>

    {/* Layout: Cuentas pendientes (4 cols) + Liquidación (8 cols) */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 my-3.5 flex-1">
      {/* Lista de mesas pendientes de cobro */}
      <div className="md:col-span-4 bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Cuentas por Cobrar
        </span>
        <div className="p-2.5 rounded-lg bg-aurea-navy text-white shadow-xs border border-aurea-navy">
          <div className="flex justify-between font-bold text-sm">
            <span>Mesa 04 · Salón</span>
            <span className="text-aurea-champagne">S/ 126.00</span>
          </div>
          <div className="text-[10px] text-white/70 mt-0.5 font-medium">Precuenta emitida · 4 comensales</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
          <div className="flex justify-between font-bold text-sm">
            <span>Mesa 01 · Salón</span>
            <span>S/ 86.00</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">En consumo · 22 min</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
          <div className="flex justify-between font-bold text-sm">
            <span>Barra 02</span>
            <span>S/ 44.00</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">1 comensal</div>
        </div>
      </div>

      {/* Detalle y Cobro Rápido (8 columnas) */}
      <div className="md:col-span-8 bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div>
              <span className="font-extrabold text-base text-aurea-navy">Liquidación Mesa 04</span>
              <span className="text-xs text-slate-500 block">Comprobante: Boleta Electrónica B001-000452</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Total a Cobrar</span>
              <div className="text-2xl font-black text-aurea-navy">S/ 126.00</div>
            </div>
          </div>

          {/* Desglose rápido */}
          <div className="grid grid-cols-3 gap-2 text-xs py-3 border-b border-slate-100">
            <div className="p-2 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 text-[10px] block">Op. Gravada</span>
              <strong className="text-slate-800">S/ 106.78</strong>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-500 text-[10px] block">IGV (18%)</span>
              <strong className="text-slate-800">S/ 19.22</strong>
            </div>
            <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-emerald-800">
              <span className="text-emerald-700 text-[10px] block">SUNAT</span>
              <strong className="font-bold">Listo para emisión ✓</strong>
            </div>
          </div>

          {/* Medios de Pago */}
          <div className="mt-3">
            <span className="text-[11px] font-bold text-slate-600 block mb-2">Medio de Pago Seleccionado:</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="py-2 px-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                <span>📱 Yape / Plin</span>
              </div>
              <div className="py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5">
                <span>💳 Tarjeta POS</span>
              </div>
              <div className="py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5">
                <span>💵 Efectivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón Principal */}
        <div className="pt-3 border-t border-slate-100">
          <div className="w-full py-2.5 bg-aurea-navy text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
            <span>Cobrar S/ 126.00 y Liberar Mesa 04</span>
            <span className="text-aurea-copper">→</span>
          </div>
        </div>
      </div>
    </div>

    {/* Footer del mockup */}
    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
      <span>Arqueo Z en tiempo real · Cierre automático por turno</span>
      <span className="text-emerald-700 font-semibold">● Cuadre exacto en soles</span>
    </div>
  </div>
);

// Componente selector de mockup
const MockupRenderer: React.FC<{ viewId: string }> = ({ viewId }) => {
  switch (viewId) {
    case 'cocina':
      return <CocinaMockup />;
    case 'caja':
      return <CajaMockup />;
    case 'salon':
    default:
      return <SalonMockup />;
  }
};

export const ProductViews: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const view = VIEWS[selected];

  return (
    <div className="lp-real-product">
      {/* Columna Izquierda: Heading y Pestañas con conector visual */}
      <div className="lp-product-heading">
        <span className="lp-eyebrow">AUREA EN PANTALLA</span>
        <h2>Una vista para cada momento del turno.</h2>

        <div className="lp-product-tabs flex flex-col gap-3 mt-8" role="tablist" aria-label="Vistas de la aplicación">
          {VIEWS.map((item, index) => {
            const isSelected = selected === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="product-capture"
                onClick={() => setSelected(index)}
                className={`relative text-left p-5 rounded-2xl transition-all duration-300 flex items-start gap-4 border cursor-pointer ${
                  isSelected
                    ? 'bg-white text-aurea-navy border-aurea-copper/40 shadow-lg'
                    : 'bg-transparent text-aurea-navy/80 hover:bg-white/60 border-transparent'
                }`}
              >
                {/* Conector flecha visual hacia la imagen (Desktop) que demuestra el origen */}
                {isSelected && (
                  <motion.div
                    layoutId="tabConnectorArrow"
                    className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 border-t border-r border-aurea-copper/40 z-30 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}

                {/* Badge numérico de la pestaña */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-aurea-navy text-aurea-ivory shadow-xs scale-105'
                      : 'bg-aurea-copper/15 text-aurea-navy border border-aurea-copper/30'
                  }`}
                >
                  0{index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-lg font-bold text-aurea-navy tracking-tight">{item.title}</strong>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-aurea-copper animate-pulse" />
                    )}
                  </div>
                  <span className="lp-view-description block mt-1 text-xs sm:text-sm text-aurea-navy/70 leading-relaxed">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Vista con efecto de Pintado (Wipe & Light Sweep) */}
      <div className="relative w-full">
        {/* Chasis con efecto de "Pintado" dinámico */}
        <div
          id="product-capture"
          className="relative rounded-2xl bg-white border border-aurea-copper/35 shadow-2xl overflow-hidden min-h-[460px] flex items-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view.id}
              initial={{
                opacity: 0,
                clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
                x: -24,
              }}
              animate={{
                opacity: 1,
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                x: 0,
              }}
              exit={{
                opacity: 0,
                clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
                transition: { duration: 0.2 },
              }}
              transition={{
                duration: 0.48,
                ease: [0.16, 1, 0.3, 1], // ease-out editorial
              }}
              className="w-full h-full relative"
            >
              {/* Pincelada de luz / Shimmer que viaja desde la pestaña seleccionada hacia la derecha */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-aurea-copper/25 to-transparent pointer-events-none z-30 skew-x-12"
              />

              <MockupRenderer viewId={view.id} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
