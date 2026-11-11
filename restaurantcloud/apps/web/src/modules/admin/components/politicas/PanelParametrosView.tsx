import React from 'react';
import {
  Calendar,
  AlertCircle,
  RotateCcw,
  Save,
  Info,
  Timer,
  Hourglass,
} from 'lucide-react';
import { PoliticasReservaDTO } from '@/types/admin';
import { CampoPolitica, ErroresPoliticas, RANGOS_POLITICAS, textoRango } from './rangosPoliticas';

type Acento = 'navy' | 'amber';

const ACENTOS: Record<Acento, { insignia: string; presetActivo: string }> = {
  navy: {
    insignia: 'text-aurea-navy bg-stone-100 border-transparent',
    presetActivo: 'bg-aurea-navy text-white border-aurea-navy',
  },
  amber: {
    insignia: 'text-amber-800 bg-amber-50 border-amber-200',
    presetActivo: 'bg-amber-700 text-white border-amber-700',
  },
};

interface CampoNumericoProps {
  campo: CampoPolitica;
  titulo: string;
  /** Aclaración corta junto al título, por ejemplo "(mesa ocupada)". */
  subtitulo?: string;
  /** Marca que indica que el parámetro aún no tiene efecto. */
  insigniaEstado?: string;
  valor: number;
  step: number;
  presets: number[];
  /** Cómo se escribe cada preset; por defecto "<n> <unidad corta>". */
  formatoPreset?: (preset: number) => string;
  descripcion: string;
  error?: string;
  acento?: Acento;
  onChange: (valor: number) => void;
  /** Contenido adicional bajo la descripción. */
  children?: React.ReactNode;
}

/** Campo numérico con su rango permitido siempre visible y el error en línea. */
const CampoNumerico: React.FC<CampoNumericoProps> = ({
  campo,
  titulo,
  subtitulo,
  insigniaEstado,
  valor,
  step,
  presets,
  formatoPreset,
  descripcion,
  error,
  acento = 'navy',
  onChange,
  children,
}) => {
  const { min, max, unidad } = RANGOS_POLITICAS[campo];
  const unidadCorta = unidad === 'minutos' ? 'min' : unidad;
  const colores = ACENTOS[acento];
  const idError = `${campo}-error`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-700">
        <label htmlFor={campo} className="flex flex-wrap items-center gap-1">
          <span>{titulo}</span>
          {subtitulo && <span className="text-stone-400 font-normal">{subtitulo}</span>}
          {insigniaEstado && (
            <span className="text-[10px] font-bold uppercase tracking-wide bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">
              {insigniaEstado}
            </span>
          )}
        </label>
        <span
          className={`font-mono font-bold text-sm border px-2 py-0.5 rounded shrink-0 ${
            error ? 'text-red-700 bg-red-50 border-red-300' : colores.insignia
          }`}
        >
          {Number.isFinite(valor) ? `${valor} ${unidadCorta}` : `— ${unidadCorta}`}
        </span>
      </div>

      <input
        id={campo}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(valor) ? valor : ''}
        onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:border-transparent font-medium ${
          error
            ? 'border-red-400 bg-red-50/40 focus:ring-red-500'
            : 'border-stone-300 focus:ring-aurea-navy'
        }`}
      />

      {error ? (
        <p id={idError} role="alert" className="flex items-start gap-1 text-[11px] font-semibold text-red-700 leading-tight">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        <p className="text-[11px] font-semibold text-stone-500 leading-tight">Permitido: {textoRango(campo)}</p>
      )}

      {/* Presets Rápidos */}
      <div className="flex items-center gap-1.5 pt-1">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
              valor === preset
                ? colores.presetActivo
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            {formatoPreset ? formatoPreset(preset) : `${preset} ${unidadCorta}`}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-stone-500 leading-tight">{descripcion}</p>
      {children}
    </div>
  );
};

interface PanelParametrosViewProps {
  politicas: PoliticasReservaDTO;
  /** Error de validación por campo (los válidos no aparecen). */
  errores: ErroresPoliticas;
  onChangeCampo: <K extends keyof PoliticasReservaDTO>(campo: K, valor: PoliticasReservaDTO[K]) => void;
  onRestaurarRecomendados: () => void;
  onDescartarCambios: () => void;
  onGuardar: () => void;
  isDirty: boolean;
  isGuardando: boolean;
}

export const PanelParametrosView: React.FC<PanelParametrosViewProps> = ({
  politicas,
  errores,
  onChangeCampo,
  onRestaurarRecomendados,
  onDescartarCambios,
  onGuardar,
  isDirty,
  isGuardando,
}) => {
  const cantidadErrores = Object.keys(errores).length;

  return (
    <div className="space-y-6">
      {/* Grid de 3 Tarjetas Operativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ==================================================================== */}
        {/* TARJETA 1: Tiempos de Servicio */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 space-y-5 hover:border-aurea-copper/40 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Timer className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-aurea-navy uppercase tracking-wider">
                Tiempos de Servicio
              </h3>
              <p className="text-[11px] text-stone-500">
                Rotación y permanencia de comensales en mesa
              </p>
            </div>
          </div>

          <CampoNumerico
            campo="duracion_reserva_min"
            titulo="Duración Estándar"
            subtitulo="(mesa ocupada)"
            valor={politicas.duracion_reserva_min}
            step={15}
            presets={[60, 90, 120]}
            descripcion="Tiempo estimado que los clientes permanecen disfrutando su comida."
            error={errores.duracion_reserva_min}
            onChange={(v) => onChangeCampo('duracion_reserva_min', v)}
          />

          <div className="pt-2 border-t border-stone-100">
            <CampoNumerico
              campo="buffer_reserva_min"
              titulo="Buffer de Limpieza"
              subtitulo="(sanitización)"
              valor={politicas.buffer_reserva_min}
              step={5}
              presets={[10, 15, 20]}
              descripcion="Margen de sanitización y reposición de vajilla entre reservas consecutivas."
              error={errores.buffer_reserva_min}
              onChange={(v) => onChangeCampo('buffer_reserva_min', v)}
            />
          </div>

          <div className="pt-2 border-t border-stone-100">
            <CampoNumerico
              campo="tolerancia_no_show_min"
              titulo="Tolerancia No-Show"
              subtitulo="(espera cortesía)"
              valor={politicas.tolerancia_no_show_min}
              step={5}
              presets={[10, 15, 20]}
              descripcion="Tiempo máximo de espera antes de liberar la mesa si el comensal no se presenta."
              error={errores.tolerancia_no_show_min}
              onChange={(v) => onChangeCampo('tolerancia_no_show_min', v)}
            />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TARJETA 2: Operación en Salón */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 space-y-5 hover:border-aurea-copper/40 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Hourglass className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-aurea-navy uppercase tracking-wider">
                Operación en Salón
              </h3>
              <p className="text-[11px] text-stone-500">
                Sincronización con terminal de mozos y equipo
              </p>
            </div>
          </div>

          <CampoNumerico
            campo="minutos_bloqueo_previo"
            titulo="Bloqueo Previo en Salón"
            valor={politicas.minutos_bloqueo_previo}
            step={15}
            presets={[15, 30, 45]}
            descripcion="Minutos antes de la cita en que la mesa se bloquea en el plano del mozo."
            error={errores.minutos_bloqueo_previo}
            acento="amber"
            onChange={(v) => onChangeCampo('minutos_bloqueo_previo', v)}
          >
            {/* Nota de sincronización con CU-MOZO-01 */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Regla de Mozo (CU-MOZO-01):</strong> La mesa pasa automáticamente a estado{' '}
                <em>"bloqueada"</em> en el plano táctil {Number.isFinite(politicas.minutos_bloqueo_previo) ? politicas.minutos_bloqueo_previo : '—'} minutos antes de la cita,
                prohibiendo sentar clientes de paso (walk-in).
              </span>
            </div>
          </CampoNumerico>

          <div className="pt-2 border-t border-stone-100">
            <CampoNumerico
              campo="margen_recordatorio_min"
              titulo="Margen de Alerta / Recordatorio"
              insigniaEstado="Próximamente"
              valor={politicas.margen_recordatorio_min}
              step={15}
              presets={[60, 120, 180]}
              formatoPreset={(preset) => `${preset} min (${preset / 60}h)`}
              descripcion="Se guarda para los recordatorios automáticos, que todavía no están disponibles: por ahora no genera avisos."
              error={errores.margen_recordatorio_min}
              onChange={(v) => onChangeCampo('margen_recordatorio_min', v)}
            />
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TARJETA 3: Ventana de Anticipación */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 space-y-5 hover:border-aurea-copper/40 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-aurea-navy uppercase tracking-wider">
                Ventana de Anticipación
              </h3>
              <p className="text-[11px] text-stone-500">
                Hasta cuántos días antes se puede reservar
              </p>
            </div>
          </div>

          <CampoNumerico
            campo="anticipacion_maxima_dias"
            titulo="Anticipación Máxima"
            subtitulo="(horizonte futuro)"
            valor={politicas.anticipacion_maxima_dias}
            step={5}
            presets={[15, 30, 60]}
            descripcion="Máximo de días hacia adelante en que se puede registrar una reserva."
            error={errores.anticipacion_maxima_dias}
            onChange={(v) => onChangeCampo('anticipacion_maxima_dias', v)}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRA INFERIOR DE ACCIONES Y PERSISTENCIA */}
      {/* ==================================================================== */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRestaurarRecomendados}
            disabled={isGuardando}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Restaurar Valores Recomendados</span>
          </button>

          {cantidadErrores > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                Corrige {cantidadErrores} {cantidadErrores === 1 ? 'campo' : 'campos'} para poder guardar
              </span>
            </span>
          ) : (
            isDirty && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Hay modificaciones pendientes</span>
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onDescartarCambios}
            disabled={!isDirty || isGuardando}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Descartar
          </button>

          <button
            type="button"
            onClick={onGuardar}
            disabled={isGuardando || cantidadErrores > 0}
            title={cantidadErrores > 0 ? 'Corrige los campos marcados en rojo para guardar' : undefined}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-aurea-navy hover:bg-aurea-navy/90 shadow-md shadow-aurea-navy/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGuardando ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-aurea-champagne" />
                <span>Guardar Políticas de Reserva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
