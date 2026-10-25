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
  RegistrarFichaCompraRequestDTO,
  ItemCompraDetalleDTO,
  PlatoReactivableDTO,
  FichaCompraResumenDTO,
  FichaCompraDetalleCompletoDTO,
  FichasCompraKPIsDTO,
  ListarFichasCompraResponseDTO,
  InsumoImpactadoDTO,
  PlatoImpactadoDTO,
  PedidoCocinaImpactadoDTO,
  ImpactoAnulacionDTO,
  AnularFichaCompraRequestDTO,
  EmpleadoDetalleDTO,
  MetricasPersonalDTO,
  RegistrarEmpleadoRequestDTO,
  ActualizarEmpleadoRequestDTO,
  PrecheckDesactivacionDTO,
  DesactivarEmpleadoRequestDTO,
  ResetPasswordResponseDTO,
  ListarPersonalResponseDTO,
  DiaHorarioDTO,
  ConfigSemanaHorariaRequest,
  HorarioSemanaResponse,
  AplicarPlantillaRequest,
  ExcepcionHorarioDTO,
  PrecheckExcepcionRequest,
  ReservaConflictoDTO,
  PrecheckExcepcionResponse,
  CrearExcepcionRequest,
  PoliticasReservaDTO,
  ActualizarPoliticasReservaRequest,
  ReservaResumenDTO,
  PrecheckDesactivacionReservasResponse,
  IncidenteItemDTO,
  IncidentesKPIsDTO,
  IncidentesHistorialResponse,
  IncidenteDetalleDTO,
  IncidenteBitacoraItemDTO,
  RegistrarIncidenteRequest,
  InvestigacionIncidenteRequest,
  AgregarAvanceInvestigacionRequest,
  ResolverIncidenteRequest,
  FiltrosIncidentesRequest,
  PedidoAnulacionItemDTO,
  AnulacionesBandejaResponseDTO,
  FiltrosAnulacionesRequest,
  MarcarRevisadoRequestDTO,
  EscalarIncidenteAnulacionRequest,
  NotificacionCampanaDTO,
  PromocionAdminDTO,
  EstadoVisualPromocion,
  PromocionesBandejaResponseDTO,
  CrearPromocionRequest,
  ActualizarPromocionRequest,
  PromocionComprobanteAuditoriaDTO,
  PromocionRendimientoDTO,
  FiltrosPromocionesRequest,
  BuscarPromocionesResponseDTO,
  FiltroEstadoPromocion,
  FiltroTipoPromocion,
  ConfiguracionKdsDTO,
  ActualizarConfiguracionKdsRequest,
  CodigoMetodoPagoLocal,
  MetodoPagoLocalDTO,
  CatalogoMetodosPagoResponseDTO,
  ActualizarCatalogoMetodosRequest,
  ActualizarMetodoPagoItemRequest,
  MetodosPagoKPIsDTO,
  PeriodoFlujoCaja,
  FlujoCajaResumenDTO,
  FlujoDiarioDTO,
  GastoOperativoDTO,
  RegistrarGastoRequestDTO,
  TurnoCajaResumenDTO,
  AuditoriaTurnosKPIsDTO,
  VisarTurnoRequestDTO,
  CierreForzadoAdminRequestDTO,
} from '@/types/admin';
import { ReporteZDTO } from '@/types/caja';
import { mockCajaService } from '@/modules/caja/services/mockCajaService';
import { MOCK_CONFIGURACION_KDS } from '@/modules/cocina/services/mockCocinaService';
import {
  PropietarioIncidentesFiltrosRequest,
  PropietarioIncidentesBandejaResponse,
  PasarARevisionRequest,
  IncidenteBandejaItemDTO,
} from '@/types/propietario';

// Identificadores Canónicos del Seed de Desarrollo Local (07_seed_local_aurea_completo.sql)
import {
  CANONICAL_LOCAL_ID,
  CANONICAL_LOCAL_NOMBRE,
  CANONICAL_LOCAL_SAN_ISIDRO_ID,
  CANONICAL_LOCAL_SAN_ISIDRO_NOMBRE,
} from '@/shared/constants/canonical';

export {
  CANONICAL_LOCAL_ID,
  CANONICAL_LOCAL_NOMBRE,
  CANONICAL_LOCAL_SAN_ISIDRO_ID,
  CANONICAL_LOCAL_SAN_ISIDRO_NOMBRE,
};

export const SEDES_EMPRESA_AUREA = [
  {
    id: CANONICAL_LOCAL_ID,
    nombre: CANONICAL_LOCAL_NOMBRE,
    slug: 'aurea-miraflores',
    direccion: 'Av. Larco 450',
    distrito: 'Miraflores',
    ciudad: 'Lima',
  },
  {
    id: CANONICAL_LOCAL_SAN_ISIDRO_ID,
    nombre: CANONICAL_LOCAL_SAN_ISIDRO_NOMBRE,
    slug: 'aurea-san-isidro',
    direccion: 'Av. Los Conquistadores 890',
    distrito: 'San Isidro',
    ciudad: 'Lima',
  },
];

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

// ============================================================================
// Semillas Canónicas de Fichas de Compra del Mes y Auditoría (CU-ADMIN-06)
// ============================================================================
const SEMILLAS_FICHAS_COMPRA_AUREA: FichaCompraDetalleCompletoDTO[] = [
  {
    id: 'fc-aurea-0024',
    codigo_correlativo: 'FC-202610-0024',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-004921',
    proveedor_id: PROV_SAN_FERNANDO_ID,
    proveedor_nombre: 'Distribuidora San Fernando',
    proveedor_telefono: '+51 987 654 321',
    fecha_emision: '2026-10-12',
    fecha_registro: '2026-10-12T10:30:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 2450.0,
    subtotal_neto: 2076.27,
    igv_monto: 373.73,
    cantidad_items: 2,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    observaciones: 'Lote semanal de cortes premium y huevos.',
    items: [
      {
        id: 'fcd-0024-1',
        ficha_id: 'fc-aurea-0024',
        insumo_id: INSUMO_LOMO_ID,
        insumo_nombre: 'Lomo fino',
        unidad_medida: 'kg',
        cantidad: 50.0,
        precio_unitario: 42.0,
        subtotal: 2100.0,
        costo_anterior: 42.0,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0024-2',
        ficha_id: 'fc-aurea-0024',
        insumo_id: INSUMO_HUEVOS_ID,
        insumo_nombre: 'Huevos de gallina',
        unidad_medida: 'jaba',
        cantidad: 5.0,
        precio_unitario: 70.0,
        subtotal: 350.0,
        costo_anterior: 70.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0023',
    codigo_correlativo: 'FC-202610-0023',
    tipo_comprobante: 'NOTA_VENTA',
    numero_comprobante: 'NV-20261011-0001',
    proveedor_id: PROV_VERDURAS_SAN_MARTIN_ID,
    proveedor_nombre: 'Verduras San Martín',
    proveedor_telefono: '+51 976 543 210',
    fecha_emision: '2026-10-11',
    fecha_registro: '2026-10-11T08:15:00Z',
    metodo_pago: 'EFECTIVO',
    total: 455.0,
    subtotal_neto: 455.0,
    igv_monto: 0.0,
    cantidad_items: 2,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    observaciones: 'Abastecimiento de verduras frescas para cocina fría.',
    items: [
      {
        id: 'fcd-0023-1',
        ficha_id: 'fc-aurea-0023',
        insumo_id: INSUMO_PAPA_AMARILLA_ID,
        insumo_nombre: 'Papa amarilla',
        unidad_medida: 'kg',
        cantidad: 80.0,
        precio_unitario: 3.5,
        subtotal: 280.0,
        costo_anterior: 3.5,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0023-2',
        ficha_id: 'fc-aurea-0023',
        insumo_id: INSUMO_LIMON_ID,
        insumo_nombre: 'Limón sutil',
        unidad_medida: 'kg',
        cantidad: 25.0,
        precio_unitario: 7.0,
        subtotal: 175.0,
        costo_anterior: 6.5,
        variacion_porcentaje: 7.69,
      },
    ],
  },
  {
    id: 'fc-aurea-0022',
    codigo_correlativo: 'FC-202610-0022',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-009821',
    proveedor_id: PROV_SAN_PEDRO_ID,
    proveedor_nombre: 'Mercado Mayorista San Pedro',
    proveedor_telefono: '+51 900 100 411',
    fecha_emision: '2026-10-10',
    fecha_registro: '2026-10-10T07:45:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 1120.0,
    subtotal_neto: 949.15,
    igv_monto: 170.85,
    cantidad_items: 2,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0022-1',
        ficha_id: 'fc-aurea-0022',
        insumo_id: INSUMO_PESCADO_ID,
        insumo_nombre: 'Pescado fresco',
        unidad_medida: 'kg',
        cantidad: 35.0,
        precio_unitario: 28.0,
        subtotal: 980.0,
        costo_anterior: 28.0,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0022-2',
        ficha_id: 'fc-aurea-0022',
        insumo_id: INSUMO_LIMON_ID,
        insumo_nombre: 'Limón sutil',
        unidad_medida: 'kg',
        cantidad: 20.0,
        precio_unitario: 7.0,
        subtotal: 140.0,
        costo_anterior: 7.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0021',
    codigo_correlativo: 'FC-202610-0021',
    tipo_comprobante: 'BOLETA',
    numero_comprobante: 'B005-001243',
    proveedor_id: PROV_LACTEOS_DON_PEPE_ID,
    proveedor_nombre: 'Lácteos Don Pepe',
    proveedor_telefono: '+51 965 432 109',
    fecha_emision: '2026-10-10',
    fecha_registro: '2026-10-10T09:10:00Z',
    metodo_pago: 'YAPE_PLIN',
    total: 460.0,
    subtotal_neto: 460.0,
    igv_monto: 0.0,
    cantidad_items: 2,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0021-1',
        ficha_id: 'fc-aurea-0021',
        insumo_id: INSUMO_LECHE_ID,
        insumo_nombre: 'Leche fresca',
        unidad_medida: 'L',
        cantidad: 40.0,
        precio_unitario: 4.5,
        subtotal: 180.0,
        costo_anterior: 4.5,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0021-2',
        ficha_id: 'fc-aurea-0021',
        insumo_id: INSUMO_HUEVOS_ID,
        insumo_nombre: 'Huevos de gallina',
        unidad_medida: 'jaba',
        cantidad: 4.0,
        precio_unitario: 70.0,
        subtotal: 280.0,
        costo_anterior: 70.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0020',
    codigo_correlativo: 'FC-202610-0020',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F003-004412',
    proveedor_id: PROV_MOLINOS_CENTRO_ID,
    proveedor_nombre: 'Molinos del Centro S.A.C.',
    proveedor_telefono: '+51 954 321 098',
    fecha_emision: '2026-10-09',
    fecha_registro: '2026-10-09T14:00:00Z',
    metodo_pago: 'CREDITO_30D',
    total: 1280.0,
    subtotal_neto: 1084.75,
    igv_monto: 195.25,
    cantidad_items: 3,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    observaciones: 'Pago a 30 días según acuerdo comercial.',
    items: [
      {
        id: 'fcd-0020-1',
        ficha_id: 'fc-aurea-0020',
        insumo_id: INSUMO_ARROZ_ID,
        insumo_nombre: 'Arroz extra',
        unidad_medida: 'kg',
        cantidad: 150.0,
        precio_unitario: 3.8,
        subtotal: 570.0,
        costo_anterior: 3.8,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0020-2',
        ficha_id: 'fc-aurea-0020',
        insumo_id: INSUMO_ACEITE_ID,
        insumo_nombre: 'Aceite vegetal',
        unidad_medida: 'bidon',
        cantidad: 5.0,
        precio_unitario: 130.0,
        subtotal: 650.0,
        costo_anterior: 130.0,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0020-3',
        ficha_id: 'fc-aurea-0020',
        insumo_id: INSUMO_SAL_ID,
        insumo_nombre: 'Sal de mesa',
        unidad_medida: 'kg',
        cantidad: 50.0,
        precio_unitario: 1.2,
        subtotal: 60.0,
        costo_anterior: 1.2,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0019',
    codigo_correlativo: 'FC-202610-0019',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F010-008120',
    proveedor_id: PROV_PACIFICO_ID,
    proveedor_nombre: 'Bebidas del Pacífico S.A.C.',
    proveedor_telefono: '+51 900 100 412',
    fecha_emision: '2026-10-08',
    fecha_registro: '2026-10-08T11:20:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 1524.0,
    subtotal_neto: 1291.53,
    igv_monto: 232.47,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0019-1',
        ficha_id: 'fc-aurea-0019',
        insumo_id: INSUMO_INCA_KOLA_ID,
        insumo_nombre: 'Inca Kola 500ml',
        unidad_medida: 'botella',
        cantidad: 692.7,
        precio_unitario: 2.2,
        subtotal: 1524.0,
        costo_anterior: 2.2,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0018',
    codigo_correlativo: 'FC-202610-0018',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-002190',
    proveedor_id: PROV_GAS_DEL_SUR_ID,
    proveedor_nombre: 'Gas del Sur',
    proveedor_telefono: '(01) 420-9988',
    fecha_emision: '2026-10-07',
    fecha_registro: '2026-10-07T12:00:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 660.0,
    subtotal_neto: 559.32,
    igv_monto: 100.68,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0018-1',
        ficha_id: 'fc-aurea-0018',
        insumo_id: INSUMO_ACEITE_ID,
        insumo_nombre: 'Gas GLP Cocina Principal',
        unidad_medida: 'bidon',
        cantidad: 4.0,
        precio_unitario: 165.0,
        subtotal: 660.0,
        costo_anterior: 160.0,
        variacion_porcentaje: 3.12,
      },
    ],
  },
  {
    id: 'fc-aurea-0017',
    codigo_correlativo: 'FC-202610-0017',
    tipo_comprobante: 'NOTA_VENTA',
    numero_comprobante: 'NV-20261007-0002',
    proveedor_id: PROV_FRUTAS_JUANA_ID,
    proveedor_nombre: 'Frutas Frescas Doña Juana',
    proveedor_telefono: '+51 912 345 678',
    fecha_emision: '2026-10-07',
    fecha_registro: '2026-10-07T15:30:00Z',
    metodo_pago: 'EFECTIVO',
    total: 240.0,
    subtotal_neto: 240.0,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'ANULADA',
    registrado_por_nombre: 'Administrador Local',
    motivo_anulacion: 'Lote de limón recibido con magulladuras y sobremaduración. Se devolvió íntegramente.',
    fecha_anulacion: '2026-10-07T16:15:00Z',
    items: [
      {
        id: 'fcd-0017-1',
        ficha_id: 'fc-aurea-0017',
        insumo_id: INSUMO_LIMON_ID,
        insumo_nombre: 'Limón sutil',
        unidad_medida: 'kg',
        cantidad: 30.0,
        precio_unitario: 8.0,
        subtotal: 240.0,
        costo_anterior: 7.0,
        variacion_porcentaje: 14.29,
      },
    ],
  },
  {
    id: 'fc-aurea-0016',
    codigo_correlativo: 'FC-202610-0016',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F004-001150',
    proveedor_id: PROV_ENVASES_SAN_JUAN_ID,
    proveedor_nombre: 'Envases San Juan',
    proveedor_telefono: '+51 943 210 987',
    fecha_emision: '2026-10-06',
    fecha_registro: '2026-10-06T14:40:00Z',
    metodo_pago: 'YAPE_PLIN',
    total: 350.0,
    subtotal_neto: 296.61,
    igv_monto: 53.39,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0016-1',
        ficha_id: 'fc-aurea-0016',
        insumo_id: INSUMO_SAL_ID,
        insumo_nombre: 'Envases biodegradables para delivery',
        unidad_medida: 'kg',
        cantidad: 500.0,
        precio_unitario: 0.7,
        subtotal: 350.0,
        costo_anterior: 0.7,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0015',
    codigo_correlativo: 'FC-202610-0015',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-004810',
    proveedor_id: PROV_SAN_FERNANDO_ID,
    proveedor_nombre: 'Distribuidora San Fernando',
    proveedor_telefono: '+51 987 654 321',
    fecha_emision: '2026-10-05',
    fecha_registro: '2026-10-05T09:10:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 1680.0,
    subtotal_neto: 1423.73,
    igv_monto: 256.27,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0015-1',
        ficha_id: 'fc-aurea-0015',
        insumo_id: INSUMO_LOMO_ID,
        insumo_nombre: 'Lomo fino',
        unidad_medida: 'kg',
        cantidad: 40.0,
        precio_unitario: 42.0,
        subtotal: 1680.0,
        costo_anterior: 42.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0014',
    codigo_correlativo: 'FC-202610-0014',
    tipo_comprobante: 'NOTA_VENTA',
    numero_comprobante: 'NV-20261005-0001',
    proveedor_id: PROV_VERDURAS_SAN_MARTIN_ID,
    proveedor_nombre: 'Verduras San Martín',
    proveedor_telefono: '+51 976 543 210',
    fecha_emision: '2026-10-05',
    fecha_registro: '2026-10-05T07:20:00Z',
    metodo_pago: 'EFECTIVO',
    total: 350.0,
    subtotal_neto: 350.0,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0014-1',
        ficha_id: 'fc-aurea-0014',
        insumo_id: INSUMO_PAPA_YUNGAY_ID,
        insumo_nombre: 'Papa Yungay',
        unidad_medida: 'saco',
        cantidad: 5.0,
        precio_unitario: 70.0,
        subtotal: 350.0,
        costo_anterior: 70.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0013',
    codigo_correlativo: 'FC-202610-0013',
    tipo_comprobante: 'BOLETA',
    numero_comprobante: 'B001-003310',
    proveedor_id: PROV_SAN_PEDRO_ID,
    proveedor_nombre: 'Mercado Mayorista San Pedro',
    proveedor_telefono: '+51 900 100 411',
    fecha_emision: '2026-10-04',
    fecha_registro: '2026-10-04T08:00:00Z',
    metodo_pago: 'YAPE_PLIN',
    total: 700.0,
    subtotal_neto: 700.0,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0013-1',
        ficha_id: 'fc-aurea-0013',
        insumo_id: INSUMO_PESCADO_ID,
        insumo_nombre: 'Pescado fresco',
        unidad_medida: 'kg',
        cantidad: 25.0,
        precio_unitario: 28.0,
        subtotal: 700.0,
        costo_anterior: 28.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0012',
    codigo_correlativo: 'FC-202610-0012',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F003-004380',
    proveedor_id: PROV_MOLINOS_CENTRO_ID,
    proveedor_nombre: 'Molinos del Centro S.A.C.',
    proveedor_telefono: '+51 954 321 098',
    fecha_emision: '2026-10-03',
    fecha_registro: '2026-10-03T16:00:00Z',
    metodo_pago: 'CREDITO_30D',
    total: 1040.0,
    subtotal_neto: 881.36,
    igv_monto: 158.64,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0012-1',
        ficha_id: 'fc-aurea-0012',
        insumo_id: INSUMO_ACEITE_ID,
        insumo_nombre: 'Aceite vegetal',
        unidad_medida: 'bidon',
        cantidad: 8.0,
        precio_unitario: 130.0,
        subtotal: 1040.0,
        costo_anterior: 130.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0011',
    codigo_correlativo: 'FC-202610-0011',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F002-007990',
    proveedor_id: PROV_VERDURAS_SAN_MARTIN_ID,
    proveedor_nombre: 'Verduras San Martín',
    proveedor_telefono: '+51 976 543 210',
    fecha_emision: '2026-10-02',
    fecha_registro: '2026-10-02T08:30:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 630.0,
    subtotal_neto: 533.9,
    igv_monto: 96.1,
    cantidad_items: 2,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0011-1',
        ficha_id: 'fc-aurea-0011',
        insumo_id: INSUMO_PAPA_AMARILLA_ID,
        insumo_nombre: 'Papa amarilla',
        unidad_medida: 'kg',
        cantidad: 100.0,
        precio_unitario: 3.5,
        subtotal: 350.0,
        costo_anterior: 3.5,
        variacion_porcentaje: 0.0,
      },
      {
        id: 'fcd-0011-2',
        ficha_id: 'fc-aurea-0011',
        insumo_id: INSUMO_LIMON_ID,
        insumo_nombre: 'Limón sutil',
        unidad_medida: 'kg',
        cantidad: 40.0,
        precio_unitario: 7.0,
        subtotal: 280.0,
        costo_anterior: 7.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0010',
    codigo_correlativo: 'FC-202610-0010',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F010-007950',
    proveedor_id: PROV_PACIFICO_ID,
    proveedor_nombre: 'Bebidas del Pacífico S.A.C.',
    proveedor_telefono: '+51 900 100 412',
    fecha_emision: '2026-10-01',
    fecha_registro: '2026-10-01T10:00:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 920.0,
    subtotal_neto: 779.66,
    igv_monto: 140.34,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0010-1',
        ficha_id: 'fc-aurea-0010',
        insumo_id: INSUMO_INCA_KOLA_ID,
        insumo_nombre: 'Inca Kola 500ml',
        unidad_medida: 'botella',
        cantidad: 418.18,
        precio_unitario: 2.2,
        subtotal: 920.0,
        costo_anterior: 2.2,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0009',
    codigo_correlativo: 'FC-202609-0009',
    tipo_comprobante: 'RECIBO',
    numero_comprobante: 'REC-20260930-0001',
    proveedor_id: PROV_AVICOLA_CHALAN_ID,
    proveedor_nombre: 'Avícola El Chalán',
    proveedor_telefono: '+51 984 112 233',
    fecha_emision: '2026-09-30',
    fecha_registro: '2026-09-30T11:00:00Z',
    metodo_pago: 'EFECTIVO',
    total: 360.0,
    subtotal_neto: 360.0,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0009-1',
        ficha_id: 'fc-aurea-0009',
        insumo_id: INSUMO_HUEVOS_ID,
        insumo_nombre: 'Huevos de gallina',
        unidad_medida: 'jaba',
        cantidad: 5.0,
        precio_unitario: 72.0,
        subtotal: 360.0,
        costo_anterior: 70.0,
        variacion_porcentaje: 2.86,
      },
    ],
  },
  {
    id: 'fc-aurea-0008',
    codigo_correlativo: 'FC-202609-0008',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-004720',
    proveedor_id: PROV_SAN_FERNANDO_ID,
    proveedor_nombre: 'Distribuidora San Fernando',
    proveedor_telefono: '+51 987 654 321',
    fecha_emision: '2026-09-28',
    fecha_registro: '2026-09-28T10:15:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 1845.0,
    subtotal_neto: 1563.56,
    igv_monto: 281.44,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0008-1',
        ficha_id: 'fc-aurea-0008',
        insumo_id: INSUMO_LOMO_ID,
        insumo_nombre: 'Lomo fino',
        unidad_medida: 'kg',
        cantidad: 45.0,
        precio_unitario: 41.0,
        subtotal: 1845.0,
        costo_anterior: 42.0,
        variacion_porcentaje: -2.38,
      },
    ],
  },
  {
    id: 'fc-aurea-0007',
    codigo_correlativo: 'FC-202609-0007',
    tipo_comprobante: 'GUIA_REMISION',
    numero_comprobante: 'GR01-000542',
    proveedor_id: PROV_GAS_DEL_SUR_ID,
    proveedor_nombre: 'Gas del Sur',
    proveedor_telefono: '(01) 420-9988',
    fecha_emision: '2026-09-26',
    fecha_registro: '2026-09-26T12:00:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 495.0,
    subtotal_neto: 495.0,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0007-1',
        ficha_id: 'fc-aurea-0007',
        insumo_id: INSUMO_ACEITE_ID,
        insumo_nombre: 'Recarga Gas 45kg',
        unidad_medida: 'bidon',
        cantidad: 3.0,
        precio_unitario: 165.0,
        subtotal: 495.0,
        costo_anterior: 165.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0006',
    codigo_correlativo: 'FC-202609-0006',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-009710',
    proveedor_id: PROV_SAN_PEDRO_ID,
    proveedor_nombre: 'Mercado Mayorista San Pedro',
    proveedor_telefono: '+51 900 100 411',
    fecha_emision: '2026-09-25',
    fecha_registro: '2026-09-25T07:30:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 1080.0,
    subtotal_neto: 915.25,
    igv_monto: 164.75,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0006-1',
        ficha_id: 'fc-aurea-0006',
        insumo_id: INSUMO_PESCADO_ID,
        insumo_nombre: 'Pescado fresco',
        unidad_medida: 'kg',
        cantidad: 40.0,
        precio_unitario: 27.0,
        subtotal: 1080.0,
        costo_anterior: 28.0,
        variacion_porcentaje: -3.57,
      },
    ],
  },
  {
    id: 'fc-aurea-0005',
    codigo_correlativo: 'FC-202609-0005',
    tipo_comprobante: 'NOTA_VENTA',
    numero_comprobante: 'NV-20260922-0001',
    proveedor_id: PROV_VERDURAS_SAN_MARTIN_ID,
    proveedor_nombre: 'Verduras San Martín',
    proveedor_telefono: '+51 976 543 210',
    fecha_emision: '2026-09-22',
    fecha_registro: '2026-09-22T08:15:00Z',
    metodo_pago: 'EFECTIVO',
    total: 238.0,
    subtotal_neto: 238.0,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0005-1',
        ficha_id: 'fc-aurea-0005',
        insumo_id: INSUMO_PAPA_AMARILLA_ID,
        insumo_nombre: 'Papa amarilla',
        unidad_medida: 'kg',
        cantidad: 70.0,
        precio_unitario: 3.4,
        subtotal: 238.0,
        costo_anterior: 3.5,
        variacion_porcentaje: -2.86,
      },
    ],
  },
  {
    id: 'fc-aurea-0004',
    codigo_correlativo: 'FC-202609-0004',
    tipo_comprobante: 'BOLETA',
    numero_comprobante: 'B005-001180',
    proveedor_id: PROV_LACTEOS_DON_PEPE_ID,
    proveedor_nombre: 'Lácteos Don Pepe',
    proveedor_telefono: '+51 965 432 109',
    fecha_emision: '2026-09-20',
    fecha_registro: '2026-09-20T09:30:00Z',
    metodo_pago: 'YAPE_PLIN',
    total: 157.5,
    subtotal_neto: 157.5,
    igv_monto: 0.0,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0004-1',
        ficha_id: 'fc-aurea-0004',
        insumo_id: INSUMO_LECHE_ID,
        insumo_nombre: 'Leche fresca',
        unidad_medida: 'L',
        cantidad: 35.0,
        precio_unitario: 4.5,
        subtotal: 157.5,
        costo_anterior: 4.5,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0003',
    codigo_correlativo: 'FC-202609-0003',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F003-004210',
    proveedor_id: PROV_MOLINOS_CENTRO_ID,
    proveedor_nombre: 'Molinos del Centro S.A.C.',
    proveedor_telefono: '+51 954 321 098',
    fecha_emision: '2026-09-18',
    fecha_registro: '2026-09-18T14:10:00Z',
    metodo_pago: 'CREDITO_30D',
    total: 740.0,
    subtotal_neto: 627.12,
    igv_monto: 112.88,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0003-1',
        ficha_id: 'fc-aurea-0003',
        insumo_id: INSUMO_ARROZ_ID,
        insumo_nombre: 'Arroz extra',
        unidad_medida: 'kg',
        cantidad: 200.0,
        precio_unitario: 3.7,
        subtotal: 740.0,
        costo_anterior: 3.8,
        variacion_porcentaje: -2.63,
      },
    ],
  },
  {
    id: 'fc-aurea-0002',
    codigo_correlativo: 'FC-202609-0002',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F001-004650',
    proveedor_id: PROV_SAN_FERNANDO_ID,
    proveedor_nombre: 'Distribuidora San Fernando',
    proveedor_telefono: '+51 987 654 321',
    fecha_emision: '2026-09-15',
    fecha_registro: '2026-09-15T09:40:00Z',
    metodo_pago: 'EFECTIVO',
    total: 700.0,
    subtotal_neto: 593.22,
    igv_monto: 106.78,
    cantidad_items: 1,
    estado: 'REGISTRADA',
    registrado_por_nombre: 'Administrador Local',
    items: [
      {
        id: 'fcd-0002-1',
        ficha_id: 'fc-aurea-0002',
        insumo_id: INSUMO_HUEVOS_ID,
        insumo_nombre: 'Huevos de gallina',
        unidad_medida: 'jaba',
        cantidad: 10.0,
        precio_unitario: 70.0,
        subtotal: 700.0,
        costo_anterior: 70.0,
        variacion_porcentaje: 0.0,
      },
    ],
  },
  {
    id: 'fc-aurea-0001',
    codigo_correlativo: 'FC-202609-0001',
    tipo_comprobante: 'FACTURA',
    numero_comprobante: 'F010-007780',
    proveedor_id: PROV_PACIFICO_ID,
    proveedor_nombre: 'Bebidas del Pacífico S.A.C.',
    proveedor_telefono: '+51 900 100 412',
    fecha_emision: '2026-09-12',
    fecha_registro: '2026-09-12T11:00:00Z',
    metodo_pago: 'TRANSFERENCIA',
    total: 890.0,
    subtotal_neto: 754.24,
    igv_monto: 135.76,
    cantidad_items: 1,
    estado: 'ANULADA',
    registrado_por_nombre: 'Administrador Local',
    motivo_anulacion: 'Error en numeración de factura del proveedor. Se anuló y emitió nuevo comprobante.',
    fecha_anulacion: '2026-09-12T11:45:00Z',
    items: [
      {
        id: 'fcd-0001-1',
        ficha_id: 'fc-aurea-0001',
        insumo_id: INSUMO_INCA_KOLA_ID,
        insumo_nombre: 'Inca Kola 500ml',
        unidad_medida: 'botella',
        cantidad: 404.54,
        precio_unitario: 2.2,
        subtotal: 890.0,
        costo_anterior: 2.2,
        variacion_porcentaje: 0.0,
      },
    ],
  },
];

export const SEMILLAS_PERSONAL_AUREA: EmpleadoDetalleDTO[] = [
  {
    id: 'u-mozo-01',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Carlos Huamán',
    correo: 'chuaman@aurea.pe',
    telefono: '+51 987 654 321',
    rol: 'mozo',
    estado: 'activo',
    ultimo_login: '2026-10-13T12:45:00Z',
    created_at: '2026-08-01T09:00:00Z',
    mesas_activas_count: 3,
    mesas_activas_detalle: [
      {
        mesa_id: 'm1a2b3c4-0004-4000-8000-000000000004',
        mesa_codigo: 'Mesa 04',
        piso_nombre: 'Salón Principal',
        comanda_codigo: 'COM-202610-001',
        monto_actual: 142.5,
        minutos_activa: 35,
      },
      {
        mesa_id: 'm1a2b3c4-0007-4000-8000-000000000007',
        mesa_codigo: 'Mesa 07',
        piso_nombre: 'Terraza Jardín',
        comanda_codigo: 'COM-202610-004',
        monto_actual: 89.0,
        minutos_activa: 18,
      },
      {
        mesa_id: 'm1a2b3c4-0012-4000-8000-000000000012',
        mesa_codigo: 'Mesa 12',
        piso_nombre: 'Barra Cócteles',
        comanda_codigo: 'COM-202610-009',
        monto_actual: 54.0,
        minutos_activa: 10,
      },
    ],
    enlace_whatsapp_link: 'https://wa.me/51987654321?text=Hola%20Carlos%20Huam%C3%A1n%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-02',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Carlos Mendoza',
    correo: 'cmendoza@aurea.pe',
    telefono: '+51 984 555 111',
    rol: 'mozo',
    estado: 'activo',
    ultimo_login: '2026-10-13T11:20:00Z',
    created_at: '2026-08-10T10:00:00Z',
    mesas_activas_count: 0,
    mesas_activas_detalle: [],
    enlace_whatsapp_link: 'https://wa.me/51984555111?text=Hola%20Carlos%20Mendoza%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-03',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Pedro Quispe',
    correo: 'pquispe@aurea.pe',
    telefono: '+51 977 123 456',
    rol: 'mozo',
    estado: 'activo',
    ultimo_login: '2026-10-13T13:00:00Z',
    created_at: '2026-08-15T09:30:00Z',
    mesas_activas_count: 1,
    mesas_activas_detalle: [
      {
        mesa_id: 'm1a2b3c4-0002-4000-8000-000000000002',
        mesa_codigo: 'Mesa 02',
        piso_nombre: 'Salón Principal',
        comanda_codigo: 'COM-202610-008',
        monto_actual: 68.0,
        minutos_activa: 12,
      },
    ],
    enlace_whatsapp_link: 'https://wa.me/51977123456?text=Hola%20Pedro%20Quispe%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-04',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Lucía Ramos',
    correo: 'lramos@aurea.pe',
    telefono: '+51 993 456 789',
    rol: 'mozo',
    estado: 'activo',
    ultimo_login: '2026-10-13T10:15:00Z',
    created_at: '2026-09-01T08:00:00Z',
    mesas_activas_count: 0,
    mesas_activas_detalle: [],
    enlace_whatsapp_link: 'https://wa.me/51993456789?text=Hola%20Luc%C3%ADa%20Ramos%2C%20bienvenida%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-05',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Mateo Rivas',
    correo: 'mrivas@aurea.pe',
    telefono: '+51 965 222 333',
    rol: 'mozo',
    estado: 'activo',
    ultimo_login: '2026-10-12T20:40:00Z',
    created_at: '2026-09-10T11:00:00Z',
    mesas_activas_count: 0,
    mesas_activas_detalle: [],
    enlace_whatsapp_link: 'https://wa.me/51965222333?text=Hola%20Mateo%20Rivas%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-06',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Sofía Delgado',
    correo: 'sdelgado@aurea.pe',
    telefono: '+51 981 999 111',
    rol: 'mozo',
    estado: 'activo',
    ultimo_login: '2026-10-13T12:00:00Z',
    created_at: '2026-09-15T09:00:00Z',
    mesas_activas_count: 0,
    mesas_activas_detalle: [],
    enlace_whatsapp_link: 'https://wa.me/51981999111?text=Hola%20Sof%C3%ADa%20Delgado%2C%20bienvenida%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-cocina-01',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Roberto Vargas',
    correo: 'rvargas@aurea.pe',
    telefono: '+51 954 111 888',
    rol: 'cocina',
    estado: 'activo',
    ultimo_login: '2026-10-13T13:10:00Z',
    created_at: '2026-06-15T07:00:00Z',
    mesas_activas_count: 0,
    enlace_whatsapp_link: 'https://wa.me/51954111888?text=Hola%20Roberto%20Vargas%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-cocina-02',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Andrés Paredes',
    correo: 'aparedes@aurea.pe',
    telefono: '+51 941 777 999',
    rol: 'cocina',
    estado: 'activo',
    ultimo_login: '2026-10-13T12:00:00Z',
    created_at: '2026-07-01T07:30:00Z',
    mesas_activas_count: 0,
    enlace_whatsapp_link: 'https://wa.me/51941777999?text=Hola%20Andr%C3%A9s%20Paredes%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-cocina-03',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Elena Castro',
    correo: 'ecastro@aurea.pe',
    telefono: '+51 962 888 444',
    rol: 'cocina',
    estado: 'activo',
    ultimo_login: '2026-10-13T09:30:00Z',
    created_at: '2026-08-01T07:00:00Z',
    mesas_activas_count: 0,
    enlace_whatsapp_link: 'https://wa.me/51962888444?text=Hola%20Elena%20Castro%2C%20bienvenida%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-cocina-04',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Miguel Rojas',
    correo: 'mrojas@aurea.pe',
    telefono: '+51 951 333 666',
    rol: 'cocina',
    estado: 'activo',
    ultimo_login: '2026-10-12T22:15:00Z',
    created_at: '2026-08-20T08:00:00Z',
    mesas_activas_count: 0,
    enlace_whatsapp_link: 'https://wa.me/51951333666?text=Hola%20Miguel%20Rojas%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-cajero-01',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Lucía Quispe',
    correo: 'lquispe@aurea.pe',
    telefono: '+51 971 000 222',
    rol: 'cajero',
    estado: 'activo',
    ultimo_login: '2026-10-13T13:20:00Z',
    created_at: '2026-06-01T08:00:00Z',
    mesas_activas_count: 0,
    tiene_caja_abierta: true,
    enlace_whatsapp_link: 'https://wa.me/51971000222?text=Hola%20Luc%C3%ADa%20Quispe%2C%20bienvenida%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-cajero-02',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Fernando Gil',
    correo: 'fgil@aurea.pe',
    telefono: '+51 998 333 555',
    rol: 'cajero',
    estado: 'activo',
    ultimo_login: '2026-10-11T16:00:00Z',
    created_at: '2026-07-15T08:30:00Z',
    mesas_activas_count: 0,
    tiene_caja_abierta: false,
    enlace_whatsapp_link: 'https://wa.me/51998333555?text=Hola%20Fernando%20Gil%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-07',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Jorge Campos',
    correo: 'jcampos@aurea.pe',
    telefono: '+51 988 444 777',
    rol: 'mozo',
    estado: 'inactivo',
    ultimo_login: '2026-10-05T18:00:00Z',
    created_at: '2026-07-20T08:30:00Z',
    mesas_activas_count: 0,
    mesas_activas_detalle: [],
    enlace_whatsapp_link: 'https://wa.me/51988444777?text=Hola%20Jorge%20Campos%2C%20bienvenido%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
  {
    id: 'u-mozo-08',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Patricia Solís',
    correo: 'psolis@aurea.pe',
    telefono: '+51 975 666 888',
    rol: 'mozo',
    estado: 'inactivo',
    ultimo_login: '2026-09-28T14:00:00Z',
    created_at: '2026-05-10T09:00:00Z',
    mesas_activas_count: 0,
    mesas_activas_detalle: [],
    enlace_whatsapp_link: 'https://wa.me/51975666888?text=Hola%20Patricia%20Sol%C3%ADs%2C%20bienvenida%20al%20equipo%20de%20%C3%81urea%20Miraflores.',
  },
];

// =============================================================================
// SEMILLAS CANÓNICAS CU-ADMIN-09: HORARIO DE ATENCIÓN Y FERIADOS DEL LOCAL
// =============================================================================

export const SEMILLAS_HORARIO_AUREA: DiaHorarioDTO[] = [
  {
    dia_semana: 1,
    nombre_dia: 'Lunes',
    atiende: true,
    turnos: [
      { id: 't-lun-1', nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
      { id: 't-lun-2', nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
    ],
  },
  {
    dia_semana: 2,
    nombre_dia: 'Martes',
    atiende: true,
    turnos: [
      { id: 't-mar-1', nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
      { id: 't-mar-2', nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
    ],
  },
  {
    dia_semana: 3,
    nombre_dia: 'Miércoles',
    atiende: true,
    turnos: [
      { id: 't-mie-1', nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
      { id: 't-mie-2', nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
    ],
  },
  {
    dia_semana: 4,
    nombre_dia: 'Jueves',
    atiende: true,
    turnos: [
      { id: 't-jue-1', nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
      { id: 't-jue-2', nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
    ],
  },
  {
    dia_semana: 5,
    nombre_dia: 'Viernes',
    atiende: true,
    turnos: [
      { id: 't-vie-1', nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
      { id: 't-vie-2', nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '00:30' },
    ],
  },
  {
    dia_semana: 6,
    nombre_dia: 'Sábado',
    atiende: true,
    turnos: [
      { id: 't-sab-1', nombre_turno: 'Horario Continuo', hora_inicio: '12:00', hora_fin: '00:30' },
    ],
  },
  {
    dia_semana: 7,
    nombre_dia: 'Domingo',
    atiende: true,
    turnos: [
      { id: 't-dom-1', nombre_turno: 'Almuerzo Familiar', hora_inicio: '12:00', hora_fin: '18:00' },
    ],
  },
];

export const SEMILLAS_EXCEPCIONES_AUREA: ExcepcionHorarioDTO[] = [
  {
    id: 'exc-2026-07-28',
    local_id: CANONICAL_LOCAL_ID,
    fecha: '2026-07-28',
    cerrado: true,
    hora_inicio: null,
    hora_fin: null,
    motivo: 'Fiestas Patrias (Independencia del Perú)',
    created_at: '2026-01-15T10:00:00.000Z',
    created_by: 'Administrador Áurea',
  },
  {
    id: 'exc-2026-07-29',
    local_id: CANONICAL_LOCAL_ID,
    fecha: '2026-07-29',
    cerrado: false,
    hora_inicio: '12:00',
    hora_fin: '17:00',
    motivo: 'Fiestas Patrias (Horario Especial Feriado)',
    created_at: '2026-01-15T10:05:00.000Z',
    created_by: 'Administrador Áurea',
  },
  {
    id: 'exc-2026-11-01',
    local_id: CANONICAL_LOCAL_ID,
    fecha: '2026-11-01',
    cerrado: true,
    hora_inicio: null,
    hora_fin: null,
    motivo: 'Día de Todos los Santos (Cierre por Descanso del Personal)',
    created_at: '2026-01-15T10:10:00.000Z',
    created_by: 'Administrador Áurea',
  },
  {
    id: 'exc-2026-12-25',
    local_id: CANONICAL_LOCAL_ID,
    fecha: '2026-12-25',
    cerrado: true,
    hora_inicio: null,
    hora_fin: null,
    motivo: 'Navidad (Cierre Anual Obligatorio)',
    created_at: '2026-01-15T10:15:00.000Z',
    created_by: 'Administrador Áurea',
    reservas_canceladas_count: 0,
  },
  {
    id: 'exc-2027-01-01',
    local_id: CANONICAL_LOCAL_ID,
    fecha: '2027-01-01',
    cerrado: true,
    hora_inicio: null,
    hora_fin: null,
    motivo: 'Año Nuevo (Feriado Oficial)',
    created_at: '2026-01-15T10:20:00.000Z',
    created_by: 'Administrador Áurea',
  },
];

export const SEMILLAS_RESERVAS_CONFLICTO_AUREA: ReservaConflictoDTO[] = [
  {
    id: 'res-nav-001',
    cliente_nombre: 'María Flores Valdivia',
    cliente_telefono: '+51 987 654 321',
    fecha_hora: '2026-12-25T13:30:00',
    num_personas: 4,
    mesas_asignadas: ['Mesa 04 (Salón Principal)'],
    link_whatsapp:
      'https://wa.me/51987654321?text=' +
      encodeURIComponent(
        'Estimada María Flores Valdivia, le saludamos del Restaurante Áurea Miraflores. Nos comunicamos para informarle que debido al feriado de Navidad (25 de Diciembre) nuestro local permanecerá cerrado. Quisiéramos asistirla para reprogramar su reserva de 4 personas o coordinar una atención prioritaria en otra fecha. Quedamos atentos a su gentil respuesta.'
      ),
    notificado: false,
    metodo_notificacion: 'ninguno',
  },
  {
    id: 'res-nav-002',
    cliente_nombre: 'Jorge Ramos Quispe',
    cliente_telefono: '+51 991 223 344',
    fecha_hora: '2026-12-25T14:00:00',
    num_personas: 6,
    mesas_asignadas: ['Mesa 08 (Terraza Exterior)'],
    link_whatsapp:
      'https://wa.me/51991223344?text=' +
      encodeURIComponent(
        'Estimado Jorge Ramos Quispe, le saludamos del Restaurante Áurea Miraflores. Nos comunicamos para informarle que debido al feriado de Navidad (25 de Diciembre) nuestro local permanecerá cerrado. Quisiéramos asistirlo para reprogramar su reserva de 6 personas o coordinar una atención prioritaria en otra fecha. Quedamos atentos a su gentil respuesta.'
      ),
    notificado: false,
    metodo_notificacion: 'ninguno',
  },
  {
    id: 'res-nav-003',
    cliente_nombre: 'Ana Castillo Benavides',
    cliente_telefono: '+51 976 543 210',
    fecha_hora: '2026-12-25T20:30:00',
    num_personas: 2,
    mesas_asignadas: ['Mesa 02 (Salón Principal)'],
    link_whatsapp:
      'https://wa.me/51976543210?text=' +
      encodeURIComponent(
        'Estimada Ana Castillo Benavides, le saludamos del Restaurante Áurea Miraflores. Nos comunicamos para informarle que debido al feriado de Navidad (25 de Diciembre) nuestro local permanecerá cerrado. Quisiéramos asistirla para reprogramar su reserva de 2 personas o coordinar una atención prioritaria en otra fecha. Quedamos atentos a su gentil respuesta.'
      ),
    notificado: false,
    metodo_notificacion: 'ninguno',
  },
];

export const FERIADOS_PERU_2026_DEFAULT = [
  { fecha: '2026-01-01', motivo: 'Año Nuevo' },
  { fecha: '2026-04-02', motivo: 'Jueves Santo' },
  { fecha: '2026-04-03', motivo: 'Viernes Santo' },
  { fecha: '2026-05-01', motivo: 'Día del Trabajo' },
  { fecha: '2026-06-07', motivo: 'Batalla de Arica y Día de la Bandera' },
  { fecha: '2026-06-29', motivo: 'San Pedro y San Pablo' },
  { fecha: '2026-07-23', motivo: 'Día de la Fuerza Aérea del Perú' },
  { fecha: '2026-07-28', motivo: 'Fiestas Patrias (Independencia del Perú)' },
  { fecha: '2026-07-29', motivo: 'Fiestas Patrias (Gloriosas FF.AA. y PNP)' },
  { fecha: '2026-08-06', motivo: 'Batalla de Junín' },
  { fecha: '2026-08-30', motivo: 'Santa Rosa de Lima' },
  { fecha: '2026-10-08', motivo: 'Combate de Angamos' },
  { fecha: '2026-11-01', motivo: 'Día de Todos los Santos' },
  { fecha: '2026-12-08', motivo: 'Inmaculada Concepción' },
  { fecha: '2026-12-09', motivo: 'Batalla de Ayacucho' },
  { fecha: '2026-12-25', motivo: 'Navidad' },
];

// =============================================================================
// SEMILLAS CANÓNICAS CU-ADMIN-10: POLÍTICAS Y PARÁMETROS DE RESERVAS
// =============================================================================
export const SEMILLA_POLITICAS_RESERVA_AUREA: PoliticasReservaDTO = {
  local_id: CANONICAL_LOCAL_ID,
  acepta_reservas: true,
  duracion_reserva_min: 90,
  buffer_reserva_min: 15,
  tolerancia_no_show_min: 15,
  minutos_bloqueo_previo: 30,
  margen_recordatorio_min: 120,
  anticipacion_minima_horas: 2,
  anticipacion_maxima_dias: 30,
  updated_at: '2026-10-08T18:20:00Z',
};

export const SEMILLAS_RESERVAS_FUTURAS_AUREA: ReservaResumenDTO[] = [
  {
    id: 'c1a2b3d4-0001-4000-8000-000000000001',
    cliente: 'Carlos Mendoza',
    telefono: '+51 987 654 321',
    fecha_hora: '2026-10-14T14:00:00Z',
    pax: 4,
    mesas: ['Mesa 04'],
  },
  {
    id: 'c1a2b3d4-0002-4000-8000-000000000002',
    cliente: 'Lucía Benítez',
    telefono: '+51 912 345 678',
    fecha_hora: '2026-10-15T20:30:00Z',
    pax: 2,
    mesas: ['Mesa 02'],
  },
  {
    id: 'c1a2b3d4-0003-4000-8000-000000000003',
    cliente: 'Empresa Graña',
    telefono: '+51 998 877 665',
    fecha_hora: '2026-10-17T13:00:00Z',
    pax: 8,
    mesas: ['Mesa 07', 'Mesa 08'],
  },
];

// =============================================================================
// SEMILLAS CANÓNICAS CU-ADMIN-11: HISTORIAL DE INCIDENTES (02_schema_ddl.sql)
// =============================================================================
export const SEMILLAS_INCIDENTES_AUREA: IncidenteDetalleDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000601',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'INC-2026-001',
    titulo: 'Retraso de preparación en mesa 02',
    categoria: 'servicio_cliente',
    gravedad: 'alta',
    fecha_hora: '2026-10-12T13:45:00Z',
    empleado_id: '00000000-0000-4000-8000-000000000104',
    empleado_nombre: 'Lucía Paredes (Moza)',
    descripcion: 'La comanda 148 superó el tiempo objetivo de preparación durante el turno de almuerzo.',
    medidas_inmediatas: 'Se informó al cliente y se priorizó el plato principal en KDS.',
    foto_url: 'privado/empresas/aurea/incidentes/INC-2026-001/evidencia.jpg',
    registrado_por: '00000000-0000-4000-8000-000000000102',
    registrador_nombre: 'Marcos López (Administrador)',
    estado: 'abierto',
    visto_por_propietario: true,
    fecha_visto: '2026-10-12T14:10:00Z',
    nota_propietario: null,
    motivo_revision: null,
    resolucion_nota: null,
    resuelto_por: null,
    resuelto_por_nombre: null,
    fecha_resolucion: null,
    bitacora: [
      {
        id: 'bit-0000-0001',
        incidente_id: '00000000-0000-4000-8000-000000000601',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Se registró la novedad por demora en comanda 148 de mesa 02.',
        created_at: '2026-10-12T13:50:00Z',
      },
    ],
    created_at: '2026-10-12T13:50:00Z',
    updated_at: '2026-10-12T13:50:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000685',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'INC-2026-085',
    titulo: 'Diferencia negativa en arqueo de turno tarde',
    categoria: 'caja_dinero',
    gravedad: 'alta',
    fecha_hora: '2026-10-11T14:15:00Z',
    empleado_id: '00000000-0000-4000-8000-000000000106',
    empleado_nombre: 'Carlos Mendoza (Cajero)',
    descripcion: 'Durante el cuadre intermedio de caja de las 14:00 hrs se detectó un faltante de S/ 85.00 con respecto al reporte emitido por el POS.',
    medidas_inmediatas: 'Se realizó un segundo conteo físico de gaveta y se aisló el reporte.',
    foto_url: 'privado/empresas/aurea/incidentes/INC-2026-085/arqueo_caja_tarde.jpg',
    registrado_por: '00000000-0000-4000-8000-000000000102',
    registrador_nombre: 'Marcos López (Administrador)',
    estado: 'en_revision',
    visto_por_propietario: true,
    fecha_visto: '2026-10-11T16:00:00Z',
    nota_propietario: 'Cruzar con el reporte de transacciones electrónicas del proveedor POS y tomar declaración formal del cajero. Si el descuadre se debe a falla de sistema, conciliar con el banco; de lo contrario aplicar política.',
    motivo_revision: 'A la espera de la conciliación de lotes con la pasarela bancaria externa.',
    resolucion_nota: null,
    resuelto_por: null,
    resuelto_por_nombre: null,
    fecha_resolucion: null,
    bitacora: [
      {
        id: 'bit-0000-0085-1',
        incidente_id: '00000000-0000-4000-8000-000000000685',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Apertura de caso por faltante de S/ 85.00 en arqueo de caja turno tarde.',
        created_at: '2026-10-11T14:30:00Z',
      },
      {
        id: 'bit-0000-0085-2',
        incidente_id: '00000000-0000-4000-8000-000000000685',
        usuario_id: '00000000-0000-4000-8000-000000000101',
        usuario_nombre: 'Roberto Silva (Propietario)',
        usuario_rol: 'propietario',
        tipo_evento: 'directiva_propietario',
        nota: 'Cruzar con el reporte de transacciones electrónicas del proveedor POS y tomar declaración formal del cajero. Si el descuadre se debe a falla de sistema, conciliar con el banco; de lo contrario aplicar política.',
        created_at: '2026-10-11T16:00:00Z',
      },
      {
        id: 'bit-0000-0085-3',
        incidente_id: '00000000-0000-4000-8000-000000000685',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'indagacion',
        nota: 'Se tomó declaración formal a Carlos Mendoza (Cajero) y se emitió solicitud formal de conciliación al proveedor POS (Niubiz).',
        created_at: '2026-10-12T10:30:00Z',
      },
    ],
    created_at: '2026-10-11T14:30:00Z',
    updated_at: '2026-10-11T16:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000684',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'INC-2026-084',
    titulo: 'Corte en mano en cocina caliente',
    categoria: 'seguridad_higiene',
    gravedad: 'alta',
    fecha_hora: '2026-10-12T18:15:00Z',
    empleado_id: '00000000-0000-4000-8000-000000000104',
    empleado_nombre: 'David Méndez (Ayudante Cocina)',
    descripcion: 'Durante el turno cena, el colaborador sufrió un corte superficial al maniobrar cuchillo de fileteo. Se brindó primeros auxilios inmediatos con el botiquín del local y se derivó a la posta médica por precaución para descarte de sutura. El área de cocina quedó desinfectada y operativa sin interrumpir el servicio.',
    medidas_inmediatas: 'Curación de emergencia, vendaje compresivo y relevo de turno con cocinero B. Área operativa y desinfectada.',
    foto_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    registrado_por: '00000000-0000-4000-8000-000000000102',
    registrador_nombre: 'Marcos López (Administrador)',
    estado: 'abierto',
    visto_por_propietario: false,
    fecha_visto: null,
    nota_propietario: null,
    motivo_revision: null,
    resolucion_nota: null,
    resuelto_por: null,
    resuelto_por_nombre: null,
    fecha_resolucion: null,
    bitacora: [
      {
        id: 'bit-0000-0084-1',
        incidente_id: '00000000-0000-4000-8000-000000000684',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Registro de accidente de trabajo menor: corte en mano izquierda en cocina caliente.',
        created_at: '2026-10-12T18:20:00Z',
      },
    ],
    created_at: '2026-10-12T18:20:00Z',
    updated_at: '2026-10-12T18:20:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000683',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'INC-2026-083',
    titulo: 'Queja de comensal por demora en entrega de postre',
    categoria: 'servicio_cliente',
    gravedad: 'baja',
    fecha_hora: '2026-10-05T13:10:00Z',
    empleado_id: '00000000-0000-4000-8000-000000000104',
    empleado_nombre: 'Lucía Paredes (Moza)',
    descripcion: 'Mesa 04 manifestó incomodidad debido a que el Suspiro a la Limeña tardó más de 18 minutos.',
    medidas_inmediatas: 'Se extendió una disculpa cordial y se ofreció café de cortesía.',
    foto_url: null,
    registrado_por: '00000000-0000-4000-8000-000000000102',
    registrador_nombre: 'Marcos López (Administrador)',
    estado: 'resuelto',
    visto_por_propietario: true,
    fecha_visto: '2026-10-05T15:00:00Z',
    nota_propietario: null,
    motivo_revision: null,
    resolucion_nota: 'Se calibró el flujo de despacho en el área de repostería y el cliente se retiró satisfecho con la atención brindada.',
    resuelto_por: '00000000-0000-4000-8000-000000000102',
    resuelto_por_nombre: 'Marcos López (Administrador)',
    fecha_resolucion: '2026-10-05T14:30:00Z',
    bitacora: [
      {
        id: 'bit-0000-0083-1',
        incidente_id: '00000000-0000-4000-8000-000000000683',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Registro de queja por demora en despacho de postre.',
        created_at: '2026-10-05T13:20:00Z',
      },
      {
        id: 'bit-0000-0083-2',
        incidente_id: '00000000-0000-4000-8000-000000000683',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'resolucion',
        nota: 'Se calibró el flujo de despacho en el área de repostería y el cliente se retiró satisfecho con la atención brindada.',
        created_at: '2026-10-05T14:30:00Z',
      },
    ],
    created_at: '2026-10-05T13:20:00Z',
    updated_at: '2026-10-05T14:30:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000682',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'INC-2026-082',
    titulo: 'Falla temporal de termostato en freidora de papas',
    categoria: 'seguridad_higiene',
    gravedad: 'media',
    fecha_hora: '2026-10-03T18:45:00Z',
    empleado_id: null,
    empleado_nombre: null,
    descripcion: 'La freidora N° 2 presentó descalibración térmica alcanzando 210°C, requiriendo apagado preventivo.',
    medidas_inmediatas: 'Se derivó la producción a la freidora de respaldo en cocina caliente.',
    foto_url: null,
    registrado_por: '00000000-0000-4000-8000-000000000102',
    registrador_nombre: 'Marcos López (Administrador)',
    estado: 'resuelto',
    visto_por_propietario: false,
    fecha_visto: null,
    nota_propietario: null,
    motivo_revision: null,
    resolucion_nota: 'Servicio técnico de Equipamiento Gastronómico SAC reemplazó la sonda térmica y emitió certificado de calibración.',
    resuelto_por: '00000000-0000-4000-8000-000000000102',
    resuelto_por_nombre: 'Marcos López (Administrador)',
    fecha_resolucion: '2026-10-04T11:00:00Z',
    bitacora: [
      {
        id: 'bit-0000-0082-1',
        incidente_id: '00000000-0000-4000-8000-000000000682',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Registro de falla técnica por sobrecalentamiento en freidora de papas N° 2.',
        created_at: '2026-10-03T19:00:00Z',
      },
      {
        id: 'bit-0000-0082-2',
        incidente_id: '00000000-0000-4000-8000-000000000682',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'indagacion',
        nota: 'Se aisló el equipo y se coordinó peritaje con Equipamiento Gastronómico SAC.',
        created_at: '2026-10-03T21:00:00Z',
      },
      {
        id: 'bit-0000-0082-3',
        incidente_id: '00000000-0000-4000-8000-000000000682',
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'resolucion',
        nota: 'Servicio técnico de Equipamiento Gastronómico SAC reemplazó la sonda térmica y emitió certificado de calibración.',
        created_at: '2026-10-04T11:00:00Z',
      },
    ],
    created_at: '2026-10-03T19:00:00Z',
    updated_at: '2026-10-04T11:00:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000680',
    local_id: CANONICAL_LOCAL_SAN_ISIDRO_ID,
    codigo: 'INC-2026-080',
    titulo: 'Rotura vajilla (6 platos colección)',
    categoria: 'rotura_merma',
    gravedad: 'media',
    fecha_hora: '2026-10-12T14:30:00Z',
    empleado_id: '00000000-0000-4000-8000-000000000108',
    empleado_nombre: 'Carlos Gómez (Mozo)',
    descripcion: 'Durante el despacho de almuerzo en el salón principal de Sede San Isidro se quebraron 6 platos de la vajilla de autor al resbalar de la bandeja de traslado.',
    medidas_inmediatas: 'Aislamiento de la zona, limpieza inmediata de restos cerámicos y reposición de la vajilla desde bodega.',
    foto_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
    registrado_por: '00000000-0000-4000-8000-000000000107',
    registrador_nombre: 'Diana Alarcón (Admin San Isidro)',
    estado: 'abierto',
    visto_por_propietario: false,
    fecha_visto: null,
    nota_propietario: null,
    motivo_revision: null,
    resolucion_nota: null,
    resuelto_por: null,
    resuelto_por_nombre: null,
    fecha_resolucion: null,
    bitacora: [
      {
        id: 'bit-0000-0080-1',
        incidente_id: '00000000-0000-4000-8000-000000000680',
        usuario_id: '00000000-0000-4000-8000-000000000107',
        usuario_nombre: 'Diana Alarcón (Admin San Isidro)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Registro de merma por rotura de vajilla artesanal de colección en salón.',
        created_at: '2026-10-12T14:40:00Z',
      },
    ],
    created_at: '2026-10-12T14:40:00Z',
    updated_at: '2026-10-12T14:40:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000679',
    local_id: CANONICAL_LOCAL_SAN_ISIDRO_ID,
    codigo: 'INC-2026-079',
    titulo: 'Tardanza reiterada de personal de cocina',
    categoria: 'disciplinario',
    gravedad: 'baja',
    fecha_hora: '2026-10-08T11:20:00Z',
    empleado_id: '00000000-0000-4000-8000-000000000109',
    empleado_nombre: 'Miguel Luna (Cocinero)',
    descripcion: 'El colaborador acumuló 3 tardanzas consecutivas de más de 30 minutos al turno de apertura en Sede San Isidro sin aviso previo.',
    medidas_inmediatas: 'Entrevista de orientación con administración y registro de compromiso escrito.',
    foto_url: null,
    registrado_por: '00000000-0000-4000-8000-000000000107',
    registrador_nombre: 'Diana Alarcón (Admin San Isidro)',
    estado: 'resuelto',
    visto_por_propietario: true,
    fecha_visto: '2026-10-09T09:15:00Z',
    nota_propietario: null,
    motivo_revision: null,
    resolucion_nota: 'El colaborador firmó acuerdo de cumplimiento de horario y se regularizó el registro biométrico de asistencia.',
    resuelto_por: '00000000-0000-4000-8000-000000000107',
    resuelto_por_nombre: 'Diana Alarcón (Admin San Isidro)',
    fecha_resolucion: '2026-10-09T10:00:00Z',
    bitacora: [
      {
        id: 'bit-0000-0079-1',
        incidente_id: '00000000-0000-4000-8000-000000000679',
        usuario_id: '00000000-0000-4000-8000-000000000107',
        usuario_nombre: 'Diana Alarcón (Admin San Isidro)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: 'Apertura de caso disciplinario por reiteradas tardanzas sin justificación.',
        created_at: '2026-10-08T11:30:00Z',
      },
      {
        id: 'bit-0000-0079-2',
        incidente_id: '00000000-0000-4000-8000-000000000679',
        usuario_id: '00000000-0000-4000-8000-000000000107',
        usuario_nombre: 'Diana Alarcón (Admin San Isidro)',
        usuario_rol: 'admin_local',
        tipo_evento: 'resolucion',
        nota: 'El colaborador firmó acuerdo de cumplimiento de horario y se regularizó el registro biométrico de asistencia.',
        created_at: '2026-10-09T10:00:00Z',
      },
    ],
    created_at: '2026-10-08T11:30:00Z',
    updated_at: '2026-10-09T10:00:00Z',
  },
];

// =============================================================================
// SEMILLAS CANÓNICAS CU-ADMIN-12: AUDITORÍA DE ANULACIONES (02_schema_ddl.sql)
// =============================================================================
export const SEMILLAS_ANULACIONES_AUREA: PedidoAnulacionItemDTO[] = [
  {
    id: 'anul-0000-0042',
    codigo: 'ANUL-2026-042',
    local_id: CANONICAL_LOCAL_ID,
    pedido_id: 'ped-0000-0154',
    pedido_item_id: 'item-0000-0154-1',
    tipo_anulacion: 'item_individual',
    mesa_id: 'm1a2b3c4-0001-4000-8000-000000000004',
    mesa_numero: 'Mesa 04',
    producto_id: 'prod-0000-0001',
    producto_nombre: '1x Lomo Saltado Criollo',
    cantidad: 1,
    precio_unitario: 38.0,
    monto_total: 38.0,
    mozo_id: '00000000-0000-4000-8000-000000000103',
    mozo_nombre: 'Carlos Mendoza',
    anulado_por: '00000000-0000-4000-8000-000000000103',
    anulado_por_nombre: 'Carlos Mendoza (Mozo)',
    motivo_categoria: 'demora_cliente',
    motivo_detalle: 'El comensal lleva esperando más de 25 minutos y solicita retirar el plato porque ya debe retirarse a una reunión urgente. Se verificó con cocina que aún estaba en wok.',
    pedido_created_at: '2026-10-09T13:50:12Z',
    anulado_at: '2026-10-09T14:15:30Z',
    minutos_espera: 25,
    estado_anterior: 'en_preparacion',
    es_merma: false,
    costo_merma: null,
    revisado: false,
    revisado_por: null,
    revisado_por_nombre: null,
    revisado_at: null,
    notas_supervision: null,
    incidente_id: null,
    incidente_codigo: null,
    partida_cocina: 'Pase Caliente (Wok 1)',
    created_at: '2026-10-09T14:15:30Z',
  },
  {
    id: 'anul-0000-0041',
    codigo: 'ANUL-2026-041',
    local_id: CANONICAL_LOCAL_ID,
    pedido_id: 'ped-0000-0151',
    pedido_item_id: null,
    tipo_anulacion: 'comanda_completa',
    mesa_id: 'm1a2b3c4-0001-4000-8000-000000000001',
    mesa_numero: 'Mesa 01',
    producto_id: null,
    producto_nombre: 'Comanda Total #151 (4 platos)',
    cantidad: 4,
    precio_unitario: 28.5,
    monto_total: 114.0,
    mozo_id: '00000000-0000-4000-8000-000000000104',
    mozo_nombre: 'Ana Paredes',
    anulado_por: '00000000-0000-4000-8000-000000000104',
    anulado_por_nombre: 'Ana Paredes (Moza)',
    motivo_categoria: 'retiro_sin_consumo',
    motivo_detalle: 'Mesa familiar tuvo una emergencia personal sobrevenida y se retiró del local antes de que los platos empezaran a prepararse en cocina.',
    pedido_created_at: '2026-10-09T13:40:00Z',
    anulado_at: '2026-10-09T13:48:10Z',
    minutos_espera: 8,
    estado_anterior: 'en_cola',
    es_merma: false,
    costo_merma: null,
    revisado: false,
    revisado_por: null,
    revisado_por_nombre: null,
    revisado_at: null,
    notas_supervision: null,
    incidente_id: null,
    incidente_codigo: null,
    partida_cocina: 'Múltiples partidas',
    created_at: '2026-10-09T13:48:10Z',
  },
  {
    id: 'anul-0000-0040',
    codigo: 'ANUL-2026-040',
    local_id: CANONICAL_LOCAL_ID,
    pedido_id: 'ped-0000-0149',
    pedido_item_id: 'item-0000-0149-2',
    tipo_anulacion: 'item_individual',
    mesa_id: 'm1a2b3c4-0001-4000-8000-000000000002',
    mesa_numero: 'Mesa [ 02 ; 03 ]',
    producto_id: 'prod-0000-0002',
    producto_nombre: '1x Causa Limeña Pollo',
    cantidad: 1,
    precio_unitario: 24.0,
    monto_total: 24.0,
    mozo_id: '00000000-0000-4000-8000-000000000103',
    mozo_nombre: 'Carlos Mendoza',
    anulado_por: '00000000-0000-4000-8000-000000000103',
    anulado_por_nombre: 'Carlos Mendoza (Mozo)',
    motivo_categoria: 'queja_calidad',
    motivo_detalle: 'Cliente indicó sabor ácido excesivo y consistencia pasada en la palta. Se retiró el plato de la mesa y se ofreció reemplazo.',
    pedido_created_at: '2026-10-09T13:08:00Z',
    anulado_at: '2026-10-09T13:22:45Z',
    minutos_espera: 14,
    estado_anterior: 'servido',
    es_merma: true,
    costo_merma: 8.5,
    revisado: true,
    revisado_por: '00000000-0000-4000-8000-000000000102',
    revisado_por_nombre: 'Marcos López (Administrador)',
    revisado_at: '2026-10-09T14:00:00Z',
    notas_supervision: 'Se auditó con cocina fría y se descartó el lote de palta madura.',
    incidente_id: null,
    incidente_codigo: null,
    partida_cocina: 'Cocina Fría',
    created_at: '2026-10-09T13:22:45Z',
  },
  {
    id: 'anul-0000-0039',
    codigo: 'ANUL-2026-039',
    local_id: CANONICAL_LOCAL_ID,
    pedido_id: 'ped-0000-0145',
    pedido_item_id: 'item-0000-0145-1',
    tipo_anulacion: 'item_individual',
    mesa_id: 'm1a2b3c4-0001-4000-8000-000000000006',
    mesa_numero: 'Mesa 06',
    producto_id: 'prod-0000-0010',
    producto_nombre: '2x Chicha Morada 1L',
    cantidad: 2,
    precio_unitario: 10.0,
    monto_total: 20.0,
    mozo_id: '00000000-0000-4000-8000-000000000103',
    mozo_nombre: 'Carlos Mendoza',
    anulado_por: '00000000-0000-4000-8000-000000000103',
    anulado_por_nombre: 'Carlos Mendoza (Mozo)',
    motivo_categoria: 'error_registro',
    motivo_detalle: 'Mozo digitó por error 2 jarras en comanda móvil cuando la mesa solo solicitó 1 unidad. La jarra sobrante quedó sellada en bar.',
    pedido_created_at: '2026-10-09T12:43:00Z',
    anulado_at: '2026-10-09T12:45:12Z',
    minutos_espera: 2,
    estado_anterior: 'listo',
    es_merma: false,
    costo_merma: null,
    revisado: true,
    revisado_por: '00000000-0000-4000-8000-000000000102',
    revisado_por_nombre: 'Marcos López (Administrador)',
    revisado_at: '2026-10-09T13:00:00Z',
    notas_supervision: 'Corregido inmediatamente en comanda de barra.',
    incidente_id: null,
    incidente_codigo: null,
    partida_cocina: 'Barra y Bebidas',
    created_at: '2026-10-09T12:45:12Z',
  },
  {
    id: 'anul-0000-0038',
    codigo: 'ANUL-2026-038',
    local_id: CANONICAL_LOCAL_ID,
    pedido_id: 'ped-0000-0140',
    pedido_item_id: 'item-0000-0140-1',
    tipo_anulacion: 'item_individual',
    mesa_id: 'm1a2b3c4-0001-4000-8000-000000000008',
    mesa_numero: 'Mesa 08',
    producto_id: 'prod-0000-0004',
    producto_nombre: '1x Seco de Res con Frijoles',
    cantidad: 1,
    precio_unitario: 42.0,
    monto_total: 42.0,
    mozo_id: '00000000-0000-4000-8000-000000000104',
    mozo_nombre: 'Ana Paredes',
    anulado_por: '00000000-0000-4000-8000-000000000104',
    anulado_por_nombre: 'Ana Paredes (Moza)',
    motivo_categoria: 'queja_calidad',
    motivo_detalle: 'Comensal indicó que la carne de res presentaba exceso de dureza. Se retiró el plato y se cambió por Lomo Saltado.',
    pedido_created_at: '2026-10-09T11:57:00Z',
    anulado_at: '2026-10-09T12:15:00Z',
    minutos_espera: 18,
    estado_anterior: 'servido',
    es_merma: true,
    costo_merma: 20.0,
    revisado: true,
    revisado_por: '00000000-0000-4000-8000-000000000102',
    revisado_por_nombre: 'Marcos López (Administrador)',
    revisado_at: '2026-10-09T12:30:00Z',
    notas_supervision: 'Se recalibró el tiempo de cocción en olla a presión con la jefa de cocina.',
    incidente_id: null,
    incidente_codigo: null,
    partida_cocina: 'Cocina Caliente (Ollas)',
    created_at: '2026-10-09T12:15:00Z',
  },
];

export const SEMILLAS_NOTIFICACIONES_CAMPANA: NotificacionCampanaDTO[] = [
  {
    id: 'notif-001',
    tipo: 'anulacion_item',
    prioridad: 'alta',
    titulo: 'Anulación en Mesa 04',
    mensaje: '1x Lomo Saltado Criollo (S/ 38.00) por Carlos Mendoza • Motivo: Demora (25m de espera)',
    leido: false,
    anulacion_id: 'anul-0000-0042',
    mesa_numero: 'Mesa 04',
    monto: 38.0,
    created_at: '2026-10-09T14:15:30Z',
  },
  {
    id: 'notif-002',
    tipo: 'anulacion_comanda',
    prioridad: 'critica',
    titulo: 'Comanda Completa Anulada en Mesa 01',
    mensaje: 'Comanda #151 (4 platos • S/ 114.00) por Ana Paredes • Motivo: Retiro sin consumo',
    leido: false,
    anulacion_id: 'anul-0000-0041',
    mesa_numero: 'Mesa 01',
    monto: 114.0,
    created_at: '2026-10-09T13:48:10Z',
  },
  {
    id: 'notif-003',
    tipo: 'stock_minimo',
    prioridad: 'media',
    titulo: 'Alerta de Inventario: Stock Mínimo',
    mensaje: 'Papa amarilla alcanzó 4.5 kg en almacén (Umbral de reposición: 10.0 kg)',
    leido: true,
    created_at: '2026-10-09T12:30:00Z',
  },
];

// =============================================================================
// SEMILLAS CANÓNICAS CU-ADMIN-17: GESTIÓN DE PROMOCIONES (02_schema_ddl.sql)
// =============================================================================

export const SEMILLAS_PROMOCIONES_AUREA: PromocionAdminDTO[] = [
  {
    id: 'promo-0000-0001',
    codigo: 'PROMO-2026-001',
    local_id: CANONICAL_LOCAL_ID,
    nombre: '🎉 Descuento Inaugural',
    descripcion: '15% de descuento en toda la carta por marcha blanca de apertura.',
    tipo_descuento: 'porcentaje',
    valor: 15.0,
    tope_maximo_descuento: null,
    monto_minimo_consumo: 0.0,
    dias_semana: [1, 2, 3, 4, 5, 6, 7],
    hora_inicio: null,
    hora_fin: null,
    fecha_inicio: '2026-10-01',
    fecha_fin: '2026-10-31',
    tipo_limite_usos: 'global',
    limite_usos: 200,
    usos_actuales: 54,
    usos_hoy: 3,
    fecha_ultimo_uso: '2026-10-09',
    activa: true,
    estado_visual: 'vigente',
    total_descontado: 890.0,
    total_ventas_asociadas: 5933.0,
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'promo-0000-0002',
    codigo: 'PROMO-2026-002',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Martes de Brasas',
    descripcion: '20% en carnes y brasas criollas con consumo mínimo de S/ 60.00.',
    tipo_descuento: 'porcentaje',
    valor: 20.0,
    tope_maximo_descuento: 40.0,
    monto_minimo_consumo: 60.0,
    dias_semana: [2],
    hora_inicio: null,
    hora_fin: null,
    fecha_inicio: '2026-09-01',
    fecha_fin: '2026-11-30',
    tipo_limite_usos: 'diario',
    limite_usos: 25,
    usos_actuales: 22,
    usos_hoy: 18,
    fecha_ultimo_uso: '2026-10-09',
    activa: true,
    estado_visual: 'vigente',
    total_descontado: 380.0,
    total_ventas_asociadas: 1900.0,
    created_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'promo-0000-0003',
    codigo: 'PROMO-2026-003',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Happy Hour After-Office',
    descripcion: '25% de descuento en coctelería y piqueos de 18:00 a 21:00.',
    tipo_descuento: 'porcentaje',
    valor: 25.0,
    tope_maximo_descuento: 30.0,
    monto_minimo_consumo: 0.0,
    dias_semana: [1, 2, 3, 4, 5],
    hora_inicio: '18:00',
    hora_fin: '21:00',
    fecha_inicio: '2026-10-01',
    fecha_fin: '2026-12-31',
    tipo_limite_usos: 'diario',
    limite_usos: 15,
    usos_actuales: 10,
    usos_hoy: 5,
    fecha_ultimo_uso: '2026-10-09',
    activa: true,
    estado_visual: 'vigente',
    total_descontado: 150.0,
    total_ventas_asociadas: 600.0,
    created_at: '2026-10-01T15:00:00Z',
  },
  {
    id: 'promo-0000-0004',
    codigo: 'PROMO-2026-004',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Bono Familiar Fin Sem',
    descripcion: 'Deducción fija de S/ 20.00 en consumos familiares superiores a S/ 100.00.',
    tipo_descuento: 'monto_fijo',
    valor: 20.0,
    tope_maximo_descuento: null,
    monto_minimo_consumo: 100.0,
    dias_semana: [6, 7],
    hora_inicio: null,
    hora_fin: null,
    fecha_inicio: '2026-10-18',
    fecha_fin: '2026-11-15',
    tipo_limite_usos: 'diario',
    limite_usos: 30,
    usos_actuales: 0,
    usos_hoy: 0,
    fecha_ultimo_uso: null,
    activa: true,
    estado_visual: 'programada',
    total_descontado: 0.0,
    total_ventas_asociadas: 0.0,
    created_at: '2026-10-05T12:00:00Z',
  },
  {
    id: 'promo-0000-0005',
    codigo: 'PROMO-2026-005',
    local_id: CANONICAL_LOCAL_ID,
    nombre: 'Campaña Primavera',
    descripcion: '10% de descuento general por el mes de la primavera.',
    tipo_descuento: 'porcentaje',
    valor: 10.0,
    tope_maximo_descuento: null,
    monto_minimo_consumo: 0.0,
    dias_semana: [1, 2, 3, 4, 5, 6, 7],
    hora_inicio: null,
    hora_fin: null,
    fecha_inicio: '2026-09-01',
    fecha_fin: '2026-09-30',
    tipo_limite_usos: 'global',
    limite_usos: 100,
    usos_actuales: 45,
    usos_hoy: 0,
    fecha_ultimo_uso: '2026-09-30',
    activa: false,
    estado_visual: 'vencida',
    total_descontado: 520.0,
    total_ventas_asociadas: 5200.0,
    created_at: '2026-08-25T11:00:00Z',
  },
];

export const SEMILLAS_COMPROBANTES_AUDITORIA_PROMO: Record<string, PromocionComprobanteAuditoriaDTO[]> = {
  'promo-0000-0001': [
    {
      id: 'comp-001',
      numero_comprobante: 'B001-000492',
      fecha_hora: '2026-10-09T14:15:00Z',
      mesa_numero: 'Mesa 05',
      cajero_nombre: 'Carlos Mendoza',
      subtotal: 120.0,
      descuento: 18.0,
      total: 102.0,
    },
    {
      id: 'comp-002',
      numero_comprobante: 'B001-000489',
      fecha_hora: '2026-10-09T13:40:00Z',
      mesa_numero: 'Mesa 12',
      cajero_nombre: 'Carlos Mendoza',
      subtotal: 85.0,
      descuento: 12.75,
      total: 72.25,
    },
    {
      id: 'comp-003',
      numero_comprobante: 'F001-000108',
      fecha_hora: '2026-10-08T21:10:00Z',
      mesa_numero: 'Mesa 08',
      cajero_nombre: 'Ana Paredes',
      subtotal: 210.0,
      descuento: 31.5,
      total: 178.5,
    },
    {
      id: 'comp-004',
      numero_comprobante: 'B001-000482',
      fecha_hora: '2026-10-08T20:05:00Z',
      mesa_numero: 'Mesa 02',
      cajero_nombre: 'Ana Paredes',
      subtotal: 64.0,
      descuento: 9.6,
      total: 54.4,
    },
  ],
  'promo-0000-0002': [
    {
      id: 'comp-005',
      numero_comprobante: 'B001-000475',
      fecha_hora: '2026-10-06T20:30:00Z',
      mesa_numero: 'Mesa 04',
      cajero_nombre: 'Carlos Mendoza',
      subtotal: 150.0,
      descuento: 30.0,
      total: 120.0,
    },
    {
      id: 'comp-006',
      numero_comprobante: 'B001-000471',
      fecha_hora: '2026-10-06T14:10:00Z',
      mesa_numero: 'Mesa [ 02 ; 03 ]',
      cajero_nombre: 'Ana Paredes',
      subtotal: 240.0,
      descuento: 40.0,
      total: 200.0,
    },
  ],
  'promo-0000-0003': [
    {
      id: 'comp-007',
      numero_comprobante: 'B001-000460',
      fecha_hora: '2026-10-07T19:20:00Z',
      mesa_numero: 'Mesa 06',
      cajero_nombre: 'Carlos Mendoza',
      subtotal: 90.0,
      descuento: 22.5,
      total: 67.5,
    },
  ],
};

export const SEMILLAS_METODOS_PAGO_AUREA: MetodoPagoLocalDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000451',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'efectivo',
    nombre: 'Efectivo (Cash)',
    activo: true,
    comision_porcentaje: 0.0,
    datos_adicionales: {},
    icono: 'banknote',
    orden: 1,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-09T14:30:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000452',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'tarjeta',
    nombre: 'Tarjeta Débito / Crédito (POS)',
    activo: true,
    comision_porcentaje: 3.5,
    datos_adicionales: { operador: 'Niubiz' },
    icono: 'credit-card',
    orden: 2,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-09T14:30:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000453',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'billetera_digital',
    nombre: 'Billetera Digital (Yape / Plin)',
    activo: true,
    comision_porcentaje: 0.0,
    datos_adicionales: {
      telefono: '987654321',
      titular: 'Inversiones Gastronómicas del Sur S.A.C.',
      ruc: '20601234567',
      instrucciones_cajero: 'Verificar confirmación de pago y código de operación de 6 dígitos',
      qr_url: '',
    },
    icono: 'smartphone',
    orden: 3,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-09T14:30:00Z',
  },
  {
    id: '00000000-0000-4000-8000-000000000454',
    local_id: CANONICAL_LOCAL_ID,
    codigo: 'transferencia',
    nombre: 'Transferencia Bancaria',
    activo: false,
    comision_porcentaje: 0.0,
    datos_adicionales: {
      banco: 'BCP',
      cuenta: '191-88421033-0-45',
      cci: '00219100884210330451',
      titular: 'Inversiones Gastronómicas del Sur S.A.C.',
      instrucciones_cajero: 'Revisar abono bancario y adjuntar comprobante al arqueo',
    },
    icono: 'building-2',
    orden: 4,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-09T14:30:00Z',
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
  private recetasDetalladas: MockProductoInsumoDetalle[] = JSON.parse(JSON.stringify(SEMILLAS_RECETAS_DETALLADAS));
  private auditoriaAjustes: AuditoriaStockAjusteDTO[] = JSON.parse(JSON.stringify(SEMILLAS_AUDITORIA_INICIAL));
  private proveedores: ProveedorResumenDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PROVEEDORES_AUREA));
  private historialCompras: Record<string, FichaCompraHistorialDTO[]> = JSON.parse(JSON.stringify(SEMILLAS_FICHAS_COMPRA_HISTORIAL));
  private fichasCompra: FichaCompraDetalleCompletoDTO[] = JSON.parse(JSON.stringify(SEMILLAS_FICHAS_COMPRA_AUREA));
  private personal: EmpleadoDetalleDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PERSONAL_AUREA));
  private maxUsuariosPlan = 15;
  private planNombrePersonal = 'Plan Pro (15 cupos)';
  private horarioSemana: DiaHorarioDTO[] = JSON.parse(JSON.stringify(SEMILLAS_HORARIO_AUREA));
  private excepcionesHorario: ExcepcionHorarioDTO[] = JSON.parse(JSON.stringify(SEMILLAS_EXCEPCIONES_AUREA));
  private reservasConflicto: ReservaConflictoDTO[] = JSON.parse(JSON.stringify(SEMILLAS_RESERVAS_CONFLICTO_AUREA));
  private politicasReserva: PoliticasReservaDTO = JSON.parse(JSON.stringify(SEMILLA_POLITICAS_RESERVA_AUREA));
  private reservasFuturasActivas: ReservaResumenDTO[] = JSON.parse(JSON.stringify(SEMILLAS_RESERVAS_FUTURAS_AUREA));
  private planSaaSActual: 'starter' | 'pro' | 'enterprise' = 'pro';
  private incidentes: IncidenteDetalleDTO[] = JSON.parse(JSON.stringify(SEMILLAS_INCIDENTES_AUREA));
  private seqIncidente: number = 86;
  private anulaciones: PedidoAnulacionItemDTO[] = JSON.parse(JSON.stringify(SEMILLAS_ANULACIONES_AUREA));
  private notificacionesCampana: NotificacionCampanaDTO[] = JSON.parse(JSON.stringify(SEMILLAS_NOTIFICACIONES_CAMPANA));
  private seqAnulacion: number = 43;
  private notificacionesSseListeners: Set<(notif: NotificacionCampanaDTO) => void> = new Set();
  private promociones: PromocionAdminDTO[] = JSON.parse(JSON.stringify(SEMILLAS_PROMOCIONES_AUREA));
  private seqPromo: number = 6;
  private configuracionKds: ConfiguracionKdsDTO = {
    local_id: CANONICAL_LOCAL_ID,
    tiempo_optimo_verde_min: 15,
    tiempo_alerta_ambar_min: 25,
    tiempo_maximo_pase_min: 3,
    alerta_sonora_nueva_comanda: true,
    alerta_sonora_comanda_roja: true,
    intervalo_sonido_rojo_seg: 60,
    vista_predeterminada: 'fifo',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-09T14:30:00Z',
  };
  private metodosPago: MetodoPagoLocalDTO[] = JSON.parse(JSON.stringify(SEMILLAS_METODOS_PAGO_AUREA));
  private esSedeNuevaMetodosPago: boolean = false;


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
        plan_nombre: 'Pro',
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

    if (piso.mesas.some((m) => m.estado !== 'inactiva')) {
      throw new Error('El asistente requiere un ambiente vacío.');
    }

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
      (m) => m.numero.toLowerCase() === req.numero.trim().toLowerCase()
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
        const mesaActual = piso.mesas[index];
        const destino = this.pisos.find((p) => p.id === (req.piso_id || piso.id) && p.estado === 'activo');
        if (!destino) throw new Error('Ambiente destino no disponible.');
        const moviendo = destino.id !== piso.id || req.posicion_x !== mesaActual.posicion_x || req.posicion_y !== mesaActual.posicion_y;
        if (moviendo && (mesaActual.tiene_pedido_activo || mesaActual.mesa_principal_id
          || this.pisos.some((p) => p.mesas.some((m) => m.mesa_principal_id === mesaId)))) {
          throw new Error('Cierra la comanda y separa el grupo antes de reubicar.');
        }
        if (req.posicion_x < 0 || req.posicion_y < 0 || req.posicion_x >= destino.columnas || req.posicion_y >= destino.filas
          || destino.mesas.some((m) => m.id !== mesaId && m.estado !== 'inactiva'
            && m.posicion_x === req.posicion_x && m.posicion_y === req.posicion_y)) {
          throw new Error('La casilla no está disponible.');
        }
        // Validar unicidad de número
        const otraConMismoNumero = destino.mesas.find(
          (m) =>
            m.id !== mesaId &&
            m.numero.toLowerCase() === req.numero.trim().toLowerCase()
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
        if (destino.id !== piso.id) {
          piso.mesas.splice(index, 1);
          mesa.piso_id = destino.id;
          destino.mesas.push(mesa);
          this.calcularMetricasPiso(destino);
        }

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
                detalles: {
                  mesa_id: mesa.id,
                  pedido_id: '',
                  codigo_comanda: mesa.comanda_activa_codigo || 'Comanda abierta',
                  estado_pedido: 'enviado',
                  total_cuenta: mesa.total_cuenta_activa || 0,
                  mozo_nombre: mesa.mozo_a_cargo || 'Sin asignar',
                },
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

    if (this.pisos.filter((p) => p.estado === 'activo').length >= this.maxPisosPlan) {
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

  // ===========================================================================
  // MÉTODOS PARA CU-ADMIN-06: REGISTRAR FICHA DE COMPRA DE INSUMOS
  // ===========================================================================

  private generarCorrelativoNotaVenta(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaPrefix = `${yyyy}${mm}${dd}`;
    const prefix = `NV-${fechaPrefix}-`;
    const countHoy = this.fichasCompra.filter((f) => f.numero_comprobante.startsWith(prefix)).length + 1;
    return `${prefix}${String(countHoy).padStart(4, '0')}`;
  }

  private generarCodigoFicha(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const totalMes = this.fichasCompra.length + 1;
    return `FC-${yyyy}${mm}-${String(totalMes).padStart(4, '0')}`;
  }

  /**
   * GET /api/v1/admin/compras
   */
  async getFichasCompra(filtros?: {
    busqueda?: string;
    criterioBusqueda?: string;
    tipoComprobante?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<ListarFichasCompraResponseDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    let lista = [...this.fichasCompra];

    // Filtro por búsqueda y criterio específico
    if (filtros?.busqueda && filtros.busqueda.trim()) {
      const q = filtros.busqueda.toLowerCase().trim();
      const crit = filtros.criterioBusqueda || 'TODOS';
      lista = lista.filter((f) => {
        if (crit === 'COMPROBANTE') {
          return f.numero_comprobante.toLowerCase().includes(q);
        }
        if (crit === 'PROVEEDOR') {
          return f.proveedor_nombre.toLowerCase().includes(q);
        }
        if (crit === 'CODIGO') {
          return f.codigo_correlativo.toLowerCase().includes(q);
        }
        return (
          f.numero_comprobante.toLowerCase().includes(q) ||
          f.proveedor_nombre.toLowerCase().includes(q) ||
          f.codigo_correlativo.toLowerCase().includes(q) ||
          (f.observaciones && f.observaciones.toLowerCase().includes(q))
        );
      });
    }

    // Filtro por tipo comprobante
    if (filtros?.tipoComprobante && filtros.tipoComprobante !== 'TODOS') {
      lista = lista.filter((f) => f.tipo_comprobante === filtros.tipoComprobante);
    }

    // Filtro por estado
    if (filtros?.estado && filtros.estado !== 'TODOS') {
      lista = lista.filter((f) => f.estado === filtros.estado);
    }

    // Filtro por fecha desde / hasta
    if (filtros?.fechaDesde) {
      lista = lista.filter((f) => f.fecha_emision >= filtros.fechaDesde!);
    }
    if (filtros?.fechaHasta) {
      lista = lista.filter((f) => f.fecha_emision <= filtros.fechaHasta!);
    }

    // Calcular KPIs del mes sobre todas las fichas (no solo las paginadas)
    const validasMes = this.fichasCompra.filter(
      (f) => f.estado === 'REGISTRADA' && f.fecha_emision.startsWith('2026-10')
    );
    const gastoMesTotal = validasMes.reduce((acc, f) => acc + f.total, 0);
    const facturasIgv = validasMes
      .filter((f) => f.tipo_comprobante === 'FACTURA')
      .reduce((acc, f) => acc + f.igv_monto, 0);
    const creditosPendientes = validasMes
      .filter((f) => f.metodo_pago === 'CREDITO_30D')
      .reduce((acc, f) => acc + f.total, 0);

    const kpis: FichasCompraKPIsDTO = {
      gasto_mes_total: Number(gastoMesTotal.toFixed(2)),
      variacion_gasto_mes_pct: 12.4, // +12.4% vs mes anterior
      total_compras_mes: validasMes.length,
      facturas_con_igv_monto: Number(facturasIgv.toFixed(2)),
      creditos_pendientes_monto: Number(creditosPendientes.toFixed(2)),
    };

    // Paginación
    const page = filtros?.page || 1;
    const pageSize = filtros?.pageSize || 10;
    const total = lista.length;
    const totalPaginas = Math.ceil(total / pageSize) || 1;
    const offset = (page - 1) * pageSize;
    const paginadas = lista.slice(offset, offset + pageSize);

    // Mapeo a resumen
    const fichasResumen: FichaCompraResumenDTO[] = paginadas.map((f) => ({
      id: f.id,
      codigo_correlativo: f.codigo_correlativo,
      tipo_comprobante: f.tipo_comprobante,
      numero_comprobante: f.numero_comprobante,
      proveedor_id: f.proveedor_id,
      proveedor_nombre: f.proveedor_nombre,
      proveedor_telefono: f.proveedor_telefono,
      fecha_emision: f.fecha_emision,
      fecha_registro: f.fecha_registro,
      metodo_pago: f.metodo_pago,
      total: f.total,
      subtotal_neto: f.subtotal_neto,
      igv_monto: f.igv_monto,
      cantidad_items: f.items.length,
      estado: f.estado,
      registrado_por_nombre: f.registrado_por_nombre,
      motivo_anulacion: f.motivo_anulacion,
      fecha_anulacion: f.fecha_anulacion,
    }));

    return {
      exito: true,
      datos: {
        fichas: fichasResumen,
        kpis,
        paginacion: {
          total,
          pagina: page,
          limite: pageSize,
          total_paginas: totalPaginas,
        },
      },
    };
  }

  /**
   * GET /api/v1/admin/compras/{id}
   */
  async getFichaCompraDetalle(id: string): Promise<ApiResponse<FichaCompraDetalleCompletoDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const ficha = this.fichasCompra.find((f) => f.id === id);
    if (!ficha) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NOT_FOUND', mensaje: 'Ficha de compra no encontrada.' }],
      };
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(ficha)),
    };
  }

  /**
   * POST /api/v1/admin/compras
   */
  async registrarFichaCompra(
    request: RegistrarFichaCompraRequestDTO
  ): Promise<ApiResponse<{ ficha: FichaCompraResumenDTO; platosReactivables: PlatoReactivableDTO[] }>> {
    await new Promise((r) => setTimeout(r, 200));

    if (!request.proveedor_id) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_VALIDACION', mensaje: 'Debe seleccionar un proveedor para la compra.' }],
      };
    }

    if (!request.items || request.items.length === 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_VALIDACION', mensaje: 'Debe ingresar al menos un insumo en la ficha de compra.' }],
      };
    }

    // Resolver proveedor
    const prov = this.proveedores.find((p) => p.id === request.proveedor_id);
    const proveedorNombre = prov ? prov.nombre : request.proveedor_nombre || 'Proveedor';
    const proveedorTelefono = prov ? prov.telefono : undefined;

    // Actualizar datos de contacto de proveedor si se proporcionaron
    if (prov && request.actualizar_contacto_proveedor) {
      if (request.actualizar_contacto_proveedor.telefono) prov.telefono = request.actualizar_contacto_proveedor.telefono;
      if (request.actualizar_contacto_proveedor.email) prov.email = request.actualizar_contacto_proveedor.email;
      if (request.actualizar_contacto_proveedor.direccion) prov.direccion = request.actualizar_contacto_proveedor.direccion;
    }

    // Autogenerar número de comprobante si es NOTA_VENTA o RECIBO y vino vacío
    let numeroComprobante = request.numero_comprobante?.trim() || '';
    if (!numeroComprobante) {
      if (request.tipo_comprobante === 'NOTA_VENTA' || request.tipo_comprobante === 'RECIBO') {
        numeroComprobante = this.generarCorrelativoNotaVenta();
      } else {
        return {
          exito: false,
          datos: null as any,
          errores: [{ codigo: 'ERR_NUMERO_COMPROBANTE', mensaje: 'Las facturas, boletas y guías requieren indicar la serie y número de comprobante físico.' }],
        };
      }
    }

    // Cálculo estricto de total y líneas
    let totalAcumulado = 0;
    const itemsDetalle: ItemCompraDetalleDTO[] = [];
    const fichaId = `fc-aurea-${Date.now()}`;

    for (const itemReq of request.items) {
      const subtotalLinea = Number((itemReq.cantidad * itemReq.precio_unitario).toFixed(2));
      totalAcumulado += subtotalLinea;

      // Buscar insumo actual
      const insumoRaw = this.insumos.find((i) => i.id === itemReq.insumo_id);
      const costoAnterior = insumoRaw ? insumoRaw.costo_unitario : itemReq.precio_unitario;
      const variacionPct = costoAnterior > 0
        ? Number((((itemReq.precio_unitario - costoAnterior) / costoAnterior) * 100).toFixed(2))
        : 0;

      itemsDetalle.push({
        id: `fcd-${Date.now()}-${itemsDetalle.length + 1}`,
        ficha_id: fichaId,
        insumo_id: itemReq.insumo_id,
        insumo_nombre: itemReq.insumo_nombre,
        unidad_medida: itemReq.unidad_medida,
        cantidad: itemReq.cantidad,
        precio_unitario: itemReq.precio_unitario,
        subtotal: subtotalLinea,
        costo_anterior: costoAnterior,
        variacion_porcentaje: variacionPct,
      });

      // Actualizar stock y costo del insumo
      if (insumoRaw) {
        insumoRaw.stock_actual = Number((insumoRaw.stock_actual + itemReq.cantidad).toFixed(2));
        insumoRaw.costo_unitario = itemReq.precio_unitario;
        insumoRaw.ultimo_proveedor_id = request.proveedor_id;
        insumoRaw.ultimo_proveedor_nombre = proveedorNombre;
        insumoRaw.fecha_ultima_compra = new Date().toISOString();
        if (insumoRaw.estado === 'agotado') {
          insumoRaw.estado = 'activo';
        }
      }

      // Actualizar insumos habituales del proveedor
      if (prov) {
        const hab = prov.insumos_habituales.find((h) => h.insumo_id === itemReq.insumo_id);
        if (hab) {
          hab.ultimo_precio = itemReq.precio_unitario;
        } else {
          prov.insumos_habituales.push({
            insumo_id: itemReq.insumo_id,
            nombre: itemReq.insumo_nombre,
            unidad_medida: itemReq.unidad_medida,
            ultimo_precio: itemReq.precio_unitario,
          });
        }
      }
    }

    const totalFinal = Number(totalAcumulado.toFixed(2));
    let subtotalNeto = totalFinal;
    let igvMonto = 0;

    if (request.tipo_comprobante === 'FACTURA') {
      subtotalNeto = Number((totalFinal / 1.18).toFixed(2));
      igvMonto = Number((totalFinal - subtotalNeto).toFixed(2));
    }

    // Actualizar proveedor acumulados
    if (prov) {
      prov.total_compras += 1;
      prov.total_gastado = Number((prov.total_gastado + totalFinal).toFixed(2));
      prov.ultima_compra_fecha = new Date().toISOString();
      prov.ultima_compra_total = totalFinal;
    }

    // Actualizar historialCompras del proveedor
    if (!this.historialCompras[request.proveedor_id]) {
      this.historialCompras[request.proveedor_id] = [];
    }
    this.historialCompras[request.proveedor_id].unshift({
      id: fichaId,
      numero_comprobante: numeroComprobante,
      tipo_comprobante: request.tipo_comprobante.toLowerCase() as any,
      fecha_emision: request.fecha_emision,
      metodo_pago: request.metodo_pago.toLowerCase() as any,
      total: totalFinal,
      items: itemsDetalle.map((it) => ({
        insumo_id: it.insumo_id,
        insumo_nombre: it.insumo_nombre,
        unidad_medida: it.unidad_medida,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        subtotal: it.subtotal,
      })),
    });

    // Detectar platos reactivables que estaban agotados por quiebre de stock de receta
    const platosReactivables: PlatoReactivableDTO[] = [];
    const productosAgotados = this.productos.filter((p) => p.disponibilidad === 'agotado');

    for (const prod of productosAgotados) {
      const ingredientes = this.recetasDetalladas.filter((r) => r.producto_id === prod.id);
      if (ingredientes.length > 0) {
        // Verificar si ahora todos tienen stock suficiente
        let todosTienenStock = true;
        const insumosReposicionados: string[] = [];
        for (const ing of ingredientes) {
          const ins = this.insumos.find((i) => i.id === ing.insumo_id);
          if (!ins || ins.stock_actual < (ing.cantidad_descuenta || 0.001)) {
            todosTienenStock = false;
            break;
          }
          if (request.items.some((it) => it.insumo_id === ing.insumo_id)) {
            insumosReposicionados.push(ins ? ins.nombre : 'Insumo');
          }
        }
        if (todosTienenStock && insumosReposicionados.length > 0) {
          const cat = this.categorias.find((c) => c.id === prod.categoria_id);
          platosReactivables.push({
            id: prod.id,
            nombre: prod.nombre,
            categoria_nombre: cat ? cat.nombre : 'Carta',
            precio: prod.precio,
            insumos_reposicionados: insumosReposicionados,
          });
        }
      }
    }

    const nuevaFichaCompleta: FichaCompraDetalleCompletoDTO = {
      id: fichaId,
      codigo_correlativo: this.generarCodigoFicha(),
      tipo_comprobante: request.tipo_comprobante,
      numero_comprobante: numeroComprobante,
      proveedor_id: request.proveedor_id,
      proveedor_nombre: proveedorNombre,
      proveedor_telefono: proveedorTelefono ?? undefined,
      fecha_emision: request.fecha_emision,
      fecha_registro: new Date().toISOString(),
      metodo_pago: request.metodo_pago,
      total: totalFinal,
      subtotal_neto: subtotalNeto,
      igv_monto: igvMonto,
      cantidad_items: itemsDetalle.length,
      estado: 'REGISTRADA',
      registrado_por_nombre: 'Administrador Local',
      observaciones: request.observaciones,
      items: itemsDetalle,
      platos_reactivables: platosReactivables,
    };

    this.fichasCompra.unshift(nuevaFichaCompleta);

    const fichaResumen: FichaCompraResumenDTO = {
      id: nuevaFichaCompleta.id,
      codigo_correlativo: nuevaFichaCompleta.codigo_correlativo,
      tipo_comprobante: nuevaFichaCompleta.tipo_comprobante,
      numero_comprobante: nuevaFichaCompleta.numero_comprobante,
      proveedor_id: nuevaFichaCompleta.proveedor_id,
      proveedor_nombre: nuevaFichaCompleta.proveedor_nombre,
      proveedor_telefono: nuevaFichaCompleta.proveedor_telefono,
      fecha_emision: nuevaFichaCompleta.fecha_emision,
      fecha_registro: nuevaFichaCompleta.fecha_registro,
      metodo_pago: nuevaFichaCompleta.metodo_pago,
      total: nuevaFichaCompleta.total,
      subtotal_neto: nuevaFichaCompleta.subtotal_neto,
      igv_monto: nuevaFichaCompleta.igv_monto,
      cantidad_items: itemsDetalle.length,
      estado: 'REGISTRADA',
      registrado_por_nombre: 'Administrador Local',
    };

    return {
      exito: true,
      datos: {
        ficha: fichaResumen,
        platosReactivables,
      },
    };
  }

  /**
   * GET /api/v1/admin/compras/{id}/impacto-anulacion
   */
  async obtenerImpactoAnulacion(id: string): Promise<ApiResponse<ImpactoAnulacionDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    const ficha = this.fichasCompra.find((f) => f.id === id);
    if (!ficha) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NOT_FOUND', mensaje: 'Ficha de compra no encontrada.' }],
      };
    }

    const insumosAfectados: InsumoImpactadoDTO[] = [];
    const platosQueSeAgotaran: PlatoImpactadoDTO[] = [];

    for (const item of ficha.items) {
      const ins = this.insumos.find((i) => i.id === item.insumo_id);
      const stockActual = ins ? ins.stock_actual : 0;
      const stockProyectado = Math.max(0, Number((stockActual - item.cantidad).toFixed(2)));
      const stockMinimo = ins ? ins.stock_minimo : 0;
      const quedaraEnQuiebre = stockProyectado <= stockMinimo;

      insumosAfectados.push({
        insumo_id: item.insumo_id,
        insumo_nombre: item.insumo_nombre,
        unidad_medida: item.unidad_medida,
        stock_actual: stockActual,
        cantidad_a_restar: item.cantidad,
        stock_proyectado: stockProyectado,
        quedara_en_quiebre: quedaraEnQuiebre,
      });

      // Evaluar si algún plato activo se quedaría sin insumo
      if (quedaraEnQuiebre) {
        const recetasAfectadas = this.recetasDetalladas.filter((r) => r.insumo_id === item.insumo_id);
        for (const r of recetasAfectadas) {
          const prod = this.productos.find((p) => p.id === r.producto_id);
          if (prod && prod.disponibilidad === 'disponible') {
            const cat = this.categorias.find((c) => c.id === prod.categoria_id);
            if (!platosQueSeAgotaran.some((p) => p.plato_id === prod.id)) {
              platosQueSeAgotaran.push({
                plato_id: prod.id,
                plato_nombre: prod.nombre,
                categoria_nombre: cat ? cat.nombre : 'Carta',
                insumo_critico: item.insumo_nombre,
              });
            }
          }
        }
      }
    }

    // Si hay platos que se agotarán, simular pedidos en cola de cocina afectados para auditoría
    const pedidosCocinaEnRiesgo: PedidoCocinaImpactadoDTO[] = [];
    if (platosQueSeAgotaran.length > 0) {
      pedidosCocinaEnRiesgo.push({
        comanda_id: 'COM-20261012-0104',
        mesa_codigo: 'Mesa 4',
        plato_nombre: platosQueSeAgotaran[0].plato_nombre,
        estado_comanda: 'En preparación (Cocina Caliente)',
      });
      if (platosQueSeAgotaran.length > 1) {
        pedidosCocinaEnRiesgo.push({
          comanda_id: 'COM-20261012-0106',
          mesa_codigo: 'Mesa 2',
          plato_nombre: platosQueSeAgotaran[1].plato_nombre,
          estado_comanda: 'Recibido en Comandera',
        });
      }
    }

    return {
      exito: true,
      datos: {
        ficha_id: ficha.id,
        numero_comprobante: ficha.numero_comprobante,
        proveedor_nombre: ficha.proveedor_nombre,
        fecha_emision: ficha.fecha_emision,
        total: ficha.total,
        insumos_afectados: insumosAfectados,
        platos_que_se_agotaran: platosQueSeAgotaran,
        pedidos_cocina_en_riesgo: pedidosCocinaEnRiesgo,
        requiere_confirmacion_estricta: platosQueSeAgotaran.length > 0 || pedidosCocinaEnRiesgo.length > 0,
      },
    };
  }

  /**
   * POST /api/v1/admin/compras/anular
   */
  async anularFichaCompra(
    request: AnularFichaCompraRequestDTO
  ): Promise<ApiResponse<FichaCompraResumenDTO>> {
    await new Promise((r) => setTimeout(r, 150));

    if (!request.motivo || request.motivo.trim().length < 5) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_VALIDACION', mensaje: 'Debe ingresar un motivo de anulación detallado (mínimo 5 caracteres).' }],
      };
    }

    const ficha = this.fichasCompra.find((f) => f.id === request.ficha_id);
    if (!ficha) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NOT_FOUND', mensaje: 'Ficha de compra no encontrada.' }],
      };
    }

    if (ficha.estado === 'ANULADA') {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_FICHA_YA_ANULADA', mensaje: 'La ficha de compra ya se encuentra anulada.' }],
      };
    }

    ficha.estado = 'ANULADA';
    ficha.motivo_anulacion = request.motivo.trim();
    ficha.fecha_anulacion = new Date().toISOString();

    // Restar existencias en insumos con piso GREATEST(0, stock - cant)
    for (const item of ficha.items) {
      const ins = this.insumos.find((i) => i.id === item.insumo_id);
      if (ins) {
        ins.stock_actual = Math.max(0, Number((ins.stock_actual - item.cantidad).toFixed(2)));
        if (ins.stock_actual <= 0) {
          ins.estado = 'agotado';
        }
      }
    }

    // Actualizar platos en carta si se quedan sin insumos
    for (const item of ficha.items) {
      const ins = this.insumos.find((i) => i.id === item.insumo_id);
      if (ins && ins.stock_actual <= ins.stock_minimo) {
        const recetasAfectadas = this.recetasDetalladas.filter((r) => r.insumo_id === item.insumo_id);
        for (const r of recetasAfectadas) {
          const prod = this.productos.find((p) => p.id === r.producto_id);
          if (prod && ins.stock_actual < (r.cantidad_descuenta || 0.001)) {
            prod.disponibilidad = 'agotado';
            prod.motivo_agotado = 'quiebre_stock_receta';
          }
        }
      }
    }

    // Actualizar resumen del proveedor
    const prov = this.proveedores.find((p) => p.id === ficha.proveedor_id);
    if (prov) {
      prov.total_gastado = Math.max(0, Number((prov.total_gastado - ficha.total).toFixed(2)));
    }

    return {
      exito: true,
      datos: {
        id: ficha.id,
        codigo_correlativo: ficha.codigo_correlativo,
        tipo_comprobante: ficha.tipo_comprobante,
        numero_comprobante: ficha.numero_comprobante,
        proveedor_id: ficha.proveedor_id,
        proveedor_nombre: ficha.proveedor_nombre,
        proveedor_telefono: ficha.proveedor_telefono,
        fecha_emision: ficha.fecha_emision,
        fecha_registro: ficha.fecha_registro,
        metodo_pago: ficha.metodo_pago,
        total: ficha.total,
        subtotal_neto: ficha.subtotal_neto,
        igv_monto: ficha.igv_monto,
        cantidad_items: ficha.items.length,
        estado: 'ANULADA',
        registrado_por_nombre: ficha.registrado_por_nombre,
        motivo_anulacion: ficha.motivo_anulacion,
        fecha_anulacion: ficha.fecha_anulacion,
      },
    };
  }

  /**
   * POST /api/v1/admin/carta/reactivar-lote
   */
  async reactivarPlatosCompra(platoIds: string[]): Promise<ApiResponse<{ actualizados: number }>> {
    await new Promise((r) => setTimeout(r, 80));

    let count = 0;
    for (const pid of platoIds) {
      const prod = this.productos.find((p) => p.id === pid);
      if (prod) {
        prod.disponibilidad = 'disponible';
        prod.motivo_agotado = null as any;
        count++;
      }
    }

    return {
      exito: true,
      datos: { actualizados: count },
    };
  }

  simularHistorialComprasVacio() {
    this.fichasCompra = [];
  }

  restablecerSemillasCompras() {
    this.fichasCompra = JSON.parse(JSON.stringify(SEMILLAS_FICHAS_COMPRA_AUREA));
  }

  // ============================================================================
  // CU-ADMIN-08: Gestión de Personal del Local
  // ============================================================================

  /**
   * GET /api/v1/admin/personal
   */
  async getPersonal(filtros?: {
    busqueda?: string;
    rol?: string;
    estado?: string;
    pagina?: number;
    limite?: number;
  }): Promise<ApiResponse<ListarPersonalResponseDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    let lista = [...this.personal];

    // Filtro por búsqueda
    if (filtros?.busqueda?.trim()) {
      const q = filtros.busqueda.trim().toLowerCase();
      lista = lista.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          e.correo.toLowerCase().includes(q) ||
          e.telefono.includes(q)
      );
    }

    // Filtro por rol
    if (filtros?.rol && filtros.rol !== 'todos') {
      lista = lista.filter((e) => e.rol === filtros.rol);
    }

    // Filtro por estado
    if (filtros?.estado && filtros.estado !== 'todos') {
      lista = lista.filter((e) => e.estado === filtros.estado);
    }

    const total = lista.length;
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 10;
    const offset = (pagina - 1) * limite;
    const paginados = lista.slice(offset, offset + limite);

    const totalPaginas = Math.ceil(total / limite) || 1;

    // Métricas globales
    const metricas = this.calcularMetricasPersonalInternas();

    return {
      exito: true,
      datos: {
        empleados: paginados,
        metricas,
        paginacion: {
          total,
          pagina,
          limite,
          total_paginas: totalPaginas,
        },
      },
    };
  }

  private calcularMetricasPersonalInternas(): MetricasPersonalDTO {
    const totalActivos = this.personal.filter((p) => p.estado === 'activo').length;
    const mozosActivos = this.personal.filter((p) => p.rol === 'mozo' && p.estado === 'activo').length;
    const cocinaActivos = this.personal.filter((p) => p.rol === 'cocina' && p.estado === 'activo').length;
    const cajerosActivos = this.personal.filter((p) => p.rol === 'cajero' && p.estado === 'activo').length;
    const cuposDisponibles = Math.max(0, this.maxUsuariosPlan - totalActivos);
    const porcentajeOcupacion = Math.round((totalActivos / this.maxUsuariosPlan) * 100);

    return {
      total_empleados: totalActivos,
      max_usuarios_plan: this.maxUsuariosPlan,
      cupos_disponibles: cuposDisponibles,
      mozos_activos: mozosActivos,
      cocina_activos: cocinaActivos,
      cajeros_activos: cajerosActivos,
      plan_nombre: this.planNombrePersonal,
      porcentaje_ocupacion: porcentajeOcupacion,
    };
  }

  /**
   * GET /api/v1/admin/personal/metricas
   */
  async getMetricasPersonal(): Promise<ApiResponse<MetricasPersonalDTO>> {
    await new Promise((r) => setTimeout(r, 40));
    return {
      exito: true,
      datos: this.calcularMetricasPersonalInternas(),
    };
  }

  /**
   * GET /api/v1/admin/personal/{id}
   */
  async getEmpleado(id: string): Promise<ApiResponse<EmpleadoDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 40));
    const emp = this.personal.find((p) => p.id === id);
    if (!emp) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_EMPLEADO_NO_ENCONTRADO',
            mensaje: 'Colaborador no encontrado en los registros de la sede.',
          },
        ],
      };
    }
    return {
      exito: true,
      datos: emp,
    };
  }

  /**
   * POST /api/v1/admin/personal
   */
  async registrarEmpleado(req: RegistrarEmpleadoRequestDTO): Promise<ApiResponse<EmpleadoDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    // 1. Validar cuota SaaS
    const totalActivos = this.personal.filter((p) => p.estado === 'activo').length;
    if (totalActivos >= this.maxUsuariosPlan) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CUOTA_EXCEDIDA',
            mensaje: `Se ha alcanzado el límite de ${this.maxUsuariosPlan} usuarios activos del Plan Pro. Libera cupos desactivando colaboradores inactivos o solicita una ampliación de plan al propietario.`,
          },
        ],
      };
    }

    // 2. Validar unicidad de correo
    const emailNormalizado = req.correo.trim().toLowerCase();
    const existeCorreo = this.personal.some((p) => p.correo.toLowerCase() === emailNormalizado);
    if (existeCorreo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CORREO_DUPLICADO',
            mensaje: `El correo "${req.correo}" ya se encuentra registrado por otro usuario en la plataforma.`,
          },
        ],
      };
    }

    // 3. Validar rol permitido para administrador local (mozo, cocina, cajero)
    if (!['mozo', 'cocina', 'cajero'].includes(req.rol)) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_ROL_NO_AUTORIZADO',
            mensaje: 'El administrador local solo puede asignar roles operativos de local (Mozo, Cocina, Cajero). La creación de administradores corresponde al Propietario.',
          },
        ],
      };
    }

    // 4. Generar contraseña provisional y link de WhatsApp
    const codigoAleatorio = Math.floor(1000 + Math.random() * 9000);
    const passwordTemporal = `Rest@${codigoAleatorio}`;
    const cleanTel = req.telefono.replace(/\D/g, '');
    const telefonoWhatsApp = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`;

    const mensajeWhatsApp = `¡Hola ${req.nombre}! Bienvenido al equipo de Áurea Miraflores. Tus credenciales de acceso son:
📧 Usuario: ${emailNormalizado}
🔑 Clave provisional: ${passwordTemporal}
🌐 Acceso: https://app.restaurantcloud.pe/login`;

    const nuevo: EmpleadoDetalleDTO = {
      id: `u-${req.rol}-${Date.now().toString(36)}`,
      local_id: CANONICAL_LOCAL_ID,
      nombre: req.nombre.trim(),
      correo: emailNormalizado,
      telefono: req.telefono.trim(),
      rol: req.rol,
      estado: 'activo',
      ultimo_login: null,
      created_at: new Date().toISOString(),
      mesas_activas_count: 0,
      mesas_activas_detalle: [],
      tiene_caja_abierta: false,
      password_temporal: passwordTemporal,
      enlace_whatsapp_link: `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`,
    };

    this.personal.unshift(nuevo);

    return {
      exito: true,
      datos: nuevo,
    };
  }

  /**
   * PUT /api/v1/admin/personal/{id}
   */
  async actualizarEmpleado(
    id: string,
    req: ActualizarEmpleadoRequestDTO
  ): Promise<ApiResponse<EmpleadoDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const emp = this.personal.find((p) => p.id === id);
    if (!emp) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_EMPLEADO_NO_ENCONTRADO',
            mensaje: 'Colaborador no encontrado.',
          },
        ],
      };
    }

    // Validar rol operativo
    if (!['mozo', 'cocina', 'cajero'].includes(req.rol)) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_ROL_NO_AUTORIZADO',
            mensaje: 'Rol no autorizado para asignación por administrador de local.',
          },
        ],
      };
    }

    emp.nombre = req.nombre.trim();
    emp.telefono = req.telefono.trim();
    emp.rol = req.rol;

    const cleanTel = emp.telefono.replace(/\D/g, '');
    const telefonoWhatsApp = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`;
    emp.enlace_whatsapp_link = `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(
      `Hola ${emp.nombre}, te contactamos desde la administración de Áurea Miraflores.`
    )}`;

    return {
      exito: true,
      datos: emp,
    };
  }

  /**
   * GET /api/v1/admin/personal/{id}/precheck-desactivacion
   */
  async precheckDesactivarEmpleado(id: string): Promise<ApiResponse<PrecheckDesactivacionDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    const emp = this.personal.find((p) => p.id === id);
    if (!emp) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_EMPLEADO_NO_ENCONTRADO',
            mensaje: 'Colaborador no encontrado.',
          },
        ],
      };
    }

    // Caso 1: Cajero con caja abierta
    if (emp.rol === 'cajero' && emp.tiene_caja_abierta) {
      return {
        exito: true,
        datos: {
          usuario_id: emp.id,
          nombre: emp.nombre,
          rol: emp.rol,
          mesas_activas_pendientes: [],
          caja_abierta_pendiente: {
            caja_id: 'caja-aurea-01',
            nombre_caja: 'Caja Principal Salón',
            apertura_fecha: 'Hoy 08:30 AM',
            monto_apertura: 350.0,
          },
          puede_desactivar_directo: false,
          requiere_reasignacion: false,
          mensaje_advertencia:
            'El colaborador mantiene un turno de caja abierto con dinero en custodia. Debe realizarse el arqueo y supervisión de cierre en Control de Caja antes de desactivarlo.',
        },
      };
    }

    // Caso 2: Mozo con comandas/mesas activas
    if (emp.rol === 'mozo' && (emp.mesas_activas_count || 0) > 0) {
      return {
        exito: true,
        datos: {
          usuario_id: emp.id,
          nombre: emp.nombre,
          rol: emp.rol,
          mesas_activas_pendientes: emp.mesas_activas_detalle || [],
          caja_abierta_pendiente: null,
          puede_desactivar_directo: false,
          requiere_reasignacion: true,
          mensaje_advertencia: `El mozo tiene ${emp.mesas_activas_count} comanda(s) activas en salón. Para evitar pedidos huérfanos, es obligatorio reasignarlas a un mozo en turno.`,
        },
      };
    }

    // Caso 3: Desactivación directa sin riesgo
    return {
      exito: true,
      datos: {
        usuario_id: emp.id,
        nombre: emp.nombre,
        rol: emp.rol,
        mesas_activas_pendientes: [],
        caja_abierta_pendiente: null,
        puede_desactivar_directo: true,
        requiere_reasignacion: false,
      },
    };
  }

  /**
   * POST /api/v1/admin/personal/{id}/desactivar
   */
  async desactivarEmpleado(
    id: string,
    req: DesactivarEmpleadoRequestDTO
  ): Promise<ApiResponse<{ exito: boolean; mensaje: string; mesas_reasignadas?: number }>> {
    await new Promise((r) => setTimeout(r, 100));

    const emp = this.personal.find((p) => p.id === id);
    if (!emp) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_EMPLEADO_NO_ENCONTRADO',
            mensaje: 'Colaborador no encontrado.',
          },
        ],
      };
    }

    // Bloqueo si cajero con caja abierta
    if (emp.rol === 'cajero' && emp.tiene_caja_abierta) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CAJA_ABIERTA_BLOQUEO',
            mensaje: 'Acción bloqueada: Debe cerrar la caja abierta antes de desactivar al colaborador.',
          },
        ],
      };
    }

    let mesasReasignadas = 0;

    // Si es mozo con mesas, ejecutar reasignación atómica
    if (emp.rol === 'mozo' && (emp.mesas_activas_count || 0) > 0) {
      if (!req.mozo_sustituto_id) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_MOZO_SUSTITUTO_REQUERIDO',
              mensaje: 'Es obligatorio seleccionar un mozo sustituto para reasignar las comandas activas.',
            },
          ],
        };
      }

      const sustituto = this.personal.find(
        (p) => p.id === req.mozo_sustituto_id && p.rol === 'mozo' && p.estado === 'activo'
      );
      if (!sustituto) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_SUSTITUTO_INVALIDO',
              mensaje: 'El mozo sustituto seleccionado no está activo o no tiene rol de Mozo.',
            },
          ],
        };
      }

      mesasReasignadas = emp.mesas_activas_count || 0;
      sustituto.mesas_activas_count = (sustituto.mesas_activas_count || 0) + mesasReasignadas;
      sustituto.mesas_activas_detalle = [
        ...(sustituto.mesas_activas_detalle || []),
        ...(emp.mesas_activas_detalle || []),
      ];

      emp.mesas_activas_count = 0;
      emp.mesas_activas_detalle = [];
    }

    emp.estado = 'inactivo';

    return {
      exito: true,
      datos: {
        exito: true,
        mensaje: `Colaborador ${emp.nombre} desactivado correctamente.${
          mesasReasignadas > 0 ? ` Se reasignaron ${mesasReasignadas} mesa(s) con éxito.` : ''
        } Se ha liberado 1 cupo en el Plan Pro.`,
        mesas_reasignadas: mesasReasignadas,
      },
    };
  }

  /**
   * POST /api/v1/admin/personal/{id}/reactivar
   */
  async reactivarEmpleado(id: string): Promise<ApiResponse<EmpleadoDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const emp = this.personal.find((p) => p.id === id);
    if (!emp) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_EMPLEADO_NO_ENCONTRADO',
            mensaje: 'Colaborador no encontrado.',
          },
        ],
      };
    }

    // Validar cuota SaaS antes de reactivar
    const totalActivos = this.personal.filter((p) => p.estado === 'activo').length;
    if (totalActivos >= this.maxUsuariosPlan) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_CUOTA_EXCEDIDA',
            mensaje: `No se puede reactivar: se alcanzó el límite de ${this.maxUsuariosPlan} usuarios activos en el Plan Pro. Libera cupos antes de reactivar.`,
          },
        ],
      };
    }

    emp.estado = 'activo';

    return {
      exito: true,
      datos: emp,
    };
  }

  /**
   * POST /api/v1/admin/personal/{id}/reset-password
   */
  async resetPasswordEmpleado(id: string): Promise<ApiResponse<ResetPasswordResponseDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const emp = this.personal.find((p) => p.id === id);
    if (!emp) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_EMPLEADO_NO_ENCONTRADO',
            mensaje: 'Colaborador no encontrado.',
          },
        ],
      };
    }

    const codigoAleatorio = Math.floor(1000 + Math.random() * 9000);
    const nuevaPassword = `Rest@${codigoAleatorio}`;
    emp.password_temporal = nuevaPassword;

    const cleanTel = emp.telefono.replace(/\D/g, '');
    const telefonoWhatsApp = cleanTel.startsWith('51') ? cleanTel : `51${cleanTel}`;

    const mensajeWhatsApp = `Hola ${emp.nombre}, tu contraseña provisional de acceso en RestaurantCloud AI ha sido restablecida:
🔑 Nueva clave: ${nuevaPassword}
🌐 Ingresa aquí: https://app.restaurantcloud.pe/login`;

    const link = `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;
    emp.enlace_whatsapp_link = link;

    return {
      exito: true,
      datos: {
        usuario_id: emp.id,
        nombre: emp.nombre,
        correo: emp.correo,
        password_temporal: nuevaPassword,
        enlace_whatsapp_link: link,
      },
    };
  }

  // Métodos de simulación para QA Test Bench
  simularLimiteCuotaPersonal() {
    const activos = this.personal.filter((p) => p.estado === 'activo').length;
    const faltantes = this.maxUsuariosPlan - activos;
    for (let i = 1; i <= faltantes; i++) {
      this.personal.push({
        id: `u-dummy-${Date.now()}-${i}`,
        local_id: CANONICAL_LOCAL_ID,
        nombre: `Colaborador Prueba Cuota ${i}`,
        correo: `prueba_cuota${i}@aurea.pe`,
        telefono: `+51 999 000 ${String(i).padStart(3, '0')}`,
        rol: 'mozo',
        estado: 'activo',
        ultimo_login: null,
        created_at: new Date().toISOString(),
        mesas_activas_count: 0,
        mesas_activas_detalle: [],
      });
    }
  }

  simularDirectorioPersonalVacio() {
    this.personal = [];
  }

  restablecerSemillasPersonal() {
    this.personal = JSON.parse(JSON.stringify(SEMILLAS_PERSONAL_AUREA));
  }

  // ============================================================================
  // CU-ADMIN-09: Horario de Atención y Feriados del Local
  // ============================================================================

  private calcularHorasTurno(inicio: string, fin: string): number {
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin, mFin] = fin.split(':').map(Number);
    const minIni = hIni * 60 + mIni;
    const minFin = hFin * 60 + mFin;
    let diff = minFin - minIni;
    if (diff < 0) {
      // Turno trasnochador (cruza medianoche)
      diff += 24 * 60;
    }
    return Math.round((diff / 60) * 10) / 10;
  }

  private calcularTotalHorasSemanales(dias: DiaHorarioDTO[]): number {
    let total = 0;
    for (const d of dias) {
      if (d.atiende && d.turnos) {
        for (const t of d.turnos) {
          if (t.hora_inicio && t.hora_fin) {
            total += this.calcularHorasTurno(t.hora_inicio, t.hora_fin);
          }
        }
      }
    }
    return Math.round(total * 10) / 10;
  }

  /**
   * GET /api/v1/admin/horario
   */
  async getHorarioSemana(localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<HorarioSemanaResponse>> {
    await new Promise((r) => setTimeout(r, 60));
    const totalHoras = this.calcularTotalHorasSemanales(this.horarioSemana);
    return {
      exito: true,
      datos: {
        local_id: localId,
        dias: JSON.parse(JSON.stringify(this.horarioSemana)),
        total_horas_semanales: totalHoras,
      },
    };
  }

  /**
   * PUT /api/v1/admin/horario
   */
  async guardarHorarioSemana(req: ConfigSemanaHorariaRequest): Promise<ApiResponse<HorarioSemanaResponse>> {
    await new Promise((r) => setTimeout(r, 120));

    // Validar estructura
    if (!req.dias || req.dias.length === 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_HORARIO_INVALIDO', mensaje: 'Debes proporcionar la configuración de los días de la semana.' }],
      };
    }

    // Validar cada día activo
    for (const d of req.dias) {
      if (d.atiende) {
        if (!d.turnos || d.turnos.length === 0) {
          return {
            exito: false,
            datos: null as any,
            errores: [{ codigo: 'ERR_TURNO_REQUERIDO', mensaje: `El día ${d.nombre_dia} está marcado como abierto pero no tiene turnos configurados.` }],
          };
        }
        for (const t of d.turnos) {
          if (!t.hora_inicio || !t.hora_fin) {
            return {
              exito: false,
              datos: null as any,
              errores: [{ codigo: 'ERR_HORAS_INCOMPLETAS', mensaje: `Turno incompleto en ${d.nombre_dia}. Ingresa hora de inicio y fin.` }],
            };
          }
          if (t.hora_inicio === t.hora_fin) {
            return {
              exito: false,
              datos: null as any,
              errores: [{ codigo: 'ERR_HORAS_IDENTICAS', mensaje: `La hora de inicio y fin no pueden ser idénticas en el turno "${t.nombre_turno}" de ${d.nombre_dia}.` }],
            };
          }
        }
      }
    }

    this.horarioSemana = JSON.parse(JSON.stringify(req.dias));
    const totalHoras = this.calcularTotalHorasSemanales(this.horarioSemana);

    return {
      exito: true,
      datos: {
        local_id: CANONICAL_LOCAL_ID,
        dias: JSON.parse(JSON.stringify(this.horarioSemana)),
        total_horas_semanales: totalHoras,
      },
    };
  }

  /**
   * POST /api/v1/admin/horario/plantilla
   */
  async aplicarPlantillaHorario(req: AplicarPlantillaRequest): Promise<ApiResponse<HorarioSemanaResponse>> {
    await new Promise((r) => setTimeout(r, 100));

    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    if (req.plantilla === 'restaurante_estandar') {
      this.horarioSemana = nombresDias.map((nombre, idx) => {
        const diaSemana = idx + 1;
        if (diaSemana <= 4) {
          // Lunes a Jueves
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
              { id: `t-${diaSemana}-2`, nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '23:30' },
            ],
          };
        } else if (diaSemana === 5) {
          // Viernes
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Almuerzo', hora_inicio: '12:00', hora_fin: '16:00' },
              { id: `t-${diaSemana}-2`, nombre_turno: 'Cena', hora_inicio: '19:00', hora_fin: '00:30' },
            ],
          };
        } else if (diaSemana === 6) {
          // Sábado
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Horario Continuo', hora_inicio: '12:00', hora_fin: '00:30' },
            ],
          };
        } else {
          // Domingo
          return {
            dia_semana: diaSemana,
            nombre_dia: nombre,
            atiende: true,
            turnos: [
              { id: `t-${diaSemana}-1`, nombre_turno: 'Almuerzo Familiar', hora_inicio: '12:00', hora_fin: '18:00' },
            ],
          };
        }
      });
    } else if (req.plantilla === 'solo_almuerzo') {
      this.horarioSemana = nombresDias.map((nombre, idx) => ({
        dia_semana: idx + 1,
        nombre_dia: nombre,
        atiende: true,
        turnos: [
          { id: `t-${idx + 1}-1`, nombre_turno: 'Almuerzo Ejecutivo', hora_inicio: '12:00', hora_fin: '16:30' },
        ],
      }));
    } else {
      // corrido_continuo
      this.horarioSemana = nombresDias.map((nombre, idx) => ({
        dia_semana: idx + 1,
        nombre_dia: nombre,
        atiende: true,
        turnos: [
          { id: `t-${idx + 1}-1`, nombre_turno: 'Turno Continuo', hora_inicio: '12:00', hora_fin: '23:00' },
        ],
      }));
    }

    const totalHoras = this.calcularTotalHorasSemanales(this.horarioSemana);
    return {
      exito: true,
      datos: {
        local_id: CANONICAL_LOCAL_ID,
        dias: JSON.parse(JSON.stringify(this.horarioSemana)),
        total_horas_semanales: totalHoras,
      },
    };
  }

  /**
   * GET /api/v1/admin/horario/excepciones
   */
  async getExcepcionesHorario(): Promise<ApiResponse<ExcepcionHorarioDTO[]>> {
    await new Promise((r) => setTimeout(r, 60));
    const ordenadas = [...this.excepcionesHorario].sort((a, b) => a.fecha.localeCompare(b.fecha));
    return {
      exito: true,
      datos: ordenadas,
    };
  }

  /**
   * POST /api/v1/admin/horario/excepciones/precheck
   */
  async precheckExcepcion(req: PrecheckExcepcionRequest): Promise<ApiResponse<PrecheckExcepcionResponse>> {
    await new Promise((r) => setTimeout(r, 80));

    // Filtrar reservas que coincidan con la fecha
    const reservasEnFecha = this.reservasConflicto.filter((res) => res.fecha_hora.startsWith(req.fecha));

    if (reservasEnFecha.length === 0) {
      return {
        exito: true,
        datos: {
          hay_conflictos: false,
          total_afectadas: 0,
          reservas: [],
        },
      };
    }

    // Si es cierre total, todas están en conflicto
    if (req.cerrado) {
      return {
        exito: true,
        datos: {
          hay_conflictos: true,
          total_afectadas: reservasEnFecha.length,
          reservas: reservasEnFecha,
        },
      };
    }

    // Si es horario especial, evaluar si la hora de reserva cae fuera de [req.hora_inicio, req.hora_fin]
    if (req.hora_inicio && req.hora_fin) {
      const afectadas = reservasEnFecha.filter((res) => {
        const horaRes = res.fecha_hora.split('T')[1]?.slice(0, 5) || '12:00';
        return horaRes < req.hora_inicio! || horaRes > req.hora_fin!;
      });

      return {
        exito: true,
        datos: {
          hay_conflictos: afectadas.length > 0,
          total_afectadas: afectadas.length,
          reservas: afectadas,
        },
      };
    }

    return {
      exito: true,
      datos: {
        hay_conflictos: false,
        total_afectadas: 0,
        reservas: [],
      },
    };
  }

  /**
   * POST /api/v1/admin/horario/excepciones
   */
  async crearExcepcion(req: CrearExcepcionRequest): Promise<ApiResponse<ExcepcionHorarioDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    if (!req.fecha) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_FECHA_REQUERIDA', mensaje: 'Debes seleccionar una fecha para la excepción.' }],
      };
    }

    if (!req.motivo || req.motivo.trim().length < 3) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_MOTIVO_REQUERIDO', mensaje: 'Debes especificar el motivo o descripción del cierre o feriado.' }],
      };
    }

    // Gestionar reservas canceladas si hubo conflicto
    let canceladasCount = 0;
    if (req.cancelar_reservas) {
      const reservasEnFecha = this.reservasConflicto.filter((res) => res.fecha_hora.startsWith(req.fecha));
      canceladasCount = reservasEnFecha.length;
      if (req.reservas_notificadas) {
        for (const notif of req.reservas_notificadas) {
          const resObj = this.reservasConflicto.find((r) => r.id === notif.reserva_id);
          if (resObj) {
            resObj.notificado = notif.notificado;
            resObj.metodo_notificacion = notif.metodo_notificacion;
          }
        }
      }
    }

    const indiceExistente = this.excepcionesHorario.findIndex((e) => e.fecha === req.fecha);
    const nuevaExcepcion: ExcepcionHorarioDTO = {
      id: indiceExistente >= 0 ? this.excepcionesHorario[indiceExistente].id : `exc-${req.fecha}-${Date.now()}`,
      local_id: CANONICAL_LOCAL_ID,
      fecha: req.fecha,
      cerrado: req.cerrado,
      hora_inicio: req.cerrado ? null : req.hora_inicio || null,
      hora_fin: req.cerrado ? null : req.hora_fin || null,
      motivo: req.motivo.trim(),
      created_at: new Date().toISOString(),
      created_by: 'Administrador Áurea',
      reservas_canceladas_count: canceladasCount,
    };

    if (indiceExistente >= 0) {
      this.excepcionesHorario[indiceExistente] = nuevaExcepcion;
    } else {
      this.excepcionesHorario.push(nuevaExcepcion);
    }

    return {
      exito: true,
      datos: nuevaExcepcion,
    };
  }

  /**
   * DELETE /api/v1/admin/horario/excepciones/{id}
   */
  async eliminarExcepcion(id: string): Promise<ApiResponse<{ id: string; eliminado: boolean }>> {
    await new Promise((r) => setTimeout(r, 60));
    const idx = this.excepcionesHorario.findIndex((e) => e.id === id);
    if (idx === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NO_ENCONTRADO', mensaje: 'La excepción no fue encontrada o ya fue eliminada.' }],
      };
    }
    this.excepcionesHorario.splice(idx, 1);
    return {
      exito: true,
      datos: { id, eliminado: true },
    };
  }

  /**
   * POST /api/v1/admin/horario/feriados-peru/cargar
   */
  async cargarFeriadosNacionalesPeru(): Promise<ApiResponse<{ agregados: number; total: number }>> {
    await new Promise((r) => setTimeout(r, 100));
    let agregados = 0;
    for (const f of FERIADOS_PERU_2026_DEFAULT) {
      const existe = this.excepcionesHorario.some((e) => e.fecha === f.fecha);
      if (!existe) {
        this.excepcionesHorario.push({
          id: `exc-peru-${f.fecha}`,
          local_id: CANONICAL_LOCAL_ID,
          fecha: f.fecha,
          cerrado: true,
          hora_inicio: null,
          hora_fin: null,
          motivo: `${f.motivo} (Feriado Nacional)`,
          created_at: new Date().toISOString(),
          created_by: 'Calendario Oficial Perú 2026',
        });
        agregados++;
      }
    }
    return {
      exito: true,
      datos: {
        agregados,
        total: this.excepcionesHorario.length,
      },
    };
  }

  // Métodos de simulación para QA Test Bench (CU-ADMIN-09)
  simularSedeSinHorario() {
    this.horarioSemana = [];
  }

  simularConflictoNavidad() {
    this.excepcionesHorario = this.excepcionesHorario.filter((e) => e.fecha !== '2026-12-25');
    this.reservasConflicto = JSON.parse(JSON.stringify(SEMILLAS_RESERVAS_CONFLICTO_AUREA));
  }

  restablecerSemillasHorario() {
    this.horarioSemana = JSON.parse(JSON.stringify(SEMILLAS_HORARIO_AUREA));
    this.excepcionesHorario = JSON.parse(JSON.stringify(SEMILLAS_EXCEPCIONES_AUREA));
    this.reservasConflicto = JSON.parse(JSON.stringify(SEMILLAS_RESERVAS_CONFLICTO_AUREA));
  }

  // ============================================================================
  // CU-ADMIN-10: Configurar Políticas y Parámetros de Reservas de Mesas
  // ============================================================================

  /**
   * GET /api/v1/admin/reservas/politicas
   */
  async getPoliticasReserva(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<PoliticasReservaDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    // Si el plan no incluye reservas (Plan Starter)
    if (this.planSaaSActual === 'starter') {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MODULO_RESERVAS_NO_CONTRATADO',
            mensaje: 'El módulo de reservas requiere Plan Pro o Enterprise. Tu empresa cuenta actualmente con el Plan Starter.',
          },
        ],
      };
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.politicasReserva)),
    };
  }

  /**
   * GET /api/v1/admin/reservas/politicas/precheck-desactivacion
   */
  async precheckDesactivacionReservas(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<PrecheckDesactivacionReservasResponse>> {
    await new Promise((r) => setTimeout(r, 50));

    const totalPendientes = this.reservasFuturasActivas.length;
    return {
      exito: true,
      datos: {
        permite_desactivar: totalPendientes === 0,
        total_pendientes: totalPendientes,
        reservas: totalPendientes > 0 ? JSON.parse(JSON.stringify(this.reservasFuturasActivas)) : [],
      },
    };
  }

  /**
   * PUT /api/v1/admin/reservas/politicas
   */
  async actualizarPoliticasReserva(req: ActualizarPoliticasReservaRequest): Promise<ApiResponse<PoliticasReservaDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    // Validar plan
    if (this.planSaaSActual === 'starter') {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MODULO_RESERVAS_NO_CONTRATADO',
            mensaje: 'El módulo de reservas requiere Plan Pro o Enterprise.',
          },
        ],
      };
    }

    // Validaciones de rangos y coherencia matemática
    if (req.duracion_reserva_min < 30 || req.duracion_reserva_min > 240) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'La duración estándar debe estar entre 30 y 240 minutos.' }],
      };
    }
    if (req.buffer_reserva_min < 0 || req.buffer_reserva_min > 60) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'El buffer de limpieza debe estar entre 0 y 60 minutos.' }],
      };
    }
    if (req.tolerancia_no_show_min < 5 || req.tolerancia_no_show_min > 60) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'La tolerancia de no-show debe estar entre 5 y 60 minutos.' }],
      };
    }
    if (req.minutos_bloqueo_previo < 0 || req.minutos_bloqueo_previo > 120) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'El bloqueo previo debe estar entre 0 y 120 minutos.' }],
      };
    }
    if (req.anticipacion_minima_horas < 0 || req.anticipacion_minima_horas > 48) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'La anticipación mínima debe estar entre 0 y 48 horas.' }],
      };
    }
    if (req.anticipacion_maxima_dias < 1 || req.anticipacion_maxima_dias > 90) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'La anticipación máxima debe estar entre 1 y 90 días.' }],
      };
    }

    // SALVAGUARDA: Si se intenta desactivar el interruptor maestro con reservas futuras activas
    if (this.politicasReserva.acepta_reservas && !req.acepta_reservas && this.reservasFuturasActivas.length > 0) {
      return {
        exito: false,
        datos: {
          permite_desactivar: false,
          total_pendientes: this.reservasFuturasActivas.length,
          reservas: JSON.parse(JSON.stringify(this.reservasFuturasActivas)),
        } as any,
        errores: [
          {
            codigo: 'ERR_RESERVAS_FUTURAS_PENDIENTES',
            mensaje: `No es posible deshabilitar reservas de salón porque existen ${this.reservasFuturasActivas.length} reservas futuras confirmadas pendientes. Atienda o cancele las reservas antes de desactivar el módulo.`,
          },
        ],
      };
    }

    // Actualizar registro
    this.politicasReserva = {
      ...this.politicasReserva,
      acepta_reservas: req.acepta_reservas,
      duracion_reserva_min: req.duracion_reserva_min,
      buffer_reserva_min: req.buffer_reserva_min,
      tolerancia_no_show_min: req.tolerancia_no_show_min,
      minutos_bloqueo_previo: req.minutos_bloqueo_previo,
      margen_recordatorio_min: req.margen_recordatorio_min,
      anticipacion_minima_horas: req.anticipacion_minima_horas,
      anticipacion_maxima_dias: req.anticipacion_maxima_dias,
      updated_at: new Date().toISOString(),
    };

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.politicasReserva)),
    };
  }

  /**
   * POST /api/v1/admin/reservas/politicas/restaurar-default
   */
  async restaurarPoliticasDefault(): Promise<ApiResponse<PoliticasReservaDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    this.politicasReserva = {
      ...SEMILLA_POLITICAS_RESERVA_AUREA,
      updated_at: new Date().toISOString(),
    };

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.politicasReserva)),
    };
  }

  // Métodos de simulación para QA Test Bench (CU-ADMIN-10)
  simularPlanStarter(activar: boolean) {
    this.planSaaSActual = activar ? 'starter' : 'pro';
  }

  simularExistenciaReservasFuturas(activar: boolean) {
    if (activar) {
      this.reservasFuturasActivas = JSON.parse(JSON.stringify(SEMILLAS_RESERVAS_FUTURAS_AUREA));
    } else {
      this.reservasFuturasActivas = [];
    }
  }

  restablecerSemillasPoliticas() {
    this.politicasReserva = JSON.parse(JSON.stringify(SEMILLA_POLITICAS_RESERVA_AUREA));
    this.reservasFuturasActivas = JSON.parse(JSON.stringify(SEMILLAS_RESERVAS_FUTURAS_AUREA));
    this.planSaaSActual = 'pro';
  }

  getPlanSaaSActual() {
    return this.planSaaSActual;
  }

  getReservasFuturasActivasCount() {
    return this.reservasFuturasActivas.length;
  }

  // ============================================================================
  // CU-ADMIN-11: Registrar y Consultar Historial de Incidentes Internos
  // ============================================================================

  /**
   * GET /api/v1/admin/incidentes
   */
  async getIncidentes(
    filtros?: FiltrosIncidentesRequest,
    _localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<IncidentesHistorialResponse>> {
    await new Promise((r) => setTimeout(r, 60));

    // Cálculo dinámico de KPIs globales de la sede
    const kpis: IncidentesKPIsDTO = {
      abiertos: this.incidentes.filter((i) => i.estado === 'abierto').length,
      en_revision: this.incidentes.filter((i) => i.estado === 'en_revision').length,
      gravedad_alta: this.incidentes.filter((i) => i.gravedad === 'alta' && i.estado !== 'resuelto').length,
      resueltos_mes: this.incidentes.filter((i) => i.estado === 'resuelto').length,
      con_nota_propietario: this.incidentes.filter(
        (i) => i.nota_propietario != null && i.nota_propietario.trim() !== ''
      ).length,
    };

    // Aplicación de filtros
    let filtrados = [...this.incidentes];

    if (filtros?.estado && filtros.estado !== 'todos') {
      filtrados = filtrados.filter((i) => i.estado === filtros.estado);
    }

    if (filtros?.gravedad && filtros.gravedad !== 'todas') {
      filtrados = filtrados.filter((i) => i.gravedad === filtros.gravedad);
    }

    if (filtros?.categoria && filtros.categoria !== 'todas') {
      filtrados = filtrados.filter((i) => i.categoria === filtros.categoria);
    }

    if (filtros?.empleado_id) {
      filtrados = filtrados.filter((i) => i.empleado_id === filtros.empleado_id);
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.trim().toLowerCase();
      filtrados = filtrados.filter(
        (i) =>
          i.codigo.toLowerCase().includes(q) ||
          i.titulo.toLowerCase().includes(q) ||
          i.descripcion.toLowerCase().includes(q) ||
          (i.empleado_nombre && i.empleado_nombre.toLowerCase().includes(q))
      );
    }

    // Ordenamiento descendente por fecha_hora
    filtrados.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

    // Paginación
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 10;
    const inicio = (pagina - 1) * limite;
    const paginados = filtrados.slice(inicio, inicio + limite);

    // Mapeo a IncidenteItemDTO con días en curso
    const items: IncidenteItemDTO[] = paginados.map((inc) => {
      const fechaOcurrido = new Date(inc.fecha_hora).getTime();
      const ahora = Date.now();
      const diasEnCurso = Math.max(0, Math.floor((ahora - fechaOcurrido) / (1000 * 60 * 60 * 24)));

      return {
        id: inc.id,
        codigo: inc.codigo,
        titulo: inc.titulo,
        categoria: inc.categoria,
        gravedad: inc.gravedad,
        empleado_id: inc.empleado_id,
        empleado_nombre: inc.empleado_nombre,
        fecha_hora: inc.fecha_hora,
        estado: inc.estado,
        visto_por_propietario: inc.visto_por_propietario,
        fecha_visto: inc.fecha_visto,
        tiene_nota_propietario: Boolean(inc.nota_propietario && inc.nota_propietario.trim() !== ''),
        total_avances: (inc.bitacora || []).filter((b) => b.tipo_evento === 'indagacion').length,
        dias_en_curso: diasEnCurso,
        created_at: inc.created_at,
      };
    });

    return {
      exito: true,
      datos: {
        kpis,
        incidentes: items,
        total: filtrados.length,
        pagina,
        limite,
      },
    };
  }

  /**
   * GET /api/v1/admin/incidentes/{id}
   */
  async getIncidenteDetalle(id: string): Promise<ApiResponse<IncidenteDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 40));
    const inc = this.incidentes.find((i) => i.id === id);
    if (!inc) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_INCIDENTE_NO_ENCONTRADO',
            mensaje: 'El incidente no existe o no pertenece a tu sede',
          },
        ],
      };
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(inc)),
    };
  }

  /**
   * POST /api/v1/admin/incidentes
   */
  async registrarIncidente(req: RegistrarIncidenteRequest): Promise<ApiResponse<IncidenteDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    // Validaciones
    if (!req.titulo || req.titulo.trim().length < 5) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_TITULO_INVALIDO', mensaje: 'El título debe tener al menos 5 caracteres.' }],
      };
    }

    if (!req.descripcion || req.descripcion.trim().length < 15) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_DESCRIPCION_INVALIDA', mensaje: 'La descripción pormenorizada debe contener al menos 15 caracteres.' }],
      };
    }

    if (req.resolucion_inmediata && (!req.resolucion_nota || req.resolucion_nota.trim().length < 10)) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RESOLUCION_NOTA_REQUERIDA', mensaje: 'Para resolver de inmediato, la nota de resolución debe contener al menos 10 caracteres.' }],
      };
    }

    // Generar código correlativo anual
    const codigo = `INC-2026-${String(this.seqIncidente++).padStart(3, '0')}`;
    const incidenteId = `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`;
    const now = new Date().toISOString();

    // Resolver nombre de colaborador si aplica
    let empleadoNombre: string | null = null;
    let empleadoId: string | null = null;
    if (req.involucra_empleado && req.empleado_id) {
      empleadoId = req.empleado_id;
      const emp = this.personal.find((p) => p.id === req.empleado_id);
      empleadoNombre = emp ? `${emp.nombre} (${emp.rol.charAt(0).toUpperCase() + emp.rol.slice(1)})` : null;
    }

    const bitacoraInicial: IncidenteBitacoraItemDTO[] = [
      {
        id: `bit-${Date.now()}-1`,
        incidente_id: incidenteId,
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'apertura',
        nota: req.descripcion.trim(),
        created_at: now,
      },
    ];

    const esResolucionInmediata = Boolean(req.resolucion_inmediata && req.resolucion_nota && req.resolucion_nota.trim().length >= 10);

    if (esResolucionInmediata) {
      bitacoraInicial.push({
        id: `bit-${Date.now()}-2`,
        incidente_id: incidenteId,
        usuario_id: '00000000-0000-4000-8000-000000000102',
        usuario_nombre: 'Marcos López (Administrador)',
        usuario_rol: 'admin_local',
        tipo_evento: 'resolucion',
        nota: req.resolucion_nota!.trim(),
        created_at: now,
      });
    }

    const nuevoIncidente: IncidenteDetalleDTO = {
      id: incidenteId,
      local_id: CANONICAL_LOCAL_ID,
      codigo,
      titulo: req.titulo.trim(),
      categoria: req.categoria,
      gravedad: req.gravedad,
      fecha_hora: req.fecha_hora || now,
      empleado_id: empleadoId,
      empleado_nombre: empleadoNombre,
      descripcion: req.descripcion.trim(),
      medidas_inmediatas: req.medidas_inmediatas ? req.medidas_inmediatas.trim() : null,
      foto_url: req.foto_url || null,
      registrado_por: '00000000-0000-4000-8000-000000000102',
      registrador_nombre: 'Marcos López (Administrador)',
      estado: esResolucionInmediata ? 'resuelto' : 'abierto',
      visto_por_propietario: false,
      fecha_visto: null,
      nota_propietario: null,
      motivo_revision: null,
      resolucion_nota: esResolucionInmediata ? req.resolucion_nota!.trim() : null,
      resuelto_por: esResolucionInmediata ? '00000000-0000-4000-8000-000000000102' : null,
      resuelto_por_nombre: esResolucionInmediata ? 'Marcos López (Administrador)' : null,
      fecha_resolucion: esResolucionInmediata ? now : null,
      bitacora: bitacoraInicial,
      created_at: now,
      updated_at: now,
    };

    this.incidentes.unshift(nuevoIncidente);

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(nuevoIncidente)),
    };
  }

  /**
   * POST /api/v1/admin/incidentes/{id}/bitacora
   */
  async agregarAvanceInvestigacion(
    id: string,
    req: AgregarAvanceInvestigacionRequest
  ): Promise<ApiResponse<IncidenteDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const inc = this.incidentes.find((i) => i.id === id);
    if (!inc) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_INCIDENTE_NO_ENCONTRADO', mensaje: 'El incidente no existe o no pertenece a tu sede' }],
      };
    }

    if (inc.estado === 'resuelto') {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_INCIDENTE_YA_RESUELTO', mensaje: 'El incidente ya ha sido resuelto y no admite modificaciones ulteriores' }],
      };
    }

    if (!req.nota || req.nota.trim().length < 5) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NOTA_REQUERIDA', mensaje: 'El avance de investigación debe contener al menos 5 caracteres' }],
      };
    }

    const now = new Date().toISOString();
    const nuevoAvance: IncidenteBitacoraItemDTO = {
      id: `bit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incidente_id: inc.id,
      usuario_id: '00000000-0000-4000-8000-000000000102',
      usuario_nombre: 'Marcos López (Administrador)',
      usuario_rol: 'admin_local',
      tipo_evento: 'indagacion',
      nota: req.nota.trim(),
      created_at: now,
    };

    if (!inc.bitacora) {
      inc.bitacora = [];
    }
    inc.bitacora.push(nuevoAvance);
    inc.estado = 'en_revision';
    inc.motivo_revision = req.nota.trim();
    inc.updated_at = now;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(inc)),
    };
  }

  /**
   * PATCH /api/v1/admin/incidentes/{id}/investigacion
   */
  async actualizarInvestigacionIncidente(
    id: string,
    req: InvestigacionIncidenteRequest
  ): Promise<ApiResponse<IncidenteDetalleDTO>> {
    return this.agregarAvanceInvestigacion(id, { nota: req.motivo_revision });
  }

  /**
   * PUT /api/v1/admin/incidentes/{id}/resolver
   */
  async resolverIncidente(
    id: string,
    req: ResolverIncidenteRequest
  ): Promise<ApiResponse<IncidenteDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 90));

    const inc = this.incidentes.find((i) => i.id === id);
    if (!inc) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_INCIDENTE_NO_ENCONTRADO', mensaje: 'El incidente no existe o no pertenece a tu sede' }],
      };
    }

    if (inc.estado === 'resuelto') {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_INCIDENTE_YA_RESUELTO', mensaje: 'El incidente ya ha sido resuelto y no admite modificaciones ulteriores' }],
      };
    }

    if (!req.resolucion_nota || req.resolucion_nota.trim().length < 10) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RESOLUCION_NOTA_REQUERIDA', mensaje: 'Las acciones correctivas definitivas son obligatorias (mínimo 10 caracteres)' }],
      };
    }

    const now = new Date().toISOString();
    inc.estado = 'resuelto';
    inc.resolucion_nota = req.resolucion_nota.trim();
    inc.resuelto_por = '00000000-0000-4000-8000-000000000102';
    inc.resuelto_por_nombre = 'Marcos López (Administrador)';
    inc.fecha_resolucion = now;
    inc.updated_at = now;

    if (!inc.bitacora) {
      inc.bitacora = [];
    }
    inc.bitacora.push({
      id: `bit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incidente_id: inc.id,
      usuario_id: '00000000-0000-4000-8000-000000000102',
      usuario_nombre: 'Marcos López (Administrador)',
      usuario_rol: 'admin_local',
      tipo_evento: 'resolucion',
      nota: req.resolucion_nota.trim(),
      created_at: now,
    });

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(inc)),
    };
  }

  // Métodos de simulación para QA Test Bench (CU-ADMIN-11)
  simularLecturaPropietario(incidenteId?: string) {
    const inc = incidenteId ? this.incidentes.find((i) => i.id === incidenteId) : this.incidentes.find((i) => !i.visto_por_propietario) || this.incidentes[0];
    if (inc) {
      inc.visto_por_propietario = true;
      inc.fecha_visto = new Date().toISOString();
      inc.updated_at = new Date().toISOString();
    }
  }

  simularDirectivaPropietario(incidenteId: string, directiva: string) {
    const inc = this.incidentes.find((i) => i.id === incidenteId) || this.incidentes[0];
    if (inc) {
      const now = new Date().toISOString();
      inc.visto_por_propietario = true;
      inc.fecha_visto = now;
      inc.nota_propietario = directiva.trim();
      inc.estado = 'en_revision';
      inc.updated_at = now;
      if (!inc.bitacora) {
        inc.bitacora = [];
      }
      inc.bitacora.push({
        id: `bit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        incidente_id: inc.id,
        usuario_id: '00000000-0000-4000-8000-000000000101',
        usuario_nombre: 'Roberto Silva (Propietario)',
        usuario_rol: 'propietario',
        tipo_evento: 'directiva_propietario',
        nota: directiva.trim(),
        created_at: now,
      });
    }
  }

  simularIncidenteCriticoDirectiva() {
    this.incidentes = JSON.parse(JSON.stringify(SEMILLAS_INCIDENTES_AUREA));
  }

  simularBandejaVacia() {
    this.incidentes = [];
  }

  restablecerSemillasIncidentes() {
    this.incidentes = JSON.parse(JSON.stringify(SEMILLAS_INCIDENTES_AUREA));
    this.seqIncidente = 86;
  }

  // ===========================================================================
  // MÉTODOS CORPORATIVOS MULTI-SEDE: CU-PROP-06 (Portal Propietario)
  // ===========================================================================

  /**
   * Obtiene el directorio de sedes de la empresa para el selector de filtros
   */
  getSedesEmpresa() {
    return JSON.parse(JSON.stringify(SEDES_EMPRESA_AUREA));
  }

  /**
   * GET /api/v1/propietario/incidentes
   * Bandeja consolidada multi-sede con KPIs agregados ejecutivos
   */
  async getIncidentesEmpresa(
    filtros: PropietarioIncidentesFiltrosRequest = {}
  ): Promise<ApiResponse<PropietarioIncidentesBandejaResponse>> {
    await new Promise((r) => setTimeout(r, 90));

    const getNombreLocal = (localId: string) => {
      if (localId === CANONICAL_LOCAL_ID) return CANONICAL_LOCAL_NOMBRE;
      if (localId === CANONICAL_LOCAL_SAN_ISIDRO_ID) return CANONICAL_LOCAL_SAN_ISIDRO_NOMBRE;
      const s = SEDES_EMPRESA_AUREA.find((sede) => sede.id === localId);
      return s ? s.nombre : 'Sede Corporativa';
    };

    // Calcular KPIs corporativos globales (o contextuales de la sede activa si se filtra por sede)
    const baseKpis =
      filtros.local_id && filtros.local_id !== 'todas'
        ? this.incidentes.filter((i) => i.local_id === filtros.local_id)
        : this.incidentes;

    const no_revisados = baseKpis.filter((i) => !i.visto_por_propietario).length;
    const no_revisados_alta = baseKpis.filter((i) => !i.visto_por_propietario && i.gravedad === 'alta').length;
    const gravedad_alta_activos = baseKpis.filter((i) => i.gravedad === 'alta' && i.estado !== 'resuelto').length;
    const total_mes = baseKpis.length;
    const desglose_mes = {
      abiertos: baseKpis.filter((i) => i.estado === 'abierto').length,
      en_revision: baseKpis.filter((i) => i.estado === 'en_revision').length,
      resueltos: baseKpis.filter((i) => i.estado === 'resuelto').length,
    };

    const resueltos_por_sede: Record<string, { total_resueltos: number; no_revisados: number }> = {};
    SEDES_EMPRESA_AUREA.forEach((s) => {
      const incSede = this.incidentes.filter((i) => i.local_id === s.id);
      resueltos_por_sede[s.id] = {
        total_resueltos: incSede.filter((i) => i.estado === 'resuelto').length,
        no_revisados: incSede.filter((i) => !i.visto_por_propietario).length,
      };
    });

    // Aplicar filtros a la lista de incidentes
    let lista = [...this.incidentes];

    if (filtros.local_id && filtros.local_id !== 'todas') {
      lista = lista.filter((i) => i.local_id === filtros.local_id);
    }
    if (filtros.gravedad && filtros.gravedad !== 'todas') {
      lista = lista.filter((i) => i.gravedad === filtros.gravedad);
    }
    if (filtros.categoria && filtros.categoria !== 'todas') {
      lista = lista.filter((i) => i.categoria === filtros.categoria);
    }
    if (filtros.estado && filtros.estado !== 'todos') {
      lista = lista.filter((i) => i.estado === filtros.estado);
    }
    if (filtros.no_vistos) {
      lista = lista.filter((i) => !i.visto_por_propietario);
    }
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const q = filtros.busqueda.toLowerCase().trim();
      lista = lista.filter(
        (i) =>
          i.titulo.toLowerCase().includes(q) ||
          i.codigo.toLowerCase().includes(q) ||
          (i.empleado_nombre && i.empleado_nombre.toLowerCase().includes(q)) ||
          i.descripcion.toLowerCase().includes(q)
      );
    }

    // Ordenar de más reciente a más antiguo
    lista.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginación
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 15;
    const total = lista.length;
    const total_paginas = Math.ceil(total / limite) || 1;
    const inicio = (pagina - 1) * limite;
    const itemsPaginados = lista.slice(inicio, inicio + limite);

    const itemsDTO: IncidenteBandejaItemDTO[] = itemsPaginados.map((inc) => {
      const fechaCreacion = new Date(inc.created_at);
      const diffMs = Date.now() - fechaCreacion.getTime();
      const diasEnCurso = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        id: inc.id,
        codigo: inc.codigo,
        local_id: inc.local_id,
        local_nombre: getNombreLocal(inc.local_id),
        gravedad: inc.gravedad,
        categoria: inc.categoria,
        titulo: inc.titulo,
        involucrado_nombre: inc.empleado_nombre || null,
        involucrado_cargo: inc.empleado_nombre ? inc.empleado_nombre.split('(')[1]?.replace(')', '') || null : null,
        estado: inc.estado,
        visto_por_propietario: inc.visto_por_propietario,
        fecha_visto: inc.fecha_visto,
        tiene_evidencia: Boolean(inc.foto_url),
        total_avances: inc.bitacora ? inc.bitacora.length : 0,
        dias_en_curso: diasEnCurso,
        created_at: inc.created_at,
      };
    });

    return {
      exito: true,
      datos: {
        kpis: {
          no_revisados,
          no_revisados_alta,
          gravedad_alta_activos,
          total_mes,
          desglose_mes,
          resueltos_por_sede,
        },
        incidentes: itemsDTO,
        paginacion: {
          total,
          pagina,
          limite,
          total_paginas,
        },
      },
    };
  }

  /**
   * GET /api/v1/propietario/incidentes/{id}
   * Detalle con marcado automático transparente de lectura en la primera apertura
   */
  async getIncidenteDetallePropietario(id: string): Promise<ApiResponse<IncidenteDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    const inc = this.incidentes.find((i) => i.id === id);
    if (!inc) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_INCIDENTE_NOT_FOUND',
            mensaje: 'El incidente solicitado no existe o no pertenece a su organización.',
          },
        ],
      };
    }

    // Efecto colateral transparente en DB: marcar como visto si era false
    if (!inc.visto_por_propietario) {
      const now = new Date().toISOString();
      inc.visto_por_propietario = true;
      inc.fecha_visto = now;
      inc.updated_at = now;
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(inc)),
    };
  }

  /**
   * PATCH /api/v1/propietario/incidentes/{id}/pasar-a-revision
   * Intervención ejecutiva del propietario con directiva vinculante
   */
  async pasarIncidenteARevisionPropietario(
    id: string,
    req: PasarARevisionRequest
  ): Promise<ApiResponse<IncidenteDetalleDTO>> {
    await new Promise((r) => setTimeout(r, 110));

    const inc = this.incidentes.find((i) => i.id === id);
    if (!inc) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_INCIDENTE_NOT_FOUND',
            mensaje: 'El incidente solicitado no existe o no pertenece a su organización.',
          },
        ],
      };
    }

    if (inc.estado === 'resuelto') {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_INCIDENTE_YA_RESUELTO',
            mensaje: 'El incidente ya fue resuelto por la administración de la sede y no puede pasar a revisión.',
          },
        ],
      };
    }

    if (!req.nota_propietario || req.nota_propietario.trim().length < 5) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOTA_PROPIETARIO_MIN',
            mensaje: 'La directiva u observación ejecutiva debe contener al menos 5 caracteres.',
          },
        ],
      };
    }

    if (req.nota_propietario.trim().length > 2000) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_NOTA_PROPIETARIO_EXCEDE_MAX',
            mensaje: 'La instrucción u observación no puede superar los 2,000 caracteres.',
          },
        ],
      };
    }

    const now = new Date().toISOString();
    inc.estado = 'en_revision';
    inc.nota_propietario = req.nota_propietario.trim();
    inc.visto_por_propietario = true;
    if (!inc.fecha_visto) {
      inc.fecha_visto = now;
    }
    inc.updated_at = now;

    if (!inc.bitacora) {
      inc.bitacora = [];
    }

    inc.bitacora.push({
      id: `bit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incidente_id: inc.id,
      usuario_id: '00000000-0000-4000-8000-000000000101',
      usuario_nombre: 'Roberto Silva (Propietario)',
      usuario_rol: 'propietario',
      tipo_evento: 'directiva_propietario',
      nota: req.nota_propietario.trim(),
      created_at: now,
    });

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(inc)),
    };
  }

  /**
   * Simular la llegada concurrente de un incidente crítico en tiempo real
   */
  simularNuevoIncidenteCriticoSse(sedeId: string = CANONICAL_LOCAL_ID): IncidenteDetalleDTO {
    const codigo = `INC-2026-${String(this.seqIncidente++).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const esSanIsidro = sedeId === CANONICAL_LOCAL_SAN_ISIDRO_ID;

    const nuevo: IncidenteDetalleDTO = {
      id: `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`,
      local_id: sedeId,
      codigo,
      titulo: esSanIsidro
        ? 'Derrame de líquido inflamable en pasillo de bar'
        : 'Corte de energía sectorial y desconexión de refrigerador de mariscos',
      categoria: esSanIsidro ? 'seguridad_higiene' : 'rotura_merma',
      gravedad: 'alta',
      fecha_hora: now,
      empleado_id: null,
      empleado_nombre: null,
      descripcion: esSanIsidro
        ? 'Se detectó rotura de botella de destilado de alta graduación en el pasillo posterior de bar. Se evacuó temporalmente el pasillo.'
        : 'Fluctuación eléctrica apagó preventivamente la conservadora N° 1 de pescados del día durante turno almuerzo.',
      medidas_inmediatas: esSanIsidro
        ? 'Ventilación forzada y absorción de material inflamable con arena sintética.'
        : 'Arranque de grupo electrógeno auxiliar y resguardo térmico con hielo seco.',
      foto_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      registrado_por: esSanIsidro ? '00000000-0000-4000-8000-000000000107' : '00000000-0000-4000-8000-000000000102',
      registrador_nombre: esSanIsidro ? 'Diana Alarcón (Admin San Isidro)' : 'Marcos López (Administrador)',
      estado: 'abierto',
      visto_por_propietario: false,
      fecha_visto: null,
      nota_propietario: null,
      motivo_revision: null,
      resolucion_nota: null,
      resuelto_por: null,
      resuelto_por_nombre: null,
      fecha_resolucion: null,
      bitacora: [
        {
          id: `bit-${Date.now()}-1`,
          incidente_id: '',
          usuario_id: esSanIsidro ? '00000000-0000-4000-8000-000000000107' : '00000000-0000-4000-8000-000000000102',
          usuario_nombre: esSanIsidro ? 'Diana Alarcón (Admin San Isidro)' : 'Marcos López (Administrador)',
          usuario_rol: 'admin_local',
          tipo_evento: 'apertura',
          nota: esSanIsidro
            ? 'Alerta crítica: Derrame de líquido inflamable en pasillo de bar.'
            : 'Alerta crítica: Falla de energía sectorial en refrigerador de mariscos.',
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };
    nuevo.bitacora[0].incidente_id = nuevo.id;

    this.incidentes.unshift(nuevo);
    return JSON.parse(JSON.stringify(nuevo));
  }

  // ===========================================================================
  // MÉTODOS DE AUDITORÍA DE ANULACIONES Y NOTIFICACIONES: CU-ADMIN-12
  // ===========================================================================

  /**
   * GET /api/v1/admin/anulaciones
   * Retorna KPIs del día y bandeja filtrada de anulaciones
   */
  async getBandejaAnulaciones(
    filtros: FiltrosAnulacionesRequest = {}
  ): Promise<ApiResponse<AnulacionesBandejaResponseDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const fechaActiva = filtros.fecha || '2026-10-09';
    let lista = [...this.anulaciones];

    // Filtro por fecha (prefijo YYYY-MM-DD)
    if (filtros.fecha) {
      lista = lista.filter((a) => a.anulado_at.startsWith(filtros.fecha!));
    }

    // Filtros rápidos en píldora
    if (filtros.filtro_rapido) {
      switch (filtros.filtro_rapido) {
        case 'pendientes':
          lista = lista.filter((a) => !a.revisado);
          break;
        case 'con_merma':
          lista = lista.filter((a) => a.es_merma);
          break;
        case 'sin_merma':
          lista = lista.filter((a) => !a.es_merma);
          break;
        case 'comandas_totales':
          lista = lista.filter((a) => a.tipo_anulacion === 'comanda_completa');
          break;
        case 'todas':
        default:
          break;
      }
    }

    // Filtro por mozo
    if (filtros.mozo_id && filtros.mozo_id !== 'todos') {
      lista = lista.filter((a) => a.mozo_id === filtros.mozo_id);
    }

    // Buscador textual
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const q = filtros.busqueda.toLowerCase().trim();
      lista = lista.filter(
        (a) =>
          a.producto_nombre.toLowerCase().includes(q) ||
          a.mesa_numero.toLowerCase().includes(q) ||
          a.codigo.toLowerCase().includes(q) ||
          a.mozo_nombre.toLowerCase().includes(q) ||
          a.motivo_detalle.toLowerCase().includes(q)
      );
    }

    // Ordenar de más reciente a más antiguo
    lista.sort((a, b) => new Date(b.anulado_at).getTime() - new Date(a.anulado_at).getTime());

    // Calcular KPIs del día activo
    const baseDia = filtros.fecha
      ? this.anulaciones.filter((a) => a.anulado_at.startsWith(filtros.fecha!))
      : this.anulaciones;

    const total_anulaciones = baseDia.length;
    const monto_total = baseDia.reduce((sum, a) => sum + a.monto_total, 0);
    const con_merma_cantidad = baseDia.filter((a) => a.es_merma).length;
    const costo_merma_total = baseDia.reduce((sum, a) => sum + (a.costo_merma || 0), 0);
    const mesas_afectadas = new Set(baseDia.map((a) => a.mesa_numero)).size;
    const pendientes_revision = baseDia.filter((a) => !a.revisado).length;

    return {
      exito: true,
      datos: {
        fecha: fechaActiva,
        kpis: {
          total_anulaciones,
          monto_total,
          con_merma_cantidad,
          costo_merma_total,
          mesas_afectadas,
          pendientes_revision,
        },
        anulaciones: JSON.parse(JSON.stringify(lista)),
      },
    };
  }

  /**
   * GET /api/v1/admin/anulaciones/{id}
   */
  async getAnulacionDetalle(id: string): Promise<ApiResponse<PedidoAnulacionItemDTO>> {
    await new Promise((r) => setTimeout(r, 40));
    const item = this.anulaciones.find((a) => a.id === id);
    if (!item) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_ANULACION_NO_ENCONTRADA',
            mensaje: 'El registro de anulación solicitado no existe o pertenece a otra sede.',
          },
        ],
      };
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(item)),
    };
  }

  /**
   * POST /api/v1/admin/anulaciones/{id}/revisar
   * Marca conformidad de auditoría administrativa
   */
  async marcarAnulacionRevisada(
    id: string,
    req?: MarcarRevisadoRequestDTO
  ): Promise<ApiResponse<PedidoAnulacionItemDTO>> {
    await new Promise((r) => setTimeout(r, 70));
    const item = this.anulaciones.find((a) => a.id === id);
    if (!item) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_ANULACION_NO_ENCONTRADA',
            mensaje: 'El registro de anulación no existe.',
          },
        ],
      };
    }

    const now = new Date().toISOString();
    item.revisado = true;
    item.revisado_por = '00000000-0000-4000-8000-000000000102';
    item.revisado_por_nombre = 'Marcos López (Administrador)';
    item.revisado_at = now;
    if (req?.notas_supervision && req.notas_supervision.trim()) {
      item.notas_supervision = req.notas_supervision.trim();
    }

    // Marcar como leída la notificación vinculada en la campana
    const notifVinculada = this.notificacionesCampana.find((n) => n.anulacion_id === id);
    if (notifVinculada) {
      notifVinculada.leido = true;
    }

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(item)),
    };
  }

  /**
   * POST /api/v1/admin/anulaciones/{id}/escalar-incidente
   * Escala asistidamente la anulación hacia CU-ADMIN-11 y vincula incidente_id
   */
  async escalarAnulacionAIncidente(
    id: string,
    req: EscalarIncidenteAnulacionRequest
  ): Promise<ApiResponse<{ anulacion: PedidoAnulacionItemDTO; incidente: IncidenteDetalleDTO }>> {
    await new Promise((r) => setTimeout(r, 100));

    const item = this.anulaciones.find((a) => a.id === id);
    if (!item) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_ANULACION_NO_ENCONTRADA',
            mensaje: 'El registro de anulación no existe.',
          },
        ],
      };
    }

    if (item.incidente_id) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_YA_ESCALADO',
            mensaje: `Esta anulación ya fue escalada previamente bajo el expediente ${item.incidente_codigo}.`,
          },
        ],
      };
    }

    if (!req.medidas_adoptadas || req.medidas_adoptadas.trim().length < 10) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MEDIDAS_REQUERIDAS',
            mensaje: 'Las medidas inmediatas adoptadas deben contener al menos 10 caracteres.',
          },
        ],
      };
    }

    const now = new Date().toISOString();
    const codigoIncidente = `INC-2026-${String(this.seqIncidente++).padStart(3, '0')}`;
    const nuevoIncidenteId = `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`;

    const descripcionIncidente = `Anulación ${item.codigo} en ${item.mesa_numero}: ${item.producto_nombre} (S/ ${item.monto_total.toFixed(2)}). Motivo manifestado: ${item.motivo_detalle}${
      item.es_merma ? ` [Impacto de merma culinaria: S/ ${(item.costo_merma || 0).toFixed(2)}]` : ''
    }`;

    const nuevoIncidente: IncidenteDetalleDTO = {
      id: nuevoIncidenteId,
      local_id: item.local_id,
      codigo: codigoIncidente,
      titulo: req.titulo.trim(),
      categoria: req.categoria,
      gravedad: req.gravedad,
      fecha_hora: item.anulado_at,
      empleado_id: item.mozo_id,
      empleado_nombre: `${item.mozo_nombre} (Mozo)`,
      descripcion: descripcionIncidente,
      medidas_inmediatas: req.medidas_adoptadas.trim(),
      foto_url: null,
      registrado_por: '00000000-0000-4000-8000-000000000102',
      registrador_nombre: 'Marcos López (Administrador)',
      estado: 'en_revision',
      visto_por_propietario: false,
      fecha_visto: null,
      nota_propietario: null,
      motivo_revision: 'Escalamiento formal por queja o impacto de merma en salón.',
      resolucion_nota: null,
      resuelto_por: null,
      resuelto_por_nombre: null,
      fecha_resolucion: null,
      bitacora: [
        {
          id: `bit-${Date.now()}-1`,
          incidente_id: nuevoIncidenteId,
          usuario_id: '00000000-0000-4000-8000-000000000102',
          usuario_nombre: 'Marcos López (Administrador)',
          usuario_rol: 'admin_local',
          tipo_evento: 'apertura',
          nota: `Apertura de caso derivado de la anulación ${item.codigo}. Medidas: ${req.medidas_adoptadas.trim()}`,
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };

    // Insertar en la colección de incidentes (CU-ADMIN-11 y CU-PROP-06)
    this.incidentes.unshift(nuevoIncidente);

    // Actualizar vinculación relacional inmutable en pedido_anulacion
    item.incidente_id = nuevoIncidenteId;
    item.incidente_codigo = codigoIncidente;
    item.revisado = true;
    item.revisado_por = '00000000-0000-4000-8000-000000000102';
    item.revisado_por_nombre = 'Marcos López (Administrador)';
    item.revisado_at = now;
    item.notas_supervision = `Escalado a expediente ${codigoIncidente}`;

    return {
      exito: true,
      datos: {
        anulacion: JSON.parse(JSON.stringify(item)),
        incidente: JSON.parse(JSON.stringify(nuevoIncidente)),
      },
    };
  }

  /**
   * GET /api/v1/admin/notificaciones
   * Retorna la bandeja de notificaciones para el dropdown de la campana
   */
  async getNotificacionesCampana(): Promise<ApiResponse<NotificacionCampanaDTO[]>> {
    await new Promise((r) => setTimeout(r, 40));
    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.notificacionesCampana)),
    };
  }

  /**
   * POST /api/v1/admin/notificaciones/marcar-todas-leidas
   */
  async marcarTodasNotificacionesLeidas(): Promise<ApiResponse<boolean>> {
    this.notificacionesCampana.forEach((n) => {
      n.leido = true;
    });
    return {
      exito: true,
      datos: true,
    };
  }

  /**
   * POST /api/v1/admin/notificaciones/{id}/leer
   */
  async marcarNotificacionLeida(id: string): Promise<ApiResponse<boolean>> {
    const notif = this.notificacionesCampana.find((n) => n.id === id);
    if (notif) {
      notif.leido = true;
    }
    return {
      exito: true,
      datos: true,
    };
  }

  /**
   * Suscripción reactiva a notificaciones de sede (simulación mock)
   */
  subscribirNotificacionesSse(listener: (notif: NotificacionCampanaDTO) => void): () => void {
    this.notificacionesSseListeners.add(listener);
    return () => {
      this.notificacionesSseListeners.delete(listener);
    };
  }

  /**
   * Simula la llegada concurrente de una anulación en salón
   */
  simularNuevaAnulacionSse(tipo: 'item' | 'comanda' = 'item'): NotificacionCampanaDTO {
    const now = new Date().toISOString();
    const codigoAnulacion = `ANUL-2026-0${this.seqAnulacion++}`;
    const id = `anul-${Date.now()}`;

    const nuevaAnulacion: PedidoAnulacionItemDTO = {
      id,
      codigo: codigoAnulacion,
      local_id: CANONICAL_LOCAL_ID,
      pedido_id: `ped-${Date.now()}`,
      pedido_item_id: tipo === 'item' ? `item-${Date.now()}` : null,
      tipo_anulacion: tipo === 'item' ? 'item_individual' : 'comanda_completa',
      mesa_id: 'm1a2b3c4-0001-4000-8000-000000000004',
      mesa_numero: tipo === 'item' ? 'Mesa 04' : 'Mesa 07',
      producto_id: tipo === 'item' ? 'prod-0000-0003' : null,
      producto_nombre: tipo === 'item' ? '1x Ceviche Clásico de Corvina' : 'Comanda Total #160 (3 platos)',
      cantidad: tipo === 'item' ? 1 : 3,
      precio_unitario: tipo === 'item' ? 45.0 : 32.0,
      monto_total: tipo === 'item' ? 45.0 : 96.0,
      mozo_id: '00000000-0000-4000-8000-000000000103',
      mozo_nombre: 'Carlos Mendoza',
      anulado_por: '00000000-0000-4000-8000-000000000103',
      anulado_por_nombre: 'Carlos Mendoza (Mozo)',
      motivo_categoria: tipo === 'item' ? 'demora_cliente' : 'retiro_sin_consumo',
      motivo_detalle: tipo === 'item'
        ? 'El comensal manifestó que debía retirarse al aeropuerto y canceló el cebiche en mesa.'
        : 'Los comensales recibieron llamada de urgencia y desocuparon la mesa.',
      pedido_created_at: new Date(Date.now() - 22 * 60000).toISOString(),
      anulado_at: now,
      minutos_espera: 22,
      estado_anterior: 'en_preparacion',
      es_merma: tipo === 'item',
      costo_merma: tipo === 'item' ? 18.0 : null,
      revisado: false,
      revisado_por: null,
      revisado_por_nombre: null,
      revisado_at: null,
      notas_supervision: null,
      incidente_id: null,
      incidente_codigo: null,
      partida_cocina: 'Cocina Fría (Cebichería)',
      created_at: now,
    };

    this.anulaciones.unshift(nuevaAnulacion);

    const nuevaNotif: NotificacionCampanaDTO = {
      id: `notif-${Date.now()}`,
      tipo: tipo === 'item' ? 'anulacion_item' : 'anulacion_comanda',
      prioridad: tipo === 'item' ? 'alta' : 'critica',
      titulo: tipo === 'item' ? `Anulación en ${nuevaAnulacion.mesa_numero}` : `Comanda Completa Anulada en ${nuevaAnulacion.mesa_numero}`,
      mensaje: `${nuevaAnulacion.producto_nombre} (S/ ${nuevaAnulacion.monto_total.toFixed(2)}) por ${nuevaAnulacion.mozo_nombre} • Motivo: Demora (22m de espera)`,
      leido: false,
      anulacion_id: id,
      mesa_numero: nuevaAnulacion.mesa_numero,
      monto: nuevaAnulacion.monto_total,
      created_at: now,
    };

    this.notificacionesCampana.unshift(nuevaNotif);

    // Notificar a todos los suscriptores activos
    this.notificacionesSseListeners.forEach((listener) => {
      try {
        listener(nuevaNotif);
      } catch (err) {
        console.error('Error al emitir notificación:', err);
      }
    });

    return nuevaNotif;
  }

  /**
   * Simula el estado vacío de cero anulaciones para probar la Vista 4
   */
  simularDiaSinAnulaciones(): void {
    this.anulaciones = [];
  }

  /**
   * Restablece las semillas canónicas de anulaciones y notificaciones
   */
  restablecerSemillasAnulaciones(): void {
    this.anulaciones = JSON.parse(JSON.stringify(SEMILLAS_ANULACIONES_AUREA));
    this.notificacionesCampana = JSON.parse(JSON.stringify(SEMILLAS_NOTIFICACIONES_CAMPANA));
    this.seqAnulacion = 43;
  }

  // ===========================================================================
  // MÉTODOS DE GESTIÓN DE PROMOCIONES: CU-ADMIN-17
  // Coherencia con CU-CAJA-02, CU-CAJA-03, CU-MOZO-08, CU-MOZO-09
  // ===========================================================================

  private calcularEstadoVisualPromo(p: PromocionAdminDTO): EstadoVisualPromocion {
    const today = '2026-10-09';
    if (!p.activa) {
      if (today > p.fecha_fin) return 'vencida';
      return 'pausada';
    }
    if (today < p.fecha_inicio) return 'programada';
    if (today > p.fecha_fin) return 'vencida';

    // Regla de agotamiento por cupo (Opción C: Zero-Cron O(1))
    if (p.tipo_limite_usos === 'diario' && p.limite_usos != null) {
      const usosHoyEfectivos = p.fecha_ultimo_uso === today ? p.usos_hoy : 0;
      if (usosHoyEfectivos >= p.limite_usos) return 'agotada_hoy';
    } else if (p.tipo_limite_usos === 'global' && p.limite_usos != null) {
      if (p.usos_actuales >= p.limite_usos) return 'agotada';
    }

    return 'vigente';
  }

  /**
   * GET /api/v1/admin/promociones
   * Retorna lista de promociones con filtros y KPIs de sede
   */
  async getBandejaPromociones(
    filtros: FiltrosPromocionesRequest = {}
  ): Promise<ApiResponse<PromocionesBandejaResponseDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    // Actualizar estados visuales dinámicos
    this.promociones.forEach((p) => {
      p.estado_visual = this.calcularEstadoVisualPromo(p);
    });

    let lista = [...this.promociones];

    // Filtro por estado
    if (filtros.estado && filtros.estado !== 'todas') {
      switch (filtros.estado) {
        case 'vigentes':
          lista = lista.filter((p) => p.estado_visual === 'vigente');
          break;
        case 'programadas':
          lista = lista.filter((p) => p.estado_visual === 'programada');
          break;
        case 'pausadas':
          lista = lista.filter((p) => p.estado_visual === 'pausada');
          break;
        case 'vencidas':
          lista = lista.filter((p) => p.estado_visual === 'vencida');
          break;
        case 'agotadas':
          lista = lista.filter((p) => p.estado_visual === 'agotada' || p.estado_visual === 'agotada_hoy');
          break;
        default:
          break;
      }
    }

    // Filtro por tipo de descuento
    if (filtros.tipo_descuento && filtros.tipo_descuento !== 'todos') {
      lista = lista.filter((p) => p.tipo_descuento === filtros.tipo_descuento);
    }

    // Buscador
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const q = filtros.busqueda.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    // KPIs consolidados de la sede
    const vigentes_hoy = this.promociones.filter((p) => p.estado_visual === 'vigente').length;
    const campanas_programadas = this.promociones.filter((p) => p.estado_visual === 'programada').length;
    const descuentos_mes = this.promociones.reduce((sum, p) => sum + p.total_descontado, 0);
    const cuentas_beneficiadas = this.promociones.reduce((sum, p) => sum + p.usos_actuales, 0);

    return {
      exito: true,
      datos: {
        kpis: {
          vigentes_hoy,
          campanas_programadas,
          descuentos_mes,
          cuentas_beneficiadas,
        },
        promociones: JSON.parse(JSON.stringify(lista)),
        total: lista.length,
      },
    };
  }

  /**
   * GET /api/v1/admin/promociones/buscar?q={query}&estado={estado}&tipo={tipo}
   * Búsqueda optimizada por demanda (activada por botón o tecla Enter).
   * Evita ráfagas por pulsación de tecla y no recalcula KPIs de sede para máxima eficiencia.
   */
  async buscarPromociones(
    q: string,
    estado?: FiltroEstadoPromocion,
    tipo?: FiltroTipoPromocion
  ): Promise<ApiResponse<BuscarPromocionesResponseDTO>> {
    await new Promise((r) => setTimeout(r, 40));

    // Actualizar estados visuales dinámicos
    this.promociones.forEach((p) => {
      p.estado_visual = this.calcularEstadoVisualPromo(p);
    });

    let lista = [...this.promociones];

    // Filtro por término de búsqueda (nombre, código o descripción)
    if (q && q.trim()) {
      const termino = q.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termino) ||
          p.codigo.toLowerCase().includes(termino) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(termino))
      );
    }

    // Filtro por estado
    if (estado && estado !== 'todas') {
      switch (estado) {
        case 'vigentes':
          lista = lista.filter((p) => p.estado_visual === 'vigente');
          break;
        case 'programadas':
          lista = lista.filter((p) => p.estado_visual === 'programada');
          break;
        case 'pausadas':
          lista = lista.filter((p) => p.estado_visual === 'pausada');
          break;
        case 'vencidas':
          lista = lista.filter((p) => p.estado_visual === 'vencida');
          break;
        case 'agotadas':
          lista = lista.filter((p) => p.estado_visual === 'agotada' || p.estado_visual === 'agotada_hoy');
          break;
        default:
          break;
      }
    }

    // Filtro por tipo de descuento
    if (tipo && tipo !== 'todos') {
      lista = lista.filter((p) => p.tipo_descuento === tipo);
    }

    return {
      exito: true,
      datos: {
        termino: q.trim(),
        resultados: JSON.parse(JSON.stringify(lista)),
        total: lista.length,
      },
    };
  }

  /**
   * GET /api/v1/admin/promociones/{id}
   */
  async getPromocionDetalle(id: string): Promise<ApiResponse<PromocionAdminDTO>> {
    await new Promise((r) => setTimeout(r, 40));
    const promo = this.promociones.find((p) => p.id === id);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROMOCION_NO_ENCONTRADA',
            mensaje: 'La promoción solicitada no existe o fue desvinculada de la sede.',
          },
        ],
      };
    }

    promo.estado_visual = this.calcularEstadoVisualPromo(promo);
    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(promo)),
    };
  }

  /**
   * POST /api/v1/admin/promociones
   * Creación con validaciones de fechas, topes y duplicados
   */
  async crearPromocion(req: CrearPromocionRequest): Promise<ApiResponse<PromocionAdminDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    // Validar nombre duplicado en la misma sede
    const duplicado = this.promociones.some(
      (p) => p.nombre.toLowerCase().trim() === req.nombre.toLowerCase().trim()
    );
    if (duplicado) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROMOCION_DUPLICADA',
            mensaje: `Ya existe una promoción activa o registrada con el nombre "${req.nombre}" en esta sede.`,
          },
        ],
      };
    }

    if (req.fecha_inicio > req.fecha_fin) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_FECHAS_INVALIDAS',
            mensaje: 'La fecha de inicio no puede ser posterior a la fecha de finalización.',
          },
        ],
      };
    }

    if (req.tipo_descuento === 'porcentaje' && (req.valor <= 0 || req.valor > 100)) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_VALOR_PORCENTAJE',
            mensaje: 'El porcentaje de descuento debe encontrarse estrictamente entre 1% y 100%.',
          },
        ],
      };
    }

    const id = `promo-0000-${String(Date.now()).slice(-6)}`;
    const codigo = `PROMO-2026-${String(this.seqPromo++).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const nuevaPromo: PromocionAdminDTO = {
      id,
      codigo,
      local_id: CANONICAL_LOCAL_ID,
      nombre: req.nombre.trim(),
      descripcion: req.descripcion?.trim() || null,
      tipo_descuento: req.tipo_descuento,
      valor: req.valor,
      tope_maximo_descuento: req.tope_maximo_descuento ?? null,
      monto_minimo_consumo: req.monto_minimo_consumo ?? 0.0,
      dias_semana: req.dias_semana && req.dias_semana.length > 0 ? req.dias_semana : [1, 2, 3, 4, 5, 6, 7],
      hora_inicio: req.hora_inicio || null,
      hora_fin: req.hora_fin || null,
      fecha_inicio: req.fecha_inicio,
      fecha_fin: req.fecha_fin,
      tipo_limite_usos: req.tipo_limite_usos || (req.limite_usos ? 'global' : 'sin_limite'),
      limite_usos: req.limite_usos ?? null,
      usos_actuales: 0,
      usos_hoy: 0,
      fecha_ultimo_uso: null,
      activa: req.activa,
      estado_visual: 'vigente',
      total_descontado: 0.0,
      total_ventas_asociadas: 0.0,
      created_at: now,
      updated_at: now,
    };

    nuevaPromo.estado_visual = this.calcularEstadoVisualPromo(nuevaPromo);
    this.promociones.unshift(nuevaPromo);

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(nuevaPromo)),
    };
  }

  /**
   * PUT /api/v1/admin/promociones/{id}
   */
  async actualizarPromocion(
    id: string,
    req: ActualizarPromocionRequest
  ): Promise<ApiResponse<PromocionAdminDTO>> {
    await new Promise((r) => setTimeout(r, 60));
    const promo = this.promociones.find((p) => p.id === id);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROMOCION_NO_ENCONTRADA',
            mensaje: 'La promoción que intentas modificar no existe.',
          },
        ],
      };
    }

    if (req.nombre && req.nombre.toLowerCase().trim() !== promo.nombre.toLowerCase().trim()) {
      const duplicado = this.promociones.some(
        (p) => p.id !== id && p.nombre.toLowerCase().trim() === req.nombre!.toLowerCase().trim()
      );
      if (duplicado) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_PROMOCION_DUPLICADA',
              mensaje: `El nombre "${req.nombre}" ya está en uso por otra campaña.`,
            },
          ],
        };
      }
      promo.nombre = req.nombre.trim();
    }

    if (req.descripcion !== undefined) promo.descripcion = req.descripcion?.trim() || null;
    if (req.tipo_descuento !== undefined) promo.tipo_descuento = req.tipo_descuento;
    if (req.valor !== undefined) promo.valor = req.valor;
    if (req.tope_maximo_descuento !== undefined) promo.tope_maximo_descuento = req.tope_maximo_descuento;
    if (req.monto_minimo_consumo !== undefined) promo.monto_minimo_consumo = req.monto_minimo_consumo;
    if (req.dias_semana !== undefined) promo.dias_semana = req.dias_semana;
    if (req.hora_inicio !== undefined) promo.hora_inicio = req.hora_inicio || null;
    if (req.hora_fin !== undefined) promo.hora_fin = req.hora_fin || null;
    if (req.fecha_inicio !== undefined) promo.fecha_inicio = req.fecha_inicio;
    if (req.fecha_fin !== undefined) promo.fecha_fin = req.fecha_fin;
    if (req.tipo_limite_usos !== undefined) promo.tipo_limite_usos = req.tipo_limite_usos;
    if (req.limite_usos !== undefined) promo.limite_usos = req.limite_usos;
    if (req.activa !== undefined) promo.activa = req.activa;

    promo.updated_at = new Date().toISOString();
    promo.estado_visual = this.calcularEstadoVisualPromo(promo);

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(promo)),
    };
  }

  /**
   * PATCH /api/v1/admin/promociones/{id}/estado
   * Switch de activación inmediata en Caja
   */
  async toggleEstadoPromocion(
    id: string,
    activa: boolean
  ): Promise<ApiResponse<PromocionAdminDTO>> {
    await new Promise((r) => setTimeout(r, 40));
    const promo = this.promociones.find((p) => p.id === id);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROMOCION_NO_ENCONTRADA',
            mensaje: 'No se encontró la promoción a modificar.',
          },
        ],
      };
    }

    if (activa) {
      const today = '2026-10-09';
      if (today > promo.fecha_fin) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_PROMOCION_VENCIDA',
              mensaje: `No es posible habilitar en caja la promoción "${promo.nombre}" porque su periodo de vigencia culminó el ${promo.fecha_fin}. Modifica la fecha de fin antes de reactivarla.`,
            },
          ],
        };
      }

      if (
        promo.tipo_limite_usos === 'global' &&
        promo.limite_usos != null &&
        promo.usos_actuales >= promo.limite_usos
      ) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_CUPO_AGOTADO',
              mensaje: `No es posible habilitar en caja la promoción "${promo.nombre}" porque agotó su cupo global máximo de ${promo.limite_usos} canjes. Amplía el cupo para reactivarla.`,
            },
          ],
        };
      }
    }

    promo.activa = activa;
    promo.updated_at = new Date().toISOString();
    promo.estado_visual = this.calcularEstadoVisualPromo(promo);

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(promo)),
    };
  }

  /**
   * DELETE /api/v1/admin/promociones/{id}
   * Salvaguarda contable: ON DELETE RESTRICT si existen comprobantes históricos
   */
  async eliminarPromocion(id: string): Promise<ApiResponse<{ eliminado: boolean }>> {
    await new Promise((r) => setTimeout(r, 60));
    const promo = this.promociones.find((p) => p.id === id);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROMOCION_NO_ENCONTRADA',
            mensaje: 'La promoción ya no existe en el sistema.',
          },
        ],
      };
    }

    // Regla de salvaguarda contable PostgreSQL ON DELETE RESTRICT
    if (promo.usos_actuales > 0) {
      return {
        exito: false,
        datos: { eliminado: false },
        errores: [
          {
            codigo: 'ERR_PROMOCION_CON_HISTORIAL',
            mensaje: `No es posible eliminar la promoción "${promo.nombre}" porque cuenta con ${promo.usos_actuales} comprobantes emitidos ante SUNAT. Utiliza la opción Pausar para suspenderla de caja sin alterar el histórico contable.`,
          },
        ],
      };
    }

    this.promociones = this.promociones.filter((p) => p.id !== id);
    return {
      exito: true,
      datos: { eliminado: true },
    };
  }

  /**
   * GET /api/v1/admin/promociones/{id}/rendimiento
   */
  async getRendimientoPromocion(id: string): Promise<ApiResponse<PromocionRendimientoDTO>> {
    await new Promise((r) => setTimeout(r, 60));
    const promo = this.promociones.find((p) => p.id === id);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PROMOCION_NO_ENCONTRADA',
            mensaje: 'No se encontró la promoción solicitada.',
          },
        ],
      };
    }

    promo.estado_visual = this.calcularEstadoVisualPromo(promo);
    const comprobantes = SEMILLAS_COMPROBANTES_AUDITORIA_PROMO[id] || [];

    const ventas_totales = promo.total_ventas_asociadas;
    const descuentos_totales = promo.total_descontado;
    const ticket_promedio =
      promo.usos_actuales > 0
        ? Math.round((promo.total_ventas_asociadas / promo.usos_actuales) * 100) / 100
        : 0.0;

    return {
      exito: true,
      datos: {
        promocion: JSON.parse(JSON.stringify(promo)),
        ventas_totales,
        descuentos_totales,
        ticket_promedio,
        usos_totales: promo.usos_actuales,
        comprobantes: JSON.parse(JSON.stringify(comprobantes)),
      },
    };
  }

  /**
   * QA Demo: Simular un nuevo cobro en caja con descuento aplicado
   */
  async simularUsoEnCaja(id?: string): Promise<ApiResponse<PromocionAdminDTO>> {
    const promo = id ? this.promociones.find((p) => p.id === id) : this.promociones.find((p) => p.activa);
    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NO_PROMO_ACTIVA', mensaje: 'No hay promociones activas para simular uso.' }],
      };
    }

    const consumoBruto = 120.0;
    let dscto = 0;
    if (promo.tipo_descuento === 'porcentaje') {
      dscto = Math.round((consumoBruto * (promo.valor / 100)) * 100) / 100;
      if (promo.tope_maximo_descuento && dscto > promo.tope_maximo_descuento) {
        dscto = promo.tope_maximo_descuento;
      }
    } else {
      dscto = promo.valor;
    }

    const today = '2026-10-09';
    promo.usos_actuales += 1;
    if (promo.fecha_ultimo_uso === today) {
      promo.usos_hoy = (promo.usos_hoy || 0) + 1;
    } else {
      promo.usos_hoy = 1;
      promo.fecha_ultimo_uso = today;
    }

    promo.total_descontado += dscto;
    promo.total_ventas_asociadas += consumoBruto;
    promo.estado_visual = this.calcularEstadoVisualPromo(promo);

    // Agregar comprobante al historial
    if (!SEMILLAS_COMPROBANTES_AUDITORIA_PROMO[promo.id]) {
      SEMILLAS_COMPROBANTES_AUDITORIA_PROMO[promo.id] = [];
    }
    SEMILLAS_COMPROBANTES_AUDITORIA_PROMO[promo.id].unshift({
      id: `comp-sim-${Date.now()}`,
      numero_comprobante: `B001-000${500 + promo.usos_actuales}`,
      fecha_hora: new Date().toISOString(),
      mesa_numero: 'Mesa 04',
      cajero_nombre: 'Carlos Mendoza',
      subtotal: consumoBruto,
      descuento: dscto,
      total: consumoBruto - dscto,
    });

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(promo)),
    };
  }

  /**
   * QA Demo: Simular que la cuponera global se agotó
   */
  async simularCupoAgotado(id?: string): Promise<ApiResponse<PromocionAdminDTO>> {
    const promo = id
      ? this.promociones.find((p) => p.id === id)
      : this.promociones.find((p) => p.tipo_limite_usos === 'global') || this.promociones[0];

    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NO_PROMO', mensaje: 'No se encontró promoción para agotar cupo.' }],
      };
    }

    promo.tipo_limite_usos = 'global';
    promo.limite_usos = 50;
    promo.usos_actuales = 50;
    promo.estado_visual = 'agotada';

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(promo)),
    };
  }

  /**
   * QA Demo: Simular cupo diario agotado para la jornada de hoy (Opción C)
   */
  async simularCupoDiarioAgotado(id?: string): Promise<ApiResponse<PromocionAdminDTO>> {
    const promo = id
      ? this.promociones.find((p) => p.id === id)
      : this.promociones.find((p) => p.tipo_limite_usos === 'diario') || this.promociones[1];

    if (!promo) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_NO_PROMO', mensaje: 'No se encontró promoción de cupo diario.' }],
      };
    }

    const today = '2026-10-09';
    promo.tipo_limite_usos = 'diario';
    promo.limite_usos = promo.limite_usos || 25;
    promo.usos_hoy = promo.limite_usos;
    promo.fecha_ultimo_uso = today;
    promo.estado_visual = 'agotada_hoy';

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(promo)),
    };
  }

  /**
   * QA Demo: Simular cambio de día (Auto-Reset a 0 en O(1) Zero-Cron)
   */
  async simularNuevoDia(): Promise<ApiResponse<{ mensaje: string }>> {
    // Simulamos que la fecha anterior era ayer
    this.promociones.forEach((p) => {
      if (p.tipo_limite_usos === 'diario') {
        p.fecha_ultimo_uso = '2026-10-08'; // Ayer
        p.usos_hoy = 0; // Se resetea atómicamente a 0
        p.estado_visual = this.calcularEstadoVisualPromo(p);
      }
    });

    return {
      exito: true,
      datos: { mensaje: '¡Jornada renovada! Todos los cupos diarios se han reseteado a 0 automáticamente en O(1).' },
    };
  }

  /**
   * QA Demo: Simular sede nueva sin promociones (Onboarding Vista 4)
   */
  simularSedeVaciaPromociones(): void {
    this.promociones = [];
  }

  /**
   * QA Demo: Restablecer semillas canónicas de Aúrea
   */
  restablecerSemillasPromociones(): void {
    this.promociones = JSON.parse(JSON.stringify(SEMILLAS_PROMOCIONES_AUREA));
    this.seqPromo = 6;
  }

  // ==========================================================================
  // CU-ADMIN-18: Configurar Parámetros Operativos de Comanda y Tiempos de KDS
  // ==========================================================================

  async getConfiguracionKds(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<ConfiguracionKdsDTO>> {
    await new Promise((r) => setTimeout(r, 60));
    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.configuracionKds)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async actualizarConfiguracionKds(
    req: ActualizarConfiguracionKdsRequest,
    _localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<ConfiguracionKdsDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    // Validar rangos físicos Poka-Yoke (RN-KDS-02 / 02_schema_ddl.sql)
    if (req.tiempo_optimo_verde_min < 3 || req.tiempo_optimo_verde_min > 60) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'El tiempo óptimo verde debe estar entre 3 y 60 minutos.' }],
      };
    }
    if (req.tiempo_alerta_ambar_min < 5 || req.tiempo_alerta_ambar_min > 120) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'El tiempo de alerta ámbar debe estar entre 5 y 120 minutos.' }],
      };
    }
    if (req.tiempo_maximo_pase_min < 1 || req.tiempo_maximo_pase_min > 30) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'La tolerancia máxima en pase debe estar entre 1 y 30 minutos.' }],
      };
    }
    if (req.intervalo_sonido_rojo_seg < 15 || req.intervalo_sonido_rojo_seg > 300) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_RANGO_INVALIDO', mensaje: 'El intervalo de alarma acústica roja debe estar entre 15 y 300 segundos.' }],
      };
    }
    if (!['fifo', 'all_day'].includes(req.vista_predeterminada)) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_VALOR_INVALIDO', mensaje: 'La vista predeterminada debe ser "fifo" o "all_day".' }],
      };
    }

    // Validar coherencia obligatoria de umbrales (RN-KDS-01 / chk_kds_umbrales_coherentes)
    if (req.tiempo_alerta_ambar_min <= req.tiempo_optimo_verde_min) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_UMBRALES_KDS_INCOHERENTES',
            mensaje: 'El umbral de alerta (ámbar) debe ser estrictamente mayor al umbral óptimo (verde).',
          },
        ],
      };
    }

    // Persistencia inmutable en estado
    this.configuracionKds = {
      local_id: _localId,
      ...req,
      updated_at: new Date().toISOString(),
    };

    // Sincronización cruzada reactiva con pantalla KDS de Cocina (CU-COCINA-01)
    MOCK_CONFIGURACION_KDS.tiempo_optimo_verde_min = req.tiempo_optimo_verde_min;
    MOCK_CONFIGURACION_KDS.tiempo_alerta_ambar_min = req.tiempo_alerta_ambar_min;
    MOCK_CONFIGURACION_KDS.tiempo_maximo_pase_min = req.tiempo_maximo_pase_min;
    MOCK_CONFIGURACION_KDS.alerta_sonora_nueva_comanda = req.alerta_sonora_nueva_comanda;
    MOCK_CONFIGURACION_KDS.alerta_sonora_comanda_roja = req.alerta_sonora_comanda_roja;
    MOCK_CONFIGURACION_KDS.intervalo_sonido_rojo_seg = req.intervalo_sonido_rojo_seg;
    MOCK_CONFIGURACION_KDS.vista_predeterminada = req.vista_predeterminada;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.configuracionKds)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async restaurarDefaultsConfiguracionKds(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<ConfiguracionKdsDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    this.configuracionKds = {
      local_id: _localId,
      tiempo_optimo_verde_min: 15,
      tiempo_alerta_ambar_min: 25,
      tiempo_maximo_pase_min: 3,
      alerta_sonora_nueva_comanda: true,
      alerta_sonora_comanda_roja: true,
      intervalo_sonido_rojo_seg: 60,
      vista_predeterminada: 'fifo',
      updated_at: new Date().toISOString(),
    };

    // Sincronizar con KDS cocina
    MOCK_CONFIGURACION_KDS.tiempo_optimo_verde_min = 15;
    MOCK_CONFIGURACION_KDS.tiempo_alerta_ambar_min = 25;
    MOCK_CONFIGURACION_KDS.tiempo_maximo_pase_min = 3;
    MOCK_CONFIGURACION_KDS.alerta_sonora_nueva_comanda = true;
    MOCK_CONFIGURACION_KDS.alerta_sonora_comanda_roja = true;
    MOCK_CONFIGURACION_KDS.intervalo_sonido_rojo_seg = 60;
    MOCK_CONFIGURACION_KDS.vista_predeterminada = 'fifo';

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.configuracionKds)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // ==========================================================================
  // CU-ADMIN-19: Configurar Métodos de Pago y Comisiones de Cobro del Local
  // Tabla: metodo_pago_local (02_schema_ddl.sql)
  // ==========================================================================

  private calcularKPIsMetodosPago(metodos: MetodoPagoLocalDTO[]): MetodosPagoKPIsDTO {
    const habilitadas = metodos.filter((m) => m.activo).length;
    const conComision = metodos.filter((m) => m.activo && m.comision_porcentaje > 0).length;
    // Métricas de transacciones simuladas del mes para la sede
    const ventasTarjetaMes = 24850.0;
    const tarjetaActiva = metodos.find((m) => m.codigo === 'tarjeta' && m.activo);
    const recargosPercibidosMes = tarjetaActiva
      ? Math.round(((ventasTarjetaMes * tarjetaActiva.comision_porcentaje) / 100) * 100) / 100
      : 0.0;

    return {
      formas_habilitadas: habilitadas,
      total_formas: metodos.length,
      metodos_con_comision: conComision,
      ventas_tarjeta_mes: ventasTarjetaMes,
      recargos_percibidos_mes: recargosPercibidosMes,
    };
  }

  async getMetodosPago(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<CatalogoMetodosPagoResponseDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    // Si es sede nueva para simular Onboarding (Vista 4)
    if (this.esSedeNuevaMetodosPago) {
      return {
        exito: true,
        datos: {
          kpis: {
            formas_habilitadas: 0,
            total_formas: 0,
            metodos_con_comision: 0,
            ventas_tarjeta_mes: 0,
            recargos_percibidos_mes: 0,
          },
          metodos: [],
          sede_nombre: CANONICAL_LOCAL_NOMBRE,
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const kpis = this.calcularKPIsMetodosPago(this.metodosPago);

    return {
      exito: true,
      datos: {
        kpis,
        metodos: JSON.parse(JSON.stringify(this.metodosPago)),
        sede_nombre: CANONICAL_LOCAL_NOMBRE,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async actualizarMetodosPago(
    req: ActualizarCatalogoMetodosRequest,
    _localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<CatalogoMetodosPagoResponseDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    // Regla de Negocio RN-PAGO-01: Mínimo 1 método activo en todo momento (409 Conflict)
    const activos = req.metodos.filter((m) => m.activo);
    if (activos.length === 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MINIMO_UN_PAGO',
            mensaje:
              'La sede debe mantener al menos un método de pago activo en todo momento para evitar la paralización del cobro de comandas en salón.',
          },
        ],
      };
    }

    // Regla de Negocio RN-PAGO-02: Rango válido de comisiones 0% a 50% (422)
    for (const m of req.metodos) {
      if (m.comision_porcentaje < 0 || m.comision_porcentaje > 50) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_COMISION_INVALIDA',
              mensaje: `El porcentaje de comisión para ${m.codigo} debe estar comprendido entre 0.00% y 50.00%.`,
            },
          ],
        };
      }

      // Regla de Negocio RN-PAGO-03: Efectivo siempre 0.00%
      if (m.codigo === 'efectivo' && m.comision_porcentaje > 0) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_COMISION_EFECTIVO_PROHIBIDA',
              mensaje: 'El método Efectivo no admite comisiones ni recargos por mandato legal.',
            },
          ],
        };
      }

      // Regla de Negocio RN-PAGO-04: Billetera digital requiere teléfono de 9 dígitos (422)
      if (m.codigo === 'billetera_digital' && m.activo) {
        const tel = m.datos_adicionales?.telefono?.replace(/\D/g, '') || '';
        if (tel.length < 9) {
          return {
            exito: false,
            datos: null as any,
            errores: [
              {
                codigo: 'ERR_DATOS_BILLETERA_INCOMPLETOS',
                mensaje:
                  'Para activar Billetera Digital (Yape / Plin) es obligatorio ingresar el número celular de contacto de 9 dígitos de la sede.',
              },
            ],
          };
        }
      }
    }

    // Actualizar catálogo en memoria
    this.metodosPago = this.metodosPago.map((item) => {
      const match = req.metodos.find((m) => m.codigo === item.codigo);
      if (match) {
        return {
          ...item,
          activo: match.activo,
          comision_porcentaje: match.codigo === 'efectivo' ? 0.0 : match.comision_porcentaje,
          datos_adicionales: match.datos_adicionales ? { ...match.datos_adicionales } : item.datos_adicionales,
          updated_at: new Date().toISOString(),
        };
      }
      return item;
    });

    const kpis = this.calcularKPIsMetodosPago(this.metodosPago);

    return {
      exito: true,
      datos: {
        kpis,
        metodos: JSON.parse(JSON.stringify(this.metodosPago)),
        sede_nombre: CANONICAL_LOCAL_NOMBRE,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async actualizarMetodoPagoIndividual(
    codigo: CodigoMetodoPagoLocal,
    req: ActualizarMetodoPagoItemRequest,
    _localId: string = CANONICAL_LOCAL_ID
  ): Promise<ApiResponse<MetodoPagoLocalDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    // Verificar existencia
    const index = this.metodosPago.findIndex((m) => m.codigo === codigo);
    if (index === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_METODO_NO_ENCONTRADO', mensaje: `El método de pago ${codigo} no está registrado.` }],
      };
    }

    // Regla de Negocio RN-PAGO-01: No permitir desactivar si es el único activo
    if (!req.activo) {
      const otrosActivos = this.metodosPago.filter((m) => m.codigo !== codigo && m.activo);
      if (otrosActivos.length === 0) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_MINIMO_UN_PAGO',
              mensaje:
                'No es posible pausar este método de pago porque es el único activo en la sede. Desactivarlo paralizaría el cobro en salón y caja.',
            },
          ],
        };
      }
    }

    // Regla de Negocio RN-PAGO-04: Billetera digital requiere teléfono
    if (codigo === 'billetera_digital' && req.activo) {
      const tel = req.datos_adicionales?.telefono?.replace(/\D/g, '') || '';
      if (tel.length < 9) {
        return {
          exito: false,
          datos: null as any,
          errores: [
            {
              codigo: 'ERR_DATOS_BILLETERA_INCOMPLETOS',
              mensaje: 'La billetera digital requiere un número celular de contacto de al menos 9 dígitos.',
            },
          ],
        };
      }
    }

    this.metodosPago[index] = {
      ...this.metodosPago[index],
      activo: req.activo,
      comision_porcentaje: codigo === 'efectivo' ? 0.0 : req.comision_porcentaje,
      datos_adicionales: req.datos_adicionales
        ? { ...this.metodosPago[index].datos_adicionales, ...req.datos_adicionales }
        : this.metodosPago[index].datos_adicionales,
      updated_at: new Date().toISOString(),
    };

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.metodosPago[index])),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Onboarding Vista 4: Aprovisionar sede nueva con los 3 métodos canónicos al 0%
   */
  async aprovisionarSedeNuevaMetodosPago(_localId: string = CANONICAL_LOCAL_ID): Promise<ApiResponse<CatalogoMetodosPagoResponseDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    this.esSedeNuevaMetodosPago = false;
    this.metodosPago = [
      {
        id: '00000000-0000-4000-8000-000000000451',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'efectivo',
        nombre: 'Efectivo (Cash)',
        activo: true,
        comision_porcentaje: 0.0,
        datos_adicionales: {},
        icono: 'banknote',
        orden: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-8000-000000000452',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'tarjeta',
        nombre: 'Tarjeta Débito / Crédito (POS)',
        activo: true,
        comision_porcentaje: 0.0,
        datos_adicionales: { operador: 'Niubiz / Izipay' },
        icono: 'credit-card',
        orden: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-8000-000000000453',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'billetera_digital',
        nombre: 'Billetera Digital (Yape / Plin)',
        activo: true,
        comision_porcentaje: 0.0,
        datos_adicionales: {
          telefono: '987654321',
          titular: 'Inversiones Gastronómicas S.A.C.',
          instrucciones_cajero: 'Verificar confirmación de pago de 6 dígitos',
        },
        icono: 'smartphone',
        orden: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-8000-000000000454',
        local_id: CANONICAL_LOCAL_ID,
        codigo: 'transferencia',
        nombre: 'Transferencia Bancaria',
        activo: false,
        comision_porcentaje: 0.0,
        datos_adicionales: {
          banco: 'BCP',
          cuenta: '191-88421033-0-45',
          cci: '00219100884210330451',
          titular: 'Inversiones Gastronómicas S.A.C.',
          instrucciones_cajero: 'Revisar abono bancario y adjuntar comprobante al arqueo',
        },
        icono: 'building-2',
        orden: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const kpis = this.calcularKPIsMetodosPago(this.metodosPago);

    return {
      exito: true,
      datos: {
        kpis,
        metodos: JSON.parse(JSON.stringify(this.metodosPago)),
        sede_nombre: CANONICAL_LOCAL_NOMBRE,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * QA Helper: Simular que la sede es nueva sin métodos de cobro (Vista 4 Onboarding)
   */
  simularSedeNuevaMetodosPago(): void {
    this.esSedeNuevaMetodosPago = true;
    this.metodosPago = [];
  }

  /**
   * QA Helper: Restablecer semillas canónicas de Aúrea
   */
  restablecerSemillasMetodosPago(): void {
    this.esSedeNuevaMetodosPago = false;
    this.metodosPago = JSON.parse(JSON.stringify(SEMILLAS_METODOS_PAGO_AUREA));
  }

  // =========================================================================
  // CU-ADMIN-14: Gestión de Flujo de Caja, Gastos Operativos y Auditoría de Cierres Z
  // =========================================================================

  private flujoCajaResumen: FlujoCajaResumenDTO = JSON.parse(JSON.stringify(SEMILLAS_FLUJO_CAJA_AUREA));
  private gastosOperativos: GastoOperativoDTO[] = JSON.parse(JSON.stringify(SEMILLAS_GASTOS_AUREA));
  private turnosCaja: TurnoCajaResumenDTO[] = JSON.parse(JSON.stringify(SEMILLAS_TURNOS_CAJA_AUREA));
  private esPeriodoVacioQA: boolean = false;

  /**
   * Obtiene el resumen estratégico de Flujo de Caja y Balance Neto
   */
  async getFlujoCajaResumen(
    periodo: PeriodoFlujoCaja = 'este_mes',
    desde?: string,
    hasta?: string
  ): Promise<ApiResponse<FlujoCajaResumenDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    if (this.esPeriodoVacioQA || (desde && hasta && (desde > '2026-10-31' || hasta < '2026-10-01'))) {
      const emptyResumen: FlujoCajaResumenDTO = {
        local_id: CANONICAL_LOCAL_ID,
        sede_nombre: CANONICAL_LOCAL_NOMBRE,
        periodo,
        fecha_inicio: desde || '2026-11-01',
        fecha_fin: hasta || '2026-11-05',
        ingresos_totales: 0,
        delta_ingresos_pct: 0,
        ingresos_desglose: {
          efectivo_monto: 0,
          efectivo_porcentaje: 0,
          tarjeta_pos_monto: 0,
          tarjeta_pos_porcentaje: 0,
          billeteras_monto: 0,
          billeteras_porcentaje: 0,
        },
        egresos_totales: 0,
        delta_egresos_pct: 0,
        compras_insumos_total: 0,
        gastos_manuales_total: 0,
        balance_neto: 0,
        margen_neto_porcentaje: 0,
        ratio_cobertura: 0,
        conciliacion_liquidez: {
          total_disponible: 0,
          en_bancos_monto: 0,
          en_bancos_porcentaje: 0,
          en_gavetas_monto: 0,
          en_gavetas_porcentaje: 0,
        },
        curva_diaria: [],
        top_insumos_comprados: [],
        gastos_por_categoria: [],
      };
      return {
        exito: true,
        datos: emptyResumen,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    if (periodo === 'hoy') {
      const resumenHoy: FlujoCajaResumenDTO = {
        ...JSON.parse(JSON.stringify(this.flujoCajaResumen)),
        periodo: 'hoy',
        fecha_inicio: '2026-10-15',
        fecha_fin: '2026-10-15',
        ingresos_totales: 1240.0,
        delta_ingresos_pct: 5.2,
        ingresos_desglose: {
          efectivo_monto: 400.0,
          efectivo_porcentaje: 32.3,
          tarjeta_pos_monto: 620.0,
          tarjeta_pos_porcentaje: 50.0,
          billeteras_monto: 220.0,
          billeteras_porcentaje: 17.7,
        },
        egresos_totales: 0.0,
        delta_egresos_pct: 0.0,
        compras_insumos_total: 0.0,
        gastos_manuales_total: 0.0,
        balance_neto: 1240.0,
        margen_neto_porcentaje: 100.0,
        ratio_cobertura: 12.4,
        conciliacion_liquidez: {
          total_disponible: 1240.0,
          en_bancos_monto: 840.0,
          en_bancos_porcentaje: 67.7,
          en_gavetas_monto: 400.0,
          en_gavetas_porcentaje: 32.3,
        },
        curva_diaria: [
          { fecha: '2026-10-15', etiqueta_dia: 'Hoy (15 Oct)', ingresos_dia: 1240.0, egresos_dia: 0.0, saldo_neto_dia: 1240.0 },
        ],
        top_insumos_comprados: [],
        gastos_por_categoria: [],
      };
      return {
        exito: true,
        datos: resumenHoy,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const copia = JSON.parse(JSON.stringify(this.flujoCajaResumen));
    if (periodo === 'personalizado' && desde && hasta) {
      copia.fecha_inicio = desde;
      copia.fecha_fin = hasta;
      // Filtrar curva diaria dentro del rango
      copia.curva_diaria = copia.curva_diaria.filter(
        (p: FlujoDiarioDTO) => p.fecha >= desde && p.fecha <= hasta
      );
    }

    return {
      exito: true,
      datos: copia,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene el directorio histórico de turnos y KPIs de auditoría de control interno
   */
  async getTurnosCajaHistorial(
    periodo: PeriodoFlujoCaja = 'este_mes',
    desde?: string,
    hasta?: string
  ): Promise<ApiResponse<{ kpis: AuditoriaTurnosKPIsDTO; turnos: TurnoCajaResumenDTO[] }>> {
    await new Promise((r) => setTimeout(r, 60));

    if (this.esPeriodoVacioQA || (desde && hasta && (desde > '2026-10-31' || hasta < '2026-10-01'))) {
      const kpisVacio: AuditoriaTurnosKPIsDTO = {
        total_turnos: 0,
        turnos_cuadrados: 0,
        porcentaje_cuadratura: 0,
        turnos_con_discrepancia: 0,
        monto_total_discrepancias: 0,
        turnos_auditados: 0,
        turnos_pendientes_auditoria: 0,
        turno_activo: null,
      };
      return {
        exito: true,
        datos: { kpis: kpisVacio, turnos: [] },
        meta: { timestamp: new Date().toISOString() },
      };
    }

    let turnosFiltrados = JSON.parse(JSON.stringify(this.turnosCaja)) as TurnoCajaResumenDTO[];

    if (periodo === 'hoy') {
      turnosFiltrados = turnosFiltrados.filter((t) => t.fecha_apertura.startsWith('2026-10-15'));
    } else if (periodo === 'personalizado' && desde && hasta) {
      turnosFiltrados = turnosFiltrados.filter((t) => {
        const f = t.fecha_apertura.split('T')[0];
        return f >= desde && f <= hasta;
      });
    }

    const totalTurnos = turnosFiltrados.length;
    const turnosCuadrados = turnosFiltrados.filter(
      (t) => t.discrepancia !== null && t.discrepancia !== undefined && Math.abs(t.discrepancia) < 0.001
    ).length;
    const turnosDiscrepancia = turnosFiltrados.filter(
      (t) => t.discrepancia !== null && t.discrepancia !== undefined && Math.abs(t.discrepancia) >= 0.001
    ).length;
    const montoDiscrepancias = turnosFiltrados.reduce((acc, t) => acc + (t.discrepancia || 0), 0);
    const auditados = turnosFiltrados.filter((t) => t.revisado).length;
    const pendientes = turnosFiltrados.filter((t) => !t.revisado && t.estado === 'cerrada').length;
    const turnoActivo = turnosFiltrados.find((t) => t.estado === 'abierta') || null;

    const kpis: AuditoriaTurnosKPIsDTO = {
      total_turnos: totalTurnos,
      turnos_cuadrados: turnosCuadrados,
      porcentaje_cuadratura: totalTurnos > 0 ? Math.round((turnosCuadrados / totalTurnos) * 1000) / 10 : 0,
      turnos_con_discrepancia: turnosDiscrepancia,
      monto_total_discrepancias: Math.round(montoDiscrepancias * 100) / 100,
      turnos_auditados: auditados,
      turnos_pendientes_auditoria: pendientes,
      turno_activo: turnoActivo,
    };

    return {
      exito: true,
      datos: {
        kpis,
        turnos: turnosFiltrados,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene la lista de gastos operativos manuales
   */
  async getGastosOperativos(
    periodo: PeriodoFlujoCaja = 'este_mes',
    desde?: string,
    hasta?: string
  ): Promise<ApiResponse<GastoOperativoDTO[]>> {
    await new Promise((r) => setTimeout(r, 50));

    if (this.esPeriodoVacioQA || (desde && hasta && (desde > '2026-10-31' || hasta < '2026-10-01'))) {
      return {
        exito: true,
        datos: [],
        meta: { timestamp: new Date().toISOString() },
      };
    }

    let gastosFiltrados = JSON.parse(JSON.stringify(this.gastosOperativos)) as GastoOperativoDTO[];

    if (periodo === 'hoy') {
      gastosFiltrados = gastosFiltrados.filter((g) => g.fecha === '2026-10-15');
    } else if (periodo === 'personalizado' && desde && hasta) {
      gastosFiltrados = gastosFiltrados.filter((g) => g.fecha >= desde && g.fecha <= hasta);
    }

    return {
      exito: true,
      datos: gastosFiltrados,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Registra un nuevo gasto operativo manual
   */
  async registrarGastoOperativo(req: RegistrarGastoRequestDTO): Promise<ApiResponse<GastoOperativoDTO>> {
    await new Promise((r) => setTimeout(r, 100));

    if (!req.descripcion || req.descripcion.trim().length < 10) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_JUSTIFICACION_INSUFICIENTE',
            mensaje: 'La justificación o detalle del gasto es obligatoria (mínimo 10 caracteres).',
          },
        ],
      };
    }

    if (req.monto <= 0) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_MONTO_INVALIDO',
            mensaje: 'El importe del egreso debe ser mayor a S/ 0.00.',
          },
        ],
      };
    }

    const nuevoGasto: GastoOperativoDTO = {
      id: `gasto-${Date.now()}`,
      local_id: CANONICAL_LOCAL_ID,
      categoria: req.categoria,
      monto: Math.round(req.monto * 100) / 100,
      origen_fondos: req.origen_fondos,
      caja_id: req.origen_fondos === 'efectivo_caja' ? 'turno-043' : null,
      caja_correlativo: req.origen_fondos === 'efectivo_caja' ? 43 : null,
      proveedor_nombre: req.proveedor_nombre.trim(),
      tipo_comprobante: req.tipo_comprobante || 'Recibo Interno',
      numero_documento: req.numero_documento?.trim() || undefined,
      descripcion: req.descripcion.trim(),
      fecha: req.fecha || new Date().toISOString().split('T')[0],
      registrado_por: 'usr-admin-01',
      registrado_por_nombre: 'Mariana Ramos',
      created_at: new Date().toISOString(),
    };

    this.gastosOperativos.unshift(nuevoGasto);

    // Recalcular métricas de flujo de caja
    this.flujoCajaResumen.gastos_manuales_total =
      Math.round((this.flujoCajaResumen.gastos_manuales_total + nuevoGasto.monto) * 100) / 100;
    this.flujoCajaResumen.egresos_totales =
      Math.round((this.flujoCajaResumen.egresos_totales + nuevoGasto.monto) * 100) / 100;
    this.flujoCajaResumen.balance_neto =
      Math.round((this.flujoCajaResumen.ingresos_totales - this.flujoCajaResumen.egresos_totales) * 100) / 100;

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(nuevoGasto)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Registra el visado y conformidad gerencial de un turno Z
   */
  async visarTurnoZ(turnoId: string, req: VisarTurnoRequestDTO): Promise<ApiResponse<TurnoCajaResumenDTO>> {
    await new Promise((r) => setTimeout(r, 80));

    const idx = this.turnosCaja.findIndex((t) => t.id === turnoId);
    if (idx === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_TURNO_NO_ENCONTRADO', mensaje: 'Turno de caja no encontrado.' }],
      };
    }

    this.turnosCaja[idx].revisado = req.conforme;
    this.turnosCaja[idx].revisado_por = 'usr-admin-01';
    this.turnosCaja[idx].revisado_por_nombre = 'Mariana Ramos';
    this.turnosCaja[idx].revisado_at = new Date().toISOString();
    this.turnosCaja[idx].notas_auditoria = req.notas_auditoria.trim() || 'Turno auditado conforme.';

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(this.turnosCaja[idx])),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Ejecuta el cierre forzado administrativo de un turno de caja abandonado (Rescate de Terminal)
   */
  async ejecutarCierreForzadoAdmin(
    turnoId: string,
    req: CierreForzadoAdminRequestDTO
  ): Promise<ApiResponse<TurnoCajaResumenDTO>> {
    await new Promise((r) => setTimeout(r, 120));

    if (!req.justificacion || req.justificacion.trim().length < 15) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_JUSTIFICACION_INSUFICIENTE',
            mensaje: 'El cierre forzado requiere una justificación administrativa detallada (mínimo 15 caracteres).',
          },
        ],
      };
    }

    const idx = this.turnosCaja.findIndex((t) => t.id === turnoId || t.estado === 'abierta');
    if (idx === -1) {
      return {
        exito: false,
        datos: null as any,
        errores: [{ codigo: 'ERR_TURNO_NO_ABIERTO', mensaje: 'No hay turno activo para ejecutar cierre forzado.' }],
      };
    }

    const turno = this.turnosCaja[idx];
    const efectivoContado = Math.round(req.efectivo_contado * 100) / 100;
    const discrepancia = Math.round((efectivoContado - turno.monto_esperado) * 100) / 100;

    turno.estado = 'cerrada';
    turno.fecha_cierre = new Date().toISOString();
    turno.duracion_horas = '5h 10m (Cierre Forzado)';
    turno.monto_real = efectivoContado;
    turno.discrepancia = discrepancia;
    turno.notas_cierre = `Cierre administrativo forzado por Administradora Mariana Ramos: ${req.justificacion.trim()}`;
    turno.revisado = true;
    turno.revisado_por = 'usr-admin-01';
    turno.revisado_por_nombre = 'Mariana Ramos';
    turno.revisado_at = new Date().toISOString();
    turno.notas_auditoria = `Cierre de rescate ejecutado. Efectivo contado S/ ${efectivoContado.toFixed(2)}. Terminal liberada.`;

    // Sincronizar con mockCajaService para liberar la terminal inmediatamente
    mockCajaService.simularCierreDesdeCuAdmin14QA();

    return {
      exito: true,
      datos: JSON.parse(JSON.stringify(turno)),
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Obtiene el Reporte Z de un turno específico para el visor administrativo
   */
  async getReporteZTurno(turnoId: string): Promise<ApiResponse<ReporteZDTO>> {
    await new Promise((r) => setTimeout(r, 60));

    const turno = this.turnosCaja.find((t) => t.id === turnoId) || this.turnosCaja[1]; // fallback a Turno #042

    const reporteZ: ReporteZDTO = {
      caja_id: turno.id,
      turno_correlativo: turno.correlativo,
      local_nombre: CANONICAL_LOCAL_NOMBRE,
      empresa_ruc: '20609876543',
      cajero_nombre: turno.cajero_nombre,
      fecha_apertura: turno.fecha_apertura,
      fecha_cierre: turno.fecha_cierre || new Date().toISOString(),
      duracion_turno: turno.duracion_horas || '5h 02m',
      monto_apertura: turno.monto_apertura,
      efectivo_esperado: turno.monto_esperado,
      efectivo_real_contado: turno.monto_real || turno.monto_esperado,
      discrepancia: turno.discrepancia || 0.0,
      comentario_discrepancia: turno.comentario_discrepancia || undefined,
      total_ventas_efectivo: 885.0,
      total_tarjetas_pos: 1540.0,
      total_billeteras_digital: 420.0,
      otros_medios_total: 0.0,
      total_neto_facturado: turno.total_facturado || 2845.0,
      base_imponible_gravada: 2411.02,
      igv_18: 433.98,
      boletas_emitidas: 32,
      facturas_emitidas: 8,
      notas_venta_emitidas: 3,
      notas_credito_emitidas: 1,
      comprobantes_anulados: 1,
      notas_cierre: turno.notas_cierre || 'Turno entregado con gaveta cuadrada. Fondo S/ 200 en sobre cerrado.',
      url_descarga_pdf: `/api/v1/caja/turnos/${turno.id}/reporte-z/pdf`,
    };

    return {
      exito: true,
      datos: reporteZ,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  // =========================================================================
  // Herramientas Sandbox QA para CU-ADMIN-14
  // =========================================================================

  /**
   * QA Helper: Simular déficit operativo temporal por compra de equipamiento / alquiler
   */
  simularDeficitOperativoQA(): void {
    this.flujoCajaResumen.egresos_totales = 31200.0;
    this.flujoCajaResumen.gastos_manuales_total = 19950.0;
    this.flujoCajaResumen.balance_neto = -2750.0; // Déficit de -S/ 2,750
    this.flujoCajaResumen.margen_neto_porcentaje = -9.6;
    this.flujoCajaResumen.ratio_cobertura = 0.91;
  }

  /**
   * QA Helper: Simular turno con discrepancia pendiente de visado (Turno #042 con faltante de S/ 15)
   */
  simularTurnoConDiscrepanciaQA(): void {
    const turno42 = this.turnosCaja.find((t) => t.correlativo === 42);
    if (turno42) {
      turno42.monto_real = 985.0;
      turno42.discrepancia = -15.0;
      turno42.comentario_discrepancia = 'Diferencia en conteo por monedas extraviadas en rendición.';
      turno42.revisado = false;
      turno42.revisado_por = null;
      turno42.notas_auditoria = null;
    }
  }

  /**
   * QA Helper: Simular terminal bloqueada por cajero saliente sin cerrar turno
   */
  simularTerminalBloqueadaQA(): void {
    // Sincronizar estado en mockCajaService
    mockCajaService.simularTurnoPrevioAbiertoQA();
    const turnoActivo = this.turnosCaja.find((t) => t.estado === 'abierta');
    if (turnoActivo) {
      turnoActivo.cajero_nombre = 'Juan Pérez';
      turnoActivo.cajero_rol = 'Cajero Saliente (Turno Mañana)';
      turnoActivo.duracion_horas = '14h 20m (¡ABANDONO DE TURNO!)';
      turnoActivo.monto_esperado = 2730.0;
    }
  }

  /**
   * QA Helper: Simular período / días vacíos sin actividad operacional (CU-ADMIN-14)
   */
  simularDiasVaciosQA(): void {
    this.esPeriodoVacioQA = true;
  }

  /**
   * QA Helper: Restablecer todas las semillas de tesorería y supervisión a estado canónico
   */
  restablecerSemillasFinanzasQA(): void {
    this.esPeriodoVacioQA = false;
    this.flujoCajaResumen = JSON.parse(JSON.stringify(SEMILLAS_FLUJO_CAJA_AUREA));
    this.gastosOperativos = JSON.parse(JSON.stringify(SEMILLAS_GASTOS_AUREA));
    this.turnosCaja = JSON.parse(JSON.stringify(SEMILLAS_TURNOS_CAJA_AUREA));
    mockCajaService.restablecerSemillasCajaQA();
  }
}

// ============================================================================
// Semillas para CU-ADMIN-14: Gestión de Flujo de Caja & Cierres Z
// ============================================================================

const SEMILLAS_FLUJO_CAJA_AUREA: FlujoCajaResumenDTO = {
  local_id: CANONICAL_LOCAL_ID,
  sede_nombre: CANONICAL_LOCAL_NOMBRE,
  periodo: 'este_mes',
  fecha_inicio: '2026-10-01',
  fecha_fin: '2026-10-31',
  ingresos_totales: 28450.0,
  delta_ingresos_pct: 12.4,
  ingresos_desglose: {
    efectivo_monto: 9104.0,
    efectivo_porcentaje: 32.0,
    tarjeta_pos_monto: 15363.0,
    tarjeta_pos_porcentaje: 54.0,
    billeteras_monto: 3983.0,
    billeteras_porcentaje: 14.0,
  },
  egresos_totales: 16820.0,
  delta_egresos_pct: -3.1,
  compras_insumos_total: 11250.0,
  gastos_manuales_total: 5570.0,
  balance_neto: 11630.0,
  margen_neto_porcentaje: 40.8,
  ratio_cobertura: 1.69,
  conciliacion_liquidez: {
    total_disponible: 28450.0,
    en_bancos_monto: 19346.0,
    en_bancos_porcentaje: 68.0,
    en_gavetas_monto: 9104.0,
    en_gavetas_porcentaje: 32.0,
  },
  curva_diaria: [
    { fecha: '2026-10-05', etiqueta_dia: 'S1 (01-05 Oct)', ingresos_dia: 4320.0, egresos_dia: 2540.0, saldo_neto_dia: 1780.0 },
    { fecha: '2026-10-10', etiqueta_dia: 'S2 (06-10 Oct)', ingresos_dia: 4980.0, egresos_dia: 2890.0, saldo_neto_dia: 2090.0 },
    { fecha: '2026-10-15', etiqueta_dia: 'S3 (11-15 Oct)', ingresos_dia: 5120.0, egresos_dia: 2980.0, saldo_neto_dia: 2140.0 },
    { fecha: '2026-10-20', etiqueta_dia: 'S4 (16-20 Oct)', ingresos_dia: 4680.0, egresos_dia: 2710.0, saldo_neto_dia: 1970.0 },
    { fecha: '2026-10-25', etiqueta_dia: 'S5 (21-25 Oct)', ingresos_dia: 4550.0, egresos_dia: 2820.0, saldo_neto_dia: 1730.0 },
    { fecha: '2026-10-31', etiqueta_dia: 'S6 (26-31 Oct)', ingresos_dia: 4800.0, egresos_dia: 2880.0, saldo_neto_dia: 1920.0 },
  ],
  top_insumos_comprados: [
    { insumo_id: 'ins-1', nombre_insumo: 'Pollo Entero Eviscerado (180 kg)', cantidad_comprada: 180, unidad_medida: 'kg', monto_total: 3240.0, porcentaje_de_compras: 28.8 },
    { insumo_id: 'ins-2', nombre_insumo: 'Lomo Fino de Res (75 kg)', cantidad_comprada: 75, unidad_medida: 'kg', monto_total: 2850.0, porcentaje_de_compras: 25.3 },
    { insumo_id: 'ins-3', nombre_insumo: 'Papa Nativa y Amarilla (240 kg)', cantidad_comprada: 240, unidad_medida: 'kg', monto_total: 1200.0, porcentaje_de_compras: 10.7 },
    { insumo_id: 'ins-4', nombre_insumo: 'Carbón Vegetal / Leña (30 sacos)', cantidad_comprada: 30, unidad_medida: 'bolsa', monto_total: 1350.0, porcentaje_de_compras: 12.0 },
    { insumo_id: 'ins-5', nombre_insumo: 'Abarrotes y Bebidas de Carta', cantidad_comprada: 150, unidad_medida: 'unidad', monto_total: 2610.0, porcentaje_de_compras: 23.2 },
  ],
  gastos_por_categoria: [
    { categoria: 'alquiler', nombre_categoria: 'Alquiler de Local Comercial', monto_total: 2800.0, porcentaje_de_gastos: 50.3 },
    { categoria: 'servicios_basicos', nombre_categoria: 'Servicios Básicos (Luz/Agua/Gas)', monto_total: 1420.0, porcentaje_de_gastos: 25.5 },
    { categoria: 'limpieza_aseo', nombre_categoria: 'Limpieza, Aseo y Menaje Interno', monto_total: 580.0, porcentaje_de_gastos: 10.4 },
    { categoria: 'mantenimiento', nombre_categoria: 'Mantenimiento Equipos & Campana', monto_total: 450.0, porcentaje_de_gastos: 8.1 },
    { categoria: 'caja_chica', nombre_categoria: 'Caja Chica / Compras Emergencia', monto_total: 320.0, porcentaje_de_gastos: 5.7 },
  ],
};

const SEMILLAS_GASTOS_AUREA: GastoOperativoDTO[] = [
  {
    id: 'gasto-01',
    local_id: CANONICAL_LOCAL_ID,
    categoria: 'servicios_basicos',
    monto: 1420.0,
    origen_fondos: 'transferencia_bancaria',
    proveedor_nombre: 'Enel Distribución Perú S.A.A.',
    tipo_comprobante: 'Recibo Servicios Públicos',
    numero_documento: 'S001-0982312',
    descripcion: 'Pago del suministro eléctrico del salón y cocina correspondiente al ciclo de octubre.',
    fecha: '2026-10-11',
    registrado_por: 'admin-01',
    registrado_por_nombre: 'Mariana Ramos',
    created_at: '2026-10-11T10:15:00Z',
  },
  {
    id: 'gasto-02',
    local_id: CANONICAL_LOCAL_ID,
    categoria: 'alquiler',
    monto: 2800.0,
    origen_fondos: 'transferencia_bancaria',
    proveedor_nombre: 'Inmobiliaria San Jerónimo S.A.C.',
    tipo_comprobante: 'Factura Electrónica',
    numero_documento: 'F001-0021489',
    descripcion: 'Merced conductiva mensual del local comercial sede Miraflores.',
    fecha: '2026-10-05',
    registrado_por: 'admin-01',
    registrado_por_nombre: 'Mariana Ramos',
    created_at: '2026-10-05T09:00:00Z',
  },
  {
    id: 'gasto-03',
    local_id: CANONICAL_LOCAL_ID,
    categoria: 'limpieza_aseo',
    monto: 580.0,
    origen_fondos: 'efectivo_caja',
    caja_id: 'turno-039',
    caja_correlativo: 39,
    proveedor_nombre: 'Distribuidora Higiene Pro E.I.R.L.',
    tipo_comprobante: 'Boleta de Venta',
    numero_documento: 'B001-008129',
    descripcion: 'Desengrasante industrial para campana extractora y rollos de papel toalla para salón.',
    fecha: '2026-10-09',
    registrado_por: 'admin-01',
    registrado_por_nombre: 'Mariana Ramos',
    created_at: '2026-10-09T14:20:00Z',
  },
  {
    id: 'gasto-04',
    local_id: CANONICAL_LOCAL_ID,
    categoria: 'mantenimiento',
    monto: 450.0,
    origen_fondos: 'transferencia_bancaria',
    proveedor_nombre: 'TecnoFrío Lima Servicios',
    tipo_comprobante: 'Factura Electrónica',
    numero_documento: 'F003-0004512',
    descripcion: 'Mantenimiento preventivo y recarga de refrigerante de conservadora de bebidas de bar.',
    fecha: '2026-10-08',
    registrado_por: 'admin-01',
    registrado_por_nombre: 'Mariana Ramos',
    created_at: '2026-10-08T16:45:00Z',
  },
  {
    id: 'gasto-05',
    local_id: CANONICAL_LOCAL_ID,
    categoria: 'caja_chica',
    monto: 70.0,
    origen_fondos: 'efectivo_caja',
    caja_id: 'turno-041',
    caja_correlativo: 41,
    proveedor_nombre: 'Movilidad Urgente Mercado',
    tipo_comprobante: 'Recibo Interno',
    numero_documento: 'RI-2026-0042',
    descripcion: 'Taxi ida y vuelta para compra urgente de 5 kg de limón cevichero por quiebre en KDS.',
    fecha: '2026-10-10',
    registrado_por: 'admin-01',
    registrado_por_nombre: 'Mariana Ramos',
    created_at: '2026-10-10T12:30:00Z',
  },
];

const SEMILLAS_TURNOS_CAJA_AUREA: TurnoCajaResumenDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000543',
    correlativo: 43,
    cajero_id: 'usr-cajero-02',
    cajero_nombre: 'Marco Valdivia',
    cajero_rol: 'Cajero Turno Mañana',
    fecha_apertura: '2026-10-15T11:30:00Z',
    fecha_cierre: null,
    duracion_horas: 'En curso (4h 15m)',
    monto_apertura: 200.0,
    monto_esperado: 1440.0,
    monto_real: null,
    discrepancia: null,
    estado: 'abierta',
    revisado: false,
    total_comprobantes: 18,
    total_facturado: 1240.0,
    lote_pos: 'Lote #013',
  },
  {
    id: '00000000-0000-4000-8000-000000000542',
    correlativo: 42,
    cajero_id: 'usr-cajero-01',
    cajero_nombre: 'Lucía Flores',
    cajero_rol: 'Cajera Titular Turno Tarde',
    fecha_apertura: '2026-10-10T18:30:00Z',
    fecha_cierre: '2026-10-10T23:32:00Z',
    duracion_horas: '5h 02m',
    monto_apertura: 200.0,
    monto_esperado: 1000.0,
    monto_real: 1000.0,
    discrepancia: 0.0,
    comentario_discrepancia: null,
    notas_cierre: 'Turno entregado con gaveta cuadrada. Fondo S/ 200 en sobre cerrado.',
    estado: 'cerrada',
    revisado: false,
    revisado_por: null,
    notas_auditoria: null,
    total_comprobantes: 44,
    total_facturado: 2845.0,
    lote_pos: 'Lote #012',
  },
  {
    id: '00000000-0000-4000-8000-000000000541',
    correlativo: 41,
    cajero_id: 'usr-cajero-03',
    cajero_nombre: 'Pedro Castillo',
    cajero_rol: 'Cajero Turno Almuerzo',
    fecha_apertura: '2026-10-10T11:30:00Z',
    fecha_cierre: '2026-10-10T16:30:00Z',
    duracion_horas: '5h 00m',
    monto_apertura: 200.0,
    monto_esperado: 1120.0,
    monto_real: 1110.0,
    discrepancia: -10.0,
    comentario_discrepancia: 'Faltante generado por diferencia de redondeo en mesa 03 y cambio entregado en monedas.',
    notas_cierre: 'Faltante informado a supervisión.',
    estado: 'cerrada',
    revisado: true,
    revisado_por: 'usr-admin-01',
    revisado_por_nombre: 'Mariana Ramos',
    revisado_at: '2026-10-10T17:15:00Z',
    notas_auditoria: 'Diferencia revisada conforme contra reporte de caja. Se asume por política de tolerancia menor a S/ 15.',
    total_comprobantes: 36,
    total_facturado: 2210.0,
    lote_pos: 'Lote #011',
  },
  {
    id: '00000000-0000-4000-8000-000000000540',
    correlativo: 40,
    cajero_id: 'usr-cajero-01',
    cajero_nombre: 'Lucía Flores',
    cajero_rol: 'Cajera Titular Turno Tarde',
    fecha_apertura: '2026-10-09T18:30:00Z',
    fecha_cierre: '2026-10-09T23:30:00Z',
    duracion_horas: '5h 00m',
    monto_apertura: 200.0,
    monto_esperado: 980.0,
    monto_real: 980.0,
    discrepancia: 0.0,
    estado: 'cerrada',
    revisado: true,
    revisado_por: 'usr-admin-01',
    revisado_por_nombre: 'Mariana Ramos',
    revisado_at: '2026-10-10T08:30:00Z',
    notas_auditoria: 'Arqueo exacto. Vouchers POS conciliados contra cierre de lote.',
    total_comprobantes: 39,
    total_facturado: 2450.0,
    lote_pos: 'Lote #010',
  },
  {
    id: '00000000-0000-4000-8000-000000000539',
    correlativo: 39,
    cajero_id: 'usr-cajero-03',
    cajero_nombre: 'Pedro Castillo',
    cajero_rol: 'Cajero Turno Almuerzo',
    fecha_apertura: '2026-10-09T11:30:00Z',
    fecha_cierre: '2026-10-09T16:30:00Z',
    duracion_horas: '5h 00m',
    monto_apertura: 200.0,
    monto_esperado: 1050.0,
    monto_real: 1050.0,
    discrepancia: 0.0,
    estado: 'cerrada',
    revisado: true,
    revisado_por: 'usr-admin-01',
    revisado_por_nombre: 'Mariana Ramos',
    revisado_at: '2026-10-09T17:00:00Z',
    notas_auditoria: 'Arqueo cuadrado sin observaciones.',
    total_comprobantes: 35,
    total_facturado: 2190.0,
    lote_pos: 'Lote #009',
  },
  {
    id: '00000000-0000-4000-8000-000000000538',
    correlativo: 38,
    cajero_id: 'usr-cajero-02',
    cajero_nombre: 'Marco Valdivia',
    cajero_rol: 'Cajero Turno Tarde',
    fecha_apertura: '2026-10-08T18:30:00Z',
    fecha_cierre: '2026-10-08T23:30:00Z',
    duracion_horas: '5h 00m',
    monto_apertura: 200.0,
    monto_esperado: 890.0,
    monto_real: 885.5,
    discrepancia: -4.5,
    comentario_discrepancia: 'Desajuste de 4.50 por comensal que pagó con sencillo exacto menos redondeo.',
    estado: 'cerrada',
    revisado: true,
    revisado_por: 'usr-admin-01',
    revisado_por_nombre: 'Mariana Ramos',
    revisado_at: '2026-10-09T08:15:00Z',
    notas_auditoria: 'Conforme. Tolerancia de redondeo aceptada.',
    total_comprobantes: 32,
    total_facturado: 1980.0,
    lote_pos: 'Lote #008',
  },
];

export const mockAdminService = new MockAdminService();




