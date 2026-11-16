import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Building2 } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { saasTenantsService } from '@/services/serviceAdapter';
import { hoyLocalStr, sumarMesesStr } from '@/shared/utils';
import { primerPasoInvalido } from '../components/onboarding/validacionPasos';
import {
  borrarBorradorOnboarding,
  guardarBorradorOnboarding,
  leerBorradorOnboarding,
} from '../components/onboarding/borradorOnboarding';
import { OnboardingStepper } from '../components/onboarding/OnboardingStepper';
import { Paso1EmpresaRuc } from '../components/onboarding/Paso1EmpresaRuc';
import { Paso2TitularPropietario } from '../components/onboarding/Paso2TitularPropietario';
import { Paso3PlanSaaS } from '../components/onboarding/Paso3PlanSaaS';
import { Paso4PagoBancario } from '../components/onboarding/Paso4PagoBancario';
import { Paso5TenantActivado } from '../components/onboarding/Paso5TenantActivado';
import { ResumenExpedienteSticky } from '../components/onboarding/ResumenExpedienteSticky';
import type {
  AltaManualTenantRequestDTO,
  AltaManualTenantResponseDTO,
  OrigenPagoSaaS,
  PlanSaaSDTO,
} from '@/types/saasTenants';

type CicloFacturacion = AltaManualTenantRequestDTO['ciclo_facturacion'];

/**
 * Precio de lista del plan (catálogo de la API) para el ciclo elegido: es el monto que se
 * sugiere cobrar. null si el catálogo aún no cargó o el plan no existe.
 */
const calcularMontoSugerido = (
  planes: PlanSaaSDTO[],
  planId: number,
  ciclo: CicloFacturacion
): number | null => {
  const plan = planes.find((p) => p.id === planId);
  if (!plan) return null;
  return ciclo === 'anual' ? plan.precio_anual : plan.precio_mensual;
};

/** Fin del periodo contratado a partir de su inicio (fechas locales, no UTC). */
const calcularFinPeriodo = (fechaInicio: string, ciclo: CicloFacturacion): string =>
  sumarMesesStr(fechaInicio, ciclo === 'anual' ? 12 : 1);

const crearFormularioInicial = (): AltaManualTenantRequestDTO => {
  const hoy = hoyLocalStr();
  return {
    ruc: '',
    razon_social: '',
    propietario_nombre: '',
    propietario_email: '',
    propietario_telefono: '',
    plan_id: 2,
    ciclo_facturacion: 'anual',
    fecha_inicio: hoy,
    fecha_fin_periodo: calcularFinPeriodo(hoy, 'anual'),
    // Se completa con el precio del plan en cuanto carga el catálogo
    monto_cobrado_pen: 0,
    origen_pago: 'transferencia_bancaria',
    numero_operacion: '',
    fecha_operacion: hoy,
    // Vacía a propósito: la nota la redacta quien verificó el abono, no se presupone
    nota_administrativa: '',
  };
};

export const SaasTenantOnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(1);

  // Recupera el borrador de hoy si es válido; si no, empieza de cero
  const [formData, setFormData] = useState<AltaManualTenantRequestDTO>(
    () => leerBorradorOnboarding() ?? crearFormularioInicial()
  );

  const [cargando, setCargando] = useState<boolean>(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AltaManualTenantResponseDTO | null>(null);

  // Auto-guardado en sessionStorage para prevenir pérdida por refresh accidental
  useEffect(() => {
    if (pasoActual < 5) {
      guardarBorradorOnboarding(formData);
    }
  }, [formData, pasoActual]);

  // Catálogo de planes: única fuente de precios, nombres y límites
  const [planes, setPlanes] = useState<PlanSaaSDTO[]>([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [errorPlanes, setErrorPlanes] = useState<string | null>(null);

  const cargarPlanes = useCallback(async () => {
    setCargandoPlanes(true);
    setErrorPlanes(null);
    try {
      const res = await saasTenantsService.listarPlanes();
      if (res.exito && res.datos.length > 0) {
        setPlanes(res.datos);
        // Un formulario nuevo (monto 0) toma el precio de lista del plan elegido
        setFormData((prev) => {
          if (prev.monto_cobrado_pen > 0) return prev;
          const sugerido = calcularMontoSugerido(res.datos, prev.plan_id, prev.ciclo_facturacion);
          return sugerido === null ? prev : { ...prev, monto_cobrado_pen: sugerido };
        });
      } else {
        setErrorPlanes(res.errores?.[0]?.mensaje || 'No hay planes activos disponibles para el alta.');
      }
    } catch {
      setErrorPlanes('No se pudo cargar el catálogo de planes.');
    } finally {
      setCargandoPlanes(false);
    }
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [cargarPlanes]);

  const montoSugerido = calcularMontoSugerido(planes, formData.plan_id, formData.ciclo_facturacion);
  const nombrePlanSeleccionado = planes.find((p) => p.id === formData.plan_id)?.nombre ?? null;

  const actualizarCampos = (nuevosCampos: Partial<AltaManualTenantRequestDTO>) => {
    setFormData((prev) => {
      const actualizado = { ...prev, ...nuevosCampos };

      if (nuevosCampos.plan_id !== undefined || nuevosCampos.ciclo_facturacion !== undefined) {
        // El monto sigue al plan solo si no se escribió a mano: un monto pactado se conserva
        const montoSugeridoAnterior = calcularMontoSugerido(planes, prev.plan_id, prev.ciclo_facturacion);
        const montoSugeridoNuevo = calcularMontoSugerido(
          planes,
          actualizado.plan_id,
          actualizado.ciclo_facturacion
        );
        const montoSeguiaAlPlan =
          prev.monto_cobrado_pen === 0 || prev.monto_cobrado_pen === montoSugeridoAnterior;
        if (montoSeguiaAlPlan && montoSugeridoNuevo !== null) {
          actualizado.monto_cobrado_pen = montoSugeridoNuevo;
        }
      }

      // Al cambiar de ciclo se recalcula el fin desde el inicio elegido (no desde hoy)
      if (
        nuevosCampos.ciclo_facturacion !== undefined &&
        nuevosCampos.ciclo_facturacion !== prev.ciclo_facturacion
      ) {
        const inicio = actualizado.fecha_inicio || hoyLocalStr();
        actualizado.fecha_inicio = inicio;
        actualizado.fecha_fin_periodo = calcularFinPeriodo(inicio, actualizado.ciclo_facturacion);
      }

      return actualizado;
    });
  };

  const handleIrAPaso = (pasoDestino: number) => {
    if (pasoDestino > pasoMaximoAlcanzado) return;
    // No se puede avanzar desde el stepper si un paso anterior quedó inválido tras editarlo:
    // se lleva al usuario a ese paso para que lo corrija
    const invalido = pasoDestino > 1 ? primerPasoInvalido(formData, pasoDestino - 1) : null;
    setPasoActual(invalido ?? pasoDestino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const avanzarPaso = (siguiente: number) => {
    setPasoActual(siguiente);
    setPasoMaximoAlcanzado((prev) => Math.max(prev, siguiente));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitFinal = async () => {
    // Revalidar todo el expediente: un paso pudo quedar inválido al volver atrás y editarlo
    const pasoInvalido = primerPasoInvalido(formData);
    if (pasoInvalido !== null) {
      setErrorSubmit(`Revisa el paso ${pasoInvalido}: hay datos incompletos o inválidos antes de confirmar el alta.`);
      setPasoActual(pasoInvalido);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCargando(true);
    setErrorSubmit(null);
    try {
      const res = await saasTenantsService.registrarAltaManualB2B(formData);
      if (res.exito) {
        setResultado(res.datos);
        setPasoActual(5);
        borrarBorradorOnboarding();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorSubmit(
          res.errores?.[0]?.mensaje || 'No se pudo completar el asentamiento del nuevo tenant.'
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.errores?.[0]?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo conectar con el servidor para registrar el alta. Revisa tu conexión e inténtalo de nuevo.';
      setErrorSubmit(msg);
    } finally {
      setCargando(false);
    }
  };

  const handleVerExpediente = (empresaId: string) => {
    navigate(`${ROUTES.SAAS_TENANTS}?expediente=${empresaId}`);
  };

  const handleVolverBandeja = () => {
    navigate(ROUTES.SAAS_TENANTS);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb de Navegación Áurea */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-aurea-navy/60 font-medium">
        <Link to={ROUTES.SAAS_TENANTS} className="hover:text-aurea-copper transition-colors">
          Tenancy & Suscripciones
        </Link>
        <span>›</span>
        <Link to={ROUTES.SAAS_TENANTS} className="hover:text-aurea-copper transition-colors">
          Supervisión de Empresas
        </Link>
        <span>›</span>
        <span className="text-aurea-navy font-bold">Onboarding Corporativo B2B</span>
      </nav>

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aurea-copper/20">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-aurea-navy text-aurea-gold border border-aurea-copper/40 flex items-center justify-center shrink-0 shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-aurea-navy tracking-tight">
              Alta Manual y Onboarding de Tenant SaaS
            </h1>
            <p className="text-xs sm:text-sm text-aurea-navy/70 mt-0.5 max-w-2xl">
              Formalización contractual B2B: RUC verificado ante SUNAT (Módulo 11), titular propietario, plan contratado y pago verificado por Tesorería.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleVolverBandeja}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-aurea-copper" />
            <span>Volver a la Bandeja</span>
          </button>
        </div>
      </div>

      {/* Stepper Wizard Dual (PC / Móvil) */}
      {pasoActual < 5 && (
        <OnboardingStepper
          pasoActual={pasoActual}
          pasoMaximo={pasoMaximoAlcanzado}
          onSelectPaso={handleIrAPaso}
        />
      )}

      {/* Banner de Error al Enviar */}
      {errorSubmit && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorSubmit}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorSubmit(null)}
            className="text-rose-700 hover:text-rose-900 font-bold px-2 py-1 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Contenedor Principal: 2 Columnas (8 cols formulario + 4 cols sticky summary) */}
      {pasoActual === 5 && resultado ? (
        <Paso5TenantActivado
          resultado={resultado}
          formData={formData}
          nombrePlan={nombrePlanSeleccionado}
          onVerExpediente={handleVerExpediente}
          onVolverBandeja={handleVolverBandeja}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Formulario Guiado por Pasos (8 cols) */}
          <section aria-label="Formulario del Paso Activo" className="lg:col-span-8 space-y-6">
            {pasoActual === 1 && (
              <Paso1EmpresaRuc
                ruc={formData.ruc}
                razonSocial={formData.razon_social}
                onChange={({ ruc, razonSocial }) => {
                  actualizarCampos({
                    ...(ruc !== undefined && { ruc }),
                    ...(razonSocial !== undefined && { razon_social: razonSocial }),
                  });
                }}
                onSiguiente={() => avanzarPaso(2)}
              />
            )}

            {pasoActual === 2 && (
              <Paso2TitularPropietario
                propietarioNombre={formData.propietario_nombre}
                propietarioEmail={formData.propietario_email}
                propietarioTelefono={formData.propietario_telefono}
                onChange={({ propietarioNombre, propietarioEmail, propietarioTelefono }) => {
                  actualizarCampos({
                    ...(propietarioNombre !== undefined && { propietario_nombre: propietarioNombre }),
                    ...(propietarioEmail !== undefined && { propietario_email: propietarioEmail }),
                    ...(propietarioTelefono !== undefined && {
                      propietario_telefono: propietarioTelefono,
                    }),
                  });
                }}
                onAnterior={() => avanzarPaso(1)}
                onSiguiente={() => avanzarPaso(3)}
              />
            )}

            {pasoActual === 3 && (
              <Paso3PlanSaaS
                planes={planes}
                cargandoPlanes={cargandoPlanes}
                errorPlanes={errorPlanes}
                onReintentarPlanes={cargarPlanes}
                planId={formData.plan_id}
                ciclo={formData.ciclo_facturacion}
                fechaInicio={formData.fecha_inicio}
                fechaFinPeriodo={formData.fecha_fin_periodo}
                onChange={({ planId, ciclo, fechaInicio, fechaFinPeriodo }) => {
                  actualizarCampos({
                    ...(planId !== undefined && { plan_id: planId }),
                    ...(ciclo !== undefined && { ciclo_facturacion: ciclo }),
                    ...(fechaInicio !== undefined && { fecha_inicio: fechaInicio }),
                    ...(fechaFinPeriodo !== undefined && { fecha_fin_periodo: fechaFinPeriodo }),
                  });
                }}
                onAnterior={() => avanzarPaso(2)}
                onSiguiente={() => avanzarPaso(4)}
              />
            )}

            {pasoActual === 4 && (
              <Paso4PagoBancario
                montoCobrado={formData.monto_cobrado_pen}
                montoSugerido={montoSugerido}
                origenPago={formData.origen_pago}
                numeroOperacion={formData.numero_operacion}
                fechaOperacion={formData.fecha_operacion}
                notaAdministrativa={formData.nota_administrativa}
                propietarioNombre={formData.propietario_nombre}
                cargando={cargando}
                onChange={({
                  montoCobrado,
                  origenPago,
                  numeroOperacion,
                  fechaOperacion,
                  notaAdministrativa,
                }) => {
                  actualizarCampos({
                    ...(montoCobrado !== undefined && { monto_cobrado_pen: montoCobrado }),
                    ...(origenPago !== undefined && { origen_pago: origenPago as OrigenPagoSaaS }),
                    ...(numeroOperacion !== undefined && { numero_operacion: numeroOperacion }),
                    ...(fechaOperacion !== undefined && { fecha_operacion: fechaOperacion }),
                    ...(notaAdministrativa !== undefined && { nota_administrativa: notaAdministrativa }),
                  });
                }}
                onAnterior={() => avanzarPaso(3)}
                onSubmit={handleSubmitFinal}
              />
            )}
          </section>

          {/* Columna Derecha: Resumen de Expediente Sticky (4 cols) */}
          <div className="lg:col-span-4">
            <ResumenExpedienteSticky
              pasoActual={pasoActual}
              formData={formData}
              nombrePlan={nombrePlanSeleccionado}
            />
          </div>
        </div>
      )}
    </div>
  );
};
