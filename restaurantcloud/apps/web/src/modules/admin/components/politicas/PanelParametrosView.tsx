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

interface PanelParametrosViewProps {
  politicas: PoliticasReservaDTO;
  onChangeCampo: <K extends keyof PoliticasReservaDTO>(campo: K, valor: PoliticasReservaDTO[K]) => void;
  onRestaurarRecomendados: () => void;
  onDescartarCambios: () => void;
  onGuardar: () => void;
  isDirty: boolean;
  isGuardando: boolean;
}

export const PanelParametrosView: React.FC<PanelParametrosViewProps> = ({
  politicas,
  onChangeCampo,
  onRestaurarRecomendados,
  onDescartarCambios,
  onGuardar,
  isDirty,
  isGuardando,
}) => {
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

          {/* Campo 1: Duración Estándar de Reserva */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="duracion_reserva_min" className="flex items-center gap-1">
                <span>Duración Estándar</span>
                <span className="text-stone-400 font-normal">(mesa ocupada)</span>
              </label>
              <span className="font-mono text-aurea-navy font-bold text-sm bg-stone-100 px-2 py-0.5 rounded">
                {politicas.duracion_reserva_min} min
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="duracion_reserva_min"
                type="number"
                min={30}
                max={240}
                step={15}
                value={politicas.duracion_reserva_min}
                onChange={(e) => onChangeCampo('duracion_reserva_min', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[60, 90, 120].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('duracion_reserva_min', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.duracion_reserva_min === preset
                      ? 'bg-aurea-navy text-white border-aurea-navy'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Tiempo estimado que los clientes permanecen disfrutando su comida.
            </p>
          </div>

          {/* Campo 2: Margen Buffer de Limpieza */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="buffer_reserva_min" className="flex items-center gap-1">
                <span>Buffer de Limpieza</span>
                <span className="text-stone-400 font-normal">(sanitización)</span>
              </label>
              <span className="font-mono text-aurea-navy font-bold text-sm bg-stone-100 px-2 py-0.5 rounded">
                {politicas.buffer_reserva_min} min
              </span>
            </div>

            <input
              id="buffer_reserva_min"
              type="number"
              min={0}
              max={60}
              step={5}
              value={politicas.buffer_reserva_min}
              onChange={(e) => onChangeCampo('buffer_reserva_min', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
            />

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('buffer_reserva_min', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.buffer_reserva_min === preset
                      ? 'bg-aurea-navy text-white border-aurea-navy'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Margen de sanitización y reposición de vajilla entre reservas consecutivas.
            </p>
          </div>

          {/* Campo 3: Tolerancia de No-Show */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="tolerancia_no_show_min" className="flex items-center gap-1">
                <span>Tolerancia No-Show</span>
                <span className="text-stone-400 font-normal">(espera cortesía)</span>
              </label>
              <span className="font-mono text-aurea-navy font-bold text-sm bg-stone-100 px-2 py-0.5 rounded">
                {politicas.tolerancia_no_show_min} min
              </span>
            </div>

            <input
              id="tolerancia_no_show_min"
              type="number"
              min={5}
              max={60}
              step={5}
              value={politicas.tolerancia_no_show_min}
              onChange={(e) => onChangeCampo('tolerancia_no_show_min', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
            />

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('tolerancia_no_show_min', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.tolerancia_no_show_min === preset
                      ? 'bg-aurea-navy text-white border-aurea-navy'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Tiempo máximo de espera antes de liberar la mesa si el comensal no se presenta.
            </p>
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

          {/* Campo 4: Bloqueo Previo en Salón */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="minutos_bloqueo_previo" className="flex items-center gap-1">
                <span>Bloqueo Previo en Salón</span>
              </label>
              <span className="font-mono text-amber-800 font-bold text-sm bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {politicas.minutos_bloqueo_previo} min
              </span>
            </div>

            <input
              id="minutos_bloqueo_previo"
              type="number"
              min={0}
              max={120}
              step={15}
              value={politicas.minutos_bloqueo_previo}
              onChange={(e) => onChangeCampo('minutos_bloqueo_previo', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
            />

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[15, 30, 45].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('minutos_bloqueo_previo', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.minutos_bloqueo_previo === preset
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>

            {/* Nota de sincronización con CU-MOZO-01 */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Regla de Mozo (CU-MOZO-01):</strong> La mesa pasa automáticamente a estado{' '}
                <em>"bloqueada"</em> en el plano táctil {politicas.minutos_bloqueo_previo} minutos antes de la cita,
                prohibiendo sentar clientes de paso (walk-in).
              </span>
            </div>
          </div>

          {/* Campo 5: Margen de Recordatorio */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="margen_recordatorio_min" className="flex items-center gap-1">
                <span>Margen de Alerta / Recordatorio</span>
              </label>
              <span className="font-mono text-aurea-navy font-bold text-sm bg-stone-100 px-2 py-0.5 rounded">
                {politicas.margen_recordatorio_min} min
              </span>
            </div>

            <input
              id="margen_recordatorio_min"
              type="number"
              min={15}
              max={1440}
              step={30}
              value={politicas.margen_recordatorio_min}
              onChange={(e) => onChangeCampo('margen_recordatorio_min', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
            />

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[60, 120, 180].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('margen_recordatorio_min', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.margen_recordatorio_min === preset
                      ? 'bg-aurea-navy text-white border-aurea-navy'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} min ({preset / 60}h)
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Anticipación para que el sistema emita alertas operativas al equipo anfitrión sobre llegadas inminentes.
            </p>
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
                Horizontes de reserva para el comensal
              </p>
            </div>
          </div>

          {/* Campo 6: Anticipación Mínima para Reservar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="anticipacion_minima_horas" className="flex items-center gap-1">
                <span>Anticipación Mínima</span>
                <span className="text-stone-400 font-normal">(p/ reservar)</span>
              </label>
              <span className="font-mono text-emerald-800 font-bold text-sm bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {politicas.anticipacion_minima_horas} horas
              </span>
            </div>

            <input
              id="anticipacion_minima_horas"
              type="number"
              min={0}
              max={48}
              step={1}
              value={politicas.anticipacion_minima_horas}
              onChange={(e) => onChangeCampo('anticipacion_minima_horas', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
            />

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 4].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('anticipacion_minima_horas', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.anticipacion_minima_horas === preset
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} {preset === 1 ? 'hora' : 'horas'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Mínimo tiempo antes de la cita con el que un cliente puede solicitar mesa en la web pública.
            </p>
          </div>

          {/* Campo 7: Anticipación Máxima a Futuro */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="anticipacion_maxima_dias" className="flex items-center gap-1">
                <span>Anticipación Máxima</span>
                <span className="text-stone-400 font-normal">(horizonte futuro)</span>
              </label>
              <span className="font-mono text-aurea-navy font-bold text-sm bg-stone-100 px-2 py-0.5 rounded">
                {politicas.anticipacion_maxima_dias} días
              </span>
            </div>

            <input
              id="anticipacion_maxima_dias"
              type="number"
              min={1}
              max={90}
              step={5}
              value={politicas.anticipacion_maxima_dias}
              onChange={(e) => onChangeCampo('anticipacion_maxima_dias', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-aurea-navy focus:border-transparent font-medium"
            />

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              {[15, 30, 60].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeCampo('anticipacion_maxima_dias', preset)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    politicas.anticipacion_maxima_dias === preset
                      ? 'bg-aurea-navy text-white border-aurea-navy'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {preset} días
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              Máximo número de días en el calendario con disponibilidad abierta para comensales.
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRA INFERIOR DE ACCIONES Y PERSISTENCIA */}
      {/* ==================================================================== */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRestaurarRecomendados}
            disabled={isGuardando}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Restaurar Valores Recomendados</span>
          </button>

          {isDirty && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Hay modificaciones pendientes</span>
            </span>
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
            disabled={isGuardando}
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
