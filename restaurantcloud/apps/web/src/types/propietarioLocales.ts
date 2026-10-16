/**
 * DTOs y Tipos para el Módulo de Gestión de Locales y Sedes del Propietario (CU-PROP-04)
 * Derivados estrictamente de:
 * - 02_schema_ddl.sql (tablas local, usuario, piso, mesa, caja, pedido)
 * - 07_seed_local_aurea_completo.sql
 * - wireframe/propietario/CU-PROP-04-administrar-locales/wireframe.md
 */

import type { ApiResponse } from './api';

export type GiroNegocioLocal = 'polleria' | 'cevicheria' | 'chifa' | 'en_blanco';
export type EstadoLocal = 'activo' | 'inactivo';
export type ModoAdministracionLocal = 'propietario' | 'asignar_admin';

export interface CuotaPlanLocalesDTO {
  plan_id: number;
  plan_nombre: string;
  locales_permitidos: number;
  locales_activos: number;
  cupos_disponibles: number;
  limite_alcanzado: boolean;
  downgrade_programado: boolean;
}

export interface AdministradorResumenDTO {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string;
}

export interface LocalMetricasDTO {
  total_pisos: number;
  total_mesas: number;
}

export interface LocalItemDTO {
  id: string;
  empresa_id: string;
  nombre: string;
  slug: string;
  url_carta_digital: string;
  direccion: string;
  distrito: string;
  ciudad: string;
  telefono: string;
  zona_horaria: string;
  moneda: string;
  giro_negocio: GiroNegocioLocal;
  estado: EstadoLocal;
  es_autogestionado: boolean; // True si el propietario se asignó a sí mismo la administración
  administrador: AdministradorResumenDTO | null;
  metricas: LocalMetricasDTO;
  puede_desactivar: boolean;
  created_at: string;
}

export interface DirectorioLocalesResponseDTO {
  cuota_plan: CuotaPlanLocalesDTO;
  locales: LocalItemDTO[];
}

export interface VerificarDisponibilidadResponseDTO {
  puede_crear: boolean;
  cupos_disponibles: number;
  max_permitido: number;
  administradores_disponibles: AdministradorResumenDTO[];
}

export interface VerificarSlugResponseDTO {
  slug: string;
  disponible: boolean;
  sugerencia: string | null;
  mensaje: string;
}

export interface CrearLocalRequestDTO {
  nombre: string;
  slug: string;
  direccion: string;
  distrito: string;
  ciudad: string;
  telefono: string;
  modo_administracion: ModoAdministracionLocal;
  administrador_usuario_id: string | null;
  giro_negocio: GiroNegocioLocal;
}

export interface ActualizarLocalRequestDTO {
  nombre: string;
  slug: string;
  direccion: string;
  distrito: string;
  ciudad: string;
  telefono: string;
  modo_administracion: ModoAdministracionLocal;
  administrador_usuario_id: string | null;
}

export interface BloqueoOperativoDTO {
  tipo: 'CAJA_ABIERTA' | 'PEDIDOS_ACTIVOS';
  descripcion: string;
  responsable?: string;
  monto_acumulado?: number;
  sesion_id?: string;
  mesas_afectadas?: string[];
}

export interface ValidarBajaResponseDTO {
  local_id: string;
  nombre: string;
  puede_desactivar: boolean;
  es_ultimo_local_activo: boolean;
  bloqueos_operativos: BloqueoOperativoDTO[];
  aviso: string;
}

export interface CambiarEstadoLocalRequestDTO {
  nuevo_estado: EstadoLocal;
  codigo_confirmacion?: string; // 'DESACTIVAR'
}

export interface ResumenInicializacionDTO {
  pisos_creados: number;
  piso_nombre: string;
  categorias_creadas: number;
  insumos_creados: number;
}

export interface CrearLocalResponseDTO {
  id: string;
  nombre: string;
  slug: string;
  url_carta_digital: string;
  giro_negocio: GiroNegocioLocal;
  estado: EstadoLocal;
  zona_horaria: string;
  moneda: string;
  es_autogestionado: boolean;
  resumen_inicializacion: ResumenInicializacionDTO;
  mensaje: string;
}

export type DirectorioLocalesApiResponse = ApiResponse<DirectorioLocalesResponseDTO>;
export type VerificarDisponibilidadApiResponse = ApiResponse<VerificarDisponibilidadResponseDTO>;
export type VerificarSlugApiResponse = ApiResponse<VerificarSlugResponseDTO>;
export type CrearLocalApiResponse = ApiResponse<CrearLocalResponseDTO>;
export type ActualizarLocalApiResponse = ApiResponse<LocalItemDTO>;
export type ValidarBajaApiResponse = ApiResponse<ValidarBajaResponseDTO>;
export type CambiarEstadoApiResponse = ApiResponse<{ id: string; nombre: string; estado: EstadoLocal; mensaje: string }>;
