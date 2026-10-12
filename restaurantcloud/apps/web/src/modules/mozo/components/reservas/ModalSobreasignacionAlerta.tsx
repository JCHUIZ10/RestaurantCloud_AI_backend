import React, { useState } from 'react';
import { X, AlertTriangle, ArrowRightLeft, Zap, ArrowLeft } from 'lucide-react';

interface ModalSobreasignacionAlertaProps {
  abierto: boolean;
  mesaNumero: string;
  clienteReservaNombre: string;
  horaReserva: string;
  minutosRestantes: number;
  mesaAlternativaNumero?: string;
  onCerrar: () => void;
  onReasignarReserva: () => Promise<void>;
  onForzarOcupacionRapida: () => Promise<void>;
}

export const ModalSobreasignacionAlerta: React.FC<ModalSobreasignacionAlertaProps> = ({
  abierto,
  mesaNumero,
  clienteReservaNombre,
  horaReserva,
  minutosRestantes,
  mesaAlternativaNumero = '05',
  onCerrar,
  onReasignarReserva,
  onForzarOcupacionRapida,
}) => {
  const [procesando, setProcesando] = useState(false);

  if (!abierto) return null;

  const handleReasignar = async () => {
    setProcesando(true);
    try {
      await onReasignarReserva();
      onCerrar();
    } finally {
      setProcesando(false);
    }
  };

  const handleForzarRapido = async () => {
    setProcesando(true);
    try {
      await onForzarOcupacionRapida();
      onCerrar();
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-h-[90vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '540px' }}
      >
        {/* Cabecera de Alerta */}
        <div className="px-5 py-4 bg-amber-500 text-slate-950 flex items-center justify-between border-b border-amber-600/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/15 flex items-center justify-center text-slate-950">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950/70">
                Alerta de Sobreasignación Preventiva
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold leading-tight">
                ⚠️ Mesa con Reserva Inminente
              </h2>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-900 hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Explicativo */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <p className="font-semibold text-amber-950 text-sm leading-snug">
              Mesa {mesaNumero} tiene una reserva programada a las <strong>{horaReserva}</strong> (en {minutosRestantes} minutos) para <strong>{clienteReservaNombre}</strong>.
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Ocuparla con comensales casuales ahora podría ocasionar solapamientos de horario y retrasos en la atención.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
              Alternativas Asistidas Recomendadas:
            </span>

            {/* Alternativa 1: Reasignar reserva a otra mesa libre */}
            <button
              type="button"
              onClick={handleReasignar}
              disabled={procesando}
              className="w-full p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-left transition-all group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-200 text-sky-900 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sky-950 text-xs sm:text-sm">
                  [ 🔄 Reasignar Reserva a Mesa {mesaAlternativaNumero} y Continuar ]
                </div>
                <div className="text-[11px] text-sky-800 mt-0.5">
                  Mueve la reserva de {clienteReservaNombre} a la Mesa {mesaAlternativaNumero} (libre con aforo idéntico) y sienta a los comensales actuales en Mesa {mesaNumero}.
                </div>
              </div>
            </button>

            {/* Alternativa 2: Consumo Rápido */}
            <button
              type="button"
              onClick={handleForzarRapido}
              disabled={procesando}
              className="w-full p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-300 text-left transition-all group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-amber-950 text-xs sm:text-sm">
                  [ ⚠️ Ocupar Solo para Consumo Rápido (&lt; {minutosRestantes} min) ]
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Permite atención casual express registrando aviso en comanda para liberar antes de las {horaReserva}.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>[ ✕ Cancelar y Elegir Otra Mesa Libre ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
