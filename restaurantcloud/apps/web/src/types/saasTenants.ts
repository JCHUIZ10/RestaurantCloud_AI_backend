/**
 * Tipos y DTOs para el Módulo de Supervisión de Tenants y Suscripciones SaaS (CU-SAAS-01)
 *
 * Derivados estrictamente de:
 * - 02_schema_ddl.sql (tablas empresa, suscripcion, pago, plan, local, usuario)
 * - 06_seed_initial_data.sql (planes oficiales y credenciales admin_saas)
 * - 07_seed_local_aurea_completo.sql
 * - wireframe/saas_admin/CU-SAAS-01-supervisar-tenants/wireframe.md
 * - implementacion/GUIA_DISENO_VISTAS_RESPONSIVE_DTO.md
 *
 * Regla de Oro: Cero datos inventados. Todo campo debe coincidir con columnas
 * reales o contar con una fórmula de derivación SQL documentada.
 */

import type { ApiResponse } from './api';

export type EstadoEmpresaSaaS =
  | 'activa'
  | 'periodo_gracia'
  | 'suspendida'
  | 'pendiente_baja'
  | 'eliminada';

export type OrigenAltaEmpresa = 'autoservicio_stripe' | 'manual_admin';

export type OrigenPagoSaaS =
  | 'stripe'
  | 'transferencia_bancaria'
  | 'deposito_bancario'
  | 'yape_empresa'
  | 'efectivo';

export type EstadoPagoSaaS = 'exitoso' | 'fallido' | 'reembolsado';

export interface ParametrosFiltroTenants {
  tab_estado: 'todos' | 'activa' | 'periodo_gracia' | 'suspendida' | 'pendiente_baja';
  plan_id?: number | 'todos';
  buscar?: string; // Búsqueda por RUC o Razón Social
  pagina?: number;
  por_pagina?: number;
}

/**
 * Métricas consolidadas del panel superior SaaS
 */
export interface MetricasSaaSResumenDTO {
  total_empresas: number;
  nuevas_empresas_este_mes: number;
  mrr_total_pen: number;
  suscripciones_activas: number;
  suscripciones_en_gracia: number;
  mrr_en_riesgo_pen: number;
  suscripciones_suspendidas: number;
  sedes_operativas_totales: number;
  promedio_sedes_por_tenant: number;
}

/**
 * Fila resumida de tenant para la grilla y tarjetas móviles
 */
export interface TenantItemDTO {
  empresa_id: string; // UUID de empresa.id
  codigo_display: string; // Derivado: EMP-${id.substring(0, 8).toUpperCase()}
  razon_social: string; // empresa.razon_social
  nombre_comercial_sede?: string; // Derivado de local.nombre de la sede principal
  ruc: string; // empresa.ruc (11 dígitos)
  tipo_identidad_fiscal: 'RUC_20' | 'RUC_10';
  plan_id: number; // plan.id
  plan_nombre: string; // plan.nombre ("Starter", "Pro", "Enterprise")
  locales_activos: number; // Derivado: COUNT(local.id) WHERE activo
  estado_suscripcion: EstadoEmpresaSaaS; // empresa.estado
  dias_gracia_restantes: number; // suscripcion.dias_gracia_restantes (5 a 0)
  dia_gracia_actual?: number; // Derivado: 6 - dias_gracia_restantes (Día 1 a 5)
  fecha_proximo_cobro: string; // suscripcion.fecha_fin_periodo (ISO 8601)
  fecha_corte_gracia?: string | null; // suscripcion.fecha_corte_gracia
  origen_pago_tipo: OrigenPagoSaaS; // pago.origen_pago
  metodo_pago_detalle: string; // "Visa •••• 4242" o "BCP Cta. Cte."
  origen_alta: OrigenAltaEmpresa; // empresa.origen_alta
  fecha_registro: string; // empresa.fecha_registro
}

/**
 * Transacción histórica de pago de suscripción
 */
export interface PagoHistorialItemDTO {
  id: string; // UUID de pago.id
  comprobante_codigo: string; // Derivado: numero_operacion o REC-${id.slice(0,8)}
  fecha: string; // pago.fecha
  monto_pen: number; // pago.monto
  origen_pago: OrigenPagoSaaS; // pago.origen_pago
  medio_detalle: string; // Derivado: ej. "Visa •••• 4242" o "Transf. BCP"
  estado: EstadoPagoSaaS; // pago.estado ('exitoso' | 'fallido' | 'reembolsado')
  stripe_payment_id?: string | null; // pago.stripe_payment_id
  numero_operacion?: string | null; // pago.numero_operacion
  nota?: string | null; // pago.nota
}

/**
 * Cuotas de consumo del tenant respecto al plan contratado
 */
export interface ConsumoRecursosTenantDTO {
  locales_actuales: number; // COUNT(local)
  locales_limite: number; // plan.max_locales
  mesas_actuales: number; // COUNT(mesa)
  mesas_limite: number; // plan.max_mesas
  usuarios_actuales: number; // COUNT(usuario)
  usuarios_limite: number; // plan.max_usuarios
}

/**
 * Expediente detallado 360° del tenant (Vista 2)
 */
export interface TenantDetailResponseDTO {
  empresa_id: string;
  codigo_display: string;
  ruc: string;
  tipo_contribuyente_label: string; // "RUC 20 — Persona Jurídica" | "RUC 10 — Persona Natural"
  razon_social: string;
  direccion_sede_principal: string;
  telefono_contacto: string;
  correo_contacto: string;
  propietario_titular: {
    nombre: string;
    correo: string;
    telefono: string;
    activo: boolean;
  };
  plan: {
    id: number;
    nombre: string;
    precio_mensual: number;
    ciclo: 'mensual' | 'anual';
  };
  estado_suscripcion: EstadoEmpresaSaaS;
  dias_gracia_restantes: number;
  dia_gracia_actual?: number;
  fecha_registro: string;
  fecha_proximo_cobro: string;
  fecha_corte_gracia?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  metodo_pago_detalle: string;
  origen_alta: OrigenAltaEmpresa;
  historial_pagos: PagoHistorialItemDTO[];
  consumo: ConsumoRecursosTenantDTO;
}

/**
 * Petición de alta manual B2B con validación sintáctica local y pago obligatorio
 */
export interface AltaManualTenantRequestDTO {
  ruc: string; // 11 dígitos, validado con Módulo 11
  razon_social: string;
  direccion_sede: string;
  propietario_nombre: string;
  propietario_email: string;
  propietario_telefono: string;
  plan_id: number; // 1, 2, 3
  ciclo_facturacion: 'mensual' | 'anual';
  fecha_inicio: string;
  fecha_fin_periodo: string;
  monto_cobrado_pen: number; // Requerido > 0
  origen_pago: OrigenPagoSaaS;
  numero_operacion: string;
  fecha_operacion: string;
  nota_administrativa: string;
  enviar_email_bienvenida: boolean;
}

/**
 * Respuesta a alta manual de empresa
 */
export interface AltaManualTenantResponseDTO {
  empresa_id: string;
  codigo_display: string;
  usuario_id: string;
  pago_id: string;
  email_enviado: boolean;
  mensaje: string;
}

export type TenantListApiResponse = ApiResponse<{
  metricas: MetricasSaaSResumenDTO;
  tenants: TenantItemDTO[];
  total_filas: number;
  pagina: number;
  total_paginas: number;
}>;

export type TenantDetailApiResponse = ApiResponse<TenantDetailResponseDTO>;
export type AltaManualTenantApiResponse = ApiResponse<AltaManualTenantResponseDTO>;
