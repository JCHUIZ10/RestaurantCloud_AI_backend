import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle, Building2 } from 'lucide-react';
import { ROUTES } from '@/router/routes.constants';
import { mockSaasTenantsService } from '@/modules/saas/services/mockSaasTenantsService';
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
} from '@/types/saasTenants';

const PRECIOS_PLANES: Record<number, { mensual: number; anual: number }> = {
  1: { mensual: 40.0, anual: 400.0 },
  2: { mensual: 80.0, anual: 800.0 },
  3: { mensual: 160.0, anual: 1600.0 },
};

const getFechasIniciales = (ciclo: 'mensual' | 'anual') => {
  const hoy = new Date();
  const fechaInicio = hoy.toISOString().split('T')[0];
  const fin = new Date(hoy);
  if (ciclo === 'anual') {
    fin.setFullYear(fin.getFullYear() + 1);
  } else {
    fin.setMonth(fin.getMonth() + 1);
  }
  const fechaFinPeriodo = fin.toISOString().split('T')[0];
  return { fechaInicio, fechaFinPeriodo };
};

const DRAFT_STORAGE_KEY = 'restaurantcloud_onboarding_draft_v1';

export const SaasTenantOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pasoActual, setPasoActual] = useState<number>(1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(1);

  const { fechaInicio: initInicio, fechaFinPeriodo: initFin } = getFechasIniciales('anual');

  const [formData, setFormData] = useState<AltaManualTenantRequestDTO>(() => {
    // Si viene de demo, iniciamos con datos de prueba
    if (searchParams.get('demo') === 'true') {
      return {
        ruc: '20603849201',
        razon_social: 'Cevichería Puerto Marino S.A.C.',
        direccion_sede: 'Av. Primavera 450, Santiago de Surco, Lima',
        propietario_nombre: 'Jorge Medina Castro',
        propietario_email: 'admin@puertomarino.pe',
        propietario_telefono: '+51 991 882 334',
        plan_id: 2,
        ciclo_facturacion: 'anual',
        fecha_inicio: initInicio,
        fecha_fin_periodo: initFin,
        monto_cobrado_pen: 800.0,
        origen_pago: 'transferencia_bancaria',
        numero_operacion: 'OP-90481239-BCP',
        fecha_operacion: initInicio,
        nota_administrativa:
          'Abono anual confirmado por tesorería en cuenta corriente BCP. Comprobante archivado.',
        enviar_email_bienvenida: true,
      };
    }

    // Intentar recuperar borrador de sessionStorage
    try {
      const guardado = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (guardado) {
        return JSON.parse(guardado);
      }
    } catch {
      // Ignorar fallo de parseo
    }

    return {
      ruc: '',
      razon_social: '',
      direccion_sede: '',
      propietario_nombre: '',
      propietario_email: '',
      propietario_telefono: '',
      plan_id: 2,
      ciclo_facturacion: 'anual',
      fecha_inicio: initInicio,
      fecha_fin_periodo: initFin,
      monto_cobrado_pen: 800.0,
      origen_pago: 'transferencia_bancaria',
      numero_operacion: '',
      fecha_operacion: initInicio,
      nota_administrativa:
        'Alta comercial corporativa B2B. Asentamiento verificado por Tesorería Central.',
      enviar_email_bienvenida: true,
    };
  });

  const [cargando, setCargando] = useState<boolean>(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AltaManualTenantResponseDTO | null>(null);

  // Auto-guardado en sessionStorage para prevenir pérdida por refresh accidental
  useEffect(() => {
    if (pasoActual < 5) {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, pasoActual]);

  const actualizarCampos = (nuevosCampos: Partial<AltaManualTenantRequestDTO>) => {
    setFormData((prev) => {
      const actualizado = { ...prev, ...nuevosCampos };

      // Si cambió el plan o el ciclo, recalcular monto sugerido y fechas
      if (
        nuevosCampos.plan_id !== undefined ||
        nuevosCampos.ciclo_facturacion !== undefined
      ) {
        const plan = nuevosCampos.plan_id ?? prev.plan_id;
        const ciclo = nuevosCampos.ciclo_facturacion ?? prev.ciclo_facturacion;
        const infoPrecios = PRECIOS_PLANES[plan] || PRECIOS_PLANES[2];
        const monto = ciclo === 'anual' ? infoPrecios.anual : infoPrecios.mensual;

        actualizado.monto_cobrado_pen = monto;

        // Recalcular fechas si cambia ciclo
        if (nuevosCampos.ciclo_facturacion !== undefined) {
          const { fechaInicio, fechaFinPeriodo } = getFechasIniciales(ciclo);
          actualizado.fecha_inicio = fechaInicio;
          actualizado.fecha_fin_periodo = fechaFinPeriodo;
        }
      }

      return actualizado;
    });
  };

  const handleIrAPaso = (pasoDestino: number) => {
    if (pasoDestino <= pasoMaximoAlcanzado) {
      setPasoActual(pasoDestino);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const avanzarPaso = (siguiente: number) => {
    setPasoActual(siguiente);
    setPasoMaximoAlcanzado((prev) => Math.max(prev, siguiente));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCargarDemo = () => {
    const { fechaInicio, fechaFinPeriodo } = getFechasIniciales('anual');
    const demoData: AltaManualTenantRequestDTO = {
      ruc: '20603849201',
      razon_social: 'Cevichería Puerto Marino S.A.C.',
      direccion_sede: 'Av. Primavera 450, Santiago de Surco, Lima',
      propietario_nombre: 'Jorge Medina Castro',
      propietario_email: 'admin@puertomarino.pe',
      propietario_telefono: '+51 991 882 334',
      plan_id: 2,
      ciclo_facturacion: 'anual',
      fecha_inicio: fechaInicio,
      fecha_fin_periodo: fechaFinPeriodo,
      monto_cobrado_pen: 800.0,
      origen_pago: 'transferencia_bancaria',
      numero_operacion: 'OP-90481239-BCP',
      fecha_operacion: fechaInicio,
      nota_administrativa:
        'Abono anual confirmado por tesorería en cuenta corriente BCP. Comprobante archivado.',
      enviar_email_bienvenida: true,
    };
    setFormData(demoData);
    setPasoMaximoAlcanzado(4);
  };

  const handleSubmitFinal = async () => {
    setCargando(true);
    setErrorSubmit(null);
    try {
      const res = await mockSaasTenantsService.registrarAltaManualB2B(formData);
      if (res.exito) {
        setResultado(res.datos);
        setPasoActual(5);
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorSubmit(
          res.errores?.[0]?.mensaje || 'No se pudo completar el asentamiento del nuevo tenant.'
        );
      }
    } catch {
      setErrorSubmit('Error de red o conexión al registrar el expediente en PostgreSQL 16.');
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
              Formalización contractual B2B: Validación matemática de RUC (Módulo 11), sede física, titular y asentamiento inmutable en la tabla <code className="font-mono text-aurea-navy font-bold">pago</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {pasoActual < 5 && (
            <button
              type="button"
              onClick={handleCargarDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-aurea-champagne/40 text-aurea-navy border border-aurea-copper/30 hover:bg-aurea-champagne/60 transition-colors shadow-sm"
              title="Prellenar con datos válidos de prueba (RUC 20603849201)"
            >
              <Sparkles className="w-3.5 h-3.5 text-aurea-copper" />
              <span>Cargar Demo QA</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleVolverBandeja}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-aurea-navy border border-aurea-copper/30 hover:bg-slate-50 transition-colors shadow-sm"
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
            className="text-rose-700 hover:text-rose-900 font-bold px-2 py-1"
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
                direccionSede={formData.direccion_sede}
                onChange={({ ruc, razonSocial, direccionSede }) => {
                  actualizarCampos({
                    ...(ruc !== undefined && { ruc }),
                    ...(razonSocial !== undefined && { razon_social: razonSocial }),
                    ...(direccionSede !== undefined && { direccion_sede: direccionSede }),
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
                origenPago={formData.origen_pago}
                numeroOperacion={formData.numero_operacion}
                fechaOperacion={formData.fecha_operacion}
                notaAdministrativa={formData.nota_administrativa}
                enviarEmail={formData.enviar_email_bienvenida}
                propietarioEmail={formData.propietario_email}
                cargando={cargando}
                onChange={({
                  montoCobrado,
                  origenPago,
                  numeroOperacion,
                  fechaOperacion,
                  notaAdministrativa,
                  enviarEmail,
                }) => {
                  actualizarCampos({
                    ...(montoCobrado !== undefined && { monto_cobrado_pen: montoCobrado }),
                    ...(origenPago !== undefined && { origen_pago: origenPago as OrigenPagoSaaS }),
                    ...(numeroOperacion !== undefined && { numero_operacion: numeroOperacion }),
                    ...(fechaOperacion !== undefined && { fecha_operacion: fechaOperacion }),
                    ...(notaAdministrativa !== undefined && { nota_administrativa: notaAdministrativa }),
                    ...(enviarEmail !== undefined && { enviar_email_bienvenida: enviarEmail }),
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
            />
          </div>
        </div>
      )}
    </div>
  );
};
