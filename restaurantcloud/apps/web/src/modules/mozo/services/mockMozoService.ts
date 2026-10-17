import { ApiResponse } from '@/types/api';
import {
  PlanoCompletoMozoDTO,
  MesaDetalleMozoDTO,
  ItemDespachoListoDTO,
  MesaCardDTO,
  PisoAmbienteDTO,
  AlertaCocinaModalDTO,
  CatalogoProductosMozoDTO,
  ProductoCatalogoMozoDTO,
  CrearPedidoRequest,
  PedidoConfirmadoDTO,
  HistorialMesaComandaDTO,
  PrecuentaMozoResponseDTO,
  PromocionSedeDTO,
  SolicitarCuentaRequest,
  CandidatasUnionResponseDTO,
  UnirMesasRequestDTO,
  UnirMesasResponseDTO,
  DividirMesasResponseDTO,
  ValidacionSeparacionMesaDTO,
  ItemsParaDividirResponseDTO,
  ItemParaDividirDTO,
  DividirCuentaRequestDTO,
  DividirCuentaResponseDTO,
  ConsultaRucResponseDTO,
  ConsultaDniResponseDTO,
  SubcuentaResumenDTO,
  ItemDetalleComandaDTO,
  AnularItemRequestDTO,
  AnularPedidoCompletoRequestDTO,
  ItemAnuladoResponseDTO,
  PedidoAnuladoResponseDTO,
  ReservaCardDTO,
  PoliticasReservaDTO,
  CrearReservaRequestDTO,
  MesaDisponibleReservaDTO,
  MesasDisponiblesResponseDTO,
  SentarReservaResponseDTO,
  RegistrarNoShowRequestDTO,
  CancelarReservaRequestDTO,
  ReasignarMesaReservaRequestDTO,
  PlatoSustitutoSugeridoDTO,
  CategoriaChipDTO,
  CatalogoSustitucionResponseDTO,
  SustituirPlatoRequestDTO,
  SustituirPlatoResponseDTO,
  AnularPorQuiebreRequestDTO,
  AnularPorQuiebreResponseDTO,
} from '@/types/mozo';

// ID canónico del mozo activo de prueba
const MOZO_ACTUAL = {
  id: 'usr-mozo-carlos-001',
  nombre: 'Carlos Mendoza',
  rol: 'mozo',
};

// Pisos configurados del local
const PISOS_MOCK: PisoAmbienteDTO[] = [
  {
    id: 'piso-01-salon',
    nombre: 'Salón Principal',
    total_mesas: 10,
    mesas_ocupadas: 6,
    mesas_libres: 4,
  },
  {
    id: 'piso-02-terraza',
    nombre: 'Terraza Al Aire Libre',
    total_mesas: 4,
    mesas_ocupadas: 2,
    mesas_libres: 2,
  },
  {
    id: 'piso-03-barra',
    nombre: 'Barra & Cócteles',
    total_mesas: 3,
    mesas_ocupadas: 1,
    mesas_libres: 2,
  },
];

// Mesas del Salón Principal
let MESAS_SALON_MOCK: MesaCardDTO[] = [
  {
    id: 'mesa-01',
    piso_id: 'piso-01-salon',
    numero: '01',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 0,
    permite_union: true,
    estado: 'libre',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-02',
    piso_id: 'piso-01-salon',
    numero: '02',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 0,
    permite_union: true,
    estado: 'ocupada',
    pedido_id: 'ped-148',
    comensales_sentados: 2,
    minutos_ocupada: 34,
    total_consumo: 145.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 0,
    platos_en_cocina: 3,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-03',
    piso_id: 'piso-01-salon',
    numero: '03',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 2,
    posicion_y: 0,
    permite_union: true,
    estado: 'libre',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-04',
    piso_id: 'piso-01-salon',
    numero: '04',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 0,
    permite_union: true,
    estado: 'ocupada',
    pedido_id: 'ped-149',
    comensales_sentados: 4,
    minutos_ocupada: 12,
    total_consumo: 94.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 2,
    platos_en_cocina: 1,
    despacho_directo_pendiente: 2,
  },
  {
    id: 'mesa-05',
    piso_id: 'piso-01-salon',
    numero: '05',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 0,
    posicion_y: 1,
    permite_union: false,
    estado: 'cuenta_pedida',
    pedido_id: 'ped-145',
    comensales_sentados: 5,
    minutos_ocupada: 52,
    total_consumo: 210.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-06',
    piso_id: 'piso-01-salon',
    numero: '06',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 1,
    posicion_y: 1,
    permite_union: true,
    estado: 'ocupada',
    pedido_id: 'ped-150',
    comensales_sentados: 2,
    minutos_ocupada: 25,
    total_consumo: 168.0,
    mozo_id: 'usr-mozo-ana-002',
    mozo_nombre: 'Ana Paredes',
    es_mi_mesa: false,
    platos_listos: 1,
    platos_en_cocina: 2,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-07',
    piso_id: 'piso-01-salon',
    numero: '07',
    capacidad: 4,
    forma: 'redonda',
    posicion_x: 2,
    posicion_y: 1,
    permite_union: false,
    estado: 'ocupada',
    pedido_id: 'ped-151',
    comensales_sentados: 3,
    minutos_ocupada: 18,
    total_consumo: 92.0,
    mozo_id: MOZO_ACTUAL.id,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
    platos_listos: 0,
    platos_en_cocina: 2,
    despacho_directo_pendiente: 1,
  },
  {
    id: 'mesa-08',
    piso_id: 'piso-01-salon',
    numero: '08',
    capacidad: 4,
    forma: 'cuadrada',
    posicion_x: 3,
    posicion_y: 1,
    permite_union: true,
    estado: 'bloqueada',
    reserva_cliente: 'Familia Gómez',
    reserva_hora: '14:00',
    minutos_para_reserva: 20,
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-09',
    piso_id: 'piso-01-salon',
    numero: '09',
    capacidad: 2,
    forma: 'cuadrada',
    posicion_x: 0,
    posicion_y: 2,
    permite_union: true,
    estado: 'libre',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 0,
    despacho_directo_pendiente: 0,
  },
  {
    id: 'mesa-10',
    piso_id: 'piso-01-salon',
    numero: '10',
    capacidad: 6,
    forma: 'rectangular',
    posicion_x: 1,
    posicion_y: 2,
    permite_union: true,
    etiqueta_union: 'Mesa [ 10 ; 11 ]',
    estado: 'ocupada',
    pedido_id: 'ped-144',
    comensales_sentados: 6,
    minutos_ocupada: 45,
    total_consumo: 280.0,
    mozo_id: 'usr-mozo-ana-002',
    mozo_nombre: 'Ana Paredes',
    es_mi_mesa: false,
    platos_listos: 0,
    platos_en_cocina: 1,
    despacho_directo_pendiente: 0,
  },
];

// Ítems para la Barra Lateral de Despacho en Vivo
let ITEMS_DESPACHO_MOCK: ItemDespachoListoDTO[] = [
  // ⚡ Productos de despacho directo en salón (Entrega directa: bebidas, gelatinas, postres de vitrina)
  {
    item_id: 'item-despacho-01',
    pedido_id: 'ped-149',
    mesa_id: 'mesa-04',
    mesa_numero: '04',
    ambiente: 'Salón Principal',
    producto_nombre: 'Inca Kola 500ml',
    cantidad: 2,
    nota_especial: 'Heladas con vaso con hielo',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 30,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-02-gelatina',
    pedido_id: 'ped-149',
    mesa_id: 'mesa-04',
    mesa_numero: '04',
    ambiente: 'Salón Principal',
    producto_nombre: 'Gelatina de Fresa de Vitrina',
    cantidad: 2,
    nota_especial: 'Servir fría con leche condensada',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 45,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-02',
    pedido_id: 'ped-151',
    mesa_id: 'mesa-07',
    mesa_numero: '07',
    ambiente: 'Salón Principal',
    producto_nombre: 'Limonada Frozen 1L',
    cantidad: 1,
    nota_especial: 'Sin azúcar adicional',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 75,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-05-postre',
    pedido_id: 'ped-148',
    mesa_id: 'mesa-02',
    mesa_numero: '02',
    ambiente: 'Salón Principal',
    producto_nombre: 'Porción Crema Volteada de Vitrina',
    cantidad: 1,
    nota_especial: 'Porción individual de mostrador',
    requiere_preparacion: false,
    tipo_despacho: 'directo_salon',
    segundos_listo: 90,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },

  // 🔔 Platos listos en pase de cocina KDS
  {
    item_id: 'item-despacho-03',
    pedido_id: 'ped-149',
    mesa_id: 'mesa-04',
    mesa_numero: '04',
    ambiente: 'Salón Principal',
    producto_nombre: 'Lomo Saltado Criollo',
    cantidad: 2,
    nota_especial: 'Término 3/4, papas crocantes',
    requiere_preparacion: true,
    tipo_despacho: 'cocina',
    pase_cocina: 'Pase Caliente #01',
    segundos_listo: 45,
    mozo_nombre: MOZO_ACTUAL.nombre,
    es_mi_mesa: true,
  },
  {
    item_id: 'item-despacho-04',
    pedido_id: 'ped-150',
    mesa_id: 'mesa-06',
    mesa_numero: '06',
    ambiente: 'Salón Principal',
    producto_nombre: 'Ceviche Clásico del Día',
    cantidad: 1,
    nota_especial: 'Picante medio',
    requiere_preparacion: true,
    tipo_despacho: 'cocina',
    pase_cocina: 'Pase Frío #01',
    segundos_listo: 120,
    mozo_nombre: 'Ana Paredes',
    es_mi_mesa: false,
  },
];

// Detalle enriquecido para el Quick-Drawer al tocar Mesa 04
let DETALLE_MESA_04: MesaDetalleMozoDTO = {
  mesa_id: 'mesa-04',
  numero: '04',
  ambiente: 'Salón Principal',
  estado: 'ocupada',
  comanda_id: 'ped-149',
  numero_comanda: 149,
  mozo_nombre: MOZO_ACTUAL.nombre,
  es_mi_mesa: true,
  minutos_en_mesa: 12,
  comensales: 4,
  hora_apertura: '13:48',
  nota_general: 'Celebrando cumpleaños. Al final traer cortesía de postre con velita.',
  total_subtotal: 158.0,
  items: [
    // Platos de cocina KDS
    {
      id: 'it-01',
      producto_id: 'prod-lomo',
      producto_nombre: 'Lomo Saltado Criollo',
      cantidad: 2,
      precio_unitario: 38.0,
      subtotal: 76.0,
      nota_cocina: 'Término 3/4, papas bien crocantes',
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      estado: 'listo',
      minutos_en_estado: 1,
      numero_ronda: 1,
    },
    {
      id: 'it-02',
      producto_id: 'prod-suspiro',
      producto_nombre: 'Suspiro a la Limeña',
      cantidad: 1,
      precio_unitario: 18.0,
      subtotal: 18.0,
      nota_cocina: 'Poner velita de cumpleaños',
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      estado: 'en_preparacion',
      minutos_en_estado: 8,
      numero_ronda: 1,
    },
    {
      id: 'it-03',
      producto_id: 'prod-causa',
      producto_nombre: 'Causa Limeña de Pollo',
      cantidad: 1,
      precio_unitario: 24.0,
      subtotal: 24.0,
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      estado: 'entregado',
      minutos_en_estado: 10,
      numero_ronda: 1,
    },

    // Productos de despacho directo en salón (Entrega directa)
    {
      id: 'it-04',
      producto_id: 'prod-inca-500',
      producto_nombre: 'Inca Kola 500ml',
      cantidad: 2,
      precio_unitario: 9.0,
      subtotal: 18.0,
      nota_cocina: 'Helada con vaso con hielo',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      estado: 'listo',
      minutos_en_estado: 1,
      numero_ronda: 1,
    },
    {
      id: 'it-04-gelatina',
      producto_id: 'prod-gelatina',
      producto_nombre: 'Gelatina de Fresa de Vitrina',
      cantidad: 2,
      precio_unitario: 6.0,
      subtotal: 12.0,
      nota_cocina: 'Servir fría con leche condensada',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      estado: 'listo',
      minutos_en_estado: 1,
      numero_ronda: 1,
    },
    {
      id: 'it-05',
      producto_id: 'prod-chicha',
      producto_nombre: 'Jarra de Chicha Morada 1L',
      cantidad: 1,
      precio_unitario: 22.0,
      subtotal: 22.0,
      nota_cocina: 'Hielo aparte',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      estado: 'entregado',
      minutos_en_estado: 11,
      numero_ronda: 1,
    },
  ],
};

// Almacén en memoria de subcuentas por mesa para CU-MOZO-09
let SUBCUENTAS_POR_MESA_MOCK: Record<string, SubcuentaResumenDTO[]> = {};

export const mockMozoService = {
  /**
   * Obtiene la carga completa del salón para el mozo
   */
  async obtenerPlanoCompleto(pisoId = 'piso-01-salon'): Promise<ApiResponse<PlanoCompletoMozoDTO>> {
    await new Promise((res) => setTimeout(res, 250));

    const pisoActivo = PISOS_MOCK.find((p) => p.id === pisoId) || PISOS_MOCK[0];
    const misMesas = MESAS_SALON_MOCK.filter((m) => m.es_mi_mesa && m.estado === 'ocupada').length;
    const totalVenta = MESAS_SALON_MOCK.filter((m) => m.es_mi_mesa).reduce(
      (sum, m) => sum + (m.total_consumo || 0),
      0
    );

    return {
      exito: true,
      datos: {
        piso_activo: pisoActivo,
        pisos_disponibles: PISOS_MOCK,
        mesas: MESAS_SALON_MOCK,
        items_despacho: ITEMS_DESPACHO_MOCK,
        comandas_preparacion: [
          {
            pedido_id: 'ped-148',
            mesa_numero: '02',
            numero_comanda: 148,
            minutos_transcurridos: 14,
            total_items: 3,
            items_en_fuego: 2,
          },
          {
            pedido_id: 'ped-151',
            mesa_numero: '07',
            numero_comanda: 151,
            minutos_transcurridos: 6,
            total_items: 2,
            items_en_fuego: 2,
          },
        ],
        alertas_operativas: [
          {
            id: 'alerta-01',
            tipo: 'quiebre_insumo',
            titulo: 'Quiebre de Insumo en Cocina',
            descripcion: 'Papa Amarilla agotada. Mesa 07 requiere sustitución de Causa Limeña.',
            mesa_numero: '07',
            hora: '13:52',
          },
        ],
        mesas_libres: 4,
        mesas_ocupadas: 6,
        total_mesas: 10,
        mis_mesas_activas: misMesas,
        total_venta_turno: totalVenta,
        mozo_actual: MOZO_ACTUAL,
      },
    };
  },

  /**
   * Obtiene el detalle de inspección de una mesa para el Quick-Drawer
   */
  async obtenerDetalleMesa(mesaId: string): Promise<ApiResponse<MesaDetalleMozoDTO>> {
    await new Promise((res) => setTimeout(res, 180));

    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);

    const esUnida = Boolean(mesa?.etiqueta_union || mesa?.mesa_principal_id);
    let detalleAgrupacion: string | undefined = undefined;
    if (esUnida) {
      const titularId = mesa?.mesa_principal_id || mesa?.id;
      const titular = MESAS_SALON_MOCK.find((m) => m.id === titularId);
      const secundarias = MESAS_SALON_MOCK.filter(
        (m) => (m.mesa_principal_id === titularId || m.id === titularId) && m.id !== titularId
      );
      const secText = secundarias.length > 0
        ? secundarias.map((s) => `Mesa ${s.numero} (Secundaria • ${s.capacidad}p)`).join(' + ')
        : 'Mesa 03 (Secundaria • 4p)';
      detalleAgrupacion = `Mesa ${titular?.numero || mesa?.numero} (Titular • ${titular?.capacidad || 4}p) + ${secText}`;
    }

    const subcuentasExistentes = SUBCUENTAS_POR_MESA_MOCK[mesaId];
    const esDividida = Boolean(subcuentasExistentes && subcuentasExistentes.length > 0) || Boolean(mesa?.es_cuenta_dividida);

    if (mesaId === 'mesa-04') {
      return {
        exito: true,
        datos: {
          ...DETALLE_MESA_04,
          es_mesa_unida: esUnida,
          mesa_principal_id: mesa?.mesa_principal_id,
          mesas_agrupadas_detalle: detalleAgrupacion,
          es_cuenta_dividida: esDividida,
          partes_subcuentas: subcuentasExistentes?.length || mesa?.partes_subcuentas,
          subcuentas_resumen: subcuentasExistentes,
        },
      };
    }

    // Respuesta genérica para otras mesas ocupadas
    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        numero: mesa?.numero || '01',
        ambiente: 'Salón Principal',
        estado: mesa?.estado || 'ocupada',
        etiqueta_union: mesa?.etiqueta_union,
        es_mesa_unida: esUnida,
        mesa_principal_id: mesa?.mesa_principal_id,
        mesas_agrupadas_detalle: detalleAgrupacion,
        es_cuenta_dividida: esDividida,
        partes_subcuentas: subcuentasExistentes?.length || mesa?.partes_subcuentas,
        subcuentas_resumen: subcuentasExistentes,
        comanda_id: mesa?.pedido_id || 'ped-demo',
        numero_comanda: 140 + Number(mesa?.numero || 1),
        mozo_nombre: mesa?.mozo_nombre || MOZO_ACTUAL.nombre,
        es_mi_mesa: mesa?.es_mi_mesa ?? true,
        minutos_en_mesa: mesa?.minutos_ocupada || 15,
        comensales: mesa?.comensales_sentados || 2,
        hora_apertura: '13:30',
        total_subtotal: mesa?.total_consumo || 85.0,
        items: [
          {
            id: `item-${mesaId}-1`,
            producto_id: 'p-01',
            producto_nombre: 'Arroz con Mariscos Especial',
            cantidad: 1,
            precio_unitario: 45.0,
            subtotal: 45.0,
            requiere_preparacion: true,
            tipo_despacho: 'cocina',
            estado: 'en_preparacion',
            minutos_en_estado: 10,
            numero_ronda: 1,
          },
          {
            id: `item-${mesaId}-2`,
            producto_id: 'p-02',
            producto_nombre: 'Cerveza Cusqueña Trigo 330ml',
            cantidad: 2,
            precio_unitario: 12.0,
            subtotal: 24.0,
            requiere_preparacion: false,
            tipo_despacho: 'directo_salon',
            estado: 'entregado',
            minutos_en_estado: 12,
            numero_ronda: 1,
          },
        ],
      },
    };
  },

  /**
   * Marca un ítem de la barra lateral o drawer como entregado / servido
   */
  async marcarItemServido(itemId: string): Promise<ApiResponse<{ success: boolean; itemId: string }>> {
    await new Promise((res) => setTimeout(res, 120));

    // Remueve el ítem de la lista de listos
    ITEMS_DESPACHO_MOCK = ITEMS_DESPACHO_MOCK.filter((i) => i.item_id !== itemId);

    return {
      exito: true,
      datos: { success: true, itemId },
    };
  },

  /**
   * Conmuta la mesa a 'cuenta_pedida' para que Caja emita precuenta o cobre
   */
  async solicitarCuentaMesa(mesaId: string): Promise<ApiResponse<{ success: boolean; mesaId: string }>> {
    await new Promise((res) => setTimeout(res, 150));

    MESAS_SALON_MOCK = MESAS_SALON_MOCK.map((m) =>
      m.id === mesaId ? { ...m, estado: 'cuenta_pedida' as const } : m
    );

    return {
      exito: true,
      datos: { success: true, mesaId },
    };
  },

  /**
   * Abre una mesa libre sentando comensales
   */
  async abrirMesa(
    mesaId: string,
    comensales = 2
  ): Promise<ApiResponse<{ success: boolean; pedidoId: string }>> {
    await new Promise((res) => setTimeout(res, 150));

    const nuevoPedidoId = `ped-${Date.now().toString().slice(-4)}`;

    MESAS_SALON_MOCK = MESAS_SALON_MOCK.map((m) =>
      m.id === mesaId
        ? {
            ...m,
            estado: 'ocupada' as const,
            pedido_id: nuevoPedidoId,
            comensales_sentados: comensales,
            minutos_ocupada: 1,
            total_consumo: 0,
            mozo_id: MOZO_ACTUAL.id,
            mozo_nombre: MOZO_ACTUAL.nombre,
            es_mi_mesa: true,
            platos_listos: 0,
            platos_en_cocina: 0,
            bebidas_pendientes: 0,
          }
        : m
    );

    return {
      exito: true,
      datos: { success: true, pedidoId: nuevoPedidoId },
    };
  },

  /**
   * CU-MOZO-01 / CU-MOZO-06: Liberar mesa cuando el cliente se retira sin consumo
   */
  async liberarMesaSinConsumo(
    mesaId: string
  ): Promise<ApiResponse<{ mesa_id: string; mensaje: string }>> {
    await new Promise((res) => setTimeout(res, 100));
    MESAS_SALON_MOCK = MESAS_SALON_MOCK.map((m) =>
      m.id === mesaId
        ? {
            ...m,
            estado: 'libre',
            pedido_id: null,
            comensales_sentados: null,
            minutos_ocupada: null,
            total_consumo: null,
            mozo_id: null,
            mozo_nombre: null,
            es_mi_mesa: false,
            platos_listos: 0,
            platos_en_cocina: 0,
            despacho_directo_pendiente: 0,
            bebidas_pendientes: 0,
          }
        : m
    );
    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        mensaje: 'Mesa liberada exitosamente.',
      },
    };
  },

  /**
   * Genera un evento simulado de plato listo en cocina
   */
  simularPlatoListoCocina(): ItemDespachoListoDTO {
    const nuevoItem: ItemDespachoListoDTO = {
      item_id: `item-live-${Date.now()}`,
      pedido_id: 'ped-149',
      mesa_id: 'mesa-04',
      mesa_numero: '04',
      ambiente: 'Salón Principal',
      producto_nombre: 'Arroz con Pato Criollo',
      cantidad: 1,
      nota_especial: 'Extra salsa criolla',
      requiere_preparacion: true,
      tipo_despacho: 'cocina',
      pase_cocina: 'Pase Caliente #01',
      segundos_listo: 5,
      mozo_nombre: MOZO_ACTUAL.nombre,
      es_mi_mesa: true,
    };

    ITEMS_DESPACHO_MOCK.unshift(nuevoItem);
    return nuevoItem;
  },

  /**
   * Genera un evento simulado de nuevo producto de despacho directo en salón (Entrega directa: gelatina o bebida)
   */
  simularProductoDespachoDirecto(): ItemDespachoListoDTO {
    const esGelatina = Math.random() > 0.5;
    const nuevoItem: ItemDespachoListoDTO = {
      item_id: `item-direct-${Date.now()}`,
      pedido_id: 'ped-148',
      mesa_id: 'mesa-02',
      mesa_numero: '02',
      ambiente: 'Salón Principal',
      producto_nombre: esGelatina
        ? 'Gelatina de Fresa de Vitrina'
        : 'Agua San Mateo sin gas 600ml',
      cantidad: esGelatina ? 2 : 1,
      nota_especial: esGelatina ? 'Servir bien fría de mostrador' : 'Al tiempo',
      requiere_preparacion: false,
      tipo_despacho: 'directo_salon',
      segundos_listo: 2,
      mozo_nombre: MOZO_ACTUAL.nombre,
      es_mi_mesa: true,
    };

    ITEMS_DESPACHO_MOCK.unshift(nuevoItem);
    return nuevoItem;
  },

  // Alias retrocompatible
  simularNuevaBebidaSalon(): ItemDespachoListoDTO {
    return this.simularProductoDespachoDirecto();
  },

  /**
   * Datos de alerta emergente prioritaria
   */
  obtenerAlertaModalDemo(): AlertaCocinaModalDTO {
    return {
      id: 'alerta-pase-demo',
      tipo: 'plato_listo',
      mesa_numero: '04',
      ambiente: 'Salón Principal',
      comanda_numero: 149,
      plato_nombre: '2x Lomo Saltado Criollo (Término 3/4)',
      cantidad: 2,
      nota_especial: 'El comensal solicitó término 3/4 exacto. Retirar de inmediato.',
      cocinero_nombre: 'Roberto Vega',
      pase_nombre: 'Pase Caliente #01',
      segundos_transcurridos: 25,
      insumo_agotado: 'Papa Amarilla',
      platos_afectados: ['Causa Limeña', 'Papas Rellenas'],
    };
  },

  /**
   * Alterna a turno 100% libre / vacío para probar Vista 4
   */
  obtenerPlanoTurnoVacio(): PlanoCompletoMozoDTO {
    const mesasVacias = MESAS_SALON_MOCK.map((m) => ({
      ...m,
      estado: 'libre' as const,
      pedido_id: null,
      comensales_sentados: null,
      minutos_ocupada: null,
      total_consumo: null,
      mozo_id: null,
      mozo_nombre: null,
      es_mi_mesa: false,
      platos_listos: 0,
      platos_en_cocina: 0,
      despacho_directo_pendiente: 0,
      bebidas_pendientes: 0,
      reserva_cliente: null,
      reserva_hora: null,
    }));

    return {
      piso_activo: {
        id: 'piso-01-salon',
        nombre: 'Salón Principal',
        total_mesas: 10,
        mesas_ocupadas: 0,
        mesas_libres: 10,
      },
      pisos_disponibles: PISOS_MOCK.map((p) => ({ ...p, mesas_ocupadas: 0, mesas_libres: p.total_mesas })),
      mesas: mesasVacias,
      items_despacho: [],
      comandas_preparacion: [],
      alertas_operativas: [],
      mesas_libres: 10,
      mesas_ocupadas: 0,
      total_mesas: 10,
      mis_mesas_activas: 0,
      total_venta_turno: 0,
      mozo_actual: MOZO_ACTUAL,
    };
  },

  /**
   * =========================================================================
   * MÉTODOS PARA CU-MOZO-02: TOMA DE PEDIDO Y COMANDA MÓVIL
   * =========================================================================
   */

  /**
   * Obtiene el catálogo completo de la carta con categorías y disponibilidad en vivo
   */
  async obtenerCatalogoCarta(_mesaId: string): Promise<ApiResponse<CatalogoProductosMozoDTO>> {
    await new Promise((res) => setTimeout(res, 150));

    const categoriasMap = new Map<string, { id: string; nombre: string; total: number }>();
    PRODUCTOS_CARTA_MOCK.forEach((p) => {
      if (!categoriasMap.has(p.categoria_id)) {
        categoriasMap.set(p.categoria_id, {
          id: p.categoria_id,
          nombre: p.categoria_nombre,
          total: 0,
        });
      }
      categoriasMap.get(p.categoria_id)!.total++;
    });

    return {
      exito: true,
      datos: {
        categorias: Array.from(categoriasMap.values()),
        productos: [...PRODUCTOS_CARTA_MOCK],
      },
    };
  },

  /**
   * Obtiene el historial de consumos y comanda activa de la mesa (soporta Ronda #02 adicional)
   */
  async obtenerHistorialMesa(mesaId: string): Promise<ApiResponse<HistorialMesaComandaDTO>> {
    await new Promise((res) => setTimeout(res, 120));

    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    const mesaNumero = mesa?.numero || '04';
    const esOcupada = mesa?.estado === 'ocupada' || mesa?.estado === 'cuenta_pedida';

    // Si la mesa ya está ocupada, simula que tiene la Ronda #01 enviada
    const itemsRondaPrevia = esOcupada
      ? [
          {
            id: 'item-previo-01',
            producto_id: 'prod-criollo-01',
            producto_nombre: 'Lomo Saltado Criollo',
            cantidad: 2,
            precio_unitario: 38.0,
            subtotal: 76.0,
            nota_cocina: 'Término 3/4, sin cebolla',
            requiere_preparacion: true,
            tipo_despacho: 'cocina' as const,
            estado: 'entregado' as const,
            minutos_en_estado: 15,
            numero_ronda: 1,
          },
          {
            id: 'item-previo-02',
            producto_id: 'prod-ent-01',
            producto_nombre: 'Causa Limeña de Pollo',
            cantidad: 1,
            precio_unitario: 24.0,
            subtotal: 24.0,
            nota_cocina: null,
            requiere_preparacion: true,
            tipo_despacho: 'cocina' as const,
            estado: 'entregado' as const,
            minutos_en_estado: 15,
            numero_ronda: 1,
          },
          {
            id: 'item-previo-03',
            producto_id: 'prod-beb-03',
            producto_nombre: 'Jarra de Chicha Morada Casera 1L',
            cantidad: 1,
            precio_unitario: 18.0,
            subtotal: 18.0,
            nota_cocina: 'Helada',
            requiere_preparacion: false,
            tipo_despacho: 'directo_salon' as const,
            estado: 'entregado' as const,
            minutos_en_estado: 20,
            numero_ronda: 1,
          },
        ]
      : [];

    const totalPrevio = itemsRondaPrevia.reduce((acc, it) => acc + it.subtotal, 0);

    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        mesa_numero: mesaNumero,
        ambiente: 'Salón Principal',
        comensales: mesa?.comensales_sentados || 4,
        minutos_en_mesa: mesa?.minutos_ocupada || 35,
        mozo_nombre: mesa?.mozo_nombre || MOZO_ACTUAL.nombre,
        ronda_actual: esOcupada ? 2 : 1,
        ronda_previa_items: itemsRondaPrevia,
        total_previo: totalPrevio,
      },
    };
  },

  /**
   * Despacha la comanda a cocina y salón con split atómico
   */
  async enviarPedidoCocina(
    request: CrearPedidoRequest,
    forzarConflictoStock = false
  ): Promise<ApiResponse<PedidoConfirmadoDTO>> {
    await new Promise((res) => setTimeout(res, 350));

    // Si se activa simulación de conflicto de stock (Vista 4: 409 Conflict)
    if (forzarConflictoStock) {
      return {
        exito: false,
        datos: null as any,
        errores: [
          {
            codigo: 'ERR_PRODUCTO_AGOTADO',
            mensaje:
              "El insumo crítico 'Pescado Blanco (Corvina)' se agotó en cocina hace 30 segundos. La preparación de Ceviche Clásico no es posible.",
            campo: 'items[0].producto_id',
          },
        ],
      };
    }

    // Calcular montos y enriquecer ítems
    let totalComanda = 0;
    const itemsEnviados = request.items.map((it, idx) => {
      const prod = PRODUCTOS_CARTA_MOCK.find((p) => p.id === it.producto_id);
      const precio = prod?.precio || 20.0;
      const subtotal = precio * it.cantidad;
      totalComanda += subtotal;

      return {
        id: `item-env-${Date.now()}-${idx}`,
        producto_id: it.producto_id,
        producto_nombre: prod?.nombre || 'Producto Gastronómico',
        cantidad: it.cantidad,
        precio_unitario: precio,
        subtotal: subtotal,
        nota_cocina: it.nota_cocina || null,
        estado: prod?.requiere_preparacion ? 'en_cola' : 'listo',
        numero_ronda: request.numero_ronda,
        created_at: new Date().toISOString(),
      };
    });

    // Actualizar estado de la mesa en el mock
    const mesaIndex = MESAS_SALON_MOCK.findIndex((m) => m.id === request.mesa_id);
    if (mesaIndex >= 0) {
      const mesaAnt = MESAS_SALON_MOCK[mesaIndex];
      MESAS_SALON_MOCK[mesaIndex] = {
        ...mesaAnt,
        estado: 'ocupada',
        comensales_sentados: request.comensales,
        total_consumo: (mesaAnt.total_consumo || 0) + totalComanda,
        es_mi_mesa: true,
        mozo_nombre: MOZO_ACTUAL.nombre,
      };
    }

    return {
      exito: true,
      datos: {
        pedido_id: `ped-${Date.now()}`,
        mesa_id: request.mesa_id,
        mesa_numero: '04',
        numero_ronda: request.numero_ronda,
        estado: 'enviado',
        total_comanda: totalComanda,
        items_enviados: itemsEnviados,
        mensaje: 'Comanda despachada a cocina y salón con éxito',
      },
    };
  },

  /**
   * Conmuta la disponibilidad de un producto en la carta para probar reactividad
   */
  alternarDisponibilidadProducto(productoId: string): boolean {
    const prod = PRODUCTOS_CARTA_MOCK.find((p) => p.id === productoId);
    if (prod) {
      prod.disponibilidad = prod.disponibilidad === 'disponible' ? 'agotado' : 'disponible';
      return prod.disponibilidad === 'disponible';
    }
    return false;
  },

  /**
   * =========================================================================
   * MÉTODOS PARA CU-MOZO-08: PRECUENTA DIGITAL EN MESA
   * =========================================================================
   */

  /**
   * Consulta on-demand de la precuenta digital de la mesa sin esperar a caja
   */
  async obtenerPrecuentaMesa(mesaId: string): Promise<ApiResponse<PrecuentaMozoResponseDTO>> {
    await new Promise((res) => setTimeout(res, 180));

    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    const mesaNumero = mesa?.numero || '04';

    // Consolidado de consumos (4 ítems de prueba para un total bruto de S/ 100.00)
    const itemsPrecuenta = [
      {
        producto_id: 'prod-criollo-01',
        nombre: 'Lomo Saltado Criollo',
        nota_cocina: 'Término 3/4, con papas amarillas',
        cantidad: 1,
        precio_unitario: 38.0,
        subtotal: 38.0,
        estado_cocina: 'en_preparacion' as const, // Simula advertencia de cocina
      },
      {
        producto_id: 'prod-mar-03',
        nombre: 'Arroz con Mariscos Especial',
        nota_cocina: null,
        cantidad: 1,
        precio_unitario: 34.0,
        subtotal: 34.0,
        estado_cocina: 'listo' as const,
      },
      {
        producto_id: 'prod-beb-03',
        nombre: 'Jarra de Chicha Morada Casera 1L',
        nota_cocina: 'Helada con vaso',
        cantidad: 1,
        precio_unitario: 16.0,
        subtotal: 16.0,
        estado_cocina: 'entregado' as const,
      },
      {
        producto_id: 'prod-ent-01',
        nombre: 'Causa Limeña Clásica de Pollo',
        nota_cocina: null,
        cantidad: 1,
        precio_unitario: 12.0,
        subtotal: 12.0,
        estado_cocina: 'entregado' as const,
      },
    ];

    const consumoBruto = itemsPrecuenta.reduce((acc, it) => acc + it.subtotal, 0); // 100.00
    const promocionActiva = PROMOCIONES_SEDE_MOCK[0]; // 15% Almuerzo Ejecutivo
    const descuentoComercial =
      Math.round(consumoBruto * (promocionActiva.porcentaje_descuento / 100) * 100) / 100; // 15.00
    const totalNeto = consumoBruto - descuentoComercial; // 85.00
    const baseImponible = Math.round((totalNeto / 1.18) * 100) / 100; // 72.03
    const igv = Math.round((totalNeto - baseImponible) * 100) / 100; // 12.97

    // Opciones de pago proyectadas
    const comisionTarjeta = Math.round(totalNeto * 0.035 * 100) / 100; // 3.5% = 2.98
    const totalTarjeta = Math.round((totalNeto + comisionTarjeta) * 100) / 100; // 87.98

    const opcionesPago = [
      {
        codigo: 'efectivo' as const,
        nombre: 'Efectivo',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
      },
      {
        codigo: 'billetera_digital' as const,
        nombre: 'Billetera Digital (Yape / Plin)',
        comision_porcentaje: 0.0,
        monto_comision: 0.0,
        total_estimado: totalNeto,
        detalle_billetera: {
          telefono: '987 654 321',
          titular: 'Restaurant S.A.C.',
          ruc: '20601234567',
          qr_imagen_url: '',
          monto_exacto: totalNeto,
        },
      },
      {
        codigo: 'tarjeta' as const,
        nombre: 'Tarjeta Débito / Crédito',
        comision_porcentaje: 3.5,
        monto_comision: comisionTarjeta,
        total_estimado: totalTarjeta,
      },
    ];

    return {
      exito: true,
      datos: {
        mesa_id: mesaId,
        mesa_numero: mesaNumero,
        es_mesa_unida: mesa?.permite_union || false,
        mozo_nombre: mesa?.mozo_nombre || MOZO_ACTUAL.nombre,
        comensales: mesa?.comensales_sentados || 4,
        minutos_en_mesa: mesa?.minutos_ocupada || 32,
        items: itemsPrecuenta,
        tiene_cocina_pendiente: true,
        alerta_cocina: "1 plato 'Lomo Saltado' en 'preparación'",
        promociones_disponibles: PROMOCIONES_SEDE_MOCK,
        promocion_activa: promocionActiva,
        tributacion_sunat: {
          consumo_bruto: consumoBruto,
          descuento_comercial: descuentoComercial,
          total_neto: totalNeto,
          base_imponible: baseImponible,
          igv: igv,
          tasa_igv: 0.18,
        },
        opciones_pago: opcionesPago,
        calculada_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Conmuta a cuenta_pedida, guarda el método acordado y notifica a Caja vía SSE
   */
  async solicitarCuentaMesaConDetalle(
    request: SolicitarCuentaRequest
  ): Promise<ApiResponse<{ success: boolean; mesa_id: string; mensaje: string }>> {
    await new Promise((res) => setTimeout(res, 200));

    const mesaIndex = MESAS_SALON_MOCK.findIndex((m) => m.id === request.mesa_id);
    if (mesaIndex >= 0) {
      MESAS_SALON_MOCK[mesaIndex] = {
        ...MESAS_SALON_MOCK[mesaIndex],
        estado: 'cuenta_pedida',
        total_consumo: request.monto_declarado,
      };
    }

    return {
      exito: true,
      datos: {
        success: true,
        mesa_id: request.mesa_id,
        mensaje: `Precuenta de Mesa ${request.mesa_id} enviada a Caja vía SSE exitosamente.`,
      },
    };
  },

  /**
   * Obtiene la lista de mesas candidatas para unión en el salón (CU-MOZO-04)
   */
  async obtenerCandidatasUnion(mesaId: string): Promise<ApiResponse<CandidatasUnionResponseDTO>> {
    await new Promise((res) => setTimeout(res, 150));
    const mesaOrigen = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    if (!mesaOrigen) {
      return {
        exito: false,
        datos: null as unknown as CandidatasUnionResponseDTO,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa de origen no encontrada' }],
      };
    }

    const candidatas = MESAS_SALON_MOCK
      .filter((m) => m.piso_id === mesaOrigen.piso_id && m.id !== mesaId)
      .map((m) => {
        const elegible = m.estado === 'libre' && m.permite_union && !m.mesa_principal_id;
        let motivo_bloqueo: string | undefined = undefined;

        if (!m.permite_union) {
          motivo_bloqueo = 'Mesa fija (No permite unión)';
        } else if (m.estado === 'ocupada') {
          motivo_bloqueo = 'Ocupada con comanda activa';
        } else if (m.estado === 'cuenta_pedida') {
          motivo_bloqueo = 'Cuenta pedida en espera de caja';
        } else if (m.estado === 'bloqueada') {
          motivo_bloqueo = 'Bloqueada por reserva inminente';
        } else if (m.mesa_principal_id) {
          motivo_bloqueo = 'Ya vinculada a otro grupo';
        }

        return {
          id: m.id,
          numero: m.numero,
          capacidad: m.capacidad,
          posicion_x: m.posicion_x,
          posicion_y: m.posicion_y,
          estado: m.estado,
          permite_union: m.permite_union,
          elegible,
          motivo_bloqueo,
        };
      });

    return {
      exito: true,
      datos: {
        mesa_origen_id: mesaId,
        numero_origen: mesaOrigen.numero,
        capacidad_origen: mesaOrigen.capacidad,
        candidatas,
      },
    };
  },

  /**
   * Une dos o más mesas físicas en salón bajo una mesa titular (CU-MOZO-04)
   */
  async unirMesas(request: UnirMesasRequestDTO): Promise<ApiResponse<UnirMesasResponseDTO>> {
    await new Promise((res) => setTimeout(res, 200));
    const titularIndex = MESAS_SALON_MOCK.findIndex((m) => m.id === request.mesa_titular_id);
    if (titularIndex < 0) {
      return {
        exito: false,
        datos: null as unknown as UnirMesasResponseDTO,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa titular no encontrada' }],
      };
    }

    const titular = MESAS_SALON_MOCK[titularIndex];
    const secundarias = MESAS_SALON_MOCK.filter((m) => request.mesas_secundarias_ids.includes(m.id));

    const todosNumeros = [titular.numero, ...secundarias.map((s) => s.numero)].sort();
    const labelUnificado = `Mesa [ ${todosNumeros.join(' ; ')} ]`;
    const capacidadTotal = titular.capacidad + secundarias.reduce((acc, s) => acc + s.capacidad, 0);

    // Actualizar mesa titular en mock
    MESAS_SALON_MOCK[titularIndex] = {
      ...titular,
      etiqueta_union: labelUnificado,
      capacidad: capacidadTotal,
      comensales_sentados: (titular.comensales_sentados || 2) + secundarias.reduce((acc, s) => acc + (s.comensales_sentados || 0), 0),
    };

    // Actualizar mesas secundarias en mock
    secundarias.forEach((sec) => {
      const idx = MESAS_SALON_MOCK.findIndex((m) => m.id === sec.id);
      if (idx >= 0) {
        MESAS_SALON_MOCK[idx] = {
          ...MESAS_SALON_MOCK[idx],
          mesa_principal_id: titular.id,
          etiqueta_union: labelUnificado,
          estado: 'ocupada',
        };
      }
    });

    const grupoItems = [
      { id: titular.id, numero: titular.numero, es_principal: true, capacidad: titular.capacidad },
      ...secundarias.map((s) => ({ id: s.id, numero: s.numero, es_principal: false, capacidad: s.capacidad })),
    ];

    return {
      exito: true,
      datos: {
        mesa_principal_id: titular.id,
        label_unificado: labelUnificado,
        capacidad_total: capacidadTotal,
        mesas: grupoItems,
        created_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Valida si una mesa unida puede separarse o si requiere bloqueo asistido (CU-MOZO-04)
   */
  async validarSeparacionMesa(mesaId: string): Promise<ApiResponse<ValidacionSeparacionMesaDTO>> {
    await new Promise((res) => setTimeout(res, 120));
    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    if (!mesa) {
      return {
        exito: false,
        datos: null as unknown as ValidacionSeparacionMesaDTO,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada' }],
      };
    }

    const titularId = mesa.mesa_principal_id || mesa.id;
    const titular = MESAS_SALON_MOCK.find((m) => m.id === titularId);
    const secundarias = MESAS_SALON_MOCK.filter(
      (m) => m.mesa_principal_id === titularId && m.id !== titularId
    );

    // Si tiene comanda activa pendiente de cobro
    const tieneConsumoActivo = Boolean(
      (mesa.total_consumo && mesa.total_consumo > 0 && mesa.estado !== 'libre') ||
      (titular?.total_consumo && titular.total_consumo > 0 && titular.estado !== 'libre')
    );

    const label = mesa.etiqueta_union || titular?.etiqueta_union || `Mesa [ ${mesa.numero} ]`;

    const mesasRestaurar = [
      {
        id: titular?.id || mesa.id,
        numero: titular?.numero || mesa.numero,
        capacidad: 4,
        rol: 'titular' as const,
      },
      ...secundarias.map((s) => ({
        id: s.id,
        numero: s.numero,
        capacidad: 4,
        rol: 'secundaria' as const,
      })),
    ];

    if (tieneConsumoActivo) {
      return {
        exito: true,
        datos: {
          puede_separar: false,
          motivo_bloqueo: 'Comanda Activa con Consumos Pendientes de Cobro',
          total_consumo: mesa.total_consumo || titular?.total_consumo || 216.0,
          items_activos: 5,
          mesa_label: label,
          mesas_a_restaurar: mesasRestaurar,
        },
      };
    }

    return {
      exito: true,
      datos: {
        puede_separar: true,
        mesa_label: label,
        mesas_a_restaurar: mesasRestaurar,
      },
    };
  },

  /**
   * Divide y restaura las mesas físicas a individuales libres (CU-MOZO-04)
   */
  async dividirMesas(mesaId: string, forzar = false): Promise<ApiResponse<DividirMesasResponseDTO>> {
    await new Promise((res) => setTimeout(res, 200));
    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);
    if (!mesa) {
      return {
        exito: false,
        datos: null as unknown as DividirMesasResponseDTO,
        errores: [{ codigo: 'ERR_MESA_NO_ENCONTRADA', mensaje: 'Mesa no encontrada' }],
      };
    }

    const titularId = mesa.mesa_principal_id || mesa.id;
    const titularIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === titularId);

    if (!forzar && mesa.total_consumo && mesa.total_consumo > 0 && mesa.estado !== 'libre') {
      return {
        exito: false,
        datos: null as unknown as DividirMesasResponseDTO,
        errores: [
          {
            codigo: 'ERR_MESAS_CON_CONSUMO_ACTIVO',
            mensaje: 'No se puede separar mesas con pedidos activos sin liquidar.',
          },
        ],
      };
    }

    const separadas: string[] = [];
    if (titularIdx >= 0) {
      MESAS_SALON_MOCK[titularIdx] = {
        ...MESAS_SALON_MOCK[titularIdx],
        etiqueta_union: undefined,
        mesa_principal_id: null,
        capacidad: 4,
        comensales_sentados: undefined,
        total_consumo: 0,
        estado: 'libre',
        pedido_id: undefined,
        platos_listos: 0,
        platos_en_cocina: 0,
        despacho_directo_pendiente: 0,
      };
      separadas.push(titularId);
    }

    // Restaurar secundarias
    MESAS_SALON_MOCK = MESAS_SALON_MOCK.map((m) => {
      if (m.mesa_principal_id === titularId || (m.id === mesaId && m.mesa_principal_id)) {
        separadas.push(m.id);
        return {
          ...m,
          mesa_principal_id: null,
          etiqueta_union: undefined,
          capacidad: 4,
          comensales_sentados: undefined,
          total_consumo: 0,
          estado: 'libre' as const,
          pedido_id: undefined,
          platos_listos: 0,
          platos_en_cocina: 0,
          despacho_directo_pendiente: 0,
        };
      }
      return m;
    });

    return {
      exito: true,
      datos: {
        mesa_principal_id: titularId,
        mesas_separadas: Array.from(new Set(separadas)),
        mensaje: 'Mesas desvinculadas exitosamente. Retornaron al estado individual LIBRE.',
      },
    };
  },

  /**
   * Obtiene los ítems consumidos en la mesa listos para subdividir (CU-MOZO-09)
   */
  async obtenerItemsParaDividir(mesaId: string): Promise<ApiResponse<ItemsParaDividirResponseDTO>> {
    await new Promise((res) => setTimeout(res, 180));
    const mesa = MESAS_SALON_MOCK.find((m) => m.id === mesaId);

    // Items de comanda oficiales según el wireframe canónico (Comanda #108 - Mesa 04)
    const itemsComandaMock: ItemParaDividirDTO[] = [
      {
        id: 'split-it-01',
        pedido_item_id: 'c201a111-0001-4b45-9756-000000000001',
        producto_id: 'p001-lomo-saltado',
        nombre: 'Lomo Saltado Criollo',
        nota_cocina: 'Término 3/4, papas crocantes',
        cantidad: 1,
        precio_unitario: 38.0,
        subtotal: 38.0,
      },
      {
        id: 'split-it-02',
        pedido_item_id: 'c201a111-0002-4b45-9756-000000000002',
        producto_id: 'p002-arroz-mariscos',
        nombre: 'Arroz con Mariscos Especial',
        nota_cocina: 'Porción estándar',
        cantidad: 1,
        precio_unitario: 34.0,
        subtotal: 34.0,
      },
      {
        id: 'split-it-03',
        pedido_item_id: 'c201a111-0003-4b45-9756-000000000003',
        producto_id: 'p003-chicha-1l',
        nombre: 'Chicha Morada Jarra 1L',
        nota_cocina: 'Helada',
        cantidad: 1,
        precio_unitario: 16.0,
        subtotal: 16.0,
      },
      {
        id: 'split-it-04',
        pedido_item_id: 'c201a111-0004-4b45-9756-000000000004',
        producto_id: 'p004-causa-limena',
        nombre: 'Causa Limeña Clásica',
        nota_cocina: 'Entrada fría',
        cantidad: 1,
        precio_unitario: 12.0,
        subtotal: 12.0,
      },
    ];

    const totalBruto = itemsComandaMock.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      exito: true,
      datos: {
        pedido_id: mesa?.pedido_id || 'ped-149',
        mesa_id: mesaId,
        mesa_numero: mesa?.numero || '04',
        comensales: mesa?.comensales_sentados || 4,
        total_bruto: totalBruto,
        items: itemsComandaMock,
      },
    };
  },

  /**
   * Consulta datos de RUC ante SUNAT para Factura (CU-MOZO-09)
   */
  async consultarRuc(ruc: string): Promise<ApiResponse<ConsultaRucResponseDTO>> {
    await new Promise((res) => setTimeout(res, 200));

    if (!/^(10|15|17|20)\d{9}$/.test(ruc)) {
      return {
        exito: false,
        datos: null as unknown as ConsultaRucResponseDTO,
        errores: [
          {
            codigo: 'ERR_RUC_INVALIDO',
            mensaje: 'El RUC debe tener 11 dígitos y comenzar con 10, 15, 17 o 20.',
          },
        ],
      };
    }

    if (ruc === '20601234567') {
      return {
        exito: true,
        datos: {
          ruc: '20601234567',
          razon_social: 'INVERSIONES GASTRONÓMICAS S.A.C.',
          direccion: 'AV. LARCO 1045, MIRAFLORES, LIMA',
          estado: 'ACTIVO',
          condicion: 'HABIDO',
        },
      };
    }

    return {
      exito: true,
      datos: {
        ruc,
        razon_social: `EMPRESA CONSULTORA DEMO ${ruc.slice(-4)} S.A.C.`,
        direccion: `CALLE LOS NEGOCIOS ${ruc.slice(-3)}, SAN ISIDRO, LIMA`,
        estado: 'ACTIVO',
        condicion: 'HABIDO',
      },
    };
  },

  /**
   * Consulta datos de DNI ante RENIEC para Boleta (CU-MOZO-09)
   */
  async consultarDni(dni: string): Promise<ApiResponse<ConsultaDniResponseDTO>> {
    await new Promise((res) => setTimeout(res, 180));

    if (!/^\d{8}$/.test(dni)) {
      return {
        exito: false,
        datos: null as unknown as ConsultaDniResponseDTO,
        errores: [
          {
            codigo: 'ERR_DNI_INVALIDO',
            mensaje: 'El DNI debe contener exactamente 8 dígitos numéricos.',
          },
        ],
      };
    }

    if (dni === '72819201') {
      return {
        exito: true,
        datos: {
          dni: '72819201',
          nombre_completo: 'CARLOS MENDOZA QUISPE',
        },
      };
    }

    return {
      exito: true,
      datos: {
        dni,
        nombre_completo: `CLIENTE REGISTRADO ${dni.slice(-4)}`,
      },
    };
  },

  /**
   * Envía las subcuentas configuradas a Caja POS vía SSE (CU-MOZO-09)
   */
  async dividirCuentaMesa(
    request: DividirCuentaRequestDTO
  ): Promise<ApiResponse<DividirCuentaResponseDTO>> {
    await new Promise((res) => setTimeout(res, 250));

    const mesaIndex = MESAS_SALON_MOCK.findIndex((m) => m.id === request.mesa_id);
    const totalBruto = request.subcuentas.reduce((acc, s) => acc + s.subtotal_bruto, 0);
    const totalNeto = request.subcuentas.reduce((acc, s) => acc + s.total_neto, 0);

    const subcuentasResumen: SubcuentaResumenDTO[] = request.subcuentas.map((s) => ({
      id: s.id,
      numero: s.numero_subcuenta,
      nombre_referencia: s.nombre_referencia,
      tipo_comprobante: s.tipo_comprobante,
      cliente: s.nombre_cliente,
      documento: s.documento_cliente,
      medio_pago: s.medio_pago,
      total: s.total_neto,
      total_items: s.items.length,
      estado: 'pendiente',
    }));

    SUBCUENTAS_POR_MESA_MOCK[request.mesa_id] = subcuentasResumen;

    if (mesaIndex >= 0) {
      MESAS_SALON_MOCK[mesaIndex] = {
        ...MESAS_SALON_MOCK[mesaIndex],
        estado: 'cuenta_pedida',
        total_consumo: totalNeto,
        es_cuenta_dividida: true,
        partes_subcuentas: request.subcuentas.length,
      };
    }

    return {
      exito: true,
      datos: {
        status: 'success',
        mesa_id: request.mesa_id,
        mesa_numero: mesaIndex >= 0 ? MESAS_SALON_MOCK[mesaIndex].numero : '04',
        estado_mesa: 'cuenta_pedida',
        partes: request.subcuentas.length,
        total_bruto: totalBruto,
        total_neto: totalNeto,
        mensaje: 'Subcuentas registradas con éxito. Comanda enviada a Caja vía SSE.',
        subcuentas_resumen: subcuentasResumen,
      },
    };
  },

  /**
   * Anula un ítem específico de la comanda con motivo y control de merma (CU-MOZO-06)
   */
  async anularItemComanda(
    mesaId: string,
    itemId: string,
    request: AnularItemRequestDTO
  ): Promise<ApiResponse<ItemAnuladoResponseDTO>> {
    await new Promise((res) => setTimeout(res, 200));

    let itemEncontrado: ItemDetalleComandaDTO | undefined;
    let nuevoSubtotal = 0;
    let mesaLiberada = false;

    if (mesaId === 'mesa-04') {
      itemEncontrado = DETALLE_MESA_04.items.find((i) => i.id === itemId);
      if (itemEncontrado) {
        // Remover el ítem de la comanda
        DETALLE_MESA_04.items = DETALLE_MESA_04.items.filter((i) => i.id !== itemId);
        nuevoSubtotal = DETALLE_MESA_04.items.reduce((acc, i) => acc + i.subtotal, 0);
        DETALLE_MESA_04.total_subtotal = nuevoSubtotal;

        // Actualizar en MESAS_SALON_MOCK
        const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === mesaId);
        if (mesaIdx >= 0) {
          MESAS_SALON_MOCK[mesaIdx].total_consumo = nuevoSubtotal;
          if (DETALLE_MESA_04.items.length === 0) {
            MESAS_SALON_MOCK[mesaIdx].estado = 'libre';
            MESAS_SALON_MOCK[mesaIdx].total_consumo = 0;
            DETALLE_MESA_04.estado = 'libre';
            mesaLiberada = true;
          }
        }
      }
    }

    const esMerma = itemEncontrado ? itemEncontrado.estado === 'entregado' : false;

    // Log simulado de auditoría inmutable (log_auditoria)
    console.info(
      `[AUDITORÍA CU-MOZO-06] Ítem anulado: ${itemEncontrado?.producto_nombre || itemId}. Motivo: ${request.motivo_categoria} - "${request.motivo_detalle}". Merma: ${esMerma}`
    );

    return {
      exito: true,
      datos: {
        item_id: itemId,
        pedido_id: 'ped-149',
        mesa_id: mesaId,
        mesa_numero: '04',
        producto_nombre: itemEncontrado?.producto_nombre || 'Plato Comanda',
        cantidad: itemEncontrado?.cantidad || 1,
        estado_anterior: itemEncontrado?.estado || 'en_preparacion',
        es_merma: esMerma,
        nuevo_subtotal: nuevoSubtotal,
        mesa_liberada: mesaLiberada,
        mensaje: esMerma
          ? `Ítem servido anulado y calificado como MERMA OPERATIVA (${request.motivo_categoria}). Sin reversión física de stock.`
          : `Ítem anulado exitosamente (${request.motivo_categoria}); alerta acústica/visual emitida a Cocina KDS.`,
        anulado_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Anula la comanda completa de una mesa y la libera a LIBRE (CU-MOZO-06)
   */
  async anularComandaCompleta(
    mesaId: string,
    request: AnularPedidoCompletoRequestDTO
  ): Promise<ApiResponse<PedidoAnuladoResponseDTO>> {
    await new Promise((res) => setTimeout(res, 250));

    let totalAnulado = 0;
    let itemsTotal = 0;

    if (mesaId === 'mesa-04') {
      totalAnulado = DETALLE_MESA_04.total_subtotal;
      itemsTotal = DETALLE_MESA_04.items.length;
      DETALLE_MESA_04.items = [];
      DETALLE_MESA_04.total_subtotal = 0;
      DETALLE_MESA_04.estado = 'libre';
    }

    const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === mesaId);
    if (mesaIdx >= 0) {
      if (mesaId !== 'mesa-04') {
        totalAnulado = MESAS_SALON_MOCK[mesaIdx].total_consumo || 85.0;
        itemsTotal = 3;
      }
      MESAS_SALON_MOCK[mesaIdx] = {
        ...MESAS_SALON_MOCK[mesaIdx],
        estado: 'libre',
        total_consumo: 0,
        platos_en_cocina: 0,
        platos_listos: 0,
        despacho_directo_pendiente: 0,
      };
    }

    // Limpiar subcuentas de la mesa
    delete SUBCUENTAS_POR_MESA_MOCK[mesaId];

    // Log simulado de auditoría inmutable
    console.info(
      `[AUDITORÍA CU-MOZO-06] Comanda cancelada en mesa ${mesaId}. Motivo: ${request.motivo_categoria} - "${request.motivo_detalle}". Confirmado desocupado: ${request.confirmar_vacio}`
    );

    return {
      exito: true,
      datos: {
        pedido_id: 'ped-149',
        mesa_id: mesaId,
        mesa_numero: mesaIdx >= 0 ? MESAS_SALON_MOCK[mesaIdx].numero : '04',
        mesa_estado: 'libre',
        total_anulado: totalAnulado,
        items_total: itemsTotal,
        mensaje: `Comanda de Mesa ${mesaIdx >= 0 ? MESAS_SALON_MOCK[mesaIdx].numero : '04'} anulada por completo (${request.motivo_categoria}). Mesa liberada y pedidos cancelados en KDS.`,
        anulado_at: new Date().toISOString(),
      },
    };
  },

  /**
   * ==========================================================================
   * MÉTODOS CU-MOZO-05: GESTIÓN DE RESERVAS Y RECEPCIÓN EN SALÓN
   * ==========================================================================
   */

  /**
   * Políticas de reserva configuradas en sede
   */
  async obtenerPoliticasReserva(): Promise<ApiResponse<PoliticasReservaDTO>> {
    return {
      exito: true,
      datos: POLITICAS_RESERVA_MOCK,
    };
  },

  /**
   * Obtiene la bandeja de reservas del turno/fecha activa
   */
  async obtenerReservas(
    fecha?: string,
    turno: 'almuerzo' | 'cena' = 'almuerzo'
  ): Promise<ApiResponse<ReservaCardDTO[]>> {
    await new Promise((res) => setTimeout(res, 180));
    let lista = [...RESERVAS_MOCK];
    if (fecha) {
      lista = lista.filter((r) => !fecha || r.fecha_hora.startsWith(fecha) || true);
    }
    if (turno === 'cena') {
      return {
        exito: true,
        datos: lista.filter((r) => parseInt(r.hora_texto.split(':')[0]) >= 19),
      };
    }
    return {
      exito: true,
      datos: lista.filter((r) => parseInt(r.hora_texto.split(':')[0]) < 19),
    };
  },

  /**
   * Consulta disponibilidad espacial de mesas para el Mini-Mapa 5x2
   */
  async obtenerMesasDisponiblesReserva(
    fecha: string,
    hora: string,
    comensales: number
  ): Promise<ApiResponse<MesasDisponiblesResponseDTO>> {
    await new Promise((res) => setTimeout(res, 120));

    // Mapea las 10 mesas del Salón Principal con disponibilidad en esa franja
    const mesasMapa: MesaDisponibleReservaDTO[] = MESAS_SALON_MOCK.map((m) => {
      let disponible = true;
      let motivoBloqueo: string | null = null;

      // Mesas 02, 03, 04, 06 tienen ocupación o reserva en horarios próximos
      if (['mesa-02', 'mesa-03', 'mesa-04', 'mesa-06'].includes(m.id)) {
        disponible = false;
        motivoBloqueo = 'Ocupada 13:30-15:00';
      } else if (m.capacidad < comensales && !m.permite_union) {
        disponible = false;
        motivoBloqueo = `Capacidad insuficiente (${m.capacidad}p)`;
      }

      return {
        mesa_id: m.id,
        numero: m.numero,
        capacidad: m.capacidad,
        disponible,
        permite_union: m.permite_union,
        motivo_bloqueo: motivoBloqueo,
      };
    });

    return {
      exito: true,
      datos: {
        fecha_hora_solicitada: `${fecha}T${hora}:00Z`,
        num_personas: comensales,
        mesas: mesasMapa,
      },
    };
  },

  /**
   * Registra nueva reserva con mesa(s) asignada(s)
   */
  async crearReserva(
    payload: CrearReservaRequestDTO
  ): Promise<ApiResponse<ReservaCardDTO>> {
    await new Promise((res) => setTimeout(res, 250));

    const numeros = payload.mesa_ids.map((id) => {
      const encontrada = MESAS_SALON_MOCK.find((m) => m.id === id);
      return encontrada ? encontrada.numero : id;
    });

    const mesasEtiqueta =
      numeros.length > 1
        ? `Mesa [ ${numeros.join(' ; ')} ]`
        : `Mesa ${numeros[0] || '08'}`;

    const horaTexto = payload.fecha_hora.includes('T')
      ? payload.fecha_hora.split('T')[1].substring(0, 5)
      : '14:00';

    const nuevaReserva: ReservaCardDTO = {
      id: `res-${Date.now()}`,
      cliente_nombre: payload.cliente_nombre,
      cliente_telefono: payload.cliente_telefono,
      fecha_hora: payload.fecha_hora,
      hora_texto: horaTexto,
      minutos_restantes: 45,
      num_personas: payload.num_personas,
      mesas_etiqueta: mesasEtiqueta,
      mesa_ids: payload.mesa_ids,
      estado: 'confirmada',
      notas: payload.notas || null,
      en_tolerancia: false,
      tolerancia_expiro: false,
      created_at: new Date().toISOString(),
    };

    RESERVAS_MOCK.unshift(nuevaReserva);

    return {
      exito: true,
      datos: nuevaReserva,
    };
  },

  /**
   * Sentar comensales, pasar reserva a atendida y abrir comanda
   */
  async sentarReserva(
    reservaId: string
  ): Promise<ApiResponse<SentarReservaResponseDTO>> {
    await new Promise((res) => setTimeout(res, 200));

    const reserva = RESERVAS_MOCK.find((r) => r.id === reservaId);
    if (reserva) {
      reserva.estado = 'atendida';
      reserva.pedido_id = `ped-${Date.now().toString().slice(-3)}`;
    }

    const mesaPrincipalId = reserva?.mesa_ids[0] || 'mesa-08';
    const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === mesaPrincipalId);
    if (mesaIdx >= 0) {
      MESAS_SALON_MOCK[mesaIdx] = {
        ...MESAS_SALON_MOCK[mesaIdx],
        estado: 'ocupada',
        pedido_id: reserva?.pedido_id || 'ped-155',
        comensales_sentados: reserva?.num_personas || 4,
        minutos_ocupada: 1,
        total_consumo: 0,
        mozo_id: MOZO_ACTUAL.id,
        mozo_nombre: MOZO_ACTUAL.nombre,
        es_mi_mesa: true,
      };
    }

    return {
      exito: true,
      datos: {
        reserva_id: reservaId,
        mesa_id: mesaPrincipalId,
        pedido_id: reserva?.pedido_id || 'ped-155',
        mensaje: `Comensales de ${reserva?.cliente_nombre || 'la reserva'} recibidos exitosamente. Mesa ${mesaIdx >= 0 ? MESAS_SALON_MOCK[mesaIdx].numero : '08'} ocupada y comanda abierta.`,
      },
    };
  },

  /**
   * Registrar inasistencia (No-Show) y liberar mesa(s) inmediatamente
   */
  async registrarNoShow(
    reservaId: string,
    request?: RegistrarNoShowRequestDTO | string
  ): Promise<ApiResponse<{ reservaId: string; mesaLiberada: boolean; mensaje: string }>> {
    await new Promise((res) => setTimeout(res, 200));

    const motivo = typeof request === 'string' ? request : request?.motivo_inasistencia;
    const reserva = RESERVAS_MOCK.find((r) => r.id === reservaId);
    if (reserva) {
      reserva.estado = 'no_show';
      reserva.notas = `${reserva.notas ? reserva.notas + ' | ' : ''}Inasistencia registrada: ${motivo || 'Cliente no se presentó tras ventana de cortesía'}`;

      reserva.mesa_ids.forEach((id) => {
        const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === id);
        if (mesaIdx >= 0) {
          MESAS_SALON_MOCK[mesaIdx] = {
            ...MESAS_SALON_MOCK[mesaIdx],
            estado: 'libre',
            reserva_cliente: null,
            reserva_hora: null,
            minutos_para_reserva: null,
          };
        }
      });
    }

    return {
      exito: true,
      datos: {
        reservaId,
        mesaLiberada: true,
        mensaje: `Inasistencia registrada para ${reserva?.cliente_nombre || 'la reserva'}. Mesa ${reserva?.mesas_etiqueta || '08'} liberada a verde LIBRE.`,
      },
    };
  },

  /**
   * Cancelar reserva anticipada con motivo obligatorio
   */
  async cancelarReserva(
    reservaId: string,
    request: CancelarReservaRequestDTO | string
  ): Promise<ApiResponse<{ reservaId: string; mensaje: string }>> {
    await new Promise((res) => setTimeout(res, 180));

    const motivo = typeof request === 'string' ? request : request.motivo_cancelacion;
    const reserva = RESERVAS_MOCK.find((r) => r.id === reservaId);
    if (reserva) {
      reserva.estado = 'cancelada';
      reserva.notas = `${reserva.notas ? reserva.notas + ' | ' : ''}Cancelada: ${motivo}`;

      reserva.mesa_ids.forEach((id) => {
        const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === id);
        if (mesaIdx >= 0 && MESAS_SALON_MOCK[mesaIdx].estado === 'bloqueada') {
          MESAS_SALON_MOCK[mesaIdx] = {
            ...MESAS_SALON_MOCK[mesaIdx],
            estado: 'libre',
            reserva_cliente: null,
            reserva_hora: null,
            minutos_para_reserva: null,
          };
        }
      });
    }

    return {
      exito: true,
      datos: {
        reservaId,
        mensaje: `Reserva de ${reserva?.cliente_nombre || 'comensal'} cancelada correctamente.`,
      },
    };
  },

  /**
   * Reasignar mesa de una reserva (evitar sobreasignación)
   */
  async reasignarMesaReserva(
    reservaId: string,
    request: ReasignarMesaReservaRequestDTO | string,
    motivoOpcional?: string
  ): Promise<ApiResponse<ReservaCardDTO>> {
    await new Promise((res) => setTimeout(res, 200));

    const nuevaMesaId = typeof request === 'string' ? request : request.nueva_mesa_id;
    const motivo = typeof request === 'string' ? motivoOpcional : request.motivo || motivoOpcional;

    const reserva = RESERVAS_MOCK.find((r) => r.id === reservaId);
    if (!reserva) {
      throw new Error('Reserva no encontrada');
    }

    const nuevaMesa = MESAS_SALON_MOCK.find((m) => m.id === nuevaMesaId);
    const etiqueta = nuevaMesa ? `Mesa ${nuevaMesa.numero}` : 'Mesa 05';

    // Desvincular mesa anterior
    reserva.mesa_ids.forEach((id) => {
      const oldIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === id);
      if (oldIdx >= 0 && MESAS_SALON_MOCK[oldIdx].estado === 'bloqueada') {
        MESAS_SALON_MOCK[oldIdx] = {
          ...MESAS_SALON_MOCK[oldIdx],
          estado: 'libre',
          reserva_cliente: null,
          reserva_hora: null,
          minutos_para_reserva: null,
        };
      }
    });

    // Asignar nueva mesa
    reserva.mesa_ids = [nuevaMesaId];
    reserva.mesas_etiqueta = etiqueta;
    if (motivo) {
      reserva.notas = `${reserva.notas ? reserva.notas + ' | ' : ''}Reasignación: ${motivo}`;
    }

    const newIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === nuevaMesaId);
    if (newIdx >= 0) {
      MESAS_SALON_MOCK[newIdx] = {
        ...MESAS_SALON_MOCK[newIdx],
        estado: 'bloqueada',
        reserva_cliente: reserva.cliente_nombre,
        reserva_hora: reserva.hora_texto,
        minutos_para_reserva: 20,
      };
    }

    return {
      exito: true,
      datos: reserva,
    };
  },

  /**
   * ============================================================================
   * CU-MOZO-07: ATENDER INCIDENCIA DE PLATO NO DISPONIBLE Y RESOLVER EN MESA
   * ============================================================================
   */

  /**
   * Obtener catálogo de sustitución universal con 6 sugerencias calculadas
   */
  async obtenerCatalogoSustitucion(
    _mesaId: string,
    itemId: string,
    categoriaId?: string,
    query?: string
  ): Promise<ApiResponse<CatalogoSustitucionResponseDTO>> {
    await new Promise((res) => setTimeout(res, 180));

    // Identificar el ítem observado en la mesa
    let itemObservado = DETALLE_MESA_04.items.find((it) => it.id === itemId);
    if (!itemObservado) {
      itemObservado = DETALLE_MESA_04.items.find((it) => it.estado === 'no_disponible') || DETALLE_MESA_04.items[0];
    }

    const platoOriginalNombre = itemObservado?.producto_nombre || 'Lomo Saltado Criollo';
    const precioOriginal = itemObservado?.precio_unitario || 38.0;
    const categoriaNombre = 'Criollos & Brasas';

    // Lista de productos disponibles para sustitución
    const productosDisponibles = PRODUCTOS_CARTA_MOCK.filter(
      (p) => p.disponibilidad === 'disponible' && p.nombre !== platoOriginalNombre
    );

    // Mapear a DTO con diferencia de precio calculada
    const mappedProductos: PlatoSustitutoSugeridoDTO[] = productosDisponibles.map((p) => {
      const dif = Math.round((p.precio - precioOriginal) * 100) / 100;
      const esMisma =
        p.categoria_id === 'cat-criollos' ||
        p.categoria_id === 'cat-carnes' ||
        p.categoria_nombre.toLowerCase().includes('criollo');
      return {
        producto_id: p.id,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        categoria_nombre: p.categoria_nombre,
        precio: p.precio,
        diferencia: dif,
        es_misma_categoria: esMisma,
        disponible: true,
      };
    });

    // Calcular las 6 sugerencias TOP por cercanía matemática de precio ABS(precio - precioOriginal)
    // priorizando misma categoría o afinidad criollo/carnes
    const sugerenciasTop: PlatoSustitutoSugeridoDTO[] = [...mappedProductos]
      .sort((a, b) => {
        const absA = Math.abs(a.precio - precioOriginal);
        const absB = Math.abs(b.precio - precioOriginal);
        if (absA !== absB) return absA - absB;
        if (a.es_misma_categoria && !b.es_misma_categoria) return -1;
        if (!a.es_misma_categoria && b.es_misma_categoria) return 1;
        return a.nombre.localeCompare(b.nombre);
      })
      .slice(0, 6);

    // Extraer chips de categorías disponibles
    const categoriasMap = new Map<string, { id: string; nombre: string; count: number }>();
    PRODUCTOS_CARTA_MOCK.forEach((p) => {
      if (p.disponibilidad === 'disponible') {
        const existing = categoriasMap.get(p.categoria_id);
        if (existing) {
          existing.count += 1;
        } else {
          categoriasMap.set(p.categoria_id, {
            id: p.categoria_id,
            nombre: p.categoria_nombre,
            count: 1,
          });
        }
      }
    });

    const categoriasChips: CategoriaChipDTO[] = Array.from(categoriasMap.values()).map((c) => ({
      categoria_id: c.id,
      nombre: c.nombre,
      total_platos: c.count,
    }));

    // Filtrado por categoría o búsqueda
    let productosFiltrados = [...mappedProductos];
    if (categoriaId && categoriaId !== 'todas') {
      productosFiltrados = productosFiltrados.filter((p) => p.categoria_id === categoriaId);
    }
    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      productosFiltrados = productosFiltrados.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.categoria_nombre.toLowerCase().includes(q)
      );
    }

    return {
      exito: true,
      datos: {
        plato_original_id: itemObservado?.producto_id || 'prod-criollo-01',
        plato_original_item_id: itemObservado?.id || itemId,
        plato_original: platoOriginalNombre,
        precio_original: precioOriginal,
        categoria_nombre: categoriaNombre,
        sugerencias_top: sugerenciasTop,
        categorias: categoriasChips,
        productos: productosFiltrados,
      },
    };
  },

  /**
   * Ejecutar sustitución de plato en comanda y notificar a cocina
   */
  async sustituirPlato(
    mesaId: string,
    itemId: string,
    payload: SustituirPlatoRequestDTO
  ): Promise<ApiResponse<SustituirPlatoResponseDTO>> {
    await new Promise((res) => setTimeout(res, 220));

    const nuevoProducto = PRODUCTOS_CARTA_MOCK.find((p) => p.id === payload.nuevo_producto_id);
    if (!nuevoProducto) {
      throw new Error('El plato seleccionado para sustitución no fue encontrado en la carta.');
    }

    const itemIdx = DETALLE_MESA_04.items.findIndex(
      (it) => it.id === itemId || it.id === payload.item_anulado_id
    );

    let precioOriginal = 38.0;
    let nuevoItemId = `it-sust-${Date.now().toString().slice(-4)}`;

    if (itemIdx >= 0) {
      const original = DETALLE_MESA_04.items[itemIdx];
      precioOriginal = original.precio_unitario;

      // Reemplazar ítem observado con el nuevo plato
      DETALLE_MESA_04.items[itemIdx] = {
        ...original,
        producto_id: nuevoProducto.id,
        producto_nombre: nuevoProducto.nombre,
        precio_unitario: nuevoProducto.precio,
        subtotal: nuevoProducto.precio * (payload.cantidad || 1),
        estado: 'en_preparacion',
        nota_cocina: payload.notas_cocina
          ? `${payload.notas_cocina} (Sustitución por quiebre de stock)`
          : 'Sustitución por quiebre de stock',
      };
      nuevoItemId = DETALLE_MESA_04.items[itemIdx].id;
    }

    // Recalcular subtotal de la mesa
    const nuevoSubtotal = DETALLE_MESA_04.items.reduce((acc, curr) => acc + curr.subtotal, 0);
    DETALLE_MESA_04.total_subtotal = Math.round(nuevoSubtotal * 100) / 100;

    // Actualizar MesaCardDTO en salón y limpiar quiebre
    const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === mesaId);
    if (mesaIdx >= 0) {
      MESAS_SALON_MOCK[mesaIdx] = {
        ...MESAS_SALON_MOCK[mesaIdx],
        tiene_quiebre_cocina: false,
        quiebre_producto_nombre: undefined,
        quiebre_item_id: undefined,
        total_consumo: DETALLE_MESA_04.total_subtotal,
      };
    }

    const diferenciaMonto = Math.round((nuevoProducto.precio - precioOriginal) * 100) / 100;

    return {
      exito: true,
      datos: {
        pedido_id: DETALLE_MESA_04.comanda_id || 'ped-149',
        mesa_id: mesaId,
        mesa_numero: '04',
        nuevo_item_id: nuevoItemId,
        nuevo_producto: nuevoProducto.nombre,
        diferencia_monto: diferenciaMonto,
        nuevo_subtotal: DETALLE_MESA_04.total_subtotal,
        mensaje: `Sustitución completada exitosamente por "${nuevoProducto.nombre}". Comanda actualizada y enviada con prioridad a Cocina.`,
        created_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Anular plato observado por quiebre de stock en cocina (sin merma ni costo)
   */
  async anularPorQuiebreCocina(
    mesaId: string,
    itemId: string,
    payload: AnularPorQuiebreRequestDTO
  ): Promise<ApiResponse<AnularPorQuiebreResponseDTO>> {
    await new Promise((res) => setTimeout(res, 200));

    const itemIdx = DETALLE_MESA_04.items.findIndex((it) => it.id === itemId);
    let montoAnulado = 38.0;

    if (itemIdx >= 0) {
      const item = DETALLE_MESA_04.items[itemIdx];
      if (item.cantidad > 1) {
        // Reducir en 1 unidad
        item.cantidad -= 1;
        item.subtotal = item.cantidad * item.precio_unitario;
        montoAnulado = item.precio_unitario;
        item.estado = 'en_preparacion';
      } else {
        // Remover el ítem observado
        montoAnulado = item.subtotal;
        DETALLE_MESA_04.items.splice(itemIdx, 1);
      }
    }

    // Recalcular subtotal de la mesa
    const nuevoSubtotal = DETALLE_MESA_04.items.reduce((acc, curr) => acc + curr.subtotal, 0);
    DETALLE_MESA_04.total_subtotal = Math.round(nuevoSubtotal * 100) / 100;

    // Actualizar MesaCardDTO y limpiar quiebre
    const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === mesaId);
    if (mesaIdx >= 0) {
      MESAS_SALON_MOCK[mesaIdx] = {
        ...MESAS_SALON_MOCK[mesaIdx],
        tiene_quiebre_cocina: false,
        quiebre_producto_nombre: undefined,
        quiebre_item_id: undefined,
        total_consumo: DETALLE_MESA_04.total_subtotal,
      };
    }

    return {
      exito: true,
      datos: {
        pedido_id: DETALLE_MESA_04.comanda_id || 'ped-149',
        mesa_id: mesaId,
        mesa_numero: '04',
        monto_anulado: montoAnulado,
        nuevo_subtotal: DETALLE_MESA_04.total_subtotal,
        mensaje: `Plato anulado sin costo para el cliente (S/ ${montoAnulado.toFixed(2)} descontados). Auditoría registrada: motivo '${payload.motivo_detalle}', es_merma = false. Notificación enviada a Administración.`,
        anulado_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Simular evento reactivo SSE de quiebre de stock en Cocina KDS para Mesa 04
   */
  async simularQuiebreCocinaMesa04(
    activo: boolean
  ): Promise<ApiResponse<{ activo: boolean; mesa: MesaCardDTO }>> {
    await new Promise((res) => setTimeout(res, 120));

    const mesaIdx = MESAS_SALON_MOCK.findIndex((m) => m.id === 'mesa-04');
    if (mesaIdx >= 0) {
      MESAS_SALON_MOCK[mesaIdx] = {
        ...MESAS_SALON_MOCK[mesaIdx],
        tiene_quiebre_cocina: activo,
        quiebre_producto_nombre: activo ? 'Lomo Saltado Criollo' : undefined,
        quiebre_item_id: activo ? 'it-01' : undefined,
      };
    }

    // Actualizar estado en DETALLE_MESA_04
    const itemIdx = DETALLE_MESA_04.items.findIndex((it) => it.id === 'it-01');
    if (itemIdx >= 0) {
      DETALLE_MESA_04.items[itemIdx] = {
        ...DETALLE_MESA_04.items[itemIdx],
        estado: activo ? 'no_disponible' : 'listo',
      };
    }

    return {
      exito: true,
      datos: {
        activo,
        mesa: MESAS_SALON_MOCK[mesaIdx],
      },
    };
  },
};

const POLITICAS_RESERVA_MOCK: PoliticasReservaDTO = {
  duracion_reserva_min: 90,
  buffer_reserva_min: 15,
  minutos_bloqueo_previo: 30,
  tolerancia_no_show_min: 15,
  permite_reservas_online: false,
  max_dias_anticipacion: 30,
};

let RESERVAS_MOCK: ReservaCardDTO[] = [
  {
    id: 'res-001',
    cliente_nombre: 'Dr. Alva',
    cliente_telefono: '+51 912 345 678',
    fecha_hora: '2026-10-09T13:00:00Z',
    hora_texto: '13:00',
    minutos_restantes: -60,
    num_personas: 2,
    mesas_etiqueta: 'Mesa 04',
    mesa_ids: ['mesa-04'],
    estado: 'atendida',
    notas: 'Cliente habitual, prefiere mesa junto a ventana.',
    en_tolerancia: false,
    tolerancia_expiro: true,
    pedido_id: 'ped-149',
    created_at: '2026-10-08T18:00:00Z',
  },
  {
    id: 'res-002',
    cliente_nombre: 'Sra. Mendoza',
    cliente_telefono: '+51 945 678 123',
    fecha_hora: '2026-10-09T13:15:00Z',
    hora_texto: '13:15',
    minutos_restantes: -45,
    num_personas: 4,
    mesas_etiqueta: 'Mesa 06',
    mesa_ids: ['mesa-06'],
    estado: 'atendida',
    notas: 'Almuerzo familiar.',
    en_tolerancia: false,
    tolerancia_expiro: true,
    pedido_id: 'ped-150',
    created_at: '2026-10-08T19:20:00Z',
  },
  {
    id: 'res-003',
    cliente_nombre: 'Carlos R. (Grupo)',
    cliente_telefono: '+51 988 112 233',
    fecha_hora: '2026-10-09T13:30:00Z',
    hora_texto: '13:30',
    minutos_restantes: -30,
    num_personas: 8,
    mesas_etiqueta: 'Mesa [ 02 ; 03 ]',
    mesa_ids: ['mesa-02', 'mesa-03'],
    estado: 'atendida',
    notas: 'Reserva grupal ejecutiva.',
    en_tolerancia: false,
    tolerancia_expiro: true,
    pedido_id: 'ped-148',
    created_at: '2026-10-09T09:10:00Z',
  },
  {
    id: 'res-004',
    cliente_nombre: 'Ing. Paredes',
    cliente_telefono: '+51 977 443 322',
    fecha_hora: '2026-10-09T13:45:00Z',
    hora_texto: '13:45',
    minutos_restantes: -15,
    num_personas: 2,
    mesas_etiqueta: 'Mesa 01',
    mesa_ids: ['mesa-01'],
    estado: 'no_show',
    notas: 'Cliente no se presentó tras 15 minutos de cortesía. Mesa liberada.',
    en_tolerancia: false,
    tolerancia_expiro: true,
    created_at: '2026-10-09T10:00:00Z',
  },
  {
    id: 'res-005',
    cliente_nombre: 'Fam. Gómez',
    cliente_telefono: '+51 987 654 321',
    fecha_hora: '2026-10-09T14:00:00Z',
    hora_texto: '14:00',
    minutos_restantes: 20,
    num_personas: 4,
    mesas_etiqueta: 'Mesa 08',
    mesa_ids: ['mesa-08'],
    estado: 'bloqueada',
    notas: 'Viene con niño pequeño, requiere silla alta.',
    en_tolerancia: true,
    tolerancia_expiro: false,
    created_at: '2026-10-09T11:15:00Z',
  },
  {
    id: 'res-006',
    cliente_nombre: 'Lucía Benítez',
    cliente_telefono: '+51 933 221 144',
    fecha_hora: '2026-10-09T14:15:00Z',
    hora_texto: '14:15',
    minutos_restantes: 35,
    num_personas: 3,
    mesas_etiqueta: 'Mesa 05',
    mesa_ids: ['mesa-05'],
    estado: 'confirmada',
    notas: 'Mesa tranquila para reunión de trabajo.',
    en_tolerancia: false,
    tolerancia_expiro: false,
    created_at: '2026-10-09T11:45:00Z',
  },
  {
    id: 'res-007',
    cliente_nombre: 'Roberto Chang',
    cliente_telefono: '+51 966 554 433',
    fecha_hora: '2026-10-09T14:30:00Z',
    hora_texto: '14:30',
    minutos_restantes: 50,
    num_personas: 6,
    mesas_etiqueta: 'Mesa [ 09 ; 10 ]',
    mesa_ids: ['mesa-09', 'mesa-10'],
    estado: 'confirmada',
    notas: 'Celebración de cumpleaños corporativo.',
    en_tolerancia: false,
    tolerancia_expiro: false,
    created_at: '2026-10-09T12:00:00Z',
  },
  {
    id: 'res-008',
    cliente_nombre: 'Patricia Vega',
    cliente_telefono: '+51 955 778 899',
    fecha_hora: '2026-10-09T15:00:00Z',
    hora_texto: '15:00',
    minutos_restantes: 80,
    num_personas: 2,
    mesas_etiqueta: 'Mesa 07',
    mesa_ids: ['mesa-07'],
    estado: 'confirmada',
    notas: 'Aniversario de bodas, mesa discreta.',
    en_tolerancia: false,
    tolerancia_expiro: false,
    created_at: '2026-10-09T12:30:00Z',
  },
];

const PROMOCIONES_SEDE_MOCK: PromocionSedeDTO[] = [
  {
    id: 'promo-almuerzo-15',
    nombre: 'Descuento Almuerzo Ejecutivo (15%)',
    porcentaje_descuento: 15,
    descripcion: 'Válido de 12:00 a 16:00 en platos a la carta seleccionados.',
  },
  {
    id: 'promo-happy-hour-10',
    nombre: 'Promoción Familiar (10%)',
    porcentaje_descuento: 10,
    descripcion: '10% de descuento en mesas de 4 a más comensales.',
  },
];

/**
 * Catálogo Gastronómico Mock para CU-MOZO-02
 */
let PRODUCTOS_CARTA_MOCK: ProductoCatalogoMozoDTO[] = [
  {
    id: 'prod-criollo-01',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: 'Lomo Saltado Criollo',
    descripcion: 'Trozos finos de lomo salteados al wok con cebolla, tomate, ají amarillo, servido con papas fritas y arroz.',
    precio: 38.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-criollo-02',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: '1/4 Pollo a la Brasa Tradicional',
    descripcion: 'Marinado con hierbas andinas, papas crujientes y ensalada fresca de la casa.',
    precio: 26.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-criollo-03',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: 'Ají de Gallina Cremoso',
    descripcion: 'Pechuga deshilachada en crema de ají amarillo, nueces, huevo de corral y arroz con choclo.',
    precio: 32.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-criollo-04',
    categoria_id: 'cat-criollos',
    categoria_nombre: 'Criollos & Brasas',
    nombre: 'Anticuchos de Corazón al Carbón',
    descripcion: 'Dos palos de corazón de res tierno marinados en ají panca, acompañados de papas doradas y choclo.',
    precio: 28.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-carne-01',
    categoria_id: 'cat-carnes',
    categoria_nombre: 'Carnes & Parrillas',
    nombre: 'Asado de Tira con Puré',
    descripcion: 'Tira de asado braseada lentamente en reducción de vino tinto sobre suave puré de papa amarilla.',
    precio: 38.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-carne-02',
    categoria_id: 'cat-carnes',
    categoria_nombre: 'Carnes & Parrillas',
    nombre: 'Seco de Res c/ Frejoles',
    descripcion: 'Guiso tradicional de asado de tira macerado en chicha de jora y culantro, con frejoles batidos y arroz.',
    precio: 38.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-carne-03',
    categoria_id: 'cat-carnes',
    categoria_nombre: 'Carnes & Parrillas',
    nombre: 'Bife Angosto Criollo',
    descripcion: 'Corte magro a la parrilla servido con papas rústicas doradas, ensalada parrillera y chimichurri.',
    precio: 42.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-pasta-01',
    categoria_id: 'cat-pastas',
    categoria_nombre: 'Pastas & Salsas',
    nombre: 'Fettuccine a la Huancaína',
    descripcion: 'Pasta al dente envuelta en cremosa salsa huancaína artesanal servida con lomo al jugo.',
    precio: 36.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-01',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Ceviche Clásico de Corvina',
    descripcion: 'Cubos de pesca fresca del día en leche de tigre al momento, canchita chulpi, camote glaseado y choclo.',
    precio: 36.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-02',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Tiradito en Crema de Ají Amarillo',
    descripcion: 'Finas láminas de pescado blanco bañadas en salsa tibia de ají amarillo, choclo desgranado y camote.',
    precio: 38.0,
    disponibilidad: 'agotado',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-03',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Arroz con Mariscos al Wok',
    descripcion: 'Arroz a la criolla flambeado al pisco con mixtura de calamares, langostinos, conchas y salsa madre.',
    precio: 42.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-mar-04',
    categoria_id: 'cat-mariscos',
    categoria_nombre: 'Pescados & Mariscos',
    nombre: 'Ceviche Mixto Tradicional',
    descripcion: 'Trozos de pescado fresco, calamares crocantes y langostinos en leche de tigre al rocoto.',
    precio: 42.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-ent-01',
    categoria_id: 'cat-entradas',
    categoria_nombre: 'Entradas Criollas',
    nombre: 'Causa Limeña de Pollo',
    descripcion: 'Masa de papa amarilla prensada con pasta de ají y limón, relleno cremoso de pollo, palta fuerte y mayonesa.',
    precio: 24.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-ent-02',
    categoria_id: 'cat-entradas',
    categoria_nombre: 'Entradas Criollas',
    nombre: 'Papa a la Huancaína Tradicional',
    descripcion: 'Rodajas de papa huayro bañadas en cremosa salsa huancaína con queso fresco, huevo duro y aceituna.',
    precio: 20.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-ent-03',
    categoria_id: 'cat-entradas',
    categoria_nombre: 'Entradas Criollas',
    nombre: 'Tequeños Criollos con Queso Andino',
    descripcion: 'Seis unidades crocantes rellenas de queso andino fundido, acompañadas de guacamole casero.',
    precio: 22.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: true,
  },
  {
    id: 'prod-beb-01',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Inca Kola 500ml Helada en Botella',
    descripcion: 'Gaseosa nacional clásica servida con o sin hielo y rodaja de limón opcional.',
    precio: 7.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-beb-02',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Coca Cola 500ml Helada en Botella',
    descripcion: 'Gaseosa servida inmediatamente desde la vitrina refrigerada.',
    precio: 7.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-beb-03',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Jarra de Chicha Morada Casera 1L',
    descripcion: 'Elaborada artesanalmente con maíz morado, piña golden, manzana, canela y clavo de olor.',
    precio: 18.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-beb-04',
    categoria_id: 'cat-bebidas',
    categoria_nombre: 'Bebidas & Refrescos',
    nombre: 'Cusqueña Dorada 330ml Botella Helada',
    descripcion: 'Cerveza premium lager helada servida con copa fría.',
    precio: 11.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-pos-01',
    categoria_id: 'cat-postres',
    categoria_nombre: 'Postres de Vitrina',
    nombre: 'Gelatina de Fresa de Vitrina',
    descripcion: 'Postre frío clásico de exhibición inmediata, servido en copa con toque de leche condensada.',
    precio: 6.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-pos-02',
    categoria_id: 'cat-postres',
    categoria_nombre: 'Postres de Vitrina',
    nombre: 'Porción Crema Volteada de Vitrina',
    descripcion: 'Flan tradicional acaramelado con textura sedosa, listo en vitrina refrigerada.',
    precio: 12.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
  {
    id: 'prod-pos-03',
    categoria_id: 'cat-postres',
    categoria_nombre: 'Postres de Vitrina',
    nombre: 'Suspiro a la Limeña Clásico',
    descripcion: 'Manjar blanco de yemas perfumado al oporto con merengue italiano espolvoreado con canela.',
    precio: 14.0,
    disponibilidad: 'disponible',
    activo: true,
    requiere_preparacion: false,
  },
];

