import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Receipt,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Loader2,
  TrendingUp,
  TrendingDown,
  Info,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  PlusCircle,
  Check,
  PackageSearch,
  RotateCcw,
} from 'lucide-react';
import {
  TipoComprobanteCompra,
  MetodoPagoCompra,
  ItemCompraRequestDTO,
  RegistrarFichaCompraRequestDTO,
  ProveedorResumenDTO,
  InsumoAdminDTO,
  InsumoHabitualDTO,
  PlatoReactivableDTO,
  FichaCompraResumenDTO,
} from '@/types/admin';
import { adminService } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import { generarEnlaceWhatsApp } from '@/shared/utils';
import { ModalProveedorAlVuelo } from './ModalProveedorAlVuelo';
import { SelectorInsumoSearchable, InsumoSeleccionable } from './SelectorInsumoSearchable';

interface ModalRegistrarCompraProps {
  abierto: boolean;
  onCerrar: () => void;
  onCompraRegistrada: (ficha: FichaCompraResumenDTO, platosReactivables: PlatoReactivableDTO[]) => void;
}

interface LineaFormItem {
  id_temp: string;
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  costo_anterior: number;
}

export const ModalRegistrarCompra: React.FC<ModalRegistrarCompraProps> = ({
  abierto,
  onCerrar,
  onCompraRegistrada,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const localId = usuario?.local?.id || '';

  const [proveedores, setProveedores] = useState<ProveedorResumenDTO[]>([]);

  // Form State
  const [proveedorId, setProveedorId] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobanteCompra>('FACTURA');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCompra>('TRANSFERENCIA');
  const [observaciones, setObservaciones] = useState('');

  // Líneas de insumos en la compra (inicia vacía)
  const [lineas, setLineas] = useState<LineaFormItem[]>([]);

  // Sub-modal proveedor al vuelo
  const [abrirModalNuevoProv, setAbrirModalNuevoProv] = useState(false);

  // Estados de carga y validación
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const requiereNumeroComprobante = (tipo: TipoComprobanteCompra): boolean => {
    return tipo === 'FACTURA' || tipo === 'BOLETA' || tipo === 'GUIA_REMISION';
  };

  const handleCambioTipoComprobante = (tipo: TipoComprobanteCompra) => {
    setTipoComprobante(tipo);
    if (!requiereNumeroComprobante(tipo)) {
      setNumeroComprobante('');
    }
  };

  // Reseteo limpio al abrir
  useEffect(() => {
    if (abierto) {
      setLineas([]);
      setNumeroComprobante('');
      setObservaciones('');
      setErrorValidacion(null);
      setErrorCarga(null);
      setTipoComprobante('FACTURA');
      setMetodoPago('TRANSFERENCIA');
      setFechaEmision(new Date().toISOString().split('T')[0]);
      cargarCatalogos();
    }
  }, [abierto]);

  // Búsqueda remota dinámica en catálogo con debounce (evita precargar 200+ insumos)
  const buscarCatalogo = useCallback(
    async (termino: string): Promise<InsumoAdminDTO[]> => {
      if (!termino.trim() || termino.trim().length < 2) return [];
      try {
        const res = await adminService.obtenerInsumos(localId, 'activo', termino.trim(), 1, 15);
        if (res.exito && res.datos) {
          return res.datos.insumos;
        }
      } catch (err) {
        console.error('Error buscando insumos en catálogo:', err);
      }
      return [];
    },
    [localId]
  );

  const cargarCatalogos = async () => {
    if (!localId) {
      setErrorCarga("No se identificó una sede activa en la sesión del usuario. Por favor verifique su local asignado.");
      setCargandoCatalogos(false);
      return;
    }
    setCargandoCatalogos(true);
    setErrorCarga(null);
    try {
      const resProv = await adminService.getProveedores(localId, { estado: 'activos', limite: 100 });

      if (resProv.exito && resProv.datos) {
        const lista = resProv.datos.proveedores;
        setProveedores(lista);
        if (lista.length > 0) {
          if (!proveedorId || !lista.some((p: ProveedorResumenDTO) => p.id === proveedorId)) {
            setProveedorId(lista[0].id);
          }
        }
        // Insumos habituales NO se autoseleccionan: las líneas inician vacías []
      } else {
        setErrorCarga('No se pudieron cargar los proveedores comerciales.');
      }
    } catch {
      setErrorCarga('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const proveedorSeleccionado = proveedores.find((p) => p.id === proveedorId);
  const insumosHabituales = proveedorSeleccionado?.insumos_habituales || [];

  const handleCambioProveedor = (id: string) => {
    setProveedorId(id);
  };

  const handleProveedorCreado = (nuevoProv: ProveedorResumenDTO) => {
    setProveedores((prev) => [nuevoProv, ...prev]);
    setProveedorId(nuevoProv.id);
  };

  const handleCambioInsumoLinea = (
    index: number,
    insumo: InsumoSeleccionable,
    esHabitual: boolean
  ) => {
    const hab = insumosHabituales.find((h) => h.insumo_id === insumo.id);
    const precioSugerido =
      esHabitual && hab && hab.ultimo_precio > 0
        ? hab.ultimo_precio
        : insumo.costo_unitario > 0
        ? insumo.costo_unitario
        : (hab?.ultimo_precio || 0);

    setLineas((prev) => {
      const copy = [...prev];
      const cantidad = copy[index]?.cantidad || 1;
      copy[index] = {
        id_temp: copy[index]?.id_temp || `temp-${Date.now()}-${index}`,
        insumo_id: insumo.id,
        insumo_nombre: insumo.nombre,
        unidad_medida: insumo.unidad_medida,
        cantidad,
        precio_unitario: precioSugerido,
        subtotal: Number((cantidad * precioSugerido).toFixed(2)),
        costo_anterior: insumo.costo_unitario > 0 ? insumo.costo_unitario : precioSugerido,
      };
      return copy;
    });
  };

  const handleCambioCantidad = (index: number, valor: string) => {
    setLineas((prev) => {
      const copy = [...prev];
      const parsed = parseFloat(valor);
      const c = isNaN(parsed) ? 0 : Math.max(0, parsed);
      copy[index] = {
        ...copy[index],
        cantidad: c,
        subtotal: Number((c * copy[index].precio_unitario).toFixed(2)),
      };
      return copy;
    });
  };

  const handleCambioPrecioUnitario = (index: number, valor: string) => {
    setLineas((prev) => {
      const copy = [...prev];
      const parsed = parseFloat(valor);
      const p = isNaN(parsed) ? 0 : Math.max(0, parsed);
      copy[index] = {
        ...copy[index],
        precio_unitario: p,
        subtotal: Number((copy[index].cantidad * p).toFixed(2)),
      };
      return copy;
    });
  };

  const handleAgregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        id_temp: `temp-${Date.now()}-${prev.length + 1}`,
        insumo_id: '',
        insumo_nombre: '',
        unidad_medida: 'UNID',
        cantidad: 1,
        precio_unitario: 0,
        subtotal: 0,
        costo_anterior: 0,
      },
    ]);
  };

  // Toggle rápido de insumo habitual: clic agrega, clic de nuevo quita
  const handleToggleHabitual = (hab: InsumoHabitualDTO) => {
    const yaEnTabla = lineas.some((l) => l.insumo_id === hab.insumo_id);

    if (yaEnTabla) {
      setLineas((prev) => prev.filter((l) => l.insumo_id !== hab.insumo_id));
    } else {
      const precio = hab.ultimo_precio > 0 ? hab.ultimo_precio : 0;
      setLineas((prev) => {
        // Si hay una única línea vacía sin insumo seleccionado, reemplazarla
        if (prev.length === 1 && !prev[0].insumo_id) {
          return [
            {
              id_temp: prev[0].id_temp,
              insumo_id: hab.insumo_id,
              insumo_nombre: hab.nombre,
              unidad_medida: hab.unidad_medida,
              cantidad: 1,
              precio_unitario: precio,
              subtotal: Number((1 * precio).toFixed(2)),
              costo_anterior: precio,
            },
          ];
        }

        return [
          ...prev,
          {
            id_temp: `temp-${Date.now()}-${prev.length + 1}`,
            insumo_id: hab.insumo_id,
            insumo_nombre: hab.nombre,
            unidad_medida: hab.unidad_medida,
            cantidad: 1,
            precio_unitario: precio,
            subtotal: Number((1 * precio).toFixed(2)),
            costo_anterior: precio,
          },
        ];
      });
    }
  };

  const handleAgregarTodosHabituales = () => {
    if (insumosHabituales.length === 0) return;

    const idsActuales = new Set(lineas.filter((l) => l.insumo_id).map((l) => l.insumo_id));
    const faltantes = insumosHabituales.filter((h) => !idsActuales.has(h.insumo_id));
    if (faltantes.length === 0) return;

    const nuevasLineas: LineaFormItem[] = faltantes.map((hab, idx) => {
      const precio = hab.ultimo_precio > 0 ? hab.ultimo_precio : 0;
      return {
        id_temp: `temp-${Date.now()}-${idx + 1}`,
        insumo_id: hab.insumo_id,
        insumo_nombre: hab.nombre,
        unidad_medida: hab.unidad_medida,
        cantidad: 1,
        precio_unitario: precio,
        subtotal: Number((1 * precio).toFixed(2)),
        costo_anterior: precio,
      };
    });

    setLineas((prev) => {
      const lineasValidas = prev.filter((l) => l.insumo_id);
      return [...lineasValidas, ...nuevasLineas];
    });
  };

  const handleLimpiarTabla = () => {
    setLineas([]);
  };

  const handleEliminarLinea = (index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculos contables en tiempo real
  const totalCalculado = Number(
    lineas.reduce((acc, it) => acc + (it.subtotal || 0), 0).toFixed(2)
  );

  let subtotalNeto = totalCalculado;
  let igvMonto = 0;
  if (tipoComprobante === 'FACTURA') {
    subtotalNeto = Number((totalCalculado / 1.18).toFixed(2));
    igvMonto = Number((totalCalculado - subtotalNeto).toFixed(2));
  }

  // Validación de estado de habilitación para el botón de guardado
  const todosInsumosValidos =
    lineas.length > 0 &&
    lineas.every((l) => Boolean(l.insumo_id) && l.cantidad > 0 && l.precio_unitario > 0);

  const comprobanteValido =
    !requiereNumeroComprobante(tipoComprobante) || Boolean(numeroComprobante.trim());

  const puedeGuardar =
    !guardando &&
    !cargandoCatalogos &&
    Boolean(proveedorId) &&
    todosInsumosValidos &&
    comprobanteValido &&
    totalCalculado > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!proveedorId) {
      setErrorValidacion('Debe seleccionar o registrar un proveedor comercial.');
      return;
    }

    if (requiereNumeroComprobante(tipoComprobante) && !numeroComprobante.trim()) {
      const etiqueta =
        tipoComprobante === 'FACTURA'
          ? 'Las facturas'
          : tipoComprobante === 'BOLETA'
          ? 'Las boletas'
          : 'Las guías de remisión';
      setErrorValidacion(`${etiqueta} requieren ingresar obligatoriamente la serie y número de comprobante físico.`);
      return;
    }

    if (lineas.length === 0) {
      setErrorValidacion('Debe registrar al menos un insumo en la compra.');
      return;
    }

    for (const l of lineas) {
      if (!l.insumo_id) {
        setErrorValidacion('Hay una línea en la tabla sin insumo seleccionado. Seleccione un insumo o elimine la fila.');
        return;
      }
      if (l.cantidad <= 0 || l.precio_unitario <= 0) {
        setErrorValidacion(`La línea "${l.insumo_nombre || 'sin nombre'}" debe tener cantidad y precio unitario mayores a cero.`);
        return;
      }
    }

    try {
      setGuardando(true);
      const itemsPayload: ItemCompraRequestDTO[] = lineas.map((l) => ({
        insumo_id: l.insumo_id,
        insumo_nombre: l.insumo_nombre,
        unidad_medida: l.unidad_medida,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
        costo_anterior: l.costo_anterior,
      }));

      const req: RegistrarFichaCompraRequestDTO = {
        proveedor_id: proveedorId,
        tipo_comprobante: tipoComprobante,
        numero_comprobante: requiereNumeroComprobante(tipoComprobante)
          ? numeroComprobante.trim() || undefined
          : undefined,
        fecha_emision: fechaEmision,
        metodo_pago: metodoPago,
        observaciones: observaciones.trim() || undefined,
        items: itemsPayload,
      };

      const res = await adminService.registrarFichaCompra(req);

      if (res.exito && res.datos) {
        // Auto-aprendizaje reactivo: asociar los insumos comprados a los habituales del proveedor seleccionado en memoria
        setProveedores((prev) =>
          prev.map((p) => {
            if (p.id !== proveedorId) return p;
            const habs = [...(p.insumos_habituales || [])];
            for (const l of lineas) {
              const idx = habs.findIndex((h) => h.insumo_id === l.insumo_id);
              if (idx >= 0) {
                habs[idx] = { ...habs[idx], ultimo_precio: l.precio_unitario };
              } else {
                habs.push({
                  insumo_id: l.insumo_id,
                  nombre: l.insumo_nombre,
                  unidad_medida: l.unidad_medida,
                  ultimo_precio: l.precio_unitario,
                });
              }
            }
            return { ...p, insumos_habituales: habs };
          })
        );

        onCompraRegistrada(res.datos.ficha, res.datos.platosReactivables);
        onCerrar();
      } else {
        setErrorValidacion(res.errores?.[0]?.mensaje || 'Error al procesar la ficha de compra.');
      }
    } catch {
      setErrorValidacion('Ocurrió un error inesperado al registrar la compra.');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl my-auto overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-aurea-navy text-white shadow-md shadow-aurea-navy/20">
                <Receipt className="w-5 h-5 text-aurea-champagne" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Registrar Ficha de Compra de Insumos
                </h2>
                <p className="text-xs text-gray-500">
                  Ingreso de insumos al inventario y liquidación contable de comprobante
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body o Pantalla de Carga */}
          {cargandoCatalogos ? (
            <div className="py-24 px-6 flex flex-col items-center justify-center text-center space-y-3 flex-1">
              <div className="p-4 rounded-2xl bg-aurea-navy/5 text-aurea-navy animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-aurea-navy" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                Cargando configuración de compra
              </h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Obteniendo proveedores comerciales y catálogo de compras...
              </p>
            </div>
          ) : errorCarga ? (
            <div className="py-20 px-6 flex flex-col items-center justify-center text-center space-y-3 flex-1">
              <div className="p-3.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                No se pudo cargar la información
              </h3>
              <p className="text-xs text-gray-600 max-w-md">{errorCarga}</p>
              <button
                type="button"
                onClick={cargarCatalogos}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-aurea-navy hover:bg-aurea-navy/90 text-white rounded-xl text-xs font-semibold shadow transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
              {errorValidacion && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorValidacion}</span>
                </div>
              )}

              {/* SECCIÓN 1: PROVEEDOR */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-aurea-navy" />
                    <span>Proveedor Comercial</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAbrirModalNuevoProv(true)}
                    className="inline-flex items-center gap-1 text-xs text-aurea-navy font-semibold hover:text-aurea-copper transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Proveedor al vuelo</span>
                  </button>
                </div>

                <div>
                  <select
                    value={proveedorId}
                    onChange={(e) => handleCambioProveedor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-800 focus:ring-2 focus:ring-aurea-navy focus:outline-none"
                  >
                    {proveedores.length === 0 ? (
                      <option value="">No hay proveedores registrados</option>
                    ) : (
                      proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.contacto ? `(${p.contacto})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Ficha de sólo lectura del proveedor seleccionado */}
                {proveedorSeleccionado && (
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-2.5 border-t border-gray-200/80 text-xs text-gray-600">
                    {proveedorSeleccionado.contacto && (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          Contacto: <strong className="font-medium text-gray-900">{proveedorSeleccionado.contacto}</strong>
                        </span>
                      </div>
                    )}

                    {proveedorSeleccionado.telefono && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono text-gray-900">{proveedorSeleccionado.telefono}</span>
                        <a
                          href={generarEnlaceWhatsApp(
                            proveedorSeleccionado.telefono,
                            'Hola, nos comunicamos desde RestaurantCloud sobre la orden de compra.'
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                          title="Abrir chat de WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}

                    {proveedorSeleccionado.direccion && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-xs">{proveedorSeleccionado.direccion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: DATOS DEL COMPROBANTE */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  requiereNumeroComprobante(tipoComprobante) ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                } gap-3`}
              >
                {/* Tipo Comprobante */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    value={tipoComprobante}
                    onChange={(e) => handleCambioTipoComprobante(e.target.value as TipoComprobanteCompra)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-aurea-navy focus:outline-none"
                  >
                    <option value="FACTURA">Factura (IGV 18%)</option>
                    <option value="BOLETA">Boleta de Venta</option>
                    <option value="NOTA_VENTA">Nota de Venta</option>
                    <option value="GUIA_REMISION">Guía de Remisión</option>
                    <option value="RECIBO">Recibo Simple</option>
                  </select>
                  {!requiereNumeroComprobante(tipoComprobante) && (
                    <span className="text-[11px] text-gray-500 block mt-1">
                      Operación sin serie fiscal. Se registrará automáticamente como S/N.
                    </span>
                  )}
                </div>

                {/* Número de Comprobante */}
                {requiereNumeroComprobante(tipoComprobante) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      N° Comprobante <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={numeroComprobante}
                      onChange={(e) => setNumeroComprobante(e.target.value)}
                      placeholder={
                        tipoComprobante === 'FACTURA'
                          ? 'Ej: F001-0004921'
                          : tipoComprobante === 'BOLETA'
                          ? 'Ej: B001-0001092'
                          : 'Ej: T001-0000312'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aurea-navy focus:outline-none font-mono"
                    />
                  </div>
                )}

                {/* Fecha Emisión */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aurea-navy focus:outline-none"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as MetodoPagoCompra)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-aurea-navy focus:outline-none"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="YAPE_PLIN">Billetera Digital (Yape / Plin)</option>
                    <option value="EFECTIVO">Efectivo de Caja Chica</option>
                    <option value="CREDITO_30D">Crédito Comercial (30 Días)</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN 3: TABLA DE INSUMOS COMPRADOS */}
              <div className={`space-y-3 ${!proveedorId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Insumos y Costos Unitarios
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold border border-gray-200">
                      {lineas.length === 1 ? '1 insumo' : `${lineas.length} insumos`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lineas.length > 0 && (
                      <button
                        type="button"
                        onClick={handleLimpiarTabla}
                        className="text-[11px] font-medium text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        Vaciar tabla
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAgregarLinea}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Insumo</span>
                    </button>
                  </div>
                </div>

                {/* Panel de Píldoras de Insumos Habituales (Interactivo: Clic agrega / Clic de nuevo quita) */}
                {insumosHabituales.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />
                        <span>Insumos habituales de {proveedorSeleccionado?.nombre}</span>
                        <span className="text-[11px] text-amber-700/80 font-normal">
                          (haz clic para añadir o quitar)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAgregarTodosHabituales}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Añadir todos</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {insumosHabituales.map((hab) => {
                        const yaEnTabla = lineas.some((l) => l.insumo_id === hab.insumo_id);
                        return (
                          <button
                            key={hab.insumo_id}
                            type="button"
                            onClick={() => handleToggleHabitual(hab)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              yaEnTabla
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs hover:bg-amber-200/80'
                                : 'bg-white text-gray-800 border border-amber-200 hover:bg-amber-100/70 hover:border-amber-300 shadow-2xs active:scale-95'
                            }`}
                            title={yaEnTabla ? `Quitar ${hab.nombre} de la compra` : `Añadir ${hab.nombre} a la compra`}
                          >
                            {yaEnTabla ? (
                              <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                            ) : (
                              <Plus className="w-3 h-3 text-amber-700 shrink-0" />
                            )}
                            <span>{hab.nombre}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({hab.unidad_medida})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tabla o Estado en Reposo (Desactivada / Vacía al inicio) */}
                {lineas.length === 0 ? (
                  <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-400 mb-2">
                      <PackageSearch className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">
                      No hay insumos añadidos a la orden de compra
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-sm mt-0.5 mb-3">
                      Haz clic en cualquiera de los insumos habituales sugeridos arriba o pulsa el botón para buscar en el catálogo general.
                    </p>
                    <button
                      type="button"
                      onClick={handleAgregarLinea}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-aurea-navy hover:bg-aurea-navy/90 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-aurea-champagne" />
                      <span>Agregar Insumo</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold rounded-t-xl">
                        <tr>
                          <th className="py-2.5 px-3 min-w-[240px]">Insumo</th>
                          <th className="py-2.5 px-3 w-28">Cantidad</th>
                          <th className="py-2.5 px-3 w-32">Precio Unitario (S/)</th>
                          <th className="py-2.5 px-3 w-32">Variación Costo</th>
                          <th className="py-2.5 px-3 w-32 text-right">Subtotal (S/)</th>
                          <th className="py-2.5 px-2 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lineas.map((linea, index) => {
                          const variacion =
                            linea.costo_anterior > 0
                              ? ((linea.precio_unitario - linea.costo_anterior) / linea.costo_anterior) * 100
                              : 0;

                          return (
                            <tr key={linea.id_temp} className="hover:bg-gray-50/50">
                              {/* Selector de Insumo con Buscador Dinámico */}
                              <td className="py-2 px-3">
                                <SelectorInsumoSearchable
                                  insumosHabituales={insumosHabituales}
                                  insumoIdSeleccionado={linea.insumo_id}
                                  insumoNombreSeleccionado={linea.insumo_nombre}
                                  unidadMedidaSeleccionada={linea.unidad_medida}
                                  onBuscarCatalogoRemoto={buscarCatalogo}
                                  onSeleccionar={(insumo, esHabitual) =>
                                    handleCambioInsumoLinea(index, insumo, esHabitual)
                                  }
                                />
                              </td>

                              {/* Cantidad */}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    required
                                    value={linea.cantidad === 0 ? '' : linea.cantidad}
                                    onChange={(e) => handleCambioCantidad(index, e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-aurea-navy font-mono"
                                  />
                                  <span className="text-[11px] text-gray-400 font-mono">{linea.unidad_medida}</span>
                                </div>
                              </td>

                              {/* Precio Unitario */}
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  required
                                  value={linea.precio_unitario === 0 ? '' : linea.precio_unitario}
                                  onChange={(e) => handleCambioPrecioUnitario(index, e.target.value)}
                                  placeholder="0.00"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-aurea-navy font-mono"
                                />
                              </td>

                              {/* Variación de Costo */}
                              <td className="py-2 px-3 whitespace-nowrap">
                                {variacion === 0 ? (
                                  <span className="text-[11px] text-gray-400">Sin variación</span>
                                ) : variacion > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    <TrendingUp className="w-3 h-3" />
                                    +{variacion.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    <TrendingDown className="w-3 h-3" />
                                    {variacion.toFixed(1)}%
                                  </span>
                                )}
                              </td>

                              {/* Subtotal */}
                              <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                                S/ {linea.subtotal.toFixed(2)}
                              </td>

                              {/* Botón Eliminar */}
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEliminarLinea(index)}
                                  className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                  title="Quitar línea"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECCIÓN 4: TOTALES Y LIQUIDACIÓN CONTABLE */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-600 max-w-md">
                  {tipoComprobante === 'FACTURA' ? (
                    <div className="flex items-start gap-2 text-indigo-800 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Comprobante con IGV desglosado:</strong> Base imponible (S/ {subtotalNeto.toFixed(2)}) + IGV 18% (S/ {igvMonto.toFixed(2)}) computados para crédito fiscal.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-gray-600">
                      <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        Comprobante no gravado con IGV discriminado. El total ingresará como costo íntegro de adquisición.
                      </span>
                    </div>
                  )}
                </div>

                {/* Box de Totales */}
                <div className="w-full sm:w-64 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-1.5 text-xs">
                  {tipoComprobante === 'FACTURA' && (
                    <>
                      <div className="flex justify-between text-gray-500 font-mono">
                        <span>Subtotal Neto:</span>
                        <span>S/ {subtotalNeto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-700 font-mono font-medium">
                        <span>IGV (18%):</span>
                        <span>S/ {igvMonto.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-100 my-1" />
                    </>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Total a Pagar:</span>
                    <span className="text-base text-aurea-navy font-mono">
                      S/ {totalCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observaciones Opcionales */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observaciones / Notas de Despacho (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Despacho recibido conforme en almacén central por el jefe de cocina..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-aurea-navy focus:outline-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-500 text-center sm:text-left">
                  {!puedeGuardar && !guardando && (
                    <span className="text-[11px] text-gray-400">
                      {lineas.length === 0
                        ? 'Agrega al menos un insumo para guardar la compra.'
                        : !proveedorId
                        ? 'Selecciona un proveedor comercial.'
                        : requiereNumeroComprobante(tipoComprobante) && !numeroComprobante.trim()
                        ? 'Ingresa el número de comprobante.'
                        : !todosInsumosValidos
                        ? 'Verifica que todos los insumos tengan precio y cantidad mayores a cero.'
                        : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onCerrar}
                    disabled={guardando}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!puedeGuardar}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-aurea-navy hover:bg-aurea-navy/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-aurea-navy/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    {guardando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-aurea-champagne" />
                        <span>Procesando Ficha...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-aurea-champagne" />
                        <span>Guardar y Reponer Stock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Submodal Proveedor al Vuelo */}
      <ModalProveedorAlVuelo
        abierto={abrirModalNuevoProv}
        onCerrar={() => setAbrirModalNuevoProv(false)}
        onProveedorCreado={handleProveedorCreado}
      />
    </>
  );
};
