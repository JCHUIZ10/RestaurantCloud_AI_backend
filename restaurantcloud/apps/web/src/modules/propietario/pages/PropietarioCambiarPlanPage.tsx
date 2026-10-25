import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlanesComparativaResponseDTO,
  PeriodicidadFacturacion,
  EjecutarUpgradeResponseDTO,
  ProgramarDowngradeResponseDTO,
} from '@/types/propietarioCambiarPlan';
import { propietarioSuscripcionService } from '../services/propietarioSuscripcionService';
import { MatrizComparativaPlanes } from '../components/cambiar-plan/MatrizComparativaPlanes';
import { ModalUpgradeProrrateo } from '../components/cambiar-plan/ModalUpgradeProrrateo';
import { ModalAsistenteDowngrade } from '../components/cambiar-plan/ModalAsistenteDowngrade';
import { DemoCambiarPlanWidget } from '../components/cambiar-plan/DemoCambiarPlanWidget';
import { ROUTES } from '@/router/routes.constants';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Sparkles,
  Check,
  Building2,
  Users,
  Grid,
  Layers,
  AlertTriangle,
  Calendar,
  XCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { SoloDemo } from '@/components/ui/SoloDemo';

export const PropietarioCambiarPlanPage: React.FC = () => {
  const navigate = useNavigate();

  const [comparativa, setComparativa] = useState<PlanesComparativaResponseDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [periodicidad, setPeriodicidad] = useState<PeriodicidadFacturacion>('mensual');

  // Modales
  const [modalUpgradeAbierto, setModalUpgradeAbierto] = useState(false);
  const [modalDowngradeAbierto, setModalDowngradeAbierto] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<number>(3);

  // Cancelando downgrade en curso
  const [cancelandoDowngrade, setCancelandoDowngrade] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    tipo: 'success' | 'info' | 'error';
    mensaje: string;
  } | null>(null);

  const mostrarToast = useCallback((tipo: 'success' | 'info' | 'error', mensaje: string) => {
    setToast({ tipo, mensaje });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Carga de datos
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await propietarioSuscripcionService.getPlanesComparativa();
      if (res.exito && res.datos) {
        setComparativa(res.datos);
        setPeriodicidad(res.datos.plan_actual.periodicidad);
      } else {
        mostrarToast('error', 'No se pudieron consultar los planes.');
      }
    } catch {
      mostrarToast('error', 'Error al sincronizar con el catálogo de suscripciones.');
    } finally {
      setCargando(false);
    }
  }, [mostrarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejo de Cancelación de Downgrade
  const handleCancelarDowngrade = async () => {
    setCancelandoDowngrade(true);
    try {
      const res = await propietarioSuscripcionService.cancelarDowngrade();
      if (res.exito) {
        mostrarToast(
          'success',
          res.datos?.mensaje || 'Se canceló la programación de downgrade con éxito.'
        );
        cargarDatos();
      }
    } catch {
      mostrarToast('error', 'Error al cancelar el downgrade programado.');
    } finally {
      setCancelandoDowngrade(false);
    }
  };

  // Callback de Upgrade Exitoso
  const handleUpgradeExitoso = (datos: EjecutarUpgradeResponseDTO) => {
    setModalUpgradeAbierto(false);
    cargarDatos();
    mostrarToast(
      'success',
      `¡Felicitaciones! Has mejorado a Plan ${datos.plan_nombre}. Se cobraron S/ ${datos.comprobante_pago.monto_cobrado.toFixed(
        2
      )} y tus nuevas funciones de IA están activas.`
    );
  };

  // Callback de Downgrade Programado Exitoso
  const handleDowngradeProgramado = (datos: ProgramarDowngradeResponseDTO) => {
    setModalDowngradeAbierto(false);
    cargarDatos();
    mostrarToast(
      'info',
      datos.aviso ||
        'Downgrade programado exitosamente para el 01/Nov/2026. Tu Plan Pro sigue 100% activo hasta fin de mes.'
    );
  };

  if (cargando && !comparativa) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-aurea-navy mb-4" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">
          Cargando catálogo y comparativa de planes...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Consultando límites, cuotas y métricas de consumo en tiempo real...
        </p>
      </div>
    );
  }

  if (!comparativa) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">
          No se pudo cargar la información de planes
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

  const { plan_actual, planes } = comparativa;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 max-w-md animate-fadeIn text-xs ${
            toast.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : toast.tipo === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {toast.tipo === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : toast.tipo === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <span className="flex-1 font-medium leading-relaxed">{toast.mensaje}</span>
        </div>
      )}

      {/* Breadcrumbs y Cabecera */}
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-500 mb-3"
        >
          <button
            onClick={() => navigate(ROUTES.PROPIETARIO_SUSCRIPCION)}
            className="hover:text-aurea-navy flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Suscripción</span>
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">Cambiar Plan</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-aurea-navy tracking-tight">
              Cambiar Plan de Suscripción
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Adapta la capacidad operativa y herramientas de IA al ritmo de crecimiento de tu negocio
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Plan Actual:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-aurea-navy text-white shadow-xs">
              {plan_actual.nombre} (S/{' '}
              {periodicidad === 'anual'
                ? `${plan_actual.precio_anual.toFixed(2)}/año`
                : `${plan_actual.precio_mensual.toFixed(2)}/mes`}
              )
            </span>
          </div>
        </div>
      </div>

      {/* BANNER PERSISTENTE: Downgrade Programado */}
      {plan_actual.downgrade_programado && plan_actual.proximo_plan && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <span>Downgrade programado a Plan {plan_actual.proximo_plan.nombre}</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                  Corte: 01 de Noviembre
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                Tu <strong>Plan Pro</strong> sigue funcionando con todos sus locales, pisos y mesas
                hasta el fin de tu periodo actual (<strong>31 de Octubre</strong>). A partir del{' '}
                <strong>01/Nov</strong> se aplicará la tarifa reducida de{' '}
                <strong>S/ {plan_actual.proximo_plan.precio_mensual.toFixed(2)}/mes</strong> con la conciliación de recursos elegida.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={cancelandoDowngrade}
              onClick={handleCancelarDowngrade}
              className="w-full md:w-auto text-xs font-bold text-amber-900 border-amber-400 hover:bg-amber-100 flex items-center gap-2"
            >
              {cancelandoDowngrade ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Cancelar cambio programado</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Selector de Ciclo de Facturación (Mensual vs Anual) */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-2">
        <div
          role="radiogroup"
          aria-label="Periodo de cobro"
          className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200"
        >
          <button
            type="button"
            role="radio"
            aria-checked={periodicidad === 'mensual'}
            onClick={() => setPeriodicidad('mensual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              periodicidad === 'mensual'
                ? 'bg-white text-aurea-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Facturación Mensual
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={periodicidad === 'anual'}
            onClick={() => setPeriodicidad('anual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              periodicidad === 'anual'
                ? 'bg-aurea-navy text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Facturación Anual</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                periodicidad === 'anual'
                  ? 'bg-aurea-copper text-aurea-navy'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              -15% Dcto
            </span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Los precios anuales se cobran en una sola cuota de 12 meses con ahorro directo.
        </p>
      </div>

      {/* Grid de Tarjetas de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {planes.map((p) => {
          const esPlanActual = p.id === plan_actual.id;
          const precio = periodicidad === 'anual' ? p.precio_anual : p.precio_mensual;
          const sufijo = periodicidad === 'anual' ? '/ año' : '/ mes';

          const esUpgrade = p.id > plan_actual.id;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                esPlanActual
                  ? 'border-2 border-aurea-navy bg-white shadow-xl ring-2 ring-aurea-navy/10'
                  : p.destacado
                  ? 'border-aurea-copper bg-gradient-to-b from-white to-amber-50/20 shadow-md hover:shadow-lg'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Badge Plan Actual */}
              {esPlanActual && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-aurea-navy text-white shadow-sm">
                    Plan Actual Activo
                  </span>
                </div>
              )}

              {/* Badge Recomendado Enterprise */}
              {p.id === 3 && !esPlanActual && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-aurea-copper text-aurea-navy shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Recomendado Multi-Sede</span>
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-2xl font-bold text-aurea-navy">
                    {p.nombre}
                  </h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-aurea-navy font-sans tracking-tight">
                    S/ {precio.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    {sufijo}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-5 leading-relaxed min-h-[36px]">
                  {p.descripcion}
                </p>

                {/* Métricas y Límites de los 4 Recursos Canónicos */}
                <div className="space-y-2.5 py-4 border-y border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-aurea-copper shrink-0" />
                      <span>Locales físicos:</span>
                    </div>
                    <strong className="font-bold text-slate-900">
                      {p.limites.max_locales === 1 ? '1 Local' : `Hasta ${p.limites.max_locales} Locales`}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-aurea-copper shrink-0" />
                      <span>Pisos por local:</span>
                    </div>
                    <strong className="font-bold text-slate-900">
                      {p.limites.max_pisos === 1 ? '1 Piso' : `Hasta ${p.limites.max_pisos} Pisos`}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-aurea-copper shrink-0" />
                      <span>Mesas por local:</span>
                    </div>
                    <strong className="font-bold text-slate-900">
                      Hasta {p.limites.max_mesas} Mesas
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-aurea-copper shrink-0" />
                      <span>Personal staff:</span>
                    </div>
                    <strong className="font-bold text-slate-900">
                      Hasta {p.limites.max_usuarios} Cuentas
                    </strong>
                  </div>
                </div>

                {/* Features clave */}
                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    {p.limites.incluye_reservas ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 text-slate-300 shrink-0 text-center font-bold">✕</span>
                    )}
                    <span className={p.limites.incluye_reservas ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {p.limites.incluye_reservas ? 'Módulo de Reservas y Políticas' : 'Sin reservas de salón'}
                    </span>
                  </li>

                  <li className="flex items-start gap-2">
                    {p.limites.incluye_asistente_ia ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 text-slate-300 shrink-0 text-center font-bold">✕</span>
                    )}
                    <span className={p.limites.incluye_asistente_ia ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {p.limites.incluye_asistente_ia ? 'Asistente IA de Salón y Venta' : 'Sin asistente de IA'}
                    </span>
                  </li>

                  <li className="flex items-start gap-2">
                    {p.limites.incluye_prediccion_ia ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 text-slate-300 shrink-0 text-center font-bold">✕</span>
                    )}
                    <span className={p.limites.incluye_prediccion_ia ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {p.limites.incluye_prediccion_ia ? 'Forecasting IA diario de demanda' : 'Sin predicción diaria IA'}
                    </span>
                  </li>

                  <li className="flex items-start gap-2 text-slate-500">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Reportes: {p.limites.tipo_reportes}</span>
                  </li>
                </ul>
              </div>

              {/* Botón de Acción Dinámica */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                {esPlanActual ? (
                  <Button
                    type="button"
                    disabled
                    className="w-full bg-slate-100 text-slate-400 cursor-not-allowed text-xs font-bold py-2.5 shadow-none"
                  >
                    Plan Actual Activo
                  </Button>
                ) : esUpgrade ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setTargetPlanId(p.id);
                      setModalUpgradeAbierto(true);
                    }}
                    className="w-full bg-aurea-copper hover:bg-aurea-copper/90 text-aurea-navy font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mejorar a {p.nombre} (Upgrade Inmediato)</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTargetPlanId(p.id);
                      setModalDowngradeAbierto(true);
                    }}
                    className="w-full border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 hover:text-amber-900 font-bold text-xs py-2.5"
                  >
                    <span>Bajar a {p.nombre} (Requiere Conciliar)</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matriz Comparativa Detallada */}
      <MatrizComparativaPlanes planes={planes} planActualId={plan_actual.id} />

      {/* Modales */}
      <ModalUpgradeProrrateo
        abierto={modalUpgradeAbierto}
        nuevoPlanId={targetPlanId}
        periodicidad={periodicidad}
        onCerrar={() => setModalUpgradeAbierto(false)}
        onUpgradeExitoso={handleUpgradeExitoso}
      />

      <ModalAsistenteDowngrade
        abierto={modalDowngradeAbierto}
        nuevoPlanId={targetPlanId}
        onCerrar={() => setModalDowngradeAbierto(false)}
        onDowngradeProgramado={handleDowngradeProgramado}
      />

      {/* Widget flotante QA sandbox */}
      <SoloDemo>
        <DemoCambiarPlanWidget onRecargar={cargarDatos} />
      </SoloDemo>
    </div>
  );
};
