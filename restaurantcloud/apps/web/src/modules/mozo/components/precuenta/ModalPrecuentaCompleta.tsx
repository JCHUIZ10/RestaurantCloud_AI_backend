import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  Users,
  User,
  AlertTriangle,
  Search,
  Split,
} from 'lucide-react';
import { mozoService, cajaService } from '@/services/serviceAdapter';
import { useAuthStore } from '@/stores/authStore';
import type {
  PrecuentaMozoResponseDTO,
  PromocionSedeDTO,
  CodigoMetodoPago,
  DesgloseSUNATMozoDTO,
  OpcionPagoMozoDTO,
  EstadoMesaOperativo,
} from '../../../../types/mozo';
import { PrecuentaConsolidadoCard } from './PrecuentaConsolidadoCard';
import { PromocionComercialSelector } from './PromocionComercialSelector';
import { DesgloseSUNATCard } from './DesgloseSUNATCard';
import { MetodosPagoSelector } from './MetodosPagoSelector';
import { ModalQRBilletera } from './ModalQRBilletera';

interface ModalPrecuentaCompletaProps {
  isOpen: boolean;
  onClose: () => void;
  mesaId: string;
  mesaEstadoActual?: EstadoMesaOperativo;
  onCuentaNotificada?: (mesaId: string, totalNeto: number) => void;
  actor?: 'mozo' | 'cajero';
}

export const ModalPrecuentaCompleta: React.FC<ModalPrecuentaCompletaProps> = ({
  isOpen,
  onClose,
  mesaId,
  mesaEstadoActual,
  onCuentaNotificada,
  actor,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const actorFinal = actor || (usuario?.rol === 'cajero' ? 'cajero' : 'mozo');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataOriginal, setDataOriginal] = useState<PrecuentaMozoResponseDTO | null>(null);

  // Estados interactivos
  const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionSedeDTO | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<CodigoMetodoPago>('efectivo');
  const [modalQRAbierto, setModalQRAbierto] = useState(false);
  const [numeroOperacion, setNumeroOperacion] = useState<string>('581902');
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState<'boleta' | 'factura' | 'nota_venta'>('boleta');
  const [documentoCliente, setDocumentoCliente] = useState<string>('');
  const [nombreCliente, setNombreCliente] = useState<string>('');
  const [direccionCliente, setDireccionCliente] = useState<string>('');
  const [consumidorFinal, setConsumidorFinal] = useState<boolean>(false);
  const [buscandoDoc, setBuscandoDoc] = useState<boolean>(false);
  const [docOrigen, setDocOrigen] = useState<'bd_local' | 'api_peru' | 'sunat' | 'reniec' | null>(null);
  const [errorDoc, setErrorDoc] = useState<string | null>(null);
  const [cuentaPedidaExitosa, setCuentaPedidaExitosa] = useState(
    mesaEstadoActual === 'cuenta_pedida'
  );

  useEffect(() => {
    if (mesaEstadoActual) {
      setCuentaPedidaExitosa(mesaEstadoActual === 'cuenta_pedida');
    }
  }, [mesaEstadoActual]);

  // Carga de datos de la precuenta
  useEffect(() => {
    if (!isOpen) return;

    let montado = true;
    setCargando(true);
    setError(null);

    const precuentaPromise = actorFinal === 'cajero' && (cajaService as any).obtenerPrecuentaMesa
      ? (cajaService as any).obtenerPrecuentaMesa(mesaId)
      : mozoService.obtenerPrecuentaMesa(mesaId);

    precuentaPromise
      .then((res: any) => {
        if (!montado) return;
        if (res.exito && res.datos) {
          setDataOriginal(res.datos);
          setPromocionSeleccionada(res.datos.promocion_activa || null);
          const raw = res.datos.opciones_pago || res.datos.opciones_cobro || [];
          if (raw.length > 0) {
            setMetodoSeleccionado(raw[0].codigo);
          }
        } else {
          setError(res.errores?.[0]?.mensaje || 'No se pudo cargar la precuenta de la mesa.');
        }
      })
      .catch((err: any) => {
        if (montado) setError(err.message || 'Error de conexión');
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [isOpen, mesaId, actorFinal]);

  // Recálculo determinista en vivo de impuestos, descuentos y métodos de pago de BD
  const calculos = useMemo(() => {
    if (!dataOriginal) return null;

    const consumoBruto = dataOriginal.items.reduce((acc, it) => acc + it.subtotal, 0);
    const porcentajePromo = promocionSeleccionada
      ? Number(promocionSeleccionada.porcentaje_descuento ?? (promocionSeleccionada as any).valor ?? 0) || 0
      : 0;
    const descuentoComercial = promocionSeleccionada
      ? Math.round(consumoBruto * (porcentajePromo / 100) * 100) / 100
      : 0;
    const totalNeto = Math.round((consumoBruto - descuentoComercial) * 100) / 100;
    const baseImponible = Math.round((totalNeto / 1.18) * 100) / 100;
    const igv = Math.round((totalNeto - baseImponible) * 100) / 100;

    const desgloseSUNAT: DesgloseSUNATMozoDTO = {
      consumo_bruto: consumoBruto,
      descuento_comercial: descuentoComercial,
      total_neto: totalNeto,
      base_imponible: baseImponible,
      igv: igv,
      tasa_igv: 0.18,
    };

    // Mapear los métodos de pago dinámicos desde la BD (tabla metodo_pago_local)
    const rawOpciones = (dataOriginal as any).opciones_pago || (dataOriginal as any).opciones_cobro || [];
    const opcionesPago: OpcionPagoMozoDTO[] = rawOpciones.length > 0
      ? rawOpciones.map((op: any) => {
          const comisionPct = Number(op.comision_porcentaje || 0);
          const comision = Math.round(totalNeto * (comisionPct / 100) * 100) / 100;
          const esBilletera = ['yape', 'plin', 'billetera_digital'].includes(op.codigo);

          const detBilletera = op.detalle_billetera ? {
            telefono: op.detalle_billetera.telefono || '930723537',
            titular: op.detalle_billetera.titular || 'ÁUREA S.A.C.',
            ruc: op.detalle_billetera.ruc || '20601234567',
            monto_exacto: totalNeto,
          } : (esBilletera ? {
            telefono: op.datos_adicionales?.telefono || '930723537',
            titular: op.datos_adicionales?.titular || 'ÁUREA S.A.C.',
            ruc: op.datos_adicionales?.ruc || '20601234567',
            monto_exacto: totalNeto,
          } : null);

          return {
            id: op.id,
            codigo: op.codigo,
            nombre: op.nombre || op.metodo_pago_nombre || op.codigo,
            icono: op.icono || 'wallet',
            comision_porcentaje: comisionPct,
            monto_comision: comision,
            total_estimado: Math.round((totalNeto + comision) * 100) / 100,
            detalle_billetera: detBilletera,
            datos_adicionales: op.datos_adicionales,
          };
        })
      : [
          {
            codigo: 'efectivo',
            nombre: 'Efectivo',
            comision_porcentaje: 0.0,
            monto_comision: 0.0,
            total_estimado: totalNeto,
          },
          {
            codigo: 'yape',
            nombre: 'Yape / Plin',
            comision_porcentaje: 0.0,
            monto_comision: 0.0,
            total_estimado: totalNeto,
            detalle_billetera: {
              telefono: '930723537',
              titular: 'ÁUREA S.A.C.',
              ruc: '20601234567',
              monto_exacto: totalNeto,
            },
          },
        ];

    return {
      desgloseSUNAT,
      opcionesPago,
      consumoBruto,
      totalNeto,
    };
  }, [dataOriginal, promocionSeleccionada]);

  // Validación Poka-Yoke de datos de comprobante para habilitar emisión de cuenta
  const validacionComprobante = useMemo(() => {
    if (!calculos) return { valido: false, motivo: 'Calculando precuenta...' };

    if (tipoComprobante === 'factura') {
      const docClean = documentoCliente.trim().replace(/\D/g, '');
      if (docClean.length !== 11) {
        return { valido: false, motivo: 'Factura requiere ingresar un RUC de 11 dígitos válido.' };
      }
      if (!nombreCliente.trim()) {
        return { valido: false, motivo: 'Haga clic en "Buscar" para reconocer la Razón Social de la empresa.' };
      }
      return { valido: true, motivo: '' };
    }

    if (tipoComprobante === 'boleta') {
      const esMayorIgual700 = calculos.totalNeto >= 700;
      if (esMayorIgual700 && consumidorFinal) {
        return { valido: false, motivo: 'SUNAT exige DNI obligatorio para consumos mayores o iguales a S/ 700.00.' };
      }

      if (consumidorFinal) {
        return { valido: true, motivo: '' };
      }

      const docClean = documentoCliente.trim().replace(/\D/g, '');
      if (docClean.length !== 8) {
        return { valido: false, motivo: 'Boleta requiere DNI de 8 dígitos o marcar Consumidor Final.' };
      }
      if (!nombreCliente.trim()) {
        return { valido: false, motivo: 'Haga clic en "Buscar" para reconocer el DNI del cliente en RENIEC/BD.' };
      }
      return { valido: true, motivo: '' };
    }

    if (tipoComprobante === 'nota_venta') {
      if (!nombreCliente.trim()) {
        return { valido: false, motivo: 'Ingrese el nombre o referencia del comensal para la Nota de Venta.' };
      }
      return { valido: true, motivo: '' };
    }

    return { valido: true, motivo: '' };
  }, [calculos, tipoComprobante, documentoCliente, nombreCliente, consumidorFinal]);

  // Si el total neto supera S/ 700.00, desmarcar consumidor final automáticamente
  useEffect(() => {
    if (calculos && calculos.totalNeto >= 700 && consumidorFinal) {
      setConsumidorFinal(false);
    }
  }, [calculos?.totalNeto, consumidorFinal]);

  // Búsqueda en dos niveles: 1) BD Local de Clientes, 2) Padrón SUNAT/RENIEC
  const handleBuscarDocumento = async () => {
    if (tipoComprobante === 'nota_venta' || consumidorFinal) return;

    const docLimpio = documentoCliente.trim().replace(/\D/g, '');
    if (tipoComprobante === 'boleta' && docLimpio.length !== 8) {
      setErrorDoc('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    if (tipoComprobante === 'factura' && docLimpio.length !== 11) {
      setErrorDoc('El RUC debe tener exactamente 11 dígitos.');
      return;
    }

    setBuscandoDoc(true);
    setErrorDoc(null);

    try {
      const tipo = tipoComprobante === 'factura' ? 'RUC' : 'DNI';
      const res = await cajaService.consultarClienteFiscal(tipo, docLimpio);
      if (res.exito && res.datos) {
        setNombreCliente(res.datos.nombre_identificativo);
        setDocOrigen(res.datos.origen);
        if (res.datos.direccion) {
          setDireccionCliente(res.datos.direccion);
        }
      } else {
        setErrorDoc(res.errores?.[0]?.mensaje || 'No se encontró el documento en el padrón.');
      }
    } catch (err: any) {
      setErrorDoc(err.message || 'Error de conexión al consultar documento.');
    } finally {
      setBuscandoDoc(false);
    }
  };

  // Transmitir detalles de pago o N° de operación a Caja
  const handleNotificarCaja = async (numOp?: string) => {
    if (!calculos || enviandoNotificacion) return;

    const opToUse = numOp || (['yape', 'plin', 'billetera_digital'].includes(metodoSeleccionado) ? numeroOperacion : null);

    setEnviandoNotificacion(true);
    try {
      const res = await mozoService.solicitarCuentaMesaConDetalle({
        mesa_id: mesaId,
        metodo_pago: metodoSeleccionado,
        numero_operacion: opToUse,
        monto_declarado: calculos.totalNeto,
        promocion_id: promocionSeleccionada?.id || null,
        tipo_comprobante: tipoComprobante,
        documento_cliente: consumidorFinal ? '00000000' : documentoCliente,
        nombre_cliente: consumidorFinal ? 'CONSUMIDOR FINAL' : nombreCliente,
        consumidor_final: consumidorFinal,
      });

      if (res.exito) {
        setCuentaPedidaExitosa(true);
        onCuentaNotificada?.(mesaId, calculos.totalNeto);
      }
    } finally {
      setEnviandoNotificacion(false);
    }
  };

  const handleConfirmarQRPago = (numOp: string) => {
    setNumeroOperacion(numOp);
    setModalQRAbierto(false);
    handleNotificarCaja(numOp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#07172B] border border-[#D5A06F]/50 rounded-2xl max-w-5xl w-full max-h-[92vh] shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* 1. Header del Modal Completo */}
        <div className="bg-[#0B2340] border-b border-[#D5A06F]/30 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#D5A06F]/20 text-[#D5A06F] border border-[#D5A06F]/40">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D5A06F]">
                  {actorFinal === 'cajero'
                    ? 'Control y Auditoría de Precuenta (Caja POS)'
                    : 'Precuenta Digital Móvil (CU-MOZO-08)'}
                </span>
                {cuentaPedidaExitosa ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {actorFinal === 'cajero' ? 'Cuenta Generada en Mesa' : 'Cuenta Notificada a Caja'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Revisión de Consumo
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#FFF9F0] tracking-tight">
                Mesa {dataOriginal?.mesa_numero || '04'} — Salón Principal
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {dataOriginal && (
              <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
                  <User className="w-3.5 h-3.5 text-[#D5A06F]" />
                  <span>{dataOriginal.mozo_nombre}</span>
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
                  <Users className="w-3.5 h-3.5 text-[#D5A06F]" />
                  <span>{dataOriginal.comensales} pax</span>
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#D5A06F]" />
                  <span>{dataOriginal.minutos_en_mesa} min</span>
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Banner de Estado y Aviso No Bloqueante de Cocina */}
        {dataOriginal?.tiene_cocina_pendiente && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 text-amber-200 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Aviso de cocina:</strong> {dataOriginal.alerta_cocina || "1 plato en preparación."} Puede presentar la precuenta al cliente, pero valide el pase antes del cobro final.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 hidden sm:inline-block">
              Informativo
            </span>
          </div>
        )}

        {/* 3. Contenido Principal Scrollable con Grid de 2 Columnas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {cargando ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 space-y-3">
              <Loader2 className="w-9 h-9 text-[#D5A06F] animate-spin" />
              <p className="text-xs tracking-wide">Cargando desglose de comanda y cálculo SUNAT...</p>
            </div>
          ) : error || !dataOriginal || !calculos ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm text-red-200">{error || 'No se pudo obtener la precuenta.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Columna Izquierda: Consumo en Mesa + Selector de Promociones (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <PrecuentaConsolidadoCard items={dataOriginal.items} />

                {/* Visualización informativa de Subcuentas si la cuenta fue dividida */}
                {dataOriginal.subcuentas && dataOriginal.subcuentas.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Split className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">
                          Cuenta Dividida ({dataOriginal.subcuentas.length} Subcuentas)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {dataOriginal.subcuentas.every((s) => s.estado === 'cobrado') ? 'Todas Cobradas' : 'Desglose Activo'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Esta mesa cuenta con comprobantes independientes configurados. Cada subcuenta se liquida con su comprobante fiscal correspondiente en Caja POS.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dataOriginal.subcuentas.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-white/10 text-[#D5A06F]">
                                {sub.tipo_comprobante}
                              </span>
                              <span className="truncate max-w-[140px]">{sub.nombre_titular || sub.nombre_referencia}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {sub.medio_pago_tentativo?.toUpperCase() || 'PAGO PENDIENTE'}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-amber-300">
                              S/ {Number(sub.total_neto).toFixed(2)}
                            </span>
                            <span className={`block text-[9px] font-bold ${
                              sub.estado === 'cobrado' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {sub.estado === 'cobrado' ? '✓ Cobrado' : '⏳ Pendiente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <PromocionComercialSelector
                  promocionesDisponibles={dataOriginal.promociones_disponibles}
                  promocionSeleccionada={promocionSeleccionada}
                  onSeleccionarPromocion={setPromocionSeleccionada}
                  consumoBruto={calculos.consumoBruto}
                />
              </div>

              {/* Columna Derecha: Desglose SUNAT + Métodos de Pago y QR (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <DesgloseSUNATCard desglose={calculos.desgloseSUNAT} />

                {/* Selector de Comprobante Deseado (Boleta / Factura / Nota Venta) */}
                <div className="p-3.5 rounded-xl bg-black/25 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Tipo de Comprobante Deseado</span>
                    <span className="text-[10px] text-[#D5A06F] font-mono">Para emisión en Caja</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoComprobante('boleta');
                        setErrorDoc(null);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        tipoComprobante === 'boleta'
                          ? 'bg-[#D5A06F] text-[#0B2340] shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      Boleta
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTipoComprobante('factura');
                        setErrorDoc(null);
                        setConsumidorFinal(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        tipoComprobante === 'factura'
                          ? 'bg-[#D5A06F] text-[#0B2340] shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      Factura
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTipoComprobante('nota_venta');
                        setErrorDoc(null);
                        setConsumidorFinal(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        tipoComprobante === 'nota_venta'
                          ? 'bg-[#D5A06F] text-[#0B2340] shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      Nota Venta
                    </button>
                  </div>

                  {/* Configuración Comprobante: BOLETA (Diseño en 2 niveles idéntico a Factura) */}
                  {tipoComprobante === 'boleta' && (
                    <div className="space-y-2 text-xs">
                      {!consumidorFinal ? (
                        <>
                          {/* Fila 1: Input DNI 8 dígitos + Botón Buscar */}
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={documentoCliente}
                              maxLength={8}
                              onChange={(e) => {
                                setDocumentoCliente(e.target.value.replace(/\D/g, ''));
                                setErrorDoc(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleBuscarDocumento();
                                }
                              }}
                              placeholder="DNI 8 dígitos"
                              className="flex-1 py-1.5 px-2.5 rounded-lg border border-white/15 bg-black/40 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D5A06F]"
                            />
                            <button
                              type="button"
                              onClick={handleBuscarDocumento}
                              disabled={buscandoDoc || documentoCliente.trim().length !== 8}
                              className="px-3 py-1.5 rounded-lg bg-[#D5A06F] hover:bg-[#e0aa78] text-[#0B2340] font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 shrink-0"
                              title="Buscar DNI en BD local y RENIEC"
                            >
                              {buscandoDoc ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Search className="w-3.5 h-3.5" />
                              )}
                              <span>Buscar</span>
                            </button>
                          </div>

                          {errorDoc && (
                            <p className="text-[11px] text-red-300 bg-red-950/30 p-1.5 rounded border border-red-800/40">
                              {errorDoc}
                            </p>
                          )}

                          {/* Fila 2: Tarjeta destacada inferior con Nombre Reconocido y Badge */}
                          {nombreCliente ? (
                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs space-y-1 animate-fadeIn">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-bold text-emerald-300 truncate">{nombreCliente}</span>
                                {docOrigen && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                    docOrigen === 'bd_local'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  }`}>
                                    {docOrigen === 'bd_local' ? 'BD Local' : 'RENIEC'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-300">
                                <span>DNI Identificado: {documentoCliente}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevo = prompt('Editar nombre del cliente:', nombreCliente);
                                    if (nuevo && nuevo.trim()) setNombreCliente(nuevo.trim().toUpperCase());
                                  }}
                                  className="text-[#D5A06F] hover:underline"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-white/5 border border-dashed border-white/10 text-[11px] text-slate-400">
                              Ingrese el DNI y presione <strong>Buscar</strong> para consultar en RENIEC o BD local.
                            </div>
                          )}

                          {/* Fila 3: Consumidor Final o Regla SUNAT >= 700 */}
                          {calculos.totalNeto >= 700 ? (
                            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>SUNAT exige DNI obligatorio para consumos $\ge$ S/ 700.00.</span>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400 select-none">
                              <input
                                type="checkbox"
                                checked={consumidorFinal}
                                onChange={(e) => setConsumidorFinal(e.target.checked)}
                                className="rounded border-white/20 text-[#D5A06F] focus:ring-[#D5A06F] bg-black/40"
                              />
                              <span>Consumidor Final (&lt; S/ 700.00 sin DNI)</span>
                            </label>
                          )}
                        </>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white">CONSUMIDOR FINAL</span>
                            <span className="text-[10px] text-slate-400">(&lt; S/ 700.00)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConsumidorFinal(false)}
                            className="text-[#D5A06F] text-xs font-semibold hover:underline"
                          >
                            Identificar DNI
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuración Comprobante: FACTURA */}
                  {tipoComprobante === 'factura' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={documentoCliente}
                          maxLength={11}
                          onChange={(e) => {
                            setDocumentoCliente(e.target.value.replace(/\D/g, ''));
                            setErrorDoc(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleBuscarDocumento();
                            }
                          }}
                          placeholder="RUC 11 dígitos"
                          className="flex-1 py-1.5 px-2.5 rounded-lg border border-white/15 bg-black/40 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D5A06F]"
                        />
                        <button
                          type="button"
                          onClick={handleBuscarDocumento}
                          disabled={buscandoDoc || documentoCliente.trim().length !== 11}
                          className="px-3 py-1.5 rounded-lg bg-[#D5A06F] hover:bg-[#e0aa78] text-[#0B2340] font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 shrink-0"
                          title="Buscar RUC en BD local y SUNAT"
                        >
                          {buscandoDoc ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                          <span>Buscar</span>
                        </button>
                      </div>

                      {errorDoc && (
                        <p className="text-[11px] text-red-300 bg-red-950/30 p-1.5 rounded border border-red-800/40">
                          {errorDoc}
                        </p>
                      )}

                      {nombreCliente ? (
                        <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs space-y-1 animate-fadeIn">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-emerald-300 truncate">{nombreCliente}</span>
                            {docOrigen && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                docOrigen === 'bd_local'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              }`}>
                                {docOrigen === 'bd_local' ? 'BD Local' : 'SUNAT'}
                              </span>
                            )}
                          </div>
                          {direccionCliente && (
                            <p className="text-[10px] text-slate-300 truncate">{direccionCliente}</p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-white/5 border border-dashed border-white/10 text-[11px] text-slate-400">
                          Ingrese el RUC de 11 dígitos y presione <strong>Buscar</strong> para consultar la Razón Social.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuración Comprobante: NOTA DE VENTA */}
                  {tipoComprobante === 'nota_venta' && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Nombre o Referencia del Comensal:
                        </label>
                        <input
                          type="text"
                          value={nombreCliente}
                          onChange={(e) => setNombreCliente(e.target.value)}
                          placeholder="Ej. Juan Pérez / Comensal Mesa"
                          className="w-full py-1.5 px-2.5 rounded-lg border border-white/15 bg-black/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D5A06F]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        Control interno simplificado para la comanda y caja.
                      </p>
                    </div>
                  )}
                </div>

                <MetodosPagoSelector
                  opcionesPago={calculos.opcionesPago}
                  metodoSeleccionado={metodoSeleccionado}
                  onSeleccionarMetodo={setMetodoSeleccionado}
                  onAbrirModalQR={() => setModalQRAbierto(true)}
                  onNotificarCaja={() => handleNotificarCaja()}
                  enviandoNotificacion={enviandoNotificacion}
                  cuentaPedidaExitosa={cuentaPedidaExitosa}
                  actor={actorFinal}
                  isComprobanteValido={validacionComprobante.valido}
                  motivoBloqueoComprobante={validacionComprobante.motivo}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer del Modal */}
        <div className="p-4 border-t border-[#D5A06F]/20 bg-[#0B2340] flex items-center justify-between shrink-0">
          {cuentaPedidaExitosa ? (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {actorFinal === 'cajero'
                  ? <>Mesa con <strong>[CUENTA GENERADA]</strong> (color ámbar).</>
                  : <>Mesa en estado <strong>[CUENTA PEDIDA]</strong> (color ámbar en el salón).</>}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>
                Pendiente de presionar <strong>{actorFinal === 'cajero' ? 'Generar Cuenta' : 'Confirmar y Notificar a Caja'}</strong>.
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D5A06F] to-[#b88655] hover:from-[#e0aa78] hover:to-[#c4905e] text-[#0B2340] font-bold text-xs tracking-wide shadow-md transition-all active:scale-98"
          >
            Listo / Volver al Salón
          </button>
        </div>

        {/* Sub-modal de Código QR para Billetera Digital (Yape / Plin) */}
        {calculos && (
          <ModalQRBilletera
            isOpen={modalQRAbierto}
            onClose={() => setModalQRAbierto(false)}
            detalle={calculos.opcionesPago.find((o) => ['yape', 'plin', 'billetera_digital'].includes(o.codigo))?.detalle_billetera}
            monto={calculos.totalNeto}
            onConfirmarPago={handleConfirmarQRPago}
            actor={actorFinal}
          />
        )}
      </div>
    </div>
  );
};
