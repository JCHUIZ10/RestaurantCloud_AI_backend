import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Volume2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { ConfiguracionKdsDTO } from '@/types/admin';

interface KdsSimuladorSemaforoProps {
  config: ConfiguracionKdsDTO;
  onTestAudio: (tipo: 'chime' | 'alarma') => void;
}

export const KdsSimuladorSemaforo: React.FC<KdsSimuladorSemaforoProps> = ({
  config,
  onTestAudio,
}) => {
  // Minutos para el ticket de prueba interactivo adicional (scrubber)
  const [minutosScrubber, setMinutosScrubber] = useState<number>(14);

  // Helper para determinar el estado semafórico según los umbrales configurados
  const obtenerEstadoSemaforo = (minutos: number) => {
    if (minutos <= config.tiempo_optimo_verde_min) {
      return {
        tipo: 'verde' as const,
        badge: '• ESTADO ÓPTIMO',
        badgeColor: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
        cardBorder: 'border-emerald-500/40 bg-slate-800/90 hover:border-emerald-500/70',
        icono: '🟢',
        headerBg: 'bg-emerald-950/40 text-emerald-200 border-b border-emerald-500/20',
      };
    }
    if (minutos <= config.tiempo_alerta_ambar_min) {
      return {
        tipo: 'ambar' as const,
        badge: '• ADVERTENCIA',
        badgeColor: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
        cardBorder: 'border-amber-500/40 bg-slate-800/90 hover:border-amber-500/70',
        icono: '🟡',
        headerBg: 'bg-amber-950/40 text-amber-200 border-b border-amber-500/20',
      };
    }
    return {
      tipo: 'rojo' as const,
      badge: '• CRÍTICO 🚨',
      badgeColor: 'bg-red-950/80 border-red-500 text-red-300 animate-pulse',
      cardBorder: 'border-red-500/80 bg-slate-800/95 ring-1 ring-red-500/30',
      icono: '🔴',
      headerBg: 'bg-red-950/60 text-red-200 border-b border-red-500/30',
    };
  };

  // 3 Comandas canónicas de prueba
  // 1. Mesa 04: 10 min 20s (10.33 min)
  const semaforoMesa04 = obtenerEstadoSemaforo(10.33);

  // 2. Mesa 01: 19 min 40s (19.67 min)
  const semaforoMesa01 = obtenerEstadoSemaforo(19.67);

  // 3. Mesa 07: 28 min 15s (28.25 min)
  const semaforoMesa07 = obtenerEstadoSemaforo(28.25);

  // 4. Ticket Scrubber Interactivo
  const semaforoScrubber = obtenerEstadoSemaforo(minutosScrubber);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-xl p-6 text-slate-100 flex flex-col justify-between space-y-6">
      {/* Cabecera del Simulador */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                Simulador del Semáforo KDS
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  En Vivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Así responderán los monitores de cocina ante cualquier cambio en el formulario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTestAudio('chime')}
              title="Test rápido de sonido de nueva comanda"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] font-mono text-emerald-400 border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Chime</span>
            </button>
            <button
              type="button"
              onClick={() => onTestAudio('alarma')}
              title="Test rápido de alarma sonora roja"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] font-mono text-red-400 border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Alarma</span>
            </button>
          </div>
        </div>

        {/* Tira Resumen de Rangos Actuales */}
        <div className="grid grid-cols-3 gap-2 mt-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-center">
          <div className="text-emerald-400">
            🟢 Óptimo: &le; {config.tiempo_optimo_verde_min}m
          </div>
          <div className="text-amber-400">
            🟡 Alerta: {config.tiempo_optimo_verde_min + 1} a {config.tiempo_alerta_ambar_min}m
          </div>
          <div className="text-red-400">
            🔴 Crítico: &gt; {config.tiempo_alerta_ambar_min}m
          </div>
        </div>
      </div>

      {/* Tarjetas de Prueba Simuladas */}
      <div className="space-y-3.5 overflow-y-auto max-h-[560px] pr-1">
        {/* TARJETA 1: MESA 04 (10 min 20s) */}
        <div
          className={`rounded-xl border transition-all duration-300 overflow-hidden shadow-md ${semaforoMesa04.cardBorder}`}
        >
          <div className={`px-4 py-2 flex items-center justify-between text-xs font-semibold ${semaforoMesa04.headerBg}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">🍽️ MESA 04 • Salón</span>
              <span className="text-[11px] opacity-80">(4 comensales)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${semaforoMesa04.badgeColor}`}>
              {semaforoMesa04.badge}
            </span>
          </div>

          <div className="p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Mozo: Carlos Mendoza</span>
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                10 min 20s
              </span>
            </div>

            <div className="space-y-1 font-sans">
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>• 2x Lomo Saltado Criollo</span>
                <span className="text-[10px] text-slate-400">Término 3/4</span>
              </div>
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>• 1x Causa Limeña de Pollo</span>
                <span className="text-[10px] text-emerald-400">Listo en Pase</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
              <span className="italic">🥤 2 Bebidas atendidas por mozo (sin fogón)</span>
              <span className="text-emerald-400 font-mono">
                {10.33 <= config.tiempo_optimo_verde_min ? '✓ Dentro de tiempo verde' : '⚠️ Superó tiempo verde'}
              </span>
            </div>
          </div>
        </div>

        {/* TARJETA 2: MESA 01 (19 min 40s) */}
        <div
          className={`rounded-xl border transition-all duration-300 overflow-hidden shadow-md ${semaforoMesa01.cardBorder}`}
        >
          <div className={`px-4 py-2 flex items-center justify-between text-xs font-semibold ${semaforoMesa01.headerBg}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">🍽️ MESA 01 • Terraza</span>
              <span className="text-[11px] opacity-80">(2 comensales)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${semaforoMesa01.badgeColor}`}>
              {semaforoMesa01.badge}
            </span>
          </div>

          <div className="p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Moza: Ana Paredes</span>
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                19 min 40s
              </span>
            </div>

            <div className="space-y-1 font-sans">
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>• 1x Ceviche Mixto Tradicional</span>
                <span className="text-[10px] text-amber-400">En Fuego</span>
              </div>
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>• 1x Arroz con Mariscos</span>
                <span className="text-[10px] text-slate-400">En Cola</span>
              </div>
            </div>

            <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Nota: Sin ají ni culantro para el comensal</span>
            </div>
          </div>
        </div>

        {/* TARJETA 3: MESA 07 (28 min 15s) */}
        <div
          className={`rounded-xl border transition-all duration-300 overflow-hidden shadow-md ${semaforoMesa07.cardBorder}`}
        >
          <div className={`px-4 py-2 flex items-center justify-between text-xs font-semibold ${semaforoMesa07.headerBg}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide">🔥 MESA 07 • Salón Principal</span>
              <span className="text-[11px] opacity-80">(3 comensales)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${semaforoMesa07.badgeColor}`}>
              {semaforoMesa07.badge}
            </span>
          </div>

          <div className="p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Mozo: Carlos Mendoza</span>
              <span className="flex items-center gap-1 font-semibold text-red-300">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                28 min 15s
              </span>
            </div>

            <div className="space-y-1 font-sans">
              <div className="flex items-center justify-between text-slate-200 font-medium">
                <span>• 2x Bife Angosto Criollo</span>
                <span className="text-[10px] text-red-400 font-bold">Demorado</span>
              </div>
            </div>

            {/* Banner de urgencia si es rojo */}
            {semaforoMesa07.tipo === 'rojo' && (
              <div className="p-2 rounded-lg bg-red-900/60 border border-red-500/80 text-red-200 text-[11px] font-semibold flex items-center justify-between animate-pulse">
                <span>🚨 ALERTA KDS: Excedió el umbral ({config.tiempo_alerta_ambar_min}m)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 font-mono">PRIORIDAD 1</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrubber / Calibrador Interactivo de Tiempo Arbitrario */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Calibrador de Transición en Vivo:</span>
          </div>
          <span className="text-xs font-mono font-bold text-aurea-copper">
            ⏱️ {minutosScrubber} min &rarr; {semaforoScrubber.icono} {semaforoScrubber.badge}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={45}
          value={minutosScrubber}
          onChange={(e) => setMinutosScrubber(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-aurea-copper"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0 min (inicio)</span>
          <span className="text-emerald-400 font-bold">Verde: {config.tiempo_optimo_verde_min}m</span>
          <span className="text-amber-400 font-bold">Ámbar: {config.tiempo_alerta_ambar_min}m</span>
          <span>45 min (crítico)</span>
        </div>
      </div>
    </div>
  );
};
