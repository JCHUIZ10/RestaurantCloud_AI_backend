import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Copy,
  FolderMinus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface DemoAdminProveedoresWidgetProps {
  onSimularDirectorioVacio: () => void;
  onProbarDuplicidad: () => void;
  onProbarBloqueoEliminacion: () => void;
  onRestablecerSemillas: () => void;
}

export const DemoAdminProveedoresWidget: React.FC<DemoAdminProveedoresWidgetProps> = ({
  onSimularDirectorioVacio,
  onProbarDuplicidad,
  onProbarBloqueoEliminacion,
  onRestablecerSemillas,
}) => {
  const [colapsado, setColapsado] = useState(true);

  return (
    <aside
      aria-label="Herramientas QA de proveedores"
      className="fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-aurea-copper/30 rounded-2xl shadow-xl overflow-hidden max-w-xs transition-all text-xs"
    >
      {/* Barra de título clickeable para colapsar/expandir */}
      <button
        type="button"
        onClick={() => setColapsado(!colapsado)}
        className="w-full px-3.5 py-2.5 bg-aurea-navy text-white flex items-center justify-between gap-2 font-semibold"
      >
        <span className="flex items-center gap-1.5 text-aurea-champagne">
          <Sparkles className="w-4 h-4" />
          <span>Laboratorio QA · Proveedores</span>
        </span>
        {colapsado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {!colapsado && (
        <div className="p-3.5 space-y-2 bg-white">
          <p className="text-[11px] text-aurea-navy/70 leading-relaxed">
            Escenarios de prueba para validar reglas de negocio, integridad contable y experiencia operativa:
          </p>

          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={onSimularDirectorioVacio}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border border-aurea-copper/20 hover:bg-aurea-champagne/20 text-aurea-navy font-medium text-left transition-colors"
            >
              <FolderMinus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Simular Directorio Vacío</span>
            </button>

            <button
              type="button"
              onClick={onProbarDuplicidad}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border border-aurea-copper/20 hover:bg-aurea-champagne/20 text-aurea-navy font-medium text-left transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Probar Duplicidad (San Fernando)</span>
            </button>

            <button
              type="button"
              onClick={onProbarBloqueoEliminacion}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-left transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Probar Bloqueo ON DELETE RESTRICT</span>
            </button>

            <button
              type="button"
              onClick={onRestablecerSemillas}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-aurea-navy/5 hover:bg-aurea-navy/10 text-aurea-navy font-semibold text-left transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-aurea-copper shrink-0" />
              <span>Restablecer Semillas Canónicas</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
