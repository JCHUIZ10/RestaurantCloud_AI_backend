import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  TipoComprobanteCompra,
  MetodoPagoCompra,
  ItemCompraRequestDTO,
  RegistrarFichaCompraRequestDTO,
  ProveedorResumenDTO,
  InsumoAdminDTO,
  PlatoReactivableDTO,
  FichaCompraResumenDTO,
} from '@/types/admin';
import { mockAdminService, CANONICAL_LOCAL_ID } from '@/modules/admin/services/mockAdminService';
import { ModalProveedorAlVuelo } from './ModalProveedorAlVuelo';

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
  const [proveedores, setProveedores] = useState<ProveedorResumenDTO[]>([]);
  const [insumosCatalogo, setInsumosCatalogo] = useState<InsumoAdminDTO[]>([]);

  // Form State
  const [proveedorId, setProveedorId] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobanteCompra>('FACTURA');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [fechaEmision, setFechaEmision] = useState(() => new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCompra>('TRANSFERENCIA');
  const [observaciones, setObservaciones] = useState('');

  // Actualizar datos de contacto del proveedor al vuelo
  const [actualizarContacto, setActualizarContacto] = useState(false);
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');

  // Líneas de insumos
  const [lineas, setLineas] = useState<LineaFormItem[]>([]);

  // Sub-modal proveedor al vuelo
  const [abrirModalNuevoProv, setAbrirModalNuevoProv] = useState(false);

  // Estados de validación y carga
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      cargarCatalogos();
    }
  }, [abierto]);

  const cargarCatalogos = async () => {
    try {
      const [resProv, resIns] = await Promise.all([
        mockAdminService.getProveedores(CANONICAL_LOCAL_ID, { estado: 'activos', limite: 100 }),
        mockAdminService.obtenerInsumos(CANONICAL_LOCAL_ID, 'todos', '', 1, 100),
      ]);

      if (resProv.exito && resProv.datos) {
        setProveedores(resProv.datos.proveedores);
        if (resProv.datos.proveedores.length > 0 && !proveedorId) {
          setProveedorId(resProv.datos.proveedores[0].id);
          const p = resProv.datos.proveedores[0];
          setNuevoTelefono(p.telefono || '');
          setNuevoEmail(p.email || '');
          setNuevaDireccion(p.direccion || '');
        }
      }

      if (resIns.exito && resIns.datos) {
        setInsumosCatalogo(resIns.datos.insumos);
        // Inicializar con 1 línea vacía si no hay
        if (lineas.length === 0 && resIns.datos.insumos.length > 0) {
          const primero = resIns.datos.insumos[0];
          setLineas([
            {
              id_temp: `temp-${Date.now()}-1`,
              insumo_id: primero.id,
              insumo_nombre: primero.nombre,
              unidad_medida: primero.unidad_medida,
              cantidad: 10,
              precio_unitario: primero.costo_unitario,
              subtotal: Number((10 * primero.costo_unitario).toFixed(2)),
              costo_anterior: primero.costo_unitario,
            },
          ]);
        }
      }
    } catch {
      // Ignorar o registrar error
    }
  };

  const handleCambioProveedor = (id: string) => {
    setProveedorId(id);
    const p = proveedores.find((item) => item.id === id);
    if (p) {
      setNuevoTelefono(p.telefono || '');
      setNuevoEmail(p.email || '');
      setNuevaDireccion(p.direccion || '');
    }
  };

  const handleProveedorCreado = (nuevoProv: ProveedorResumenDTO) => {
    setProveedores((prev) => [nuevoProv, ...prev]);
    setProveedorId(nuevoProv.id);
    setNuevoTelefono(nuevoProv.telefono || '');
    setNuevoEmail(nuevoProv.email || '');
    setNuevaDireccion(nuevoProv.direccion || '');
  };

  const handleCambioInsumoLinea = (index: number, insumoId: string) => {
    const ins = insumosCatalogo.find((i) => i.id === insumoId);
    if (!ins) return;

    setLineas((prev) => {
      const copy = [...prev];
      const cantidad = copy[index].cantidad || 1;
      copy[index] = {
        ...copy[index],
        insumo_id: ins.id,
        insumo_nombre: ins.nombre,
        unidad_medida: ins.unidad_medida,
        precio_unitario: ins.costo_unitario,
        subtotal: Number((cantidad * ins.costo_unitario).toFixed(2)),
        costo_anterior: ins.costo_unitario,
      };
      return copy;
    });
  };

  const handleCambioCantidad = (index: number, cantidad: number) => {
    setLineas((prev) => {
      const copy = [...prev];
      const c = Math.max(0.01, cantidad);
      copy[index] = {
        ...copy[index],
        cantidad: c,
        subtotal: Number((c * copy[index].precio_unitario).toFixed(2)),
      };
      return copy;
    });
  };

  const handleCambioPrecioUnitario = (index: number, precio: number) => {
    setLineas((prev) => {
      const copy = [...prev];
      const p = Math.max(0.01, precio);
      copy[index] = {
        ...copy[index],
        precio_unitario: p,
        subtotal: Number((copy[index].cantidad * p).toFixed(2)),
      };
      return copy;
    });
  };

  const handleAgregarLinea = () => {
    if (insumosCatalogo.length === 0) return;
    const primero = insumosCatalogo[0];
    setLineas((prev) => [
      ...prev,
      {
        id_temp: `temp-${Date.now()}-${prev.length + 1}`,
        insumo_id: primero.id,
        insumo_nombre: primero.nombre,
        unidad_medida: primero.unidad_medida,
        cantidad: 1,
        precio_unitario: primero.costo_unitario,
        subtotal: Number((1 * primero.costo_unitario).toFixed(2)),
        costo_anterior: primero.costo_unitario,
      },
    ]);
  };

  const handleEliminarLinea = (index: number) => {
    if (lineas.length <= 1) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!proveedorId) {
      setErrorValidacion('Debe seleccionar o registrar un proveedor.');
      return;
    }

    if (tipoComprobante === 'FACTURA' && !numeroComprobante.trim()) {
      setErrorValidacion('Las facturas requieren ingresar obligatoriamente la serie y número de comprobante físico.');
      return;
    }

    if (lineas.length === 0) {
      setErrorValidacion('Debe registrar al menos un insumo en la compra.');
      return;
    }

    for (const l of lineas) {
      if (l.cantidad <= 0 || l.precio_unitario <= 0) {
        setErrorValidacion(`La línea "${l.insumo_nombre}" debe tener cantidad y precio unitario mayores a cero.`);
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
        numero_comprobante: numeroComprobante.trim() || undefined,
        fecha_emision: fechaEmision,
        metodo_pago: metodoPago,
        observaciones: observaciones.trim() || undefined,
        actualizar_contacto_proveedor: actualizarContacto
          ? {
              telefono: nuevoTelefono.trim() || undefined,
              email: nuevoEmail.trim() || undefined,
              direccion: nuevaDireccion.trim() || undefined,
            }
          : undefined,
        items: itemsPayload,
      };

      const res = await mockAdminService.registrarFichaCompra(req);

      if (res.exito && res.datos) {
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-600 text-white shadow-md shadow-primary-500/20">
                <Receipt className="w-5 h-5" />
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
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body Scrollable */}
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
                  <Truck className="w-4 h-4 text-primary-600" />
                  <span>Proveedor Comercial</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAbrirModalNuevoProv(true)}
                  className="inline-flex items-center gap-1 text-xs text-primary-700 font-semibold hover:text-primary-800 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Proveedor al vuelo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select
                    value={proveedorId}
                    onChange={(e) => handleCambioProveedor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.contacto ? `(${p.contacto})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={actualizarContacto}
                      onChange={(e) => setActualizarContacto(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                    />
                    <span>Actualizar datos de contacto de este proveedor</span>
                  </label>
                </div>
              </div>

              {actualizarContacto && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Dirección de Entrega
                    </label>
                    <input
                      type="text"
                      value={nuevaDireccion}
                      onChange={(e) => setNuevaDireccion(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: DATOS DEL COMPROBANTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tipo Comprobante */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tipo de Comprobante
                </label>
                <select
                  value={tipoComprobante}
                  onChange={(e) => setTipoComprobante(e.target.value as TipoComprobanteCompra)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="FACTURA">Factura (IGV 18%)</option>
                  <option value="BOLETA">Boleta de Venta</option>
                  <option value="NOTA_VENTA">Nota de Venta</option>
                  <option value="GUIA_REMISION">Guía de Remisión</option>
                  <option value="RECIBO">Recibo Simple</option>
                </select>
              </div>

              {/* Número de Comprobante */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  N° Comprobante {tipoComprobante === 'FACTURA' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  placeholder={
                    tipoComprobante === 'FACTURA'
                      ? 'Ej: F001-0004921'
                      : tipoComprobante === 'BOLETA'
                      ? 'Ej: B001-0001092'
                      : 'Opcional (Auto NV-YYYYMMDD-####)'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                />
                {!numeroComprobante && (tipoComprobante === 'NOTA_VENTA' || tipoComprobante === 'RECIBO') && (
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Se autogenerará correlativo interno NV-YYYYMMDD-####
                  </span>
                )}
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="YAPE_PLIN">Billetera Digital (Yape / Plin)</option>
                  <option value="EFECTIVO">Efectivo de Caja Chica</option>
                  <option value="CREDITO_30D">Crédito Comercial (30 Días)</option>
                </select>
              </div>
            </div>

            {/* SECCIÓN 3: TABLA DE INSUMOS COMPRADOS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Insumos y Costos Unitarios
                  </h4>
                  <p className="text-xs text-gray-500">
                    El stock aumentará automáticamente y se actualizará el costo unitario de referencia
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAgregarLinea}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Insumo</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Insumo</th>
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
                          {/* Selector de Insumo */}
                          <td className="py-2 px-3">
                            <select
                              value={linea.insumo_id}
                              onChange={(e) => handleCambioInsumoLinea(index, e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              {insumosCatalogo.map((ins) => (
                                <option key={ins.id} value={ins.id}>
                                  {ins.nombre} ({ins.unidad_medida}) • Actual: S/{ins.costo_unitario.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Cantidad */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                value={linea.cantidad}
                                onChange={(e) => handleCambioCantidad(index, parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
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
                              value={linea.precio_unitario}
                              onChange={(e) => handleCambioPrecioUnitario(index, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
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
                              disabled={lineas.length <= 1}
                              className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                  <span className="text-base text-primary-700 font-mono">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
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
                disabled={guardando || totalCalculado <= 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando Ficha...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Reponer Stock</span>
                  </>
                )}
              </button>
            </div>
          </form>
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
