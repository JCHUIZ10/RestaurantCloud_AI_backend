import { ApiResponse } from '@/types/api';
import {
  PlanoMesasResponseDTO,
  PisoAdminDTO,
  MesaAdminDTO,
  CrearMesaLoteRequest,
  CrearMesaIndividualRequest,
  ActualizarMesaRequest,
  CrearPisoRequest,
  ActualizarDimensionesPisoRequest,
  CategoriaAdminDTO,
  CategoriasAdminResponseDTO,
  CrearCategoriaRequest,
  ActualizarCategoriaRequest,
  ReordenarCategoriasRequest,
  ReasignarYEliminarCategoriaRequest,
  ResultadoReasignacionCategoriaDTO,
  CargarPlantillaCategoriasRequest,
  ConflictoCategoriaConProductosDTO,
  UnidadInsumo,
  EstadoInsumo,
  NivelSemaforoStock,
  MotivoAjusteStock,
  InsumoAdminDTO,
  AuditoriaStockAjusteDTO,
  InsumosAdminResponseDTO,
  CrearInsumoRequest,
  ActualizarInsumoRequest,
  AjustarStockInsumoRequest,
  ConmutarEstadoInsumoRequest,
  AjusteStockResultDTO,
} from '@/types/admin';

// Identificadores Canónicos del Seed de Desarrollo Local (07_seed_local_aurea_completo.sql)
export const CANONICAL_LOCAL_ID = '00000000-0000-4000-8000-000000000010';
export const CANONICAL_LOCAL_NOMBRE = 'Sede Miraflores (Principal)';

export const PISO_SALON_ID = '11111111-1111-4000-8000-000000000001';
export const PISO_TERRAZA_ID = '11111111-1111-4000-8000-000000000002';
export const PISO_BARRA_ID = '11111111-1111-4000-8000-000000000003';

// Semillas iniciales canónicas de mesas
const SEMILLA_MESAS_SALON: MesaAdminDTO[] = [
  {
    id: 'm1a2b3c4-0001-4000-8000-000000000001',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '01',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0002-4000-8000-000000000002',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '02',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0003-4000-8000-000000000003',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '03',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0004-4000-8000-000000000004',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '04',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    // Mesa con comanda activa para probar bloqueo de seguridad 409
    tiene_pedido_activo: true,
    comanda_activa_codigo: 'COM-0104',
    total_cuenta_activa: 142.5,
    mozo_a_cargo: 'Luis Mozo',
  },
  {
    id: 'm1a2b3c4-0005-4000-8000-000000000005',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '05',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 4,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0006-4000-8000-000000000006',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '06',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 0,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0007-4000-8000-000000000007',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '07',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 1,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0008-4000-8000-000000000008',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '08',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 2,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0009-4000-8000-000000000009',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '09',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 1,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0010-4000-8000-000000000010',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_SALON_ID,
    numero: '10',
    capacidad: 8,
    forma: 'rectangular',
    posicion_x: 4,
    posicion_y: 1,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
];

const SEMILLA_MESAS_TERRAZA: MesaAdminDTO[] = [
  {
    id: 'm1a2b3c4-0011-4000-8000-000000000011',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '11',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0012-4000-8000-000000000012',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '12',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0013-4000-8000-000000000013',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '13',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0014-4000-8000-000000000014',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_TERRAZA_ID,
    numero: '14',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 3,
    posicion_y: 0,
    permite_union: true,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
];

const SEMILLA_MESAS_BARRA: MesaAdminDTO[] = [
  {
    id: 'm1a2b3c4-0015-4000-8000-000000000015',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_BARRA_ID,
    numero: '15',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0016-4000-8000-000000000016',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_BARRA_ID,
    numero: '16',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
  {
    id: 'm1a2b3c4-0017-4000-8000-000000000017',
    local_id: CANONICAL_LOCAL_ID,
    piso_id: PISO_BARRA_ID,
    numero: '17',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: false,
    mesa_principal_id: null,
    estado: 'activa',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    tiene_pedido_activo: false,
  },
];

const SEMILLAS_PISOS: PisoAdminDTO[] = [
  {
    id: PISO_SALON_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Salón Principal',
    columnas: 5,
    filas: 3,
    estado: 'activo',
    total_mesas: 10,
    capacidad_total_personas: 46,
    mesas: [...SEMILLA_MESAS_SALON],
  },
  {
    id: PISO_TERRAZA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Terraza Exterior',
    columnas: 4,
    filas: 2,
    estado: 'activo',
    total_mesas: 4,
    capacidad_total_personas: 16,
    mesas: [...SEMILLA_MESAS_TERRAZA],
  },
  {
    id: PISO_BARRA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Barra Bar',
    columnas: 3,
    filas: 2,
    estado: 'activo',
    total_mesas: 3,
    capacidad_total_personas: 6,
    mesas: [...SEMILLA_MESAS_BARRA],
  },
];

// =============================================================================
// SEMILLAS CANÓNICAS CU-ADMIN-02: CATEGORÍAS & PRODUCTOS (07_seed_local_aurea_completo.sql)
// =============================================================================
export const CATEGORIA_ENTRADAS_ID = '00000000-0000-4000-8000-000000000060';
export const CATEGORIA_FONDOS_ID = '00000000-0000-4000-8000-000000000061';
export const CATEGORIA_BEBIDAS_ID = '00000000-0000-4000-8000-000000000062';
export const CATEGORIA_POSTRES_ID = '00000000-0000-4000-8000-000000000063';

export interface MockProductoRelacional {
  id: string;
  local_id: string;
  categoria_id: string;
  nombre: string;
  precio: number;
  disponibilidad: 'disponible' | 'agotado' | 'oculto';
  es_combo: boolean;
}

const SEMILLA_PRODUCTOS_AUREA: MockProductoRelacional[] = [
  {
    id: '00000000-0000-4000-8000-000000000080',
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_ENTRADAS_ID,
    nombre: 'Ceviche Clásico',
    precio: 48.0,
    disponibilidad: 'disponible',
    es_combo: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000084',
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_ENTRADAS_ID,
    nombre: 'Causa Limeña de Pollo',
    precio: 32.0,
    disponibilidad: 'disponible',
    es_combo: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000081',
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_FONDOS_ID,
    nombre: 'Lomo Saltado Criollo',
    precio: 65.0,
    disponibilidad: 'disponible',
    es_combo: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000082',
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_BEBIDAS_ID,
    nombre: 'Inca Kola 500ml',
    precio: 9.0,
    disponibilidad: 'disponible',
    es_combo: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000083',
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_POSTRES_ID,
    nombre: 'Suspiro Limeño',
    precio: 24.0,
    disponibilidad: 'disponible',
    es_combo: false,
  },
];

interface MockCategoriaRaw {
  id: string;
  local_id: string;
  nombre: string;
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

const SEMILLAS_CATEGORIAS_AUREA: MockCategoriaRaw[] = [
  {
    id: CATEGORIA_ENTRADAS_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Entradas',
    orden: 1,
    activa: true,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: CATEGORIA_FONDOS_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Fondos',
    orden: 2,
    activa: true,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: CATEGORIA_BEBIDAS_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Bebidas',
    orden: 3,
    activa: true,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: CATEGORIA_POSTRES_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Postres',
    orden: 4,
    activa: true,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
];

export const PLANTILLAS_GASTRONOMICAS: Record<
  'polleria' | 'cevicheria' | 'chifa' | 'criollo' | 'cafeteria',
  { titulo: string; descripcion: string; categorias: string[] }
> = {
  polleria: {
    titulo: 'Pollería Tradicional',
    descripcion: 'Estructura clásica para pollerías y brasas peruanas',
    categorias: [
      'Pollos a la Brasa',
      'Guarniciones & Papas',
      'Ensaladas Frescas',
      'Bebidas & Gaseosas',
      'Cervezas & Tragos',
      'Postres',
    ],
  },
  cevicheria: {
    titulo: 'Cevichería & Pescados',
    descripcion: 'Especializada en mariscos, ceviches y comida marina',
    categorias: [
      'Ceviches & Tiraditos',
      'Causas & Entradas Frías',
      'Chicharrones & Jaleas',
      'Arroces & Sudados',
      'Chilcanos & Bebidas',
      'Postres Criollos',
    ],
  },
  chifa: {
    titulo: 'Chifa & Fusión Wok',
    descripcion: 'Gastronomía chino-peruana con platos al wok',
    categorias: [
      'Sopas & Wantanes',
      'Arroz Chaufa',
      'Tallarines & Wantán Frito',
      'Especialidades al Wok',
      'Bebidas & Té Jazmín',
    ],
  },
  criollo: {
    titulo: 'Restaurante Criollo',
    descripcion: 'Guisos tradicionales peruanos y comida de autor',
    categorias: [
      'Entradas Criollas',
      'Segundos Tradicionales',
      'Guisos de la Casa',
      'Bebidas & Refrescos',
      'Postres Tradicionales',
    ],
  },
  cafeteria: {
    titulo: 'Cafetería & Brunch',
    descripcion: 'Cafés de especialidad, sándwiches y pastelería fina',
    categorias: [
      'Cafés de Especialidad',
      'Bebidas Frías & Frappés',
      'Sándwiches & Tostones',
      'Pastelería Fina',
      'Desayunos & Combos',
    ],
  },
};

// =============================================================================
// SEMILLAS Y DEFINICIONES PARA CU-ADMIN-03: CATÁLOGO DE INSUMOS DE INVENTARIO
// =============================================================================

export interface MockInsumoRaw {
  id: string;
  local_id: string;
  nombre: string;
  unidad_medida: UnidadInsumo;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  moneda: string;
  ultimo_proveedor_id?: string | null;
  ultimo_proveedor_nombre?: string | null;
  fecha_ultima_compra?: string | null;
  estado: EstadoInsumo;
  created_at: string;
  updated_at: string;
}

export interface MockRecetaRelacional {
  insumo_id: string;
  producto_nombre: string;
}

/**
 * Cálculo del semáforo de existencias en 4 niveles según especificación técnica.
 */
export function calcularSemaforoStock(stockActual: number, stockMinimo: number): NivelSemaforoStock {
  if (stockActual <= 0) return 'agotado';
  if (stockActual <= stockMinimo) return 'critico';
  if (stockActual <= stockMinimo * 1.5) return 'reposicion';
  return 'optimo';
}

// Identificadores Canónicos de Insumos (07_seed_local_aurea_completo.sql)
export const INSUMO_PESCADO_ID = '00000000-0000-4000-8000-000000000421';
export const INSUMO_LOMO_ID = '00000000-0000-4000-8000-000000000422';
export const INSUMO_PAPA_AMARILLA_ID = '00000000-0000-4000-8000-000000000423';
export const INSUMO_ARROZ_ID = '00000000-0000-4000-8000-000000000424';
export const INSUMO_INCA_KOLA_ID = '00000000-0000-4000-8000-000000000425';
export const INSUMO_LIMON_ID = '00000000-0000-4000-8000-000000000426';

export const INSUMO_PAPA_YUNGAY_ID = '00000000-0000-4000-8000-000000000427';
export const INSUMO_ACEITE_ID = '00000000-0000-4000-8000-000000000428';
export const INSUMO_HUEVOS_ID = '00000000-0000-4000-8000-000000000429';
export const INSUMO_LECHE_ID = '00000000-0000-4000-8000-000000000430';
export const INSUMO_CERVEZA_ID = '00000000-0000-4000-8000-000000000431';
export const INSUMO_SAL_ID = '00000000-0000-4000-8000-000000000432';

export const SEMILLA_RECETAS_INSUMOS: MockRecetaRelacional[] = [
  { insumo_id: INSUMO_PESCADO_ID, producto_nombre: 'Ceviche Clásico' },
  { insumo_id: INSUMO_LOMO_ID, producto_nombre: 'Lomo Saltado Criollo' },
  { insumo_id: INSUMO_PAPA_AMARILLA_ID, producto_nombre: 'Causa Limeña de Pollo' },
  { insumo_id: INSUMO_ARROZ_ID, producto_nombre: 'Lomo Saltado Criollo' },
  { insumo_id: INSUMO_INCA_KOLA_ID, producto_nombre: 'Inca Kola 500ml' },
  { insumo_id: INSUMO_LIMON_ID, producto_nombre: 'Ceviche Clásico' },
  { insumo_id: INSUMO_PAPA_YUNGAY_ID, producto_nombre: 'Lomo Saltado Criollo' },
  { insumo_id: INSUMO_PAPA_YUNGAY_ID, producto_nombre: 'Salchipapa Clásica' },
  { insumo_id: INSUMO_ACEITE_ID, producto_nombre: 'Lomo Saltado Criollo' },
  { insumo_id: INSUMO_ACEITE_ID, producto_nombre: 'Causa Limeña de Pollo' },
  { insumo_id: INSUMO_HUEVOS_ID, producto_nombre: 'Causa Limeña de Pollo' },
  { insumo_id: INSUMO_HUEVOS_ID, producto_nombre: 'Suspiro Limeño' },
  { insumo_id: INSUMO_LECHE_ID, producto_nombre: 'Suspiro Limeño' },
  { insumo_id: INSUMO_CERVEZA_ID, producto_nombre: 'Cerveza Cusqueña Trigo' },
  { insumo_id: INSUMO_SAL_ID, producto_nombre: 'Ceviche Clásico' },
  { insumo_id: INSUMO_SAL_ID, producto_nombre: 'Lomo Saltado Criollo' },
];

export const SEMILLAS_INSUMOS_AUREA: MockInsumoRaw[] = [
  {
    id: INSUMO_PESCADO_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Pescado fresco',
    unidad_medida: 'kg',
    stock_actual: 8.5,
    stock_minimo: 5.0,
    costo_unitario: 28.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-11T09:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-11T09:00:00Z',
  },
  {
    id: INSUMO_LOMO_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Lomo fino',
    unidad_medida: 'kg',
    stock_actual: 6.0,
    stock_minimo: 3.0,
    costo_unitario: 42.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-11T09:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-11T09:00:00Z',
  },
  {
    id: INSUMO_PAPA_AMARILLA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Papa amarilla',
    unidad_medida: 'kg',
    stock_actual: 1.0,
    stock_minimo: 3.0,
    costo_unitario: 4.5,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-11T09:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-11T09:00:00Z',
  },
  {
    id: INSUMO_ARROZ_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Arroz',
    unidad_medida: 'kg',
    stock_actual: 12.0,
    stock_minimo: 4.0,
    costo_unitario: 5.8,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-10T11:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-10T11:00:00Z',
  },
  {
    id: INSUMO_INCA_KOLA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Inca Kola 500ml',
    unidad_medida: 'botella',
    stock_actual: 24.0,
    stock_minimo: 8.0,
    costo_unitario: 3.2,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000412',
    ultimo_proveedor_nombre: 'Bebidas del Pacífico S.A.C.',
    fecha_ultima_compra: '2026-10-10T10:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-10T10:00:00Z',
  },
  {
    id: INSUMO_LIMON_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Limón',
    unidad_medida: 'kg',
    stock_actual: 0.0,
    stock_minimo: 2.5,
    costo_unitario: 6.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-11T09:00:00Z',
    estado: 'agotado',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-12T07:00:00Z',
  },
  {
    id: INSUMO_PAPA_YUNGAY_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Papa Yungay',
    unidad_medida: 'saco',
    stock_actual: 8.0,
    stock_minimo: 2.0,
    costo_unitario: 85.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-08T14:30:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-08T14:30:00Z',
  },
  {
    id: INSUMO_ACEITE_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Aceite Vegetal 20L',
    unidad_medida: 'bidon',
    stock_actual: 1.5,
    stock_minimo: 2.0,
    costo_unitario: 140.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-08T14:25:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-08T14:25:00Z',
  },
  {
    id: INSUMO_HUEVOS_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Huevos de Granja',
    unidad_medida: 'jaba',
    stock_actual: 4.0,
    stock_minimo: 2.0,
    costo_unitario: 65.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-09T08:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-09T08:00:00Z',
  },
  {
    id: INSUMO_LECHE_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Leche Evaporada',
    unidad_medida: 'lata',
    stock_actual: 36.0,
    stock_minimo: 12.0,
    costo_unitario: 4.2,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000412',
    ultimo_proveedor_nombre: 'Bebidas del Pacífico S.A.C.',
    fecha_ultima_compra: '2026-10-07T15:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-07T15:00:00Z',
  },
  {
    id: INSUMO_CERVEZA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Cerveza Cusqueña Trigo',
    unidad_medida: 'caja',
    stock_actual: 6.0,
    stock_minimo: 2.0,
    costo_unitario: 72.0,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000412',
    ultimo_proveedor_nombre: 'Bebidas del Pacífico S.A.C.',
    fecha_ultima_compra: '2026-10-05T12:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-05T12:00:00Z',
  },
  {
    id: INSUMO_SAL_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Sal Marina Yodada',
    unidad_medida: 'paquete',
    stock_actual: 15.0,
    stock_minimo: 5.0,
    costo_unitario: 1.8,
    moneda: 'PEN',
    ultimo_proveedor_id: '00000000-0000-4000-8000-000000000411',
    ultimo_proveedor_nombre: 'Mercado Mayorista San Pedro',
    fecha_ultima_compra: '2026-10-02T10:00:00Z',
    estado: 'activo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
  },
];

export const SEMILLAS_AUDITORIA_INICIAL: AuditoriaStockAjusteDTO[] = [
  {
    id: 'f4b2c1d0-9e8a-7b6c-5d4e-3f2a1b0c9d8e',
    local_id: CANONICAL_LOCAL_ID,
    insumo_id: INSUMO_LIMON_ID,
    insumo_nombre: 'Limón',
    usuario_id: '00000000-0000-4000-8000-000000000102',
    usuario_nombre: 'Administrador Local',
    stock_anterior: 2.0,
    stock_nuevo: 0.0,
    diferencia: -2.0,
    motivo: 'merma_desperdicio',
    notas: 'Limón en sobremaduración descartado en turno previo.',
    created_at: '2026-10-12T07:00:00Z',
  },
];

// Estado en memoria simulado
class MockAdminService {
  private pisos: PisoAdminDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PISOS));
  private maxMesasPlan = 30; // Plan Pro
  private maxPisosPlan = 5;
  private categorias: MockCategoriaRaw[] = JSON.parse(JSON.stringify(SEMILLAS_CATEGORIAS_AUREA));
  private productos: MockProductoRelacional[] = JSON.parse(JSON.stringify(SEMILLA_PRODUCTOS_AUREA));
  private insumos: MockInsumoRaw[] = JSON.parse(JSON.stringify(SEMILLAS_INSUMOS_AUREA));
  private recetas: MockRecetaRelacional[] = JSON.parse(JSON.stringify(SEMILLA_RECETAS_INSUMOS));
  private auditoriaAjustes: AuditoriaStockAjusteDTO[] = JSON.parse(JSON.stringify(SEMILLAS_AUDITORIA_INICIAL));

  private calcularMetricasPiso(piso: PisoAdminDTO) {
    const activas = piso.mesas.filter((m) => m.estado === 'activa');
    piso.total_mesas = activas.length;
    piso.capacidad_total_personas = activas.reduce((acc, m) => acc + m.capacidad, 0);
  }

  private obtenerTotalMesasActivas(): number {
    return this.pisos.reduce((acc, p) => {
      return acc + p.mesas.filter((m) => m.estado === 'activa').length;
    }, 0);
  }

  /**
   * GET /api/v1/admin/pisos
   */
  async obtenerPlanoMesas(localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<PlanoMesasResponseDTO>> {
    // Simular latencia de red realista
    await new Promise((r) => setTimeout(r, 120));

    this.pisos.forEach((p) => this.calcularMetricasPiso(p));
    const mesasActivas = this.obtenerTotalMesasActivas();

    const response: PlanoMesasResponseDTO = {
      local_id: localId,
      local_nombre: CANONICAL_LOCAL_NOMBRE,
      cuota_mesas: {
        mesas_activas_empresa: mesasActivas,
        max_mesas_plan: this.maxMesasPlan,
        mesas_disponibles: Math.max(0, this.maxMesasPlan - mesasActivas),
        pisos_activos_empresa: this.pisos.filter((p) => p.estado === 'activo').length,
        max_pisos_plan: this.maxPisosPlan,
      },
      pisos: JSON.parse(JSON.stringify(this.pisos.filter((p) => p.estado === 'activo'))),
    };

    return {
      exito: true,
      datos: response,
      meta: {
        timestamp: new Date().toISOString(),
        total: response.pisos.length,
      },
    };
  }

  /**
   * POST /api/v1/admin/pisos/{piso_id}/mesas/lote
   */
  async generarMesasEnLote(
    pisoId: string,
    req: CrearMesaLoteRequest
  ): Promise<ApiResponse<{ piso: PisoAdminDTO; mesas_creadas: number }>> {
    await new Promise((r) => setTimeout(r, 150));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Ambiente o piso no encontrado.');
    }

    const cantidadRequerida = req.columnas * req.filas;
    const mesasActivas = this.obtenerTotalMesasActivas();
    const disponibles = this.maxMesasPlan - mesasActivas;

    if (cantidadRequerida > disponibles) {
      return {
        exito: false,
        datos: null as unknown as { piso: PisoAdminDTO; mesas_creadas: number },
        errores: [
          {
            codigo: 'ERR_CUOTA_MESAS_EXCEDIDA',
            mensaje: `La cantidad solicitada (${cantidadRequerida}) excede el límite disponible (${disponibles}) de su Plan Pro.`,
            campo: 'cantidad',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Actualizar dimensiones del piso si son mayores
    piso.columnas = Math.max(piso.columnas, req.columnas);
    piso.filas = Math.max(piso.filas, req.filas);

    // Limpiar mesas activas anteriores si se regenera el layout
    piso.mesas = piso.mesas.filter((m) => m.estado !== 'activa');

    const nuevasMesas: MesaAdminDTO[] = [];
    let correlativo = req.numero_inicio;

    for (let f = 0; f < req.filas; f++) {
      for (let c = 0; c < req.columnas; c++) {
        const numStr = correlativo < 10 ? `0${correlativo}` : `${correlativo}`;
        nuevasMesas.push({
          id: `m-lote-${Date.now()}-${f}-${c}`,
          local_id: CANONICAL_LOCAL_ID,
          piso_id: pisoId,
          numero: `${req.prefijo}${numStr}`.trim(),
          capacidad: req.capacidad,
          forma: req.forma,
          posicion_x: c,
          posicion_y: f,
          permite_union: req.permite_union,
          mesa_principal_id: null,
          estado: 'activa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tiene_pedido_activo: false,
        });
        correlativo++;
      }
    }

    piso.mesas.push(...nuevasMesas);
    this.calcularMetricasPiso(piso);

    return {
      exito: true,
      datos: {
        piso: JSON.parse(JSON.stringify(piso)),
        mesas_creadas: nuevasMesas.length,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * POST /api/v1/admin/pisos/{piso_id}/mesas
   */
  async crearMesaIndividual(
    pisoId: string,
    req: CrearMesaIndividualRequest
  ): Promise<ApiResponse<MesaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Ambiente o piso no encontrado.');
    }

    // Validar cuota
    if (this.obtenerTotalMesasActivas() >= this.maxMesasPlan) {
      return {
        exito: false,
        datos: null as unknown as MesaAdminDTO,
        errores: [
          {
            codigo: 'ERR_CUOTA_MESAS_EXCEDIDA',
            mensaje: 'Ha alcanzado el límite máximo de mesas permitido por su suscripción.',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validar unicidad de número en piso
    const duplicada = piso.mesas.find(
      (m) => m.numero.toLowerCase() === req.numero.trim().toLowerCase() && m.estado === 'activa'
    );
    if (duplicada) {
      return {
        exito: false,
        datos: null as unknown as MesaAdminDTO,
        errores: [
          {
            codigo: 'ERR_MESA_NUMERO_DUPLICADO',
            mensaje: `Ya existe una mesa con el número "${req.numero}" en este ambiente.`,
            campo: 'numero',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Ajustar dimensiones si la posición excede
    if (req.posicion_x >= piso.columnas) piso.columnas = req.posicion_x + 1;
    if (req.posicion_y >= piso.filas) piso.filas = req.posicion_y + 1;

    const nuevaMesa: MesaAdminDTO = {
      id: `m-indiv-${Date.now()}`,
      local_id: CANONICAL_LOCAL_ID,
      piso_id: pisoId,
      numero: req.numero.trim(),
      capacidad: req.capacidad,
      forma: req.forma,
      posicion_x: req.posicion_x,
      posicion_y: req.posicion_y,
      permite_union: req.permite_union,
      mesa_principal_id: null,
      estado: 'activa',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tiene_pedido_activo: false,
    };

    piso.mesas.push(nuevaMesa);
    this.calcularMetricasPiso(piso);

    return {
      exito: true,
      datos: nuevaMesa,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PUT /api/v1/admin/mesas/{id}
   */
  async actualizarMesa(
    mesaId: string,
    req: ActualizarMesaRequest
  ): Promise<ApiResponse<MesaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    for (const piso of this.pisos) {
      const index = piso.mesas.findIndex((m) => m.id === mesaId);
      if (index !== -1) {
        // Validar unicidad de número
        const otraConMismoNumero = piso.mesas.find(
          (m) =>
            m.id !== mesaId &&
            m.numero.toLowerCase() === req.numero.trim().toLowerCase() &&
            m.estado === 'activa'
        );
        if (otraConMismoNumero) {
          return {
            exito: false,
            datos: null as unknown as MesaAdminDTO,
            errores: [
              {
                codigo: 'ERR_MESA_NUMERO_DUPLICADO',
                mensaje: `El número de mesa "${req.numero}" ya está en uso en este ambiente.`,
                campo: 'numero',
              },
            ],
            meta: { timestamp: new Date().toISOString() },
          };
        }

        const mesa = piso.mesas[index];
        mesa.numero = req.numero.trim();
        mesa.capacidad = req.capacidad;
        mesa.forma = req.forma;
        mesa.posicion_x = req.posicion_x;
        mesa.posicion_y = req.posicion_y;
        mesa.permite_union = req.permite_union;
        mesa.updated_at = new Date().toISOString();

        this.calcularMetricasPiso(piso);
        return {
          exito: true,
          datos: JSON.parse(JSON.stringify(mesa)),
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    throw new Error('Mesa no encontrada.');
  }

  /**
   * PATCH /api/v1/admin/mesas/{id}/desactivar
   * Simula el Bloqueo Duro ante comanda activa (409 Conflict)
   */
  async desactivarMesa(
    mesaId: string
  ): Promise<ApiResponse<{ mensaje: string; mesa_id: string }>> {
    await new Promise((r) => setTimeout(r, 120));

    for (const piso of this.pisos) {
      const mesa = piso.mesas.find((m) => m.id === mesaId);
      if (mesa) {
        if (mesa.tiene_pedido_activo) {
          // Bloqueo Duro 409
          return {
            exito: false,
            datos: null as unknown as { mensaje: string; mesa_id: string },
            errores: [
              {
                codigo: 'ERR_MESA_CON_PEDIDOS_ACTIVOS',
                mensaje: `No se puede desactivar la Mesa ${mesa.numero} porque tiene la comanda activa ${mesa.comanda_activa_codigo || '#104'} en salón.`,
                campo: 'mesa_id',
              },
            ],
            meta: {
              timestamp: new Date().toISOString(),
            },
          };
        }

        mesa.estado = 'inactiva';
        mesa.updated_at = new Date().toISOString();
        this.calcularMetricasPiso(piso);

        return {
          exito: true,
          datos: {
            mensaje: `Mesa ${mesa.numero} desactivada exitosamente del salón.`,
            mesa_id: mesaId,
          },
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    throw new Error('Mesa no encontrada.');
  }

  /**
   * POST /api/v1/admin/pisos
   */
  async crearPiso(localId: string, req: CrearPisoRequest): Promise<ApiResponse<PisoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    if (this.pisos.length >= this.maxPisosPlan) {
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_CUOTA_PISOS_EXCEDIDA',
            mensaje: `Su plan actual permite un máximo de ${this.maxPisosPlan} ambientes.`,
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const nuevoPiso: PisoAdminDTO = {
      id: `piso-${Date.now()}`,
      local_id: localId,
      nombre: req.nombre.trim(),
      columnas: req.columnas,
      filas: req.filas,
      estado: 'activo',
      total_mesas: 0,
      capacidad_total_personas: 0,
      mesas: [],
    };

    this.pisos.push(nuevoPiso);

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(nuevoPiso)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/pisos/{id}/dimensiones
   */
  async actualizarDimensionesPiso(
    pisoId: string,
    req: ActualizarDimensionesPisoRequest
  ): Promise<ApiResponse<PisoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado.');
    }

    // Validar si hay mesas activas fuera de los nuevos límites
    const mesasEnConflicto = piso.mesas.filter(
      (m) =>
        m.estado === 'activa' &&
        (m.posicion_x >= req.columnas || m.posicion_y >= req.filas)
    );

    if (mesasEnConflicto.length > 0) {
      const nombres = mesasEnConflicto.map((m) => `Mesa ${m.numero}`).join(', ');
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_COLUMNA_CON_MESAS',
            mensaje: `No se puede recortar la cuadrícula porque contiene mesas activas: ${nombres}. Reubícalas o desactívalas primero.`,
            campo: 'dimensiones',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    piso.columnas = req.columnas;
    piso.filas = req.filas;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(piso)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/pisos/{id}/nombre
   * Renombra un ambiente físico validando unicidad en la sede.
   */
  async actualizarNombrePiso(
    pisoId: string,
    nuevoNombre: string
  ): Promise<ApiResponse<PisoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado.');
    }

    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_NOMBRE_REQUERIDO',
            mensaje: 'El nombre del ambiente no puede estar vacío.',
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validar duplicidad
    const repetido = this.pisos.some(
      (p) =>
        p.id !== pisoId &&
        p.estado === 'activo' &&
        p.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (repetido) {
      return {
        exito: false,
        datos: null as unknown as PisoAdminDTO,
        errores: [
          {
            codigo: 'ERR_NOMBRE_PISO_DUPLICADO',
            mensaje: `Ya existe un ambiente activo con el nombre "${nombreLimpio}" en esta sede.`,
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    piso.nombre = nombreLimpio;
    piso.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(piso)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * DELETE / PATCH /api/v1/admin/pisos/{id}/desactivar
   * Da de baja segura un piso validando:
   * 1. Que no sea el único piso activo del local (mínimo 1 piso).
   * 2. Que no tenga mesas activas (Bloqueo Duro 409 ERR_PISO_CON_MESAS_ACTIVAS).
   */
  async desactivarPiso(
    pisoId: string
  ): Promise<ApiResponse<{ mensaje: string; piso_id: string }>> {
    await new Promise((r) => setTimeout(r, 120));

    const piso = this.pisos.find((p) => p.id === pisoId);
    if (!piso) {
      throw new Error('Piso no encontrado.');
    }

    const pisosActivos = this.pisos.filter((p) => p.estado === 'activo');
    if (pisosActivos.length <= 1) {
      return {
        exito: false,
        datos: null as unknown as { mensaje: string; piso_id: string },
        errores: [
          {
            codigo: 'ERR_MINIMO_UN_PISO_ACTIVO',
            mensaje: 'No se puede eliminar el único ambiente de la sede. El restaurante debe contar con al menos un ambiente activo.',
            campo: 'piso_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const mesasActivas = piso.mesas.filter((m) => m.estado === 'activa');
    if (mesasActivas.length > 0) {
      const listaMesas = mesasActivas.map((m) => `Mesa ${m.numero}`).slice(0, 5).join(', ');
      const extra = mesasActivas.length > 5 ? ` y ${mesasActivas.length - 5} más` : '';
      return {
        exito: false,
        datos: null as unknown as { mensaje: string; piso_id: string },
        errores: [
          {
            codigo: 'ERR_PISO_CON_MESAS_ACTIVAS',
            mensaje: `No se puede eliminar el ambiente "${piso.nombre}" porque contiene ${mesasActivas.length} mesa(s) activa(s) (${listaMesas}${extra}). Reubica o desactiva las mesas antes de eliminar el ambiente.`,
            campo: 'piso_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    piso.estado = 'inactivo';
    piso.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: {
        mensaje: `Ambiente "${piso.nombre}" eliminado exitosamente.`,
        piso_id: pisoId,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // Métodos de simulación interactiva para DemoAdminPlanoWidget
  simularCuotaLlena() {
    this.maxMesasPlan = this.obtenerTotalMesasActivas();
  }

  restablecerCuotaOriginal() {
    this.maxMesasPlan = 30;
  }

  simularPisoVacio(pisoId: string) {
    const piso = this.pisos.find((p) => p.id === pisoId);
    if (piso) {
      piso.mesas = [];
      this.calcularMetricasPiso(piso);
    }
  }

  restablecerSemillasAurea() {
    this.pisos = JSON.parse(JSON.stringify(SEMILLAS_PISOS));
    this.maxMesasPlan = 30;
    this.maxPisosPlan = 5;
  }

  // ===========================================================================
  // MÉTODOS DE CATEGORÍAS DE LA CARTA (CU-ADMIN-02)
  // ===========================================================================

  private enriquecerCategoria(cat: MockCategoriaRaw): CategoriaAdminDTO {
    const prods = this.productos.filter((p) => p.categoria_id === cat.id);
    return {
      id: cat.id,
      local_id: cat.local_id,
      nombre: cat.nombre,
      orden: cat.orden,
      activa: cat.activa,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      total_productos: prods.length,
      productos_disponibles: prods.filter((p) => p.disponibilidad === 'disponible').length,
      productos_agotados: prods.filter((p) => p.disponibilidad === 'agotado').length,
    };
  }

  /**
   * GET /api/v1/admin/categorias
   * Retorna el listado completo de categorías ordenadas secuencialmente junto con métricas agregadas.
   */
  async obtenerCategorias(
    localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<CategoriasAdminResponseDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const categoriasLocales = this.categorias
      .filter((c) => c.local_id === localId)
      .sort((a, b) => a.orden - b.orden);

    const categoriasEnriquecidas = categoriasLocales.map((c) => this.enriquecerCategoria(c));

    const totalActivas = categoriasEnriquecidas.filter((c) => c.activa).length;
    const totalOcultas = categoriasEnriquecidas.filter((c) => !c.activa).length;
    const totalProductos = categoriasEnriquecidas.reduce((acc, c) => acc + c.total_productos, 0);

    let catConMasPlatos: { id: string; nombre: string; cantidad: number } | null = null;
    if (categoriasEnriquecidas.length > 0) {
      const topCat = [...categoriasEnriquecidas].sort((a, b) => b.total_productos - a.total_productos)[0];
      if (topCat && topCat.total_productos > 0) {
        catConMasPlatos = {
          id: topCat.id,
          nombre: topCat.nombre,
          cantidad: topCat.total_productos,
        };
      }
    }

    const response: CategoriasAdminResponseDTO = {
      local_id: localId,
      local_nombre: CANONICAL_LOCAL_NOMBRE,
      resumen: {
        total_categorias: categoriasEnriquecidas.length,
        categorias_activas: totalActivas,
        categorias_ocultas: totalOcultas,
        total_productos_asociados: totalProductos,
        categoria_con_mas_platos: catConMasPlatos,
      },
      categorias: categoriasEnriquecidas,
    };

    return {
      exito: true,
      datos: response,
      meta: {
        timestamp: new Date().toISOString(),
        total: categoriasEnriquecidas.length,
      },
    };
  }

  /**
   * POST /api/v1/admin/categorias
   * Valida nombre único no sensible a mayúsculas por local y asigna orden correlativo.
   */
  async crearCategoria(
    payload: CrearCategoriaRequest,
    localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<CategoriaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    const nombreLimpio = payload.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOMBRE_CATEGORIA_REQUERIDO',
            mensaje: 'El nombre de la categoría es obligatorio y debe tener entre 2 y 60 caracteres.',
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Unicidad por local_id + LOWER(nombre)
    const duplicada = this.categorias.some(
      (c) => c.local_id === localId && c.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (duplicada) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_DUPLICADA',
            mensaje: `Ya existe una categoría con el nombre "${nombreLimpio}" en esta sede.`,
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const categoriasLocales = this.categorias.filter((c) => c.local_id === localId);
    const siguienteOrden =
      categoriasLocales.length > 0 ? Math.max(...categoriasLocales.map((c) => c.orden)) + 1 : 1;

    const nueva: MockCategoriaRaw = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      local_id: localId,
      nombre: nombreLimpio,
      orden: siguienteOrden,
      activa: payload.activa ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.categorias.push(nueva);

    return {
      exito: true,
      datos: this.enriquecerCategoria(nueva),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PUT /api/v1/admin/categorias/{id}
   * Modifica nombre y/o visibilidad de la categoría.
   */
  async actualizarCategoria(
    id: string,
    payload: ActualizarCategoriaRequest
  ): Promise<ApiResponse<CategoriaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    const categoria = this.categorias.find((c) => c.id === id);
    if (!categoria) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_NO_ENCONTRADA',
            mensaje: 'La categoría solicitada no existe o fue eliminada previamente.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const nombreLimpio = payload.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOMBRE_CATEGORIA_REQUERIDO',
            mensaje: 'El nombre de la categoría no puede estar vacío.',
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Unicidad excluyéndose a sí misma
    const duplicada = this.categorias.some(
      (c) =>
        c.id !== id &&
        c.local_id === categoria.local_id &&
        c.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (duplicada) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_DUPLICADA',
            mensaje: `Ya existe otra categoría registrada con el nombre "${nombreLimpio}".`,
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    categoria.nombre = nombreLimpio;
    if (payload.activa !== undefined) {
      categoria.activa = payload.activa;
    }
    categoria.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: this.enriquecerCategoria(categoria),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/categorias/{id}/visibilidad
   * Conmuta rápidamente la visibilidad en salón y carta QR sin necesidad de editar el nombre.
   */
  async conmutarVisibilidadCategoria(
    id: string,
    activa: boolean
  ): Promise<ApiResponse<CategoriaAdminDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const categoria = this.categorias.find((c) => c.id === id);
    if (!categoria) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_NO_ENCONTRADA',
            mensaje: 'Categoría no encontrada.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    categoria.activa = activa;
    categoria.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: this.enriquecerCategoria(categoria),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/categorias/reordenar
   * Actualiza el orden secuencial de comanda en una sola operación atómica.
   */
  async reordenarCategorias(
    payload: ReordenarCategoriasRequest
  ): Promise<ApiResponse<CategoriaAdminDTO[]>> {
    await new Promise((r) => setTimeout(r, 120));

    for (const item of payload.categorias) {
      const cat = this.categorias.find((c) => c.id === item.id);
      if (cat) {
        cat.orden = item.orden;
        cat.updated_at = new Date().toISOString();
      }
    }

    this.categorias.sort((a, b) => a.orden - b.orden);

    const enriquecidas = this.categorias.map((c) => this.enriquecerCategoria(c));

    return {
      exito: true,
      datos: enriquecidas,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * DELETE /api/v1/admin/categorias/{id}
   * Bloqueo 409 estricto si existen platos vinculados (ON DELETE RESTRICT en PostgreSQL).
   */
  async eliminarCategoria(
    id: string
  ): Promise<ApiResponse<{ mensaje: string; categoria_id: string }>> {
    await new Promise((r) => setTimeout(r, 150));

    const categoria = this.categorias.find((c) => c.id === id);
    if (!categoria) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_NO_ENCONTRADA',
            mensaje: 'La categoría no existe o ya fue eliminada.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Consulta relacional sobre la tabla producto
    const productosAsociados = this.productos.filter((p) => p.categoria_id === id);

    if (productosAsociados.length > 0) {
      // Conflicto relacional 409
      const conflictoDetalle: ConflictoCategoriaConProductosDTO = {
        categoria_id: id,
        categoria_nombre: categoria.nombre,
        total_productos: productosAsociados.length,
        productos_muestras: productosAsociados.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: p.precio,
          disponibilidad: p.disponibilidad,
        })),
      };

      return {
        exito: false,
        datos: conflictoDetalle as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_CON_PRODUCTOS',
            mensaje: `No se puede eliminar la categoría "${categoria.nombre}" porque contiene ${productosAsociados.length} plato(s) asociado(s). Reasigna los platos a otra categoría o vacía su contenido antes de continuar.`,
            campo: 'categoria_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Si tiene 0 productos, eliminación exitosa
    this.categorias = this.categorias.filter((c) => c.id !== id);

    // Reindexar orden correlativo
    this.categorias
      .filter((c) => c.local_id === categoria.local_id)
      .sort((a, b) => a.orden - b.orden)
      .forEach((c, idx) => {
        c.orden = idx + 1;
      });

    return {
      exito: true,
      datos: {
        mensaje: `La categoría "${categoria.nombre}" fue eliminada exitosamente.`,
        categoria_id: id,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * POST /api/v1/admin/categorias/{id}/reasignar-y-eliminar
   * Permite reasignación parcial o total de platos.
   * Si quedan 0 platos en la categoría de origen, la elimina automáticamente.
   */
  async reasignarYEliminarCategoria(
    id: string,
    payload: ReasignarYEliminarCategoriaRequest
  ): Promise<ApiResponse<ResultadoReasignacionCategoriaDTO>> {
    await new Promise((r) => setTimeout(r, 200));

    const catOrigen = this.categorias.find((c) => c.id === id);
    if (!catOrigen) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_NO_ENCONTRADA',
            mensaje: 'Categoría de origen no encontrada.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    if (id === payload.nueva_categoria_id) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_DESTINO_INVALIDA',
            mensaje: 'La categoría de destino debe ser diferente a la categoría que se desea eliminar.',
            campo: 'nueva_categoria_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const catDestino = this.categorias.find((c) => c.id === payload.nueva_categoria_id);
    if (!catDestino) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_DESTINO_NO_ENCONTRADA',
            mensaje: 'La categoría de destino seleccionada no existe.',
            campo: 'nueva_categoria_id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Filtrar los platos que se van a reasignar (parcial o total)
    const productosMover = this.productos.filter((p) => {
      if (p.categoria_id !== id) return false;
      if (!payload.producto_ids || payload.producto_ids.length === 0) return true;
      return payload.producto_ids.includes(p.id);
    });

    const countMovidos = productosMover.length;
    productosMover.forEach((p) => {
      p.categoria_id = payload.nueva_categoria_id;
    });

    // Calcular cuántos platos aún quedan asociados a la categoría de origen
    const platosRestantes = this.productos.filter((p) => p.categoria_id === id).length;
    const categoriaEliminada = platosRestantes === 0;

    if (categoriaEliminada) {
      // Eliminación definitiva de la categoría de origen
      this.categorias = this.categorias.filter((c) => c.id !== id);

      // Reindexar orden correlativo
      this.categorias
        .filter((c) => c.local_id === catOrigen.local_id)
        .sort((a, b) => a.orden - b.orden)
        .forEach((c, idx) => {
          c.orden = idx + 1;
        });
    }

    return {
      exito: true,
      datos: {
        mensaje: categoriaEliminada
          ? `Se reasignaron ${countMovidos} plato(s) a "${catDestino.nombre}" y la categoría "${catOrigen.nombre}" fue eliminada exitosamente.`
          : `Se transfirieron ${countMovidos} plato(s) a "${catDestino.nombre}". Quedan ${platosRestantes} plato(s) pendientes de reasignar.`,
        categoria_id: id,
        platos_reasignados: countMovidos,
        platos_restantes: platosRestantes,
        categoria_eliminada: categoriaEliminada,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * POST /api/v1/admin/categorias/plantilla
   * Carga una estructura gastronómica sugerida (pollería, cevichería, chifa, etc.).
   */
  async cargarPlantillaGastronomica(
    payload: CargarPlantillaCategoriasRequest,
    localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<CategoriasAdminResponseDTO>> {
    await new Promise((r) => setTimeout(r, 200));

    const configPlantilla = PLANTILLAS_GASTRONOMICAS[payload.tipo_plantilla];
    if (!configPlantilla) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_TIPO_PLANTILLA_INVALIDO',
            mensaje: `El tipo de plantilla "${payload.tipo_plantilla}" no es reconocido.`,
            campo: 'tipo_plantilla',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    if (payload.reemplazar_existentes) {
      const nuevasCategorias: MockCategoriaRaw[] = configPlantilla.categorias.map((nombre, idx) => ({
        id: `tpl-${payload.tipo_plantilla}-${idx + 1}`,
        local_id: localId,
        nombre,
        orden: idx + 1,
        activa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Si había productos existentes, reasignarlos a la primera categoría nueva para preservar integridad
      if (nuevasCategorias.length > 0 && this.productos.length > 0) {
        const primeraCatId = nuevasCategorias[0].id;
        this.productos.forEach((p) => {
          if (p.local_id === localId) {
            p.categoria_id = primeraCatId;
          }
        });
      }

      this.categorias = nuevasCategorias;
    } else {
      // Anexar sin duplicar nombres
      const categoriasActuales = this.categorias.filter((c) => c.local_id === localId);
      let maxOrden =
        categoriasActuales.length > 0 ? Math.max(...categoriasActuales.map((c) => c.orden)) : 0;

      for (const nombre of configPlantilla.categorias) {
        const existe = this.categorias.some(
          (c) => c.local_id === localId && c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
        );
        if (!existe) {
          maxOrden += 1;
          this.categorias.push({
            id: `cat-extra-${Date.now()}-${maxOrden}`,
            local_id: localId,
            nombre,
            orden: maxOrden,
            activa: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    return this.obtenerCategorias(localId);
  }

  // Métodos de simulación interactiva para DemoAdminCategoriasWidget
  simularCategoriasVacias(localId: string = CANONICAL_LOCAL_ID) {
    this.categorias = this.categorias.filter((c) => c.local_id !== localId);
  }

  restablecerCategoriasAurea() {
    this.categorias = JSON.parse(JSON.stringify(SEMILLAS_CATEGORIAS_AUREA));
    this.productos = JSON.parse(JSON.stringify(SEMILLA_PRODUCTOS_AUREA));
  }

  // ===========================================================================
  // MÉTODOS DE CATÁLOGO DE INSUMOS DE INVENTARIO (CU-ADMIN-03)
  // ===========================================================================

  private enriquecerInsumo(ins: MockInsumoRaw): InsumoAdminDTO {
    const recetas = this.recetas.filter((r) => r.insumo_id === ins.id);
    const platos = recetas.map((r) => r.producto_nombre);
    return {
      id: ins.id,
      local_id: ins.local_id,
      nombre: ins.nombre,
      unidad_medida: ins.unidad_medida,
      stock_actual: ins.stock_actual,
      stock_minimo: ins.stock_minimo,
      nivel_semaforo: calcularSemaforoStock(ins.stock_actual, ins.stock_minimo),
      costo_unitario: ins.costo_unitario,
      moneda: ins.moneda,
      ultimo_proveedor_id: ins.ultimo_proveedor_id,
      ultimo_proveedor_nombre: ins.ultimo_proveedor_nombre,
      fecha_ultima_compra: ins.fecha_ultima_compra,
      estado: ins.estado,
      platos_afectados_si_quiebra: platos.length,
      platos_detalle: platos,
      created_at: ins.created_at,
      updated_at: ins.updated_at,
    };
  }

  /**
   * GET /api/v1/admin/insumos
   * Retorna lista de insumos del local con filtros por estado y búsqueda por texto.
   * Filtro por defecto en 'activo'.
   */
  async obtenerInsumos(
    localId: string = CANONICAL_LOCAL_ID,
    filtroEstado: 'activo' | 'agotado' | 'inactivo' | 'todos' = 'activo',
    busqueda: string = '',
    pagina: number = 1,
    limite: number = 10
  ): Promise<ApiResponse<InsumosAdminResponseDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const insumosLocal = this.insumos.filter((i) => i.local_id === localId);

    // Métricas globales de KPIs para la cabecera
    const totalActivos = insumosLocal.filter((i) => i.estado === 'activo').length;
    const totalAgotados = insumosLocal.filter((i) => i.estado === 'agotado').length;
    const totalInactivos = insumosLocal.filter((i) => i.estado === 'inactivo').length;
    const valorizacionTotal = insumosLocal
      .filter((i) => i.estado === 'activo')
      .reduce((acc, i) => acc + i.stock_actual * i.costo_unitario, 0);

    // Filtrado por estado
    let filtrados = insumosLocal;
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter((i) => i.estado === filtroEstado);
    }

    // Filtrado por búsqueda de texto
    const qLimpio = busqueda.trim().toLowerCase();
    if (qLimpio.length > 0) {
      filtrados = filtrados.filter((i) => i.nombre.toLowerCase().includes(qLimpio));
    }

    // Ordenar alfabéticamente por nombre
    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Paginación
    const totalItems = filtrados.length;
    const totalPaginas = Math.max(1, Math.ceil(totalItems / limite));
    const offset = (pagina - 1) * limite;
    const paginados = filtrados.slice(offset, offset + limite);

    const insumosEnriquecidos = paginados.map((i) => this.enriquecerInsumo(i));

    const payload: InsumosAdminResponseDTO = {
      local_id: localId,
      local_nombre: CANONICAL_LOCAL_NOMBRE,
      kpis: {
        total_activos: totalActivos,
        total_agotados: totalAgotados,
        total_inactivos: totalInactivos,
        valorizacion_total: Math.round(valorizacionTotal * 100) / 100,
      },
      filtro_actual: filtroEstado,
      insumos: insumosEnriquecidos,
      paginacion: {
        total: totalItems,
        pagina,
        limite,
        total_paginas: totalPaginas,
      },
    };

    return {
      exito: true,
      datos: payload,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * POST /api/v1/admin/insumos
   * Alta rápida de insumo (< 8 segundos).
   * Valida catálogo cerrado de 10 unidades y unicidad de nombre en la sede (409 Conflict).
   */
  async crearInsumo(
    localId: string = CANONICAL_LOCAL_ID,
    req: CrearInsumoRequest
  ): Promise<ApiResponse<InsumoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const nombreLimpio = req.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_VALIDACION',
            mensaje: 'El nombre comercial del insumo es obligatorio.',
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validación de catálogo cerrado de 10 unidades universales
    const unidadesValidas: UnidadInsumo[] = [
      'kg', 'L', 'und', 'saco', 'botella', 'lata', 'caja', 'paquete', 'bidon', 'jaba',
    ];
    if (!unidadesValidas.includes(req.unidad_medida)) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_UNIDAD_NO_PERMITIDA',
            mensaje: `La unidad "${req.unidad_medida}" no es válida. Debe pertenecer al catálogo cerrado de 10 unidades de almacén.`,
            campo: 'unidad_medida',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Validación de unicidad de nombre en la sede (UNIQUE uq_insumo_local_nombre)
    const duplicado = this.insumos.some(
      (i) => i.local_id === localId && i.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );
    if (duplicado) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_INSUMO_DUPLICADO',
            mensaje: `Ya existe un insumo registrado con el nombre "${nombreLimpio}" en esta sede.`,
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const estadoInicial: EstadoInsumo = req.stock_actual === 0 ? 'agotado' : (req.estado || 'activo');

    const nuevoInsumo: MockInsumoRaw = {
      id: `ins-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      local_id: localId,
      nombre: nombreLimpio,
      unidad_medida: req.unidad_medida,
      stock_actual: Math.max(0, req.stock_actual),
      stock_minimo: Math.max(0, req.stock_minimo),
      costo_unitario: Math.max(0, req.costo_unitario),
      moneda: 'PEN',
      ultimo_proveedor_id: null,
      ultimo_proveedor_nombre: 'Sin compra registrada',
      fecha_ultima_compra: null,
      estado: estadoInicial,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.insumos.push(nuevoInsumo);

    return {
      exito: true,
      datos: this.enriquecerInsumo(nuevoInsumo),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PUT /api/v1/admin/insumos/{id}
   * Actualiza datos maestros de insumo (nombre, unidad, stock mínimo, costo).
   */
  async actualizarInsumo(
    id: string,
    req: ActualizarInsumoRequest
  ): Promise<ApiResponse<InsumoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const insumo = this.insumos.find((i) => i.id === id);
    if (!insumo) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_INSUMO_NO_ENCONTRADO',
            mensaje: 'El insumo especificado no existe o fue retirado.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const nombreLimpio = req.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_VALIDACION',
            mensaje: 'El nombre comercial no puede estar vacío.',
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Verificar nombre duplicado con otro insumo
    const duplicado = this.insumos.some(
      (i) => i.id !== id && i.local_id === insumo.local_id && i.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );
    if (duplicado) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_INSUMO_DUPLICADO',
            mensaje: `Ya existe otro insumo con el nombre "${nombreLimpio}" en esta sede.`,
            campo: 'nombre',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    insumo.nombre = nombreLimpio;
    insumo.unidad_medida = req.unidad_medida;
    insumo.stock_minimo = Math.max(0, req.stock_minimo);
    insumo.costo_unitario = Math.max(0, req.costo_unitario);
    insumo.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: this.enriquecerInsumo(insumo),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/insumos/{id}/ajuste-stock
   * Ajuste físico de stock con auditoría obligatoria en auditoria_stock_ajuste y sincronización
   * atómica con cocina y salón (CU-COCINA-04 <-> CU-MOZO-01).
   */
  async ajustarStockInsumo(
    id: string,
    req: AjustarStockInsumoRequest,
    usuarioId: string = '00000000-0000-4000-8000-000000000102',
    usuarioNombre: string = 'Administrador Local'
  ): Promise<ApiResponse<AjusteStockResultDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    const insumo = this.insumos.find((i) => i.id === id);
    if (!insumo) {
      return {
        exito: false,
        datos: null as unknown as AjusteStockResultDTO,
        errores: [
          {
            codigo: 'ERR_INSUMO_NO_ENCONTRADO',
            mensaje: 'El insumo especificado no fue encontrado.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    // Motivo auditable obligatorio
    const motivosPermitidos: MotivoAjusteStock[] = [
      'conteo_fisico_inventario',
      'merma_desperdicio',
      'ingreso_manual',
      'vencimiento_caducidad',
      'rotura_accidente',
      'inconsistencia_cocina',
    ];
    if (!req.motivo || !motivosPermitidos.includes(req.motivo)) {
      return {
        exito: false,
        datos: null as unknown as AjusteStockResultDTO,
        errores: [
          {
            codigo: 'ERR_VALIDACION',
            mensaje: 'El motivo del ajuste debe pertenecer a la lista de motivos auditables válidos.',
            campo: 'motivo',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const stockAnterior = insumo.stock_actual;
    const stockNuevo = Math.max(0, req.stock_fisico);
    const diferencia = Math.round((stockNuevo - stockAnterior) * 1000) / 1000;

    // Actualizar existencias del insumo
    insumo.stock_actual = stockNuevo;
    insumo.updated_at = new Date().toISOString();

    // Estado resultante
    let estadoResultante: EstadoInsumo = insumo.estado;
    const platosBloqueados: Array<{ id: string; nombre: string }> = [];
    const pedidosEnColaObservados: Array<{
      pedido_id: string;
      mesa: string;
      producto: string;
      mozo_id: string;
      alerta_emitida: boolean;
    }> = [];

    if (stockNuevo === 0) {
      // Quiebre operativo: Se marca como agotado
      insumo.estado = 'agotado';
      estadoResultante = 'agotado';

      // Identificar platos de la carta dependientes de este insumo
      const recetas = this.recetas.filter((r) => r.insumo_id === insumo.id);
      for (const rec of recetas) {
        platosBloqueados.push({
          id: `prod-rec-${rec.producto_nombre.toLowerCase().replace(/\s+/g, '-')}`,
          nombre: rec.producto_nombre,
        });

        // Simular comanda en cola en cocina si corresponde
        if (rec.producto_nombre === 'Lomo Saltado Criollo' || rec.producto_nombre === 'Ceviche Clásico') {
          pedidosEnColaObservados.push({
            pedido_id: 'ped-881',
            mesa: 'Mesa 04',
            producto: rec.producto_nombre,
            mozo_id: 'usr-12',
            alerta_emitida: true,
          });
        }
      }
    } else if (insumo.estado === 'agotado' && stockNuevo > 0) {
      // Reposición operativa: Vuelve a estado activo
      insumo.estado = 'activo';
      estadoResultante = 'activo';
    }

    // Registrar en tabla de auditoría
    const auditoriaId = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nuevoRegistroAuditoria: AuditoriaStockAjusteDTO = {
      id: auditoriaId,
      local_id: insumo.local_id,
      insumo_id: insumo.id,
      insumo_nombre: insumo.nombre,
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      diferencia,
      motivo: req.motivo,
      notas: req.notas?.trim() || null,
      created_at: new Date().toISOString(),
    };
    this.auditoriaAjustes.unshift(nuevoRegistroAuditoria);

    let mensaje = `Ajuste de stock registrado para "${insumo.nombre}". Nuevo stock: ${stockNuevo} ${insumo.unidad_medida}.`;
    if (stockNuevo === 0) {
      mensaje = `Ajuste aplicado. Insumo "${insumo.nombre}" en estado AGOTADO. ${platosBloqueados.length} platos bloqueados en carta y alertas emitidas a mozos y KDS.`;
    } else if (stockAnterior === 0 && stockNuevo > 0) {
      mensaje = `Insumo "${insumo.nombre}" reabastecido (${stockNuevo} ${insumo.unidad_medida}) y reactivado en inventario.`;
    }

    return {
      exito: true,
      datos: {
        insumo_id: insumo.id,
        nombre: insumo.nombre,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        diferencia,
        estado_resultante: estadoResultante,
        auditoria_id: auditoriaId,
        platos_bloqueados_en_carta: platosBloqueados,
        pedidos_en_cola_observados: pedidosEnColaObservados,
        mensaje,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/insumos/{id}/estado
   * Conmuta el estado operativo del insumo (activo <-> inactivo).
   */
  async conmutarEstadoInsumo(
    id: string,
    req: ConmutarEstadoInsumoRequest
  ): Promise<ApiResponse<InsumoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const insumo = this.insumos.find((i) => i.id === id);
    if (!insumo) {
      return {
        exito: false,
        datos: null as unknown as InsumoAdminDTO,
        errores: [
          {
            codigo: 'ERR_INSUMO_NO_ENCONTRADO',
            mensaje: 'El insumo no existe.',
            campo: 'id',
          },
        ],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    insumo.estado = req.estado;
    insumo.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: this.enriquecerInsumo(insumo),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * GET /api/v1/admin/insumos/auditoria
   * Retorna el histórico de ajustes y mermas registradas.
   */
  async obtenerAuditoriaAjustes(
    insumoId?: string
  ): Promise<ApiResponse<AuditoriaStockAjusteDTO[]>> {
    await new Promise((r) => setTimeout(r, 100));

    let auditorias = this.auditoriaAjustes;
    if (insumoId) {
      auditorias = auditorias.filter((a) => a.insumo_id === insumoId);
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(auditorias)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // Métodos de simulación interactiva para DemoAdminInsumosWidget
  simularQuiebreInsumo(id: string = INSUMO_LIMON_ID) {
    const insumo = this.insumos.find((i) => i.id === id);
    if (insumo) {
      insumo.stock_actual = 0;
      insumo.estado = 'agotado';
      insumo.updated_at = new Date().toISOString();
    }
  }

  simularReposicionInsumo(id: string = INSUMO_LIMON_ID, nuevoStock: number = 8.0) {
    const insumo = this.insumos.find((i) => i.id === id);
    if (insumo) {
      insumo.stock_actual = nuevoStock;
      insumo.estado = 'activo';
      insumo.updated_at = new Date().toISOString();
    }
  }

  simularInsumosVacios(localId: string = CANONICAL_LOCAL_ID) {
    this.insumos = this.insumos.filter((i) => i.local_id !== localId);
  }

  restablecerInsumosAurea() {
    this.insumos = JSON.parse(JSON.stringify(SEMILLAS_INSUMOS_AUREA));
    this.recetas = JSON.parse(JSON.stringify(SEMILLA_RECETAS_INSUMOS));
    this.auditoriaAjustes = JSON.parse(JSON.stringify(SEMILLAS_AUDITORIA_INICIAL));
  }
}

export const mockAdminService = new MockAdminService();

