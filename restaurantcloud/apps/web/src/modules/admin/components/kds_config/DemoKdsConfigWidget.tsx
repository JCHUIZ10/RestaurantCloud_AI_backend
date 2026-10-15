import React, { useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown, CheckCircle2, RotateCcw } from 'lucide-react';
import { ConfiguracionKdsDTO } from '@/types/admin';

interface DemoKdsConfigWidgetProps {
  onAplicarPreset: (preset: Partial<ConfiguracionKdsDTO>) => void;
  onResetCanonica: () => void;
}

export const DemoKdsConfigWidget: React.FC<DemoKdsConfigWidgetProps> = ({
  onAplicarPreset,
  onResetCanonica,
}) => {
  const [minimizado, setMinimizado] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const dispararFeedback = (texto: string) => {
    setMensajeToast(texto);
    setTimeout(() => setMensajeToast(null), 2500);
  };

  return (
    <aside aria-label="Consola QA de KDS" className="fixed bottom-4 right-4 z-40 max-w-xs w-full bg-slate-900/95 backdrop-blur-md text-white border border-aurea-copper/40 rounded-2xl shadow-2xl overflow-hidden text-xs">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-aurea-copper animate-pulse" />
          <span className="font-bold font-mono tracking-wide text-aurea-champagne">
            QA Sandbox: KDS CU-ADMIN-18
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimizado(!minimizado)}
          className="text-slate-400 hover:text-white transition-colors p-0.5"
          aria-label={minimizado ? 'Expandir panel QA' : 'Minimizar panel QA'}
        >
          {minimizado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenido expandido */}
      {!minimizado && (
        <div className="p-3.5 space-y-2.5">
          <p className="text-[11px] text-slate-300">
            Simula escenarios operativos y valida la reactividad del semáforo y del backend en 1 clic:
          </p>

          <div className="space-y-1.5">
            {/* Preset 1: Estándar Gastronómico */}
            <button
              type="button"
              onClick={() => {
                onAplicarPreset({
                  tiempo_optimo_verde_min: 15,
                  tiempo_alerta_ambar_min: 25,
                  tiempo_maximo_pase_min: 3,
                  alerta_sonora_nueva_comanda: true,
                  alerta_sonora_comanda_roja: true,
                  intervalo_sonido_rojo_seg: 60,
                  vista_predeterminada: 'fifo',
                });
                dispararFeedback('Preset Estándar cargado (15m/25m/3m)');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
            >
              <span>🍽️ Estándar Aúrea (15m / 25m / 3m)</span>
              <span className="text-[10px] text-emerald-400 font-mono">15/25</span>
            </button>

            {/* Preset 2: Fast Casual / Rápida Rotación */}
            <button
              type="button"
              onClick={() => {
                onAplicarPreset({
                  tiempo_optimo_verde_min: 8,
                  tiempo_alerta_ambar_min: 14,
                  tiempo_maximo_pase_min: 2,
                  alerta_sonora_nueva_comanda: true,
                  alerta_sonora_comanda_roja: true,
                  intervalo_sonido_rojo_seg: 30,
                  vista_predeterminada: 'fifo',
                });
                dispararFeedback('Fast Casual cargado (8m/14m/2m)');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
            >
              <span>⚡ Fast Food / Rápido (8m / 14m / 2m)</span>
              <span className="text-[10px] text-amber-400 font-mono">8/14</span>
            </button>

            {/* Preset 3: Parrilla / Cocción Lenta */}
            <button
              type="button"
              onClick={() => {
                onAplicarPreset({
                  tiempo_optimo_verde_min: 25,
                  tiempo_alerta_ambar_min: 45,
                  tiempo_maximo_pase_min: 5,
                  alerta_sonora_nueva_comanda: true,
                  alerta_sonora_comanda_roja: true,
                  intervalo_sonido_rojo_seg: 90,
                  vista_predeterminada: 'all_day',
                });
                dispararFeedback('Parrilla Lenta cargado (25m/45m/5m)');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex items-center justify-between transition-colors"
            >
              <span>🥩 Parrilla & Horno (25m / 45m / 5m)</span>
              <span className="text-[10px] text-sky-400 font-mono">25/45</span>
            </button>

            {/* Preset 4: Provocar Error 422 Incoherente */}
            <button
              type="button"
              onClick={() => {
                onAplicarPreset({
                  tiempo_optimo_verde_min: 30,
                  tiempo_alerta_ambar_min: 18,
                });
                dispararFeedback('Incoherencia provocada: Verde > Ámbar');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-200 flex items-center justify-between transition-colors"
            >
              <span>⚠️ Provocar Incoherencia (30m &gt; 18m)</span>
              <span className="text-[10px] text-red-400 font-mono">Error 422</span>
            </button>
          </div>

          {/* Reset a valores de fábrica */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onResetCanonica();
                dispararFeedback('Semillas de fábrica restablecidas');
              }}
              className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Semillas</span>
            </button>

            {mensajeToast && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3 h-3" />
                {mensajeToast}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
