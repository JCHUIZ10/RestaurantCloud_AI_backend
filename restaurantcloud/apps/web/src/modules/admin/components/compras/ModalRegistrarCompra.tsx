import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Truck,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  Check,
  PackageSearch,
  Package,
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
import { generarEnlaceWhatsApp, cn } from '@/shared/utils';
import { Button, EstadoError, IconButton, Modal, Skeleton } from '@/components/ui';
import { ModalProveedorAlVuelo } from './ModalProveedorAlVuelo';
import { SelectorInsumoSearchable, InsumoSeleccionable } from './SelectorInsumoSearchable';
import { VariacionCosto } from './etiquetasCompra';
import { METODOS_PAGO, TIPOS_COMPROBANTE, soles } from './formatoCompra';

interface ModalRegistrarCompraProps {
  abierto: boolean;
  onCerrar: () => void;
  onCompraRegistrada: (ficha: FichaCompraResumenDTO, platosReactivables: PlatoReactivableDTO[]) => void;
}

const CLASE_CONTROL =
  'w-full min-h-tactil px-3.5 bg-white border border-aurea-champagne/70 rounded-xl text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';
const CLASE_ROTULO = 'block text-sm font-semibold text-aurea-navy mb-1.5';
const CLASE_NUMERO =
  'w-full min-h-10 px-2.5 bg-white border border-aurea-champagne/70 rounded-lg text-right font-mono text-base md:text-sm text-aurea-navy placeholder:text-aurea-navy/40 focus:outline-none focus:border-aurea-copper';
// Columnas de la grilla de líneas en escritorio: insumo, cantidad, precio, variación, subtotal, quitar
const GRILLA_LINEAS = 'md:grid-cols-[minmax(0,1fr)_8.5rem_7.5rem_6rem_6.5rem_2.75rem]';

const PLACEHOLDER_NUMERO: Partial<Record<TipoComprobanteCompra, string>> = {
  FACTURA: 'Ej. F001-0004921',
  BOLETA: 'Ej. B001-0001092',
  GUIA_REMISION: 'Ej. T001-0000312',
};

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
  const idForm = useId();
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

  const motivoBloqueo =
    lineas.length === 0
      ? 'Agrega al menos un insumo.'
      : !proveedorId
        ? 'Elige un proveedor.'
        : requiereNumeroComprobante(tipoComprobante) && !numeroComprobante.trim()
          ? 'Falta el número de comprobante.'
          : !todosInsumosValidos
            ? 'Cada insumo necesita cantidad y precio mayores a cero.'
            : '';

  const listo = !cargandoCatalogos && !errorCarga;

  return (
    <>
      <Modal
        abierto={abierto}
        onCerrar={onCerrar}
        cerrable={!guardando}
        tamano="xl"
        icono={Receipt}
        titulo="Registrar compra"
        descripcion="Los insumos entran al inventario y su costo se actualiza al guardar."
        barra={
          listo && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 sm:px-6 py-2.5 bg-aurea-champagne/20">
              <span className="inline-flex items-center gap-1.5 text-sm text-aurea-navy/70">
                <Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                {lineas.length === 1 ? '1 insumo' : `${lineas.length} insumos`}
              </span>
              <span className="flex flex-wrap items-baseline justify-end gap-x-3 gap-y-0.5">
                {tipoComprobante === 'FACTURA' && totalCalculado > 0 && (
                  <span className="text-xs text-aurea-navy/60 tabular-nums">
                    Base {soles(subtotalNeto)} · <span className="font-semibold text-estado-ok-700">IGV {soles(igvMonto)}</span>
                  </span>
                )}
                <span className="text-sm font-semibold text-aurea-navy">
                  Total <span className="font-serif font-bold text-xl tabular-nums">{soles(totalCalculado)}</span>
                </span>
              </span>
            </div>
          )
        }
        pie={
          <>
            {listo && motivoBloqueo && !guardando && (
              <p className="text-xs text-aurea-navy/60 text-center sm:text-left sm:mr-auto">{motivoBloqueo}</p>
            )}
            <Button variant="outline" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={idForm}
              loading={guardando}
              disabled={!puedeGuardar}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}
            >
              Guardar y reponer stock
            </Button>
          </>
        }
      >
        {cargandoCatalogos ? (
          <div className="space-y-4" aria-busy="true" aria-label="Cargando proveedores">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : errorCarga ? (
          <EstadoError titulo="No se pudo preparar el registro" mensaje={errorCarga} onReintentar={cargarCatalogos} />
        ) : (
          <form id={idForm} onSubmit={handleSubmit} noValidate className="space-y-6">
            {errorValidacion && (
              <p role="alert" className="p-3 rounded-xl bg-estado-error-50 border border-estado-error-200 text-estado-error-800 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                {errorValidacion}
              </p>
            )}

            {/* Proveedor */}
            <section className="p-4 rounded-xl bg-aurea-ivory border border-aurea-champagne/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`${idForm}-prov`} className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
                  <Truck className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                  Proveedor
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAbrirModalNuevoProv(true)}
                  leftIcon={<Plus className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
                >
                  Nuevo proveedor
                </Button>
              </div>
              <select
                id={`${idForm}-prov`}
                value={proveedorId}
                onChange={(e) => handleCambioProveedor(e.target.value)}
                className={cn(CLASE_CONTROL, 'font-medium')}
              >
                {proveedores.length === 0 ? (
                  <option value="">Aún no hay proveedores; crea uno</option>
                ) : (
                  proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                      {p.contacto ? ` (${p.contacto})` : ''}
                    </option>
                  ))
                )}
              </select>

              {proveedorSeleccionado && (proveedorSeleccionado.contacto || proveedorSeleccionado.telefono || proveedorSeleccionado.direccion) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-aurea-navy/70">
                  {proveedorSeleccionado.contacto && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                      {proveedorSeleccionado.contacto}
                    </span>
                  )}
                  {proveedorSeleccionado.telefono && (
                    <span className="inline-flex items-center gap-2">
                      <a href={`tel:${proveedorSeleccionado.telefono}`} className="inline-flex items-center gap-1.5 font-mono hover:text-aurea-navy">
                        <Phone className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                        {proveedorSeleccionado.telefono}
                      </a>
                      <a
                        href={generarEnlaceWhatsApp(
                          proveedorSeleccionado.telefono,
                          'Hola, nos comunicamos desde RestaurantCloud sobre la orden de compra.'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Escribir por WhatsApp a ${proveedorSeleccionado.nombre}`}
                        className="min-h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-estado-ok-50 hover:bg-estado-ok-100 text-estado-ok-700 border border-estado-ok-200 text-xs font-semibold transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        WhatsApp
                      </a>
                    </span>
                  )}
                  {proveedorSeleccionado.direccion && (
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 text-aurea-copper shrink-0" aria-hidden="true" />
                      <span className="truncate max-w-xs">{proveedorSeleccionado.direccion}</span>
                    </span>
                  )}
                </div>
              )}
            </section>

            {/* Comprobante */}
            <section
              className={cn(
                'grid grid-cols-1 sm:grid-cols-2 gap-4',
                requiereNumeroComprobante(tipoComprobante) ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              )}
            >
              <div>
                <label htmlFor={`${idForm}-tipo`} className={CLASE_ROTULO}>
                  Comprobante
                </label>
                <select
                  id={`${idForm}-tipo`}
                  value={tipoComprobante}
                  onChange={(e) => handleCambioTipoComprobante(e.target.value as TipoComprobanteCompra)}
                  className={CLASE_CONTROL}
                >
                  {Object.entries(TIPOS_COMPROBANTE).map(([valor, { label }]) => (
                    <option key={valor} value={valor}>
                      {valor === 'FACTURA' ? `${label} (con IGV)` : label}
                    </option>
                  ))}
                </select>
                {!requiereNumeroComprobante(tipoComprobante) && (
                  <p className="mt-1 text-xs text-aurea-navy/60">Sin serie: se registra como S/N.</p>
                )}
              </div>

              {requiereNumeroComprobante(tipoComprobante) && (
                <div>
                  <label htmlFor={`${idForm}-num`} className={CLASE_ROTULO}>
                    Serie y número
                  </label>
                  <input
                    id={`${idForm}-num`}
                    type="text"
                    required
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    placeholder={PLACEHOLDER_NUMERO[tipoComprobante]}
                    className={cn(CLASE_CONTROL, 'font-mono')}
                  />
                </div>
              )}

              <div>
                <label htmlFor={`${idForm}-fecha`} className={CLASE_ROTULO}>
                  Fecha de emisión
                </label>
                <input
                  id={`${idForm}-fecha`}
                  type="date"
                  required
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  className={CLASE_CONTROL}
                />
              </div>

              <div>
                <label htmlFor={`${idForm}-pago`} className={CLASE_ROTULO}>
                  Forma de pago
                </label>
                <select
                  id={`${idForm}-pago`}
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPagoCompra)}
                  className={CLASE_CONTROL}
                >
                  {Object.entries(METODOS_PAGO).map(([valor, { label }]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Insumos */}
            <section className={cn('space-y-3', !proveedorId && 'opacity-50 pointer-events-none')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
                  <Package className="w-4 h-4 text-aurea-copper" aria-hidden="true" />
                  Insumos comprados
                </h3>
                <div className="flex items-center gap-1">
                  {lineas.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleLimpiarTabla}>
                      Vaciar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAgregarLinea}
                    leftIcon={<Plus className="w-4 h-4 text-aurea-copper" aria-hidden="true" />}
                  >
                    Agregar insumo
                  </Button>
                </div>
              </div>

              {insumosHabituales.length > 0 && (
                <div className="p-3 rounded-xl bg-aurea-champagne/20 border border-aurea-champagne space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-aurea-navy">
                      <Star className="w-4 h-4 text-aurea-copper fill-aurea-copper" aria-hidden="true" />
                      Lo que sueles comprarle
                    </p>
                    <button
                      type="button"
                      onClick={handleAgregarTodosHabituales}
                      className="min-h-9 px-2 rounded-lg text-xs font-semibold text-aurea-copper hover:text-aurea-navy hover:bg-aurea-champagne/40 transition-colors"
                    >
                      Añadir todos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {insumosHabituales.map((hab) => {
                      const yaEnTabla = lineas.some((l) => l.insumo_id === hab.insumo_id);
                      return (
                        <button
                          key={hab.insumo_id}
                          type="button"
                          aria-pressed={yaEnTabla}
                          onClick={() => handleToggleHabitual(hab)}
                          className={cn(
                            'min-h-9 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-sm font-medium transition-colors',
                            yaEnTabla
                              ? 'bg-aurea-navy text-white shadow-sm'
                              : 'bg-white border border-aurea-champagne text-aurea-navy hover:border-aurea-copper/60'
                          )}
                        >
                          {yaEnTabla ? (
                            <Check className="w-3.5 h-3.5 text-aurea-champagne" aria-hidden="true" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-aurea-copper" aria-hidden="true" />
                          )}
                          {hab.nombre}
                          <span className={cn('text-xs font-mono', yaEnTabla ? 'text-white/60' : 'text-aurea-navy/50')}>
                            {hab.unidad_medida}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {lineas.length === 0 ? (
                <div className="py-8 px-4 rounded-xl border-2 border-dashed border-aurea-copper/40 bg-aurea-ivory flex flex-col items-center text-center gap-2">
                  <span className="w-11 h-11 rounded-xl bg-aurea-champagne/40 text-aurea-navy flex items-center justify-center" aria-hidden="true">
                    <PackageSearch className="w-5 h-5" />
                  </span>
                  <p className="text-sm font-semibold text-aurea-navy">Aún no agregas insumos</p>
                  <p className="text-sm text-aurea-navy/60 max-w-sm">
                    {insumosHabituales.length > 0
                      ? 'Toca los habituales de arriba o busca cualquier insumo del catálogo.'
                      : 'Busca cualquier insumo de tu catálogo.'}
                  </p>
                  <Button size="sm" onClick={handleAgregarLinea} leftIcon={<Plus className="w-4 h-4 text-aurea-champagne" aria-hidden="true" />}>
                    Agregar insumo
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-aurea-champagne/70 bg-white">
                  <div
                    className={cn(
                      'hidden md:grid gap-3 px-3 py-2 rounded-t-xl bg-aurea-ivory border-b border-aurea-champagne/50 text-xs font-semibold uppercase tracking-wider text-aurea-navy/60',
                      GRILLA_LINEAS
                    )}
                  >
                    <span>Insumo</span>
                    <span>Cantidad</span>
                    <span>Precio unit.</span>
                    <span className="text-center">Variación</span>
                    <span className="text-right">Subtotal</span>
                    <span className="sr-only">Quitar</span>
                  </div>
                  <ul className="divide-y divide-aurea-champagne/40">
                    {lineas.map((linea, index) => {
                      const variacion =
                        linea.costo_anterior > 0
                          ? ((linea.precio_unitario - linea.costo_anterior) / linea.costo_anterior) * 100
                          : 0;
                      const nombre = linea.insumo_nombre || `línea ${index + 1}`;

                      return (
                        <li
                          key={linea.id_temp}
                          className={cn('grid grid-cols-2 items-center gap-x-3 gap-y-2 p-3', GRILLA_LINEAS)}
                        >
                          <div className="col-span-2 md:col-span-1 min-w-0">
                            <SelectorInsumoSearchable
                              insumosHabituales={insumosHabituales}
                              insumoIdSeleccionado={linea.insumo_id}
                              insumoNombreSeleccionado={linea.insumo_nombre}
                              unidadMedidaSeleccionada={linea.unidad_medida}
                              onBuscarCatalogoRemoto={buscarCatalogo}
                              onSeleccionar={(insumo, esHabitual) => handleCambioInsumoLinea(index, insumo, esHabitual)}
                            />
                          </div>

                          <label className="block">
                            <span className="md:sr-only block text-xs font-semibold text-aurea-navy/60 mb-1">Cantidad</span>
                            <span className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                inputMode="decimal"
                                required
                                value={linea.cantidad === 0 ? '' : linea.cantidad}
                                onChange={(e) => handleCambioCantidad(index, e.target.value)}
                                placeholder="0"
                                aria-label={`Cantidad de ${nombre}`}
                                className={CLASE_NUMERO}
                              />
                              <span className="text-xs font-mono text-aurea-navy/50 w-9 shrink-0">{linea.unidad_medida}</span>
                            </span>
                          </label>

                          <label className="block">
                            <span className="md:sr-only block text-xs font-semibold text-aurea-navy/60 mb-1">Precio unit. (S/)</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              inputMode="decimal"
                              required
                              value={linea.precio_unitario === 0 ? '' : linea.precio_unitario}
                              onChange={(e) => handleCambioPrecioUnitario(index, e.target.value)}
                              placeholder="0.00"
                              aria-label={`Precio unitario de ${nombre}`}
                              className={CLASE_NUMERO}
                            />
                          </label>

                          <span className="md:justify-self-center">
                            <VariacionCosto porcentaje={variacion} />
                          </span>

                          <span className="justify-self-end font-mono font-semibold text-aurea-navy whitespace-nowrap">
                            {soles(linea.subtotal)}
                          </span>

                          <span className="col-span-2 md:col-span-1 justify-self-end">
                            <IconButton
                              size="sm"
                              variant="danger"
                              icono={Trash2}
                              etiqueta={`Quitar ${nombre}`}
                              onClick={() => handleEliminarLinea(index)}
                            />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            <div>
              <label htmlFor={`${idForm}-obs`} className={CLASE_ROTULO}>
                Observaciones <span className="font-normal text-aurea-navy/50">(opcional)</span>
              </label>
              <textarea
                id={`${idForm}-obs`}
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Recibido conforme por el jefe de cocina"
                className={cn(CLASE_CONTROL, 'py-2.5')}
              />
            </div>
          </form>
        )}
      </Modal>

      <ModalProveedorAlVuelo
        abierto={abrirModalNuevoProv}
        onCerrar={() => setAbrirModalNuevoProv(false)}
        onProveedorCreado={handleProveedorCreado}
      />
    </>
  );
};
