import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { mozoService } from '@/services/serviceAdapter';
import type {
  PrecuentaMozoResponseDTO,
  PromocionSedeDTO,
  CodigoMetodoPago,
  DesgloseSUNATMozoDTO,
  OpcionPagoMozoDTO,
} from '../../../types/mozo';
import { PrecuentaHeader } from '../components/precuenta/PrecuentaHeader';
import { PrecuentaConsolidadoCard } from '../components/precuenta/PrecuentaConsolidadoCard';
import { PromocionComercialSelector } from '../components/precuenta/PromocionComercialSelector';
import { DesgloseSUNATCard } from '../components/precuenta/DesgloseSUNATCard';
import { MetodosPagoSelector } from '../components/precuenta/MetodosPagoSelector';
import { ModalQRBilletera } from '../components/precuenta/ModalQRBilletera';

export const MozoPrecuentaPage: React.FC = () => {
  const { mesaId = 'mesa-04' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataOriginal, setDataOriginal] = useState<PrecuentaMozoResponseDTO | null>(null);

  // Estados interactivos
  const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionSedeDTO | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<CodigoMetodoPago>('billetera_digital');
  const [modalQRAbierto, setModalQRAbierto] = useState(false);
  const [numeroOperacion, setNumeroOperacion] = useState<string>('581902');
  const [enviandoNotificacion, setEnviandoNotificacion] = useState(false);
  const [cuentaPedidaExitosa, setCuentaPedidaExitosa] = useState(false);

  // Carga inicial
  useEffect(() => {
    let montado = true;
    setCargando(true);
    setError(null);

    mozoService
      .obtenerPrecuentaMesa(mesaId)
      .then((res: any) => {
        if (!montado) return;
        if (res.exito && res.datos) {
          setDataOriginal(res.datos);
          setPromocionSeleccionada(res.datos.promocion_activa || null);
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
  }, [mesaId]);

  // Recálculo determinista instantáneo según la promoción seleccionada
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

    // Recalcular opciones de pago
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

  // Manejador para notificar a caja
  const handleNotificarCaja = async (numOp?: string) => {
    if (!calculos || enviandoNotificacion) return;

    const opToUse = numOp || (metodoSeleccionado === 'billetera_digital' ? numeroOperacion : null);

    setEnviandoNotificacion(true);
    try {
      const res = await mozoService.solicitarCuentaMesaConDetalle({
        mesa_id: mesaId,
        metodo_pago: metodoSeleccionado,
        numero_operacion: opToUse,
        monto_declarado: calculos.totalNeto,
        promocion_id: promocionSeleccionada?.id || null,
      });

      if (res.exito) {
        setCuentaPedidaExitosa(true);
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

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#07172B] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-[#D5A06F] animate-spin" />
        <p className="text-sm font-sans tracking-wide text-slate-300">
          Calculando precuenta digital y desglose fiscal SUNAT...
        </p>
      </div>
    );
  }

  if (error || !dataOriginal || !calculos) {
    return (
      <div className="min-h-screen bg-[#07172B] flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-[#0B2340] border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-serif font-bold text-red-200">
            Error al consultar la precuenta
          </h2>
          <p className="text-xs text-slate-300">{error || 'Mesa no encontrada.'}</p>
          <button
            onClick={() => navigate('/mozo/mesas')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#D5A06F] text-[#0B2340] font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al plano de salón</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172B] text-slate-100 flex flex-col antialiased selection:bg-[#D5A06F]/30 selection:text-[#FFF9F0] pb-24">
      {/* 1. Header con metadatos y alerta de cocina */}
      <PrecuentaHeader
        mesaId={mesaId}
        mesaNumero={dataOriginal.mesa_numero}
        esMesaUnida={dataOriginal.es_mesa_unida}
        mozoNombre={dataOriginal.mozo_nombre}
        comensales={dataOriginal.comensales}
        minutosEnMesa={dataOriginal.minutos_en_mesa}
        tieneCocinaPendiente={Boolean(dataOriginal.tiene_cocina_pendiente)}
        alertaCocina={dataOriginal.alerta_cocina}
      />

      {/* Banner de Estado Notificado (Ámbar) */}
      {cuentaPedidaExitosa && (
        <div className="bg-amber-600/20 border-b border-amber-500/40 px-4 py-3 text-amber-200 text-xs shadow-lg animate-fadeIn">
          <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>¡Precuenta enviada a Caja!</strong> Mesa {dataOriginal.mesa_numero} ahora se encuentra en estado <strong>[CUENTA PEDIDA]</strong>. El cajero ha recibido el monto de S/ {calculos.totalNeto.toFixed(2)}.
              </span>
            </div>
            <button
              onClick={() => navigate('/mozo/mesas')}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-[#0B2340] font-bold text-[11px] transition-colors shadow-sm ml-auto"
            >
              Ver en Plano de Salón →
            </button>
          </div>
        </div>
      )}

      {/* 2. Contenedor Principal (Grid Adaptable) */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Columna Izquierda: Consumo en mesa + Promociones (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <PrecuentaConsolidadoCard items={dataOriginal.items} />

            <PromocionComercialSelector
              promocionesDisponibles={dataOriginal.promociones_disponibles}
              promocionSeleccionada={promocionSeleccionada}
              onSeleccionarPromocion={setPromocionSeleccionada}
              consumoBruto={calculos.consumoBruto}
            />
          </div>

          {/* Columna Derecha: Desglose SUNAT + Métodos de Pago (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <DesgloseSUNATCard desglose={calculos.desgloseSUNAT} />

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
      </main>

      {/* 3. Modal de Código QR para Billetera Digital (Yape / Plin) */}
      <ModalQRBilletera
        isOpen={modalQRAbierto}
        onClose={() => setModalQRAbierto(false)}
        detalle={calculos.opcionesPago.find((o) => o.codigo === 'billetera_digital')?.detalle_billetera}
        monto={calculos.totalNeto}
        onConfirmarPago={handleConfirmarQRPago}
      />
    </div>
  );
};

export default MozoPrecuentaPage;
