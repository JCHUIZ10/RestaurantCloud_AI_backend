/**
 * Tipos de datos y DTOs para el módulo Mozo / Salón de RestaurantCloud AI.
 * Basados estrictamente en el esquema PostgreSQL 16 (piso, mesa, pedido, pedido_item, producto, reserva)
 * y los contratos de Go definidos en internal/domain/salon/dto.go.
 */

export type EstadoMesaOperativo = 'libre' | 'ocupada' | 'cuenta_pedida' | 'bloqueada';

export type FormaMesa = 'cuadrada' | 'redonda' | 'rectangular';

export type EstadoItemCocina = 
  | 'en_cola' 
  | 'en_preparacion' 
  | 'listo' 
  | 'entregado' 
  | 'no_disponible' 
  | 'anulado';

export type TipoDespacho = 'cocina' | 'directo_salon';

/**
 * Representa una tarjeta de mesa en el plano visual (Área 1 del Centro de Mando)
 */
export interface MesaCardDTO {
  id: string;
  piso_id: string;
  numero: string;
  capacidad: number;
  forma: FormaMesa;
  posicion_x: number;
  posicion_y: number;
  permite_union: boolean;
  mesa_principal_id?: string | null;
  etiqueta_union?: string | null; // Ej. "Mesa [ 02 ; 03 ]"
  estado: EstadoMesaOperativo;

  // Atributos dinámicos cuando la mesa está ocupada
  pedido_id?: string | null;
  comensales_sentados?: number | null;
  minutos_ocupada?: number | null;
  total_consumo?: number | null;
  mozo_id?: string | null;
  mozo_nombre?: string | null;
  es_mi_mesa: boolean;
  platos_listos: number;
  platos_en_cocina: number;
  despacho_directo_pendiente: number; // Productos sin cocina (bebidas, gelatinas, postres de vitrina)
  bebidas_pendientes?: number; // Alias retrocompatible

  // Atributos cuando la mesa está bloqueada por reserva inminente
  reserva_cliente?: string | null;
  reserva_hora?: string | null;
  minutos_para_reserva?: number | null;

  // Atributos de división de cuenta (CU-MOZO-09)
  es_cuenta_dividida?: boolean;
  partes_subcuentas?: number;

  // Atributos de incidencia de quiebre de cocina (CU-MOZO-07)
  tiene_quiebre_cocina?: boolean;
  quiebre_producto_nombre?: string;
  quiebre_item_id?: string;
}

/**
 * Tarjeta de la Barra Lateral de Despacho en Vivo (Área 2)
 * Distingue items de cocina KDS vs productos de despacho directo en sala/vitrina (Entrega directa).
 */
export interface ItemDespachoListoDTO {
  item_id: string;
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  ambiente: string;
  producto_nombre: string;
  cantidad: number;
  nota_especial?: string | null;
  requiere_preparacion: boolean; // false = Bebidas/Salón, true = Cocina KDS
  tipo_despacho: TipoDespacho;
  pase_cocina?: string | null;   // Ej. "Pase Caliente #01", "Pase Frío"
  segundos_listo: number;
  mozo_nombre?: string;
  es_mi_mesa: boolean;
}

/**
 * Resumen de comanda en preparación activa en KDS
 */
export interface ComandaEnPreparacionDTO {
  pedido_id: string;
  mesa_numero: string;
  numero_comanda: number;
  minutos_transcurridos: number;
  total_items: number;
  items_en_fuego: number;
}

/**
 * Alerta operativa activa en salón (quiebre de insumo o retraso)
 */
export interface AlertaOperativaDTO {
  id: string;
  tipo: 'quiebre_insumo' | 'demora_cocina' | 'reserva_proxima';
  titulo: string;
  descripcion: string;
  mesa_numero?: string;
  hora: string;
}

/**
 * Ambiente físico / Piso del restaurante
 */
export interface PisoAmbienteDTO {
  id: string;
  nombre: string;
  total_mesas: number;
  mesas_ocupadas: number;
  mesas_libres: number; // Mesas desocupadas listas para comensales en este ambiente
}

/**
 * Payload consolidado de carga inicial para el Mozo
 */
export interface PlanoCompletoMozoDTO {
  piso_activo: PisoAmbienteDTO;
  pisos_disponibles: PisoAmbienteDTO[];
  mesas: MesaCardDTO[];
  items_despacho: ItemDespachoListoDTO[];
  comandas_preparacion: ComandaEnPreparacionDTO[];
  alertas_operativas: AlertaOperativaDTO[];
  mesas_libres: number;
  mesas_ocupadas: number;
  total_mesas: number;
  mis_mesas_activas: number;
  total_venta_turno: number;
  mozo_actual: {
    id: string;
    nombre: string;
    rol: string;
  };
}

/**
 * Detalle individual de un ítem dentro de la comanda en el Quick-Drawer
 */
export interface ItemDetalleComandaDTO {
  id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nota_cocina?: string | null;
  requiere_preparacion: boolean;
  tipo_despacho: TipoDespacho;
  estado: EstadoItemCocina;
  minutos_en_estado: number;
  numero_ronda: number;
}

/**
 * Payload completo para el Quick-Drawer de inspección de mesa (440px)
 */
export interface MesaDetalleMozoDTO {
  mesa_id: string;
  numero: string;
  ambiente: string;
  estado: EstadoMesaOperativo;
  etiqueta_union?: string | null;
  comanda_id?: string;
  numero_comanda?: number;
  mozo_nombre?: string;
  es_mi_mesa: boolean;
  minutos_en_mesa?: number;
  comensales?: number;
  hora_apertura?: string;
  items: ItemDetalleComandaDTO[];
  total_subtotal: number;
  nota_general?: string | null;
  es_mesa_unida?: boolean;
  mesa_principal_id?: string | null;
  mesas_agrupadas_detalle?: string | null;
  es_cuenta_dividida?: boolean;
  partes_subcuentas?: number;
  subcuentas_resumen?: SubcuentaResumenDTO[];
}

/**
 * Alerta de cocina prioritaria para el modal central emergente (560px)
 */
export interface AlertaCocinaModalDTO {
  id: string;
  tipo: 'plato_listo' | 'quiebre_insumo';
  mesa_numero: string;
  ambiente: string;
  comanda_numero: number;
  plato_nombre: string;
  cantidad: number;
  nota_especial?: string | null;
  cocinero_nombre: string;
  pase_nombre: string;
  segundos_transcurridos: number;
  insumo_agotado?: string;
  platos_afectados?: string[];
}

/**
 * =========================================================================
 * DTOs PARA CU-MOZO-02: TOMA DE PEDIDO Y COMANDA MÓVIL
 * =========================================================================
 */

export type DisponibilidadProducto = 'disponible' | 'agotado';

export interface ProductoCatalogoMozoDTO {
  id: string;
  categoria_id: string;
  categoria_nombre: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  disponibilidad: DisponibilidadProducto;
  activo: boolean;
  requiere_preparacion: boolean;
}

export interface CategoriaCatalogoDTO {
  id: string;
  nombre: string;
  total: number;
}

export interface CatalogoProductosMozoDTO {
  categorias: CategoriaCatalogoDTO[];
  productos: ProductoCatalogoMozoDTO[];
}

export interface ItemPedidoBorrador {
  id: string;
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  nota_cocina: string | null;
  requiere_preparacion: boolean;
}

export interface ItemPedidoInputDTO {
  producto_id: string;
  cantidad: number;
  nota_cocina?: string | null;
}

export interface CrearPedidoRequest {
  mesa_id: string;
  comensales: number;
  numero_ronda: number;
  items: ItemPedidoInputDTO[];
}

export interface ItemPedidoConfirmadoDTO {
  id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nota_cocina?: string | null;
  estado: string;
  numero_ronda: number;
  created_at: string;
}

export interface PedidoConfirmadoDTO {
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  numero_ronda: number;
  estado: string;
  total_comanda: number;
  items_enviados: ItemPedidoConfirmadoDTO[];
  mensaje: string;
}

export interface ConflictoStockDTO {
  producto_id: string;
  producto_nombre: string;
  insumo_critico: string;
  mensaje: string;
}

export interface HistorialMesaComandaDTO {
  mesa_id: string;
  mesa_numero: string;
  ambiente: string;
  comensales: number;
  minutos_en_mesa: number;
  mozo_nombre: string;
  ronda_actual: number;
  ronda_previa_items: ItemDetalleComandaDTO[];
  total_previo: number;
}

/**
 * =========================================================================
 * DTOs PARA CU-MOZO-08: PRECUENTA DIGITAL EN MESA
 * =========================================================================
 */

export type CodigoMetodoPago = 'efectivo' | 'billetera_digital' | 'tarjeta';

export interface PrecuentaItemDTO {
  producto_id: string;
  nombre: string;
  nota_cocina?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado_cocina: EstadoItemCocina;
}

export interface DesgloseSUNATMozoDTO {
  consumo_bruto: number;
  descuento_comercial: number;
  total_neto: number;
  base_imponible: number;
  igv: number;
  tasa_igv: number;
}

export interface DetalleBilleteraDigitalDTO {
  telefono: string;
  titular: string;
  ruc: string;
  qr_imagen_url?: string;
  monto_exacto: number;
}

export interface OpcionPagoMozoDTO {
  codigo: CodigoMetodoPago;
  nombre: string;
  comision_porcentaje: number;
  monto_comision: number;
  total_estimado: number;
  detalle_billetera?: DetalleBilleteraDigitalDTO;
}

export interface PromocionSedeDTO {
  id: string;
  nombre: string;
  porcentaje_descuento: number;
  descripcion: string;
}

export interface PrecuentaMozoResponseDTO {
  mesa_id: string;
  mesa_numero: string;
  es_mesa_unida: boolean;
  mozo_nombre: string;
  comensales: number;
  minutos_en_mesa: number;
  items: PrecuentaItemDTO[];
  tiene_cocina_pendiente: boolean;
  alerta_cocina?: string | null;
  promociones_disponibles: PromocionSedeDTO[];
  promocion_activa?: PromocionSedeDTO | null;
  tributacion_sunat: DesgloseSUNATMozoDTO;
  opciones_pago: OpcionPagoMozoDTO[];
  calculada_at: string;
}

export interface SolicitarCuentaRequest {
  mesa_id: string;
  metodo_pago: CodigoMetodoPago;
  numero_operacion?: string | null;
  monto_declarado: number;
  promocion_id?: string | null;
}

/**
 * ============================================================================
 * DTOs para CU-MOZO-04: Unir o Dividir Mesas en Salón
 * ============================================================================
 */

export interface CandidataUnionMesaDTO {
  id: string;
  numero: string;
  capacidad: number;
  posicion_x: number;
  posicion_y: number;
  estado: EstadoMesaOperativo;
  permite_union: boolean;
  elegible: boolean;
  motivo_bloqueo?: string; // "Ocupada", "Mesa fija (No permite unión)", "Bloqueada por reserva"
}

export interface CandidatasUnionResponseDTO {
  mesa_origen_id: string;
  numero_origen: string;
  capacidad_origen: number;
  candidatas: CandidataUnionMesaDTO[];
}

export interface MesaGrupoItemDTO {
  id: string;
  numero: string;
  es_principal: boolean;
  capacidad: number;
}

export interface UnirMesasRequestDTO {
  mesa_titular_id: string;
  mesas_secundarias_ids: string[];
}

export interface UnirMesasResponseDTO {
  mesa_principal_id: string;
  label_unificado: string; // Ej: "Mesa [ 02 ; 03 ]"
  capacidad_total: number;
  mesas: MesaGrupoItemDTO[];
  created_at: string;
}

export interface DividirMesasRequestDTO {
  mesa_id: string;
  mesa_secundaria_id?: string | null; // null = separar todas
}

export interface DividirMesasResponseDTO {
  mesa_principal_id: string;
  mesas_separadas: string[];
  mensaje: string;
}

export interface ValidacionSeparacionMesaDTO {
  puede_separar: boolean;
  motivo_bloqueo?: string;
  total_consumo?: number;
  items_activos?: number;
  mesa_label: string;
  mesas_a_restaurar: {
    id: string;
    numero: string;
    capacidad: number;
    rol: 'titular' | 'secundaria';
  }[];
}

/**
 * ============================================================================
 * DTOs para CU-MOZO-09: Subdividir Comanda en Mesa (Split de Comprobantes)
 * ============================================================================
 */

export type TipoComprobanteSplit = 'boleta' | 'factura' | 'nota_venta';

export interface ItemParaDividirDTO {
  id: string;
  pedido_item_id: string;
  producto_id: string;
  nombre: string;
  nota_cocina?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  subcuenta_asignada_id?: string | null;
}

export interface SubcuentaConfigDTO {
  id: string;
  numero_subcuenta: number;
  nombre_referencia: string;
  items: ItemParaDividirDTO[];
  tipo_comprobante: TipoComprobanteSplit;
  documento_cliente?: string | null; // RUC o DNI
  nombre_cliente: string; // Razón social o Nombre comensal
  direccion_cliente?: string | null;
  consumidor_final_sin_doc?: boolean;
  promocion_id?: string | null;
  medio_pago: CodigoMetodoPago;
  subtotal_bruto: number;
  descuento: number;
  monto_recargo: number;
  total_neto: number;
  base_imponible: number;
  igv: number;
}

export interface ItemsParaDividirResponseDTO {
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  comensales: number;
  total_bruto: number;
  items: ItemParaDividirDTO[];
}

export interface SubcuentaResumenDTO {
  id: string;
  numero: number;
  nombre_referencia: string;
  tipo_comprobante: TipoComprobanteSplit;
  cliente: string;
  documento?: string | null;
  medio_pago: CodigoMetodoPago;
  total: number;
  total_items: number;
  estado: 'pendiente' | 'cobrado';
}

export interface DividirCuentaRequestDTO {
  mesa_id: string;
  pedido_id: string;
  subcuentas: SubcuentaConfigDTO[];
}

export interface DividirCuentaResponseDTO {
  status: 'success' | 'error';
  mesa_id: string;
  mesa_numero: string;
  estado_mesa: 'cuenta_pedida';
  partes: number;
  total_bruto: number;
  total_neto: number;
  mensaje: string;
  subcuentas_resumen: SubcuentaResumenDTO[];
}

export interface ConsultaRucResponseDTO {
  ruc: string;
  razon_social: string;
  direccion: string;
  estado: string;
  condicion: string;
}

export interface ConsultaDniResponseDTO {
  dni: string;
  nombre_completo: string;
}

/**
 * ============================================================================
 * CU-MOZO-06: ANULAR PEDIDO (O ÍTEM DE PEDIDO) CON MOTIVO Y CONTROL DE MERMA
 * ============================================================================
 */

export type MotivoCategoriaItem =
  | 'error_toma'
  | 'demora_cliente'
  | 'queja_calidad'
  | 'cambio_plato'
  | 'plato_caido'
  | 'contaminacion'
  | 'otro';

export type MotivoCategoriaComanda =
  | 'retiro_sin_consumo'
  | 'error_apertura'
  | 'reclamo_general'
  | 'emergencia'
  | 'otro';

export interface AnularItemRequestDTO {
  motivo_categoria: MotivoCategoriaItem;
  motivo_detalle: string;
}

export interface AnularPedidoCompletoRequestDTO {
  motivo_categoria: MotivoCategoriaComanda;
  motivo_detalle: string;
  confirmar_vacio: boolean;
}

export interface ItemAnuladoResponseDTO {
  item_id: string;
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  producto_nombre: string;
  cantidad: number;
  estado_anterior: EstadoItemCocina;
  es_merma: boolean;
  nuevo_subtotal: number;
  mesa_liberada: boolean;
  mensaje: string;
  anulado_at: string;
}

export interface PedidoAnuladoResponseDTO {
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  mesa_estado: 'libre';
  total_anulado: number;
  items_total: number;
  mensaje: string;
  anulado_at: string;
}

/**
 * ============================================================================
 * CU-MOZO-05: GESTIONAR RESERVAS Y RECEPCIÓN EN SALÓN
 * ============================================================================
 */

export type EstadoReserva = 'confirmada' | 'bloqueada' | 'atendida' | 'cancelada' | 'no_show';

export interface PoliticasReservaDTO {
  duracion_reserva_min: number;
  buffer_reserva_min: number;
  minutos_bloqueo_previo: number;
  tolerancia_no_show_min: number;
  permite_reservas_online: boolean;
  max_dias_anticipacion: number;
}

export interface ReservaCardDTO {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_hora: string; // ISO 8601
  hora_texto: string; // "14:00"
  minutos_restantes: number; // Negativo si hay retraso
  num_personas: number;
  mesas_etiqueta: string; // "Mesa 08" o "Mesa [ 02 ; 03 ]"
  mesa_ids: string[];
  estado: EstadoReserva;
  notas?: string | null;
  en_tolerancia: boolean;
  tolerancia_expiro: boolean;
  pedido_id?: string | null;
  created_at: string;
}

export interface MesaDisponibleReservaDTO {
  mesa_id: string;
  numero: string;
  capacidad: number;
  disponible: boolean;
  permite_union: boolean;
  motivo_bloqueo?: string | null; // "Ocupada 13:30-15:00", "Capacidad insuficiente"
}

export interface MesasDisponiblesResponseDTO {
  fecha_hora_solicitada: string;
  num_personas: number;
  mesas: MesaDisponibleReservaDTO[];
}

export interface CrearReservaRequestDTO {
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_hora: string;
  num_personas: number;
  mesa_ids: string[];
  notas?: string | null;
}

export interface SentarReservaResponseDTO {
  reserva_id: string;
  mesa_id: string;
  pedido_id: string;
  mensaje: string;
}

export interface RegistrarNoShowRequestDTO {
  motivo_inasistencia?: string;
}

export interface CancelarReservaRequestDTO {
  motivo_cancelacion: string;
}

export interface ReasignarMesaReservaRequestDTO {
  nueva_mesa_id: string;
  motivo?: string;
}

/**
 * ============================================================================
 * CU-MOZO-07: ATENDER INCIDENCIA DE PLATO NO DISPONIBLE Y RESOLVER EN MESA
 * ============================================================================
 */

export interface PlatoSustitutoSugeridoDTO {
  producto_id: string;
  nombre: string;
  categoria_id: string;
  categoria_nombre: string;
  precio: number;
  diferencia: number; // Respecto al plato original (+S/, -S/, S/ 0)
  es_misma_categoria: boolean;
  disponible: boolean;
}

export interface CategoriaChipDTO {
  categoria_id: string;
  nombre: string;
  total_platos: number;
}

export interface CatalogoSustitucionResponseDTO {
  plato_original_id: string;
  plato_original_item_id: string;
  plato_original: string;
  precio_original: number;
  categoria_nombre: string;
  sugerencias_top: PlatoSustitutoSugeridoDTO[]; // Top 6 por afinidad y precio
  categorias: CategoriaChipDTO[];              // Píldoras de familias de carta
  productos: PlatoSustitutoSugeridoDTO[];       // Productos para búsqueda o filtrado
}

export interface SustituirPlatoRequestDTO {
  item_anulado_id: string;
  nuevo_producto_id: string;
  cantidad: number;
  notas_cocina?: string;
}

export interface SustituirPlatoResponseDTO {
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  nuevo_item_id: string;
  nuevo_producto: string;
  diferencia_monto: number;
  nuevo_subtotal: number;
  mensaje: string;
  created_at: string;
}

export interface AnularPorQuiebreRequestDTO {
  motivo_detalle: string;
}

export interface AnularPorQuiebreResponseDTO {
  pedido_id: string;
  mesa_id: string;
  mesa_numero: string;
  monto_anulado: number;
  nuevo_subtotal: number;
  mensaje: string;
  anulado_at: string;
}

