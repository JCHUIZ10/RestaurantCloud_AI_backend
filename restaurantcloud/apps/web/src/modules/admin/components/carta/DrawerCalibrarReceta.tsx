import React from 'react';
import { AlertTriangle, Edit2, PackageCheck, PackageX, Info } from 'lucide-react';
import {
  ProductoAdminDTO,
  InsumoAdminDTO,
  ModoCalculoReceta,
  SimulacionCapacidadDTO,
} from '@/types/admin';
import { Button, Drawer, EstadoBadge, EstadoVacio, type TonoEstado } from '@/components/ui';
import { cn } from '@/shared/utils';
import { tonoMargen } from './margen';

interface DrawerCalibrarRecetaProps {
  abierto: boolean;
  producto: ProductoAdminDTO | null;
  insumosDisponibles: InsumoAdminDTO[];
  simulacion?: SimulacionCapacidadDTO | null;
  onCerrar: () => void;
  onEditarReceta?: (producto: ProductoAdminDTO) => void;
}

const tonoCapacidad = (raciones: number): TonoEstado => (raciones > 10 ? 'ok' : raciones > 0 ? 'alerta' : 'error');

export const DrawerCalibrarReceta: React.FC<DrawerCalibrarRecetaProps> = ({
  abierto,
  producto,
  insumosDisponibles,
  simulacion,
  onCerrar,
  onEditarReceta,
}) => {
  if (!producto) return null;

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

  const hayStock = capacidadMaxima > 0;

  return (
    <Drawer
      abierto={abierto}
      onCerrar={onCerrar}
      ancho="lg"
      titulo={producto.nombre}
      descripcion={
        <span className="flex flex-wrap items-center gap-2">
          {producto.categoria_nombre}
          {producto.disponibilidad === 'disponible' ? (
            <EstadoBadge tono="ok">Disponible</EstadoBadge>
          ) : (
            <EstadoBadge tono="error">Agotado</EstadoBadge>
          )}
        </span>
      }
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
          {onEditarReceta && (
            <Button onClick={() => onEditarReceta(producto)} leftIcon={<Edit2 className="w-4 h-4" aria-hidden="true" />}>
              Editar receta
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Precio</dt>
            <dd className="font-serif font-bold text-lg text-aurea-navy tabular-nums">S/ {producto.precio.toFixed(2)}</dd>
          </div>
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Costo</dt>
            <dd className="font-serif font-bold text-lg text-aurea-navy tabular-nums">S/ {costoTeorico.toFixed(2)}</dd>
          </div>
          <div className="p-3 rounded-xl bg-aurea-ivory border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Margen</dt>
            <dd className="mt-1">
              <EstadoBadge tono={tonoMargen(margenBrutoPct)}>{margenBrutoPct}%</EstadoBadge>
            </dd>
          </div>
        </dl>

        <section
          className={cn(
            'p-4 rounded-xl border flex items-start gap-3',
            hayStock ? 'bg-aurea-champagne/20 border-aurea-champagne' : 'bg-estado-error-50 border-estado-error-200'
          )}
        >
          <span
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              hayStock ? 'bg-aurea-navy text-aurea-champagne' : 'bg-estado-error-100 text-estado-error-700'
            )}
            aria-hidden="true"
          >
            {hayStock ? <PackageCheck className="w-5 h-5" /> : <PackageX className="w-5 h-5" />}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-serif font-bold text-2xl text-aurea-navy tabular-nums">{capacidadMaxima}</span>
              <span className="text-sm text-aurea-navy/70">raciones posibles con el stock actual</span>
            </p>
            {cuelloBotellaNombre && (
              <p className={cn('text-sm', hayStock ? 'text-aurea-navy/80' : 'text-estado-error-800')}>
                {hayStock ? 'Limita la producción: ' : 'Sin stock suficiente de '}
                <strong className="font-semibold">{cuelloBotellaNombre}</strong>.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-aurea-navy">
            Insumos por ración
            <span className="px-2 rounded-full bg-aurea-champagne/40 text-xs font-bold">{insumosConsumidos.length}</span>
          </h3>

          {insumosConsumidos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-aurea-copper/50 bg-aurea-ivory">
              <EstadoVacio
                icono={Info}
                titulo="Sin receta"
                descripcion="Este plato todavía no tiene insumos vinculados."
              />
            </div>
          ) : (
            <ul className="space-y-2.5">
              {insumosConsumidos.map((it) => {
                const esLimitante =
                  it.insumo_id === cuelloBotellaId || (capacidadMaxima === it.raciones && insumosConsumidos.length > 1);
                return (
                  <li
                    key={it.insumo_id}
                    className={cn(
                      'p-3.5 rounded-xl border',
                      esLimitante ? 'bg-estado-error-50/60 border-estado-error-200' : 'bg-white border-aurea-champagne/70'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-aurea-navy truncate">{it.nombre}</span>
                        <span className="px-2 py-0.5 rounded-lg border border-aurea-champagne bg-aurea-champagne/20 text-xs font-medium text-aurea-navy shrink-0">
                          {it.unidad}
                        </span>
                      </p>
                      {esLimitante && (
                        <EstadoBadge tono="error" icono={AlertTriangle}>
                          Limitante
                        </EstadoBadge>
                      )}
                    </div>

                    <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-aurea-navy/60">Por ración</dt>
                        <dd className="text-sm font-medium text-aurea-navy tabular-nums">
                          {it.modo_calculo === 'rendimiento'
                            ? `1 ${it.unidad} = ${it.rendimiento_platos} pl.`
                            : `${it.dosis} ${it.unidad}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-aurea-navy/60">Costo</dt>
                        <dd className="text-sm font-medium text-aurea-navy tabular-nums">S/ {it.costo_plato.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-aurea-navy/60">Stock</dt>
                        <dd className="text-sm font-medium text-aurea-navy tabular-nums">
                          {it.stock_actual} {it.unidad}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 pt-2 border-t border-aurea-champagne/40 flex items-center justify-between text-sm">
                      <span className="text-aurea-navy/60">Alcanza para</span>
                      <EstadoBadge tono={esLimitante ? 'error' : tonoCapacidad(it.raciones)}>
                        {it.raciones} platos
                      </EstadoBadge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
};
