/**
 * Reportes de ventas y desempeño (CU-ADMIN-13): lo que devuelve ms-analítica por Kong.
 * Contrato: doc-2u/servicios/ms-analitica.md, sección 3. Una métrica sin base para calcularse llega como `null`, no 0.
 */

/** Grupos de la ingeniería de menú. La clave es la de ms-analítica; los nombres de pantalla están en `reportes/grupos`. */
export type ClasificacionMenu = 'estrella' | 'caballito' | 'puzle' | 'rezagado';

export interface RangoDTO {
  /** Primera jornada, `YYYY-MM-DD` */
  desde: string;
  /** Última jornada incluida, `YYYY-MM-DD` */
  hasta: string;
}

export interface MedioPagoVentaDTO {
  medio_pago: string;
  comprobantes: number;
  total: number;
  porcentaje: number | null;
}

export interface TipoComprobanteVentaDTO {
  tipo: string;
  comprobantes: number;
  total: number;
}

export interface IndicadoresDTO {
  ventas_total: number;
  comprobantes: number;
  dias_con_ventas: number;
  comprobantes_por_dia: number | null;
  ticket_promedio: number | null;
  comensales: number;
  ticket_por_comensal: number | null;
  descuentos: number;
  anulados: { comprobantes: number; total: number };
  por_medio_pago: MedioPagoVentaDTO[];
  por_tipo: TipoComprobanteVentaDTO[];
}

export interface VariacionDTO {
  ventas_total: number | null;
  comprobantes: number | null;
  ticket_promedio: number | null;
  ticket_por_comensal: number | null;
}

export interface ResumenVentasDTO extends RangoDTO {
  local_id: string;
  actual: IndicadoresDTO;
  /** Periodo anterior de la misma duración; `null` con `comparar=false` */
  anterior: (IndicadoresDTO & RangoDTO) | null;
  variacion_pct: VariacionDTO | null;
  /** Llegada de la última venta de la sede; `null` si nunca llegó una */
  ultimo_evento_en: string | null;
}

export interface FranjaHoraDTO {
  hora: number;
  comprobantes: number;
  total: number;
  promedio_por_dia: number | null;
}

export interface VentasPorHoraDTO extends RangoDTO {
  local_id: string;
  dias_con_ventas: number;
  /** Siempre 24 franjas (0 a 23) */
  franjas: FranjaHoraDTO[];
  hora_punta: { hora: number; total: number } | null;
}

export interface PlatoRankingDTO {
  producto_id: string;
  nombre: string;
  categoria_nombre: string | null;
  unidades: number;
  ingreso: number;
  participacion_pct: number | null;
  /** `null` si algún ítem del plato no trae costo en el periodo */
  costo: number | null;
  margen: number | null;
  margen_unitario: number | null;
  clasificacion: ClasificacionMenu | null;
}

export interface CategoriaRankingDTO {
  categoria_nombre: string;
  unidades: number;
  ingreso: number;
  participacion_pct: number | null;
}

export interface RankingProductosDTO extends RangoDTO {
  local_id: string;
  /** Por unidades vendidas, de mayor a menor */
  productos: PlatoRankingDTO[];
  /** `null` si ningún plato tiene costo */
  umbrales: { popularidad_pct: number; margen_unitario: number } | null;
  por_categoria: CategoriaRankingDTO[];
  sin_costo: number;
}

export interface AnulacionesMozoDTO {
  cantidad: number;
  monto: number;
  mermas: number;
  costo_merma: number;
}

export interface MozoDesempenoDTO {
  mozo_id: string;
  mozo_nombre: string | null;
  comprobantes: number;
  ventas_total: number;
  ticket_promedio: number | null;
  comensales: number;
  comprobantes_anulados: number;
  anulaciones: AnulacionesMozoDTO;
}

export interface DesempenoPersonalDTO extends RangoDTO {
  local_id: string;
  /** Por ventas, de mayor a menor */
  mozos: MozoDesempenoDTO[];
  totales: { comprobantes: number; ventas_total: number; anulaciones: AnulacionesMozoDTO };
}
