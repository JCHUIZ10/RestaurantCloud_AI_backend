import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Layers, AlertTriangle, ChevronUp, ChevronDown, Check, Lock } from 'lucide-react';

interface DemoComandaWidgetProps {
  onCargarPedidoDemo: () => void;
  onAlternarRondaAdicional: () => void;
  esRondaAdicional: boolean;
  onActivarConflicto409: () => void;
  conflictoActivo: boolean;
  onAlternarAgotadoTiradito: () => void;
}

export const DemoComandaWidget: React.FC<DemoComandaWidgetProps> = ({
  onCargarPedidoDemo,
  onAlternarRondaAdicional,
  esRondaAdicional,
  onActivarConflicto409,
  conflictoActivo,
  onAlternarAgotadoTiradito,
}) => {
  const [colapsado, setColapsado] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const disparar = (accion: () => void, texto: string) => {
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
            <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
            <span className="font-bold text-[11px] tracking-wide uppercase">
              Simulador Comanda (CU-MOZO-02)
            </span>
          </div>
          {colapsado ? (
            <ChevronUp className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Acciones */}
        {!colapsado && (
          <div className="p-3 space-y-2 bg-slate-50/90">
            <p className="text-[10px] text-slate-500 leading-tight">
              Prueba los escenarios operativos de toma de pedido y comanda táctil:
            </p>

            {/* Cargar combo demo */}
            <button
              onClick={() =>
                disparar(
                  onCargarPedidoDemo,
                  'Cargados: 2x Lomo + 1x Causa + 1x Inca Kola'
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 border border-emerald-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>🛒 Cargar Pedido Demo Rápido</span>
            </button>

            {/* Alternar a Ronda Adicional #02 */}
            <button
              onClick={() =>
                disparar(
                  onAlternarRondaAdicional,
                  esRondaAdicional
                    ? 'Restaurado a Ronda #01 (Pedido inicial)'
                    : 'Activada Vista 3: Ronda Adicional #02'
                )
              }
              className={`w-full py-1.5 px-2.5 rounded-lg border font-semibold flex items-center gap-2 transition-all text-left ${
                esRondaAdicional
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border-amber-400/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {esRondaAdicional ? '✓ Vista Ronda #02 Activa' : '🔄 Simular Ronda #02 (Vista 3)'}
              </span>
            </button>

            {/* Simular Conflicto de Stock 409 */}
            <button
              onClick={() =>
                disparar(
                  onActivarConflicto409,
                  conflictoActivo
                    ? 'Conflicto 409 Desactivado'
                    : 'Conflicto 409 Activado para el próximo envío'
                )
              }
              className={`w-full py-1.5 px-2.5 rounded-lg border font-semibold flex items-center gap-2 transition-all text-left ${
                conflictoActivo
                  ? 'bg-rose-500 text-white border-rose-600 font-bold'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 border-rose-400/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>
                {conflictoActivo
                  ? '⚠️ Conflicto 409 Activo (Al enviar)'
                  : '⚠️ Simular Conflicto 409 (Vista 4)'}
              </span>
            </button>

            {/* Alternar Tiradito Agotado */}
            <button
              onClick={() =>
                disparar(
                  onAlternarAgotadoTiradito,
                  'Disponibilidad de Tiradito conmutada'
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium flex items-center gap-2 transition-all text-left"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>🔒 Alternar Tiradito (Agotado/Disp)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
