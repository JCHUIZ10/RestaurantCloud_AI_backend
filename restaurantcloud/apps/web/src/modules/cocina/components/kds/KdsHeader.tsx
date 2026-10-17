import React from 'react';
import { Wifi, Volume2, VolumeX, LayoutGrid, Layers, Clock } from 'lucide-react';
import { ConfiguracionKDSDTO } from '@/types/cocina';

interface KdsHeaderProps {
  horaActual: string;
  sseConectado: boolean;
  modoSonido: boolean;
  onToggleSonido: () => void;
  vistaActiva: 'fifo' | 'all_day';
  onCambiarVista: (vista: 'fifo' | 'all_day') => void;
  categoriaSeleccionada: string;
  onSeleccionarCategoria: (cat: string) => void;
  categoriasDisponibles: { nombre: string; total: number }[];
  metricas: {
    comandasActivas: number;
    platosTotal: number;
    enFuego: number;
    enCola: number;
    listos: number;
  };
  configuracion: ConfiguracionKDSDTO;
  despachadosCount?: number;
  onAbrirDespachados?: () => void;
  platosAgotadosCount?: number;
  onAbrirDisponibilidad?: () => void;
}

export const KdsHeader: React.FC<KdsHeaderProps> = ({
  horaActual,
  sseConectado,
  modoSonido,
  onToggleSonido,
  vistaActiva,
  onCambiarVista,
  categoriaSeleccionada,
  onSeleccionarCategoria,
  categoriasDisponibles,
  metricas,
  configuracion,
  despachadosCount = 0,
  onAbrirDespachados,
  platosAgotadosCount = 0,
  onAbrirDisponibilidad,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 shrink-0 text-slate-100 select-none shadow-md">
      {/* Fila 1: Título, Reloj, Conectividad SSE y Chef de Turno */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black tracking-wider text-base sm:text-lg text-white">
              RESTAURANTCLOUD <span className="text-aurea-copper">AI</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-aurea-champagne border border-slate-700">
              KDS COCINA • CU-COCINA-01 a 04
            </span>
          </div>
        </div>

        {/* Reloj central en vivo */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
          <Clock className="w-4 h-4 text-aurea-copper animate-pulse" />
          <span className="font-mono font-bold text-base tracking-widest text-aurea-ivory">
            {horaActual}
          </span>
        </div>

        {/* Accesos Rápidos: Despachados (CU-02) y Quiebres / Agotados (CU-04) */}
        <div className="flex items-center gap-2">
          {onAbrirDespachados && (
            <button
              onClick={onAbrirDespachados}
              className="px-3 py-1.5 rounded-lg font-mono font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all flex items-center gap-2 shadow"
              title="Bandeja de pedidos despachados en los últimos 30 minutos (Auditoría de solo lectura)"
            >
              <span>⏱️ Despachados</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[11px]">
                {despachadosCount}
              </span>
            </button>
          )}

          {onAbrirDisponibilidad && (
            <button
              onClick={onAbrirDisponibilidad}
              className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition-all flex items-center gap-2 shadow border ${
                platosAgotadosCount > 0
                  ? 'bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border-rose-800/80'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Gestión táctil de platos agotados y quiebres de cocina (CU-COCINA-04)"
            >
              <span>🚫 Platos Agotados</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  platosAgotadosCount > 0
                    ? 'bg-rose-500 text-white font-black animate-pulse'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                {platosAgotadosCount}
              </span>
            </button>
          )}
        </div>

        {/* Estado SSE, Sonido y Chef */}
        <div className="flex items-center gap-3 text-xs">
          {/* Indicador SSE */}
          <div
            className={`flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-md border ${
              sseConectado
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                : 'bg-rose-950/50 text-rose-400 border-rose-800/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                sseConectado ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
              }`}
            />
            <Wifi className="w-3.5 h-3.5" />
            <span className="font-semibold hidden sm:inline">
              {sseConectado ? 'KDS En Vivo (SSE)' : 'Reconectando SSE...'}
            </span>
          </div>

          {/* Toggle de Alerta Sonora */}
          <button
            onClick={onToggleSonido}
            title={modoSonido ? 'Silenciar alertas acústicas' : 'Activar alertas acústicas'}
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              modoSonido
                ? 'bg-slate-800 text-aurea-champagne border-slate-700 hover:bg-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            {modoSonido ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] hidden md:inline font-mono">
              {modoSonido ? 'Chime ON' : 'Mute'}
            </span>
          </button>

          {/* Chef Roberto */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-aurea-copper/20 border border-aurea-copper/40 flex items-center justify-center text-aurea-copper font-bold text-xs">
              CK
            </div>
            <div className="hidden lg:block leading-tight text-left">
              <p className="font-bold text-xs text-slate-200">Chef Roberto</p>
              <p className="text-[10px] text-slate-400">Jefe de Cocina</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: Pestañas de Categoría de Carta y Alternador de Vistas */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border-b border-slate-800/60">
        {/* Pestañas de Categorías Reales de la Carta */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categoriasDisponibles.map((cat) => {
            const esActiva = categoriaSeleccionada === cat.nombre;
            return (
              <button
                key={cat.nombre}
                onClick={() => onSeleccionarCategoria(cat.nombre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border min-h-[36px] ${
                  esActiva
                    ? 'bg-aurea-copper text-slate-950 border-aurea-copper font-bold shadow-sm'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{cat.nombre}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    esActiva ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {cat.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Alternador de Vista: FIFO vs Consolidado All-Day */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onCambiarVista('fifo')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 min-h-[34px] ${
              vistaActiva === 'fifo'
                ? 'bg-slate-800 text-aurea-champagne shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>⊞ Comandas FIFO ({metricas.comandasActivas})</span>
          </button>
          <button
            onClick={() => onCambiarVista('all_day')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 min-h-[34px] ${
              vistaActiva === 'all_day'
                ? 'bg-slate-800 text-aurea-champagne shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>☰ Consolidado All-Day ({metricas.platosTotal})</span>
          </button>
        </div>
      </div>

      {/* Fila 3: Barra de Métricas de Cocina y Umbrales de Sede (CU-ADMIN-18) */}
      <div className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-950/50 text-slate-400">
        <div className="flex items-center flex-wrap gap-2 sm:gap-4 font-mono">
          <span>
            Comandas Activas: <strong className="text-white font-bold">{metricas.comandasActivas}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span>
            Platos en Cocina: <strong className="text-white font-bold">{metricas.platosTotal}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span>
            En Fuego: <strong className="text-amber-400 font-bold">{metricas.enFuego}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span>
            En Cola: <strong className="text-slate-300 font-bold">{metricas.enCola}</strong>
          </span>
          <span className="text-slate-700">•</span>
          <span>
            Listos en Pase: <strong className="text-emerald-400 font-bold">{metricas.listos}</strong>
          </span>
        </div>

        {/* Umbrales de Sede (configuracion_kds) */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-slate-500">⚙️ Umbrales Sede (CU-ADMIN-18):</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-bold">
            🟢 &lt;={configuracion.tiempo_optimo_verde_min}m
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/50 font-bold">
            🟡 {configuracion.tiempo_optimo_verde_min + 1}-{configuracion.tiempo_alerta_ambar_min}m
          </span>
          <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/50 font-bold">
            🔴 &gt;{configuracion.tiempo_alerta_ambar_min}m
          </span>
        </div>
      </div>
    </header>
  );
};
