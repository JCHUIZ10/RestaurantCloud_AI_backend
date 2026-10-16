/**
 * DTOs y Tipos para el Módulo de Gestión de Administradores de Local (CU-PROP-05)
 * Derivados estrictamente de:
 * - 02_schema_ddl.sql (tablas usuario, local, empresa, plan)
 * - 07_seed_local_aurea_completo.sql
 * - wireframe/propietario/CU-PROP-05-administradores-local/wireframe.md
 */

import type { ApiResponse } from './api';

export type EstadoUsuarioAdmin = 'activo' | 'inactivo' | 'pendiente_activacion';

/**
 * Cuota de cuentas de personal según el plan contratado (plan.max_usuarios)
 */
export interface CuotaPersonalDTO {
  plan_id: number;
  plan_nombre: string;
  usuarios_permitidos: number; // plan.max_usuarios (Plan Pro: 15)
  usuarios_activos: number;    // Conteo actual de colaboradores (mozos, cocina, cajeros, administradores)
  cupos_disponibles: number;   // permitidos - activos
  limite_alcanzado: boolean;
}

/**
 * Sede para asignación o reasignación de administrador
 */
export interface SedeResumenAsignacionDTO {
  id: string;
  nombre: string;
  distrito: string;
  provincia?: string;
  departamento?: string;
  tiene_administrador: boolean;
  administrador_actual?: string | null;
  total_mesas?: number;
  total_pisos?: number;
}

/**
 * Elemento de la lista de administradores
 */
export interface AdministradorItemDTO {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string;
  estado: EstadoUsuarioAdmin;
  sede_asignada: {
    id: string;
    nombre: string;
    distrito?: string;
  } | null;
  ultimo_login?: string | null;
  invitacion_token?: string;
  invitacion_expira_en?: string;
  invitacion_expirada?: boolean;
  created_at: string;
}

/**
 * Respuesta del directorio principal
 */
export interface DirectorioAdminsResponseDTO {
  cuota_usuarios: CuotaPersonalDTO;
  administradores: AdministradorItemDTO[];
}

/**
 * Datos previos para el formulario de invitación
 */
export interface FormularioDatosInvitacionDTO {
  puede_invitar: boolean;
  cupos_libres: number;
  sedes_disponibles: SedeResumenAsignacionDTO[];
  sedes_ocupadas: SedeResumenAsignacionDTO[];
}

/**
 * Payload para invitar un nuevo administrador
 */
export interface InvitarAdminRequestDTO {
  nombre: string;
  correo: string;
  telefono?: string;
  local_id: string;
}

/**
 * Payload para reasignar sede titular
 */
export interface ReasignarSedeRequestDTO {
  nuevo_local_id: string;
}

/**
 * Payload para cambiar estado (activo/inactivo)
 */
export interface CambiarEstadoAdminRequestDTO {
  nuevo_estado: 'activo' | 'inactivo';
}

/**
 * Tipos de respuesta con ApiResponse<T>
 */
export type DirectorioAdminsApiResponse = ApiResponse<DirectorioAdminsResponseDTO>;
export type FormularioDatosApiResponse = ApiResponse<FormularioDatosInvitacionDTO>;
export type InvitarAdminApiResponse = ApiResponse<{
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  estado: EstadoUsuarioAdmin;
  local_id: string;
  sede_nombre: string;
  invitacion_token: string;
  invitacion_expira_en: string;
  mensaje: string;
}>;
export type ReenviarInvitacionApiResponse = ApiResponse<{
  usuario_id: string;
  correo: string;
  nueva_expiracion: string;
  invitacion_token: string;
  mensaje: string;
}>;
export type ReasignarSedeApiResponse = ApiResponse<{
  usuario_id: string;
  nombre: string;
  sede_anterior: string;
  nueva_sede: string;
  mensaje: string;
}>;
export type CambiarEstadoAdminApiResponse = ApiResponse<{
  usuario_id: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
  sesiones_revocadas: boolean;
  mensaje: string;
}>;
