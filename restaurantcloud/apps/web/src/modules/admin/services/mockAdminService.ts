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
  ModoCalculoReceta,
  DisponibilidadProducto,
  MotivoAgotado,
  ItemRecetaDTO,
  ProductoAdminDTO,
  ListarProductosResponseDTO,
  CrearProductoRequest,
  ActualizarRecetaRequest,
  DetalleCapacidadInsumo,
  SimulacionCapacidadDTO,
  InsumoHabitualDTO,
  ProveedorResumenDTO,
  ProveedoresKPIsDTO,
  ProveedoresListDTO,
  CrearProveedorRequestDTO,
  ActualizarProveedorRequestDTO,
  FichaCompraHistorialDTO,
  ProveedorHistorialComprasDTO,
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

export const PROD_CEVICHE_ID = '00000000-0000-4000-8000-000000000080';
export const PROD_LOMO_ID = '00000000-0000-4000-8000-000000000081';
export const PROD_INCA_KOLA_ID = '00000000-0000-4000-8000-000000000082';
export const PROD_SUSPIRO_ID = '00000000-0000-4000-8000-000000000083';
export const PROD_CAUSA_ID = '00000000-0000-4000-8000-000000000084';
export const PROD_SALCHIPAPA_ID = '00000000-0000-4000-8000-000000000085';
export const PROD_POLLO_BRASA_ID = '00000000-0000-4000-8000-000000000086';
export const PROD_CHICHA_ID = '00000000-0000-4000-8000-000000000087';

export interface MockProductoRelacional {
  id: string;
  local_id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo_estandar: number;
  moneda: string;
  foto_url?: string | null;
  disponibilidad: 'disponible' | 'agotado';
  motivo_agotado?: MotivoAgotado | null;
  requiere_preparacion: boolean;
  activo: boolean;
  es_combo: boolean;
  created_at: string;
  updated_at: string;
}

const SEMILLA_PRODUCTOS_AUREA: MockProductoRelacional[] = [
  {
    id: PROD_CEVICHE_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_ENTRADAS_ID,
    nombre: 'Ceviche Clásico',
    descripcion: 'Pescado fresco del día en leche de tigre de rocoto, choclo cusqueño y camote glaseado.',
    precio: 38.0,
    costo_estandar: 15.2,
    moneda: 'PEN',
    foto_url: 'catalogo/aurea/ceviche-clasico.jpg',
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: true,
    activo: true,
    es_combo: false,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    id: PROD_LOMO_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_FONDOS_ID,
    nombre: 'Lomo Saltado Criollo',
    descripcion: 'Lomo fino vacuno salteado al wok con cebolla roja, tomate, arroz con choclo y papas crocantes.',
    precio: 42.0,
    costo_estandar: 18.3,
    moneda: 'PEN',
    foto_url: 'catalogo/aurea/lomo-saltado.jpg',
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: true,
    activo: true,
    es_combo: false,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    id: PROD_INCA_KOLA_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_BEBIDAS_ID,
    nombre: 'Inca Kola 500ml',
    descripcion: 'Gaseosa peruana bien helada servida en mesa con hielo y rodaja de limón opcional.',
    precio: 9.0,
    costo_estandar: 3.2,
    moneda: 'PEN',
    foto_url: 'catalogo/aurea/inca-kola-500.jpg',
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: false, // Despacho directo mozo / salón
    activo: true,
    es_combo: false,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    id: PROD_SUSPIRO_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_POSTRES_ID,
    nombre: 'Suspiro Limeño',
    descripcion: 'Dulce tradicional de manjarblanco casero coronado con merengue al oporto y canela molida.',
    precio: 18.0,
    costo_estandar: 5.5,
    moneda: 'PEN',
    foto_url: 'catalogo/aurea/suspiro.jpg',
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: false, // Vitrina fría directa
    activo: true,
    es_combo: false,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    id: PROD_CAUSA_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_ENTRADAS_ID,
    nombre: 'Causa Limeña de Pollo',
    descripcion: 'Masa de papa amarilla prensada con ají amarillo y limón, rellena de pechuga deshilachada y palta fuerte.',
    precio: 24.0,
    costo_estandar: 9.8,
    moneda: 'PEN',
    foto_url: 'catalogo/aurea/causa-limena.jpg',
    disponibilidad: 'agotado', // Semilla en quiebre por limón
    motivo_agotado: 'quiebre_stock_receta',
    requiere_preparacion: true,
    activo: true,
    es_combo: false,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-11T14:00:00Z',
  },
  {
    id: PROD_SALCHIPAPA_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_ENTRADAS_ID,
    nombre: 'Salchipapa Clásica',
    descripcion: 'Papas fritas crocantes con salchicha Frankfurt premium y variedad de cremas de la casa.',
    precio: 18.0,
    costo_estandar: 5.2,
    moneda: 'PEN',
    foto_url: null,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: true,
    activo: true,
    es_combo: false,
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    id: PROD_POLLO_BRASA_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_FONDOS_ID,
    nombre: '1/4 Pollo a la Brasa',
    descripcion: 'Tradicional cuarto de pollo marinado con especias peruanas, papas fritas y ensalada clásica.',
    precio: 26.0,
    costo_estandar: 6.8,
    moneda: 'PEN',
    foto_url: null,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: true,
    activo: true,
    es_combo: false,
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
  },
  {
    id: PROD_CHICHA_ID,
    local_id: CANONICAL_LOCAL_ID,
    categoria_id: CATEGORIA_BEBIDAS_ID,
    nombre: 'Jarra de Chicha Morada 1L',
    descripcion: 'Bebida artesanal hervida con maíz morado, piña, manzana, canela y clavo de olor.',
    precio: 14.0,
    costo_estandar: 3.5,
    moneda: 'PEN',
    foto_url: null,
    disponibilidad: 'disponible',
    motivo_agotado: null,
    requiere_preparacion: false, // Jarra directa de barra
    activo: true,
    es_combo: false,
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-10T12:00:00Z',
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

/**
 * Ficha técnica relacional del motor dual de recetas (02_schema_ddl.sql: producto_insumo)
 */
export interface MockProductoInsumoDetalle {
  producto_id: string;
  insumo_id: string;
  modo_calculo: ModoCalculoReceta;
  rendimiento_platos?: number | null;
  cantidad_descuenta: number;
}

export const SEMILLAS_RECETAS_DETALLADAS: MockProductoInsumoDetalle[] = [
  // 1. Ceviche Clásico (S/ 38.00)
  {
    producto_id: PROD_CEVICHE_ID,
    insumo_id: INSUMO_PESCADO_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.25, // 0.25 kg * S/ 28 = S/ 7.00
  },
  {
    producto_id: PROD_CEVICHE_ID,
    insumo_id: INSUMO_LIMON_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.10, // 0.10 kg * S/ 6 = S/ 0.60
  },
  {
    producto_id: PROD_CEVICHE_ID,
    insumo_id: INSUMO_SAL_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 500, // 1 kg / 500 = 0.002 kg * S/ 2.50 = S/ 0.005
    cantidad_descuenta: 0.002,
  },

  // 2. Lomo Saltado Criollo (S/ 42.00)
  {
    producto_id: PROD_LOMO_ID,
    insumo_id: INSUMO_LOMO_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.25, // 0.25 kg * S/ 42 = S/ 10.50
  },
  {
    producto_id: PROD_LOMO_ID,
    insumo_id: INSUMO_PAPA_YUNGAY_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 140, // 1 saco rinde 140 pl -> 0.00714 saco * S/ 85 = S/ 0.61
    cantidad_descuenta: 0.00714,
  },
  {
    producto_id: PROD_LOMO_ID,
    insumo_id: INSUMO_ARROZ_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.15, // 0.15 kg * S/ 5.80 = S/ 0.87
  },
  {
    producto_id: PROD_LOMO_ID,
    insumo_id: INSUMO_ACEITE_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 500, // 1 bidon rinde 500 pl -> 0.002 bidon * S/ 140 = S/ 0.28
    cantidad_descuenta: 0.002,
  },
  {
    producto_id: PROD_LOMO_ID,
    insumo_id: INSUMO_SAL_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 500,
    cantidad_descuenta: 0.002,
  },

  // 3. Inca Kola 500ml (S/ 9.00) - Despacho directo
  {
    producto_id: PROD_INCA_KOLA_ID,
    insumo_id: INSUMO_INCA_KOLA_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 1.0, // 1 botella * S/ 3.20 = S/ 3.20
  },

  // 4. Suspiro Limeño (S/ 18.00) - Vitrina directa
  {
    producto_id: PROD_SUSPIRO_ID,
    insumo_id: INSUMO_LECHE_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.5, // 0.5 tarro * S/ 4.50 = S/ 2.25
  },
  {
    producto_id: PROD_SUSPIRO_ID,
    insumo_id: INSUMO_HUEVOS_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 2.0, // 2 huevos * S/ 0.80 = S/ 1.60
  },

  // 5. Causa Limeña de Pollo (S/ 24.00) - Quiebre por Limón
  {
    producto_id: PROD_CAUSA_ID,
    insumo_id: INSUMO_PAPA_AMARILLA_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.30, // 0.30 kg * S/ 4.50 = S/ 1.35
  },
  {
    producto_id: PROD_CAUSA_ID,
    insumo_id: INSUMO_LIMON_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.05, // 0.05 kg * S/ 6 = S/ 0.30
  },
  {
    producto_id: PROD_CAUSA_ID,
    insumo_id: INSUMO_ACEITE_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 500,
    cantidad_descuenta: 0.002,
  },
  {
    producto_id: PROD_CAUSA_ID,
    insumo_id: INSUMO_HUEVOS_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 1.0,
  },

  // 6. Salchipapa Clásica (S/ 18.00)
  {
    producto_id: PROD_SALCHIPAPA_ID,
    insumo_id: INSUMO_PAPA_YUNGAY_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 120,
    cantidad_descuenta: 0.00833,
  },
  {
    producto_id: PROD_SALCHIPAPA_ID,
    insumo_id: INSUMO_ACEITE_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 400,
    cantidad_descuenta: 0.0025,
  },

  // 7. 1/4 Pollo a la Brasa (S/ 26.00)
  {
    producto_id: PROD_POLLO_BRASA_ID,
    insumo_id: INSUMO_PAPA_YUNGAY_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 100,
    cantidad_descuenta: 0.01,
  },
  {
    producto_id: PROD_POLLO_BRASA_ID,
    insumo_id: INSUMO_ACEITE_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 300,
    cantidad_descuenta: 0.00333,
  },
  {
    producto_id: PROD_POLLO_BRASA_ID,
    insumo_id: INSUMO_SAL_ID,
    modo_calculo: 'rendimiento',
    rendimiento_platos: 300,
    cantidad_descuenta: 0.00333,
  },

  // 8. Jarra Chicha Morada 1L (S/ 14.00)
  {
    producto_id: PROD_CHICHA_ID,
    insumo_id: INSUMO_LIMON_ID,
    modo_calculo: 'exacto',
    rendimiento_platos: null,
    cantidad_descuenta: 0.15,
  },
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

// ============================================================================
// Semillas de Proveedores Comerciales (CU-ADMIN-05)
// ============================================================================
export const PROV_SAN_FERNANDO_ID = 'e8a93e32-23c4-4d80-87ba-15103faec121';
export const PROV_VERDURAS_SAN_MARTIN_ID = 'e8a93e32-23c4-4d80-87ba-15103faec122';
export const PROV_MOLINOS_CENTRO_ID = 'e8a93e32-23c4-4d80-87ba-15103faec123';
export const PROV_SAN_PEDRO_ID = '00000000-0000-4000-8000-000000000411';
export const PROV_LACTEOS_DON_PEPE_ID = 'e8a93e32-23c4-4d80-87ba-15103faec125';
export const PROV_PACIFICO_ID = '00000000-0000-4000-8000-000000000412';
export const PROV_GAS_DEL_SUR_ID = 'e8a93e32-23c4-4d80-87ba-15103faec127';
export const PROV_ENVASES_SAN_JUAN_ID = 'e8a93e32-23c4-4d80-87ba-15103faec128';
export const PROV_AVICOLA_CHALAN_ID = 'e8a93e32-23c4-4d80-87ba-15103faec129';
export const PROV_FRUTAS_JUANA_ID = 'e8a93e32-23c4-4d80-87ba-15103faec130';
export const PROV_TRANSPORTES_RAPIDOS_ID = 'e8a93e32-23c4-4d80-87ba-15103faec131';

const SEMILLAS_PROVEEDORES_AUREA: ProveedorResumenDTO[] = [
  {
    id: PROV_SAN_FERNANDO_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Distribuidora San Fernando',
    contacto: 'Carlos Meneses',
    telefono: '+51 987 654 321',
    email: 'ventas@sanfernando.pe',
    direccion: 'Av. República de Panamá 4200, Surquillo',
    activo: true,
    insumos_habituales: [
      { insumo_id: INSUMO_LOMO_ID, nombre: 'Lomo fino', unidad_medida: 'kg', ultimo_precio: 42.0 },
      { insumo_id: INSUMO_HUEVOS_ID, nombre: 'Huevos de gallina', unidad_medida: 'jaba', ultimo_precio: 70.0 },
    ],
    total_compras: 14,
    total_gastado: 38420.0,
    ultima_compra_fecha: '2026-10-06T11:30:00Z',
    ultima_compra_total: 2450.0,
    created_at: '2026-08-15T09:00:00Z',
  },
  {
    id: PROV_VERDURAS_SAN_MARTIN_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Verduras San Martín',
    contacto: 'Rosa Huamán',
    telefono: '+51 976 543 210',
    email: 'pedidos@verdurasanmar.pe',
    direccion: 'Mdo. Mayorista Santa Anita Pab. B Puesto 22',
    activo: true,
    insumos_habituales: [
      { insumo_id: INSUMO_PAPA_AMARILLA_ID, nombre: 'Papa amarilla', unidad_medida: 'kg', ultimo_precio: 3.5 },
      { insumo_id: INSUMO_PAPA_YUNGAY_ID, nombre: 'Papa Yungay', unidad_medida: 'saco', ultimo_precio: 70.0 },
      { insumo_id: INSUMO_LIMON_ID, nombre: 'Limón sutil', unidad_medida: 'kg', ultimo_precio: 7.0 },
    ],
    total_compras: 19,
    total_gastado: 12680.0,
    ultima_compra_fecha: '2026-10-07T08:15:00Z',
    ultima_compra_total: 840.0,
    created_at: '2026-08-18T10:00:00Z',
  },
  {
    id: PROV_MOLINOS_CENTRO_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Molinos del Centro S.A.C.',
    contacto: 'Ing. Jorge Soto',
    telefono: '+51 954 321 098',
    email: 'ventas@molinoscentro.pe',
    direccion: 'Carretera Central Km 8.5, Ate',
    activo: true,
    insumos_habituales: [
      { insumo_id: INSUMO_ARROZ_ID, nombre: 'Arroz extra', unidad_medida: 'kg', ultimo_precio: 3.8 },
      { insumo_id: INSUMO_ACEITE_ID, nombre: 'Aceite vegetal', unidad_medida: 'bidon', ultimo_precio: 130.0 },
      { insumo_id: INSUMO_SAL_ID, nombre: 'Sal de mesa', unidad_medida: 'kg', ultimo_precio: 1.2 },
    ],
    total_compras: 8,
    total_gastado: 15360.0,
    ultima_compra_fecha: '2026-10-01T14:00:00Z',
    ultima_compra_total: 1920.0,
    created_at: '2026-08-20T11:00:00Z',
  },
  {
    id: PROV_SAN_PEDRO_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Mercado Mayorista San Pedro',
    contacto: 'Ana Torres',
    telefono: '+51 900 100 411',
    email: 'ventas@sanpedro.local',
    direccion: 'Mercado San Pedro, Puesto 12, Lima',
    activo: true,
    insumos_habituales: [
      { insumo_id: INSUMO_PESCADO_ID, nombre: 'Pescado fresco', unidad_medida: 'kg', ultimo_precio: 28.0 },
      { insumo_id: INSUMO_LIMON_ID, nombre: 'Limón sutil', unidad_medida: 'kg', ultimo_precio: 7.0 },
    ],
    total_compras: 22,
    total_gastado: 24150.0,
    ultima_compra_fecha: '2026-10-08T07:45:00Z',
    ultima_compra_total: 1120.0,
    created_at: '2026-08-10T08:00:00Z',
  },
  {
    id: PROV_LACTEOS_DON_PEPE_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Lácteos Don Pepe',
    contacto: 'Jose Luis Meza',
    telefono: '+51 965 432 109',
    email: 'lacteosdonpepe@gmail.com',
    direccion: 'Av. Los Héroes 340, San Juan de Miraflores',
    activo: true,
    insumos_habituales: [
      { insumo_id: INSUMO_LECHE_ID, nombre: 'Leche fresca', unidad_medida: 'L', ultimo_precio: 4.5 },
      { insumo_id: INSUMO_HUEVOS_ID, nombre: 'Huevos de gallina', unidad_medida: 'jaba', ultimo_precio: 70.0 },
    ],
    total_compras: 11,
    total_gastado: 5280.0,
    ultima_compra_fecha: '2026-09-28T16:20:00Z',
    ultima_compra_total: 480.0,
    created_at: '2026-08-25T12:00:00Z',
  },
  {
    id: PROV_PACIFICO_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Bebidas del Pacífico S.A.C.',
    contacto: 'Marcos Ríos',
    telefono: '+51 900 100 412',
    email: 'pedidos@pacifico.local',
    direccion: 'Av. Argentina 890, Callao',
    activo: true,
    insumos_habituales: [
      { insumo_id: INSUMO_INCA_KOLA_ID, nombre: 'Inca Kola 500ml', unidad_medida: 'botella', ultimo_precio: 2.2 },
      { insumo_id: INSUMO_CERVEZA_ID, nombre: 'Cerveza Cusqueña', unidad_medida: 'botella', ultimo_precio: 4.8 },
    ],
    total_compras: 16,
    total_gastado: 18900.0,
    ultima_compra_fecha: '2026-10-05T10:10:00Z',
    ultima_compra_total: 1560.0,
    created_at: '2026-08-12T09:30:00Z',
  },
  {
    id: PROV_GAS_DEL_SUR_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Gas del Sur',
    contacto: 'Despachos Central',
    telefono: '(01) 420-9988',
    email: 'atencion@gasdelsur.pe',
    direccion: 'Av. Pachacútec 1200, Villa María del Triunfo',
    activo: true,
    insumos_habituales: [],
    total_compras: 6,
    total_gastado: 3720.0,
    ultima_compra_fecha: '2026-09-25T11:00:00Z',
    ultima_compra_total: 620.0,
    created_at: '2026-08-30T10:00:00Z',
  },
  {
    id: PROV_ENVASES_SAN_JUAN_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Envases San Juan',
    contacto: 'Marita Ramos',
    telefono: '+51 943 210 987',
    email: 'envases_sanjuan@hotmail.com',
    direccion: 'Jr. Ayacucho 450, Centro de Lima',
    activo: true,
    insumos_habituales: [],
    total_compras: 5,
    total_gastado: 1950.0,
    ultima_compra_fecha: '2026-09-15T15:30:00Z',
    ultima_compra_total: 390.0,
    created_at: '2026-09-01T14:00:00Z',
  },
  {
    id: PROV_AVICOLA_CHALAN_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Avícola El Chalán',
    contacto: 'Luis Paredes',
    telefono: '+51 984 112 233',
    email: 'chalan_aves@gmail.com',
    direccion: 'Mdo. Santa Anita Pab. A Puesto 08',
    activo: false,
    insumos_habituales: [
      { insumo_id: INSUMO_HUEVOS_ID, nombre: 'Huevos de gallina', unidad_medida: 'jaba', ultimo_precio: 72.0 },
    ],
    total_compras: 3,
    total_gastado: 2400.0,
    ultima_compra_fecha: '2026-08-10T09:00:00Z',
    ultima_compra_total: 800.0,
    created_at: '2026-07-20T08:00:00Z',
  },
  {
    id: PROV_FRUTAS_JUANA_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Frutas Frescas Doña Juana',
    contacto: 'Juana Caldas',
    telefono: '+51 912 345 678',
    email: 'frutasjuana@gmail.com',
    direccion: 'Mercado Central Puesto 88',
    activo: false,
    insumos_habituales: [
      { insumo_id: INSUMO_LIMON_ID, nombre: 'Limón sutil', unidad_medida: 'kg', ultimo_precio: 8.0 },
    ],
    total_compras: 1,
    total_gastado: 350.0,
    ultima_compra_fecha: '2026-07-04T10:00:00Z',
    ultima_compra_total: 350.0,
    created_at: '2026-06-15T11:00:00Z',
  },
  {
    id: PROV_TRANSPORTES_RAPIDOS_ID,
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Transportes y Cargas Rápidas',
    contacto: 'Roberto Vega',
    telefono: '+51 922 444 888',
    email: 'roberto@cargasrapidas.pe',
    direccion: 'Av. Colonial 120, Lima',
    activo: false,
    insumos_habituales: [],
    total_compras: 0,
    total_gastado: 0.0,
    ultima_compra_fecha: null,
    ultima_compra_total: null,
    created_at: '2026-09-10T16:00:00Z',
  },
];

const SEMILLAS_FICHAS_COMPRA_HISTORIAL: Record<string, FichaCompraHistorialDTO[]> = {
  [PROV_SAN_FERNANDO_ID]: [
    {
      id: 'fc-sf-001',
      numero_comprobante: 'F001-004921',
      tipo_comprobante: 'factura',
      fecha_emision: '2026-10-06',
      metodo_pago: 'transferencia',
      total: 2450.0,
      items: [
        { insumo_id: INSUMO_LOMO_ID, insumo_nombre: 'Lomo fino', unidad_medida: 'kg', cantidad: 50.0, precio_unitario: 42.0, subtotal: 2100.0 },
        { insumo_id: INSUMO_HUEVOS_ID, insumo_nombre: 'Huevos de gallina', unidad_medida: 'jaba', cantidad: 5.0, precio_unitario: 70.0, subtotal: 350.0 },
      ],
    },
    {
      id: 'fc-sf-002',
      numero_comprobante: 'F001-004810',
      tipo_comprobante: 'factura',
      fecha_emision: '2026-09-29',
      metodo_pago: 'transferencia',
      total: 2100.0,
      items: [
        { insumo_id: INSUMO_LOMO_ID, insumo_nombre: 'Lomo fino', unidad_medida: 'kg', cantidad: 50.0, precio_unitario: 42.0, subtotal: 2100.0 },
      ],
    },
    {
      id: 'fc-sf-003',
      numero_comprobante: 'B002-001092',
      tipo_comprobante: 'boleta',
      fecha_emision: '2026-09-15',
      metodo_pago: 'efectivo',
      total: 700.0,
      items: [
        { insumo_id: INSUMO_HUEVOS_ID, insumo_nombre: 'Huevos de gallina', unidad_medida: 'jaba', cantidad: 10.0, precio_unitario: 70.0, subtotal: 700.0 },
      ],
    },
  ],
  [PROV_VERDURAS_SAN_MARTIN_ID]: [
    {
      id: 'fc-vsm-001',
      numero_comprobante: 'F002-008120',
      tipo_comprobante: 'factura',
      fecha_emision: '2026-10-07',
      metodo_pago: 'transferencia',
      total: 840.0,
      items: [
        { insumo_id: INSUMO_PAPA_AMARILLA_ID, insumo_nombre: 'Papa amarilla', unidad_medida: 'kg', cantidad: 100.0, precio_unitario: 3.5, subtotal: 350.0 },
        { insumo_id: INSUMO_PAPA_YUNGAY_ID, insumo_nombre: 'Papa Yungay', unidad_medida: 'saco', cantidad: 4.0, precio_unitario: 70.0, subtotal: 280.0 },
        { insumo_id: INSUMO_LIMON_ID, insumo_nombre: 'Limón sutil', unidad_medida: 'kg', cantidad: 30.0, precio_unitario: 7.0, subtotal: 210.0 },
      ],
    },
    {
      id: 'fc-vsm-002',
      numero_comprobante: 'F002-007990',
      tipo_comprobante: 'factura',
      fecha_emision: '2026-09-30',
      metodo_pago: 'transferencia',
      total: 750.0,
      items: [
        { insumo_id: INSUMO_PAPA_AMARILLA_ID, insumo_nombre: 'Papa amarilla', unidad_medida: 'kg', cantidad: 100.0, precio_unitario: 3.5, subtotal: 350.0 },
        { insumo_id: INSUMO_LIMON_ID, insumo_nombre: 'Limón sutil', unidad_medida: 'kg', cantidad: 40.0, precio_unitario: 10.0, subtotal: 400.0 },
      ],
    },
  ],
  [PROV_SAN_PEDRO_ID]: [
    {
      id: 'fc-sp-001',
      numero_comprobante: 'F001-009821',
      tipo_comprobante: 'factura',
      fecha_emision: '2026-10-08',
      metodo_pago: 'transferencia',
      total: 1120.0,
      items: [
        { insumo_id: INSUMO_PESCADO_ID, insumo_nombre: 'Pescado fresco', unidad_medida: 'kg', cantidad: 40.0, precio_unitario: 28.0, subtotal: 1120.0 },
      ],
    },
  ],
};

// Estado en memoria simulado
class MockAdminService {
  private pisos: PisoAdminDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PISOS));
  private maxMesasPlan = 30; // Plan Pro
  private maxPisosPlan = 5;
  private categorias: MockCategoriaRaw[] = JSON.parse(JSON.stringify(SEMILLAS_CATEGORIAS_AUREA));
  private productos: MockProductoRelacional[] = JSON.parse(JSON.stringify(SEMILLA_PRODUCTOS_AUREA));
  private insumos: MockInsumoRaw[] = JSON.parse(JSON.stringify(SEMILLAS_INSUMOS_AUREA));
  private recetas: MockRecetaRelacional[] = JSON.parse(JSON.stringify(SEMILLA_RECETAS_INSUMOS));
  private recetasDetalladas: MockProductoInsumoDetalle[] = JSON.parse(JSON.stringify(SEMILLAS_RECETAS_DETALLADAS));
  private auditoriaAjustes: AuditoriaStockAjusteDTO[] = JSON.parse(JSON.stringify(SEMILLAS_AUDITORIA_INICIAL));
  private proveedores: ProveedorResumenDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PROVEEDORES_AUREA));
  private historialCompras: Record<string, FichaCompraHistorialDTO[]> = JSON.parse(JSON.stringify(SEMILLAS_FICHAS_COMPRA_HISTORIAL));

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

  // ===========================================================================
  // MÉTODOS DE PRODUCTOS DE LA CARTA Y RECETAS (CU-ADMIN-04)
  // ===========================================================================

  private enriquecerProducto(p: MockProductoRelacional): ProductoAdminDTO {
    const categoria = this.categorias.find((c) => c.id === p.categoria_id);
    const recetaRaws = this.recetasDetalladas.filter((r) => r.producto_id === p.id);

    let insumosEnQuiebre = 0;
    const recetaItems: ItemRecetaDTO[] = recetaRaws.map((r) => {
      const ins = this.insumos.find((i) => i.id === r.insumo_id);
      const stock = ins ? ins.stock_actual : 0;
      const costoUnitario = ins ? ins.costo_unitario : 0;
      const unidadMedida = ins ? ins.unidad_medida : 'und';
      const insNombre = ins ? ins.nombre : 'Insumo desconocido';

      let dosis = r.cantidad_descuenta;
      if (r.modo_calculo === 'rendimiento' && r.rendimiento_platos && r.rendimiento_platos > 0) {
        dosis = Number((1 / r.rendimiento_platos).toFixed(5));
      }

      const costoPlato = Number((dosis * costoUnitario).toFixed(2));
      const racionesDisponibles = dosis > 0 ? Math.floor(stock / dosis) : 0;

      if (stock <= 0 || (ins && ins.estado === 'agotado')) {
        insumosEnQuiebre++;
      }

      return {
        insumo_id: r.insumo_id,
        insumo_nombre: insNombre,
        unidad_medida: unidadMedida,
        modo_calculo: r.modo_calculo,
        rendimiento_platos: r.rendimiento_platos,
        cantidad_descuenta: dosis,
        costo_unitario_insumo: costoUnitario,
        costo_plato_insumo: costoPlato,
        stock_actual_insumo: stock,
        raciones_disponibles_insumo: racionesDisponibles,
      };
    });

    const costoTeorico = Number(
      recetaItems.reduce((acc, it) => acc + (it.cantidad_descuenta * it.costo_unitario_insumo), 0).toFixed(2)
    );

    const margenBrutoPct =
      p.precio > 0
        ? Number((((p.precio - costoTeorico) / p.precio) * 100).toFixed(1))
        : 0;

    let disp = p.disponibilidad;
    let motivo = p.motivo_agotado;
    if (insumosEnQuiebre > 0 && disp === 'agotado' && !motivo) {
      motivo = 'quiebre_stock_receta';
    }

    return {
      id: p.id,
      local_id: p.local_id,
      categoria_id: p.categoria_id,
      categoria_nombre: categoria ? categoria.nombre : 'Sin Categoría',
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      precio: p.precio,
      costo_estandar: p.costo_estandar || costoTeorico,
      costo_teorico: costoTeorico,
      margen_bruto_pct: margenBrutoPct,
      moneda: p.moneda || 'PEN',
      foto_url: p.foto_url || null,
      disponibilidad: disp,
      motivo_agotado: motivo || null,
      requiere_preparacion: p.requiere_preparacion,
      activo: p.activo,
      total_ingredientes: recetaItems.length,
      insumos_en_quiebre: insumosEnQuiebre,
      receta: recetaItems,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  }

  /**
   * GET /api/v1/admin/productos
   * Retorna el catálogo con KPIs, filtros por categoría y disponibilidad, búsqueda y paginación.
   */
  async obtenerProductos(
    localId: string = CANONICAL_LOCAL_ID,
    categoriaId?: string,
    disponibilidad: 'todos' | 'disponible' | 'agotado' = 'todos',
    busqueda: string = '',
    pagina: number = 1,
    limite: number = 10
  ): Promise<ApiResponse<ListarProductosResponseDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    // Todos los productos activos del local
    const productosLocal = this.productos.filter(
      (p) => p.local_id === localId && p.activo === true
    );

    // Enriquecer todos para KPIs globales
    const enriquecidos = productosLocal.map((p) => this.enriquecerProducto(p));

    const totalProductos = enriquecidos.length;
    const disponibles = enriquecidos.filter((p) => p.disponibilidad === 'disponible').length;
    const agotados = enriquecidos.filter((p) => p.disponibilidad === 'agotado').length;
    const margenPromedio =
      enriquecidos.length > 0
        ? Number(
            (
              enriquecidos.reduce((acc, p) => acc + p.margen_bruto_pct, 0) /
              enriquecidos.length
            ).toFixed(1)
          )
        : 0;

    // Aplicar filtros a la lista paginada
    let filtrados = enriquecidos;

    if (categoriaId && categoriaId !== 'todas') {
      filtrados = filtrados.filter((p) => p.categoria_id === categoriaId);
    }

    if (disponibilidad !== 'todos') {
      filtrados = filtrados.filter((p) => p.disponibilidad === disponibilidad);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          p.categoria_nombre.toLowerCase().includes(q)
      );
    }

    const total = filtrados.length;
    const totalPaginas = Math.ceil(total / limite) || 1;
    const paginaValida = Math.max(1, Math.min(pagina, totalPaginas));
    const inicio = (paginaValida - 1) * limite;
    const paginados = filtrados.slice(inicio, inicio + limite);

    return {
      exito: true,
      datos: {
        kpis: {
          total_productos: totalProductos,
          disponibles,
          agotados,
          margen_promedio: margenPromedio,
        },
        productos: paginados,
        paginacion: {
          total,
          pagina: paginaValida,
          limite,
          total_paginas: totalPaginas,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * GET /api/v1/admin/productos/{id}
   */
  async obtenerProductoPorId(id: string): Promise<ApiResponse<ProductoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 60));
    const prod = this.productos.find((p) => p.id === id);
    if (!prod) {
      return {
        exito: false,
        datos: null as unknown as ProductoAdminDTO,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_NO_ENCONTRADO',
            mensaje: 'El producto solicitado no existe en la sede.',
          },
        ],
      };
    }
    return {
      exito: true,
      datos: this.enriquecerProducto(prod),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * POST /api/v1/admin/productos
   * Alta atómica de plato y receta vinculada con validación de categoría obligatoria y receta no vacía.
   */
  async crearProducto(
    localId: string = CANONICAL_LOCAL_ID,
    req: CrearProductoRequest
  ): Promise<ApiResponse<ProductoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    // 1. Validar categoría obligatoria
    const catExiste = this.categorias.find((c) => c.id === req.categoria_id && c.local_id === localId);
    if (!catExiste) {
      return {
        exito: false,
        datos: null as unknown as ProductoAdminDTO,
        errores: [
          {
            codigo: 'ERR_CATEGORIA_INVALIDA',
            mensaje: 'La categoría seleccionada no existe o no pertenece a este local.',
          },
        ],
      };
    }

    // 2. Validar nombre único
    const nombreNormalizado = req.nombre.trim().toLowerCase();
    const duplicado = this.productos.find(
      (p) => p.local_id === localId && p.nombre.toLowerCase().trim() === nombreNormalizado && p.activo
    );
    if (duplicado) {
      return {
        exito: false,
        datos: null as unknown as ProductoAdminDTO,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_DUPLICADO',
            mensaje: `Ya existe un producto en carta con el nombre "${req.nombre.trim()}".`,
          },
        ],
      };
    }

    // 3. Validar receta no vacía
    if (!req.receta || req.receta.length === 0) {
      return {
        exito: false,
        datos: null as unknown as ProductoAdminDTO,
        errores: [
          {
            codigo: 'ERR_RECETA_VACIA',
            mensaje: 'Todo plato en carta debe tener al menos un insumo en su receta para control de stock.',
          },
        ],
      };
    }

    // 4. Comprobar stock de insumos para disponibilidad inicial
    let tieneQuiebre = false;
    for (const item of req.receta) {
      const ins = this.insumos.find((i) => i.id === item.insumo_id);
      if (!ins || ins.stock_actual <= 0 || ins.estado === 'agotado') {
        tieneQuiebre = true;
      }
    }

    const nuevoId = crypto.randomUUID();
    const nuevoProducto: MockProductoRelacional = {
      id: nuevoId,
      local_id: localId,
      categoria_id: req.categoria_id,
      nombre: req.nombre.trim(),
      descripcion: req.descripcion?.trim() || '',
      precio: req.precio,
      costo_estandar: 0,
      moneda: 'PEN',
      foto_url: req.foto_url || null,
      disponibilidad: tieneQuiebre ? 'agotado' : 'disponible',
      motivo_agotado: tieneQuiebre ? 'quiebre_stock_receta' : null,
      requiere_preparacion: req.requiere_preparacion,
      activo: true,
      es_combo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insertar receta detallada
    const nuevasRecetasDetalle: MockProductoInsumoDetalle[] = req.receta.map((r) => {
      let dosis = r.cantidad_descuenta || 1;
      if (r.modo_calculo === 'rendimiento' && r.rendimiento_platos && r.rendimiento_platos > 0) {
        dosis = Number((1 / r.rendimiento_platos).toFixed(5));
      }
      return {
        producto_id: nuevoId,
        insumo_id: r.insumo_id,
        modo_calculo: r.modo_calculo,
        rendimiento_platos: r.rendimiento_platos || null,
        cantidad_descuenta: dosis,
      };
    });

    this.productos.unshift(nuevoProducto);
    this.recetasDetalladas.push(...nuevasRecetasDetalle);

    // Sincronizar this.recetas para CU-ADMIN-03
    for (const r of req.receta) {
      if (!this.recetas.some((x) => x.insumo_id === r.insumo_id && x.producto_nombre === nuevoProducto.nombre)) {
        this.recetas.push({ insumo_id: r.insumo_id, producto_nombre: nuevoProducto.nombre });
      }
    }

    return {
      exito: true,
      datos: this.enriquecerProducto(nuevoProducto),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PUT /api/v1/admin/productos/{id}
   * Actualización comercial completa del plato y su receta.
   */
  async actualizarProducto(
    id: string,
    req: Partial<CrearProductoRequest>
  ): Promise<ApiResponse<ProductoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 120));
    const prod = this.productos.find((p) => p.id === id);
    if (!prod) {
      return {
        exito: false,
        datos: null as unknown as ProductoAdminDTO,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_NO_ENCONTRADO',
            mensaje: 'El producto a actualizar no existe.',
          },
        ],
      };
    }

    if (req.nombre !== undefined) prod.nombre = req.nombre.trim();
    if (req.categoria_id !== undefined) prod.categoria_id = req.categoria_id;
    if (req.descripcion !== undefined) prod.descripcion = req.descripcion.trim();
    if (req.precio !== undefined) prod.precio = req.precio;
    if (req.requiere_preparacion !== undefined) prod.requiere_preparacion = req.requiere_preparacion;
    if (req.foto_url !== undefined) prod.foto_url = req.foto_url;
    prod.updated_at = new Date().toISOString();

    // Actualizar receta si se proporcionó
    if (req.receta && req.receta.length > 0) {
      this.recetasDetalladas = this.recetasDetalladas.filter((r) => r.producto_id !== id);
      const nuevasRecetas: MockProductoInsumoDetalle[] = req.receta.map((r) => {
        let dosis = r.cantidad_descuenta || 1;
        if (r.modo_calculo === 'rendimiento' && r.rendimiento_platos && r.rendimiento_platos > 0) {
          dosis = Number((1 / r.rendimiento_platos).toFixed(5));
        }
        return {
          producto_id: id,
          insumo_id: r.insumo_id,
          modo_calculo: r.modo_calculo,
          rendimiento_platos: r.rendimiento_platos || null,
          cantidad_descuenta: dosis,
        };
      });
      this.recetasDetalladas.push(...nuevasRecetas);
    }

    return {
      exito: true,
      datos: this.enriquecerProducto(prod),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PUT /api/v1/admin/productos/{id}/receta
   * Calibración rápida de receta desde el Quick-Drawer.
   */
  async actualizarReceta(
    productoId: string,
    req: ActualizarRecetaRequest
  ): Promise<ApiResponse<{ producto_id: string; nuevo_costo_teorico: number; nuevo_margen_pct: number; mensaje: string }>> {
    await new Promise((r) => setTimeout(r, 100));

    const prod = this.productos.find((p) => p.id === productoId);
    if (!prod) {
      return {
        exito: false,
        datos: null as unknown as { producto_id: string; nuevo_costo_teorico: number; nuevo_margen_pct: number; mensaje: string },
        errores: [
          {
            codigo: 'ERR_PRODUCTO_NO_ENCONTRADO',
            mensaje: 'El producto a calibrar no existe.',
          },
        ],
      };
    }

    if (!req.receta || req.receta.length === 0) {
      return {
        exito: false,
        datos: null as unknown as { producto_id: string; nuevo_costo_teorico: number; nuevo_margen_pct: number; mensaje: string },
        errores: [
          {
            codigo: 'ERR_RECETA_VACIA',
            mensaje: 'La receta debe contener al menos un ingrediente.',
          },
        ],
      };
    }

    // Reemplazar recetas detalladas del producto
    this.recetasDetalladas = this.recetasDetalladas.filter((r) => r.producto_id !== productoId);
    const nuevasRecetas: MockProductoInsumoDetalle[] = req.receta.map((r) => {
      let dosis = r.cantidad_descuenta || 1;
      if (r.modo_calculo === 'rendimiento' && r.rendimiento_platos && r.rendimiento_platos > 0) {
        dosis = Number((1 / r.rendimiento_platos).toFixed(5));
      }
      return {
        producto_id: productoId,
        insumo_id: r.insumo_id,
        modo_calculo: r.modo_calculo,
        rendimiento_platos: r.rendimiento_platos || null,
        cantidad_descuenta: dosis,
      };
    });
    this.recetasDetalladas.push(...nuevasRecetas);

    prod.updated_at = new Date().toISOString();
    const enriquecido = this.enriquecerProducto(prod);

    return {
      exito: true,
      datos: {
        producto_id: productoId,
        nuevo_costo_teorico: enriquecido.costo_teorico,
        nuevo_margen_pct: enriquecido.margen_bruto_pct,
        mensaje: 'Receta calibrada correctamente. Costo teórico y márgenes actualizados.',
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/productos/{id}/disponibilidad
   * Conmutación rápida disponible <-> agotado
   */
  async conmutarDisponibilidadProducto(
    id: string,
    disponibilidad: DisponibilidadProducto,
    motivo?: MotivoAgotado
  ): Promise<ApiResponse<ProductoAdminDTO>> {
    await new Promise((r) => setTimeout(r, 80));
    const prod = this.productos.find((p) => p.id === id);
    if (!prod) {
      return {
        exito: false,
        datos: null as unknown as ProductoAdminDTO,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_NO_ENCONTRADO',
            mensaje: 'Producto no encontrado.',
          },
        ],
      };
    }

    prod.disponibilidad = disponibilidad;
    prod.motivo_agotado = disponibilidad === 'agotado' ? (motivo || 'decision_admin') : null;
    prod.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: this.enriquecerProducto(prod),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * PATCH /api/v1/admin/productos/{id}/archivar
   * Archivado lógico (activo = false) para proteger auditoría de comandas
   */
  async archivarProducto(
    id: string
  ): Promise<ApiResponse<{ id: string; activo: boolean; mensaje: string }>> {
    await new Promise((r) => setTimeout(r, 100));
    const prod = this.productos.find((p) => p.id === id);
    if (!prod) {
      return {
        exito: false,
        datos: null as unknown as { id: string; activo: boolean; mensaje: string },
        errores: [
          {
            codigo: 'ERR_PRODUCTO_NO_ENCONTRADO',
            mensaje: 'Producto no encontrado.',
          },
        ],
      };
    }

    prod.activo = false;
    prod.updated_at = new Date().toISOString();

    return {
      exito: true,
      datos: {
        id,
        activo: false,
        mensaje: `El plato "${prod.nombre}" ha sido archivado de la carta. No aparecerá en comandas de salón ni menús digitales, preservando el histórico de ventas.`,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * GET /api/v1/admin/productos/{id}/simulacion-capacidad
   * Simulador de capacidad de bodega y detección del cuello de botella limitante
   */
  async simularCapacidadBodega(
    productoId: string
  ): Promise<ApiResponse<SimulacionCapacidadDTO>> {
    await new Promise((r) => setTimeout(r, 80));
    const prod = this.productos.find((p) => p.id === productoId);
    if (!prod) {
      return {
        exito: false,
        datos: null as unknown as SimulacionCapacidadDTO,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_NO_ENCONTRADO',
            mensaje: 'Producto no encontrado.',
          },
        ],
      };
    }

    const enriquecido = this.enriquecerProducto(prod);
    const detalles: DetalleCapacidadInsumo[] = [];
    let minRaciones = Infinity;
    let cuelloBotellaId = '';
    let cuelloBotellaNombre = '';

    for (const item of enriquecido.receta) {
      const raciones = item.raciones_disponibles_insumo;
      if (raciones < minRaciones) {
        minRaciones = raciones;
        cuelloBotellaId = item.insumo_id;
        cuelloBotellaNombre = item.insumo_nombre;
      }
    }

    if (minRaciones === Infinity) {
      minRaciones = 0;
    }

    for (const item of enriquecido.receta) {
      detalles.push({
        insumo_id: item.insumo_id,
        insumo_nombre: item.insumo_nombre,
        stock_actual: item.stock_actual_insumo,
        unidad_medida: item.unidad_medida,
        raciones_posibles: item.raciones_disponibles_insumo,
        es_limitante: item.insumo_id === cuelloBotellaId,
      });
    }

    return {
      exito: true,
      datos: {
        capacidad_maxima_platos: minRaciones,
        insumo_cuello_botella_id: cuelloBotellaId,
        insumo_cuello_botella_nombre: cuelloBotellaNombre,
        detalles,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // Métodos de simulación para DemoAdminProductosWidget
  simularQuiebreInsumoReceta(insumoId: string = INSUMO_LIMON_ID) {
    this.simularQuiebreInsumo(insumoId);
    // Marcar platos afectados como agotados
    const recetasAfectadas = this.recetasDetalladas.filter((r) => r.insumo_id === insumoId);
    for (const r of recetasAfectadas) {
      const prod = this.productos.find((p) => p.id === r.producto_id);
      if (prod) {
        prod.disponibilidad = 'agotado';
        prod.motivo_agotado = 'quiebre_stock_receta';
      }
    }
  }

  simularReposicionInsumoReceta(insumoId: string = INSUMO_LIMON_ID) {
    this.simularReposicionInsumo(insumoId, 10.0);
    const recetasAfectadas = this.recetasDetalladas.filter((r) => r.insumo_id === insumoId);
    for (const r of recetasAfectadas) {
      const prod = this.productos.find((p) => p.id === r.producto_id);
      if (prod && prod.motivo_agotado === 'quiebre_stock_receta') {
        prod.disponibilidad = 'disponible';
        prod.motivo_agotado = null;
      }
    }
  }

  simularCartaVacia(localId: string = CANONICAL_LOCAL_ID) {
    this.productos = this.productos.filter((p) => p.local_id !== localId);
  }

  restablecerCartaAurea() {
    this.productos = JSON.parse(JSON.stringify(SEMILLA_PRODUCTOS_AUREA));
    this.recetasDetalladas = JSON.parse(JSON.stringify(SEMILLAS_RECETAS_DETALLADAS));
  }

  // ==========================================================================
  // Métodos de Gestión de Proveedores (CU-ADMIN-05)
  // ==========================================================================

  async getProveedores(
    localId: string = CANONICAL_LOCAL_ID,
    params?: {
      estado?: 'activos' | 'inactivos' | 'todos';
      query?: string;
      pagina?: number;
      limite?: number;
    }
  ): Promise<ApiResponse<ProveedoresListDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const estadoFiltro = params?.estado || 'activos';
    const query = (params?.query || '').trim().toLowerCase();
    const pagina = params?.pagina && params.pagina > 0 ? params.pagina : 1;
    const limite = params?.limite && params.limite > 0 ? params.limite : 10;

    // Proveedores del local
    const proveedoresLocal = this.proveedores.filter((p) => p.local_id === localId);

    // Filtrar por estado
    let filtrados = proveedoresLocal.filter((p) => {
      if (estadoFiltro === 'activos') return p.activo;
      if (estadoFiltro === 'inactivos') return !p.activo;
      return true; // 'todos'
    });

    // Filtrar por query (nombre, contacto, email o insumo que suministra)
    if (query) {
      filtrados = filtrados.filter((p) => {
        const coincideNombre = p.nombre.toLowerCase().includes(query);
        const coincideContacto = p.contacto?.toLowerCase().includes(query) ?? false;
        const coincideEmail = p.email?.toLowerCase().includes(query) ?? false;
        const coincideInsumo = p.insumos_habituales.some((ih) =>
          ih.nombre.toLowerCase().includes(query)
        );
        return coincideNombre || coincideContacto || coincideEmail || coincideInsumo;
      });
    }

    // Ordenar por nombre
    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

    // KPIs calculados
    const totalActivos = proveedoresLocal.filter((p) => p.activo).length;
    const proveedoresFrecuentes = proveedoresLocal.filter((p) => p.total_compras >= 8).length;
    const totalItems = filtrados.length;
    const totalPaginas = Math.ceil(totalItems / limite) || 1;

    // Paginación
    const inicio = (pagina - 1) * limite;
    const proveedoresPaginados = filtrados.slice(inicio, inicio + limite);

    const kpis: ProveedoresKPIsDTO = {
      total_activos: totalActivos,
      compras_mes_total: 14820.0,
      fichas_mes_total: 24,
      proveedores_frecuentes: proveedoresFrecuentes,
    };

    return {
      exito: true,
      datos: {
        kpis,
        proveedores: proveedoresPaginados,
        total_items: totalItems,
        pagina,
        items_pagina: limite,
        total_paginas: totalPaginas,
      },
    };
  }

  async crearProveedor(
    localId: string = CANONICAL_LOCAL_ID,
    req: CrearProveedorRequestDTO
  ): Promise<ApiResponse<ProveedorResumenDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    const nombreLimpio = req.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_VALIDACION',
            mensaje: 'El nombre comercial del proveedor es obligatorio.',
          },
        ],
      };
    }

    // Regla de unicidad en la sede (LOWER(nombre))
    const existe = this.proveedores.some(
      (p) => p.local_id === localId && p.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (existe) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROVEEDOR_DUPLICADO',
            mensaje: `Ya existe un proveedor registrado con el nombre '${nombreLimpio}' en esta sede.`,
            campo: 'nombre',
          },
        ],
      };
    }

    // Mapear insumos habituales
    const insumosHabituales: InsumoHabitualDTO[] = (req.insumos_ids || []).map((id) => {
      const ins = this.insumos.find((i) => i.id === id);
      return {
        insumo_id: id,
        nombre: ins ? ins.nombre : 'Insumo',
        unidad_medida: ins ? ins.unidad_medida : 'und',
        ultimo_precio: ins ? ins.costo_unitario : 0,
      };
    });

    const nuevo: ProveedorResumenDTO = {
      id: `prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      local_id: localId,
      nombre: nombreLimpio,
      contacto: req.contacto?.trim() || null,
      telefono: req.telefono.trim(),
      email: req.email?.trim() || null,
      direccion: req.direccion?.trim() || null,
      activo: true,
      insumos_habituales: insumosHabituales,
      total_compras: 0,
      total_gastado: 0.0,
      ultima_compra_fecha: null,
      ultima_compra_total: null,
      created_at: new Date().toISOString(),
    };

    this.proveedores.unshift(nuevo);

    return {
      exito: true,
      datos: nuevo,
    };
  }

  async actualizarProveedor(
    id: string,
    req: ActualizarProveedorRequestDTO
  ): Promise<ApiResponse<ProveedorResumenDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    const index = this.proveedores.findIndex((p) => p.id === id);
    if (index === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOT_FOUND',
            mensaje: 'Proveedor no encontrado.',
          },
        ],
      };
    }

    const proveedor = this.proveedores[index];
    const nombreLimpio = req.nombre.trim();

    // Comprobar colisión de nombre con otro proveedor
    const existeOtro = this.proveedores.some(
      (p) =>
        p.id !== id &&
        p.local_id === proveedor.local_id &&
        p.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (existeOtro) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROVEEDOR_DUPLICADO',
            mensaje: `Ya existe otro proveedor registrado con el nombre '${nombreLimpio}'.`,
            campo: 'nombre',
          },
        ],
      };
    }

    const insumosHabituales: InsumoHabitualDTO[] = (req.insumos_ids || []).map((iid) => {
      const ins = this.insumos.find((i) => i.id === iid);
      return {
        insumo_id: iid,
        nombre: ins ? ins.nombre : 'Insumo',
        unidad_medida: ins ? ins.unidad_medida : 'und',
        ultimo_precio: ins ? ins.costo_unitario : 0,
      };
    });

    proveedor.nombre = nombreLimpio;
    proveedor.contacto = req.contacto?.trim() || null;
    proveedor.telefono = req.telefono.trim();
    proveedor.email = req.email?.trim() || null;
    proveedor.direccion = req.direccion?.trim() || null;
    proveedor.insumos_habituales = insumosHabituales;

    return {
      exito: true,
      datos: proveedor,
    };
  }

  async conmutarEstadoProveedor(
    id: string,
    activo: boolean
  ): Promise<ApiResponse<ProveedorResumenDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    const proveedor = this.proveedores.find((p) => p.id === id);
    if (!proveedor) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOT_FOUND',
            mensaje: 'Proveedor no encontrado.',
          },
        ],
      };
    }

    proveedor.activo = activo;

    return {
      exito: true,
      datos: proveedor,
    };
  }

  async getHistorialComprasProveedor(
    id: string
  ): Promise<ApiResponse<ProveedorHistorialComprasDTO>> {
    await new Promise((r) => setTimeout(r, 140));

    const proveedor = this.proveedores.find((p) => p.id === id);
    if (!proveedor) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOT_FOUND',
            mensaje: 'Proveedor no encontrado.',
          },
        ],
      };
    }

    const compras = this.historialCompras[id] || [];

    return {
      exito: true,
      datos: {
        proveedor_id: proveedor.id,
        proveedor_nombre: proveedor.nombre,
        contacto: proveedor.contacto,
        telefono: proveedor.telefono,
        total_facturado: proveedor.total_gastado,
        total_fichas: proveedor.total_compras,
        variacion_precio_texto:
          compras.length > 0
            ? 'Precios referenciales estables con variación mensual del +2.4%'
            : 'Sin variación registrada',
        compras,
      },
    };
  }

  async eliminarProveedor(id: string): Promise<ApiResponse<null>> {
    await new Promise((r) => setTimeout(r, 150));

    const index = this.proveedores.findIndex((p) => p.id === id);
    if (index === -1) {
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERR_NOT_FOUND',
            mensaje: 'Proveedor no encontrado.',
          },
        ],
      };
    }

    const prov = this.proveedores[index];

    // Regla de integridad contable (PostgreSQL ON DELETE RESTRICT)
    if (prov.total_compras > 0) {
      return {
        exito: false,
        datos: null,
        errores: [
          {
            codigo: 'ERR_PROVEEDOR_TIENE_COMPRAS',
            mensaje: `No es posible eliminar físicamente al proveedor porque cuenta con ${prov.total_compras} ficha(s) de compra registrada(s) (ON DELETE RESTRICT). Puede desactivarlo para excluirlo de futuras compras sin perder el histórico contable.`,
          },
        ],
      };
    }

    // Si tiene 0 compras, se permite el borrado físico
    this.proveedores.splice(index, 1);
    delete this.historialCompras[id];

    return {
      exito: true,
      datos: null,
    };
  }

  simularDirectorioVacio(localId: string = CANONICAL_LOCAL_ID) {
    this.proveedores = this.proveedores.filter((p) => p.local_id !== localId);
  }

  restablecerSemillasProveedores() {
    this.proveedores = JSON.parse(JSON.stringify(SEMILLAS_PROVEEDORES_AUREA));
    this.historialCompras = JSON.parse(JSON.stringify(SEMILLAS_FICHAS_COMPRA_HISTORIAL));
  }
}

export const mockAdminService = new MockAdminService();

