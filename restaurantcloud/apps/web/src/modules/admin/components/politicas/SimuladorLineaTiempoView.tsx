import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Calendar,
  Users,
  Timer,
  Hourglass,
  Brush,
  RotateCcw,
} from 'lucide-react';
import { PoliticasReservaDTO } from '@/types/admin';

interface SimuladorLineaTiempoViewProps {
  politicas: PoliticasReservaDTO;
  onVolverPanel: () => void;
  onAplicarParametros?: (nuevasPoliticas: Partial<PoliticasReservaDTO>) => void;
}

export const SimuladorLineaTiempoView: React.FC<SimuladorLineaTiempoViewProps> = ({
  politicas,
  onVolverPanel,
  onAplicarParametros,
}) => {
  // Estado local para experimentación interactiva en el simulador
  const [horaCitaStr, setHoraCitaStr] = useState<'13:00' | '14:00' | '20:00'>('14:00');
  const [mesaEjemplo] = useState('Mesa 05 (4 PAX)');

  // Parámetros temporales editables en vivo dentro del simulador
  const [duracionSim, setDuracionSim] = useState(politicas.duracion_reserva_min);
  const [bufferSim, setBufferSim] = useState(politicas.buffer_reserva_min);
  const [toleranciaSim, setToleranciaSim] = useState(politicas.tolerancia_no_show_min);
  const [bloqueoSim, setBloqueoSim] = useState(politicas.minutos_bloqueo_previo);

  // Auxiliares de cálculo de horas
  const [horaBaseH, horaBaseM] = horaCitaStr.split(':').map(Number);
  const minutosCita = horaBaseH * 60 + horaBaseM;

  // Hitos temporales en minutos desde medianoche
  const minutosInicioBloqueo = minutosCita - bloqueoSim;
  const minutosFinNoShow = minutosCita + toleranciaSim;
  const minutosFinConsumo = minutosCita + duracionSim;
  const minutosFinBuffer = minutosFinConsumo + bufferSim;

  // Conversión a formato HH:MM
  const formatMinutos = (totalMins: number): string => {
    let m = totalMins % (24 * 60);
    if (m < 0) m += 24 * 60;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const horaInicioBloqueoStr = formatMinutos(minutosInicioBloqueo);
  const horaFinNoShowStr = formatMinutos(minutosFinNoShow);
  const horaFinConsumoStr = formatMinutos(minutosFinConsumo);
  const horaFinLiberacionStr = formatMinutos(minutosFinBuffer);

  // Ocupación total bloqueada por la cita (bloqueo previo + estancia comensal + buffer limpieza)
  const ocupacionTotalMin = bloqueoSim + duracionSim + bufferSim;
  const ocupacionHoras = Math.floor(ocupacionTotalMin / 60);
  const ocupacionMinsRestantes = ocupacionTotalMin % 60;

  // Porcentajes relativos en el diagrama
  const pctBloqueo = Math.max(5, (bloqueoSim / ocupacionTotalMin) * 100);
  const pctDuracion = Math.max(20, (duracionSim / ocupacionTotalMin) * 100);
  const pctBuffer = Math.max(5, (bufferSim / ocupacionTotalMin) * 100);

  // Resetear a los valores actuales de configuración
  const handleResetSim = () => {
    setDuracionSim(politicas.duracion_reserva_min);
    setBufferSim(politicas.buffer_reserva_min);
    setToleranciaSim(politicas.tolerancia_no_show_min);
    setBloqueoSim(politicas.minutos_bloqueo_previo);
  };

  // Transferir los valores probados a la configuración
  const handleAplicarACartera = () => {
    if (onAplicarParametros) {
      onAplicarParametros({
        duracion_reserva_min: duracionSim,
        buffer_reserva_min: bufferSim,
        tolerancia_no_show_min: toleranciaSim,
        minutos_bloqueo_previo: bloqueoSim,
      });
    }
    onVolverPanel();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Simulador */}
      <div className="bg-white rounded-2xl border border-aurea-copper/20 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-aurea-copper/20 text-aurea-navy text-xs font-bold uppercase tracking-wider">
                Simulador Dinámico de Salón
              </span>
              <span className="text-xs text-stone-500 font-mono">1:1 con Plano Mozo</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-aurea-navy mt-1">
              Visualizador de Rotación y Bloqueo de Mesas
            </h2>
            <p className="text-xs text-stone-600">
              Examina matemáticamente cómo se protege la mesa ante walk-in, estancia de comensales y sanitización.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSim}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5"
              title="Restablecer controles del simulador a los valores guardados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              type="button"
              onClick={handleAplicarACartera}
              className="px-4 py-1.5 rounded-xl bg-aurea-copper text-aurea-navy hover:bg-aurea-copper/90 text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <span>Aplicar a Configuración</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Controles de Escenario de Prueba */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Hora de Reserva Ejemplo:
            </label>
            <div className="inline-flex w-full p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
              {(['13:00', '14:00', '20:00'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoraCitaStr(h)}
                  className={`flex-1 py-1 rounded-lg transition-colors ${
                    horaCitaStr === h
                      ? 'bg-white text-aurea-navy shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Bloqueo Previo ({bloqueoSim} min):
            </label>
            <input
              type="range"
              min={0}
              max={60}
              step={15}
              value={bloqueoSim}
              onChange={(e) => setBloqueoSim(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Duración Reserva ({duracionSim} min):
            </label>
            <input
              type="range"
              min={30}
              max={180}
              step={15}
              value={duracionSim}
              onChange={(e) => setDuracionSim(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Buffer Limpieza ({bufferSim} min):
            </label>
            <input
              type="range"
              min={0}
              max={45}
              step={5}
              value={bufferSim}
              onChange={(e) => setBufferSim(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DIAGRAMA PRINCIPAL: LÍNEA DE TIEMPO VISUAL */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-aurea-navy" />
            <span className="text-sm font-bold text-aurea-navy">
              Ejemplo Operativo: Reserva confirmada para las {horaCitaStr}
            </span>
            <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-mono">
              {mesaEjemplo}
            </span>
          </div>

          <div className="text-xs text-stone-500 font-mono">
            Ventana total ocupada:{' '}
            <strong className="text-aurea-navy font-bold">{horaInicioBloqueoStr}</strong> a{' '}
            <strong className="text-aurea-navy font-bold">{horaFinLiberacionStr}</strong>
          </div>
        </div>

        {/* Tarjetas Superiores Explicativas de Fases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Fase 1: Bloqueo Previo */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-amber-700" />
                Bloqueo Previo ({bloqueoSim} min)
              </span>
              <span className="font-mono text-amber-800 text-[11px] font-semibold">
                {horaInicioBloqueoStr} - {horaCitaStr}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              Mesa protegida en mozo (<code className="font-mono text-[10px] bg-amber-100 px-1 rounded">bloqueada</code>). Prohibido sentar walk-in.
            </p>
          </div>

          {/* Fase 2: Tolerancia No-Show */}
          <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-purple-700" />
                Tolerancia No-Show ({toleranciaSim} min)
              </span>
              <span className="font-mono text-purple-800 text-[11px] font-semibold">
                {horaCitaStr} - {horaFinNoShowStr}
              </span>
            </div>
            <p className="text-[11px] text-purple-800 leading-snug">
              Espera de cortesía. Si el cliente no llega a las {horaFinNoShowStr}, se cancela y se libera.
            </p>
          </div>

          {/* Fase 3: Buffer de Limpieza */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <Brush className="w-3.5 h-3.5 text-teal-700" />
                Buffer Limpieza ({bufferSim} min)
              </span>
              <span className="font-mono text-teal-800 text-[11px] font-semibold">
                {horaFinConsumoStr} - {horaFinLiberacionStr}
              </span>
            </div>
            <p className="text-[11px] text-teal-800 leading-snug">
              Sanitización de mesa y reposición de cubiertos antes de la siguiente rotación.
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BARRA HORIZONTAL CONTINUA INTERACTIVA */}
        {/* ==================================================================== */}
        <div className="pt-4 pb-2 space-y-3">
          <div className="relative w-full h-14 bg-stone-100 rounded-2xl overflow-hidden border border-stone-300 flex shadow-inner">
            {/* 1. Bloqueo Previo */}
            <div
              style={{ width: `${pctBloqueo}%` }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 flex flex-col items-center justify-center text-white px-2 text-center transition-all duration-300 relative group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                Bloqueada
              </span>
              <span className="text-[10px] opacity-90 font-mono mt-0.5">
                {bloqueoSim} min
              </span>
              {/* Tooltip Hover */}
              <div className="absolute -top-10 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                Bloqueo Previo: {horaInicioBloqueoStr} - {horaCitaStr}
              </div>
            </div>

            {/* 2. Estancia Comensales (Ocupada) */}
            <div
              style={{ width: `${pctDuracion}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex flex-col items-center justify-center text-white px-2 text-center transition-all duration-300 relative group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider leading-none">
                <Users className="w-3.5 h-3.5" />
                <span>Ocupada (Comensales)</span>
              </div>
              <span className="text-[10px] opacity-90 font-mono mt-0.5">
                {duracionSim} min ({horaCitaStr} a {horaFinConsumoStr})
              </span>
              {/* Tooltip Hover */}
              <div className="absolute -top-10 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                Reserva activa: {horaCitaStr} - {horaFinConsumoStr} ({duracionSim} min)
              </div>
            </div>

            {/* 3. Buffer de Limpieza */}
            <div
              style={{ width: `${pctBuffer}%` }}
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 flex flex-col items-center justify-center text-white px-2 text-center transition-all duration-300 relative group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                Limpieza
              </span>
              <span className="text-[10px] opacity-90 font-mono mt-0.5">
                {bufferSim} min
              </span>
              {/* Tooltip Hover */}
              <div className="absolute -top-10 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-30">
                Buffer de Sanitización: {horaFinConsumoStr} - {horaFinLiberacionStr}
              </div>
            </div>
          </div>

          {/* Marcas de Tiempo en la regla inferior */}
          <div className="flex justify-between items-center text-xs text-stone-500 font-mono px-1">
            <div className="flex flex-col items-start">
              <span className="font-bold text-amber-700">{horaInicioBloqueoStr}</span>
              <span className="text-[10px] text-stone-400">Inicio Bloqueo</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="font-bold text-aurea-navy bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                {horaCitaStr}
              </span>
              <span className="text-[10px] text-stone-500">Cita Confirmada</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="font-bold text-purple-700">{horaFinNoShowStr}</span>
              <span className="text-[10px] text-stone-400">Límite No-Show</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="font-bold text-blue-700">{horaFinConsumoStr}</span>
              <span className="text-[10px] text-stone-400">Fin Comida</span>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {horaFinLiberacionStr}
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold">Mesa Disponible</span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RESUMEN MÉTRICO INFERIOR (3 TARJETAS) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500">
              Ocupación Total Bloqueada
            </span>
            <div className="text-xl font-bold font-serif text-aurea-navy">
              {ocupacionTotalMin} minutos
            </div>
            <p className="text-xs text-stone-600">
              Equivale a <strong>{ocupacionHoras}h {ocupacionMinsRestantes > 0 ? `${ocupacionMinsRestantes}m` : ''}</strong> por cita
              ({bloqueoSim}m bloq + {duracionSim}m cita + {bufferSim}m limp).
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500">
              Sincronización en Salón
            </span>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Tiempo Real vía SSE en Mozo</span>
            </div>
            <p className="text-xs text-stone-600">
              El plano táctil de <strong className="text-stone-800">CU-MOZO-01</strong> bloquea la mesa exactamente a las <strong>{horaInicioBloqueoStr}</strong>.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500">
              Regla Operativa de Liberación
            </span>
            <div className="text-xl font-bold font-mono text-emerald-800">
              {horaFinLiberacionStr} en punto
            </div>
            <p className="text-xs text-stone-600">
              La mesa se marca nuevamente como <span className="font-semibold text-emerald-700">disponible</span> para walk-in o siguiente reserva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
