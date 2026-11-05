/**
 * DTOs de "Cambiar plan" (CU-PROP-03). Reflejan la respuesta de
 * GET /propietario/suscripcion/planes-comparativa.
 */

import type { ApiResponse } from './api';
import type { EstadoSuscripcion, MetodoPagoDTO } from './propietarioSuscripcion';

export type PeriodicidadFacturacion = 'mensual' | 'anual';
export type TipoAccionPlan = 'actual' | 'upgrade' | 'downgrade';
export type RecursoPlan = 'locales' | 'pisos' | 'mesas' | 'usuarios';

export interface LimitesPlanDTO {
  max_locales: number;
  max_pisos: number;
  max_mesas: number;
  max_usuarios: number;
  incluye_reservas: boolean;
  incluye_reportes_avanzados: boolean;
  incluye_asistente_ia: boolean;
  incluye_prediccion_ia: boolean;
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
  tipo_accion: TipoAccionPlan;
  requiere_conciliacion: boolean;
  recursos_excedidos: RecursoPlan[];
}

export interface UsoLocalDTO {
  local_id: string;
  nombre: string;
  pisos: number;
  mesas: number;
  usuarios: number;
}

/** Locales por empresa; pisos, mesas y personal se detallan por sede. */
export interface RecursosEnUsoDTO {
  locales_activos: number;
  por_local: UsoLocalDTO[];
}

export interface RecursoExcedidoDTO {
  recurso: RecursoPlan;
  usados: number;
  maximo: number;
  /** Presente en pisos, mesas y personal: la sede que supera el límite */
  local_id?: string;
  local_nombre?: string;
}

export interface PlanActualInfoDTO {
  id: number;
  nombre: string;
  precio_mensual: number;
  precio_anual: number;
  periodicidad: PeriodicidadFacturacion;
  dias_restantes_ciclo: number;
  dias_totales_ciclo: number;
  fecha_renovacion: string | null;
  downgrade_programado: boolean;
  proximo_plan: {
    id: number;
    nombre: string;
    precio_mensual: number;
    precio_anual: number;
    ciclo: PeriodicidadFacturacion;
    fecha_efectiva: string | null;
    dias_restantes: number;
    seleccion_guardada: boolean;
    recursos_excedidos: RecursoExcedidoDTO[];
  } | null;
}

export interface PlanesComparativaResponseDTO {
  suscripcion_estado: EstadoSuscripcion;
  plan_actual: PlanActualInfoDTO;
  recursos_en_uso: RecursosEnUsoDTO;
  planes: PlanComparativoDTO[];
}

export type PlanesComparativaApiResponse = ApiResponse<PlanesComparativaResponseDTO>;

// Upgrade inmediato con prorrateo

export interface SimularUpgradeResponseDTO {
  plan_origen: string;
  plan_destino: string;
  periodicidad: PeriodicidadFacturacion;
  dias_restantes_ciclo: number;
  dias_totales_ciclo: number;
  fecha_proximo_ciclo: string;
  precio_actual: number;
  credito_plan_actual: number;
  costo_nuevo_plan_proporcional: number;
  monto_neto_a_pagar_hoy: number;
  requiere_cobro: boolean;
  moneda: string;
  nuevo_monto_recurrente: number;
  metodo_pago_defecto: MetodoPagoDTO | null;
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
  } | null;
  modulos_activados: string[];
}

export type SimularUpgradeApiResponse = ApiResponse<SimularUpgradeResponseDTO>;
export type EjecutarUpgradeApiResponse = ApiResponse<EjecutarUpgradeResponseDTO>;

// Downgrade y cambio de ciclo programados para el fin del periodo pagado

export interface ProgramarCambioResponseDTO {
  plan_actual: string;
  plan_destino: string;
  ciclo: PeriodicidadFacturacion;
  fecha_efectiva: string;
  dias_restantes: number;
  recursos_excedidos: RecursoExcedidoDTO[];
}

export interface CancelarCambioResponseDTO {
  plan_activo: string;
  mensaje: string;
}

export type ProgramarCambioApiResponse = ApiResponse<ProgramarCambioResponseDTO>;
export type CancelarCambioApiResponse = ApiResponse<CancelarCambioResponseDTO>;

// Asistente "qué conservar" del cambio programado

export interface SeleccionConservarDTO {
  locales_ids: string[];
  pisos_ids: string[];
  mesas_ids: string[];
  usuarios_ids: string[];
}

export interface MesaConciliacionDTO {
  id: string;
  numero: string;
}

export interface PisoConciliacionDTO {
  id: string;
  nombre: string;
  mesas: MesaConciliacionDTO[];
}

export interface PersonaConciliacionDTO {
  id: string;
  nombre: string;
  rol: string;
  /** El administrador de la sede siempre se conserva */
  protegido: boolean;
}

export interface LocalConciliacionDTO {
  id: string;
  nombre: string;
  pisos: PisoConciliacionDTO[];
  personal: PersonaConciliacionDTO[];
}

export interface RecursosConciliacionDTO {
  plan_destino: {
    id: number;
    nombre: string;
    ciclo: PeriodicidadFacturacion;
    limites: Pick<LimitesPlanDTO, 'max_locales' | 'max_pisos' | 'max_mesas' | 'max_usuarios'>;
  };
  fecha_efectiva: string | null;
  dias_restantes: number;
  seleccion_guardada: boolean;
  locales: LocalConciliacionDTO[];
  /** La guardada o, si no hay, lo que se conservaría por antigüedad */
  seleccion: SeleccionConservarDTO;
}

export type RecursosConciliacionApiResponse = ApiResponse<RecursosConciliacionDTO>;
