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
  subcuentas_count?: number;
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

// ============================================================================
// DTOs para Precuenta Digital en Terminal POS (CU-CAJA-02)
// Coherencia con CU-MOZO-08/09 y tablas: pedido, pedido_item, promocion, metodo_pago_local
// ============================================================================

export interface PrecuentaItemDTO {
  producto_id: string;
  nombre: string;
  nota_cocina?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado_cocina: 'en_cola' | 'en_preparacion' | 'listo' | 'entregado';
}

export interface DesgloseTributarioSUNATDTO {
  consumo_bruto: number;
  descuento_aplicado: number;
  total_neto: number;
  base_imponible: number;
  igv: number;
  tasa_igv: number; // 0.18
}

export interface OpcionCobroPrecuentaDTO {
  metodo_pago_codigo: string;
  metodo_pago_nombre: string;
  comision_porcentaje: number;
  monto_comision: number;
  total_estimado: number;
}

export interface PromocionAplicableDTO {
  id: string;
  nombre: string;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor: number;
  ahorro_calculado: number;
  aplicada: boolean;
  descripcion_condicion?: string;
}

export interface SubcuentaComandaDTO {
  id: string;
  numero_subcuenta: number;
  nombre_titular?: string;
  titular_referencia?: string;
  documento_identidad?: string;
  tipo_comprobante?: 'boleta' | 'factura' | 'nota_venta';
  tipo_comprobante_sugerido?: string;
  medio_pago_tentativo?: string;
  subtotal_bruto?: number;
  descuento?: number;
  total_neto: number;
  items_resumen?: string[];
  items?: PrecuentaItemDTO[];
  estado?: 'pendiente' | 'cobrado';
  estado_pago?: 'pendiente' | 'cobrado';
}

export interface PrecuentaResponseDTO {
  mesa_id: string;
  mesa_numero: string;
  mesa_estado?: 'ocupada' | 'cuenta_pedida' | 'libre';
  minutos_espera_cuenta?: number;
  es_mesa_unida: boolean;
  mozo_nombre: string;
  comensales: number;
  numero_comanda: number;
  hora_pedido: string;
  items: PrecuentaItemDTO[];
  tiene_cocina_pendiente: boolean;
  alerta_cocina?: string;
  promociones_disponibles: PromocionAplicableDTO[];
  promocion_activa_id?: string | null;
  tributacion_sunat: DesgloseTributarioSUNATDTO;
  opciones_cobro: OpcionCobroPrecuentaDTO[];
  subcuentas?: SubcuentaComandaDTO[];
  tipo_comprobante_sugerido?: 'boleta' | 'factura' | 'nota_venta';
  documento_cliente_sugerido?: string | null;
  nombre_cliente_sugerido?: string | null;
  metodo_pago_tentativo?: string;
  numero_operacion_tentativo?: string;
  total_cobro_tentativo?: number;
  generada_at: string;
}

export interface AplicarPromocionPrecuentaRequest {
  promocion_id: string;
}

// ==============================================================================
// TIPOS OFICIALES PARA CU-CAJA-03: COBRO Y EMISIÓN DE COMPROBANTES FISCALES SUNAT
// ==============================================================================

export interface ProcesarCobroFiscalRequest {
  pedido_id: string;
  mesa_id: string;
  subcuenta_id?: string;
  tipo_comprobante: 'boleta' | 'factura' | 'nota_venta';
  serie: string; // ej: 'B001', 'F001', 'NV01'
  cliente_tipo_doc?: 'DNI' | 'RUC';
  cliente_num_doc?: string;
  cliente_nombre: string;
  cliente_direccion?: string;
  telefono_envio?: string;
  email_envio?: string;
  consumidor_final_sin_doc?: boolean;
  metodo_pago_codigo: 'efectivo' | 'tarjeta' | 'billetera_digital';
  monto_recibido?: number; // Para efectivo (cálculo de vuelto)
  referencia_pago?: string; // Voucher POS o N° operación Yape
}

export interface ProcesarCobroFiscalResponseDTO {
  comprobante_id: string;
  tipo_comprobante: 'boleta' | 'factura' | 'nota_venta';
  serie: string;
  correlativo: number;
  serie_numero: string; // ej: 'B001-0012894'
  total_cobrado: number;
  base_imponible: number;
  igv: number;
  monto_recibido?: number;
  vuelto?: number;
  cliente_nombre: string;
  cliente_documento?: string;
  telefono_registrado?: string;
  email_registrado?: string;
  token_digital: string; // UUID v8
  url_publica_qr: string; // ej: https://app.restaurantcloud.pe/c/0192d2f4-e7b8-8000-8000-000000000108
  mesa_id: string;
  mesa_numero: string;
  mesa_liberada: boolean;
  subcuenta_id?: string;
  subcuentas_pendientes: number;
  emitido_at: string;
}

export interface ClienteFiscalLookupDTO {
  tipo_documento: 'DNI' | 'RUC';
  numero_documento: string;
  nombre_identificativo: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  existe_en_bd: boolean;
  origen: 'bd_local' | 'api_peru' | 'sunat' | 'reniec';
}

// ==============================================================================
// TIPOS OFICIALES PARA CU-CAJA-04: ANULACIÓN DE COMPROBANTE Y NOTA DE CRÉDITO
// ==============================================================================

export type MotivoNotaCreditoSUNAT = '01' | '02' | '06';

export interface ComprobanteHistorialItemDTO {
  id: string;
  tipo_comprobante: 'boleta' | 'factura' | 'nota_venta' | 'nota_credito';
  serie: string;
  correlativo: number;
  serie_numero: string;
  hora: string;
  fecha_emision: string;
  mesa_id?: string;
  mesa_numero: string;
  subcuenta_id?: string;
  subcuenta_numero?: number;
  comanda_numero: number;
  cliente_nombre: string;
  cliente_documento?: string;
  medio_pago: 'efectivo' | 'tarjeta' | 'billetera_digital';
  total: number;
  base_imponible: number;
  igv: number;
  estado: 'emitido' | 'anulado';
  token_digital: string;
  url_publica_qr: string;
  telefono_envio?: string;
  email_envio?: string;
  // Si fue anulado mediante Nota de Crédito
  nota_credito_id?: string;
  nota_credito_serie_numero?: string;
  motivo_codigo_sunat?: MotivoNotaCreditoSUNAT;
  sustento_motivo?: string;
  // Si este registro es una Nota de Crédito
  comprobante_modificado_id?: string;
  documento_modificado?: string;
}

export interface FiltrosHistorialComprobantesDTO {
  estado: 'vigente' | 'anulado' | 'todos';
  tipo: 'todos' | 'boleta' | 'factura' | 'nota_venta' | 'nota_credito';
  q?: string;
}

export interface PrepararAnulacionResponseDTO {
  comprobante_id: string;
  tipo_comprobante_original: 'boleta' | 'factura' | 'nota_venta';
  serie_original: string;
  correlativo_original: number;
  serie_numero_original: string;
  mesa_numero: string;
  comanda_numero: number;
  subcuenta_id?: string;
  subcuenta_numero?: number;
  cliente_nombre: string;
  cliente_numero_doc?: string;
  medio_pago_codigo: 'efectivo' | 'tarjeta' | 'billetera_digital';
  total_original: number;
  base_imponible: number;
  igv: number;
  serie_nota_credito_sugerida: string; // 'BC01', 'FC01', 'NVC01'
  efectivo_gaveta_actual: number;
  efectivo_gaveta_proyectado: number;
  telefono_envio?: string;
  email_envio?: string;
}

export interface EmitirNotaCreditoRequest {
  motivo_codigo_sunat: MotivoNotaCreditoSUNAT;
  sustento_motivo: string;
  devolucion_metodo: 'efectivo' | 'extorno_tarjeta' | 'transferencia';
  referencia_extorno?: string;
  telefono_envio?: string;
  email_envio?: string;
}

export interface EmitirNotaCreditoResponseDTO {
  nota_credito_id: string;
  tipo_comprobante: 'nota_credito';
  serie: string;
  correlativo: number;
  serie_numero: string; // Ej. 'BC01-0000042'
  documento_modificado: string; // Ej. 'B001-0012894'
  comprobante_modificado_id: string;
  motivo_codigo_sunat: MotivoNotaCreditoSUNAT;
  sustento_motivo: string;
  importe_rectificado: number; // Ej. -85.00
  efectivo_gaveta_nuevo: number;
  token_digital: string;
  url_publica_qr: string;
  mesa_numero: string;
  subcuenta_numero?: number;
  telefono_registrado?: string;
  email_registrado?: string;
  emitido_at: string;
}
