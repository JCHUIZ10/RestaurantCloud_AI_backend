/**
 * Adaptador de Servicios (Patrón Híbrido Real / Mock)
 * 
 * Permite alternar de forma transparente entre la API real de Laravel
 * y los mocks en memoria mediante la variable de entorno VITE_USE_REAL_API.
 */
import {
  realAuthService,
  realMozoService,
  realCocinaService,
  realCajaService,
  realAdminService,
  realPropietarioAdminsService,
  realPropietarioLocalesService,
} from './api/realApiServices';

import {
  loginWithCredentials as mockLoginWithCredentials,
  seleccionarCuenta as mockSeleccionarCuenta,
  BETA_CREDENTIALS,
} from '@/modules/auth/services/mockAuthService';

import { mockCocinaService } from '@/modules/cocina/services/mockCocinaService';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';
import { realPlanoService } from './api/planoService';
import { realSaasTenantsService, type SaasTenantsService } from './api/realSaasTenantsService';

export const IS_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Módulo Mozo: 100% conectado directamente a la API de Laravel
export const mozoService = realMozoService;

// Módulo Plano de Mesas (CU-ADMIN-01): 100% conectado directamente a la API de Laravel
export const planoService = realPlanoService;

// Módulo Caja POS: 100% conectado directamente a la API de Laravel
export const cajaService = realCajaService;

// Proxy / Fallback para Cocina KDS
export const cocinaService = new Proxy(mockCocinaService as any, {
  get(target, prop, receiver) {
    if (IS_REAL_API && prop in realCocinaService) {
      const val = (realCocinaService as any)[prop];
      return typeof val === 'function' ? val.bind(realCocinaService) : val;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export const adminService = new Proxy(mockAdminService as any, {
  get(target, prop, receiver) {
    if (IS_REAL_API && prop in realPlanoService) {
      const metodo = realPlanoService[prop as keyof typeof realPlanoService];
      return metodo.bind(realPlanoService);
    }
    if (IS_REAL_API && prop in realAdminService) {
      const val = (realAdminService as any)[prop];
      return typeof val === 'function' ? val.bind(realAdminService) : val;
    }
    return Reflect.get(target, prop, receiver);
  },
});

// Servicio Real para Propietario Administradores (CU-PROP-05 - 100% Backend)
export const propietarioAdminsService = realPropietarioAdminsService;

// Servicio Real para Propietario Locales (CU-PROP-04 - 100% Backend Directo)
export const propietarioLocalesService = realPropietarioLocalesService;

// Auth Exports
export const loginWithCredentials = IS_REAL_API
  ? realAuthService.loginWithCredentials
  : mockLoginWithCredentials;

export const seleccionarCuenta = IS_REAL_API
  ? realAuthService.seleccionarCuenta
  : mockSeleccionarCuenta;

export { BETA_CREDENTIALS };
export { registroEmpresaService } from '@/modules/propietario/services/registroEmpresaService';

// Servicio Real para Supervisión de Tenants y Onboarding SaaS (CU-SAAS-01 / CU-SAAS-02 - 100% Conexión Backend Producción)
export const saasTenantsService: SaasTenantsService = realSaasTenantsService;
