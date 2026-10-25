import type { RolUsuario } from '@/types/auth';
import { ROUTES } from './routes.constants';

/**
 * Fuente única de verdad del flujo de acceso por rol (reglas NV1, NV2 y NV4 de
 * implementacion/GUIA_REFACTOR_UI_RESPONSIVE_WEB.md).
 */

// Pantalla de inicio de cada rol: destino tras login, activación, registro y guards
export const HOME_POR_ROL: Record<RolUsuario, string> = {
  admin_saas: ROUTES.SAAS_TENANTS,
  propietario: ROUTES.PROPIETARIO_SEDES,
  // Mientras el Panel del Local sea un placeholder, el administrador entra al plano de mesas
  admin_local: ROUTES.ADMIN_PLANO_MESAS,
  mozo: ROUTES.MOZO_MESAS,
  cocina: ROUTES.COCINA_KDS,
  cajero: ROUTES.CAJERO_POS,
};

export const homeDeRol = (rol?: RolUsuario | null): string =>
  rol ? HOME_POR_ROL[rol] : ROUTES.LOGIN;

// Roles autorizados por área. Cada rol entra solo a su área; la única excepción es el
// propietario, que administra sus sedes desde la consola de administración de sede.
export const ROLES_AREA = {
  SAAS: ['admin_saas'],
  PROPIETARIO: ['propietario'],
  ADMIN: ['admin_local', 'propietario'],
  MOZO: ['mozo'],
  COCINA: ['cocina'],
  CAJERO: ['cajero'],
} as const satisfies Record<string, readonly RolUsuario[]>;

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  admin_saas: 'Administrador SaaS',
  propietario: 'Propietario',
  admin_local: 'Administrador de sede',
  mozo: 'Mozo',
  cocina: 'Cocina',
  cajero: 'Caja',
};

/** Acepta solo rutas internas para el parámetro ?next= (evita redirecciones abiertas). */
export const destinoSeguro = (next: string | null): string | null =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : null;

export const iniciales = (nombre?: string | null): string =>
  (nombre ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
