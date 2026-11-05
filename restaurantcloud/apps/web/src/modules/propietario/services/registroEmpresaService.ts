import type {
  PlanSaaSDTO,
  IniciarRegistroRequestDTO,
  ModificarCorreoRequestDTO,
  VerificarRegistroOTPRequestDTO,
  CompletarRegistroRequestDTO,
  CompletarRegistroResponseDTO,
  IniciarRegistroApiResponse,
  ModificarCorreoApiResponse,
  VerificarOTPApiResponse,
  CompletarRegistroApiResponse,
} from '@/types/registroEmpresa';
import { realRegistroEmpresaService } from '@/services/api/realApiServices';
import { apiDescargarPdf } from '@/services/api/client';

interface RegistroEnProgreso {
  registro_id: string;
  plan_id: number;
  tipo_contribuyente: 'RUC_20' | 'RUC_10';
  ruc: string;
  razon_social: string;
  telefono: string;
  nombre_propietario: string;
  correo: string;
  ciclo_facturacion: 'mensual' | 'anual';
  correo_verificado: boolean;
  otp_debug?: string | null;
  /** SetupIntent de Stripe creado al verificar el correo; permite retomar el Paso 4 tras recargar */
  stripe_client_secret?: string | null;
  stripe_public_key?: string | null;
}

const STORAGE_KEY = 'restaurantcloud_registro_onboarding';

/**
 * CU-PROP-01: Registro de empresa (alta autoservicio con pago en Stripe).
 */
class RegistroEmpresaService {
  private planesCache: PlanSaaSDTO[] | null = null;

  /**
   * Catálogo de planes públicos. Falla si la API no responde: no hay catálogo local de respaldo.
   * GET /api/v1/public/planes
   */
  async getPlanes(forceRefresh = false): Promise<PlanSaaSDTO[]> {
    if (!forceRefresh && this.planesCache) {
      return this.planesCache;
    }

    const datos = await realRegistroEmpresaService.getPlanes();
    if (!Array.isArray(datos) || datos.length === 0) {
      throw new Error('El catálogo de planes no está disponible en este momento.');
    }

    this.planesCache = datos;
    return datos;
  }

  /**
   * Recupera el estado guardado en sessionStorage (resiliencia F5)
   */
  getRegistroEnProgreso(): RegistroEnProgreso | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveRegistroEnProgreso(registro: RegistroEnProgreso): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(registro));
  }

  clearProgreso(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Paso 2: iniciar registro y despachar OTP al correo
   * POST /api/v1/public/registro/iniciar
   */
  async iniciarRegistro(req: IniciarRegistroRequestDTO): Promise<IniciarRegistroApiResponse> {
    const res = await realRegistroEmpresaService.iniciarRegistro(req);
    if (res.exito && res.datos) {
      this.saveRegistroEnProgreso({
        registro_id: res.datos.registro_id,
        plan_id: req.plan_id,
        tipo_contribuyente: req.tipo_contribuyente,
        ruc: req.ruc,
        razon_social: req.razon_social,
        telefono: req.telefono,
        nombre_propietario: req.nombre_propietario,
        correo: req.correo,
        ciclo_facturacion: req.ciclo_facturacion || 'mensual',
        correo_verificado: false,
        otp_debug: res.datos.otp_debug ?? null,
      });
    }
    return res;
  }

  /**
   * Paso 3: corregir el correo si hubo un error de tipeo
   * PATCH /api/v1/public/registro/modificar-correo
   */
  async modificarCorreo(req: ModificarCorreoRequestDTO): Promise<ModificarCorreoApiResponse> {
    const res = await realRegistroEmpresaService.modificarCorreo(req);
    if (res.exito && res.datos) {
      const reg = this.getRegistroEnProgreso();
      if (reg) {
        reg.correo = req.nuevo_correo;
        reg.otp_debug = res.datos.otp_debug ?? null;
        this.saveRegistroEnProgreso(reg);
      }
    }
    return res;
  }

  /**
   * Paso 3: reenviar un código OTP nuevo conservando el mismo registro
   * POST /api/v1/public/registro/reenviar-otp
   */
  async reenviarOtp(registroId: string): Promise<IniciarRegistroApiResponse> {
    const res = await realRegistroEmpresaService.reenviarOtp({ registro_id: registroId });
    if (res.exito && res.datos) {
      const reg = this.getRegistroEnProgreso();
      if (reg) {
        reg.otp_debug = res.datos.otp_debug ?? null;
        this.saveRegistroEnProgreso(reg);
      }
    }
    return res;
  }

  /**
   * Paso 4: pedir un SetupIntent nuevo tras un cobro rechazado (el anterior ya quedó confirmado)
   * POST /api/v1/public/registro/nuevo-setup-intent
   */
  async nuevoSetupIntent(registroId: string): Promise<{ stripe_client_secret: string; stripe_public_key: string } | null> {
    const res = await realRegistroEmpresaService.nuevoSetupIntent({ registro_id: registroId });
    if (!res.exito || !res.datos) {
      return null;
    }

    const reg = this.getRegistroEnProgreso();
    if (reg) {
      reg.stripe_client_secret = res.datos.stripe_client_secret;
      reg.stripe_public_key = res.datos.stripe_public_key;
      this.saveRegistroEnProgreso(reg);
    }
    return res.datos;
  }

  /**
   * Paso 3: validar el código OTP
   * POST /api/v1/public/registro/verificar-otp
   */
  async verificarOTP(req: VerificarRegistroOTPRequestDTO): Promise<VerificarOTPApiResponse> {
    const res = await realRegistroEmpresaService.verificarOTP(req);
    if (res.exito && res.datos) {
      const reg = this.getRegistroEnProgreso();
      if (reg) {
        reg.correo_verificado = true;
        reg.otp_debug = null;
        reg.stripe_client_secret = res.datos.stripe_client_secret;
        reg.stripe_public_key = res.datos.stripe_public_key;
        this.saveRegistroEnProgreso(reg);
      }
    }
    return res;
  }

  /**
   * Paso 4: completar el registro tras confirmar el pago en Stripe
   * POST /api/v1/public/registro/completar
   */
  completarRegistro(req: CompletarRegistroRequestDTO): Promise<CompletarRegistroApiResponse> {
    return realRegistroEmpresaService.completarRegistro(req);
  }

  /**
   * Paso 5: descargar la constancia PDF persistida en el backend.
   * GET /api/v1/propietario/suscripcion/pagos/{pago_id}/recibo
   */
  async descargarConstanciaPDF(resultado: CompletarRegistroResponseDTO): Promise<void> {
    await apiDescargarPdf(
      resultado.constancia.url_descarga_pdf,
      `Constancia-${resultado.constancia.numero_comprobante}.pdf`,
      resultado.token
    );
  }
}

export const registroEmpresaService = new RegistroEmpresaService();
