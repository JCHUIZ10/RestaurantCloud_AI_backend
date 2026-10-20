/**
 * DTOs y Tipos para el Flujo de Onboarding / Registro de Empresa (CU-PROP-01)
 * Derivados estrictamente de:
 * - 02_schema_ddl.sql (tablas plan, empresa, suscripcion, usuario, pago)
 * - 06_seed_initial_data.sql (catálogo oficial de planes)
 * - wireframe/propietario/CU-PROP-01-registro-empresa/wireframe.md
 */

import type { ApiResponse } from './api';

export type TipoContribuyente = 'RUC_20' | 'RUC_10';

export interface PlanSaaSDTO {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  max_locales: number;
  max_pisos: number;
  max_mesas: number;
  max_usuarios: number;
  incluye_reservas: boolean;
  incluye_reportes_avanzados: boolean;
  incluye_asistente_ia: boolean;
  incluye_prediccion_ia: boolean;
  activo: boolean;
  visible_publico: boolean;
  destacado?: boolean;
}

export interface IniciarRegistroRequestDTO {
  plan_id: number;
  tipo_contribuyente: TipoContribuyente;
  ruc: string;
  razon_social: string;
  telefono: string;
  nombre_propietario: string;
  correo: string;
  password: string;
  ciclo_facturacion?: 'mensual' | 'anual';
}

export interface IniciarRegistroResponseDTO {
  registro_id: string;
  mensaje: string;
  correo: string;
  expira_en_segundos: number;
  cooldown_reenvio_segundos: number;
}

export interface ModificarCorreoRequestDTO {
  registro_id: string;
  nuevo_correo: string;
}

export interface VerificarRegistroOTPRequestDTO {
  registro_id: string;
  otp: string;
}

export interface VerificarRegistroOTPResponseDTO {
  registro_id: string;
  correo_verificado: boolean;
  stripe_client_secret: string;
  stripe_public_key: string;
  monto_total: number;
  moneda: string;
}

export interface CompletarRegistroRequestDTO {
  registro_id: string;
  stripe_payment_method_id: string;
}

export interface EmpresaCreadaDTO {
  id: string;
  razon_social: string;
  ruc: string;
  estado: 'activa';
  plan: {
    id: number;
    nombre: string;
    precio: number;
  };
}

export interface UsuarioCreadoDTO {
  id: string;
  nombre: string;
  correo: string;
  rol: 'propietario';
}

export interface ConstanciaRegistroDTO {
  numero_comprobante: string;
  periodo: string;
  fecha_pago: string;
  proximo_cobro: string;
  monto_pagado: number;
  moneda: string;
  url_descarga_pdf: string;
}

export interface SoporteEmergenciaDTO {
  whatsapp: string;
  correo: string;
  disponibilidad: string;
}

export interface CompletarRegistroResponseDTO {
  mensaje: string;
  token: string;
  refresh_token: string;
  empresa: EmpresaCreadaDTO;
  usuario: UsuarioCreadoDTO;
  constancia: ConstanciaRegistroDTO;
  soporte_emergencia: SoporteEmergenciaDTO;
}

// Tipo de respuesta API estándar
export type IniciarRegistroApiResponse = ApiResponse<IniciarRegistroResponseDTO>;
export type ModificarCorreoApiResponse = ApiResponse<IniciarRegistroResponseDTO>;
export type VerificarOTPApiResponse = ApiResponse<VerificarRegistroOTPResponseDTO>;
export type CompletarRegistroApiResponse = ApiResponse<CompletarRegistroResponseDTO>;
