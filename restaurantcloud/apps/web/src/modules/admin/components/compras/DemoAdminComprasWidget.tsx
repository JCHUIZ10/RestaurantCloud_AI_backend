import React, { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp, RefreshCw, Trash2, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';

interface DemoAdminComprasWidgetProps {
  onRecargarDatos: () => void;
  onAbrirModalRegistro: () => void;
}

export const DemoAdminComprasWidget: React.FC<DemoAdminComprasWidgetProps> = ({
  onRecargarDatos,
  onAbrirModalRegistro,
}) => {
  const [colapsado, setColapsado] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const notificar = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleVaciarHistorial = () => {
    mockAdminService.simularHistorialComprasVacio();
    onRecargarDatos();
    notificar('Se simuló el estado vacío (0 compras).');
  };

  const handleRestablecerSemillas = () => {
    mockAdminService.restablecerSemillasCompras();
    onRecargarDatos();
    notificar('Semillas restablecidas (24 compras de prueba).');
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full transition-all duration-300 ease-in-out font-sans">
      <div className="bg-white rounded-2xl shadow-xl border border-primary-200 overflow-hidden ring-1 ring-black/5">
        {/* Header Widget */}
        <div
          onClick={() => setColapsado(!colapsado)}
          className="px-4 py-2.5 bg-gradient-to-r from-primary-700 to-primary-900 text-white flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary-300" />
            <span className="text-xs font-bold tracking-wide uppercase">
              QA Test Bench • CU-ADMIN-06
            </span>
          </div>
          <button type="button" className="text-primary-200 hover:text-white">
            {colapsado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Notificación flotante rápida */}
        {mensaje && (
          <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{mensaje}</span>
          </div>
        )}

        {/* Cuerpo Expandido */}
        {!colapsado && (
          <div className="p-3.5 space-y-3 text-xs bg-gray-50/50">
            <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-[11px] space-y-1">
              <div className="font-bold text-gray-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                <span>Casos de Prueba Soportados:</span>
              </div>
              <p>• <strong>Facturas SUNAT:</strong> Desglose automático de IGV 18% (Base = Total / 1.18).</p>
              <p>• <strong>Notas de Venta:</strong> N° opcional con autogeneración (NV-YYYYMMDD-####).</p>
              <p>• <strong>Platos Reactivables:</strong> Detección automática al reponer recetas en quiebre.</p>
              <p>• <strong>Anulación con Contingencia:</strong> Evaluación de impacto y piso GREATEST(0, stock-cant).</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onAbrirModalRegistro}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Compra</span>
              </button>

              <button
                type="button"
                onClick={handleVaciarHistorial}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Compras</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRestablecerSemillas}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs border border-gray-300 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              <span>Restablecer Semillas (24 Compras)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
