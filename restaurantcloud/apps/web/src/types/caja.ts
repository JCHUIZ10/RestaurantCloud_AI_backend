/**
 * Tipos de datos y DTOs para el módulo Caja / Punto de Venta de RestaurantCloud AI (CU-CAJA-01).
 * Alineados 100% con las tablas 'caja' y 'caja_movimiento' en 02_schema_ddl.sql
 * y el índice único parcial uq_caja_abierta_local en 03_indexes.sql.
 */

export type EstadoCajaTurno = 'abierta' | 'cerrada';

export interface CajaTurnoDTO {
  id: string;
  local_id: string;
  cajero_id: string;
  cajero_nombre: string;
  cajero_rol?: string; // Ej. "Cajero Titular (Turno Tarde)"
  correlativo: number; // Ej. 42 -> Turno #042 por sede
  monto_apertura: number;
  notas_apertura?: string;
  estado: EstadoCajaTurno;
  fecha_apertura: string; // ISO 8601
  fecha_cierre?: string | null;
  monto_esperado?: number | null;
  monto_real?: number | null;
  discrepancia?: number | null;
  comentario_discrepancia?: string | null;
  notas_cierre?: string | null;
  total_ventas?: number;
  monto_ventas?: number;
  efectivo_actual?: number;
}

export interface EstadoCajaSesionDTO {
  estado_caja: EstadoCajaTurno;
  puede_abrir: boolean;
  turno_activo?: CajaTurnoDTO | null;
  ultimo_turno?: CajaTurnoDTO | null;
  total_ventas_actual?: number;
  monto_ventas_actual?: number;
  sede_nombre: string;
  correlativo_proyectado: number;
}

export interface AbrirCajaRequest {
  monto_apertura: number;
  notas?: string;
}

export interface MesaCajaMonitorDTO {
  id: string;
  numero: string;
  piso_nombre: string;
  estado: 'libre' | 'ocupada' | 'cuenta_pedida';
  mozo_nombre?: string;
  comensales?: number;
  total_consumo: number;
  pedido_id?: string;
  minutos_en_mesa?: number;
  minutos_espera_cuenta?: number;
}

export interface CajaMetricasPosDTO {
  mesas_cuenta_pedida: number;
  monto_por_cobrar: number;
  efectivo_en_caja: number;
  mesas_ocupadas_count: number;
  total_mesas_count: number;
  porcentaje_ocupacion: number;
}

export interface BalancePreArqueoDTO {
  caja_id: string;
  turno_correlativo: number;
  cajero_nombre: string;
  cajero_rol?: string;
  fecha_apertura: string;
  monto_apertura: number;
  ingresos_efectivo: number;
  egresos_devolucion_nc: number;
  efectivo_esperado: number;
  tarjetas_pos_total: number;
  tarjetas_operaciones: number;
  billeteras_total: number;
  otros_cobros_total: number;
  total_facturado_neto: number;
  base_imponible: number;
  igv_18: number;
  total_comprobantes: number;
  mesas_activas_pendientes: number;
  salon_al_dia: boolean;
  sede_nombre: string;
}

export interface CerrarCajaRequest {
  monto_real_fisico: number;
  comentario_discrepancia?: string;
  notas_cierre?: string;
}

export interface ReporteZDTO {
  caja_id: string;
  turno_correlativo: number;
  local_nombre: string;
  empresa_ruc: string;
  cajero_nombre: string;
  fecha_apertura: string;
  fecha_cierre: string;
  duracion_turno: string;
  monto_apertura: number;
  efectivo_esperado: number;
  efectivo_real_contado: number;
  discrepancia: number;
  comentario_discrepancia?: string;
  total_ventas_efectivo: number;
  total_tarjetas_pos: number;
  total_billeteras_digital: number;
  otros_medios_total?: number;
  total_neto_facturado: number;
  base_imponible_gravada: number;
  igv_18: number;
  boletas_emitidas: number;
  facturas_emitidas: number;
  notas_venta_emitidas: number;
  notas_credito_emitidas: number;
  comprobantes_anulados: number;
  notas_cierre?: string;
  url_descarga_pdf?: string;
}
