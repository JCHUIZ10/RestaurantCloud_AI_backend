import React from 'react';
import {
  X,
  Boxes,
  Sparkles,
  AlertTriangle,
  Edit2,
  PackageCheck,
  PackageX,
  Info,
} from 'lucide-react';
import {
  ProductoAdminDTO,
  InsumoAdminDTO,
  ModoCalculoReceta,
  SimulacionCapacidadDTO,
} from '@/types/admin';

interface DrawerCalibrarRecetaProps {
  abierto: boolean;
  producto: ProductoAdminDTO | null;
  insumosDisponibles: InsumoAdminDTO[];
  simulacion?: SimulacionCapacidadDTO | null;
  onCerrar: () => void;
  onEditarReceta?: (producto: ProductoAdminDTO) => void;
}

export const DrawerCalibrarReceta: React.FC<DrawerCalibrarRecetaProps> = ({
  abierto,
  producto,
  insumosDisponibles,
  simulacion,
  onCerrar,
  onEditarReceta,
}) => {
  if (!abierto || !producto) return null;

  const receta = producto.receta || (producto as any).items || [];

  // Mapeo enriquecido de los insumos que consume el plato
  const insumosConsumidos = receta.map((r: any) => {
    const ins = insumosDisponibles.find((i) => i.id === r.insumo_id);
    const nombre = ins ? ins.nombre : (r.nombre || r.insumo_nombre || 'Insumo');
    const unidad = ins ? ins.unidad_medida : (r.unidad_medida || 'und');
    const costoUnitario = ins ? ins.costo_unitario : Number(r.costo_unitario || r.costo_unitario_insumo || 0);
    const stockActual = ins ? ins.stock_actual : Number(r.stock_actual || r.stock_actual_insumo || 0);

    const modoCalculo: ModoCalculoReceta = r.modo_calculo || 'exacto';
    const rendimientoPlatos =
      Number(r.rendimiento_platos) ||
      (Number(r.cantidad_descuenta) > 0 ? Math.round(1 / Number(r.cantidad_descuenta)) : 100);

    let dosis = Number(r.cantidad_descuenta) || 0;
    if (modoCalculo === 'rendimiento' && rendimientoPlatos > 0) {
      dosis = 1 / rendimientoPlatos;
    }

    const costoPlato = dosis * costoUnitario;
    const raciones = dosis > 0 ? Math.floor(stockActual / dosis) : 0;

    return {
      insumo_id: r.insumo_id,
      nombre,
      unidad,
      costo_unitario: costoUnitario,
      stock_actual: stockActual,
      modo_calculo: modoCalculo,
      rendimiento_platos: rendimientoPlatos,
      dosis,
      costo_plato: costoPlato,
      raciones,
    };
  });

  // Métricas de capacidad y cuello de botella (desde backend o cálculo reactivo de fallback)
  const capacidadMaxima =
    simulacion?.capacidad_maxima_platos !== undefined
      ? simulacion.capacidad_maxima_platos
      : insumosConsumidos.length > 0
      ? Math.min(...insumosConsumidos.map((i) => i.raciones))
      : 0;

  const cuelloBotellaId =
    simulacion?.insumo_cuello_botella_id ||
    (insumosConsumidos.length > 0
      ? insumosConsumidos.reduce((min, cur) => (cur.raciones < min.raciones ? cur : min), insumosConsumidos[0]).insumo_id
      : '');

  const cuelloBotellaNombre =
    simulacion?.insumo_cuello_botella_nombre ||
    (insumosConsumidos.find((i) => i.insumo_id === cuelloBotellaId)?.nombre || '');

  // Métricas financieras
  const costoTeoricoCalculado = insumosConsumidos.reduce((acc, cur) => acc + cur.costo_plato, 0);
  const costoTeorico =
    producto.costo_teorico !== undefined && producto.costo_teorico !== null
      ? producto.costo_teorico
      : costoTeoricoCalculado;

  const margenBrutoPct =
    producto.precio > 0
      ? Number((((producto.precio - costoTeorico) / producto.precio) * 100).toFixed(1))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-aurea-champagne/40 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-aurea-champagne/40 flex items-center justify-between bg-aurea-champagne/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/20 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-aurea-navy">
                  Capacidad e Insumos
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    producto.disponibilidad === 'disponible'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {producto.disponibilidad === 'disponible' ? 'Disponible' : 'Agotado'}
                </span>
              </div>
              <p className="text-xs text-aurea-navy/70">
                {producto.nombre} • <span className="font-semibold">{producto.categoria_nombre}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-full text-aurea-navy/50 hover:text-aurea-navy hover:bg-black/5 transition-colors"
            title="Cerrar simulador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de KPIs de Rentabilidad y Capacidad Inmediata */}
        <div className="grid grid-cols-4 gap-2 px-5 py-3 bg-aurea-champagne/10 border-b border-aurea-champagne/30 text-xs">
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Precio Venta</span>
            <span className="font-serif font-bold text-aurea-navy">S/ {producto.precio.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Costo Teórico</span>
            <span className="font-medium text-aurea-navy">S/ {costoTeorico.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Margen Bruto</span>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                margenBrutoPct >= 65
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : margenBrutoPct >= 50
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {margenBrutoPct}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-aurea-navy/60 uppercase font-semibold block">Capacidad</span>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                capacidadMaxima > 10
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : capacidadMaxima > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {capacidadMaxima} raciones
            </span>
          </div>
        </div>

        {/* Contenido Desplazable del Simulador */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tarjeta de Diagnóstico Operativo & Cuello de Botella */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              capacidadMaxima > 0
                ? 'bg-aurea-champagne/20 border-aurea-champagne/50'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {capacidadMaxima > 0 ? (
                  <PackageCheck className="w-4 h-4 text-aurea-copper" />
                ) : (
                  <PackageX className="w-4 h-4 text-rose-600" />
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                  Diagnóstico de Bodega
                </h3>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  capacidadMaxima > 10
                    ? 'bg-white text-emerald-800 border-emerald-200'
                    : capacidadMaxima > 0
                    ? 'bg-white text-amber-800 border-amber-200'
                    : 'bg-white text-rose-800 border-rose-200'
                }`}
              >
                {capacidadMaxima} raciones máx.
              </span>
            </div>

            {capacidadMaxima > 0 ? (
              <div className="space-y-2 text-xs">
                <p className="text-aurea-navy/80 leading-relaxed">
                  Con las existencias actuales registradas en almacén, puedes despachar con seguridad hasta{' '}
                  <strong className="text-aurea-navy font-bold">{capacidadMaxima} platos</strong> en este turno antes
                  de quebrar stock.
                </p>
                {cuelloBotellaNombre && (
                  <div className="p-2.5 rounded-xl bg-white/80 border border-aurea-copper/30 text-xs text-aurea-navy flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-aurea-copper shrink-0 mt-0.5" />
                    <span>
                      <strong>Insumo cuello de botella:</strong> <span className="font-semibold">{cuelloBotellaNombre}</span> es el insumo más limitante para este plato.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Quiebre operativo de inventario:</strong>
                    <span>
                      {cuelloBotellaNombre
                        ? `El insumo ${cuelloBotellaNombre} no cuenta con stock suficiente para preparar raciones de este plato.`
                        : 'Uno o más insumos clave no tienen existencias suficientes en almacén.'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desglose de Insumos que Consume el Plato */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                  Insumos Consumidos por Ración
                </h3>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-aurea-champagne/40 text-aurea-navy font-semibold">
                  {insumosConsumidos.length}
                </span>
              </div>
              <span className="text-[11px] text-aurea-navy/60">
                Solo lectura
              </span>
            </div>

            {insumosConsumidos.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-dashed border-aurea-champagne/60 text-center space-y-3">
                <Info className="w-6 h-6 text-aurea-navy/40 mx-auto" />
                <p className="text-xs text-aurea-navy/70">
                  Este plato no tiene insumos configurados en su receta culinaria.
                </p>
                {onEditarReceta && (
                  <button
                    type="button"
                    onClick={() => onEditarReceta(producto)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-aurea-copper bg-aurea-champagne/30 hover:bg-aurea-champagne/50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Configurar Receta en Carta</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {insumosConsumidos.map((it) => {
                  const esLimitante =
                    it.insumo_id === cuelloBotellaId ||
                    (capacidadMaxima === it.raciones && insumosConsumidos.length > 1);

                  return (
                    <div
                      key={it.insumo_id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        esLimitante
                          ? 'bg-rose-50/50 border-rose-200 shadow-xs'
                          : 'bg-white border-aurea-champagne/60 shadow-xs hover:border-aurea-champagne'
                      }`}
                    >
                      {/* Cabecera del Insumo */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-aurea-navy truncate">
                            {it.nombre}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-aurea-champagne/30 text-aurea-navy/70 shrink-0">
                            {it.unidad}
                          </span>
                        </div>
                        {esLimitante && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                            Cuello de botella
                          </span>
                        )}
                      </div>

                      {/* Detalles de dosificación y modo de cálculo */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-aurea-champagne/20 text-xs">
                        <div>
                          <span className="text-[10px] text-aurea-navy/60 uppercase block">Dosificación</span>
                          <span className="font-medium text-aurea-navy text-[11px]">
                            {it.modo_calculo === 'rendimiento' ? (
                              <>
                                1 {it.unidad} rinde <strong className="font-bold">{it.rendimiento_platos}</strong> pl.
                                <span className="block text-[10px] text-aurea-navy/60">
                                  ({(it.dosis).toFixed(4)} {it.unidad}/plato)
                                </span>
                              </>
                            ) : (
                              <>
                                Dosis exacta: <strong className="font-bold">{it.dosis}</strong> {it.unidad}
                              </>
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-aurea-navy/60 uppercase block">Costo en Plato</span>
                          <span className="font-medium text-aurea-navy text-[11px]">
                            S/ {it.costo_plato.toFixed(2)} / ración
                            <span className="block text-[10px] text-aurea-navy/60">
                              (Base: S/ {it.costo_unitario.toFixed(2)}/{it.unidad})
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Existencias en Bodega y Raciones */}
                      <div className="mt-2.5 pt-2 border-t border-aurea-champagne/20 flex items-center justify-between text-xs bg-black/[0.015] -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-2xl">
                        <div>
                          <span className="text-[10px] text-aurea-navy/60 block">Stock en bodega:</span>
                          <span className="font-semibold text-aurea-navy">
                            {it.stock_actual} {it.unidad}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-aurea-navy/60 block">Raciones posibles:</span>
                          <span
                            className={`font-bold ${
                              esLimitante ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            hasta {it.raciones} platos
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pie del Drawer: Separación de Responsabilidad (SRP) */}
        <div className="p-4 border-t border-aurea-champagne/40 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-aurea-navy/70 hover:text-aurea-navy hover:bg-aurea-champagne/20 transition-colors"
          >
            Cerrar
          </button>

          {onEditarReceta && (
            <button
              type="button"
              onClick={() => onEditarReceta(producto)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg"
              title="Abrir editor completo de plato en carta en el paso de receta"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Receta en Carta</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
