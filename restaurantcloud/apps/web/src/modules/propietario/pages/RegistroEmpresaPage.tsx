import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  IniciarRegistroRequestDTO,
  CompletarRegistroResponseDTO,
  PlanSaaSDTO,
} from '@/types/registroEmpresa';
import {
  registroEmpresaService,
} from '../services/registroEmpresaService';
import { RegistroStepper } from '../components/registro/RegistroStepper';
import { Paso1PlanSelector } from '../components/registro/Paso1PlanSelector';
import { Paso2DatosEmpresa } from '../components/registro/Paso2DatosEmpresa';
import { Paso3VerificacionOtp } from '../components/registro/Paso3VerificacionOtp';
import { Paso4PagoStripe, type StripeSetupRegistro } from '../components/registro/Paso4PagoStripe';
import { Paso5RegistroExitoso } from '../components/registro/Paso5RegistroExitoso';
import { useAuthStore } from '@/stores/authStore';
import { homeDeRol } from '@/router/accesoPorRol';
import { ROUTES } from '@/router/routes.constants';

export const RegistroEmpresaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUsuarioAuth = useAuthStore((s) => s.setUsuario);

  // 1. Obtener plan inicial desde query params o defecto (Pro ID: 2)
  const planParam = searchParams.get('plan');
  const initialPlanId = planParam ? parseInt(planParam, 10) : 2;
  const validPlanId = [1, 2, 3].includes(initialPlanId) ? initialPlanId : 2;

  const cicloParam = searchParams.get('ciclo') === 'anual' ? 'anual' : 'mensual';
  const [cicloFacturacion, setCicloFacturacion] = useState<'mensual' | 'anual'>(cicloParam);

  const [planSeleccionadoId, setPlanSeleccionadoId] = useState<number>(validPlanId);
  const [planes, setPlanes] = useState<PlanSaaSDTO[]>([]);
  const [cargandoPlanes, setCargandoPlanes] = useState<boolean>(true);
  const [errorPlanes, setErrorPlanes] = useState<string | null>(null);

  const cargarPlanes = async () => {
    setCargandoPlanes(true);
    setErrorPlanes(null);
    try {
      const data = await registroEmpresaService.getPlanes();
      setPlanes(data);
    } catch (err: any) {
      setErrorPlanes(err?.message || 'No se pudo conectar con el catálogo de planes en el servidor.');
    } finally {
      setCargandoPlanes(false);
    }
  };

  useEffect(() => {
    cargarPlanes();
  }, []);

  const planActual: PlanSaaSDTO | undefined = planes.find((p) => p.id === planSeleccionadoId);

  // 2. Control de Pasos (1: Plan, 2: Datos, 3: OTP, 4: Pago, 5: Éxito)
  // Si viene con un plan seleccionado desde la landing (?plan= o ?paso=2), va directo al Paso 2 (Datos de Empresa)
  const pasoParam = searchParams.get('paso');
  const pasoInicial = (pasoParam === '2' || planParam !== null) ? 2 : 1;

  const [pasoActual, setPasoActual] = useState<number>(pasoInicial);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(pasoInicial);

  // 3. Estado del Formulario (Limpio por defecto para producción)
  const [formData, setFormData] = useState<IniciarRegistroRequestDTO>({
    plan_id: validPlanId,
    ciclo_facturacion: cicloParam,
    tipo_contribuyente: 'RUC_20',
    ruc: '',
    razon_social: '',
    telefono: '',
    nombre_propietario: '',
    correo: '',
    password: '',
  });

  const [registroId, setRegistroId] = useState<string | null>(null);
  const [otpDebug, setOtpDebug] = useState<string | null>(null);
  const [stripeSetup, setStripeSetup] = useState<StripeSetupRegistro | null>(null);

  // 4. Estados de Carga y Errores UX
  const [cargando, setCargando] = useState(false);
  const [errorFiscal, setErrorFiscal] = useState<{ titulo: string; mensaje: string } | null>(null);
  const [errorRucDuplicado, setErrorRucDuplicado] = useState<string | null>(null);
  const [errorOtp, setErrorOtp] = useState<string | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  // 5. Resultado final tras activar empresa
  const [resultadoCompletado, setResultadoCompletado] =
    useState<CompletarRegistroResponseDTO | null>(null);

  // Sincronizar query params cuando el usuario cambia el plan o el ciclo
  const handleSelectPlan = (id: number) => {
    setPlanSeleccionadoId(id);
    setFormData((prev) => ({ ...prev, plan_id: id }));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('plan', id.toString());
      return next;
    });
  };

  const handleSelectCiclo = (ciclo: 'mensual' | 'anual') => {
    setCicloFacturacion(ciclo);
    setFormData((prev) => ({ ...prev, ciclo_facturacion: ciclo }));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('ciclo', ciclo);
      return next;
    });
  };

  const handleUpdateForm = (fields: Partial<IniciarRegistroRequestDTO>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    if (fields.ruc) {
      setErrorFiscal(null);
      setErrorRucDuplicado(null);
    }
  };

  // Recuperar progreso previo si existe en sessionStorage
  useEffect(() => {
    const progreso = registroEmpresaService.getRegistroEnProgreso();
    if (progreso) {
      setRegistroId(progreso.registro_id);
      setOtpDebug(progreso.otp_debug ?? null);
      if (progreso.stripe_client_secret && progreso.stripe_public_key) {
        setStripeSetup({
          clientSecret: progreso.stripe_client_secret,
          clavePublica: progreso.stripe_public_key,
        });
      }
      setPlanSeleccionadoId(progreso.plan_id);
      if (progreso.ciclo_facturacion) {
        setCicloFacturacion(progreso.ciclo_facturacion);
      }
      setFormData((prev) => ({
        ...prev,
        plan_id: progreso.plan_id,
        ciclo_facturacion: progreso.ciclo_facturacion || 'mensual',
        tipo_contribuyente: progreso.tipo_contribuyente,
        ruc: progreso.ruc,
        razon_social: progreso.razon_social,
        telefono: progreso.telefono,
        nombre_propietario: progreso.nombre_propietario,
        correo: progreso.correo,
      }));

      if (progreso.correo_verificado) {
        setPasoActual(4);
        setPasoMaximoAlcanzado(4);
      } else {
        setPasoActual(3);
        setPasoMaximoAlcanzado(3);
      }
    }
  }, []);

  // =========================================================================
  // HANDLERS DE FLUJO
  // =========================================================================

  // Paso 2 -> Paso 3: Iniciar Registro y despachar OTP
  const handleSubmitDatosEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorFiscal(null);
    setErrorRucDuplicado(null);

    try {
      const res = await registroEmpresaService.iniciarRegistro({
        ...formData,
        plan_id: planSeleccionadoId,
        ciclo_facturacion: cicloFacturacion,
      });

      if (!res.exito) {
        const error = res.errores?.[0];
        if (error?.codigo === 'RUC_YA_REGISTRADO') {
          const msg = error.mensaje || `El RUC ${formData.ruc} ya se encuentra registrado.`;
          setErrorFiscal({
            titulo: 'Conflicto de Registro Fiscal (RUC Ya Existente)',
            mensaje: msg,
          });
          setErrorRucDuplicado(msg);
        } else if (error?.codigo === 'RUC_INVALIDO') {
          setErrorFiscal({
            titulo: 'RUC Fiscalmente Inválido (SUNAT Módulo 11)',
            mensaje: error.mensaje || `El RUC ${formData.ruc} no cumple con el algoritmo oficial de SUNAT.`,
          });
        } else {
          setErrorFiscal({
            titulo: 'Error en Validación de Datos',
            mensaje: error?.mensaje || 'Error al validar los datos fiscales de registro.',
          });
        }
        return;
      }

      setRegistroId(res.datos.registro_id);
      setOtpDebug(res.datos.otp_debug ?? null);
      setPasoActual(3);
      setPasoMaximoAlcanzado((prev) => Math.max(prev, 3));
    } catch (err: any) {
      setErrorFiscal({
        titulo: 'Error de Conexión',
        mensaje: err?.message || 'Ocurrió un error de conexión al comunicarse con el servidor.',
      });
    } finally {
      setCargando(false);
    }
  };

  // Paso 3 -> Paso 4: Validar Código OTP
  const handleVerificarOtp = async (otp: string) => {
    if (!registroId) return;
    setCargando(true);
    setErrorOtp(null);

    try {
      const res = await registroEmpresaService.verificarOTP({
        registro_id: registroId,
        otp,
      });

      if (!res.exito) {
        setErrorOtp(res.errores?.[0]?.mensaje || 'Código incorrecto o expirado');
        return;
      }

      setOtpDebug(null);
      setStripeSetup({
        clientSecret: res.datos.stripe_client_secret,
        clavePublica: res.datos.stripe_public_key,
      });
      setPasoActual(4);
      setPasoMaximoAlcanzado((prev) => Math.max(prev, 4));
    } catch {
      setErrorOtp('Error al verificar el código de seguridad');
    } finally {
      setCargando(false);
    }
  };

  // Modificar Correo si hubo typo en el paso 3
  const handleModificarCorreo = async (nuevoCorreo: string) => {
    if (!registroId) return;
    const res = await registroEmpresaService.modificarCorreo({
      registro_id: registroId,
      nuevo_correo: nuevoCorreo,
    });

    if (res.exito) {
      setFormData((prev) => ({ ...prev, correo: nuevoCorreo }));
      setOtpDebug(res.datos?.otp_debug ?? null);
      setErrorOtp(null);
    } else {
      throw new Error(res.errores?.[0]?.mensaje || 'No se pudo actualizar el correo');
    }
  };

  // Reenviar OTP sobre el mismo registro (no crea una sesión nueva)
  const handleReenviarOtp = async () => {
    if (!registroId) return;
    setErrorOtp(null);
    const res = await registroEmpresaService.reenviarOtp(registroId);
    if (!res.exito) {
      setErrorOtp(res.errores?.[0]?.mensaje || 'No se pudo reenviar el código');
      return;
    }
    setOtpDebug(res.datos.otp_debug ?? null);
  };

  // Tras un cobro rechazado el SetupIntent ya quedó confirmado: se pide uno nuevo para reintentar con otra tarjeta
  const renovarSetupIntent = async () => {
    if (!registroId) return;
    const nuevo = await registroEmpresaService.nuevoSetupIntent(registroId);
    setStripeSetup(
      nuevo ? { clientSecret: nuevo.stripe_client_secret, clavePublica: nuevo.stripe_public_key } : null
    );
  };

  // La sesión de pago se perdió (recarga o expiración): se vuelve a los datos de la empresa
  const handleReiniciarRegistro = () => {
    registroEmpresaService.clearProgreso();
    setRegistroId(null);
    setOtpDebug(null);
    setStripeSetup(null);
    setErrorPago(null);
    setPasoActual(2);
  };

  // Paso 4 -> Paso 5: Confirmar Pago en Stripe y Activar Empresa
  const handleConfirmarPago = async (stripePaymentMethodId: string) => {
    if (!registroId) return;
    setCargando(true);
    setErrorPago(null);

    try {
      const res = await registroEmpresaService.completarRegistro({
        registro_id: registroId,
        stripe_payment_method_id: stripePaymentMethodId,
      });

      if (!res.exito) {
        setErrorPago(res.errores?.[0]?.mensaje || 'No se pudo procesar el cobro');
        await renovarSetupIntent();
        return;
      }

      setResultadoCompletado(res.datos);
      setPasoActual(5);
      setPasoMaximoAlcanzado(5);
      registroEmpresaService.clearProgreso();
    } catch {
      setErrorPago('Error al confirmar la transacción con la pasarela bancaria');
    } finally {
      setCargando(false);
    }
  };

  // Descarga de la constancia PDF en Paso 5
  const handleDescargarConstancia = async () => {
    if (!resultadoCompletado) return;
    await registroEmpresaService.descargarConstanciaPDF(resultadoCompletado);
  };

  // Redirección al panel del propietario con la sesión emitida por el alta
  const handleIrAlDashboard = () => {
    if (!resultadoCompletado?.token) {
      // Alta completada sin sesión automática: el propietario ingresa con sus credenciales.
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (resultadoCompletado.refresh_token) {
      localStorage.setItem('refresh_token', resultadoCompletado.refresh_token);
    }
    setUsuarioAuth(
      {
        id: resultadoCompletado.usuario.id,
        nombre: resultadoCompletado.usuario.nombre,
        correo: resultadoCompletado.usuario.correo,
        rol: 'propietario',
        empresa: {
          id: resultadoCompletado.empresa.id,
          nombre: resultadoCompletado.empresa.razon_social,
        },
      },
      resultadoCompletado.token
    );
    navigate(homeDeRol('propietario'), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] pb-24">
      {/* 1. Indicador de Progreso Responsive */}
      <RegistroStepper
        pasoActual={pasoActual}
        pasoMaximoAlcanzado={pasoMaximoAlcanzado}
        onSelectPaso={(p) => setPasoActual(p)}
      />

      {/* 2. Área Principal de Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {pasoActual === 1 && (
          <Paso1PlanSelector
            planes={planes}
            cargando={cargandoPlanes}
            error={errorPlanes}
            onReintentar={cargarPlanes}
            planSeleccionadoId={planSeleccionadoId}
            cicloFacturacion={cicloFacturacion}
            onChangeCiclo={handleSelectCiclo}
            onSelectPlan={handleSelectPlan}
            onContinuar={() => {
              setPasoActual(2);
              setPasoMaximoAlcanzado((prev) => Math.max(prev, 2));
            }}
          />
        )}

        {(pasoActual === 2 || pasoActual === 4) && !planActual && (
          <div className="text-center py-16 text-sm text-aurea-navy/70">
            {cargandoPlanes ? 'Cargando plan seleccionado...' : (
              <>
                {errorPlanes ?? 'No se encontró el plan seleccionado.'}{' '}
                <button type="button" onClick={cargarPlanes} className="underline font-semibold">
                  Reintentar
                </button>
              </>
            )}
          </div>
        )}

        {pasoActual === 2 && planActual && (
          <Paso2DatosEmpresa
            plan={planActual}
            cicloFacturacion={cicloFacturacion}
            formData={formData}
            onChangeForm={handleUpdateForm}
            onSubmit={handleSubmitDatosEmpresa}
            cargando={cargando}
            errorFiscal={errorFiscal}
            errorRucDuplicado={errorRucDuplicado}
            onVolverAPlan={() => setPasoActual(1)}
          />
        )}

        {pasoActual === 3 && (
          <Paso3VerificacionOtp
            correo={formData.correo}
            otpSugerido={otpDebug}
            onVerificarOtp={handleVerificarOtp}
            onReenviarOtp={handleReenviarOtp}
            onModificarCorreo={handleModificarCorreo}
            cargando={cargando}
            errorOtp={errorOtp}
          />
        )}

        {pasoActual === 4 && planActual && (
          <Paso4PagoStripe
            plan={planActual}
            cicloFacturacion={cicloFacturacion}
            nombrePropietario={formData.nombre_propietario}
            stripeSetup={stripeSetup}
            onConfirmarPago={handleConfirmarPago}
            onReiniciarRegistro={handleReiniciarRegistro}
            cargando={cargando}
            errorPago={errorPago}
          />
        )}

        {pasoActual === 5 && resultadoCompletado && (
          <Paso5RegistroExitoso
            resultado={resultadoCompletado}
            onDescargarConstancia={handleDescargarConstancia}
            onIrAlDashboard={handleIrAlDashboard}
          />
        )}
      </main>
    </div>
  );
};
