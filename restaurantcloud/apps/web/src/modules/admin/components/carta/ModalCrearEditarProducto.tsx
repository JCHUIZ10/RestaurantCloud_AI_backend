import React, { useState, useEffect, useId } from 'react';
import {
  ChefHat,
  Zap,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  UtensilsCrossed,
  Package,
} from 'lucide-react';
import {
  ProductoAdminDTO,
  CategoriaAdminDTO,
  InsumoAdminDTO,
  CrearProductoRequest,
  CrearItemRecetaRequest,
  ModoCalculoReceta,
} from '@/types/admin';
import { Button, EstadoBadge, EstadoVacio, IconButton, Modal } from '@/components/ui';
import { cn } from '@/shared/utils';
import { tonoMargen } from './margen';

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';

interface ModalCrearEditarProductoProps {
  abierto: boolean;
  productoEditar?: ProductoAdminDTO | null;
  categorias: CategoriaAdminDTO[];
  insumosDisponibles: InsumoAdminDTO[];
  onCerrar: () => void;
  onGuardar: (req: CrearProductoRequest) => Promise<boolean>;
  onIrACategorias?: () => void;
  habilitarReceta?: boolean;
  pasoInicial?: 1 | 2;
}

interface ItemRecetaForm {
  insumo_id: string;
  modo_calculo: ModoCalculoReceta;
  rendimiento_platos: number;
  cantidad_descuenta: number;
}

const PASOS = [
  { n: 1 as const, etiqueta: 'Datos del plato' },
  { n: 2 as const, etiqueta: 'Receta e insumos' },
];

const MODOS: Array<[ModoCalculoReceta, string]> = [
  ['rendimiento', 'Rinde por lote'],
  ['exacto', 'Cantidad directa'],
];

const DESTINOS = [
  { valor: true, icono: ChefHat, titulo: 'Cocina', texto: 'Se envía a la pantalla de cocina para prepararlo.' },
  { valor: false, icono: Zap, titulo: 'Despacho directo', texto: 'Bebidas o postres que sirve el mozo o la barra.' },
];

export const ModalCrearEditarProducto: React.FC<ModalCrearEditarProductoProps> = ({
  abierto,
  productoEditar,
  categorias,
  insumosDisponibles,
  onCerrar,
  onGuardar,
  onIrACategorias,
  habilitarReceta = true,
  pasoInicial = 1,
}) => {
  const [pasoActual, setPasoActual] = useState<1 | 2>(1);
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Campos Paso 1: Datos Comerciales
  const [categoriaId, setCategoriaId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState<number>(25.0);
  const [requierePreparacion, setRequierePreparacion] = useState(true);

  // Campos Paso 2: Receta Culinaria Dual
  const [recetaItems, setRecetaItems] = useState<ItemRecetaForm[]>([]);
  const idForm = useId();

  // Inicialización cuando abre el modal o cambia el producto a editar
  useEffect(() => {
    if (abierto) {
      setErrorValidacion(null);
      setPasoActual(pasoInicial);

      if (productoEditar) {
        setCategoriaId(productoEditar.categoria_id);
        setNombre(productoEditar.nombre);
        setDescripcion(productoEditar.descripcion || '');
        setPrecio(productoEditar.precio);
        setRequierePreparacion(productoEditar.requiere_preparacion);

                const recetaPlato = productoEditar.receta || (productoEditar as any).items || [];
        const itemsMapeados: ItemRecetaForm[] = recetaPlato.map((r: any) => ({
          insumo_id: r.insumo_id,
          modo_calculo: r.modo_calculo || 'exacto',
          rendimiento_platos: Number(r.rendimiento_platos) || (Number(r.cantidad_descuenta) > 0 ? Math.round(1 / Number(r.cantidad_descuenta)) : 100),
          cantidad_descuenta: Number(r.cantidad_descuenta) || 0.1,
        }));
        setRecetaItems(habilitarReceta ? itemsMapeados : []);
      } else {
        // Valores por defecto para nuevo producto
        setCategoriaId(categorias.length > 0 ? categorias[0].id : '');
        setNombre('');
        setDescripcion('');
        setPrecio(28.0);
        setRequierePreparacion(true);

        // Si hay insumos, precargar 1 para conveniencia
        if (habilitarReceta && insumosDisponibles.length > 0) {
          setRecetaItems([
            {
              insumo_id: insumosDisponibles[0].id,
              modo_calculo: 'exacto',
              rendimiento_platos: 100,
              cantidad_descuenta: 0.25,
            },
          ]);
        } else {
          setRecetaItems([]);
        }
      }
    }
  }, [abierto, productoEditar, categorias, insumosDisponibles]);

  // Cálculos dinámicos en vivo para la barra de rentabilidad
  const costoTotalTeorico = recetaItems.reduce((acc, item) => {
    const ins = insumosDisponibles.find((i) => i.id === item.insumo_id);
    if (!ins) return acc;
    let dosis = item.cantidad_descuenta;
    if (item.modo_calculo === 'rendimiento' && item.rendimiento_platos > 0) {
      dosis = 1 / item.rendimiento_platos;
    }
    return acc + dosis * ins.costo_unitario;
  }, 0);

  const utilidadTeorica = Math.max(0, precio - costoTotalTeorico);
  const margenBrutoPct =
    precio > 0 ? Number((((precio - costoTotalTeorico) / precio) * 100).toFixed(1)) : 0;

  // Métodos de manipulación de receta
  const handleAgregarInsumo = () => {
    if (insumosDisponibles.length === 0) return;
    // Buscar un insumo que no esté aún en la receta
    const yaUsados = new Set(recetaItems.map((r) => r.insumo_id));
    const disponibleLibre = insumosDisponibles.find((i) => !yaUsados.has(i.id)) || insumosDisponibles[0];

    setRecetaItems([
      ...recetaItems,
      {
        insumo_id: disponibleLibre.id,
        modo_calculo: 'exacto',
        rendimiento_platos: 100,
        cantidad_descuenta: 0.2,
      },
    ]);
  };

  const handleEliminarInsumo = (index: number) => {
    const nueva = [...recetaItems];
    nueva.splice(index, 1);
    setRecetaItems(nueva);
  };

  const handleActualizarItem = (index: number, campo: keyof ItemRecetaForm, valor: any) => {
    const nueva = [...recetaItems];
    nueva[index] = { ...nueva[index], [campo]: valor };
    setRecetaItems(nueva);
  };

  // Validaciones
  const handleAvanzarPaso = () => {
    setErrorValidacion(null);
    if (!categoriaId) {
      setErrorValidacion('Debes seleccionar una categoría obligatoria.');
      return;
    }
    if (!nombre.trim()) {
      setErrorValidacion('El nombre del plato es obligatorio.');
      return;
    }
    if (precio <= 0) {
      setErrorValidacion('El precio de venta debe ser mayor a 0 Soles.');
      return;
    }
    setPasoActual(2);
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setErrorValidacion(null);

    if (habilitarReceta && recetaItems.length === 0) {
      setErrorValidacion('Todo plato en carta debe tener al menos un insumo en su receta para control de stock.');
      return;
    }

    // Validar dosis válidas
    for (const it of habilitarReceta ? recetaItems : []) {
      if (it.modo_calculo === 'rendimiento' && it.rendimiento_platos <= 0) {
        setErrorValidacion('El rendimiento en platos por empaque debe ser mayor a 0.');
        return;
      }
      if (it.modo_calculo === 'exacto' && it.cantidad_descuenta <= 0) {
        setErrorValidacion('La cantidad exacta que descuenta debe ser mayor a 0.');
        return;
      }
    }

    const payloadReceta: CrearItemRecetaRequest[] = (habilitarReceta ? recetaItems : []).map((r) => {
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
    });

    const payload: CrearProductoRequest = {
      categoria_id: categoriaId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      precio: Number(precio),
      foto_url: productoEditar?.foto_url || undefined,
      requiere_preparacion: requierePreparacion,
      receta: payloadReceta,
    };

    setGuardando(true);
    try {
      const exito = await onGuardar(payload);
      if (exito) {
        onCerrar();
      }
    } finally {
      setGuardando(false);
    }
  };

  // Pasos del asistente y, en el paso 2, la rentabilidad en vivo: siempre visibles aunque la receta sea larga
  const barra = habilitarReceta ? (
    <div className="px-4 sm:px-6 py-3 bg-aurea-ivory/60 space-y-3">
      <ol className="flex items-center gap-2" aria-label="Pasos">
        {PASOS.map((p, i) => {
          const activo = pasoActual === p.n;
          return (
            <li key={p.n} className="flex items-center gap-2 min-w-0">
              {i > 0 && <span className="w-6 sm:w-10 h-px bg-aurea-copper/40" aria-hidden="true" />}
              <button
                type="button"
                aria-current={activo ? 'step' : undefined}
                onClick={() => (p.n === 1 ? setPasoActual(1) : handleAvanzarPaso())}
                className={cn(
                  'min-h-tactil flex items-center gap-2 px-2 rounded-xl text-sm font-semibold transition-colors',
                  activo ? 'text-aurea-navy' : 'text-aurea-navy/50 hover:text-aurea-navy'
                )}
              >
                <span
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm shrink-0',
                    activo ? 'bg-aurea-navy text-aurea-champagne' : 'bg-white border border-aurea-champagne text-aurea-navy/60'
                  )}
                >
                  {p.n}
                </span>
                <span className="truncate">{p.etiqueta}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {pasoActual === 2 && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="px-3 py-2 rounded-xl bg-white border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Precio</dt>
            <dd className="font-serif font-bold text-aurea-navy tabular-nums">S/ {precio.toFixed(2)}</dd>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Costo receta</dt>
            <dd className="text-aurea-navy tabular-nums">S/ {costoTotalTeorico.toFixed(2)}</dd>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Utilidad</dt>
            <dd className="font-semibold text-estado-ok-700 tabular-nums">S/ {utilidadTeorica.toFixed(2)}</dd>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white border border-aurea-champagne/70">
            <dt className="text-xs text-aurea-navy/60">Margen</dt>
            <dd>
              <EstadoBadge tono={tonoMargen(margenBrutoPct)}>{margenBrutoPct}%</EstadoBadge>
            </dd>
          </div>
        </dl>
      )}
    </div>
  ) : undefined;

  const pie = (
    <>
      {habilitarReceta && pasoActual === 2 ? (
        <Button variant="outline" onClick={() => setPasoActual(1)} leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}>
          Anterior
        </Button>
      ) : (
        <Button variant="outline" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
      )}
      {habilitarReceta && pasoActual === 1 ? (
        <Button onClick={handleAvanzarPaso}>
          Siguiente: receta
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button type="submit" form={idForm} loading={guardando} leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}>
          Guardar plato
        </Button>
      )}
    </>
  );

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      cerrable={!guardando}
      tamano="lg"
      icono={UtensilsCrossed}
      titulo={productoEditar ? `Editar «${productoEditar.nombre}»` : 'Nuevo plato'}
      barra={barra}
      pie={pie}
    >
      <form
        id={idForm}
        onSubmit={(e) => {
          // Enter en el paso 1 avanza a la receta en lugar de guardar sin ella
          if (habilitarReceta && pasoActual === 1) {
            e.preventDefault();
            handleAvanzarPaso();
          } else {
            handleSubmit(e);
          }
        }}
        noValidate
        className="space-y-5"
      >
        {errorValidacion && (
          <p
            role="alert"
            className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {errorValidacion}
          </p>
        )}

        {pasoActual === 1 && (
          <>
            <div>
              <label htmlFor={`${idForm}-cat`} className={CLASE_ROTULO}>
                Categoría
              </label>
              {categorias.length === 0 ? (
                <div className="p-3 rounded-xl bg-estado-alerta-50 border border-estado-alerta-200 text-sm text-estado-alerta-800 flex flex-wrap items-center justify-between gap-2">
                  <span>Aún no tienes categorías.</span>
                  {onIrACategorias && (
                    <Button size="sm" variant="outline" onClick={onIrACategorias}>
                      Crear categorías
                    </Button>
                  )}
                </div>
              ) : (
                <select
                  id={`${idForm}-cat`}
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                  className={cn(CLASE_CONTROL, 'cursor-pointer')}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor={`${idForm}-nombre`} className={CLASE_ROTULO}>
                  Nombre
                </label>
                <input
                  id={`${idForm}-nombre`}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Lomo saltado, Ceviche clásico"
                  required
                  autoFocus
                  className={CLASE_CONTROL}
                />
              </div>
              <div>
                <label htmlFor={`${idForm}-precio`} className={CLASE_ROTULO}>
                  Precio
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-aurea-copper"
                    aria-hidden="true"
                  >
                    S/
                  </span>
                  <input
                    id={`${idForm}-precio`}
                    type="number"
                    step="0.5"
                    min="0.1"
                    inputMode="decimal"
                    value={precio}
                    onChange={(e) => setPrecio(Math.max(0, parseFloat(e.target.value) || 0))}
                    required
                    className={cn(CLASE_CONTROL, 'pl-9 font-serif font-bold')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor={`${idForm}-desc`} className={CLASE_ROTULO}>
                Descripción <span className="font-normal text-aurea-navy/50">(opcional)</span>
              </label>
              <textarea
                id={`${idForm}-desc`}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="La verán los comensales en la carta digital"
                rows={2}
                className={cn(CLASE_CONTROL, 'py-2.5 resize-none')}
              />
            </div>

            <fieldset>
              <legend className={CLASE_ROTULO}>¿Dónde se prepara?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DESTINOS.map(({ valor, icono: Icono, titulo, texto }) => {
                  const activo = requierePreparacion === valor;
                  return (
                    <label
                      key={titulo}
                      className={cn(
                        'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors',
                        activo
                          ? 'bg-aurea-champagne/30 border-aurea-copper shadow-sm'
                          : 'bg-white border-aurea-champagne/70 hover:border-aurea-copper/60'
                      )}
                    >
                      <input
                        type="radio"
                        name={`${idForm}-destino`}
                        checked={activo}
                        onChange={() => setRequierePreparacion(valor)}
                        className="mt-1 accent-aurea-copper"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
                          <Icono className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                          {titulo}
                        </span>
                        <span className="block text-sm text-aurea-navy/60 mt-0.5">{texto}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {habilitarReceta && pasoActual === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-aurea-navy/70">Insumos que se descuentan de bodega por cada ración.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAgregarInsumo}
                disabled={insumosDisponibles.length === 0}
                leftIcon={<Plus className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
              >
                Agregar insumo
              </Button>
            </div>

            {recetaItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-aurea-copper/50 bg-aurea-ivory">
                <EstadoVacio
                  icono={Package}
                  titulo="Sin insumos"
                  descripcion="Agrega al menos un insumo para controlar el stock del plato."
                />
              </div>
            ) : (
              <ul className="space-y-3">
                {recetaItems.map((item, idx) => {
                  const insumoObj = insumosDisponibles.find((i) => i.id === item.insumo_id);
                  const unidad = insumoObj ? insumoObj.unidad_medida : 'und';
                  const costoUnitario = insumoObj ? insumoObj.costo_unitario : 0;
                  const dosisReal =
                    item.modo_calculo === 'rendimiento' && item.rendimiento_platos > 0
                      ? 1 / item.rendimiento_platos
                      : item.cantidad_descuenta;
                  const costoPlato = dosisReal * costoUnitario;
                  const idItem = `${idForm}-ins-${idx}`;

                  return (
                    <li key={idx} className="p-4 rounded-xl bg-white border border-aurea-champagne/70 shadow-sm space-y-3">
                      <div className="flex items-end gap-2">
                        <div className="flex-1 min-w-0">
                          <label htmlFor={idItem} className="block text-xs font-semibold text-aurea-navy/70 mb-1">
                            Insumo
                          </label>
                          <select
                            id={idItem}
                            value={item.insumo_id}
                            onChange={(e) => handleActualizarItem(idx, 'insumo_id', e.target.value)}
                            className={cn(CLASE_CONTROL, 'cursor-pointer')}
                          >
                            {insumosDisponibles.map((ins) => (
                              <option key={ins.id} value={ins.id}>
                                {ins.nombre} · S/ {ins.costo_unitario.toFixed(2)}/{ins.unidad_medida}
                              </option>
                            ))}
                          </select>
                        </div>
                        <IconButton
                          variant="danger"
                          icono={Trash2}
                          etiqueta="Quitar insumo de la receta"
                          onClick={() => handleEliminarInsumo(idx)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        <div
                          role="group"
                          aria-label="Cómo se calcula"
                          className="flex p-1 rounded-xl bg-aurea-champagne/25 border border-aurea-champagne/70"
                        >
                          {MODOS.map(([modo, texto]) => (
                            <button
                              key={modo}
                              type="button"
                              aria-pressed={item.modo_calculo === modo}
                              onClick={() => handleActualizarItem(idx, 'modo_calculo', modo)}
                              className={cn(
                                'flex-1 min-h-9 rounded-lg text-sm font-semibold transition-colors',
                                item.modo_calculo === modo
                                  ? 'bg-aurea-navy text-white shadow-sm'
                                  : 'text-aurea-navy/60 hover:text-aurea-navy'
                              )}
                            >
                              {texto}
                            </button>
                          ))}
                        </div>

                        {item.modo_calculo === 'rendimiento' ? (
                          <div>
                            <label htmlFor={`${idItem}-r`} className="block text-xs font-semibold text-aurea-navy/70 mb-1">
                              1 {unidad} rinde
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id={`${idItem}-r`}
                                type="number"
                                min="1"
                                value={item.rendimiento_platos}
                                onChange={(e) =>
                                  handleActualizarItem(idx, 'rendimiento_platos', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className={CLASE_CONTROL}
                              />
                              <span className="text-sm text-aurea-navy/70">platos</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label htmlFor={`${idItem}-c`} className="block text-xs font-semibold text-aurea-navy/70 mb-1">
                              Descuenta por plato
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id={`${idItem}-c`}
                                type="number"
                                step="0.01"
                                min="0.001"
                                value={item.cantidad_descuenta}
                                onChange={(e) =>
                                  handleActualizarItem(
                                    idx,
                                    'cantidad_descuenta',
                                    Math.max(0.001, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className={CLASE_CONTROL}
                              />
                              <span className="text-sm text-aurea-navy/70">{unidad}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="flex items-center justify-between pt-2 border-t border-aurea-champagne/40 text-xs text-aurea-navy/60">
                        <span>
                          {dosisReal.toFixed(dosisReal < 0.01 ? 4 : 3)} {unidad} por ración
                        </span>
                        <span>
                          Costo{' '}
                          <strong className="font-serif text-sm text-aurea-navy tabular-nums">S/ {costoPlato.toFixed(2)}</strong>
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};
