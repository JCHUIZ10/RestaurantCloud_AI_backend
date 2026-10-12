import React, { useState } from 'react';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Utensils,
} from 'lucide-react';
import { ItemParaDividirDTO, SubcuentaConfigDTO } from '@/types/mozo';

interface Paso1AsignacionItemsProps {
  items: ItemParaDividirDTO[];
  subcuentas: SubcuentaConfigDTO[];
  onActualizarItems: (items: ItemParaDividirDTO[]) => void;
  onActualizarSubcuentas: (subcuentas: SubcuentaConfigDTO[]) => void;
}

export const Paso1AsignacionItems: React.FC<Paso1AsignacionItemsProps> = ({
  items,
  subcuentas,
  onActualizarItems,
  onActualizarSubcuentas,
}) => {
  const [itemsSeleccionadosIds, setItemsSeleccionadosIds] = useState<string[]>([]);

  // Cálculos de progreso Cero Azar
  const totalItemsCount = items.length;
  const itemsAsignados = items.filter((i) => i.subcuenta_asignada_id !== null && i.subcuenta_asignada_id !== undefined);
  const itemsPendientes = items.filter((i) => !i.subcuenta_asignada_id);

  const totalBrutoComanda = items.reduce((acc, i) => acc + i.subtotal, 0);
  const totalAsignado = itemsAsignados.reduce((acc, i) => acc + i.subtotal, 0);
  const totalPendiente = totalBrutoComanda - totalAsignado;
  const porcentajeAsignado = totalItemsCount > 0 ? Math.round((itemsAsignados.length / totalItemsCount) * 100) : 0;
  const es100Porciento = itemsPendientes.length === 0;

  // Toggle selección de un ítem en la bandeja
  const toggleSeleccionItem = (id: string) => {
    setItemsSeleccionadosIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Desglosar unidades múltiples (si hay platos con cantidad > 1)
  const handleDesglosarUnidades = () => {
    const nuevosItems: ItemParaDividirDTO[] = [];
    let huboDesglose = false;

    items.forEach((item) => {
      if (item.cantidad > 1) {
        huboDesglose = true;
        for (let idx = 0; idx < item.cantidad; idx++) {
          nuevosItems.push({
            ...item,
            id: `${item.id}-u${idx + 1}`,
            cantidad: 1,
            subtotal: item.precio_unitario,
            subcuenta_asignada_id: null,
          });
        }
      } else {
        nuevosItems.push(item);
      }
    });

    if (huboDesglose) {
      onActualizarItems(nuevosItems);
      // Re-sincronizar subcuentas vaciándolas para reasignar limpiamente
      const subcuentasLimpias = subcuentas.map((s) => ({
        ...s,
        items: [],
        subtotal_bruto: 0,
        total_neto: 0,
      }));
      onActualizarSubcuentas(subcuentasLimpias);
      setItemsSeleccionadosIds([]);
    }
  };

  // Asignar los ítems seleccionados (o un ítem específico) a una subcuenta dada
  const asignarASubcuenta = (subcuentaId: string, itemIdsAAsignar?: string[]) => {
    const ids = itemIdsAAsignar && itemIdsAAsignar.length > 0 ? itemIdsAAsignar : itemsSeleccionadosIds;
    if (ids.length === 0) return;

    // Actualizar items marcando subcuenta_asignada_id
    const itemsActualizados = items.map((item) =>
      ids.includes(item.id) ? { ...item, subcuenta_asignada_id: subcuentaId } : item
    );
    onActualizarItems(itemsActualizados);

    // Re-calcular los ítems y subtotales en cada subcuenta
    const subcuentasActualizadas = subcuentas.map((sub) => {
      const itemsDeEstaSub = itemsActualizados.filter((i) => i.subcuenta_asignada_id === sub.id);
      const subtotalBruto = itemsDeEstaSub.reduce((acc, i) => acc + i.subtotal, 0);
      return {
        ...sub,
        items: itemsDeEstaSub,
        subtotal_bruto: subtotalBruto,
        total_neto: subtotalBruto, // El paso 2 recalculará promos y medios de pago
      };
    });
    onActualizarSubcuentas(subcuentasActualizadas);
    setItemsSeleccionadosIds([]);
  };

  // Devolver un ítem específico a la bandeja
  const devolverABandeja = (itemId: string) => {
    const itemsActualizados = items.map((i) =>
      i.id === itemId ? { ...i, subcuenta_asignada_id: null } : i
    );
    onActualizarItems(itemsActualizados);

    const subcuentasActualizadas = subcuentas.map((sub) => {
      const itemsDeEstaSub = itemsActualizados.filter((i) => i.subcuenta_asignada_id === sub.id);
      const subtotalBruto = itemsDeEstaSub.reduce((acc, i) => acc + i.subtotal, 0);
      return {
        ...sub,
        items: itemsDeEstaSub,
        subtotal_bruto: subtotalBruto,
        total_neto: subtotalBruto,
      };
    });
    onActualizarSubcuentas(subcuentasActualizadas);
  };

  // Devolver todos los ítems a la bandeja
  const devolverTodosABandeja = () => {
    const itemsActualizados = items.map((i) => ({ ...i, subcuenta_asignada_id: null }));
    onActualizarItems(itemsActualizados);

    const subcuentasActualizadas = subcuentas.map((sub) => ({
      ...sub,
      items: [],
      subtotal_bruto: 0,
      total_neto: 0,
    }));
    onActualizarSubcuentas(subcuentasActualizadas);
    setItemsSeleccionadosIds([]);
  };

  // Agregar una nueva subcuenta (hasta comensales o ilimitada)
  const handleCrearSubcuenta = () => {
    const nuevoNumero = subcuentas.length + 1;
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const letra = letras[nuevoNumero - 1] || `${nuevoNumero}`;

    const nuevaSubcuenta: SubcuentaConfigDTO = {
      id: `sub-${nuevoNumero}`,
      numero_subcuenta: nuevoNumero,
      nombre_referencia: `Comensal ${letra}`,
      items: [],
      tipo_comprobante: nuevoNumero === 1 ? 'factura' : 'boleta',
      nombre_cliente: '',
      medio_pago: 'efectivo',
      subtotal_bruto: 0,
      descuento: 0,
      monto_recargo: 0,
      total_neto: 0,
      base_imponible: 0,
      igv: 0,
    };

    onActualizarSubcuentas([...subcuentas, nuevaSubcuenta]);
  };

  // Eliminar subcuenta si está vacía y hay más de 2
  const handleEliminarSubcuenta = (subId: string) => {
    if (subcuentas.length <= 2) return;
    // Si tenía items, devolverlos a bandeja
    const itemsActualizados = items.map((i) =>
      i.subcuenta_asignada_id === subId ? { ...i, subcuenta_asignada_id: null } : i
    );
    onActualizarItems(itemsActualizados);

    const filtradas = subcuentas
      .filter((s) => s.id !== subId)
      .map((s, idx) => ({ ...s, numero_subcuenta: idx + 1 }));
    onActualizarSubcuentas(filtradas);
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Progreso y Control Cero Azar Operativo */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
              es100Porciento
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/40'
                : 'bg-amber-500 text-slate-950 animate-pulse'
            }`}
          >
            {es100Porciento ? <CheckCircle2 className="w-5 h-5" /> : `${porcentajeAsignado}%`}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wide">
                {es100Porciento
                  ? '✓ 100% ASIGNADO: Todos los platos han sido distribuidos'
                  : `⏳ ${itemsAsignados.length} de ${totalItemsCount} platos distribuidos (${porcentajeAsignado}%)`}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Total: S/ {totalBrutoComanda.toFixed(2)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5">
              Asignado: <strong className="text-emerald-400">S/ {totalAsignado.toFixed(2)}</strong>
              {' • '}
              Pendiente:{' '}
              <strong className={totalPendiente > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                S/ {totalPendiente.toFixed(2)}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-aurea-copper" />
          <span>Cero Azar Operativo</span>
        </div>
      </div>

      {/* 2. Cuerpo Principal: Bandeja Izquierda (50%) vs Subcuentas Derecha (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PANEL IZQUIERDO: BANDEJA DE ÍTEMS DE LA COMANDA */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {/* Header Bandeja */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-aurea-copper" />
              Bandeja de Ítems ({items.length})
            </span>

            <div className="flex items-center gap-2">
              {items.some((i) => i.cantidad > 1) && (
                <button
                  type="button"
                  onClick={handleDesglosarUnidades}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1"
                  title="Divide platos con cantidad > 1 en líneas individuales de 1 unidad"
                >
                  <Scissors className="w-3 h-3 text-aurea-copper" />
                  <span>Desglosar Unidades</span>
                </button>
              )}

              {itemsAsignados.length > 0 && (
                <button
                  type="button"
                  onClick={devolverTodosABandeja}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              )}
            </div>
          </div>

          {/* Lista de Ítems en Bandeja */}
          <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto">
            {items.map((item) => {
              const estaAsignado = item.subcuenta_asignada_id !== null && item.subcuenta_asignada_id !== undefined;
              const subAsignada = subcuentas.find((s) => s.id === item.subcuenta_asignada_id);
              const estaSeleccionado = itemsSeleccionadosIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => !estaAsignado && toggleSeleccionItem(item.id)}
                  className={`p-2.5 rounded-xl border transition-all flex items-start justify-between select-none ${
                    estaAsignado
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : estaSeleccionado
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/40 cursor-pointer shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 pr-2">
                    {/* Checkbox táctil */}
                    <div
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                        estaAsignado
                          ? 'bg-slate-200 border-slate-300 text-slate-400'
                          : estaSeleccionado
                          ? 'bg-amber-500 border-amber-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {estaSeleccionado && <span className="text-[10px] font-black">✓</span>}
                      {estaAsignado && <span className="text-[8px]">✓</span>}
                    </div>

                    <div>
                      <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-aurea-copper font-bold">
                          {item.cantidad}x
                        </span>
                        <span>{item.nombre}</span>
                      </div>

                      {item.nota_cocina && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          ↳ {item.nota_cocina}
                        </p>
                      )}

                      {/* Badge de asignación */}
                      {estaAsignado ? (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ↳ Asignado a: Subcuenta {subAsignada?.numero_subcuenta || '1'} ({subAsignada?.nombre_referencia})
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-100 text-amber-900">
                          ● Pendiente de asignar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-serif font-bold text-slate-900 text-xs">
                      S/ {item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dock Táctil de Transferencia Rápida */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Transferencia Rápida ({itemsSeleccionadosIds.length} seleccionados):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {subcuentas.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  disabled={itemsSeleccionadosIds.length === 0}
                  onClick={() => asignarASubcuenta(sub.id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 min-h-[38px] active:scale-95 ${
                    itemsSeleccionadosIds.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-aurea-navy hover:bg-[#123156] text-aurea-champagne border border-aurea-copper/50 shadow-sm'
                  }`}
                >
                  <span>Asignar a Subcuenta {sub.numero_subcuenta}</span>
                  <ArrowRight className="w-3 h-3 text-aurea-copper" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: SUBCUENTAS CREADAS EN MESA */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {/* Header Subcuentas */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Subcuentas Creadas ({subcuentas.length} activas)
            </span>

            <button
              type="button"
              onClick={handleCrearSubcuenta}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>＋ Subcuenta {subcuentas.length + 1}</span>
            </button>
          </div>

          {/* Tarjetas de Subcuentas */}
          <div className="p-3 space-y-3 max-h-[440px] overflow-y-auto">
            {subcuentas.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-colors shadow-2xs"
              >
                {/* Cabecera de la Subcuenta */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
                      SUB-0{sub.numero_subcuenta}
                    </span>
                    <span className="font-semibold text-xs text-slate-800">
                      Subcuenta {sub.numero_subcuenta} ({sub.nombre_referencia})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-slate-900">
                      S/ {sub.subtotal_bruto.toFixed(2)}
                    </span>

                    {subcuentas.length > 2 && sub.items.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarSubcuenta(sub.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar subcuenta vacía"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ítems asignados a esta subcuenta */}
                {sub.items.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs italic">
                    Sin platos asignados. Selecciona ítems de la bandeja y presiona &apos;Asignar a Subcuenta {sub.numero_subcuenta}&apos;.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sub.items.map((it) => (
                      <div
                        key={it.id}
                        className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 pr-2">
                          <span className="font-mono text-aurea-copper font-bold text-[11px]">
                            {it.cantidad}x
                          </span>
                          <span className="text-slate-800 font-medium text-[11px]">
                            {it.nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-serif font-bold text-slate-800 text-[11px]">
                            S/ {it.subtotal.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => devolverABandeja(it.id)}
                            className="text-[10px] text-slate-400 hover:text-amber-700 font-medium flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-slate-100"
                            title="Devolver a bandeja"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Footer informativo de estado */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          {es100Porciento ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <strong className="text-slate-900">
                Todos los platos han sido asignados correctamente.
              </strong>{' '}
              Puedes continuar al Paso 2 para configurar comprobantes.
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                Quedan <strong>{itemsPendientes.length} platos sin asignar</strong> (S/{' '}
                {totalPendiente.toFixed(2)} pendientes). Asígnalos para habilitar el Paso 2.
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
