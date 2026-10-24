import React, { useState } from 'react';
import { X, Sparkles, Check, Loader2, Utensils } from 'lucide-react';
import { PlatoReactivableDTO } from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';

interface ModalReactivacionPlatosProps {
  platos: PlatoReactivableDTO[];
  abierto: boolean;
  onCerrar: () => void;
  onReactivados: (cantidad: number) => void;
}

export const ModalReactivacionPlatos: React.FC<ModalReactivacionPlatosProps> = ({
  platos,
  abierto,
  onCerrar,
  onReactivados,
}) => {
  const [seleccionados, setSeleccionados] = useState<string[]>(() =>
    platos.map((p) => p.id)
  );
  const [procesando, setProcesando] = useState(false);

  if (!abierto || platos.length === 0) return null;

  const togglePlato = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleReactivar = async () => {
    if (seleccionados.length === 0) {
      onCerrar();
      return;
    }

    try {
      setProcesando(true);
      const res = await adminService.reactivarPlatosCompra(seleccionados);
      if (res.exito && res.datos) {
        onReactivados(res.datos.actualizados);
        onCerrar();
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-base">
                ¡Reposición de Carta Disponible!
              </h3>
              <p className="text-xs text-emerald-700">
                Esta compra ha devuelto el stock requerido para preparar platos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-gray-600">
            Los siguientes platos estaban marcados como <strong>Agotados</strong> por quiebre de stock y ahora cuentan con todos los insumos de su receta:
          </p>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-60 overflow-y-auto bg-gray-50/50">
            {platos.map((plato) => {
              const estaSeleccionado = seleccionados.includes(plato.id);
              return (
                <label
                  key={plato.id}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={estaSeleccionado}
                      onChange={() => togglePlato(plato.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-gray-400" />
                        <span>{plato.nombre}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {plato.categoria_nombre} • Insumos repuestos: {plato.insumos_reposicionados.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-gray-800 text-xs">
                    S/ {plato.precio.toFixed(2)}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={procesando}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-xs font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Omitir (mantener apagados)
            </button>
            <button
              type="button"
              onClick={handleReactivar}
              disabled={procesando || seleccionados.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reactivando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Reactivar ({seleccionados.length}) en Carta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
