import React, { useState } from 'react';
import { Sparkles, PlusCircle, AlertOctagon, FastForward, RotateCcw, WifiOff, BellRing, ChevronUp, ChevronDown } from 'lucide-react';

interface DemoKdsWidgetProps {
  onInyectarComanda: () => void;
  onSimularParadaFogones: () => void;
  onSimularStockAgotado?: () => void;
  onAbrirDisponibilidad?: () => void;
  onAcelerarTiempos: (minutos: number) => void;
  onAlternarVacio: () => void;
  onAlternarSse: () => void;
  onRestablecer: () => void;
  esVacio: boolean;
  sseConectado: boolean;
}

export const DemoKdsWidget: React.FC<DemoKdsWidgetProps> = ({
  onInyectarComanda,
  onSimularParadaFogones,
  onSimularStockAgotado,
  onAbrirDisponibilidad,
  onAcelerarTiempos,
  onAlternarVacio,
  onAlternarSse,
  onRestablecer,
  esVacio,
  sseConectado,
}) => {
  const [colapsado, setColapsado] = useState(false);

  return (
    <aside
      aria-label="Panel de Simulación de Pruebas KDS"
      className="fixed bottom-4 right-4 z-40 select-none font-sans"
    >
      <div className="bg-slate-900 border-2 border-aurea-copper/60 rounded-2xl shadow-2xl shadow-slate-950 overflow-hidden w-72 sm:w-80 transition-all text-xs">
        {/* Cabecera del Widget */}
        <div
          onClick={() => setColapsado(!colapsado)}
          className="p-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-aurea-copper/30 flex items-center justify-between cursor-pointer text-slate-100 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurea-copper animate-spin" />
            <span className="font-serif font-bold text-xs tracking-wider text-aurea-champagne">
              DEMO KDS COCINA • CU-01 A 04
            </span>
          </div>

          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            {colapsado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Acciones de Demostración */}
        {!colapsado && (
          <div className="p-3 space-y-2 bg-slate-950/95 text-slate-300">
            <p className="text-[11px] text-slate-400 leading-tight">
              Simulador en 1 clic de eventos de salón y estados frontera para evaluación:
            </p>

            {/* Inyectar Comanda Mozo */}
            <button
              onClick={onInyectarComanda}
              className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-aurea-champagne border border-slate-700/80 transition-colors flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nueva Comanda (Mesa 05)</span>
              </span>
              <BellRing className="w-3 h-3 text-slate-400" />
            </button>

            {/* Simular Quiebre de Stock Culinario (CU-03) */}
            {onSimularStockAgotado && (
              <button
                onClick={onSimularStockAgotado}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl font-bold bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-800/80 transition-colors flex items-center justify-between text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 text-center leading-none">⚠️</span>
                  <span>Simular Quiebre Insumo (CU-03)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400">Toast SSE</span>
              </button>
            )}

            {/* Abrir Modal de Quiebres y Disponibilidad (CU-04) */}
            {onAbrirDisponibilidad && (
              <button
                onClick={onAbrirDisponibilidad}
                className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/60 transition-colors flex items-center justify-between text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 text-center leading-none">🚫</span>
                  <span>Gestión de Quiebres (CU-04)</span>
                </span>
                <span className="text-[10px] font-mono text-rose-400">Modal 1120px</span>
              </button>
            )}

            {/* Simular Parada de Fogones SSE */}
            <button
              onClick={onSimularParadaFogones}
              className="w-full min-h-[36px] px-2.5 py-1.5 rounded-xl font-bold bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-800/80 transition-colors flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>Simular Parada Fogones (SSE)</span>
              </span>
              <span className="text-[10px] font-mono text-rose-400">Modal 620px</span>
            </button>

            {/* Acelerar Tiempos de Espera */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onAcelerarTiempos(10)}
                className="min-h-[32px] px-2 py-1 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] flex items-center justify-center gap-1"
              >
                <FastForward className="w-3 h-3" />
                <span>+10m (Ámbar)</span>
              </button>
              <button
                onClick={() => onAcelerarTiempos(20)}
                className="min-h-[32px] px-2 py-1 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[11px] flex items-center justify-center gap-1"
              >
                <FastForward className="w-3 h-3" />
                <span>+20m (Rojo)</span>
              </button>
            </div>

            {/* Alternar Estado Vacío / Loaded */}
            <button
              onClick={onAlternarVacio}
              className="w-full min-h-[32px] px-2.5 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-850 flex items-center justify-between"
            >
              <span>{esVacio ? 'Cargar 4 Comandas Demo' : 'Alternar Estado Vacío'}</span>
              <span className="text-[10px] font-mono text-slate-500">
                {esVacio ? 'Vacío' : 'Activo'}
              </span>
            </button>

            {/* Alternar SSE Conexión */}
            <button
              onClick={onAlternarSse}
              className="w-full min-h-[32px] px-2.5 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-850 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3 h-3 text-slate-400" />
                <span>{sseConectado ? 'Simular Offline SSE' : 'Reconectar SSE'}</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  sseConectado ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </button>

            {/* Restablecer Todo */}
            <button
              onClick={onRestablecer}
              className="w-full min-h-[30px] pt-1 text-[11px] text-slate-400 hover:text-aurea-champagne flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer Valores Iniciales</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
