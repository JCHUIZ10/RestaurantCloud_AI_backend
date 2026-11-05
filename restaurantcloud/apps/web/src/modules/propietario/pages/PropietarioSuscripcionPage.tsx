import React, { useState, useEffect, useCallback } from 'react';
import type { SetupMetodoPagoDTO, SuscripcionDashboardDTO } from '@/types/propietarioSuscripcion';
import { propietarioSuscripcionService } from '../services/propietarioSuscripcionService';
import { SuscripcionHeader } from '../components/suscripcion/SuscripcionHeader';
import { DunningBannerAlerta } from '../components/suscripcion/DunningBannerAlerta';
import { PlanActualCard } from '../components/suscripcion/PlanActualCard';
import { MetodoPagoCard } from '../components/suscripcion/MetodoPagoCard';
import { HistorialFacturasTabla } from '../components/suscripcion/HistorialFacturasTabla';
import { ModalActualizarTarjeta } from '../components/suscripcion/ModalActualizarTarjeta';
import { ModalAsistenteDowngrade } from '../components/cambiar-plan/ModalAsistenteDowngrade';
import { useToast } from '@/components/ui';
import { Loader2, AlertCircle } from 'lucide-react';

const MENSAJE_CONEXION = 'No pudimos conectar con el servidor. Intenta nuevamente.';

export const PropietarioSuscripcionPage: React.FC = () => {
  const toast = useToast();
  const [dashboard, setDashboard] = useState<SuscripcionDashboardDTO | null>(null);
  const [cargando, setCargando] = useState(true);

  const [modalTarjetaAbierto, setModalTarjetaAbierto] = useState(false);
  const [setup, setSetup] = useState<SetupMetodoPagoDTO | null>(null);
  const [cargandoSetup, setCargandoSetup] = useState(false);
  const [errorTarjeta, setErrorTarjeta] = useState<string | null>(null);
  const [pagando, setPagando] = useState(false);
  const [cancelandoCambio, setCancelandoCambio] = useState(false);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const res = await propietarioSuscripcionService.getDashboardSuscripcion();
      setDashboard(res.exito && res.datos ? res.datos : null);
    } catch {
      setDashboard(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Pide a la API un SetupIntent nuevo; cada tarjeta confirmada consume el anterior
  const prepararFormularioTarjeta = useCallback(async () => {
    setCargandoSetup(true);
    setSetup(null);
    try {
      const res = await propietarioSuscripcionService.iniciarCambioTarjeta();
      if (res.exito && res.datos) {
        setSetup(res.datos);
      } else {
        setErrorTarjeta(res.errores?.[0]?.mensaje ?? 'No pudimos preparar el formulario de tarjeta.');
      }
    } catch {
      setErrorTarjeta(MENSAJE_CONEXION);
    } finally {
      setCargandoSetup(false);
    }
  }, []);

  const abrirModalTarjeta = () => {
    setErrorTarjeta(null);
    setModalTarjetaAbierto(true);
    prepararFormularioTarjeta();
  };

  const cerrarModalTarjeta = () => {
    setModalTarjetaAbierto(false);
    setSetup(null);
    setErrorTarjeta(null);
  };

  const handleTarjetaConfirmada = async (paymentMethodId: string) => {
    setErrorTarjeta(null);

    try {
      const res = await propietarioSuscripcionService.confirmarTarjeta(paymentMethodId);

      if (res.exito) {
        toast.mostrar(res.datos.mensaje, 'ok');
        cerrarModalTarjeta();
        await cargarDatos();
        return;
      }

      setErrorTarjeta(res.errores?.[0]?.mensaje ?? 'No se pudo actualizar la tarjeta.');
    } catch {
      setErrorTarjeta(MENSAJE_CONEXION);
    }

    // El SetupIntent usado ya no admite otra tarjeta; se prepara uno nuevo para reintentar.
    // Si la tarjeta sí se guardó (cobro pendiente rechazado), el dashboard debe reflejarla.
    await Promise.all([prepararFormularioTarjeta(), cargarDatos()]);
  };

  const handlePagarAhora = async () => {
    setPagando(true);
    try {
      const res = await propietarioSuscripcionService.reintentarCobroPendiente();
      toast.mostrar(
        res.exito ? res.datos.mensaje : (res.errores?.[0]?.mensaje ?? 'No se pudo procesar el cobro.'),
        res.exito ? 'ok' : 'error'
      );
    } catch {
      toast.mostrar(MENSAJE_CONEXION, 'error');
    } finally {
      setPagando(false);
      await cargarDatos();
    }
  };

  const handleCancelarCambio = async () => {
    setCancelandoCambio(true);
    try {
      const res = await propietarioSuscripcionService.cancelarCambioProgramado();
      toast.mostrar(
        res.exito ? res.datos.mensaje : (res.errores?.[0]?.mensaje ?? 'No se pudo cancelar el cambio.'),
        res.exito ? 'ok' : 'error'
      );
    } catch {
      toast.mostrar(MENSAJE_CONEXION, 'error');
    } finally {
      setCancelandoCambio(false);
      await cargarDatos();
    }
  };

  if (cargando && !dashboard) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-aurea-navy mb-4" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">
          Cargando suscripción y facturación...
        </h2>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">
          No pudimos cargar la información de suscripción
        </h2>
        <button
          onClick={() => {
            setCargando(true);
            cargarDatos();
          }}
          className="mt-4 px-4 py-2 bg-aurea-navy text-white text-xs font-bold rounded-lg shadow"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      <SuscripcionHeader
        plan={dashboard.plan}
        estadoSuscripcion={dashboard.suscripcion_estado}
        estadoCobro={dashboard.estado_cobro}
      />

      <DunningBannerAlerta
        estadoSuscripcion={dashboard.suscripcion_estado}
        estadoCobro={dashboard.estado_cobro}
        tieneTarjeta={dashboard.metodo_pago !== null}
        pagando={pagando}
        onActualizarTarjeta={abrirModalTarjeta}
        onPagarAhora={handlePagarAhora}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <PlanActualCard
            plan={dashboard.plan}
            usoRecursos={dashboard.uso_recursos}
            cancelandoCambio={cancelandoCambio}
            onCancelarCambio={handleCancelarCambio}
            onElegirConservar={() => setAsistenteAbierto(true)}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <MetodoPagoCard
            metodoPago={dashboard.metodo_pago}
            estadoCobro={dashboard.estado_cobro}
            onActualizarTarjeta={abrirModalTarjeta}
          />
        </div>
      </div>

      <HistorialFacturasTabla facturas={dashboard.historial_pagos} />

      <ModalAsistenteDowngrade
        abierto={asistenteAbierto}
        onCerrar={() => setAsistenteAbierto(false)}
        onGuardado={() => {
          setAsistenteAbierto(false);
          toast.mostrar('Selección guardada. Se aplicará cuando entre el nuevo plan.', 'ok');
          cargarDatos();
        }}
      />

      <ModalActualizarTarjeta
        abierto={modalTarjetaAbierto}
        setup={setup}
        cargandoSetup={cargandoSetup}
        montoPendiente={dashboard.estado_cobro.monto_pendiente}
        titularInicial={dashboard.metodo_pago?.titular}
        error={errorTarjeta}
        onTarjetaConfirmada={handleTarjetaConfirmada}
        onReintentarPreparacion={() => {
          setErrorTarjeta(null);
          prepararFormularioTarjeta();
        }}
        onCerrar={cerrarModalTarjeta}
      />
    </div>
  );
};
