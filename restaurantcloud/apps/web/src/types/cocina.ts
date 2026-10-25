/**
 * Tipos y DTOs canónicos para el Módulo Cocina (KDS) - CU-COCINA-01.
 * Auditados estrictamente contra 02_schema_ddl.sql (PostgreSQL 16)
 * Tablas: configuracion_kds, pedido, pedido_item, producto, categoria_producto, producto_insumo, insumo.
 */

export type EstadoItemCocina = 'en_cola' | 'en_preparacion' | 'listo' | 'anulado';
export type SemaforoKDSColor = 'verde' | 'ambar' | 'rojo';

/**
 * Parámetros de umbrales y alertas acústicas de sede (tabla configuracion_kds)
 */
export interface ConfiguracionKDSDTO {
  caja_abierta?: boolean;
  local_id: string;
  tiempo_optimo_verde_min: number;   // Default 15m (CHECK BETWEEN 3 AND 60)
  tiempo_alerta_ambar_min: number;   // Default 25m (CHECK BETWEEN 5 AND 120)
  tiempo_maximo_pase_min: number;    // Default 3m (CHECK BETWEEN 1 AND 30)
  alerta_sonora_nueva_comanda: boolean;
  alerta_sonora_comanda_roja: boolean;
  intervalo_sonido_rojo_seg: number;
  vista_predeterminada: 'fifo' | 'all_day';
}

/**
 * Ítem culinario individual en cocina (tabla pedido_item + producto + categoria_producto)
 */
export interface KDSItemDTO {
  item_id: string;
  producto_id: string;
  nombre_producto: string;
  cantidad: number;
  estado: EstadoItemCocina;
  categoria_id: string;
  categoria_nombre: string;          // De categoria_producto.nombre
  nota_cocina?: string | null;       // De pedido_item.nota_cocina
  fecha_inicio_coccion?: string | null;
  fecha_listo_cocina?: string | null;
  receta_resumen: string;            // Concatenación insumos (producto_insumo + insumo)
  deshacer_hasta?: number | null;    // Timestamp límite para la ventana de 30s de deshacer
}

/**
 * Comanda activa en cola FIFO KDS (tabla pedido + mesa + usuario + pedido_item)
 */
export interface KDSComandaDTO {
  pedido_id: string;
  numero_comanda: number;
  mesa_codigo: string;              // "04" o "[ 02 ; 03 ]"
  es_mesa_agrupada: boolean;
  mozo_nombre: string;
  piso_nombre: string;
  ronda_numero: number;
  ronda_tipo: 'inicial' | 'adicional';
  comensales: number;
  fecha_envio: string;              // ISO String
  minutos_espera: number;
  segundos_transcurridos: number;
  semaforo_color: SemaforoKDSColor;
  bebidas_salon_count: number;      // Conteo con requiere_preparacion = false
  items: KDSItemDTO[];
}

/**
 * Detalle por mesa de un plato en el Consolidado All-Day
 */
export interface PlatoMesaDetalleDTO {
  mesa_codigo: string;
  cantidad: number;
  nota_cocina?: string | null;
  minutos_espera: number;
  estado: 'en_cola' | 'en_preparacion';
}

/**
 * Plato consolidado acumulando raciones de múltiples mesas
 */
export interface ConsolidadoPlatoDTO {
  producto_id: string;
  nombre_producto: string;
  categoria_nombre: string;
  cantidad_total: number;
  cantidad_en_fuego: number;
  cantidad_critica: number;
  detalle_mesas: PlatoMesaDetalleDTO[];
}

/**
 * Grupo de platos consolidado por categoría de la carta gastronómica
 */
export interface ConsolidadoAllDayDTO {
  categoria_nombre: string;
  total_raciones: number;
  platos: ConsolidadoPlatoDTO[];
}

/**
 * Petición de mutación de estado de un plato en cocina
 */
export interface KDSCambiarEstadoItemRequest {
  estado: 'en_preparacion' | 'listo';
}

/**
 * Evento de alerta de Parada de Fogones (item_pedido_anulado desde CU-MOZO-06 / CU-MOZO-07)
 */
export interface ItemAnuladoEvent {
  item_id: string;
  pedido_id: string;
  nombre_producto: string;
  mesa_codigo: string;
  mozo_nombre: string;
  motivo_anulacion: string;
  es_merma: boolean;
  minutos_transcurridos: number;
  timestamp: string;
}
export type ItemAnuladoSSEEvent = ItemAnuladoEvent;

/**
 * Resumen de ítem culinario despachado para la bandeja de histórico/recall (CU-COCINA-02)
 */
export interface ItemResumenDespachadoDTO {
  producto_nombre: string;
  cantidad: number;
  nota_cocina?: string | null;
}

/**
 * Comanda despachada en los últimos 30 minutos (CU-COCINA-02)
 */
export interface KDSPedidoDespachadoDTO {
  pedido_id: string;
  numero_comanda: number;
  mesa_codigo: string;
  mozo_nombre: string;
  piso_nombre: string;
  total_items: number;
  fecha_despacho: string; // ISO string
  minutos_desde_despacho: number;
  items_resumen: ItemResumenDespachadoDTO[];
}

/**
 * Métricas operativas de despacho de comandas en cocina
 */
export interface MetricasDespachoDTO {
  despachadosUltimos30m: number;
  tiempoPromedioCoccionMin: number;
  tiempoPromedioPaseMin: number;
  totalTurnoHoy: number;
}

/**
 * Evento de alerta por consumo con stock insuficiente (CU-COCINA-03)
 */
export interface AlertaStockInsuficienteEvent {
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  pedido_id: string;
  numero_comanda: number;
  mesa_codigo: string;
  plato_nombre: string;
  consumo_requerido: number;
  stock_disponible: number;
  faltante_teorico: number;
  timestamp: string;
}
export type AlertaStockInsuficienteSSE = AlertaStockInsuficienteEvent;

/**
 * Plato culinario para el modal de gestión de disponibilidad de carta (CU-COCINA-04)
 * Auditado contra tabla producto, categoria_producto y producto_insumo
 */
export interface PlatoDisponibilidadDTO {
  producto_id: string;
  nombre: string;
  categoria_id: string;
  categoria_nombre: string;
  precio: number;
  foto_url?: string | null;
  disponibilidad: 'disponible' | 'agotado';
  motivo_agotado?: 'quiebre_stock_receta' | 'apagado_manual_cocina' | 'decision_admin' | null;
  fecha_modificacion_disp?: string | null;
  usuario_modifico_nombre?: string | null;
  receta_resumen: string;
  insumo_bloqueante?: string | null;
  ordenes_en_cola: number;
  ordenes_en_fuego: number;
}

/**
 * Detalle de comanda con raciones activas en fuego para el diálogo de resolución (CU-COCINA-04)
 */
export interface ItemEnFuegoResolucionDTO {
  item_id: string;
  pedido_id: string;
  numero_comanda: number;
  mesa_codigo: string;
  mozo_nombre: string;
  cantidad: number;
  minutos_espera: number;
  cubierto: boolean;
}

