import type {
  PlanSaaSDTO,
  IniciarRegistroRequestDTO,
  IniciarRegistroResponseDTO,
  ModificarCorreoRequestDTO,
  VerificarRegistroOTPRequestDTO,
  VerificarRegistroOTPResponseDTO,
  CompletarRegistroRequestDTO,
  CompletarRegistroResponseDTO,
  IniciarRegistroApiResponse,
  ModificarCorreoApiResponse,
  VerificarOTPApiResponse,
  CompletarRegistroApiResponse,
} from '@/types/registroEmpresa';
import { realRegistroEmpresaService } from '@/services/api/realApiServices';

const IS_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

/**
 * Catálogo Canónico Oficial de Planes SaaS (PostgreSQL 16: 06_seed_initial_data.sql)
 */
export const PLANES_CANONICOS: PlanSaaSDTO[] = [
  {
    id: 1,
    nombre: 'Starter',
    slug: 'plan-starter',
    descripcion: 'Ideal para cafeterías, bistrós y restaurantes independientes de 1 sede con hasta 25 mesas.',
    precio_mensual: 40.0,
    precio_anual: 400.0,
    max_locales: 1,
    max_pisos: 1,
    max_mesas: 25,
    max_usuarios: 5,
    incluye_reservas: false,
    incluye_reportes_avanzados: false,
    incluye_asistente_ia: false,
    incluye_prediccion_ia: false,
    activo: true,
    visible_publico: true,
    destacado: false,
  },
  {
    id: 2,
    nombre: 'Pro (Con IA)',
    slug: 'plan-pro',
    descripcion: 'Para restaurantes en expansión con múltiples ambientes, reservas de salón, KDS y asistente IA.',
    precio_mensual: 80.0,
    precio_anual: 800.0,
    max_locales: 3,
    max_pisos: 2,
    max_mesas: 30,
    max_usuarios: 15,
    incluye_reservas: true,
    incluye_reportes_avanzados: true,
    incluye_asistente_ia: true,
    incluye_prediccion_ia: false,
    activo: true,
    visible_publico: true,
    destacado: true,
  },
  {
    id: 3,
    nombre: 'Enterprise',
    slug: 'plan-enterprise',
    descripcion: 'Para cadenas gastronómicas y franquicias con operaciones complejas y suite completa de IA.',
    precio_mensual: 160.0,
    precio_anual: 1600.0,
    max_locales: 10,
    max_pisos: 5,
    max_mesas: 60,
    max_usuarios: 40,
    incluye_reservas: true,
    incluye_reportes_avanzados: true,
    incluye_asistente_ia: true,
    incluye_prediccion_ia: true,
    activo: true,
    visible_publico: true,
    destacado: false,
  },
];

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
  otp_valido: string;
  correo_verificado: boolean;
  intentos_restantes: number;
}

const STORAGE_KEY = 'restaurantcloud_registro_onboarding';
const DEFAULT_OTP = '529148';
const RUC_DUPLICADO_PRUEBA = '20100000001';

class RegistroEmpresaService {
  private planesCache: PlanSaaSDTO[] | null = null;

  /**
   * Obtiene la lista de planes públicos desde la API /public/planes
   */
  async getPlanes(forceRefresh = false): Promise<PlanSaaSDTO[]> {
    if (!forceRefresh && this.planesCache && this.planesCache.length > 0) {
      return this.planesCache;
    }

    try {
      const datos = await realRegistroEmpresaService.getPlanes();
      if (Array.isArray(datos) && datos.length > 0) {
        this.planesCache = datos;
        return datos;
      }
    } catch (err) {
      console.warn('[RegistroEmpresaService] Error al consultar API de planes, usando catálogo de respaldo:', err);
    }

    if (this.planesCache && this.planesCache.length > 0) return this.planesCache;

    // Degradación elegante: Usar catálogo canónico oficial para evitar bloquear al usuario
    this.planesCache = PLANES_CANONICOS;
    return PLANES_CANONICOS;
  }

  /**
   * Obtiene un plan por su ID
   */
  getPlanById(id: number): PlanSaaSDTO {
    const enCache = this.planesCache?.find((p) => p.id === id);
    if (enCache) return enCache;
    const plan = PLANES_CANONICOS.find((p) => p.id === id);
    return plan ?? PLANES_CANONICOS[1]; // Pro por defecto si no existe
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
   * Endpoint 1: Iniciar registro y despachar OTP al correo
   * POST /api/v1/public/registro/iniciar
   */
  async iniciarRegistro(
    req: IniciarRegistroRequestDTO
  ): Promise<IniciarRegistroApiResponse> {
    if (IS_REAL_API) {
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
          otp_valido: (res.datos as any).otp_debug || DEFAULT_OTP,
          correo_verificado: false,
          intentos_restantes: 3,
        });
      }
      return res;
    }

    await new Promise((res) => setTimeout(res, 600));


    // Validación de RUC duplicado de prueba
    if (req.ruc.trim() === RUC_DUPLICADO_PRUEBA) {
      return {
        exito: false,
        datos: null as unknown as IniciarRegistroResponseDTO,
        errores: [
          {
            codigo: 'RUC_YA_REGISTRADO',
            mensaje: `El RUC ${req.ruc} ya cuenta con una empresa activa en RestaurantCloud. Si eres el dueño, inicia sesión.`,
            campo: 'ruc',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const registroId = crypto.randomUUID();
    const registro: RegistroEnProgreso = {
      registro_id: registroId,
      plan_id: req.plan_id,
      tipo_contribuyente: req.tipo_contribuyente,
      ruc: req.ruc,
      razon_social: req.razon_social,
      telefono: req.telefono,
      nombre_propietario: req.nombre_propietario,
      correo: req.correo,
      ciclo_facturacion: req.ciclo_facturacion || 'mensual',
      otp_valido: DEFAULT_OTP,
      correo_verificado: false,
      intentos_restantes: 3,
    };

    this.saveRegistroEnProgreso(registro);

    return {
      exito: true,
      datos: {
        registro_id: registroId,
        mensaje: `Se ha enviado un código de verificación de 6 dígitos a ${req.correo}`,
        correo: req.correo,
        expira_en_segundos: 600,
        cooldown_reenvio_segundos: 60,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 2: Modificar correo si el usuario tuvo un error de tipeo
   * PATCH /api/v1/public/registro/modificar-correo
   */
  async modificarCorreo(
    req: ModificarCorreoRequestDTO
  ): Promise<ModificarCorreoApiResponse> {
    if (IS_REAL_API) {
      const res = await realRegistroEmpresaService.modificarCorreo(req);
      if (res.exito && res.datos) {
        const reg = this.getRegistroEnProgreso();
        if (reg) {
          reg.correo = req.nuevo_correo;
          if ((res.datos as any).otp_debug) {
            reg.otp_valido = (res.datos as any).otp_debug;
          }
          this.saveRegistroEnProgreso(reg);
        }
      }
      return res;
    }

    await new Promise((res) => setTimeout(res, 400));
    const registro = this.getRegistroEnProgreso();

    if (!registro || registro.registro_id !== req.registro_id) {
      return {
        exito: false,
        datos: null as unknown as IniciarRegistroResponseDTO,
        errores: [
          {
            codigo: 'REGISTRO_NO_ENCONTRADO',
            mensaje: 'No se encontró la sesión de registro. Por favor inicia nuevamente.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    registro.correo = req.nuevo_correo;
    registro.otp_valido = DEFAULT_OTP;
    registro.intentos_restantes = 3;
    this.saveRegistroEnProgreso(registro);

    return {
      exito: true,
      datos: {
        registro_id: registro.registro_id,
        mensaje: `Correo modificado con éxito. Hemos enviado un nuevo código a ${req.nuevo_correo}`,
        correo: req.nuevo_correo,
        expira_en_segundos: 600,
        cooldown_reenvio_segundos: 60,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 3: Validar código OTP
   * POST /api/v1/public/registro/verificar-otp
   */
  async verificarOTP(
    req: VerificarRegistroOTPRequestDTO
  ): Promise<VerificarOTPApiResponse> {
    if (IS_REAL_API) {
      const res = await realRegistroEmpresaService.verificarOTP(req);
      if (res.exito && res.datos) {
        const reg = this.getRegistroEnProgreso();
        if (reg) {
          reg.correo_verificado = true;
          this.saveRegistroEnProgreso(reg);
        }
      }
      return res;
    }

    await new Promise((res) => setTimeout(res, 500));
    const registro = this.getRegistroEnProgreso();

    if (!registro || registro.registro_id !== req.registro_id) {
      return {
        exito: false,
        datos: null as unknown as VerificarRegistroOTPResponseDTO,
        errores: [
          {
            codigo: 'REGISTRO_NO_ENCONTRADO',
            mensaje: 'Sesión de registro no válida o expirada.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    if (req.otp !== registro.otp_valido) {
      registro.intentos_restantes -= 1;
      this.saveRegistroEnProgreso(registro);

      return {
        exito: false,
        datos: null as unknown as VerificarRegistroOTPResponseDTO,
        errores: [
          {
            codigo: 'OTP_INVALIDO',
            mensaje:
              registro.intentos_restantes > 0
                ? `Código incorrecto. Te quedan ${registro.intentos_restantes} intento(s).`
                : 'Código inválido y superaste el límite de intentos. Solicita un nuevo código.',
            campo: 'otp',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // OTP Correcto
    registro.correo_verificado = true;
    this.saveRegistroEnProgreso(registro);

    const plan = this.getPlanById(registro.plan_id);
    const esAnual = registro.ciclo_facturacion === 'anual';
    const montoTotal = esAnual ? plan.precio_anual : plan.precio_mensual;

    return {
      exito: true,
      datos: {
        registro_id: registro.registro_id,
        correo_verificado: true,
        stripe_client_secret: `seti_${crypto.randomUUID()}_secret_${crypto.randomUUID().slice(0, 8)}`,
        stripe_public_key: 'pk_test_51MzRestaurantCloudDemoKey2026',
        monto_total: montoTotal,
        moneda: 'PEN',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 4: Completar registro tras confirmación de pago en Stripe
   * POST /api/v1/public/registro/completar
   */
  async completarRegistro(
    req: CompletarRegistroRequestDTO
  ): Promise<CompletarRegistroApiResponse> {
    if (IS_REAL_API) {
      return realRegistroEmpresaService.completarRegistro(req);
    }

    await new Promise((res) => setTimeout(res, 800));

    const registro = this.getRegistroEnProgreso();

    if (!registro || registro.registro_id !== req.registro_id) {
      return {
        exito: false,
        datos: null as unknown as CompletarRegistroResponseDTO,
        errores: [
          {
            codigo: 'REGISTRO_NO_ENCONTRADO',
            mensaje: 'No se encontró la sesión de registro temporal.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    if (!registro.correo_verificado) {
      return {
        exito: false,
        datos: null as unknown as CompletarRegistroResponseDTO,
        errores: [
          {
            codigo: 'CORREO_NO_VERIFICADO',
            mensaje: 'Debes verificar tu correo antes de procesar la suscripción.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const plan = this.getPlanById(registro.plan_id);
    const empresaId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();
    const esAnual = registro.ciclo_facturacion === 'anual';
    const hoy = new Date();
    const proximoPeriodo = new Date(hoy);
    if (esAnual) {
      proximoPeriodo.setFullYear(proximoPeriodo.getFullYear() + 1);
    } else {
      proximoPeriodo.setMonth(proximoPeriodo.getMonth() + 1);
    }
    const montoPagado = esAnual ? plan.precio_anual : plan.precio_mensual;

    const respuesta: CompletarRegistroResponseDTO = {
      mensaje: '¡Empresa registrada y suscripción activada con éxito!',
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({
          sub: usuarioId,
          empresa_id: empresaId,
          rol: 'propietario',
          correo: registro.correo,
          exp: Math.floor(Date.now() / 1000) + 86400,
        })
      )}.firma_mock`,
      refresh_token: crypto.randomUUID(),
      empresa: {
        id: empresaId,
        razon_social: registro.razon_social,
        ruc: registro.ruc,
        estado: 'activa',
        plan: {
          id: plan.id,
          nombre: plan.nombre,
          precio: montoPagado,
        },
      },
      usuario: {
        id: usuarioId,
        nombre: registro.nombre_propietario,
        correo: registro.correo,
        rol: 'propietario',
      },
      constancia: {
        numero_comprobante: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        periodo: esAnual ? 'Anual' : 'Mensual',
        fecha_pago: hoy.toISOString(),
        proximo_cobro: proximoPeriodo.toISOString(),
        monto_pagado: montoPagado,
        moneda: 'PEN',
        url_descarga_pdf: `/api/v1/descargas/constancia-registro/${empresaId}`,
      },
      soporte_emergencia: {
        whatsapp: '+51930723537',
        correo: 'soporte@restaurantcloud.pe',
        disponibilidad: '24/7 Prioritaria',
      },
    };

    return {
      exito: true,
      datos: respuesta,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Endpoint 5: Descarga simulada de constancia PDF
   */
  descargarConstanciaPDF(comprobanteNumero: string, razonSocial: string): void {
    const contenido = `
========================================================================
                      RESTAURANTCLOUD AI - SAAS
            CONSTANCIA OFICIAL DE ALTA Y SUSCRIPCIÓN B2B
========================================================================
Número de Comprobante : ${comprobanteNumero}
Razón Social          : ${razonSocial}
Fecha de Emisión      : ${new Date().toLocaleDateString('es-PE')}
Estado de Servicio    : ACTIVO (Tenant aprovisionado con RLS)
Pasarela Bancaria     : Stripe Payments Europe Ltd.
Soporte Técnico       : soporte@restaurantcloud.pe | WhatsApp: +51 930 723 537
========================================================================
Gracias por confiar en RestaurantCloud AI. Tu restaurante ya está activo.
========================================================================
`;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constancia_${comprobanteNumero}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const registroEmpresaService = new RegistroEmpresaService();
