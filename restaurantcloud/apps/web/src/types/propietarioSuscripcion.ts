/**
 * DTOs y Tipos para el Módulo de Facturación y Suscripción del Propietario (CU-PROP-02)
 * Derivados estrictamente de:
 * - 02_schema_ddl.sql (tablas suscripcion, pago, empresa, plan)
 * - 07_seed_local_aurea_completo.sql
 * - wireframe/propietario/CU-PROP-02-gestionar-suscripcion/wireframe.md
 */

import type { ApiResponse } from './api';

export type EstadoSuscripcion = 'activa' | 'en_gracia' | 'pendiente_ajuste' | 'cancelada' | 'suspendida';
export type EstadoPagoSaaS = 'exitoso' | 'fallido' | 'reembolsado';

export interface EmpresaFacturacionDTO {
  id: string;
  razon_social: string;
  ruc: string;
  tipo_identidad_fiscal: 'RUC_20' | 'RUC_10';
  correo_contacto: string;
  telefono: string;
  estado: string;
}

export interface PlanSuscripcionDTO {
  id: number;
  nombre: string;
  slug: string;
  precio_mensual: number;
  precio_anual: number;
  periodicidad: 'mensual' | 'anual';
  proximo_cobro: string;
}

export interface MetodoPagoDTO {
  marca: 'visa' | 'mastercard' | 'amex' | 'otro';
  ultimos_4: string;
  exp_mes: number;
  exp_ano: number;
  titular: string;
  proximo_a_vencer: boolean; // true si expira en <= 30 días
  estado_cobro_tarjeta: 'al_dia' | 'rechazado';
}

export interface MetricaRecursoDTO {
  usados: number;
  maximo: number;
  porcentaje: number;
  limite_alcanzado: boolean;
}

export interface UsoRecursosDTO {
  locales: MetricaRecursoDTO;
  mesas: MetricaRecursoDTO;
  usuarios_personal: MetricaRecursoDTO;
  incluye_reservas: boolean;
  incluye_reportes_avanzados: boolean;
  incluye_asistente_ia: boolean;
  incluye_prediccion_ia: boolean;
}

export interface EstadoCobroDunningDTO {
  al_dia: boolean;
  en_periodo_gracia: boolean;
  dias_gracia_restantes: number;
  fecha_corte_gracia: string | null;
  monto_pendiente: number;
  ultimo_error_cobro: string | null;
  reintentos_fallidos: number;
}

export interface FacturaSuscripcionDTO {
  id: string;
  numero_comprobante: string; // ej: F-100456
  fecha: string;
  monto: number;
  moneda: string; // 'PEN'
  estado: EstadoPagoSaaS;
  origen_pago: string;
  stripe_payment_id?: string;
  url_descarga_pdf?: string;
  descripcion?: string;
}

export interface SuscripcionDashboardDTO {
  empresa: EmpresaFacturacionDTO;
  plan: PlanSuscripcionDTO;
  suscripcion_estado: EstadoSuscripcion;
  metodo_pago: MetodoPagoDTO | null;
  uso_recursos: UsoRecursosDTO;
  estado_cobro: EstadoCobroDunningDTO;
  historial_pagos: FacturaSuscripcionDTO[];
}

export interface SetupMetodoPagoResponseDTO {
  client_secret: string;
  stripe_public_key: string;
}

export interface ConfirmarTarjetaRequestDTO {
  numero_tarjeta: string;
  mes_expiracion: number;
  ano_expiracion: number;
  cvc: string;
  titular: string;
  stripe_payment_method_id?: string;
}

export interface ConfirmarTarjetaResponseDTO {
  mensaje: string;
  metodo_pago: MetodoPagoDTO;
  cobro_pendiente_regularizado: boolean;
  nuevo_pago_id?: string;
}

export type SuscripcionDashboardApiResponse = ApiResponse<SuscripcionDashboardDTO>;
export type SetupMetodoPagoApiResponse = ApiResponse<SetupMetodoPagoResponseDTO>;
export type ConfirmarTarjetaApiResponse = ApiResponse<ConfirmarTarjetaResponseDTO>;
