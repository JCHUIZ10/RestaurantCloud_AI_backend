/**
 * Tipos de datos y DTOs para el módulo Administrador de Local de RestaurantCloud AI.
 * Derivados estrictamente del esquema canónico PostgreSQL 16 (02_schema_ddl.sql)
 * y los contratos de API corporativos (ApiResponse<T>).
 * Cero campos inventados fuera del esquema y sus agregaciones documentadas.
 */

export type FormaMesa = 'cuadrada' | 'redonda' | 'rectangular';
export type EstadoMesaAdmin = 'activa' | 'inactiva' | 'bloqueada';
export type EstadoPiso = 'activo' | 'inactivo';

/**
 * Representa una mesa en el plano administrativo.
 * Mapea directamente a la tabla `mesa` en 02_schema_ddl.sql (línea 229).
 */
export interface MesaAdminDTO {
  id: string;
  local_id: string;
  piso_id: string;
  numero: string;
  capacidad: number;
  forma: FormaMesa;
  posicion_x: number;
  posicion_y: number;
  permite_union: boolean;
  mesa_principal_id?: string | null;
  estado: EstadoMesaAdmin;
  created_at: string;
  updated_at: string;

  // Atributos derivados de auditoría de salón (COUNT / JOIN sobre pedido)
  tiene_pedido_activo?: boolean;
  comanda_activa_codigo?: string | null;
  total_cuenta_activa?: number | null;
  mozo_a_cargo?: string | null;
}

/**
 * Representa un ambiente o piso del restaurante.
 * Mapea directamente a la tabla `piso` en 02_schema_ddl.sql (línea 217).
 */
export interface PisoAdminDTO {
  id: string;
  local_id: string;
  nombre: string;
  columnas: number;
  filas: number;
  estado: EstadoPiso;
  created_at?: string;
  updated_at?: string;

  // Métricas agregadas (COUNT / SUM calculadas por el backend)
  total_mesas: number;
  capacidad_total_personas: number;
  mesas: MesaAdminDTO[];
}

/**
 * Información de consumo de cuotas del plan de la empresa.
 * Mapea a la tabla `plan` y agregados de `mesa` y `piso`.
 */
export interface CuotaMesasPlanDTO {
  mesas_activas_empresa: number;
  max_mesas_plan: number;
  mesas_disponibles: number;
  pisos_activos_empresa: number;
  max_pisos_plan: number;
}

/**
 * Payload completo del endpoint GET /api/v1/admin/pisos?con_mesas=true
 */
export interface PlanoMesasResponseDTO {
  local_id: string;
  local_nombre: string;
  cuota_mesas: CuotaMesasPlanDTO;
  pisos: PisoAdminDTO[];
}

/**
 * Request para generación rápida en lote (POST /api/v1/admin/pisos/{id}/mesas/lote)
 */
export interface CrearMesaLoteRequest {
  columnas: number;
  filas: number;
  prefijo: string;
  numero_inicio: number;
  capacidad: number;
  forma: FormaMesa;
  permite_union: boolean;
}

/**
 * Request para crear mesa individual (POST /api/v1/admin/pisos/{id}/mesas)
 */
export interface CrearMesaIndividualRequest {
  numero: string;
  capacidad: number;
  forma: FormaMesa;
  posicion_x: number;
  posicion_y: number;
  permite_union: boolean;
}

/**
 * Request para actualizar mesa existente (PUT /api/v1/admin/mesas/{id})
 */
export interface ActualizarMesaRequest {
  numero: string;
  capacidad: number;
  forma: FormaMesa;
  posicion_x: number;
  posicion_y: number;
  permite_union: boolean;
}

/**
 * Request para crear un nuevo piso (POST /api/v1/admin/pisos)
 */
export interface CrearPisoRequest {
  nombre: string;
  columnas: number;
  filas: number;
}

/**
 * Request para redimensionar cuadrícula (PATCH /api/v1/admin/pisos/{id}/dimensiones)
 */
export interface ActualizarDimensionesPisoRequest {
  columnas: number;
  filas: number;
}

/**
 * Request para renombrar piso (PATCH /api/v1/admin/pisos/{id}/nombre)
 */
export interface ActualizarNombrePisoRequest {
  nombre: string;
}

/**
 * Estructura de error asistido para conflicto 409 cuando una mesa tiene pedidos activos
 */
export interface ConflictoDesactivacionMesaDTO {
  mesa_id: string;
  pedido_id: string;
  codigo_comanda: string;
  estado_pedido: string;
  total_cuenta: number;
  mozo_nombre: string;
}

/**
 * Estructura de error asistido para conflicto 409 al intentar desactivar un piso con mesas activas
 */
export interface ConflictoDesactivacionPisoDTO {
  piso_id: string;
  piso_nombre: string;
  mesas_activas_count: number;
  mesas_numeros: string[];
}

/**
 * Estructura de error asistido para conflicto 409 al recortar columnas/filas con mesas
 */
export interface ConflictoRecortePisoDTO {
  columna_o_fila: 'columna' | 'fila';
  indice_afectado: number;
  mesas_en_conflicto: string[];
}

// =============================================================================
// GESTIÓN DE CATEGORÍAS DE LA CARTA (CU-ADMIN-02)
// Mapea directamente a categoria_producto y producto en 02_schema_ddl.sql (líneas 252-329)
// =============================================================================

/**
 * Representa una categoría de la carta en el panel administrativo.
 * Mapea directamente a `categoria_producto` en 02_schema_ddl.sql.
 */
export interface CategoriaAdminDTO {
  id: string;
  local_id: string;
  nombre: string;
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;

  // Atributos agregados calculados por JOIN/COUNT sobre la tabla `producto`
  total_productos: number;
  productos_disponibles: number;
  productos_agotados: number;
}

/**
 * Resumen global de métricas de categorías de la carta.
 */
export interface ResumenCategoriasDTO {
  total_categorias: number;
  categorias_activas: number;
  categorias_ocultas: number;
  total_productos_asociados: number;
  categoria_con_mas_platos?: {
    id: string;
    nombre: string;
    cantidad: number;
  } | null;
}

/**
 * Payload completo del endpoint GET /api/v1/admin/categorias
 */
export interface CategoriasAdminResponseDTO {
  local_id: string;
  local_nombre: string;
  resumen: ResumenCategoriasDTO;
  categorias: CategoriaAdminDTO[];
}

/**
 * Request para crear categoría (POST /api/v1/admin/categorias)
 */
export interface CrearCategoriaRequest {
  nombre: string;
  activa?: boolean;
}

/**
 * Request para actualizar categoría (PUT /api/v1/admin/categorias/{id})
 */
export interface ActualizarCategoriaRequest {
  nombre: string;
  activa?: boolean;
}

/**
 * Item individual para reordenamiento secuencial
 */
export interface ItemReordenarCategoria {
  id: string;
  orden: number;
}

/**
 * Request para reordenar categorías en lote (PATCH /api/v1/admin/categorias/reordenar)
 */
export interface ReordenarCategoriasRequest {
  categorias: ItemReordenarCategoria[];
}

/**
 * Request para reasignación de platos y eliminación de categoría (POST /api/v1/admin/categorias/{id}/reasignar-y-eliminar)
 */
export interface ReasignarYEliminarCategoriaRequest {
  nueva_categoria_id: string;
  producto_ids?: string[]; // IDs específicos a reasignar. Si se omite o incluye todos los pendientes, reasigna todos
}

/**
 * Resultado de la reasignación parcial o total de platos
 */
export interface ResultadoReasignacionCategoriaDTO {
  mensaje: string;
  categoria_id: string;
  platos_reasignados: number;
  platos_restantes: number;
  categoria_eliminada: boolean;
}

/**
 * Tipo de plantilla gastronómica peruana soportada
 */
export type TipoPlantillaGastronomica = 'polleria' | 'cevicheria' | 'chifa' | 'criollo' | 'cafeteria';

/**
 * Request para cargar plantilla preconfigurada (POST /api/v1/admin/categorias/plantilla)
 */
export interface CargarPlantillaCategoriasRequest {
  tipo_plantilla: TipoPlantillaGastronomica;
  reemplazar_existentes: boolean;
}

/**
 * Estructura de error asistido para conflicto 409 cuando se intenta eliminar una categoría con platos asociados
 * Mapea a la restricción ON DELETE RESTRICT en PostgreSQL 16
 */
export interface ConflictoCategoriaConProductosDTO {
  categoria_id: string;
  categoria_nombre: string;
  total_productos: number;
  productos_muestras: Array<{
    id: string;
    nombre: string;
    precio: number;
    disponibilidad: string;
  }>;
}

// =============================================================================
// TIPOS Y DTOS PARA CU-ADMIN-03: GESTIONAR CATÁLOGO DE INSUMOS DE INVENTARIO
// =============================================================================

/**
 * Catálogo cerrado de 10 unidades de almacén universales.
 * Mapea directamente al CHECK constraint de la columna `insumo.unidad_medida` en 02_schema_ddl.sql.
 * 3 Unidades Base + 7 Empaques Comerciales.
 */
export type UnidadInsumo =
  | 'kg'       // Kilo (Unidad base)
  | 'L'        // Litro (Unidad base)
  | 'und'      // Unidad (Unidad base)
  | 'saco'     // Saco (Empaque comercial)
  | 'botella'  // Botella (Empaque comercial)
  | 'lata'     // Lata (Empaque comercial)
  | 'caja'     // Caja (Empaque comercial)
  | 'paquete'  // Paquete (Empaque comercial)
  | 'bidon'    // Bidón (Empaque comercial)
  | 'jaba';    // Jaba (Empaque comercial)

/**
 * Tres estados operativos de insumo.
 * Mapea al CHECK constraint de la columna `insumo.estado` en 02_schema_ddl.sql.
 */
export type EstadoInsumo = 'activo' | 'agotado' | 'inactivo';

/**
 * Semáforo cromático de 4 niveles para control visual de existencias.
 */
export type NivelSemaforoStock = 'optimo' | 'reposicion' | 'critico' | 'agotado';

/**
 * Motivos auditables para ajustes físicos de stock.
 * Mapea al CHECK constraint de la columna `auditoria_stock_ajuste.motivo` en 02_schema_ddl.sql.
 */
export type MotivoAjusteStock =
  | 'conteo_fisico_inventario'
  | 'merma_desperdicio'
  | 'ingreso_manual'
  | 'vencimiento_caducidad'
  | 'rotura_accidente'
  | 'inconsistencia_cocina';

/**
 * DTO para la fila del catálogo de insumos en el listado administrativo.
 */
export interface InsumoAdminDTO {
  id: string;
  local_id: string;
  nombre: string;
  unidad_medida: UnidadInsumo;
  stock_actual: number;
  stock_minimo: number;
  nivel_semaforo: NivelSemaforoStock;
  costo_unitario: number;
  moneda: string; // 'PEN'
  ultimo_proveedor_id?: string | null;
  ultimo_proveedor_nombre?: string | null;
  fecha_ultima_compra?: string | null;
  estado: EstadoInsumo;
  platos_afectados_si_quiebra: number;
  platos_detalle: string[];
  created_at: string;
  updated_at: string;
}

/**
 * KPIs de resumen del inventario para la cabecera.
 */
export interface ResumenInventarioDTO {
  total_activos: number;
  total_agotados: number;
  total_inactivos: number;
  valorizacion_total: number;
}

/**
 * Registro de auditoría para recuentos físicos, mermas e ingresos.
 * Mapea a la tabla `auditoria_stock_ajuste` en 02_schema_ddl.sql.
 */
export interface AuditoriaStockAjusteDTO {
  id: string;
  local_id: string;
  insumo_id: string;
  insumo_nombre: string;
  usuario_id: string;
  usuario_nombre: string;
  stock_anterior: number;
  stock_nuevo: number;
  diferencia: number;
  motivo: MotivoAjusteStock;
  notas?: string | null;
  created_at: string;
}

/**
 * Payload completo del endpoint GET /api/v1/admin/insumos
 */
export interface InsumosAdminResponseDTO {
  local_id: string;
  local_nombre: string;
  kpis: ResumenInventarioDTO;
  filtro_actual: 'activo' | 'agotado' | 'inactivo' | 'todos';
  insumos: InsumoAdminDTO[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

/**
 * Request para alta ágil de insumo (< 8s) (POST /api/v1/admin/insumos)
 */
export interface CrearInsumoRequest {
  nombre: string;
  unidad_medida: UnidadInsumo;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  estado?: EstadoInsumo;
}

/**
 * Request para edición de insumo (PUT /api/v1/admin/insumos/{id})
 */
export interface ActualizarInsumoRequest {
  nombre: string;
  unidad_medida: UnidadInsumo;
  stock_minimo: number;
  costo_unitario: number;
}

/**
 * Request para ajuste físico de stock con auditoría obligatoria (PATCH /api/v1/admin/insumos/{id}/ajuste-stock)
 */
export interface AjustarStockInsumoRequest {
  stock_fisico: number;
  motivo: MotivoAjusteStock;
  notas?: string;
}

/**
 * Request para conmutación rápida de estado (PATCH /api/v1/admin/insumos/{id}/estado)
 */
export interface ConmutarEstadoInsumoRequest {
  estado: EstadoInsumo;
}

/**
 * Resultado de un ajuste físico atómico con sincronización con cocina y salón
 */
export interface AjusteStockResultDTO {
  insumo_id: string;
  nombre: string;
  stock_anterior: number;
  stock_nuevo: number;
  diferencia: number;
  estado_resultante: EstadoInsumo;
  auditoria_id: string;
  platos_bloqueados_en_carta: Array<{ id: string; nombre: string }>;
  pedidos_en_cola_observados: Array<{
    pedido_id: string;
    mesa: string;
    producto: string;
    mozo_id: string;
    alerta_emitida: boolean;
  }>;
  mensaje: string;
}

// =============================================================================
// TIPOS Y DTOs PARA CU-ADMIN-04: PRODUCTOS DE LA CARTA Y RECETAS DUALES
// =============================================================================

export type ModoCalculoReceta = 'rendimiento' | 'exacto';
export type DisponibilidadProducto = 'disponible' | 'agotado';
export type MotivoAgotado = 'quiebre_stock_receta' | 'apagado_manual_cocina' | 'decision_admin';

/**
 * Detalle de insumo dosificado en la receta culinaria de un producto
 */
export interface ItemRecetaDTO {
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  modo_calculo: ModoCalculoReceta;
  rendimiento_platos?: number | null; // Usado en modo 'rendimiento' (platos por empaque/lote)
  cantidad_descuenta: number;         // En 'rendimiento': 1 / rendimiento_platos. En 'exacto': cantidad directa
  costo_unitario_insumo: number;
  costo_plato_insumo: number;         // cantidad_descuenta * costo_unitario_insumo
  stock_actual_insumo: number;
  raciones_disponibles_insumo: number; // Math.floor(stock_actual_insumo / cantidad_descuenta)
}

/**
 * Ficha comercial y técnica de un producto en carta con métricas de rentabilidad
 */
export interface ProductoAdminDTO {
  id: string;
  local_id: string;
  categoria_id: string;
  categoria_nombre: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  costo_estandar: number;
  costo_teorico: number;             // Suma de costos de insumos en la receta
  margen_bruto_pct: number;          // ((precio - costo_teorico) / precio) * 100
  moneda: string;                    // 'PEN'
  foto_url?: string | null;
  disponibilidad: DisponibilidadProducto;
  motivo_agotado?: MotivoAgotado | null;
  requiere_preparacion: boolean;     // true: Cocina KDS; false: Despacho directo mozo/barra
  activo: boolean;                   // true: activo en carta; false: archivado lógico
  total_ingredientes: number;
  insumos_en_quiebre: number;
  receta: ItemRecetaDTO[];
  created_at: string;
  updated_at: string;
}

/**
 * Métricas KPI del catálogo de carta
 */
export interface KpisCartaDTO {
  total_productos: number;
  disponibles: number;
  agotados: number;
  margen_promedio: number;
}

/**
 * Respuesta paginada del catálogo de productos y carta (GET /api/v1/admin/productos)
 */
export interface ListarProductosResponseDTO {
  kpis: KpisCartaDTO;
  productos: ProductoAdminDTO[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

/**
 * Elemento de receta en payload de creación o edición
 */
export interface CrearItemRecetaRequest {
  insumo_id: string;
  modo_calculo: ModoCalculoReceta;
  rendimiento_platos?: number;
  cantidad_descuenta?: number;
}

/**
 * Request para alta o edición de producto comercial con receta atómica (POST /api/v1/admin/productos)
 */
export interface CrearProductoRequest {
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  foto_url?: string;
  requiere_preparacion: boolean;
  receta: CrearItemRecetaRequest[];
}

/**
 * Request para edición rápida de receta desde el Quick-Drawer (PUT /api/v1/admin/productos/{id}/receta)
 */
export interface ActualizarRecetaRequest {
  receta: CrearItemRecetaRequest[];
}

/**
 * Simulación de capacidad y detección de insumo cuello de botella en bodega
 */
export interface DetalleCapacidadInsumo {
  insumo_id: string;
  insumo_nombre: string;
  stock_actual: number;
  unidad_medida: string;
  raciones_posibles: number;
  es_limitante: boolean;
}

export interface SimulacionCapacidadDTO {
  capacidad_maxima_platos: number;
  insumo_cuello_botella_id: string;
  insumo_cuello_botella_nombre: string;
  detalles: DetalleCapacidadInsumo[];
}

// ============================================================================
// CU-ADMIN-05: Directorio y Catálogo de Proveedores de Insumos
// ============================================================================

/**
 * Insumo suministrado habitualmente por un proveedor (proveedor_insumo_habitual)
 */
export interface InsumoHabitualDTO {
  insumo_id: string;
  nombre: string;
  unidad_medida: string;
  ultimo_precio: number;
}

/**
 * Representa un proveedor en el directorio comercial principal (tabla `proveedor`)
 */
export interface ProveedorResumenDTO {
  id: string;
  local_id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  insumos_habituales: InsumoHabitualDTO[];
  total_compras: number;
  total_gastado: number;
  ultima_compra_fecha?: string | null;
  ultima_compra_total?: number | null;
  created_at: string;
}

/**
 * KPIs consolidados del directorio de abastecimiento
 */
export interface ProveedoresKPIsDTO {
  total_activos: number;
  compras_mes_total: number;
  fichas_mes_total: number;
  proveedores_frecuentes: number;
}

/**
 * Respuesta paginada del directorio comercial (GET /api/v1/admin/proveedores)
 */
export interface ProveedoresListDTO {
  kpis: ProveedoresKPIsDTO;
  proveedores: ProveedorResumenDTO[];
  total_items: number;
  pagina: number;
  items_pagina: number;
  total_paginas: number;
}

/**
 * Payload para alta ágil de proveedor sin exigencia de RUC (POST /api/v1/admin/proveedores)
 */
export interface CrearProveedorRequestDTO {
  nombre: string;
  contacto?: string;
  telefono: string;
  email?: string;
  direccion?: string;
  insumos_ids?: string[];
}

/**
 * Payload para actualizar datos comerciales de un proveedor (PUT /api/v1/admin/proveedores/{id})
 */
export interface ActualizarProveedorRequestDTO {
  nombre: string;
  contacto?: string;
  telefono: string;
  email?: string;
  direccion?: string;
  insumos_ids?: string[];
}

/**
 * Línea de detalle de insumo en una ficha de compra histórica
 */
export interface ItemCompraHistorialDTO {
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/**
 * Ficha de compra registrada pasada de un proveedor (tabla `ficha_compra`)
 */
export interface FichaCompraHistorialDTO {
  id: string;
  numero_comprobante: string;
  tipo_comprobante: 'factura' | 'boleta' | 'nota_venta' | 'guia_remision' | 'recibo';
  fecha_emision: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta_debito' | 'credito_proveedor';
  total: number;
  items: ItemCompraHistorialDTO[];
}

/**
 * Datos agregados para el Quick-Drawer lateral de historial y precios
 */
export interface ProveedorHistorialComprasDTO {
  proveedor_id: string;
  proveedor_nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  total_facturado: number;
  total_fichas: number;
  variacion_precio_texto?: string;
  compras: FichaCompraHistorialDTO[];
}

// =============================================================================
// TIPOS Y DTOs PARA CU-ADMIN-06: REGISTRAR FICHA DE COMPRA DE INSUMOS
// =============================================================================

export type TipoComprobanteCompra = 'FACTURA' | 'BOLETA' | 'NOTA_VENTA' | 'GUIA_REMISION' | 'RECIBO';
export type MetodoPagoCompra = 'TRANSFERENCIA' | 'YAPE_PLIN' | 'EFECTIVO' | 'CREDITO_30D';
export type EstadoFichaCompra = 'REGISTRADA' | 'ANULADA';

export interface ItemCompraRequestDTO {
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  costo_anterior?: number;
}

export interface RegistrarFichaCompraRequestDTO {
  proveedor_id: string;
  proveedor_nombre?: string;
  tipo_comprobante: TipoComprobanteCompra;
  numero_comprobante?: string; // si viene vacío y es NOTA_VENTA o RECIBO, backend auto-genera NV-YYYYMMDD-####
  fecha_emision: string; // ISO string o YYYY-MM-DD
  metodo_pago: MetodoPagoCompra;
  observaciones?: string;
  actualizar_contacto_proveedor?: {
    telefono?: string;
    email?: string;
    direccion?: string;
  };
  items: ItemCompraRequestDTO[];
}

export interface ItemCompraDetalleDTO {
  id: string;
  ficha_id: string;
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  costo_anterior: number;
  variacion_porcentaje: number;
}

export interface PlatoReactivableDTO {
  id: string;
  nombre: string;
  categoria_nombre: string;
  precio: number;
  insumos_reposicionados: string[];
}

export interface FichaCompraResumenDTO {
  id: string;
  codigo_correlativo: string;
  tipo_comprobante: TipoComprobanteCompra;
  numero_comprobante: string;
  proveedor_id: string;
  proveedor_nombre: string;
  proveedor_telefono?: string;
  fecha_emision: string;
  fecha_registro: string;
  metodo_pago: MetodoPagoCompra;
  total: number;
  subtotal_neto: number; // sin IGV
  igv_monto: number; // 18% si FACTURA
  cantidad_items: number;
  estado: EstadoFichaCompra;
  registrado_por_nombre: string;
  motivo_anulacion?: string;
  fecha_anulacion?: string;
}

export interface FichaCompraDetalleCompletoDTO extends FichaCompraResumenDTO {
  observaciones?: string;
  items: ItemCompraDetalleDTO[];
  platos_reactivables?: PlatoReactivableDTO[];
}

export interface FichasCompraKPIsDTO {
  gasto_mes_total: number;
  variacion_gasto_mes_pct: number;
  total_compras_mes: number;
  facturas_con_igv_monto: number;
  creditos_pendientes_monto: number;
}

export interface ListarFichasCompraResponseDTO {
  fichas: FichaCompraResumenDTO[];
  kpis: FichasCompraKPIsDTO;
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

export interface InsumoImpactadoDTO {
  insumo_id: string;
  insumo_nombre: string;
  unidad_medida: string;
  stock_actual: number;
  cantidad_a_restar: number;
  stock_proyectado: number; // GREATEST(0, stock_actual - cantidad)
  quedara_en_quiebre: boolean;
}

export interface PlatoImpactadoDTO {
  plato_id: string;
  plato_nombre: string;
  categoria_nombre: string;
  insumo_critico: string;
}

export interface PedidoCocinaImpactadoDTO {
  comanda_id: string;
  mesa_codigo: string;
  plato_nombre: string;
  estado_comanda: string;
}

export interface ImpactoAnulacionDTO {
  ficha_id: string;
  numero_comprobante: string;
  proveedor_nombre: string;
  fecha_emision: string;
  total: number;
  insumos_afectados: InsumoImpactadoDTO[];
  platos_que_se_agotaran: PlatoImpactadoDTO[];
  pedidos_cocina_en_riesgo: PedidoCocinaImpactadoDTO[];
  requiere_confirmacion_estricta: boolean;
}

export interface AnularFichaCompraRequestDTO {
  ficha_id: string;
  motivo: string;
}

// ============================================================================
// CU-ADMIN-08: Gestión de Personal del Local
// ============================================================================

export type RolEmpleadoOperativo = 'mozo' | 'cocina' | 'cajero';
export type EstadoEmpleado = 'activo' | 'inactivo' | 'pendiente_activacion';

export interface MesaActivaEmpleadoDTO {
  mesa_id: string;
  mesa_codigo: string;
  piso_nombre: string;
  comanda_codigo: string;
  monto_actual: number;
  minutos_activa: number;
}

export interface EmpleadoResumenDTO {
  id: string;
  local_id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: RolEmpleadoOperativo;
  estado: EstadoEmpleado;
  ultimo_login?: string | null;
  created_at: string;
  mesas_activas_count?: number;
  tiene_caja_abierta?: boolean;
}

export interface EmpleadoDetalleDTO extends EmpleadoResumenDTO {
  password_temporal?: string;
  enlace_whatsapp_link?: string;
  mesas_activas_detalle?: MesaActivaEmpleadoDTO[];
}

export interface MetricasPersonalDTO {
  total_empleados: number;
  max_usuarios_plan: number;
  cupos_disponibles: number;
  mozos_activos: number;
  cocina_activos: number;
  cajeros_activos: number;
  plan_nombre: string;
  porcentaje_ocupacion: number;
}

export interface RegistrarEmpleadoRequestDTO {
  nombre: string;
  correo: string;
  telefono: string;
  rol: RolEmpleadoOperativo;
  enviar_bienvenida?: boolean;
}

export interface ActualizarEmpleadoRequestDTO {
  nombre: string;
  telefono: string;
  rol: RolEmpleadoOperativo;
}

export interface PrecheckDesactivacionDTO {
  usuario_id: string;
  nombre: string;
  rol: RolEmpleadoOperativo;
  mesas_activas_pendientes: MesaActivaEmpleadoDTO[];
  caja_abierta_pendiente?: {
    caja_id: string;
    nombre_caja: string;
    apertura_fecha: string;
    monto_apertura: number;
  } | null;
  puede_desactivar_directo: boolean;
  requiere_reasignacion: boolean;
  mensaje_advertencia?: string;
}

export interface DesactivarEmpleadoRequestDTO {
  mozo_sustituto_id?: string;
  motivo: string;
}

export interface ResetPasswordResponseDTO {
  usuario_id: string;
  nombre: string;
  correo: string;
  password_temporal: string;
  enlace_whatsapp_link: string;
}

export interface ListarPersonalResponseDTO {
  empleados: EmpleadoResumenDTO[];
  metricas: MetricasPersonalDTO;
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

// ============================================================================
// CU-ADMIN-09: Horario de Atención y Feriados del Local
// ============================================================================

export interface TurnoHorarioDTO {
  id?: string;
  nombre_turno: string; // ej. "Almuerzo", "Cena", "Continuo"
  hora_inicio: string; // "HH:MM"
  hora_fin: string; // "HH:MM"
}

export interface DiaHorarioDTO {
  dia_semana: number; // 1: Lunes .. 7: Domingo
  nombre_dia: string; // "Lunes", "Martes", etc.
  atiende: boolean;
  turnos: TurnoHorarioDTO[];
}

export interface ConfigSemanaHorariaRequest {
  dias: DiaHorarioDTO[];
}

export interface HorarioSemanaResponse {
  local_id: string;
  dias: DiaHorarioDTO[];
  total_horas_semanales?: number;
}

export interface AplicarPlantillaRequest {
  plantilla: 'restaurante_estandar' | 'solo_almuerzo' | 'corrido_continuo';
}

export interface ExcepcionHorarioDTO {
  id: string;
  local_id: string;
  fecha: string; // "YYYY-MM-DD"
  cerrado: boolean;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  motivo: string;
  created_at: string;
  created_by?: string;
  reservas_canceladas_count?: number;
}

export interface PrecheckExcepcionRequest {
  fecha: string;
  cerrado: boolean;
  hora_inicio?: string;
  hora_fin?: string;
}

export interface ReservaConflictoDTO {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_hora: string;
  num_personas: number;
  mesas_asignadas: string[];
  link_whatsapp: string;
  notificado?: boolean;
  metodo_notificacion?: 'whatsapp' | 'llamada' | 'presencial' | 'ninguno';
}

export interface PrecheckExcepcionResponse {
  hay_conflictos: boolean;
  total_afectadas: number;
  reservas: ReservaConflictoDTO[];
}

export interface NotificacionContactoDTO {
  reserva_id: string;
  notificado: boolean;
  metodo_notificacion: 'whatsapp' | 'llamada' | 'presencial' | 'ninguno';
}

export interface CrearExcepcionRequest {
  fecha: string;
  cerrado: boolean;
  hora_inicio?: string;
  hora_fin?: string;
  motivo: string;
  cancelar_reservas?: boolean;
  reservas_notificadas?: NotificacionContactoDTO[];
}

// ============================================================================
// CU-ADMIN-10: Configurar Políticas y Parámetros de Reservas de Mesas
// ============================================================================

export interface PoliticasReservaDTO {
  local_id: string;
  acepta_reservas: boolean;
  duracion_reserva_min: number; // Default 90, min 30, max 240
  buffer_reserva_min: number; // Default 15, min 0, max 60
  tolerancia_no_show_min: number; // Default 15, min 5, max 60
  minutos_bloqueo_previo: number; // Default 30, min 0, max 120
  margen_recordatorio_min: number; // Default 120, min 0
  anticipacion_minima_horas: number; // Default 2, min 0, max 48
  anticipacion_maxima_dias: number; // Default 30, min 1, max 90
  updated_at: string;
}

export interface ActualizarPoliticasReservaRequest {
  acepta_reservas: boolean;
  duracion_reserva_min: number;
  buffer_reserva_min: number;
  tolerancia_no_show_min: number;
  minutos_bloqueo_previo: number;
  margen_recordatorio_min: number;
  anticipacion_minima_horas: number;
  anticipacion_maxima_dias: number;
}

export interface ReservaResumenDTO {
  id: string;
  cliente: string;
  telefono: string;
  fecha_hora: string;
  pax: number;
  mesas: string[];
}

export interface PrecheckDesactivacionReservasResponse {
  permite_desactivar: boolean;
  total_pendientes: number;
  reservas?: ReservaResumenDTO[];
}

// ============================================================================
// CU-ADMIN-11: Registrar y Consultar Historial de Incidentes Internos
// Derivado estrictamente de la tabla `incidente` en 02_schema_ddl.sql (líneas 678-701)
// ============================================================================

export type CategoriaIncidente =
  | 'servicio_cliente'
  | 'disciplinario'
  | 'rotura_merma'
  | 'seguridad_higiene'
  | 'caja_dinero'
  | 'otro';

export type GravedadIncidente = 'baja' | 'media' | 'alta';
export type EstadoIncidente = 'abierto' | 'en_revision' | 'resuelto';

export type TipoEventoBitacora =
  | 'apertura'
  | 'directiva_propietario'
  | 'indagacion'
  | 'resolucion';

export interface IncidenteBitacoraItemDTO {
  id: string;
  incidente_id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_rol: string;
  tipo_evento: TipoEventoBitacora;
  nota: string;
  created_at: string;
}

export interface IncidenteItemDTO {
  id: string;
  codigo: string; // ej. "INC-2026-085"
  titulo: string;
  categoria: CategoriaIncidente;
  gravedad: GravedadIncidente;
  empleado_id?: string | null;
  empleado_nombre?: string | null;
  fecha_hora: string;
  estado: EstadoIncidente;
  visto_por_propietario: boolean;
  fecha_visto?: string | null;
  tiene_nota_propietario: boolean;
  total_avances: number;
  dias_en_curso: number;
  created_at: string;
}

export interface IncidentesKPIsDTO {
  abiertos: number;
  en_revision: number;
  gravedad_alta: number;
  resueltos_mes: number;
  con_nota_propietario: number;
}

export interface IncidentesHistorialResponse {
  kpis: IncidentesKPIsDTO;
  incidentes: IncidenteItemDTO[];
  total: number;
  pagina: number;
  limite: number;
}

export interface IncidenteDetalleDTO {
  id: string;
  local_id: string;
  codigo: string;
  titulo: string;
  categoria: CategoriaIncidente;
  gravedad: GravedadIncidente;
  fecha_hora: string;
  empleado_id?: string | null;
  empleado_nombre?: string | null;
  descripcion: string;
  medidas_inmediatas?: string | null;
  foto_url?: string | null;
  registrado_por: string;
  registrador_nombre: string;
  estado: EstadoIncidente;
  visto_por_propietario: boolean;
  fecha_visto?: string | null;
  nota_propietario?: string | null;
  motivo_revision?: string | null;
  resolucion_nota?: string | null;
  resuelto_por?: string | null;
  resuelto_por_nombre?: string | null;
  fecha_resolucion?: string | null;
  bitacora: IncidenteBitacoraItemDTO[];
  created_at: string;
  updated_at: string;
}

export interface RegistrarIncidenteRequest {
  titulo: string;
  categoria: CategoriaIncidente;
  gravedad: GravedadIncidente;
  fecha_hora: string;
  involucra_empleado: boolean;
  empleado_id?: string | null;
  descripcion: string;
  medidas_inmediatas?: string | null;
  foto_url?: string | null;
  resolucion_inmediata?: boolean;
  resolucion_nota?: string;
}

export interface InvestigacionIncidenteRequest {
  motivo_revision: string;
}

export interface AgregarAvanceInvestigacionRequest {
  nota: string;
}

export interface ResolverIncidenteRequest {
  resolucion_nota: string;
}

export interface FiltrosIncidentesRequest {
  estado?: EstadoIncidente | 'todos';
  gravedad?: GravedadIncidente | 'todas';
  categoria?: CategoriaIncidente | 'todas';
  empleado_id?: string;
  periodo?: 'mes_actual' | 'mes_anterior' | 'todos';
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

// ============================================================================
// CU-ADMIN-12: Recibir Notificación de Anulación de Pedido y Auditoría de Sala
// Derivado estrictamente de la tabla `pedido_anulacion` en 02_schema_ddl.sql (líneas 751-781)
// ============================================================================

export type TipoAnulacion = 'item_individual' | 'comanda_completa';

export type MotivoAnulacionCategoria =
  | 'error_registro'
  | 'demora_cliente'
  | 'queja_calidad'
  | 'cambio_plato'
  | 'retiro_sin_consumo'
  | 'otro';

export type FiltroRapidoAnulaciones =
  | 'todas'
  | 'pendientes'
  | 'con_merma'
  | 'sin_merma'
  | 'comandas_totales';

export interface PedidoAnulacionItemDTO {
  id: string;
  codigo: string; // ej. "ANUL-2026-042"
  local_id: string;
  pedido_id: string;
  pedido_item_id?: string | null;
  tipo_anulacion: TipoAnulacion;
  mesa_id: string;
  mesa_numero: string; // Soporta mesas combinadas ej. "Mesa [ 02 ; 03 ]"
  producto_id?: string | null;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
  mozo_id: string;
  mozo_nombre: string;
  anulado_por: string;
  anulado_por_nombre: string;
  motivo_categoria: MotivoAnulacionCategoria;
  motivo_detalle: string;
  pedido_created_at: string;
  anulado_at: string;
  minutos_espera: number; // Diferencia fáctica en minutos entre anulado_at y pedido_created_at
  estado_anterior: 'en_cola' | 'en_preparacion' | 'listo' | 'servido';
  es_merma: boolean;
  costo_merma?: number | null;
  revisado: boolean;
  revisado_por?: string | null;
  revisado_por_nombre?: string | null;
  revisado_at?: string | null;
  notas_supervision?: string | null;
  incidente_id?: string | null;
  incidente_codigo?: string | null;
  partida_cocina?: string | null;
  created_at: string;
}

export interface AnulacionesKPIsDTO {
  total_anulaciones: number;
  monto_total: number;
  con_merma_cantidad: number;
  costo_merma_total: number;
  mesas_afectadas: number;
  pendientes_revision: number;
}

export interface AnulacionesBandejaResponseDTO {
  fecha: string;
  kpis: AnulacionesKPIsDTO;
  anulaciones: PedidoAnulacionItemDTO[];
}

export interface FiltrosAnulacionesRequest {
  fecha?: string;
  filtro_rapido?: FiltroRapidoAnulaciones;
  mozo_id?: string;
  busqueda?: string;
}

export interface MarcarRevisadoRequestDTO {
  notas_supervision?: string;
}

export interface EscalarIncidenteAnulacionRequest {
  titulo: string;
  categoria: CategoriaIncidente;
  gravedad: GravedadIncidente;
  medidas_adoptadas: string;
}

export interface NotificacionCampanaDTO {
  id: string;
  tipo: 'anulacion_item' | 'anulacion_comanda' | 'stock_minimo' | 'otro';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  titulo: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
  anulacion_id?: string;
  mesa_numero?: string;
  monto?: number;
}

// ============================================================================
// CU-ADMIN-17: Gestionar Promociones del Local
// Derivado estrictamente de la tabla `promocion` en 02_schema_ddl.sql (líneas 427-452)
// Coherencia tributaria y operativa con CU-CAJA-02, CU-CAJA-03, CU-MOZO-08 y CU-MOZO-09
// ============================================================================

export type TipoDescuentoPromocion = 'porcentaje' | 'monto_fijo';

export type TipoLimiteUsosPromocion = 'sin_limite' | 'global' | 'diario';

export type EstadoVisualPromocion =
  | 'vigente'
  | 'programada'
  | 'pausada'
  | 'vencida'
  | 'agotada'
  | 'agotada_hoy';

export type FiltroEstadoPromocion =
  | 'todas'
  | 'vigentes'
  | 'programadas'
  | 'pausadas'
  | 'vencidas'
  | 'agotadas';

export type FiltroTipoPromocion = 'todos' | 'porcentaje' | 'monto_fijo';

export interface PromocionAdminDTO {
  id: string;
  codigo: string; // ej. "PROMO-2026-001"
  local_id: string;
  nombre: string;
  descripcion?: string | null;
  tipo_descuento: TipoDescuentoPromocion;
  valor: number; // Porcentaje (1..100) o Monto en Soles S/
  tope_maximo_descuento?: number | null; // Tope en Soles por ticket/cuenta
  monto_minimo_consumo: number; // 0.00 si no exige mínimo
  dias_semana: number[]; // 1=Lunes..7=Domingo (ISO)
  hora_inicio?: string | null; // "18:00"
  hora_fin?: string | null; // "21:00"
  fecha_inicio: string; // "2026-10-01"
  fecha_fin: string; // "2026-10-31"
  tipo_limite_usos: TipoLimiteUsosPromocion; // 'sin_limite' | 'global' | 'diario'
  limite_usos?: number | null; // Límite numérico según el tipo
  usos_actuales: number; // Usos acumulados en toda la historia de la campaña
  usos_hoy: number; // Usos acumulados durante la jornada de hoy (O(1) Zero-Cron)
  fecha_ultimo_uso?: string | null; // Fecha ISO del último canje para auto-reset diario
  activa: boolean; // Switch inmediato para habilitar/pausar en Caja
  estado_visual: EstadoVisualPromocion;
  total_descontado: number; // S/ acumulado descontado
  total_ventas_asociadas: number; // S/ acumulado de ventas brutas
  created_at: string;
  updated_at?: string;
}

export interface PromocionKPIsDTO {
  vigentes_hoy: number;
  campanas_programadas: number;
  descuentos_mes: number;
  cuentas_beneficiadas: number;
}

export interface PromocionesBandejaResponseDTO {
  kpis: PromocionKPIsDTO;
  promociones: PromocionAdminDTO[];
  total: number;
}

export interface CrearPromocionRequest {
  nombre: string;
  descripcion?: string;
  tipo_descuento: TipoDescuentoPromocion;
  valor: number;
  tope_maximo_descuento?: number | null;
  monto_minimo_consumo?: number;
  dias_semana?: number[];
  hora_inicio?: string | null;
  hora_fin?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_limite_usos?: TipoLimiteUsosPromocion;
  limite_usos?: number | null;
  activa: boolean;
}

export interface ActualizarPromocionRequest {
  nombre?: string;
  descripcion?: string;
  tipo_descuento?: TipoDescuentoPromocion;
  valor?: number;
  tope_maximo_descuento?: number | null;
  monto_minimo_consumo?: number;
  dias_semana?: number[];
  hora_inicio?: string | null;
  hora_fin?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_limite_usos?: TipoLimiteUsosPromocion;
  limite_usos?: number | null;
  activa?: boolean;
}

export interface PromocionComprobanteAuditoriaDTO {
  id: string;
  numero_comprobante: string; // "B001-000492" o "F001-000108"
  fecha_hora: string;
  mesa_numero: string;
  cajero_nombre: string;
  subtotal: number;
  descuento: number;
  total: number;
}

export interface PromocionRendimientoDTO {
  promocion: PromocionAdminDTO;
  ventas_totales: number;
  descuentos_totales: number;
  ticket_promedio: number;
  usos_totales: number;
  comprobantes: PromocionComprobanteAuditoriaDTO[];
}

export interface FiltrosPromocionesRequest {
  estado?: FiltroEstadoPromocion;
  tipo_descuento?: FiltroTipoPromocion;
  busqueda?: string;
  mes?: string;
}

export interface BuscarPromocionesRequestDTO {
  q: string;
  estado?: FiltroEstadoPromocion;
  tipo?: FiltroTipoPromocion;
}

export interface BuscarPromocionesResponseDTO {
  termino: string;
  resultados: PromocionAdminDTO[];
  total: number;
}

// ============================================================================
// CU-ADMIN-18: Configurar Parámetros Operativos de Comanda y Tiempos de KDS
// Tabla: configuracion_kds (02_schema_ddl.sql)
// ============================================================================

export interface ConfiguracionKdsDTO {
  local_id: string;
  tiempo_optimo_verde_min: number;   // 3 a 60 min, default 15
  tiempo_alerta_ambar_min: number;   // 5 a 120 min, default 25
  tiempo_maximo_pase_min: number;    // 1 a 30 min, default 3
  alerta_sonora_nueva_comanda: boolean;
  alerta_sonora_comanda_roja: boolean;
  intervalo_sonido_rojo_seg: number; // 15 a 300 seg, default 60
  vista_predeterminada: 'fifo' | 'all_day';
  created_at?: string;
  updated_at?: string;
}

export interface ActualizarConfiguracionKdsRequest {
  tiempo_optimo_verde_min: number;
  tiempo_alerta_ambar_min: number;
  tiempo_maximo_pase_min: number;
  alerta_sonora_nueva_comanda: boolean;
  alerta_sonora_comanda_roja: boolean;
  intervalo_sonido_rojo_seg: number;
  vista_predeterminada: 'fifo' | 'all_day';
}

export interface EventoConfiguracionKdsActualizada {
  local_id: string;
  tiempo_optimo_verde_min: number;
  tiempo_alerta_ambar_min: number;
  tiempo_maximo_pase_min: number;
  timestamp: string;
}

// ============================================================================
// CU-ADMIN-19: Configurar Métodos de Pago y Comisiones de Cobro del Local
// Tabla: metodo_pago_local (02_schema_ddl.sql)
// ============================================================================

export type CodigoMetodoPagoLocal = 'efectivo' | 'tarjeta' | 'billetera_digital' | 'transferencia';

export interface DatosAdicionalesMetodoPago {
  telefono?: string;
  titular?: string;
  operador?: string; // Niubiz, Izipay
  banco?: string;
  cuenta?: string;
  cci?: string;
  qr_url?: string;
  instrucciones_cajero?: string;
  ruc?: string;
  [key: string]: any;
}

export interface MetodoPagoLocalDTO {
  id: string;
  local_id: string;
  codigo: CodigoMetodoPagoLocal;
  nombre: string;
  activo: boolean;
  comision_porcentaje: number; // 0.00 a 50.00
  datos_adicionales: DatosAdicionalesMetodoPago;
  icono: string;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

export interface MetodosPagoKPIsDTO {
  formas_habilitadas: number;
  total_formas: number;
  metodos_con_comision: number;
  ventas_tarjeta_mes: number;
  recargos_percibidos_mes: number;
}

export interface CatalogoMetodosPagoResponseDTO {
  kpis: MetodosPagoKPIsDTO;
  metodos: MetodoPagoLocalDTO[];
  sede_nombre: string;
}

export interface ActualizarMetodoPagoItemRequest {
  codigo: CodigoMetodoPagoLocal;
  activo: boolean;
  comision_porcentaje: number;
  datos_adicionales?: DatosAdicionalesMetodoPago;
  nombre?: string;
}

export interface ActualizarCatalogoMetodosRequest {
  metodos: ActualizarMetodoPagoItemRequest[];
}

export interface OpcionCobroSimuladaDTO {
  codigo: CodigoMetodoPagoLocal;
  nombre: string;
  activo: boolean;
  consumo_base: number;
  comision_porcentaje: number;
  monto_recargo: number;
  total_final: number;
  base_imponible: number;
  igv: number;
}

export interface SimulacionCobroResponseDTO {
  monto_consumo: number;
  opciones: OpcionCobroSimuladaDTO[];
}

// ============================================================================
// CU-ADMIN-14: Gestión de Flujo de Caja, Gastos Operativos y Auditoría de Cierres Z
// Tablas: caja, gasto_manual, caja_movimiento, auditoria_caja_cierre (02_schema_ddl.sql)
// ============================================================================

export type PeriodoFlujoCaja = 'hoy' | 'semana' | 'este_mes' | 'personalizado';
export type CategoriaGastoManual =
  | 'servicios_basicos'
  | 'alquiler'
  | 'limpieza_aseo'
  | 'mantenimiento'
  | 'caja_chica'
  | 'otros';
export type OrigenFondosGasto = 'transferencia_bancaria' | 'efectivo_caja';

export interface IngresosDesgloseDTO {
  efectivo_monto: number;
  efectivo_porcentaje: number;
  tarjeta_pos_monto: number;
  tarjeta_pos_porcentaje: number;
  billeteras_monto: number;
  billeteras_porcentaje: number;
}

export interface LiquidezDTO {
  total_disponible: number;
  en_bancos_monto: number;
  en_bancos_porcentaje: number;
  en_gavetas_monto: number;
  en_gavetas_porcentaje: number;
}

export interface InsumoCompradoDTO {
  insumo_id: string;
  nombre_insumo: string;
  cantidad_comprada: number;
  unidad_medida: string;
  monto_total: number;
  porcentaje_de_compras: number;
}

export interface GastoCategoriaDTO {
  categoria: CategoriaGastoManual;
  nombre_categoria: string;
  monto_total: number;
  porcentaje_de_gastos: number;
}

export interface FlujoDiarioDTO {
  fecha: string;
  etiqueta_dia: string;
  ingresos_dia: number;
  egresos_dia: number;
  saldo_neto_dia: number;
}

export interface FlujoCajaResumenDTO {
  local_id: string;
  sede_nombre: string;
  periodo: PeriodoFlujoCaja;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos_totales: number;
  delta_ingresos_pct: number;
  ingresos_desglose: IngresosDesgloseDTO;
  egresos_totales: number;
  delta_egresos_pct: number;
  compras_insumos_total: number;
  gastos_manuales_total: number;
  balance_neto: number;
  margen_neto_porcentaje: number;
  ratio_cobertura: number;
  conciliacion_liquidez: LiquidezDTO;
  curva_diaria: FlujoDiarioDTO[];
  top_insumos_comprados: InsumoCompradoDTO[];
  gastos_por_categoria: GastoCategoriaDTO[];
}

export interface GastoOperativoDTO {
  id: string;
  local_id: string;
  categoria: CategoriaGastoManual;
  monto: number;
  origen_fondos: OrigenFondosGasto;
  caja_id?: string | null;
  caja_correlativo?: number | null;
  proveedor_nombre: string;
  tipo_comprobante: string;
  numero_documento?: string;
  descripcion: string;
  fecha: string;
  registrado_por: string;
  registrado_por_nombre: string;
  created_at: string;
}

export interface RegistrarGastoRequestDTO {
  categoria: CategoriaGastoManual;
  monto: number;
  origen_fondos: OrigenFondosGasto;
  proveedor_nombre: string;
  tipo_comprobante?: string;
  numero_documento?: string;
  descripcion: string;
  fecha: string;
}

export interface TurnoCajaResumenDTO {
  id: string;
  correlativo: number;
  cajero_id: string;
  cajero_nombre: string;
  cajero_rol?: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  duracion_horas?: string;
  monto_apertura: number;
  monto_esperado: number;
  monto_real?: number | null;
  discrepancia?: number | null;
  comentario_discrepancia?: string | null;
  notas_cierre?: string | null;
  estado: 'abierta' | 'cerrada';
  revisado: boolean;
  revisado_por?: string | null;
  revisado_por_nombre?: string | null;
  revisado_at?: string | null;
  notas_auditoria?: string | null;
  total_comprobantes?: number;
  total_facturado?: number;
  lote_pos?: string;
}

export interface AuditoriaTurnosKPIsDTO {
  total_turnos: number;
  turnos_cuadrados: number;
  porcentaje_cuadratura: number;
  turnos_con_discrepancia: number;
  monto_total_discrepancias: number;
  turnos_auditados: number;
  turnos_pendientes_auditoria: number;
  turno_activo?: TurnoCajaResumenDTO | null;
}

export interface VisarTurnoRequestDTO {
  conforme: boolean;
  notas_auditoria: string;
}

export interface CierreForzadoAdminRequestDTO {
  efectivo_contado: number;
  justificacion: string;
}



