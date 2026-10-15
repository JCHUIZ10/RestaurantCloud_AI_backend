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
