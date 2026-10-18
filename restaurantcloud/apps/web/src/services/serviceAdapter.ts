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
} from './api/realApiServices';

import {
  loginWithCredentials as mockLoginWithCredentials,
  seleccionarCuenta as mockSeleccionarCuenta,
  BETA_CREDENTIALS,
} from '@/modules/auth/services/mockAuthService';

import { mockMozoService } from '@/modules/mozo/services/mockMozoService';
import { mockCocinaService } from '@/modules/cocina/services/mockCocinaService';
import { mockCajaService } from '@/modules/caja/services/mockCajaService';
import { mockAdminService } from '@/modules/admin/services/mockAdminService';

export const IS_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Proxy / Fallback para Mozo: usa la API real para el flujo núcleo (plano, carta, pedidos),
// y delega a mock si se llama a una función secundaria de UI todavía no conectada.
export const mozoService = new Proxy(mockMozoService as any, {
  get(target, prop, receiver) {
    if (IS_REAL_API && prop in realMozoService) {
      const val = (realMozoService as any)[prop];
      return typeof val === 'function' ? val.bind(realMozoService) : val;
    }
    return Reflect.get(target, prop, receiver);
  },
});

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

// Proxy / Fallback para Caja POS
export const cajaService = new Proxy(mockCajaService as any, {
  get(target, prop, receiver) {
    if (IS_REAL_API && prop in realCajaService) {
      const val = (realCajaService as any)[prop];
      return typeof val === 'function' ? val.bind(realCajaService) : val;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export const adminService = new Proxy(mockAdminService as any, {
  get(target, prop, receiver) {
    if (IS_REAL_API && prop in realAdminService) {
      const val = (realAdminService as any)[prop];
      return typeof val === 'function' ? val.bind(realAdminService) : val;
    }
    return Reflect.get(target, prop, receiver);
  },
});

// Auth Exports
export const loginWithCredentials = IS_REAL_API
  ? realAuthService.loginWithCredentials
  : mockLoginWithCredentials;

export const seleccionarCuenta = IS_REAL_API
  ? realAuthService.seleccionarCuenta
  : mockSeleccionarCuenta;

export { BETA_CREDENTIALS };
