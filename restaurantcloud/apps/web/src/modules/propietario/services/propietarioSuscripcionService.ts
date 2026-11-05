/**
 * CU-PROP-02: Mi suscripción del propietario.
 * Lee el dashboard, gestiona la tarjeta de cobro y descarga las constancias de pago desde la API.
 */

import type {
  ConfirmarMetodoPagoApiResponse,
  FacturaSuscripcionDTO,
  ReintentarCobroApiResponse,
  SetupMetodoPagoApiResponse,
  SuscripcionDashboardApiResponse,
  SuscripcionDashboardDTO,
} from '@/types/propietarioSuscripcion';
import type {
  CancelarCambioApiResponse,
  EjecutarUpgradeApiResponse,
  PeriodicidadFacturacion,
  PlanesComparativaApiResponse,
  ProgramarCambioApiResponse,
  RecursosConciliacionApiResponse,
  SeleccionConservarDTO,
  SimularUpgradeApiResponse,
} from '@/types/propietarioCambiarPlan';
import type { ApiResponse } from '@/types/api';
import { apiDelete, apiGet, apiObtenerPdf, apiPost, apiPut } from '@/services/api/client';

/** Los rechazos de negocio (400/402/409...) llegan como HTTP de error con el cuerpo estándar de la API. */
async function conservarErrorDeNegocio<T>(peticion: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await peticion();
  } catch (err) {
    const cuerpo = (err as { response?: { data?: ApiResponse<T> } }).response?.data;
    if (cuerpo && cuerpo.exito === false) {
      return cuerpo;
    }
    throw err;
  }
}

class PropietarioSuscripcionService {
  getDashboardSuscripcion(): Promise<SuscripcionDashboardApiResponse> {
    return apiGet<SuscripcionDashboardDTO>('/propietario/suscripcion');
  }

  /** Catálogo de planes contrastado con el uso real de la empresa. */
  getPlanesComparativa(): Promise<PlanesComparativaApiResponse> {
    return apiGet('/propietario/suscripcion/planes-comparativa');
  }

  /** Desglose del prorrateo del upgrade, sin cobrar. */
  simularUpgrade(nuevoPlanId: number): Promise<SimularUpgradeApiResponse> {
    return conservarErrorDeNegocio(() =>
      apiPost('/propietario/suscripcion/simular-upgrade', { nuevo_plan_id: nuevoPlanId })
    );
  }

  /** Cobra el prorrateo con la tarjeta guardada y activa el nuevo plan. */
  ejecutarUpgrade(nuevoPlanId: number): Promise<EjecutarUpgradeApiResponse> {
    return conservarErrorDeNegocio(() =>
      apiPost('/propietario/suscripcion/ejecutar-upgrade', { nuevo_plan_id: nuevoPlanId })
    );
  }

  /** Programa un downgrade (o pasar de anual a mensual) para cuando termine el periodo pagado. */
  programarCambio(nuevoPlanId: number, ciclo: PeriodicidadFacturacion): Promise<ProgramarCambioApiResponse> {
    return conservarErrorDeNegocio(() =>
      apiPost('/propietario/suscripcion/programar-cambio', { nuevo_plan_id: nuevoPlanId, ciclo })
    );
  }

  cancelarCambioProgramado(): Promise<CancelarCambioApiResponse> {
    return conservarErrorDeNegocio(() => apiDelete('/propietario/suscripcion/cambio-programado'));
  }

  /** Recursos activos por local y la selección que se aplicaría al renovar. */
  getRecursosConciliacion(): Promise<RecursosConciliacionApiResponse> {
    return conservarErrorDeNegocio(() => apiGet('/propietario/suscripcion/recursos-conciliacion'));
  }

  /** Guarda qué conservar; es editable hasta la fecha efectiva del cambio. */
  guardarSeleccionConservar(seleccion: SeleccionConservarDTO): Promise<RecursosConciliacionApiResponse> {
    return conservarErrorDeNegocio(() => apiPut('/propietario/suscripcion/cambio-programado/seleccion', seleccion));
  }

  /** Paso 1 del cambio de tarjeta: SetupIntent para Stripe Elements. */
  iniciarCambioTarjeta(): Promise<SetupMetodoPagoApiResponse> {
    return conservarErrorDeNegocio(() => apiPost('/propietario/suscripcion/metodo-pago/setup'));
  }

  /** Paso 2: fija la tarjeta confirmada como predeterminada y cobra lo pendiente si lo hay. */
  confirmarTarjeta(stripePaymentMethodId: string): Promise<ConfirmarMetodoPagoApiResponse> {
    return conservarErrorDeNegocio(() =>
      apiPost('/propietario/suscripcion/metodo-pago/confirmar', {
        stripe_payment_method_id: stripePaymentMethodId,
      })
    );
  }

  /** "Pagar ahora": reintenta el cobro adeudado con la tarjeta actual. */
  reintentarCobroPendiente(): Promise<ReintentarCobroApiResponse> {
    return conservarErrorDeNegocio(() => apiPost('/propietario/suscripcion/cobro-pendiente/reintentar'));
  }

  obtenerConstancia(factura: FacturaSuscripcionDTO): Promise<Blob> {
    if (!factura.url_descarga_pdf) {
      return Promise.reject(new Error('Este pago no tiene constancia disponible.'));
    }
    return apiObtenerPdf(factura.url_descarga_pdf);
  }
}

export const propietarioSuscripcionService = new PropietarioSuscripcionService();
