/**
 * DTOs canónicos para el visor digital de comprobantes electrónicos (CU-CLIENTE-02).
 * Verificados estrictamente contra la tabla 'comprobante' en 02_schema_ddl.sql.
 */

export type TipoComprobante = 'boleta' | 'factura' | 'nota_venta' | 'nota_credito';
export type EstadoComprobante = 'emitido' | 'anulado';
export type MedioPagoComprobante = 'tarjeta' | 'billetera_digital' | 'efectivo';

export interface EmisorComprobanteDTO {
  razon_social: string;
  ruc: string;
  local_nombre: string;
  direccion: string;
  distrito: string;
  ciudad: string;
  telefono: string;
  slug_sede: string;
  horario: string;
}

export interface ClienteComprobanteDTO {
  nombre: string;
  tipo_documento?: 'DNI' | 'RUC' | null;
  numero_documento?: string | null;
  direccion?: string | null;
  mesa_codigo?: string | null;
}

export interface ItemComprobanteDTO {
  codigo?: string;
  cantidad: number;
  descripcion: string;
  precio_unitario: number;
  importe_total: number;
}

export interface LiquidacionComprobanteDTO {
  subtotal_consumo: number;
  descuento: number;
  descuento_motivo?: string | null;
  base_imponible: number; // Operación Gravada
  igv: number;            // 18.00%
  monto_recargo: number;
  total: number;          // PEN Soles
}

export interface PagoComprobanteDTO {
  medio_pago: MedioPagoComprobante;
  metodo_nombre: string;  // Ej: "Tarjeta POS Visa", "Yape", "Efectivo Soles"
  monto_recibido?: number | null;
  vuelto?: number | null;
  numero_operacion?: string | null;
}

export interface NotaCreditoReferenciaDTO {
  serie_numero: string;    // Ej: "BC01-0000042"
  fecha: string;          // ISO 8601
  motivo_codigo: string;  // Catálogo 09 SUNAT (01: anulación de la operación)
  motivo_texto: string;   // "Anulación de la operación (Cambio a Factura con RUC)"
  sustento: string;       // "Comensal solicitó cambio a Factura corporativa con RUC"
  url_publica?: string;
}

export interface ComprobantePublicoDTO {
  token: string;
  tipo: TipoComprobante;
  tipo_label: string;       // "Boleta de Venta Electrónica", "Factura Electrónica"
  serie: string;            // "B001", "F001"
  correlativo: number;      // 12894
  serie_numero: string;     // "B001-0012894"
  fecha_emision: string;    // ISO 8601
  estado: EstadoComprobante;// 'emitido' | 'anulado'
  hash_seguridad: string;   // Hash SHA-256 para validación SUNAT

  emisor: EmisorComprobanteDTO;
  cliente: ClienteComprobanteDTO;
  items: ItemComprobanteDTO[];
  totales: LiquidacionComprobanteDTO;
  pago: PagoComprobanteDTO;
  nota_credito?: NotaCreditoReferenciaDTO;
  url_carta_digital: string;
  documento_digital?: {
    estado: 'generando' | 'disponible' | 'fallido';
    pdf_disponible: boolean;
    url_descarga_pdf?: string | null;
  };
}

export interface DemoComprobantePreset {
  key: string;
  label: string;
  token: string;
  descripcion: string;
  badgeColor: string;
}
