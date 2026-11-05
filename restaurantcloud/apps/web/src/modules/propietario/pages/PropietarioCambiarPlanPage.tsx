import React, { useCallback, useEffect, useState } from 'react';
import type {
  EjecutarUpgradeResponseDTO,
  PlanesComparativaResponseDTO,
  ProgramarCambioResponseDTO,
  RecursoPlan,
} from '@/types/propietarioCambiarPlan';
import type { MetricaRecursoDTO, UsoRecursosDTO } from '@/types/propietarioSuscripcion';
import { propietarioSuscripcionService } from '../services/propietarioSuscripcionService';
import { MatrizComparativaPlanes } from '../components/cambiar-plan/MatrizComparativaPlanes';
import { ModalUpgradeProrrateo } from '../components/cambiar-plan/ModalUpgradeProrrateo';
import { ModalProgramarCambio } from '../components/cambiar-plan/ModalProgramarCambio';
import { BannerCambioProgramado } from '../components/cambiar-plan/BannerCambioProgramado';
import { ModalAsistenteDowngrade } from '../components/cambiar-plan/ModalAsistenteDowngrade';
import { ConsumoRecursosRealTime } from '../components/suscripcion/ConsumoRecursosRealTime';
import { ROUTES } from '@/router/routes.constants';
import { Button, PageHeader, useToast } from '@/components/ui';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Grid,
  Layers,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react';

const ETIQUETA_RECURSO: Record<RecursoPlan, string> = {
  locales: 'locales',
  pisos: 'pisos',
  mesas: 'mesas',
  usuarios: 'cuentas de personal',
};

const formatearFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export const PropietarioCambiarPlanPage: React.FC = () => {
  const [comparativa, setComparativa] = useState<PlanesComparativaResponseDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [planUpgradeId, setPlanUpgradeId] = useState<number | null>(null);
  const [planCambioId, setPlanCambioId] = useState<number | null>(null);
  const [cancelandoCambio, setCancelandoCambio] = useState(false);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [mostrarDetalleRecursos, setMostrarDetalleRecursos] = useState(false);
  const toast = useToast();

  const cargarDatos = useCallback(async () => {
    try {
      const res = await propietarioSuscripcionService.getPlanesComparativa();
      if (res.exito && res.datos) {
        setComparativa(res.datos);
      } else {
        setComparativa(null);
      }
    } catch {
      setComparativa(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (cargando && !comparativa) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-aurea-navy mb-4" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">Cargando planes disponibles...</h2>
      </div>
    );
  }

  if (!comparativa) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="font-serif text-xl font-bold text-aurea-navy">No fue posible consultar los planes</h2>
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

  const { plan_actual, planes, recursos_en_uso } = comparativa;
  // Los precios se muestran en el ciclo contratado: el upgrade conserva mensual o anual
  const periodicidad = plan_actual.periodicidad;
  const precioActual = periodicidad === 'anual' ? plan_actual.precio_anual : plan_actual.precio_mensual;
  const motivoSinCambio =
    comparativa.suscripcion_estado !== 'activa'
      ? 'Regulariza el cobro pendiente de tu suscripción para cambiar de plan.'
      : plan_actual.downgrade_programado
        ? 'Tienes un cambio programado; cancélalo antes de cambiar de plan.'
        : null;

  const planCambio = planes.find((p) => p.id === planCambioId) ?? null;

  // Adaptador para proyectar los recursos en uso actuales frente al plan vigente
  const planActualLimits = planes.find((p) => p.es_plan_actual)?.limites;
  const calcularMetrica = (usados: number, maximo: number): MetricaRecursoDTO => ({
    usados,
    maximo,
    porcentaje: maximo > 0 ? Math.min(100, Math.round((usados / maximo) * 100)) : 0,
    limite_alcanzado: usados >= maximo,
  });

  const usoRecursosAdaptado: UsoRecursosDTO | null = planActualLimits
    ? {
        locales: calcularMetrica(recursos_en_uso.locales_activos, planActualLimits.max_locales),
        pisos: calcularMetrica(
          recursos_en_uso.por_local.reduce((max, s) => Math.max(max, s.pisos), 0),
          planActualLimits.max_pisos
        ),
        mesas: calcularMetrica(
          recursos_en_uso.por_local.reduce((max, s) => Math.max(max, s.mesas), 0),
          planActualLimits.max_mesas
        ),
        usuarios_personal: calcularMetrica(
          recursos_en_uso.por_local.reduce((max, s) => Math.max(max, s.usuarios), 0),
          planActualLimits.max_usuarios
        ),
        por_local: recursos_en_uso.por_local.map((s) => ({
          local_id: s.local_id,
          nombre: s.nombre,
          pisos: calcularMetrica(s.pisos, planActualLimits.max_pisos),
          mesas: calcularMetrica(s.mesas, planActualLimits.max_mesas),
          usuarios_personal: calcularMetrica(s.usuarios, planActualLimits.max_usuarios),
        })),
        incluye_reservas: planActualLimits.incluye_reservas,
        incluye_reportes_avanzados: planActualLimits.incluye_reportes_avanzados,
        incluye_asistente_ia: planActualLimits.incluye_asistente_ia,
        incluye_prediccion_ia: planActualLimits.incluye_prediccion_ia,
      }
    : null;

  const handleCancelarCambio = async () => {
    setCancelandoCambio(true);
    try {
      const res = await propietarioSuscripcionService.cancelarCambioProgramado();
      toast.mostrar(
        res.exito ? res.datos.mensaje : (res.errores?.[0]?.mensaje ?? 'No se pudo cancelar el cambio.'),
        res.exito ? 'ok' : 'error'
      );
    } catch {
      toast.mostrar('No pudimos conectar con el servidor. Intenta nuevamente.', 'error');
    } finally {
      setCancelandoCambio(false);
      await cargarDatos();
    }
  };

  const handleCambioProgramado = (datos: ProgramarCambioResponseDTO) => {
    setPlanCambioId(null);
    toast.mostrar(
      `Cambio a Plan ${datos.plan_destino} (${datos.ciclo}) programado para el ${formatearFecha(datos.fecha_efectiva)}. Hasta entonces sigues con tu plan actual.`,
      'ok'
    );
    if (datos.recursos_excedidos.length > 0) setAsistenteAbierto(true);
    cargarDatos();
  };

  const handleUpgradeExitoso = (datos: EjecutarUpgradeResponseDTO) => {
    setPlanUpgradeId(null);
    const funciones = datos.modulos_activados.length ? ` Ya tienes: ${datos.modulos_activados.join(', ')}.` : '';
    const cobro = datos.comprobante_pago
      ? ` Se cobraron S/ ${datos.comprobante_pago.monto_cobrado.toFixed(2)}.`
      : ' No hubo cobro hoy.';
    toast.mostrar(`Ahora estás en el Plan ${datos.plan_nombre}.${cobro}${funciones}`, 'ok');
    cargarDatos();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      <PageHeader
        titulo="Cambiar de plan"
        descripcion="Compara la capacidad y las herramientas de cada plan frente a lo que usas hoy."
        volver={{ etiqueta: 'Suscripción', to: ROUTES.PROPIETARIO_SUSCRIPCION }}
        meta={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-aurea-navy text-white shadow-sm whitespace-nowrap">
            Plan actual: {plan_actual.nombre} (S/ {precioActual.toFixed(2)}/{periodicidad === 'anual' ? 'año' : 'mes'})
          </span>
        }
      />

      {plan_actual.proximo_plan && (
        <BannerCambioProgramado
          nombrePlan={plan_actual.proximo_plan.nombre}
          ciclo={plan_actual.proximo_plan.ciclo}
          fechaEfectiva={plan_actual.proximo_plan.fecha_efectiva}
          diasRestantes={plan_actual.proximo_plan.dias_restantes}
          hayExcedentes={plan_actual.proximo_plan.recursos_excedidos.length > 0}
          seleccionGuardada={plan_actual.proximo_plan.seleccion_guardada}
          cancelando={cancelandoCambio}
          onCancelar={handleCancelarCambio}
          onElegirConservar={() => setAsistenteAbierto(true)}
        />
      )}

      {/* Bloque interactivo: Diagnóstico de Consumo en Tiempo Real antes de cambiar */}
      {usoRecursosAdaptado && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-aurea-champagne/30 text-aurea-navy border border-aurea-copper/20 shrink-0">
                <Layers className="w-5 h-5 text-aurea-copper" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-aurea-navy flex items-center gap-2">
                  Consumo de Recursos en Tiempo Real
                  <span className="text-xs font-sans font-semibold text-aurea-copper px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    {recursos_en_uso.locales_activos} {recursos_en_uso.locales_activos === 1 ? 'sede' : 'sedes'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualiza la carga operativa por sede para verificar compatibilidad antes de realizar un upgrade o downgrade.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMostrarDetalleRecursos((prev) => !prev)}
              className="border-slate-200 text-aurea-navy hover:bg-slate-50 text-xs shrink-0 font-semibold shadow-xs"
            >
              <span className="flex items-center gap-1.5">
                {mostrarDetalleRecursos ? 'Ocultar diagnóstico por sede' : 'Ver diagnóstico por sede'}
                {mostrarDetalleRecursos ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </Button>
          </div>

          {mostrarDetalleRecursos && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <ConsumoRecursosRealTime usoRecursos={usoRecursosAdaptado} mostrarCabecera={false} />
            </div>
          )}
        </section>
      )}

      {/* Catálogo de Planes Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {planes.map((p) => {
          const precio = periodicidad === 'anual' ? p.precio_anual : p.precio_mensual;
          const masCargado = (campo: 'pisos' | 'mesas' | 'usuarios') =>
            recursos_en_uso.por_local.reduce((max, sede) => Math.max(max, sede[campo]), 0);
          const filas = [
            { icono: Building2, etiqueta: 'Locales', valor: p.limites.max_locales, uso: recursos_en_uso.locales_activos, clave: 'locales' as const },
            { icono: Layers, etiqueta: 'Pisos por local', valor: p.limites.max_pisos, uso: masCargado('pisos'), clave: 'pisos' as const },
            { icono: Grid, etiqueta: 'Mesas por local', valor: p.limites.max_mesas, uso: masCargado('mesas'), clave: 'mesas' as const },
            { icono: Users, etiqueta: 'Personal por local', valor: p.limites.max_usuarios, uso: masCargado('usuarios'), clave: 'usuarios' as const },
          ];
          const funciones: Array<[boolean, string]> = [
            [p.limites.incluye_reservas, 'Módulo de reservas'],
            [p.limites.incluye_reportes_avanzados, 'Reportes avanzados'],
            [p.limites.incluye_asistente_ia, 'Asistente IA de salón'],
            [p.limites.incluye_prediccion_ia, 'Predicción de demanda IA'],
          ];

          return (
            <div
              key={p.id}
              aria-current={p.es_plan_actual ? 'true' : undefined}
              className={`rounded-2xl border p-6 flex flex-col justify-between relative ${
                p.es_plan_actual
                  ? 'border-2 border-aurea-navy bg-white shadow-xl ring-2 ring-aurea-navy/10'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {p.es_plan_actual && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-aurea-navy text-white shadow-sm">
                  Plan actual
                </span>
              )}

              <div>
                <h3 className="font-serif text-2xl font-bold text-aurea-navy">{p.nombre}</h3>
                <div className="mt-1 mb-3">
                  <span className="text-3xl font-extrabold text-aurea-navy tracking-tight">S/ {precio.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/ {periodicidad === 'anual' ? 'año' : 'mes'}</span>
                </div>
                {p.descripcion && <p className="text-xs text-slate-600 mb-4 leading-relaxed">{p.descripcion}</p>}

                <div className="space-y-2.5 py-4 border-y border-slate-100 text-xs text-slate-700">
                  {filas.map(({ icono: Icono, etiqueta, valor, uso, clave }) => {
                    const excede = p.tipo_accion === 'downgrade' && p.recursos_excedidos.includes(clave);
                    return (
                      <div key={clave} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Icono className="w-4 h-4 text-aurea-copper shrink-0" />
                          {etiqueta}
                        </span>
                        <span className="text-right">
                          <strong className="font-bold text-slate-900">Hasta {valor}</strong>
                          <span className={`block text-[10px] ${excede ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                            {clave === 'locales' ? 'Usas' : 'Tu sede más cargada'} {uso}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {p.tipo_accion === 'downgrade' && p.requiere_conciliacion && (
                  <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed">
                    Hoy superas este plan en {p.recursos_excedidos.map((r) => ETIQUETA_RECURSO[r]).join(', ')}.
                    Tendrías que elegir qué conservar antes de bajar.
                  </p>
                )}

                <ul className="mt-4 space-y-2 text-xs">
                  {funciones.map(([incluido, texto]) => (
                    <li key={texto} className="flex items-start gap-2">
                      {incluido ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 text-center text-slate-300 font-bold shrink-0">✕</span>
                      )}
                      <span className={incluido ? 'text-slate-800 font-medium' : 'text-slate-400'}>{texto}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                {p.es_plan_actual ? (
                  <div className="space-y-2">
                    <Button type="button" disabled className="w-full" variant="outline">
                      Plan actual
                    </Button>
                    {periodicidad === 'anual' && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={motivoSinCambio !== null}
                        title={motivoSinCambio ?? undefined}
                        className="w-full text-xs"
                        onClick={() => setPlanCambioId(p.id)}
                      >
                        Cambiar a facturación mensual
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={motivoSinCambio !== null}
                    variant={p.tipo_accion === 'upgrade' ? 'primary' : 'outline'}
                    leftIcon={p.tipo_accion === 'upgrade' ? <Sparkles className="w-4 h-4" /> : undefined}
                    className="w-full"
                    title={motivoSinCambio ?? undefined}
                    onClick={() => (p.tipo_accion === 'upgrade' ? setPlanUpgradeId(p.id) : setPlanCambioId(p.id))}
                  >
                    {p.tipo_accion === 'upgrade' ? `Mejorar a ${p.nombre}` : `Bajar a ${p.nombre}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {motivoSinCambio && (
        <p role="status" className="text-center text-xs text-amber-800">
          {motivoSinCambio}
        </p>
      )}

      <MatrizComparativaPlanes planes={planes} />

      <ModalProgramarCambio
        abierto={planCambio !== null}
        plan={planCambio}
        cicloActual={plan_actual.periodicidad}
        fechaRenovacion={plan_actual.fecha_renovacion}
        onCerrar={() => setPlanCambioId(null)}
        onProgramado={handleCambioProgramado}
      />

      <ModalAsistenteDowngrade
        abierto={asistenteAbierto}
        onCerrar={() => setAsistenteAbierto(false)}
        onGuardado={() => {
          setAsistenteAbierto(false);
          toast.mostrar('Selección guardada. Se aplicará cuando entre el nuevo plan.', 'ok');
          cargarDatos();
        }}
      />

      <ModalUpgradeProrrateo
        abierto={planUpgradeId !== null}
        nuevoPlanId={planUpgradeId}
        onCerrar={() => setPlanUpgradeId(null)}
        onUpgradeExitoso={handleUpgradeExitoso}
      />
    </div>
  );
};
