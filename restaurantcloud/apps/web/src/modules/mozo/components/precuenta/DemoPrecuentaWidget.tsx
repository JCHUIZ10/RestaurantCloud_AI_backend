import React, { useState } from 'react';
import { Settings, RefreshCw, AlertTriangle, ShieldCheck, Tag, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoPrecuentaWidgetProps {
  onTogglePromo: (activar: boolean) => void;
  tienePromo: boolean;
  onToggleAlertaCocina: () => void;
  tieneAlertaCocina: boolean;
  onResetMesaOcupada: () => void;
  onForzarCuentaPedida: () => void;
  esCuentaPedida: boolean;
}

export const DemoPrecuentaWidget: React.FC<DemoPrecuentaWidgetProps> = ({
  onTogglePromo,
  tienePromo,
  onToggleAlertaCocina,
  tieneAlertaCocina,
  onResetMesaOcupada,
  onForzarCuentaPedida,
  esCuentaPedida,
}) => {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Botón flotante para abrir el panel */}
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="flex items-center space-x-2 px-3.5 py-2.5 rounded-full bg-[#0B2340] border border-[#D5A06F] text-[#F4D7B0] shadow-2xl hover:bg-[#123156] transition-all hover:scale-105"
        >
          <Settings className="w-4 h-4 text-[#D5A06F] animate-spin-slow" />
          <span className="text-xs font-bold tracking-wide">Demo CU-MOZO-08</span>
        </button>
      ) : (
        <div className="bg-[#0B2340] border border-[#D5A06F] rounded-2xl p-4 shadow-2xl max-w-xs w-80 text-white animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#D5A06F]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4D7B0]">
                Escenarios CU-MOZO-08
              </h4>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/5"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* Toggle Promoción 15% */}
            <button
              onClick={() => onTogglePromo(!tienePromo)}
              className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Tag className="w-3.5 h-3.5 text-[#D5A06F]" />
                <span>Promo 15% Ejecutivo</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                tienePromo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {tienePromo ? 'ACTIVA' : 'OFF'}
              </span>
            </button>

            {/* Toggle Alerta Cocina */}
            <button
              onClick={onToggleAlertaCocina}
              className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Aviso Cocina Pendiente</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                tieneAlertaCocina ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {tieneAlertaCocina ? 'VISIBLE' : 'OCULTA'}
              </span>
            </button>

            {/* Estado Mesa: Cuenta Pedida vs Ocupada */}
            <button
              onClick={esCuentaPedida ? onResetMesaOcupada : onForzarCuentaPedida}
              className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Estado de Mesa en Salón</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                esCuentaPedida ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {esCuentaPedida ? 'ÁMBAR (PEDIDA)' : 'OCUPADA'}
              </span>
            </button>

            {/* Enlace para validar en Salón */}
            <button
              onClick={() => navigate('/mozo/mesas')}
              className="w-full mt-2 p-2 rounded-lg bg-[#D5A06F]/20 hover:bg-[#D5A06F]/30 text-[#F4D7B0] border border-[#D5A06F]/40 flex items-center justify-center space-x-2 transition-colors font-medium"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Ver Mesa en Plano de Salón</span>
            </button>

            {/* Reset total */}
            <button
              onClick={() => {
                onResetMesaOcupada();
                onTogglePromo(true);
              }}
              className="w-full text-center text-[11px] text-slate-400 hover:text-white pt-1 flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer valores iniciales</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
