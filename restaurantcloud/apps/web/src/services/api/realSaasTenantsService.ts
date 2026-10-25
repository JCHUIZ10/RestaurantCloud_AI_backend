/**
 * Servicio Real para Supervisión de Tenants y Suscripciones SaaS (CU-SAAS-01)
 *
 * Conectado directamente a la API de Laravel 11 y PostgreSQL 16:
 * - GET /api/v1/saas/tenants (Listado de empresas con KPIs y filtros)
 * - GET /api/v1/saas/tenants/:id (Expediente 360° del tenant)
 * - POST /api/v1/saas/tenants/alta-manual (Provisión B2B atómica con capability token)
 * - POST /api/v1/saas/tenants/:id/suspender (Suspensión preventiva de tenant)
 * - POST /api/v1/saas/tenants/:id/notificar-cobro (Reenvío de enlace de activación)
 * - GET /api/v1/saas/planes (Catálogo de planes)
 */

import axios from 'axios';
import { apiGet, apiPost } from './client';
import type {
  ParametrosFiltroTenants,
  TenantListApiResponse,
  TenantDetailApiResponse,
  AltaManualTenantRequestDTO,
  AltaManualTenantApiResponse,
} from '@/types/saasTenants';
import type { ApiResponse } from '@/types/api';

/**
 * Interceptor de seguridad para respuestas HTTP de la API SaaS.
 * Si el servidor responde con 4xx (401, 403, 404, 422) con payload JSON ApiResponse,
 * lo retorna estructurado para no quebrar el flujo de los componentes.
 */
async function safeResponse<T>(request: Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await request;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as ApiResponse<T>;
    }
    throw error;
  }
}

export interface SaasTenantsService {
  registrarAltaManualB2B(
    request: AltaManualTenantRequestDTO
  ): Promise<AltaManualTenantApiResponse>;
  listarTenants(filtros: ParametrosFiltroTenants): Promise<TenantListApiResponse>;
  obtenerExpedienteTenant(empresaId: string): Promise<TenantDetailApiResponse>;
  suspenderEmpresaPreventiva(
    empresaId: string,
    motivo: string
  ): Promise<ApiResponse<{ empresa_id?: string; estado: string }>>;
  reenviarNotificacionCobro(
    empresaId: string
  ): Promise<ApiResponse<{ mensaje: string; correo: string; invitacion_token?: string; invitacion_url?: string }>>;
}

export const realSaasTenantsService: SaasTenantsService = {
  /**
   * Registra un nuevo tenant mediante alta manual B2B en Laravel + PostgreSQL
   */
  async registrarAltaManualB2B(
    request: AltaManualTenantRequestDTO
  ): Promise<AltaManualTenantApiResponse> {
    return safeResponse(
      apiPost<AltaManualTenantApiResponse['datos']>('/saas/tenants/alta-manual', request)
    );
  },

  /**
   * Obtiene la lista de tenants supervisados con filtros y KPIs analíticos consolidados
   */
  async listarTenants(filtros: ParametrosFiltroTenants): Promise<TenantListApiResponse> {
    return safeResponse(
      apiGet<TenantListApiResponse['datos']>('/saas/tenants', filtros as unknown as Record<string, unknown>)
    );
  },

  /**
   * Obtiene el expediente 360° de un tenant por su UUID
   */
  async obtenerExpedienteTenant(empresaId: string): Promise<TenantDetailApiResponse> {
    return safeResponse(
      apiGet<TenantDetailApiResponse['datos']>(`/saas/tenants/${empresaId}`)
    );
  },

  /**
   * Suspende preventivamente una empresa y su suscripción
   */
  async suspenderEmpresaPreventiva(
    empresaId: string,
    motivo: string
  ): Promise<ApiResponse<{ empresa_id?: string; estado: string }>> {
    return safeResponse(
      apiPost<{ empresa_id?: string; estado: string }>(
        `/saas/tenants/${empresaId}/suspender`,
        { motivo }
      )
    );
  },

  /**
   * Genera y despacha un capability token / enlace de activación para el titular
   */
  async reenviarNotificacionCobro(
    empresaId: string
  ): Promise<ApiResponse<{ mensaje: string; correo: string; invitacion_token?: string; invitacion_url?: string }>> {
    return safeResponse(
      apiPost<{ mensaje: string; correo: string; invitacion_token?: string; invitacion_url?: string }>(
        `/saas/tenants/${empresaId}/notificar-cobro`
      )
    );
  },
};
