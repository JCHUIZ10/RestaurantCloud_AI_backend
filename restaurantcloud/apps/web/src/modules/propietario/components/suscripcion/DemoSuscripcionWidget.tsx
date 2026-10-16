import React, { useState } from 'react';
import { EstadoSuscripcion, EstadoCobroDunningDTO, MetodoPagoDTO } from '@/types/propietarioSuscripcion';
import { propietarioSuscripcionService } from '../../services/propietarioSuscripcionService';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface DemoSuscripcionWidgetProps {
  estadoSuscripcion: EstadoSuscripcion;
  estadoCobro: EstadoCobroDunningDTO | null;
  metodoPago: MetodoPagoDTO | null;
  onActualizar: () => void;
}

export const DemoSuscripcionWidget: React.FC<DemoSuscripcionWidgetProps> = ({
  estadoSuscripcion,
  estadoCobro,
  metodoPago,
  onActualizar,
}) => {
  const [expandido, setExpandido] = useState(false);

  const handleSimularFallo = () => {
    propietarioSuscripcionService.simularCobroFallido();
    onActualizar();
  };

  const handleSimularPorVencer = () => {
    propietarioSuscripcionService.simularTarjetaPorVencer();
    onActualizar();
  };

  const handleSimularSuspension = () => {
    propietarioSuscripcionService.simularSuspension();
    onActualizar();
  };

  const handleReset = () => {
    propietarioSuscripcionService.resetDatabase();
    onActualizar();
  };

  return (
    <aside
      aria-label="Panel de Pruebas QA de Suscripción"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-slate-900/95 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md overflow-hidden transition-all text-xs"
    >
      {/* Barra superior de palanca */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-aurea-champagne" />
          <span className="font-bold tracking-wide font-mono text-[11px] text-aurea-champagne uppercase">
            Sandbox QA: Facturación & Dunning
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
            {estadoSuscripcion.toUpperCase()}
          </span>
          {expandido ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Contenido desplegable */}
      {expandido && (
        <div className="p-4 pt-1 border-t border-slate-800 space-y-3 font-sans">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Herramientas para probar escenarios de pasarela de pago Stripe sin backend real.
          </p>

          {/* Diagnóstico rápido */}
          <div className="p-2.5 rounded-lg bg-slate-800/70 text-[11px] space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Estado Suscripción:</span>
              <span className="font-bold text-amber-400">{estadoSuscripcion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Periodo Gracia:</span>
              <span>{estadoCobro?.en_periodo_gracia ? 'SÍ (5 días)' : 'NO'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monto Pendiente:</span>
              <span>S/ {estadoCobro?.monto_pendiente?.toFixed(2) ?? '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tarjeta Próx. Vencer:</span>
              <span>{metodoPago?.proximo_a_vencer ? 'SÍ' : 'NO'}</span>
            </div>
          </div>

          {/* Botones de simulación */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleSimularFallo}
              className="w-full py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium flex items-center justify-between text-[11px] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Simular Cobro Fallido (Dunning)
              </span>
              <span className="text-[10px] opacity-75">5 días gracia</span>
            </button>

            <button
              type="button"
              onClick={handleSimularPorVencer}
              className="w-full py-1.5 px-3 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 font-medium flex items-center justify-between text-[11px] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Simular Tarjeta por Vencer
              </span>
              <span className="text-[10px] opacity-75">&lt; 30 días</span>
            </button>

            <button
              type="button"
              onClick={handleSimularSuspension}
              className="w-full py-1.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-medium flex items-center justify-between text-[11px] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Simular Suspensión de Cuenta
              </span>
              <span className="text-[10px] opacity-75">Corte acceso</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center justify-center gap-1.5 text-[11px] transition-colors mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-aurea-champagne" />
              <span>Restablecer Plan Pro Normal</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
