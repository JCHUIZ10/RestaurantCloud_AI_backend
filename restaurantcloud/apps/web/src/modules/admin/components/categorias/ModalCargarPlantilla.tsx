import React, { useState } from 'react';
import { BookOpen, X, Check, Loader2, Sparkles, Layers } from 'lucide-react';
import { PLANTILLAS_GASTRONOMICAS } from '@/modules/admin/services/mockAdminService';
import { TipoPlantillaGastronomica } from '@/types/admin';

interface ModalCargarPlantillaProps {
  abierto: boolean;
  onCerrar: () => void;
  onCargarPlantilla: (
    tipoPlantilla: TipoPlantillaGastronomica,
    reemplazarExistentes: boolean
  ) => Promise<boolean>;
}

export const ModalCargarPlantilla: React.FC<ModalCargarPlantillaProps> = ({
  abierto,
  onCerrar,
  onCargarPlantilla,
}) => {
  const [plantillaSeleccionada, setPlantillaSeleccionada] =
    useState<TipoPlantillaGastronomica>('criollo');
  const [reemplazarExistentes, setReemplazarExistentes] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  if (!abierto) return null;

  const plantillaActual = PLANTILLAS_GASTRONOMICAS[plantillaSeleccionada];

  const handleAplicar = async () => {
    setCargando(true);
    setErrorLocal(null);

    try {
      const exitoso = await onCargarPlantilla(plantillaSeleccionada, reemplazarExistentes);
      if (exitoso) {
        onCerrar();
      }
    } catch (err: any) {
      setErrorLocal(err?.message || 'Error al aplicar la plantilla.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-aurea-champagne/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-aurea-champagne/40 flex items-center justify-between bg-aurea-ivory/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-champagne/30 text-aurea-navy flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-aurea-copper">
                Configuración Asistida
              </span>
              <h2 className="text-xl font-serif font-bold text-aurea-navy">
                Plantillas Gastronómicas Rápidas
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="p-2 rounded-xl text-aurea-navy/60 hover:text-aurea-navy hover:bg-aurea-champagne/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorLocal && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorLocal}
            </div>
          )}

          <p className="text-sm text-aurea-navy/70 leading-relaxed">
            Selecciona una plantilla gastronómica peruana para estructurar rápidamente tu carta con las secciones y orden estándar de la industria.
          </p>

          {/* Selector de Tipo de Plantilla */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-aurea-navy uppercase tracking-wider block">
              Tipo de Negocio Gastronómico:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                Object.keys(PLANTILLAS_GASTRONOMICAS) as TipoPlantillaGastronomica[]
              ).map((tipo) => {
                const item = PLANTILLAS_GASTRONOMICAS[tipo];
                const isSelected = plantillaSeleccionada === tipo;

                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setPlantillaSeleccionada(tipo)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      isSelected
                        ? 'border-aurea-navy bg-aurea-navy text-white shadow-md'
                        : 'border-aurea-champagne/50 bg-white hover:bg-aurea-champagne/10 text-aurea-navy'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm">{item.titulo}</span>
                      {isSelected && <Check className="w-4 h-4 text-aurea-champagne" />}
                    </div>
                    <span
                      className={`text-xs mt-1 line-clamp-1 ${
                        isSelected ? 'text-white/70' : 'text-aurea-navy/60'
                      }`}
                    >
                      {item.descripcion}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vista previa de las categorías que incluye */}
          {plantillaActual && (
            <div className="p-4 rounded-xl bg-aurea-ivory/40 border border-aurea-champagne/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-aurea-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
                  Secciones que se crearán ({plantillaActual.categorias.length}):
                </span>
                <span className="text-[11px] text-aurea-navy/60 font-mono">Secuencia 1..N</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {plantillaActual.categorias.map((cat, idx) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-aurea-navy border border-aurea-champagne/60 shadow-2xs"
                  >
                    <span className="text-[10px] text-aurea-copper font-mono font-bold">
                      #{idx + 1}
                    </span>
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Opción de Reemplazo */}
          <div className="p-4 rounded-xl border border-aurea-champagne/40 bg-white space-y-2">
            <span className="text-xs font-semibold text-aurea-navy uppercase tracking-wider block">
              Modo de Inserción:
            </span>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-aurea-navy">
                <input
                  type="radio"
                  name="modo_insercion"
                  checked={!reemplazarExistentes}
                  onChange={() => setReemplazarExistentes(false)}
                  className="mt-0.5 text-aurea-navy focus:ring-aurea-copper"
                />
                <div>
                  <strong className="block">Anexar a las existentes (Recomendado)</strong>
                  <span className="text-aurea-navy/60">
                    Solo agrega las categorías de la plantilla que aún no tengas en el local sin afectar tus platos.
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-aurea-navy">
                <input
                  type="radio"
                  name="modo_insercion"
                  checked={reemplazarExistentes}
                  onChange={() => setReemplazarExistentes(true)}
                  className="mt-0.5 text-aurea-navy focus:ring-aurea-copper"
                />
                <div>
                  <strong className="block text-amber-700">Reemplazar todas las categorías</strong>
                  <span className="text-aurea-navy/60">
                    Elimina la estructura previa y aplica exactamente el orden de la plantilla (los platos existentes se reasignan a la primera sección).
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 border-t border-aurea-champagne/40 bg-aurea-ivory/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="px-4 py-2.5 rounded-xl border border-aurea-copper/40 bg-white hover:bg-aurea-champagne/20 text-aurea-navy text-sm font-semibold transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAplicar}
            disabled={cargando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-navy hover:bg-aurea-navy/90 text-white text-sm font-semibold transition-all shadow-md min-h-[44px]"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-aurea-champagne" />
                <span>Aplicando Plantilla...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-aurea-champagne" />
                <span>Aplicar Plantilla</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
