import React, { useEffect, useState, useMemo } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, UtensilsCrossed, Clock, Users, User, AlertTriangle } from 'lucide-react';
import { mockMozoService } from '../../services/mockMozoService';
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
}

export const ModalPrecuentaCompleta: React.FC<ModalPrecuentaCompletaProps> = ({
  isOpen,
  onClose,
  mesaId,
  mesaEstadoActual,
  onCuentaNotificada,
}) => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataOriginal, setDataOriginal] = useState<PrecuentaMozoResponseDTO | null>(null);

  // Estados interactivos
  const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionSedeDTO | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<CodigoMetodoPago>('billetera_digital');
  const [modalQRAbierto, setModalQRAbierto] = useState(false);
  const [numeroOperacion, setNumeroOperacion] = useState<string>('581902');
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState<'boleta' | 'factura' | 'nota_venta'>('boleta');
  const [documentoCliente, setDocumentoCliente] = useState<string>('72819201');
  const [nombreCliente, setNombreCliente] = useState<string>('CARLOS MENDOZA QUISPE');
  const [consumidorFinal, setConsumidorFinal] = useState<boolean>(false);
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

    mockMozoService
      .obtenerPrecuentaMesa(mesaId)
      .then((res) => {
        if (!montado) return;
        if (res.exito && res.datos) {
          setDataOriginal(res.datos);
          setPromocionSeleccionada(res.datos.promocion_activa || null);
        } else {
          setError(res.errores?.[0]?.mensaje || 'No se pudo cargar la precuenta de la mesa.');
        }
      })
      .catch((err) => {
        if (montado) setError(err.message || 'Error de conexión');
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [isOpen, mesaId]);

  // Recálculo determinista en vivo de impuestos y descuentos
  const calculos = useMemo(() => {
    if (!dataOriginal) return null;

    const consumoBruto = dataOriginal.items.reduce((acc, it) => acc + it.subtotal, 0);
    const descuentoComercial = promocionSeleccionada
      ? Math.round(consumoBruto * (promocionSeleccionada.porcentaje_descuento / 100) * 100) / 100
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

    const comisionTarjeta = Math.round(totalNeto * 0.035 * 100) / 100;
    const opcionesPago: OpcionPagoMozoDTO[] = [
      {
        codigo: 'efectivo',
        nombre: 'Efectivo',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
      },
      {
        codigo: 'billetera_digital',
        nombre: 'Billetera Digital (Yape / Plin)',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
        detalle_billetera: {
          telefono: '987 654 321',
          titular: 'Restaurant S.A.C.',
          ruc: '20601234567',
          monto_exacto: totalNeto,
        },
      },
      {
        codigo: 'tarjeta',
        nombre: 'Tarjeta Débito / Crédito',
        comision_porcentaje: 3.5,
        monto_comision: comisionTarjeta,
        total_estimado: Math.round((totalNeto + comisionTarjeta) * 100) / 100,
      },
    ];

    return {
      desgloseSUNAT,
      opcionesPago,
      consumoBruto,
      totalNeto,
    };
  }, [dataOriginal, promocionSeleccionada]);

  // Transmitir detalles de pago o N° de operación a Caja
  const handleNotificarCaja = async (numOp?: string) => {
    if (!calculos || enviandoNotificacion) return;

    const opToUse = numOp || (metodoSeleccionado === 'billetera_digital' ? numeroOperacion : null);

    setEnviandoNotificacion(true);
    try {
      const res = await mockMozoService.solicitarCuentaMesaConDetalle({
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
                  Precuenta Digital Móvil (CU-MOZO-08)
                </span>
                {cuentaPedidaExitosa ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Cuenta Notificada a Caja
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
                        setDocumentoCliente('72819201');
                        setNombreCliente('CARLOS MENDOZA QUISPE');
                        setConsumidorFinal(false);
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
                        setDocumentoCliente('20601234567');
                        setNombreCliente('INVERSIONES GASTRONÓMICAS S.A.C.');
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

                  {tipoComprobante === 'boleta' && (
                    <div className="space-y-1.5 text-xs">
                      {!consumidorFinal ? (
                        <>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={documentoCliente}
                              maxLength={8}
                              onChange={(e) => setDocumentoCliente(e.target.value.replace(/\D/g, ''))}
                              placeholder="DNI"
                              className="w-28 py-1.5 px-2.5 rounded-lg border border-white/15 bg-black/40 font-mono text-xs text-white"
                            />
                            <div className="flex-1 p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs font-bold text-emerald-300 truncate flex items-center">
                              {nombreCliente}
                            </div>
                          </div>
                          {calculos.totalNeto < 700 && (
                            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400">
                              <input
                                type="checkbox"
                                checked={consumidorFinal}
                                onChange={(e) => setConsumidorFinal(e.target.checked)}
                                className="rounded border-white/20 text-[#D5A06F]"
                              />
                              <span>Consumidor Final (&lt; S/ 700.00 sin DNI)</span>
                            </label>
                          )}
                        </>
                      ) : (
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center justify-between">
                          <span>CONSUMIDOR FINAL</span>
                          <button
                            type="button"
                            onClick={() => setConsumidorFinal(false)}
                            className="text-[#D5A06F] text-[11px] underline"
                          >
                            Ingresar DNI
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {tipoComprobante === 'factura' && (
                    <div className="space-y-1.5 text-xs">
                      <input
                        type="text"
                        value={documentoCliente}
                        maxLength={11}
                        onChange={(e) => setDocumentoCliente(e.target.value.replace(/\D/g, ''))}
                        placeholder="RUC 11 dígitos"
                        className="w-full py-1.5 px-2.5 rounded-lg border border-white/15 bg-black/40 font-mono text-xs text-white"
                      />
                      <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs font-bold text-emerald-300 truncate">
                        {nombreCliente}
                      </div>
                    </div>
                  )}

                  {tipoComprobante === 'nota_venta' && (
                    <p className="text-[11px] text-slate-400 italic">
                      Control interno simplificado para la comanda.
                    </p>
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
              <span>Mesa en estado <strong>[CUENTA PEDIDA]</strong> (color ámbar en el salón).</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Pendiente de presionar <strong>Confirmar y Notificar a Caja</strong>.</span>
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
            detalle={calculos.opcionesPago.find((o) => o.codigo === 'billetera_digital')?.detalle_billetera}
            monto={calculos.totalNeto}
            onConfirmarPago={handleConfirmarQRPago}
          />
        )}
      </div>
    </div>
  );
};
