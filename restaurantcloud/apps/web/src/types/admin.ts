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


