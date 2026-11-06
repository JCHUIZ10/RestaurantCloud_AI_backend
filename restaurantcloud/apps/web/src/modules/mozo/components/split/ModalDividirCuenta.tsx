import React, { useState, useEffect } from 'react';
import {
  X,
  Split,
  ArrowRight,
  ArrowLeft,
  Send,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  ItemParaDividirDTO,
  SubcuentaConfigDTO,
  PromocionSedeDTO,
  DividirCuentaResponseDTO,
  DetalleBilleteraDigitalDTO,
} from '@/types/mozo';
import { mozoService, cajaService } from '@/services/serviceAdapter';
import { Paso1AsignacionItems } from './Paso1AsignacionItems';
import { Paso2ConfiguracionComprobantes } from './Paso2ConfiguracionComprobantes';

import {
  CONSUMIDOR_FINAL_DOC,
  CONSUMIDOR_FINAL_NOMBRE,
  LIMITE_BOLETA_CONSUMIDOR_FINAL,
  permiteConsumidorFinal,
} from './consumidorFinal';
import { DIVISOR_IGV } from '@/shared/constants/tributario';
import {
  calcularMontosSubcuenta,
  subcuentaSinImporte,
  MONTO_MINIMO_SUBCUENTA,
} from './montosSubcuenta';

interface ModalDividirCuentaProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  onDivisionConfirmada: (datos: DividirCuentaResponseDTO) => void;
  actor?: 'mozo' | 'cajero';
}

export const ModalDividirCuenta: React.FC<ModalDividirCuentaProps> = ({
  isOpen,
  onClose,
  mesaId,
  onDivisionConfirmada,
  actor = 'mozo',
}) => {
  // El cajero usa los endpoints /caja/*, el mozo los /mozo/*
  const splitService = actor === 'cajero' ? cajaService : mozoService;

  const [paso, setPaso] = useState<1 | 2>(1);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  // Sin valores de relleno: solo se llena con lo que responde el backend
  const [mesaInfo, setMesaInfo] = useState({
    numero: '',
    comensales: 0,
    pedidoId: '',
    totalBruto: 0,
  });

  const [items, setItems] = useState<ItemParaDividirDTO[]>([]);
  const [subcuentas, setSubcuentas] = useState<SubcuentaConfigDTO[]>([]);
  const [promociones, setPromociones] = useState<PromocionSedeDTO[]>([]);
  // null = aún no se conocen (se muestran todos y el backend valida)
  const [metodosPagoActivos, setMetodosPagoActivos] = useState<string[] | null>(null);
  // Comisión (%) que la sede cobra por tarjeta; viene de metodo_pago_local
  const [comisionTarjetaPct, setComisionTarjetaPct] = useState<number>(0);
  const [detalleBilletera, setDetalleBilletera] = useState<DetalleBilleteraDigitalDTO | null>(null);

  useEffect(() => {
    if (isOpen && mesaId) {
      cargarDatosIniciales();
    }
  }, [isOpen, mesaId]);

  // Si una subcuenta alcanza el límite, deja de ser consumidor final y debe identificarse con DNI
  useEffect(() => {
    const hayExcedidas = subcuentas.some(
      (s) => s.consumidor_final_sin_doc && !permiteConsumidorFinal(s.total_neto)
    );
    if (!hayExcedidas) return;
    setSubcuentas((prev) =>
      prev.map((s) =>
        s.consumidor_final_sin_doc && !permiteConsumidorFinal(s.total_neto)
          ? {
              ...s,
              consumidor_final_sin_doc: false,
              documento_cliente: '',
              nombre_cliente: '',
              direccion_cliente: '',
            }
          : s
      )
    );
  }, [subcuentas]);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    setErrorGlobal(null);
    setPaso(1);

    try {
      // 1. Cargar ítems disponibles para dividir desde la API real
      const resItems = await splitService.obtenerItemsParaDividir(mesaId);
      // 2. Cargar precuenta para promociones disponibles
      const resPrecuenta = await mozoService.obtenerPrecuentaMesa(mesaId);

      if (!resItems.exito || !resItems.datos) {
        setItems([]);
        setSubcuentas([]);
        setErrorGlobal(resItems.errores?.[0]?.mensaje || 'No se pudo cargar la comanda de la mesa.');
      }

      if (resItems.exito && resItems.datos) {
        setMesaInfo({
          numero: resItems.datos.mesa_numero,
          comensales: resItems.datos.comensales,
          pedidoId: resItems.datos.pedido_id,
          totalBruto: resItems.datos.total_bruto,
        });
        setItems(resItems.datos.items);

        // Si existen subcuentas previas en la base de datos (ej. pre-guardadas o semillas), re-poblarlas
        const previas = (resItems.datos as any).subcuentas_existentes;
        if (previas && Array.isArray(previas) && previas.length >= 2) {
          const subsCargadas: SubcuentaConfigDTO[] = previas.map((p: any) => {
            const itemsDeEsta = resItems.datos.items.filter(
              (i: any) => i.subcuenta_asignada_id === p.id
            );
            return {
              id: p.id,
              numero_subcuenta: p.numero_subcuenta,
              nombre_referencia: p.nombre_referencia || `Comensal #${p.numero_subcuenta}`,
              items: itemsDeEsta,
              tipo_comprobante: p.tipo_comprobante || 'boleta',
              documento_cliente: p.documento_cliente || '',
              nombre_cliente: p.nombre_cliente || '',
              direccion_cliente: p.direccion_cliente || '',
              consumidor_final_sin_doc: !p.documento_cliente,
              medio_pago: p.medio_pago || 'efectivo',
              promocion_id: p.promocion_id || null,
              subtotal_bruto: Number(p.subtotal_bruto) || 0,
              descuento: Number(p.descuento) || 0,
              monto_recargo: Number(p.monto_recargo) || 0,
              total_neto: Number(p.total_neto) || 0,
              base_imponible: Math.round(((Number(p.total_neto) || 0) / DIVISOR_IGV) * 100) / 100,
              igv: Math.round(((Number(p.total_neto) || 0) - (Number(p.total_neto) || 0) / DIVISOR_IGV) * 100) / 100,
            };
          });
          setSubcuentas(subsCargadas);
        } else {
          // Inicializar 2 subcuentas por defecto
          const sub1: SubcuentaConfigDTO = {
            id: 'sub-1',
            numero_subcuenta: 1,
            nombre_referencia: 'Comensal A',
            items: [],
            tipo_comprobante: 'boleta',
            documento_cliente: CONSUMIDOR_FINAL_DOC,
            nombre_cliente: CONSUMIDOR_FINAL_NOMBRE,
            direccion_cliente: '',
            consumidor_final_sin_doc: true,
            medio_pago: 'efectivo',
            subtotal_bruto: 0,
            descuento: 0,
            monto_recargo: 0,
            total_neto: 0,
            base_imponible: 0,
            igv: 0,
          };

          const sub2: SubcuentaConfigDTO = {
            id: 'sub-2',
            numero_subcuenta: 2,
            nombre_referencia: 'Comensal B',
            items: [],
            tipo_comprobante: 'boleta',
            documento_cliente: CONSUMIDOR_FINAL_DOC,
            nombre_cliente: CONSUMIDOR_FINAL_NOMBRE,
            direccion_cliente: '',
            consumidor_final_sin_doc: true,
            medio_pago: 'efectivo',
            subtotal_bruto: 0,
            descuento: 0,
            monto_recargo: 0,
            total_neto: 0,
            base_imponible: 0,
            igv: 0,
          };

          setSubcuentas([sub1, sub2]);
        }
      }

      if (resPrecuenta.exito && resPrecuenta.datos) {
        setPromociones(resPrecuenta.datos.promociones_disponibles || []);

        // Medios de pago habilitados en la sede: ninguna subcuenta puede usar otro
        const activos = (resPrecuenta.datos.opciones_pago || []).map((o) => o.codigo);
        if (activos.length > 0) {
          setMetodosPagoActivos(activos);
          const tarjeta = (resPrecuenta.datos.opciones_pago || []).find((o) => o.codigo === 'tarjeta');
          setComisionTarjetaPct(Number(tarjeta?.comision_porcentaje) || 0);
          const billetera = (resPrecuenta.datos.opciones_pago || []).find((o) => o.codigo === 'billetera_digital');
          setDetalleBilletera(billetera?.detalle_billetera || null);
          setSubcuentas((prev) =>
            prev.map((s) =>
              activos.includes(s.medio_pago)
                ? s
                : {
                    ...s,
                    medio_pago: activos.includes('efectivo') ? 'efectivo' : activos[0],
                    total_neto: Math.round((s.total_neto - s.monto_recargo) * 100) / 100,
                    monto_recargo: 0,
                  }
            )
          );
        }
      }
    } catch {
      setErrorGlobal('Error al cargar la comanda de la mesa.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  // Validación para pasar a Paso 2 (todos los ítems deben estar asignados)
  const itemsPendientes = items.filter((i) => !i.subcuenta_asignada_id);
  const subcuentasSinImporte = subcuentas.filter(subcuentaSinImporte);
  const puedeAvanzarAPaso2 =
    Boolean(mesaInfo.pedidoId) &&
    itemsPendientes.length === 0 &&
    subcuentas.some((s) => s.items.length > 0) &&
    subcuentasSinImporte.length === 0;
  const mensajeSinImporte = `Debe tener un importe mínimo de S/ ${MONTO_MINIMO_SUBCUENTA.toFixed(2)}. Los productos de S/ 0.00 deben acompañar a un producto con precio.`;

  // Validación final antes de enviar a caja
  const validarPaso2 = (): string | null => {
    for (const sub of subcuentas) {
      if (sub.items.length === 0) continue;

      if (subcuentaSinImporte(sub)) {
        return `Subcuenta ${sub.numero_subcuenta}: ${mensajeSinImporte}`;
      }

      if (metodosPagoActivos && !metodosPagoActivos.includes(sub.medio_pago)) {
        return `Subcuenta ${sub.numero_subcuenta}: El medio de pago seleccionado no está habilitado en esta sede.`;
      }

      if (sub.tipo_comprobante === 'factura') {
        if (!sub.documento_cliente || sub.documento_cliente.length !== 11) {
          return `Subcuenta ${sub.numero_subcuenta}: Se requiere un RUC válido de 11 dígitos para Factura.`;
        }
        if (!sub.nombre_cliente || sub.nombre_cliente.trim().length === 0) {
          return `Subcuenta ${sub.numero_subcuenta}: Consulta o ingresa la Razón Social de la empresa.`;
        }
      }

      if (
        sub.tipo_comprobante === 'boleta' &&
        sub.consumidor_final_sin_doc &&
        !permiteConsumidorFinal(sub.total_neto)
      ) {
        return `Subcuenta ${sub.numero_subcuenta}: Las boletas desde S/ ${LIMITE_BOLETA_CONSUMIDOR_FINAL.toFixed(2)} requieren identificar al cliente con DNI.`;
      }

      if (sub.tipo_comprobante === 'boleta' && !sub.consumidor_final_sin_doc) {
        if (!sub.documento_cliente || sub.documento_cliente.length !== 8) {
          return `Subcuenta ${sub.numero_subcuenta}: Se requiere un DNI válido de 8 dígitos para Boleta.`;
        }
        if (!sub.nombre_cliente || sub.nombre_cliente.trim().length === 0) {
          return `Subcuenta ${sub.numero_subcuenta}: Consulta o ingresa el Nombre del comensal.`;
        }
      }

      if (sub.tipo_comprobante === 'nota_venta') {
        if (!sub.nombre_cliente || sub.nombre_cliente.trim().length < 3) {
          return `Subcuenta ${sub.numero_subcuenta}: Ingresa el Nombre del Cliente (mínimo 3 caracteres) para Nota de Venta.`;
        }
      }
    }
    return null;
  };

  const handleEnviarSubcuentasACaja = async () => {
    if (!mesaInfo.pedidoId) {
      setErrorGlobal('No se cargó la comanda de la mesa. Cierra el modal e inténtalo de nuevo.');
      return;
    }

    const errorValidacion = validarPaso2();
    if (errorValidacion) {
      setErrorGlobal(errorValidacion);
      return;
    }

    setEnviando(true);
    setErrorGlobal(null);

    // Filtrar subcuentas activas que contengan ítems
    // Las boletas de consumidor final siempre viajan con sus datos genéricos
    const subcuentasActivas = subcuentas
      .filter((s) => s.items.length > 0)
      .map((s) =>
        s.tipo_comprobante === 'boleta' && s.consumidor_final_sin_doc
          ? {
              ...s,
              documento_cliente: CONSUMIDOR_FINAL_DOC,
              nombre_cliente: CONSUMIDOR_FINAL_NOMBRE,
            }
          : s
      );

    try {
      const res = await splitService.dividirCuentaMesa({
        mesa_id: mesaId,
        pedido_id: mesaInfo.pedidoId,
        subcuentas: subcuentasActivas,
      });

      if (res.exito && res.datos) {
        onDivisionConfirmada(res.datos);
        onClose();
      } else {
        setErrorGlobal(res.errores?.[0]?.mensaje || 'Error al enviar las subcuentas.');
      }
    } catch {
      setErrorGlobal('Error de red al procesar la división de la comanda.');
    } finally {
      setEnviando(false);
    }
  };

  const totalAsignadoNeto = subcuentas.reduce((sum, s) => sum + s.total_neto, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-[1100px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Wizard (1100px) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurea-navy flex items-center justify-center border border-aurea-copper/40 text-aurea-champagne shadow-inner">
              <Split className="w-5 h-5 text-aurea-copper" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  Paso {paso} de 2: {paso === 1 ? 'Distribución Determinista de Ítems' : 'Comprobantes, Promociones y Pasarela'}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300">
                  Mesa {mesaInfo.numero || '—'} — {actor === 'cajero' ? 'Terminal Caja POS' : 'Salón'}
                </span>
              </div>
              <h2 className="font-serif text-lg font-bold tracking-wide flex items-center gap-2 mt-0.5">
                <span>➗ Subdividir Comanda {actor === 'cajero' ? 'en Caja POS' : 'en Mesa'}</span>
                <span className="text-slate-400 font-normal text-xs">
                  (👥 {mesaInfo.comensales} Comensales • 💰 Consumo: S/ {mesaInfo.totalBruto.toFixed(2)})
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 overflow-y-auto space-y-4">
          {cargando ? (
            <div className="py-24 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-aurea-copper" />
              <span className="text-xs font-medium">Cargando ítems consumidos de la mesa...</span>
            </div>
          ) : (
            <>
              {errorGlobal && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorGlobal}</span>
                </div>
              )}

              {paso === 1 ? (
                <Paso1AsignacionItems
                  items={items}
                  subcuentas={subcuentas}
                  onActualizarItems={setItems}
                  onActualizarSubcuentas={setSubcuentas}
                />
              ) : (
                <Paso2ConfiguracionComprobantes
                  subcuentas={subcuentas.filter((s) => s.items.length > 0)}
                  promocionesDisponibles={promociones}
                  metodosPagoActivos={metodosPagoActivos}
                  comisionTarjetaPct={comisionTarjetaPct}
                  detalleBilletera={detalleBilletera}
                  onActualizarSubcuentas={(actualizadas) => {
                    // Mantener subcuentas vacías si las hubiere
                    const mapa = new Map(actualizadas.map((s) => [s.id, s]));
                    const unificadas = subcuentas.map((s) => mapa.get(s.id) || s);
                    setSubcuentas(unificadas);
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer del Wizard */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            {paso === 2 && (
              <button
                type="button"
                onClick={() => {
                  setErrorGlobal(null);
                  setPaso(1);
                }}
                disabled={enviando}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Distribución de Platos</span>
              </button>
            )}

            {paso === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors min-h-[44px]"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {paso === 1 && subcuentasSinImporte.length > 0 && (
              <p className="text-[11px] text-amber-700 font-medium max-w-[360px] text-right">
                Subcuenta {subcuentasSinImporte.map((s) => s.numero_subcuenta).join(', ')}: {mensajeSinImporte}
              </p>
            )}
            {paso === 1 ? (
              <button
                type="button"
                disabled={!puedeAvanzarAPaso2}
                onClick={() => {
                  setErrorGlobal(null);
                  // Recalcula descuento, recargo, base e IGV de todas las subcuentas
                  setSubcuentas((prev) =>
                    prev.map((s) => calcularMontosSubcuenta(s, promociones, comisionTarjetaPct))
                  );
                  setPaso(2);
                }}
                className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-sm ${
                  !puedeAvanzarAPaso2
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-aurea-navy hover:bg-[#123156] text-aurea-champagne border border-aurea-copper/50 active:scale-98 shadow-md'
                }`}
              >
                <span>Continuar a Comprobantes y Promociones (Paso 2)</span>
                <ArrowRight className="w-4 h-4 text-aurea-copper" />
              </button>
            ) : (
              <button
                type="button"
                disabled={enviando}
                onClick={handleEnviarSubcuentasACaja}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all flex items-center justify-center gap-2 min-h-[46px] shadow-md active:scale-98 font-mono"
              >
                {enviando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{actor === 'cajero' ? 'Guardando en Caja...' : 'Transmitiendo a Caja...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {actor === 'cajero'
                        ? `💾 Confirmar Subcuentas y Habilitar Cobro (S/ ${totalAsignadoNeto.toFixed(2)})`
                        : `📤 Confirmar y Enviar Subcuentas a Caja (S/ ${totalAsignadoNeto.toFixed(2)})`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
