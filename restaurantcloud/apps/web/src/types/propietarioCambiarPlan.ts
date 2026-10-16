/**
 * DTOs y Tipos para CU-PROP-03: Cambiar Plan de Suscripción
 * (Upgrade Inmediato con Prorrateo Stripe y Downgrade Programado con Conciliación de Recursos)
 * Derivados estrictamente de:
 * - 02_schema_ddl.sql (tablas suscripcion, plan, pago)
 * - 06_seed_initial_data.sql (planes Starter, Pro, Enterprise)
 * - 07_seed_local_aurea_completo.sql (datos y estructura de Áurea)
 * - wireframe/propietario/CU-PROP-03-cambiar-plan/wireframe.md
 */

import type { ApiResponse } from './api';
import type { MetodoPagoDTO } from './propietarioSuscripcion';

export type PeriodicidadFacturacion = 'mensual' | 'anual';

export interface LimitesPlanDTO {
  max_locales: number;
  max_pisos: number;
  max_mesas: number;
  max_usuarios: number;
  incluye_reservas: boolean;
  incluye_reportes_avanzados: boolean;
  incluye_asistente_ia: boolean;
  incluye_prediccion_ia: boolean;
  tipo_reportes: string; // 'Básico (CSV)', 'Avanzado (PDF/Excel)', 'Auditoría + BI'
  tipo_soporte: string;  // 'Correo (48h)', 'Chat (24h)', 'Prioritario 24/7'
}

export interface PlanComparativoDTO {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  precio_mensual: number;
  precio_anual: number;
  limites: LimitesPlanDTO;
  es_plan_actual: boolean;
  tipo_accion: 'actual' | 'upgrade' | 'downgrade';
  requiere_conciliacion: boolean;
  recursos_excedidos: string[];
  destacado?: boolean;
}

export interface RecursosEnUsoDTO {
  locales_activos: number;
  pisos_activos: number;
  mesas_activas: number;
  usuarios_activos: number;
}

export interface PlanActualInfoDTO {
  id: number;
  nombre: string;
  precio_mensual: number;
  precio_anual: number;
  periodicidad: PeriodicidadFacturacion;
  dias_restantes_ciclo: number;
  dias_totales_ciclo: number;
  fecha_renovacion: string;
  downgrade_programado: boolean;
  proximo_plan: {
    id: number;
    nombre: string;
    precio_mensual: number;
  } | null;
}

export interface PlanesComparativaResponseDTO {
  plan_actual: PlanActualInfoDTO;
  recursos_en_uso: RecursosEnUsoDTO;
  planes: PlanComparativoDTO[];
}

// =========================================================================
// Flujo A: Simular y Ejecutar Upgrade Inmediato con Prorrateo Stripe
// =========================================================================

export interface SimularUpgradeRequestDTO {
  nuevo_plan_id: number;
  periodicidad: PeriodicidadFacturacion;
}

export interface SimularUpgradeResponseDTO {
  plan_origen: string;
  plan_destino: string;
  dias_restantes_ciclo: number;
  dias_totales_ciclo: number;
  fecha_proximo_ciclo: string;
  credito_plan_actual: number;       // ej: -124.50
  costo_nuevo_plan_proporcional: number; // ej: +249.50
  monto_neto_a_pagar_hoy: number;    // ej: 125.00
  moneda: string;                    // 'PEN'
  nuevo_monto_recurrente: number;    // ej: 499.00
  metodo_pago_defecto: MetodoPagoDTO;
}

export interface EjecutarUpgradeRequestDTO {
  nuevo_plan_id: number;
  periodicidad: PeriodicidadFacturacion;
}

export interface EjecutarUpgradeResponseDTO {
  suscripcion_id: string;
  plan_id: number;
  plan_nombre: string;
  estado: string;
  comprobante_pago: {
    pago_id: string;
    numero_factura: string;
    monto_cobrado: number;
    moneda: string;
    url_recibo_pdf: string;
    descripcion: string;
  };
  modulos_activados: string[];
}

// =========================================================================
// Flujo B: Asistente Wizard de Conciliación de Recursos para Downgrade
// =========================================================================

export interface RecursoMesaDTO {
  id: string;
  etiqueta: string;
  capacidad: number;
  forma: string;
  estado_actual: string;
}

export interface RecursoPisoDTO {
  id: string;
  nombre: string;
  mesas: RecursoMesaDTO[];
}

export interface RecursoLocalDTO {
  id: string;
  nombre: string;
  slug: string;
  es_casa_matriz: boolean;
  pisos: RecursoPisoDTO[];
}

export interface RecursoUsuarioStaffDTO {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  protegido: boolean; // true para 'propietario' (no se puede desactivar)
  local_asignado?: string;
}

export interface RecursosConciliacionResponseDTO {
  nuevo_plan: {
    id: number;
    nombre: string;
    limites: {
      max_locales: number;
      max_pisos: number;
      max_mesas: number;
      max_usuarios: number;
    };
  };
  arbol_locales: RecursoLocalDTO[];
  usuarios_staff: RecursoUsuarioStaffDTO[];
}

export interface ConfiguracionDowngradeDTO {
  local_id_activo: string;
  piso_id_activo: string;
  mesas_ids_activas: string[];
  usuarios_ids_activos: string[];
}

export interface ProgramarDowngradeRequestDTO {
  nuevo_plan_id: number;
  config_downgrade: ConfiguracionDowngradeDTO;
}

export interface ProgramarDowngradeResponseDTO {
  programado: boolean;
  plan_actual: string;
  proximo_plan: string;
  fecha_efectiva: string;
  recursos_conciliados: boolean;
  resumen_desactivacion_programada: {
    locales_a_inactivar: number;
    pisos_a_inactivar: number;
    mesas_a_inactivar: number;
    usuarios_a_inactivar: number;
  };
  aviso: string;
}

export interface CancelarDowngradeResponseDTO {
  cancelado: boolean;
  plan_activo: string;
  tarifa_mensual: number;
  proximo_cobro: string;
  mensaje: string;
}

// =========================================================================
// Tipos de Respuesta API
// =========================================================================

export type PlanesComparativaApiResponse = ApiResponse<PlanesComparativaResponseDTO>;
export type SimularUpgradeApiResponse = ApiResponse<SimularUpgradeResponseDTO>;
export type EjecutarUpgradeApiResponse = ApiResponse<EjecutarUpgradeResponseDTO>;
export type RecursosConciliacionApiResponse = ApiResponse<RecursosConciliacionResponseDTO>;
export type ProgramarDowngradeApiResponse = ApiResponse<ProgramarDowngradeResponseDTO>;
export type CancelarDowngradeApiResponse = ApiResponse<CancelarDowngradeResponseDTO>;
