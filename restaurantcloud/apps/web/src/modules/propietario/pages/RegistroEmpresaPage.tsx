import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  IniciarRegistroRequestDTO,
  CompletarRegistroResponseDTO,
  PlanSaaSDTO,
} from '@/types/registroEmpresa';
import {
  registroEmpresaService,
  PLANES_CANONICOS,
} from '../services/registroEmpresaService';
import { RegistroStepper } from '../components/registro/RegistroStepper';
import { Paso1PlanSelector } from '../components/registro/Paso1PlanSelector';
import { Paso2DatosEmpresa } from '../components/registro/Paso2DatosEmpresa';
import { Paso3VerificacionOtp } from '../components/registro/Paso3VerificacionOtp';
import { Paso4PagoStripe } from '../components/registro/Paso4PagoStripe';
import { Paso5RegistroExitoso } from '../components/registro/Paso5RegistroExitoso';
import { DemoRegistroWidget } from '../components/registro/DemoRegistroWidget';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/router/routes.constants';

export const RegistroEmpresaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUsuarioAuth = useAuthStore((s) => s.setUsuario);

  // 1. Obtener plan inicial desde query params o defecto (Pro ID: 2)
  const planParam = searchParams.get('plan');
  const initialPlanId = planParam ? parseInt(planParam, 10) : 2;
  const validPlanId = [1, 2, 3].includes(initialPlanId) ? initialPlanId : 2;

  const [planSeleccionadoId, setPlanSeleccionadoId] = useState<number>(validPlanId);
  const planActual: PlanSaaSDTO = registroEmpresaService.getPlanById(planSeleccionadoId);

  // 2. Control de Pasos (1: Plan, 2: Datos, 3: OTP, 4: Pago, 5: Éxito)
  // Si viene con ?plan en URL, avanzamos directamente al Paso 2 para mayor fluidez
  const [pasoActual, setPasoActual] = useState<number>(planParam ? 2 : 1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(planParam ? 2 : 1);

  // 3. Estado del Formulario
  const [formData, setFormData] = useState<IniciarRegistroRequestDTO>({
    plan_id: validPlanId,
    tipo_contribuyente: 'RUC_20',
    ruc: '20601234567',
    razon_social: 'El Tenedor Gourmet S.A.C.',
    telefono: '+51 987 654 321',
    nombre_propietario: 'Manuel García Pardo',
    correo: 'manuel.garcia@gmail.com',
    password: 'PasswordPropietario2026!',
  });

  const [registroId, setRegistroId] = useState<string | null>(null);

  // 4. Estados de Carga y Errores UX
  const [cargando, setCargando] = useState(false);
  const [errorRucDuplicado, setErrorRucDuplicado] = useState<string | null>(null);
  const [errorOtp, setErrorOtp] = useState<string | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  // 5. Resultado final tras activar empresa
  const [resultadoCompletado, setResultadoCompletado] =
    useState<CompletarRegistroResponseDTO | null>(null);

  // Sincronizar query param cuando el usuario cambia el plan
  const handleSelectPlan = (id: number) => {
    setPlanSeleccionadoId(id);
    setFormData((prev) => ({ ...prev, plan_id: id }));
    setSearchParams({ plan: id.toString() });
  };

  const handleUpdateForm = (fields: Partial<IniciarRegistroRequestDTO>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    if (fields.ruc) setErrorRucDuplicado(null);
  };

  // Recuperar progreso previo si existe en sessionStorage
  useEffect(() => {
    const progreso = registroEmpresaService.getRegistroEnProgreso();
    if (progreso) {
      setRegistroId(progreso.registro_id);
      setPlanSeleccionadoId(progreso.plan_id);
      setFormData((prev) => ({
        ...prev,
        plan_id: progreso.plan_id,
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
    setErrorRucDuplicado(null);

    try {
      const res = await registroEmpresaService.iniciarRegistro({
        ...formData,
        plan_id: planSeleccionadoId,
      });

      if (!res.exito) {
        const error = res.errores?.[0];
        if (error?.codigo === 'RUC_YA_REGISTRADO') {
          setErrorRucDuplicado(error.mensaje);
        } else {
          setErrorRucDuplicado(error?.mensaje || 'Error al validar el registro fiscal');
        }
        return;
      }

      setRegistroId(res.datos.registro_id);
      setPasoActual(3);
      setPasoMaximoAlcanzado((prev) => Math.max(prev, 3));
    } catch {
      setErrorRucDuplicado('Ocurrió un error de conexión al despachar el código OTP');
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
      setErrorOtp(null);
    } else {
      throw new Error(res.errores?.[0]?.mensaje || 'No se pudo actualizar el correo');
    }
  };

  // Reenviar OTP
  const handleReenviarOtp = async () => {
    if (!registroId) return;
    await registroEmpresaService.iniciarRegistro({
      ...formData,
      plan_id: planSeleccionadoId,
    });
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

  // Descarga de comprobante en Paso 5
  const handleDescargarConstancia = () => {
    if (!resultadoCompletado) return;
    registroEmpresaService.descargarConstanciaPDF(
      resultadoCompletado.constancia.numero_comprobante,
      resultadoCompletado.empresa.razon_social
    );
  };

  // Redirección al panel del propietario
  const handleIrAlDashboard = () => {
    if (resultadoCompletado) {
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
    }
    navigate(ROUTES.PROPIETARIO_DASHBOARD);
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
            planes={PLANES_CANONICOS}
            planSeleccionadoId={planSeleccionadoId}
            onSelectPlan={handleSelectPlan}
            onContinuar={() => {
              setPasoActual(2);
              setPasoMaximoAlcanzado((prev) => Math.max(prev, 2));
            }}
          />
        )}

        {pasoActual === 2 && (
          <Paso2DatosEmpresa
            plan={planActual}
            formData={formData}
            onChangeForm={handleUpdateForm}
            onSubmit={handleSubmitDatosEmpresa}
            cargando={cargando}
            errorRucDuplicado={errorRucDuplicado}
            onVolverAPlan={() => setPasoActual(1)}
          />
        )}

        {pasoActual === 3 && (
          <Paso3VerificacionOtp
            correo={formData.correo}
            onVerificarOtp={handleVerificarOtp}
            onReenviarOtp={handleReenviarOtp}
            onModificarCorreo={handleModificarCorreo}
            cargando={cargando}
            errorOtp={errorOtp}
          />
        )}

        {pasoActual === 4 && (
          <Paso4PagoStripe
            plan={planActual}
            nombrePropietario={formData.nombre_propietario}
            onConfirmarPago={handleConfirmarPago}
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

      {/* 3. Widget Interactivo de Pruebas (Demo CU-PROP-01) */}
      <DemoRegistroWidget
        pasoActual={pasoActual}
        onSetPaso={(p) => {
          setPasoActual(p);
          setPasoMaximoAlcanzado((prev) => Math.max(prev, p));
        }}
        onSelectPlan={handleSelectPlan}
        planIdActual={planSeleccionadoId}
        onAutoLlenarForm={(data) => handleUpdateForm(data)}
        onSimularRucDuplicado={() => {
          handleUpdateForm({ ruc: '20100000001' });
          setErrorRucDuplicado(
            'El RUC 20100000001 ya cuenta con una empresa activa en RestaurantCloud. Si eres el dueño, inicia sesión.'
          );
        }}
        onAutoLlenarOtp={() => handleVerificarOtp('529148')}
        onSimularErrorPago={() =>
          setErrorPago(
            'Tu tarjeta fue rechazada por el banco emisor (Fondos insuficientes o límite de crédito alcanzado).'
          )
        }
      />
    </div>
  );
};
