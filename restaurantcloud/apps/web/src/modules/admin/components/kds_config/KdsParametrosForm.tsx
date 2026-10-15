import React from 'react';
import {
  Minus,
  Plus,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Save,
  LayoutGrid,
  ListOrdered,
  Clock,
  Bell,
  Siren,
  UtensilsCrossed,
} from 'lucide-react';
import { ConfiguracionKdsDTO } from '@/types/admin';

interface KdsParametrosFormProps {
  config: ConfiguracionKdsDTO;
  onChange: (nuevaConfig: ConfiguracionKdsDTO) => void;
  onGuardar: () => void;
  onRestaurarDefaults: () => void;
  onTestAudio: (tipo: 'chime' | 'alarma') => void;
  isDirty: boolean;
  isGuardando: boolean;
  errorValidacion: string | null;
}

export const KdsParametrosForm: React.FC<KdsParametrosFormProps> = ({
  config,
  onChange,
  onGuardar,
  onRestaurarDefaults,
  onTestAudio,
  isDirty,
  isGuardando,
  errorValidacion,
}) => {
  // Helpers para modificar valores con límites estrictos de 02_schema_ddl.sql
  const ajustarNumero = (
    campo: keyof ConfiguracionKdsDTO,
    delta: number,
    min: number,
    max: number
  ) => {
    const actual = Number(config[campo]) || 0;
    const nuevo = Math.min(max, Math.max(min, actual + delta));
    onChange({
      ...config,
      [campo]: nuevo,
    });
  };

  const handleInputDirecto = (
    campo: keyof ConfiguracionKdsDTO,
    valorStr: string,
    min: number,
    max: number
  ) => {
    const num = parseInt(valorStr, 10);
    if (isNaN(num)) return;
    const acotado = Math.min(max, Math.max(min, num));
    onChange({
      ...config,
      [campo]: acotado,
    });
  };

  const isIncoherente = config.tiempo_alerta_ambar_min <= config.tiempo_optimo_verde_min;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-7">
      {/* ------------------------------------------------------------------ */}
      {/* SECCIÓN 1: UMBRALES DEL SEMÁFORO KDS (MINUTOS)                     */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-aurea-copper" />
          <h2 className="text-lg font-serif font-bold text-aurea-navy">
            1. Umbrales del Semáforo KDS (Minutos)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Controla en qué momento las comandas activas cambian de color en los monitores de cocina (CU-COCINA-01).
        </p>

        {/* Banner de error de coherencia temporal (RN-KDS-01) */}
        {(isIncoherente || errorValidacion) && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold block">Regla de Coherencia Temporal Violada:</span>
              <span>
                {errorValidacion || `El tiempo de alerta ámbar (${config.tiempo_alerta_ambar_min}m) debe ser estrictamente mayor al tiempo óptimo verde (${config.tiempo_optimo_verde_min}m).`}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input 1: Tiempo Óptimo Verde */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase text-emerald-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Tiempo Óptimo (Verde)
              </span>
              <span className="text-[11px] font-mono text-slate-500">3 - 60 min</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ajustarNumero('tiempo_optimo_verde_min', -1, 3, 60)}
                disabled={config.tiempo_optimo_verde_min <= 3}
                aria-label="Disminuir tiempo verde"
                className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg shadow-sm transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center relative">
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={config.tiempo_optimo_verde_min}
                  onChange={(e) => handleInputDirecto('tiempo_optimo_verde_min', e.target.value, 3, 60)}
                  className="w-full text-center text-2xl font-mono font-bold py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 absolute right-3 top-3.5 pointer-events-none">min</span>
              </div>

              <button
                type="button"
                onClick={() => ajustarNumero('tiempo_optimo_verde_min', 1, 3, 60)}
                disabled={config.tiempo_optimo_verde_min >= 60}
                aria-label="Aumentar tiempo verde"
                className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-tight">
              🟢 Comandas con espera &le; {config.tiempo_optimo_verde_min} min se consideran en ritmo óptimo.
            </p>
          </div>

          {/* Input 2: Tiempo Alerta Ámbar */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase text-amber-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                Tiempo Alerta (Ámbar)
              </span>
              <span className="text-[11px] font-mono text-slate-500">5 - 120 min</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ajustarNumero('tiempo_alerta_ambar_min', -1, 5, 120)}
                disabled={config.tiempo_alerta_ambar_min <= 5}
                aria-label="Disminuir tiempo ámbar"
                className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg shadow-sm transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center relative">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={config.tiempo_alerta_ambar_min}
                  onChange={(e) => handleInputDirecto('tiempo_alerta_ambar_min', e.target.value, 5, 120)}
                  className={`w-full text-center text-2xl font-mono font-bold py-2 bg-white rounded-xl border text-slate-800 focus:outline-none focus:ring-2 ${
                    isIncoherente
                      ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-amber-500'
                  }`}
                />
                <span className="text-[10px] text-slate-400 absolute right-3 top-3.5 pointer-events-none">min</span>
              </div>

              <button
                type="button"
                onClick={() => ajustarNumero('tiempo_alerta_ambar_min', 1, 5, 120)}
                disabled={config.tiempo_alerta_ambar_min >= 120}
                aria-label="Aumentar tiempo ámbar"
                className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-tight">
              🟡 Comandas entre {config.tiempo_optimo_verde_min + 1} y {config.tiempo_alerta_ambar_min} min muestran aviso de advertencia.
            </p>
          </div>
        </div>

        {/* Tarjeta explicativa de Rojo Crítico Automático */}
        <div className="mt-3 p-3.5 rounded-xl bg-red-50/70 border border-red-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            🔴
          </div>
          <div className="text-xs">
            <span className="font-bold text-red-900 block">Umbral Rojo Crítico Calculado Automáticamente:</span>
            <span className="text-red-700">
              Toda comanda con espera <strong>&gt; {config.tiempo_alerta_ambar_min} min</strong> pasa a rojo crítico con borde parpadeante y prioridad operativa en KDS.
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECCIÓN 2: ALERTA DE PASE CALIENTE (SALÓN / MOZOS)                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="w-5 h-5 text-aurea-copper" />
          <h2 className="text-lg font-serif font-bold text-aurea-navy">
            2. Alerta de Pase Caliente (Salón / Mozos)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Tolerancia máxima para que un mozo recoja platos listos antes de enfriarse (CU-MOZO-01 / CU-COCINA-02).
        </p>

        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-700">
              Tolerancia Máxima en Pase
            </span>
            <span className="text-[11px] font-mono text-slate-500">1 - 30 min</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ajustarNumero('tiempo_maximo_pase_min', -1, 1, 30)}
              disabled={config.tiempo_maximo_pase_min <= 1}
              aria-label="Disminuir tiempo pase"
              className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg shadow-sm transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center relative">
              <input
                type="number"
                min={1}
                max={30}
                value={config.tiempo_maximo_pase_min}
                onChange={(e) => handleInputDirecto('tiempo_maximo_pase_min', e.target.value, 1, 30)}
                className="w-full text-center text-2xl font-mono font-bold py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-aurea-copper"
              />
              <span className="text-[10px] text-slate-400 absolute right-3 top-3.5 pointer-events-none">min</span>
            </div>

            <button
              type="button"
              onClick={() => ajustarNumero('tiempo_maximo_pase_min', 1, 1, 30)}
              disabled={config.tiempo_maximo_pase_min >= 30}
              aria-label="Aumentar tiempo pase"
              className="w-12 h-12 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            ⏱️ Si un plato en 'Listo' excede los {config.tiempo_maximo_pase_min} min en el mostrador, la tarjeta en la tablet del mozo parpadeará en color de urgencia.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECCIÓN 3: SONIDO Y PANTALLA EN COCINA                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-5 h-5 text-aurea-copper" />
          <h2 className="text-lg font-serif font-bold text-aurea-navy">
            3. Alertas Acústicas y Vista Predeterminada
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Configura timbres acústicos de la brigada y la pantalla de inicio del monitor KDS.
        </p>

        {/* Switch 1: Timbre nueva comanda */}
        <div className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                Timbre sonoro al recibir comanda (Chime)
              </span>
              <span className="text-xs text-slate-500">
                Emite un tono armónico ascendente de 2 frecuencias (587Hz &rarr; 880Hz) cada vez que salón envía una comanda nueva.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onTestAudio('chime')}
              title="Probar sonido en tus altavoces"
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Probar Tono</span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={config.alerta_sonora_nueva_comanda}
              onClick={() => onChange({ ...config, alerta_sonora_nueva_comanda: !config.alerta_sonora_nueva_comanda })}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                config.alerta_sonora_nueva_comanda ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-md ${
                  config.alerta_sonora_nueva_comanda ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Switch 2: Alarma comanda roja */}
        <div className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <Siren className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-800 block">
                Alarma acústica periódica para comandas en rojo crítico
              </span>
              <span className="text-xs text-slate-500">
                Emite una sirena de advertencia cada vez que exista al menos una orden demorada en rojo.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onTestAudio('alarma')}
              title="Probar alarma roja en tus altavoces"
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5 text-red-600" />
              <span>Probar Alarma</span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={config.alerta_sonora_comanda_roja}
              onClick={() => onChange({ ...config, alerta_sonora_comanda_roja: !config.alerta_sonora_comanda_roja })}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-red-500 ${
                config.alerta_sonora_comanda_roja ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform shadow-md ${
                  config.alerta_sonora_comanda_roja ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Intervalo de repetición de sonido en rojo (si activo) */}
        {config.alerta_sonora_comanda_roja && (
          <div className="ml-4 pl-4 border-l-2 border-red-200 py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                Intervalo de repetición acústica en rojo:
              </span>
              <span className="text-[11px] text-slate-500">
                Se repetirá cada {config.intervalo_sonido_rojo_seg} segundos ({Math.round(config.intervalo_sonido_rojo_seg / 60 * 10) / 10} min).
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ajustarNumero('intervalo_sonido_rojo_seg', -15, 15, 300)}
                disabled={config.intervalo_sonido_rojo_seg <= 15}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 text-xs font-bold"
              >
                -15s
              </button>
              <span className="text-sm font-mono font-bold w-16 text-center text-slate-800">
                {config.intervalo_sonido_rojo_seg}s
              </span>
              <button
                type="button"
                onClick={() => ajustarNumero('intervalo_sonido_rojo_seg', 15, 15, 300)}
                disabled={config.intervalo_sonido_rojo_seg >= 300}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-30 text-xs font-bold"
              >
                +15s
              </button>
            </div>
          </div>
        )}

        {/* Vista predeterminada en monitor KDS */}
        <div className="pt-2">
          <label className="text-xs font-semibold uppercase text-slate-700 block mb-2">
            Vista de Inicio en Monitor KDS
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...config, vista_predeterminada: 'fifo' })}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                config.vista_predeterminada === 'fifo'
                  ? 'border-aurea-copper bg-amber-50/40 ring-2 ring-aurea-copper/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <LayoutGrid
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  config.vista_predeterminada === 'fifo' ? 'text-aurea-copper' : 'text-slate-400'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  ⊞ Comandas FIFO por Mesa (Recomendado)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Visualización columnar de tickets por orden cronológico de llegada.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...config, vista_predeterminada: 'all_day' })}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                config.vista_predeterminada === 'all_day'
                  ? 'border-aurea-copper bg-amber-50/40 ring-2 ring-aurea-copper/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <ListOrdered
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  config.vista_predeterminada === 'all_day' ? 'text-aurea-copper' : 'text-slate-400'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  ☰ Consolidado de Producción (All-Day)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Agrupación de platos acumulados por partida culinaria para sartenes y hornos.
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER DE ACCIONES                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRestaurarDefaults}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Restaurar Valores Recomendados</span>
        </button>

        <button
          type="button"
          onClick={onGuardar}
          disabled={!isDirty || isIncoherente || isGuardando}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-aurea-copper text-aurea-navy hover:bg-aurea-copper/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          {isGuardando ? (
            <>
              <span className="w-4 h-4 border-2 border-aurea-navy border-t-transparent rounded-full animate-spin"></span>
              <span>Guardando y transmitiendo SSE...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-aurea-navy" />
              <span>Guardar Parámetros de KDS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
