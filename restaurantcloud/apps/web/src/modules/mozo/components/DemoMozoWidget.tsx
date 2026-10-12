import React, { useState } from 'react';
import { Sparkles, Bell, PackageCheck, AlertTriangle, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface DemoMozoWidgetProps {
  onSimularPlatoListo: () => void;
  onSimularBebida: () => void;
  onSimularAlertaModal: () => void;
  onAlternarTurnoVacio: () => void;
  esTurnoVacio: boolean;
  onAlternarMisMesas: () => void;
  filtroActivo: string;
}

export const DemoMozoWidget: React.FC<DemoMozoWidgetProps> = ({
  onSimularPlatoListo,
  onSimularBebida,
  onSimularAlertaModal,
  onAlternarTurnoVacio,
  esTurnoVacio,
  onAlternarMisMesas,
  filtroActivo,
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
        {/* Cabecera del Widget */}
        <button
          onClick={() => setColapsado(!colapsado)}
          className="w-full p-2.5 bg-aurea-navy text-white flex items-center justify-between hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-aurea-copper animate-spin-slow" />
            <span className="font-bold text-[11px] tracking-wide uppercase">
              Simulador Salón Mozo
            </span>
          </div>
          {colapsado ? (
            <ChevronUp className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Acciones de Simulación */}
        {!colapsado && (
          <div className="p-3 space-y-2 bg-slate-50/90">
            <p className="text-[10px] text-slate-500 leading-tight">
              Dispara eventos reactivos SSE y estados para comprobar la experiencia del mozo:
            </p>

            <button
              onClick={() =>
                dispararConToast(
                  onSimularPlatoListo,
                  'Plato listo añadido al pase de cocina y sidebar'
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>🔔 Simular Plato Listo en Cocina</span>
            </button>

            <button
              onClick={() =>
                dispararConToast(
                  onSimularBebida,
                  'Producto añadido a despacho directo (Entrega directa)'
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-900 border border-sky-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <PackageCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>⚡ Simular Entrega Directa (Gelatina / Bebida)</span>
            </button>

            <button
              onClick={() =>
                dispararConToast(
                  onSimularAlertaModal,
                  'Modal de alerta prioritaria desplegado'
                )
              }
              className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 border border-rose-400/50 font-semibold flex items-center gap-2 transition-all text-left"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>⚠️ Simular Alerta de Cocina (Vista 3)</span>
            </button>

            <div className="pt-1 border-t border-slate-200 grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  dispararConToast(
                    onAlternarTurnoVacio,
                    esTurnoVacio ? 'Salón restaurado a operativo' : 'Vista 4: Turno 100% libre activada'
                  )
                }
                className="py-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px] text-center"
              >
                {esTurnoVacio ? 'Restaurar Salón' : 'Turno Vacío (V4)'}
              </button>

              <button
                onClick={onAlternarMisMesas}
                className="py-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px] text-center"
              >
                {filtroActivo === 'mis_mesas' ? 'Ver Todo Salón' : 'Mis Mesas'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
