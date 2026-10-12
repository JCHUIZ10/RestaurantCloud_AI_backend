import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Sparkles,
  Loader2,
  Send,
} from 'lucide-react';
import {
  CatalogoSustitucionResponseDTO,
  PlatoSustitutoSugeridoDTO,
} from '@/types/mozo';
import { mockMozoService } from '../../services/mockMozoService';

interface ModalSustitucionCartaProps {
  abierto: boolean;
  mesaId: string;
  mesaNumero: string;
  itemId: string;
  onVolverAOpciones: () => void;
  onCerrar: () => void;
  onConfirmarSustitucion: (nuevoProductoId: string, notasCocina: string) => Promise<void>;
  onIrAnulacion: () => void;
}

export const ModalSustitucionCarta: React.FC<ModalSustitucionCartaProps> = ({
  abierto,
  mesaId,
  mesaNumero,
  itemId,
  onVolverAOpciones,
  onCerrar,
  onConfirmarSustitucion,
  onIrAnulacion,
}) => {
  const [cargando, setCargando] = useState(false);
  const [catalogo, setCatalogo] = useState<CatalogoSustitucionResponseDTO | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState<string>('');
  const [platoSeleccionado, setPlatoSeleccionado] = useState<PlatoSustitutoSugeridoDTO | null>(null);
  const [notasCocina, setNotasCocina] = useState<string>('');
  const [procesandoEnvio, setProcesandoEnvio] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Cargar catálogo y sugerencias
  useEffect(() => {
    if (!abierto) {
      setPlatoSeleccionado(null);
      setNotasCocina('');
      setBusqueda('');
      setCategoriaSeleccionada('todas');
      setErrorEnvio(null);
      return;
    }

    const cargarDatos = async () => {
      try {
        setCargando(true);
        const res = await mockMozoService.obtenerCatalogoSustitucion(
          mesaId,
          itemId,
          categoriaSeleccionada,
          busqueda
        );
        if (res.exito) {
          setCatalogo(res.datos);
        }
      } catch (err) {
        console.error('Error al cargar catálogo de sustitución:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [abierto, mesaId, itemId, categoriaSeleccionada, busqueda]);

  if (!abierto) return null;

  const precioOriginal = catalogo?.precio_original ?? 38.0;
  const platoOriginal = catalogo?.plato_original ?? 'Lomo Saltado Criollo';

  const diferenciaSeleccionada = platoSeleccionado
    ? Math.round((platoSeleccionado.precio - precioOriginal) * 100) / 100
    : 0;

  const handleConfirmar = async () => {
    if (!platoSeleccionado) return;
    try {
      setProcesandoEnvio(true);
      setErrorEnvio(null);
      await onConfirmarSustitucion(platoSeleccionado.producto_id, notasCocina);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al confirmar sustitución.';
      setErrorEnvio(msg);
      setProcesandoEnvio(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sustitucion-titulo"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-champagne-500/30 bg-slate-900 shadow-2xl shadow-black/60 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onVolverAOpciones}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Opciones</span>
            </button>
            <div>
              <h2 id="modal-sustitucion-titulo" className="text-base sm:text-lg font-bold text-slate-100 font-serif">
                Sustituir Plato en Mesa {mesaNumero}
              </h2>
              <p className="text-xs text-slate-400">
                Observado: <span className="text-amber-300 font-medium">{platoOriginal}</span> (S/ {precioOriginal.toFixed(2)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Buscador & Categorías */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-3">
          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, salsa o ingrediente en toda la carta..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chips de categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              Toda la Carta
            </button>
            {catalogo?.categorias.map((cat) => (
              <button
                key={cat.categoria_id}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat.categoria_id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  categoriaSeleccionada === cat.categoria_id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                }`}
              >
                {cat.nombre} ({cat.total_platos})
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Platos */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 min-h-[220px]">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              <p className="text-xs">Cargando opciones de sustitución...</p>
            </div>
          ) : (
            <>
              {/* Sugerencias Recomendadas Directas (Top 6 por precio y categoría) */}
              {!busqueda && categoriaSeleccionada === 'todas' && catalogo?.sugerencias_top && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" /> 6 Sugerencias Inteligentes (Afinidad & Precio)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Cercanía a S/ {precioOriginal.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {catalogo.sugerencias_top.map((sug) => {
                      const esSeleccionado = platoSeleccionado?.producto_id === sug.producto_id;
                      return (
                        <div
                          key={`sug-${sug.producto_id}`}
                          onClick={() => setPlatoSeleccionado(sug)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all relative ${
                            esSeleccionado
                              ? 'border-amber-400 bg-amber-950/30 shadow-md shadow-amber-950/50 ring-1 ring-amber-400'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-100 line-clamp-1">
                              {sug.nombre}
                            </span>
                            {esSeleccionado && (
                              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mb-2">
                            {sug.categoria_nombre}
                          </span>

                          <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-800/60">
                            <span className="text-xs font-mono font-bold text-slate-200">
                              S/ {sug.precio.toFixed(2)}
                            </span>
                            {/* Badge de diferencial */}
                            {sug.diferencia === 0 ? (
                              <span className="text-[10px] font-semibold text-champagne-300 bg-champagne-950/60 px-1.5 py-0.5 rounded border border-champagne-600/30">
                                S/ 0.00
                              </span>
                            ) : sug.diferencia > 0 ? (
                              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/30">
                                +S/ {sug.diferencia.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-600/30">
                                -S/ {Math.abs(sug.diferencia).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista completa filtrada */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {busqueda
                      ? `Resultados para "${busqueda}" (${catalogo?.productos.length || 0})`
                      : categoriaSeleccionada !== 'todas'
                      ? `Platos de Categoría (${catalogo?.productos.length || 0})`
                      : 'Todos los Platos de la Carta'}
                  </span>
                </div>

                {catalogo?.productos.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron platos que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {catalogo?.productos.map((prod) => {
                      const esSeleccionado = platoSeleccionado?.producto_id === prod.producto_id;
                      return (
                        <div
                          key={`prod-${prod.producto_id}`}
                          onClick={() => setPlatoSeleccionado(prod)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all relative ${
                            esSeleccionado
                              ? 'border-amber-400 bg-amber-950/30 shadow-md shadow-amber-950/50 ring-1 ring-amber-400'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-slate-100 line-clamp-1">
                              {prod.nombre}
                            </span>
                            {esSeleccionado && (
                              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mb-2">
                            {prod.categoria_nombre}
                          </span>

                          <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-800/60">
                            <span className="text-xs font-mono font-bold text-slate-200">
                              S/ {prod.precio.toFixed(2)}
                            </span>
                            {/* Badge de diferencial */}
                            {prod.diferencia === 0 ? (
                              <span className="text-[10px] font-semibold text-champagne-300 bg-champagne-950/60 px-1.5 py-0.5 rounded border border-champagne-600/30">
                                S/ 0.00
                              </span>
                            ) : prod.diferencia > 0 ? (
                              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/30">
                                +S/ {prod.diferencia.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-600/30">
                                -S/ {Math.abs(prod.diferencia).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Especificaciones y notas de preparación para cocina */}
              {platoSeleccionado && (
                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3.5 space-y-2 animate-in fade-in duration-200">
                  <label htmlFor="notas-cocina-sustituto" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
                    Notas especiales para Cocina (opcional):
                  </label>
                  <input
                    id="notas-cocina-sustituto"
                    type="text"
                    placeholder="Ej: Término 3/4, puré bien caliente, prioridad inmediata..."
                    value={notasCocina}
                    onChange={(e) => setNotasCocina(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </>
          )}

          {errorEnvio && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 flex items-center gap-2 text-red-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorEnvio}</span>
            </div>
          )}
        </div>

        {/* Sticky Box Inferior de Impacto y Acciones */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">
                  {platoSeleccionado ? 'Plato sustituto elegido:' : 'Seleccione un plato de la lista'}
                </p>
                <p className="text-sm font-bold text-slate-100">
                  {platoSeleccionado ? platoSeleccionado.nombre : 'Ninguno seleccionado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center">
              <div>
                <span className="text-slate-400 block text-[10px]">DIFERENCIA:</span>
                <span
                  className={`font-bold ${
                    diferenciaSeleccionada === 0
                      ? 'text-slate-200'
                      : diferenciaSeleccionada > 0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {diferenciaSeleccionada === 0
                    ? 'S/ 0.00'
                    : diferenciaSeleccionada > 0
                    ? `+S/ ${diferenciaSeleccionada.toFixed(2)}`
                    : `-S/ ${Math.abs(diferenciaSeleccionada).toFixed(2)}`}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-400 block text-[10px]">TOTAL PLATO:</span>
                <span className="font-bold text-amber-300">
                  S/ {(platoSeleccionado?.precio ?? precioOriginal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onIrAnulacion}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 hover:border-red-500/50 bg-slate-900/60 hover:bg-red-950/20 text-slate-300 hover:text-red-300 text-xs font-semibold transition-all"
            >
              ✕ Cliente Desiste: Anular Plato
            </button>

            <button
              type="button"
              disabled={!platoSeleccionado || procesandoEnvio}
              onClick={handleConfirmar}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-lg transition-all ${
                !platoSeleccionado || procesandoEnvio
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-95 shadow-amber-950/40'
              }`}
            >
              {procesandoEnvio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando a Cocina...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Confirmar Sustitución y Enviar a Cocina</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
