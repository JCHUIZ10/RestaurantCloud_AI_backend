import React from 'react';
import {
  Banknote,
  QrCode,
  CreditCard,
  Send,
  Loader2,
  CheckCircle2,
  Info,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import type { CodigoMetodoPago, OpcionPagoMozoDTO } from '../../../../types/mozo';

interface MetodosPagoSelectorProps {
  opcionesPago: OpcionPagoMozoDTO[];
  metodoSeleccionado: CodigoMetodoPago;
  onSeleccionarMetodo: (metodo: CodigoMetodoPago) => void;
  onAbrirModalQR: () => void;
  onNotificarCaja: () => void;
  enviandoNotificacion: boolean;
  cuentaPedidaExitosa: boolean;
  actor?: 'mozo' | 'cajero';
  isComprobanteValido?: boolean;
  motivoBloqueoComprobante?: string;
}

export const MetodosPagoSelector: React.FC<MetodosPagoSelectorProps> = ({
  opcionesPago,
  metodoSeleccionado,
  onSeleccionarMetodo,
  onAbrirModalQR,
  onNotificarCaja,
  enviandoNotificacion,
  cuentaPedidaExitosa,
  actor = 'mozo',
  isComprobanteValido = true,
  motivoBloqueoComprobante,
}) => {
  const getIcon = (codigo: CodigoMetodoPago) => {
    switch (codigo) {
      case 'efectivo':
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'yape':
      case 'plin':
      case 'billetera_digital':
        return <QrCode className="w-5 h-5 text-[#D5A06F]" />;
      case 'tarjeta':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      default:
        return <Wallet className="w-5 h-5 text-amber-400" />;
    }
  };

  const getSubtitulo = (opcion: OpcionPagoMozoDTO) => {
    if (opcion.comision_porcentaje === 0) {
      if (['yape', 'plin', 'billetera_digital'].includes(opcion.codigo)) {
        return 'Yape o Plin directo (0%)';
      }
      return 'Sin recargo bancario (0%)';
    }
    return `+${opcion.comision_porcentaje}% recargo de comisión POS`;
  };

  return (
    <div className="bg-[#0B2340]/90 rounded-xl border border-[#D5A06F]/30 p-5 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#D5A06F]/20">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[#FFF9F0] uppercase font-sans">
            Método de Pago Acordado
          </h2>
          <p className="text-xs text-slate-400">
            Seleccione cómo abonará el comensal para alertar a Caja
          </p>
        </div>
      </div>

      {/* Grid de Métodos de Pago */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {opcionesPago.map((opcion) => {
          const isSelected = metodoSeleccionado === opcion.codigo;

          return (
            <button
              key={opcion.codigo}
              type="button"
              onClick={() => onSeleccionarMetodo(opcion.codigo)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#D5A06F]/25 to-transparent border-[#D5A06F] text-white shadow-lg ring-2 ring-[#D5A06F]/70'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  {getIcon(opcion.codigo)}
                </div>
                {isSelected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#D5A06F] text-[#0B2340]">
                    Elegido
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-100">
                  {opcion.nombre}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {getSubtitulo(opcion)}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400">Proyección:</span>
                <span className="text-sm font-bold text-[#F4D7B0]">
                  S/ {opcion.total_estimado.toFixed(2)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Botón directo de apertura QR para Billeteras Digitales (Yape / Plin) */}
      {['yape', 'plin', 'billetera_digital'].includes(metodoSeleccionado) && (
        <div className="p-3.5 rounded-xl bg-[#D5A06F]/10 border border-[#D5A06F]/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-[#D5A06F]/20 text-[#D5A06F]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Código QR Yape & Plin Listo para Escaneo
              </p>
              <p className="text-[11px] text-slate-300">
                Muestra el código en la pantalla del dispositivo al comensal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAbrirModalQR}
            className="px-3.5 py-2 rounded-lg bg-[#D5A06F] hover:bg-[#c38e5d] text-[#0B2340] font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 ml-auto"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Presentar QR en Mesa</span>
          </button>
        </div>
      )}

      {/* Acción Final: Notificar a Caja o Generar Cuenta */}
      <div className="pt-3 border-t border-[#D5A06F]/20 space-y-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300 bg-black/20 p-2.5 rounded-lg border border-white/5">
          <Info className="w-4 h-4 text-[#D5A06F] shrink-0" />
          <span>
            {actor === 'cajero' ? (
              <>Al confirmar, se generará la cuenta de la mesa y se mantendrá en estado <strong>[CUENTA PEDIDA]</strong> para control de cobro.</>
            ) : (
              <>Al notificar a Caja, la mesa cambiará a estado <strong>[CUENTA PEDIDA]</strong> (color ámbar) y notificará la solicitud al cajero.</>
            )}
          </span>
        </div>

        {/* Banner de Validación Bloqueante de Comprobante */}
        {!isComprobanteValido && !cuentaPedidaExitosa && (
          <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{motivoBloqueoComprobante || 'Complete los datos requeridos del comprobante para habilitar la emisión.'}</span>
          </div>
        )}

        <button
          type="button"
          disabled={enviandoNotificacion || cuentaPedidaExitosa || !isComprobanteValido}
          onClick={onNotificarCaja}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all flex items-center justify-center space-x-2 ${
            cuentaPedidaExitosa
              ? 'bg-amber-600 text-white cursor-default'
              : !isComprobanteValido
              ? 'bg-slate-700/60 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-[#D5A06F] to-[#b88655] hover:from-[#e0aa78] hover:to-[#c4905e] text-[#0B2340] active:scale-[0.99]'
          }`}
        >
          {enviandoNotificacion ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {actor === 'cajero'
                  ? 'Generando precuenta y bloqueando mesa...'
                  : 'Transmitiendo solicitud a terminal de Caja...'}
              </span>
            </>
          ) : cuentaPedidaExitosa ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {actor === 'cajero'
                  ? 'Cuenta Generada en Mesa (Estado Ámbar)'
                  : 'Cuenta Notificada a Caja (Mesa en Ámbar)'}
              </span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{actor === 'cajero' ? '⚡ Generar Cuenta' : '⚡ Confirmar y Notificar a Caja'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
