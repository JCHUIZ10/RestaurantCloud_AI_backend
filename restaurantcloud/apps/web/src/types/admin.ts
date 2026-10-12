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

