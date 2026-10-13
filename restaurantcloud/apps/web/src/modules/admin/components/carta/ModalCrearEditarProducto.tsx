import React, { useState, useEffect } from 'react';
import {
  X,
  ChefHat,
  Zap,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ProductoAdminDTO,
  CategoriaAdminDTO,
  InsumoAdminDTO,
  CrearProductoRequest,
  CrearItemRecetaRequest,
  ModoCalculoReceta,
} from '@/types/admin';

interface ModalCrearEditarProductoProps {
  abierto: boolean;
  productoEditar?: ProductoAdminDTO | null;
  categorias: CategoriaAdminDTO[];
  insumosDisponibles: InsumoAdminDTO[];
  onCerrar: () => void;
  onGuardar: (req: CrearProductoRequest) => Promise<boolean>;
  onIrACategorias?: () => void;
}

interface ItemRecetaForm {
  insumo_id: string;
  modo_calculo: ModoCalculoReceta;
  rendimiento_platos: number;
  cantidad_descuenta: number;
}

export const ModalCrearEditarProducto: React.FC<ModalCrearEditarProductoProps> = ({
  abierto,
  productoEditar,
  categorias,
  insumosDisponibles,
  onCerrar,
  onGuardar,
  onIrACategorias,
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

  // Inicialización cuando abre el modal o cambia el producto a editar
  useEffect(() => {
    if (abierto) {
      setErrorValidacion(null);
      setPasoActual(1);

      if (productoEditar) {
        setCategoriaId(productoEditar.categoria_id);
        setNombre(productoEditar.nombre);
        setDescripcion(productoEditar.descripcion || '');
        setPrecio(productoEditar.precio);
        setRequierePreparacion(productoEditar.requiere_preparacion);

        const itemsMapeados: ItemRecetaForm[] = productoEditar.receta.map((r) => ({
          insumo_id: r.insumo_id,
          modo_calculo: r.modo_calculo,
          rendimiento_platos: r.rendimiento_platos || 100,
          cantidad_descuenta: r.cantidad_descuenta,
        }));
        setRecetaItems(itemsMapeados);
      } else {
        // Valores por defecto para nuevo producto
        setCategoriaId(categorias.length > 0 ? categorias[0].id : '');
        setNombre('');
        setDescripcion('');
        setPrecio(28.0);
        setRequierePreparacion(true);

        // Si hay insumos, precargar 1 para conveniencia
        if (insumosDisponibles.length > 0) {
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

  if (!abierto) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (recetaItems.length === 0) {
      setErrorValidacion('Todo plato en carta debe tener al menos un insumo en su receta para control de stock.');
      return;
    }

    // Validar dosis válidas
    for (const it of recetaItems) {
      if (it.modo_calculo === 'rendimiento' && it.rendimiento_platos <= 0) {
        setErrorValidacion('El rendimiento en platos por empaque debe ser mayor a 0.');
        return;
      }
      if (it.modo_calculo === 'exacto' && it.cantidad_descuenta <= 0) {
        setErrorValidacion('La cantidad exacta que descuenta debe ser mayor a 0.');
        return;
      }
    }

    const payloadReceta: CrearItemRecetaRequest[] = recetaItems.map((r) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-aurea-champagne/40 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-aurea-champagne/40 flex items-center justify-between bg-aurea-champagne/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-copper/15 border border-aurea-copper/30 flex items-center justify-center text-aurea-copper">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-aurea-navy">
                {productoEditar ? 'Editar Plato en Carta' : 'Registrar Nuevo Plato en Carta'}
              </h2>
              <p className="text-xs text-aurea-navy/60">
                Configura datos comerciales y vincula insumos de inventario
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

        {/* Selector de Pasos */}
        <div className="px-6 pt-4 pb-2 border-b border-aurea-champagne/30 bg-white flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setPasoActual(1)}
            className={`flex items-center gap-2 pb-2 border-b-2 font-semibold transition-all ${
              pasoActual === 1
                ? 'border-aurea-copper text-aurea-copper'
                : 'border-transparent text-aurea-navy/50 hover:text-aurea-navy'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              pasoActual === 1 ? 'bg-aurea-copper text-white' : 'bg-gray-100 text-aurea-navy/60'
            }`}>
              1
            </span>
            <span>Datos Comerciales</span>
          </button>

          <button
            type="button"
            onClick={handleAvanzarPaso}
            className={`flex items-center gap-2 pb-2 border-b-2 font-semibold transition-all ${
              pasoActual === 2
                ? 'border-aurea-copper text-aurea-copper'
                : 'border-transparent text-aurea-navy/50 hover:text-aurea-navy'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              pasoActual === 2 ? 'bg-aurea-copper text-white' : 'bg-gray-100 text-aurea-navy/60'
            }`}>
              2
            </span>
            <span>Receta e Insumos (Motor Dual) *</span>
          </button>
        </div>

        {/* Mensaje de Error Asistido */}
        {errorValidacion && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* Formulario con Pasos */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ========================================================================= */}
          {/* PASO 1: DATOS COMERCIALES */}
          {/* ========================================================================= */}
          {pasoActual === 1 && (
            <div className="space-y-4">
              {/* Categoría Obligatoria */}
              <div>
                <label className="block text-xs font-semibold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Categoría de la Carta <span className="text-rose-600">*</span>
                </label>
                {categorias.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span>No tienes categorías registradas aún.</span>
                    {onIrACategorias && (
                      <button
                        type="button"
                        onClick={onIrACategorias}
                        className="font-bold underline text-aurea-copper hover:text-aurea-copper/80"
                      >
                        Crear en CU-ADMIN-02
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/60 text-sm text-aurea-navy bg-white focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 outline-none"
                  >
                    <option value="">Selecciona una categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Nombre del Plato */}
              <div>
                <label className="block text-xs font-semibold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Nombre del Plato / Bebida <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Lomo Saltado Criollo, Ceviche Clásico..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-aurea-champagne/60 text-sm text-aurea-navy focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 outline-none"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Descripción Comercial (Opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve reseña que verán los clientes en la carta digital..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-aurea-champagne/60 text-sm text-aurea-navy focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 outline-none resize-none"
                />
              </div>

              {/* Precio de Venta */}
              <div>
                <label className="block text-xs font-semibold text-aurea-navy uppercase tracking-wider mb-1.5">
                  Precio de Venta (PEN) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-aurea-navy/60">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={precio}
                    onChange={(e) => setPrecio(Math.max(0, parseFloat(e.target.value) || 0))}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-aurea-champagne/60 text-base font-serif font-bold text-aurea-navy focus:border-aurea-copper focus:ring-2 focus:ring-aurea-copper/20 outline-none"
                  />
                </div>
              </div>

              {/* Destino Operativo / Despacho */}
              <div className="p-4 rounded-2xl bg-aurea-champagne/15 border border-aurea-champagne/40 space-y-2">
                <label className="block text-xs font-bold text-aurea-navy uppercase tracking-wider">
                  Destino Operativo / Despacho
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      requierePreparacion
                        ? 'bg-white border-aurea-copper shadow-xs'
                        : 'bg-white/60 border-aurea-champagne/60 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destino"
                      checked={requierePreparacion}
                      onChange={() => setRequierePreparacion(true)}
                      className="mt-1 text-aurea-copper focus:ring-aurea-copper"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-aurea-navy">
                        <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cocina (KDS)</span>
                      </div>
                      <p className="text-[11px] text-aurea-navy/60 mt-0.5">
                        Requiere cocción en fogones. Se envía a pantalla de cocina.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      !requierePreparacion
                        ? 'bg-white border-aurea-copper shadow-xs'
                        : 'bg-white/60 border-aurea-champagne/60 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destino"
                      checked={!requierePreparacion}
                      onChange={() => setRequierePreparacion(false)}
                      className="mt-1 text-aurea-copper focus:ring-aurea-copper"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-aurea-navy">
                        <Zap className="w-3.5 h-3.5 text-sky-600" />
                        <span>Despacho Directo</span>
                      </div>
                      <p className="text-[11px] text-aurea-navy/60 mt-0.5">
                        Gaseosas, bebidas, licores o postres servidos por mozo/barra.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: RECETA E INSUMOS (MOTOR DUAL) */}
          {/* ========================================================================= */}
          {pasoActual === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-aurea-navy">
                    Receta e Insumos a Descontar
                  </h3>
                  <p className="text-[11px] text-aurea-navy/60">
                    Elige el modo más cómodo: rendimiento por lote o cantidad directa exacta:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAgregarInsumo}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-aurea-copper/15 hover:bg-aurea-copper/25 text-aurea-copper text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Insumo</span>
                </button>
              </div>

              {recetaItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-aurea-champagne/15 border border-dashed border-aurea-champagne/60 text-center">
                  <UtensilsCrossed className="w-8 h-8 mx-auto text-aurea-navy/40 mb-2" />
                  <p className="text-xs font-semibold text-aurea-navy">No has vinculado insumos aún</p>
                  <p className="text-[11px] text-aurea-navy/60 mt-0.5">
                    Haz clic en "Agregar Insumo" para asociar ingredientes de inventario a este plato.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recetaItems.map((item, idx) => {
                    const insumoObj = insumosDisponibles.find((i) => i.id === item.insumo_id);
                    const unidad = insumoObj ? insumoObj.unidad_medida : 'und';
                    const costoUnitario = insumoObj ? insumoObj.costo_unitario : 0;

                    let dosisReal = item.cantidad_descuenta;
                    if (item.modo_calculo === 'rendimiento' && item.rendimiento_platos > 0) {
                      dosisReal = 1 / item.rendimiento_platos;
                    }
                    const costoPlato = dosisReal * costoUnitario;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white border border-aurea-champagne/60 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Selector de Insumo */}
                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-aurea-navy/70 mb-1">
                              Insumo de Bodega
                            </label>
                            <select
                              value={item.insumo_id}
                              onChange={(e) => handleActualizarItem(idx, 'insumo_id', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-aurea-champagne/60 text-xs text-aurea-navy bg-white focus:border-aurea-copper outline-none"
                            >
                              {insumosDisponibles.map((ins) => (
                                <option key={ins.id} value={ins.id}>
                                  {ins.nombre} ({ins.unidad_medida}) - S/ {ins.costo_unitario.toFixed(2)}/{ins.unidad_medida}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Botón Eliminar Fila */}
                          <button
                            type="button"
                            onClick={() => handleEliminarInsumo(idx)}
                            className="mt-5 p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Eliminar insumo de la receta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Motor Dual: Selector de Modo y Dosificación */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-aurea-champagne/30 text-xs">
                          {/* Conmutador Modo de Cálculo */}
                          <div>
                            <label className="block text-[11px] font-semibold text-aurea-navy/70 mb-1">
                              Modo de Cálculo
                            </label>
                            <div className="flex rounded-xl bg-aurea-champagne/20 p-1 border border-aurea-champagne/40">
                              <button
                                type="button"
                                onClick={() => handleActualizarItem(idx, 'modo_calculo', 'rendimiento')}
                                className={`flex-1 py-1 rounded-lg text-center text-[11px] font-semibold transition-all ${
                                  item.modo_calculo === 'rendimiento'
                                    ? 'bg-white text-aurea-navy shadow-xs'
                                    : 'text-aurea-navy/60 hover:text-aurea-navy'
                                }`}
                              >
                                Rinde por Lote
                              </button>
                              <button
                                type="button"
                                onClick={() => handleActualizarItem(idx, 'modo_calculo', 'exacto')}
                                className={`flex-1 py-1 rounded-lg text-center text-[11px] font-semibold transition-all ${
                                  item.modo_calculo === 'exacto'
                                    ? 'bg-white text-aurea-navy shadow-xs'
                                    : 'text-aurea-navy/60 hover:text-aurea-navy'
                                }`}
                              >
                                Cantidad Directa
                              </button>
                            </div>
                          </div>

                          {/* Input de Valor según Modo */}
                          <div>
                            {item.modo_calculo === 'rendimiento' ? (
                              <div>
                                <label className="block text-[11px] font-semibold text-aurea-navy/70 mb-1">
                                  1 {unidad} rinde:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.rendimiento_platos}
                                    onChange={(e) =>
                                      handleActualizarItem(
                                        idx,
                                        'rendimiento_platos',
                                        Math.max(1, parseInt(e.target.value) || 1)
                                      )
                                    }
                                    className="w-full px-3 py-1.5 rounded-xl border border-aurea-champagne/60 text-xs text-aurea-navy focus:border-aurea-copper outline-none"
                                  />
                                  <span className="text-xs text-aurea-navy/70 font-medium whitespace-nowrap">
                                    platos
                                  </span>
                                </div>
                                <span className="text-[10px] text-aurea-navy/50 mt-0.5 block">
                                  Dosis: {(1 / item.rendimiento_platos).toFixed(5)} {unidad}/plato
                                </span>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-[11px] font-semibold text-aurea-navy/70 mb-1">
                                  Descuenta por plato:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
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
                                    className="w-full px-3 py-1.5 rounded-xl border border-aurea-champagne/60 text-xs text-aurea-navy focus:border-aurea-copper outline-none"
                                  />
                                  <span className="text-xs text-aurea-navy/70 font-medium whitespace-nowrap">
                                    {unidad}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Costo por Plato resultante */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-aurea-navy/70">
                          <span>Costo teórico por ración:</span>
                          <span className="font-serif font-bold text-aurea-navy">
                            S/ {costoPlato.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Barra de Rentabilidad en Vivo (LiveProfitabilityBar) */}
        <div className="px-6 py-3 bg-aurea-champagne/20 border-t border-aurea-champagne/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-aurea-navy/60 block">Precio</span>
              <span className="font-serif font-bold text-aurea-navy text-sm">
                S/ {precio.toFixed(2)}
              </span>
            </div>
            <div className="h-6 w-px bg-aurea-champagne/60" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-aurea-navy/60 block">Costo Receta</span>
              <span className="font-medium text-aurea-navy text-sm">
                S/ {costoTotalTeorico.toFixed(2)}
              </span>
            </div>
            <div className="h-6 w-px bg-aurea-champagne/60" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-aurea-navy/60 block">Utilidad Bruta</span>
              <span className="font-medium text-emerald-700 text-sm">
                S/ {utilidadTeorica.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-aurea-navy">Margen:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
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
        </div>

        {/* Pie del Modal con Navegación de Pasos */}
        <div className="p-4 border-t border-aurea-champagne/40 bg-white flex items-center justify-between">
          {pasoActual === 2 ? (
            <button
              type="button"
              onClick={() => setPasoActual(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-aurea-champagne/60 text-aurea-navy text-xs font-semibold hover:bg-aurea-champagne/20 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 rounded-xl text-aurea-navy/70 hover:text-aurea-navy text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
          )}

          {pasoActual === 1 ? (
            <button
              type="button"
              onClick={handleAvanzarPaso}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-aurea-copper hover:bg-aurea-copper/90 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>Siguiente: Receta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={guardando}
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
                  <span>Guardar Plato y Receta</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
