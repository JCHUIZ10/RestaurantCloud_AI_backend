import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Boxes,
  Plus,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  ProductoAdminDTO,
  InsumoAdminDTO,
  ActualizarRecetaRequest,
  ModoCalculoReceta,
  SimulacionCapacidadDTO,
} from '@/types/admin';

interface DrawerCalibrarRecetaProps {
  abierto: boolean;
  producto: ProductoAdminDTO | null;
  insumosDisponibles: InsumoAdminDTO[];
  simulacion?: SimulacionCapacidadDTO | null;
  onCerrar: () => void;
  onGuardarReceta: (productoId: string, req: ActualizarRecetaRequest) => Promise<boolean>;
}

interface ItemRecetaEditable {
  insumo_id: string;
  modo_calculo: ModoCalculoReceta;
  rendimiento_platos: number;
  cantidad_descuenta: number;
}

export const DrawerCalibrarReceta: React.FC<DrawerCalibrarRecetaProps> = ({
  abierto,
  producto,
  insumosDisponibles,
  onCerrar,
  onGuardarReceta,
}) => {
  const [items, setItems] = useState<ItemRecetaEditable[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    if (abierto && producto) {
      setMensajeExito(null);
      const mapeados: ItemRecetaEditable[] = producto.receta.map((r) => ({
        insumo_id: r.insumo_id,
        modo_calculo: r.modo_calculo,
        rendimiento_platos: r.rendimiento_platos || 100,
        cantidad_descuenta: r.cantidad_descuenta,
      }));
      setItems(mapeados);
    }
  }, [abierto, producto]);

  if (!abierto || !producto) return null;

  // Cálculo en vivo
  const nuevoCostoTeorico = items.reduce((acc, it) => {
    const ins = insumosDisponibles.find((i) => i.id === it.insumo_id);
    if (!ins) return acc;
    let dosis = it.cantidad_descuenta;
    if (it.modo_calculo === 'rendimiento' && it.rendimiento_platos > 0) {
      dosis = 1 / it.rendimiento_platos;
    }
    return acc + dosis * ins.costo_unitario;
  }, 0);

  const nuevoMargenPct =
    producto.precio > 0
      ? Number((((producto.precio - nuevoCostoTeorico) / producto.precio) * 100).toFixed(1))
      : 0;

  // Simulador de capacidad reactivo
  let minRaciones = Infinity;
  let cuelloBotellaNombre = '';
  const detallesCapacidad = items.map((it) => {
    const ins = insumosDisponibles.find((i) => i.id === it.insumo_id);
    const stock = ins ? ins.stock_actual : 0;
    const nombre = ins ? ins.nombre : 'Insumo';
    const unidad = ins ? ins.unidad_medida : 'und';

    let dosis = it.cantidad_descuenta;
    if (it.modo_calculo === 'rendimiento' && it.rendimiento_platos > 0) {
      dosis = 1 / it.rendimiento_platos;
    }
    const raciones = dosis > 0 ? Math.floor(stock / dosis) : 0;

    if (raciones < minRaciones) {
      minRaciones = raciones;
      cuelloBotellaNombre = nombre;
    }

    return {
      insumo_id: it.insumo_id,
      nombre,
      stock,
      unidad,
      dosis,
      raciones,
    };
  });

  if (minRaciones === Infinity) minRaciones = 0;

  const handleAgregarInsumo = () => {
    if (insumosDisponibles.length === 0) return;
    const yaUsados = new Set(items.map((i) => i.insumo_id));
    const libre = insumosDisponibles.find((i) => !yaUsados.has(i.id)) || insumosDisponibles[0];
    setItems([
      ...items,
      {
        insumo_id: libre.id,
        modo_calculo: 'exacto',
        rendimiento_platos: 100,
        cantidad_descuenta: 0.1,
      },
    ]);
  };

  const handleEliminarInsumo = (index: number) => {
    const copia = [...items];
    copia.splice(index, 1);
    setItems(copia);
  };

  const handleModificar = (index: number, campo: keyof ItemRecetaEditable, valor: any) => {
    const copia = [...items];
    copia[index] = { ...copia[index], [campo]: valor };
    setItems(copia);
  };

  const handleGuardar = async () => {
    if (items.length === 0) return;

    const payload: ActualizarRecetaRequest = {
      receta: items.map((r) => {
        let dosis = r.cantidad_descuenta;
        if (r.modo_calculo === 'rendimiento') {
          dosis = Number((1 / r.rendimiento_platos).toFixed(5));
        }
        return {
          insumo_id: r.insumo_id,
          modo_calculo: r.modo_calculo,
          rendimiento_platos: r.modo_calculo === 'rendimiento' ? r.rendimiento_platos : undefined,
          cantidad_descuenta: dosis,
        };
      }),
    };

    setGuardando(true);
    try {
      const exito = await onGuardarReceta(producto.id, payload);
      if (exito) {
        setMensajeExito('Receta calibrada correctamente.');
        setTimeout(() => setMensajeExito(null), 3000);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-aurea-champagne/40 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-aurea-champagne/40 flex items-center justify-between bg-aurea-champagne/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-aurea-navy">
                Calibración de Receta
              </h2>
              <p className="text-xs text-aurea-navy/70">
                {producto.nombre} • <span className="font-semibold">{producto.categoria_nombre}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-full text-aurea-navy/50 hover:text-aurea-navy hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de KPIs del Plato en Drawer */}
        <div className="px-5 py-3 bg-aurea-champagne/10 border-b border-aurea-champagne/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Precio Venta</span>
            <span className="font-serif font-bold text-aurea-navy">S/ {producto.precio.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Costo Teórico</span>
            <span className="font-medium text-aurea-navy">S/ {nuevoCostoTeorico.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Margen Resultante</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
              nuevoMargenPct >= 65
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : nuevoMargenPct >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {nuevoMargenPct}%
            </span>
          </div>
        </div>

        {/* Mensaje de Confirmación */}
        {mensajeExito && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Contenido Desplazable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tarjeta: Simulador de Capacidad de Bodega (Pantry Bottleneck Card) */}
          <div className="p-4 rounded-2xl bg-aurea-champagne/20 border border-aurea-champagne/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-aurea-copper" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                  Simulador de Capacidad en Bodega
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-aurea-navy border border-aurea-champagne/60">
                {minRaciones} raciones máx.
              </span>
            </div>

            <p className="text-xs text-aurea-navy/70">
              Existencias actuales en almacén y raciones máximas posibles antes del quiebre:
            </p>

            <div className="space-y-1.5 text-xs">
              {detallesCapacidad.map((det) => {
                const esLimitante = det.nombre === cuelloBotellaNombre;
                return (
                  <div
                    key={det.insumo_id}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      esLimitante
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 font-semibold'
                        : 'bg-white/70 text-aurea-navy/80'
                    }`}
                  >
                    <span>
                      • {det.nombre} ({det.stock} {det.unidad}):
                    </span>
                    <span className="font-bold">
                      hasta {det.raciones} platos {esLimitante && '(Cuello de botella)'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-aurea-copper/30 text-xs text-aurea-navy flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aurea-copper shrink-0" />
              <span>
                <strong>Capacidad operativa:</strong> Puedes despachar hasta{' '}
                <strong>{minRaciones} platos</strong> en este turno antes de agotar {cuelloBotellaNombre || 'insumos'}.
              </span>
            </div>
          </div>

          {/* Calibración de Ingredientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                Dosificación de Ingredientes
              </h3>
              <button
                type="button"
                onClick={handleAgregarInsumo}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-aurea-copper bg-aurea-champagne/30 hover:bg-aurea-champagne/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Insumo</span>
              </button>
            </div>

            {items.map((it, idx) => {
              const ins = insumosDisponibles.find((i) => i.id === it.insumo_id);
              const unidad = ins ? ins.unidad_medida : 'und';
              const costoUnitario = ins ? ins.costo_unitario : 0;

              let dosisReal = it.cantidad_descuenta;
              if (it.modo_calculo === 'rendimiento' && it.rendimiento_platos > 0) {
                dosisReal = 1 / it.rendimiento_platos;
              }
              const costoPlato = dosisReal * costoUnitario;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-aurea-champagne/60 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <select
                      value={it.insumo_id}
                      onChange={(e) => handleModificar(idx, 'insumo_id', e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-aurea-champagne/60 text-xs font-semibold text-aurea-navy bg-white focus:border-aurea-copper outline-none max-w-[240px]"
                    >
                      {insumosDisponibles.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.unidad_medida})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleEliminarInsumo(idx)}
                      className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Eliminar insumo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Conmutador modo y valor */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex rounded-lg bg-aurea-champagne/20 p-0.5 border border-aurea-champagne/40">
                        <button
                          type="button"
                          onClick={() => handleModificar(idx, 'modo_calculo', 'rendimiento')}
                          className={`flex-1 py-1 rounded text-center text-[10px] font-semibold transition-all ${
                            it.modo_calculo === 'rendimiento'
                              ? 'bg-white text-aurea-navy shadow-xs'
                              : 'text-aurea-navy/60'
                          }`}
                        >
                          Rinde Lote
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModificar(idx, 'modo_calculo', 'exacto')}
                          className={`flex-1 py-1 rounded text-center text-[10px] font-semibold transition-all ${
                            it.modo_calculo === 'exacto'
                              ? 'bg-white text-aurea-navy shadow-xs'
                              : 'text-aurea-navy/60'
                          }`}
                        >
                          Exacto
                        </button>
                      </div>
                    </div>

                    <div>
                      {it.modo_calculo === 'rendimiento' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-aurea-navy/70">1 {unidad} rinde:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.rendimiento_platos}
                            onChange={(e) =>
                              handleModificar(
                                idx,
                                'rendimiento_platos',
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-16 px-2 py-0.5 rounded border border-aurea-champagne/60 text-xs text-right text-aurea-navy focus:border-aurea-copper outline-none"
                          />
                          <span className="text-[11px] text-aurea-navy/70">pl.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-aurea-navy/70">Dosis:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.001"
                            value={it.cantidad_descuenta}
                            onChange={(e) =>
                              handleModificar(
                                idx,
                                'cantidad_descuenta',
                                Math.max(0.001, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-20 px-2 py-0.5 rounded border border-aurea-champagne/60 text-xs text-right text-aurea-navy focus:border-aurea-copper outline-none"
                          />
                          <span className="text-[11px] text-aurea-navy/70">{unidad}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-aurea-navy/60 pt-1 border-t border-aurea-champagne/20">
                    <span>Costo plato:</span>
                    <span className="font-semibold text-aurea-navy">S/ {costoPlato.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie del Drawer */}
        <div className="p-4 border-t border-aurea-champagne/40 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || items.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {guardando ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Receta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
