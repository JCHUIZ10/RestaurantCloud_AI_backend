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
  const [minimizado, setMinimizado] = useState(true);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const dispararFeedback = (texto: string) => {
    setMensajeToast(texto);
    setTimeout(() => setMensajeToast(null), 2500);
  };

  return (
    <aside aria-label="Consola QA de KDS" className="fixed bottom-4 right-4 z-40 max-w-xs w-full bg-tinta-900/95 backdrop-blur-md text-white border border-aurea-copper/40 rounded-2xl shadow-2xl overflow-hidden text-xs">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-tinta-800/90 border-b border-tinta-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-aurea-copper animate-pulse" />
          <span className="font-bold font-mono tracking-wide text-aurea-champagne">
            QA: tiempos de cocina
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimizado(!minimizado)}
          className="text-tinta-400 hover:text-white transition-colors p-0.5"
          aria-label={minimizado ? 'Expandir panel QA' : 'Minimizar panel QA'}
        >
          {minimizado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenido expandido */}
      {!minimizado && (
        <div className="p-3.5 space-y-2.5">
          <p className="text-xs text-tinta-300">
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
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-tinta-800 hover:bg-tinta-700/80 border border-tinta-700 text-tinta-200 flex items-center justify-between transition-colors"
            >
              <span>Estándar Aúrea (15m / 25m / 3m)</span>
              <span className="text-xs text-emerald-400 font-mono">15/25</span>
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
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-tinta-800 hover:bg-tinta-700/80 border border-tinta-700 text-tinta-200 flex items-center justify-between transition-colors"
            >
              <span>Fast Food / Rápido (8m / 14m / 2m)</span>
              <span className="text-xs text-amber-400 font-mono">8/14</span>
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
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-tinta-800 hover:bg-tinta-700/80 border border-tinta-700 text-tinta-200 flex items-center justify-between transition-colors"
            >
              <span>Parrilla & Horno (25m / 45m / 5m)</span>
              <span className="text-xs text-blue-400 font-mono">25/45</span>
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
              <span>Provocar Incoherencia (30m &gt; 18m)</span>
              <span className="text-xs text-red-400 font-mono">Error 422</span>
            </button>
          </div>

          {/* Reset a valores de fábrica */}
          <div className="pt-2 border-t border-tinta-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onResetCanonica();
                dispararFeedback('Semillas de fábrica restablecidas');
              }}
              className="text-tinta-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Semillas</span>
            </button>

            {mensajeToast && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 animate-fadeIn">
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
