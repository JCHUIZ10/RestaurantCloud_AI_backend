import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SuscripcionDashboardDTO,
  MetodoPagoDTO,
} from '@/types/propietarioSuscripcion';
import { propietarioSuscripcionService } from '../services/propietarioSuscripcionService';
import { SuscripcionHeader } from '../components/suscripcion/SuscripcionHeader';
import { DunningBannerAlerta } from '../components/suscripcion/DunningBannerAlerta';
import { PlanActualCard } from '../components/suscripcion/PlanActualCard';
import { MetodoPagoCard } from '../components/suscripcion/MetodoPagoCard';
import { HistorialFacturasTabla } from '../components/suscripcion/HistorialFacturasTabla';
import { ModalActualizarTarjeta } from '../components/suscripcion/ModalActualizarTarjeta';
import { ModalCambiarPlanPreview } from '../components/suscripcion/ModalCambiarPlanPreview';
import { DemoSuscripcionWidget } from '../components/suscripcion/DemoSuscripcionWidget';
import { ROUTES } from '@/router/routes.constants';
import { Loader2, CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export const PropietarioSuscripcionPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<SuscripcionDashboardDTO | null>(null);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalTarjetaAbierto, setModalTarjetaAbierto] = useState(false);
  const [modalPlanAbierto, setModalPlanAbierto] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    tipo: 'success' | 'error' | 'info';
    mensaje: string;
  } | null>(null);

  const mostrarToast = useCallback((tipo: 'success' | 'error' | 'info', mensaje: string) => {
    setToast({ tipo, mensaje });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Carga inicial y refresco
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await propietarioSuscripcionService.getDashboardSuscripcion();
      if (res.exito && res.datos) {
        setDashboard(res.datos);
      } else {
        mostrarToast('error', 'No se pudo obtener los datos de la suscripción.');
      }
    } catch {
      mostrarToast('error', 'Error al conectar con el servicio de suscripción.');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handler tras actualizar tarjeta
  const handleExitoTarjeta = (metodo: MetodoPagoDTO, cobroRegularizado: boolean) => {
    cargarDatos();
    if (cobroRegularizado) {
      mostrarToast(
        'success',
        '¡Tarjeta actualizada con éxito! El saldo pendiente de S/ 80.00 ha sido cobrado y tu suscripción está al día.'
      );
    } else {
      mostrarToast(
        'success',
        `Método de pago actualizado: ${metodo.marca.toUpperCase()} terminada en ${metodo.ultimos_4}.`
      );
    }
  };

  // Handler cambio de plan solicitado en preview
  const handleSolicitarCambioPlan = (nombrePlan: string) => {
    setModalPlanAbierto(false);
    mostrarToast(
      'info',
      `Solicitud de cambio a ${nombrePlan} registrada. En CU-PROP-03 podrás formalizar la transacción con prorrateo automático.`
    );
  };

  if (cargando && !dashboard) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-aurea-navy mb-4" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">
          Cargando suscripción y facturación...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sincronizando estado con Stripe Billing y base de datos...
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">
          No se pudo cargar la suscripción
        </h2>
        <button
          onClick={cargarDatos}
          className="mt-4 px-4 py-2 bg-aurea-navy text-white text-xs font-bold rounded-lg shadow"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Toast Flotante */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl border text-xs font-medium max-w-md animate-slideDown ${
            toast.tipo === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toast.tipo === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : toast.tipo === 'info' ? (
            <Info className="w-5 h-5 text-sky-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{toast.mensaje}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header con estado y migas de pan */}
      <SuscripcionHeader
        plan={dashboard.plan}
        estadoSuscripcion={dashboard.suscripcion_estado}
        estadoCobro={dashboard.estado_cobro}
        onAbrirCambiarPlan={() => navigate(ROUTES.PROPIETARIO_CAMBIAR_PLAN)}
      />

      {/* 2. Banner de Dunning / Periodo de Gracia / Suspensión */}
      <DunningBannerAlerta
        estadoSuscripcion={dashboard.suscripcion_estado}
        estadoCobro={dashboard.estado_cobro}
        onActualizarTarjeta={() => setModalTarjetaAbierto(true)}
      />

      {/* 3. Rejilla Principal: Plan Actual & Recursos + Tarjeta de Crédito */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <PlanActualCard
            plan={dashboard.plan}
            usoRecursos={dashboard.uso_recursos}
            onCambiarPlan={() => navigate(ROUTES.PROPIETARIO_CAMBIAR_PLAN)}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <MetodoPagoCard
            metodoPago={dashboard.metodo_pago}
            estadoCobro={dashboard.estado_cobro}
            onActualizarTarjeta={() => setModalTarjetaAbierto(true)}
          />
        </div>
      </div>

      {/* 4. Historial de Facturas y Comprobantes Descargables */}
      <HistorialFacturasTabla facturas={dashboard.historial_pagos} />

      {/* 5. Modales */}
      <ModalActualizarTarjeta
        abierto={modalTarjetaAbierto}
        estadoCobro={dashboard.estado_cobro}
        onCerrar={() => setModalTarjetaAbierto(false)}
        onExito={handleExitoTarjeta}
      />

      <ModalCambiarPlanPreview
        abierto={modalPlanAbierto}
        planActual={dashboard.plan}
        onCerrar={() => setModalPlanAbierto(false)}
        onSolicitarCambio={handleSolicitarCambioPlan}
      />

      {/* 6. QA Sandbox Widget */}
      <DemoSuscripcionWidget
        estadoSuscripcion={dashboard.suscripcion_estado}
        estadoCobro={dashboard.estado_cobro}
        metodoPago={dashboard.metodo_pago}
        onActualizar={cargarDatos}
      />
    </div>
  );
};
