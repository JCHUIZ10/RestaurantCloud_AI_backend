import React, { useState } from 'react';
import { Sparkles, Bell, Clock, Lock, AlertTriangle, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface DemoReservasWidgetProps {
  onSimularNuevaReservaSSE: () => void;
  onSimularBloqueoPreventivoSSE: () => void;
  onAbrirSobreasignacion: () => void;
  onAlternarPlanStarter: () => void;
  esPlanStarter: boolean;
  onAbrirNuevaReserva: () => void;
  onAbrirFichaDemo: () => void;
}

export const DemoReservasWidget: React.FC<DemoReservasWidgetProps> = ({
  onSimularNuevaReservaSSE,
  onSimularBloqueoPreventivoSSE,
  onAbrirSobreasignacion,
  onAlternarPlanStarter,
  esPlanStarter,
  onAbrirNuevaReserva,
  onAbrirFichaDemo,
}) => {
  const [colapsado, setColapsado] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const dispararConToast = (accion: () => void, texto: string) => {
    accion();
    setMensajeToast(texto);
    setTimeout(() => setMensajeToast(null), 2500);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs select-none">
      {/* Toast informativo */}
      {mensajeToast && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-aurea-champagne text-xs font-medium shadow-lg border border-aurea-copper/40 flex items-center gap-1.5 animate-bounce-slow">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{mensajeToast}</span>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-300 overflow-hidden text-xs">
        {/* Cabecera */}
        <button
          onClick={() => setColapsado(!colapsado)}
          className="w-full p-2.5 bg-aurea-navy text-white flex items-center justify-between hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-aurea-copper animate-spin-slow" />
            <span className="font-bold text-[11px] tracking-wide uppercase">
              Simulador CU-MOZO-05
            </span>
          </div>
          {colapsado ? (
            <ChevronUp className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Acciones del Simulador */}
        {!colapsado && (
          <div className="p-3 space-y-2 bg-slate-50/90">
            <p className="text-[10px] text-slate-500 leading-tight">
              Dispara eventos reactivos SSE y estados frontera de reservas:
            </p>

            <button
              onClick={() =>
                dispararConToast(
                  onSimularNuevaReservaSSE,
                  "Evento SSE 'reserva_creada': Cita recibida en tiempo real"
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-900 border border-sky-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <Bell className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>🔔 Simular Evento SSE Nueva Reserva</span>
            </button>

            <button
              onClick={() =>
                dispararConToast(
                  onSimularBloqueoPreventivoSSE,
                  "Evento SSE 'mesa_bloqueada_reserva': Bloqueo a 30m activado"
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>⏱️ Simular Bloqueo Preventivo (30 min)</span>
            </button>

            <button
              onClick={() =>
                dispararConToast(
                  onAbrirSobreasignacion,
                  'Desplegando alerta de sobreasignación preventiva'
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 border border-rose-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>⚠️ Sobreasignación Preventiva (V4 Izq)</span>
            </button>

            {/* Accesos a Modales Vistas 2 y 3 */}
            <div className="pt-1 border-t border-slate-200 grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  dispararConToast(
                    onAbrirNuevaReserva,
                    'Abriendo Modal de Nueva Reserva con Mini-Mapa'
                  )
                }
                className="py-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-[10px] text-center"
              >
                📅 Mapa 5x2 (V2)
              </button>

              <button
                onClick={() =>
                  dispararConToast(
                    onAbrirFichaDemo,
                    'Abriendo Ficha de Reserva y Reloj de Cortesía'
                  )
                }
                className="py-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-[10px] text-center"
              >
                👤 Ficha Mesa 08 (V3)
              </button>
            </div>

            {/* Alternar Plan Starter (Paywall V4 Der) */}
            <div className="pt-1 border-t border-slate-200">
              <button
                onClick={() =>
                  dispararConToast(
                    onAlternarPlanStarter,
                    esPlanStarter ? 'Restaurado a Plan Pro' : 'Activado Paywall Plan Starter (V4 Der)'
                  )
                }
                className={`w-full py-1.5 px-2.5 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all ${
                  esPlanStarter
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>{esPlanStarter ? 'Desactivar Paywall Starter' : '🔒 Probar Paywall Starter (V4 Der)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
